import type {
  EvidenceUnavailableReason,
  ProvenanceBusinessElement,
  ProvenanceBusinessOperation,
  ProvenanceDegradation,
  ProvenanceEvidenceView,
  ProvenanceHandle,
  ProvenanceOperationView,
  ProvenanceReceiptRef,
  ProvenanceSources,
  ProvenanceTimelineNode,
  ProvenanceView,
} from './types.js'

export interface ProvenanceViewLimits {
  readonly maxGraphNodes: number
  readonly maxGraphEdges: number
}

/** Platform read failures the service already classified, keyed by pane. */
export interface ProvenanceViewDegradations {
  readonly operations?: ProvenanceDegradation
  readonly business?: ProvenanceDegradation
}

/**
 * Assemble the layered provenance view: the local timeline (Layer 0) always
 * renders, while platform facts (Layer 1) and the enterprise projection
 * (Layer 2) only refine their own panes. It never derives BKN mappings from
 * raw Core or MCP payloads, and never blocks one layer behind another.
 */
export function buildProvenanceView(
  handle: ProvenanceHandle,
  timeline: readonly ProvenanceTimelineNode[],
  operationsResponse: unknown | undefined,
  enterpriseProjection: unknown | undefined,
  degradations: ProvenanceViewDegradations,
  limits: ProvenanceViewLimits,
): ProvenanceView {
  const operations = operationsResponse === undefined ? [] : projectOperations(operationRecords(operationsResponse))
  const business = projectBusiness(enterpriseProjection, operationsResponse, limits)
  const evidence = projectEvidence(operations, handle, degradations.operations)
  const sources = projectSources(operationsResponse, business, evidence, degradations)
  return {
    interactionId: handle.interactionId,
    ...(handle.conversationId === undefined ? {} : { conversationId: handle.conversationId }),
    sources,
    timeline: attachPlatformFacts(timeline, operations),
    execution: {
      status: handle.status,
      operations,
    },
    business,
    evidence,
  }
}

/** Only retryable platform failures keep the unavailable wording; authorization and missing-record causes read differently. */
function evidenceReasonFor(reason: ProvenanceDegradation['reason']): EvidenceUnavailableReason {
  if (reason === 'platform-unavailable') return 'platform-unavailable'
  if (reason === 'record-not-disclosed') return 'record-not-disclosed'
  return 'not-authorized'
}

function projectSources(
  operationsResponse: unknown | undefined,
  business: ProvenanceView['business'],
  evidence: ProvenanceEvidenceView,
  degradations: ProvenanceViewDegradations,
): ProvenanceSources {
  const degraded: ProvenanceDegradation[] = []
  if (degradations.operations !== undefined) degraded.push(degradations.operations)
  if (degradations.business !== undefined) degraded.push(degradations.business)
  if (evidence.kind === 'unavailable' && evidence.reason !== 'no-receipts' && degradations.operations !== undefined) {
    degraded.push({ ...degradations.operations, pane: 'evidence' })
  }
  return {
    timeline: 'local-session',
    operations: operationsResponse === undefined ? 'unavailable' : 'platform',
    business: business.kind === 'ready' ? 'platform-enterprise' : 'unavailable',
    evidence: evidence.kind === 'ready'
      ? evidence.receipts.some(receipt => receipt.source === 'platform') ? 'platform' : 'mcp-result'
      : 'unavailable',
    degraded,
  }
}

/**
 * Attach Layer 1 operation facts to Layer 0 tool nodes. Alignment is by tool
 * name plus order within the interaction; any count mismatch or missing
 * started_at abandons that tool's whole group — a missing platform fact is
 * preferable to a wrong one.
 */
function attachPlatformFacts(
  timeline: readonly ProvenanceTimelineNode[],
  operations: readonly ProvenanceOperationView[],
): readonly ProvenanceTimelineNode[] {
  if (timeline.length === 0 || operations.length === 0) return timeline
  const nodesByTool = new Map<string, { index: number; node: ProvenanceTimelineNode }[]>()
  timeline.forEach((node, index) => {
    if (node.tool === undefined) return
    const group = nodesByTool.get(node.tool) ?? []
    group.push({ index, node })
    nodesByTool.set(node.tool, group)
  })
  const operationsByTool = new Map<string, ProvenanceOperationView[]>()
  for (const operation of operations) {
    const tool = operation.label
    const group = operationsByTool.get(tool) ?? []
    group.push(operation)
    operationsByTool.set(tool, group)
  }
  const platformByIndex = new Map<number, NonNullable<ProvenanceTimelineNode['platform']>>()
  for (const [tool, nodes] of nodesByTool) {
    const toolOperations = (operationsByTool.get(tool) ?? [])
      .slice()
      .sort((left, right) => compareTimestamp(left.startedAt, right.startedAt))
    if (toolOperations.length !== nodes.length || toolOperations.some(operation => operation.startedAt === undefined)) continue
    for (let index = 0; index < nodes.length; index += 1) {
      const operation = toolOperations[index]!
      platformByIndex.set(nodes[index]!.index, {
        ...(operation.id === undefined ? {} : { operationId: operation.id }),
        ...(operation.requestId === undefined ? {} : { requestId: operation.requestId }),
        ...(operation.traceId === undefined ? {} : { traceId: operation.traceId }),
        ...(operation.receiptId === undefined ? {} : { receiptId: operation.receiptId }),
        ...(operation.status === undefined ? {} : { status: operation.status }),
      })
    }
  }
  if (platformByIndex.size === 0) return timeline
  return timeline.map((node, index) => platformByIndex.has(index) ? { ...node, platform: platformByIndex.get(index) } : node)
}

/**
 * Receipt references come from the platform operations read model first; ids
 * disclosed inside MCP results (none in the verified contract) follow. An
 * authorized turn with no receipt-bearing operations is a `no-receipts` fact,
 * kept visibly distinct from an unauthorized read.
 */
function projectEvidence(
  operations: readonly ProvenanceOperationView[],
  handle: ProvenanceHandle,
  operationsDegradation: ProvenanceDegradation | undefined,
): ProvenanceEvidenceView {
  const receipts: ProvenanceReceiptRef[] = []
  for (const operation of operations) {
    if (operation.receiptId === undefined) continue
    receipts.push({
      receiptId: operation.receiptId,
      ...(operation.id === undefined ? {} : { operationId: operation.id }),
      ...(operation.label === undefined ? {} : { toolLabel: operation.label }),
      ...(operation.status === undefined ? {} : { status: operation.status }),
      source: 'platform',
      verifyHint: `openbkn trace receipts get ${operation.receiptId}`,
    })
  }
  for (const receiptId of handle.receiptIds) {
    if (receipts.some(receipt => receipt.receiptId === receiptId)) continue
    receipts.push({ receiptId, source: 'mcp-result' })
  }
  if (receipts.length > 0) return { kind: 'ready', receipts }
  if (operationsDegradation === undefined) return { kind: 'unavailable', reason: 'no-receipts' }
  return {
    kind: 'unavailable',
    reason: evidenceReasonFor(operationsDegradation.reason),
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

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}

function records(value: unknown): readonly Record<string, unknown>[] {
  return Array.isArray(value) ? value.flatMap(item => record(item) === undefined ? [] : [record(item)!]) : []
}

/** Community deployments expose either `entries` or the documented `operations` list. */
function operationRecords(value: unknown): unknown[] {
  const response = record(value)
  const candidates = response?.entries ?? response?.operations
  return Array.isArray(candidates) ? candidates : []
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim().slice(0, 512) : undefined
}

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

function compareTimestamp(left: string | undefined, right: string | undefined): number {
  return (left ?? '').localeCompare(right ?? '')
}
