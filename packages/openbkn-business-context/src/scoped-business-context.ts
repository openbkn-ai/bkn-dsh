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
import { buildManagedSessionPolicy } from './managed-session-policy.js'
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
  on(event: 'agent/turn-stopping', listener: (payload: { readonly turn: number }) => void): () => void
}

/** The managed lifecycle pair that brackets any OpenBKN access. */
export const LIFECYCLE_TOOLS = [
  'mcp__openbkn__bkn_start_interaction', 'mcp__openbkn__bkn_finish_interaction',
] as const

/**
 * Every other managed OpenBKN tool: schema, skills, tool discovery, queries,
 * metrics, execution, run_code. A turn reaches any of them only inside an open
 * Interaction — reading the network's schema is itself an OpenBKN access.
 * Newly added OpenBKN tools default to this group (managed by default, not
 * allowed by default).
 */
export const MANAGED_IN_INTERACTION_TOOLS = [
  'mcp__openbkn__get_kn_detail', 'mcp__openbkn__search_schema',
  'mcp__openbkn__get_object_types', 'mcp__openbkn__get_relation_types',
  'mcp__openbkn__query_object_instance', 'mcp__openbkn__query_instance_subgraph',
  'mcp__openbkn__explore_subgraph', 'mcp__openbkn__search_instance',
  'mcp__openbkn__query_metric', 'mcp__openbkn__get_logic_properties_values',
  'mcp__openbkn__run_code',
  'mcp__openbkn__list_skills', 'mcp__openbkn__find_skills', 'mcp__openbkn__get_skill_content', 'mcp__openbkn__read_skill_file',
  'mcp__openbkn__search_tools', 'mcp__openbkn__execute_tool',
] as const

const MANAGED_OPENBKN_TOOLS = [...LIFECYCLE_TOOLS, ...MANAGED_IN_INTERACTION_TOOLS] as const

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
      if (!MANAGED_OPENBKN_TOOLS.includes(execution.name as typeof MANAGED_OPENBKN_TOOLS[number])) {
        return 'This OpenBKN business session only permits managed OpenBKN tools.'
      }
      // Rules 2–5 of the interaction boundary (§6.3) all live in the pure
      // `denialFor`; this whitelist (rule 1) is the only catalogue decision
      // here, and the guard itself stays side-effect free — state moves only
      // through settled results below.
      return denialFor(lifecycle, execution.name, recordArgs(execution.arguments))
    })
    // Constraint C2: this listener must stay synchronous so the state is
    // updated before the next guard judgment (V0-3, probe-verified).
    events.on('tools/result', (exec, result) => {
      if (exec.name !== START_INTERACTION_TOOL && exec.name !== FINISH_INTERACTION_TOOL) return
      // No write: the logged tool result itself is what `restoreFrom` replays.
      lifecycle = onToolResult(lifecycle, exec.name, result.isError !== true, projectLifecycleOutcome(result))
    })
    // Turn boundary (§6.4): reset the per-turn flags; the conversation id
    // survives inside `lifecycle` and the section below renders from it.
    events.on('agent/pre-step', async (payload, next) => {
      if (payload.step === 1) lifecycle = onTurnStart(lifecycle)
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
    systemPrompt.section({ name: 'openbkn:managed-session', order: 520, text: policy.governance })
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
function recordArgs(value: unknown): Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function normalizeBaseUrl(value: string): string {
  return trimTrailingSlashes(value.trim())
}
