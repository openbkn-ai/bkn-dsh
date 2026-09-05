import assert from 'node:assert/strict'
import test from 'node:test'
import { SuggestionDockController } from '../src/client/suggestion-dock-controller.ts'

test('loads bounded prompt suggestions and retains the last safe result on failure', async () => {
  let fail = false
  const controller = new SuggestionDockController(async () => {
    if (fail) throw new Error('unavailable')
    return ['问题一', '问题二']
  })
  await controller.load()
  fail = true
  await controller.load()

  assert.deepEqual(controller.getSnapshot(), ['问题一', '问题二'])
})
