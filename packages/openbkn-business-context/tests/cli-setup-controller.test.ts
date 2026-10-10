import assert from 'node:assert/strict'
import test from 'node:test'
import { CliSetupController, cliSetupMessage } from '../src/client/cli-setup-controller.ts'
import type { OpenBknCliSetupView } from '../src/types.ts'

function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(done => { resolve = done }); return { promise, resolve } }
const missing: OpenBknCliSetupView = { state: 'missing', canInstall: true }
const ready: OpenBknCliSetupView = { state: 'ready', canInstall: false, resolvedPath: '/tools/openbkn', version: '0.1.5' }

test('opening advanced settings checks availability without installing', async () => {
  let installs = 0
  const controller = new CliSetupController({ checkCli: async () => missing, installCli: async () => { installs++; return ready } }, () => {})
  await controller.check('openbkn')
  assert.equal(controller.snapshot().phase, 'missing')
  assert.equal(installs, 0)
  controller.dispose()
})
test('detected absolute path is returned for the draft without installation', async () => {
  let resolved = '', installs = 0
  const controller = new CliSetupController({ checkCli: async () => ready, installCli: async () => { installs++; return ready } }, path => { resolved = path })
  await controller.detectAndInstall('openbkn')
  assert.equal(resolved, '/tools/openbkn')
  assert.equal(installs, 0)
  controller.dispose()
})
test('duplicate clicks install once and show real installing state', async () => {
  const result = deferred<OpenBknCliSetupView>()
  let installs = 0
  const controller = new CliSetupController({ checkCli: async () => missing, installCli: async () => { installs++; return await result.promise } }, () => {})
  const click = controller.detectAndInstall('openbkn')
  await new Promise(resolve => setImmediate(resolve))
  await controller.detectAndInstall('openbkn')
  assert.equal(controller.snapshot().phase, 'installing')
  assert.equal(installs, 1)
  result.resolve(ready)
  await click
  assert.equal(controller.snapshot().phase, 'ready')
  controller.dispose()
})
test('closing during installation leaves Host call running and ignores late path/state', async () => {
  const result = deferred<OpenBknCliSetupView>()
  let resolved = '', installs = 0
  const controller = new CliSetupController({ checkCli: async () => missing, installCli: async () => { installs++; return await result.promise } }, path => { resolved = path })
  const click = controller.detectAndInstall('openbkn')
  await new Promise(resolve => setImmediate(resolve))
  controller.dispose()
  result.resolve(ready)
  await click
  assert.equal(installs, 1)
  assert.equal(resolved, '')
  assert.equal(controller.snapshot().phase, 'installing')
})
test('an older detection response cannot replace a new edited path result', async () => {
  const old = deferred<OpenBknCliSetupView>()
  let resolved = ''
  const controller = new CliSetupController({ checkCli: async path => path === 'openbkn' ? await old.promise : ready, installCli: async () => ready }, path => { resolved = path })
  const first = controller.check('openbkn')
  await controller.check('/tools/openbkn')
  old.resolve(missing)
  await first
  assert.equal(controller.snapshot().phase, 'ready')
  assert.equal(resolved, '')
  controller.dispose()
})
test('polling a Host installation keeps the installing state while awaiting the check', async () => {
  const result = deferred<OpenBknCliSetupView>()
  let calls = 0
  const controller = new CliSetupController({
    checkCli: async () => ++calls === 1 ? { state: 'installing', canInstall: false } : await result.promise,
    installCli: async () => ready,
  }, () => {})
  await controller.check('openbkn')
  const poll = controller.check('openbkn')
  assert.equal(controller.snapshot().phase, 'installing')
  result.resolve(ready)
  await poll
  assert.equal(controller.snapshot().phase, 'ready')
  controller.dispose()
})
test('only explicit setup locks the draft during preflight and releases it on refusal', async () => {
  const first = deferred<OpenBknCliSetupView>()
  const second = deferred<OpenBknCliSetupView>()
  let calls = 0, installs = 0
  const controller = new CliSetupController({
    checkCli: async () => ++calls === 1 ? await first.promise : await second.promise,
    installCli: async () => { installs++; return ready },
  }, () => {})
  const read = controller.check('openbkn')
  assert.equal(controller.snapshot().setupRequested, false)
  first.resolve(missing)
  await read
  const setup = controller.detectAndInstall('openbkn')
  assert.equal(controller.snapshot().phase, 'checking')
  assert.equal(controller.snapshot().setupRequested, true)
  second.resolve({ state: 'blocked', canInstall: false, reason: 'npm-missing' })
  await setup
  assert.equal(controller.snapshot().setupRequested, false)
  assert.equal(controller.snapshot().phase, 'blocked')
  assert.equal(installs, 0)
  controller.dispose()
})
test('blocked and failure reasons never claim installed or require a restart as proven', async () => {
  let installs = 0
  const controller = new CliSetupController({ checkCli: async () => ({ state: 'blocked', canInstall: false, reason: 'npm-missing' }), installCli: async () => { installs++; return ready } }, () => {})
  await controller.detectAndInstall('openbkn')
  assert.equal(installs, 0)
  assert.match(cliSetupMessage(controller.snapshot()), /找不到 npm/)
  assert.match(cliSetupMessage({ phase: 'failed', result: { state: 'failed', canInstall: false, reason: 'verification-failed' } }), /尚无法使用/)
  controller.dispose()
})
