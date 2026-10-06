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
