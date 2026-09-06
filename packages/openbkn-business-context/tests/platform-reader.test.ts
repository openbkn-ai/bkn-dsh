import assert from 'node:assert/strict'
import test from 'node:test'
import { OpenBknPlatformReader, PlatformReaderError, type PlatformFetch } from '../src/platform-reader.ts'

const binding = { platformBaseUrl: 'http://localhost:8081', knowledgeNetworkId: 'supply_ontology_hand', displayName: '供应链本体知识网络' }

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

test('uses fixed Host routes and keeps the credential out of payloads', async () => {
  const requests: Array<{ url: URL; init: RequestInit }> = []
  const fetcher: PlatformFetch = async (url, init) => {
    requests.push({ url, init })
    return response({ entries: [{ id: 'supply_ontology_hand', name: 'Supply' }] })
  }
  const reader = new OpenBknPlatformReader({ baseUrl: 'http://localhost:8081/', requestTimeoutMs: 1_000, maxResultBytes: 1024, allowInsecureTls: false, resolveToken: async () => 'managed-token' }, fetcher)

  assert.deepEqual(await reader.listKnowledgeNetworks(AbortSignal.timeout(1_000)), { entries: [{ id: 'supply_ontology_hand', name: 'Supply' }] })
  assert.equal(requests[0].url.pathname, '/api/bkn-backend/v1/knowledge-networks')
  assert.equal(requests[0].url.searchParams.get('limit'), '100')
  assert.equal(new Headers(requests[0].init.headers).get('authorization'), 'Bearer managed-token')
  assert.equal(String(requests[0].init.body).includes('managed-token'), false)
})

test('posts only a host-bound network id to the fixed Context Loader detail route', async () => {
  let request: { url: URL; init: RequestInit } | undefined
  const reader = new OpenBknPlatformReader({ baseUrl: 'http://localhost:8081', requestTimeoutMs: 1_000, maxResultBytes: 1024, allowInsecureTls: false, resolveToken: async () => 'token' }, async (url, init) => {
    request = { url, init }; return response({ object_types: [] })
  })
  await reader.getKnowledgeNetworkDetail(binding, AbortSignal.timeout(1_000))
  assert.equal(request?.url.pathname, '/api/agent-retrieval/v1/kn/get_kn_detail')
  assert.deepEqual(JSON.parse(String(request?.init.body)), { kn_id: 'supply_ontology_hand', detail_level: 'summary', response_format: 'json' })
})

test('projects oversized raw operation records before applying the Host-to-browser size limit', async () => {
  const reader = new OpenBknPlatformReader({ baseUrl: 'http://localhost:8081', requestTimeoutMs: 1_000, maxResultBytes: 1024, allowInsecureTls: false, resolveToken: async () => 'token' }, async () => response({
    total: 1,
    entries: [{ operation_id: 'op-1', tool_name: 'query_metric', status: 'completed', input: 'x'.repeat(50_000), output: 'y'.repeat(50_000), request_id: 'request-1' }],
  }))
  assert.deepEqual(await reader.getInteractionOperations('int-1', AbortSignal.timeout(1_000)), {
    entries: [{ operation_id: 'op-1', tool_name: 'query_metric', status: 'completed', request_id: 'request-1' }], total: 1,
  })
})

test('rejects missing credentials and cross-platform bindings before a network request', async () => {
  let called = false
  const reader = new OpenBknPlatformReader({ baseUrl: 'https://openbkn.example', requestTimeoutMs: 1_000, maxResultBytes: 1024, allowInsecureTls: false }, async () => { called = true; return response({}) })
  await assert.rejects(reader.listKnowledgeNetworks(AbortSignal.timeout(1_000)), (error: unknown) => error instanceof PlatformReaderError && error.code === 'AUTHENTICATION_REQUIRED')
  await assert.rejects(reader.getKnowledgeNetworkDetail({ ...binding, platformBaseUrl: 'https://other.example' }, AbortSignal.timeout(1_000)), (error: unknown) => error instanceof PlatformReaderError && error.code === 'PLATFORM_MISMATCH')
  assert.equal(called, false)
})

test('maps authorization failure without exposing the platform response', async () => {
  const reader = new OpenBknPlatformReader({ baseUrl: 'http://localhost:8081', requestTimeoutMs: 1_000, maxResultBytes: 1024, allowInsecureTls: false, resolveToken: async () => 'token' }, async () => response({ detail: 'private diagnostics' }, 401))
  await assert.rejects(reader.listKnowledgeNetworks(AbortSignal.timeout(1_000)), (error: unknown) => error instanceof PlatformReaderError && error.code === 'AUTHENTICATION_REQUIRED' && !error.message.includes('private'))
})
