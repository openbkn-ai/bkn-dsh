import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { writeFileSync } from 'node:fs'
const repo=resolve(process.argv[2]??process.cwd()),rows=[],requests=[]
const servers=[],addresses={}
for(const origin of ['A','B']) {
 const server=createServer(async(req,res)=>{
  let raw='';for await(const x of req)raw+=x
  requests.push({origin,method:req.method,path:req.url,hasBearer:!!req.headers.authorization,hasSession:!!req.headers['mcp-session-id']})
  const path=new URL(req.url,addresses[origin]).pathname
  const redirect=path.match(/^\/(same|cross)\/(\d+)$/)
  if(redirect){res.writeHead(+redirect[2],{location:addresses[redirect[1]==='cross'?'B':'A']+'/mcp'}).end();return}
  if(path==='/unauthorized'){res.writeHead(401).end('synthetic 401');return}
  if(req.method==='GET'){res.writeHead(405).end();return}
  if(req.method==='DELETE'){res.writeHead(200).end();return}
  const msg=JSON.parse(raw)
  if(msg.id===undefined){res.writeHead(202).end();return}
  const result=msg.method==='initialize'?{protocolVersion:msg.params.protocolVersion,capabilities:{tools:{}},serverInfo:{name:'synthetic',version:'1'}}:msg.method==='tools/list'?{tools:[{name:'echo',description:'synthetic fixture only',inputSchema:{type:'object',properties:{question:{type:'string'}}}}]}:{content:[{type:'text',text:'synthetic-result'}]}
  res.writeHead(200,{'content-type':'application/json',...(msg.method==='initialize'?{'mcp-session-id':'synthetic-session'}:{})}).end(JSON.stringify({jsonrpc:'2.0',id:msg.id,result}))
 })
 await new Promise(r=>server.listen(0,'127.0.0.1',r));servers.push(server);addresses[origin]=`http://127.0.0.1:${server.address().port}`
}
let failure
try {
 for(const [host,path] of [['old','release/local-51/npm-old-runtime'],['rc3','release/local-53/rc3-runtime']].filter(([host])=>!process.argv[3]||process.argv[3]==='all'||host===process.argv[3])) {
  const req=createRequire(join(repo,path,'package.json')),load=async name=>import(pathToFileURL(req.resolve('@deepseek-ai/'+name)).href)
  const [{Context},{SystemPrompt},{ToolRuntime}]=await Promise.all(['cordis','dsh-system-prompt','dsh-tools'].map(load))
  const {createScope}=await import(pathToFileURL(req.resolve('@deepseek-ai/dsh-scope',{paths:[req.resolve('@deepseek-ai/dsh-tools/package.json')]})).href)
  const mcp=await import(pathToFileURL(join(repo,process.argv[4]==='source'?`release/local-53/source-build/${host}/packages/mcp/mcp-client/lib/index.js`:`release/local-53/backport/packages/mcp-${host}/lib/index.js`)).href)
  for(const endpoint of ['/mcp','/same/307','/same/308','/same/302','/cross/307','/unauthorized']) {
   const start=requests.length,ctx=new Context();let mounted,error
   try {
    await ctx.plugin(SystemPrompt);await ctx.plugin(ToolRuntime)
    mounted=await ctx.plugin(mcp,mcp.Config({transport:'streamable-http',serverName:'probe',url:addresses.A+endpoint,headers:{Authorization:'Bearer synthetic-only'},failOnStartupError:true,reconnect:{enabled:false}}))
    assert(ctx.tools.get('mcp__probe__echo'))
    const agent={id:'synthetic-agent',session:{snapshotEvents:()=>[]}}
    agent.ctx=createScope(ctx,agent).ctx
    const result=await ctx.tools.execute({callId:'synthetic-call',name:'mcp__probe__echo',arguments:{question:'synthetic-question'},agent,signal:AbortSignal.timeout(5000)})
    assert.notEqual(result.isError,true)
    assert.equal(result.content[0].text,'synthetic-result')
    await mounted.dispose();assert.equal(ctx.tools.get('mcp__probe__echo'),undefined)
   } catch(e){error=e}
   finally{await ctx.fiber.dispose()}
   const observed=requests.slice(start),mustReject=['/same/302','/cross/307','/unauthorized'].includes(endpoint)
   assert.equal(!!error,mustReject,error?.stack)
   assert.equal(observed.filter(x=>x.origin==='B').length,0)
   if(mustReject)assert.equal(ctx.tools?.get('mcp__probe__echo'),undefined)
   rows.push({host,endpoint,expectedRejection:mustReject,rejected:!!error,toolRegisteredCalledAndDisposed:!mustReject,secondOriginRequests:0,result:'PASS'})
  }
 }
}catch(e){failure={name:e.name,message:e.message,stack:e.stack};process.exitCode=1}
finally{
 for(const s of servers){s.closeAllConnections();await new Promise(r=>s.close(r))}
 const result={scope:'isolated copied DSH MCP package and actual Cordis/ToolRuntime; synthetic MCP; no complete Desktop/browser/platform/CLI',rows,failure,ports:Object.values(addresses).map(x=>new URL(x).port),serversClosed:servers.every(x=>!x.listening)}
 writeFileSync(join(repo,`release/local-53/backport-host-probe-${process.argv[3]??'all'}-${process.argv[4]??'copy'}.json`),JSON.stringify(result,null,2)+'\n')
 console.log(JSON.stringify({cases:rows.length,failure,serversClosed:result.serversClosed}))
}
