import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { ToolExecution, ToolExecutionResult } from '@deepseek-ai/dsh-tools'
import {
  FINISH_INTERACTION_TOOL,
  START_INTERACTION_TOOL,
  denialFor,
  onToolResult,
  onTurnStart,
  projectLifecycleOutcome,
  restoreFrom,
  type InteractionLifecycleState,
} from './interaction-lifecycle.js'
import { buildManagedSessionPolicy, capabilityRoutingText, type CapabilityToolAvailability } from './managed-session-policy.js'
import type { NetworkCapabilityProfile } from './network-capability-profile.js'
import type { PlatformReaderConfig } from './platform-reader.js'
import type { BusinessNetworkBinding } from './types.js'
import { trimTrailingSlashes } from './trailing-slashes.js'

interface ScopedSystemPrompt {
  section(section: { readonly name: string; readonly order: number; readonly text: string | (() => string) }): () => void
}

interface ScopedTools {
  guard(guard: (execution: Readonly<ToolExecution>) => string | undefined): () => void
  /** The definition visible to `scope` (the Agent), if any. */
  get(name: string, scope?: object): unknown
}

interface ScopedAgentEvents {
  on(event: 'tools/result', listener: (exec: Readonly<ToolExecution>, result: Readonly<ToolExecutionResult>) => void): () => void
  on(event: 'agent/pre-step', listener: (payload: { readonly step: number }, next: () => Promise<unknown>) => Promise<unknown>): () => void
  on(event: 'agent/turn-stopping', listener: (payload: { readonly turn: number; readonly signal?: AbortSignal }) => void): () => void
}

/** The managed lifecycle pair that brackets any OpenBKN access. */
export const LIFECYCLE_TOOLS = [
  'mcp__openbkn__bkn_start_interaction', 'mcp__openbkn__bkn_finish_interaction',
] as const

/**
 * Every other managed OpenBKN tool: schema, skills, capability discovery,
 * queries, metrics, execution, run_code. A turn reaches any of them only
 * inside an open Interaction — reading the network's schema is itself an
 * OpenBKN access. A tool the platform adds stays denied until it is reviewed
 * and listed here or in `EXCLUDED_OPENBKN_TOOLS`; the contract test fails on
 * any Context Loader tool that is in neither.
 */
export const MANAGED_IN_INTERACTION_TOOLS = [
  'mcp__openbkn__get_kn_detail', 'mcp__openbkn__search_schema',
  'mcp__openbkn__get_object_types', 'mcp__openbkn__get_relation_types',
  'mcp__openbkn__query_object_instance', 'mcp__openbkn__query_instance_subgraph',
  'mcp__openbkn__explore_subgraph', 'mcp__openbkn__search_instance',
  'mcp__openbkn__query_metric', 'mcp__openbkn__get_logic_properties_values',
  'mcp__openbkn__run_code',
  'mcp__openbkn__list_skills', 'mcp__openbkn__get_skill_content', 'mcp__openbkn__read_skill_file',
  'mcp__openbkn__search_capabilities', 'mcp__openbkn__execute_tool', 'mcp__openbkn__execute_skill',
  // Skill discovery on OpenBKN 0.1.4; 0.1.5 replaced it with
  // search_capabilities. Kept so a 0.1.4 platform keeps working.
  'mcp__openbkn__find_skills',
] as const

/**
 * Managed discovery that only the OpenBKN 0.1.4 Context Loader publishes.
 * (`search_tools` existed only between two development commits, #1299 and
 * #1403, and shipped in no release, so it is not managed.)
 */
export const LEGACY_DISCOVERY_TOOLS: readonly string[] = ['mcp__openbkn__find_skills']

/**
 * Context Loader tools reviewed and kept out of a business session: writes
 * (actions), raw query languages and shell, and anything that enumerates or
 * reaches beyond the bound network.
 */
export const EXCLUDED_OPENBKN_TOOLS: readonly string[] = [
  'mcp__openbkn__execute_action', 'mcp__openbkn__get_action_info',
  'mcp__openbkn__get_action_execution', 'mcp__openbkn__list_action_executions',
  'mcp__openbkn__list_knowledge_networks',
  'mcp__openbkn__list_resources', 'mcp__openbkn__describe_resource',
  'mcp__openbkn__run_sql', 'mcp__openbkn__run_cypher', 'mcp__openbkn__run_shell',
]

const MANAGED_OPENBKN_TOOLS: readonly string[] = [...LIFECYCLE_TOOLS, ...MANAGED_IN_INTERACTION_TOOLS]
const OPENBKN_TOOL_PREFIX = 'mcp__openbkn__'

/** Denial for a tool outside the managed set; an OpenBKN tool is named so the gap is diagnosable. */
function unmanagedDenial(name: string): string | undefined {
  if (MANAGED_OPENBKN_TOOLS.includes(name)) return undefined
  return name.startsWith(OPENBKN_TOOL_PREFIX)
    ? `${name} is not supported in an OpenBKN business session by this version of the bkn-dsh plugin. Do not retry it; continue with the managed OpenBKN tools.`
    : 'This OpenBKN business session only permits managed OpenBKN tools.'
}

/**
 * The registered input schema of a tool: DSH's MCP client stores the
 * server's `inputSchema` as the definition's `parameters`. `undefined` when
 * the definition is missing or does not have that shape.
 */
function inputSchemaOf(definition: unknown): Readonly<Record<string, unknown>> | undefined {
  return record(record(definition)?.parameters)
}

/** Whether the tool's published input schema declares a `kn_id` parameter. */
function declaresKnId(definition: unknown): boolean {
  return record(inputSchemaOf(definition)?.properties)?.kn_id !== undefined
}

/**
 * Managed tools that run commands or code chosen per call and are admitted
 * only where the platform scopes them to a network: `execute_skill` takes no
 * `kn_id` on OpenBKN 0.1.4, so there it stays refused.
 */
const KN_SCOPE_REQUIRED_TOOLS: readonly string[] = ['mcp__openbkn__execute_skill']

/**
 * Denial for a `kn_id` that is missing, not a string, or not the bound
 * network. Which tools take `kn_id` is read from the schema the Context
 * Loader registered (required or optional alike, so the scope is never left
 * to a platform default), not from a list kept here; a `kn_id` argument is
 * checked even when no schema declares it. Tools without `kn_id` — the
 * platform's `run_code`, lifecycle — are not scoped by this check. A call
 * whose definition or input schema cannot be read is refused: its scope
 * would be unknown.
 */
export function knScopeDenial(
  name: string,
  args: Readonly<Record<string, unknown>>,
  boundNetworkId: string,
  definition: unknown,
): string | undefined {
  if (inputSchemaOf(definition) === undefined) return `${name} is not registered in this session, so its network scope cannot be checked. Do not retry it.`
  if (KN_SCOPE_REQUIRED_TOOLS.includes(name) && !declaresKnId(definition)) {
    return `${name} is not scoped to a knowledge network on this OpenBKN release, so it is not supported in a business session. Do not retry it.`
  }
  if (!declaresKnId(definition) && !Object.hasOwn(args, 'kn_id')) return undefined
  if (args.kn_id === boundNetworkId) return undefined
  return `This session is bound to OpenBKN knowledge network "${boundNetworkId}"; call ${name} with kn_id "${boundNetworkId}". Other networks cannot be queried from this session.`
}

/**
 * DSH's PTC-mode tool. PTC runs model-written programs in a Node process
 * with direct Node APIs, and logs nested calls as `tool/ptc-dispatch`, which
 * the lifecycle replay, provenance, and timeline readers do not read yet, so a
 * bound session refuses it and asks for Standard mode instead.
 */
const PTC_RUN_CODE_TOOL = 'run_code'
const PTC_UNSUPPORTED_DENIAL = 'OpenBKN business sessions do not support PTC mode, so run_code is disabled here. '
  + 'Do not retry or work around it; tell the user that OpenBKN queries need a new session in Standard mode (标准模式).'
const PTC_UNSUPPORTED_SECTION = [
  'This session runs in PTC mode, which OpenBKN business sessions do not support: run_code is disabled, so no OpenBKN tool can be reached.',
  'Do not call any tool. Reply to the user, in their language, that querying the bound OpenBKN network requires a new session in Standard mode (标准模式),',
  'chosen in the mode menu before the first message is sent.',
].join(' ')

const CONVERSATION_SECTION_NAME = 'openbkn:managed-conversation'
const CONVERSATION_SECTION_ORDER = 522

/**
 * The per-turn injected conversation-continuity text (§5.2). The value comes
 * from durable session events through the lifecycle state, never from model
 * memory; the wording keeps the cross-turn Conversation and this turn's
 * Interaction clearly distinct.
 */
export function managedConversationSectionText(conversationId: string | undefined): string {
  return conversationId === undefined
    ? [
      'No prior OpenBKN conversation is available for this DSH session.',
      'When this turn needs OpenBKN, start with conversation_mode "new".',
    ].join(' ')
    : [
      `A prior OpenBKN conversation is available for this DSH session: ${conversationId}.`,
      'When this turn needs OpenBKN, start with conversation_mode "continue" and exactly this conversation_id.',
    ].join(' ')
}

/** Agent-scoped prompt rows: only mounted after the session has a compatible binding. */
const scopedPolicyPlugin = (
  binding: BusinessNetworkBinding | undefined,
  agent: Agent,
  profile?: NetworkCapabilityProfile,
) => ({
  name: 'openbkn-business-context-policy',
  inject: ['systemPrompt', 'tools'],
  apply(ctx: Context): void {
    if (binding === undefined) return
    const policy = buildManagedSessionPolicy(binding, profile)
    const systemPrompt = (ctx as Context & { systemPrompt: ScopedSystemPrompt }).systemPrompt
    const tools = (ctx as Context & { tools: ScopedTools }).tools
    const events = ctx as Context & { on: ScopedAgentEvents['on'] }
    // Context Loader tools are dynamically registered after the agent is
    // created, so `restrict()` cannot safely name them here. A scoped guard is
    // DSH's monotonic enforcement point and works regardless of registration
    // timing; it also covers tools contributed by the agent preset itself.
    let lifecycle: InteractionLifecycleState = restoreFrom(agent.session.snapshotEvents())
    tools.guard(execution => {
      if (execution.name === PTC_RUN_CODE_TOOL) return PTC_UNSUPPORTED_DENIAL
      const unmanaged = unmanagedDenial(execution.name)
      if (unmanaged !== undefined) return unmanaged
      // Rules 2–5 of the interaction boundary (§6.3) all live in the pure
      // `denialFor`; the managed set (rule 1) and the network scope are the
      // only other decisions here, and the guard itself stays side-effect
      // free — state moves only through settled results below.
      const args = recordArgs(execution.arguments)
      return denialFor(lifecycle, execution.name, args)
        ?? knScopeDenial(execution.name, args, binding.knowledgeNetworkId, tools.get(execution.name, agent))
    })
    // Constraint C2: this listener must stay synchronous so the state is
    // updated before the next guard judgment (V0-3, probe-verified).
    events.on('tools/result', (exec, result) => {
      if (exec.name === START_INTERACTION_TOOL || exec.name === FINISH_INTERACTION_TOOL) {
        // No write: the logged tool result itself is what `restoreFrom` replays.
        lifecycle = onToolResult(lifecycle, exec.name, result.isError !== true, projectLifecycleOutcome(result))
      }
    })
    events.on('agent/pre-step', async (payload, next) => {
      if (payload.step === 1) {
        lifecycle = onTurnStart(lifecycle)
      }
      return await next()
    })
    events.on('agent/turn-stopping', payload => {
      // First batch: no automatic finish. An interaction left open here stays
      // open platform-side — a documented known limitation (plan §11). The
      // stable code token plus turn and interaction id make the residue
      // countable and locatable without carrying any business payload.
      if (lifecycle.open) {
        ctx.logger.warn(
          'openbkn-business-context: interaction left open at turn end (code=interaction-left-open, turn=%d, interactionId=%s)',
          payload.turn,
          lifecycle.interactionId ?? 'unknown',
        )
      }
    })
    // Evaluated per assembly: PTC is a per-session preset whose tool may be
    // composed after this mount. An empty text renders no section.
    systemPrompt.section({
      name: 'openbkn:ptc-unsupported',
      order: 519,
      text: () => tools.get(PTC_RUN_CODE_TOOL, agent) === undefined ? '' : PTC_UNSUPPORTED_SECTION,
    })
    // The routing rule is evaluated per assembly: the Context Loader tools
    // register after the mount, and which of them exist depends on the
    // platform release and its deployment switches.
    const offered = (shortName: string): boolean => tools.get(`${OPENBKN_TOOL_PREFIX}${shortName}`, agent) !== undefined
    const availability = (): CapabilityToolAvailability | undefined => tools.get(START_INTERACTION_TOOL, agent) === undefined
      ? undefined
      : {
          searchCapabilities: offered('search_capabilities'), findSkills: offered('find_skills'),
          executeTool: offered('execute_tool'),
          executeSkill: declaresKnId(tools.get(`${OPENBKN_TOOL_PREFIX}execute_skill`, agent)),
        }
    systemPrompt.section({
      name: 'openbkn:managed-session',
      order: 520,
      text: () => `${policy.governance}\n${capabilityRoutingText(availability())}`,
    })
    if (policy.capabilities.length > 0) {
      systemPrompt.section({ name: 'openbkn:network-capabilities', order: 521, text: policy.capabilities })
    }
    // Conversation continuity renders through a provider evaluated at every
    // assembly, so each turn's prompt carries the identity held at that moment
    // without re-registering (and without racing the assembly that `pre-step`
    // already performed before its waterfall runs).
    systemPrompt.section({
      name: CONVERSATION_SECTION_NAME,
      order: CONVERSATION_SECTION_ORDER,
      text: () => managedConversationSectionText(lifecycle.conversationId),
    })
  },
})

/**
 * Mount the model-visible OpenBKN tool in one Agent's Cordis scope. An
 * unbound or differently configured session gets no registration at all, so
 * native DSH conversations keep their original tool catalogue.
 */
export function mountBoundBusinessNetworkTool(
  agent: Agent,
  config: PlatformReaderConfig,
  binding: BusinessNetworkBinding | undefined,
  profile?: NetworkCapabilityProfile,
): boolean {
  if (binding === undefined || normalizeBaseUrl(binding.platformBaseUrl) !== normalizeBaseUrl(config.baseUrl)) return false
  // This event fires before `agent/session-start`, but `Context.inject()` may
  // schedule a later fiber. The standard preset has already composed these
  // services, so apply the contribution synchronously to this Agent scope.
  scopedPolicyPlugin(binding, agent, profile).apply(agent.ctx)
  return true
}

/**
 * No-payload projection of one settled lifecycle result. Success: the first
 * JSON record disclosing ids. Failure: a bounded parse of the error text for
 * the error-code field only — the platform's envelope nests it as
 * `{"error":{"code":...}}` (agent-retrieval `lifecycleToolErrorWithDetails`),
 * so both levels are read; anything unparsable classifies as "not
 * determinable" and never clears the held conversation.
 */
function record(value: unknown): Readonly<Record<string, unknown>> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}

function recordArgs(value: unknown): Readonly<Record<string, unknown>> {
  return record(value) ?? {}
}

function normalizeBaseUrl(value: string): string {
  return trimTrailingSlashes(value.trim())
}
