import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { apply } from '../src/index.ts'
import { managedConversationSectionText, mountBoundBusinessNetworkTool } from '../src/scoped-business-context.ts'

const config = {
  baseUrl: 'https://poc.openbkn.ai', requestTimeoutMs: 30_000,
  maxResultBytes: 1_024, allowInsecureTls: false,
}

interface Contract { readonly tools: Record<string, { readonly knId: 'required' | 'optional' | 'absent' | 'unknown' }> }

/** A Context Loader catalogue captured from an upstream release tag (provenance in the file). */
function contract(tag: string): Contract {
  return JSON.parse(readFileSync(new URL(`./fixtures/context-loader-tools-${tag}.json`, import.meta.url), 'utf8')) as Contract
}

type ToolDefinitions = Record<string, { readonly parameters: { readonly properties: Record<string, unknown> } }>

function definition(takesKnId: boolean): ToolDefinitions[string] {
  return { parameters: { properties: takesKnId ? { kn_id: { type: 'string' } } : {} } }
}

/** Definitions as the MCP client registers them from that release's `tools/list`. */
function definitionsOf(tag: string): ToolDefinitions {
  return Object.fromEntries(Object.entries(contract(tag).tools)
    .map(([name, tool]) => [`mcp__openbkn__${name}`, definition(tool.knId === 'required' || tool.knId === 'optional')]))
}

function without(tools: ToolDefinitions, name: string): ToolDefinitions {
  return Object.fromEntries(Object.entries(tools).filter(([key]) => key !== name))
}

/** The whole v0.1.5 catalogue: a deployment with Skill execution switched on. */
const V015_TOOLS = definitionsOf('v0.1.5')
/** v0.1.5 as deployed by default: `skill.executeEnabled: false`, so execute_skill does not register. */
const V015_DEFAULT_TOOLS = without(V015_TOOLS, 'mcp__openbkn__execute_skill')
const V014_TOOLS = definitionsOf('v0.1.4')

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

/** A conversation the session already holds, as DSH logged the successful start that opened it. */
function heldConversation(conversationId: string): Array<{ type: string; data: unknown }> {
  return [
    { type: 'turn/start', data: { turn: 1 } },
    { type: 'tool/call', data: { turn: 1, step: 1, callId: 'held-start', name: 'mcp__openbkn__bkn_start_interaction', arguments: '{}' } },
    { type: 'tool/result', data: { turn: 1, step: 1, message: {
      role: 'tool', toolCallId: 'held-start', source: { kind: 'tool', callId: 'held-start' }, isError: false,
      content: [{ type: 'text', text: `{"interaction_id":"int-held","conversation_id":"${conversationId}","execution_status":"active"}` }],
    } } },
    { type: 'turn/end', data: { turn: 1 } },
  ]
}

/** Mount with the binding the service resolved for this session. */
function mount(fake: FakeAgent): boolean {
  return mountBoundBusinessNetworkTool(fake.agent as never, config, BOUND_EVENT.data)
}

/** A minimal Agent scope whose guard, sections, events, and session log are captured. */
function fakeAgent(events: Array<{ type: string; data: unknown }> = [BOUND_EVENT], visibleTools: ToolDefinitions = V015_TOOLS): FakeAgent {
  const guards: FakeAgent['guards'] = []
  const sections: FakeAgent['sections'] = []
  const listeners: FakeAgent['listeners'] = {}
  const logs: FakeAgent['logs'] = []
  const appended: FakeAgent['appended'] = []
  const ctx = {
    tools: {
      guard: (guard: FakeAgent['guards'][number]) => { guards.push(guard); return () => {} },
      get: (name: string) => visibleTools[name],
    },
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

/** The managed-session section as the next prompt assembly would render it. */
function governanceOf(fake: FakeAgent): string {
  return (fake.sections.find(entry => entry.name === 'openbkn:managed-session')!.text as () => string)()
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
  assert.equal(mount(fake), true)
  assert.equal(fake.guards.length, 1)
  assert.ok(fake.listeners['tools/result'])
  assert.ok(fake.listeners['agent/pre-step'])
  assert.ok(fake.listeners['agent/turn-stopping'])
  assert.deepEqual(fake.sections.map(section => section.name), [
    'openbkn:ptc-unsupported', 'openbkn:managed-session', 'openbkn:managed-conversation',
  ])
})

test('PTC mode: run_code is refused with a switch-to-Standard instruction, and the prompt says so up front', () => {
  const standard = fakeAgent()
  mount(standard)
  const standardNotice = standard.sections.find(entry => entry.name === 'openbkn:ptc-unsupported')!
  assert.equal((standardNotice.text as () => string)(), '', 'no PTC notice outside PTC mode')

  const ptc = fakeAgent([BOUND_EVENT], { ...V015_TOOLS, run_code: definition(false) })
  mount(ptc)
  const notice = ptc.sections.find(entry => entry.name === 'openbkn:ptc-unsupported')!
  assert.match((notice.text as () => string)(), /PTC mode.*Standard mode \(标准模式\)/s)
  // Refused before the lifecycle rules, even inside an open interaction.
  startSucceeded(ptc)
  assert.match(ptc.guards[0]!({ name: 'run_code', arguments: { code: 'return 1' } }) ?? '', /do not support PTC mode.*Do not retry/s)
  // The platform's own managed run_code stays governed by the lifecycle rules.
  assert.equal(ptc.guards[0]!({ name: 'mcp__openbkn__run_code', arguments: {} }), undefined)
})

test('guards a non-managed tool out regardless of interaction state', () => {
  const fake = fakeAgent()
  assert.equal(mount(fake), true)
  assert.match(fake.guards[0]!({ name: 'bash' }) ?? '', /only permits managed OpenBKN tools/i)
})

test('rule 2: schema access is denied before any start, allowed inside an open interaction', () => {
  const fake = fakeAgent()
  assert.equal(mount(fake), true)
  const schema = { name: 'mcp__openbkn__search_schema', arguments: { kn_id: 'kn-supply', query: 'orders' } }
  assert.match(fake.guards[0]!(schema) ?? '', /Start mcp__openbkn__bkn_start_interaction before any OpenBKN access/)
  startSucceeded(fake)
  assert.equal(fake.guards[0]!(schema), undefined)
})

test('rule 3: a repeat start is denied while the interaction is open', () => {
  const fake = fakeAgent()
  assert.equal(mount(fake), true)
  startSucceeded(fake)
  assert.match(fake.guards[0]!({ name: START, arguments: { conversation_mode: 'continue', conversation_id: 'conv-1' } }) ?? '', /already open in this turn/)
})

test('rule 5: finish is denied without an open interaction', () => {
  const fake = fakeAgent()
  assert.equal(mount(fake), true)
  assert.match(fake.guards[0]!({ name: FINISH, arguments: { outcome: 'completed' } }) ?? '', /No OpenBKN interaction is open/)
})

test('a successful start holds the conversation without writing to the session log', () => {
  const fake = fakeAgent()
  assert.equal(mount(fake), true)
  startSucceeded(fake, 'conv-9')
  assert.deepEqual(fake.appended, [])
  const section = fake.sections.find(entry => entry.name === 'openbkn:managed-conversation')!
  assert.match((section.text as () => string)(), /conv-9/)
})

test('a conversation held in the log survives a restore; a plugin event alone restores nothing', () => {
  const restored = fakeAgent([BOUND_EVENT, ...heldConversation('conv-7')])
  assert.equal(mount(restored), true)
  assert.match((restored.sections.find(entry => entry.name === 'openbkn:managed-conversation')!.text as () => string)(), /conv-7/)

  const recordedOnly = fakeAgent([BOUND_EVENT, { type: 'openbkn/managed-conversation', data: { conversationId: 'conv-7', status: 'active', recordedAt: 1 } }])
  assert.equal(mount(recordedOnly), true)
  assert.match((recordedOnly.sections.find(entry => entry.name === 'openbkn:managed-conversation')!.text as () => string)(), /No prior OpenBKN conversation/)
})

test('rule 4: new is denied while the session holds a conversation, naming the held id', () => {
  const fake = fakeAgent([BOUND_EVENT, ...heldConversation('conv-7')])
  assert.equal(mount(fake), true)
  const denial = fake.guards[0]!({ name: START, arguments: { conversation_mode: 'new' } }) ?? ''
  assert.match(denial, /conversation_mode "continue"/)
  assert.match(denial, /conv-7/)
})

test('rule 4: a mismatched continue is denied with the correct id', () => {
  const fake = fakeAgent([BOUND_EVENT, ...heldConversation('conv-7')])
  assert.equal(mount(fake), true)
  const denial = fake.guards[0]!({ name: START, arguments: { conversation_mode: 'continue', conversation_id: 'conv-other' } }) ?? ''
  assert.match(denial, /does not match/)
  assert.match(denial, /conv-7/)
})

test('controlled invalidation: the dead id leaves memory and one new is allowed, with no log writes', () => {
  const fake = fakeAgent([BOUND_EVENT, ...heldConversation('conv-7')])
  assert.equal(mount(fake), true)
  const section = fake.sections.find(entry => entry.name === 'openbkn:managed-conversation')!
  assert.match((section.text as () => string)(), /conv-7/)
  startFailed(fake, 'resource_not_disclosed')
  assert.match((section.text as () => string)(), /No prior OpenBKN conversation is available/, 'the prompt must stop offering the dead id')
  assert.equal(fake.guards[0]!({ name: START, arguments: { conversation_mode: 'new' } }), undefined)
  // The recovery's new id becomes the held conversation; the logged tool
  // results are what a later restore replays, so nothing is appended.
  startSucceeded(fake, 'conv-8')
  assert.deepEqual(fake.appended, [])
  assert.match((section.text as () => string)(), /conv-8/)
})

test('a turn that finished its interaction cannot open a second one', () => {
  const fake = fakeAgent()
  assert.equal(mount(fake), true)
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
  assert.equal(mount(fake), true)
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
  const fake = fakeAgent([BOUND_EVENT, ...heldConversation('conv-7')])
  assert.equal(mount(fake), true)
  startFailed(fake, 'invalid_params')
  assert.equal(fake.appended.filter(event => event.type === 'openbkn/managed-conversation').length, 0)
  assert.match(fake.guards[0]!({ name: START, arguments: { conversation_mode: 'new' } }) ?? '', /conversation_mode "continue"/)
})

test('the conversation section renders the held identity and refreshes through state changes', () => {
  const fake = fakeAgent()
  assert.equal(mount(fake), true)
  const section = fake.sections.find(entry => entry.name === 'openbkn:managed-conversation')!
  const render = section.text as () => string
  assert.match(render(), /No prior OpenBKN conversation is available/)
  startSucceeded(fake, 'conv-1')
  assert.match(render(), /A prior OpenBKN conversation is available for this DSH session: conv-1/)
  assert.match(managedConversationSectionText(undefined), /conversation_mode "new"/)
})

test('pre-step resets the per-turn state; turn-stopping warns with a countable, locatable record', async () => {
  const fake = fakeAgent()
  assert.equal(mount(fake), true)
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
  assert.equal(mountBoundBusinessNetworkTool(agent as never, config, undefined), false)
  assert.equal(mountBoundBusinessNetworkTool(agent as never, config, { ...BOUND_EVENT.data, platformBaseUrl: 'https://other.openbkn.ai' }), false)
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

test('every Context Loader tool of the supported releases is classified: managed, or reviewed and excluded', async () => {
  const { MANAGED_IN_INTERACTION_TOOLS, LIFECYCLE_TOOLS, EXCLUDED_OPENBKN_TOOLS, LEGACY_DISCOVERY_TOOLS } = await import('../src/scoped-business-context.ts')
  const managed: readonly string[] = [...LIFECYCLE_TOOLS, ...MANAGED_IN_INTERACTION_TOOLS]
  assert.equal(new Set(managed).size, managed.length, 'no duplicate managed tool')
  assert.deepEqual(managed.filter(name => EXCLUDED_OPENBKN_TOOLS.includes(name)), [], 'managed and excluded are disjoint')
  for (const [tag, tools] of [['v0.1.5', V015_TOOLS], ['v0.1.4', V014_TOOLS]] as const) {
    assert.deepEqual(Object.keys(tools).filter(name => !managed.includes(name) && !EXCLUDED_OPENBKN_TOOLS.includes(name)), [], `unclassified ${tag} tool`)
  }
  const current = Object.keys(V015_TOOLS)
  const supported = [...current, ...Object.keys(V014_TOOLS)]
  // Only the documented 0.1.4 discovery tool may be absent from the current catalogue.
  assert.deepEqual(managed.filter(name => !current.includes(name)), [...LEGACY_DISCOVERY_TOOLS])
  assert.deepEqual(LEGACY_DISCOVERY_TOOLS.filter(name => V014_TOOLS[name] === undefined), [], 'a legacy tool the 0.1.4 release never published')
  assert.deepEqual(EXCLUDED_OPENBKN_TOOLS.filter(name => !supported.includes(name)), [], 'stale excluded name')
})

test('discovery to execution on 0.1.5: search_capabilities, execute_tool, and execute_skill run inside an interaction, for the bound network only', () => {
  const fake = fakeAgent()
  mount(fake)
  const bound = BOUND_EVENT.data.knowledgeNetworkId
  const calls = [
    { name: 'mcp__openbkn__search_capabilities', arguments: { kn_id: bound, query: 'BOM' } },
    { name: 'mcp__openbkn__execute_tool', arguments: { kn_id: bound, toolbox_id: 'box', tool_id: 'tool', arguments: {} } },
    { name: 'mcp__openbkn__get_skill_content', arguments: { kn_id: bound, skill_id: 'skill' } },
    { name: 'mcp__openbkn__execute_skill', arguments: { kn_id: bound, skill_id: 'skill', entry_shell: 'python main.py' } },
  ]
  for (const call of calls) assert.match(fake.guards[0]!(call) ?? '', /Start mcp__openbkn__bkn_start_interaction/, `${call.name} before start`)
  startSucceeded(fake)
  for (const call of calls) {
    assert.equal(fake.guards[0]!(call), undefined, call.name)
    const { kn_id: _bound, ...withoutNetwork } = call.arguments
    for (const args of [{ ...call.arguments, kn_id: 'kn-other' }, withoutNetwork]) {
      assert.match(fake.guards[0]!({ name: call.name, arguments: args }) ?? '', new RegExp(`bound to OpenBKN knowledge network "${bound}"`), `${call.name} ${JSON.stringify(args)}`)
    }
  }
})

test('every managed tool whose schema takes kn_id refuses another network; excluded tools stay denied and are named', async () => {
  const { MANAGED_IN_INTERACTION_TOOLS, EXCLUDED_OPENBKN_TOOLS } = await import('../src/scoped-business-context.ts')
  const fake = fakeAgent()
  mount(fake)
  startSucceeded(fake)
  const scoped = MANAGED_IN_INTERACTION_TOOLS.filter(name => V015_TOOLS[name]?.parameters.properties.kn_id !== undefined)
  assert.ok(scoped.length >= 15, `expected the kn_id-taking managed tools, got ${scoped.length}`)
  for (const name of scoped) assert.match(fake.guards[0]!({ name, arguments: { kn_id: 'kn-other' } }) ?? '', /Other networks cannot be queried/, name)
  for (const name of EXCLUDED_OPENBKN_TOOLS) {
    assert.match(fake.guards[0]!({ name, arguments: { kn_id: BOUND_EVENT.data.knowledgeNetworkId } }) ?? '', new RegExp(`^${name} is not supported`), name)
  }
  assert.match(fake.guards[0]!({ name: 'mcp__openbkn__added_upstream_later', arguments: {} }) ?? '', /^mcp__openbkn__added_upstream_later is not supported/)
})

test('official 0.1.4: find_skills and the skill readers run under that release\'s own schemas; tools it never published stay refused', () => {
  const fake = fakeAgent([BOUND_EVENT], V014_TOOLS)
  mount(fake)
  startSucceeded(fake)
  const bound = BOUND_EVENT.data.knowledgeNetworkId
  const call = (name: string, args: Record<string, unknown>) => fake.guards[0]!({ name, arguments: args })
  assert.equal(call('mcp__openbkn__find_skills', { kn_id: bound }), undefined)
  assert.match(call('mcp__openbkn__find_skills', {}) ?? '', /kn_id/)
  // 0.1.4 skill readers take no kn_id; a kn_id argument is still checked when one is passed.
  assert.equal(call('mcp__openbkn__get_skill_content', { skill_id: 's' }), undefined)
  assert.match(call('mcp__openbkn__get_skill_content', { skill_id: 's', kn_id: 'kn-other' }) ?? '', /Other networks cannot be queried/)
  // Not in the 0.1.4 catalogue: managed names are refused as unregistered, the never-released search_tools as unsupported.
  for (const name of ['mcp__openbkn__search_capabilities', 'mcp__openbkn__execute_tool']) {
    assert.match(call(name, { kn_id: bound }) ?? '', /not registered in this session/, name)
  }
  assert.match(call('mcp__openbkn__search_tools', { query: 'bom' }) ?? '', /^mcp__openbkn__search_tools is not supported/)
  // 0.1.4 execute_skill takes no kn_id: it would run a command with no network scope, so it stays refused and unadvertised.
  assert.match(call('mcp__openbkn__execute_skill', { skill_id: 's', entry_shell: 'python main.py' }) ?? '', /not scoped to a knowledge network on this OpenBKN release/)
  assert.match(governanceOf(fake), /Skill execution is not enabled on this deployment/)
  assert.doesNotMatch(governanceOf(fake), /pass execute_skill only/)
})

test('default 0.1.5 deployment: execute_skill is not registered, so it is refused and the prompt says skills cannot be executed', () => {
  const fake = fakeAgent([BOUND_EVENT], V015_DEFAULT_TOOLS)
  mount(fake)
  startSucceeded(fake)
  const bound = BOUND_EVENT.data.knowledgeNetworkId
  assert.match(fake.guards[0]!({ name: 'mcp__openbkn__execute_skill', arguments: { kn_id: bound, skill_id: 's', entry_shell: 'python main.py' } }) ?? '', /not registered in this session/)
  assert.equal(fake.guards[0]!({ name: 'mcp__openbkn__get_skill_content', arguments: { kn_id: bound, skill_id: 's' } }), undefined)
  const prompt = governanceOf(fake)
  assert.match(prompt, /find a published capability with search_capabilities\. Run a function or MCP tool hit with execute_tool/)
  assert.match(prompt, /Skill execution is not enabled on this deployment \(execute_skill is not offered\)/)
  assert.doesNotMatch(prompt, /pass execute_skill only/)
  assert.doesNotMatch(prompt, /search_tools|find_skills/)
})

test('the routing rule names only tools the deployment registered, and re-renders once they register', () => {
  const enabled = fakeAgent()
  mount(enabled)
  assert.match(governanceOf(enabled), /search_capabilities.*execute_tool.*pass execute_skill only an entry command the skill declares/s)
  assert.doesNotMatch(governanceOf(enabled), /not enabled on this deployment/)

  const legacy = fakeAgent([BOUND_EVENT], V014_TOOLS)
  mount(legacy)
  assert.match(governanceOf(legacy), /no search_capabilities\. Find skills with find_skills or list_skills.*Published function tools cannot be reached/s)
  assert.doesNotMatch(governanceOf(legacy), /search_tools|with execute_tool/)

  // Before the Context Loader connection registers anything, the rule stays conditional.
  const registered: ToolDefinitions = {}
  const late = fakeAgent([BOUND_EVENT], registered)
  mount(late)
  assert.match(governanceOf(late), /register with the OpenBKN connection.*only when they are offered/s)
  Object.assign(registered, V015_DEFAULT_TOOLS)
  assert.match(governanceOf(late), /find a published capability with search_capabilities/)
})

test('a managed tool whose registered definition cannot be read is refused instead of running unscoped', () => {
  const fake = fakeAgent([BOUND_EVENT], { 'mcp__openbkn__bkn_start_interaction': definition(false) })
  mount(fake)
  startSucceeded(fake)
  for (const args of [{}, { kn_id: BOUND_EVENT.data.knowledgeNetworkId }]) {
    assert.match(fake.guards[0]!({ name: 'mcp__openbkn__search_instance', arguments: args }) ?? '', /not registered in this session/)
  }
  // A definition that does not carry the input schema where DSH's MCP client puts it is unreadable too.
  const reshaped = fakeAgent([BOUND_EVENT], { ...V015_TOOLS, 'mcp__openbkn__query_metric': { inputSchema: { properties: { kn_id: {} } } } as never })
  mount(reshaped)
  startSucceeded(reshaped)
  assert.match(reshaped.guards[0]!({ name: 'mcp__openbkn__query_metric', arguments: { metric_id: 'm' } }) ?? '', /not registered in this session/)
})

test('network scope: kn_id must be the bound network, as a string, and cannot be omitted', () => {
  const fake = fakeAgent()
  mount(fake)
  startSucceeded(fake)
  const bound = BOUND_EVENT.data.knowledgeNetworkId
  const call = (name: string, args: Record<string, unknown>) => fake.guards[0]!({ name, arguments: args })
  assert.equal(call('mcp__openbkn__query_metric', { kn_id: bound, metric_id: 'm' }), undefined)
  for (const args of [{ kn_id: 'kn-other', metric_id: 'm' }, { metric_id: 'm' }, { kn_id: [bound] }, { kn_id: null }, { kn_id: bound.toUpperCase() }]) {
    assert.match(call('mcp__openbkn__query_metric', args) ?? '', new RegExp(`bound to OpenBKN knowledge network "${bound}"`), JSON.stringify(args))
  }
  // search_instance takes an optional kn_id on the platform; the plugin still requires the bound one.
  assert.match(call('mcp__openbkn__search_instance', {}) ?? '', /kn_id/)
  assert.equal(call('mcp__openbkn__search_instance', { kn_id: bound }), undefined)
  // Tools without kn_id keep their own contract.
  assert.equal(call('mcp__openbkn__run_code', { code: 'x' }), undefined)
  assert.equal(call('mcp__openbkn__list_skills', {}), undefined)
})
