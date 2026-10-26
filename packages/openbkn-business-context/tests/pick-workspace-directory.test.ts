import assert from 'node:assert/strict'
import test from 'node:test'
import { pickWorkspaceDirectory } from '../src/client/pick-workspace-directory.ts'

test('Desktop selects once through its native bridge, keeping the picker receiver', async () => {
  let calls = 0
  const desktop = { async pick() { assert.equal(this, desktop); calls++; return '/native/workspace' } }
  const workspace = { async pickDirectory() { throw new Error('must not open the Host script chooser') } }
  assert.equal(await pickWorkspaceDirectory(workspace, desktop), '/native/workspace')
  assert.equal(calls, 1)
})

test('browser and unavailable bridges retain the public workspace picker', async () => {
  let calls = 0
  const workspace = { async pickDirectory() { assert.equal(this, workspace); calls++; return '/host/workspace' } }
  for (const desktop of [null, {}, { pick: 'unavailable' }]) {
    assert.equal(await pickWorkspaceDirectory(workspace, desktop), '/host/workspace')
  }
  assert.equal(calls, 3)
})

test('native cancellation does not open a second Host chooser', async () => {
  const workspace = { async pickDirectory() { throw new Error('unexpected fallback') } }
  assert.equal(await pickWorkspaceDirectory(workspace, { pick: async () => null }), null)
})

test('native failure is preserved without opening a second Host chooser', async () => {
  const failure = new Error('native selection failed')
  const workspace = { async pickDirectory() { throw new Error('unexpected fallback') } }
  await assert.rejects(pickWorkspaceDirectory(workspace, { pick: async () => { throw failure } }), error => error === failure)
})
