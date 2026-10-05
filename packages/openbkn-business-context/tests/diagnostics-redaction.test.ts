import assert from 'node:assert/strict'
import test from 'node:test'
import { PassiveDiagnosticsBuffer, PASSIVE_BUFFER_LIMIT, passiveDiagnostics } from '../src/diagnostics-observer.ts'
import { PlatformReaderError } from '../src/platform-reader.ts'

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
    stage: 'network', code: 'network-unreachable', status: 'fail',
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

test('reader failures record only whitelisted classification fields', () => {
  passiveDiagnostics.clear()
  // Exercise the real reader error path with canary-laden messages and cause.
  new PlatformReaderError('AUTHENTICATION_REQUIRED', `platform said ${BODY_CANARY}`)
  new PlatformReaderError('PLATFORM_UNAVAILABLE', `fetch failed ${URL_CANARY}`, {
    cause: new Error(`getaddrinfo ENOTFOUND ${URL_CANARY}`),
    httpStatus: 502,
  })
  const checks = passiveDiagnostics.snapshot()
  const serialized = JSON.stringify(checks)
  assert.ok(!serialized.includes(BODY_CANARY))
  assert.ok(!serialized.includes(URL_CANARY))
  const unavailable = checks.find(check => check.code === 'network-unreachable')
  assert.ok(unavailable !== undefined)
  assert.equal(unavailable.evidence.httpStatus, 502)
  assert.equal(unavailable.status, 'fail')
  passiveDiagnostics.clear()
})

test('a later success marks the earlier failure as recovered', () => {
  const buffer = new PassiveDiagnosticsBuffer()
  buffer.record({ stage: 'authentication', code: 'login-state', status: 'fail', evidence: { loggedIn: false } })
  buffer.record({ stage: 'authentication', code: 'login-state', status: 'pass', evidence: { loggedIn: true } })
  const [check] = buffer.snapshot()
  assert.equal(check.status, 'pass')
  assert.equal(check.evidence.recovered, true)
  assert.equal(check.evidence.failureCount, 1)
  assert.equal(check.evidence.loggedIn, true)
})

test('the buffer is bounded and reports dropped novel keys', () => {
  const buffer = new PassiveDiagnosticsBuffer()
  for (let index = 0; index < PASSIVE_BUFFER_LIMIT + 5; index += 1) {
    buffer.record({ stage: 'network', code: `distinct-${index}`, status: 'fail' })
  }
  assert.equal(buffer.snapshot().length, PASSIVE_BUFFER_LIMIT)
  assert.equal(buffer.droppedObservationCount, 5)
})

test('outcome counts accumulate per key and the newest outcome wins', () => {
  const buffer = new PassiveDiagnosticsBuffer()
  buffer.record({ stage: 'cli', code: 'cli-execution-failed', status: 'fail', evidence: { exitCode: 1 } })
  buffer.record({ stage: 'cli', code: 'cli-execution-failed', status: 'fail', evidence: { exitCode: 2 } })
  const [check] = buffer.snapshot()
  assert.equal(check.status, 'fail')
  assert.equal(check.evidence.failureCount, 2)
  assert.equal(check.evidence.exitCode, 2)
  assert.equal(typeof check.evidence.lastOutcomeAgoMs, 'number')
})
