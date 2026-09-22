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

/**
 * Bounded, display-safe references for one completed OpenBKN-backed DSH turn.
 *
 * Schema v2 adds the identifiers the OpenBKN MCP lifecycle responses actually
 * disclose (`conversation_id`, plus the turn number for timeline rebuild).
 * Request/Trace/Receipt ids remain in the shape because the handle is the
 * designated home once the platform discloses them, but the verified contract
 * (2026-09-20) puts them only in the platform operations read model, never in
 * MCP tool results, so they stay empty for now and `partial` stays true.
 */
export interface ProvenanceHandle {
  readonly schemaVersion: 2
  readonly interactionId: string
  readonly requestIds: readonly string[]
  readonly traceIds: readonly string[]
  readonly receiptIds: readonly string[]
  readonly status: 'completed' | 'failed'
  readonly partial: boolean
  /** Conversation id returned by this turn's OpenBKN lifecycle responses. */
  readonly conversationId?: string
  /** DSH turn number; locates this turn's events when rebuilding the timeline. */
  readonly turn?: number
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

/** Reserved for a platform conversation-context contract that has not been disclosed yet; no producer today. */
export interface ProvenanceConversationContext {
  readonly knowledgeNetworkId: string
  readonly sourceInteractionId: string
  readonly sourceOperationId: string
}

/** Reserved for a platform cross-operation derivation contract that has not been disclosed yet; no producer today. */
export interface ProvenanceDerivedFact {
  readonly rule: string
  readonly sourceOperationId: string
  readonly operationId: string
  readonly elementId: string
}

/** Reserved for a platform object-to-object relation contract that has not been disclosed yet; no producer today. */
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

/**
 * One node of the local execution timeline (Layer 0), rebuilt from DSH session
 * events at read time. `summary` is a Host-side whitelist projection; raw MCP
 * payloads never reach the browser.
 */
export interface ProvenanceTimelineNode {
  /** Display order within this turn, starting at 0. */
  readonly seq: number
  readonly kind: 'question' | 'lifecycle' | 'managed' | 'answer'
  /** Short name without the mcp__openbkn__ prefix; present on tool nodes only. */
  readonly tool?: string
  /** SessionEvent.time (epoch ms). */
  readonly at: number
  /** result.time - call.time; omitted when no result event exists. */
  readonly durationMs?: number
  readonly outcome?: 'ok' | 'error'
  /** Whitelist-projected summary; never raw arguments or response bodies. */
  readonly summary?: string
  /** Layer 1 facts attached when alignment is unambiguous; otherwise omitted. */
  readonly platform?: {
    readonly operationId?: string
    readonly requestId?: string
    readonly traceId?: string
    readonly receiptId?: string
    readonly status?: string
  }
}

/** Why the evidence pane cannot show receipts for this turn. */
export type EvidenceUnavailableReason =
  | /** This turn produced no receipts at all (e.g. a schema-only query). */
  'no-receipts'
  | /** The business domain or deployment license does not authorize the read. */
  'not-authorized'
  | 'platform-unavailable'

/** One durable receipt reference; verification stays a host-side CLI hint. */
export interface ProvenanceReceiptRef {
  readonly receiptId: string
  readonly operationId?: string
  readonly toolLabel?: string
  readonly status?: string
  readonly source: 'platform' | 'mcp-result'
  /** Copyable verification hint, e.g. `openbkn trace receipts get <id>`; never executed. */
  readonly verifyHint?: string
  // No receipt-content fields: the platform has not disclosed a receipt detail
  // contract (V2, docs/evidence/2026-09-20-provenance-v1-v2.md), so none is
  // defined here.
}

export type ProvenanceEvidenceView =
  | { readonly kind: 'unavailable'; readonly reason: EvidenceUnavailableReason }
  | { readonly kind: 'ready'; readonly receipts: readonly ProvenanceReceiptRef[] }

export type ProvenanceDegradationReason =
  | 'license-required'
  | 'domain-not-authorized'
  | 'authentication-required'
  | 'platform-unavailable'

/** One pane that could not be completed, with the platform's own next step. */
export interface ProvenanceDegradation {
  readonly pane: 'operations' | 'business' | 'evidence'
  readonly reason: ProvenanceDegradationReason
  readonly edition?: string
  /** The platform's required_action, passed through truncated. */
  readonly requiredAction?: string
}

/** Which layer each pane of the view came from. */
export interface ProvenanceSources {
  readonly timeline: 'local-session'
  readonly operations: 'platform' | 'unavailable'
  readonly business: 'platform-enterprise' | 'unavailable'
  readonly evidence: 'platform' | 'mcp-result' | 'unavailable'
  readonly degraded: readonly ProvenanceDegradation[]
}

export interface ProvenanceView {
  readonly interactionId: string
  readonly conversationId?: string
  readonly sources: ProvenanceSources
  /** Layer 0: rebuilt from local session events; always non-empty for a recorded turn. */
  readonly timeline: readonly ProvenanceTimelineNode[]
  readonly execution: { readonly status?: string; readonly operations: readonly ProvenanceOperationView[] }
  readonly business: ProvenanceBusinessView
  readonly evidence: ProvenanceEvidenceView
}
