import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import SystemPrompt, { renderPrompt } from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import { ToolCallId } from '@deepseek-ai/dsh-llm'
import { mountBoundBusinessNetworkTool } from '../src/scoped-business-context.ts'

const toolRequire = createRequire(import.meta.resolve('@deepseek-ai/dsh-tools'))
const { createScope } = await import(pathToFileURL(toolRequire.resolve('@deepseek-ai/dsh-scope')).href)
const config = { baseUrl: 'https://platform.invalid', requestTimeoutMs: 1_000, maxResultBytes: 1_024, allowInsecureTls: false }
const binding = { platformBaseUrl: config.baseUrl, knowledgeNetworkId: 'kn', displayName: 'Supply' }

async function fixture() {
  const ctx = new Context()
  await ctx.plugin(SystemPrompt, {})
  await ctx.plugin(ToolRuntime)
  const agent = { id: 'managed-surface', session: { snapshotEvents: () => [] }, ctx: undefined as unknown as Context }
  let scope!: { ctx: Context; dispose(): Promise<void> }
  await ctx.plugin({ inject: ['tools', 'systemPrompt'], apply(inner: Context) { scope = createScope(inner, agent) } })
  agent.ctx = scope.ctx
  let dispatched = 0
  const register = (name: string, owner = ctx) => owner.tools.register({
    name, description: 'Observed tool-surface regression fixture', parameters: { type: 'object', properties: {} },
    output: { schema: { type: 'string' }, render: (_args: unknown, value: unknown) => [{ type: 'text' as const, text: String(value) }] },
    execute: async () => { dispatched++; return 'executed' },
  })
  return { ctx, agent, scope, register, dispatched: () => dispatched,
    assemble: () => ctx.systemPrompt.assemble({ scope: agent }),
  }
}

// Actual 2026-11-02 persisted request headers exposed both forbidden names;
// platform and Host instructions recommended each route. Expected exclusions
// come from that observation, independently of the implementation's allowlist.
test('managed request catalogue hides observed forbidden tools, including late and scoped registrations, while guards still deny without dispatch', async () => {
  const f = await fixture()
  try {
    for (const name of ['write', 'edit', 'mcp__openbkn__run_cypher', 'mcp__openbkn__bkn_start_interaction']) f.register(name)
    const originalNames = (await f.assemble()).tools.map(tool => tool.name)
    assert.ok(originalNames.includes('write'))
    assert.equal(mountBoundBusinessNetworkTool(f.agent as never, config, binding), true)
    f.register('mcp__openbkn__query_metric')
    f.register('mcp__openbkn__future_unreviewed')
    f.register('scoped_host_writer', f.agent.ctx)
    const bound = await f.assemble()
    assert.deepEqual(bound.tools.map(tool => tool.name).sort(), ['mcp__openbkn__bkn_start_interaction', 'mcp__openbkn__query_metric'].sort())
    assert.ok((await f.ctx.systemPrompt.assemble()).tools.some(tool => tool.name === 'write'), 'unbound requests keep native tools')
    for (const name of ['write', 'edit', 'mcp__openbkn__run_cypher', 'mcp__openbkn__future_unreviewed', 'scoped_host_writer']) {
      const result = await f.ctx.tools.execute({ name, arguments: {}, agent: f.agent as never, callId: ToolCallId(name), signal: new AbortController().signal })
      assert.equal(result.isError, true, name)
      assert.match(JSON.stringify(result.content), /only permits managed|not supported in an OpenBKN/)
    }
    assert.equal(f.dispatched(), 0)
  } finally { await f.ctx.fiber.dispose() }
})

test('managed routing is appended after conflicting general guidance without rewriting its source', async () => {
  const f = await fixture()
  try {
    const platform = '- 聚合 / 统计 / 排名 → run_cypher'
    const host = 'Prefer read/edit/write for file changes.'
    f.ctx.systemPrompt.section({ name: 'platform-fixture', order: 10000, text: platform })
    f.ctx.systemPrompt.section({ name: 'host-fixture', order: 20000, text: host })
    assert.equal(mountBoundBusinessNetworkTool(f.agent as never, config, binding), true)
    const assembly = await f.assemble()
    assert.equal(assembly.sections.find(section => section.name === 'platform-fixture')!.text, platform)
    assert.equal(assembly.sections.find(section => section.name === 'host-fixture')!.text, host)
    assert.equal(assembly.sections.at(-1)!.name, 'openbkn:effective-tool-routing')
    const rendered = renderPrompt(assembly)
    assert.match(rendered, /General platform and Host instructions.*broader tool surface/)
    assert.match(rendered, /Do not call.*run_cypher.*write.*edit/)
    assert.match(rendered, /query_metric.*get_logic_properties_values.*published capabilities/)
    assert.match(rendered, /CSV.*current platform conversation.*openbkn_export_csv/s)
  } finally { await f.ctx.fiber.dispose() }
})

test('assembly filters the authoritative downstream result and removes no policy from unrelated scopes', async () => {
  const f = await fixture()
  try {
    assert.equal(mountBoundBusinessNetworkTool(f.agent as never, config, binding), true)
    f.agent.ctx.on('system-prompt/assemble', async (assembly, _context, next) => ({
      ...await next(), tools: [...assembly.tools, { name: 'write', description: 'downstream fixture', parameters: {} }],
    }))
    assert.ok(!(await f.assemble()).tools.some(tool => tool.name === 'write'))
    assert.ok(!(await f.ctx.systemPrompt.assemble()).sections.some(section => section.name === 'openbkn:effective-tool-routing'))
  } finally { await f.ctx.fiber.dispose() }
})

// Independent source-derived catalogues, not the implementation's allowlist.
// Actions, cross-network enumeration/resources and raw execution are the
// reviewed exclusions; legacy execute_skill additionally lacks network scope.
const excluded = new Set([
  'execute_action', 'get_action_info', 'get_action_execution', 'list_action_executions',
  'list_knowledge_networks', 'list_resources', 'describe_resource', 'run_sql', 'run_cypher', 'run_shell',
])
for (const release of ['v0.1.4', 'v0.1.5', 'v0.2.0-release', '20261018-live']) {
  test(`managed catalogue preserves all supported ${release} schemas and omits permanently unscoped skill execution`, async () => {
    const f = await fixture()
    try {
      const contract = JSON.parse(readFileSync(new URL(`./fixtures/context-loader-tools-${release}.json`, import.meta.url), 'utf8'))
      assert.equal(mountBoundBusinessNetworkTool(f.agent as never, config, binding), true)
      // Register after mounting, as a real MCP connection does.
      for (const [name, entry] of Object.entries(contract.tools) as Array<[string, { inputSchema?: Record<string, unknown>; knId: string }]>) {
        f.ctx.tools.register({
          name: 'mcp__openbkn__' + name, description: `Published ${release} tool`,
          parameters: entry.inputSchema ?? { type: 'object', properties: ['required', 'optional'].includes(entry.knId) ? { kn_id: { type: 'string' } } : {} },
          output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: value }] },
          execute: async () => 'fixture',
        })
      }
      const original = (await f.ctx.systemPrompt.assemble()).tools
      const expected = original.filter(tool => {
        const name = tool.name.replace('mcp__openbkn__', '')
        return !excluded.has(name) && !(release === 'v0.1.4' && name === 'execute_skill')
      })
      const filtered = (await f.assemble()).tools
      assert.deepEqual(filtered, expected, 'schemas, descriptions, optional/deployment tools and native order are retained exactly')
      assert.ok(filtered.some(tool => tool.name === 'mcp__openbkn__query_object_instance'))
      assert.ok(filtered.some(tool => tool.name === 'mcp__openbkn__query_metric'))
      assert.ok(filtered.some(tool => tool.name === 'mcp__openbkn__run_code'))
      assert.ok(!filtered.some(tool => tool.name === 'openbkn_export_csv'), 'missing optional file services do not disable queries or invent CSV availability')
    } finally { await f.ctx.fiber.dispose() }
  })
}

test('native tool restrictions stay effective and business reload restores the original catalogue', async () => {
  const f = await fixture()
  try {
    for (const name of ['write', 'mcp__openbkn__query_metric', 'mcp__openbkn__search_schema']) f.register(name)
    f.agent.ctx.tools.restrict({ deny: ['mcp__openbkn__query_metric'] })
    const original = (await f.assemble()).tools
    let owner!: Context
    const business = await f.ctx.plugin({ apply(ctx: Context) { owner = ctx } })
    assert.equal(mountBoundBusinessNetworkTool(f.agent as never, config, binding, undefined, owner), true)
    assert.deepEqual((await f.assemble()).tools.map(tool => tool.name), ['mcp__openbkn__search_schema'])
    await business.dispose()
    assert.deepEqual((await f.assemble()).tools, original, 'filter removal does not keep allowed query tools hidden')
    assert.ok(!(await f.assemble()).sections.some(section => section.name === 'openbkn:effective-tool-routing'))
    let replacement!: Context
    const next = await f.ctx.plugin({ apply(ctx: Context) { replacement = ctx } })
    assert.equal(mountBoundBusinessNetworkTool(f.agent as never, config, binding, undefined, replacement), true)
    assert.deepEqual((await f.assemble()).tools.map(tool => tool.name), ['mcp__openbkn__search_schema'])
    assert.equal((await f.assemble()).sections.filter(section => section.name === 'openbkn:effective-tool-routing').length, 1)
    await next.dispose()
  } finally { await f.ctx.fiber.dispose() }
})

test('skill visibility follows the current registered network schema rather than a static tool-name exclusion', async () => {
  const f = await fixture()
  try {
    const identity = { conversation_id: 'conv-skill', interaction_id: 'int-skill', execution_status: 'active' }
    f.ctx.tools.register({
      name: 'mcp__openbkn__bkn_start_interaction', description: 'Controlled lifecycle response',
      parameters: { type: 'object', properties: {} },
      output: { schema: { type: 'object' }, render: (_args, value) => [{ type: 'text', text: JSON.stringify(value) }] },
      execute: async () => identity,
    })
    let executions = 0
    mountBoundBusinessNetworkTool(f.agent as never, config, binding)
    const registerSkill = (properties: Record<string, unknown>) => f.ctx.tools.register({
      name: 'mcp__openbkn__execute_skill', description: 'Deployment-provided Skill schema',
      parameters: { type: 'object', properties },
      output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: value }] },
      execute: async () => { executions++; return 'fixture' },
    })
    let sequence = 0
    const call = (name: string, args: Record<string, unknown>) => f.ctx.tools.execute({
      name, arguments: args, agent: f.agent as never, callId: ToolCallId('skill-' + ++sequence), signal: AbortSignal.timeout(5000),
    })
    assert.notEqual((await call('mcp__openbkn__bkn_start_interaction', { conversation_mode: 'new' })).isError, true)
    const visible = async () => (await f.assemble()).tools.some(tool => tool.name === 'mcp__openbkn__execute_skill')
    const unscoped = registerSkill({})
    assert.equal(await visible(), false)
    const refused = await call('mcp__openbkn__execute_skill', {})
    assert.equal(refused.isError, true)
    assert.match(JSON.stringify(refused.content), /not scoped to a knowledge network/)
    assert.equal(executions, 0)
    unscoped()
    const scoped = registerSkill({ kn_id: { type: 'string' } })
    assert.equal(await visible(), true, 'a supported Skill must not be hidden by the legacy exclusion')
    assert.notEqual((await call('mcp__openbkn__execute_skill', { kn_id: binding.knowledgeNetworkId })).isError, true)
    assert.equal(executions, 1)
    for (const args of [{}, { kn_id: 'other' }, { kn_id: [binding.knowledgeNetworkId] }]) {
      assert.equal((await call('mcp__openbkn__execute_skill', args)).isError, true)
    }
    assert.equal(executions, 1, 'visible network-scoped Skill still enforces the original guard')
    scoped()
    registerSkill({})
    assert.equal(await visible(), false, 'reconnection to an unscoped definition cannot leave a cached visible tool')
  } finally { await f.ctx.fiber.dispose() }
})
