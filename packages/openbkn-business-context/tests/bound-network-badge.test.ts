import assert from 'node:assert/strict'
import test from 'node:test'
import { BoundNetworkController } from '../src/client/BoundNetworkBadge.tsx'

test('projects an immutable host binding into a read-only header view', async () => {
  const controller = new BoundNetworkController(async () => ({
    platformBaseUrl: 'https://poc.openbkn.ai', knowledgeNetworkId: 'kn-supply', displayName: 'Supply risk',
  }))

  await controller.load()

  assert.deepEqual(controller.getSnapshot(), {
    kind: 'bound',
    binding: {
      platformBaseUrl: 'https://poc.openbkn.ai', knowledgeNetworkId: 'kn-supply', displayName: 'Supply risk',
    },
  })
})

test('renders no badge when the session has no binding or its read fails', async () => {
  const absent = new BoundNetworkController(async () => undefined)
  await absent.load()
  assert.deepEqual(absent.getSnapshot(), { kind: 'absent' })

  const failed = new BoundNetworkController(async () => { throw new Error('unavailable') })
  await failed.load()
  assert.deepEqual(failed.getSnapshot(), { kind: 'absent' })
})

/** Waits until `condition` holds; retry chains use real timers, so fixed
 *  sleeps race under CI load — poll instead. */
async function waitFor(condition: () => boolean, timeoutMs = 2_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (!condition()) {
    if (Date.now() > deadline) throw new Error('waitFor timed out')
    await new Promise(resolve => setTimeout(resolve, 2))
  }
}

test('retries a not-yet-live session read before settling, then succeeds', async () => {
  let attempts = 0
  const controller = new BoundNetworkController(async () => {
    attempts += 1
    if (attempts < 3) throw Object.assign(new Error('OpenBKN business-network binding target is not a live DSH session.'), { })
    return { platformBaseUrl: 'https://poc.openbkn.ai', knowledgeNetworkId: 'kn-supply', displayName: 'Supply risk' }
  }, 1, 5)

  await controller.load()
  await waitFor(() => attempts >= 3)

  assert.equal(attempts, 3)
  assert.equal(controller.getSnapshot().kind, 'bound')
})

test('settles on absent after exhausting not-yet-live retries', async () => {
  let attempts = 0
  const controller = new BoundNetworkController(async () => {
    attempts += 1
    throw new Error('OpenBKN business-network binding target is not a live DSH session.')
  }, 1, 3)

  await controller.load()
  await waitFor(() => attempts >= 4)

  assert.equal(attempts, 4)
  assert.deepEqual(controller.getSnapshot(), { kind: 'absent' })
})
