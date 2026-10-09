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
    message: 'OpenBKN 平台 拒绝了当前凭据。请使用 OpenBKN CLI 重新登录并同步。',
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

test('offers credential recovery without inferring why the platform catalogue rejected a token', async () => {
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
  assert.match(controller.snapshot().message ?? '', /平台.*拒绝了当前凭据/)
  assert.match(controller.snapshot().message ?? '', /OpenBKN CLI 重新登录并同步/)
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
  assert.match(controller.snapshot().message ?? '', /凭据未被修改/)
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


function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(accept => { resolve = accept })
  return { promise, resolve }
}

const configuredView = { baseUrl: authenticated.baseUrl, cliPath: 'openbkn', configured: true, editable: true }
const pendingView = { ...configuredView, baseUrl: '', configured: false }
const safePort = {
  status: async () => authenticated,
  beginLogin: async () => [],
  configureToken: async () => [],
  listNetworks: async () => [{ id: 'network', displayName: 'Network' }],
  bindNetworkWorkspace: async () => ({ id: 'network', displayName: 'Network' }),
  bindNetwork: async () => ({ platformBaseUrl: authenticated.baseUrl, knowledgeNetworkId: 'network', displayName: 'Network' }),
}

test('first-use shows configuration without dispatching authentication or catalogue calls', async () => {
  let businessCalls = 0
  const controller = new OpenBknUiController({ ...safePort,
    status: async () => { businessCalls += 1; return authenticated },
    listNetworks: async () => { businessCalls += 1; return [] },
  }, async () => 'session', undefined, {
    getConfiguration: async () => pendingView,
    saveConfiguration: async () => configuredView,
  })
  controller.open()
  await controller.refresh()
  assert.equal(controller.snapshot().phase, 'configuration')
  assert.equal(controller.snapshot().configuration?.baseUrl, '')
  assert.equal(businessCalls, 0)
})

test('invalid form submissions stay on configuration without saving or connecting', async () => {
  let saved = 0
  let connected = 0
  const controller = new OpenBknUiController({ ...safePort,
    status: async () => { connected += 1; return authenticated },
  }, async () => 'session', undefined, {
    getConfiguration: async () => pendingView,
    saveConfiguration: async () => { saved += 1; return configuredView },
  })
  controller.open()
  await controller.refresh()
  for (const baseUrl of ['', 'file:///local', 'relative/path', 'https://platform.invalid bad']) {
    await controller.saveConfiguration({ baseUrl, cliPath: 'openbkn' })
    assert.equal(controller.snapshot().phase, 'configuration')
    assert.match(controller.snapshot().configurationMessage!, /HTTP/)
  }
  assert.equal(saved, 0)
  assert.equal(connected, 0)
})

test('a saved URL is distinct from connection failure and retains the saved settings', async () => {
  const controller = new OpenBknUiController({ ...safePort,
    status: async () => { throw new Error('offline private detail') },
  }, async () => 'session', undefined, {
    getConfiguration: async () => pendingView,
    saveConfiguration: async input => ({ ...input, configured: true, editable: true }),
  })
  controller.open()
  await controller.refresh()
  await controller.saveConfiguration({ baseUrl: authenticated.baseUrl, cliPath: '/path/openbkn' })
  assert.equal(controller.snapshot().phase, 'error')
  assert.match(controller.snapshot().message!, /^设置已保存/)
  assert.equal(controller.snapshot().configuration?.cliPath, '/path/openbkn')
  assert.doesNotMatch(controller.snapshot().message!, /private detail/)
})

test('a rejected save remains in the form and does not request authentication', async () => {
  let connected = 0
  const controller = new OpenBknUiController({ ...safePort,
    status: async () => { connected += 1; return authenticated },
  }, async () => 'session', undefined, {
    getConfiguration: async () => pendingView,
    saveConfiguration: async () => { throw Object.assign(new Error('private editor text'), { code: 'openbkn/configuration-busy' }) },
  })
  controller.open()
  await controller.refresh()
  await controller.saveConfiguration({ baseUrl: authenticated.baseUrl, cliPath: 'openbkn' })
  assert.equal(controller.snapshot().phase, 'configuration')
  assert.equal(controller.snapshot().savingConfiguration, false)
  assert.match(controller.snapshot().configurationMessage!, /回合结束/)
  assert.doesNotMatch(controller.snapshot().configurationMessage!, /private editor text/)
  assert.equal(connected, 0)
})

test('closing during authentication drops the response and prevents the next request', async () => {
  const status = deferred<typeof authenticated>()
  let listed = 0
  let requestSignal: AbortSignal | undefined
  const controller = new OpenBknUiController({ ...safePort,
    status: async signal => { requestSignal = signal; return status.promise },
    listNetworks: async () => { listed += 1; return [] },
  }, async () => 'session')
  controller.open()
  const pending = controller.refresh()
  controller.close()
  status.resolve(authenticated)
  await pending
  assert.equal(controller.snapshot().open, false)
  assert.equal(requestSignal?.aborted, true)
  assert.equal(listed, 0)
})

test('close and reopen discard the old login result without replacing the new state', async () => {
  const login = deferred<readonly []>()
  let checked = 0
  const controller = new OpenBknUiController({ ...safePort,
    beginLogin: async () => login.promise,
    status: async () => { checked += 1; return authenticated },
  }, async () => 'session')
  controller.open()
  const pending = controller.beginLogin()
  controller.close()
  controller.open()
  login.resolve([])
  await pending
  assert.deepEqual(controller.snapshot(), { open: true, phase: 'idle', networks: [] })
  assert.equal(checked, 0)
})

test('a newer refresh wins when the older catalogue resolves last', async () => {
  const oldCatalogue = deferred<readonly { id: string; displayName: string }[]>()
  let listed = 0
  const controller = new OpenBknUiController({ ...safePort,
    listNetworks: async () => ++listed === 1 ? oldCatalogue.promise : [{ id: 'new', displayName: 'New' }],
  }, async () => 'session')
  controller.open()
  const old = controller.refresh()
  await new Promise(resolve => setImmediate(resolve))
  await controller.refresh()
  oldCatalogue.resolve([{ id: 'old', displayName: 'Old' }])
  await old
  assert.equal(controller.snapshot().networks[0]?.id, 'new')
})

test('closing while a workspace is selected prevents later binding and UI refresh', async () => {
  const picker = deferred<string>()
  let bound = 0
  let refreshed = 0
  const controller = new OpenBknUiController({ ...safePort,
    bindNetwork: async () => { bound += 1; return { platformBaseUrl: authenticated.baseUrl, knowledgeNetworkId: 'network', displayName: 'Network' } },
  }, async () => picker.promise, () => { refreshed += 1 })
  controller.open()
  await controller.refresh()
  const pending = controller.openNetwork('network', 'create-workspace')
  controller.close()
  picker.resolve('session')
  await pending
  assert.equal(bound, 0)
  assert.equal(refreshed, 0)
  assert.equal(controller.snapshot().open, false)
})

test('closing during a configuration save ignores the result without connecting', async () => {
  const save = deferred<typeof configuredView>()
  let connected = 0
  const controller = new OpenBknUiController({ ...safePort,
    status: async () => { connected += 1; return authenticated },
  }, async () => 'session', undefined, {
    getConfiguration: async () => pendingView,
    saveConfiguration: async () => save.promise,
  })
  controller.open()
  await controller.refresh()
  const pending = controller.saveConfiguration({ baseUrl: authenticated.baseUrl, cliPath: 'openbkn' })
  controller.close()
  save.resolve(configuredView)
  await pending
  assert.equal(controller.snapshot().open, false)
  assert.equal(connected, 0)
})

test('an unavailable configuration entry preserves the healthy business panel', async () => {
  const controller = new OpenBknUiController(safePort, async () => 'session', undefined, {
    getConfiguration: async () => { throw new Error('diagnostics module unavailable') },
    saveConfiguration: async () => configuredView,
  })
  controller.open()
  await controller.refresh()
  assert.equal(controller.snapshot().phase, 'ready')
  assert.equal(controller.snapshot().networks[0]?.id, 'network')
  await controller.showSettings()
  assert.equal(controller.snapshot().phase, 'configuration')
  assert.match(controller.snapshot().configurationMessage!, /无法读取插件设置/)
})

test('closing during the configuration read prevents reopening the setup form', async () => {
  const configuration = deferred<typeof pendingView>()
  const controller = new OpenBknUiController(safePort, async () => 'session', undefined, {
    getConfiguration: async () => configuration.promise,
    saveConfiguration: async () => configuredView,
  })
  controller.open()
  const pending = controller.refresh()
  controller.close()
  configuration.resolve(pendingView)
  await pending
  assert.equal(controller.snapshot().open, false)
  assert.equal(controller.snapshot().phase, 'idle')
})

test('a readonly configuration view refuses saves until the user retries settings', async () => {
  let saved = 0
  let busy = true
  const controller = new OpenBknUiController(safePort, async () => 'session', undefined, {
    getConfiguration: async () => ({ ...pendingView, editable: !busy, ...(busy ? { unavailableReason: 'busy' as const } : {}) }),
    saveConfiguration: async () => { saved += 1; return configuredView },
  })
  controller.open()
  await controller.refresh()
  await controller.saveConfiguration({ baseUrl: authenticated.baseUrl, cliPath: 'openbkn' })
  assert.equal(saved, 0)
  busy = false
  await controller.showSettings()
  await controller.saveConfiguration({ baseUrl: authenticated.baseUrl, cliPath: 'openbkn' })
  assert.equal(saved, 1)
  assert.equal(controller.snapshot().phase, 'ready')
})


test('a readonly editor-unavailable view does not block a healthy business connection', async () => {
  let authenticatedCalls = 0
  const controller = new OpenBknUiController({ ...safePort,
    status: async () => { authenticatedCalls += 1; return authenticated },
  }, async () => 'session', undefined, {
    getConfiguration: async () => ({ ...pendingView, editable: false, unavailableReason: 'editor-unavailable' }),
    saveConfiguration: async () => configuredView,
  })
  controller.open()
  await controller.refresh()
  assert.equal(authenticatedCalls, 1)
  assert.equal(controller.snapshot().phase, 'ready')
  assert.equal(controller.snapshot().networks[0]?.id, 'network')
  await controller.showSettings()
  assert.equal(controller.snapshot().configuration?.editable, false)
})

test('unknown or inactive entries preserve the business failure and diagnostic guidance', async () => {
  for (const unavailableReason of ['entry-unavailable', 'entry-inactive'] as const) {
    const controller = new OpenBknUiController({ ...safePort,
      status: async () => { throw Object.assign(new Error('unavailable'), { code: 'openbkn/business-unavailable' }) },
    }, async () => 'session', undefined, {
      getConfiguration: async () => ({ ...pendingView, editable: false, unavailableReason }),
      saveConfiguration: async () => configuredView,
    })
    controller.open()
    await controller.refresh()
    assert.equal(controller.snapshot().phase, 'error')
    assert.match(controller.snapshot().message!, /诊断/)
    assert.equal(controller.snapshot().configuration?.unavailableReason, unavailableReason)
  }
})
