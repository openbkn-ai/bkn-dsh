import assert from 'node:assert/strict'
import test from 'node:test'
import { readDshSessionTurnProvenance } from '../src/dsh-session-provenance.ts'
import { TurnProvenanceConflictError, readTurnProvenance } from '../src/turn-provenance.ts'

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

/** One logged turn whose finish call completed `interactionId`, answered by `answerId`. */
function completedTurn(turn: number, interactionId: string, answerId: string) {
  return [
    { type: 'tool/call', data: { turn, step: 1, callId: `finish-${turn}`, name: 'mcp__openbkn__bkn_finish_interaction', arguments: '{}' } },
    { type: 'tool/result', data: { turn, step: 1, message: {
      role: 'tool', toolCallId: `finish-${turn}`, source: { kind: 'tool', callId: `finish-${turn}` }, isError: false,
      content: [{ type: 'text', text: JSON.stringify({ interaction_id: interactionId, conversation_id: 'conv-1', execution_status: 'completed' }) }],
    } } },
    { type: 'assistant/message', data: { turn, step: 2, message: { id: answerId, role: 'assistant', content: [{ type: 'text', text: 'answer' }] } } },
  ]
}

const sessionOf = (events: unknown[]) => ({ snapshotEvents: () => events as { type: string; data: unknown }[] })

test('reads a recorded provenance event under its original or migrated name', () => {
  for (const type of ['openbkn/turn-provenance', 'plugin:openbkn/turn-provenance']) {
    assert.deepEqual(readTurnProvenance([{ type, data: { messageId: 'assistant-message-1', handle } }], 'assistant-message-1'), handle, type)
  }
})

test('a v1 and a v2 record of the same interaction agree; a rewrite to another interaction conflicts', () => {
  const mixed = [
    { type: 'openbkn/turn-provenance', data: { messageId: 'assistant-message-1', handle: legacyHandle } },
    { type: 'openbkn/turn-provenance', data: { messageId: 'assistant-message-1', handle } },
  ]
  assert.equal(readTurnProvenance(mixed, 'assistant-message-1')?.interactionId, 'interaction-1')
  assert.throws(() => readTurnProvenance([
    ...mixed,
    { type: 'openbkn/turn-provenance', data: { messageId: 'assistant-message-1', handle: { ...handle, interactionId: 'interaction-2' } } },
  ], 'assistant-message-1'), TurnProvenanceConflictError)
})

test('re-derives provenance from the logged finish result when nothing was recorded', () => {
  const session = sessionOf(completedTurn(4, 'interaction-1', 'answer-4'))
  const derived = readDshSessionTurnProvenance(session, 'answer-4')
  assert.equal(derived?.interactionId, 'interaction-1')
  assert.equal(derived?.turn, 4)
  assert.equal(derived?.conversationId, 'conv-1')
  assert.equal(readDshSessionTurnProvenance(session, 'not-an-answer'), undefined)
})

test('a recorded event must agree with the re-derived provenance of the same answer', () => {
  const agreeing = sessionOf([
    ...completedTurn(4, 'interaction-1', 'answer-4'),
    { type: 'openbkn/turn-provenance', data: { messageId: 'answer-4', handle: legacyHandle } },
  ])
  assert.equal(readDshSessionTurnProvenance(agreeing, 'answer-4')?.interactionId, 'interaction-1')

  const conflicting = sessionOf([
    ...completedTurn(4, 'interaction-2', 'answer-4'),
    { type: 'openbkn/turn-provenance', data: { messageId: 'answer-4', handle: legacyHandle } },
  ])
  assert.throws(() => readDshSessionTurnProvenance(conflicting, 'answer-4'), TurnProvenanceConflictError)
})

test('does not fabricate provenance for an answer without a completed interaction', () => {
  assert.equal(readTurnProvenance([], 'assistant-message-1'), undefined)
  assert.equal(readDshSessionTurnProvenance(sessionOf([
    { type: 'assistant/message', data: { turn: 1, step: 1, message: { id: 'answer-1', role: 'assistant', content: [{ type: 'text', text: 'native' }] } } },
  ]), 'answer-1'), undefined)
})
