import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { load } = require('js-yaml')
const runner = fileURLToPath(new URL('./run-eval.mjs', import.meta.url))
const cases = load(readFileSync(new URL('./supply-ontology.yaml', import.meta.url), 'utf8')).cases

function grade(values, verify) {
  const dir = mkdtempSync(join(tmpdir(), 'openbkn eval '))
  try {
    const answers = join(dir, 'answers.json')
    const report = join(dir, 'results.md')
    writeFileSync(answers, JSON.stringify(values))
    const result = spawnSync(process.execPath, [runner, '--answers', answers, '--out', report], { encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
    verify(result.stdout, readFileSync(report, 'utf8'))
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

test('unavailable permission account is excluded and reported separately', () => {
  const values = Object.fromEntries(cases.map(c => [c.id, 'pass']))
  values['unauthorized-network'] = 'not-run'
  grade(values, (stdout, report) => {
    assert.match(stdout, /positive: 7\/7\s+negative: 3\/3\s+total: 10\/10/)
    assert.match(stdout, /not-run: unauthorized-network/)
    assert.doesNotMatch(stdout, /failed:/)
    assert.match(report, /unauthorized-network — NOT-RUN/)
  })
})

test('not-run does not hide observed failures', () => {
  const values = Object.fromEntries(cases.map(c => [c.id, 'pass']))
  values['unauthorized-network'] = 'not-run'
  values['standard-lead-time'] = 'fail'
  grade(values, (stdout, report) => {
    assert.match(stdout, /positive: 6\/7\s+negative: 3\/3\s+total: 9\/10/)
    assert.match(stdout, /failed: standard-lead-time/)
    assert.match(report, /standard-lead-time — FAIL/)
  })
})

test('an entirely untested run cannot be reported as successes', () => {
  const values = Object.fromEntries(cases.map(c => [c.id, 'not-run']))
  grade(values, (stdout, report) => {
    assert.match(stdout, /positive: 0\/0\s+negative: 0\/0\s+total: 0\/0/)
    assert.doesNotMatch(report, /— PASS|— FAIL/)
    assert.equal((report.match(/— NOT-RUN/g) ?? []).length, cases.length)
  })
})
