import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { ProvenanceDetailScope, type ProvenanceDetailReader } from '../src/provenance-detail-scope.ts'
import type { ProvenanceDetailEvent, ProvenanceDetailRequest } from '../src/provenance-detail-types.ts'

const fixture=JSON.parse(await readFile(new URL('./fixtures/provenance-parity/conversation.json',import.meta.url),'utf8'))
const anchor=fixture.identity.initialInteractionId
const signal=()=>new AbortController().signal
async function collect(scope:ProvenanceDetailScope,request:ProvenanceDetailRequest) { const result:ProvenanceDetailEvent[]=[];for await(const event of scope.run(request,signal()))result.push(event);return result }
function setup(options:{partial?:boolean; foreignList?:boolean; foreignDetail?:boolean; guard?:()=>void|Promise<void>}={}) {
  const calls:{request:ProvenanceDetailRequest;conversationId:string;interactionId:string}[]=[]
  const analyzed:{id:string;markdown:string}[]=[]
  const reader:ProvenanceDetailReader={
    async readProvenanceDetailData(request,conversationId,interactionId) {
      calls.push({request:structuredClone(request),conversationId,interactionId})
      if(request.kind==='rounds') {
        const page=request.page??1,size=request.pageSize??50
        const entries=fixture.rounds.slice((page-1)*size,page*size).map((row:object)=>({...row,...(options.foreignList?{conversation_id:'conv-foreign'}:{})}))
        return {entries,total:73,...(options.partial?{partial:true,truncated:true}:{})}
      }
      if(request.kind==='detail')return {...structuredClone(fixture.details[anchor]),interaction_id:interactionId,...(options.foreignDetail?{conversation_id:'conv-foreign'}:{})}
      if(request.kind==='explanation'||request.kind==='generate')return structuredClone(fixture.explanations[anchor])
      if(request.kind==='markdown')return fixture.markdown[anchor]
      if(request.kind==='history')return {entries:fixture.history[anchor]}
      return {entries:[fixture.conversation],total:1}
    },
    async *streamProvenanceDetailAnalysis(id,markdown) {
      analyzed.push({id,markdown})
      yield {event:'token',data:{content:'平台原文'}}
      yield {event:'structured',data:{content:{status:'invalid',reasonCode:'platform-original'}}}
    },
  }
  return {scope:new ProvenanceDetailScope(fixture.identity,reader,options.guard),calls,analyzed}
}

test('trusted answer anchor reads directly outside the first 50 and retains all platform payload, invalid and reason fields',async()=>{
  const {scope,calls}=setup()
  const detail=await collect(scope,{kind:'detail'})
  assert.deepEqual(detail.find(event=>event.kind==='result'),{kind:'result',value:fixture.details[anchor]})
  const explanation=await collect(scope,{kind:'explanation'})
  assert.deepEqual(explanation.find(event=>event.kind==='result'),{kind:'result',value:fixture.explanations[anchor]})
  assert.equal(calls.some(call=>call.request.kind==='rounds'),false)
  assert.equal(calls.some(call=>call.request.kind==='generate'||call.request.kind==='analyze'),false)
})

test('switching to another current-conversation round verifies all required pages before fetching detail',async()=>{
  const {scope,calls}=setup()
  const selected='int-parity-008'
  await collect(scope,{kind:'detail',interactionId:selected})
  assert.deepEqual(calls.filter(call=>call.request.kind==='rounds').map(call=>call.request.page),[1,2])
  assert.equal(calls.at(-1)?.interactionId,selected)
  assert.ok(calls.every(call=>call.conversationId===fixture.identity.conversationId))
})

test('partial or truncated membership never fetches an unverified round or falls back to a different one',async()=>{
  const {scope,calls}=setup({partial:true})
  await assert.rejects(collect(scope,{kind:'detail',interactionId:'int-parity-008'}), (error:unknown)=>error instanceof Error && 'code' in error && error.code==='RECORD_NOT_DISCLOSED')
  assert.deepEqual(calls.map(call=>call.request.kind),['rounds'])
})

test('foreign conversation membership and foreign detail identities are rejected without changing original data',async()=>{
  const list=setup({foreignList:true})
  await assert.rejects(collect(list.scope,{kind:'detail',interactionId:'int-parity-068'}))
  assert.equal(list.calls.some(call=>call.request.kind==='detail'),false)
  const detail=setup({foreignDetail:true})
  await assert.rejects(collect(detail.scope,{kind:'detail'}))
  assert.equal(fixture.details[anchor].conversation_id,undefined)
})

test('analysis is an explicit request and uses platform Markdown instead of browser-provided business text',async()=>{
  const {scope,calls,analyzed}=setup()
  await collect(scope,{kind:'detail'})
  assert.equal(analyzed.length,0)
  const events=await collect(scope,{kind:'analyze',markdown:'FORGED browser output'})
  assert.deepEqual(analyzed,[{id:anchor,markdown:fixture.markdown[anchor]}])
  assert.deepEqual(events.filter(event=>event.kind==='analysis').map(event=>event.data),[{content:'平台原文'},{content:{status:'invalid',reasonCode:'platform-original'}}])
  assert.ok(calls.some(call=>call.request.kind==='markdown'))
})

test('identity invalidation after a read rejects its stale payload instead of emitting a result',async()=>{
  let checks=0
  const {scope}=setup({guard(){if(++checks===3)throw new Error('changed identity')}})
  const emitted:ProvenanceDetailEvent[]=[]
  await assert.rejects(async()=>{for await(const event of scope.run({kind:'detail'},signal()))emitted.push(event)})
  assert.equal(emitted.some(event=>event.kind==='result'),false)
})
