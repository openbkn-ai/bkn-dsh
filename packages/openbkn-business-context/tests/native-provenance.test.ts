import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { projectNativeExplanation, projectNativeDetail, NativeProjectionError } from '../src/native-provenance.ts'
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
test('not_generated and a valid empty explanation are distinct outcomes', () => {
  assert.deepEqual(projectNativeExplanation({ schema_version: '1', interaction_id: 'int-fixture', status: 'not_generated' }, 'int-fixture'), { kind: 'not-generated' })
  const x = fixture();x.view.claims = [];assert.equal(projectNativeExplanation(x, 'int-fixture').kind, 'ready')
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
