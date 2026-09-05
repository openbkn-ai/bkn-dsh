import assert from 'node:assert/strict'
import test from 'node:test'
import { OpenBknUiController } from '../src/client/openbkn-ui-controller.ts'

const authenticated = { kind: 'authenticated' as const, baseUrl: 'https://poc.openbkn.ai', username: 'leecky' }
const authenticationRequired = { kind: 'authentication-required' as const, baseUrl: 'https://poc.openbkn.ai' }

test('loads only the visible network catalogue after OpenBKN authentication succeeds', async () => {
  const controller = new OpenBknUiController({
    status: async () => authenticated,
    beginLogin: async () => {},
    listNetworks: async () => [{ id: 'kn-supply', displayName: 'Supply risk', description: 'Delivery risk' }],
    bindNetworkWorkspace: async () => ({ id: 'kn-supply', displayName: 'Supply risk' }),
    bindNetwork: async () => ({ platformBaseUrl: authenticated.baseUrl, knowledgeNetworkId: 'kn-supply', displayName: 'Supply risk' }),
  }, async () => 'session-1')

  controller.open()
  await controller.refresh()

  assert.deepEqual(controller.snapshot(), {
    open: true,
    phase: 'ready',
    auth: authenticated,
    networks: [{ id: 'kn-supply', displayName: 'Supply risk', description: 'Delivery risk' }],
  })
})

test('does not request the catalogue while OpenBKN authentication is required', async () => {
  let listed = 0
  const controller = new OpenBknUiController({
    status: async () => authenticationRequired,
    beginLogin: async () => {},
    listNetworks: async () => { listed += 1; return [] },
    bindNetworkWorkspace: async () => { throw new Error('must not bind') },
    bindNetwork: async () => { throw new Error('must not bind') },
  }, async () => 'session-1')

  controller.open()
  await controller.refresh()

  assert.equal(listed, 0)
  assert.equal(controller.snapshot().phase, 'authentication-required')
  assert.deepEqual(controller.snapshot().networks, [])
})

test('returns to sign-in when the platform rejects a locally present credential', async () => {
  const rejected = Object.assign(new Error('OpenBKN authentication is required.'), {
    code: 'openbkn/authentication-required',
    details: { baseUrl: authenticated.baseUrl },
  })
  const controller = new OpenBknUiController({
    status: async () => authenticated,
    beginLogin: async () => {},
    listNetworks: async () => { throw rejected },
    bindNetworkWorkspace: async () => { throw new Error('must not bind') },
    bindNetwork: async () => { throw new Error('must not bind') },
  }, async () => 'session-1')

  controller.open()
  await controller.refresh()

  assert.deepEqual(controller.snapshot(), {
    open: true,
    phase: 'authentication-required',
    auth: authenticationRequired,
    networks: [],
  })
})

test('creates the selected network session before binding it', async () => {
  let bound = 0
  const controller = new OpenBknUiController({
    status: async () => authenticated,
    beginLogin: async () => {},
    listNetworks: async () => [{ id: 'kn-supply', displayName: 'Supply risk' }],
    bindNetworkWorkspace: async () => ({ id: 'kn-supply', displayName: 'Supply risk' }),
    bindNetwork: async () => { bound += 1; return { platformBaseUrl: authenticated.baseUrl, knowledgeNetworkId: 'kn-supply', displayName: 'Supply risk' } },
  }, async () => 'session-new')

  controller.open()
  await controller.refresh()
  await controller.openNetwork('kn-supply', 'create-workspace')

  assert.equal(bound, 1)
  assert.equal(controller.snapshot().open, false)
})

test('binds the selected visible network to the newly opened network session', async () => {
  const calls: unknown[] = []
  const controller = new OpenBknUiController({
    status: async () => authenticated,
    beginLogin: async () => {},
    listNetworks: async () => [{ id: 'kn-supply', displayName: 'Supply risk', workspacePath: '/workspace/supply' }],
    bindNetworkWorkspace: async () => ({ id: 'kn-supply', displayName: 'Supply risk' }),
    bindNetwork: async (sessionId, networkId) => {
      calls.push({ sessionId, networkId })
      return { platformBaseUrl: authenticated.baseUrl, knowledgeNetworkId: networkId, displayName: 'Supply risk' }
    },
  }, async () => 'session-1')

  controller.open()
  await controller.refresh()
  await controller.openNetwork('kn-supply', 'new')

  assert.deepEqual(calls, [{ sessionId: 'session-1', networkId: 'kn-supply' }])
  assert.equal(controller.snapshot().open, false)
})
