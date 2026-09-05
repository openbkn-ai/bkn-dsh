import { normalizeProvenanceHandle } from './provenance-handle.js'
import type { ProvenanceHandle } from './types.js'

/** Durable session event binding one finalized assistant message to one OpenBKN interaction. */
export const TURN_PROVENANCE_EVENT = 'openbkn/turn-provenance'

export interface TurnProvenanceEvent {
  readonly type: typeof TURN_PROVENANCE_EVENT
  readonly data: { readonly messageId: string; readonly handle: ProvenanceHandle }
}

interface SessionEventLike {
  readonly type: string
  readonly data: unknown
}

/** A completed message cannot be rewritten to point at a different interaction. */
export class TurnProvenanceConflictError extends Error {
  constructor(readonly messageId: string) {
    super(`Assistant message ${messageId} already has a different OpenBKN provenance handle.`)
    this.name = 'TurnProvenanceConflictError'
  }
}

/** Return the one append-only provenance event to write, or undefined if already recorded identically. */
export function appendTurnProvenance(
  events: readonly SessionEventLike[],
  messageId: string,
  handle: ProvenanceHandle,
): TurnProvenanceEvent | undefined {
  const normalizedMessageId = normalizeMessageId(messageId)
  const normalizedHandle = normalizeProvenanceHandle(handle)
  const existing = readTurnProvenance(events, normalizedMessageId)
  if (existing === undefined) {
    return { type: TURN_PROVENANCE_EVENT, data: { messageId: normalizedMessageId, handle: normalizedHandle } }
  }
  if (!sameHandle(existing, normalizedHandle)) throw new TurnProvenanceConflictError(normalizedMessageId)
  return undefined
}

/** Recover the committed handle for exactly one finalized assistant message. */
export function readTurnProvenance(
  events: readonly SessionEventLike[],
  messageId: string,
): ProvenanceHandle | undefined {
  const normalizedMessageId = normalizeMessageId(messageId)
  let handle: ProvenanceHandle | undefined
  for (const event of events) {
    if (event.type !== TURN_PROVENANCE_EVENT) continue
    const candidate = parseTurnProvenanceEvent(event.data)
    if (candidate.messageId !== normalizedMessageId) continue
    if (handle === undefined) {
      handle = candidate.handle
    } else if (!sameHandle(handle, candidate.handle)) {
      throw new TurnProvenanceConflictError(normalizedMessageId)
    }
  }
  return handle
}

function parseTurnProvenanceEvent(value: unknown): TurnProvenanceEvent['data'] {
  if (!isRecord(value)) throw new TypeError('OpenBKN turn provenance event is malformed.')
  return {
    messageId: normalizeMessageId(value.messageId),
    handle: normalizeProvenanceHandle(value.handle),
  }
}

function normalizeMessageId(value: unknown): string {
  if (typeof value !== 'string') throw new TypeError('OpenBKN turn provenance message id is invalid.')
  const normalized = value.trim()
  if (normalized.length === 0 || normalized.length > 256) {
    throw new TypeError('OpenBKN turn provenance message id is invalid.')
  }
  return normalized
}

function sameHandle(left: ProvenanceHandle, right: ProvenanceHandle): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
