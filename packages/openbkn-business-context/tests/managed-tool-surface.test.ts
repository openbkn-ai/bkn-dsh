import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
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
