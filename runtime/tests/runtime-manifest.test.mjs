import assert from 'node:assert/strict'
import test from 'node:test'

import { loadRuntimeManifest } from '../runtime-manifest.mjs'

test('loads one fully pinned compatible-runtime release manifest', () => {
  const manifest = loadRuntimeManifest(new URL('../openbkn-dsh-runtime.manifest.json', import.meta.url))

  assert.equal(manifest.bundle.name, 'openbkn-dsh-runtime')
  assert.match(manifest.bundle.version, /^0\.1\.2-rc\.1-openbkn\.\d+$/)
  assert.deepEqual(manifest.bundle.archives.map((archive) => archive.platform), ['darwin-arm64', 'darwin-x64', 'win32-x64'])
  assert.equal(manifest.dsh.tag, 'dsh-v0.1.2-rc.1')
  assert.match(manifest.dsh.baseCommit, /^[0-9a-f]{40}$/)
  assert.match(manifest.plugin.packageName, /^@openbkn\//)
  assert.match(manifest.plugin.artifact, /\.tgz$/)
  assert.ok(manifest.compatibility.patches.length > 0)
})

test('rejects a release manifest without a pinned upstream commit', () => {
  assert.throws(
    () => loadRuntimeManifest({
      format: 1,
      bundle: {
        name: 'openbkn-dsh-runtime',
        version: '0.1.2-rc.1-openbkn.1',
        node: '>=20',
        archives: [{ platform: 'darwin-arm64', file: 'openbkn-dsh-runtime.tar.gz' }],
      },
      dsh: { tag: 'dsh-v0.1.2-rc.1', baseCommit: 'main', upstream: 'https://github.com/deepseek-ai/deepseek-harness.git' },
      plugin: { packageName: '@openbkn/dsh-business-context', version: '0.1.3', artifact: 'plugin.tgz' },
      compatibility: { patches: [{ file: 'patches/0001.patch', sha256: 'a'.repeat(64) }] },
    }),
    /baseCommit/,
  )
})
