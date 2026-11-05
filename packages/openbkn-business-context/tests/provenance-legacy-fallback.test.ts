import assert from 'node:assert/strict'
import { afterEach, test } from 'node:test'
import { createElement, Profiler, useSyncExternalStore } from 'react'
import { act, create } from 'react-test-renderer'
import { ProvenanceOverlay, ProvenanceOverlayController } from '../src/client/ProvenanceOverlay.tsx'
import { ProvenanceDetailTransportError } from '../src/client/provenance-detail-bridge.ts'
import type { PlatformProvenanceAdapter } from '../src/client/platform-provenance/index.tsx'
import type { ProvenanceHandle, ProvenanceView } from '../src/types.ts'

const renderers: ReturnType<typeof create>[] = []
afterEach(() => { for (const renderer of renderers.splice(0)) act(() => renderer.unmount()) })
const handle: ProvenanceHandle = { schemaVersion:2, interactionId:'int-fallback', conversationId:'conv-fallback', status:'completed', requestIds:[], traceIds:[], receiptIds:[], partial:false }
const conversation = { conversationId:'conv-fallback', interactionCount:1 }
function localView(target: ProvenanceHandle = handle, text = 'LOCAL TIMELINE SENTINEL'): ProvenanceView {
  return { interactionId:target.interactionId, conversationId:target.conversationId,
    timeline:[{seq:1,kind:'question',at:0,summary:text}], execution:{status:'completed',operations:[]},
    sources:{timeline:'local-session',operations:'unavailable',business:'unavailable',evidence:'unavailable',degraded:[{pane:'operations',reason:'authentication-required'}]},
    business:{kind:'unavailable'}, evidence:{kind:'unavailable',reason:'no-receipts'} }
}
function deferred<T>() { let resolve!:(value:T)=>void, reject!:(error:unknown)=>void; const promise=new Promise<T>((a,b)=>{resolve=a;reject=b});return{promise,resolve,reject} }
async function tick() { await act(async()=>{await new Promise<void>(resolve=>setImmediate(resolve))}) }
async function mount(options:{
  handle?:ProvenanceHandle
  read?:(signal?:AbortSignal)=>Promise<unknown>
  load?:(session:string,message:string,signal?:AbortSignal)=>Promise<ProvenanceView|undefined>
}={}) {
  const controller=new ProvenanceOverlayController(), legacyCalls:{session:string;message:string;signal?:AbortSignal}[]=[], nativeSignals:(AbortSignal|undefined)[]=[]
  let restored=0
  controller.open('session-fallback','message-fallback',options.handle??handle,{focus(){restored++}})
  const adapter={readConversation:async(signal?:AbortSignal)=>{nativeSignals.push(signal);return options.read?await options.read(signal):conversation}} as PlatformProvenanceAdapter
  const createDetailAdapter=()=>adapter
  const commits:string[]=[]
  let renderer!:ReturnType<typeof create>
  await act(async()=>{renderer=create(createElement(Profiler,{id:'fallback',onRender:()=>{if(renderer)commits.push(JSON.stringify(renderer.toJSON()))}},createElement(ProvenanceOverlay,{
    useProvenanceOverlay:(select:(value:ReturnType<typeof controller.getSnapshot>)=>unknown)=>select(useSyncExternalStore(controller.subscribe,controller.getSnapshot)),
    createDetailAdapter,
    load:async(session:string,message:string,signal?:AbortSignal)=>{legacyCalls.push({session,message,signal});return options.load?await options.load(session,message,signal):localView(options.handle??handle)},
    close:()=>controller.close(),
  } as never)))})
  renderers.push(renderer)
  await tick()
  return {controller,legacyCalls,nativeSignals,renderer,commits,get restored(){return restored},text:()=>JSON.stringify(renderer.toJSON())}
}

for(const code of ['NATIVE_NOT_AVAILABLE','TRACE_DISABLED','TRACE_UNAVAILABLE','BINDING_REQUIRED','AUTHENTICATION_REQUIRED'] as const) {
  test(`production native ${code} preserves the trusted legacy local view`,async()=>{
    const view=localView(), before=JSON.stringify(view)
    const ui=await mount({read:async()=>{throw new ProvenanceDetailTransportError(code)},load:async()=>view})
    assert.equal(ui.nativeSignals.length,1)
    assert.equal(ui.legacyCalls.length,1)
    assert.equal(ui.legacyCalls[0]?.session,'session-fallback');assert.equal(ui.legacyCalls[0]?.message,'message-fallback')
    assert.ok(ui.text().includes('LOCAL TIMELINE SENTINEL'))
    assert.ok(ui.renderer.root.findAll(node=>node.props['data-provenance-fallback']===code).length===1)
    assert.ok(ui.text().includes('时间链'))
    assert.equal(JSON.stringify(view),before,'fallback must not alter any existing record')
  })
}

for(const recording of ['disabled','unavailable',undefined] as const) test(`a handle without Interaction uses only the trusted local reader (${recording??'legacy'})`,async()=>{
  const target={...handle,interactionId:undefined,recording}
  const ui=await mount({handle:target})
  assert.equal(ui.nativeSignals.length,0)
  assert.equal(ui.legacyCalls.length,1)
  assert.ok(ui.text().includes('LOCAL TIMELINE SENTINEL'))
})

for(const code of ['IDENTITY_CHANGED','PLATFORM_MISMATCH','RECORD_NOT_DISCLOSED','ACCESS_DENIED','INVALID_RESPONSE','OUTPUT_OVERFLOW','SESSION_UNAVAILABLE',
  'HANDLE_UNAVAILABLE','LICENSE_REQUIRED','PLATFORM_UNAVAILABLE','REQUEST_ABORTED','CERTIFICATE_UNTRUSTED','CERTIFICATE_INVALID','NETWORK_TIMEOUT',
  'invalid-stream','incomplete-stream','result-too-large'] as const) {
  test(`native ${code} never silently falls back or relabels the cause as a connection issue`,async()=>{
    const ui=await mount({read:async()=>{throw new ProvenanceDetailTransportError(code)}})
    assert.equal(ui.legacyCalls.length,0)
    assert.ok(ui.text().includes(code),'the fixed failure classification remains visible')
    assert.ok(!ui.text().includes('请检查 OpenBKN 平台连接和当前用户权限后重试'))
    assert.ok(!ui.text().includes('LOCAL TIMELINE SENTINEL'))
  })
}

test('a legacy handle without a conversation uses only its own trusted turn reader',async()=>{
  const target={...handle,conversationId:undefined}
  const ui=await mount({handle:target})
  assert.equal(ui.nativeSignals.length,0)
  assert.equal(ui.legacyCalls.length,1)
  assert.ok(ui.text().includes('LOCAL TIMELINE SENTINEL'))
})

test('a no-Interaction local fallback refuses a response with a different Interaction',async()=>{
  const target={...handle,interactionId:undefined,recording:'disabled' as const}
  const ui=await mount({handle:target,load:async()=>localView(handle)})
  assert.equal(ui.nativeSignals.length,0)
  assert.equal(ui.legacyCalls.length,1)
  assert.ok(!ui.text().includes('LOCAL TIMELINE SENTINEL'))
  assert.ok(ui.text().includes('IDENTITY_CHANGED'))
})

for(const error of [null,undefined,new TypeError('private exception text'),new Error('private exception text'),{name:'ProvenanceDetailTransportError',code:'NATIVE_NOT_AVAILABLE'},new ProvenanceDetailTransportError('remote-failed')]) {
  test(`an unknown, untyped or transport failure does not enable a legacy fallback (${error instanceof Error?error.name:typeof error})`,async()=>{
    const ui=await mount({read:async()=>{throw error}})
    assert.equal(ui.legacyCalls.length,0)
    assert.ok(!ui.text().includes('private exception text'))
  })
}

test('a readable native conversation never prefetches the legacy view',async()=>{
  const ui=await mount()
  assert.equal(ui.nativeSignals.length,1)
  assert.equal(ui.legacyCalls.length,0)
  assert.equal(ui.renderer.root.findAll(node=>node.props['data-platform-provenance']==='conversation-detail').length,1)
})

for(const field of ['interactionId','conversationId'] as const) test(`legacy fallback refuses a different ${field}`,async()=>{
  const ui=await mount({read:async()=>{throw new ProvenanceDetailTransportError('NATIVE_NOT_AVAILABLE')},load:async()=>({...localView(),[field]:'different-record'})})
  assert.equal(ui.legacyCalls.length,1)
  assert.ok(!ui.text().includes('LOCAL TIMELINE SENTINEL'))
  assert.ok(ui.text().includes('IDENTITY_CHANGED'))
})

test('a late native failure after another answer opens cannot trigger its legacy fallback',async()=>{
  const pending=deferred<unknown>();let reads=0
  const ui=await mount({read:async()=>++reads===1?await pending.promise:conversation})
  await act(async()=>ui.controller.open('session-new','message-new',handle));await tick()
  await act(async()=>pending.reject(new ProvenanceDetailTransportError('NATIVE_NOT_AVAILABLE')));await tick()
  assert.equal(ui.legacyCalls.length,0)
  assert.ok(ui.nativeSignals[0]?.aborted)
})

test('a late native failure after reopening the same answer cannot select its previous fallback',async()=>{
  const pending=deferred<unknown>();let reads=0
  const ui=await mount({read:async()=>++reads===1?await pending.promise:conversation})
  await act(async()=>ui.controller.close())
  await act(async()=>ui.controller.open('session-fallback','message-fallback',handle));await tick()
  await act(async()=>pending.reject(new ProvenanceDetailTransportError('AUTHENTICATION_REQUIRED')));await tick()
  assert.equal(ui.legacyCalls.length,0)
  assert.ok(ui.nativeSignals[0]?.aborted)
  assert.equal(ui.renderer.root.findAll(node=>node.props['data-platform-provenance']==='conversation-detail').length,1)
})

test('a pending fallback is cancelled on close and cannot replace a reopened answer',async()=>{
  const pending=deferred<ProvenanceView>();let reads=0
  const ui=await mount({read:async()=>{if(++reads===1)throw new ProvenanceDetailTransportError('NATIVE_NOT_AVAILABLE');return conversation},load:async()=>await pending.promise})
  assert.equal(ui.legacyCalls.length,1)
  await act(async()=>ui.controller.close())
  assert.ok(ui.legacyCalls[0]?.signal?.aborted)
  assert.equal(ui.restored,1)
  await act(async()=>ui.controller.open('session-new','message-new',handle));await tick()
  const commitOffset=ui.commits.length
  await act(async()=>pending.resolve(localView(handle,'OLD LOCAL SENTINEL')));await tick()
  assert.ok(!ui.text().includes('OLD LOCAL SENTINEL'))
  assert.ok(ui.commits.slice(commitOffset).every(value=>!value.includes('OLD LOCAL SENTINEL')))
  assert.equal(ui.legacyCalls.length,1)
})
