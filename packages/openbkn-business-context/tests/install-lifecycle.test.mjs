import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import test from 'node:test'

const repository = resolve(import.meta.dirname, '../../..')

test('release package audit accepts only the install-time bundle assets', () => {
  const script = resolve(repository, 'scripts/package-bundle.mjs')
  assert.equal(existsSync(script), true)
  const output = execFileSync(process.execPath, [script, '--check'], { cwd: repository, encoding: 'utf8' })
  assert.match(output, /package audit passed/i)
  assert.match(output, /runner\/openbkn_dsh_runner\/operations\.py/)
})
