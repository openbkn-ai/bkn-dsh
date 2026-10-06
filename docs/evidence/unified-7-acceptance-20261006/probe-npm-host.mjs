// Real official npm Host RPC check. Separate from Desktop product UI evidence.
// Local launch authentication stays in memory; raw logs are never exported.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

const [root, label, expectedCode] = process.argv.slice(2)
assert.ok(root && label && expectedCode, 'Pass an isolated installed root, label and expected business code')
const output = resolve('docs/evidence/unified-7-acceptance-20261006')
const cli = resolve('../dsh-npm-020/node_modules/@deepseek-ai/dsh/lib/bin.js')
assert.match(process.version, /^v24\./, 'Use the explicitly pinned Node 24 runtime')
const host = spawn(process.execPath, [cli, 'web', '--port', '18797', '--no-open'], {
  env: { ...process.env, PATH: dirname(process.execPath) + ':' + process.env.PATH, DSH_HOME: join(root, 'dsh-home'), BKN_CONFIG_DIR: join(root, 'cli-home') },
  stdio: ['ignore', 'pipe', 'pipe'],
})
let log = ''
let resolveReady
const ready = new Promise(resolve => { resolveReady = resolve })
const capture = chunk => {
  log += chunk.toString()
  const match = log.match(/dsh web: (http:\/\/127\.0\.0\.1:18797\/\?token=[^\s]+)/)
  if (match) resolveReady(match[1])
}
host.stdout.on('data', capture)
host.stderr.on('data', capture)
try {
  const url = await Promise.race([
    ready,
    once(host, 'exit').then(() => { throw new Error('Host exited before readiness; no raw log exported') }),
    new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error('Host readiness timeout')), 30_000); timer.unref() }),
  ])
  const login = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(5_000) })
  assert.equal(login.status, 303)
  const cookie = login.headers.get('set-cookie')?.split(';', 1)[0]
  assert.ok(cookie)
  const endpoint = 'openbknDiagnostics/getReport'
  const response = await fetch('http://127.0.0.1:18797/api/' + endpoint, {
    method: 'POST', headers: { 'content-type': 'application/json', cookie, origin: 'http://127.0.0.1:18797' },
    body: JSON.stringify({ type: 'client-request', rpcId: randomUUID(), method: endpoint, payload: { args: {} } }),
    signal: AbortSignal.timeout(10_000),
  })
  assert.equal(response.status, 200)
  const envelope = await response.json()
  assert.equal(envelope.result.ok, true, 'Diagnostic RPC must settle successfully')
  const report = envelope.result.value
  assert.equal(report.target.hostForm, 'unknown')
  const business = report.checks.find(check => check.id === 'business-entry')
  assert.equal(business.code, expectedCode)
  if (expectedCode === 'configuration-invalid') {
    assert.equal(business.status, 'fail')
    assert.equal(business.stage, 'configuration')
    assert.equal(business.evidence.configField, 'baseUrl')
    assert.ok(!JSON.stringify(report).includes('ht!tp://not a valid url with spaces'))
  } else if (expectedCode === 'module-resolution-failed') assert.equal(business.status, 'fail')
  else assert.equal(business.status, 'pass')
  assert.equal(report.checks.find(check => check.id === 'bootstrap-entry').status, 'pass')
  assert.equal(report.checks.find(check => check.id === 'diagnostics-entry').status, 'pass')
  writeFileSync(join(output, `${label}-npm-report.json`), JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify({ label, reportId: report.reportId, business, evidenceLevel: 'real npm Host production RPC; no browser UI assertion' }))
} finally {
  if (host.exitCode === null) { host.kill('SIGTERM'); await once(host, 'exit') }
  // Never save log, login URL, cookie or raw RPC errors. State only what was verified.
  writeFileSync(join(output, `${label}-npm-host.json`), JSON.stringify({
    label, officialNpmDshVersion: JSON.parse(readFileSync(resolve('../dsh-npm-020/node_modules/@deepseek-ai/dsh/package.json'))).version,
    ownedPid: host.pid, exited: host.exitCode !== null || host.signalCode !== null, signalCode: host.signalCode,
    inspectorUsed: false, launchCredentialExported: false,
  }, null, 2) + '\n')
}
