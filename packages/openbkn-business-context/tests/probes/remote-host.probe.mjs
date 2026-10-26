/** The packed, old-generator Remote definitions on each official npm Gateway.
 * No platform requests, real credentials, native profiles, or model calls.
 */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'

const { values } = parseArgs({ options: { runtime: { type: 'string' }, plugin: { type: 'string' } } })
if (!values.runtime || !values.plugin) throw new Error('--runtime and --plugin are required')
const require = createRequire(resolve(values.runtime, 'package.json'))
const fromRuntime = name => import(pathToFileURL(require.resolve(`@deepseek-ai/${name}`)).href)
const [{ Context }, { default: Registry }, { default: Gateway }, { Peer }] = await Promise.all([
  'cordis', 'dsh-typert-registry', 'dsh-api-gateway', 'dsh-client-connection',
].map(fromRuntime))
const artifact = name => import(pathToFileURL(resolve(values.plugin, 'lib', name)).href)
const [{ TYPERT }, bootstrap, diagnostics] = await Promise.all([
  artifact('typert.host.js'), artifact('index.js'), artifact('diagnostics.js'),
])
const version = require('@deepseek-ai/dsh-api-gateway/package.json').version
const ctx = new Context(), fibers = [], peers = []
try {
  fibers.push(await ctx.plugin(Registry))
  if (version === '0.2.1-rc.3') fibers.push(await ctx.plugin((await fromRuntime('dsh-api-remote-access')).default))
  fibers.push(await ctx.plugin(Gateway))
  fibers.push(await ctx.plugin({ apply(scope) { scope.provide('loader', { entries: () => [] }) } }))
  fibers.push(await ctx.plugin(bootstrap))
  fibers.push(await ctx.plugin(diagnostics))
  const contribution = ctx.typert.register(TYPERT)
  assert.ok(ctx.typert.local.get('openbknConfiguration/getConfiguration'))
  const peer = version === '0.2.1-rc.3' ? new Peer(ctx, { principal: { kind: 'owner' } }) : undefined
  if (peer) peers.push(peer)
  const invoke = (namespace, method, args = {}, signal) => ctx.typertGateway.invoke({ namespace, method, args, peer, signal })
  const config = await invoke('openbknConfiguration', 'getConfiguration')
  assert.equal(config.editable, false)
  assert.equal(config.unavailableReason, 'editor-unavailable')
  const report = await invoke('openbknDiagnostics', 'getReport')
  assert.equal(report.mode, 'passive')
  assert.ok(report.checks.some(check => check.id === 'diagnostics-entry' && check.status === 'pass'))
  assert.deepEqual(await invoke('openbknConfiguration', 'checkCli', { cliPath: 'unused-fixture' }), {
    state: 'blocked', canInstall: false, reason: 'host-unavailable',
  })
  await assert.rejects(invoke('openbknConfiguration', 'saveConfiguration', { input: { baseUrl: '', cliPath: 'unused-fixture' } }), {
    code: 'openbkn/configuration-invalid',
  })
  await assert.rejects(invoke('openbknConfiguration', 'checkCli', { cliPath: 42 }), error => /^gateway\/(input|arguments)-invalid$/.test(error.code))
  const cancellation = new AbortController()
  cancellation.abort(new Error('controlled probe cancellation'))
  await assert.rejects(invoke('openbknDiagnostics', 'getReport', {}, cancellation.signal))
  // Real business service and host credential base, with controlled external seams.
  const business = await artifact('business.js')
  const { CredentialProvider } = await fromRuntime('dsh-credentials')
  class FixtureCredentials extends CredentialProvider {
    async describe() { return { configured: false } }
  }
  fibers.push(await ctx.plugin((await fromRuntime('dsh-system-prompt')).default))
  fibers.push(await ctx.plugin((await fromRuntime('dsh-tools')).default))
  fibers.push(await ctx.plugin(FixtureCredentials))
  fibers.push(await ctx.plugin({ apply(scope) {
    scope.provide('agents', { list: () => [], get: () => undefined })
    scope.provide('subprocess', { resolveExecutable: async () => { throw new Error('controlled missing CLI') } })
    scope.provide('openbknWorkspaceBindingRegistry', {})
  } }))
  fibers.push(await ctx.plugin(business.OpenBknBusinessContextService, { baseUrl: 'https://probe.invalid', cliPath: 'controlled-missing-cli' }))
  await assert.rejects(invoke('openbknBusinessContext', 'status'), { code: 'openbkn/cli-unavailable' })
  await assert.rejects(invoke('openbknBusinessContext', 'getNetworkBinding', { sessionId: 'not-live' }), /not a live DSH session/)
  if (version === '0.2.1-rc.3') {
    const visitor = new Peer(ctx, { principal: { kind: 'probe-ungranted' } })
    peers.push(visitor)
    await assert.rejects(ctx.typertGateway.invoke({ namespace: 'openbknDiagnostics', method: 'getReport', args: {}, peer: visitor }), {
      code: 'remote-access/denied',
    })
  }
  contribution()
  assert.equal(ctx.typert.local.get('openbknConfiguration/getConfiguration'), undefined)
  console.log(JSON.stringify({ dsh: version, verdict: 'pass', checks: [
    'packed Remote registration', 'bootstrap and diagnostics loading', 'configuration read',
    'passive diagnostics', 'optional subprocess degradation', 'typed business errors',
    'invalid input refusal', 'cancellation', 'contribution unload',
    'business service loading', 'credential-provider base and CLI failure', 'business Remote session refusal',
    ...(version === '0.2.1-rc.3' ? ['ungranted principal refusal'] : []),
  ] }))
} finally {
  for (const peer of peers.reverse()) await peer.dispose()
  for (const fiber of fibers.reverse()) await fiber.dispose()
}
