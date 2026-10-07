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

/** Which capability tools the bound session can actually call; `undefined` while the OpenBKN tools have not registered yet. */
export interface CapabilityToolAvailability {
  readonly searchCapabilities: boolean
  readonly findSkills: boolean
  readonly executeTool: boolean
  readonly executeSkill: boolean
}

const SKILL_EXECUTION_DISABLED = 'Skill execution is not enabled on this deployment (execute_skill is not offered): read the skill with get_skill_content, follow its guidance with the managed query tools where that applies, and state plainly that the skill itself cannot be executed here. Do not run its entry command through run_code or any other tool.'
const SKILL_EXECUTION_ENABLED = 'To run a skill, read it with get_skill_content first and pass execute_skill only an entry command the skill declares.'

/**
 * The capability routing rule for the tools this deployment registered. The
 * Context Loader catalogue differs by platform release (0.1.5 discovers with
 * search_capabilities, 0.1.4 with find_skills and has no published-function
 * path) and by deployment (execute_skill registers only when the platform
 * enables Skill execution), so the rule names only tools that can be called.
 */
export function capabilityRoutingText(available: CapabilityToolAvailability | undefined): string {
  if (available === undefined) {
    return 'Capability routing: the capability tools register with the OpenBKN connection. Discover published capabilities with search_capabilities when it is offered, otherwise skills with find_skills; call execute_tool or execute_skill only when they are offered, and state the limit plainly when they are not.'
  }
  const skillExecution = available.executeSkill ? SKILL_EXECUTION_ENABLED : SKILL_EXECUTION_DISABLED
  if (available.searchCapabilities) {
    const functions = available.executeTool
      ? 'Run a function or MCP tool hit with execute_tool (toolbox_id is the returned owner_id, tool_id the capability_id), obeying the returned use_rule and input schema.'
      : 'execute_tool is not offered, so a function or MCP tool hit cannot be run here; say so.'
    return `Capability routing: find a published capability with search_capabilities. ${functions} ${skillExecution}`
  }
  if (available.findSkills) {
    return `Capability routing: this platform release has no search_capabilities. Find skills with find_skills or list_skills. ${skillExecution} Published function tools cannot be reached through a managed tool on this release; say so instead of guessing, and use run_code only under the fallback rule above.`
  }
  return 'Capability routing: this deployment offers no capability discovery tool. Answer from the schema and query tools, and state plainly when a published function or skill would be needed.'
}

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
      'Use the bound network schema and field definitions to choose the relevant objects, relations, metrics or published capabilities. Match the requested identifier to its documented field meaning rather than assuming it is the primary key of the queried object. Ask for clarification when the intended entity or relationship is ambiguous.',
      'Answer the requested scope using the returned values, units and disclosed sources. Do not add unrequested metrics or calculations. Follow platform-defined business rules rather than inventing formulas, units, physical source names or meanings for missing data.',
      'For an explicit complete-detail request, follow documented pagination and disclose any missing pages or truncated results. A summary or a file confined to the platform sandbox is not delivery of the requested complete detail. Choose a suitable answer format; no plugin-specific table, completeness marker or cache file is required.',
      'An empty result establishes absence only for the queried fields and scope. Verify that those fields match the requested identifier before drawing a no-data conclusion. Do not widen to unrelated objects or queries after that conclusion without a user request.',
      'Use search_schema then targeted get_object_types or get_relation_types when the needed schema is unknown. If get_kn_detail returns a rendering, structured-output or validation error, do not repeat it with another format or detail_level. Use search_schema at most once and only for the actual question; its search hits cannot establish an exact exhaustive count or list. If targeted schema tools cannot answer the question, state the unavailable schema detail.',
      'Prefer documented pagination and bounded requests for large results. Do not repeatedly issue the same timed-out capability request. A read-only fallback must preserve the published business scope and field definitions; if those cannot be established, disclose the gap instead of substituting a different calculation.',
      'run_code fallback uses the platform-injected Python functions such as query_object_instance, get_object_types and execute_tool directly. Do not infer their availability from dir(), rebuild an MCP client with raw HTTP, inspect or print event credentials, or guess SDK imports. Follow the published function docstrings; bkn_context is injected into nested calls automatically. Keep the bound kn_id on each nested business call.',
      'Use run_code only as a read-only fallback when no matching published capability is available or its result cannot be obtained. Keep the bound kn_id and managed interaction context in every OpenBKN call made by the script. Do not use run_shell, run_sql, resources or action execution unless the deployment explicitly enables them.',
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
    'For a business function, follow the capability routing rule and obey the returned use_rule and input schema before executing it.',
  ].join('\n')
}
