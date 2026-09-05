/** Safe, UI-ready representation of OpenBKN authentication state. */
export type AuthSnapshot =
  | { readonly kind: 'authenticated'; readonly baseUrl: string; readonly userId?: string; readonly username?: string }
  | { readonly kind: 'authentication-required'; readonly baseUrl: string }
  | { readonly kind: 'platform-mismatch'; readonly expectedBaseUrl: string; readonly actualBaseUrl: string }

/** The only platform-network fields allowed to cross from Host to Client. */
export interface BusinessNetworkSummary {
  readonly id: string
  readonly displayName: string
  readonly description?: string
  /** A local DSH workspace previously chosen for this network, if any. */
  readonly workspacePath?: string
}

/** Immutable network identity that may cross the generated Host/Client boundary. */
export interface BusinessNetworkBinding {
  readonly platformBaseUrl: string
  readonly knowledgeNetworkId: string
  readonly displayName: string
}

/** Bounded, display-safe references for one completed OpenBKN-backed DSH turn. */
export interface ProvenanceHandle {
  readonly schemaVersion: 1
  readonly interactionId: string
  readonly requestIds: readonly string[]
  readonly traceIds: readonly string[]
  readonly receiptIds: readonly string[]
  readonly status: 'completed' | 'failed'
  readonly partial: boolean
}

/** Public, bounded DTO returned by the Host-only provenance reader. */
export interface ProvenanceOperationView {
  readonly id: string
  readonly label: string
  readonly protocol?: string
  readonly status?: string
  readonly startedAt?: string
  readonly finishedAt?: string
  readonly requestId?: string
  readonly traceId?: string
  readonly receiptId?: string
}

/** A display-safe element resolved by the Enterprise provenance service. */
export interface ProvenanceBusinessElement {
  readonly kind: 'object' | 'relation' | 'action' | 'property' | 'logic' | 'metric'
  readonly id: string
  readonly name: string
  readonly parentId?: string
  readonly field?: string
}

/** An Enterprise resolver result. The Host copies these facts; it does not derive mappings. */
export interface ProvenanceBusinessOperation {
  readonly id: string
  readonly attempt: number
  readonly toolName: string
  readonly knowledgeNetworkId?: string
  readonly status: 'resolved' | 'ambiguous' | 'unresolved' | 'not_evaluable'
  readonly elements: readonly ProvenanceBusinessElement[]
  readonly missingFacts: readonly string[]
}

export interface ProvenanceConversationContext {
  readonly knowledgeNetworkId: string
  readonly sourceInteractionId: string
  readonly sourceOperationId: string
}

export interface ProvenanceDerivedFact {
  readonly rule: string
  readonly sourceOperationId: string
  readonly operationId: string
  readonly elementId: string
}

/** A relationship disclosed by the Enterprise Interaction projection. */
export interface ProvenanceContextRelation {
  readonly id: string
  readonly knowledgeNetworkId: string
  readonly name: string
  readonly sourceObjectId: string
  readonly targetObjectId: string
}

/** Enterprise BFF state, deliberately separate from Community execution facts. */
export type ProvenanceBusinessView =
  | { readonly kind: 'unavailable' }
  | {
    readonly kind: 'ready'
    readonly operations: readonly ProvenanceBusinessOperation[]
    readonly conversationContext: readonly ProvenanceConversationContext[]
    readonly derivedFacts: readonly ProvenanceDerivedFact[]
    readonly contextRelations: readonly ProvenanceContextRelation[]
  }

/** The current Enterprise Interaction projection does not define an evidence-chain DTO. */
export type ProvenanceEvidenceView = { readonly kind: 'unavailable' }

export interface ProvenanceView {
  readonly interactionId: string
  readonly execution: { readonly status?: string; readonly operations: readonly ProvenanceOperationView[] }
  readonly business: ProvenanceBusinessView
  readonly evidence: ProvenanceEvidenceView
}
