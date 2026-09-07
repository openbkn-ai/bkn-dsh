import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { applyCompatibility, inspectTarget } from '../apply.mjs'

test('rejects a non-matching DSH revision before running a patch command', () => {
  assert.throws(
    () => inspectTarget('/not/a/dsh-worktree', { expectedBaseCommit: 'a66e4702047846cdaa10c66c9d3df3951f5ea70d' }),
    /Git worktree/,
  )
})

test('applies an exact manifest once and reverts it without touching unrelated state', () => {
  const fixture = createFixture()

  assert.equal(applyCompatibility(fixture), 'applied')
  assert.equal(readFileSync(join(fixture.target, 'feature.txt'), 'utf8'), 'enabled\n')
  assert.equal(applyCompatibility(fixture), 'already-applied')
  assert.equal(applyCompatibility({ ...fixture, revert: true }), 'reverted')
  assert.equal(exec(fixture.target, ['status', '--porcelain']), '')
})

test('rejects a dirty target before a compatibility patch can be applied', () => {
  const fixture = createFixture()
  writeFileSync(join(fixture.target, 'feature.txt'), 'local change\n')

  assert.throws(() => applyCompatibility(fixture), /target is dirty/)
  assert.equal(readFileSync(join(fixture.target, 'feature.txt'), 'utf8'), 'local change\n')
})

test('rejects a patch whose recorded digest was tampered with', () => {
  const fixture = createFixture()
  fixture.manifest.patches[0].sha256 = '0'.repeat(64)

  assert.throws(() => applyCompatibility(fixture), /digest does not match/)
  assert.equal(exec(fixture.target, ['status', '--porcelain']), '')
})

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), 'openbkn-dsh-compat-'))
  const target = join(root, 'target')
  const packageDirectory = join(root, 'package')
  mkdirSync(target)
  exec(target, ['init'])
  exec(target, ['config', 'user.email', 'test@example.com'])
  exec(target, ['config', 'user.name', 'Test User'])
  writeFileSync(join(target, 'feature.txt'), 'base\n')
  exec(target, ['add', 'feature.txt'])
  exec(target, ['commit', '-m', 'base'])
  const baseCommit = exec(target, ['rev-parse', 'HEAD'])

  mkdirSync(join(packageDirectory, 'patches'), { recursive: true })
  const patchPath = join(packageDirectory, 'patches', 'feature.patch')
  const patch = [
    'diff --git a/feature.txt b/feature.txt',
    'index df967b9..28d2700 100644',
    '--- a/feature.txt',
    '+++ b/feature.txt',
    '@@ -1 +1 @@',
    '-base',
    '+enabled',
    '',
  ].join('\n')
  writeFileSync(patchPath, patch)
  const manifest = {
    dsh: { baseCommit },
    patches: [{
      file: 'patches/feature.patch',
      sha256: createHash('sha256').update(patch).digest('hex'),
      files: ['feature.txt'],
    }],
  }
  return { target, packageDirectory, manifest }
}

function exec(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
}
