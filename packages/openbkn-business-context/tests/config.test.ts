import assert from 'node:assert/strict'
import test from 'node:test'
import { Context } from '@deepseek-ai/cordis'
import Schema from '@deepseek-ai/schemastery'
import { Config } from '../src/config.ts'
import { observeEntry } from '../src/diagnostics-host-adapter.ts'
import { OpenBknDiagnosticsService } from '../src/diagnostics-service.ts'

const invalidBaseUrls = [
  'ht!tp://not a valid url with spaces',
  '', '   ', 'platform.example', '/api', '//platform.example',
  'https://', 'https:///platform.example', 'https:platform.example',
  'https://not a valid host', 'https://platform.example/path with spaces',
  ' https://platform.example', 'https://platform.example\n',
  'https://platform.example\\path', 'https://platform.example:99999',
  'ftp://platform.example', 'file:///tmp/platform', 'javascript:alert(1)',
]

test('malformed baseUrl fails configuration validation without echoing its value', () => {
  for (const baseUrl of invalidBaseUrls) {
    const result = Config['~standard'].validate({ baseUrl })
    assert.ok(!('then' in result))
    assert.ok(result.issues, `configuration accepted ${JSON.stringify(baseUrl)}`)
    assert.deepEqual(result.issues[0]?.path, ['baseUrl'])
    assert.match(result.issues[0]?.message ?? '', /\$\.baseUrl/)
    if (baseUrl.trim()) assert.ok(!result.issues[0]?.message.includes(baseUrl))
  }
})

test('valid deployment URLs retain their bytes and existing configuration defaults', () => {
  for (const baseUrl of [
    'https://192.168.50.28:443', 'https://platform.example/',
    'https://platform.example/prefix///', 'https://platform.example/a%20b',
    'http://localhost:8081', 'http://127.0.0.1:8081', 'http://[::1]:8081',
    'https://[2001:db8::1]:443', 'HTTPS://platform.example',
  ]) {
    const config = Config({ baseUrl })
    assert.equal(config.baseUrl, baseUrl)
    assert.equal(config.allowInsecureTls, false)
    assert.equal(config.requestTimeoutMs, 30_000)
  }
  assert.throws(() => Config({}), /\$\.baseUrl/)
  assert.throws(() => Config({ baseUrl: 443 }), /\$\.baseUrl/)
  assert.throws(() => Config({ baseUrl: invalidBaseUrls[0], allowInsecureTls: true }), /\$\.baseUrl/)
})

test('DSH settings schema serialization retains URL validation without module closures', () => {
  const settingsSchema = new Schema(JSON.parse(JSON.stringify(Config)))
  assert.equal(settingsSchema({ baseUrl: 'https://192.168.50.28:443' }).baseUrl, 'https://192.168.50.28:443')
  const result = settingsSchema['~standard'].validate({ baseUrl: invalidBaseUrls[0] })
  assert.ok(!('then' in result))
  assert.deepEqual(result.issues?.[0]?.path, ['baseUrl'])
  assert.match(result.issues?.[0]?.message ?? '', /\$\.baseUrl expected an absolute HTTP\(S\) URL/)
})

test('real Cordis fiber rejects invalid baseUrl before apply and independent diagnostics remain usable', async () => {
  const ctx = new Context()
  let applyCalls = 0
  const fiber = ctx.plugin({
    name: 'openbkn-business-context', Config,
    apply() { applyCalls++ },
  }, { baseUrl: invalidBaseUrls[0] })
  const business = { options: { id: 'openbkn-business-context', name: '@openbkn/dsh-business-context/business' }, fiber }
  try {
    assert.deepEqual(await observeEntry(business), { kind: 'configuration-invalid', field: 'baseUrl' })
    assert.equal(applyCalls, 0)
    const report = await OpenBknDiagnosticsService.prototype.getReport.call({
      ctx: { get: () => ({ *entries() { yield business } }) },
    } as unknown as OpenBknDiagnosticsService)
    const check = report.checks.find(check => check.id === 'business-entry')
    assert.equal(check?.stage, 'configuration')
    assert.equal(check?.status, 'fail')
    assert.equal(check?.code, 'configuration-invalid')
    assert.equal(check?.evidence.configField, 'baseUrl')
    assert.equal(report.checks.find(check => check.id === 'diagnostics-entry')?.status, 'pass')
    assert.ok(!JSON.stringify(report).includes(invalidBaseUrls[0]!))
  } finally {
    await fiber.dispose()
  }
})
