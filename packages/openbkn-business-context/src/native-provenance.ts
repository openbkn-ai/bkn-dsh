import { z } from 'zod'

import type { NativeExplanationResult, NativeInteractionDetail } from './native-provenance-types.js'
export const NATIVE_PROVENANCE_LIMITS = { wireBytes: 8 * 1024 * 1024, dtoBytes: 1_000_000, nodes: 500, edges: 1000, getTimeoutMs: 30_000 } as const
export class NativeProjectionError extends Error {
  constructor(readonly reason: 'invalid-response' | 'result-too-large') { super('Native provenance projection refused'); this.name = 'NativeProjectionError' }
}
// Zod's string maximum counts code points; the wire contract budgets UTF-16 units.
const text = z.string().superRefine((value, ctx) => {
  if (value.length > 16_384) ctx.addIssue({ code: 'too_big', origin: 'string', maximum: 16_384, inclusive: true })
}), id = z.string().min(1).max(512), optional = text.optional()
const ids = z.array(id).max(1000)
const node = z.object({ id, label: text, kind: z.enum(['relation','object','field','query','function','api','result','gap','source','calculation','conclusion']), role: z.enum(['input','output','source','context','process','fact','conclusion','gap']).optional(), executionNodeId: id.optional(), value: optional, status: z.enum(['checked','located','candidate','unbound','missing','running','completed','interrupted','failed','unknown','supported','partial','unsupported','contradicted','recorded_result']).optional(), detail: optional, technical: optional })
const edge = z.object({ id, source: id, target: id, label: text, kind: optional, role: optional, detail: optional })
const graph = z.object({ nodes: z.array(node).max(500), edges: z.array(edge).max(1000) })
const claim = z.object({ id, label: text, value: optional, status: z.enum(['checked','located','candidate','unbound','missing']), supportStatus: z.enum(['supported','partial','unsupported','contradicted']).optional(), attributionStatus: z.enum(['explicit','reconstructed','none']).optional(), nodeIds: ids, requirementIds: ids.optional(), detail: optional, objectLabel: optional, derivation: z.object({ method: z.enum(['sum','distinct_count','direct_return']), processName: text, formula: optional, verification: z.enum(['same_return','independent_cross_check']).optional(), boundary: text, inputs: z.array(z.object({ label: text, value: text })).max(128), components: z.array(z.object({ label: text, value: text })).max(128) }).optional() })
const rail = z.object({ id, order: z.number().int().nonnegative(), operation_id: id, attempt: z.number().int().nonnegative(), interface_name: text, protocol: text, status: text, started_at: text, finished_at: optional, duration_ms: z.number().nonnegative().optional(), parent_operation_id: id.optional() })
const businessFunction = z.object({
  id, displayName: text, capabilityKind: text, businessPurpose: text,
  businessInputs: z.array(z.object({ name: text, value: optional, sourceKind: optional, sourceRef: optional, evidenceRefs: ids.optional() })).max(128),
  logicSummary: text, businessOutputs: z.array(z.object({ summary: text, evidenceRefs: ids, adoptedRowRefs: ids })).max(128),
  operationIds: ids, supportsClaimIds: ids, schemaRefs: ids, validationStatus: text, reasonCode: optional,
})
const pairGraph = z.object({
  claims: z.array(claim).max(256), evidenceNodes: z.array(node).max(500), schemaNodes: z.array(node).max(500),
  businessFunctions: z.array(businessFunction).max(128),
  executionSteps: z.array(z.object({ id, operationId: id, attempt: z.number().int().nonnegative(), businessRole: text, interfaceName: text, status: text, timeRailItemId: id })).max(500),
  edges: z.array(z.object({ edgeId: id, kind: text, fromId: id, toId: id, operationIds: ids, validationStatus: text, reasonCode: optional })).max(1000),
})
const explanation = z.object({
  interactionId: id, question: optional, answer: optional, status: z.enum(['running','completed','interrupted','failed','unknown']),
  evidenceStatus: z.enum(['complete','partial','assembling','failed','not_applicable','content_unavailable']).optional(), generationStatus: z.enum(['ready','analysis_pending']).optional(),
  requirements: z.array(z.object({ id, label: text, status: z.enum(['supported','partial','unsupported','contradicted','missing']), claimIds: ids })).max(64).optional(),
  claims: z.array(claim).max(256), execution: graph, evidence: graph, notices: z.array(text).max(128).optional(), timeRail: z.array(rail).max(500).optional(),
  questionPairs: z.array(z.object({ id, question: text, answer: text, summary: text, status: text, reasonCode: optional, claimIds: ids })).max(64).optional(),
  selectedPairGraphs: z.record(id, pairGraph).superRefine((value, ctx) => {
    if (Object.keys(value).length > 64) ctx.addIssue({ code: 'too_big', origin: 'record', maximum: 64, inclusive: true })
  }).optional(),
})
function parse<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw new NativeProjectionError(parsed.error.issues.some(issue => issue.code === 'too_big') ? 'result-too-large' : 'invalid-response')
  return parsed.data
}
function admit<T>(value: T, maxBytes: number): T {
  if (new TextEncoder().encode(JSON.stringify(value)).byteLength > maxBytes) throw new NativeProjectionError('result-too-large')
  return value
}
function unique(values: readonly { id: string }[]): void {
  if (new Set(values.map(value => value.id)).size !== values.length) throw new NativeProjectionError('invalid-response')
}
export function projectNativeExplanation(value: unknown, interactionId: string, maxBytes: number = NATIVE_PROVENANCE_LIMITS.dtoBytes): Exclude<NativeExplanationResult, { kind: 'unavailable' }> {
  const row = parse(z.object({ schema_version: z.literal('1'), interaction_id: id, status: z.enum(['ready','not_generated']), generated_at: text.optional(), view: z.unknown().optional() }), value)
  if (row.interaction_id !== interactionId) throw new NativeProjectionError('invalid-response')
  if (row.status === 'not_generated') return admit({ kind: 'not-generated' }, maxBytes)
  if (row.generated_at === undefined) throw new NativeProjectionError('invalid-response')
  const view = parse(explanation, row.view)
  if (view.interactionId !== interactionId) throw new NativeProjectionError('invalid-response')
  unique(view.claims); unique(view.requirements ?? []); unique(view.questionPairs ?? []); unique(view.timeRail ?? [])
  const pairs = Object.values(view.selectedPairGraphs ?? {})
  const graphs = [view.execution, view.evidence, ...pairs.map(pair => ({ nodes: [...pair.evidenceNodes, ...pair.schemaNodes], edges: pair.edges }))]
  if (graphs.reduce((n,g) => n + g.nodes.length, 0) > NATIVE_PROVENANCE_LIMITS.nodes || graphs.reduce((n,g) => n + g.edges.length, 0) > NATIVE_PROVENANCE_LIMITS.edges) throw new NativeProjectionError('result-too-large')
  for (const g of graphs) {
    unique(g.nodes)
    unique(g.edges.map(edge => ({ id: 'edgeId' in edge ? edge.edgeId : edge.id })))
  }
  for (const pair of pairs) { unique(pair.claims); unique(pair.businessFunctions); unique(pair.executionSteps) }
  // Undisclosed endpoints stay as server records; the UI must never invent a node or edge for them.
  return admit({ kind: 'ready', generatedAt: row.generated_at, view }, maxBytes)
}
export function projectNativeDetail(value: unknown, interactionId: string, maxBytes: number = NATIVE_PROVENANCE_LIMITS.dtoBytes): NativeInteractionDetail {
  const row = parse(z.object({ interaction_id: id, interaction_question: optional, interaction_result: optional, time_rail: z.array(rail).max(500), operations: z.array(z.object({ knowledge_network_id: id.optional() })).max(500).optional(), record_integrity_check_failed: z.boolean().optional(), current_record_integrity: z.object({ status: z.enum(['complete','missing']), checked_at: text, scope: z.literal('registered_call_records'), missing: z.array(z.object({ operation_id: id, attempt: z.number().int().nonnegative(), tool_name: optional, reason: z.enum(['call_outcome_missing','record_content_missing','business_target_missing']), field: text })).max(500) }).optional() }), value)
  if (row.interaction_id !== interactionId) throw new NativeProjectionError('invalid-response')
  unique(row.time_rail)
  return admit({ recordIntegrity: row.current_record_integrity, recordIntegrityCheckFailed: row.record_integrity_check_failed, knowledgeNetworkIds: [...new Set((row.operations ?? []).flatMap(operation => operation.knowledge_network_id === undefined ? [] : [operation.knowledge_network_id]))], interactionId, question: row.interaction_question, answer: row.interaction_result, timeRail: row.time_rail }, maxBytes)
}
