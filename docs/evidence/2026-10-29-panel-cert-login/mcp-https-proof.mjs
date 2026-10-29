import assert from 'node:assert/strict'
import { createServer } from 'node:https'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { OpenBknPlatformTrust, inspectPlatformCertificate, connectionFailure } from '../../../packages/openbkn-business-context/src/platform-trust.ts'
const repo = resolve(process.argv[2]), task = join(repo, 'release/platform-cert-companions')
const temp = mkdtempSync(join(tmpdir(), 'openbkn-mcp-tls-'))
execFileSync('openssl', ['req','-x509','-newkey','ec','-pkeyopt','ec_paramgen_curve:P-256','-nodes','-keyout',join(temp,'key'),'-out',join(temp,'cert'),'-days','2','-subj','/CN=127.0.0.1','-addext','subjectAltName=IP:127.0.0.1','-addext','basicConstraints=critical,CA:FALSE'],{stdio:'ignore'})
const pem=readFileSync(join(temp,'cert'),'utf8'),key=readFileSync(join(temp,'key'),'utf8'),requests=[],servers=[],origins={},rows=[]
try {
 for(const name of ['a','b']) {
  const server=createServer({cert:pem,key},async(req,res)=>{
   requests.push({origin:name,path:req.url,method:req.method,hasBearer:!!req.headers.authorization,hasSession:!!req.headers['mcp-session-id']})
   if(req.url==='/same'||req.url==='/cross'){res.writeHead(307,{location:origins[req.url==='/cross'?'b':'a']+'/mcp'}).end();return}
   if(req.method==='GET'){res.writeHead(405).end();return}
   if(req.method==='DELETE'){res.writeHead(200).end();return}
   let raw='';for await(const chunk of req)raw+=chunk
   const msg=JSON.parse(raw)
   if(msg.id===undefined){res.writeHead(202).end();return}
   const result=msg.method==='initialize'?{protocolVersion:msg.params.protocolVersion,capabilities:{tools:{}},serverInfo:{name:'synthetic',version:'1'}}:{tools:[{name:'bkn_start_interaction',inputSchema:{type:'object',properties:{}}}]}
   res.writeHead(200,{'content-type':'application/json',...(msg.method==='initialize'?{'mcp-session-id':'synthetic-session'}:{})}).end(JSON.stringify({jsonrpc:'2.0',id:msg.id,result}))
  })
  await new Promise(r=>server.listen(0,'127.0.0.1',r));servers.push(server);origins[name]='https://127.0.0.1:'+server.address().port
 }
 for(const [host,runtime,payload]of [
  ['old',resolve(repo,'../bkn-dsh/release/local-51/npm-old-runtime'),join(task,'old-final/payload')],
  ['rc3',resolve(repo,'../bkn-dsh/release/local-53/rc3-runtime'),join(task,'rc3-final/payload')],
 ]) {
  const req=createRequire(join(runtime,'package.json')),load=async n=>import(pathToFileURL(req.resolve('@deepseek-ai/'+n)).href)
  const [{Context},{SystemPrompt},{ToolRuntime}]=await Promise.all(['cordis','dsh-system-prompt','dsh-tools'].map(load))
  const mcp=await import(pathToFileURL(join(payload,'lib/index.js')).href)
  assert.equal(mcp.platformFetchSupported,true)
  for(const [name,path,confirmed,reject]of [['no-ca','/mcp',false,true],['confirmed','/mcp',true,false],['same-origin','/same',true,false],['cross-origin','/cross',true,true]]) {
   const start=requests.length,ctx=new Context(),identity=inspectPlatformCertificate(origins.a,pem)
   const trust=new OpenBknPlatformTrust(origins.a,confirmed?{origin:identity.origin,pem,fingerprint256:identity.fingerprint256}:undefined)
   let error,mounted
   try {
    await ctx.plugin(SystemPrompt);await ctx.plugin(ToolRuntime)
    const config=mcp.Config({transport:'streamable-http',serverName:'openbkn',url:origins.a+path,headers:{Authorization:'Bearer synthetic-only'},platformFetch:trust.fetch,failOnStartupError:true,reconnect:{enabled:false}})
    assert.equal(config.platformFetch,trust.fetch,'Schemastery retains the exact in-memory scoped fetch')
    mounted=await ctx.plugin(mcp,config)
    assert(ctx.tools.get('mcp__openbkn__bkn_start_interaction'))
   }catch(e){error=e}
   finally{await mounted?.dispose();await ctx.fiber.dispose();await trust.dispose()}
   const observed=requests.slice(start)
   assert.equal(!!error,reject,error?.stack)
   assert.equal(observed.filter(r=>r.origin==='b').length,0)
   if(!confirmed){assert.equal(connectionFailure(error),'CERTIFICATE_UNTRUSTED');assert.equal(observed.length,0,'TLS rejection happens before any HTTP request')}
   rows.push({host,name,rejected:!!error,toolRegistered:!error,secondOriginRequests:0,scopedFetchRetained:true,result:'PASS'})
  }
 }
} finally {
 for(const s of servers){s.closeAllConnections();await new Promise(r=>s.close(r))}
 rmSync(temp,{recursive:true,force:true})
 writeFileSync(join(task,'MCP-HTTPS-PROOF.json'),JSON.stringify({kind:'local-controlled-https-native-mcp',ciRun:null,formalAcceptanceEligible:false,rows,fixtureListenersClosed:servers.every(s=>!s.listening),noBusinessToolsCalled:true},null,2)+'\n')
}
console.log(JSON.stringify({rows:rows.length,allPassed:rows.length===8&&rows.every(r=>r.result==='PASS')}))
