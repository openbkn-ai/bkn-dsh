import assert from 'node:assert/strict'
import test from 'node:test'
import { SuggestionDockController, synchronizeSuggestionDockForEvents } from '../src/client/suggestion-dock-controller.ts'

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

test('clears the one empty-session entry when a native business turn begins', async () => {
  const prompts: readonly string[] = ['了解「供应链」知识网络。']
  const controller = new SuggestionDockController(async () => prompts)
  await controller.load()
  controller.beginTurn()
  assert.deepEqual(controller.getSnapshot(), [])
})

test('reacts only to the native turn-start event', async () => {
  const calls: string[] = []
  const controller = {
    beginTurn() { calls.push('begin') },
    refresh: async () => { calls.push('refresh') },
  } as unknown as SuggestionDockController
  synchronizeSuggestionDockForEvents(controller, [
    { type: 'assistant/message' },
    { type: 'turn/start' },
    { type: 'assistant/message' },
  ])
  await Promise.resolve()
  assert.deepEqual(calls, ['begin'])
})
