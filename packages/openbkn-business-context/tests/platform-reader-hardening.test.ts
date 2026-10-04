import assert from 'node:assert/strict'
import test from 'node:test'

import { OpenBknPlatformReader, PlatformReaderError, type PlatformFetch } from '../src/platform-reader.ts'

const config = {
  baseUrl: 'http://localhost:8081',
  requestTimeoutMs: 1_000,
  maxResultBytes: 1024,
  allowInsecureTls: false,
  resolveToken: async () => 'token',
}

test('caps a header-less streamed body at the byte limit', async () => {
  const huge = 'x'.repeat(9 * 1024 * 1024)
  let cancelled = false
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(huge))
    },
    cancel() { cancelled = true },
  })
  const reader = new OpenBknPlatformReader(config, (async () => new Response(stream, {
    status: 200,
    headers: { 'content-type': 'text/plain' }, // no content-length on purpose
  })) as unknown as PlatformFetch)
  await assert.rejects(
    reader.getInteractionBusinessGraph('int-1', AbortSignal.timeout(5_000)),
    (error: unknown) => error instanceof PlatformReaderError && error.code === 'OUTPUT_OVERFLOW',
  )
  assert.equal(cancelled, true, 'the oversized stream must be cancelled, not drained')
})

test('does not follow redirects on fixed control-plane routes', async () => {
  const reader = new OpenBknPlatformReader(config, (async () => new Response(null, {
    status: 302,
    headers: { location: 'https://elsewhere.example/' },
  })) as unknown as PlatformFetch)
  await assert.rejects(
    reader.listKnowledgeNetworks(AbortSignal.timeout(1_000)),
    (error: unknown) => error instanceof PlatformReaderError && error.code === 'PLATFORM_UNAVAILABLE',
  )
})

test('rejects a malformed businessDomain before it reaches undici', async () => {
  const reader = new OpenBknPlatformReader({ ...config, businessDomain: 'bad domain\nvalue' }, (async () => {
    throw new Error('fetcher must not be called')
  }) as unknown as PlatformFetch)
  await assert.rejects(
    reader.listKnowledgeNetworks(AbortSignal.timeout(1_000)),
    (error: unknown) => error instanceof PlatformReaderError,
  )
})

test('reads an operations record whose raw outputs exceed the general cap, and admits only the projection', async () => {
  // OpenBKN 0.1.5 returns each operation's full output; 84 operations measured ~31 MB.
  const entries = Array.from({ length: 12 }, (_, index) => ({
    operation_id: `op-${index}`, tool_name: 'execute_tool', protocol: 'mcp', status: 'completed',
    request_id: `req-${index}`, output: 'x'.repeat(1024 * 1024),
  }))
  const body = JSON.stringify({ entries, total: entries.length })
  assert.ok(body.length > 8 * 1024 * 1024)
  const reader = new OpenBknPlatformReader({ ...config, maxResultBytes: 1_000_000 }, (async () => new Response(body, { status: 200 })) as unknown as PlatformFetch)
  const value = await reader.getInteractionOperations('int-1', AbortSignal.timeout(5_000)) as { entries: Array<Record<string, unknown>>; total: number }
  assert.equal(value.total, 12)
  assert.deepEqual(value.entries[0], { operation_id: 'op-0', tool_name: 'execute_tool', protocol: 'mcp', status: 'completed', request_id: 'req-0' })
})

test('still caps an operations record beyond the operations limit', async () => {
  const chunk = new TextEncoder().encode('x'.repeat(1024 * 1024))
  let sent = 0
  let cancelled = false
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) { sent += 1; controller.enqueue(chunk) },
    cancel() { cancelled = true },
  })
  const reader = new OpenBknPlatformReader(config, (async () => new Response(stream, { status: 200 })) as unknown as PlatformFetch)
  await assert.rejects(
    reader.getInteractionOperations('int-1', AbortSignal.timeout(20_000)),
    (error: unknown) => error instanceof PlatformReaderError && error.code === 'OUTPUT_OVERFLOW',
  )
  assert.equal(cancelled, true)
  assert.ok(sent >= 64 && sent < 80, `stopped near the 64 MB cap, read ${sent} MB`)
})
