import assert from 'node:assert/strict'
import test from 'node:test'
import { applyOpenBknContextTools } from '../src/openbkn-context-tools.ts'

function contextWithBinding() {
  const registered: Array<{ name: string; parameters: unknown; execute: (args: unknown, exec: unknown) => Promise<unknown> }> = []
  let spawnCount = 0
  const ctx = {
    tools: { register: (tool: (typeof registered)[number]) => { registered.push(tool); return () => {} } },
    subprocess: {
      spawn: () => {
        spawnCount += 1
        return {
          done: Promise.resolve({ exitCode: 0, signal: null }),
          collected: {
            stdout: { readFrom: () => ({ text: JSON.stringify({ version: 1, ok: true, result: { id: 'kn-supply' } }), lossy: false }) },
            stderr: { readFrom: () => ({ text: '', lossy: false }) },
          },
        }
      },
    },
  }
  const session = {
    header: { cwd: '/workspace' },
    snapshotEvents: () => [{
      type: 'openbkn/business-network-bound',
      data: { platformBaseUrl: 'https://poc.openbkn.ai', knowledgeNetworkId: 'kn-supply', displayName: '供应链风险网络' },
    }],
  }
  return { ctx, session, registered, spawnCount: () => spawnCount }
}

test('registers one no-argument business-context tool that derives its network only from the DSH session', async () => {
  const fixture = contextWithBinding()
  applyOpenBknContextTools(fixture.ctx, {
    baseUrl: 'https://poc.openbkn.ai', runnerPath: 'python3', requestTimeoutMs: 30_000,
    maxResultBytes: 1_024, allowInsecureTls: false,
  })

  assert.equal(fixture.registered.length, 1)
  const tool = fixture.registered[0]
  assert.equal(tool.name, 'openbkn_get_business_network_context')
  assert.deepEqual(tool.parameters, { type: 'object', properties: {} })
  assert.deepEqual(await tool.execute({}, { signal: AbortSignal.timeout(1_000), agent: { session: fixture.session } }), { id: 'kn-supply' })
  assert.equal(fixture.spawnCount(), 1)
})

test('refuses an unbound session before a runner process is created', async () => {
  const fixture = contextWithBinding()
  applyOpenBknContextTools(fixture.ctx, {
    baseUrl: 'https://poc.openbkn.ai', runnerPath: 'python3', requestTimeoutMs: 30_000,
    maxResultBytes: 1_024, allowInsecureTls: false,
  })

  await assert.rejects(
    fixture.registered[0].execute({}, { signal: AbortSignal.timeout(1_000), agent: { session: { header: {}, snapshotEvents: () => [] } } }),
    /not bound/i,
  )
  assert.equal(fixture.spawnCount(), 0)
})
