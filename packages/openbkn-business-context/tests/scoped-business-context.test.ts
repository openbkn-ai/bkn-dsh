import assert from 'node:assert/strict'
import test from 'node:test'
import { apply } from '../src/index.ts'
import { managedConversationSectionText, mountBoundBusinessNetworkTool } from '../src/scoped-business-context.ts'

const config = {
  baseUrl: 'https://poc.openbkn.ai', requestTimeoutMs: 30_000,
  maxResultBytes: 1_024, allowInsecureTls: false,
}

const BOUND_EVENT = {
  type: 'openbkn/business-network-bound',
  data: { platformBaseUrl: 'https://poc.openbkn.ai', knowledgeNetworkId: 'kn-supply', displayName: '供应链风险网络' },
}

interface FakeAgent {
  readonly agent: unknown
  readonly guards: Array<(execution: { readonly name: string; readonly arguments?: unknown }) => string | undefined>
  readonly sections: Array<{ readonly name: string; readonly order: number; readonly text: string | (() => string) }>
  readonly listeners: Record<string, Array<(...args: unknown[]) => unknown>>
  readonly logs: unknown[][]
  readonly appended: Array<{ readonly type: string; readonly data: unknown }>
}

/** A minimal Agent scope whose guard, sections, events, and session log are captured. */
function fakeAgent(events: Array<{ type: string; data: unknown }> = [BOUND_EVENT]): FakeAgent {
  const guards: FakeAgent['guards'] = []
  const sections: FakeAgent['sections'] = []
  const listeners: FakeAgent['listeners'] = {}
  const logs: FakeAgent['logs'] = []
  const appended: FakeAgent['appended'] = []
  const ctx = {
    tools: { guard: (guard: FakeAgent['guards'][number]) => { guards.push(guard); return () => {} } },
    systemPrompt: { section: (section: FakeAgent['sections'][number]) => { sections.push(section); return () => {} } },
    on: (event: string, listener: (...args: unknown[]) => unknown) => {
      ;(listeners[event] ??= []).push(listener)
      return () => {}
    },
    logger: { warn: (...args: unknown[]) => { logs.push(args) } },
  }
  const agent = {
    session: {
      snapshotEvents: () => [...events, ...appended],
      append: (type: string, data: unknown) => { appended.push({ type, data }) },
    },
    ctx,
  }
  return { agent, guards, sections, listeners, logs, appended }
}

const START = 'mcp__openbkn__bkn_start_interaction'
const FINISH = 'mcp__openbkn__bkn_finish_interaction'

function startSucceeded(fake: FakeAgent, conversationId = 'conv-1'): void {
  fake.listeners['tools/result']![0]!(
    { name: START, arguments: { conversation_mode: 'new' } },
    { isError: false, content: [{ type: 'text', text: `{"interaction_id":"int-1","conversation_id":"${conversationId}","execution_status":"in_progress"}` }] },
  )
}

/** The platform's real failure envelope nests the code under `error` (agent-retrieval lifecycleToolErrorWithDetails). */
function startFailed(fake: FakeAgent, errorCode: string): void {
  fake.listeners['tools/result']![0]!(
    { name: START, arguments: { conversation_mode: 'continue', conversation_id: 'conv-1' } },
    { isError: true, error: { message: `{"error":{"code":"${errorCode}","message":"probe failure envelope","retryable":false}}` } },
  )
}

test('mounts the managed policy, guard, and lifecycle listeners in one Agent scope', () => {
  const fake = fakeAgent()
  assert.equal(mountBoundBusinessNetworkTool(fake.agent as never, config), true)
  assert.equal(fake.guards.length, 1)
  assert.ok(fake.listeners['tools/result'])
  assert.ok(fake.listeners['agent/pre-step'])
  assert.ok(fake.listeners['agent/turn-stopping'])
  assert.deepEqual(fake.sections.map(section => section.name), [
    'openbkn:managed-session', 'openbkn:managed-conversation',
  ])
})

test('guards a non-managed tool out regardless of interaction state', () => {
  const fake = fakeAgent()
  assert.equal(mountBoundBusinessNetworkTool(fake.agent as never, config), true)
  assert.match(fake.guards[0]!({ name: 'bash' }) ?? '', /only permits managed OpenBKN tools/i)
})

test('rule 2: schema access is denied before any start, allowed inside an open interaction', () => {
  const fake = fakeAgent()
  assert.equal(mountBoundBusinessNetworkTool(fake.agent as never, config), true)
  const schema = { name: 'mcp__openbkn__search_schema', arguments: {} }
  assert.match(fake.guards[0]!(schema) ?? '', /Start mcp__openbkn__bkn_start_interaction before any OpenBKN access/)
  startSucceeded(fake)
  assert.equal(fake.guards[0]!(schema), undefined)
})

test('rule 3: a repeat start is denied while the interaction is open', () => {
  const fake = fakeAgent()
  assert.equal(mountBoundBusinessNetworkTool(fake.agent as never, config), true)
  startSucceeded(fake)
  assert.match(fake.guards[0]!({ name: START, arguments: { conversation_mode: 'continue', conversation_id: 'conv-1' } }) ?? '', /already open in this turn/)
})

test('rule 5: finish is denied without an open interaction', () => {
  const fake = fakeAgent()
  assert.equal(mountBoundBusinessNetworkTool(fake.agent as never, config), true)
  assert.match(fake.guards[0]!({ name: FINISH, arguments: { outcome: 'completed' } }) ?? '', /No OpenBKN interaction is open/)
})

test('a successful start persists the conversation as an ignorable session event', () => {
  const fake = fakeAgent()
  assert.equal(mountBoundBusinessNetworkTool(fake.agent as never, config), true)
  startSucceeded(fake, 'conv-9')
  assert.equal(fake.appended.length, 1)
  assert.equal(fake.appended[0]!.type, 'openbkn/managed-conversation')
  assert.equal((fake.appended[0]!.data as { conversationId: string }).conversationId, 'conv-9')
  assert.equal((fake.appended[0]!.data as { status: string }).status, 'active')
})

test('rule 4: new is denied while the session holds a conversation, naming the held id', () => {
  const fake = fakeAgent([BOUND_EVENT, { type: 'openbkn/managed-conversation', data: { conversationId: 'conv-7', status: 'active', recordedAt: 1 } }])
  assert.equal(mountBoundBusinessNetworkTool(fake.agent as never, config), true)
  const denial = fake.guards[0]!({ name: START, arguments: { conversation_mode: 'new' } }) ?? ''
  assert.match(denial, /conversation_mode "continue"/)
  assert.match(denial, /conv-7/)
})

test('rule 4: a mismatched continue is denied with the correct id', () => {
  const fake = fakeAgent([BOUND_EVENT, { type: 'openbkn/managed-conversation', data: { conversationId: 'conv-7', status: 'active', recordedAt: 1 } }])
  assert.equal(mountBoundBusinessNetworkTool(fake.agent as never, config), true)
  const denial = fake.guards[0]!({ name: START, arguments: { conversation_mode: 'continue', conversation_id: 'conv-other' } }) ?? ''
  assert.match(denial, /does not match/)
  assert.match(denial, /conv-7/)
})

test('controlled invalidation: the dead id leaves memory, is tombstoned, and one new is allowed', () => {
  const fake = fakeAgent([BOUND_EVENT, { type: 'openbkn/managed-conversation', data: { conversationId: 'conv-7', status: 'active', recordedAt: 1 } }])
  assert.equal(mountBoundBusinessNetworkTool(fake.agent as never, config), true)
  const section = fake.sections.find(entry => entry.name === 'openbkn:managed-conversation')!
  assert.match((section.text as () => string)(), /conv-7/)
  startFailed(fake, 'resource_not_disclosed')
  const tombstones = fake.appended.filter(event => (event.data as { status?: string }).status === 'invalidated')
  assert.equal(tombstones.length, 1)
  assert.equal((tombstones[0]!.data as { conversationId: string }).conversationId, 'conv-7')
  assert.match((section.text as () => string)(), /No prior OpenBKN conversation is available/, 'the prompt must stop offering the dead id')
  assert.equal(fake.guards[0]!({ name: START, arguments: { conversation_mode: 'new' } }), undefined)
  // The recovery's new id is persisted as the next active conversation.
  startSucceeded(fake, 'conv-8')
  const actives = fake.appended.filter(event => (event.data as { status?: string }).status === 'active')
  assert.deepEqual(actives.map(event => (event.data as { conversationId: string }).conversationId), ['conv-8'])
  assert.match((section.text as () => string)(), /conv-8/)
})

test('a turn that finished its interaction cannot open a second one', () => {
  const fake = fakeAgent()
  assert.equal(mountBoundBusinessNetworkTool(fake.agent as never, config), true)
  startSucceeded(fake, 'conv-1')
  fake.listeners['tools/result']![0]!(
    { name: FINISH, arguments: { outcome: 'completed' } },
    { isError: false, content: [{ type: 'text', text: '{"interaction_id":"int-1","conversation_id":"conv-1","execution_status":"completed"}' }] },
  )
  const denial = fake.guards[0]!({ name: START, arguments: { conversation_mode: 'continue', conversation_id: 'conv-1' } }) ?? ''
  assert.match(denial, /already completed its one OpenBKN interaction/)
})

test('after the turn completed, a managed tool is told the access is over — not sent into a start that would be rejected', () => {
  const fake = fakeAgent()
  assert.equal(mountBoundBusinessNetworkTool(fake.agent as never, config), true)
  startSucceeded(fake, 'conv-1')
  fake.listeners['tools/result']![0]!(
    { name: FINISH, arguments: { outcome: 'completed' } },
    { isError: false, content: [{ type: 'text', text: '{"interaction_id":"int-1","conversation_id":"conv-1","execution_status":"completed"}' }] },
  )
  const denial = fake.guards[0]!({ name: 'mcp__openbkn__search_schema', arguments: {} }) ?? ''
  assert.match(denial, /no further OpenBKN access is possible in this turn/)
  assert.doesNotMatch(denial, /then retry this call/)
})

test('a non-invalidating failure keeps the conversation and denies a careless new', () => {
  const fake = fakeAgent([BOUND_EVENT, { type: 'openbkn/managed-conversation', data: { conversationId: 'conv-7', status: 'active', recordedAt: 1 } }])
  assert.equal(mountBoundBusinessNetworkTool(fake.agent as never, config), true)
  startFailed(fake, 'invalid_params')
  assert.equal(fake.appended.filter(event => event.type === 'openbkn/managed-conversation').length, 0)
  assert.match(fake.guards[0]!({ name: START, arguments: { conversation_mode: 'new' } }) ?? '', /conversation_mode "continue"/)
})

test('the conversation section renders the held identity and refreshes through state changes', () => {
  const fake = fakeAgent()
  assert.equal(mountBoundBusinessNetworkTool(fake.agent as never, config), true)
  const section = fake.sections.find(entry => entry.name === 'openbkn:managed-conversation')!
  const render = section.text as () => string
  assert.match(render(), /No prior OpenBKN conversation is available/)
  startSucceeded(fake, 'conv-1')
  assert.match(render(), /A prior OpenBKN conversation is available for this DSH session: conv-1/)
  assert.match(managedConversationSectionText(undefined), /conversation_mode "new"/)
})

test('pre-step resets the per-turn state; turn-stopping warns with a countable, locatable record', async () => {
  const fake = fakeAgent()
  assert.equal(mountBoundBusinessNetworkTool(fake.agent as never, config), true)
  startSucceeded(fake)
  let nextCalled = false
  await fake.listeners['agent/pre-step']![0]({ step: 1 }, async () => { nextCalled = true })
  assert.equal(nextCalled, true)
  assert.match(fake.guards[0]!({ name: 'mcp__openbkn__query_object_instance', arguments: {} }) ?? '', /Start mcp__openbkn__bkn_start_interaction/)
  // A fresh open interaction at turn end produces the observability record.
  startSucceeded(fake, 'conv-2')
  fake.listeners['agent/turn-stopping']![0]({ turn: 3 })
  assert.equal(fake.logs.length, 1)
  assert.match(String(fake.logs[0]![0]), /code=interaction-left-open/)
  assert.equal(fake.logs[0]![1], 3)
  assert.equal(fake.logs[0]![2], 'int-1')
})

test('does not alter a native or differently configured DSH agent scope', () => {
  const mounted: unknown[] = []
  const agent = {
    session: { snapshotEvents: () => [] },
    ctx: { plugin: (plugin: unknown) => { mounted.push(plugin) } },
  }
  assert.equal(mountBoundBusinessNetworkTool(agent as never, config), false)
  assert.deepEqual(mounted, [])
})

test('loads only the host selection service at the root instead of registering a global model tool', async () => {
  const installed: unknown[] = []
  const ctx = {
    plugin: async (plugin: unknown) => { installed.push(plugin) },
    tools: { register: () => { throw new Error('root plugin must not register a tool') } },
  }
  await apply(ctx, config)
  assert.equal(installed.length, 2)
})

test('the two managed tool groups exactly partition the managed OpenBKN catalogue', async () => {
  const { MANAGED_IN_INTERACTION_TOOLS, LIFECYCLE_TOOLS } = await import('../src/scoped-business-context.ts')
  const union = [...LIFECYCLE_TOOLS, ...MANAGED_IN_INTERACTION_TOOLS]
  const expected = [
    'mcp__openbkn__bkn_start_interaction', 'mcp__openbkn__bkn_finish_interaction',
    'mcp__openbkn__get_kn_detail', 'mcp__openbkn__search_schema', 'mcp__openbkn__get_object_types', 'mcp__openbkn__get_relation_types',
    'mcp__openbkn__query_object_instance', 'mcp__openbkn__query_instance_subgraph', 'mcp__openbkn__explore_subgraph', 'mcp__openbkn__search_instance',
    'mcp__openbkn__query_metric', 'mcp__openbkn__get_logic_properties_values',
    'mcp__openbkn__run_code',
    'mcp__openbkn__list_skills', 'mcp__openbkn__find_skills', 'mcp__openbkn__get_skill_content', 'mcp__openbkn__read_skill_file',
    'mcp__openbkn__search_tools', 'mcp__openbkn__execute_tool',
  ]
  assert.deepEqual([...new Set(union)].sort(), [...expected].sort())
  assert.equal(union.length, expected.length)
})
