import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { parseProbeOptions, runProbeCli } from './probes/guard-probe-cli.mjs'

test('malformed live invocation exits before importing the plugin or taking credentials', () => {
  const probe = fileURLToPath(new URL('./probes/guard-runtime.probe.mjs', import.meta.url))
  for (const args of [
    ['--live'],
    ['--live', '--kn', 'bound', '--other-kn', 'other'],
    ['--live', 'https://probe.invalid', '--kn', 'bound'],
    ['--live', 'https://probe.invalid', '--kn', 'bound', '--other-kn', 'bound'],
    ['--kn', 'bound', '--other-kn', 'other'],
    ['--plugin'],
  ]) {
    assert.throws(() => execFileSync(process.execPath, [probe, '--plugin', '/nonexistent-probe-package', ...args], { encoding: 'utf8', stdio: 'pipe' }), error => {
      assert.equal(error.status, 2)
      assert.equal(error.stdout, '')
      assert.match(error.stderr, /Invalid guard probe arguments/)
      assert.doesNotMatch(error.stderr, /ERR_MODULE_NOT_FOUND|checks passed|stand-in/)
      return true
    })
  }
})

test('valid live options retain explicit mode, networks and paths with spaces', () => {
  assert.deepEqual(parseProbeOptions(['--live', 'https://probe.invalid', '--kn', 'bound', '--other-kn', 'other', '--plugin', '/a candidate/package', '--cli', '/a cli/openbkn']), {
    live: 'https://probe.invalid', boundKn: 'bound', otherKn: 'other', plugin: '/a candidate/package', cli: '/a cli/openbkn',
  })
  assert.equal(parseProbeOptions([]).live, undefined)
})

test('CLI failures never expose captured credential-like stdout or stderr', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'guard-probe-errors-'))
  try {
    const script = join(directory, 'failure.cjs')
    await writeFile(script, 'process.stdout.write("synthetic-secret"); process.stderr.write("synthetic-secret"); process.exit(1)')
    await assert.rejects(runProbeCli(process.execPath, [script]), error => {
      assert.doesNotMatch(String(error), /synthetic-secret/)
      assert.equal(error.cause, undefined)
      assert.equal(error.stdout, undefined)
      assert.equal(error.stderr, undefined)
      return true
    })
  } finally { await rm(directory, { recursive: true, force: true }) }
})

test('Windows CLI lookup runs a PATH .cmd and a shim in a path containing spaces and &', { skip: process.platform !== 'win32' }, async () => {
  const directory = await mkdtemp(join(tmpdir(), 'guard probe & cli-'))
  try {
    const script = join(directory, 'arguments.cjs')
    const shim = join(directory, 'openbkn.cmd')
    await writeFile(script, 'process.stdout.write(JSON.stringify(process.argv.slice(2)))')
    await writeFile(shim, `@echo off\r\n"${process.execPath}" "${script}" %*\r\n`)
    const args = ['--json', 'trace', 'interactions', 'operations', 'int-test']
    for (const cli of [shim, 'openbkn']) {
      const { stdout } = await runProbeCli(cli, args, { env: { ...process.env, PATH: `${directory};${process.env.PATH ?? ''}` } })
      assert.deepEqual(JSON.parse(stdout), args)
    }
  } finally { await rm(directory, { recursive: true, force: true }) }
})
