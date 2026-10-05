import assert from 'node:assert/strict'
import test from 'node:test'
import { PassiveDiagnosticsBuffer, PASSIVE_BUFFER_LIMIT, passiveDiagnostics } from '../src/diagnostics-observer.ts'
import { OpenBknPlatformReader, type PlatformFetch } from '../src/platform-reader.ts'
import { OpenBknCliSubprocess } from '../src/openbkn-cli-subprocess.ts'
import { AuthCoordinator } from '../src/auth.ts'
import { explainMcpStartupFailure } from '../src/openbkn-mcp-manager.ts'

/**
 * Canary strings are obviously fictional markers; no real credential is ever
 * read to build these assertions.
 */
const URL_CANARY = 'sk-canary-token-abcdef0123456789'
const MESSAGE_CANARY = 'canary-raw-message-do-not-ship'
const HEADER_CANARY = 'canary-authorization-header'
const BODY_CANARY = 'canary-response-body'
const CAUSE_CANARY = 'canary-nested-cause'

test('the buffer never stores raw errors, messages, or causes', () => {
  const buffer = new PassiveDiagnosticsBuffer()
  buffer.record({
    subject: 'platform-request', stage: 'network', code: 'network-unreachable', status: 'fail',
    evidence: {
      error: new Error(MESSAGE_CANARY, { cause: new Error(CAUSE_CANARY) }),
      message: `boom ${MESSAGE_CANARY}`,
      url: `https://platform.example/path?token=${URL_CANARY}`,
      headers: { authorization: `Bearer ${HEADER_CANARY}` },
      body: BODY_CANARY,
      nested: { deep: { value: URL_CANARY } },
    },
  })
  const serialized = JSON.stringify(buffer.snapshot())
  for (const canary of [URL_CANARY, MESSAGE_CANARY, HEADER_CANARY, BODY_CANARY, CAUSE_CANARY]) {
    assert.ok(!serialized.includes(canary), `canary leaked into the report: ${canary}`)
  }
})

test('reader failures through the real request path keep status and subjects separate', async () => {
  passiveDiagnostics.clear()
  const reader = makeReader(async () => new Response('{"error":"unauthorized"}', { status: 401 }))
  await assert.rejects(reader.listKnowledgeNetworks(new AbortController().signal), /authentication is required/i)
  const [check] = passiveDiagnostics.snapshot()
  assert.equal(check.id, 'observed:platform-directory')
  assert.equal(check.code, 'auth-rejected')
  assert.equal(check.evidence.httpStatus, 401)
  passiveDiagnostics.clear()
})

test('a TLS cause through the real request path classifies as tls-failed', async () => {
  passiveDiagnostics.clear()
  const tlsError = Object.assign(new Error('unable to verify the first certificate'), {
    cause: Object.assign(new Error('deepest'), { code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' }),
  })
  const reader = makeReader(async () => { throw tlsError })
  await assert.rejects(reader.getInteractionBusinessGraph('i-1', new AbortController().signal))
  const [check] = passiveDiagnostics.snapshot()
  assert.equal(check.id, 'observed:platform-provenance')
  assert.equal(check.code, 'tls-failed')
  passiveDiagnostics.clear()
})

test('a successful directory read does not clear a provenance failure', async () => {
  passiveDiagnostics.clear()
  // First call: the business-graph route refuses with 403.
  let status = 403
  const reader = makeReader(async () => new Response('{"error":"forbidden"}', { status }))
  await assert.rejects(reader.getInteractionBusinessGraph('i-1', new AbortController().signal))
  let [provenance] = passiveDiagnostics.snapshot()
  assert.equal(provenance.id, 'observed:platform-provenance')
  assert.equal(provenance.code, 'auth-rejected')
  assert.equal(provenance.evidence.httpStatus, 403)
  // Second call: the directory route succeeds (the service layer records the
  // pass on the directory subject, exactly as remoteListNetworks does).
  status = 200
  await reader.listKnowledgeNetworks(new AbortController().signal)
  passiveDiagnostics.record({ subject: 'platform-directory', stage: 'platform-directory', code: 'platform-directory', status: 'pass', evidence: { networkCount: 2 } })
  const byId = new Map(passiveDiagnostics.snapshot().map(entry => [entry.id, entry]))
  provenance = byId.get('observed:platform-provenance')
  const directory = byId.get('observed:platform-directory')
  assert.equal(provenance.status, 'fail', 'the provenance refusal must survive a directory success')
  assert.equal(provenance.code, 'auth-rejected')
  assert.equal(directory.status, 'pass')
  assert.notEqual(directory.evidence.recovered, true)
  passiveDiagnostics.clear()
})

test('canaries never survive the real request path', async () => {
  passiveDiagnostics.clear()
  const reader = makeReader(async () => {
    throw new Error(`fetch failed for https://${URL_CANARY}/x with ${HEADER_CANARY}`)
  })
  await assert.rejects(reader.getInteractionOperations('i-2', new AbortController().signal))
  const serialized = JSON.stringify(passiveDiagnostics.snapshot())
  assert.ok(!serialized.includes(URL_CANARY))
  assert.ok(!serialized.includes(HEADER_CANARY))
  passiveDiagnostics.clear()
})

/** A reader wired to a controlled fetcher, exactly as the service constructs one. */
function makeReader(fetcher: import('../src/platform-reader.ts').PlatformFetch): import('../src/platform-reader.ts').OpenBknPlatformReader {
  return new OpenBknPlatformReader({
    baseUrl: 'https://platform.example',
    requestTimeoutMs: 5_000,
    maxResultBytes: 1_000_000,
    allowInsecureTls: false,
    resolveToken: async () => 'test-token',
  }, fetcher)
}

test('a corrected platform address supersedes the earlier mismatch', () => {
  passiveDiagnostics.clear()
  passiveDiagnostics.record({ subject: 'login-state', stage: 'authentication', code: 'platform-mismatch', status: 'fail', evidence: { platformMismatch: true } })
  passiveDiagnostics.record({ subject: 'login-state', stage: 'authentication', code: 'login-state', status: 'pass', evidence: { loggedIn: true } })
  const [check] = passiveDiagnostics.snapshot()
  assert.equal(check.status, 'pass')
  assert.equal(check.code, 'login-state')
  assert.equal(check.evidence.recovered, true)
  assert.equal(check.evidence.lastFailureCode, 'platform-mismatch')
  passiveDiagnostics.clear()
})

test('CLI stdout that is not valid JSON records cli-output-invalid', async () => {
  passiveDiagnostics.clear()
  const { AuthCoordinator } = await import('../src/auth.ts')
  const broken: import('../src/auth.ts').OpenBknCli = {
    async run() { return { code: 0, stdout: 'not json at all', stderr: '' } },
  }
  await assert.rejects(
    new AuthCoordinator(broken, 'https://platform.example').status(),
    /invalid JSON/,
  )
  const [check] = passiveDiagnostics.snapshot()
  assert.equal(check.id, 'observed:cli')
  assert.equal(check.code, 'cli-output-invalid')
  passiveDiagnostics.clear()
})

test('a later success marks the earlier failure as recovered', () => {
  const buffer = new PassiveDiagnosticsBuffer()
  buffer.record({ subject: 'login-state', stage: 'authentication', code: 'not-logged-in', status: 'fail', evidence: { loggedIn: false } })
  buffer.record({ subject: 'login-state', stage: 'authentication', code: 'login-state', status: 'pass', evidence: { loggedIn: true } })
  const [check] = buffer.snapshot()
  assert.equal(check.status, 'pass')
  assert.equal(check.evidence.recovered, true)
  assert.equal(check.evidence.failureCount, 1)
  assert.equal(check.evidence.loggedIn, true)
  assert.equal(check.evidence.lastFailureCode, 'not-logged-in')
})

test('the buffer is bounded and reports dropped novel keys', () => {
  const buffer = new PassiveDiagnosticsBuffer()
  for (let index = 0; index < PASSIVE_BUFFER_LIMIT + 5; index += 1) {
    buffer.record({ subject: `probe-${index}`, stage: 'network', code: 'network-unreachable', status: 'fail' })
  }
  assert.equal(buffer.snapshot().length, PASSIVE_BUFFER_LIMIT)
  assert.equal(buffer.droppedObservationCount, 5)
})

test('outcome counts accumulate per subject and the newest outcome wins', () => {
  const buffer = new PassiveDiagnosticsBuffer()
  buffer.record({ subject: 'cli', stage: 'cli', code: 'cli-execution-failed', status: 'fail', evidence: { exitCode: 1 } })
  buffer.record({ subject: 'cli', stage: 'cli', code: 'cli-execution-failed', status: 'fail', evidence: { exitCode: 2 } })
  const [check] = buffer.snapshot()
  assert.equal(check.status, 'fail')
  assert.equal(check.evidence.failureCount, 2)
  assert.equal(check.evidence.exitCode, 2)
  assert.equal(typeof check.evidence.lastOutcomeAgoMs, 'number')
})

test('a clean CLI exit reconciles an earlier CLI failure', async () => {
  passiveDiagnostics.clear()
  const failing = makeCliSubprocess(1, '')
  const failingCli = new OpenBknCliSubprocess(failing, process.cwd(), 'https://platform.example', 'openbkn')
  await failingCli.run(['auth', 'status', '--json'])
  let [check] = passiveDiagnostics.snapshot()
  assert.equal(check.id, 'observed:cli')
  assert.equal(check.code, 'cli-execution-failed')
  assert.equal(check.status, 'fail')
  // Next invocation exits cleanly: the same subject must recover.
  const healthy = makeCliSubprocess(0, '{"hasToken":false}')
  const healthyCli = new OpenBknCliSubprocess(healthy, process.cwd(), 'https://platform.example', 'openbkn')
  await healthyCli.run(['auth', 'status', '--json'])
  ;[check] = passiveDiagnostics.snapshot()
  assert.equal(check.status, 'pass')
  assert.equal(check.evidence.recovered, true)
  assert.equal(check.evidence.lastFailureCode, 'cli-execution-failed')
  passiveDiagnostics.clear()
})

test('a parse refusal is reconciled by the next clean CLI exit', async () => {
  passiveDiagnostics.clear()
  const broken = makeCliSubprocess(0, 'not json at all')
  const brokenCli = new OpenBknCliSubprocess(broken, process.cwd(), 'https://platform.example', 'openbkn')
  await assert.rejects(new AuthCoordinator(brokenCli, 'https://platform.example').status(), /invalid JSON/)
  let [check] = passiveDiagnostics.snapshot()
  assert.equal(check.code, 'cli-output-invalid')
  assert.equal(check.status, 'fail')
  const healthy = makeCliSubprocess(0, '{"hasToken":false}')
  const healthyCli = new OpenBknCliSubprocess(healthy, process.cwd(), 'https://platform.example', 'openbkn')
  await healthyCli.run(['auth', 'status', '--json'])
  ;[check] = passiveDiagnostics.snapshot()
  assert.equal(check.status, 'pass')
  assert.equal(check.evidence.recovered, true)
  assert.equal(check.evidence.lastFailureCode, 'cli-output-invalid')
  passiveDiagnostics.clear()
})

test('the MCP classifier projects transport causes onto the context-loader stage', () => {
  passiveDiagnostics.clear()
  explainMcpStartupFailure(Object.assign(new Error('request failed'), {
    cause: Object.assign(new Error('cert'), { code: 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' }),
  }))
  let [check] = passiveDiagnostics.snapshot()
  assert.equal(check.stage, 'context-loader')
  assert.equal(check.code, 'tls-failed')

  passiveDiagnostics.clear()
  explainMcpStartupFailure(Object.assign(new Error('connect timeout'), { name: 'TimeoutError' }))
  ;[check] = passiveDiagnostics.snapshot()
  assert.equal(check.code, 'timeout')

  passiveDiagnostics.clear()
  explainMcpStartupFailure(new Error('protocol error'))
  ;[check] = passiveDiagnostics.snapshot()
  assert.equal(check.code, 'mcp-initialization-failed')
  passiveDiagnostics.clear()
})

/** A CLI subprocess fake answering one controlled exit code and stdout. */
function makeCliSubprocess(exitCode: number, stdout: string): import('../src/openbkn-cli-subprocess.ts').CliSubprocess {
  return {
    resolveExecutable: async () => '/fake/openbkn',
    spawn: () => ({
      done: Promise.resolve({ exitCode }),
      collected: {
        stdout: { readFrom: () => ({ text: stdout, lossy: false }) },
        stderr: { readFrom: () => ({ text: '', lossy: false }) },
      },
    }),
  }
}

test('an MCP SDK negotiation failure classifies as the network layer, not TLS', () => {
  passiveDiagnostics.clear()
  // Shape captured from the live host: the SDK's SdkError truncates the
  // undici chain, leaving only "fetch failed" (no certificate code).
  const sdkError = Object.assign(new Error('Version negotiation probe failed: fetch failed'), {
    name: 'SdkError', code: 'ERA_NEGOTIATION_FAILED',
  })
  const wrapped = new Error('mcp-client(openbkn): initial connection or tool synchronization failed', { cause: sdkError })
  explainMcpStartupFailure(wrapped)
  const [check] = passiveDiagnostics.snapshot()
  assert.equal(check.stage, 'context-loader')
  assert.equal(check.code, 'network-unreachable')
  passiveDiagnostics.clear()
})
