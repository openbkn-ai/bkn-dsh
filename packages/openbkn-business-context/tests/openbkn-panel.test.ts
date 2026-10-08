import assert from 'node:assert/strict'
import test from 'node:test'
import { OpenBknPanelBridge } from '../src/client/openbkn-panel-bridge.ts'
import type { OpenBknUiPort } from '../src/client/openbkn-ui-controller.ts'

const port: OpenBknUiPort = {
  status: async () => ({ kind: 'authenticated', baseUrl: 'https://platform.invalid' }),
  beginLogin: async () => [],
  configureToken: async () => [],
  listNetworks: async () => [{ id: 'network', displayName: 'Network' }],
  bindNetworkWorkspace: async () => ({ id: 'network', displayName: 'Network' }),
  bindNetwork: async () => ({ platformBaseUrl: 'https://platform.invalid', knowledgeNetworkId: 'network', displayName: 'Network' }),
}

test('the panel opens without business services and recovers when they become available', async () => {
  const bridge = new OpenBknPanelBridge()
  bridge.controller.open()
  await bridge.controller.refresh()
  assert.equal(bridge.controller.snapshot().open, true)
  assert.equal(bridge.controller.snapshot().phase, 'error')
  assert.match(bridge.controller.snapshot().message!, /右上角“诊断”/)

  const disconnect = bridge.connect(port, async () => 'session', () => undefined)
  await bridge.controller.refresh()
  assert.equal(bridge.controller.snapshot().phase, 'ready')
  assert.equal(bridge.controller.snapshot().networks[0].id, 'network')
  disconnect()
  await bridge.controller.refresh()
  assert.equal(bridge.controller.snapshot().open, true)
  assert.equal(bridge.controller.snapshot().phase, 'error')
  assert.deepEqual(bridge.controller.snapshot().networks, [])
})

test('disposing an older business connection does not detach its replacement', async () => {
  const bridge = new OpenBknPanelBridge()
  const old = bridge.connect(port, async () => 'old-session', () => undefined)
  bridge.connect({ ...port, listNetworks: async () => [{ id: 'new', displayName: 'New' }] }, async () => 'new-session', () => undefined)
  old()
  bridge.controller.open()
  await bridge.controller.refresh()
  assert.equal(bridge.controller.snapshot().networks[0].id, 'new')
})


test('configuration is available without business services and survives their reload', async () => {
  const bridge = new OpenBknPanelBridge()
  let resolveSave!: (value: { baseUrl: string; cliPath: string; configured: boolean; editable: boolean }) => void
  bridge.connectConfiguration({
    getConfiguration: async () => ({ baseUrl: '', cliPath: 'openbkn', configured: false, editable: true }),
    saveConfiguration: async () => new Promise(resolve => { resolveSave = resolve }),
  })
  bridge.controller.open()
  await bridge.controller.refresh()
  assert.equal(bridge.controller.snapshot().phase, 'configuration')
  const pending = bridge.controller.saveConfiguration({ baseUrl: 'https://platform.invalid', cliPath: 'openbkn' })
  const disconnect = bridge.connect(port, async () => 'session', () => undefined)
  disconnect()
  bridge.connect({ ...port, listNetworks: async () => [{ id: 'reloaded', displayName: 'Reloaded' }] }, async () => 'session', () => undefined)
  resolveSave({ baseUrl: 'https://platform.invalid', cliPath: 'openbkn', configured: true, editable: true })
  await pending
  assert.equal(bridge.controller.snapshot().phase, 'ready')
  assert.equal(bridge.controller.snapshot().networks[0]?.id, 'reloaded')
})

test('business replacement rejects an old reply even when its Remote ignores cancellation', async () => {
  const bridge = new OpenBknPanelBridge()
  let resolveStatus!: (value: { kind: 'authenticated'; baseUrl: string }) => void
  bridge.connect({ ...port, status: async () => new Promise(resolve => { resolveStatus = resolve }) }, async () => 'old', () => undefined)
  bridge.controller.open()
  const old = bridge.controller.refresh()
  await new Promise(resolve => setImmediate(resolve))
  bridge.connect({ ...port, listNetworks: async () => [{ id: 'new', displayName: 'New' }] }, async () => 'new', () => undefined)
  await bridge.controller.refresh()
  resolveStatus({ kind: 'authenticated', baseUrl: 'https://old.invalid' })
  await old
  assert.equal(bridge.controller.snapshot().networks[0]?.id, 'new')
})
