import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { createServer } from 'node:https'
import { once } from 'node:events'
import { OpenBknPlatformTrust, inspectPlatformCertificate, validatePlatformTrust, connectionFailure } from '../src/platform-trust.ts'
import { OpenBknPlatformReader } from '../src/platform-reader.ts'
import { OpenBknConfigurationService } from '../src/configuration-service.ts'
import { AuthCoordinator } from '../src/auth.ts'
import { OpenBknBusinessContextService } from '../src/business-context-service.ts'
import { OpenBknMcpManager } from '../src/openbkn-mcp-manager.ts'

const opensslAvailable = spawnSync('openssl', ['version'], { stdio: 'ignore' }).status === 0
let directory: string
let pem: string
let key: string
let wrongPem: string
let wrongHostPem: string
let issuerPem: string
let expiredPem: string
let issuedWrongHostPem: string
let issuedKey: string
before(async () => {
  if (!opensslAvailable) return
  directory = await mkdtemp(join(tmpdir(), 'openbkn-cert-regression-'))
  for (const [name, host] of [['platform', '127.0.0.1'], ['other', '127.0.0.1'], ['wrong-host', '127.0.0.2']]) {
    execFileSync('openssl', ['req', '-x509', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:P-256', '-nodes',
      '-keyout', join(directory, name + '.key'), '-out', join(directory, name + '.pem'), '-days', '2',
      '-subj', '/CN=' + host, '-addext', 'subjectAltName=IP:' + host, '-addext', 'basicConstraints=critical,CA:FALSE'], { stdio: 'ignore' })
  }
  pem = await readFile(join(directory, 'platform.pem'), 'utf8')
  key = await readFile(join(directory, 'platform.key'), 'utf8')
  wrongPem = await readFile(join(directory, 'other.pem'), 'utf8')
  wrongHostPem = await readFile(join(directory, 'wrong-host.pem'), 'utf8')
  const run = (args: string[]) => execFileSync('openssl', args, { stdio: 'ignore' })
  run(['req', '-x509', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:P-256', '-nodes', '-keyout', join(directory, 'issuer.key'), '-out', join(directory, 'issuer.pem'), '-days', '2', '-subj', '/CN=Synthetic root', '-addext', 'basicConstraints=critical,CA:TRUE'])
  run(['req', '-new', '-newkey', 'ec', '-pkeyopt', 'ec_paramgen_curve:P-256', '-nodes', '-keyout', join(directory, 'issued.key'), '-out', join(directory, 'issued.csr'), '-subj', '/CN=Synthetic server'])
  const { writeFile } = await import('node:fs/promises')
  await writeFile(join(directory, 'ca-index'), '')
  await writeFile(join(directory, 'ca-serial'), '1000\n')
  const quoted = (name: string) => JSON.stringify(join(directory, name).replace(/\\/g, '/'))
  await writeFile(join(directory, 'ca.conf'), `[ca]
default_ca=issuer
[issuer]
database=${quoted('ca-index')}
new_certs_dir=${JSON.stringify(directory.replace(/\\/g, '/'))}
certificate=${quoted('issuer.pem')}
private_key=${quoted('issuer.key')}
serial=${quoted('ca-serial')}
default_md=sha256
policy=subject_policy
[subject_policy]
commonName=supplied
[expired_server]
subjectAltName=IP:127.0.0.1
basicConstraints=critical,CA:FALSE
extendedKeyUsage=serverAuth
`)
  run(['ca', '-batch', '-config', join(directory, 'ca.conf'), '-in', join(directory, 'issued.csr'), '-out', join(directory, 'expired.pem'), '-notext', '-extensions', 'expired_server', '-startdate', '20000101000000Z', '-enddate', '20010101000000Z'])
  await writeFile(join(directory, 'wrong.ext'), 'subjectAltName=IP:127.0.0.2\nbasicConstraints=critical,CA:FALSE\nextendedKeyUsage=serverAuth\n')
  run(['x509', '-req', '-in', join(directory, 'issued.csr'), '-CA', join(directory, 'issuer.pem'), '-CAkey', join(directory, 'issuer.key'), '-CAcreateserial', '-out', join(directory, 'issued-wrong-host.pem'), '-days', '1', '-extfile', join(directory, 'wrong.ext')])
  issuerPem = await readFile(join(directory, 'issuer.pem'), 'utf8')
  expiredPem = await readFile(join(directory, 'expired.pem'), 'utf8')
  issuedWrongHostPem = await readFile(join(directory, 'issued-wrong-host.pem'), 'utf8')
  issuedKey = await readFile(join(directory, 'issued.key'), 'utf8')
})
after(async () => { if (directory !== undefined) await rm(directory, { recursive: true, force: true }) })

async function fixture(tls = { cert: pem, key }) {
  const requests: { path: string; authorization?: string }[] = []
  let redirect: string | undefined
  const server = createServer(tls, (request, response) => {
    requests.push({ path: request.url!, authorization: request.headers.authorization })
    if (redirect !== undefined) { response.writeHead(307, { location: redirect }); response.end(); return }
    response.writeHead(200, { 'content-type': 'application/json' }); response.end('{"entries":[]}')
  })
  server.listen(0, '127.0.0.1'); await once(server, 'listening')
  const origin = 'https://127.0.0.1:' + (server.address() as { port: number }).port
  const identity = inspectPlatformCertificate(origin, pem)
  return { origin, requests, trust: { origin, pem, fingerprint256: identity.fingerprint256 },
    redirect: (target: string) => { redirect = target },
    close: async () => { server.closeAllConnections(); server.close(); await once(server, 'close') } }
}

test('real self-signed HTTPS fails without extra CA, succeeds only with the confirmed certificate', { skip: !opensslAvailable && 'OpenSSL fixture prerequisite unavailable' }, async () => {
  const f = await fixture()
  const plain = new OpenBknPlatformTrust(f.origin)
  const trust = new OpenBknPlatformTrust(f.origin, f.trust)
  const wrong = new OpenBknPlatformTrust(f.origin, { ...f.trust, pem: wrongPem, fingerprint256: inspectPlatformCertificate(f.origin, wrongPem).fingerprint256 })
  try {
    await assert.rejects(plain.fetch(f.origin), error => connectionFailure(error) === 'CERTIFICATE_UNTRUSTED')
    assert.equal(f.requests.length, 0)
    await assert.rejects(wrong.fetch(f.origin))
    assert.equal(f.requests.length, 0)
    const response = await trust.fetch(f.origin)
    assert.equal(response.status, 200); await response.text()
    assert.equal(f.requests.length, 1)
    await assert.rejects(fetch(f.origin), error => connectionFailure(error) === 'CERTIFICATE_UNTRUSTED')
    assert.equal(f.requests.length, 1, 'the Host/global fetch trust was not changed')
  } finally { await plain.dispose(); await trust.dispose(); await wrong.dispose(); await f.close() }
})

test('a confirmed valid issuer still rejects expired and wrong-host actual server certificates', { skip: !opensslAvailable && 'OpenSSL fixture prerequisite unavailable' }, async () => {
  for (const [cert, expected] of [[expiredPem, 'CERTIFICATE_EXPIRED'], [issuedWrongHostPem, 'CERTIFICATE_HOSTNAME_MISMATCH']]) {
    const f = await fixture({ cert: cert!, key: issuedKey })
    const issuer = inspectPlatformCertificate(f.origin, issuerPem)
    const trust = new OpenBknPlatformTrust(f.origin, { origin: issuer.origin, pem: issuerPem, fingerprint256: issuer.fingerprint256 })
    try {
      await assert.rejects(trust.fetch(f.origin), error => connectionFailure(error) === expected)
      assert.equal(f.requests.length, 0, 'certificate rejection precedes HTTP')
    } finally { await trust.dispose(); await f.close() }
  }
})

test('stock or deployment-owned MCP cannot silently borrow the selected certificate trust', { skip: !opensslAvailable && 'OpenSSL fixture prerequisite unavailable' }, async () => {
  const origin = 'https://127.0.0.1', identity = inspectPlatformCertificate(origin, pem)
  const trust = new OpenBknPlatformTrust(origin, { origin: identity.origin, pem, fingerprint256: identity.fingerprint256 })
  let mounts = 0
  const config = { baseUrl: origin, toolCallTimeoutMs: 1000 } as never
  try {
    const ctx = { tools: { get: () => undefined }, plugin: () => { mounts++; throw Error('must not mount') } }
    await assert.rejects(new OpenBknMcpManager(ctx as never, config, async () => 'synthetic-only', trust).ensure(), { code: 'TRUST_TRANSPORT_UNAVAILABLE' })
    const owned = { ...ctx, tools: { get: () => ({}) } }
    await assert.rejects(new OpenBknMcpManager(owned as never, config, async () => 'synthetic-only', trust).ensure(), { code: 'TRUST_TRANSPORT_UNAVAILABLE' })
    assert.equal(mounts, 0)
  } finally { await trust.dispose() }
})

test('PEM, date, hostname, fingerprint and normalized origin admission stay strict', { skip: !opensslAvailable && 'OpenSSL fixture prerequisite unavailable' }, async () => {
  const origin = 'https://127.0.0.1:443'
  const identity = inspectPlatformCertificate(origin, pem)
  assert.equal(identity.origin, 'https://127.0.0.1')
  for (const body of ['', '../cert.pem', pem + key, pem + pem, 'x'.repeat(65537), pem.replace('CERTIFICATE', 'PRIVATE KEY')]) {
    assert.throws(() => inspectPlatformCertificate(origin, body), { code: 'CERTIFICATE_INVALID' })
  }
  assert.throws(() => inspectPlatformCertificate(origin, pem, Date.now() + 4 * 86400_000), { code: 'CERTIFICATE_EXPIRED' })
  assert.throws(() => inspectPlatformCertificate(origin, wrongHostPem), { code: 'CERTIFICATE_HOSTNAME_MISMATCH' })
  assert.throws(() => validatePlatformTrust(origin, { origin: 'https://other.example', pem, fingerprint256: identity.fingerprint256 }), { code: 'TRUST_SCOPE_MISMATCH' })
  assert.throws(() => validatePlatformTrust(origin, { origin: identity.origin, pem: wrongPem, fingerprint256: identity.fingerprint256 }), { code: 'TRUST_SCOPE_MISMATCH' })
  assert.throws(() => inspectPlatformCertificate('https://account:secret@127.0.0.1', pem), { code: 'TRUST_SCOPE_MISMATCH' })
})

test('directory/Trace HTTP reads share trust, refuse redirects, and never send credentials to another origin', { skip: !opensslAvailable && 'OpenSSL fixture prerequisite unavailable' }, async () => {
  const a = await fixture(), b = await fixture()
  const trust = new OpenBknPlatformTrust(a.origin, a.trust)
  try {
    const reader = new OpenBknPlatformReader({ baseUrl: a.origin, requestTimeoutMs: 3000, allowInsecureTls: false,
      maxResultBytes: 100000, resolveToken: async () => 'synthetic-only' }, (url, init) => trust.fetch(url, init))
    await reader.listKnowledgeNetworks(new AbortController().signal)
    assert.equal(a.requests[0]?.authorization, 'Bearer synthetic-only')
    a.redirect(b.origin)
    await assert.rejects(reader.listKnowledgeNetworks(new AbortController().signal), { code: 'PLATFORM_UNAVAILABLE' })
    assert.equal(b.requests.length, 0)
    await assert.rejects(trust.fetch(b.origin, { headers: { authorization: 'Bearer synthetic-only' } }), { code: 'TRUST_SCOPE_MISMATCH' })
    assert.equal(b.requests.length, 0)
    await trust.dispose()
    await assert.rejects(trust.fetch(a.origin), { code: 'TRUST_SCOPE_MISMATCH' })
  } finally { await trust.dispose(); await a.close(); await b.close() }
})

test('production service blocks imported-CA login before spawn and never lends that CA to local status/token commands', { skip: !opensslAvailable && 'OpenSSL fixture prerequisite unavailable' }, async () => {
  const baseUrl = 'https://127.0.0.1', identity = inspectPlatformCertificate(baseUrl, pem)
  const invocations: { argv: readonly string[]; env?: Readonly<Record<string, string>> }[] = []
  const service = Object.create(OpenBknBusinessContextService.prototype) as OpenBknBusinessContextService
  Object.assign(service, { config: { baseUrl, cliPath: 'synthetic-cli', platformTrust: { origin: identity.origin, pem, fingerprint256: identity.fingerprint256 } },
    ctx: { subprocess: { resolveExecutable: async () => 'synthetic-cli', spawn: (spec: typeof invocations[number]) => {
      invocations.push(spec)
      return { done: Promise.resolve({ exitCode: 0 }), collected: { stdout: { readFrom: () => ({ text: '{"hasToken":false}', lossy: false }) } } }
    } } } })
  const auth = (service as unknown as { authCoordinator(): AuthCoordinator }).authCoordinator()
  await assert.rejects(service.remoteBeginLogin(new AbortController().signal), error => (error as { details?: { reason?: string } }).details?.reason === 'TRUST_CLI_UNAVAILABLE')
  assert.equal(invocations.length, 0)
  assert.equal((await auth.status()).kind, 'authentication-required')
  assert.equal(invocations.length, 1)
  assert.equal(invocations[0]?.env, undefined)
})

test('CLI certificate errors are classified without leaking stderr or device/token values', { skip: !opensslAvailable && 'OpenSSL fixture prerequisite unavailable' }, async () => {
  const auth = new AuthCoordinator({ run: async () => ({ code: 1, stdout: '', stderr: 'DEPTH_ZERO_SELF_SIGNED_CERT secret-token synthetic-device-code' }) }, 'https://127.0.0.1')
  await assert.rejects(auth.beginLogin(), error => {
    assert.equal((error as { code: string }).code, 'CERTIFICATE_UNTRUSTED')
    assert.doesNotMatch(String(error), /secret-token|device-code/)
    return true
  })
})

function configuration() {
  const entry = { options: { id: 'openbkn-business-context', name: '@openbkn/dsh-business-context/business', config: {} as Record<string, unknown> }, fiber: { state: 2 } }
  const service = Object.create(OpenBknConfigurationService.prototype) as OpenBknConfigurationService
  const editor = { entries: () => [entry], edit: async (_entry: unknown, change: (value: Record<string, unknown>) => Record<string, unknown>) => { entry.options.config = change(entry.options.config) } }
  Object.defineProperty(service, 'ctx', { value: { get: (name: string) => name === 'configEditor' ? editor : undefined } })
  return { service, entry }
}

test('preview alone never enables trust; explicit confirmation, change and removal use native configuration persistence', { skip: !opensslAvailable && 'OpenSSL fixture prerequisite unavailable' }, async () => {
  const f = configuration(), baseUrl = 'https://127.0.0.1', cliPath = 'openbkn'
  const preview = await f.service.previewCertificate(baseUrl, pem)
  assert.equal(f.entry.options.config.platformTrust, undefined)
  assert.equal('pem' in preview, false)
  await f.service.saveConfiguration({ baseUrl, cliPath })
  assert.equal(f.entry.options.config.platformTrust, null, 'unconfirmed preview is not activated')
  const second = await f.service.previewCertificate(baseUrl, pem)
  await assert.rejects(f.service.saveConfiguration({ baseUrl, cliPath, trustConfirmationId: preview.confirmationId }), { code: 'openbkn/certificate-invalid' })
  const saved = await f.service.saveConfiguration({ baseUrl, cliPath, trustConfirmationId: second.confirmationId })
  assert.equal(saved.certificate?.fingerprint256, second.fingerprint256)
  assert.equal('pem' in saved.certificate!, false)
  await f.service.saveConfiguration({ baseUrl: 'https://127.0.0.1:444', cliPath })
  assert.equal(f.entry.options.config.platformTrust, null, 'a new port is a new platform origin')
  const third = await f.service.previewCertificate(baseUrl, pem)
  await f.service.saveConfiguration({ baseUrl, cliPath, trustConfirmationId: third.confirmationId })
  await f.service.saveConfiguration({ baseUrl, cliPath, removeCertificate: true })
  assert.equal(f.entry.options.config.platformTrust, null)
})

test('revocation writes an explicit deny value so inherited trust cannot reappear', { skip: !opensslAvailable && 'OpenSSL fixture prerequisite unavailable' }, async () => {
  const f = configuration(), baseUrl = 'https://127.0.0.1', cliPath = 'openbkn'
  const preview = await f.service.previewCertificate(baseUrl, pem)
  await f.service.saveConfiguration({ baseUrl, cliPath, trustConfirmationId: preview.confirmationId })
  const inheritedTrust = f.entry.options.config.platformTrust
  await f.service.saveConfiguration({ baseUrl, cliPath, removeCertificate: true })
  const resolved = { platformTrust: inheritedTrust, ...f.entry.options.config }
  assert.equal(resolved.platformTrust, null)
})

test('revoking an owner aborts a real in-flight HTTPS read and refuses later reads', { skip: !opensslAvailable && 'OpenSSL fixture prerequisite unavailable' }, async () => {
  let requests = 0
  let arrived!: () => void
  let deadline: ReturnType<typeof setTimeout> | undefined
  const reached = new Promise<void>((resolve, reject) => { arrived = resolve; deadline = setTimeout(() => reject(Error('HTTPS fixture was not reached')), 2000) })
  const server = createServer({ cert: pem, key }, () => { requests++; arrived() })
  server.listen(0, '127.0.0.1'); await once(server, 'listening')
  const origin = 'https://127.0.0.1:' + (server.address() as { port: number }).port
  const identity = inspectPlatformCertificate(origin, pem)
  const trust = new OpenBknPlatformTrust(origin, { origin, pem, fingerprint256: identity.fingerprint256 })
  try {
    const outcome = trust.fetch(origin).then(() => undefined, error => error)
    await reached; clearTimeout(deadline)
    await trust.dispose()
    assert.equal(connectionFailure(await outcome), 'TRUST_SCOPE_MISMATCH')
    await assert.rejects(trust.fetch(origin), { code: 'TRUST_SCOPE_MISMATCH' })
    assert.equal(requests, 1)
  } finally { clearTimeout(deadline); await trust.dispose(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())) }
})
