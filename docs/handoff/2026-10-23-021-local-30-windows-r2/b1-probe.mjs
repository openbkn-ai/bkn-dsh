// Invoke native Remote methods against one owned loopback Host. Credentials remain in memory.
import assert from 'node:assert/strict'
import {existsSync,readFileSync,writeFileSync} from 'node:fs'
import {randomUUID} from 'node:crypto'
import {parseArgs} from 'node:util'
import {join,dirname} from 'node:path'
const {values:v}=parseArgs({options:{owned:{type:'string'},log:{type:'string'},workspace:{type:'string'},server:{type:'string'},phase:{type:'string'},key:{type:'string'},output:{type:'string'}}})
for(const key of ['owned','log','workspace','server','phase','key','output'])assert.ok(v[key],`--${key} required`)
assert.ok(!existsSync(v.output),'Use a new output file; retain prior results')
assert.match(v.phase,/^[a-z0-9-]+$/);assert.match(v.key,/^[a-z0-9.-]+$/)
const owned=JSON.parse(readFileSync(v.owned,'utf8').replace(/^\uFEFF/,'')),server=JSON.parse(readFileSync(v.server))
const bootstrap=readFileSync(v.log,'utf8').match(/http:\/\/127\.0\.0\.1:\d+\/\?token=[A-Za-z0-9_-]+/g)
assert.ok(bootstrap?.length);assert.equal(new Set(bootstrap).size,1)
const url=new URL(bootstrap[0]);assert.ok(owned.listeners?.some(x=>x.port===Number(url.port))||owned.port===Number(url.port),'Bootstrap listener is not in the owned record')
const response=await fetch(url,{redirect:'manual'});assert.equal(response.status,303)
const cookie=response.headers.get('set-cookie')?.split(';')[0];assert.ok(cookie)
async function remote(method,args){
 const rpcId=randomUUID(),response=await fetch(url.origin+'/api/'+method,{method:'POST',headers:{'content-type':'application/json',cookie},body:JSON.stringify({type:'client-request',rpcId,method,payload:{args}}),signal:AbortSignal.timeout(60000)})
 assert.equal(response.status,200);const value=await response.json();assert.equal(value.rpcId,rpcId)
 assert.ok(value.result.ok,`${method}: ${value.result.error?.code??'native Remote failure'}`)
 return value.result.value
}
const auth=await remote('openbknBusinessContext/status',{});assert.equal(auth.kind,'authenticated')
const session=await remote('session/create',{request:{cwd:v.workspace}}),sessionId=session.sessionId
await remote('session/selectModel',{request:{sessionId,provider:'local30-b1',model:server.model}})
await remote('openbknBusinessContext/bindNetwork',{sessionId,networkId:'supply_ontology_hand'})
const marker=`R40_B1:${v.key}:${v.phase}`
await remote('session/prompt',{request:{requestId:randomUUID(),sessionId,mode:'queue',clientTimeZone:'Asia/Taipei',content:[{type:'text',text:marker+' Bounded protocol check: start, exact ordinary query, finish; no Sandbox; not model G6.'}]}})
let evidence,complete=false
for(let i=0;i<160;i++) {
 const events=(()=>{try{return readFileSync(join(dirname(v.server),'events.jsonl'),'utf8').trim().split('\n').map(x=>JSON.parse(x))}catch{return []}})()
 const rows=events.filter(x=>x.phase===marker)
 assert.ok(!events.some(x=>x.fixtureFailure),'Protocol fixture reported a failure; keep local evidence')
 evidence=rows.find(x=>x.queryEvidence)?.queryEvidence
 complete=rows.some(x=>x.emittedTool===null&&x.completedTools.includes('mcp__openbkn__bkn_finish_interaction'))
 if(evidence&&complete)break
 await new Promise(done=>setTimeout(done,250))
}
assert.ok(evidence&&complete,'Native turn did not complete; retain Session and private logs')
const result={at:new Date().toISOString(),key:v.key,phase:v.phase,ownedPid:owned.pid,sessionId,...evidence,protocolOnly:true,realModel:false,sandboxUsed:false,platformOperationsReadbackRequired:true}
writeFileSync(v.output,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});console.log(JSON.stringify(result))
