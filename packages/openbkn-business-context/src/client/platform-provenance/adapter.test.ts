import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { JsonValue } from '@deepseek-ai/dsh-util-values'
import { createPlatformProvenanceAdapter, type PlatformProvenanceTransport } from './adapter.js'
import type { ProvenanceDetailRequest } from '../../provenance-detail-types.js'

const actions = { copyText: async (_text:string) => {}, downloadMarkdown: (_id:string,_text:string) => {} }

test('platform adapter preserves original records, statuses, attempts, payloads, and derived facts', async () => {
  const input = {product:'A',quantity:0}
  const output = {rows:[{amount:0}],raw:'do not replace'}
  const raw = {interaction_id:'clicked',interaction_question:'原始问题',interaction_result:'原始模型回答',operations:[
    {operation_id:'retry',attempt:1,call_status:'failed',status:'not_evaluable',input,error:{message:'platform cause'},missing_facts:['original']},
    {operation_id:'retry',attempt:2,call_status:'completed',status:'resolved',input,output,query:{result_count:0,resources:[{id:'r',object_id:'o',object_name:'object'}]},missing_facts:[]},
  ],derived_facts:[{rule:'platform_rule',source_operation_id:'source',operation_id:'retry',element_id:'e'}]}
  const requests: ProvenanceDetailRequest[] = []
  const adapter = createPlatformProvenanceAdapter(async request => {requests.push(request);return raw as unknown as JsonValue},actions)
  const result = await adapter.readInteraction('clicked')
  assert.equal(result.interactionQuestion,'原始问题')
  assert.equal(result.interactionResult,'原始模型回答')
  assert.deepEqual(result.operations.map(value=>[value.operationId,value.attempt,value.callStatus,value.status]),[
    ['retry',1,'failed','not_evaluable'],['retry',2,'completed','resolved'],
  ])
  assert.equal(result.operations[1]?.input,input)
  assert.equal(result.operations[1]?.output,output)
  assert.equal(result.operations[1]?.query?.resultCount,0)
  assert.deepEqual(result.derivedFacts,[{rule:'platform_rule',sourceOperationId:'source',operationId:'retry',elementId:'e'}])
  assert.deepEqual(requests,[{kind:'detail',interactionId:'clicked'}])
  assert.equal(raw.operations.length,2)
})

test('platform adapter uses fixed explicit read/generation actions and carries cancellation', async () => {
  const controller = new AbortController()
  const requests: ProvenanceDetailRequest[]=[]
  const transport: PlatformProvenanceTransport = async (request,signal): Promise<JsonValue> => {
    assert.equal(signal,controller.signal)
    requests.push(request)
    if (request.kind==='conversation') return {entries:[{conversation_id:'c',interaction_count:73}],total:1}
    if (request.kind==='rounds') return {entries:[{interaction_id:'clicked',round_number:7}],total:73,partial:true,truncated:true,partial_reasons:['platform limit']}
    if (request.kind==='explanation' || request.kind==='generate') return {schema_version:'1',interaction_id:'clicked',status:'not_generated'}
    if (request.kind==='history') return {entries:[{analysis_id:'a',interaction_id:'clicked',status:'failed',failure_code:'original_reason',failure_message:'original platform reason'}]}
    return '# exact platform markdown\n'
  }
  const adapter=createPlatformProvenanceAdapter(transport,actions)
  assert.equal((await adapter.readConversation(controller.signal)).conversationId,'c')
  const page=await adapter.listInteractions({page:2,pageSize:50,keyword:'product'},controller.signal)
  assert.equal(page.entries[0]?.roundNumber,7)
  assert.deepEqual([page.partial,page.truncated,page.partialReasons],[true,true,['platform limit']])
  await adapter.readExplanation('clicked',controller.signal)
  assert.equal(await adapter.readMarkdown('clicked',controller.signal),'# exact platform markdown\n')
  assert.equal((await adapter.readAnalysisHistory('clicked',controller.signal))[0]?.failureMessage,'original platform reason')
  assert.ok(requests.every(request=>request.kind!=='generate' && request.kind!=='analyze'))
  await adapter.generateExplanation('clicked',controller.signal)
  assert.equal(requests.at(-1)?.kind,'generate')
})

test('platform adapter rejects another interaction rather than selecting or rewriting it', async () => {
  const adapter=createPlatformProvenanceAdapter(async (request): Promise<JsonValue>=>request.kind==='detail'
    ? {interaction_id:'other',operations:[]}
    : {schema_version:'1',interaction_id:'other',status:'not_generated'},actions)
  await assert.rejects(adapter.readInteraction('clicked'),/interaction mismatch/)
  await assert.rejects(adapter.readExplanation('clicked'),/unsupported explanation/)
})

test('analysis retains platform tokens, structured result, and platform error code/reason', async () => {
  const structured={conclusion:'original model text',recommendations:[{change:'original suggestion'}]}
  const transport:PlatformProvenanceTransport=async (_request,_signal,onAnalysis)=>{
    onAnalysis?.({event:'token',data:{content:'original '}})
    onAnalysis?.({event:'token',data:{content:'token'}})
    onAnalysis?.({event:'structured',data:{content:structured}})
    return null
  }
  const adapter=createPlatformProvenanceAdapter(transport,actions)
  const tokens:string[]=[]
  assert.equal(await adapter.analyze('clicked','# platform Markdown',value=>tokens.push(value)),structured)
  assert.deepEqual(tokens,['original ','token'])
  const failed=createPlatformProvenanceAdapter(async (_request,_signal,onAnalysis)=>{
    onAnalysis?.({event:'error',data:{code:'platform_unavailable',message:'platform supplied reason'}})
    return null
  },actions)
  await assert.rejects(failed.analyze('clicked','markdown',()=>{}),error=>error instanceof Error && error.message==='platform supplied reason' && 'code' in error && error.code==='platform_unavailable')
})
