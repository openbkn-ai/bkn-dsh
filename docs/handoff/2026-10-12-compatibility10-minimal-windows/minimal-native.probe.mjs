// Manual boundary probe: real CLI + MCP + native tools, no model or complete UI Host.
import assert from 'node:assert/strict'
import { appendFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve, dirname } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
const {values} = parseArgs({options:{plugin:{type:'string'}, runtime:{type:'string'}, cli:{type:'string'}, live:{type:'string'}, kn:{type:'string'}, relogin:{type:'boolean'}, 'address-cycle':{type:'boolean'}}})
for (const k of ['plugin','runtime','cli','live','kn']) assert.ok(values[k], '--'+k+' is required')
const req=createRequire(resolve(values.runtime,'package.json'))
const mod=async name=>import(pathToFileURL(req.resolve('@deepseek-ai/'+name)).href)
const [{Context,Service},tool,prompt,subprocess,credentials]=await Promise.all(['cordis','dsh-tools','dsh-system-prompt','dsh-subprocess-local','dsh-credentials-local'].map(mod))
const {createScope}=await import(pathToFileURL(req.resolve('@deepseek-ai/dsh-scope',{paths:[dirname(req.resolve('@deepseek-ai/dsh-tools/package.json'))]})).href)
const production=await import(pathToFileURL(resolve(values.plugin,'lib/business.js')).href)
const diagnostics=await import(pathToFileURL(resolve(values.plugin,'lib/diagnostics.js')).href)
const ctx=new Context(),fibers=[]
const config=production.Config({baseUrl:values.live,cliPath:values.cli,toolCallTimeoutMs:20000})
const signal=()=>AbortSignal.timeout(140000)
const record=(phase, facts)=>console.log(JSON.stringify({at:new Date().toISOString(),phase,evidence:'CLI/MCP/native-tool boundary probe; not full UI Host',...facts}))
// Constructor-only agent/storage responsibilities are outside this probe;
// these methods exercise the production auth/MCP boundaries, without replacing either.
const service=Object.create(production.OpenBknBusinessContextService.prototype)
Object.assign(service,{ctx,config,lifetime:new AbortController()})
let sequence=0
try {
 for (const [plugin,options] of [[tool.default],[prompt.default],[subprocess.default],[credentials.default,{dshHome:process.env.DSH_HOME,watch:false}]]) fibers.push(await ctx.plugin(plugin,options))
 fibers.push(await ctx.plugin(class ProbeRegistry extends Service { constructor(ctx){super(ctx,'openbknWorkspaceBindingRegistry')} get(){return undefined} }))
 record('before-status',{kind:(await service.remoteStatus(signal())).kind})
 if (values.relogin) {record('login-started',{}); await service.remoteBeginLogin(signal()); record('login-completed',{})}
 else await service.remoteListNetworks(signal())
 const baselineToken=service.synchronizedToken
 async function callPair(phase) {
  const agent={id:'b1-'+phase,session:{snapshotEvents:()=>[]}}
  const scope=createScope(ctx,agent)
  fibers.push(await scope.ctx.plugin({name:'b1-probe-agent',inject:['tools','systemPrompt'],apply(scoped){agent.ctx=scoped;production.mountBoundBusinessNetworkTool(agent,config,{platformBaseUrl:config.baseUrl,knowledgeNetworkId:values.kn,displayName:'B1 probe'})}}))
  const start=await ctx.tools.execute({callId:'b1-'+(++sequence),name:'mcp__openbkn__bkn_start_interaction',arguments:{conversation_mode:'new',question:'B1 authentication boundary probe; no business query',agent_name:'bkn-agent-dsh-business-context'},agent,signal:signal()})
  const text=(start.content??[]).filter(x=>x.type==='text').map(x=>x.text).join('\n').split('[BKN_TRACE]')[0].trim()
  let data;try{data=JSON.parse(text)}catch{}
  appendFileSync(resolve(process.env.DSH_HOME,'probe-interactions.private.jsonl'), JSON.stringify({at:new Date().toISOString(),data})+'\n')
  record(phase,{startIsError:start.isError===true,publicUnauthorized:text.includes('Public.Unauthorized'),hasInteractionId:typeof data?.interaction_id==='string'})
  assert.equal(start.isError===true,false)
  assert.equal(typeof data?.interaction_id,'string')
  let queryTool='search_schema',queryArguments={kn_id:values.kn,query:'material'}
  if(phase==='baseline') {
   const reader=new production.OpenBknPlatformReader({...config,resolveToken:async()=>service.synchronizedToken})
   const detail=await reader.getKnowledgeNetworkDetail({platformBaseUrl:config.baseUrl,knowledgeNetworkId:values.kn,displayName:'minimal probe'},signal())
   const profile=production.buildNetworkCapabilityProfile({platformBaseUrl:config.baseUrl,knowledgeNetworkId:values.kn,displayName:'minimal probe'},detail)
   const objectType=profile.objectTypes.find(t=>t.id.includes('material'))??profile.objectTypes[0];assert.ok(objectType,'a real object type is required')
   queryTool='query_object_instance';queryArguments={kn_id:values.kn,ot_id:objectType.id,limit:1}
  }
  const search=await ctx.tools.execute({callId:'b1-'+(++sequence),name:'mcp__openbkn__'+queryTool,arguments:queryArguments,agent,signal:signal()})
  record(phase+'-read-only-query',{isError:search.isError===true,tool:queryTool}); assert.equal(search.isError===true,false)
  if (phase==='baseline') {
    const nav=production.buildNetworkCapabilityProfile({platformBaseUrl:config.baseUrl,knowledgeNetworkId:values.kn,displayName:'probe'},{id:values.kn,concept_groups:[{id:'g',name:'fixture'}],object_types:null,relation_types:null,action_types:null,object_type_count:201,notice:'navigation shell: controlled fixture'})
    record('controlled-navigation',{pass:nav.navigation?.objectTypeCount===201,indicesInvented:nav.objectTypes.length!==0}); assert.equal(nav.navigation.objectTypeCount,201)
  }
  const finish=await ctx.tools.execute({callId:'b1-'+(++sequence),name:'mcp__openbkn__bkn_finish_interaction',arguments:{interaction_id:data.interaction_id,outcome:'completed',answer:'B1 probe finished; no business data query'},agent,signal:signal()})
  record(phase+'-finish',{isError:finish.isError===true}); if(finish.isError) console.error(JSON.stringify(finish))
  assert.equal(finish.isError===true,false)
  if(phase==='baseline') {
    const reader=new production.OpenBknPlatformReader({...config,resolveToken:async()=>service.synchronizedToken})
    const detail=await reader.getKnowledgeNetworkDetail({platformBaseUrl:config.baseUrl,knowledgeNetworkId:values.kn,displayName:'minimal probe'},signal())
    const profile=production.buildNetworkCapabilityProfile({platformBaseUrl:config.baseUrl,knowledgeNetworkId:values.kn,displayName:'minimal probe'},detail)
    record('real-reader-profile',{pass:true,navigation:profile.navigation!==undefined,objectTypes:profile.objectTypes.length,groups:profile.conceptGroups.length})
    for(const method of ['getInteractionOperations','getInteractionBusinessGraph']) {
      try {const result=await reader[method](data.interaction_id,signal()); record('real-provenance-'+method,{pass:true,topLevelKeys:Object.keys(result).filter(k=>k!=='token'),entriesCount:Array.isArray(result.entries)?result.entries.length:undefined})}
      catch(error) {record('real-provenance-'+method,{pass:false,code:error.code??'unknown',httpStatus:error.httpStatus}); throw error}
    }
  }
  const closed=await ctx.tools.execute({callId:'b1-'+(++sequence),name:'mcp__openbkn__search_schema',arguments:{kn_id:values.kn,query:'material'},agent,signal:signal()})
  record(phase+'-closed-after-finish',{refused:closed.isError===true}); assert.equal(closed.isError===true,true)
 }
 await callPair('baseline')
 // Public status reconciles the CLI credential even when its token stays unchanged.
 await service.remoteStatus(signal()); await callPair('same-owner-reconcile')
 if(values['address-cycle']) {
  await service.mcpManagerInstance?.fiber?.dispose()
  service.lifetime.abort()
  const offline=Object.create(production.OpenBknBusinessContextService.prototype)
  Object.assign(offline,{ctx,config:production.Config({...config,baseUrl:'https://192.0.2.1'}),lifetime:new AbortController()})
  record('address-mismatch',{kind:(await offline.remoteStatus(signal())).kind})
  const replacement=Object.create(production.OpenBknBusinessContextService.prototype)
  Object.assign(replacement,{ctx,config,lifetime:new AbortController()})
  await replacement.remoteListNetworks(signal())
  // Continue the same probe process with the replacement configuration owner.
  service.mcpManagerInstance=replacement.mcpManagerInstance
  record('replacement-owner',{tokenSameAsBaseline:replacement.synchronizedToken===baselineToken})
  await callPair('after-address-restore')
 }
 const report=await diagnostics.OpenBknDiagnosticsService.prototype.getReport.call({ctx})
 record('diagnostic-context-loader',{checks:report.checks.filter(x=>x.id==='observed:context-loader').map(x=>({status:x.status,code:x.code}))})
 for(const reason of ['disabled','unavailable']) {
  const fakeCtx=new Context(),fakeFibers=[]
  try {
   fakeFibers.push(await fakeCtx.plugin(tool.default));fakeFibers.push(await fakeCtx.plugin(prompt.default))
   const {createMcpToolDefinition}=await mod('dsh-mcp-client');let dispatched=0
   const response=stage=>reason==='disabled'?{trace_recorded:false,capture_enabled:false,code:'capture_disabled',required_action:'continue_without_bkn_context'}:{trace_recorded:false,trace_available:false,stage,code:'trace_core_unavailable',required_action:'continue_without_bkn_context'}
   for(const short of ['bkn_start_interaction','bkn_finish_interaction','search_schema'])fakeCtx.tools.register(createMcpToolDefinition(fakeCtx,{name:'mcp__openbkn__'+short,rawName:short,description:'Controlled 0.2.0 response, not a live Trace configuration',inputSchema:{type:'object',properties:short==='search_schema'?{kn_id:{type:'string'}}:{}},call:async args=>{dispatched++;if(short==='search_schema')assert.equal(args.bkn_context,undefined);return {content:[{type:'text',text:JSON.stringify(short==='search_schema'?{object_types:[],relation_types:[]}:response(short==='bkn_start_interaction'?'start_interaction':'finish_interaction'))}]}}}))
   const fakeAgent={id:'trace-'+reason,session:{snapshotEvents:()=>[]}};const scope=createScope(fakeCtx,fakeAgent)
   fakeFibers.push(await scope.ctx.plugin({name:'controlled-trace-'+reason,inject:['tools','systemPrompt'],apply(scoped){fakeAgent.ctx=scoped;production.mountBoundBusinessNetworkTool(fakeAgent,config,{platformBaseUrl:config.baseUrl,knowledgeNetworkId:values.kn,displayName:'Controlled Trace fixture'})}}))
   const run=(short,args)=>fakeCtx.tools.execute({callId:'controlled-'+(++sequence),name:'mcp__openbkn__'+short,arguments:args,agent:fakeAgent,signal:signal()})
   assert.equal((await run('search_schema',{kn_id:values.kn,query:'x'})).isError,true);assert.equal(dispatched,0)
   const start=await run('bkn_start_interaction',{conversation_mode:'new',question:'controlled Trace',agent_name:'bkn-agent-dsh-business-context'});assert.equal(start.isError,false)
   assert.deepEqual(production.projectLifecycleOutcome(start),{recording:reason})
   assert.equal((await run('search_schema',{kn_id:values.kn,query:'x'})).isError,false)
   const before=dispatched;assert.equal((await run('search_schema',{kn_id:'different-network',query:'x'})).isError,true);assert.equal(dispatched,before)
   assert.equal((await run('bkn_finish_interaction',{outcome:'completed',answer:'controlled fixture'})).isError,false)
   const closedBefore=dispatched;assert.equal((await run('search_schema',{kn_id:values.kn,query:'x'})).isError,true);assert.equal(dispatched,closedBefore)
   record('controlled-trace-'+reason,{pass:true,noInventedIds:true,noContextInjected:true,crossNetworkDenied:true,closedAfterFinish:true,evidence:'Controlled fixture on official DSH tool runtime + fixed candidate; not live Trace disablement'})
  } finally {for(const fiber of fakeFibers.reverse())await fiber.dispose()}
 }
 record('complete',{passed:true})
} finally {
 await service.mcpManagerInstance?.fiber?.dispose()
 for(const fiber of fibers.reverse()) await fiber.dispose()
}
