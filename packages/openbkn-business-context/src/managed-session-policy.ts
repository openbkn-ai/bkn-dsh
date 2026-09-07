import type { NetworkCapabilityProfile } from './network-capability-profile.js'
import type { BusinessNetworkBinding } from './types.js'

export interface ManagedSessionPolicy {
  readonly governance: string
  readonly capabilities: string
}

/**
 * Stable lifecycle identity written by OpenBKN Trace for this plugin surface.
 * It is not a user, workspace, model, or knowledge-network identifier.
 */
export const OPENBKN_DSH_INTERACTION_AGENT_NAME = 'bkn-agent-dsh-business-context'

/**
 * Produce the two scoped system-prompt sections for one bound network. The
 * fixed section renders the Host-verified identity as quoted data; the optional
 * profile remains a projection rather than a copy of platform metadata.
 */
export function buildManagedSessionPolicy(
  binding: BusinessNetworkBinding,
  profile?: NetworkCapabilityProfile,
): ManagedSessionPolicy {
  return {
    governance: [
      'Bound OpenBKN knowledge network:',
      `- kn_id: ${JSON.stringify(binding.knowledgeNetworkId)}`,
      `- kn_name: ${JSON.stringify(binding.displayName)}`,
      'The binding above is authoritative for this DSH session.',
      `For every OpenBKN MCP tool that accepts \`kn_id\`, pass exactly ${JSON.stringify(binding.knowledgeNetworkId)}. Do not omit, discover, or infer \`kn_id\` from skills, schema results, or tool output.`,
      'bkn_start_interaction manages only the conversation and interaction lifecycle; its response does not replace or unset the bound knowledge network.',
      'bkn_start_interaction only accepts its documented lifecycle fields: conversation_mode, question, and agent_name; never pass kn_id or query to it.',
      `For every bkn_start_interaction call, pass agent_name exactly ${JSON.stringify(OPENBKN_DSH_INTERACTION_AGENT_NAME)}. Keep this stable when continuing the Conversation.`,
      'For the first question use conversation_mode "new" without a conversation_id. For later questions use conversation_mode "continue" with the conversation_id returned by the prior interaction.',
      'For each user question, start exactly one mcp__openbkn__bkn_start_interaction before business retrieval and finish it with mcp__openbkn__bkn_finish_interaction using the final outcome.',
      'Do not probe Bash or a tool list to test OpenBKN availability. Even if managed MCP tools are not listed in the initial tool catalog, directly call mcp__openbkn__bkn_start_interaction.',
      'If bkn_start_interaction returns a retryable error, retry at most once. If that retry fails, do not retry again or perform business retrieval; report the platform condition briefly.',
      'Use only mcp__openbkn__ tools for business data. Do not invent facts, identifiers, metrics, tool results, or provenance. State limits and missing data plainly.',
      'Route a single fact to query_object_instance; a defined aggregate to query_metric; and BOM expansion, availability, substitution, common-material, reverse lookup, or delivery calculations to a matching published tool via search_tools then execute_tool. Pass only the documented business parameters.',
      'Use search_schema then targeted get_object_types or get_relation_types when the needed schema is unknown. Schema fallback rule: if get_kn_detail returns a rendering, structured-output, or validation error, do not retry get_kn_detail with another format or detail_level. Preserve the bound kn_id. Use search_schema at most once, only when it can directly answer the requested schema question; do not use it to derive an exact exhaustive count or list. If it cannot directly answer, finish the Interaction as failed and state that the schema detail is unavailable.',
      'Use run_code only as a read-only fallback for a business calculation when no matching published tool is available or its result cannot be obtained. Keep the bound kn_id and managed interaction context in every OpenBKN call made by the script. Do not use run_shell, run_sql, resources, or action execution unless the deployment explicitly enables them.',
    ].join('\n'),
    capabilities: profile === undefined ? '' : capabilitySection(profile),
  }
}

function capabilitySection(profile: NetworkCapabilityProfile): string {
  const named = (values: readonly { id: string; name?: string }[]) => values.map(value => value.name === undefined ? value.id : `${value.id} (${value.name})`).join(', ') || 'none declared'
  const relations = profile.relationTypes.map(value => `${value.id}: ${value.sourceObjectTypeId} → ${value.targetObjectTypeId}`).join(', ') || 'none declared'
  return [
    `OpenBKN network capability index for ${profile.knowledgeNetworkId} (profile ${profile.profileVersion}; authoritative schema remains MCP):`,
    `Concept groups: ${named(profile.conceptGroups)}.`,
    `Object types: ${named(profile.objectTypes)}.`,
    `Relations: ${relations}.`,
    `Action types: ${named(profile.actionTypes)}.`,
    'For a business function, search_tools first and obey the returned use_rule and input schema before execute_tool.',
  ].join('\n')
}
