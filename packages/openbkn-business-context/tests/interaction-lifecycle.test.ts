import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  CONVERSATION_INVALID_ERROR_CODES,
  FINISH_INTERACTION_TOOL,
  MANAGED_CONVERSATION_EVENT,
  START_INTERACTION_TOOL,
  classifyFailure,
  denialFor,
  initialState,
  lastConversationEvent,
  onToolResult,
  onTurnStart,
  projectLifecycleOutcome,
  restoreFrom,
  type InteractionLifecycleState,
} from '../src/interaction-lifecycle.ts'

test('initial state is closed with no conversation held', () => {
  assert.deepEqual(initialState(), { open: false, conversationInvalidatedThisTurn: false, startsThisTurn: 0 })
})

test('a successful start opens the interaction and adopts disclosed ids', () => {
  const state = onToolResult(initialState(), START_INTERACTION_TOOL, true, { interactionId: 'int-1', conversationId: 'conv-1' })
  assert.equal(state.open, true)
  assert.equal(state.interactionId, 'int-1')
  assert.equal(state.conversationId, 'conv-1')
  assert.equal(state.startsThisTurn, 1)
})

test('a failed start leaves the interaction closed', () => {
  const state = onToolResult(initialState(), START_INTERACTION_TOOL, false, { errorCode: 'invalid_params' })
  assert.equal(state.open, false)
  assert.equal(state.startsThisTurn, 0)
})

test('a successful finish closes the interaction but keeps the conversation', () => {
  let state = onToolResult(initialState(), START_INTERACTION_TOOL, true, { interactionId: 'int-1', conversationId: 'conv-1' })
  state = onToolResult(state, FINISH_INTERACTION_TOOL, true, { interactionId: 'int-1', conversationId: 'conv-1' })
  assert.equal(state.open, false)
  assert.equal(state.interactionId, undefined)
  assert.equal(state.conversationId, 'conv-1')
})

test('a failed finish keeps the interaction open so the model may retry', () => {
  let state = onToolResult(initialState(), START_INTERACTION_TOOL, true, { interactionId: 'int-1' })
  state = onToolResult(state, FINISH_INTERACTION_TOOL, false, {})
  assert.equal(state.open, true)
  assert.equal(state.interactionId, 'int-1')
})

test('a successful finish closes access even when its result cannot disclose usable provenance IDs', () => {
  const active = onToolResult(initialState(), START_INTERACTION_TOOL, true, { interactionId: 'int-1', conversationId: 'conv-1' })
  for (const reply of [{}, { trace_recorded: false, interaction_id: 'int-1' }]) {
    const projection = projectLifecycleOutcome({ isError: false, content: [{ type: 'text', text: JSON.stringify(reply) }] })
    assert.deepEqual(projection, {})
    const finished = onToolResult(active, FINISH_INTERACTION_TOOL, true, projection)
    assert.equal(finished.open, false)
    assert.equal(finished.interactionId, undefined)
    assert.equal(finished.conversationId, 'conv-1')
    assert.ok(denialFor(finished, 'mcp__openbkn__search_schema', { kn_id: 'kn-supply' }))
    assert.ok(denialFor(finished, START_INTERACTION_TOOL, {}))
    assert.ok(denialFor(finished, FINISH_INTERACTION_TOOL, {}))
  }
})

test('onTurnStart resets per-turn flags and preserves whatever conversation the state holds', () => {
  let state = onToolResult(initialState(), START_INTERACTION_TOOL, true, { interactionId: 'int-1', conversationId: 'conv-1' })
  state = onTurnStart(state)
  assert.equal(state.open, false)
  assert.equal(state.startsThisTurn, 0)
  assert.equal(state.conversationInvalidatedThisTurn, false)
  assert.equal(state.conversationId, 'conv-1')
})

// ---------------------------------------------------------------------------
// restoreFrom: replay the logged lifecycle results (no plugin event involved).
// ---------------------------------------------------------------------------

const turnStart = (turn: number) => ({ type: 'turn/start', data: { turn } })
const call = (callId: string, name: string, turn: number) => ({ type: 'tool/call', data: { turn, step: 1, callId, name, arguments: '{}' } })
const result = (callId: string, turn: number, text: string, isError = false) => ({
  type: 'tool/result',
  data: { turn, step: 1, message: { role: 'tool', toolCallId: callId, source: { kind: 'tool', callId }, isError, content: [{ type: 'text', text }] } },
})
const started = (callId: string, turn: number, conversationId: string) => [
  call(callId, START_INTERACTION_TOOL, turn),
  result(callId, turn, JSON.stringify({ interaction_id: `int-${callId}`, conversation_id: conversationId, execution_status: 'active' })),
]
const refused = (callId: string, turn: number, code: string) => [
  call(callId, START_INTERACTION_TOOL, turn),
  result(callId, turn, `Error: ${JSON.stringify({ error: { code, message: 'refused' } })}`, true),
]

test('restoreFrom resumes the conversation of the last logged successful start', () => {
  const events = [turnStart(1), ...started('a', 1, 'conv-1'), turnStart(2), ...started('b', 2, 'conv-2')]
  const state = restoreFrom(events)
  assert.equal(state.conversationId, 'conv-2')
  assert.equal(state.open, false)
  assert.equal(state.startsThisTurn, 0)
})

test('restoreFrom drops a conversation the platform invalidated, and never resurrects it', () => {
  const events = [turnStart(1), ...started('a', 1, 'conv-1'), turnStart(2), ...refused('b', 2, 'resource_not_disclosed')]
  assert.equal(restoreFrom(events).conversationId, undefined)
  assert.equal(restoreFrom([...events, turnStart(3), ...started('c', 3, 'conv-3')]).conversationId, 'conv-3')
})

test('restoreFrom keeps the conversation through non-invalidating failures and guard denials', () => {
  const events = [
    turnStart(1), ...started('a', 1, 'conv-1'),
    turnStart(2), ...refused('b', 2, 'invalid_params'),
    call('c', START_INTERACTION_TOOL, 2), result('c', 2, 'Error: An OpenBKN interaction is already open in this turn.', true),
  ]
  assert.equal(restoreFrom(events).conversationId, 'conv-1')
})

test('restoreFrom reads legacy tool-result wrappers too', () => {
  const legacy = {
    type: 'tool/result',
    data: { turn: 1, step: 1, message: { role: 'user', source: { kind: 'tool', callId: 'a' }, content: [{
      type: 'tool-result', toolCallId: 'a', content: [{ type: 'text', text: '{"interaction_id":"int-a","conversation_id":"conv-legacy"}' }],
    }] } },
  }
  assert.equal(restoreFrom([turnStart(1), call('a', START_INTERACTION_TOOL, 1), legacy]).conversationId, 'conv-legacy')
})

test('restoreFrom ignores recorded plugin events and unrelated tools', () => {
  assert.equal(restoreFrom([]).conversationId, undefined)
  assert.equal(restoreFrom([
    { type: MANAGED_CONVERSATION_EVENT, data: { conversationId: 'conv-recorded', status: 'active', recordedAt: 1 } },
    turnStart(1), call('x', 'mcp__openbkn__search_schema', 1), result('x', 1, '{"conversation_id":"conv-x"}'),
  ]).conversationId, undefined)
})

test('a fork (a log prefix) resumes the conversation held at its fork point', () => {
  const events = [turnStart(1), ...started('a', 1, 'conv-1'), turnStart(2), ...started('b', 2, 'conv-2')]
  assert.equal(restoreFrom(events.slice(0, 3)).conversationId, 'conv-1')
})

test('replaying real logs reproduces the conversation state the plugin recorded at the time', () => {
  const fixtures = ['v4-desktop-session.json', 'v3-migrated-session-5ef9.json', 'v3-migrated-session-0165.json', 'v3-migrated-session-7979.json']
  for (const name of fixtures) {
    const events = JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')) as { type: string; data: unknown }[]
    const recorded = lastConversationEvent(events)
    assert.notEqual(recorded, undefined, name)
    assert.equal(restoreFrom(events).conversationId, recorded?.status === 'active' ? recorded.conversationId : undefined, name)
  }
})

test('lastConversationEvent returns the durable record verbatim, recordedAt included', () => {
  const events = [
    { type: MANAGED_CONVERSATION_EVENT, data: { conversationId: 'conv-1', status: 'active', recordedAt: 1_700_000_000_000 } },
    { type: MANAGED_CONVERSATION_EVENT, data: { conversationId: 'conv-1', status: 'invalidated', recordedAt: 1_700_000_000_001 } },
    { type: MANAGED_CONVERSATION_EVENT, data: { conversationId: 'conv-2', status: 'active', recordedAt: 1_700_000_000_002 } },
  ]
  assert.deepEqual(lastConversationEvent(events), { conversationId: 'conv-2', status: 'active', recordedAt: 1_700_000_000_002 })
  // The verbatim read keeps a closing tombstone distinguishable from "no event
  // ever existed".
  assert.deepEqual(lastConversationEvent(events.slice(0, 2)), { conversationId: 'conv-1', status: 'invalidated', recordedAt: 1_700_000_000_001 })
  // A missing or non-finite recordedAt degrades to 0 instead of being invented.
  assert.deepEqual(
    lastConversationEvent([{ type: MANAGED_CONVERSATION_EVENT, data: { conversationId: 'conv-3', status: 'active' } }]),
    { conversationId: 'conv-3', status: 'active', recordedAt: 0 },
  )
})

// ---------------------------------------------------------------------------
// classifyFailure (§5.3): only explicit platform invalidation codes count.
// ---------------------------------------------------------------------------

test('classifyFailure marks only platform invalidation codes as conversation-invalid', () => {
  for (const code of CONVERSATION_INVALID_ERROR_CODES) {
    assert.equal(classifyFailure({ errorCode: code }), 'conversation-invalid')
  }
  assert.equal(classifyFailure({ errorCode: 'invalid_params' }), 'other')
  assert.equal(classifyFailure({ errorCode: 'permission_denied' }), 'other')
  assert.equal(classifyFailure({}), 'other')
})

// The envelope shape below is the platform's real one (agent-retrieval
// `lifecycleToolErrorWithDetails`): the code nests under `error`, and DSH's
// MCP client surfaces that text through `error.message`.

test('projectLifecycleOutcome extracts the code from the platform nested error envelope', () => {
  const outcome = projectLifecycleOutcome({
    isError: true,
    error: { message: '{"error":{"code":"resource_not_disclosed","message":"conversation not disclosed","retryable":false,"request_id":"req-1"}}' },
  })
  assert.deepEqual(outcome, { errorCode: 'resource_not_disclosed' })
  assert.equal(classifyFailure(outcome), 'conversation-invalid')
})

test('projectLifecycleOutcome still reads a legacy flat envelope and known nested variants', () => {
  assert.deepEqual(projectLifecycleOutcome({ isError: true, error: { message: '{"code":"resource_not_disclosed"}' } }), { errorCode: 'resource_not_disclosed' })
  assert.deepEqual(projectLifecycleOutcome({ isError: true, error: { message: '{"error":{"error_code":"conversation_owner_mismatch"}}' } }), { errorCode: 'conversation_owner_mismatch' })
})

test('projectLifecycleOutcome treats unparsable or code-less failures as not determinable', () => {
  assert.deepEqual(projectLifecycleOutcome({ isError: true, error: { message: 'gateway timeout' } }), {})
  assert.deepEqual(projectLifecycleOutcome({ isError: true, error: { message: '{"error":{"message":"no code field"}}' } }), {})
})

test('projectLifecycleOutcome reads ids from a successful lifecycle result', () => {
  assert.deepEqual(projectLifecycleOutcome({
    isError: false,
    content: [{ type: 'text', text: '{"interaction_id":"int-1","conversation_id":"conv-1","execution_status":"in_progress"}' }],
  }), { interactionId: 'int-1', conversationId: 'conv-1' })
})

test('a non-invalidating failed start never clears the held conversation', () => {
  let state: InteractionLifecycleState = { ...initialState(), conversationId: 'conv-1' }
  state = onToolResult(state, START_INTERACTION_TOOL, false, { errorCode: 'invalid_params' })
  assert.equal(state.conversationId, 'conv-1')
  state = onToolResult(state, START_INTERACTION_TOOL, false, {})
  assert.equal(state.conversationId, 'conv-1')
})

test('a platform-invalidated start drops the held conversation and allows one controlled recovery', () => {
  let state: InteractionLifecycleState = { ...initialState(), conversationId: 'conv-1' }
  state = onToolResult(state, START_INTERACTION_TOOL, false, { errorCode: 'resource_not_disclosed' })
  assert.equal(state.conversationInvalidatedThisTurn, true)
  assert.equal(state.conversationId, undefined, 'the dead id must not survive in memory')
  const controlledNew = onToolResult(state, START_INTERACTION_TOOL, true, { interactionId: 'int-2', conversationId: 'conv-2' })
  assert.equal(controlledNew.conversationId, 'conv-2')
  assert.equal(controlledNew.startsThisTurn, 1)
})

// ---------------------------------------------------------------------------
// denialFor (§6.3 rules 2–5).
// ---------------------------------------------------------------------------

test('rule 2: a managed in-interaction tool is denied before any start, with a retryable next step', () => {
  const denial = denialFor(initialState(), 'mcp__openbkn__search_schema', {})
  assert.match(denial ?? '', /Start mcp__openbkn__bkn_start_interaction before any OpenBKN access in this turn, then retry this call/)
})

test('rule 2 after the turn completed: the denial forbids further access instead of sending the model into a start that would be rejected', () => {
  let state = onToolResult(initialState(), START_INTERACTION_TOOL, true, { interactionId: 'int-1', conversationId: 'conv-1' })
  state = onToolResult(state, FINISH_INTERACTION_TOOL, true, { interactionId: 'int-1', conversationId: 'conv-1' })
  const denial = denialFor(state, 'mcp__openbkn__search_schema', {}) ?? ''
  assert.match(denial, /already completed its one OpenBKN interaction; no further OpenBKN access is possible/)
  assert.doesNotMatch(denial, /then retry this call/)
})

test('rule 3: start is denied while an interaction is open', () => {
  const state = onToolResult(initialState(), START_INTERACTION_TOOL, true, { interactionId: 'int-1' })
  const denial = denialFor(state, START_INTERACTION_TOOL, { conversation_mode: 'continue', conversation_id: 'conv-1' })
  assert.match(denial ?? '', /already open in this turn/)
})

test('rule 4: new is denied while a conversation is held, with the exact id in the text', () => {
  const state: InteractionLifecycleState = { ...initialState(), conversationId: 'conv-1' }
  const denial = denialFor(state, START_INTERACTION_TOOL, { conversation_mode: 'new' })
  assert.match(denial ?? '', /conversation_mode "continue"/)
  assert.match(denial ?? '', /conv-1/)
})

test('rule 4: continue with a mismatched id is denied with the correct value', () => {
  const state: InteractionLifecycleState = { ...initialState(), conversationId: 'conv-1' }
  const denial = denialFor(state, START_INTERACTION_TOOL, { conversation_mode: 'continue', conversation_id: 'conv-other' })
  assert.match(denial ?? '', /does not match/)
  assert.match(denial ?? '', /conv-1/)
})

test('rule 4: continue without any held conversation is denied towards new', () => {
  const denial = denialFor(initialState(), START_INTERACTION_TOOL, { conversation_mode: 'continue', conversation_id: 'conv-guessed' })
  assert.match(denial ?? '', /No prior OpenBKN conversation/)
})

test('a matching continue is allowed', () => {
  const state: InteractionLifecycleState = { ...initialState(), conversationId: 'conv-1' }
  assert.equal(denialFor(state, START_INTERACTION_TOOL, { conversation_mode: 'continue', conversation_id: 'conv-1' }), undefined)
})

test('rule 5: finish is denied without an open interaction', () => {
  const denial = denialFor(initialState(), FINISH_INTERACTION_TOOL, { outcome: 'completed' })
  assert.match(denial ?? '', /No OpenBKN interaction is open/)
})

test('after a platform-judged invalidation, exactly one controlled new is allowed', () => {
  let state: InteractionLifecycleState = { ...initialState(), conversationId: 'conv-1' }
  state = onToolResult(state, START_INTERACTION_TOOL, false, { errorCode: 'conversation_owner_mismatch' })
  assert.equal(denialFor(state, START_INTERACTION_TOOL, { conversation_mode: 'new' }), undefined)
  assert.match(denialFor(state, START_INTERACTION_TOOL, { conversation_mode: 'continue', conversation_id: 'conv-1' }) ?? '', /judged invalid/)
  const afterNew = onToolResult(state, START_INTERACTION_TOOL, true, { interactionId: 'int-2', conversationId: 'conv-2' })
  assert.match(denialFor(afterNew, START_INTERACTION_TOOL, { conversation_mode: 'new' }) ?? '', /already open/)
})

test('a turn that finished its interaction cannot start a second one', () => {
  let state = onToolResult(initialState(), START_INTERACTION_TOOL, true, { interactionId: 'int-1', conversationId: 'conv-1' })
  state = onToolResult(state, FINISH_INTERACTION_TOOL, true, { interactionId: 'int-1', conversationId: 'conv-1' })
  const denial = denialFor(state, START_INTERACTION_TOOL, { conversation_mode: 'continue', conversation_id: 'conv-1' })
  assert.match(denial ?? '', /already completed its one OpenBKN interaction/)
})

test('retrying a failed start in the same turn stays allowed', () => {
  let state: InteractionLifecycleState = { ...initialState(), conversationId: 'conv-1' }
  state = onToolResult(state, START_INTERACTION_TOOL, false, { errorCode: 'invalid_params' })
  assert.equal(denialFor(state, START_INTERACTION_TOOL, { conversation_mode: 'continue', conversation_id: 'conv-1' }), undefined)
})

test('an unmatched or absent conversation_mode is left to platform validation', () => {
  const state: InteractionLifecycleState = { ...initialState(), conversationId: 'conv-1' }
  assert.equal(denialFor(state, START_INTERACTION_TOOL, {}), undefined)
})

test('0.2.0 explicit unrecorded start opens governed access without stale interaction identity', () => {
  const outcome = projectLifecycleOutcome({ isError: false, content: [{ type: 'text', text: JSON.stringify({
    trace_recorded: false, trace_available: false, stage: 'start_interaction', code: 'trace_core_unavailable',
    required_action: 'continue_without_bkn_context',
  }) }] })
  assert.deepEqual(outcome, { recording: 'unavailable' })
  const state = onToolResult({ ...initialState(), conversationId: 'prior-conversation', interactionId: 'prior-interaction' }, START_INTERACTION_TOOL, true, outcome)
  assert.equal(state.open, true)
  assert.equal(state.interactionId, undefined)
  assert.equal(state.conversationId, 'prior-conversation')
  assert.equal(state.recording, 'unavailable')
  assert.equal(denialFor(state, 'mcp__openbkn__query_object_instance', {}), undefined)
  assert.equal(state.startsThisTurn, 1)
  assert.match(denialFor(state, START_INTERACTION_TOOL, {}) ?? '', /already open/)
  const finished = onToolResult(state, FINISH_INTERACTION_TOOL, true, outcome)
  assert.equal(finished.open, false)
  assert.equal(finished.conversationId, 'prior-conversation')
  assert.match(denialFor(finished, START_INTERACTION_TOOL, {}) ?? '', /one OpenBKN interaction/)
})

test('disabled Trace preserves Conversation across turns; errors and unknown missing IDs never open access', () => {
  const reply = { trace_recorded: false, capture_enabled: false, code: 'capture_disabled', required_action: 'continue_without_bkn_context' }
  const project = (value: unknown, isError = false) => projectLifecycleOutcome({ isError, content: [{ type: 'text', text: JSON.stringify(value) }], error: { message: JSON.stringify(value) } })
  const prior = { ...initialState(), conversationId: 'prior-conversation' }
  const disabled = project(reply)
  assert.deepEqual(disabled, { recording: 'disabled' })
  const active = onToolResult(prior, START_INTERACTION_TOOL, true, disabled)
  assert.match(denialFor(active, 'mcp__openbkn__search_schema', { bkn_context: { interaction_id: 'old' } }) ?? '', /do not reuse/)
  assert.match(denialFor(active, FINISH_INTERACTION_TOOL, { interaction_id: 'old' }) ?? '', /Omit/)
  assert.equal(denialFor(active, FINISH_INTERACTION_TOOL, { outcome: 'completed', answer: 'native answer' }), undefined)
  assert.equal(onTurnStart(active).recording, undefined)
  assert.equal(onTurnStart(active).conversationId, 'prior-conversation')
  for (const invalid of [{}, { code: 'Unauthorized' }, { ...reply, required_action: 'unknown' }, { ...reply, trace_recorded: undefined }, { ...reply, interaction_id: 'stale' }, { ...reply, capture_enabled: true }]) {
    const state = onToolResult(prior, START_INTERACTION_TOOL, true, project(invalid))
    assert.equal(state.open, false)
    assert.equal(state.conversationId, 'prior-conversation')
    assert.ok(denialFor(state, 'mcp__openbkn__query_object_instance', {}))
  }
  for (const value of [reply, { error: { code: 'auth_rejected' } }]) {
    assert.equal(onToolResult(prior, START_INTERACTION_TOOL, false, project(value, true)).open, false)
  }
})

test('lifecycle projection accepts only a valid platform diagnostic suffix, not arbitrary appended text', () => {
  const reply = JSON.stringify({ interaction_id: 'i', conversation_id: 'c' })
  for (const suffix of ['\n[BKN_TRACE]bad', '\n[BKN_TRACE]{"other":true}', '\nany prose', '\n[BKN_TRACE]{"bkn_trace":{}}\nmore']) {
    assert.deepEqual(projectLifecycleOutcome({ isError: false, content: [{ type: 'text', text: reply + suffix }] }), {})
  }
  assert.deepEqual(projectLifecycleOutcome({ isError: false, content: [{ type: 'text', text: reply + '\n[BKN_TRACE]{"bkn_trace":{}}' }] }), { interactionId: 'i', conversationId: 'c' })
})
