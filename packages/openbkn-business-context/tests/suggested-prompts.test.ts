import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveSuggestedPrompts } from '../src/suggested-prompts.ts'

test('resolves configured prompt templates against the immutable bound network', () => {
  assert.deepEqual(resolveSuggestedPrompts([
    '概览 {network} 中最需要关注的业务风险。',
    '概览 {network} 中最需要关注的业务风险。',
    '给出下一步值得核实的信息。',
  ], '供应链风险网络'), [
    '概览 供应链风险网络 中最需要关注的业务风险。',
    '给出下一步值得核实的信息。',
  ])
})

test('rejects blank, unbounded, or excessive configured prompt values', () => {
  const oversized = 'x'.repeat(401)
  assert.deepEqual(resolveSuggestedPrompts([' ', oversized, ...Array.from({ length: 8 }, (_, index) => `问题 ${index}`)], '网络'), [
    '问题 0', '问题 1', '问题 2', '问题 3', '问题 4',
  ])
})
