import assert from 'node:assert/strict'
import test from 'node:test'
import { apply } from '../src/index.ts'
import { mountBoundBusinessNetworkTool } from '../src/scoped-business-context.ts'

const config = {
  baseUrl: 'https://poc.openbkn.ai', requestTimeoutMs: 30_000,
  maxResultBytes: 1_024, allowInsecureTls: false,
}

test('mounts the OpenBKN tool only in an agent scope with a compatible durable binding', () => {
  const mounted: Array<{ apply: (ctx: unknown) => void }> = []
  const agent = {
    session: {
      snapshotEvents: () => [{
        type: 'openbkn/business-network-bound',
        data: { platformBaseUrl: 'https://poc.openbkn.ai', knowledgeNetworkId: 'kn-supply', displayName: '供应链风险网络' },
      }],
    },
    ctx: { plugin: (plugin: (typeof mounted)[number]) => { mounted.push(plugin) } },
  }

  assert.equal(mountBoundBusinessNetworkTool(agent, config), true)
  assert.equal(mounted.length, 1)
})

test('does not alter a native or differently configured DSH agent scope', () => {
  const mounted: unknown[] = []
  const agent = {
    session: { snapshotEvents: () => [] },
    ctx: { plugin: (plugin: unknown) => { mounted.push(plugin) } },
  }

  assert.equal(mountBoundBusinessNetworkTool(agent, config), false)
  assert.deepEqual(mounted, [])
})

test('loads only the host selection service at the root instead of registering a global model tool', async () => {
  const installed: unknown[] = []
  const ctx = {
    plugin: async (plugin: unknown) => { installed.push(plugin) },
    tools: { register: () => { throw new Error('root plugin must not register a tool') } },
  }

  await apply(ctx, config)
  assert.equal(installed.length, 2)
})
