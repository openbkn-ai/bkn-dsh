import assert from 'node:assert/strict'
import test from 'node:test'
import {
  bindBusinessNetwork,
  BusinessNetworkBindingConflictError,
  readBusinessNetworkBinding,
  type SessionEventLike,
} from '../src/session-binding.ts'

const otherEvent: SessionEventLike = { type: 'user/message', data: { text: 'hello' } }

test('decides a first binding and normalizes it for persistence', () => {
  const result = bindBusinessNetwork(undefined, {
    platformBaseUrl: 'https://poc.openbkn.ai/',
    knowledgeNetworkId: 'kn-supply',
    displayName: '供应链风险网络',
  })

  assert.deepEqual(result, {
    kind: 'bound',
    binding: {
      platformBaseUrl: 'https://poc.openbkn.ai',
      knowledgeNetworkId: 'kn-supply',
      displayName: '供应链风险网络',
    },
  })
})

test('reuses the existing binding idempotently instead of writing another one', () => {
  const events: SessionEventLike[] = [{
    type: 'openbkn/business-network-bound',
    data: {
      platformBaseUrl: 'https://poc.openbkn.ai',
      knowledgeNetworkId: 'kn-supply',
      displayName: '供应链风险网络',
    },
  }]

  assert.deepEqual(bindBusinessNetwork(readBusinessNetworkBinding(events), {
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

  assert.throws(() => bindBusinessNetwork(readBusinessNetworkBinding(events), {
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
