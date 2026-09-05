import assert from 'node:assert/strict'
import test from 'node:test'
import { OpenBknMcpManager, resolveMcpUrl } from '../src/openbkn-mcp-manager.ts'

test('derives the standard Context Loader endpoint from the configured OpenBKN platform', () => {
  assert.equal(
    resolveMcpUrl({ baseUrl: 'http://localhost:8081/' }),
    'http://localhost:8081/api/agent-retrieval/v1/mcp/',
  )
})

test('honours an explicitly configured Context Loader endpoint', () => {
  assert.equal(
    resolveMcpUrl({ baseUrl: 'https://platform.example', mcpUrl: 'https://mcp.example/context/' }),
    'https://mcp.example/context/',
  )
})

test('mounts the standard MCP client with an ephemeral bearer header and verifies its managed tool', async () => {
  let mounted: unknown
  const tools = new Map<string, unknown>()
  const ctx = {
    tools: { get: (name: string) => tools.get(name) },
    plugin: async (_plugin: unknown, config: { headers: Record<string, string> }) => {
      mounted = config
      tools.set('mcp__openbkn__bkn_start_interaction', {})
    },
  }
  const manager = new OpenBknMcpManager(ctx as never, { baseUrl: 'http://localhost:8081' } as never, async () => 'test-token')

  await manager.ensure()

  assert.deepEqual(mounted, {
    transport: 'streamable-http', serverName: 'openbkn', url: 'http://localhost:8081/api/agent-retrieval/v1/mcp/',
    headers: { Authorization: 'Bearer test-token' }, toolCallTimeoutMs: 20_000, failOnStartupError: true,
    reconnect: { enabled: true, initialDelayMs: 500, maxDelayMs: 30_000, maxAttempts: 10 },
  })
})
