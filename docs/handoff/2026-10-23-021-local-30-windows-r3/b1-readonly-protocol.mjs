// Acceptance fixture only. Full native tool catalogue in, exactly start/query/finish out. No real model.
import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {randomUUID} from 'node:crypto'
import {mkdirSync,writeFileSync,appendFileSync} from 'node:fs'
import {join,resolve} from 'node:path'
import {parseArgs} from 'node:util'
const {values}=parseArgs({options:{evidence:{type:'string'}}})
assert.ok(values.evidence,'--evidence requires a new private directory')
const root=resolve(values.evidence);mkdirSync(root,{recursive:false,mode:0o700})
const record=data=>appendFileSync(join(root,'events.jsonl'),JSON.stringify({at:new Date().toISOString(),...data})+'\n',{mode:0o600})
function objects(text) {
 const values=[]
 // Match complete JSON objects including nested braces, strings and escapes, starting at every opening brace.
 for(let start=0;start<text.length;start++) {
  if(text[start]!=='{')continue
  let depth=0,quoted=false,escape=false
  for(let i=start;i<text.length;i++) {
   const c=text[i]
   if(quoted){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quoted=false;continue}
   if(c==='"')quoted=true
   else if(c==='{')depth++
   else if(c==='}'&&--depth===0){try{values.push(JSON.parse(text.slice(start,i+1)))}catch{};break}
  }
 }
 return values
}
const text=value=>typeof value==='string'?value:Array.isArray(value)?value.map(text).join('\n'):value&&typeof value==='object'?(value.text??(value.content?text(value.content):JSON.stringify(value))):String(value)
const server=createServer(async(req,res)=>{
 try {
  assert.equal(req.method,'POST');assert.equal(req.url,'/v1/chat/completions')
  const chunks=[];let size=0
  for await(const chunk of req){size+=chunk.length;assert.ok(size<8*1024*1024);chunks.push(chunk)}
  const body=JSON.parse(Buffer.concat(chunks)),tools=new Set((body.tools??[]).map(t=>t.function.name))
  assert.equal(body.model,'b1-native-protocol')
  const all=body.messages,marker=all.filter(m=>m.role==='user').flatMap(m=>text(m.content).match(/R40_B1:[a-z0-9.-]+:[a-z0-9-]+/g)??[]).at(-1)
  const phase=marker&&tools.size?marker:'auxiliary'
  const startAt=all.findLastIndex(m=>m.role==='user'&&text(m.content).includes(marker)),messages=all.slice(Math.max(0,startAt))
  const calls=new Map(messages.flatMap(m=>(m.tool_calls??[]).map(c=>[c.id,c.function.name])))
  const completed=new Map(messages.filter(m=>m.role==='tool').map(m=>[calls.get(m.tool_call_id),text(m.content)]))
  const start='mcp__openbkn__bkn_start_interaction',query='mcp__openbkn__query_object_instance',finish='mcp__openbkn__bkn_finish_interaction'
  let next,answer='Bounded local B1 protocol fixture; not a real-model G6 answer.',evidence
  if(phase!=='auxiliary') {
   assert.ok(![...completed.values()].some(v=>/Public\.Unauthorized|token is invalid/.test(v)),'Native authentication failed')
   const identity=objects(completed.get(start)??'').find(o=>o.conversation_id&&o.interaction_id)
   if(!completed.has(start))next=[start,{conversation_mode:'new',question:phase,agent_name:'bkn-agent-dsh-business-context'}]
   else {
    assert.ok(identity,'Missing native Interaction identity')
    if(!completed.has(query))next=[query,{kn_id:'supply_ontology_hand',ot_id:'supply_ontology_hand_salesorder',condition:{field:'product_code',operation:'==',value:'382-000005'},limit:1,response_format:'json',bkn_context:{conversation_id:identity.conversation_id,interaction_id:identity.interaction_id}}]
    else if(!completed.has(finish)) {
     const counts=objects(completed.get(query)).filter(o=>'total_count' in o).map(o=>o.total_count)
     assert.ok(counts.includes(40),'Actual ordinary query differs from the preserved baseline')
     evidence={interactionId:identity.interaction_id,conversationId:identity.conversation_id,totalCount:40}
     next=[finish,{interaction_id:identity.interaction_id,outcome:'completed',answer}]
    }
   }
   if(next)assert.ok(tools.has(next[0]),'Native managed tool is missing')
  }
  record({phase,emittedTool:next?.[0]??null,completedTools:[...completed.keys()],...(evidence?{queryEvidence:evidence}:{})})
  const id='chatcmpl-b1-'+randomUUID(),tool=next?{id:'call-b1-'+randomUUID(),type:'function',function:{name:next[0],arguments:JSON.stringify(next[1])}}:undefined
  const message=tool?{role:'assistant',content:null,tool_calls:[tool]}:{role:'assistant',content:answer},reason=tool?'tool_calls':'stop'
  if(body.stream) {
   res.writeHead(200,{'content-type':'text/event-stream','cache-control':'no-store'})
   for(const [delta,finish_reason] of [[tool?{role:'assistant',tool_calls:[{index:0,...tool}]}:message,null],[{},reason]])res.write('data: '+JSON.stringify({id,object:'chat.completion.chunk',created:Math.floor(Date.now()/1000),model:body.model,choices:[{index:0,delta,finish_reason}]})+'\n\n')
   res.end('data: [DONE]\n\n')
  } else {res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({id,object:'chat.completion',model:body.model,choices:[{index:0,message,finish_reason:reason}],usage:{prompt_tokens:1,completion_tokens:1,total_tokens:2}}))}
 }catch(error){record({fixtureFailure:error.message});res.writeHead(500);res.end('Bounded protocol fixture failed; retain local evidence')}
})
server.listen(0,'127.0.0.1',()=>{
 const port=server.address().port,info={pid:process.pid,port,baseURL:`http://127.0.0.1:${port}/v1`,model:'b1-native-protocol',realModel:false,sandboxAllowed:false}
 writeFileSync(join(root,'server.json'),JSON.stringify(info,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify(info))
})
