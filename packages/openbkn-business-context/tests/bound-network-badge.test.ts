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
