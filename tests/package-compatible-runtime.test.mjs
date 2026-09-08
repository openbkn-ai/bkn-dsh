import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { packageCompatibleRuntime, windowsCompressArchiveCommand } from '../scripts/package-compatible-runtime.mjs'

test('quotes Windows archive paths directly in the PowerShell command', () => {
  assert.equal(
    windowsCompressArchiveCommand("C:\\build's\\bundle", "C:\\out's\\bundle.zip"),
    "Compress-Archive -LiteralPath 'C:\\build''s\\bundle' -DestinationPath 'C:\\out''s\\bundle.zip' -Force",
  )
})

test('assembles, archives, and writes a checksum for one declared target', () => {
  const root = mkdtempSync(join(tmpdir(), 'openbkn-runtime-package-'))
  const runtime = join(root, 'runtime')
  const plugin = join(root, 'plugin.tgz')
  const profile = join(root, 'profile', 'web')
  const output = join(root, 'release')
  mkdirSync(runtime)
  mkdirSync(profile, { recursive: true })
  writeFileSync(plugin, 'plugin\n')
  const calls = []

  const result = packageCompatibleRuntime({
    runtimeDirectory: runtime,
    profileDirectory: profile,
    pluginTarball: plugin,
    outputDirectory: output,
    platform: 'darwin-arm64',
    manifest: manifest(),
    assemble: input => {
      calls.push(['assemble', input.platform])
      const directory = join(output, 'openbkn-dsh-runtime')
      mkdirSync(directory, { recursive: true })
      writeFileSync(join(directory, 'runtime.txt'), 'runtime\n')
      return { directory, archive: { file: 'openbkn-dsh-runtime.tar.gz' } }
    },
    archive: input => {
      calls.push(['archive', input.format, input.destination])
      writeFileSync(input.destination, 'archive\n')
    },
  })

  assert.deepEqual(calls.map(call => call.slice(0, 2)), [['assemble', 'darwin-arm64'], ['archive', 'tar.gz']])
  assert.equal(result.archive.endsWith('openbkn-dsh-runtime.tar.gz'), true)
  assert.equal(result.checksum.endsWith('.sha256'), true)
})

test('rejects archive work for an undeclared platform', () => {
  assert.throws(() => packageCompatibleRuntime({
    runtimeDirectory: '/tmp/runtime',
    pluginTarball: '/tmp/plugin.tgz',
    outputDirectory: '/tmp/out',
    platform: 'linux-x64',
    manifest: manifest(),
  }), /does not support linux-x64/)
})

function manifest() {
  return {
    bundle: {
      archives: [{ platform: 'darwin-arm64', file: 'openbkn-dsh-runtime.tar.gz' }],
    },
  }
}
