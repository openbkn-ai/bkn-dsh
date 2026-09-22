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
  const stored = {
    schemaVersion: 1 as const,
    interactionId: 'interaction-1',
    requestIds: [],
    traceIds: [],
    receiptIds: [],
    status: 'completed' as const,
    partial: true,
  }
  const handle = {
    schemaVersion: 2 as const,
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
      messageId: 'assistant-message-1', handle: stored,
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
    schemaVersion: 2 as const, interactionId: 'int-123', requestIds: [], traceIds: [], receiptIds: [],
    status: 'completed' as const, partial: true, conversationId: 'conv-123', turn: 3,
  }
  const agent = {
    id: 'session-1',
    session: {
      header: { cwd: '/workspace' },
      snapshotEvents: () => [
        { type: 'openbkn/turn-provenance', data: { messageId: 'assistant-message-1', handle } },
        { type: 'user/message', time: 1_000, data: { turn: 3, message: { id: 'user-1', role: 'user', content: [{ type: 'text', text: 'How many orders?' }] } } },
        { type: 'tool/call', time: 1_100, data: { turn: 3, step: 1, callId: 'call-1', name: 'mcp__openbkn__bkn_start_interaction', arguments: '{"conversation_mode":"new"}' } },
        { type: 'tool/result', time: 1_140, data: { turn: 3, step: 1, message: { source: { kind: 'tool', callId: 'call-1' }, content: [{ type: 'tool-result', content: [{ type: 'text', text: '{"interaction_id":"int-123","conversation_id":"conv-123","execution_status":"in_progress"}' }] }] } } },
        { type: 'tool/call', time: 1_200, data: { turn: 3, step: 2, callId: 'call-2', name: 'mcp__openbkn__query_object_instance', arguments: '{}' } },
        { type: 'tool/result', time: 1_290, data: { turn: 3, step: 2, message: { source: { kind: 'tool', callId: 'call-2' }, content: [{ type: 'tool-result', content: [{ type: 'text', text: '{"nodes":[1,2,3]}' }] }] } } },
        { type: 'assistant/message', time: 1_500, data: { turn: 3, step: 3, message: { id: 'assistant-message-1', role: 'assistant', content: [{ type: 'text', text: 'Answer.' }] } } },
      ],
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
  service.ctx = { agents: { get: sessionId => sessionId === 'session-1' ? agent : undefined }, logger: { warn: () => {} } }
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
  assert.deepEqual(view.timeline.map(node => [node.kind, node.tool]), [
    ['question', undefined],
    ['lifecycle', 'bkn_start_interaction'],
    ['managed', 'query_object_instance'],
    ['answer', undefined],
  ])
  assert.deepEqual(view.execution.operations, [{ id: 'op-1', label: 'query_metric', protocol: undefined, status: undefined, startedAt: undefined, finishedAt: undefined, requestId: undefined, traceId: undefined, receiptId: undefined }])
  assert.deepEqual(view.business, { kind: 'unavailable' })
  assert.deepEqual(view.evidence, { kind: 'unavailable', reason: 'no-receipts' })
  assert.deepEqual(view.sources, {
    timeline: 'local-session', operations: 'platform', business: 'unavailable', evidence: 'unavailable',
    degraded: [{ pane: 'business', reason: 'platform-unavailable' }],
  })
})

test('retains Community execution facts when an enabled Enterprise projection is temporarily unavailable', async () => {
  const handle = {
    schemaVersion: 2 as const, interactionId: 'int-123', requestIds: [], traceIds: [], receiptIds: [],
    status: 'completed' as const, partial: true, conversationId: 'conv-123', turn: 3,
  }
  const agent = {
    id: 'session-1',
    session: {
      header: { cwd: '/workspace' },
      snapshotEvents: () => [
        { type: 'openbkn/turn-provenance', data: { messageId: 'assistant-message-1', handle } },
        { type: 'user/message', time: 1_000, data: { turn: 3, message: { id: 'user-1', role: 'user', content: [{ type: 'text', text: 'How many orders?' }] } } },
        { type: 'tool/call', time: 1_100, data: { turn: 3, step: 1, callId: 'call-1', name: 'mcp__openbkn__bkn_start_interaction', arguments: '{"conversation_mode":"new"}' } },
        { type: 'tool/result', time: 1_140, data: { turn: 3, step: 1, message: { source: { kind: 'tool', callId: 'call-1' }, content: [{ type: 'tool-result', content: [{ type: 'text', text: '{"interaction_id":"int-123","conversation_id":"conv-123","execution_status":"in_progress"}' }] }] } } },
        { type: 'tool/call', time: 1_200, data: { turn: 3, step: 2, callId: 'call-2', name: 'mcp__openbkn__query_object_instance', arguments: '{}' } },
        { type: 'tool/result', time: 1_290, data: { turn: 3, step: 2, message: { source: { kind: 'tool', callId: 'call-2' }, content: [{ type: 'tool-result', content: [{ type: 'text', text: '{"nodes":[1,2,3]}' }] }] } } },
        { type: 'assistant/message', time: 1_500, data: { turn: 3, step: 3, message: { id: 'assistant-message-1', role: 'assistant', content: [{ type: 'text', text: 'Answer.' }] } } },
      ],
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
  service.ctx = { agents: { get: sessionId => sessionId === 'session-1' ? agent : undefined }, logger: { warn: () => {} } }
  service.platformReader = () => ({
    getInteractionOperations: async () => ({ entries: [{ operation_id: 'op-1', tool_name: 'query_metric' }] }),
    getInteractionBusinessGraph: async () => { throw new Error('business graph is not ready') },
  })

  const view = await service.remoteGetTurnProvenanceView('session-1', 'assistant-message-1', AbortSignal.timeout(1_000))

  assert.equal(view.timeline.length, 4)
  assert.deepEqual(view.execution.operations, [{ id: 'op-1', label: 'query_metric', protocol: undefined, status: undefined, startedAt: undefined, finishedAt: undefined, requestId: undefined, traceId: undefined, receiptId: undefined }])
  assert.deepEqual(view.business, { kind: 'unavailable' })
  assert.deepEqual(view.sources.degraded, [{ pane: 'business', reason: 'platform-unavailable' }])
})

test('uses the formal Trace 3 business graph without treating BKN Safe capabilities as its gate', async () => {
  const handle = {
    schemaVersion: 2 as const, interactionId: 'int-123', requestIds: [], traceIds: [], receiptIds: [],
    status: 'completed' as const, partial: true, conversationId: 'conv-123', turn: 3,
  }
  const agent = {
    id: 'session-1',
    session: {
      header: { cwd: '/workspace' },
      snapshotEvents: () => [
        { type: 'openbkn/turn-provenance', data: { messageId: 'assistant-message-1', handle } },
        { type: 'user/message', time: 1_000, data: { turn: 3, message: { id: 'user-1', role: 'user', content: [{ type: 'text', text: 'How many orders?' }] } } },
        { type: 'tool/call', time: 1_100, data: { turn: 3, step: 1, callId: 'call-1', name: 'mcp__openbkn__bkn_start_interaction', arguments: '{"conversation_mode":"new"}' } },
        { type: 'tool/result', time: 1_140, data: { turn: 3, step: 1, message: { source: { kind: 'tool', callId: 'call-1' }, content: [{ type: 'tool-result', content: [{ type: 'text', text: '{"interaction_id":"int-123","conversation_id":"conv-123","execution_status":"in_progress"}' }] }] } } },
        { type: 'tool/call', time: 1_200, data: { turn: 3, step: 2, callId: 'call-2', name: 'mcp__openbkn__query_object_instance', arguments: '{}' } },
        { type: 'tool/result', time: 1_290, data: { turn: 3, step: 2, message: { source: { kind: 'tool', callId: 'call-2' }, content: [{ type: 'tool-result', content: [{ type: 'text', text: '{"nodes":[1,2,3]}' }] }] } } },
        { type: 'assistant/message', time: 1_500, data: { turn: 3, step: 3, message: { id: 'assistant-message-1', role: 'assistant', content: [{ type: 'text', text: 'Answer.' }] } } },
      ],
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
  service.ctx = { agents: { get: sessionId => sessionId === 'session-1' ? agent : undefined }, logger: { warn: () => {} } }
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

  assert.equal(view.timeline.length, 4)
  assert.deepEqual(view.execution.operations, [])
  assert.deepEqual(view.business, { kind: 'ready', operations: [{ id: 'op-1', attempt: 0, toolName: 'OpenBKN operation', status: 'resolved', elements: [{ id: 'object_type:kn-supply:supplier', kind: 'object', name: '供应商' }], missingFacts: [] }], conversationContext: [], derivedFacts: [], contextRelations: [] })
  assert.deepEqual(view.sources, {
    timeline: 'local-session', operations: 'unavailable', business: 'platform-enterprise', evidence: 'unavailable',
    degraded: [
      { pane: 'operations', reason: 'platform-unavailable' },
      { pane: 'evidence', reason: 'platform-unavailable' },
    ],
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

// Verified against OpenBKN 0.1.4 (docs/evidence/2026-09-20-provenance-v1-v2.md):
// the observability read routes have no license gate — the 403 allow-list /
// account denial is classified as domain-not-authorized on any deployment
// license, and capabilities are never consulted for this classification.
test('degrades each platform pane by failure class instead of throwing, and always returns the local timeline', async () => {
  const handle = {
    schemaVersion: 2 as const, interactionId: 'int-123', requestIds: [], traceIds: [], receiptIds: [],
    status: 'completed' as const, partial: true, turn: 3,
  }
  const timelineEvents = [
    { type: 'openbkn/turn-provenance', data: { messageId: 'assistant-message-1', handle } },
    { type: 'user/message', time: 1_000, data: { turn: 3, message: { id: 'user-1', role: 'user', content: [{ type: 'text', text: 'Q?' }] } } },
    { type: 'assistant/message', time: 1_500, data: { turn: 3, step: 2, message: { id: 'assistant-message-1', role: 'assistant', content: [{ type: 'text', text: 'A.' }] } } },
  ]
  const cases: readonly { name: string; code: string; requiredAction?: string; expect: { readonly reason: string; readonly requiredAction?: string } }[] = [
    // The 403 classification does not depend on the deployment license: both
    // an unlicensed community deployment and a licensed one deny reads only
    // through the domain allow-list / account authorization.
    { name: 'permission gate on an unlicensed deployment', code: 'LICENSE_REQUIRED', requiredAction: 'request_authorization', expect: { reason: 'domain-not-authorized', requiredAction: 'request_authorization' } },
    { name: 'permission gate on a licensed deployment', code: 'LICENSE_REQUIRED', requiredAction: 'request_authorization', expect: { reason: 'domain-not-authorized', requiredAction: 'request_authorization' } },
    { name: 'expired token', code: 'AUTHENTICATION_REQUIRED', expect: { reason: 'authentication-required' } },
    { name: 'platform unreachable', code: 'PLATFORM_UNAVAILABLE', expect: { reason: 'platform-unavailable' } },
  ]
  for (const entry of cases) {
    const agent = {
      id: 'session-1',
      session: { header: { cwd: '/workspace' }, snapshotEvents: () => timelineEvents },
    }
    let licenseCalls = 0
    const service = Object.create(OpenBknBusinessContextService.prototype) as unknown as {
      config: Record<string, unknown>
      ctx: { agents: { get(sessionId: string): typeof agent | undefined }; logger: { warn: () => void } }
      platformReader(): unknown
      remoteGetTurnProvenanceView(sessionId: string, messageId: string, signal: AbortSignal): Promise<{ sources: { degraded: readonly { pane: string; reason: string; edition?: string; requiredAction?: string }[] }; timeline: readonly unknown[] }>
    }
    service.config = { ...config, maxGraphNodes: 10, maxGraphEdges: 10 }
    service.ctx = { agents: { get: sessionId => sessionId === 'session-1' ? agent : undefined }, logger: { warn: () => {} } }
    const { PlatformReaderError } = await import('../src/platform-reader.ts')
    service.platformReader = () => ({
      getInteractionOperations: async () => { throw new PlatformReaderError(entry.code, 'read failed', entry.requiredAction === undefined ? undefined : { requiredAction: entry.requiredAction }) },
      getInteractionBusinessGraph: async () => { throw new PlatformReaderError(entry.code, 'read failed', entry.requiredAction === undefined ? undefined : { requiredAction: entry.requiredAction }) },
      getLicenseEdition: async () => {
        licenseCalls += 1
        throw new Error('capabilities must not be consulted for read-path classification')
      },
    })

    const view = await service.remoteGetTurnProvenanceView('session-1', 'assistant-message-1', AbortSignal.timeout(1_000))

    assert.equal(view.timeline.length, 2, entry.name)
    assert.deepEqual(view.sources.degraded, [
      { pane: 'operations', ...entry.expect },
      { pane: 'business', ...entry.expect },
      { pane: 'evidence', ...entry.expect },
    ], entry.name)
    assert.equal(licenseCalls, 0, entry.name)
  }
})
