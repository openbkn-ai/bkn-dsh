import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { readDshSessionBusinessNetwork, type DshSessionLog } from './dsh-session-binding.js'
import { buildManagedSessionPolicy } from './managed-session-policy.js'
import type { NetworkCapabilityProfile } from './network-capability-profile.js'
import type { OsdkRunnerConfig } from './osdk-runner.js'

interface ScopedSystemPrompt {
  section(section: { readonly name: string; readonly order: number; readonly text: string }): () => void
}

interface ScopedTools {
  restrict(filter: { readonly allow: readonly string[] }): () => void
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
    ;(ctx as Context & { tools: ScopedTools }).tools.restrict({ allow: MANAGED_OPENBKN_TOOLS })
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
export function mountBoundBusinessNetworkTool(agent: Agent, config: OsdkRunnerConfig, profile?: NetworkCapabilityProfile): boolean {
  const binding = readDshSessionBusinessNetwork(agent.session as unknown as DshSessionLog)
  if (binding === undefined || normalizeBaseUrl(binding.platformBaseUrl) !== normalizeBaseUrl(config.baseUrl)) return false
  agent.ctx.plugin(scopedPolicyPlugin(binding, profile))
  return true
}

function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '')
}
