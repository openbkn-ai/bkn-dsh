import assert from 'node:assert/strict'
import test from 'node:test'
import { ProvenanceDetailScope, type ProvenanceDetailReader } from '../src/provenance-detail-scope.ts'
import { PlatformReaderError } from '../src/platform-reader.ts'
import type { ProvenanceDetailRequest } from '../src/provenance-detail-types.ts'
const identity={conversationId:'conv1',initialInteractionId:'int1',knowledgeNetworkId:'kn1'}
const collect=async<T>(source:AsyncIterable<T>)=>{const values:T[]=[];for await(const value of source)values.push(value);return values}
const code=(expected:string)=>(error:unknown)=>error instanceof PlatformReaderError&&error.code===expected
const signal=()=>AbortSignal.timeout(5000)

for(const kind of ['explanation','markdown','history','generate','analyze'] as const) test(`${kind} cannot read or mutate a cross-KN record even through the trusted anchor`,async()=>{
  const calls:string[]=[]
  const reader:ProvenanceDetailReader={
    async readProvenanceDetailData(request){calls.push(request.kind);return {interaction_id:'int1',operations:[{operation_id:'op1',knowledge_network_id:'other-kn'}]}},
    async *streamProvenanceDetailAnalysis(){calls.push('analyze');yield {event:'token',data:{content:'must not happen'}}},
  }
  await assert.rejects(collect(new ProvenanceDetailScope(identity,reader).run({kind},signal())),code('INVALID_RESPONSE'))
  assert.deepEqual(calls,['detail'])
})

test('analysis submits only native platform Markdown after a complete scoped detail preflight',async()=>{
  const calls:string[]=[]
  const reader:ProvenanceDetailReader={
    async readProvenanceDetailData(request){calls.push(request.kind);return request.kind==='detail'?{interaction_id:'int1',operations:[{knowledge_network_id:'kn1'}]}:'# 平台原文\n123.450000'},
    async *streamProvenanceDetailAnalysis(id,markdown){calls.push('analyze');assert.equal(id,'int1');assert.equal(markdown,'# 平台原文\n123.450000');yield {event:'structured',data:{content:{status:'invalid',reason:'platform-original'}}}},
  }
  const events=await collect(new ProvenanceDetailScope(identity,reader).run({kind:'analyze',markdown:'browser changed business conclusion'},signal()))
  assert.deepEqual(calls,['detail','markdown','analyze'])
  assert.deepEqual(events.at(-1),{kind:'analysis',event:'structured',data:{content:{status:'invalid',reason:'platform-original'}}})
})

test('a failed detail preflight cannot be treated as a generated explanation or dispatch an action',async()=>{
  const calls:string[]=[]
  const reader:ProvenanceDetailReader={async readProvenanceDetailData(request){calls.push(request.kind);throw new PlatformReaderError('ACCESS_DENIED','bounded')},async *streamProvenanceDetailAnalysis(){calls.push('analyze')}}
  await assert.rejects(collect(new ProvenanceDetailScope(identity,reader).run({kind:'generate'},signal())),code('ACCESS_DENIED'))
  assert.deepEqual(calls,['detail'])
})

test('membership proof enforces an aggregate byte budget across otherwise admissible pages',async()=>{
  let pages=0
  const reader:ProvenanceDetailReader={
    async readProvenanceDetailData(request){assert.equal(request.kind,'rounds');pages++;return {entries:Array.from({length:50},(_,index)=>({interaction_id:`int-${pages}-${index}`,conversation_id:'conv1',question_preview:'x'.repeat(90_000)})),total:999999}},
    async *streamProvenanceDetailAnalysis(){},
  }
  await assert.rejects(collect(new ProvenanceDetailScope(identity,reader).run({kind:'detail',interactionId:'int-missing'},signal())),code('OUTPUT_OVERFLOW'))
  assert.equal(pages,2)
})

test('membership proof has a hard page ceiling and never dispatches a detail fallback',async()=>{
  let pages=0
  const reader:ProvenanceDetailReader={
    async readProvenanceDetailData(request){assert.equal(request.kind,'rounds');pages++;return {entries:Array.from({length:50},(_,index)=>({interaction_id:`int-${pages}-${index}`,conversation_id:'conv1'})),total:999999}},
    async *streamProvenanceDetailAnalysis(){},
  }
  await assert.rejects(collect(new ProvenanceDetailScope(identity,reader).run({kind:'detail',interactionId:'int-missing'},signal())),code('RECORD_NOT_DISCLOSED'))
  assert.equal(pages,100)
})

for(const interactionId of [42,null,'../../other','https://other.invalid','a?token=secret'])test(`untrusted interaction identity cannot become a route: ${interactionId}`,async()=>{
  let reads=0
  const reader:ProvenanceDetailReader={async readProvenanceDetailData(){reads++;return {}},async *streamProvenanceDetailAnalysis(){}}
  await assert.rejects(collect(new ProvenanceDetailScope(identity,reader).run({kind:'detail',interactionId} as ProvenanceDetailRequest,signal())),code('INVALID_RESPONSE'))
  assert.equal(reads,0)
})

test('history root identity is checked even when the returned entries array is empty',async()=>{
  const reader:ProvenanceDetailReader={async readProvenanceDetailData(request){return request.kind==='detail'?{interaction_id:'int1',operations:[]}:{interaction_id:'other-int',entries:[]}},async *streamProvenanceDetailAnalysis(){}}
  await assert.rejects(collect(new ProvenanceDetailScope(identity,reader).run({kind:'history'},signal())),code('INVALID_RESPONSE'))
})

for(const fields of [{kind:'other'}, {kind:'detail',url:'https://other.invalid'}, {kind:'analyze',token:'private-token'}, {kind:'analyze',markdown:{answer:'injected'}}])test(`request whitelist refuses unsupported fields before any platform dispatch: ${Object.keys(fields).join(',')}`,async()=>{
  let reads=0
  const reader:ProvenanceDetailReader={async readProvenanceDetailData(){reads++;return {}},async *streamProvenanceDetailAnalysis(){}}
  await assert.rejects(collect(new ProvenanceDetailScope(identity,reader).run(fields as ProvenanceDetailRequest,signal())),code('INVALID_RESPONSE'))
  assert.equal(reads,0)
})

test('an admitted request is snapshotted before async work and cannot change from GET to POST',async()=>{
  const calls:string[]=[]
  const reader:ProvenanceDetailReader={async readProvenanceDetailData(request){calls.push(request.kind);return {interaction_id:'int1',operations:[]}},async *streamProvenanceDetailAnalysis(){}}
  const request:{kind:'detail'|'generate'}={kind:'detail'}
  const iterator=new ProvenanceDetailScope(identity,reader).run(request,signal())[Symbol.asyncIterator]()
  assert.equal((await iterator.next()).value?.kind,'context')
  request.kind='generate'
  await collect({[Symbol.asyncIterator]:()=>iterator})
  assert.deepEqual(calls,['detail'])
})
