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
  const profileDirectory = profile(root)
  mkdirSync(join(runtimeDirectory, 'node_modules', '@deepseek-ai', 'dsh', 'lib'), { recursive: true })
  for (const dependency of ['dsh-mcp-client', 'dsh-session']) {
    mkdirSync(join(runtimeDirectory, 'node_modules', '@deepseek-ai', dependency), { recursive: true })
    writeFileSync(join(runtimeDirectory, 'node_modules', '@deepseek-ai', dependency, 'patched.txt'), 'patched\n')
  }
  writeFileSync(join(runtimeDirectory, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js'), '#!/usr/bin/env node\n')
  writeFileSync(pluginTarball, 'plugin archive\n')

  const bundle = assembleCompatibleRuntimeBundle({
    runtimeDirectory,
    profileDirectory,
    outputDirectory,
    pluginTarball,
    manifest: manifest(),
    platform: 'darwin-arm64',
  })

  assert.equal(readFileSync(join(bundle.directory, 'runtime', 'node_modules', '@deepseek-ai', 'dsh-mcp-client', 'patched.txt'), 'utf8'), 'patched\n')
  assert.equal(readFileSync(join(bundle.directory, 'runtime', 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js'), 'utf8'), '#!/usr/bin/env node\n')
  assert.equal(readFileSync(join(bundle.directory, 'plugins', 'openbkn-dsh-business-context-0.1.3.tgz'), 'utf8'), 'plugin archive\n')
  assert.equal(readFileSync(join(bundle.directory, 'profile-template', 'web', 'package.json'), 'utf8').includes('dsh-business-context'), true)
  assert.match(readFileSync(join(bundle.directory, 'bin', 'dsh'), 'utf8'), /DSH_HOME/)
  assert.match(readFileSync(join(bundle.directory, 'bin', 'dsh'), 'utf8'), /bootstrap-openbkn-plugin/)
  assert.equal(readFileSync(join(bundle.directory, 'bootstrap-openbkn-plugin.mjs'), 'utf8').includes('initializeProfile'), true)
  assert.equal(statSync(join(bundle.directory, 'bin', 'dsh')).mode & 0o111, 0o111)
})

test('rejects a runtime directory without the patched dependency closure', () => {
  const root = mkdtempSync(join(tmpdir(), 'openbkn-runtime-bundle-'))
  const runtimeDirectory = join(root, 'runtime-source')
  mkdirSync(join(runtimeDirectory, 'node_modules', '@deepseek-ai', 'dsh', 'lib'), { recursive: true })
  writeFileSync(join(runtimeDirectory, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js'), '#!/usr/bin/env node\n')
  const pluginTarball = join(root, 'plugin.tgz')
  const profileDirectory = profile(root)
  writeFileSync(pluginTarball, 'plugin archive\n')

  assert.throws(
    () => assembleCompatibleRuntimeBundle({
      runtimeDirectory,
      profileDirectory,
      outputDirectory: join(root, 'out'),
      pluginTarball,
      manifest: manifest(),
      platform: 'darwin-arm64',
    }),
    /dependency closure/,
  )
})

test('writes a Windows launcher for a Windows bundle', () => {
  const root = mkdtempSync(join(tmpdir(), 'openbkn-runtime-bundle-'))
  const runtimeDirectory = join(root, 'runtime-source')
  const outputDirectory = join(root, 'out')
  const pluginTarball = join(root, 'plugin.tgz')
  const profileDirectory = profile(root)
  mkdirSync(join(runtimeDirectory, 'node_modules', '@deepseek-ai', 'dsh', 'lib'), { recursive: true })
  for (const dependency of ['dsh-mcp-client', 'dsh-session']) {
    mkdirSync(join(runtimeDirectory, 'node_modules', '@deepseek-ai', dependency), { recursive: true })
  }
  writeFileSync(join(runtimeDirectory, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js'), '#!/usr/bin/env node\n')
  writeFileSync(pluginTarball, 'plugin archive\n')
  const windowsManifest = manifest()
  windowsManifest.bundle.archives = [{ platform: 'win32-x64', file: 'openbkn-dsh-runtime.zip' }]

  const bundle = assembleCompatibleRuntimeBundle({
    runtimeDirectory,
    profileDirectory,
    outputDirectory,
    pluginTarball,
    manifest: windowsManifest,
    platform: 'win32-x64',
  })

  assert.match(readFileSync(join(bundle.directory, 'bin', 'dsh.cmd'), 'utf8'), /DSH_HOME/)
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

function profile(root) {
  const directory = join(root, 'profile', 'web')
  mkdirSync(join(directory, 'node_modules', '@openbkn', 'dsh-business-context'), { recursive: true })
  writeFileSync(join(directory, 'package.json'), JSON.stringify({
    dsh: { profile: { bundles: ['@openbkn/dsh-business-context'] } },
  }))
  writeFileSync(join(directory, 'node_modules', '@openbkn', 'dsh-business-context', 'package.json'), JSON.stringify({ version: '0.1.3' }))
  return directory
}
