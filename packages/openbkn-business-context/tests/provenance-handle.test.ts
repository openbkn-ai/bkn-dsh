import assert from 'node:assert/strict'
import test from 'node:test'
import { normalizeProvenanceHandle, sameProvenanceHandle } from '../src/provenance-handle.ts'
import type { ProvenanceHandle } from '../src/types.ts'

test('normalizes one bounded, display-safe completed-turn provenance handle', () => {
  assert.deepEqual(normalizeProvenanceHandle({
    schemaVersion: 2,
    interactionId: 'interaction-1',
    requestIds: ['request-1', 'request-1'],
    traceIds: ['trace-1'],
    receiptIds: ['receipt-1'],
    status: 'completed',
    partial: false,
    conversationId: 'conv-1',
    turn: 3,
  }), {
    schemaVersion: 2,
    interactionId: 'interaction-1',
    requestIds: ['request-1'],
    traceIds: ['trace-1'],
    receiptIds: ['receipt-1'],
    status: 'completed',
    partial: false,
    conversationId: 'conv-1',
    turn: 3,
  })
})

test('reads a schema v1 handle from an older session log and upgrades it in memory without inventing fields', () => {
  assert.deepEqual(normalizeProvenanceHandle({
    schemaVersion: 1,
    interactionId: 'interaction-legacy',
    requestIds: [],
    traceIds: [],
    receiptIds: [],
    status: 'failed',
    partial: true,
  }), {
    schemaVersion: 2,
    interactionId: 'interaction-legacy',
    requestIds: [],
    traceIds: [],
    receiptIds: [],
    status: 'failed',
    partial: true,
  })
})

test('round-trips a v2 handle whose optional identifiers are absent', () => {
  const handle = normalizeProvenanceHandle({
    schemaVersion: 2,
    interactionId: 'interaction-2',
    requestIds: [],
    traceIds: [],
    receiptIds: [],
    status: 'completed',
    partial: true,
  })
  assert.equal('conversationId' in handle, false)
  assert.equal('turn' in handle, false)
})

test('rejects a malformed, unbounded, non-completed, or future-version handle before it reaches the client', () => {
  assert.throws(() => normalizeProvenanceHandle({ schemaVersion: 2, interactionId: '', requestIds: [], traceIds: [], receiptIds: [], status: 'completed', partial: false }), /interaction/i)
  assert.throws(() => normalizeProvenanceHandle({ schemaVersion: 2, interactionId: 'x', requestIds: Array.from({ length: 33 }, (_, i) => `r-${i}`), traceIds: [], receiptIds: [], status: 'completed', partial: false }), /limit/i)
  assert.throws(() => normalizeProvenanceHandle({ schemaVersion: 2, interactionId: 'x', requestIds: [], traceIds: [], receiptIds: [], status: 'running', partial: false }), /completed/i)
  assert.throws(() => normalizeProvenanceHandle({ schemaVersion: 3, interactionId: 'x', requestIds: [], traceIds: [], receiptIds: [], status: 'completed', partial: false }), /schema version/i)
})

test('treats a stored v1 event and its v2 re-capture as the same turn, not a conflict', () => {
  const stored: ProvenanceHandle = normalizeProvenanceHandle({
    schemaVersion: 1,
    interactionId: 'interaction-same',
    requestIds: [],
    traceIds: [],
    receiptIds: [],
    status: 'completed',
    partial: true,
  })
  const recaptured: ProvenanceHandle = normalizeProvenanceHandle({
    schemaVersion: 2,
    interactionId: 'interaction-same',
    requestIds: [],
    traceIds: [],
    receiptIds: ['receipt-later-collected'],
    status: 'completed',
    partial: true,
    conversationId: 'conv-1',
    turn: 4,
  })
  assert.equal(sameProvenanceHandle(stored, recaptured), true)
})

test('still flags a completed message rewritten to a different interaction', () => {
  const stored: ProvenanceHandle = normalizeProvenanceHandle({
    schemaVersion: 1, interactionId: 'interaction-a', requestIds: [], traceIds: [], receiptIds: [], status: 'completed', partial: true,
  })
  const other: ProvenanceHandle = normalizeProvenanceHandle({
    schemaVersion: 2, interactionId: 'interaction-b', requestIds: [], traceIds: [], receiptIds: [], status: 'completed', partial: true,
  })
  const failedStatus: ProvenanceHandle = normalizeProvenanceHandle({
    schemaVersion: 2, interactionId: 'interaction-a', requestIds: [], traceIds: [], receiptIds: [], status: 'failed', partial: true,
  })
  assert.equal(sameProvenanceHandle(stored, other), false)
  assert.equal(sameProvenanceHandle(stored, failedStatus), false)
})
