import assert from 'node:assert/strict'
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  bindDshSessionBusinessNetwork,
  inheritForkedBusinessNetwork,
  readDshSessionBusinessNetwork,
  type SessionBindingRecords,
} from '../src/dsh-session-binding.ts'
import { SessionBindingStore, type SessionBindingRecord } from '../src/session-binding-store.ts'

const supply = { platformBaseUrl: 'https://poc.openbkn.ai', knowledgeNetworkId: 'kn-supply', displayName: '供应链风险网络' }
const other = { platformBaseUrl: 'https://poc.openbkn.ai', knowledgeNetworkId: 'kn-other', displayName: 'Other' }

function memoryRecords(initial: SessionBindingRecord[] = []) {
  const records = new Map(initial.map(record => [record.sessionId, record]))
  const writes: SessionBindingRecord[] = []
  const store: SessionBindingRecords & { writes: SessionBindingRecord[]; failNext?: Error } = {
    writes,
    read: sessionId => records.get(sessionId),
    async write(record) {
      if (store.failNext !== undefined) {
        const error = store.failNext
        delete store.failNext
        throw error
      }
      writes.push(record)
      records.set(record.sessionId, record)
    },
  }
  return store
}

function session(id: string, events: { type: string; data: unknown }[] = [], fork?: { parentSession?: string; isSeeded?: boolean; inheritedEventCount?: number }) {
  return {
    id,
    snapshotEvents: () => events,
    header: { ...(fork?.parentSession === undefined ? {} : { parentSession: fork.parentSession }), isSeeded: fork?.isSeeded ?? false },
    inheritedEventCount: fork?.inheritedEventCount ?? 0,
  }
}

const record = (sessionId: string, binding = supply, boundAtSeq = 3): SessionBindingRecord =>
  ({ schemaVersion: 1, sessionId, binding, boundAtSeq, recordedAt: '2026-09-29T00:00:00.000Z' })

test('persists a new binding as a plugin record and never touches the session log', async () => {
  const records = memoryRecords()
  const events = [{ type: 'turn/start', data: {} }, { type: 'turn/end', data: {} }]
  const result = await bindDshSessionBusinessNetwork(session('session-a', events), records, { ...supply, platformBaseUrl: 'https://poc.openbkn.ai/' })

  assert.deepEqual(result, { kind: 'bound', binding: supply })
  assert.equal(records.writes.length, 1)
  assert.deepEqual({ ...records.writes[0], recordedAt: 'x' }, { ...record('session-a', supply, 2), recordedAt: 'x' })
  assert.equal(events.length, 2)
  assert.deepEqual(readDshSessionBusinessNetwork(session('session-a'), records), supply)
})

test('a failed write rejects and leaves the session unbound', async () => {
  const records = memoryRecords()
  records.failNext = new Error('disk full')
  await assert.rejects(bindDshSessionBusinessNetwork(session('session-a'), records, supply), /disk full/)
  assert.equal(readDshSessionBusinessNetwork(session('session-a'), records), undefined)
})

test('reselecting the bound network writes nothing; a different network is a conflict', async () => {
  const records = memoryRecords([record('session-a')])
  assert.deepEqual(await bindDshSessionBusinessNetwork(session('session-a'), records, supply), { kind: 'already-bound', binding: supply })
  await assert.rejects(bindDshSessionBusinessNetwork(session('session-a'), records, other), /already bound/)
  assert.equal(records.writes.length, 0)
})

test('reads a binding event an earlier release left in the log, under its original or migrated name', () => {
  for (const type of ['openbkn/business-network-bound', 'plugin:openbkn/business-network-bound']) {
    assert.deepEqual(readDshSessionBusinessNetwork(session('session-a', [{ type, data: supply }]), memoryRecords()), supply, type)
  }
})

test('a log event and a plugin record that disagree are reported, never silently resolved', () => {
  const logged = session('session-a', [{ type: 'openbkn/business-network-bound', data: supply }])
  assert.throws(() => readDshSessionBusinessNetwork(logged, memoryRecords([record('session-a', other)])), /already bound/)
  assert.deepEqual(readDshSessionBusinessNetwork(logged, memoryRecords([record('session-a', supply)])), supply)
})

test('a fork inherits the parent binding only when its copied prefix reaches the bind point', async () => {
  const parent = record('session-parent', supply, 5)

  const reaching = memoryRecords([parent])
  assert.deepEqual(await inheritForkedBusinessNetwork(session('session-child', [], { parentSession: 'session-parent', isSeeded: true, inheritedEventCount: 6 }), reaching), supply)
  assert.deepEqual(reaching.writes.map(write => [write.sessionId, write.boundAtSeq]), [['session-child', 5]])

  const before = memoryRecords([parent])
  assert.equal(await inheritForkedBusinessNetwork(session('session-child', [], { parentSession: 'session-parent', isSeeded: true, inheritedEventCount: 5 }), before), undefined)
  assert.equal(before.writes.length, 0)
})

test('a freshly spawned child (not seeded from the parent log) inherits nothing', async () => {
  const records = memoryRecords([record('session-parent')])
  assert.equal(await inheritForkedBusinessNetwork(session('session-child', [], { parentSession: 'session-parent', isSeeded: false, inheritedEventCount: 0 }), records), undefined)
  assert.equal(records.writes.length, 0)
})

test('a fork that already has its own binding keeps it', async () => {
  const records = memoryRecords([record('session-parent', supply), record('session-child', other, 1)])
  assert.equal(await inheritForkedBusinessNetwork(session('session-child', [], { parentSession: 'session-parent', isSeeded: true, inheritedEventCount: 9 }), records), undefined)
  assert.deepEqual(readDshSessionBusinessNetwork(session('session-child'), records), other)
})

test('the file store round-trips one record per session and leaves no temporary files', async () => {
  const root = mkdtempSync(join(tmpdir(), 'openbkn-bindings-'))
  try {
    const store = new SessionBindingStore(join(root, 'bindings'))
    assert.equal(store.read('session-a'), undefined)
    await store.write(record('session-a'))
    await store.write(record('session-b', other))
    assert.deepEqual(store.read('session-a'), record('session-a'))
    assert.deepEqual(store.read('session-b'), record('session-b', other))
    assert.deepEqual(readdirSync(join(root, 'bindings')).sort(), ['session-a.json', 'session-b.json'])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('the file store fails closed on malformed, foreign, or unsafe records', async () => {
  const root = mkdtempSync(join(tmpdir(), 'openbkn-bindings-'))
  try {
    const store = new SessionBindingStore(root)
    writeFileSync(join(root, 'session-bad.json'), '{not json')
    assert.throws(() => store.read('session-bad'), (error: Error) => error.message.includes(join(root, 'session-bad.json')))
    await store.write(record('session-a'))
    writeFileSync(join(root, 'session-b.json'), JSON.stringify(record('session-a')))
    assert.throws(() => store.read('session-b'), /malformed/)
    assert.throws(() => store.read('../escape'), /not path-safe/)
    await assert.rejects(store.write(record('a/b')), /not path-safe/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
