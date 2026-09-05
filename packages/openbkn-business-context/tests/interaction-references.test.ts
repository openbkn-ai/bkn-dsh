import assert from 'node:assert/strict'
import test from 'node:test'
import { extractInteractionReferences } from '../src/interaction-references.ts'

test('extracts only explicitly disclosed interaction and operation references', () => {
  assert.deepEqual(extractInteractionReferences({
    interaction_id: 'interaction-1',
    operations: [
      { operation_id: 'operation-1', trace_id: 'must-not-be-inferred' },
      { operation_id: 'operation-1' },
      { operation_id: 'operation-2' },
    ],
  }), {
    interactionId: 'interaction-1',
    operationIds: ['operation-1', 'operation-2'],
  })
})

test('does not create provenance references from an undisclosed interaction or error response', () => {
  assert.equal(extractInteractionReferences({ error: { code: 'resource_not_disclosed' } }), undefined)
  assert.equal(extractInteractionReferences({ interaction_id: 'interaction-1', operations: 'not-an-array' }), undefined)
})

test('bounds and ignores malformed operation references', () => {
  const operations = Array.from({ length: 40 }, (_, index) => ({ operation_id: `operation-${index}` }))
  operations.push({ operation_id: '' })
  assert.deepEqual(extractInteractionReferences({ interaction_id: 'interaction-1', operations }), {
    interactionId: 'interaction-1',
    operationIds: Array.from({ length: 32 }, (_, index) => `operation-${index}`),
  })
})
