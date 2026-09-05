import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeProvenanceHandle } from '../src/provenance-handle.ts'

test('normalizes one bounded, display-safe completed-turn provenance handle', () => {
  assert.deepEqual(normalizeProvenanceHandle({
    schemaVersion: 1,
    interactionId: 'interaction-1',
    requestIds: ['request-1', 'request-1'],
    traceIds: ['trace-1'],
    receiptIds: ['receipt-1'],
    status: 'completed',
    partial: false,
  }), {
    schemaVersion: 1,
    interactionId: 'interaction-1',
    requestIds: ['request-1'],
    traceIds: ['trace-1'],
    receiptIds: ['receipt-1'],
    status: 'completed',
    partial: false,
  })
})

test('rejects a malformed, unbounded, or non-completed handle before it reaches the client', () => {
  assert.throws(() => normalizeProvenanceHandle({ schemaVersion: 1, interactionId: '', requestIds: [], traceIds: [], receiptIds: [], status: 'completed', partial: false }), /interaction/i)
  assert.throws(() => normalizeProvenanceHandle({ schemaVersion: 1, interactionId: 'x', requestIds: Array.from({ length: 33 }, (_, i) => `r-${i}`), traceIds: [], receiptIds: [], status: 'completed', partial: false }), /limit/i)
  assert.throws(() => normalizeProvenanceHandle({ schemaVersion: 1, interactionId: 'x', requestIds: [], traceIds: [], receiptIds: [], status: 'running', partial: false }), /completed/i)
})
