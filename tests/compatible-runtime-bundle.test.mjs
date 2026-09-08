import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { assembleCompatibleRuntimeBundle } from '../runtime/assemble-compatible-runtime-bundle.mjs'

test('assembles a self-contained runtime with the patched dependency closure and embedded plugin', () => {
  const root = mkdtempSync(join(tmpdir(), 'openbkn-runtime-bundle-'))
  const runtimeDirectory = join(root, 'runtime-source')
  const outputDirectory = join(root, 'out')
  const pluginTarball = join(root, 'plugin.tgz')
  mkdirSync(join(runtimeDirectory, 'lib'), { recursive: true })
  for (const dependency of ['dsh-mcp-client', 'dsh-session', 'dsh-typert-generator']) {
    mkdirSync(join(runtimeDirectory, 'node_modules', '@deepseek-ai', dependency), { recursive: true })
    writeFileSync(join(runtimeDirectory, 'node_modules', '@deepseek-ai', dependency, 'patched.txt'), 'patched\n')
  }
  writeFileSync(join(runtimeDirectory, 'lib', 'bin.js'), '#!/usr/bin/env node\n')
  writeFileSync(pluginTarball, 'plugin archive\n')

  const bundle = assembleCompatibleRuntimeBundle({
    runtimeDirectory,
    outputDirectory,
    pluginTarball,
    manifest: manifest(),
    platform: 'darwin-arm64',
  })

  assert.equal(readFileSync(join(bundle.directory, 'runtime', 'node_modules', '@deepseek-ai', 'dsh-mcp-client', 'patched.txt'), 'utf8'), 'patched\n')
  assert.equal(readFileSync(join(bundle.directory, 'plugins', 'openbkn-dsh-business-context-0.1.3.tgz'), 'utf8'), 'plugin archive\n')
  assert.match(readFileSync(join(bundle.directory, 'bin', 'dsh'), 'utf8'), /DSH_HOME/)
  assert.equal(statSync(join(bundle.directory, 'bin', 'dsh')).mode & 0o111, 0o111)
})

test('rejects a runtime directory without the patched dependency closure', () => {
  const root = mkdtempSync(join(tmpdir(), 'openbkn-runtime-bundle-'))
  const runtimeDirectory = join(root, 'runtime-source')
  mkdirSync(join(runtimeDirectory, 'lib'), { recursive: true })
  writeFileSync(join(runtimeDirectory, 'lib', 'bin.js'), '#!/usr/bin/env node\n')
  const pluginTarball = join(root, 'plugin.tgz')
  writeFileSync(pluginTarball, 'plugin archive\n')

  assert.throws(
    () => assembleCompatibleRuntimeBundle({
      runtimeDirectory,
      outputDirectory: join(root, 'out'),
      pluginTarball,
      manifest: manifest(),
      platform: 'darwin-arm64',
    }),
    /dependency closure/,
  )
})

function manifest() {
  return {
    bundle: {
      name: 'openbkn-dsh-runtime',
      version: '0.1.2-rc.1-openbkn.1',
      archives: [{ platform: 'darwin-arm64', file: 'openbkn-dsh-runtime-0.1.2-rc.1-openbkn.1-darwin-arm64.tar.gz' }],
    },
    plugin: { artifact: 'openbkn-dsh-business-context-0.1.3.tgz' },
  }
}
