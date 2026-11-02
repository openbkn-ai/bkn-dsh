/** Locally owned JSON codec for the generated Host/Client Remote boundary. */
export type ProvenanceDetailJsonValue = null | boolean | number | string | ProvenanceDetailJsonValue[] | { [key: string]: ProvenanceDetailJsonValue }

/** Fixed platform operations only. The Host derives the platform and conversation. */
export interface ProvenanceDetailRequest {
  readonly kind: 'conversation' | 'rounds' | 'detail' | 'explanation' | 'markdown' | 'history' | 'generate' | 'analyze'
  readonly interactionId?: string
  readonly page?: number
  readonly pageSize?: number
  readonly keyword?: string
  /** Compatibility snapshot for the platform analysis endpoint; never used as an answer oracle. */
  readonly markdown?: string
}

export type ProvenanceDetailFailure = 'ACCESS_DENIED' | 'NATIVE_NOT_AVAILABLE' | 'AUTHENTICATION_REQUIRED'
  | 'LICENSE_REQUIRED' | 'RECORD_NOT_DISCLOSED' | 'PLATFORM_MISMATCH' | 'PLATFORM_UNAVAILABLE'
  | 'REQUEST_ABORTED' | 'OUTPUT_OVERFLOW' | 'INVALID_RESPONSE' | 'IDENTITY_CHANGED'
  | 'TRACE_DISABLED' | 'TRACE_UNAVAILABLE' | 'SESSION_UNAVAILABLE' | 'HANDLE_UNAVAILABLE'
  | 'BINDING_REQUIRED' | 'CERTIFICATE_UNTRUSTED' | 'CERTIFICATE_INVALID' | 'NETWORK_TIMEOUT'

/** Authentication credentials and raw exception messages never cross this stream. */
export type ProvenanceDetailEvent =
  | { readonly kind: 'context'; readonly conversationId: string; readonly initialInteractionId: string; readonly interactionId: string; readonly knowledgeNetworkId: string }
  | { readonly kind: 'result'; readonly value: ProvenanceDetailJsonValue }
  | { readonly kind: 'chunk'; readonly index: number; readonly encoding: 'json' | 'text'; readonly content: string }
  | { readonly kind: 'end'; readonly chunks: number; readonly encoding: 'json' | 'text' }
  | { readonly kind: 'analysis'; readonly event: string; readonly data: ProvenanceDetailJsonValue }
  | { readonly kind: 'failure'; readonly code: ProvenanceDetailFailure; readonly httpStatus?: number }

export interface ProvenanceDetailIdentity {
  readonly conversationId: string
  readonly initialInteractionId: string
  readonly knowledgeNetworkId: string
}

export const PROVENANCE_DETAIL_LIMITS = {
  wireBytes: 8 * 1024 * 1024,
  // Full detail includes operation payloads; keep other endpoint budgets unchanged.
  detailWireBytes: 16 * 1024 * 1024,
  chunkCharacters: 128 * 1024,
  listPageSize: 50,
  membershipPages: 100,
  markdownBytes: 1024 * 1024,
  actionTimeoutMs: 300_000,
} as const

export function provenanceDetailResponseLimit(kind: ProvenanceDetailRequest['kind']): number {
  return kind === 'detail' ? PROVENANCE_DETAIL_LIMITS.detailWireBytes : PROVENANCE_DETAIL_LIMITS.wireBytes
}
