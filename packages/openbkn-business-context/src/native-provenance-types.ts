/** Display-only projection of OpenBKN schema 1; no payload inline values or answer offsets cross this boundary. */
export interface NativeChainNode { id: string; label: string; kind: string; role?: string; executionNodeId?: string; value?: string; status?: string; detail?: string; technical?: string }
export interface NativeChainEdge { id: string; source: string; target: string; label: string; kind?: string; role?: string; detail?: string }
export interface NativeChainGraph { nodes: NativeChainNode[]; edges: NativeChainEdge[] }
export interface NativeClaim { id: string; label: string; value?: string; status: string; supportStatus?: string; attributionStatus?: string; nodeIds: string[]; requirementIds?: string[]; detail?: string; objectLabel?: string; derivation?: { method: string; processName: string; formula?: string; verification?: string; boundary: string; inputs: { label: string; value: string }[]; components: { label: string; value: string }[] } }
export interface NativeRequirement { id: string; label: string; status: string; claimIds: string[] }
export interface NativeBusinessFunction {
  id: string; displayName: string; capabilityKind: string; businessPurpose: string
  businessInputs: { name: string; value?: string; sourceKind?: string; sourceRef?: string; evidenceRefs?: string[] }[]
  logicSummary: string; businessOutputs: { summary: string; evidenceRefs: string[]; adoptedRowRefs: string[] }[]
  operationIds: string[]; supportsClaimIds: string[]; schemaRefs: string[]; validationStatus: string; reasonCode?: string
}
export interface NativePairGraph {
  claims: NativeClaim[]; evidenceNodes: NativeChainNode[]; schemaNodes: NativeChainNode[]
  businessFunctions: NativeBusinessFunction[]
  executionSteps: { id: string; operationId: string; attempt: number; businessRole: string; interfaceName: string; status: string; timeRailItemId: string }[]
  edges: { edgeId: string; kind: string; fromId: string; toId: string; operationIds: string[]; validationStatus: string; reasonCode?: string }[]
}
export interface NativeTimeItem {
  id: string; order: number; operation_id: string; attempt: number; interface_name: string; protocol: string; status: string
  started_at: string; finished_at?: string; duration_ms?: number; parent_operation_id?: string
}
export interface NativeExplanation {
  interactionId: string; question?: string; answer?: string; status: string; evidenceStatus?: string; generationStatus?: string
  requirements?: NativeRequirement[]; claims: NativeClaim[]; execution: NativeChainGraph; evidence: NativeChainGraph
  notices?: string[]; timeRail?: NativeTimeItem[]
  questionPairs?: { id: string; question: string; answer: string; summary: string; status: string; reasonCode?: string; claimIds: string[] }[]
  selectedPairGraphs?: Record<string, NativePairGraph>
}
export type NativeReadFailure = 'authentication-required' | 'access-denied' | 'not-disclosed-or-unavailable' | 'invalid-response' | 'result-too-large' | 'unavailable'
export type NativeExplanationResult = { kind: 'ready'; generatedAt: string; view: NativeExplanation } | { kind: 'not-generated' } | { kind: 'unavailable'; reason: NativeReadFailure }
export interface NativeRecordIntegrity { status: 'complete' | 'missing'; checked_at: string; scope: 'registered_call_records'; missing: { operation_id: string; attempt: number; tool_name?: string; reason: string; field: string }[] }
export interface NativeInteractionDetail { recordIntegrity?: NativeRecordIntegrity; recordIntegrityCheckFailed?: boolean; knowledgeNetworkIds: string[]; interactionId: string; question?: string; answer?: string; timeRail: NativeTimeItem[] }
export interface NativeProvenance {
  detail: { kind: 'ready'; view: NativeInteractionDetail } | { kind: 'unavailable'; reason: NativeReadFailure }
  explanation: NativeExplanationResult
}
