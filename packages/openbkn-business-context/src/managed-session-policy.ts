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
      'Route a single fact to query_object_instance; a defined aggregate to query_metric; and BOM expansion, availability, substitution, common-material, reverse lookup, or delivery calculations to a matching published capability, following the capability routing rule in this prompt. Pass only the documented business parameters.',
      'Use object-type and property identifiers returned by the bound network schema; never guess a shortened object-type ID after a successful query. For a requested business value, retrieve the relevant object attributes and field definitions, and explain the field meaning, unit, applicable object category and data source. For lead time, distinguish production from purchase lead time using the material attribute; obtain the time unit from its field definition, not the material quantity unit. If semantics or units are unavailable, state that gap instead of returning an unexplained number.',
      'Keep object queries filtered to the exact requested identifier. When an exact lookup finds no matching object, give a concise no-data conclusion and the queried source/scope, then stop unrelated business exploration and explanation. Do not append schema tutorials, warehouse counts, whole-table counts, other objects, or nonzero business figures as background evidence. Zero matching rows prove absence in the queried scope, not zero inventory or orders everywhere. The inventory and value explanation rules below apply to retrieved business values, not to a missing-object answer.',
      'For requests covering every BOM material, obtain all requested levels and pages. Follow documented offset/next_offset pagination until exhausted; verify collected rows and distinct materials against the returned counts, preserving repeated materials under different parents and each parent-child standard usage. A summary or a shallower tree cannot satisfy a full-detail request. Deliver the complete detail in the answer or an accessible artifact; never call partial retrieval completed. A file saved only inside the platform sandbox is not an accessible artifact. If the offered managed tools cannot expose that file, print compact detail in bounded chunks and deliver the full inline table; do not try Bash or local file tools to move sandbox files.',
      'For a full parent-child detail assembled in run_code, print its complete final table once with explicit level|parent|child_code|child_name|std_usage|available_qty|uom columns, DETAIL_ROWS: <complete row count> before it and EMITTED: <printed row count> after it. These counts must agree with all rows and the verified retrieval, not just a preview. For proven absence of inventory rows in the established query scope, print available_qty as 0*; print undisclosed inventory units as ?. Explain both markers in the delivered answer. Never turn missing or unknown stock quantities into 0 or 0*. Reuse the tool values verbatim in the final answer, including legitimate repetitions, units and absent-row markers. The Host checks this explicit detail handoff at the turn boundary; a correction notice supplies a deterministic transcription. Correct the final answer without changing scope or inventing data. Do not claim a physically named source unless that exact name was returned by schema metadata; a knowledge-network id is not a database schema.',
      'The handoff MUST contain the literal header line level|parent|child_code|child_name|std_usage|available_qty|uom (append |scoped_stock_rows for the direct inventory fallback described below) immediately after DETAIL_ROWS and before any data row; unlabeled positional rows do not establish column meanings. Save that same full labelled text in openbkn-bom-handoff.txt inside the existing sandbox before printing it. If a tool-handoff notice requests missing metadata, reprint the cached rows with their already verified column meanings before bkn_finish_interaction, without new business retrieval or a second Interaction. Never guess a column order or change the cached values. If the original data cannot be recovered, finish as failed. The sandbox cache is for verification repair, not a user-accessible deliverable.',
      'Only the complete handoff may use these completeness markers. Earlier pages and spot checks must not label themselves complete. Conflicting self-declared complete outputs cannot be resolved by picking the last or largest table; report failed validation instead of silently shrinking the detail.',
      'For a direct inventory fallback, persist each retrieved inventory batch in the existing sandbox cache before assembling the handoff, so a repair can reuse records without new queries. Filter raw rows by the verified warehouse AND stock_status rules BEFORE grouping by material. Track scoped_stock_rows separately from the quantity sum: no eligible rows means 0* and ?, even if that material has records in other warehouses; eligible rows whose available quantity sums to zero mean plain 0, with their disclosed unit. Global row existence and a zero sum cannot decide scoped row absence. Never default a missing available-stock field to zero. Print INVENTORY_FALLBACK: scoped-stock-rows before DETAIL_ROWS and append |scoped_stock_rows to the literal header and every data row. This eighth audit column is the number of eligible records for that material, repeated for each parent-child row; derive it from the same filtered cached records used for stock, not from the global query or the desired marker. Save this audit column with the handoff. The Host checks marker/count consistency; it does not prove the underlying query or calculation. The user table may omit the audit column, but must preserve its absence meaning.',
      'Before explaining inventory reservations, fetch the targeted inventory object field definitions, including each property comment, using get_object_types with response_format="json" for its actual schema id. get_kn_detail summary lists property names and types but cannot establish their formulas. A capability rule such as "reserved is display-only; P0 does not deduct it" describes no additional deduction by that capability, not the definition of available_inventory_qty. If the property comment defines available = inventory - reserved, say that reservation is already deducted in the returned field and is not deducted a second time. If that definition is not returned, disclose the unknown reservation treatment instead of inventing it.',
      'Keep a successfully paginated BOM as the authoritative expansion even when a separate inventory capability fails; only fall back for the failed part. Do not replace it with all raw BOM object rows, which may include alternative branches and a different scope. When the published capability supports include_substitute and the user did not request alternatives, use include_substitute=false and retain its main-only scope. Each delivered BOM detail row must identify its parent and child as well as level, standard usage and inventory; material-code-only rows cannot explain usage under multiple parents.',
      'An inventory fallback must retain the business caliber of the failed published capability and warehouse eligibility rules. All warehouses whose stock_status is usable are not necessarily production-eligible warehouses; summing all raw inventory rows can change the answer. Read the documented capability scope, or execute a small depth=1 request only to obtain/calibrate its warehouse rules and first-level inventory values; this calibration is not a replacement for the full BOM. Apply those verified rules to every fallback material and check the first-level values against that successful capability result. If the rules cannot be established, state that the inventory caliber remains unverified rather than presenting a different scope as the requested result. For inventory, state the actual warehouse names/scope, which field is available stock, how reserved stock is handled, and whether in-transit supply is included. Use the available-stock field definition: when it is inventory minus reserved, explicitly state that reserved is already deducted and no second deduction is made; do not describe this as inventory that excludes no reservation. Do not subtract reserved quantities again without a defined formula or equate missing inventory rows with a verified zero. Preserve inventory_uom per material; do not declare one quantity unit for the whole BOM. If scoped inventory rows are absent, mark the stock unit unknown rather than inventing it. Do not sum quantities with different units unless a defined conversion exists. Do not combine different warehouses, substitutes, or supply categories without disclosure.',
      'Prefer small documented pages for large detail results: start with page_size 25 (at most 50) when documented, because larger tool replies may spill into local files that this session cannot read. If a deep or large published-capability request times out, do not repeat the identical request, including inside run_code, or merely lower the requested depth. Use documented pagination/smaller batches where supported; otherwise use the read-only run_code fallback to query the verified BOM and the corresponding inventory directly in bounded material batches with complete pagination and the same business scope. Split long work into independently completing batches; do not combine a known failing capability with successful retrieval in one script or raise the script timeout expecting Host/gateway limits to change. Print compact requested fields and completion checks instead of entire raw responses. Preserve exact filters, schema, network and interaction context, check completeness, and disclose the failed capability and fallback source. If full retrieval still fails, finish as failed and state precisely what is missing.',
      'Use search_schema then targeted get_object_types or get_relation_types when the needed schema is unknown. Schema fallback rule: if get_kn_detail returns a rendering, structured-output, or validation error, do not retry get_kn_detail with another format or detail_level. Preserve the bound kn_id. Use search_schema at most once, only when it can directly answer the requested schema question; do not use it to derive an exact exhaustive count or list. If it cannot directly answer, finish the Interaction as failed and state that the schema detail is unavailable.',
      'No-data stopping rule: once exact identifier queries establish that the requested object/data is absent, close the Interaction and answer in at most two short sentences stating the requested identifier, no matching data, and the checked sources/scope. Do not query examples, widen to substring searches, execute unrelated capabilities, explain unused fields, or add hypothetical next steps without a user request.',
      'run_code fallback uses the platform-injected Python functions such as query_object_instance, get_object_types and execute_tool directly; their globals are available even when dir() inside the handler lists only local variables like event. Do not diagnose function availability from dir(), rebuild an MCP client with raw HTTP, inspect/print event credentials, or guess SDK imports. Follow the published function docstrings; the platform injects bkn_context into nested calls automatically, so do not pass it to those Python functions. Keep the bound kn_id on each nested business call. If a function is unavailable, use the corresponding managed MCP tool directly and state the limitation.',
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
    'For a business function, follow the capability routing rule and obey the returned use_rule and input schema before executing it.',
  ].join('\n')
}
