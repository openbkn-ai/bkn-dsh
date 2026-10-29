import { createServer } from 'node:https'
import { execFileSync, spawn } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync, appendFileSync, openSync, closeSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { X509Certificate } from 'node:crypto'
const repo=resolve(process.argv[2]),task=resolve(process.argv[3]??join(repo,'release/panel-host')),profile=join(task,'home/profiles/web')
if(!task.startsWith(join(repo,'release')+'/'))throw Error('Fixture task must stay within the owned release directory')
const certPath=join(task,'fixture-ca.pem'),keyPath=join(task,'fixture-key.pem')
if(!existsSync(certPath))execFileSync('openssl',['req','-x509','-newkey','ec','-pkeyopt','ec_paramgen_curve:P-256','-nodes','-keyout',keyPath,'-out',certPath,'-days','2','-subj','/CN=127.0.0.1','-addext','subjectAltName=IP:127.0.0.1','-addext','basicConstraints=critical,CA:FALSE'],{stdio:'ignore'})
const requests=[],explanation=JSON.parse(readFileSync(join(repo,'docs/handoff/2026-10-27-release-021/native-provenance-schema1.json')))
const server=createServer({cert:readFileSync(certPath),key:readFileSync(keyPath)},async(req,res)=>{
 let raw='';for await(const chunk of req)raw+=chunk
 const path=new URL(req.url,'https://127.0.0.1').pathname
 const observation={path,method:req.method,hasAuthorization:!!req.headers.authorization,bodyBytes:Buffer.byteLength(raw)}
 requests.push(observation)
 if(path==='/api/agent-retrieval/v1/mcp/') {
  if(req.method==='GET'){res.writeHead(405).end();return}
  if(req.method==='DELETE'){res.writeHead(200).end();return}
  const msg=JSON.parse(raw)
  observation.rpcMethod=msg.method
  if(msg.id===undefined){res.writeHead(202).end();return}
  const result=msg.method==='initialize'?{protocolVersion:msg.params.protocolVersion,capabilities:{tools:{}},serverInfo:{name:'synthetic',version:'1'}}:msg.method==='tools/list'?{tools:[{name:'bkn_start_interaction',inputSchema:{type:'object',properties:{}}}]}:null
  if(!result){res.writeHead(400).end();return}
  res.writeHead(200,{'content-type':'application/json',...(msg.method==='initialize'?{'mcp-session-id':'synthetic-session'}:{})}).end(JSON.stringify({jsonrpc:'2.0',id:msg.id,result}));return
 }
 if(req.method!=='GET'){res.writeHead(400).end();return}
 if(path==='/api/bkn-backend/v1/knowledge-networks'){res.writeHead(200,{'content-type':'application/json'}).end(JSON.stringify({entries:[{id:'synthetic-network',name:'Synthetic TLS fixture'}]}));return}
 if(path==='/api/agent-observability/v1/business-provenance/interactions/int-fixture/explanations'){res.writeHead(200,{'content-type':'application/json'}).end(JSON.stringify(explanation));return}
 if(path==='/api/agent-observability/v1/business-provenance/interactions/int-fixture'){res.writeHead(200,{'content-type':'application/json'}).end(JSON.stringify({interaction_id:'int-fixture',question:'synthetic',answer:'synthetic',time_rail:[],operations:[]}));return}
 res.writeHead(404).end()
})
await new Promise(r=>server.listen(0,'127.0.0.1',r))
const origin='https://127.0.0.1:'+server.address().port
const cli=resolve(repo,'../.test-tools/node_modules/.bin/openbkn'),observer=join(repo,'docs/evidence/2026-10-29-panel-cert-login/host-observer.mjs')
const patches=[{id:'openbkn-business-context',config:{baseUrl:origin,cliPath:cli,requestTimeoutMs:5000}},
 {insert:[{name:observer}]}]
// This opt-in seeds only an agent-owned loopback fixture. It is not the
// user-facing confirmation path; that unchanged UI is tested separately.
if(process.env.OPENBKN_CERT_BACKEND_ONLY==='1')patches[0].config.platformTrust={origin,pem:readFileSync(certPath,'utf8'),fingerprint256:new X509Certificate(readFileSync(certPath)).fingerprint256}
writeFileSync(join(profile,'cordis.patch.yml'),JSON.stringify(patches,null,2)+'\n')
const env={...process.env,DSH_HOME:join(task,'home'),BKN_CONFIG_DIR:join(task,'cli'),OPENBKN_CERT_PROOF_OUTPUT:join(task,'ACTUAL-SERVICE.json'),OPENBKN_CERT_PROOF_INSTALLED:join(profile,'node_modules/@openbkn/dsh-business-context'),OPENBKN_CERT_PROOF_PROFILE:profile}
for(const k of ['NODE_EXTRA_CA_CERTS','NODE_TLS_REJECT_UNAUTHORIZED'])delete env[k]
const hostBin=resolve(repo,'../bkn-dsh/release/local-53/rc3-runtime/node_modules/@deepseek-ai/dsh/lib/bin.js')
const stdout=openSync(join(task,'host.stdout-private.log'),'a'),stderr=openSync(join(task,'host.stderr-private.log'),'a')
const child=spawn(process.execPath,[hostBin,'web','--port','0','--no-open'],{cwd:join(task,'cwd'),env,stdio:['ignore',stdout,stderr],detached:true})
closeSync(stdout);closeSync(stderr)
const state={kind:'isolated-synthetic-panel-proof',pid:child.pid,orchestratorPid:process.pid,spawnRequestedUtc:new Date().toISOString(),origin,certificateFile:certPath,sourceRuntime:hostBin,platformVisited:false,fixtureOnly:true}
try{state.observedProcessIdentity=execFileSync('ps',['-p',String(child.pid),'-o','pid=,lstart=,comm='],{encoding:'utf8'}).trim()}catch{}
writeFileSync(join(task,'HOST-IDENTITY-private.json'),JSON.stringify(state,null,2)+'\n')
console.log(JSON.stringify({pid:child.pid,origin,ready:'fixture running; Host startup log retained privately'}))
let stopping=false
const hostAlive=()=>child.exitCode===null&&child.signalCode===null
async function stop(){
 if(stopping)return;stopping=true
 if(hostAlive()){try{process.kill(-child.pid,'SIGTERM')}catch{};await Promise.race([new Promise(r=>child.once('exit',r)),new Promise(r=>setTimeout(r,3000))]);if(hostAlive()){try{process.kill(-child.pid,'SIGKILL')}catch{}}}
 server.closeAllConnections();await new Promise(r=>server.close(r))
 writeFileSync(join(task,'FIXTURE-REQUESTS.json'),JSON.stringify({requests,noToolsCall:requests.every(r=>r.rpcMethod!=='tools/call'),fixtureListenersClosed:!server.listening,hostExited:!hostAlive(),hostExitCode:child.exitCode,hostSignal:child.signalCode},null,2)+'\n')
 process.exit(0)
}
process.stdin.resume();process.stdin.on('data',chunk=>{if(String(chunk).includes('stop'))void stop()});process.on('SIGTERM',()=>void stop());process.on('SIGINT',()=>void stop())
child.on('exit',(code,signal)=>{appendFileSync(join(task,'HOST-EXIT.jsonl'),JSON.stringify({at:new Date().toISOString(),code,signal})+'\n');console.log(JSON.stringify({hostExit:code,signal}))})
