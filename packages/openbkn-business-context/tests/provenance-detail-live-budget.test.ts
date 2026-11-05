import assert from 'node:assert/strict'
import test from 'node:test'
import { createHash } from 'node:crypto'
import { OpenBknPlatformReader, PlatformReaderError } from '../src/platform-reader.ts'
import { ProvenanceDetailScope } from '../src/provenance-detail-scope.ts'
import { createProvenanceDetailTransport, ProvenanceDetailTransportError } from '../src/client/provenance-detail-bridge.ts'
import { PROVENANCE_DETAIL_LIMITS } from '../src/provenance-detail-types.ts'

// Shape/size-only regression from actual 2026-11-02 platform GET: 9,067,369 bytes,
// 59 operations, 169,457 JSON values, depth 16. SHA256 of the private original:
// 7463bb3084bc7b94b440bca8cc239aa826bc02dea5dc327f6567f4a05db99001.
// This payload is synthetic. It contains no captured business rows or model text.
const observedBytes = 9_067_369
const identity = { conversationId:'conv-budget', initialInteractionId:'int-budget', knowledgeNetworkId:'kn-budget' }
const config = { baseUrl:'https://controlled.invalid', requestTimeoutMs:30_000, maxResultBytes:1024, allowInsecureTls:false, resolveToken:async()=>'controlled-token' }
function payload(bytes:number) {
  const value = { interaction_id:identity.initialInteractionId, operations:Array.from({length:59},(_,index)=>({operation_id:`op-${index}`,knowledge_network_id:identity.knowledgeNetworkId,platform_original:{validationStatus:'invalid',reasonCode:'preserve-original'}})), opaque_platform_payload:'' }
  value.opaque_platform_payload = 'x'.repeat(bytes - Buffer.byteLength(JSON.stringify(value)))
  assert.equal(Buffer.byteLength(JSON.stringify(value)),bytes)
  return value
}
const hash = (value:unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')
function transportFor(value:unknown) {
  const reader = new OpenBknPlatformReader(config,async input=>String(input).endsWith('/markdown')?new Response('# original platform Markdown'):new Response(JSON.stringify(value),{headers:{'content-type':'application/json'}}))
  const scope = new ProvenanceDetailScope(identity,reader)
  return createProvenanceDetailTransport((request,signal)=>({[Symbol.asyncIterator]:()=>scope.run(request,signal??AbortSignal.timeout(30_000))[Symbol.asyncIterator](),dispose(){}}))
}

test('a real-observed 9,067,369-byte detail shape survives Reader, Scope and Remote chunks unchanged',async()=>{
  const original=payload(observedBytes)
  const result=await transportFor(original)({kind:'detail'})
  assert.equal(hash(result),hash(original))
  assert.equal((result as typeof original).operations.length,59)
})

test('Markdown preflight can validate that same large detail without increasing Markdown limits',async()=>{
  assert.equal(await transportFor(payload(observedBytes))({kind:'markdown'}),'# original platform Markdown')
  assert.equal(PROVENANCE_DETAIL_LIMITS.markdownBytes,1024*1024)
})

test('detail has a bounded 16 MiB allowance while other native data remains at 8 MiB',async()=>{
  const limit=16*1024*1024
  const accepted=payload(limit)
  assert.equal(hash(await transportFor(accepted)({kind:'detail'})),hash(accepted))
  const oversizedReader = new OpenBknPlatformReader(config,async()=>new Response(JSON.stringify(payload(limit+1))))
  await assert.rejects(oversizedReader.readProvenanceDetailData({kind:'detail'},identity.conversationId,identity.initialInteractionId,AbortSignal.timeout(30_000)),(error:unknown)=>error instanceof PlatformReaderError && error.code==='OUTPUT_OVERFLOW')
  const reader = new OpenBknPlatformReader(config,async()=>new Response(JSON.stringify(payload(PROVENANCE_DETAIL_LIMITS.wireBytes+1))))
  for(const kind of ['conversation','rounds','explanation','history'] as const) {
    await assert.rejects(reader.readProvenanceDetailData({kind},identity.conversationId,identity.initialInteractionId,AbortSignal.timeout(30_000)),(error:unknown)=>error instanceof PlatformReaderError&&error.code==='OUTPUT_OVERFLOW')
  }
})

test('detail Remote rejects aggregate and direct results above its own 16 MiB boundary',async()=>{
  const limit=PROVENANCE_DETAIL_LIMITS.detailWireBytes
  const rejected=(events:any[])=>assert.rejects(createProvenanceDetailTransport(()=>({async *[Symbol.asyncIterator](){yield* events},dispose(){}}))({kind:'detail'}),(error:unknown)=>error instanceof ProvenanceDetailTransportError&&error.code==='result-too-large')
  await rejected([{kind:'result',value:'x'.repeat(limit+1)}])
  const events:any[]=[]
  for(let offset=0;offset<limit+1;offset+=PROVENANCE_DETAIL_LIMITS.chunkCharacters)events.push({kind:'chunk',index:events.length,encoding:'text',content:'x'.repeat(Math.min(PROVENANCE_DETAIL_LIMITS.chunkCharacters,limit+1-offset))})
  await rejected([...events,{kind:'end',chunks:events.length,encoding:'text'}])
})
