import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { applyCompatibility } from '../apply.mjs'
import { verifyCompatibility } from '../verify.mjs'

test('reports the compatibility version only when the full patch series is present', () => {
  const fixture = createFixture()

  assert.throws(() => verifyCompatibility(fixture), /not applied/)
  applyCompatibility(fixture)
  assert.equal(verifyCompatibility(fixture), fixture.manifest.compatibilityVersion)
})

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), 'openbkn-dsh-verify-'))
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
  const patch = 'diff --git a/feature.txt b/feature.txt\nindex df967b9..86981e6 100644\n--- a/feature.txt\n+++ b/feature.txt\n@@ -1 +1 @@\n-base\n+enabled\n'
  writeFileSync(join(packageDirectory, 'patches', 'feature.patch'), patch)
  return {
    target,
    packageDirectory,
    manifest: {
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

function exec(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
}
