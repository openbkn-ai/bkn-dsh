import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createServer } from 'node:https'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { PrivatePlatformAccess } from '../src/private-platform-access.ts'
import type { PlatformAccessRecord } from '../src/platform-access-profile.ts'
import { OpenBknMcpManager } from '../src/openbkn-mcp-manager.ts'
import { OpenBknBusinessContextService } from '../src/business-context-service.ts'
import type { OpenBknPlatformReader } from '../src/platform-reader.ts'
import { connectionFailure } from '../src/platform-trust.ts'

const openssl = spawnSync('openssl', ['version'], { stdio: 'ignore' }).status === 0
const options = { skip: !openssl && 'OpenSSL is required for real TLS fixtures', timeout: 10_000 }
let directory: string, firstPem: string, firstKey: string, replacementPem: string, replacementKey: string
before(async () => {
  if (!openssl) return
  directory = await mkdtemp(join(process.env.OPENBKN_GENERATION_TEST_TMPDIR ?? tmpdir(), 'openbkn-generation-'))
  for (const name of ['first', 'replacement']) execFileSync('openssl', ['req', '-x509', '-newkey', 'ec', '-pkeyopt',
    'ec_paramgen_curve:P-256', '-nodes', '-keyout', join(directory, name + '.key'), '-out', join(directory, name + '.pem'),
    '-days', '2', '-subj', '/CN=synthetic-generation-test', '-addext', 'subjectAltName=IP:127.0.0.1'], { stdio: 'ignore' })
  ;[firstPem, firstKey, replacementPem, replacementKey] = await Promise.all(
    ['first.pem', 'first.key', 'replacement.pem', 'replacement.key'].map(name => readFile(join(directory, name), 'utf8')))
})
after(async () => { if (directory) await rm(directory, { recursive: true, force: true }) })

async function fixture() {
  let generation = 'first'
  const requests: { generation: string; authorization: string | undefined }[] = []
  const server = createServer({ cert: firstPem, key: firstKey }, (request, response) => {
    requests.push({ generation, authorization: request.headers.authorization })
    response.writeHead(200, { 'content-type': 'application/json' }).end('{"entries":[]}')
  })
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  const origin = 'https://127.0.0.1:' + (server.address() as { port: number }).port
  let stored: PlatformAccessRecord | undefined
  const access = new PrivatePlatformAccess(origin, {
    get: () => stored,
    put: async record => { stored = structuredClone(record) },
  }, directory)
  const first = await access.inspect()
  await access.authorize(first.generation)
  return {
    origin, access, requests,
    replaceAndAuthorize: async () => {
      generation = 'replacement'
      server.setSecureContext({ cert: replacementPem, key: replacementKey })
      server.closeAllConnections()
      const next = await access.inspect()
      assert.notEqual(next.generation, first.generation)
      assert.equal(next.authorized, false)
      await access.authorize(next.generation)
    },
    close: async () => {
      await access.dispose()
      server.closeAllConnections()
      await new Promise<void>(resolve => server.close(() => resolve()))
    },
  }
}

interface MountedTransport {
  headers: Record<string, string>
  platformFetch: typeof fetch
}
function mcpHarness(access: PrivatePlatformAccess, origin: string, resolveToken: () => Promise<string>,
  initialize = false) {
  let mounted: MountedTransport | undefined, active = false
  const context = {
    fiber: { state: 2 },
    tools: { get: () => active ? {} : undefined },
    plugin: async (_module: unknown, config: MountedTransport) => {
      mounted = config
      if (initialize) await (await config.platformFetch(origin, { headers: config.headers })).text()
      active = true
      return { dispose: async () => { active = false } }
    },
  }
  const manager = new OpenBknMcpManager(context as never, { baseUrl: origin, allowInsecureTls: false,
    toolCallTimeoutMs: 2_000 } as never, resolveToken, access)
  return { manager, get mounted() { assert.ok(mounted); return mounted }, get active() { return active } }
}

function readerFactory(access: PrivatePlatformAccess, origin: string, resolveToken: () => Promise<string>) {
  const service = Object.create(OpenBknBusinessContextService.prototype) as { platformReader(): OpenBknPlatformReader }
  Object.assign(service, {
    config: { baseUrl: origin, allowInsecureTls: false, requestTimeoutMs: 2_000, maxResultBytes: 1_024 },
    platformTrust: () => access,
    resolveOpenBknToken: resolveToken,
  })
  return () => service.platformReader()
}
const changedIdentity = (result: PromiseSettledResult<unknown>) =>
  result.status === 'rejected' && connectionFailure(result.reason) === 'PLATFORM_IDENTITY_CHANGED'
const read = (reader: OpenBknPlatformReader) => reader.listKnowledgeNetworks(new AbortController().signal)

test('captured MCP and reader transports cannot carry old credentials into a newly authorized generation', options, async () => {
  const f = await fixture()
  try {
    let token = 'synthetic-first-token'
    const old = mcpHarness(f.access, f.origin, async () => token)
    const newReader = readerFactory(f.access, f.origin, async () => token)
    await old.manager.ensure()
    const oldReader = newReader()
    await (await old.mounted.platformFetch(f.origin, { headers: old.mounted.headers })).text()
    await read(oldReader)
    await f.replaceAndAuthorize()
    token = 'synthetic-replacement-token'
    const outcomes = await Promise.allSettled([
      old.mounted.platformFetch(f.origin, { headers: old.mounted.headers }).then(response => response.text()),
      read(oldReader),
    ])
    assert.equal(old.active, true, 'the old native client remains mounted during credential synchronization')

    const fresh = mcpHarness(f.access, f.origin, async () => token, true)
    await fresh.manager.ensure()
    await read(newReader())
    assert.deepEqual({
      oldMcpRefused: changedIdentity(outcomes[0]!),
      oldReaderRefused: changedIdentity(outcomes[1]!),
      oldHeaderReachedReplacement: f.requests.some(request => request.generation === 'replacement'
        && request.authorization === 'Bearer synthetic-first-token'),
    }, { oldMcpRefused: true, oldReaderRefused: true, oldHeaderReachedReplacement: false })
    assert.equal(f.requests.filter(request => request.generation === 'replacement'
      && request.authorization === 'Bearer synthetic-replacement-token').length, 2)
  } finally { await f.close() }
})

test('an MCP token resolved across identity rotation cannot be relabeled as the replacement generation', options, async () => {
  const f = await fixture()
  try {
    const old = mcpHarness(f.access, f.origin, async () => {
      await f.replaceAndAuthorize()
      return 'synthetic-first-token'
    }, true)
    const [outcome] = await Promise.allSettled([old.manager.ensure()])
    assert.deepEqual({ refused: changedIdentity(outcome!), oldHeaderReachedReplacement: f.requests.some(request =>
      request.generation === 'replacement' && request.authorization === 'Bearer synthetic-first-token') },
    { refused: true, oldHeaderReachedReplacement: false })
    assert.equal(old.active, false)
    const fresh = mcpHarness(f.access, f.origin, async () => 'synthetic-replacement-token', true)
    await fresh.manager.ensure()
    assert.equal(f.requests.length, 1)
  } finally { await f.close() }
})

test('a reader token resolved across identity rotation cannot be relabeled as the replacement generation', options, async () => {
  const f = await fixture()
  try {
    const oldReader = readerFactory(f.access, f.origin, async () => {
      await f.replaceAndAuthorize()
      return 'synthetic-first-token'
    })()
    const [outcome] = await Promise.allSettled([read(oldReader)])
    assert.deepEqual({ refused: changedIdentity(outcome!), oldHeaderReachedReplacement: f.requests.some(request =>
      request.generation === 'replacement' && request.authorization === 'Bearer synthetic-first-token') },
    { refused: true, oldHeaderReachedReplacement: false })
    await read(readerFactory(f.access, f.origin, async () => 'synthetic-replacement-token')())
    assert.equal(f.requests.length, 1)
  } finally { await f.close() }
})
