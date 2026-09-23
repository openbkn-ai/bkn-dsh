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
  const reader = new OpenBknPlatformReader({ baseUrl: 'http://localhost:8081/', requestTimeoutMs: 1_000, maxResultBytes: 1024, allowInsecureTls: false, businessDomain: 'bd_public', resolveToken: async () => 'managed-token' }, fetcher)

  assert.deepEqual(await reader.listKnowledgeNetworks(AbortSignal.timeout(1_000)), { entries: [{ id: 'supply_ontology_hand', name: 'Supply' }] })
  assert.equal(requests[0].url.pathname, '/api/bkn-backend/v1/knowledge-networks')
  assert.equal(requests[0].url.searchParams.get('limit'), '100')
  assert.equal(new Headers(requests[0].init.headers).get('authorization'), 'Bearer managed-token')
  assert.equal(new Headers(requests[0].init.headers).get('x-business-domain'), 'bd_public')
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

test('maps a 403 permission_denied domain gate to LICENSE_REQUIRED without exposing the response', async () => {
  const reader = new OpenBknPlatformReader({ baseUrl: 'http://localhost:8081', requestTimeoutMs: 1_000, maxResultBytes: 1024, allowInsecureTls: false, resolveToken: async () => 'token' }, async () => response({
    error: { code: 'permission_denied', message: '请求的业务域未获准执行公共生命周期写入', required_action: 'request_authorization', request_id: 'req-1' },
  }, 403))
  await assert.rejects(reader.getInteractionOperations('int-1', AbortSignal.timeout(1_000)), (error: unknown) => error instanceof PlatformReaderError && error.code === 'LICENSE_REQUIRED' && !error.message.includes('req-1'))
})

test('maps a 404 resource_not_disclosed to RECORD_NOT_DISCLOSED without exposing the response', async () => {
  const reader = new OpenBknPlatformReader({ baseUrl: 'http://localhost:8081', requestTimeoutMs: 1_000, maxResultBytes: 1024, allowInsecureTls: false, resolveToken: async () => 'token' }, async () => response({
    error: { code: 'resource_not_disclosed', message: 'request was not found in the authorized scope', request_id: 'req-404' },
  }, 404))
  await assert.rejects(reader.getInteractionOperations('int-1', AbortSignal.timeout(1_000)), (error: unknown) => error instanceof PlatformReaderError && error.code === 'RECORD_NOT_DISCLOSED' && !error.message.includes('req-404'))
})

test('keeps any other 404 a generic platform unavailability', async () => {
  const reader = new OpenBknPlatformReader({ baseUrl: 'http://localhost:8081', requestTimeoutMs: 1_000, maxResultBytes: 1024, allowInsecureTls: false, resolveToken: async () => 'token' }, async () => response({
    error: { code: 'other_code' },
  }, 404))
  await assert.rejects(reader.getInteractionOperations('int-1', AbortSignal.timeout(1_000)), (error: unknown) => error instanceof PlatformReaderError && error.code === 'PLATFORM_UNAVAILABLE')
})

test('keeps an oversized 404 body a generic platform unavailability', async () => {
  const reader = new OpenBknPlatformReader({ baseUrl: 'http://localhost:8081', requestTimeoutMs: 1_000, maxResultBytes: 1024, allowInsecureTls: false, resolveToken: async () => 'token' }, async () => response(`{"error":{"code":"resource_not_disclosed","pad":"${'x'.repeat(5000)}"}}`, 404))
  await assert.rejects(reader.getInteractionOperations('int-1', AbortSignal.timeout(1_000)), (error: unknown) => error instanceof PlatformReaderError && error.code === 'PLATFORM_UNAVAILABLE')
})

test('keeps a non-JSON 404 a generic platform unavailability', async () => {
  const reader = new OpenBknPlatformReader({ baseUrl: 'http://localhost:8081', requestTimeoutMs: 1_000, maxResultBytes: 1024, allowInsecureTls: false, resolveToken: async () => 'token' }, async () => response('<html>gone</html>', 404))
  await assert.rejects(reader.getInteractionOperations('int-1', AbortSignal.timeout(1_000)), (error: unknown) => error instanceof PlatformReaderError && error.code === 'PLATFORM_UNAVAILABLE')
})

test('keeps a 401 permission_denied on observability routes an authentication failure', async () => {
  const reader = new OpenBknPlatformReader({ baseUrl: 'http://localhost:8081', requestTimeoutMs: 1_000, maxResultBytes: 1024, allowInsecureTls: false, resolveToken: async () => 'integration-token' }, async () => response({
    error: { code: 'permission_denied', message: '需要有效的 OAuth Bearer Token', required_action: 'request_authorization', request_id: 'req-2' },
  }, 401))
  await assert.rejects(reader.getInteractionOperations('int-1', AbortSignal.timeout(1_000)), (error: unknown) => error instanceof PlatformReaderError && error.code === 'AUTHENTICATION_REQUIRED')
})

test('keeps non-permission 401/403 responses on AUTHENTICATION_REQUIRED', async () => {
  const reader = new OpenBknPlatformReader({ baseUrl: 'http://localhost:8081', requestTimeoutMs: 1_000, maxResultBytes: 1024, allowInsecureTls: false, resolveToken: async () => 'token' }, async () => response({ error: { code: 'role_check_failed' } }, 403))
  await assert.rejects(reader.getInteractionOperations('int-1', AbortSignal.timeout(1_000)), (error: unknown) => error instanceof PlatformReaderError && error.code === 'AUTHENTICATION_REQUIRED')
  const unauthorized = new OpenBknPlatformReader({ baseUrl: 'http://localhost:8081', requestTimeoutMs: 1_000, maxResultBytes: 1024, allowInsecureTls: false, resolveToken: async () => 'token' }, async () => response({ detail: 'private diagnostics' }, 401))
  await assert.rejects(unauthorized.listKnowledgeNetworks(AbortSignal.timeout(1_000)), (error: unknown) => error instanceof PlatformReaderError && error.code === 'AUTHENTICATION_REQUIRED')
})

test('keeps permission_denied on non-observability routes an authentication failure', async () => {
  const reader = new OpenBknPlatformReader({ baseUrl: 'http://localhost:8081', requestTimeoutMs: 1_000, maxResultBytes: 1024, allowInsecureTls: false, resolveToken: async () => 'token' }, async () => response({
    error: { code: 'permission_denied', message: 'no access to this knowledge network', required_action: 'request_authorization' },
  }, 403))
  await assert.rejects(reader.listKnowledgeNetworks(AbortSignal.timeout(1_000)), (error: unknown) => error instanceof PlatformReaderError && error.code === 'AUTHENTICATION_REQUIRED')
})

test('projects the license edition from bkn-safe capabilities', async () => {
  const reader = new OpenBknPlatformReader({ baseUrl: 'http://localhost:8081', requestTimeoutMs: 1_000, maxResultBytes: 1024, allowInsecureTls: false, resolveToken: async () => 'token' }, async () => response({ licensed: false, edition: 'community', capabilities: [], features: [] }))
  assert.deepEqual(await reader.getLicenseEdition(AbortSignal.timeout(1_000)), { edition: 'community', licensed: false })
})
