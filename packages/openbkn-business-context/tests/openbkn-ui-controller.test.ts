import assert from 'node:assert/strict'
import test from 'node:test'
import { OpenBknUiController } from '../src/client/openbkn-ui-controller.ts'

const authenticated = { kind: 'authenticated' as const, baseUrl: 'https://poc.openbkn.ai', username: 'leecky' }
const authenticationRequired = { kind: 'authentication-required' as const, baseUrl: 'https://poc.openbkn.ai' }

test('loads only the visible network catalogue after OpenBKN authentication succeeds', async () => {
  const controller = new OpenBknUiController({
    status: async () => authenticated,
    configureToken: async () => [],
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
    configureToken: async () => [],
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
    configureToken: async () => [],
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
    message: 'Context Loader MCP 已连接，但该 Token 无法读取 OpenBKN 平台的业务知识网络目录。请使用具有平台访问权限的用户访问 Token 或 AppKey。',
  })
})

test('explains whether a failed verification came from MCP or the platform catalogue', async () => {
  const failure = Object.assign(new Error('platform unavailable'), {
    code: 'openbkn/connection-failed',
    details: { baseUrl: authenticated.baseUrl, layer: 'platform-api' as const },
  })
  const controller = new OpenBknUiController({
    status: async () => authenticated,
    configureToken: async () => { throw failure },
    listNetworks: async () => { throw failure },
    bindNetworkWorkspace: async () => { throw new Error('must not bind') },
    bindNetwork: async () => { throw new Error('must not bind') },
  }, async () => 'session-1')

  controller.open()
  await controller.configureToken('token')

  assert.equal(controller.snapshot().phase, 'error')
  assert.match(controller.snapshot().message ?? '', /Context Loader MCP 已连接/)
})

test('explains that a Context Loader-only token cannot load the platform catalogue', async () => {
  const rejected = Object.assign(new Error('OpenBKN authentication is required.'), {
    code: 'openbkn/authentication-required',
    details: { baseUrl: authenticated.baseUrl },
  })
  const controller = new OpenBknUiController({
    status: async () => authenticated,
    configureToken: async () => { throw rejected },
    listNetworks: async () => { throw new Error('must not list') },
    bindNetworkWorkspace: async () => { throw new Error('must not bind') },
    bindNetwork: async () => { throw new Error('must not bind') },
  }, async () => 'session-1')

  controller.open()
  await controller.configureToken('context-loader-only-token')

  assert.equal(controller.snapshot().phase, 'authentication-required')
  assert.match(controller.snapshot().message ?? '', /MCP 已连接/)
  assert.match(controller.snapshot().message ?? '', /平台访问权限/)
})

test('keeps the saved token and identifies a temporarily unavailable platform catalogue', async () => {
  const unavailable = Object.assign(new Error('unavailable'), {
    code: 'openbkn/platform-unavailable',
    details: { baseUrl: authenticated.baseUrl },
  })
  const controller = new OpenBknUiController({
    status: async () => authenticated,
    configureToken: async () => { throw unavailable },
    listNetworks: async () => { throw unavailable },
    bindNetworkWorkspace: async () => { throw new Error('must not bind') },
    bindNetwork: async () => { throw new Error('must not bind') },
  }, async () => 'session-1')

  controller.open()
  await controller.configureToken('platform-token')

  assert.equal(controller.snapshot().phase, 'error')
  assert.match(controller.snapshot().message ?? '', /目录暂不可用/)
  assert.match(controller.snapshot().message ?? '', /Token 未被修改/)
})

test('creates the selected network session before binding it', async () => {
  let bound = 0
  const controller = new OpenBknUiController({
    status: async () => authenticated,
    configureToken: async () => [],
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
    configureToken: async () => [],
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

test('refreshes native additive session contributions after binding a new session', async () => {
  const refreshed: string[] = []
  const controller = new OpenBknUiController({
    status: async () => authenticated,
    configureToken: async () => [],
    listNetworks: async () => [{ id: 'kn-supply', displayName: 'Supply risk', workspacePath: '/workspace/supply' }],
    bindNetworkWorkspace: async () => ({ id: 'kn-supply', displayName: 'Supply risk' }),
    bindNetwork: async (_sessionId, networkId) => ({ platformBaseUrl: authenticated.baseUrl, knowledgeNetworkId: networkId, displayName: 'Supply risk' }),
  }, async () => 'session-1', sessionId => { refreshed.push(sessionId) })

  controller.open()
  await controller.refresh()
  await controller.openNetwork('kn-supply', 'new')

  assert.deepEqual(refreshed, ['session-1'])
})
