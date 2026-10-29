import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { createServer } from 'node:https'
import { connect as tlsConnect } from 'node:tls'
import { fetch as undiciFetch } from 'undici'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { execFile, execFileSync, spawnSync } from 'node:child_process'
import { promisify } from 'node:util'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { observePlatform, platformPinFetch, platformPinDispatcher } from '../src/platform-pin.ts'
import { PrivatePlatformAccess } from '../src/private-platform-access.ts'
import { connectionFailure } from '../src/platform-trust.ts'
import type { PlatformAccessRecord } from '../src/platform-access-profile.ts'
import { AuthCoordinator } from '../src/auth.ts'
import { OpenBknBusinessContextService } from '../src/business-context-service.ts'

const openssl = spawnSync('openssl', ['version'], { stdio: 'ignore' }).status === 0
const options = { skip: !openssl && 'OpenSSL is required for real TLS fixtures' }
let directory: string, pem: string, key: string, nextPem: string, nextKey: string
before(async () => {
  if (!openssl) return
  directory = await mkdtemp(join(tmpdir(), 'openbkn-auto-private-'))
  for (const name of ['first', 'replacement']) execFileSync('openssl', ['req', '-x509', '-newkey', 'ec', '-pkeyopt',
    'ec_paramgen_curve:P-256', '-nodes', '-keyout', join(directory, name + '.key'), '-out', join(directory, name + '.pem'),
    '-days', '2', '-subj', '/CN=private-platform', '-addext', 'subjectAltName=IP:127.0.0.1'], { stdio: 'ignore' })
  ;[pem, key, nextPem, nextKey] = await Promise.all(['first.pem', 'first.key', 'replacement.pem', 'replacement.key'].map(n => readFile(join(directory, n), 'utf8')))
})
after(async () => { if (directory) await rm(directory, { recursive: true, force: true }) })

async function fixture() {
  let requests = 0, protectedRequests = 0, redirect: string | undefined
  const server = createServer({ cert: pem, key }, (req, res) => {
    requests++; if (req.headers.authorization) protectedRequests++
    res.writeHead(redirect ? 307 : 200, redirect ? { location: redirect } : {}).end('synthetic')
  })
  await new Promise<void>(r => server.listen(0, '127.0.0.1', r))
  const origin = 'https://127.0.0.1:' + (server.address() as { port: number }).port
  return { origin, get requests() { return requests }, get protectedRequests() { return protectedRequests },
    redirect: (url: string) => { redirect = url },
    rotate: () => { server.setSecureContext({ cert: nextPem, key: nextKey }); server.closeAllConnections() },
    close: async () => { server.closeAllConnections(); await new Promise<void>(r => server.close(() => r())) } }
}
function memoryStore() {
  let value: PlatformAccessRecord | undefined
  return { get: () => value, put: async (record: PlatformAccessRecord) => { value = structuredClone(record) } }
}

test('automatic observation sends no HTTP; authorization persists and ordinary use does not reauthorize', options, async () => {
  const f = await fixture(), store = memoryStore(), root = join(directory, 'persist')
  const access = new PrivatePlatformAccess(f.origin, store, root)
  let restarted: PrivatePlatformAccess | undefined
  try {
    const first = await access.inspect()
    assert.equal(first.authorized, false); assert.equal(f.requests, 0)
    await assert.rejects(access.fetch(f.origin), { code: 'PLATFORM_REAUTHORIZATION_REQUIRED' })
    assert.equal(f.protectedRequests, 0)
    await access.authorize(first.generation)
    const response = await access.fetch(f.origin, { headers: { authorization: 'Bearer synthetic-only' } })
    await response.text(); assert.equal(f.protectedRequests, 1)
    await access.dispose()
    restarted = new PrivatePlatformAccess(f.origin, store, root)
    const again = await restarted.requireAuthorization()
    assert.equal(again.generation, first.generation)
    assert.equal(again.authorized, true)
    await assert.rejects(fetch(f.origin), error => connectionFailure(error) === 'CERTIFICATE_UNTRUSTED')
  } finally { await access.dispose(); await restarted?.dispose(); await f.close() }
})

test('certificate rotation is automatically observed but old authorization and credentials cannot cross it', options, async () => {
  const f = await fixture(), store = memoryStore(), access = new PrivatePlatformAccess(f.origin, store, join(directory, 'rotate'))
  try {
    const old = await access.inspect(); await access.authorize(old.generation)
    const prior = await access.cliSettings(false)
    await writeFile(join(prior.directory, 'preserved-private-state'), 'not a credential')
    f.rotate()
    const next = await access.inspect()
    assert.notEqual(next.fingerprint256, old.fingerprint256)
    assert.notEqual(next.generation, old.generation); assert.equal(next.authorized, false)
    assert.equal(next.reauthorize, true)
    await assert.rejects(access.fetch(f.origin, { headers: { authorization: 'Bearer synthetic-old' } }), { code: 'PLATFORM_REAUTHORIZATION_REQUIRED' })
    await assert.rejects(access.authorize(old.generation), { code: 'PLATFORM_IDENTITY_CHANGED' })
    assert.equal(f.protectedRequests, 0)
    assert.equal(await readFile(join(prior.directory, 'preserved-private-state'), 'utf8'), 'not a credential')
    await access.authorize(next.generation)
    const response = await access.fetch(f.origin); await response.text()
    assert.equal(f.requests, 1)
  } finally { await access.dispose(); await f.close() }
})

test('changing the platform origin or observed server IP requires a new authorization generation', options, async () => {
  const a = await fixture(), b = await fixture(), store = memoryStore()
  const first = new PrivatePlatformAccess(a.origin, store, join(directory, 'address'))
  let second: PrivatePlatformAccess | undefined
  try {
    const old = await first.inspect(); await first.authorize(old.generation)
    second = new PrivatePlatformAccess(b.origin, store, join(directory, 'address'))
    const changed = await second.inspect()
    assert.equal(changed.origin, b.origin); assert.equal(changed.authorized, false)
    await second.authorize(changed.generation)
    const newIp = new PrivatePlatformAccess(b.origin, store, join(directory, 'address'), async () => ({ ...(await observePlatform(b.origin)), remoteAddress: '127.0.0.2' }))
    try { assert.equal((await newIp.inspect()).authorized, false) } finally { await newIp.dispose() }
    assert.equal(a.protectedRequests + b.protectedRequests, 0)
  } finally { await first.dispose(); await second?.dispose(); await a.close(); await b.close() }
})

test('a pinned TLS connection rejects an unobserved replacement before sending any HTTP body', options, async () => {
  const f = await fixture(), transport = platformPinFetch(await observePlatform(f.origin))
  try {
    f.rotate()
    await assert.rejects(transport.fetch(f.origin, { method: 'POST', body: 'synthetic-private-body' }), error => connectionFailure(error) === 'PLATFORM_IDENTITY_CHANGED')
    assert.equal(f.requests, 0)
  } finally { await transport.dispose(); await f.close() }
})

test('the built CLI preload fences automatic cross-origin fetch and leaves parent TLS unchanged', options, async () => {
  const a = await fixture(), b = await fixture(), pin = await observePlatform(a.origin)
  const pinFile = join(directory, 'child-pin.json'); await writeFile(pinFile, JSON.stringify(pin))
  try {
    a.redirect(b.origin)
    const preload = pathToFileURL(resolve('lib/cli-platform-preload.js')).href
    const script = `fetch(${JSON.stringify(a.origin)}, {method:'POST',body:'synthetic-body'}).then(()=>process.exit(2)).catch(e=>{let x=e;for(let i=0;i<8&&x;i++,x=x.cause)if(x.code==='TRUST_SCOPE_MISMATCH')process.exit(0);process.exit(3)})`
    await promisify(execFile)(process.execPath, ['--import', preload, '-e', script], {
      env: { ...process.env, OPENBKN_PLATFORM_PIN_FILE: pinFile, NODE_TLS_REJECT_UNAUTHORIZED: undefined, NODE_EXTRA_CA_CERTS: undefined }, timeout: 8_000,
    })
    assert.equal(a.requests, 1); assert.equal(b.requests, 0)
    await assert.rejects(fetch(a.origin), error => connectionFailure(error) === 'CERTIFICATE_UNTRUSTED')
  } finally { await a.close(); await b.close() }
})

test('an expired access token uses official CLI refresh before asking for another browser login', async () => {
  let renewed = false, logins = 0
  const auth = new AuthCoordinator({ run: async args => {
    if (args[1] === 'login') logins++
    if (args[1] === 'token') { renewed = true; return { code: 0, stdout: 'synthetic-refreshed-token', stderr: '' } }
    return { code: 0, stdout: JSON.stringify({ baseUrl: 'https://private.example', hasToken: true, expired: !renewed }), stderr: '' }
  } }, 'https://private.example', true)
  assert.equal((await auth.status()).kind, 'authenticated'); assert.equal(logins, 0)
})

test('failed refresh still requires authorization and never reports an authenticated state', async () => {
  const auth = new AuthCoordinator({ run: async args => args[1] === 'token' ? { code: 1, stdout: '', stderr: 'synthetic refusal' }
    : { code: 0, stdout: '{"baseUrl":"https://private.example","hasToken":true,"expired":true}', stderr: '' } }, 'https://private.example', true)
  assert.deepEqual(await auth.status(), { kind: 'authentication-required', baseUrl: 'https://private.example', reason: 'expired' })
})

test('a cached credential is never reused for a different authorization generation', async () => {
  const service = Object.create(OpenBknBusinessContextService.prototype)
  let reads = 0
  Object.assign(service, { synchronizedToken: 'synthetic-old-token', synchronizedGeneration: 'old-generation',
    privateAccess: () => ({ requireAuthorization: async () => ({ generation: 'new-generation', authorized: true }) }),
    authCoordinator: () => ({ readToken: async () => { reads++; return 'synthetic-new-token' } }),
  })
  assert.equal(await service.resolveOpenBknToken(new AbortController().signal), 'synthetic-new-token')
  assert.equal(reads, 1); assert.equal(service.synchronizedGeneration, 'new-generation')
})

test('a changed platform requiring authorization refuses even an existing cached credential', async () => {
  const service = Object.create(OpenBknBusinessContextService.prototype)
  Object.assign(service, { synchronizedToken: 'synthetic-old-token', synchronizedGeneration: 'old-generation',
    privateAccess: () => ({ requireAuthorization: async () => { throw Object.assign(new Error('new authorization required'), { code: 'PLATFORM_REAUTHORIZATION_REQUIRED' }) } }),
    authCoordinator: () => { throw Error('must not read the old CLI configuration') },
  })
  await assert.rejects(service.resolveOpenBknToken(new AbortController().signal), { code: 'PLATFORM_REAUTHORIZATION_REQUIRED' })
  assert.equal(service.synchronizedToken, undefined)
})

test('independent automatic-platform reads use the CLI refresh authority rather than a stale service token', async () => {
  const service = Object.create(OpenBknBusinessContextService.prototype)
  let reads = 0
  Object.assign(service, { synchronizedToken: 'synthetic-stale-access-token', synchronizedGeneration: 'same-generation',
    privateAccess: () => ({ requireAuthorization: async () => ({ generation: 'same-generation', authorized: true }) }),
    authCoordinator: () => ({ readToken: async () => { reads++; return 'synthetic-refreshed-access-token' } }),
  })
  assert.equal(await service.resolveOpenBknToken(new AbortController().signal), 'synthetic-refreshed-access-token')
  assert.equal(reads, 1)
})


test('a generation changed during a CLI token read cannot be labeled as the new identity', async () => {
  const service = Object.create(OpenBknBusinessContextService.prototype)
  let generation = 'before'
  Object.assign(service, { privateAccess: () => ({ requireAuthorization: async () => ({ generation, authorized: true }) }),
    authCoordinator: () => ({ readToken: async () => { generation = 'after'; return 'synthetic-prior-token' } }),
  })
  await assert.rejects(service.resolveOpenBknToken(new AbortController().signal), { code: 'PLATFORM_IDENTITY_CHANGED' })
  assert.equal(service.synchronizedToken, undefined)
})


test('HTTPS default origin supplies port 443 to the pinned TLS connector', options, async () => {
  const f = await fixture(), actual = await observePlatform(f.origin)
  let port: unknown
  // Retain real TLS and HTTP but map the OS destination to the ephemeral fixture.
  // This exercises Undici's omitted-port behavior without occupying a system port.
  const connect = ((options: Record<string, unknown>) => {
    port = options.port
    return tlsConnect({ ...options, port: Number(new URL(f.origin).port) })
  }) as typeof tlsConnect
  const agent = platformPinDispatcher({ ...actual, origin: 'https://127.0.0.1' }, connect)
  try {
    const result = await undiciFetch('https://127.0.0.1/', { dispatcher: agent })
    assert.equal(await result.text(), 'synthetic'); assert.equal(port, 443); assert.equal(f.requests, 1)
  } finally { await agent.destroy(); await f.close() }
})
