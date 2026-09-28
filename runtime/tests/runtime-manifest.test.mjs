import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import { loadRuntimeManifest } from '../runtime-manifest.mjs'

test('loads one fully pinned compatible-runtime release manifest', () => {
  const manifest = loadRuntimeManifest(new URL('../openbkn-dsh-runtime.manifest.json', import.meta.url))

  assert.equal(manifest.bundle.name, 'openbkn-dsh-runtime')
  assert.match(manifest.bundle.version, /^0\.1\.7-rc\.2-openbkn\.0\.1\.4(-\d+)?$/)
  assert.deepEqual(manifest.bundle.archives.map((archive) => archive.platform), ['darwin-arm64', 'win32-x64'])
  assert.equal(manifest.dsh.tag, "dsh-v0.1.7-rc.2")
  assert.match(manifest.dsh.baseCommit, /^[0-9a-f]{40}$/)
  assert.match(manifest.plugin.packageName, /^@openbkn\//)
  assert.match(manifest.plugin.artifact, /\.tgz$/)
  assert.equal(manifest.compatibility.patches.length, 3)
})

test('rejects a plugin version that does not carry the pinned DSH version', () => {
  const base = {
    format: 1,
    bundle: {
      name: 'openbkn-dsh-runtime',
      version: '0.1.7-rc.2-openbkn.0.1.4',
      node: '>=20',
      archives: [{ platform: 'darwin-arm64', file: 'openbkn-dsh-runtime.tar.gz' }],
    },
    dsh: { tag: 'dsh-v0.1.7-rc.2', baseCommit: 'a'.repeat(40), upstream: 'https://github.com/deepseek-ai/deepseek-harness.git' },
    plugin: { packageName: '@openbkn/dsh-business-context', version: '0.1.6-rc.1', artifact: 'plugin.tgz' },
    compatibility: { directory: 'compat/dsh-0.1.7-rc.2', patches: [{ file: 'patches/0001.patch', sha256: 'a'.repeat(64) }] },
  }

  assert.throws(() => loadRuntimeManifest(base), /plugin\.version must carry/)
  assert.doesNotThrow(() => loadRuntimeManifest({
    ...base,
    plugin: { ...base.plugin, version: '0.1.7-rc.2-openbkn.0.1.4' },
  }))
})

test('keeps the JSON schema in sync with the pinned manifest', () => {
  const manifest = loadRuntimeManifest(new URL('../openbkn-dsh-runtime.manifest.json', import.meta.url))
  const schema = JSON.parse(readFileSync(new URL('../runtime-manifest.schema.json', import.meta.url), 'utf8'))

  assert.match(
    manifest.bundle.version,
    new RegExp(schema.properties.bundle.properties.version.pattern),
    'runtime-manifest.schema.json bundle.version pattern drifted from the pinned manifest',
  )
  assert.match(
    manifest.plugin.version,
    new RegExp(schema.properties.plugin.properties.version.pattern),
    'runtime-manifest.schema.json plugin.version pattern drifted from the pinned manifest',
  )
  assert.equal(
    schema.properties.dsh.properties.tag.const,
    manifest.dsh.tag,
    'runtime-manifest.schema.json dsh.tag const drifted from the pinned manifest',
  )
})

test('rejects a release manifest without a pinned upstream commit', () => {
  assert.throws(
    () => loadRuntimeManifest({
      format: 1,
      bundle: {
        name: 'openbkn-dsh-runtime',
        version: '0.1.7-rc.2-openbkn.0.1.4',
        node: '>=20',
        archives: [{ platform: 'darwin-arm64', file: 'openbkn-dsh-runtime.tar.gz' }],
      },
      dsh: { tag: 'dsh-v0.1.7-rc.2', baseCommit: 'main', upstream: 'https://github.com/deepseek-ai/deepseek-harness.git' },
      plugin: { packageName: '@openbkn/dsh-business-context', version: '0.1.7-rc.2-openbkn.0.1.4', artifact: 'plugin.tgz' },
      compatibility: { patches: [{ file: 'patches/0001.patch', sha256: 'a'.repeat(64) }] },
    }),
    /baseCommit/,
  )
})
