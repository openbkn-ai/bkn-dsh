import assert from 'node:assert/strict'
import test from 'node:test'
import { OpenBknUiController, directoryPickerFailure, workspaceSelectionCancelled } from '../src/client/openbkn-ui-controller.ts'

const authenticated = { kind: 'authenticated' as const, baseUrl: 'https://poc.openbkn.ai', username: 'leecky' }
const authenticationRequired = { kind: 'authentication-required' as const, baseUrl: 'https://poc.openbkn.ai' }

test('directs unavailable RPC and unknown connection failures to diagnostics without guessing credentials', async () => {
  for (const failure of [
    Object.assign(new Error('definition unavailable'), { code: 'gateway/definition-unavailable' }),
    new Error('unclassified failure with private-error-detail'),
    undefined,
  ]) {
    const controller = new OpenBknUiController({
      status: async () => { throw failure },
      configureToken: async () => { throw failure },
      listNetworks: async () => [],
      bindNetworkWorkspace: async () => { throw new Error('must not bind') },
      bindNetwork: async () => { throw new Error('must not bind') },
    }, async () => 'session-1')
    controller.open()
    await controller.refresh()
    assert.equal(controller.snapshot().phase, 'error')
    assert.match(controller.snapshot().message ?? '', /诊断/)
    assert.doesNotMatch(controller.snapshot().message ?? '', /检查 Token|平台地址|private-error-detail/)
    await controller.configureToken('test-only-token')
    assert.match(controller.snapshot().message ?? '', /诊断/)
    assert.doesNotMatch(controller.snapshot().message ?? '', /检查 Token|平台地址|private-error-detail/)
  }
})

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

/** Open `kn-supply` in create-workspace mode with a chooser that throws `failure`. */
async function createWorkspaceFailing(failure: Error) {
  const controller = new OpenBknUiController({
    status: async () => authenticated,
    configureToken: async () => [],
    listNetworks: async () => [{ id: 'kn-supply', displayName: 'Supply risk' }],
    bindNetworkWorkspace: async () => { throw new Error('must not bind') },
    bindNetwork: async () => { throw new Error('must not bind') },
  }, async () => { throw failure })
  controller.open()
  await controller.refresh()
  await controller.openNetwork('kn-supply', 'create-workspace')
  return controller.snapshot()
}

test('attributes a browse-only Host refusal to the connection mode', async () => {
  // Exact text DSH 0.2.0-rc.2 uiWorkspace.pickDirectory() throws for the browse backend.
  const refusal = new Error('directory picker failed: directoryPicker.pick needs the native capability; the composed picker serves "browse"')
  const snapshot = await createWorkspaceFailing(directoryPickerFailure(refusal))
  assert.equal(snapshot.phase, 'error')
  assert.match(snapshot.message ?? '', /当前连接模式/)
  assert.match(snapshot.message ?? '', /关联一个已存在的本地工作区/)
})

test('reports a failing native chooser with its own cause, not as a connection-mode limit', async () => {
  const snapshot = await createWorkspaceFailing(directoryPickerFailure(new Error('directory picker failed: osascript exited with 1')))
  assert.equal(snapshot.phase, 'error')
  assert.match(snapshot.message ?? '', /无法打开本机目录选择器：directory picker failed: osascript exited with 1/)
  assert.doesNotMatch(snapshot.message ?? '', /当前连接模式/)
})

test('returns to the network list without an error when the chooser is dismissed', async () => {
  const snapshot = await createWorkspaceFailing(workspaceSelectionCancelled())
  assert.equal(snapshot.phase, 'ready')
  assert.equal(snapshot.message, undefined)
  assert.deepEqual(snapshot.networks.map(network => network.id), ['kn-supply'])
})

test('includes the underlying cause in the generic bind-failure message', async () => {
  const controller = new OpenBknUiController({
    status: async () => authenticated,
    configureToken: async () => [],
    listNetworks: async () => [{ id: 'kn-supply', displayName: 'Supply risk' }],
    bindNetworkWorkspace: async () => { throw new Error('must not bind') },
    bindNetwork: async () => { throw new Error('bind rejected by host') },
  }, async () => 'session-1')

  controller.open()
  await controller.refresh()
  await controller.openNetwork('kn-supply', 'new')

  assert.equal(controller.snapshot().phase, 'error')
  assert.match(controller.snapshot().message ?? '', /bind rejected by host/)
})

test('tells the user how to make the OpenBKN CLI available instead of blaming the token', async () => {
  const controller = new OpenBknUiController({
    status: async () => { throw Object.assign(new Error('OpenBKN CLI "openbkn" is not available to the DSH host.'), { code: 'openbkn/cli-unavailable', details: { cliPath: 'openbkn' } }) },
    configureToken: async () => [],
    listNetworks: async () => [],
    bindNetworkWorkspace: async () => { throw new Error('unused') },
    bindNetwork: async () => { throw new Error('unused') },
  }, async () => 'session-1')
  controller.open()
  await controller.refresh()
  assert.equal(controller.snapshot().phase, 'error')
  assert.match(controller.snapshot().message ?? '', /找不到 OpenBKN CLI/)
  assert.match(controller.snapshot().message ?? '', /与平台版本一致/)
  assert.match(controller.snapshot().message ?? '', /cliPath/)
  assert.doesNotMatch(controller.snapshot().message ?? '', /检查 Token/)
})

test('while the workspace chooser is open, the panel says where to look instead of "binding"', async () => {
  let release: (sessionId: string) => void = () => {}
  const controller = new OpenBknUiController({
    status: async () => authenticated,
    configureToken: async () => [],
    listNetworks: async () => [{ id: 'kn-supply', displayName: 'Supply risk' }],
    bindNetworkWorkspace: async () => ({ id: 'kn-supply', displayName: 'Supply risk' }),
    bindNetwork: async () => ({ platformBaseUrl: authenticated.baseUrl, knowledgeNetworkId: 'kn-supply', displayName: 'Supply risk' }),
  }, () => new Promise<string>(resolve => { release = resolve }))
  controller.open()
  await controller.refresh()
  const pending = controller.openNetwork('kn-supply', 'create-workspace')
  assert.equal(controller.snapshot().phase, 'binding')
  assert.match(controller.snapshot().message ?? '', /系统窗口中选择工作区目录/)
  release('session-1')
  await pending
  assert.equal(controller.snapshot().open, false)
})
