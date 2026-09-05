import assert from 'node:assert/strict'
import test from 'node:test'
import { buildBusinessGraphModel } from '../src/business-graph-model.ts'

test('lays out resolved elements and connects only formal relations with visible endpoints', () => {
  const model = buildBusinessGraphModel([{
    id: 'op-1', attempt: 1, toolName: 'query_object_instance', status: 'resolved', knowledgeNetworkId: 'kn-supply', missingFacts: [],
    elements: [
      { kind: 'object', id: 'supplier', name: '供应商' },
      { kind: 'object', id: 'material', name: '物料' },
      { kind: 'property', id: 'supplier', name: '同 ID 属性不得替代对象端点' },
    ],
  }], [{
    id: 'rel-1', knowledgeNetworkId: 'kn-supply', name: '供应', sourceObjectId: 'supplier', targetObjectId: 'material',
  }, {
    id: 'rel-2', knowledgeNetworkId: 'kn-supply', name: '缺少正式端点', sourceObjectId: 'supplier', targetObjectId: 'product',
  }])

  assert.deepEqual(model.nodes.map(node => ({ key: node.key, x: node.x, y: node.y })), [
    { key: 'object:supplier', x: 40, y: 48 },
    { key: 'object:material', x: 300, y: 48 },
    { key: 'property:supplier', x: 560, y: 48 },
  ])
  assert.deepEqual(model.edges.map(edge => ({ id: edge.id, sourceKey: edge.sourceKey, targetKey: edge.targetKey, name: edge.name })), [{
    id: 'rel-1', sourceKey: 'object:supplier', targetKey: 'object:material', name: '供应',
  }])
  assert.deepEqual(model.unresolvedRelations.map(relation => relation.id), ['rel-2'])
  assert.equal(model.width, 780)
  assert.equal(model.height, 182)
})

test('deduplicates the same resolved element while preserving its first operation source', () => {
  const model = buildBusinessGraphModel([{
    id: 'op-1', attempt: 1, toolName: 'first_tool', status: 'resolved', missingFacts: [],
    elements: [{ kind: 'object', id: 'supplier', name: '供应商' }],
  }, {
    id: 'op-2', attempt: 1, toolName: 'second_tool', status: 'resolved', missingFacts: [],
    elements: [{ kind: 'object', id: 'supplier', name: '供应商' }],
  }], [])

  assert.equal(model.nodes.length, 1)
  assert.equal(model.nodes[0]?.operation.id, 'op-1')
})
