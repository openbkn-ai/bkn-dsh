import assert from 'node:assert/strict'
import test from 'node:test'
import {
  codeOfObservation,
  configurationFieldOf,
  findOwnEntries,
  observeEntry,
  type LoaderEntryLike,
  type LoaderLike,
} from '../src/diagnostics-host-adapter.ts'

/** Fiber state numbers in the pinned cordis 4.0.4 order. */
const STATES = { PENDING: 0, LOADING: 1, ACTIVE: 2, FAILED: 3, DISPOSED: 4, UNLOADING: 5 } as const

function entryWith(fiber: LoaderEntryLike['fiber'], id = 'openbkn-business-context'): LoaderEntryLike {
  return { options: { id, name: '@openbkn/dsh-business-context' }, fiber }
}

test('a missing fiber classifies as module resolution failure', async () => {
  assert.deepEqual(await observeEntry(entryWith(undefined)), { kind: 'module-resolution-failed' })
})

test('a settled active fiber classifies as loaded', async () => {
  const observation = await observeEntry(entryWith({ state: STATES.ACTIVE, async await() { return undefined } }))
  assert.deepEqual(observation, { kind: 'active' })
})

test('a failed fiber rethrows through await() and classifies validation errors', async () => {
  const validationError = Object.assign(new Error('$.baseUrl missing required value'), { name: 'ValidationError' })
  const observation = await observeEntry(entryWith({ state: STATES.FAILED, async await() { throw validationError } }))
  assert.deepEqual(observation, { kind: 'configuration-invalid', field: 'baseUrl' })
})

test('a failed fiber with an unknown error classifies as initialization failure', async () => {
  const observation = await observeEntry(entryWith({
    state: STATES.FAILED,
    async await() { throw new Error('ECONNREFUSED 127.0.0.1:443 secret-host') },
  }))
  assert.deepEqual(observation, { kind: 'initialization-failed' })
})

test('a fiber that never settles within the budget reports waiting', async () => {
  const observation = await observeEntry(entryWith({
    state: STATES.PENDING,
    await() { return new Promise(() => undefined) },
  }), 20)
  assert.deepEqual(observation, { kind: 'waiting-services' })
})

test('a recovered fiber reports active rather than a stale failure', async () => {
  // State says failed, but await() resolves: the recorded error was cleared.
  const observation = await observeEntry(entryWith({ state: STATES.ACTIVE, async await() { return undefined } }))
  assert.deepEqual(observation, { kind: 'active' })
})

test('field extraction only whitelists known config field names', () => {
  assert.equal(configurationFieldOf(new Error('$.cliPath is not a string')), 'cliPath')
  assert.equal(configurationFieldOf(new Error('$.evilField must be a string')), null)
  assert.equal(configurationFieldOf('not an error'), null)
  assert.equal(configurationFieldOf(null), null)
})

test('findOwnEntries picks this package’s two rows out of a loader tree', () => {
  const loader: LoaderLike = {
    *entries(): Generator<LoaderEntryLike> {
      yield entryWith({ state: STATES.ACTIVE, async await() { return undefined } }, 'other-plugin')
      yield entryWith({ state: STATES.ACTIVE, async await() { return undefined } })
      yield entryWith({ state: STATES.ACTIVE, async await() { return undefined } }, 'openbkn-business-context-diagnostics')
    },
  }
  const found = findOwnEntries(loader)
  assert.equal(found.business?.options.id, 'openbkn-business-context')
  assert.equal(found.diagnostics?.options.id, 'openbkn-business-context-diagnostics')
})

test('observations map onto the frozen code table', () => {
  assert.equal(codeOfObservation({ kind: 'active' }), 'component-loaded')
  assert.equal(codeOfObservation({ kind: 'module-resolution-failed' }), 'module-resolution-failed')
  assert.equal(codeOfObservation({ kind: 'configuration-invalid', field: null }), 'configuration-invalid')
  assert.equal(codeOfObservation({ kind: 'initialization-failed' }), 'initialization-failed')
  assert.equal(codeOfObservation({ kind: 'waiting-services' }), 'component-waiting-services')
  assert.equal(codeOfObservation({ kind: 'unknown-state', state: 9 }), 'component-unknown-state')
})
