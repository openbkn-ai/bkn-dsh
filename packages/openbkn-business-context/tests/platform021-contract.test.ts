import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import { createMcpToolDefinition } from '@deepseek-ai/dsh-mcp-client'
import { ToolCallId } from '@deepseek-ai/dsh-llm'
import { mountBoundBusinessNetworkTool } from '../src/scoped-business-context.ts'
import {
  initialState, projectLifecycleOutcome, onToolResult, denialFor,
  START_INTERACTION_TOOL, FINISH_INTERACTION_TOOL,
} from '../src/interaction-lifecycle.ts'
import { findCompletedNativeMcpProvenance } from '../src/native-mcp-provenance.ts'

// Independent, selected source contracts. This is neither a deployed catalogue
// nor final platform-0.2.1 acceptance; the fixture records its exact source SHA.
const contract = JSON.parse(readFileSync(new URL('./fixtures/context-loader-source-021-preparation.json', import.meta.url), 'utf8'))
const config = { baseUrl: 'https://platform.invalid', requestTimeoutMs: 1_000, maxResultBytes: 4_096, allowInsecureTls: false }
const binding = { platformBaseUrl: config.baseUrl, knowledgeNetworkId: 'kn-contract', displayName: 'Synthetic contract network' }
const identity = { conversation_id: 'conv-contract', interaction_id: 'int-contract', execution_status: 'active' }
const managedContext = { conversation_id: identity.conversation_id, interaction_id: identity.interaction_id }
const toolRequire = createRequire(import.meta.resolve('@deepseek-ai/dsh-tools'))
const { createScope } = await import(pathToFileURL(toolRequire.resolve('@deepseek-ai/dsh-scope')).href)

function metricArgs() {
  return {
    kn_id: binding.knowledgeNetworkId, metric_id: 'published-metric', version: 7, branch: 'scenario-q4',
    query: {
      time: { start: 1_793_577_600_123, end: 1_793_663_999_987 },
      group_by: [{ object_type_id: 'warehouse', property_name: 'region' }],
      having: { operator: 'gt', value: 0 }, page_size: 2,
    },
    bkn_context: { ...managedContext },
  }
}

// Synthetic business values exercise lossless transport only. No calculation
// or expected real-world answer is delegated to the plugin under test.
const metricReply = {
  kn_id: binding.knowledgeNetworkId, metric_id: 'published-metric', version: 7,
  model: { value_type: 'decimal', description: 'Platform-disclosed model description' },
  entries: [
    { status: 'ok', value: 12.34, display_value: '12.3400', dimension_cells: [{ ref: { object_type_id: 'warehouse', property_name: 'region' }, value: 'north' }] },
    { status: 'no_data', value: null },
  ],
  status: 'partial', warnings: ['Original platform warning; do not replace.'], total_count: 2,
  overall_ms: 3, evaluated_at: 1_793_664_000_000,
}

async function runtimeFixture() {
  const ctx = new Context()
  await ctx.plugin(SystemPrompt, {})
  await ctx.plugin(ToolRuntime)
  const agent = { id: 'platform021-contract', session: { snapshotEvents: () => [] }, ctx: undefined as unknown as Context }
  let scope!: { ctx: Context; dispose(): Promise<void> }
  await ctx.plugin({ inject: ['tools', 'systemPrompt'], apply(inner: Context) { scope = createScope(inner, agent) } })
  agent.ctx = scope.ctx
  const dispatched: Array<{ name: string; args: unknown }> = []
  let finishAttempts = 0
  const platformErrorText = JSON.stringify(contract.finishUnconfirmed.envelope)
  mountBoundBusinessNetworkTool(agent as never, config, binding)
  for (const [name, value] of Object.entries(contract.tools) as Array<[string, { inputSchema: Record<string, unknown>; outputSchema: Record<string, unknown> }]>) {
    // The actual official MCP factory owns schema-support fallback, MCP
    // isError rejection and durable content projection; do not imitate them.
    ctx.tools.register(createMcpToolDefinition(ctx, {
      name: 'mcp__openbkn__' + name, rawName: name, description: `Fixed upstream source contract: ${name}`,
      inputSchema: value.inputSchema, outputSchema: value.outputSchema,
      call: async args => {
        dispatched.push({ name, args: structuredClone(args) })
        let result: unknown = { unchanged: name }
        if (name === 'bkn_start_interaction') result = identity
        if (name === 'query_metric') result = metricReply
        if (name === 'bkn_finish_interaction') {
          if (++finishAttempts === 1) return { isError: true, content: [{ type: 'text', text: platformErrorText }] }
          result = { ...identity, execution_status: 'completed', evidence_status: 'complete' }
        }
        return { content: [{ type: 'text', text: JSON.stringify(result) }], structuredContent: result }
      },
    }))
  }
  let sequence = 0
  const call = (name: string, args: Record<string, unknown>) => ctx.tools.execute({
    name: 'mcp__openbkn__' + name, arguments: args, agent: agent as never,
    callId: ToolCallId(`platform021-${++sequence}`), signal: AbortSignal.timeout(5_000),
  })
  const start = () => call('bkn_start_interaction', { conversation_mode: 'new', question: 'Synthetic contract probe', agent_name: 'platform021-contract' })
  return { ctx, agent, call, start, dispatched, platformErrorText, finishAttempts: () => finishAttempts,
    assemble: () => ctx.systemPrompt.assemble({ scope: agent }),
  }
}

test('platform-0.2.1 preparation fixture identifies a selected unreleased source projection', () => {
  assert.equal(contract.source.commit, '1a3a76edb993d3944afb94a135392d33c90a0432')
  assert.equal(contract.source.containsFullLiveCatalogue, false)
  assert.equal(contract.source.schemaBuildersUnchangedFromFormal020, true)
  assert.match(contract.source.releaseClaim, /not a fixed 0\.2\.1 release or deployed tools\/list/)
  assert.ok(Object.hasOwn(contract.catalogueMetadata, 'drill_through_metric'), 'new tool identity comes from upstream metadata')
  for (const name of ['schemas/query_metric.json', 'schemas/tools_meta.json', 'interaction_finish.go', 'session_guard.go']) {
    assert.match(contract.source.inputsSha256[`adp/context-loader/agent-retrieval/server/driveradapters/mcp/${name}`], /^[a-f0-9]{64}$/)
  }
})

test('new metric contract exposes its required version and millisecond query without restoring retired top-level arguments', () => {
  const schema = contract.tools.query_metric.inputSchema
  assert.ok(schema.required.includes('version'))
  assert.ok(schema.required.includes('bkn_context'))
  assert.equal(schema.properties.version.type, 'integer')
  assert.equal(schema.additionalProperties, false)
  assert.equal(schema.properties.query.additionalProperties, false)
  assert.deepEqual(schema.properties.query.properties.time.required, ['start', 'end'])
  assert.equal(schema.properties.query.properties.time.properties.start.type, 'integer')
  assert.match(schema.properties.query.properties.time.description, /Unix 毫秒/)
  for (const retired of ['time', 'condition', 'analysis_dimensions', 'fill_null', 'having', 'limit', 'order_by']) {
    assert.equal(Object.hasOwn(schema.properties, retired), false, retired)
  }
  assert.ok(contract.tools.query_metric.outputSchema.required.includes('model'))
  assert.ok(contract.tools.query_metric.outputSchema.required.includes('version'))
  assert.deepEqual(contract.tools.query_metric.outputSchema.properties.entries.items.properties.status.enum, ['ok', 'no_data', 'unavailable'])
})

test('assembled model catalogue preserves new schemas and disclosures while hiding the unreviewed drill tool', async () => {
  const f = await runtimeFixture()
  try {
    const upstream = (await f.ctx.systemPrompt.assemble()).tools
    const assembled = (await f.assemble()).tools
    assert.deepEqual(assembled, upstream.filter(tool => tool.name !== 'mcp__openbkn__drill_through_metric'))
    for (const name of ['query_metric', 'get_kn_detail', 'get_object_types', 'search_schema']) {
      assert.deepEqual(assembled.find(tool => tool.name === 'mcp__openbkn__' + name)?.parameters, contract.tools[name].inputSchema)
    }
    assert.equal(contract.tools.get_kn_detail.inputSchema.properties.branch.type, 'string')
    assert.equal(contract.tools.get_object_types.inputSchema.properties.branch.type, 'string')
    assert.equal(contract.tools.search_schema.inputSchema.properties.enum_query.type, 'string')
    const declined = await f.call('drill_through_metric', { kn_id: binding.knowledgeNetworkId })
    assert.equal(declined.isError, true)
    assert.equal(f.dispatched.length, 0, 'unknown platform additions remain refused even when registered')
  } finally { await f.ctx.fiber.dispose() }
})

test('new metric arguments and result values pass unchanged only after a successful start', async () => {
  const f = await runtimeFixture()
  try {
    const args = metricArgs()
    const originalArgs = structuredClone(args)
    assert.equal((await f.call('query_metric', args)).isError, true)
    assert.equal(f.dispatched.length, 0)
    assert.notEqual((await f.start()).isError, true)
    const result = await f.call('query_metric', args)
    assert.notEqual(result.isError, true)
    assert.deepEqual(f.dispatched.at(-1), { name: 'query_metric', args: originalArgs })
    assert.deepEqual(args, originalArgs, 'the plugin does not add a version, move fields or convert time units')
    assert.deepEqual(result.content, [{ type: 'text', text: JSON.stringify(metricReply) }], 'display_value, no_data, warnings and descriptions remain platform values')
  } finally { await f.ctx.fiber.dispose() }
})

test('new metric contract still refuses missing, malformed and cross-network kn_id without dispatch', async () => {
  const f = await runtimeFixture()
  try {
    assert.notEqual((await f.start()).isError, true)
    const before = f.dispatched.length
    for (const kn_id of [undefined, null, 7, [binding.knowledgeNetworkId], 'another-network']) {
      const args: Record<string, unknown> = { ...metricArgs(), kn_id }
      if (kn_id === undefined) delete args.kn_id
      assert.equal((await f.call('query_metric', args)).isError, true)
    }
    assert.equal(f.dispatched.length, before)
  } finally { await f.ctx.fiber.dispose() }
})

test('new metric contract still requires the current conversation and interaction context without dispatch', async () => {
  const f = await runtimeFixture()
  try {
    assert.notEqual((await f.start()).isError, true)
    const before = f.dispatched.length
    for (const bkn_context of [undefined, null, 7, [], {}, { ...managedContext, interaction_id: 'other-turn' }, { ...managedContext, conversation_id: 'other-conversation' }]) {
      const args: Record<string, unknown> = { ...metricArgs(), bkn_context }
      if (bkn_context === undefined) delete args.bkn_context
      assert.equal((await f.call('query_metric', args)).isError, true)
    }
    assert.equal(f.dispatched.length, before)
    assert.notEqual((await f.call('query_metric', metricArgs())).isError, true)
  } finally { await f.ctx.fiber.dispose() }
})

test('unconfirmed finish keeps the same Interaction open for an explicit same-answer retry without automatic dispatch', async () => {
  const f = await runtimeFixture()
  try {
    assert.notEqual((await f.start()).isError, true)
    const finish = { interaction_id: identity.interaction_id, outcome: 'completed', answer: 'Unchanged synthetic model answer.' }
    const original = structuredClone(finish)
    const failed = await f.call('bkn_finish_interaction', finish)
    assert.equal(failed.isError, true)
    assert.equal(failed.error?.message, f.platformErrorText, 'the platform error and required action are not replaced')
    assert.equal(f.finishAttempts(), 1, 'the plugin does not retry or issue a corrective turn automatically')
    const beforeNewStart = f.dispatched.length
    assert.equal((await f.start()).isError, true, 'failed finish does not authorize a replacement Interaction')
    assert.equal(f.dispatched.length, beforeNewStart)
    const succeeded = await f.call('bkn_finish_interaction', finish)
    assert.notEqual(succeeded.isError, true)
    assert.equal(f.finishAttempts(), 2)
    assert.deepEqual(finish, original)
    assert.deepEqual(f.dispatched.filter(call => call.name === 'bkn_finish_interaction').map(call => call.args), [original, original])
    const afterFinish = f.dispatched.length
    assert.equal((await f.call('query_metric', metricArgs())).isError, true)
    assert.equal(f.dispatched.length, afterFinish)
  } finally { await f.ctx.fiber.dispose() }
})

test('unconfirmed finish projection retains held identities and does not mistake trace_recorded=false for success', () => {
  const active = onToolResult(initialState(), START_INTERACTION_TOOL, true, projectLifecycleOutcome({
    isError: false, content: [{ type: 'text', text: JSON.stringify(identity) }],
  }))
  const outcome = { isError: true, error: { message: JSON.stringify(contract.finishUnconfirmed.envelope) } }
  const projection = projectLifecycleOutcome(outcome)
  assert.equal(projection.errorCode, 'interaction_finish_unconfirmed')
  assert.equal(projection.recording, undefined)
  const retained = onToolResult(active, FINISH_INTERACTION_TOOL, false, projection)
  assert.deepEqual(retained, active)
  assert.equal(retained.startsThisTurn, 1)
  assert.equal(denialFor(retained, FINISH_INTERACTION_TOOL, { interaction_id: identity.interaction_id }), undefined)
  assert.match(denialFor(retained, START_INTERACTION_TOOL, { conversation_mode: 'new' }) ?? '', /already open/)
})

function loggedFinish(callId: string, envelope: Record<string, unknown>, isError: boolean, legacy = false) {
  const text = JSON.stringify(envelope)
  return [
    { type: 'tool/call', data: { turn: 7, callId, name: FINISH_INTERACTION_TOOL } },
    { type: 'tool/result', data: { turn: 7, message: {
      role: 'tool', toolCallId: callId, source: { kind: 'tool', callId },
      ...(legacy ? {} : { isError }),
      content: legacy ? [{ type: 'tool-result', toolCallId: callId, isError, content: [{ type: 'text', text }] }] : [{ type: 'text', text }],
    } } },
  ]
}
const finalAnswer = { type: 'assistant/message', data: { turn: 7, message: { id: 'unchanged-final-answer', content: [{ type: 'text', text: 'Original synthetic model answer.' }] } } }

test('unconfirmed finish never creates completed provenance in either DSH log format or a malformed success envelope', () => {
  for (const legacy of [false, true]) {
    assert.equal(findCompletedNativeMcpProvenance([...loggedFinish('unconfirmed', contract.finishUnconfirmed.envelope, true, legacy), finalAnswer], 7), undefined)
    assert.equal(findCompletedNativeMcpProvenance([...loggedFinish('unconfirmed', contract.finishUnconfirmed.envelope, false, legacy), finalAnswer], 7), undefined)
    const misleading = { ...contract.finishUnconfirmed.envelope, ...identity, execution_status: 'completed' }
    assert.equal(findCompletedNativeMcpProvenance([...loggedFinish('unconfirmed', misleading, true, legacy), finalAnswer], 7), undefined)
  }
})

test('confirmed retry associates only the successful same-Interaction finish and preserves the failed record and answer', () => {
  const failed = loggedFinish('unconfirmed', contract.finishUnconfirmed.envelope, true)
  const confirmed = { ...identity, execution_status: 'completed', evidence_status: 'complete' }
  const events = [...failed, ...loggedFinish('confirmed-retry', confirmed, false), finalAnswer]
  const before = JSON.stringify(events)
  const result = findCompletedNativeMcpProvenance(events, 7)
  assert.equal(result?.messageId, finalAnswer.data.message.id)
  assert.equal(result?.handle.interactionId, identity.interaction_id)
  assert.equal(result?.handle.conversationId, identity.conversation_id)
  assert.equal(result?.handle.status, 'completed')
  assert.equal(result?.handle.recording, undefined)
  assert.deepEqual(result?.handle.receiptIds, [])
  assert.equal(JSON.stringify(events), before)
})
