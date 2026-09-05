import assert from 'node:assert/strict'
import test from 'node:test'
import { parseVisibleBusinessNetworks } from '../src/business-network-catalog.ts'

test('projects the platform network list into a small UI-safe catalogue', () => {
  assert.deepEqual(parseVisibleBusinessNetworks({
    entries: [
      { id: 'kn-supply', name: 'Supply risk', description: 'Operational delivery risk' },
      { id: 'kn-customer', name: 'Customer health', comment: 'Renewal and service context' },
    ],
  }), [
    { id: 'kn-supply', displayName: 'Supply risk', description: 'Operational delivery risk' },
    { id: 'kn-customer', displayName: 'Customer health', description: 'Renewal and service context' },
  ])
})

test('fails closed for malformed or duplicate platform network rows', () => {
  assert.deepEqual(parseVisibleBusinessNetworks({
    entries: [
      { id: 'kn-supply', name: 'Supply risk' },
      { id: 'kn-supply', name: 'Duplicate' },
      { id: '', name: 'Missing id' },
      { id: 'kn-no-name' },
    ],
  }), [
    { id: 'kn-supply', displayName: 'Supply risk' },
  ])
  assert.deepEqual(parseVisibleBusinessNetworks({ result: { entries: [] } }), [])
  assert.throws(() => parseVisibleBusinessNetworks({ unexpected: [] }), /network list/i)
})
