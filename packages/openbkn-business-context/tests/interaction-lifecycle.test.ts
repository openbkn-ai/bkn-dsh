import assert from 'node:assert/strict'
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
  recordConversationEvent,
  restoreFrom,
  type InteractionLifecycleState,
  type ManagedConversationSession,
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

test('onTurnStart resets per-turn flags and preserves whatever conversation the state holds', () => {
  let state = onToolResult(initialState(), START_INTERACTION_TOOL, true, { interactionId: 'int-1', conversationId: 'conv-1' })
  state = onTurnStart(state)
  assert.equal(state.open, false)
  assert.equal(state.startsThisTurn, 0)
  assert.equal(state.conversationInvalidatedThisTurn, false)
  assert.equal(state.conversationId, 'conv-1')
})

test('restoreFrom takes the last active conversation event', () => {
  const events = [
    { type: MANAGED_CONVERSATION_EVENT, data: { conversationId: 'conv-1', status: 'active', recordedAt: 1 } },
    { type: MANAGED_CONVERSATION_EVENT, data: { conversationId: 'conv-2', status: 'active', recordedAt: 2 } },
  ]
  const state = restoreFrom(events)
  assert.equal(state.conversationId, 'conv-2')
  assert.equal(state.open, false)
})

test('restoreFrom reads a tombstone as no conversation available', () => {
  const events = [
    { type: MANAGED_CONVERSATION_EVENT, data: { conversationId: 'conv-1', status: 'active', recordedAt: 1 } },
    { type: MANAGED_CONVERSATION_EVENT, data: { conversationId: 'conv-1', status: 'invalidated', recordedAt: 2 } },
  ]
  assert.equal(restoreFrom(events).conversationId, undefined)
})

test('restoreFrom of an old session without conversation events yields undefined', () => {
  assert.equal(restoreFrom([{ type: 'openbkn/business-network-bound', data: {} }]).conversationId, undefined)
  assert.equal(restoreFrom([]).conversationId, undefined)
})

test('restoreFrom ignores malformed conversation events', () => {
  const events = [
    { type: MANAGED_CONVERSATION_EVENT, data: { conversationId: 'conv-1', status: 'active', recordedAt: 1 } },
    { type: MANAGED_CONVERSATION_EVENT, data: 'malformed' },
  ]
  assert.equal(restoreFrom(events).conversationId, 'conv-1')
})

test('recordConversationEvent appends an ignorable durable event', () => {
  const appended: Array<{ type: string; data: unknown; options?: { ignorable?: true } }> = []
  const session: ManagedConversationSession = {
    append(type, data, options) { appended.push({ type, data, options }) },
    snapshotEvents: () => appended,
  }
  recordConversationEvent(session, 'conv-1', 'active')
  assert.equal(appended.length, 1)
  assert.equal(appended[0]!.type, MANAGED_CONVERSATION_EVENT)
  assert.deepEqual(appended[0]!.options, { ignorable: true })
  assert.deepEqual(restoreFrom(session.snapshotEvents()).conversationId, 'conv-1')
})

test('lastConversationEvent returns the durable record verbatim, recordedAt included', () => {
  const events = [
    { type: MANAGED_CONVERSATION_EVENT, data: { conversationId: 'conv-1', status: 'active', recordedAt: 1_700_000_000_000 } },
    { type: MANAGED_CONVERSATION_EVENT, data: { conversationId: 'conv-1', status: 'invalidated', recordedAt: 1_700_000_000_001 } },
    { type: MANAGED_CONVERSATION_EVENT, data: { conversationId: 'conv-2', status: 'active', recordedAt: 1_700_000_000_002 } },
  ]
  assert.deepEqual(lastConversationEvent(events), { conversationId: 'conv-2', status: 'active', recordedAt: 1_700_000_000_002 })
  // The verbatim read keeps a closing tombstone distinguishable from "no event
  // ever existed"; only restoreFrom collapses both to "no id held".
  assert.deepEqual(lastConversationEvent(events.slice(0, 2)), { conversationId: 'conv-1', status: 'invalidated', recordedAt: 1_700_000_000_001 })
  assert.equal(restoreFrom(events.slice(0, 2)).conversationId, undefined)
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
