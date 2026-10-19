import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { projectNativeExplanation, projectNativeDetail, NativeProjectionError, NATIVE_PROVENANCE_LIMITS } from '../src/native-provenance.ts'
import { OpenBknPlatformReader, PlatformReaderError } from '../src/platform-reader.ts'
import { passiveDiagnostics } from '../src/diagnostics-observer.ts'
const fixture = () => JSON.parse(readFileSync(new URL('./fixtures/native-provenance-schema1.json', import.meta.url), 'utf8'))
const signal = () => AbortSignal.timeout(1000)
const config = { baseUrl: 'https://platform.invalid', maxResultBytes: 1_000_000, requestTimeoutMs: 30_000, allowInsecureTls: false, resolveToken: async () => 'host-only-test-token' }
test('schema 1 projection retains disclosed gaps and removes payloads, offsets and unknown fields', () => {
  const input = fixture(); input.view.claims[0].answerRange = { start: 0, end: 1, exact: 'x' };input.view.credential = 'MUST-NOT-CROSS'
  const result = projectNativeExplanation(input, 'int-fixture')
  assert.equal(result.kind, 'ready'); if (result.kind !== 'ready') return
  assert.equal(result.view.evidence.edges[0].target, 'not-disclosed')
  assert.equal(result.view.evidence.nodes.some(node => node.id === 'not-disclosed'), false)
  assert.equal(result.view.claims[0].status, 'candidate')
  assert.equal(result.view.evidenceStatus, 'partial')
  assert.doesNotMatch(JSON.stringify(result), /MUST-NOT-CROSS|answerRange|inline/)
})
test('identity/schema/text/enum/duplicate refusals never accept a partial parsed explanation', () => {
  for (const change of [
    (x: any) => { x.interaction_id = 'other' }, (x: any) => { x.view.interactionId = 'other' },
    (x: any) => { x.schema_version = '2' }, (x: any) => { x.view.answer = {} },
    (x: any) => { x.view.claims[0].status = 'confirmed-by-plugin' },
    (x: any) => { x.view.claims.push(x.view.claims[0]) },
    (x: any) => { x.view.evidence.nodes.push(x.view.evidence.nodes[0]) },
    (x: any) => { x.view.evidence.edges.push(x.view.evidence.edges[0]) },
    (x: any) => { x.view.selectedPairGraphs.p1.businessFunctions.push(x.view.selectedPairGraphs.p1.businessFunctions[0]) },
  ]) { const x = fixture(); change(x); assert.throws(() => projectNativeExplanation(x, 'int-fixture'), NativeProjectionError) }
})
test('byte and aggregate graph budgets refuse overflow rather than silently truncating', () => {
  assert.throws(() => projectNativeExplanation(fixture(), 'int-fixture', 10), (e: any) => e.reason === 'result-too-large')
  const x = fixture();x.view.evidence.nodes = Array.from({ length: 500 }, (_,i) => ({ id: `n${i}`,label: 'N',kind: 'source' }))
  assert.throws(() => projectNativeExplanation(x, 'int-fixture'), (e: any) => e.reason === 'result-too-large')
})
test('duplicate explanation rail IDs reject the whole projection without selecting or renaming an attempt',()=>{
  const input=fixture();const event=input.view.timeRail[0]
  input.view.timeRail=[event,{...event,attempt:event.attempt+1}]
  const before=JSON.stringify(input)
  assert.throws(()=>projectNativeExplanation(input,'int-fixture'),(error:any)=>error instanceof NativeProjectionError && error.reason==='invalid-response')
  assert.equal(JSON.stringify(input),before)
})
test('platform invalid and unfamiliar validation states remain valid read-only records with their raw reasons',()=>{
  for(const status of ['invalid','candidate','verified','future-platform-status']) {
    const input=fixture();const graph=input.view.selectedPairGraphs.p1
    graph.businessFunctions[0].validationStatus=status;graph.businessFunctions[0].reasonCode='raw_function_reason'
    graph.edges[0].validationStatus=status;graph.edges[0].reasonCode='raw_edge_reason'
    const before=JSON.stringify(input);const result=projectNativeExplanation(input,'int-fixture')
    assert.equal(result.kind,'ready');if(result.kind!=='ready')continue
    assert.equal(result.view.selectedPairGraphs!.p1.businessFunctions[0].validationStatus,status)
    assert.equal(result.view.selectedPairGraphs!.p1.businessFunctions[0].reasonCode,'raw_function_reason')
    assert.equal(result.view.selectedPairGraphs!.p1.edges[0].validationStatus,status)
    assert.equal(result.view.selectedPairGraphs!.p1.edges[0].reasonCode,'raw_edge_reason')
    assert.equal(JSON.stringify(input),before)
  }
})
test('not_generated and a valid empty explanation are distinct outcomes', () => {
  assert.deepEqual(projectNativeExplanation({ schema_version: '1', interaction_id: 'int-fixture', status: 'not_generated' }, 'int-fixture'), { kind: 'not-generated' })
  const x = fixture();x.view.claims = [];x.view.requirements = [];x.view.questionPairs = [];x.view.selectedPairGraphs = {};x.view.evidence = {nodes:[],edges:[]};x.view.execution = {nodes:[],edges:[]}
  const result = projectNativeExplanation(x, 'int-fixture')
  assert.equal(result.kind, 'ready')
  if (result.kind === 'ready') { assert.deepEqual(result.view.claims, []); assert.deepEqual(result.view.questionPairs, []) }
})

test('not-generated obeys the exact byte cap including tiny budgets', () => {
  const input = { schema_version:'1', interaction_id:'int-fixture', status:'not_generated' }
  const result = projectNativeExplanation(input, 'int-fixture')
  const bytes = Buffer.byteLength(JSON.stringify(result))
  assert.deepEqual(projectNativeExplanation(input, 'int-fixture', bytes), result)
  for (const limit of [1, 10, bytes - 1]) {
    assert.throws(() => projectNativeExplanation(input, 'int-fixture', limit), (error: any) => error.reason === 'result-too-large')
  }
})
test('detail identity is validated and inline time-rail payloads are never projected', () => {
  const x = { interaction_id:'int-fixture',interaction_question:'Question',time_rail:fixture().view.timeRail }
  assert.doesNotMatch(JSON.stringify(projectNativeDetail(x, 'int-fixture')), /MUST-NOT-CROSS|inline/)
  assert.throws(() => projectNativeDetail(x, 'other'), NativeProjectionError)
})
test('native reader uses only exact GET routes with Host credentials and never generates explanations', async () => {
  const calls: { url: string; method: string | undefined; authorization: unknown }[] = []
  const reader = new OpenBknPlatformReader(config, async (url, init) => {
    calls.push({ url: url.pathname, method: init.method, authorization: (init.headers as Record<string,string>).authorization })
    return new Response(JSON.stringify(fixture()))
  })
  await reader.getNativeInteractionExplanation('int-fixture',signal())
  assert.deepEqual(calls,[{url:'/api/agent-observability/v1/business-provenance/interactions/int-fixture/explanations',method:'GET',authorization:'Bearer host-only-test-token'}])
})
test('native 401/403/404 stay distinct and never imply a license cause', async () => {
  for (const [status, code] of [[401,'AUTHENTICATION_REQUIRED'],[403,'ACCESS_DENIED'],[404,'NATIVE_NOT_AVAILABLE']] as const) {
    const reader = new OpenBknPlatformReader(config,async () => new Response('{"error":{"code":"permission_denied"}}',{status}))
    await assert.rejects(reader.getNativeInteractionExplanation('int-fixture',signal()), (e: unknown) => e instanceof PlatformReaderError && e.code === code)
  }
})
test('invalid native response is observed as failure; success on another subject cannot clear it', async () => {
  passiveDiagnostics.clear()
  const reader = new OpenBknPlatformReader(config,async url => new Response(JSON.stringify(url.pathname.endsWith('/explanations') ? {...fixture(), interaction_id:'other'} : {interaction_id:'int-fixture',time_rail:[]})))
  await assert.rejects(reader.getNativeInteractionExplanation('int-fixture',signal()))
  await reader.getNativeInteractionDetail('int-fixture',signal())
  const observed = passiveDiagnostics.snapshot()
  assert.equal(observed.find(item => item.id === 'observed:platform-native-explanations')?.status,'fail')
  assert.equal(observed.find(item => item.id === 'observed:platform-native-detail')?.status,'pass')
})

test('native reader refuses path-like identifiers and missing credentials before dispatch', async () => {
  let dispatched = 0
  const reader = new OpenBknPlatformReader({...config, resolveToken: async () => undefined},async () => { dispatched++; return new Response('{}') })
  await assert.rejects(reader.getNativeInteractionDetail('..',signal()), (e: unknown) => e instanceof PlatformReaderError && e.code === 'INVALID_RESPONSE')
  await assert.rejects(reader.getNativeInteractionExplanation('int-fixture',signal()), (e: unknown) => e instanceof PlatformReaderError && e.code === 'AUTHENTICATION_REQUIRED')
  assert.equal(dispatched,0)
})

test('record-integrity gaps and failed checks remain explicit in the detail projection', () => {
  const result = projectNativeDetail({ interaction_id:'int-fixture',time_rail:[],record_integrity_check_failed:true,current_record_integrity:{status:'missing',checked_at:'2026-10-18T00:00:00Z',scope:'registered_call_records',missing:[{operation_id:'op1',attempt:1,reason:'record_content_missing',field:'output'}]} },'int-fixture')
  assert.equal(result.recordIntegrityCheckFailed,true)
  assert.equal(result.recordIntegrity?.missing[0].reason,'record_content_missing')
})

test('ready projections enforce exact UTF-8 byte budgets rather than character counts', () => {
  const x = fixture(); x.view.answer = '中文🙂'
  for (const project of [
    (cap?: number) => projectNativeExplanation(x, 'int-fixture', cap),
    (cap?: number) => projectNativeDetail({interaction_id:'int-fixture',interaction_result:'中文🙂',time_rail:[]}, 'int-fixture', cap),
  ]) {
    const result = project(); const bytes = Buffer.byteLength(JSON.stringify(result))
    assert.deepEqual(project(bytes), result)
    assert.throws(() => project(bytes - 1), (error: any) => error.reason === 'result-too-large')
  }
})

test('raising the configured cap cannot raise the native reader ceiling above one million bytes', async () => {
  const input=fixture();input.view.notices=Array.from({length:64},()=> 'x'.repeat(16_384))
  assert.equal(projectNativeExplanation(input,'int-fixture',2_000_000).kind,'ready')
  assert.throws(()=>projectNativeExplanation(input,'int-fixture'),(error:any)=>error.reason==='result-too-large')
  const reader=new OpenBknPlatformReader({...config,maxResultBytes:2_000_000},async()=>new Response(JSON.stringify(input)))
  await assert.rejects(reader.getNativeInteractionExplanation('int-fixture',signal()),(error:any)=>error.code==='OUTPUT_OVERFLOW')
})

test('individual display text accepts 16384 UTF-16 units and refuses the next unit', () => {
  const x = fixture(); x.view.answer = '🙂'.repeat(8192)
  assert.equal(projectNativeExplanation(x, 'int-fixture').kind, 'ready')
  x.view.answer += 'x'
  assert.throws(() => projectNativeExplanation(x, 'int-fixture'), (error: any) => error.reason === 'result-too-large')
})

for (const dimension of ['nodes', 'edges'] as const) {
  test(`aggregate ${dimension} include top-level and selected-pair graphs at the exact limit`, () => {
    const x = fixture()
    x.view.execution = {nodes:[],edges:[]}; x.view.evidence = {nodes:[],edges:[]}
    const pair = x.view.selectedPairGraphs.p1
    pair.evidenceNodes = []; pair.schemaNodes = []; pair.edges = []
    const limit = NATIVE_PROVENANCE_LIMITS[dimension]
    const item = (i: number) => dimension === 'nodes' ? {id:`n${i}`,label:'N',kind:'source'} : {id:`e${i}`,source:'undisclosed',target:'also-undisclosed',label:'E'}
    x.view.evidence[dimension] = Array.from({length:limit - 1}, (_, i) => item(i))
    if (dimension === 'nodes') pair.schemaNodes.push(item(limit))
    else pair.edges.push({edgeId:'pair-edge',kind:'support',fromId:'undisclosed',toId:'also-undisclosed',operationIds:[],validationStatus:'candidate'})
    assert.equal(projectNativeExplanation(x, 'int-fixture').kind, 'ready')
    x.view.execution[dimension].push(item(limit + 1))
    assert.throws(() => projectNativeExplanation(x, 'int-fixture'), (error: any) => error.reason === 'result-too-large')
  })
}

const arrayCases: {name:string; limit:number; set:(x:any, count:number)=>void}[] = [
  {name:'requirements',limit:64,set:(x,n)=>{x.view.requirements=Array.from({length:n},(_,i)=>({id:`r${i}`,label:'R',status:'missing',claimIds:[]}))}},
  {name:'claims',limit:256,set:(x,n)=>{x.view.claims=Array.from({length:n},(_,i)=>({id:`c${i}`,label:'C',status:'candidate',nodeIds:[]}))}},
  {name:'question pairs',limit:64,set:(x,n)=>{x.view.questionPairs=Array.from({length:n},(_,i)=>({id:`p${i}`,question:'Q',answer:'A',summary:'S',status:'partial',claimIds:[]}))}},
  {name:'pair graphs',limit:64,set:(x,n)=>{x.view.selectedPairGraphs=Object.fromEntries(Array.from({length:n},(_,i)=>[`p${i}`,{claims:[],evidenceNodes:[],schemaNodes:[],businessFunctions:[],executionSteps:[],edges:[]}]))}},
  {name:'time rail',limit:500,set:(x,n)=>{x.view.timeRail=Array.from({length:n},(_,i)=>({...x.view.timeRail[0],id:`t${i}`}))}},
  {name:'notices',limit:128,set:(x,n)=>{x.view.notices=Array.from({length:n},()=> 'Notice')}},
  {name:'business inputs',limit:128,set:(x,n)=>{x.view.selectedPairGraphs.p1.businessFunctions[0].businessInputs=Array.from({length:n},()=>({name:'Input',value:'V'}))}},
  {name:'business outputs',limit:128,set:(x,n)=>{x.view.selectedPairGraphs.p1.businessFunctions[0].businessOutputs=Array.from({length:n},()=>({summary:'Output',evidenceRefs:[],adoptedRowRefs:[]}))}},
]
for (const {name,limit,set} of arrayCases) {
  test(`${name} accepts its array limit and refuses limit plus one`, () => {
    const x = fixture(); set(x, limit)
    assert.equal(projectNativeExplanation(x, 'int-fixture').kind, 'ready')
    const overflow = fixture(); set(overflow, limit + 1)
    assert.throws(() => projectNativeExplanation(overflow, 'int-fixture'), (error: any) => error.reason === 'result-too-large')
  })
}

for (const method of ['getNativeInteractionDetail', 'getNativeInteractionExplanation'] as const) {
  test(`${method} uses the exact fixed GET route and Host credential`, async () => {
    const calls: {path:string;method:unknown;authorization:unknown}[] = []
    const reader = new OpenBknPlatformReader(config, async (url, init) => {
      calls.push({path:url.pathname,method:init.method,authorization:(init.headers as Record<string,string>).authorization})
      return new Response(JSON.stringify(method === 'getNativeInteractionDetail' ? {interaction_id:'int-fixture',time_rail:[]} : fixture()))
    })
    await reader[method]('int-fixture', signal())
    assert.deepEqual(calls, [{path:`/api/agent-observability/v1/business-provenance/interactions/int-fixture${method.endsWith('Explanation') ? '/explanations' : ''}`,method:'GET',authorization:'Bearer host-only-test-token'}])
  })

  test(`${method} bounds header-less wire bytes at 8 MiB and cancels an overflowing stream`, async () => {
    const wireLimit = NATIVE_PROVENANCE_LIMITS.wireBytes
    const body = JSON.stringify(method === 'getNativeInteractionDetail' ? {interaction_id:'int-fixture',time_rail:[]} : fixture())
    for (const extra of [0, 1]) {
      const bytes = new TextEncoder().encode(body + ' '.repeat(wireLimit - Buffer.byteLength(body) + extra))
      let cancelled = false
      // Leave the oversize stream open so cancellation is observable.
      const stream = new ReadableStream<Uint8Array>({start(c){c.enqueue(bytes);if (!extra) c.close()},cancel(){cancelled=true}})
      const reader = new OpenBknPlatformReader(config, async () => new Response(stream))
      if (extra) { await assert.rejects(reader[method]('int-fixture', signal()), (error:any)=>error.code==='OUTPUT_OVERFLOW');assert.equal(cancelled,true) }
      else await reader[method]('int-fixture', signal())
    }
  })

  test(`${method} maps malformed JSON, 5xx and transport failures to controlled errors`, async () => {
    for (const [fetcher,code] of [
      [async()=>new Response('{bad-json'), 'INVALID_RESPONSE'],
      [async()=>new Response('private upstream failure',{status:503}), 'PLATFORM_UNAVAILABLE'],
      [async()=>{throw new Error('private transport detail')}, 'PLATFORM_UNAVAILABLE'],
    ] as const) {
      const reader = new OpenBknPlatformReader(config, fetcher)
      await assert.rejects(reader[method]('int-fixture', signal()), (error:any)=>error.code===code && !error.message.includes('private'))
    }
  })
}

test('both native GETs use an independent 30-second timeout and forward explicit cancellation', async t => {
  const original = AbortSignal.timeout.bind(AbortSignal); const requested:number[] = []
  t.mock.method(AbortSignal, 'timeout', (ms:number) => {requested.push(ms);return original(ms === 30_000 ? 5 : ms)})
  const alive = setInterval(()=>{}, 1000)
  try {
    for (const method of ['getNativeInteractionDetail','getNativeInteractionExplanation'] as const) {
      for (const cancel of [false,true]) {
        const abort = new AbortController();let requestSignal:AbortSignal|undefined
        const reader = new OpenBknPlatformReader({...config,requestTimeoutMs:1}, async (_url,init) => {
          requestSignal = init.signal as AbortSignal
          if (cancel) abort.abort()
          return new Promise<Response>((_resolve,reject) => {
            if (requestSignal!.aborted) reject(requestSignal!.reason)
            else requestSignal!.addEventListener('abort',()=>reject(requestSignal!.reason),{once:true})
          })
        })
        await assert.rejects(reader[method]('int-fixture', abort.signal), (error:any)=>error.code===(cancel?'REQUEST_ABORTED':'PLATFORM_UNAVAILABLE'))
        assert.equal(requestSignal?.aborted,true)
      }
    }
    assert.deepEqual(requested,[30_000,30_000,30_000,30_000])
  } finally {clearInterval(alive)}
})
