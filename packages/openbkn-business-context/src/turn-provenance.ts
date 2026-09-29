import { normalizeProvenanceHandle, sameProvenanceHandle } from './provenance-handle.js'
import type { ProvenanceHandle } from './types.js'

/**
 * Session event earlier plugin releases appended to bind one finalized
 * assistant message to one OpenBKN interaction. Provenance is now re-derived
 * from the log; existing events stay readable and must agree with it.
 */
export const TURN_PROVENANCE_EVENT = 'openbkn/turn-provenance'

/** The same event after DSH's session-format v3→v4 `plugin:` namespacing of ignorable extensions. */
export const MIGRATED_TURN_PROVENANCE_EVENT = `plugin:${TURN_PROVENANCE_EVENT}`

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

/** Recover the committed handle for exactly one finalized assistant message. */
export function readTurnProvenance(
  events: readonly SessionEventLike[],
  messageId: string,
): ProvenanceHandle | undefined {
  const normalizedMessageId = normalizeMessageId(messageId)
  let handle: ProvenanceHandle | undefined
  for (const event of events) {
    if (event.type !== TURN_PROVENANCE_EVENT && event.type !== MIGRATED_TURN_PROVENANCE_EVENT) continue
    const candidate = parseTurnProvenanceEvent(event.data)
    if (candidate.messageId !== normalizedMessageId) continue
    if (handle === undefined) {
      handle = candidate.handle
    } else if (!sameProvenanceHandle(handle, candidate.handle)) {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
