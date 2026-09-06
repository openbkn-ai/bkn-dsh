import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type { ToolExecution } from '@deepseek-ai/dsh-tools'
import { readDshSessionBusinessNetwork, type DshSessionLog } from './dsh-session-binding.js'
import { buildManagedSessionPolicy } from './managed-session-policy.js'
import type { NetworkCapabilityProfile } from './network-capability-profile.js'
import type { PlatformReaderConfig } from './platform-reader.js'

interface ScopedSystemPrompt {
  section(section: { readonly name: string; readonly order: number; readonly text: string }): () => void
}

interface ScopedTools {
  guard(guard: (execution: Readonly<ToolExecution>) => string | undefined): () => void
}

const MANAGED_OPENBKN_TOOLS = [
  'mcp__openbkn__bkn_start_interaction', 'mcp__openbkn__bkn_finish_interaction',
  'mcp__openbkn__get_kn_detail', 'mcp__openbkn__search_schema', 'mcp__openbkn__get_object_types', 'mcp__openbkn__get_relation_types',
  'mcp__openbkn__query_object_instance', 'mcp__openbkn__query_instance_subgraph', 'mcp__openbkn__explore_subgraph', 'mcp__openbkn__search_instance',
  'mcp__openbkn__query_metric', 'mcp__openbkn__get_logic_properties_values',
  'mcp__openbkn__list_skills', 'mcp__openbkn__find_skills', 'mcp__openbkn__get_skill_content', 'mcp__openbkn__read_skill_file',
  'mcp__openbkn__search_tools', 'mcp__openbkn__execute_tool',
] as const

/** Agent-scoped prompt rows: only mounted after the session has a compatible binding. */
const scopedPolicyPlugin = (binding: ReturnType<typeof readDshSessionBusinessNetwork>, profile?: NetworkCapabilityProfile) => ({
  name: 'openbkn-business-context-policy',
  inject: ['systemPrompt', 'tools'],
  apply(ctx: Context): void {
    if (binding === undefined) return
    const policy = buildManagedSessionPolicy(binding, profile)
    const systemPrompt = (ctx as Context & { systemPrompt: ScopedSystemPrompt }).systemPrompt
    const tools = (ctx as Context & { tools: ScopedTools }).tools
    // Context Loader tools are dynamically registered after the agent is
    // created, so `restrict()` cannot safely name them here. A scoped guard is
    // DSH's monotonic enforcement point and works regardless of registration
    // timing; it also covers tools contributed by the agent preset itself.
    tools.guard(execution => MANAGED_OPENBKN_TOOLS.includes(execution.name as typeof MANAGED_OPENBKN_TOOLS[number])
      ? undefined
      : 'This OpenBKN business session only permits managed OpenBKN tools.')
    systemPrompt.section({ name: 'openbkn:managed-session', order: 520, text: policy.governance })
    if (policy.capabilities.length > 0) {
      systemPrompt.section({ name: 'openbkn:network-capabilities', order: 521, text: policy.capabilities })
    }
  },
})

/**
 * Mount the model-visible OpenBKN tool in one Agent's Cordis scope. An
 * unbound or differently configured session gets no registration at all, so
 * native DSH conversations keep their original tool catalogue.
 */
export function mountBoundBusinessNetworkTool(agent: Agent, config: PlatformReaderConfig, profile?: NetworkCapabilityProfile): boolean {
  const binding = readDshSessionBusinessNetwork(agent.session as unknown as DshSessionLog)
  if (binding === undefined || normalizeBaseUrl(binding.platformBaseUrl) !== normalizeBaseUrl(config.baseUrl)) return false
  // This event fires before `agent/session-start`, but `Context.inject()` may
  // schedule a later fiber. The standard preset has already composed these
  // services, so apply the contribution synchronously to this Agent scope.
  scopedPolicyPlugin(binding, profile).apply(agent.ctx)
  return true
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '')
}
