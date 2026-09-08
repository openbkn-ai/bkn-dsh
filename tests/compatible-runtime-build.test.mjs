import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { buildCompatibleRuntime, prepareCompatibleRuntimeSource } from '../runtime/prepare-compatible-runtime.mjs'

test('refuses a dirty runtime source before applying compatibility patches', () => {
  const fixture = createFixture()
  writeFileSync(join(fixture.target, 'feature.txt'), 'local change\n')

  assert.throws(() => prepareCompatibleRuntimeSource(fixture), /dirty/)
  assert.equal(readFileSync(join(fixture.target, 'feature.txt'), 'utf8'), 'local change\n')
})

test('applies and verifies one release-matched compatibility series', () => {
  const fixture = createFixture()

  const result = prepareCompatibleRuntimeSource(fixture)

  assert.equal(result.compatibilityVersion, 'fixture.1')
  assert.equal(readFileSync(join(fixture.target, 'feature.txt'), 'utf8'), 'enabled\n')
})

test('builds an explicit patched source into a separate deployed runtime directory', () => {
  const fixture = createFixture()
  const outputDirectory = join(fixture.root, 'deployed-runtime')
  const commands = []

  buildCompatibleRuntime({
    ...fixture,
    outputDirectory,
    run: (command, args, options) => {
      commands.push({ command, args, cwd: options.cwd })
      if (args.includes('deploy')) mkdirSync(join(outputDirectory, 'node_modules', '@deepseek-ai', 'dsh-mcp-client'), { recursive: true })
    },
  })

  assert.equal(existsSync(join(outputDirectory, 'node_modules', '@deepseek-ai', 'dsh-mcp-client')), true)
  assert.deepEqual(commands.map(({ args }) => args.at(-1)), ['--frozen-lockfile', 'build', '--legacy'])
  assert.ok(commands.every(({ cwd }) => cwd === fixture.target))
})

test('refuses to deploy a runtime into its DSH source checkout', () => {
  const fixture = createFixture()

  assert.throws(
    () => buildCompatibleRuntime({ ...fixture, outputDirectory: join(fixture.target, 'runtime') }),
    /outside the DSH source checkout/,
  )
})

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), 'openbkn-compatible-runtime-'))
  const target = join(root, 'dsh')
  const packageDirectory = join(root, 'compat')
  mkdirSync(target)
  git(target, ['init'])
  git(target, ['config', 'user.email', 'test@example.com'])
  git(target, ['config', 'user.name', 'Test User'])
  writeFileSync(join(target, 'feature.txt'), 'base\n')
  git(target, ['add', 'feature.txt'])
  git(target, ['commit', '-m', 'base'])
  const baseCommit = git(target, ['rev-parse', 'HEAD'])

  mkdirSync(join(packageDirectory, 'patches'), { recursive: true })
  const patch = 'diff --git a/feature.txt b/feature.txt\nindex df967b9..28d2700 100644\n--- a/feature.txt\n+++ b/feature.txt\n@@ -1 +1 @@\n-base\n+enabled\n'
  writeFileSync(join(packageDirectory, 'patches', 'feature.patch'), patch)
  return {
    root,
    target,
    packageDirectory,
    releaseManifest: {
      dsh: { baseCommit },
      compatibility: { directory: 'compat/fixture' },
    },
    compatibilityManifest: {
      compatibilityVersion: 'fixture.1',
      dsh: { baseCommit },
      patches: [{
        file: 'patches/feature.patch',
        sha256: createHash('sha256').update(patch).digest('hex'),
        files: ['feature.txt'],
      }],
    },
  }
}

function git(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
}
