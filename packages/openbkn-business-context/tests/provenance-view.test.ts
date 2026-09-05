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

test('projects only the formal Enterprise interaction projection into the business pane', () => {
  const view = buildProvenanceView(handle, { entries: [] }, {
    interaction_id: 'int-123',
    operations: [{
      operation_id: 'op-1', attempt: 1, tool_name: 'query_metric', knowledge_network_id: 'kn-supply', status: 'resolved',
      elements: [{ kind: 'object', id: 'supplier', name: '供应商' }, { kind: 'metric', id: 'delivery-risk', name: '交付风险' }],
      missing_facts: ['query.result_count'], input: { secret: 'no' }, output: { secret: 'no' },
    }],
    conversation_context: [{ knowledge_network_id: 'kn-supply', source_interaction_id: 'int-122', source_operation_id: 'op-0' }],
    derived_facts: [{ rule: 'selected_from', source_operation_id: 'op-0', operation_id: 'op-1', element_id: 'supplier' }],
    context_relations: [
      { id: 'rel-1', knowledge_network_id: 'kn-supply', name: '影响', source_object_id: 'supplier', target_object_id: 'delivery-risk' },
      { id: 'incomplete', knowledge_network_id: 'kn-supply', name: '不得展示', source_object_id: 'supplier' },
    ],
  }, { maxGraphNodes: 10, maxGraphEdges: 10 })

  assert.deepEqual(view.business, {
    kind: 'ready',
    operations: [{
      id: 'op-1', attempt: 1, toolName: 'query_metric', knowledgeNetworkId: 'kn-supply', status: 'resolved',
      elements: [{ kind: 'object', id: 'supplier', name: '供应商' }, { kind: 'metric', id: 'delivery-risk', name: '交付风险' }],
      missingFacts: ['query.result_count'],
    }],
    conversationContext: [{ knowledgeNetworkId: 'kn-supply', sourceInteractionId: 'int-122', sourceOperationId: 'op-0' }],
    derivedFacts: [{ rule: 'selected_from', sourceOperationId: 'op-0', operationId: 'op-1', elementId: 'supplier' }],
    contextRelations: [{ id: 'rel-1', knowledgeNetworkId: 'kn-supply', name: '影响', sourceObjectId: 'supplier', targetObjectId: 'delivery-risk' }],
  })
  assert.deepEqual(view.evidence, { kind: 'unavailable' })
  assert.equal(JSON.stringify(view).includes('secret'), false)
})

test('bounds formal business graph relations without deriving missing endpoints', () => {
  const view = buildProvenanceView(handle, { entries: [] }, {
    operations: [],
    derived_facts: [
      { rule: 'first', source_operation_id: 'op-0', operation_id: 'op-1', element_id: 'object-1' },
      { rule: 'must-be-bounded', source_operation_id: 'op-0', operation_id: 'op-2', element_id: 'object-2' },
    ],
    context_relations: [
      { id: 'rel-1', knowledge_network_id: 'kn-supply', name: '供应', source_object_id: 'supplier', target_object_id: 'material' },
      { id: 'rel-2', knowledge_network_id: 'kn-supply', name: '不得越界', source_object_id: 'supplier', target_object_id: 'product' },
    ],
  }, { maxGraphNodes: 10, maxGraphEdges: 2 })

  assert.equal(view.business.kind, 'ready')
  if (view.business.kind !== 'ready') return
  assert.deepEqual(view.business.contextRelations, [{
    id: 'rel-1', knowledgeNetworkId: 'kn-supply', name: '供应', sourceObjectId: 'supplier', targetObjectId: 'material',
  }, {
    id: 'rel-2', knowledgeNetworkId: 'kn-supply', name: '不得越界', sourceObjectId: 'supplier', targetObjectId: 'product',
  }])
  assert.deepEqual(view.business.derivedFacts, [])
})
