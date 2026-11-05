import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

test('independent parity fixture contains first-page, attempt, payload and platform-status boundaries', async () => {
  const fixture = JSON.parse(await readFile(new URL('./fixtures/provenance-parity/conversation.json', import.meta.url), 'utf8'))
  assert.equal(fixture.kind, 'controlled-synthetic')
  assert.equal(fixture.notLiveEvidence, true)
  assert.equal(fixture.rounds.length, 73)
  const selected = fixture.identity.initialInteractionId
  assert.equal(fixture.rounds.slice(0, 50).some(round => round.interaction_id === selected), false)
  assert.equal(fixture.rounds.some(round => round.interaction_id === selected), true)
  const detail = fixture.details[selected]
  assert.equal(detail.interaction_id, selected)
  assert.equal(detail.operations.filter(operation => operation.operation_id === 'op-retry').length, 2)
  assert.deepEqual(detail.operations.filter(operation => operation.operation_id === 'op-retry').map(operation => operation.attempt), [1, 2])
  assert.match(JSON.stringify(detail), /123\.450000/)
  assert.match(JSON.stringify(fixture.explanations[selected]), /platform-invalid-preserve/)
})
