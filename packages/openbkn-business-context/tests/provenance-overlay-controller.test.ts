import assert from 'node:assert/strict'
import test from 'node:test'
import { ProvenanceOverlayController } from '../src/client/ProvenanceOverlay.tsx'

const handle = { schemaVersion: 1 as const, interactionId: 'interaction-1', requestIds: [], traceIds: [], receiptIds: [], status: 'completed' as const, partial: false }

test('restores focus to the native assistant action after closing provenance', () => {
  let focused = 0
  const controller = new ProvenanceOverlayController()
  controller.open('session-1', 'assistant-message-1', handle, { focus: () => { focused += 1 } })

  assert.equal(controller.getSnapshot().sessionId, 'session-1')
  assert.equal(controller.getSnapshot().messageId, 'assistant-message-1')
  controller.close()

  assert.equal(controller.getSnapshot().handle, undefined)
  assert.equal(focused, 1)
})
