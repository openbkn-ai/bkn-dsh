import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { once } from 'node:events'
import { resolve, join } from 'node:path'
import { randomUUID } from 'node:crypto'
const root = process.argv[2]
assert.ok(root, 'Pass the isolated profile directory prepared with the local -7 pack')
const repo = process.cwd()
const output = resolve(repo, 'docs/evidence/release-7-review-20261006')
const host = spawn(process.execPath, [resolve(repo, '../dsh-npm-020/node_modules/@deepseek-ai/dsh/lib/bin.js'), 'web', '--port', '18797', '--no-open'], {
  cwd: repo, env: { ...process.env, DSH_HOME: join(root, 'dsh-home'), BKN_CONFIG_DIR: join(root, 'cli-home') }, stdio: ['ignore', 'pipe', 'pipe'],
})
let log = ''
let launchResolve
const launched = new Promise(resolve => { launchResolve = resolve })
const capture = chunk => {
  log += chunk.toString()
  const match = log.match(/dsh web: (http:\/\/127\.0\.0\.1:18797\/\?token=[^\s]+)/)
  if (match) launchResolve(match[1])
}
host.stdout.on('data', capture)
host.stderr.on('data', capture)
try {
  const url = await Promise.race([launched, once(host, 'exit').then(() => { throw new Error('Host exited before readiness') }), new Promise((_, reject) => { const t = setTimeout(() => reject(new Error('Host readiness timeout')), 15_000); t.unref() })])
  const login = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(5_000) })
  assert.equal(login.status, 303)
  const cookie = login.headers.get('set-cookie')?.split(';', 1)[0]
  assert.ok(cookie)
  const endpoint = 'openbknDiagnostics/getReport'
  const response = await fetch('http://127.0.0.1:18797/api/' + endpoint, {
    method: 'POST', headers: { 'content-type': 'application/json', cookie, origin: 'http://127.0.0.1:18797' },
    body: JSON.stringify({ type: 'client-request', rpcId: randomUUID(), method: endpoint, payload: { args: {} } }), signal: AbortSignal.timeout(10_000),
  })
  assert.equal(response.status, 200)
  const envelope = await response.json()
  if (!envelope.result.ok) throw new Error(JSON.stringify(envelope.result.error))
  const report = envelope.result.value
  assert.equal(report.target.hostForm, 'unknown')
  const business = report.checks.find(check => check.id === 'business-entry')
  assert.equal(business.status, 'fail')
  assert.equal(business.stage, 'configuration')
  assert.equal(business.code, 'configuration-invalid')
  assert.equal(business.evidence.configField, 'baseUrl')
  assert.equal(report.checks.find(check => check.id === 'diagnostics-entry').status, 'pass')
  assert.equal(report.checks.find(check => check.id === 'bootstrap-entry').status, 'pass')
  assert.ok(!JSON.stringify(report).includes('ht!tp://not a valid url with spaces'))
  writeFileSync(join(output, 'npm-host-report.json'), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify({ business, diagnostics: report.checks.find(check => check.id === 'diagnostics-entry'), bootstrap: report.checks.find(check => check.id === 'bootstrap-entry') }, null, 2))
} finally {
  host.kill('SIGTERM')
  await once(host, 'exit')
  writeFileSync(join(output, 'npm-host.redacted.log'), log.replace(/token=[^\s]+/g, 'token=[REDACTED]'))
}
