import assert from 'node:assert/strict'
import test from 'node:test'
import {
  TurnProvenanceConflictError,
  appendTurnProvenance,
  readTurnProvenance,
} from '../src/turn-provenance.ts'

const handle = {
  schemaVersion: 2 as const,
  interactionId: 'interaction-1',
  requestIds: [] as string[],
  traceIds: [] as string[],
  receiptIds: [] as string[],
  status: 'completed' as const,
  partial: true,
  conversationId: 'conv-1',
  turn: 4,
}

const legacyHandle = {
  schemaVersion: 1 as const,
  interactionId: 'interaction-1',
  requestIds: [],
  traceIds: [],
  receiptIds: [],
  status: 'completed' as const,
  partial: true,
}

test('appends one completed-turn provenance handle and restores it by assistant message', () => {
  const history: unknown[] = []
  const appended = appendTurnProvenance(history as never[], 'assistant-message-1', handle)
  history.push(appended)

  assert.deepEqual(appended, {
    type: 'openbkn/turn-provenance',
    data: { messageId: 'assistant-message-1', handle },
  })
  assert.deepEqual(readTurnProvenance(history as never[], 'assistant-message-1'), handle)
})

test('is idempotent for the same assistant message and rejects conflicting provenance', () => {
  const history = [{ type: 'openbkn/turn-provenance', data: { messageId: 'assistant-message-1', handle } }]
  assert.equal(appendTurnProvenance(history, 'assistant-message-1', handle), undefined)
  assert.throws(() => appendTurnProvenance(history, 'assistant-message-1', {
    ...handle, interactionId: 'interaction-2',
  }), TurnProvenanceConflictError)
})

test('a stored v1 event and a re-captured v2 handle for the same interaction do not conflict', () => {
  const history = [{ type: 'openbkn/turn-provenance', data: { messageId: 'assistant-message-1', handle: legacyHandle } }]
  // The v2 re-capture enriches the same turn: no rewrite, no conflict.
  assert.equal(appendTurnProvenance(history, 'assistant-message-1', handle), undefined)
  // Reading a log holding both shapes for the same interaction stays consistent.
  const mixed = [
    { type: 'openbkn/turn-provenance', data: { messageId: 'assistant-message-1', handle: legacyHandle } },
    { type: 'openbkn/turn-provenance', data: { messageId: 'assistant-message-1', handle } },
  ]
  assert.equal(readTurnProvenance(mixed, 'assistant-message-1')?.interactionId, 'interaction-1')
})

test('still refuses a legacy event rewritten to a different interaction', () => {
  const history = [{ type: 'openbkn/turn-provenance', data: { messageId: 'assistant-message-1', handle: legacyHandle } }]
  assert.throws(() => appendTurnProvenance(history, 'assistant-message-1', {
    ...handle, interactionId: 'interaction-2',
  }), TurnProvenanceConflictError)
})

test('does not fabricate provenance for an assistant message without a persisted handle', () => {
  assert.equal(readTurnProvenance([], 'assistant-message-1'), undefined)
})
