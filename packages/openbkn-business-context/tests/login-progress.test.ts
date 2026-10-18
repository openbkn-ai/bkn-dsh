import assert from 'node:assert/strict'
import { test } from 'node:test'
import { OpenBknUiController, type OpenBknUiPort } from '../src/client/openbkn-ui-controller.ts'
import type { AuthSnapshot } from '../src/types.ts'
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

for (const status of [
  { kind: 'authentication-required', baseUrl: auth.baseUrl },
  { kind: 'platform-mismatch', expectedBaseUrl: auth.baseUrl, actualBaseUrl: 'https://other.invalid' },
] satisfies AuthSnapshot[]) {
  test(`login verification returning ${status.kind} never publishes success or the stale catalogue`, async () => {
    const controller = new OpenBknUiController({ ...port, status: async () => status, beginLogin: async () => [{ id: 'private-network', displayName: 'Stale catalogue' }] }, async () => 's')
    const outcomes: string[] = []
    controller.subscribe(() => { if (controller.snapshot().login) outcomes.push(controller.snapshot().login!) })
    controller.open(); await controller.beginLogin()
    assert.equal(controller.snapshot().phase, 'authentication-required')
    assert.equal(controller.snapshot().login, 'failed')
    assert.deepEqual(controller.snapshot().auth, status)
    assert.deepEqual(controller.snapshot().networks, [])
    assert.equal(outcomes.includes('succeeded'), false)
  })
}

test('an unsuccessful verification can retry and succeeds only after authenticated verification', async () => {
  let checks = 0
  const controller = new OpenBknUiController({ ...port, status: async () => ++checks === 1 ? { kind: 'authentication-required', baseUrl: auth.baseUrl } : auth }, async () => 's')
  controller.open(); await controller.beginLogin()
  assert.equal(controller.snapshot().login, 'failed')
  await controller.beginLogin()
  assert.equal(controller.snapshot().login, 'succeeded'); assert.equal(checks, 2)
})

test('cancellation while verifying status discards a late authenticated result', async () => {
  const pending = deferred<AuthSnapshot>(); let signal: AbortSignal | undefined
  const controller = new OpenBknUiController({ ...port, status: async s => { signal = s; return pending.promise } }, async () => 's')
  controller.open(); const first = controller.beginLogin(); await new Promise(resolve => setImmediate(resolve))
  controller.cancelLogin(); assert.equal(signal?.aborted, true)
  pending.resolve(auth); await first
  assert.equal(controller.snapshot().login, 'cancelled'); assert.equal(controller.snapshot().phase, 'authentication-required')
})
