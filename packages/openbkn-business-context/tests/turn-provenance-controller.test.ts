import assert from 'node:assert/strict'
import test from 'node:test'
import { TurnProvenanceController } from '../src/client/turn-provenance-controller.ts'

const handle = {
  schemaVersion: 1 as const,
  interactionId: 'interaction-1',
  requestIds: [],
  traceIds: [],
  receiptIds: [],
  status: 'completed' as const,
  partial: true,
}

test('loads one assistant message provenance without inventing an absent handle', async () => {
  const controller = new TurnProvenanceController(async messageId => messageId === 'assistant-message-1' ? handle : undefined)
  await controller.load('assistant-message-1')
  await controller.load('assistant-message-2')

  assert.equal(controller.getSnapshot().get('assistant-message-1'), handle)
  assert.equal(controller.getSnapshot().get('assistant-message-2'), undefined)
})

test('does not overwrite an established handle when a later read fails', async () => {
  let fail = false
  const controller = new TurnProvenanceController(async () => {
    if (fail) throw new Error('unavailable')
    return handle
  })
  await controller.load('assistant-message-1')
  fail = true
  await controller.load('assistant-message-1')

  assert.equal(controller.getSnapshot().get('assistant-message-1'), handle)
})
