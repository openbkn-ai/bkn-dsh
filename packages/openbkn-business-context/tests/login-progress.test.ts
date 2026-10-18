import assert from 'node:assert/strict'
import { test } from 'node:test'
import { OpenBknUiController, type OpenBknUiPort } from '../src/client/openbkn-ui-controller.ts'
function deferred<T>() { let resolve!: (value: T) => void; let reject!: (reason: unknown) => void; const promise = new Promise<T>((a, b) => { resolve = a; reject = b }); return { promise, resolve, reject } }
const auth = { kind: 'authenticated' as const, baseUrl: 'https://platform.invalid' }
const port: OpenBknUiPort = {
  status: async () => auth, beginLogin: async () => [], configureToken: async () => [], listNetworks: async () => [],
  bindNetworkWorkspace: async () => ({ id: 'n', displayName: 'N' }),
  bindNetwork: async () => ({ platformBaseUrl: auth.baseUrl, knowledgeNetworkId: 'n', displayName: 'N' }),
}
test('login has a dedicated waiting state and repeated clicks dispatch once', async () => {
  const pending = deferred<readonly []>(); let calls = 0
  const controller = new OpenBknUiController({ ...port, beginLogin: async () => { calls++; return pending.promise } }, async () => 's')
  controller.open(); const first = controller.beginLogin(); await controller.beginLogin()
  assert.equal(calls, 1); assert.equal(controller.snapshot().login, 'waiting')
  pending.resolve([]); await first
  assert.equal(controller.snapshot().phase, 'ready'); assert.equal(controller.snapshot().login, 'succeeded')
})
test('cancel aborts only the active request and discards a late result; retry is independent', async () => {
  const pending = deferred<readonly []>(); let signal: AbortSignal | undefined; let checked = 0
  const controller = new OpenBknUiController({ ...port, status: async () => { checked++; return auth }, beginLogin: async s => { signal = s; return pending.promise } }, async () => 's')
  controller.open(); const first = controller.beginLogin(); controller.cancelLogin()
  assert.equal(signal?.aborted, true); assert.equal(controller.snapshot().login, 'cancelled')
  pending.resolve([]); await first; assert.equal(checked, 0)
  await controller.beginLogin(); assert.equal(checked, 1); assert.equal(controller.snapshot().login, 'succeeded')
})
test('bounded login timeout cancels the request without accepting a late response', async () => {
  const pending = deferred<readonly []>(); let signal: AbortSignal | undefined
  const controller = new OpenBknUiController({ ...port, beginLogin: async s => { signal = s; return pending.promise } }, async () => 's', undefined, undefined, 5)
  controller.open(); const first = controller.beginLogin()
  await new Promise(resolve => setTimeout(resolve, 20))
  assert.equal(controller.snapshot().login, 'timed-out'); assert.equal(signal?.aborted, true)
  pending.resolve([]); await first; assert.equal(controller.snapshot().login, 'timed-out')
})
test('closing during login aborts its request and reopening has no stale outcome', async () => {
  const pending = deferred<readonly []>(); let signal: AbortSignal | undefined
  const controller = new OpenBknUiController({ ...port, beginLogin: async s => { signal = s; return pending.promise } }, async () => 's')
  controller.open(); const first = controller.beginLogin(); controller.close(); controller.open()
  pending.resolve([]); await first
  assert.equal(signal?.aborted, true); assert.equal(controller.snapshot().login, undefined); assert.equal(controller.snapshot().phase, 'idle')
})
test('failed login exposes a controlled state without raw CLI output', async () => {
  const controller = new OpenBknUiController({ ...port, beginLogin: async () => { throw new Error('private-token-value') } }, async () => 's')
  controller.open(); await controller.beginLogin()
  assert.equal(controller.snapshot().login, 'failed'); assert.doesNotMatch(JSON.stringify(controller.snapshot()), /private-token-value/)
})
