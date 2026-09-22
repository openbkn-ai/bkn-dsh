import type { ProvenanceHandle } from './types.js'

export type { ProvenanceHandle } from './types.js'

const MAX_IDENTIFIERS = 32

/**
 * Validate untrusted session metadata before it becomes a Client-visible
 * provenance reference. Schema v1 events are upgraded in memory to the v2
 * shape (new fields left empty) and are never rewritten to the session log.
 */
export function normalizeProvenanceHandle(value: unknown): ProvenanceHandle {
  if (!isRecord(value)) throw new TypeError('Provenance handle must be an object.')
  if (value.schemaVersion !== 1 && value.schemaVersion !== 2) throw new TypeError('Unsupported provenance handle schema version.')
  if (value.status !== 'completed' && value.status !== 'failed') throw new TypeError('Provenance handle must describe a completed turn.')
  if (typeof value.partial !== 'boolean') throw new TypeError('Provenance handle partial state is invalid.')
  const conversationId = value.schemaVersion === 2 ? optionalIdentifier(value.conversationId) : undefined
  const turn = value.schemaVersion === 2 && typeof value.turn === 'number' && Number.isSafeInteger(value.turn) && value.turn >= 0 ? value.turn : undefined
  return {
    schemaVersion: 2,
    interactionId: identifier(value.interactionId, 'interaction id'),
    requestIds: identifiers(value.requestIds, 'request ids'),
    traceIds: identifiers(value.traceIds, 'trace ids'),
    receiptIds: identifiers(value.receiptIds, 'receipt ids'),
    status: value.status,
    partial: value.partial,
    ...(conversationId === undefined ? {} : { conversationId }),
    ...(turn === undefined ? {} : { turn }),
  }
}

/**
 * Identity comparison for conflict detection. A completed message may not be
 * rewritten to point at a different interaction; the v2 enrichment fields
 * (conversation id, turn, collected request/trace/receipt ids) refine the same
 * turn's record, so a stored v1 event and its v2 re-capture must compare
 * equal instead of raising a conflict.
 */
export function sameProvenanceHandle(left: ProvenanceHandle, right: ProvenanceHandle): boolean {
  return left.interactionId === right.interactionId && left.status === right.status
}

function identifiers(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value)) throw new TypeError(`Provenance handle ${label} are invalid.`)
  if (value.length > MAX_IDENTIFIERS) throw new RangeError(`Provenance handle ${label} exceed the limit.`)
  return [...new Set(value.map(item => identifier(item, label)))]
}

function identifier(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 256) {
    throw new TypeError(`Provenance handle ${label} is invalid.`)
  }
  return value.trim()
}

function optionalIdentifier(value: unknown): string | undefined {
  return typeof value !== 'string' || value.trim().length === 0 ? undefined : identifier(value, 'conversation id')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
