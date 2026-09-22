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
      'Decide first whether answering this turn requires anything from OpenBKN.',
      '- Requires OpenBKN: business objects, relations, metrics, rules, published functions, skills, AND the network\'s schema — anything whose answer depends on the bound network\'s governed semantics or data.',
      '- Does NOT require OpenBKN: greetings, clarifying questions about the conversation, questions about this plugin or about which knowledge network this session is bound to (that identity is already given above), and general knowledge. Answer those directly and call no mcp__openbkn__ tool at all.',
      'An Interaction is the boundary for every OpenBKN access, not only for data retrieval: when this turn needs OpenBKN, call mcp__openbkn__bkn_start_interaction first, perform all OpenBKN work inside it — schema, skills, tool discovery, queries, metrics, execution — and close it with mcp__openbkn__bkn_finish_interaction using the final outcome, including when the work failed. Exactly one Interaction per turn that touches OpenBKN; a turn that touches nothing creates none.',
      'Never inspect schema or skills to decide whether you need OpenBKN — reading them is already an OpenBKN access.',
      'bkn_start_interaction manages only the conversation and interaction lifecycle; its response does not replace or unset the bound knowledge network.',
      'bkn_start_interaction only accepts its documented lifecycle fields: conversation_mode, question, and agent_name; never pass kn_id or query to it.',
      `For every bkn_start_interaction call, pass agent_name exactly ${JSON.stringify(OPENBKN_DSH_INTERACTION_AGENT_NAME)}. Keep this stable when continuing the Conversation.`,
      'Use conversation_mode "new" only when the managed conversation notice in this prompt says no prior OpenBKN conversation is available; otherwise use "continue" with exactly the conversation_id it gives. Never invent or recall a conversation_id from earlier tool output.',
      'The managed OpenBKN tools may be absent from the initial tool catalog because they register after the session starts. Do not probe Bash or a tool list to test availability; when this turn needs OpenBKN, call mcp__openbkn__bkn_start_interaction directly.',
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
