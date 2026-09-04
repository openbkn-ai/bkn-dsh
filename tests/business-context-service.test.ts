import assert from 'node:assert/strict'
import test from 'node:test'
import { OpenBknBusinessContextService } from '../src/business-context-service.ts'

const config = {
  baseUrl: 'https://poc.openbkn.ai', runnerPath: 'python3', requestTimeoutMs: 30_000,
  maxResultBytes: 1_024, allowInsecureTls: false,
}

function serviceFor(agent: object) {
  const service = Object.create(OpenBknBusinessContextService.prototype) as {
    config: typeof config
    ctx: { agents: { get(id: string): object | undefined } }
    mountIfBound(agent: object): void
    bind(agent: object, requested: { platformBaseUrl: string; knowledgeNetworkId: string; displayName: string }): unknown
  }
  service.config = config
  service.ctx = { agents: { get: () => agent } }
  service.mountIfBound = () => {}
  return service
}

test('rejects a mismatched platform before it can append an immutable DSH session binding', () => {
  const appended: unknown[] = []
  const agent = {
    id: 'session-1',
    session: {
      snapshotEvents: () => [],
      append: (type: string, data: unknown) => { appended.push({ type, data }) },
    },
  }
  const service = serviceFor(agent)

  assert.throws(() => service.bind(agent, {
    platformBaseUrl: 'https://other.openbkn.ai', knowledgeNetworkId: 'kn-other', displayName: 'Other',
  }), /configured OpenBKN platform/i)
  assert.deepEqual(appended, [])
})

test('rejects a stale or foreign Agent before it can mutate a DSH session', () => {
  const agent = {
    id: 'session-1',
    session: { snapshotEvents: () => [], append: () => { throw new Error('must not append') } },
  }
  const service = serviceFor({ id: 'session-1' })

  assert.throws(() => service.bind(agent, {
    platformBaseUrl: 'https://poc.openbkn.ai', knowledgeNetworkId: 'kn-supply', displayName: 'Supply',
  }), /not a live/i)
})
