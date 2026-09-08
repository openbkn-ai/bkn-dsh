import assert from 'node:assert/strict'
import test from 'node:test'

import { runBuildCompatibleRuntime } from '../scripts/build-compatible-runtime.mjs'

test('requires explicit source and output paths', () => {
  assert.throws(() => runBuildCompatibleRuntime([]), /Usage:/)
})

test('passes the pinned release and compatibility manifests to the builder', () => {
  const calls = []

  runBuildCompatibleRuntime(['--dsh', '/tmp/dsh-source', '--output', '/tmp/runtime-output'], {
    build: (input) => calls.push(input),
  })

  assert.equal(calls.length, 1)
  assert.equal(calls[0].target, '/tmp/dsh-source')
  assert.equal(calls[0].outputDirectory, '/tmp/runtime-output')
  assert.equal(calls[0].releaseManifest.dsh.tag, 'dsh-v0.1.2-rc.1')
  assert.equal(calls[0].releaseManifest.dsh.baseCommit, calls[0].compatibilityManifest.dsh.baseCommit)
})
