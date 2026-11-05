import assert from 'node:assert/strict'
import test from 'node:test'
import { OpenBknPlatformReader, PlatformReaderError } from '../src/platform-reader.ts'
import { PROVENANCE_DETAIL_LIMITS } from '../src/provenance-detail-types.ts'

const config = { baseUrl: 'https://platform.invalid', requestTimeoutMs: 1000, maxResultBytes: 1024, allowInsecureTls: false, businessDomain: 'bd-bound', resolveToken: async () => 'private-credential' }
const signal = () => AbortSignal.timeout(5000)
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } })
const collect = async <T>(items: AsyncIterable<T>): Promise<T[]> => { const result: T[] = []; for await (const item of items) result.push(item); return result }
const code = (expected: string) => (error: unknown) => error instanceof PlatformReaderError && error.code === expected && !error.message.includes('private-credential')

test('native display reads use only fixed scoped GET routes and preserve original platform records above the old display cap', async () => {
  const requests: Array<{ url: URL; init: RequestInit }> = []
  const raw = { interaction_id: 'int-67', time_rail: [{ id: 'rail1', payload: { mode: 'omitted', reason: 'platform-original', reference: 'https://untrusted.invalid/raw' } }], operations: [{ operation_id: 'same', attempt: 1, input: '123.450000', output: 'x'.repeat(150_000), status: 'invalid', error: { reason: 'platform-invalid' } }] }
  const reader = new OpenBknPlatformReader(config, async (url, init) => { requests.push({ url, init }); return url.pathname.endsWith('/markdown') ? new Response('# 原始 Markdown\n123.450000') : json(raw) })
  for (const kind of ['conversation', 'rounds', 'detail', 'explanation', 'history', 'markdown'] as const) {
    const result = await reader.readProvenanceDetailData({ kind, keyword: '测试 / ?' }, 'conv-exact', 'int-67', signal())
    assert.deepEqual(result, kind === 'markdown' ? '# 原始 Markdown\n123.450000' : raw)
  }
  assert.equal(requests.length, 6)
  assert.ok(requests.every(item => item.init.method === undefined || item.init.method === 'GET'))
  assert.deepEqual(requests.map(item => item.url.pathname), [
    '/api/agent-observability/v1/business-provenance/conversations', '/api/agent-observability/v1/business-provenance/interactions',
    '/api/agent-observability/v1/business-provenance/interactions/int-67', '/api/agent-observability/v1/business-provenance/interactions/int-67/explanations',
    '/api/agent-observability/v1/business-provenance/interactions/int-67/analysis', '/api/agent-observability/v1/business-provenance/interactions/int-67/markdown',
  ])
  assert.equal(requests[0].url.searchParams.get('conversation_id'), 'conv-exact')
  assert.equal(requests[1].url.searchParams.get('keyword'), '测试 / ?')
  for (const item of requests) {
    assert.equal(item.init.redirect, 'error')
    assert.equal(new Headers(item.init.headers).get('authorization'), 'Bearer private-credential')
    assert.equal(new Headers(item.init.headers).get('x-business-domain'), 'bd-bound')
    assert.ok(!item.url.href.includes('private-credential'))
  }
})

test('generation is a fixed explicit POST, and a scene guard after credential resolution prevents stale mutation', async () => {
  const requests: RequestInit[] = []
  const reader = new OpenBknPlatformReader(config, async (_url, init) => { requests.push(init); return json({ status: 'not_generated' }) })
  await reader.readProvenanceDetailData({ kind: 'generate' }, 'conv-1', 'int-1', signal())
  assert.equal(requests[0].method, 'POST'); assert.equal(requests[0].body, '{}')
  for (const action of ['generate', 'analyze'] as const) {
    let release!: () => void
    const waiting = new Promise<void>(resolve => { release = resolve })
    let live = true, fetches = 0
    const delayed = new OpenBknPlatformReader({ ...config, resolveToken: async () => { await waiting; return 'private-credential' } }, async () => { fetches++; return json({}) })
    const guard = () => { if (!live) throw new PlatformReaderError('INVALID_RESPONSE', 'Scene changed.') }
    const pending = action === 'generate'
      ? delayed.readProvenanceDetailData({kind:'generate'}, 'conv-1', 'int-1', signal(), guard)
      : collect(delayed.streamProvenanceDetailAnalysis('int-1', '# original', signal(), guard))
    live = false; release()
    await assert.rejects(pending, code('INVALID_RESPONSE'))
    assert.equal(fetches, 0)
  }
})

test('analysis preserves token, structured output and platform error events across CRLF and UTF-8 chunk boundaries', async () => {
  const frames = 'event: token\r\ndata: {"content":"原文😀"}\r\n\r\nevent: structured\r\ndata: {"content":{"status":"invalid","reason":"platform-original"}}\r\n\r\n'
  const bytes = new TextEncoder().encode(frames)
  let request: RequestInit | undefined
  const reader = new OpenBknPlatformReader(config, async (_url, init) => {
    request = init
    return new Response(new ReadableStream({ start(controller) { for (let index = 0; index < bytes.length; index += 3) controller.enqueue(bytes.slice(index, index + 3)); controller.close() } }), { headers: { 'content-type': 'text/event-stream; charset=utf-8' } })
  })
  assert.deepEqual(await collect(reader.streamProvenanceDetailAnalysis('int-1', '# 平台原文\n123.450000', signal())), [
    { event: 'token', data: { content: '原文😀' } }, { event: 'structured', data: { content: { status: 'invalid', reason: 'platform-original' } } },
  ])
  assert.deepEqual(JSON.parse(String(request?.body)), {markdown:'# 平台原文\n123.450000'})
  assert.equal(request?.redirect, 'error')
  const errorReader = new OpenBknPlatformReader(config, async () => new Response('event: error\ndata: {"message":"平台原始原因","code":"platform_reason"}\n\n', {headers:{'content-type':'text/event-stream'}}))
  assert.deepEqual(await collect(errorReader.streamProvenanceDetailAnalysis('int-1', 'raw', signal())), [{event:'error',data:{message:'平台原始原因',code:'platform_reason'}}])
})

for (const frame of [
  'event: token\ndata: {"content":"only delta"}\n\n',
  'event: structured\ndata: {"content":[]}\n\n',
  'event: structured\ndata: {"content":null}\n\n',
  'event: token\ndata: {"content":42}\n\n',
  'event: unknown\ndata: {}\n\n',
  'event: structured\ndata: invalid\n\n',
]) test(`analysis refuses incomplete or malformed native frames: ${frame.slice(0, 25)}`, async () => {
  const reader = new OpenBknPlatformReader(config, async () => new Response(frame, {headers:{'content-type':'text/event-stream'}}))
  await assert.rejects(collect(reader.streamProvenanceDetailAnalysis('int-1', 'raw', signal())), code('INVALID_RESPONSE'))
})

for (const [status, expected] of [[401,'AUTHENTICATION_REQUIRED'],[403,'ACCESS_DENIED'],[404,'NATIVE_NOT_AVAILABLE'],[302,'PLATFORM_UNAVAILABLE']] as const) test(`native action safely classifies HTTP ${status}`, async () => {
  const reader = new OpenBknPlatformReader(config, async () => json({secret:'private-credential'},status))
  await assert.rejects(reader.readProvenanceDetailData({kind:'detail'},'conv-1','int-1',signal()),code(expected))
  await assert.rejects(collect(reader.streamProvenanceDetailAnalysis('int-1','raw',signal())),code(expected))
})

test('analysis and Markdown enforce independent byte budgets and cancel oversized streams', async () => {
  let cancelled = 0
  const reader = new OpenBknPlatformReader(config, async () => new Response(new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('x'.repeat(PROVENANCE_DETAIL_LIMITS.wireBytes + 1))) }, cancel() { cancelled++ } }), { headers:{'content-type':'text/event-stream'} }))
  await assert.rejects(collect(reader.streamProvenanceDetailAnalysis('int-1','raw',signal())),code('OUTPUT_OVERFLOW'))
  assert.equal(cancelled,1)
  const markdown = new OpenBknPlatformReader(config, async () => new Response('x'.repeat(PROVENANCE_DETAIL_LIMITS.markdownBytes + 1)))
  await assert.rejects(markdown.readProvenanceDetailData({kind:'markdown'},'conv-1','int-1',signal()),code('OUTPUT_OVERFLOW'))
})

test('cancelling a pending analysis read closes its body and returns only a classified cancellation', async () => {
  const controller = new AbortController()
  let cancelled = 0
  const reader = new OpenBknPlatformReader(config, async () => new Response(new ReadableStream({ cancel() { cancelled++ } }), {headers:{'content-type':'text/event-stream'}}))
  const pending = collect(reader.streamProvenanceDetailAnalysis('int-1','raw',controller.signal))
  setTimeout(() => controller.abort(new Error('private-credential must stay Host-only')), 10)
  await assert.rejects(pending,code('REQUEST_ABORTED'))
  assert.equal(cancelled,1)
})
