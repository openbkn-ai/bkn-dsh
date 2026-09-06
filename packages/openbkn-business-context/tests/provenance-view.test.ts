import assert from 'node:assert/strict'
import test from 'node:test'
import { buildProvenanceView } from '../src/provenance-view.ts'

const handle = {
  schemaVersion: 1 as const,
  interactionId: 'int-123',
  requestIds: [], traceIds: [], receiptIds: [], status: 'completed' as const, partial: true,
}

test('keeps Community provenance execution-only when no Enterprise projection is available', () => {
  const view = buildProvenanceView(handle, {
    entries: [{
      operation_id: 'op-1', tool_name: 'execute_tool', protocol: 'mcp', status: 'completed',
      started_at: '2026-09-05T01:00:00Z', finished_at: '2026-09-05T01:00:01Z',
      request_id: 'req-1', trace_id: 'trace-1', receipt_id: 'receipt-1', input: { secret: 'no' },
    }],
  }, undefined, { maxGraphNodes: 10, maxGraphEdges: 10 })

  assert.deepEqual(view.execution.operations, [{
    id: 'op-1', label: 'execute_tool', protocol: 'mcp', status: 'completed',
    startedAt: '2026-09-05T01:00:00Z', finishedAt: '2026-09-05T01:00:01Z',
    requestId: 'req-1', traceId: 'trace-1', receiptId: 'receipt-1',
  }])
  assert.deepEqual(view.business, { kind: 'unavailable' })
  assert.deepEqual(view.evidence, { kind: 'unavailable' })
  assert.equal(JSON.stringify(view).includes('secret'), false)
})

test('reads the documented operations field when the Community endpoint does not use entries', () => {
  const view = buildProvenanceView(handle, {
    operations: [{ operation_id: 'op-1', tool_name: 'execute_tool', protocol: 'mcp', status: 'completed' }],
  }, undefined, { maxGraphNodes: 10, maxGraphEdges: 10 })

  assert.deepEqual(view.execution.operations, [{
    id: 'op-1', label: 'execute_tool', protocol: 'mcp', status: 'completed',
    startedAt: undefined, finishedAt: undefined, requestId: undefined, traceId: undefined, receiptId: undefined,
  }])
})

test('projects only the authorized Trace 3 interaction business graph into the business pane', () => {
  const view = buildProvenanceView(handle, { entries: [] }, {
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
  }, { maxGraphNodes: 10, maxGraphEdges: 10 })

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
  assert.deepEqual(view.evidence, { kind: 'unavailable' })
  assert.equal(JSON.stringify(view).includes('secret'), false)
})

test('bounds official Trace 3 operation-to-reference edges without deriving missing endpoints', () => {
  const view = buildProvenanceView(handle, { entries: [] }, {
    interaction_id: 'int-123',
    assembly: { operation_business_edges: [{ operation_id: 'op-1', business_ref: { technical_ref: { ref_id: 'object_type:kn-supply:supplier', ref_type: 'object_type' }, display: { name: '供应商' } } }, { operation_id: 'op-2', business_ref: { technical_ref: { ref_id: 'object_type:kn-supply:material', ref_type: 'object_type' }, display: { name: '物料' } } }] },
  }, { maxGraphNodes: 10, maxGraphEdges: 2 })

  assert.equal(view.business.kind, 'ready')
  if (view.business.kind !== 'ready') return
  assert.deepEqual(view.business.operations.map(operation => operation.id), ['op-1', 'op-2'])
  assert.deepEqual(view.business.derivedFacts, [])
})
