import assert from 'node:assert/strict'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import { apply } from '../src/business.ts'
import { Config } from '../src/config.ts'
import { OpenBknConfigurationService } from '../src/configuration-service.ts'
import { OpenBknDiagnosticsService } from '../src/diagnostics-service.ts'

function fixture(config: Record<string, unknown> = {}) {
  const entry = { options: { id: 'openbkn-business-context', name: '@openbkn/dsh-business-context/business', config }, fiber: { state: 2, config: undefined as Record<string, unknown> | undefined, await: async () => {} } }
  let calls = 0
  let running = false
  let failure: Error | undefined
  const editor = {
    entries: () => [entry],
    async edit(_entry: unknown, change: (current: Record<string, unknown>, inherited: Record<string, unknown>) => Record<string, unknown>) {
      calls++
      if (failure !== undefined) throw failure
      entry.options.config = change(entry.options.config, {})
      // Native editor is the owner of persistence/reconciliation; tests assert its seam.
    },
  }
  const service = Object.create(OpenBknConfigurationService.prototype) as OpenBknConfigurationService
  Object.defineProperty(service, 'ctx', { configurable: true, value: { get: (name: string) => name === 'configEditor' ? editor
    : name === 'openbknBusinessContext' ? { hasRunningTurn: running } : undefined } })
  return { entry, service, calls: () => calls, setRunning: (value: boolean) => { running = value }, setFailure: (value: Error) => { failure = value } }
}

test('fresh default config activates without mounting registry, CLI, MCP or business service', async () => {
  const config = Config['~standard'].validate({})
  assert.ok(!('then' in config) && config.value)
  const ctx = new Context()
  let mounts = 0
  const fiber = ctx.plugin({ Config, async apply(child, config) {
    Object.defineProperty(child, 'plugin', { value: () => { mounts++; throw new Error('pending must not mount business resources') } })
    await apply(child, config)
  } }, {})
  try {
    await fiber
    assert.equal(fiber.state, 2)
    assert.equal(mounts, 0)
  } finally { await fiber.dispose() }
})

test('pending diagnostics explicitly leave authentication and connection checks not-run', async () => {
  const { entry } = fixture()
  const report = await OpenBknDiagnosticsService.prototype.getReport.call({ ctx: { get: () => ({ entries: () => [entry] }) } } as unknown as OpenBknDiagnosticsService)
  assert.equal(report.checks.find(check => check.id === 'business-entry')?.status, 'pass')
  for (const stage of ['cli', 'authentication', 'context-loader', 'platform-directory']) {
    const check = report.checks.find(check => check.id === `pending:${stage}`)
    assert.equal(check?.status, 'not-run')
    assert.equal(check?.code, 'configuration-required')
  }
})

test('configuration writes only the two owned fields through the native editor', async () => {
  const f = fixture({ requestTimeoutMs: 45_000, mcpUrl: 'https://platform.example/mcp', businessDomain: 'bd_public' })
  assert.equal((await f.service.getConfiguration()).configured, false)
  const result = await f.service.saveConfiguration({ baseUrl: 'https://platform.example', cliPath: '/tools/openbkn' })
  assert.deepEqual(result, { baseUrl: 'https://platform.example', cliPath: '/tools/openbkn', configured: true, editable: true })
  assert.equal(f.entry.options.config.requestTimeoutMs, 45_000)
  assert.equal(f.entry.options.config.mcpUrl, 'https://platform.example/mcp')
  assert.equal(f.entry.options.config.businessDomain, 'bd_public')
  assert.equal(f.calls(), 1)
})

test('invalid submission does not write and does not echo configured values', async () => {
  const f = fixture({ baseUrl: 'https://platform.example' })
  for (const baseUrl of ['', 'relative/path', 'file:///tmp/file', 'https://bad host', 'ht!tp://bad']) {
    await assert.rejects(f.service.saveConfiguration({ baseUrl, cliPath: 'openbkn' }), (error: unknown) => {
      const e = error as { code: string; details: { configField: string }; message: string }
      assert.equal(e.code, 'openbkn/configuration-invalid')
      assert.equal(e.details.configField, 'baseUrl')
      if (baseUrl) assert.ok(!e.message.includes(baseUrl))
      return true
    })
  }
  assert.equal(f.calls(), 0)
  assert.equal(f.entry.options.config.baseUrl, 'https://platform.example')
})

test('running sessions and inactive business rows cannot write configuration', async () => {
  const f = fixture()
  f.setRunning(true)
  assert.equal((await f.service.getConfiguration()).unavailableReason, 'busy')
  await assert.rejects(f.service.saveConfiguration({ baseUrl: 'https://platform.example', cliPath: 'openbkn' }), { code: 'openbkn/configuration-busy' })
  f.setRunning(false)
  f.entry.fiber.state = 3
  assert.equal((await f.service.getConfiguration()).unavailableReason, 'entry-inactive')
  await assert.rejects(f.service.saveConfiguration({ baseUrl: 'https://platform.example', cliPath: 'openbkn' }), { code: 'openbkn/configuration-unavailable' })
  assert.equal(f.calls(), 0)
})

test('native override/write rejection is sanitized and original values survive', async () => {
  const f = fixture({ baseUrl: 'https://platform.example' })
  f.setFailure(new Error('home override contains SECRET_CANARY'))
  await assert.rejects(f.service.saveConfiguration({ baseUrl: 'https://other.example', cliPath: 'openbkn' }), (error: unknown) => {
    const e = error as Error & { code: string }
    assert.equal(e.code, 'openbkn/configuration-save-failed')
    assert.ok(!JSON.stringify(e).includes('SECRET_CANARY'))
    return true
  })
  assert.equal(f.entry.options.config.baseUrl, 'https://platform.example')
  assert.equal((await f.service.getConfiguration()).editable, true)
})

test('a missing editor preserves readable healthy config and never invents a pending state', async () => {
  const { entry, service } = fixture({ baseUrl: 'https://platform.example', cliPath: '/tools/openbkn' })
  Object.defineProperty(service, 'ctx', { configurable: true, value: { get: (name: string) => name === 'loader' ? { entries: () => [entry] } : undefined } })
  assert.deepEqual(await service.getConfiguration(), { baseUrl: 'https://platform.example', cliPath: '/tools/openbkn', configured: true, editable: false, unavailableReason: 'editor-unavailable' })
})


test('active native resolved values expose an expression-configured URL without evaluating raw nodes', async () => {
  const raw = { baseUrl: { __jsExpr: 'process.env.OPENBKN_URL' }, cliPath: { __jsExpr: 'process.env.OPENBKN_CLI' },
    requestTimeoutMs: 45_000, businessDomain: 'bd_public' }
  const f = fixture(raw)
  // The pinned Loader interpolates raw nodes before native Cordis Config resolution.
  // The plugin reads only this public, already-resolved active Fiber.config.
  f.entry.fiber.config = Config({ baseUrl: 'https://resolved.example', cliPath: '/tools/openbkn', requestTimeoutMs: 45_000, businessDomain: 'bd_public' })
  assert.deepEqual(await f.service.getConfiguration(), { baseUrl: 'https://resolved.example', cliPath: '/tools/openbkn', configured: true, editable: true })
  assert.deepEqual(f.entry.options.config, raw)
  const report = await OpenBknDiagnosticsService.prototype.getReport.call({ ctx: { get: () => ({ entries: () => [f.entry] }) } } as unknown as OpenBknDiagnosticsService)
  assert.equal(report.checks.some(check => check.code === 'configuration-required'), false)
})

test('an expression resolving to the empty native default stays pending in settings and diagnostics', async () => {
  const f = fixture({ baseUrl: { __jsExpr: 'process.env.OPENBKN_URL ?? ""' } })
  f.entry.fiber.config = Config({})
  assert.equal((await f.service.getConfiguration()).configured, false)
  const report = await OpenBknDiagnosticsService.prototype.getReport.call({ ctx: { get: () => ({ entries: () => [f.entry] }) } } as unknown as OpenBknDiagnosticsService)
  assert.equal(report.checks.find(check => check.id === 'configuration')?.code, 'configuration-required')
  assert.equal(report.checks.find(check => check.id === 'pending:authentication')?.status, 'not-run')
})

test('inactive fibers use current raw values rather than obsolete resolved configuration', async () => {
  const f = fixture({ baseUrl: 'https://current.example', cliPath: '/tools/current' })
  f.entry.fiber.config = Config({ baseUrl: 'https://previous.example', cliPath: '/tools/previous' })
  f.entry.fiber.state = 3
  assert.deepEqual(await f.service.getConfiguration(), { baseUrl: 'https://current.example', cliPath: '/tools/current', configured: true, editable: false, unavailableReason: 'entry-inactive' })
})

test('native editing preserves raw expression nodes outside the two submitted fields', async () => {
  const expression = { __jsExpr: 'process.env.OPENBKN_MCP_URL' }
  const f = fixture({ baseUrl: 'https://platform.example', mcpUrl: expression, requestTimeoutMs: 45_000 })
  f.entry.fiber.config = Config({ baseUrl: 'https://platform.example', mcpUrl: 'https://platform.example/mcp', requestTimeoutMs: 45_000 })
  await f.service.saveConfiguration({ baseUrl: 'https://platform.example', cliPath: '/tools/openbkn' })
  assert.deepEqual(f.entry.options.config.mcpUrl, expression)
  assert.equal(f.entry.options.config.requestTimeoutMs, 45_000)
})
