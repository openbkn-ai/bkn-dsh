import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { createHash } from 'node:crypto'
const client=readFileSync('packages/openbkn-business-context/src/client/index.tsx','utf8')
const start=client.indexOf('function remotePort(')
const end=client.indexOf('/** Use DSH',start)
assert.ok(start>=0&&end>start)
const body=client.slice(start,end)
const factory=new Function(stripTypeScriptTypes(body,{mode:'transform'})+';return remotePort')()
function fixture(){
 const state={naturalEnd:false,terminalConsumed:false,earlyReturn:false,modelCancelRequested:false,disposeCalls:0}
 async function* source(){yield [{id:'fixture-network'}];state.naturalEnd=true}
 const sourceIterator=source()
 const handle={
  [Symbol.asyncIterator](){return {
   async next(){const next=await sourceIterator.next();if(next.done)state.terminalConsumed=true;return next},
   async return(){state.earlyReturn=!state.terminalConsumed;if(!state.terminalConsumed)state.modelCancelRequested=true;return sourceIterator.return()}
  }},
  async dispose(){state.disposeCalls++;if(!state.terminalConsumed)state.modelCancelRequested=true;await sourceIterator.return()}
 }
 return {state,handle}
}
const actual=fixture()
const port=factory({remote:{openbknBusinessContext:{beginLoginStream:()=>actual.handle}}})
const result=await port.beginLogin(new AbortController().signal)
assert.equal(result[0].id,'fixture-network')
assert.equal(actual.state.naturalEnd,false)
assert.equal(actual.state.terminalConsumed,false)
assert.equal(actual.state.earlyReturn,true)
assert.equal(actual.state.modelCancelRequested,true)
const control=fixture()
let value
for await(const item of control.handle)value=item
await control.handle.dispose()
assert.equal(value[0].id,'fixture-network')
assert.equal(control.state.naturalEnd,true)
assert.equal(control.state.terminalConsumed,true)
assert.equal(control.state.modelCancelRequested,false)
const report={kind:'controlled client-port lifetime probe',productionFunctionExtracted:true,productionFunctionSHA256:createHash('sha256').update(body).digest('hex'),currentFirstResultConsumer:actual.state,consumeToTerminalControl:control.state,nativeRemoteTransportExecuted:false,nativeWindowsJobExecuted:false,browserExecuted:false,platformAccessed:false,conclusion:'Current production client returns after first yielded result and disposes before consuming terminal completion. A documented native cancel path can therefore be reached if server stream is still active. This does not establish Windows Job membership or the observed browser-close cause.'}
writeFileSync('release/local-44/login-stream-lifetime.json',JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report,null,2))
