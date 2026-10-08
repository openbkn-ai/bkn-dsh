import assert from 'node:assert/strict'
import test from 'node:test'
import { passiveDiagnostics } from '../src/diagnostics-observer.ts'
import { OpenBknMcpManager } from '../src/openbkn-mcp-manager.ts'

const REQUIRED_TOOL = 'mcp__openbkn__bkn_start_interaction'
const config = { baseUrl: 'https://platform.example', toolCallTimeoutMs: 20_000 }

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no })
  return { promise, resolve, reject }
}

function freshPass(): void {
  // Same platform: preserve the buffer generation/recovery history while
  // recording the replacement owner's success before the old task settles.
  passiveDiagnostics.record({
    subject: 'context-loader', stage: 'context-loader', code: 'context-loader', status: 'pass',
    evidence: { httpStatus: 204 },
  })
}

function assertFreshPass(): void {
  const check = passiveDiagnostics.snapshot().find(item => item.id === 'observed:context-loader')
  assert.equal(check?.status, 'pass')
  assert.equal(check?.code, 'context-loader')
  assert.equal(check?.evidence.httpStatus, 204)
  assert.equal(check?.evidence.failureCount, 0)
}

test('inactive owners cannot reuse the published-tool fast path or refresh a client', async () => {
  for (const state of [3, 4, 5]) {
    let reads = 0
    const ctx = { fiber: { state }, tools: { get: () => { reads++; return {} } } }
    const manager = new OpenBknMcpManager(ctx as never, config as never, async () => 'fixture-token')
    await assert.rejects(manager.ensure(), /owner is no longer active/)
    await assert.rejects(manager.refresh(), /owner is no longer active/)
    assert.equal(reads, 0)
  }
})

test('a token resolving after owner disposal cannot mount or change the new diagnostic outcome', async () => {
  passiveDiagnostics.clear()
  const token = deferred<string>()
  const parent = { state: 2 }
  let mounts = 0
  const ctx = { fiber: parent, tools: { get: () => undefined }, plugin: () => { mounts++; throw new Error('must not mount') } }
  const manager = new OpenBknMcpManager(ctx as never, config as never, () => token.promise)
  const pending = manager.ensure()
  parent.state = 5
  freshPass()
  token.resolve('fixture-token')
  await assert.rejects(pending, /owner is no longer active/)
  assert.equal(mounts, 0)
  assertFreshPass()
})

test('a late successful mount is disposed and cannot overwrite the same-platform new owner', async () => {
  passiveDiagnostics.clear()
  const mounted = deferred<{ dispose(): Promise<void> }>()
  const started = deferred<void>()
  const parent = { state: 2 }
  let published = false
  let disposals = 0
  const ctx = {
    fiber: parent,
    tools: { get: (name: string) => published && name === REQUIRED_TOOL ? {} : undefined },
    plugin: async () => { started.resolve(); return await mounted.promise },
  }
  const manager = new OpenBknMcpManager(ctx as never, config as never, async () => 'fixture-token')
  const pending = manager.ensure()
  await started.promise
  parent.state = 4
  freshPass()
  published = true
  mounted.resolve({ dispose: async () => { disposals++; published = false } })
  await assert.rejects(pending, /owner is no longer active/)
  assert.equal(disposals, 1)
  assert.equal(published, false)
  assertFreshPass()
})

test('a late failed mount from a disposed owner is not classified as a new TLS failure', async () => {
  passiveDiagnostics.clear()
  const mounted = deferred<never>()
  const started = deferred<void>()
  const parent = { state: 2 }
  const ctx = {
    fiber: parent, tools: { get: () => undefined },
    plugin: async () => { started.resolve(); return await mounted.promise },
  }
  const manager = new OpenBknMcpManager(ctx as never, config as never, async () => 'fixture-token')
  const pending = manager.ensure()
  await started.promise
  parent.state = 5
  freshPass()
  mounted.reject(Object.assign(new Error('fixture TLS failure'), { code: 'DEPTH_ZERO_SELF_SIGNED_CERT' }))
  await assert.rejects(pending, /owner is no longer active/)
  assertFreshPass()
})

test('a dead owner after unpublished-client cleanup cannot record a startup failure', async () => {
  passiveDiagnostics.clear()
  const disposing = deferred<void>()
  const started = deferred<void>()
  const parent = { state: 2 }
  const ctx = {
    fiber: parent, tools: { get: () => undefined },
    plugin: async () => ({ dispose: async () => { started.resolve(); await disposing.promise } }),
  }
  const manager = new OpenBknMcpManager(ctx as never, config as never, async () => 'fixture-token')
  const pending = manager.ensure()
  await started.promise
  parent.state = 5
  freshPass()
  disposing.resolve()
  await assert.rejects(pending, /owner is no longer active/)
  assertFreshPass()
})

test('a live owner still mounts, reports success, and refreshes its owned client', async () => {
  passiveDiagnostics.clear()
  const parent = { state: 2 }
  let published = false
  let mounts = 0
  let disposals = 0
  const ctx = {
    fiber: parent,
    tools: { get: (name: string) => published && name === REQUIRED_TOOL ? {} : undefined },
    plugin: async () => {
      mounts++
      published = true
      return { dispose: async () => { disposals++; published = false } }
    },
  }
  const manager = new OpenBknMcpManager(ctx as never, config as never, async () => 'fixture-token')
  await manager.ensure()
  assert.equal(mounts, 1)
  assert.equal(passiveDiagnostics.snapshot().find(item => item.id === 'observed:context-loader')?.status, 'pass')
  await manager.refresh()
  assert.equal(mounts, 2)
  assert.equal(disposals, 1)
})
