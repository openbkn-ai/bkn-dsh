import assert from 'node:assert/strict'
import test from 'node:test'
import { OpenBknBusinessContextService } from '../src/business-context-service.ts'

const config = {
  baseUrl: 'https://poc.openbkn.ai', requestTimeoutMs: 30_000,
  maxResultBytes: 1_024, allowInsecureTls: false,
}

test('does not load the DSH LLM service for a static empty-session entry', () => {
  assert.equal(OpenBknBusinessContextService.inject.includes('llm'), false)
})

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

test('stores a token through DSH credentials before testing the managed OpenBKN connection', async () => {
  let saved: string | undefined
  let tested = 0
  const service = Object.create(OpenBknBusinessContextService.prototype) as {
    ctx: { credentials: { set(ref: string, value: string): Promise<void> } }
    refreshMcpConnection(): Promise<void>
    listNetworksAfterAuthentication(signal: AbortSignal): Promise<readonly unknown[]>
    remoteConfigureToken(token: string, signal: AbortSignal): Promise<readonly unknown[]>
  }
  service.ctx = { credentials: { set: async (_ref, value) => { saved = value } } }
  service.refreshMcpConnection = async () => { tested += 1 }
  service.listNetworksAfterAuthentication = async () => [{ id: 'kn-supply' }]

  const networks = await service.remoteConfigureToken('  managed-token-value  ', AbortSignal.timeout(1_000))

  assert.equal(saved, 'managed-token-value')
  assert.equal(tested, 1)
  assert.deepEqual(networks, [{ id: 'kn-supply' }])
})

test('synchronizes an authenticated CLI token into DSH credentials before reporting ready', async () => {
  let saved: string | undefined
  let refreshed = 0
  const service = Object.create(OpenBknBusinessContextService.prototype) as {
    config: typeof config
    ctx: { credentials: { set(ref: string, value: string): Promise<void>; describe(ref: string): Promise<{ configured: boolean }> } }
    authCoordinator(): { status(signal: AbortSignal): Promise<unknown>; readToken(signal: AbortSignal): Promise<string> }
    refreshMcpConnection(): Promise<void>
    remoteStatus(signal: AbortSignal): Promise<unknown>
  }
  service.config = config
  service.ctx = { credentials: {
    set: async (_ref, value) => { saved = value },
    describe: async () => ({ configured: false }),
  } }
  service.authCoordinator = () => ({
    status: async () => ({ kind: 'authenticated', baseUrl: config.baseUrl }),
    readToken: async () => 'cli-token-value',
  })
  service.refreshMcpConnection = async () => { refreshed += 1 }

  assert.deepEqual(await service.remoteStatus(AbortSignal.timeout(1_000)), {
    kind: 'authenticated', baseUrl: config.baseUrl,
  })
  assert.equal(saved, 'cli-token-value')
  assert.equal(refreshed, 1)
})

test('refreshes the managed MCP credential before the first step of a bound business turn', async () => {
  let synchronized = 0
  let delegated = 0
  const service = Object.create(OpenBknBusinessContextService.prototype) as {
    remoteStatus(signal: AbortSignal): Promise<unknown>
    refreshManagedMcpAtTurnStart(
      agent: { session: { snapshotEvents(): readonly unknown[] } },
      step: number,
      signal: AbortSignal,
      next: () => Promise<{ readonly kind: 'enter' }>,
    ): Promise<{ readonly kind: 'enter' }>
  }
  service.remoteStatus = async () => { synchronized += 1; return { kind: 'authenticated', baseUrl: config.baseUrl } }
  const agent = {
    session: {
      snapshotEvents: () => [{
        type: 'openbkn/business-network-bound',
        data: { platformBaseUrl: config.baseUrl, knowledgeNetworkId: 'kn-supply', displayName: 'Supply' },
      }],
    },
  }

  const result = await service.refreshManagedMcpAtTurnStart(
    agent,
    1,
    AbortSignal.timeout(1_000),
    async () => { delegated += 1; return { kind: 'enter' } },
  )

  assert.deepEqual(result, { kind: 'enter' })
  assert.equal(synchronized, 1)
  assert.equal(delegated, 1)
})

test('does not refresh the MCP connection for later steps or unbound sessions', async () => {
  let synchronized = 0
  const service = Object.create(OpenBknBusinessContextService.prototype) as {
    remoteStatus(signal: AbortSignal): Promise<unknown>
    refreshManagedMcpAtTurnStart(
      agent: { session: { snapshotEvents(): readonly unknown[] } },
      step: number,
      signal: AbortSignal,
      next: () => Promise<{ readonly kind: 'enter' }>,
    ): Promise<{ readonly kind: 'enter' }>
  }
  service.remoteStatus = async () => { synchronized += 1; return { kind: 'authenticated', baseUrl: config.baseUrl } }
  const next = async () => ({ kind: 'enter' as const })
  const unboundAgent = { session: { snapshotEvents: () => [] } }

  await service.refreshManagedMcpAtTurnStart(unboundAgent, 1, AbortSignal.timeout(1_000), next)
  await service.refreshManagedMcpAtTurnStart(unboundAgent, 2, AbortSignal.timeout(1_000), next)

  assert.equal(synchronized, 0)
})

test('auto-binds a new native DSH session when its workspace has one OpenBKN association', () => {
  let bound: unknown
  let mounted = 0
  const agent = { id: 'session-1', session: { header: { cwd: '/Users/leecky/Documents/DSH_work/bkn-dsh' }, snapshotEvents: () => [] } }
  const service = Object.create(OpenBknBusinessContextService.prototype) as {
    config: typeof config
    ctx: { openbknWorkspaceBindingRegistry: { findUniqueByWorkspace(baseUrl: string, path: string): unknown } }
    bind(agent: object, binding: unknown): unknown
    mountIfBound(agent: object): void
    bindWorkspaceNetworkIfUnique(agent: object): void
  }
  service.config = config
  service.ctx = { openbknWorkspaceBindingRegistry: {
    findUniqueByWorkspace: () => ({
      knowledgeNetworkId: 'kn-supply', displayName: 'Supply network', workspacePath: agent.session.header.cwd,
    }),
  } }
  service.bind = (_agent, binding) => { bound = binding }
  service.mountIfBound = () => { mounted += 1 }

  service.bindWorkspaceNetworkIfUnique(agent)

  assert.deepEqual(bound, {
    platformBaseUrl: config.baseUrl,
    knowledgeNetworkId: 'kn-supply',
    displayName: 'Supply network',
  })
  assert.equal(mounted, 0)
})

test('leaves a native DSH session unbound when its workspace has no unique association', () => {
  let bound = 0
  let mounted = 0
  const agent = { id: 'session-1', session: { header: { cwd: '/Users/leecky/Documents/DSH_work/bkn-dsh' }, snapshotEvents: () => [] } }
  const service = Object.create(OpenBknBusinessContextService.prototype) as {
    config: typeof config
    ctx: { openbknWorkspaceBindingRegistry: { findUniqueByWorkspace(baseUrl: string, path: string): undefined } }
    bind(agent: object, binding: unknown): unknown
    mountIfBound(agent: object): void
    bindWorkspaceNetworkIfUnique(agent: object): void
  }
  service.config = config
  service.ctx = { openbknWorkspaceBindingRegistry: { findUniqueByWorkspace: () => undefined } }
  service.bind = () => { bound += 1 }
  service.mountIfBound = () => { mounted += 1 }

  service.bindWorkspaceNetworkIfUnique(agent)

  assert.equal(bound, 0)
  assert.equal(mounted, 1)
})

test('reads the durable binding for one live session without consulting CLI credentials', async () => {
  const agent = {
    id: 'session-1',
    session: { snapshotEvents: () => [{ type: 'openbkn/business-network-bound', data: {
      platformBaseUrl: 'https://poc.openbkn.ai', knowledgeNetworkId: 'kn-supply', displayName: 'Supply risk',
    } }] },
  }
  const service = Object.create(OpenBknBusinessContextService.prototype) as {
    ctx: { agents: { get(sessionId: string): typeof agent | undefined } }
    remoteGetNetworkBinding(sessionId: string): unknown
  }
  service.ctx = { agents: { get: sessionId => sessionId === 'session-1' ? agent : undefined } }

  assert.deepEqual(service.remoteGetNetworkBinding('session-1'), {
    platformBaseUrl: 'https://poc.openbkn.ai', knowledgeNetworkId: 'kn-supply', displayName: 'Supply risk',
  })
  assert.throws(() => service.remoteGetNetworkBinding('stale-session'), /not a live/i)
})

test('reads provenance only from the finalized assistant message in one live session', () => {
  const handle = {
    schemaVersion: 1 as const,
    interactionId: 'interaction-1',
    requestIds: [],
    traceIds: [],
    receiptIds: [],
    status: 'completed' as const,
    partial: true,
  }
  const agent = {
    id: 'session-1',
    session: { snapshotEvents: () => [{ type: 'openbkn/turn-provenance', data: {
      messageId: 'assistant-message-1', handle,
    } }] },
  }
  const service = Object.create(OpenBknBusinessContextService.prototype) as {
    ctx: { agents: { get(sessionId: string): typeof agent | undefined } }
    remoteGetTurnProvenance(sessionId: string, messageId: string): unknown
  }
  service.ctx = { agents: { get: sessionId => sessionId === 'session-1' ? agent : undefined } }

  assert.deepEqual(service.remoteGetTurnProvenance('session-1', 'assistant-message-1'), handle)
  assert.equal(service.remoteGetTurnProvenance('session-1', 'another-message'), undefined)
  assert.throws(() => service.remoteGetTurnProvenance('stale-session', 'assistant-message-1'), /not a live/i)
})

test('retains Community execution facts when the formal Enterprise projection is not disclosed', async () => {
  const handle = {
    schemaVersion: 1 as const, interactionId: 'int-123', requestIds: [], traceIds: [], receiptIds: [],
    status: 'completed' as const, partial: true,
  }
  const agent = {
    id: 'session-1',
    session: {
      header: { cwd: '/workspace' },
      snapshotEvents: () => [{ type: 'openbkn/turn-provenance', data: { messageId: 'assistant-message-1', handle } }],
    },
  }
  const service = Object.create(OpenBknBusinessContextService.prototype) as {
    config: typeof config & { maxGraphNodes: number; maxGraphEdges: number }
    ctx: { agents: { get(sessionId: string): typeof agent | undefined } }
    platformReader(): {
      getInteractionOperations(interactionId: string, signal: AbortSignal, cwd: string): Promise<unknown>
      getInteractionBusinessGraph(interactionId: string, signal: AbortSignal, cwd: string): Promise<unknown>
    }
    remoteGetTurnProvenanceView(sessionId: string, messageId: string, signal: AbortSignal): Promise<unknown>
  }
  service.config = { ...config, maxGraphNodes: 10, maxGraphEdges: 10 }
  service.ctx = { agents: { get: sessionId => sessionId === 'session-1' ? agent : undefined } }
  const calls: unknown[] = []
  service.platformReader = () => ({
    getInteractionOperations: async (interactionId, _signal, cwd) => {
      calls.push({ kind: 'operations', interactionId, cwd })
      return { entries: [{ operation_id: 'op-1', tool_name: 'query_metric' }] }
    },
    getInteractionBusinessGraph: async (_interactionId, _signal, cwd) => {
      calls.push({ kind: 'enterprise', cwd })
      throw new Error('Enterprise provenance is not disclosed')
    },
  })

  const view = await service.remoteGetTurnProvenanceView('session-1', 'assistant-message-1', AbortSignal.timeout(1_000))

  assert.deepEqual(calls, [
    { kind: 'operations', interactionId: 'int-123', cwd: '/workspace' },
    { kind: 'enterprise', cwd: '/workspace' },
  ])
  assert.deepEqual(view, {
    interactionId: 'int-123',
    execution: { status: 'completed', operations: [{ id: 'op-1', label: 'query_metric', protocol: undefined, status: undefined, startedAt: undefined, finishedAt: undefined, requestId: undefined, traceId: undefined, receiptId: undefined }] },
    business: { kind: 'unavailable' },
    evidence: { kind: 'unavailable' },
  })
})

test('retains Community execution facts when an enabled Enterprise projection is temporarily unavailable', async () => {
  const handle = {
    schemaVersion: 1 as const, interactionId: 'int-123', requestIds: [], traceIds: [], receiptIds: [],
    status: 'completed' as const, partial: true,
  }
  const agent = {
    id: 'session-1',
    session: {
      header: { cwd: '/workspace' },
      snapshotEvents: () => [{ type: 'openbkn/turn-provenance', data: { messageId: 'assistant-message-1', handle } }],
    },
  }
  const service = Object.create(OpenBknBusinessContextService.prototype) as {
    config: typeof config & { maxGraphNodes: number; maxGraphEdges: number }
    ctx: { agents: { get(sessionId: string): typeof agent | undefined } }
    platformReader(): {
      getInteractionOperations(interactionId: string, signal: AbortSignal, cwd: string): Promise<unknown>
      getInteractionBusinessGraph(interactionId: string, signal: AbortSignal, cwd: string): Promise<unknown>
    }
    remoteGetTurnProvenanceView(sessionId: string, messageId: string, signal: AbortSignal): Promise<unknown>
  }
  service.config = { ...config, maxGraphNodes: 10, maxGraphEdges: 10 }
  service.ctx = { agents: { get: sessionId => sessionId === 'session-1' ? agent : undefined } }
  service.platformReader = () => ({
    getInteractionOperations: async () => ({ entries: [{ operation_id: 'op-1', tool_name: 'query_metric' }] }),
    getInteractionBusinessGraph: async () => { throw new Error('business graph is not ready') },
  })

  const view = await service.remoteGetTurnProvenanceView('session-1', 'assistant-message-1', AbortSignal.timeout(1_000))

  assert.deepEqual(view, {
    interactionId: 'int-123',
    execution: { status: 'completed', operations: [{ id: 'op-1', label: 'query_metric', protocol: undefined, status: undefined, startedAt: undefined, finishedAt: undefined, requestId: undefined, traceId: undefined, receiptId: undefined }] },
    business: { kind: 'unavailable' },
    evidence: { kind: 'unavailable' },
  })
})

test('uses the formal Trace 3 business graph without treating BKN Safe capabilities as its gate', async () => {
  const handle = {
    schemaVersion: 1 as const, interactionId: 'int-123', requestIds: [], traceIds: [], receiptIds: [],
    status: 'completed' as const, partial: true,
  }
  const agent = {
    id: 'session-1',
    session: {
      header: { cwd: '/workspace' },
      snapshotEvents: () => [{ type: 'openbkn/turn-provenance', data: { messageId: 'assistant-message-1', handle } }],
    },
  }
  const service = Object.create(OpenBknBusinessContextService.prototype) as {
    config: typeof config & { maxGraphNodes: number; maxGraphEdges: number }
    ctx: { agents: { get(sessionId: string): typeof agent | undefined } }
    platformReader(): {
      getInteractionOperations(interactionId: string, signal: AbortSignal, cwd: string): Promise<unknown>
      getInteractionBusinessGraph(interactionId: string, signal: AbortSignal, cwd: string): Promise<unknown>
    }
    remoteGetTurnProvenanceView(sessionId: string, messageId: string, signal: AbortSignal): Promise<unknown>
  }
  service.config = { ...config, maxGraphNodes: 10, maxGraphEdges: 10 }
  service.ctx = { agents: { get: sessionId => sessionId === 'session-1' ? agent : undefined } }
  service.platformReader = () => ({
    getInteractionOperations: async () => { throw new Error('Core route is unavailable on this deployment') },
    getInteractionBusinessGraph: async () => ({
      interaction_id: 'int-123',
      assembly: { operation_business_edges: [{
        operation_id: 'op-1', role: 'read',
        business_ref: { technical_ref: { ref_id: 'object_type:kn-supply:supplier', ref_type: 'object_type' }, display: { name: '供应商' } },
      }] },
    }),
  })

  const view = await service.remoteGetTurnProvenanceView('session-1', 'assistant-message-1', AbortSignal.timeout(1_000))

  assert.deepEqual(view, {
    interactionId: 'int-123',
    execution: { status: 'completed', operations: [] },
    business: { kind: 'ready', operations: [{ id: 'op-1', attempt: 0, toolName: 'OpenBKN operation', status: 'resolved', elements: [{ id: 'object_type:kn-supply:supplier', kind: 'object', name: '供应商' }], missingFacts: [] }], conversationContext: [], derivedFacts: [], contextRelations: [] },
    evidence: { kind: 'unavailable' },
  })
})

test('returns one introduction only before a bound session has an assistant answer', () => {
  const agent = {
    id: 'session-1',
    session: { snapshotEvents: () => [{ type: 'openbkn/business-network-bound', data: {
      platformBaseUrl: 'https://poc.openbkn.ai', knowledgeNetworkId: 'kn-supply', displayName: 'Supply risk',
    } }] },
  }
  const service = Object.create(OpenBknBusinessContextService.prototype) as {
    ctx: { agents: { get(sessionId: string): typeof agent | undefined } }
    remoteGetSessionSuggestions(sessionId: string): readonly string[]
  }
  service.ctx = { agents: { get: sessionId => sessionId === 'session-1' ? agent : undefined } }

  assert.deepEqual(service.remoteGetSessionSuggestions('session-1'), ['了解「Supply risk」知识网络。'])
  assert.throws(() => service.remoteGetSessionSuggestions('stale-session'), /not a live/i)
})

test('returns no prompt after a bound business session has an assistant answer', () => {
  const agent = {
    id: 'session-1',
    session: { snapshotEvents: () => [
      { type: 'openbkn/business-network-bound', data: {
        platformBaseUrl: 'https://poc.openbkn.ai', knowledgeNetworkId: 'kn-supply', displayName: 'Supply risk',
      } },
      { type: 'assistant/message', data: { message: { id: 'answer' } } },
    ] },
  }
  const service = Object.create(OpenBknBusinessContextService.prototype) as {
    ctx: { agents: { get(sessionId: string): typeof agent | undefined } }
    remoteGetSessionSuggestions(sessionId: string): readonly string[]
  }
  service.ctx = { agents: { get: sessionId => sessionId === 'session-1' ? agent : undefined } }

  assert.deepEqual(service.remoteGetSessionSuggestions('session-1'), [])
})

test('returns only a safe network catalogue after confirming the CLI identity is authenticated', async () => {
  let signalSeen: AbortSignal | undefined
  const service = Object.create(OpenBknBusinessContextService.prototype) as {
    config: typeof config
    ctx: { openbknWorkspaceBindingRegistry: { get(baseUrl: string, networkId: string): undefined } }
    remoteStatus(signal: AbortSignal): Promise<{ kind: 'authenticated'; baseUrl: string }>
    platformReader(): { listKnowledgeNetworks(signal: AbortSignal, cwd: string): Promise<unknown> }
    remoteListNetworks(signal: AbortSignal): Promise<unknown>
  }
  service.config = config
  service.ctx = { openbknWorkspaceBindingRegistry: { get: () => undefined } }
  service.remoteStatus = async () => ({ kind: 'authenticated', baseUrl: 'https://poc.openbkn.ai' })
  service.platformReader = () => ({
    listKnowledgeNetworks: async (signal, cwd) => {
      signalSeen = signal
      assert.equal(cwd, '.')
      return { entries: [{ id: 'kn-supply', name: 'Supply risk', description: 'Delivery risk' }] }
    },
  })
  const signal = AbortSignal.timeout(1_000)

  assert.deepEqual(await service.remoteListNetworks(signal), [
    { id: 'kn-supply', displayName: 'Supply risk', description: 'Delivery risk' },
  ])
  assert.equal(signalSeen, signal)
})

test('refuses to list networks while OpenBKN authentication is not active', async () => {
  const service = Object.create(OpenBknBusinessContextService.prototype) as {
    remoteStatus(signal: AbortSignal): Promise<{ kind: 'authentication-required'; baseUrl: string }>
    platformReader(): never
    remoteListNetworks(signal: AbortSignal): Promise<unknown>
  }
  service.remoteStatus = async () => ({ kind: 'authentication-required', baseUrl: 'https://poc.openbkn.ai' })
  service.platformReader = () => { throw new Error('runner must not start') }

  await assert.rejects(service.remoteListNetworks(AbortSignal.timeout(1_000)), /authentication/i)
})

test('binds only a network confirmed in the current identity catalogue', async () => {
  const agent = { id: 'session-1' }
  let requested: unknown
  const service = Object.create(OpenBknBusinessContextService.prototype) as {
    config: typeof config
    ctx: { agents: { get(sessionId: string): object | undefined }; logger: { warn(): void } }
    remoteStatus(signal: AbortSignal): Promise<{ kind: 'authenticated'; baseUrl: string }>
    platformReader(): { listKnowledgeNetworks(signal: AbortSignal, cwd: string): Promise<unknown> }
    bind(agent: object, request: unknown): { kind: 'bound'; event: { data: unknown } }
    remoteBindNetwork(sessionId: string, networkId: string, signal: AbortSignal): Promise<unknown>
  }
  service.config = config
  service.ctx = { agents: { get: sessionId => sessionId === 'session-1' ? agent : undefined }, logger: { warn: () => {} } }
  service.remoteStatus = async () => ({ kind: 'authenticated', baseUrl: 'https://poc.openbkn.ai' })
  service.platformReader = () => ({ listKnowledgeNetworks: async () => ({
    entries: [{ id: 'kn-supply', name: 'Supply risk', comment: 'Delivery risk' }],
  }) })
  service.bind = (candidate, request) => {
    assert.equal(candidate, agent)
    requested = request
    return { kind: 'bound', event: { data: request } }
  }

  assert.deepEqual(await service.remoteBindNetwork('session-1', 'kn-supply', AbortSignal.timeout(1_000)), {
    platformBaseUrl: 'https://poc.openbkn.ai', knowledgeNetworkId: 'kn-supply', displayName: 'Supply risk',
  })
  assert.deepEqual(requested, {
    platformBaseUrl: 'https://poc.openbkn.ai', knowledgeNetworkId: 'kn-supply', displayName: 'Supply risk',
  })
})

test('keeps binding available and records a safe diagnostic when the optional capability profile is unavailable', async () => {
  const agent = { id: 'session-1', session: { header: { cwd: '/workspace' } } }
  const warnings: string[] = []
  let requested: unknown
  const service = Object.create(OpenBknBusinessContextService.prototype) as {
    config: typeof config
    ctx: {
      agents: { get(sessionId: string): typeof agent | undefined }
      logger: { warn(format: string, code: string): void }
    }
    remoteStatus(signal: AbortSignal): Promise<{ kind: 'authenticated'; baseUrl: string }>
    platformReader(): {
      listKnowledgeNetworks(signal: AbortSignal, cwd: string): Promise<unknown>
      getKnowledgeNetworkDetail(binding: unknown, signal: AbortSignal, cwd: string): Promise<unknown>
    }
    bind(agent: object, request: unknown): { kind: 'bound'; event: { data: unknown } }
    remoteBindNetwork(sessionId: string, networkId: string, signal: AbortSignal): Promise<unknown>
  }
  service.config = config
  service.ctx = {
    agents: { get: sessionId => sessionId === 'session-1' ? agent : undefined },
    logger: { warn: (format, code) => { warnings.push(`${format} ${code}`) } },
  }
  service.remoteStatus = async () => ({ kind: 'authenticated', baseUrl: 'https://poc.openbkn.ai' })
  service.platformReader = () => ({
    listKnowledgeNetworks: async () => ({ entries: [{ id: 'kn-supply', name: 'Supply risk' }] }),
    getKnowledgeNetworkDetail: async () => { throw new Error('private platform detail') },
  })
  service.bind = (_agent, request) => {
    requested = request
    return { kind: 'bound', event: { data: request } }
  }

  const result = await service.remoteBindNetwork('session-1', 'kn-supply', AbortSignal.timeout(1_000))

  assert.deepEqual(result, requested)
  assert.equal(warnings.length, 1)
  assert.match(warnings[0] ?? '', /capability profile unavailable.*PROFILE_UNAVAILABLE/)
  assert.doesNotMatch(warnings[0] ?? '', /private platform detail/)
})

test('refuses a requested network that is not visible to the current identity', async () => {
  const service = Object.create(OpenBknBusinessContextService.prototype) as {
    remoteStatus(signal: AbortSignal): Promise<{ kind: 'authenticated'; baseUrl: string }>
    platformReader(): { listKnowledgeNetworks(signal: AbortSignal, cwd: string): Promise<unknown> }
    bind(): never
    remoteBindNetwork(agent: object, networkId: string, signal: AbortSignal): Promise<unknown>
  }
  service.remoteStatus = async () => ({ kind: 'authenticated', baseUrl: 'https://poc.openbkn.ai' })
  service.platformReader = () => ({ listKnowledgeNetworks: async () => ({ entries: [] }) })
  service.bind = () => { throw new Error('must not bind') }

  await assert.rejects(
    service.remoteBindNetwork({ id: 'session-1' }, 'kn-hidden', AbortSignal.timeout(1_000)),
    /not visible/i,
  )
})
