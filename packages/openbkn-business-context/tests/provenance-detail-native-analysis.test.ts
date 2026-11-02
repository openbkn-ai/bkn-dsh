import assert from 'node:assert/strict'
import test from 'node:test'
import { OpenBknPlatformReader, PlatformReaderError } from '../src/platform-reader.ts'
import { ProvenanceDetailScope, type ProvenanceDetailReader } from '../src/provenance-detail-scope.ts'

// OpenBKN 0.2.0 EE businessprovenance/http.go:618-668 forwards these native
// control frames; :724-727 writes comment-only keepalives between events.
const events = [
  { event: 'meta', data: { analysis_id: 'analysis-original', status: 'running' } },
  { event: 'token', data: { content: '平台原文😀123.450000' } },
  { event: 'tool_call', data: { id: 'tool-original', name: 'platform-tool', arguments: { raw: '123.450000' }, platform_future_field: { status: 'invalid', reason: 'platform-original' } } },
  { event: 'meta', data: { phase: 'platform-original-phase', opaque: { value: null } } },
  { event: 'structured', data: { analysis_id: 'analysis-original', content: { decision: 'no_change', summary: '平台原文', recommendations: [] } } },
  { event: 'done', data: { analysis_id: 'analysis-original', status: 'completed' } },
] as const
const wire = ': keepalive\r\n\r\n' + events.map(event => `event: ${event.event}\r\ndata: ${JSON.stringify(event.data)}\r\n\r\n: keepalive\r\n\r\n`).join('')
const config = { baseUrl: 'https://controlled.invalid', requestTimeoutMs: 1000, maxResultBytes: 1024, allowInsecureTls: false, resolveToken: async () => 'controlled-token' }
const collect = async <T>(source: AsyncIterable<T>) => { const result: T[] = []; for await (const value of source) result.push(value); return result }
const identity = { conversationId: 'conv1', initialInteractionId: 'int1', knowledgeNetworkId: 'kn1' }

test('native analysis Reader preserves meta → token → tool_call → structured → done with comment heartbeats', async () => {
  const bytes = new TextEncoder().encode(wire)
  const reader = new OpenBknPlatformReader(config, async () => new Response(new ReadableStream({ start(controller) {
    for (let index = 0; index < bytes.length; index += 3) controller.enqueue(bytes.slice(index, index + 3))
    controller.close()
  } }), { headers: { 'content-type': 'text/event-stream; charset=utf-8' } }))
  assert.deepEqual(await collect(reader.streamProvenanceDetailAnalysis('int1', '# 平台原文', AbortSignal.timeout(2000))), events)
})

test('native analysis Scope preserves every known control event and platform status without interpreting it', async () => {
  const calls: string[] = []
  const reader: ProvenanceDetailReader = {
    async readProvenanceDetailData(request) { calls.push(request.kind); return request.kind === 'detail' ? { interaction_id: 'int1', operations: [{ knowledge_network_id: 'kn1' }] } : '# 平台原文' },
    async *streamProvenanceDetailAnalysis() { calls.push('analyze'); for (const event of events) yield JSON.parse(JSON.stringify(event)) },
  }
  const output = await collect(new ProvenanceDetailScope(identity, reader).run({kind:'analyze'}, AbortSignal.timeout(2000)))
  assert.deepEqual(calls, ['detail', 'markdown', 'analyze'])
  assert.deepEqual(output.filter(item => item.kind === 'analysis'), events.map(event => ({kind:'analysis', ...event})))
})

test('native analysis still refuses unknown event names instead of turning them into a completed result', async () => {
  const reader = new OpenBknPlatformReader(config, async () => new Response('event: platform_unknown\ndata: {"status":"completed"}\n\n', { headers: { 'content-type':'text/event-stream' } }))
  await assert.rejects(collect(reader.streamProvenanceDetailAnalysis('int1', 'raw', AbortSignal.timeout(2000))), (error: unknown) => error instanceof PlatformReaderError && error.code === 'INVALID_RESPONSE')
})
