import assert from 'node:assert/strict'
import test from 'node:test'
import { OpenBknMcpManager, resolveMcpUrl } from '../src/openbkn-mcp-manager.ts'

test('derives the standard Context Loader endpoint from the configured OpenBKN platform', () => {
  assert.equal(
    resolveMcpUrl({ baseUrl: 'http://localhost:8081/' }),
    'http://localhost:8081/api/agent-retrieval/v1/mcp/',
  )
})

test('honours an explicitly configured Context Loader endpoint on the same origin', () => {
  assert.equal(
    resolveMcpUrl({ baseUrl: 'https://platform.example', mcpUrl: 'https://platform.example/context/' }),
    'https://platform.example/context/',
  )
})

test('mounts the compatible MCP client with an ephemeral bearer header and verifies its managed tool', async () => {
  let mounted: unknown
  const tools = new Map<string, unknown>()
  let disposed = 0
  const ctx = {
    tools: { get: (name: string) => tools.get(name) },
    plugin: async (_plugin: unknown, config: { headers: Record<string, string> }) => {
      mounted = config
      tools.set('mcp__openbkn__bkn_start_interaction', {})
      return { dispose: async () => { disposed += 1; tools.delete('mcp__openbkn__bkn_start_interaction') } }
    },
  }
  const manager = new OpenBknMcpManager(ctx as never, { baseUrl: 'http://localhost:8081' } as never, async () => 'test-token')

  await manager.ensure()

  assert.deepEqual(mounted, {
    transport: 'streamable-http', serverName: 'openbkn', url: 'http://localhost:8081/api/agent-retrieval/v1/mcp/',
    headers: { Authorization: 'Bearer test-token' }, toolCallTimeoutMs: 20_000, failOnStartupError: true,
    maxInstructionBytes: 32_768,
    reconnect: { enabled: true, initialDelayMs: 500, maxDelayMs: 30_000, maxAttempts: 10 },
  })

  await manager.refresh()
  assert.equal(disposed, 1)
})

test('turns an MCP handshake rejection into an actionable re-login hint (G6 finding)', async () => {
  // The MCP SDK brands a 401 probe with code CLIENT_HTTP_AUTHENTICATION and
  // DSH's mcp-client wraps it as "initial connection or tool synchronization
  // failed"; the cause chain keeps the brand.
  const handshakeError = Object.assign(
    new Error('mcp-client(openbkn): initial connection or tool synchronization failed'),
    { cause: Object.assign(new Error('Version negotiation failed: the server requires authorization (HTTP 401)'), { code: 'CLIENT_HTTP_AUTHENTICATION' }) },
  )
  const tools = new Map<string, unknown>()
  const ctx = {
    tools: { get: (name: string) => tools.get(name) },
    plugin: async () => { throw handshakeError },
  }
  const manager = new OpenBknMcpManager(ctx as never, { baseUrl: 'http://localhost:8081' } as never, async () => 'stale-token')

  await assert.rejects(manager.ensure(), (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    return message.includes('Re-login with `openbkn auth login`')
      && message.includes('HTTP 401')
      && !message.includes('stale-token')
  })
})

test('keeps a plain startup failure in its original shape', async () => {
  const tools = new Map<string, unknown>()
  const ctx = {
    tools: { get: (name: string) => tools.get(name) },
    plugin: async () => { throw new Error('connect ECONNREFUSED 127.0.0.1:1') },
  }
  const manager = new OpenBknMcpManager(ctx as never, { baseUrl: 'http://localhost:8081' } as never, async () => 'test-token')

  await assert.rejects(manager.ensure(), /ECONNREFUSED/)
})

test('recognizes a 403 brand as an account-authorization hint, not re-login', async () => {
  const handshakeError = Object.assign(
    new Error('mcp-client(openbkn): initial connection or tool synchronization failed'),
    { cause: Object.assign(new Error('Version negotiation failed: the server denied access (HTTP 403)'), { code: 'CLIENT_HTTP_FORBIDDEN' }) },
  )
  const tools = new Map<string, unknown>()
  const ctx = {
    tools: { get: (name: string) => tools.get(name) },
    plugin: async () => { throw handshakeError },
  }
  const manager = new OpenBknMcpManager(ctx as never, { baseUrl: 'http://localhost:8081' } as never, async () => 'token')

  await assert.rejects(manager.ensure(), (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    return message.includes('authorize this account') && !message.includes('auth login')
  })
})
