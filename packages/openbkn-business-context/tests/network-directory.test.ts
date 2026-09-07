import assert from 'node:assert/strict'
import test from 'node:test'
import { selectNetworkDirectory } from '../src/client/network-directory.ts'

test('searches safe catalogue fields and prioritizes associated workspaces', () => {
  const result = selectNetworkDirectory([
    { id: 'kn-sales', displayName: 'Sales operations', description: 'Pipeline and renewal' },
    { id: 'kn-supply', displayName: 'Supply risk', description: 'Supplier delivery', workspacePath: '/work/supply' },
    { id: 'kn-support', displayName: 'Customer support', description: 'Service case' },
  ], '')

  assert.equal(result.total, 3)
  assert.deepEqual(result.networks.map(network => network.id), ['kn-supply', 'kn-sales', 'kn-support'])
  assert.equal(result.hasMore, false)

  const search = selectNetworkDirectory(result.networks, 'renewal')
  assert.deepEqual(search.networks.map(network => network.id), ['kn-sales'])
})

test('shows an initial bounded page and reports remaining directory rows', () => {
  const networks = Array.from({ length: 22 }, (_, index) => ({
    id: `kn-${index + 1}`,
    displayName: `Network ${index + 1}`,
  }))

  const first = selectNetworkDirectory(networks, '')
  assert.equal(first.total, 22)
  assert.equal(first.networks.length, 20)
  assert.equal(first.hasMore, true)

  const expanded = selectNetworkDirectory(networks, '', 40)
  assert.equal(expanded.networks.length, 22)
  assert.equal(expanded.hasMore, false)
})
