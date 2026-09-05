import assert from 'node:assert/strict'
import test from 'node:test'
import {
  TurnProvenanceConflictError,
  appendTurnProvenance,
  readTurnProvenance,
} from '../src/turn-provenance.ts'

const handle = {
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

test('does not fabricate provenance for an assistant message without a persisted handle', () => {
  assert.equal(readTurnProvenance([], 'assistant-message-1'), undefined)
})
