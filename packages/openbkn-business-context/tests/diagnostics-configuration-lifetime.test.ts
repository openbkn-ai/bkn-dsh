import assert from 'node:assert/strict'
import test from 'node:test'
import { AuthCoordinator, type CliResult } from '../src/auth.ts'
import { PassiveDiagnosticsBuffer, passiveDiagnostics } from '../src/diagnostics-observer.ts'
import { OpenBknCliSubprocess, type CliSubprocess } from '../src/openbkn-cli-subprocess.ts'
import { OpenBknMcpManager } from '../src/openbkn-mcp-manager.ts'
import { OpenBknPlatformReader, PlatformReaderError, type PlatformFetch } from '../src/platform-reader.ts'

const PLATFORM_A = 'https://platform-a.example'
const PLATFORM_B = 'https://platform-b.example'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

function selectPlatformA(): void {
  passiveDiagnostics.clear()
  passiveDiagnostics.selectConfiguration(PLATFORM_A)
}

function reader(fetcher: PlatformFetch): OpenBknPlatformReader {
  return new OpenBknPlatformReader({
    baseUrl: PLATFORM_A, requestTimeoutMs: 5_000,
    maxResultBytes: 1_000_000, allowInsecureTls: false,
    resolveToken: async () => 'fictional-test-token',
  }, fetcher)
}

test('configuration changes clear observations and fence writers even when returning to an old address', () => {
  const buffer = new PassiveDiagnosticsBuffer()
  buffer.selectConfiguration(PLATFORM_A)
  const old = buffer.writer()
  old.record({ subject: 'context-loader', stage: 'context-loader', code: 'auth-rejected', status: 'fail' })
  buffer.selectConfiguration(` ${PLATFORM_A}/// `)
  old.record({ subject: 'context-loader', stage: 'context-loader', code: 'context-loader', status: 'pass' })
  assert.equal(buffer.snapshot()[0]?.evidence.recovered, true, 'normalizing the same address preserves recovery history')

  buffer.selectConfiguration(PLATFORM_B)
  assert.deepEqual(buffer.snapshot(), [])
  old.record({ subject: 'context-loader', stage: 'context-loader', code: 'tls-failed', status: 'fail' })
  assert.deepEqual(buffer.snapshot(), [])
  buffer.selectConfiguration(PLATFORM_A)
  old.record({ subject: 'context-loader', stage: 'context-loader', code: 'context-loader', status: 'pass' })
  assert.deepEqual(buffer.snapshot(), [], 'an earlier lifetime is not revived by selecting its address again')

  buffer.writer().record({ subject: 'cli', stage: 'cli', code: 'cli', status: 'pass' })
  assert.doesNotMatch(JSON.stringify(buffer.snapshot()), /platform-[ab]\.example/)
  buffer.selectConfiguration('')
  assert.deepEqual(buffer.snapshot(), [], 'pending configuration has no previous-platform checks')
})

test('late reader failures and successes cannot enter the next platform report', async () => {
  for (const status of [401, 200]) {
    selectPlatformA()
    const entered = deferred<void>()
    const response = deferred<Response>()
    const pending = reader(async () => { entered.resolve(); return await response.promise })
      .getInteractionOperations('interaction-a', new AbortController().signal)
    const completed = status === 401 ? assert.rejects(pending, /authentication is required/i) : pending
    await entered.promise
    passiveDiagnostics.selectConfiguration(PLATFORM_B)
    response.resolve(new Response('{"entries":[]}', { status }))
    await completed
    assert.deepEqual(passiveDiagnostics.snapshot(), [], `late HTTP ${status} belongs to the replaced reader`)
  }
  passiveDiagnostics.clear()
})

test('late CLI status and invalid-output classifications stay with the old platform lifetime', async () => {
  for (const stdout of [JSON.stringify({ baseUrl: PLATFORM_A, hasToken: true }), 'invalid-json']) {
    selectPlatformA()
    const entered = deferred<void>()
    const result = deferred<CliResult>()
    const auth = new AuthCoordinator({ run: async () => { entered.resolve(); return await result.promise } }, PLATFORM_A)
    const pending = auth.status()
    const completed = stdout === 'invalid-json' ? assert.rejects(pending, /invalid JSON/i) : pending
    await entered.promise
    passiveDiagnostics.selectConfiguration(PLATFORM_B)
    result.resolve({ code: 0, stdout, stderr: '' })
    await completed
    assert.deepEqual(passiveDiagnostics.snapshot(), [])
  }
  passiveDiagnostics.clear()
})

test('a delayed executable lookup refusal cannot mark the replacement CLI as missing', async () => {
  selectPlatformA()
  const entered = deferred<void>()
  const lookup = deferred<string>()
  const cli = new OpenBknCliSubprocess({
    resolveExecutable: async () => { entered.resolve(); return await lookup.promise },
    spawn: () => { throw new Error('a failed lookup must not spawn a process') },
  }, '.', PLATFORM_A)
  const completed = assert.rejects(cli.run(['auth', 'status', '--json']), /not available/)
  await entered.promise
  passiveDiagnostics.selectConfiguration(PLATFORM_B)
  lookup.reject(new Error('fictional executable not found'))
  await completed
  assert.deepEqual(passiveDiagnostics.snapshot(), [])
  passiveDiagnostics.clear()
})

test('a delayed subprocess result cannot replace the next platform CLI observation', async () => {
  for (const lossy of [false, true]) {
    selectPlatformA()
    const entered = deferred<void>()
    const done = deferred<{ exitCode: number }>()
    const subprocess: CliSubprocess = {
      resolveExecutable: async () => 'openbkn',
      spawn: () => {
        entered.resolve()
        return { done: done.promise, collected: { stdout: { readFrom: () => ({ text: '{}', lossy }) } } }
      },
    }
    const pending = new OpenBknCliSubprocess(subprocess, '.', PLATFORM_A).run(['auth', 'status', '--json'])
    const completed = lossy ? assert.rejects(pending, /safe size limit/) : pending
    await entered.promise
    passiveDiagnostics.selectConfiguration(PLATFORM_B)
    done.resolve({ exitCode: 0 })
    await completed
    assert.deepEqual(passiveDiagnostics.snapshot(), [])
  }
  passiveDiagnostics.clear()
})

test('late MCP startup success and classified rejection cannot repopulate the new platform report', async () => {
  for (const failure of [false, true]) {
    selectPlatformA()
    const entered = deferred<void>()
    const mount = deferred<{ dispose(): Promise<void> }>()
    const tools = new Map<string, unknown>()
    const manager = new OpenBknMcpManager({
      tools: { get: (name: string) => tools.get(name) },
      plugin: async () => { entered.resolve(); return await mount.promise },
    } as never, { baseUrl: PLATFORM_A } as never, async () => 'fictional-test-token')
    const pending = manager.ensure()
    const completed = failure ? assert.rejects(pending, /certificate/) : pending
    await entered.promise
    passiveDiagnostics.selectConfiguration(PLATFORM_B)
    if (failure) {
      mount.reject(Object.assign(new Error('fictional certificate failure'), { code: 'DEPTH_ZERO_SELF_SIGNED_CERT' }))
    } else {
      tools.set('mcp__openbkn__bkn_start_interaction', {})
      mount.resolve({ dispose: async () => {} })
    }
    await completed
    assert.deepEqual(passiveDiagnostics.snapshot(), [])
  }
  passiveDiagnostics.clear()
})

test('same-address reader replacement preserves 401 recovery evidence', async () => {
  selectPlatformA()
  await assert.rejects(reader(async () => new Response('{}', { status: 401 }))
    .getInteractionOperations('interaction-a', new AbortController().signal))
  passiveDiagnostics.selectConfiguration(`${PLATFORM_A}/`)
  await reader(async () => new Response('{"entries":[]}'))
    .getInteractionOperations('interaction-a', new AbortController().signal)
  const [check] = passiveDiagnostics.snapshot()
  assert.equal(check?.code, 'platform-operations')
  assert.equal(check?.status, 'pass')
  assert.equal(check?.evidence.recovered, true)
  assert.equal(check?.evidence.lastFailureCode, 'auth-rejected')
  passiveDiagnostics.clear()
})

test('authentication login forwards only the supplied lifecycle signal', async () => {
  const controller = new AbortController()
  let observedSignal: AbortSignal | undefined
  const auth = new AuthCoordinator({ run: async (_args, signal) => {
    observedSignal = signal
    return { code: 0, stdout: '', stderr: '' }
  } }, PLATFORM_A)
  await auth.beginLogin(controller.signal)
  assert.equal(observedSignal, controller.signal)
})

function successfulCli(): OpenBknCliSubprocess {
  return new OpenBknCliSubprocess({
    resolveExecutable: async () => 'openbkn',
    spawn: () => ({
      done: Promise.resolve({ exitCode: 0 }),
      collected: { stdout: { readFrom: () => ({ text: '{}', lossy: false }) } },
    }),
  }, '.', PLATFORM_A)
}

test('same-address canceled subprocess output cannot overwrite a newer CLI success', async () => {
  for (const result of [{ exitCode: null, lossy: false }, { exitCode: 0, lossy: true }]) {
    selectPlatformA()
    const entered = deferred<void>()
    const done = deferred<{ exitCode: number | null }>()
    const controller = new AbortController()
    let outputReads = 0
    const oldCli = new OpenBknCliSubprocess({
      resolveExecutable: async () => 'openbkn',
      spawn: () => {
        entered.resolve()
        return { done: done.promise, collected: { stdout: { readFrom: () => {
          outputReads += 1
          return { text: 'invalid-json', lossy: result.lossy }
        } } } }
      },
    }, '.', PLATFORM_A)
    const completed = assert.rejects(oldCli.run(['auth', 'status', '--json'], controller.signal), { name: 'AbortError' })
    await entered.promise
    controller.abort()
    passiveDiagnostics.selectConfiguration(`${PLATFORM_A}/`)
    await successfulCli().run(['auth', 'status', '--json'])
    done.resolve({ exitCode: result.exitCode })
    await completed
    assert.equal(outputReads, 0, 'canceled output is not parsed or classified')
    const [check] = passiveDiagnostics.snapshot()
    assert.equal(check?.code, 'cli')
    assert.equal(check?.status, 'pass')
    assert.equal(check?.evidence.failureCount, 0)
  }
  passiveDiagnostics.clear()
})

test('same-address canceled authentication status cannot overwrite a new authenticated result', async () => {
  for (const stdout of ['invalid-json', JSON.stringify({ hasToken: false })]) {
    selectPlatformA()
    const entered = deferred<void>()
    const result = deferred<CliResult>()
    const controller = new AbortController()
    const oldAuth = new AuthCoordinator({ run: async () => { entered.resolve(); return await result.promise } }, PLATFORM_A)
    const completed = assert.rejects(oldAuth.status(controller.signal), { name: 'AbortError' })
    await entered.promise
    controller.abort()
    passiveDiagnostics.selectConfiguration(PLATFORM_A)
    await new AuthCoordinator({ run: async () => ({
      code: 0, stdout: JSON.stringify({ baseUrl: PLATFORM_A, hasToken: true }), stderr: '',
    }) }, PLATFORM_A).status()
    result.resolve({ code: 0, stdout, stderr: '' })
    await completed
    const [check] = passiveDiagnostics.snapshot()
    assert.equal(check?.code, 'login-state')
    assert.equal(check?.status, 'pass')
    assert.equal(check?.evidence.failureCount, 0)
    assert.equal(passiveDiagnostics.snapshot().length, 1, 'a canceled parse does not add a CLI refusal')
  }
  passiveDiagnostics.clear()
})

test('same-address canceled token output cannot add a parse failure after a newer CLI success', async () => {
  selectPlatformA()
  const entered = deferred<void>()
  const token = deferred<CliResult>()
  const controller = new AbortController()
  const auth = new AuthCoordinator({ run: async args => {
    if (args[1] === 'status') return {
      code: 0, stdout: JSON.stringify({ baseUrl: PLATFORM_A, hasToken: true }), stderr: '',
    }
    entered.resolve()
    return await token.promise
  } }, PLATFORM_A)
  const completed = assert.rejects(auth.readToken(controller.signal), { name: 'AbortError' })
  await entered.promise
  controller.abort()
  await successfulCli().run(['auth', 'status', '--json'])
  token.resolve({ code: 0, stdout: '', stderr: '' })
  await completed
  const cli = passiveDiagnostics.snapshot().find(check => check.id === 'observed:cli')
  assert.equal(cli?.code, 'cli')
  assert.equal(cli?.status, 'pass')
  assert.equal(cli?.evidence.failureCount, 0)
  passiveDiagnostics.clear()
})

test('same-address canceled response-body completion cannot overwrite a newer reader success', async () => {
  for (const failure of [false, true]) {
    selectPlatformA()
    const entered = deferred<void>()
    let body!: ReadableStreamDefaultController<Uint8Array>
    const stream = new ReadableStream<Uint8Array>({
      start: controller => { body = controller },
      pull: () => { entered.resolve() },
    }, { highWaterMark: 0 })
    const controller = new AbortController()
    const oldReader = reader(async () => new Response(stream))
    const completed = assert.rejects(oldReader.getInteractionOperations('interaction-a', controller.signal), error => {
      assert.ok(error instanceof PlatformReaderError)
      assert.equal(error.code, 'REQUEST_ABORTED')
      return true
    })
    await entered.promise
    controller.abort()
    passiveDiagnostics.selectConfiguration(PLATFORM_A)
    await reader(async () => new Response('{"entries":[]}'))
      .getInteractionOperations('interaction-a', new AbortController().signal)
    if (failure) body.error(new Error('fictional canceled body'))
    else {
      body.enqueue(new TextEncoder().encode('invalid-json'))
      body.close()
    }
    await completed
    const [check] = passiveDiagnostics.snapshot()
    assert.equal(check?.code, 'platform-operations')
    assert.equal(check?.status, 'pass')
    assert.equal(check?.evidence.failureCount, 0)
  }
  passiveDiagnostics.clear()
})
