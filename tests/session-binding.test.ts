import assert from 'node:assert/strict'
import test from 'node:test'
import {
  bindBusinessNetwork,
  BusinessNetworkBindingConflictError,
  readBusinessNetworkBinding,
  type SessionEventLike,
} from '../src/session-binding.ts'

const otherEvent: SessionEventLike = { type: 'user/message', data: { text: 'hello' } }

test('binds one configured-platform knowledge network as a durable session event', () => {
  const result = bindBusinessNetwork([], {
    platformBaseUrl: 'https://poc.openbkn.ai/',
    knowledgeNetworkId: 'kn-supply',
    displayName: '供应链风险网络',
  })

  assert.deepEqual(result, {
    kind: 'bound',
    event: {
      type: 'openbkn/business-network-bound',
      data: {
        platformBaseUrl: 'https://poc.openbkn.ai',
        knowledgeNetworkId: 'kn-supply',
        displayName: '供应链风险网络',
      },
    },
  })
})

test('reuses the existing binding idempotently instead of appending another event', () => {
  const events: SessionEventLike[] = [{
    type: 'openbkn/business-network-bound',
    data: {
      platformBaseUrl: 'https://poc.openbkn.ai',
      knowledgeNetworkId: 'kn-supply',
      displayName: '供应链风险网络',
    },
  }]

  assert.deepEqual(bindBusinessNetwork(events, {
    platformBaseUrl: 'https://poc.openbkn.ai',
    knowledgeNetworkId: 'kn-supply',
    displayName: '新显示名称不改变身份',
  }), {
    kind: 'already-bound',
    binding: {
      platformBaseUrl: 'https://poc.openbkn.ai',
      knowledgeNetworkId: 'kn-supply',
      displayName: '供应链风险网络',
    },
  })
})

test('rejects binding another business network into the same DSH session', () => {
  const events: SessionEventLike[] = [otherEvent, {
    type: 'openbkn/business-network-bound',
    data: {
      platformBaseUrl: 'https://poc.openbkn.ai',
      knowledgeNetworkId: 'kn-supply',
      displayName: '供应链风险网络',
    },
  }]

  assert.throws(() => bindBusinessNetwork(events, {
    platformBaseUrl: 'https://poc.openbkn.ai',
    knowledgeNetworkId: 'kn-customer',
    displayName: '客户经营网络',
  }), BusinessNetworkBindingConflictError)
})

test('rejects a persisted session history with conflicting business network bindings', () => {
  assert.throws(() => readBusinessNetworkBinding([
    {
      type: 'openbkn/business-network-bound',
      data: {
        platformBaseUrl: 'https://poc.openbkn.ai',
        knowledgeNetworkId: 'kn-supply',
        displayName: '供应链风险网络',
      },
    },
    {
      type: 'openbkn/business-network-bound',
      data: {
        platformBaseUrl: 'https://poc.openbkn.ai',
        knowledgeNetworkId: 'kn-customer',
        displayName: '客户经营网络',
      },
    },
  ]), BusinessNetworkBindingConflictError)
})
