import assert from 'node:assert/strict'
import test from 'node:test'
import { OpenBknWorkspaceBindingRegistry, workspaceBindingKey, workspaceBindingRecord } from '../src/workspace-binding-registry.ts'

test('keys a workspace binding by normalized platform and knowledge network', () => {
  assert.equal(
    workspaceBindingKey('http://localhost:8081/', 'kn-supply'),
    workspaceBindingKey('http://localhost:8081', 'kn-supply'),
  )
})

test('accepts only a concrete, absolute local workspace mapping', () => {
  const parsed = workspaceBindingRecord.parse({
    platformBaseUrl: 'http://localhost:8081',
    knowledgeNetworkId: 'kn-supply',
    displayName: 'Supply network',
    workspacePath: '/Users/leecky/Documents/DSH-work/supply-risk',
    updatedAt: '2026-09-05T00:00:00.000Z',
  })
  assert.equal(parsed.workspacePath, '/Users/leecky/Documents/DSH-work/supply-risk')
  assert.equal(parsed.displayName, 'Supply network')
  assert.throws(() => workspaceBindingRecord.parse({ ...parsed, workspacePath: 'relative/path' }))
})

test('resolves the one network associated with a normalized workspace path', () => {
  const registry = registryWith([
    ['http://localhost:8081::kn-supply', record('kn-supply', '/Users/leecky/Documents/DSH_work/bkn-dsh')],
    ['http://localhost:8081::kn-other', record('kn-other', '/Users/leecky/Documents/DSH_work/other')],
  ])

  assert.deepEqual(
    registry.findUniqueByWorkspace('http://localhost:8081/', '/Users/leecky/Documents/DSH_work/./bkn-dsh/'),
    record('kn-supply', '/Users/leecky/Documents/DSH_work/bkn-dsh'),
  )
})

test('fails closed when a workspace has no association or more than one association', () => {
  const registry = registryWith([
    ['http://localhost:8081::kn-supply', record('kn-supply', '/Users/leecky/Documents/DSH_work/bkn-dsh')],
    ['http://localhost:8081::kn-other', record('kn-other', '/Users/leecky/Documents/DSH_work/bkn-dsh')],
  ])

  assert.equal(registry.findUniqueByWorkspace('http://localhost:8081', '/Users/leecky/Documents/DSH_work/missing'), undefined)
  assert.equal(registry.findUniqueByWorkspace('http://localhost:8081', '/Users/leecky/Documents/DSH_work/bkn-dsh'), undefined)
})

test('refuses to associate a second knowledge network with the same workspace', async () => {
  const registry = writableRegistryWith([
    ['http://localhost:8081::kn-supply', record('kn-supply', '/Users/leecky/Documents/DSH_work/bkn-dsh')],
  ])

  await assert.rejects(
    registry.put({
      platformBaseUrl: 'http://localhost:8081', knowledgeNetworkId: 'kn-other',
      workspacePath: '/Users/leecky/Documents/DSH_work/bkn-dsh',
    }),
    /already associated with another OpenBKN knowledge network/i,
  )
})

function record(knowledgeNetworkId: string, workspacePath: string) {
  return workspaceBindingRecord.parse({
    platformBaseUrl: 'http://localhost:8081', knowledgeNetworkId, workspacePath,
    updatedAt: '2026-09-06T00:00:00.000Z',
  })
}

function registryWith(entries: readonly [string, ReturnType<typeof record>][]) {
  const registry = Object.create(OpenBknWorkspaceBindingRegistry.prototype) as {
    table: { entries(): IterableIterator<[string, ReturnType<typeof record>]> }
    findUniqueByWorkspace(platformBaseUrl: string, workspacePath: string): ReturnType<typeof record> | undefined
  }
  registry.table = { entries: () => new Map(entries).entries() }
  return registry
}

function writableRegistryWith(entries: readonly [string, ReturnType<typeof record>][]) {
  const store = new Map(entries)
  const registry = Object.create(OpenBknWorkspaceBindingRegistry.prototype) as {
    table: {
      entries(): IterableIterator<[string, ReturnType<typeof record>]>
      put(key: string, value: ReturnType<typeof record>): Promise<void>
    }
    put(input: { platformBaseUrl: string; knowledgeNetworkId: string; workspacePath: string }): Promise<unknown>
  }
  registry.table = {
    entries: () => store.entries(),
    put: async (key, value) => { store.set(key, value) },
  }
  return registry
}
