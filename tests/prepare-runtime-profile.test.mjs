import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { prepareRuntimeProfile } from '../runtime/prepare-runtime-profile.mjs'

test('delegates release profile creation to DSH native plugin management', () => {
  const root = mkdtempSync(join(tmpdir(), 'openbkn-runtime-profile-'))
  const runtime = join(root, 'runtime')
  const output = join(root, 'profile')
  const plugin = join(root, 'plugin.tgz')
  mkdirSync(join(runtime, 'node_modules', '@deepseek-ai', 'dsh', 'lib'), { recursive: true })
  writeFileSync(join(runtime, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js'), '')
  writeFileSync(plugin, '')
  const calls = []
  const result = prepareRuntimeProfile({ runtimeDirectory: runtime, pluginTarball: plugin, outputDirectory: output, run: (command, args, options) => {
    calls.push({ command, args, options })
    mkdirSync(join(options.env.DSH_HOME, 'profiles', 'web'), { recursive: true })
    writeFileSync(join(options.env.DSH_HOME, 'profiles', 'web', 'package.json'), '{}')
    return { status: 0 }
  } })
  assert.equal(result, output)
  assert.deepEqual(calls[0].args, [join(runtime, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js'), 'plugin', '--profile', 'web', 'add', `file:${plugin}`])
})
