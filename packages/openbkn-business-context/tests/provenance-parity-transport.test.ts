import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createProvenanceDetailTransport, ProvenanceDetailTransportError, type ProvenanceDetailStream } from '../src/client/provenance-detail-bridge.ts'
import { PROVENANCE_DETAIL_LIMITS, type ProvenanceDetailEvent } from '../src/provenance-detail-types.ts'

function stream(events: ProvenanceDetailEvent[], dispose: () => void | Promise<void> = () => {}): ProvenanceDetailStream {
  return { async *[Symbol.asyncIterator]() { yield* events }, dispose }
}
async function rejected(events: ProvenanceDetailEvent[], code: string, kind: 'detail' | 'markdown' = 'detail') {
  await assert.rejects(createProvenanceDetailTransport(() => stream(events))({ kind }), (error: unknown) => error instanceof ProvenanceDetailTransportError && error.code === code && !error.message.includes('secret'))
}

test('detail transport resolves verified content without waiting on Remote disposal', async () => {
  let disposed = 0
  const disposeNever = () => { disposed++; return new Promise<void>(() => {}) }
  const result = await createProvenanceDetailTransport(() => stream([{kind:'result', value:{ raw:'123.450000', status:'invalid', reason:'platform-raw' }}], disposeNever))({kind:'detail'})
  assert.deepEqual(result, {raw:'123.450000',status:'invalid',reason:'platform-raw'})
  assert.equal(disposed, 1)
})

test('detail transport reconstructs UTF-16 split JSON without altering platform content', async () => {
  const original = { answer:'平台原文😀123.450000', validationStatus:'invalid', reasonCode:'platform-reason' }
  const json = JSON.stringify(original)
  const split = json.indexOf('😀') + 1
  const transport = createProvenanceDetailTransport(() => stream([
    {kind:'chunk',index:0,encoding:'json',content:json.slice(0,split)},
    {kind:'chunk',index:1,encoding:'json',content:json.slice(split)},
    {kind:'end',chunks:2,encoding:'json'},
  ]))
  assert.deepEqual(await transport({kind:'detail'}), original)
})

test('detail transport rejects missing chunks, duplicate index, mixed encoding and invalid JSON', async () => {
  await rejected([{kind:'chunk',index:0,encoding:'json',content:'{"a":'}], 'incomplete-stream')
  await rejected([{kind:'chunk',index:1,encoding:'json',content:'{}'}], 'invalid-stream')
  await rejected([{kind:'chunk',index:0,encoding:'json',content:'{}'},{kind:'chunk',index:0,encoding:'json',content:'{}'}], 'invalid-stream')
  await rejected([{kind:'chunk',index:0,encoding:'json',content:'{}'},{kind:'end',chunks:2,encoding:'json'}], 'invalid-stream')
  await rejected([{kind:'chunk',index:0,encoding:'json',content:'{}'},{kind:'end',chunks:1,encoding:'text'}], 'invalid-stream')
  await rejected([{kind:'chunk',index:0,encoding:'json',content:'[invalid'},{kind:'end',chunks:1,encoding:'json'}], 'invalid-stream')
  await rejected([{kind:'chunk',index:0,encoding:'json',content:'{}'},{kind:'result',value:{}}], 'invalid-stream')
})

test('detail transport counts aggregate UTF-8 bytes, including a split surrogate, at the wire budget', async () => {
  const text = '😀'.repeat(PROVENANCE_DETAIL_LIMITS.wireBytes / 4)
  const chunks: ProvenanceDetailEvent[] = []
  // Offset the first boundary by one code unit to exercise a pending high surrogate.
  let position = 0
  for (let size = 1; position < text.length; size = PROVENANCE_DETAIL_LIMITS.chunkCharacters) {
    const content = text.slice(position, position + size)
    chunks.push({kind:'chunk',index:chunks.length,encoding:'text',content})
    position += content.length
  }
  const end: ProvenanceDetailEvent = {kind:'end',chunks:chunks.length,encoding:'text'}
  assert.equal(await createProvenanceDetailTransport(() => stream([...chunks,end]))({kind:'markdown'}), text)
  await rejected([...chunks, {kind:'chunk',index:chunks.length,encoding:'text',content:'中'}, {kind:'end',chunks:chunks.length+1,encoding:'text'}], 'result-too-large', 'markdown')
})

test('detail transport cancels a stalled Remote promptly and never opens an already cancelled request', async () => {
  const already = new AbortController(); already.abort()
  let opens = 0
  const unopened = createProvenanceDetailTransport(() => { opens++; return stream([]) })
  await assert.rejects(unopened({kind:'detail'},already.signal), {name:'AbortError'})
  assert.equal(opens,0)
  let disposes = 0
  const stalled: ProvenanceDetailStream = {
    [Symbol.asyncIterator]() { return { next: () => new Promise<IteratorResult<ProvenanceDetailEvent>>(() => {}) } },
    dispose() { disposes++ },
  }
  const cancel = new AbortController()
  const pending = createProvenanceDetailTransport(() => stalled)({kind:'detail'},cancel.signal)
  cancel.abort()
  await assert.rejects(pending,{name:'AbortError'})
  assert.equal(disposes,1)
})

test('detail transport exposes controlled error codes without leaking raw Remote exceptions', async () => {
  const transport = createProvenanceDetailTransport(() => ({
    async *[Symbol.asyncIterator]() { throw new Error('secret token https://private-platform.example') }, dispose() {},
  }))
  await assert.rejects(transport({kind:'detail'}), (error: unknown) => error instanceof ProvenanceDetailTransportError && error.code === 'remote-failed' && !error.message.includes('secret') && !error.message.includes('private-platform'))
})

test('analysis events are explicit and preserve platform deltas and structured content', async () => {
  const events: ProvenanceDetailEvent[] = [
    {kind:'analysis',event:'token',data:{content:'平台原文'}},
    {kind:'analysis',event:'structured',data:{content:{status:'invalid',reasonCode:'platform-original'}}},
  ]
  await rejected(events,'invalid-stream')
  const received: unknown[] = []
  const transport = createProvenanceDetailTransport(() => stream(events))
  assert.equal(await transport({kind:'analyze'},undefined,event => received.push(event)),null)
  assert.deepEqual(received,[{event:'token',data:{content:'平台原文'}},{event:'structured',data:{content:{status:'invalid',reasonCode:'platform-original'}}}])
})


test('controlled Host failures retain only safe HTTP evidence for platform permission and legacy UI states',async()=>{
  for(const status of [401,403,404,429,500]) {
    const transport=createProvenanceDetailTransport(()=>stream([{kind:'failure',code:'NATIVE_NOT_AVAILABLE',httpStatus:status}]))
    await assert.rejects(transport({kind:'detail'}),(error:unknown)=>error instanceof ProvenanceDetailTransportError && error.code==='NATIVE_NOT_AVAILABLE' && error.response?.status===status && error.message==='Business provenance could not be read.')
  }
  const invalid=createProvenanceDetailTransport(()=>stream([{kind:'failure',code:'INVALID_RESPONSE',httpStatus:9999}]))
  await assert.rejects(invalid({kind:'detail'}),(error:unknown)=>error instanceof ProvenanceDetailTransportError && error.response===undefined)
})

test('a parsed platform analysis error survives the full stream bridge and adapter with its original code and reason',async()=>{
  const {createPlatformProvenanceAdapter}=await import('../src/client/platform-provenance/adapter.tsx')
  const {BusinessProvenanceAnalysisError}=await import('../src/client/platform-provenance/business-provenance/business-provenance.service.ts')
  const transport=createProvenanceDetailTransport(()=>stream([{kind:'analysis',event:'error',data:{code:'platform-error-code',message:'平台分析原始原因'}}]))
  const adapter=createPlatformProvenanceAdapter(transport,{async copyText(){},downloadMarkdown(){}})
  await assert.rejects(adapter.analyze('int-parity-007','# source',()=>{}),(error:unknown)=>error instanceof BusinessProvenanceAnalysisError && error.code==='platform-error-code' && error.message==='平台分析原始原因')
})
