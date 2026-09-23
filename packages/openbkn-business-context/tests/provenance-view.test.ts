import assert from 'node:assert/strict'
import test from 'node:test'
import { buildProvenanceView } from '../src/provenance-view.ts'
import type { ProvenanceHandle, ProvenanceTimelineNode } from '../src/types.ts'

const handle: ProvenanceHandle = {
  schemaVersion: 2,
  interactionId: 'int-123',
  requestIds: [],
  traceIds: [],
  receiptIds: [],
  status: 'completed',
  partial: true,
  conversationId: 'conv-123',
  turn: 3,
}

const timeline: readonly ProvenanceTimelineNode[] = [
  { seq: 0, kind: 'question', at: 1_000, summary: 'How many sales orders?' },
  { seq: 1, kind: 'lifecycle', tool: 'bkn_start_interaction', at: 1_100, durationMs: 40, outcome: 'ok' },
  { seq: 2, kind: 'managed', tool: 'query_object_instance', at: 1_200, durationMs: 90, outcome: 'ok', summary: 'query_object_instance · 3 项' },
  { seq: 3, kind: 'lifecycle', tool: 'bkn_finish_interaction', at: 1_400, durationMs: 30, outcome: 'ok', summary: 'bkn_finish_interaction · completed' },
  { seq: 4, kind: 'answer', at: 1_500 },
]

const limits = { maxGraphNodes: 10, maxGraphEdges: 10 }

test('keeps the local timeline and projects receipts when only operations are available', () => {
  const view = buildProvenanceView(handle, timeline, {
    entries: [{
      operation_id: 'op-1', tool_name: 'query_object_instance', protocol: 'mcp', status: 'completed',
      started_at: '2026-09-05T01:00:00Z', finished_at: '2026-09-05T01:00:01Z',
      request_id: 'req-1', trace_id: 'trace-1', receipt_id: 'receipt-1', input: { secret: 'no' },
    }],
  }, undefined, {}, limits)

  assert.deepEqual(view.execution.operations, [{
    id: 'op-1', label: 'query_object_instance', protocol: 'mcp', status: 'completed',
    startedAt: '2026-09-05T01:00:00Z', finishedAt: '2026-09-05T01:00:01Z',
    requestId: 'req-1', traceId: 'trace-1', receiptId: 'receipt-1',
  }])
  assert.deepEqual(view.business, { kind: 'unavailable' })
  assert.deepEqual(view.evidence, {
    kind: 'ready',
    receipts: [{
      receiptId: 'receipt-1', operationId: 'op-1', toolLabel: 'query_object_instance', status: 'completed',
      source: 'platform', verifyHint: 'openbkn trace receipts get receipt-1',
    }],
  })
  assert.deepEqual(view.sources, {
    timeline: 'local-session', operations: 'platform', business: 'unavailable', evidence: 'platform', degraded: [],
  })
  assert.equal(view.interactionId, 'int-123')
  assert.equal(view.conversationId, 'conv-123')
  assert.equal(view.timeline.length, 5)
  assert.equal(JSON.stringify(view).includes('secret'), false)
})

test('attaches platform facts to aligned timeline nodes and skips them when alignment is uncertain', () => {
  const aligned = buildProvenanceView(handle, timeline, {
    entries: [
      { operation_id: 'op-q', tool_name: 'query_object_instance', started_at: '2026-09-05T01:00:00Z', request_id: 'req-q', receipt_id: 'rcpt-q' },
    ],
  }, undefined, {}, limits)
  const retrieval = aligned.timeline.find(node => node.tool === 'query_object_instance')
  assert.deepEqual(retrieval?.platform, { operationId: 'op-q', requestId: 'req-q', receiptId: 'rcpt-q' })
  // Other tool groups with no matching operation count stay unannotated.
  assert.equal(aligned.timeline.find(node => node.tool === 'bkn_start_interaction')?.platform, undefined)

  // One operation for two local calls of the same tool: counts differ, the
  // whole group loses its platform facts rather than guessing a pairing.
  const doubled = buildProvenanceView(handle, [
    ...timeline,
    { seq: 5, kind: 'managed', tool: 'query_object_instance', at: 1_300, durationMs: 20, outcome: 'ok' },
  ], {
    entries: [
      { operation_id: 'op-q', tool_name: 'query_object_instance', started_at: '2026-09-05T01:00:00Z' },
    ],
  }, undefined, {}, limits)
  assert.equal(doubled.timeline.filter(node => node.platform !== undefined).length, 0)

  // Missing started_at makes order unknowable; no platform facts either.
  const untimeed = buildProvenanceView(handle, timeline, {
    entries: [
      { operation_id: 'op-q', tool_name: 'query_object_instance', request_id: 'req-q' },
    ],
  }, undefined, {}, limits)
  assert.equal(untimeed.timeline.find(node => node.tool === 'query_object_instance')?.platform, undefined)
})

test('reads the documented operations field when the Community endpoint does not use entries', () => {
  const view = buildProvenanceView(handle, timeline, {
    operations: [{ operation_id: 'op-1', tool_name: 'execute_tool', protocol: 'mcp', status: 'completed' }],
  }, undefined, {}, limits)

  assert.deepEqual(view.execution.operations, [{
    id: 'op-1', label: 'execute_tool', protocol: 'mcp', status: 'completed',
    startedAt: undefined, finishedAt: undefined, requestId: undefined, traceId: undefined, receiptId: undefined,
  }])
  assert.deepEqual(view.evidence, { kind: 'unavailable', reason: 'no-receipts' })
})

test('keeps the timeline intact and records pane degradations when the platform is unreachable', () => {
  const view = buildProvenanceView(handle, timeline, undefined, undefined, {
    operations: { pane: 'operations', reason: 'platform-unavailable' },
    business: { pane: 'business', reason: 'platform-unavailable' },
  }, limits)

  assert.deepEqual(view.timeline, timeline)
  assert.deepEqual(view.execution.operations, [])
  assert.deepEqual(view.sources, {
    timeline: 'local-session', operations: 'unavailable', business: 'unavailable', evidence: 'unavailable',
    degraded: [
      { pane: 'operations', reason: 'platform-unavailable' },
      { pane: 'business', reason: 'platform-unavailable' },
      { pane: 'evidence', reason: 'platform-unavailable' },
    ],
  })
  assert.deepEqual(view.evidence, { kind: 'unavailable', reason: 'platform-unavailable' })
})

test('maps a missing-record degradation to its own evidence reason', () => {
  const view = buildProvenanceView(handle, timeline, undefined, undefined, {
    operations: { pane: 'operations', reason: 'record-not-disclosed' },
  }, limits)
  assert.deepEqual(view.evidence, { kind: 'unavailable', reason: 'record-not-disclosed' })
})

test('distinguishes an unauthorized evidence read from a turn that produced no receipts', () => {
  const domain = buildProvenanceView(handle, timeline, undefined, undefined, {
    operations: { pane: 'operations', reason: 'domain-not-authorized', requiredAction: 'request_authorization' },
  }, limits)
  assert.deepEqual(domain.evidence, { kind: 'unavailable', reason: 'not-authorized' })

  const noReceipts = buildProvenanceView(handle, timeline, { entries: [{ operation_id: 'op-1', tool_name: 'search_schema' }] }, undefined, {}, limits)
  assert.deepEqual(noReceipts.evidence, { kind: 'unavailable', reason: 'no-receipts' })
  assert.equal(noReceipts.sources.evidence, 'unavailable')
  assert.deepEqual(noReceipts.sources.degraded, [])
})

test('prefers platform receipts and keeps mcp-result ids that the platform did not list', () => {
  const view = buildProvenanceView({
    ...handle,
    receiptIds: ['receipt-1', 'receipt-local'],
  }, timeline, {
    entries: [{ operation_id: 'op-1', tool_name: 'query_object_instance', receipt_id: 'receipt-1', started_at: '2026-09-05T01:00:00Z' }],
  }, undefined, {}, limits)

  assert.equal(view.evidence.kind, 'ready')
  if (view.evidence.kind !== 'ready') return
  assert.deepEqual(view.evidence.receipts.map(receipt => [receipt.receiptId, receipt.source]), [
    ['receipt-1', 'platform'],
    ['receipt-local', 'mcp-result'],
  ])
  assert.equal(view.sources.evidence, 'platform')
})

test('projects only the authorized Trace 3 interaction business graph into the business pane', () => {
  const view = buildProvenanceView(handle, timeline, { entries: [] }, {
    interaction_id: 'int-123',
    execution_status: 'completed',
    evidence_status: 'complete',
    assembly: {
      business_refs: [{ technical_ref: { ref_id: 'object_type:kn-supply:supplier', ref_type: 'object_type' }, display: { name: '供应商' } }],
      operation_business_edges: [{
        operation_id: 'op-1', role: 'read',
        business_ref: { technical_ref: { ref_id: 'object_type:kn-supply:supplier', ref_type: 'object_type' }, display: { name: '供应商' } },
      }, {
        operation_id: 'op-1', role: 'read',
        business_ref: { technical_ref: { ref_id: 'metric:kn-supply:delivery-risk', ref_type: 'metric' }, display: { name: '交付风险' } },
      }],
      claims: [{ claim: { text: 'must-not-cross' } }],
      raw_payload: { secret: 'no' },
    },
  }, {}, limits)

  assert.deepEqual(view.business, {
    kind: 'ready',
    operations: [{
      id: 'op-1', attempt: 0, toolName: 'OpenBKN operation', status: 'resolved',
      elements: [{ kind: 'object', id: 'object_type:kn-supply:supplier', name: '供应商' }, { kind: 'metric', id: 'metric:kn-supply:delivery-risk', name: '交付风险' }],
      missingFacts: [],
    }],
    conversationContext: [],
    derivedFacts: [],
    contextRelations: [],
  })
  assert.equal(view.sources.business, 'platform-enterprise')
  assert.equal(JSON.stringify(view).includes('secret'), false)
})

test('bounds official Trace 3 operation-to-reference edges without deriving missing endpoints', () => {
  const view = buildProvenanceView(handle, timeline, { entries: [] }, {
    interaction_id: 'int-123',
    assembly: { operation_business_edges: [{ operation_id: 'op-1', business_ref: { technical_ref: { ref_id: 'object_type:kn-supply:supplier', ref_type: 'object_type' }, display: { name: '供应商' } } }, { operation_id: 'op-2', business_ref: { technical_ref: { ref_id: 'object_type:kn-supply:material', ref_type: 'object_type' }, display: { name: '物料' } } }] },
  }, {}, { maxGraphNodes: 10, maxGraphEdges: 2 })

  assert.equal(view.business.kind, 'ready')
  if (view.business.kind !== 'ready') return
  assert.deepEqual(view.business.operations.map(operation => operation.id), ['op-1', 'op-2'])
  assert.deepEqual(view.business.derivedFacts, [])
})
