import assert from 'node:assert/strict'
import test from 'node:test'
import { apply } from '../src/index.ts'
import { mountBoundBusinessNetworkTool } from '../src/scoped-business-context.ts'

const config = {
  baseUrl: 'https://poc.openbkn.ai', requestTimeoutMs: 30_000,
  maxResultBytes: 1_024, allowInsecureTls: false,
}

test('mounts managed policy without requiring dynamic MCP tools at session creation', () => {
  let guarded = 0
  const agent = {
    session: {
      snapshotEvents: () => [{
        type: 'openbkn/business-network-bound',
        data: { platformBaseUrl: 'https://poc.openbkn.ai', knowledgeNetworkId: 'kn-supply', displayName: '供应链风险网络' },
      }],
    },
    ctx: {
      tools: {
        guard: () => { guarded += 1; return () => {} },
      },
      systemPrompt: { section: () => () => {} },
    },
  }

  assert.equal(mountBoundBusinessNetworkTool(agent, config), true)
  assert.equal(guarded, 1)
})

test('guards an auto-bound business session to governed OpenBKN tools', () => {
  const agent = {
    session: {
      snapshotEvents: () => [{
        type: 'openbkn/business-network-bound',
        data: { platformBaseUrl: 'https://poc.openbkn.ai', knowledgeNetworkId: 'kn-supply', displayName: '供应链风险网络' },
      }],
    },
    ctx: {
      tools: {
        guard: (guard: (execution: { readonly name: string }) => string | undefined) => {
          guards.push(guard)
          return () => {}
        },
      },
      systemPrompt: { section: (section: { readonly name: string; readonly order: number; readonly text: string }) => {
        sections.push(section)
        return () => {}
      } },
    },
  }
  const sections: Array<{ readonly name: string; readonly text: string }> = []
  const guards: Array<(execution: { readonly name: string }) => string | undefined> = []

  assert.equal(mountBoundBusinessNetworkTool(agent, config), true)

  assert.equal(sections[0].name, 'openbkn:managed-session')
  assert.equal(guards.length, 1)
  assert.equal(guards[0]({ name: 'mcp__openbkn__execute_tool' }), undefined)
  assert.match(guards[0]({ name: 'mcp__openbkn__run_code' }) ?? '', /only permits managed OpenBKN tools/i)
  assert.match(guards[0]({ name: 'bash' }) ?? '', /only permits managed OpenBKN tools/i)
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
