import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { initialState, projectLifecycleOutcome, onToolResult, denialFor, START_INTERACTION_TOOL, FINISH_INTERACTION_TOOL } from '../src/interaction-lifecycle.ts'
import { findCompletedNativeMcpProvenance } from '../src/native-mcp-provenance.ts'
import { normalizeProvenanceHandle } from '../src/provenance-handle.ts'
import { managedContextDenial } from '../src/scoped-business-context.ts'

const fixture = JSON.parse(readFileSync(new URL('./fixtures/context-loader-tools-v0.2.0-release.json', import.meta.url), 'utf8'))
const project = (value: unknown) => projectLifecycleOutcome({ isError: false, content: [{ type: 'text', text: JSON.stringify(value) }] })

test('formal release capture-disabled start retains the platform-issued managed identities', () => {
  const reply = fixture.lifecycleExamples.captureDisabledStart
  const payload = project(reply)
  assert.deepEqual(payload, { recording: 'disabled', interactionId: reply.interaction_id, conversationId: reply.conversation_id })
  const state = onToolResult(initialState(), START_INTERACTION_TOOL, true, payload)
  assert.equal(state.open, true)
  assert.equal(denialFor(state, 'mcp__openbkn__search_schema', { bkn_context: { interaction_id: reply.interaction_id, conversation_id: reply.conversation_id } }), undefined)
  assert.equal(denialFor(state, FINISH_INTERACTION_TOOL, { interaction_id: reply.interaction_id }), undefined)
  assert.match(denialFor(state, FINISH_INTERACTION_TOOL, { interaction_id: 'previous-turn' }) ?? '', /Interaction/)
  for (const bad of [
    { ...reply, interaction_id: undefined }, { ...reply, conversation_id: undefined },
    { ...reply, capture_enabled: true }, { ...reply, execution_status: 'unknown' },
  ]) assert.equal(onToolResult(initialState(), START_INTERACTION_TOOL, true, project(bad)).open, false)
})

test('formal release disabled finish preserves identities without fabricating recorded evidence', () => {
  const reply = fixture.lifecycleExamples.captureDisabledFinish
  const events = [
    { type: 'tool/call', data: { turn: 1, callId: 'finish', name: FINISH_INTERACTION_TOOL } },
    { type: 'tool/result', data: { turn: 1, message: { source: { kind: 'tool', callId: 'finish' }, content: [{ type: 'text', text: JSON.stringify(reply) }] } } },
    { type: 'assistant/message', data: { turn: 1, message: { id: 'native-answer', content: [{ type: 'text', text: 'Native model answer' }] } } },
  ]
  const result = findCompletedNativeMcpProvenance(events, 1)
  assert.equal(result?.handle.interactionId, reply.interaction_id)
  assert.equal(result?.handle.conversationId, reply.conversation_id)
  assert.equal(result?.handle.recording, 'disabled')
  assert.deepEqual(result?.handle.traceIds, [])
  assert.deepEqual(normalizeProvenanceHandle(result?.handle), result?.handle)
  assert.throws(() => normalizeProvenanceHandle({ ...result?.handle, receiptIds: ['invented'] }))
  assert.equal(findCompletedNativeMcpProvenance(events, 2), undefined)
})

test('formal release schemas require managed context on every projected business tool', () => {
  assert.equal(fixture.source.tag, 'v0.2.0')
  assert.equal(fixture.source.commit, '81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b')
  for (const [name, value] of Object.entries(fixture.tools) as [string, { inputSchema?: { required?: string[] } }][]) {
    if (!value.inputSchema || name.startsWith('bkn_')) continue
    assert.ok(value.inputSchema.required?.includes('bkn_context'), name)
  }
})

test('published required context refuses missing, malformed and different-turn identities', () => {
  const state = onToolResult(initialState(), START_INTERACTION_TOOL, true, project(fixture.lifecycleExamples.captureDisabledStart))
  const definition = { parameters: fixture.tools.search_capabilities.inputSchema }
  const context = { conversation_id: state.conversationId, interaction_id: state.interactionId }
  assert.equal(managedContextDenial(state, { bkn_context: context }, definition), undefined)
  for (const value of [undefined, 42, [], { ...context, interaction_id: 'old' }, { ...context, conversation_id: 'other' }]) {
    assert.match(managedContextDenial(state, { bkn_context: value }, definition) ?? '', /requires bkn_context/)
  }
  assert.equal(managedContextDenial(state, {}, { parameters: { type: 'object', properties: {} } }), undefined, 'older published contracts remain independent')
})

test('formal unavailable finish degrades honestly and cannot open a new Interaction', () => {
  // lifecycleUnrecordedResult in the same pinned session_guard.go; not a live response.
  const reply = { trace_recorded: false, trace_available: false, stage: 'finish_interaction', code: 'trace_core_unavailable' }
  assert.equal(onToolResult(initialState(), START_INTERACTION_TOOL, true, project(reply)).open, false)
  const events = [
    { type: 'tool/call', data: { turn: 1, callId: 'finish', name: FINISH_INTERACTION_TOOL } },
    { type: 'tool/result', data: { turn: 1, message: { source: { kind: 'tool', callId: 'finish' }, content: [{ type: 'text', text: JSON.stringify(reply) }] } } },
    { type: 'assistant/message', data: { turn: 1, message: { id: 'answer', content: [{ type: 'text', text: 'Unchanged answer' }] } } },
  ]
  const result = findCompletedNativeMcpProvenance(events, 1)
  assert.equal(result?.handle.recording, 'unavailable')
  assert.equal(result?.handle.interactionId, undefined)
})

test('an unrecorded result never borrows identities from a different text record', () => {
  const events = [
    { type: 'tool/call', data: { turn: 1, callId: 'finish', name: FINISH_INTERACTION_TOOL } },
    { type: 'tool/result', data: { turn: 1, message: { source: { kind: 'tool', callId: 'finish' }, content: [
      { type: 'text', text: JSON.stringify({ interaction_id: 'unrelated', conversation_id: 'unrelated-conversation' }) },
      { type: 'text', text: JSON.stringify({ trace_recorded: false, trace_available: false, stage: 'finish_interaction', code: 'trace_core_unavailable' }) },
    ] } } },
    { type: 'assistant/message', data: { turn: 1, message: { id: 'answer', content: [{ type: 'text', text: 'Original answer' }] } } },
  ]
  const result = findCompletedNativeMcpProvenance(events, 1)
  assert.equal(result?.handle.interactionId, undefined)
  assert.equal(result?.handle.conversationId, undefined)
  assert.equal(result?.handle.recording, 'unavailable')
  assert.deepEqual(normalizeProvenanceHandle(result?.handle), result?.handle)
})
