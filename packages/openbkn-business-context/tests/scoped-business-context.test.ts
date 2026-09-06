import assert from 'node:assert/strict'
import test from 'node:test'
import { apply } from '../src/index.ts'
import { mountBoundBusinessNetworkTool } from '../src/scoped-business-context.ts'

const config = {
  baseUrl: 'https://poc.openbkn.ai', requestTimeoutMs: 30_000,
  maxResultBytes: 1_024, allowInsecureTls: false,
}

test('mounts the OpenBKN tool only in an agent scope with a compatible durable binding', () => {
  const injected: string[][] = []
  const agent = {
    session: {
      snapshotEvents: () => [{
        type: 'openbkn/business-network-bound',
        data: { platformBaseUrl: 'https://poc.openbkn.ai', knowledgeNetworkId: 'kn-supply', displayName: '供应链风险网络' },
      }],
    },
    ctx: { inject: (dependencies: string[]) => { injected.push(dependencies) } },
  }

  assert.equal(mountBoundBusinessNetworkTool(agent, config), true)
  assert.deepEqual(injected, [['systemPrompt', 'tools']])
})

test('limits an auto-bound business session to governed OpenBKN tools', () => {
  const agent = {
    session: {
      snapshotEvents: () => [{
        type: 'openbkn/business-network-bound',
        data: { platformBaseUrl: 'https://poc.openbkn.ai', knowledgeNetworkId: 'kn-supply', displayName: '供应链风险网络' },
      }],
    },
    ctx: {
      inject: (_dependencies: string[], apply: (ctx: unknown) => void) => apply({
        tools: { restrict: (filter: { readonly allow: readonly string[] }) => {
          restrictions.push(filter)
          return () => {}
        } },
        systemPrompt: { section: (section: { readonly name: string; readonly order: number; readonly text: string }) => {
          sections.push(section)
          return () => {}
        } },
      }),
    },
  }
  const restrictions: Array<{ readonly allow: readonly string[] }> = []
  const sections: Array<{ readonly name: string; readonly text: string }> = []

  assert.equal(mountBoundBusinessNetworkTool(agent, config), true)

  assert.deepEqual(restrictions, [{ allow: [
    'mcp__openbkn__bkn_start_interaction', 'mcp__openbkn__bkn_finish_interaction',
    'mcp__openbkn__get_kn_detail', 'mcp__openbkn__search_schema', 'mcp__openbkn__get_object_types', 'mcp__openbkn__get_relation_types',
    'mcp__openbkn__query_object_instance', 'mcp__openbkn__query_instance_subgraph', 'mcp__openbkn__explore_subgraph', 'mcp__openbkn__search_instance',
    'mcp__openbkn__query_metric', 'mcp__openbkn__get_logic_properties_values',
    'mcp__openbkn__list_skills', 'mcp__openbkn__find_skills', 'mcp__openbkn__get_skill_content', 'mcp__openbkn__read_skill_file',
    'mcp__openbkn__search_tools', 'mcp__openbkn__execute_tool',
  ] }])
  assert.equal(sections[0].name, 'openbkn:managed-session')
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
