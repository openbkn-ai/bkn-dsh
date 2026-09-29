import assert from 'node:assert/strict'
import test from 'node:test'
import { trimTrailingSlashes } from '../src/trailing-slashes.ts'

test('strips every trailing slash exactly like the regex it replaces', () => {
  for (const value of ['', '/', '///', 'https://poc.openbkn.ai', 'https://poc.openbkn.ai/', 'https://poc.openbkn.ai///', 'a/b/', '/a', ' https://x/ ']) {
    assert.equal(trimTrailingSlashes(value), value.replace(/\/+$/, ''), JSON.stringify(value))
  }
})

test('stays linear on a long run of slashes followed by a non-slash', () => {
  const hostile = `https://x${'/'.repeat(200_000)}a${'/'.repeat(200_000)}`
  const started = performance.now()
  assert.equal(trimTrailingSlashes(hostile), `https://x${'/'.repeat(200_000)}a`)
  assert.ok(performance.now() - started < 1_000)
})
