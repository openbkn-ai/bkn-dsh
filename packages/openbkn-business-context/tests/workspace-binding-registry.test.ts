import assert from 'node:assert/strict'
import test from 'node:test'
import { workspaceBindingKey, workspaceBindingRecord } from '../src/workspace-binding-registry.ts'

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
    workspacePath: '/Users/leecky/Documents/DSH-work/supply-risk',
    updatedAt: '2026-09-05T00:00:00.000Z',
  })
  assert.equal(parsed.workspacePath, '/Users/leecky/Documents/DSH-work/supply-risk')
  assert.throws(() => workspaceBindingRecord.parse({ ...parsed, workspacePath: 'relative/path' }))
})
