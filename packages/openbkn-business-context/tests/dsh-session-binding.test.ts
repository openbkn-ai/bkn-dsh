import assert from 'node:assert/strict'
import test from 'node:test'
import { bindDshSessionBusinessNetwork, readDshSessionBusinessNetwork } from '../src/dsh-session-binding.ts'

test('adapts the immutable binding to the real DSH session event log once', () => {
  const appended: unknown[] = []
  const session = {
    snapshotEvents: () => [],
    append: (type: string, data: unknown) => { appended.push({ type, data }) },
  }

  const binding = { platformBaseUrl: 'https://poc.openbkn.ai/', knowledgeNetworkId: 'kn-supply', displayName: '供应链风险网络' }
  assert.equal(bindDshSessionBusinessNetwork(session, binding).kind, 'bound')
  assert.deepEqual(appended, [{
    type: 'openbkn/business-network-bound',
    data: { platformBaseUrl: 'https://poc.openbkn.ai', knowledgeNetworkId: 'kn-supply', displayName: '供应链风险网络' },
  }])
})

test('reads an established DSH session binding without creating a second persistence path', () => {
  const session = {
    snapshotEvents: () => [{
      type: 'openbkn/business-network-bound',
      data: { platformBaseUrl: 'https://poc.openbkn.ai', knowledgeNetworkId: 'kn-supply', displayName: '供应链风险网络' },
    }],
    append: () => { throw new Error('must not append') },
  }

  assert.deepEqual(readDshSessionBusinessNetwork(session), {
    platformBaseUrl: 'https://poc.openbkn.ai', knowledgeNetworkId: 'kn-supply', displayName: '供应链风险网络',
  })
})
