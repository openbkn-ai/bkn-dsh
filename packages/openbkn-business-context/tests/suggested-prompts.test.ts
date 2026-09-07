import assert from 'node:assert/strict'
import test from 'node:test'
import { emptyBusinessSessionPrompt } from '../src/suggested-prompts.ts'

test('creates one network-introduction prompt for an empty business session', () => {
  assert.equal(emptyBusinessSessionPrompt('供应链风险网络'), '了解「供应链风险网络」知识网络。')
})

test('does not derive a prompt from blank or unbounded network display text', () => {
  assert.throws(() => emptyBusinessSessionPrompt(' '), /network name/i)
  assert.throws(() => emptyBusinessSessionPrompt('x'.repeat(401)), /network name/i)
})
