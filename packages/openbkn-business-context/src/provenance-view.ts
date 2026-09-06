import type {
  ProvenanceBusinessElement,
  ProvenanceBusinessOperation,
  ProvenanceConversationContext,
  ProvenanceContextRelation,
  ProvenanceDerivedFact,
  ProvenanceHandle,
  ProvenanceOperationView,
  ProvenanceView,
} from './types.js'

export interface ProvenanceViewLimits {
  readonly maxGraphNodes: number
  readonly maxGraphEdges: number
}

/**
 * Projects Community execution facts plus the exact EE-owned interaction
 * projection. It never derives BKN mappings from raw Core or MCP payloads.
 */
export function buildProvenanceView(
  handle: ProvenanceHandle,
  operationsResponse: unknown,
  enterpriseProjection: unknown | undefined,
  limits: ProvenanceViewLimits,
): ProvenanceView {
  return {
    interactionId: handle.interactionId,
    execution: {
      status: handle.status,
      operations: projectOperations(operationRecords(operationsResponse)),
    },
    business: projectBusiness(enterpriseProjection, operationsResponse, limits),
    evidence: { kind: 'unavailable' },
  }
}

function projectOperations(value: unknown): readonly ProvenanceOperationView[] {
  return records(value).flatMap(entry => {
    const id = stringValue(entry.operation_id)
    if (id === undefined) return []
    return [{
      id,
      label: stringValue(entry.tool_name) ?? stringValue(entry.source_module) ?? stringValue(entry.protocol) ?? 'OpenBKN operation',
      protocol: stringValue(entry.protocol),
      // The EE projection distinguishes semantic-resolution status from the
      // actual call status. Keep the execution pane factual when it is used
      // as the compatible source for an unavailable Core read model.
      status: stringValue(entry.call_status) ?? stringValue(entry.execution_status) ?? stringValue(entry.status),
      startedAt: stringValue(entry.started_at),
      finishedAt: stringValue(entry.finished_at),
      requestId: stringValue(entry.request_id),
      traceId: stringValue(entry.trace_id),
      receiptId: stringValue(entry.receipt_id),
    }]
  })
}

function projectBusiness(value: unknown | undefined, operationsResponse: unknown, limits: ProvenanceViewLimits) {
  const graph = record(value)
  const assembly = graph === undefined ? undefined : record(graph.assembly)
  if (assembly === undefined) return { kind: 'unavailable' } as const
  const elementsRemaining = { value: limits.maxGraphNodes }
  const edgesRemaining = { value: limits.maxGraphEdges }
  const coreLabels = new Map(projectOperations(operationRecords(operationsResponse)).map(operation => [operation.id, operation.label]))
  const byOperation = new Map<string, ProvenanceBusinessOperation>()
  for (const edge of records(assembly.operation_business_edges)) {
    if (edgesRemaining.value < 1) break
    const operationId = stringValue(edge.operation_id)
    const element = projectTraceBusinessRef(record(edge.business_ref), elementsRemaining)
    if (operationId === undefined || element === undefined) continue
    edgesRemaining.value -= 1
    const existing = byOperation.get(operationId)
    if (existing !== undefined) {
      byOperation.set(operationId, { ...existing, elements: [...existing.elements, element] })
      continue
    }
    byOperation.set(operationId, {
      id: operationId,
      attempt: 0,
      toolName: coreLabels.get(operationId) ?? 'OpenBKN operation',
      status: 'resolved',
      elements: [element],
      missingFacts: [],
    })
  }
  return {
    kind: 'ready' as const,
    operations: [...byOperation.values()],
    // The Trace 3 interaction graph currently contracts operation-to-ref
    // links, not object-to-object semantic relations or cross-turn facts.
    // Preserve that distinction instead of deriving a richer graph locally.
    conversationContext: [],
    contextRelations: [],
    derivedFacts: [],
  }
}

function projectTraceBusinessRef(entry: Record<string, unknown> | undefined, remaining: { value: number }): ProvenanceBusinessElement | undefined {
  if (entry === undefined || remaining.value < 1) return undefined
  const technicalRef = record(entry.technical_ref)
  const display = record(entry.display)
  const id = technicalRef === undefined ? undefined : stringValue(technicalRef.ref_id)
  const kind = technicalRef === undefined ? undefined : traceRefKind(technicalRef.ref_type)
  const name = display === undefined ? undefined : stringValue(display.name)
  if (id === undefined || kind === undefined || name === undefined) return undefined
  remaining.value -= 1
  return { id, kind, name }
}

function projectBusinessOperation(entry: Record<string, unknown>, elementsRemaining: { value: number }): readonly ProvenanceBusinessOperation[] {
  const id = stringValue(entry.operation_id)
  const attempt = numberValue(entry.attempt)
  const toolName = stringValue(entry.tool_name)
  const status = provenanceStatus(entry.status)
  if (id === undefined || attempt === undefined || toolName === undefined || status === undefined) return []
  const elements = records(entry.elements).flatMap(element => projectBusinessElement(element, elementsRemaining))
  return [{ id, attempt, toolName, status, knowledgeNetworkId: stringValue(entry.knowledge_network_id), elements, missingFacts: stringArray(entry.missing_facts) }]
}

function projectBusinessElement(entry: Record<string, unknown>, remaining: { value: number }): readonly ProvenanceBusinessElement[] {
  if (remaining.value < 1) return []
  const kind = elementKind(entry.kind)
  const id = stringValue(entry.id)
  const name = stringValue(entry.name)
  if (kind === undefined || id === undefined || name === undefined) return []
  remaining.value -= 1
  const parentId = stringValue(entry.parent_id)
  const field = stringValue(entry.field)
  return [{ kind, id, name, ...(parentId === undefined ? {} : { parentId }), ...(field === undefined ? {} : { field }) }]
}

function projectConversationContext(entry: Record<string, unknown>): readonly ProvenanceConversationContext[] {
  const knowledgeNetworkId = stringValue(entry.knowledge_network_id)
  const sourceInteractionId = stringValue(entry.source_interaction_id)
  const sourceOperationId = stringValue(entry.source_operation_id)
  return knowledgeNetworkId === undefined || sourceInteractionId === undefined || sourceOperationId === undefined ? [] : [{ knowledgeNetworkId, sourceInteractionId, sourceOperationId }]
}

function projectContextRelation(entry: Record<string, unknown>, remaining: { value: number }): readonly ProvenanceContextRelation[] {
  if (remaining.value < 1) return []
  const id = stringValue(entry.id)
  const knowledgeNetworkId = stringValue(entry.knowledge_network_id)
  const name = stringValue(entry.name)
  const sourceObjectId = stringValue(entry.source_object_id)
  const targetObjectId = stringValue(entry.target_object_id)
  if (id === undefined || knowledgeNetworkId === undefined || name === undefined || sourceObjectId === undefined || targetObjectId === undefined) return []
  remaining.value -= 1
  return [{ id, knowledgeNetworkId, name, sourceObjectId, targetObjectId }]
}

function projectDerivedFact(entry: Record<string, unknown>, remaining: { value: number }): readonly ProvenanceDerivedFact[] {
  if (remaining.value < 1) return []
  const rule = stringValue(entry.rule)
  const sourceOperationId = stringValue(entry.source_operation_id)
  const operationId = stringValue(entry.operation_id)
  const elementId = stringValue(entry.element_id)
  if (rule === undefined || sourceOperationId === undefined || operationId === undefined || elementId === undefined) return []
  remaining.value -= 1
  return [{ rule, sourceOperationId, operationId, elementId }]
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}

function records(value: unknown): readonly Record<string, unknown>[] {
  return Array.isArray(value) ? value.flatMap(item => record(item) === undefined ? [] : [record(item)!]) : []
}

/** Community deployments expose either `entries` or the documented `operations` list. */
function operationRecords(value: unknown): unknown {
  const response = record(value)
  return response?.entries ?? response?.operations
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 512) : undefined
}

function stringArray(value: unknown): readonly string[] {
  return Array.isArray(value) ? value.flatMap(item => stringValue(item) === undefined ? [] : [stringValue(item)!]).slice(0, 32) : []
}

function numberValue(value: unknown): number | undefined { return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : undefined }
function provenanceStatus(value: unknown): ProvenanceBusinessOperation['status'] | undefined { return value === 'resolved' || value === 'ambiguous' || value === 'unresolved' || value === 'not_evaluable' ? value : undefined }
function elementKind(value: unknown): ProvenanceBusinessElement['kind'] | undefined { return value === 'object' || value === 'relation' || value === 'action' || value === 'property' || value === 'logic' || value === 'metric' ? value : undefined }
function traceRefKind(value: unknown): ProvenanceBusinessElement['kind'] | undefined {
  switch (value) {
    case 'object': case 'object_type': case 'object_instance': case 'knowledge_network': return 'object'
    case 'relation': case 'relation_type': return 'relation'
    case 'action': case 'action_type': return 'action'
    case 'property': case 'property_type': return 'property'
    case 'logic': case 'logic_property': return 'logic'
    case 'metric': return 'metric'
    default: return undefined
  }
}
