import type { SessionEventMap } from '@deepseek-ai/dsh-session/types'
import {
  TURN_PROVENANCE_EVENT,
  appendTurnProvenance,
  readTurnProvenance,
  type TurnProvenanceEvent,
} from './turn-provenance.js'
import type { ProvenanceHandle } from './types.js'

declare module '@deepseek-ai/dsh-session/types' {
  interface SessionEventMap {
    /** Immutable OpenBKN references for one finalized assistant message. */
    'openbkn/turn-provenance': TurnProvenanceEvent['data']
  }
}

/** Minimal real-DSH session surface required to read assistant-turn provenance. */
export interface DshSessionProvenanceLog {
  snapshotEvents(): readonly { readonly type: string; readonly data: unknown }[]
}

/** Real-DSH session surface used when a completed turn is committed. */
export interface DshSessionProvenanceWriter extends DshSessionProvenanceLog {
  append(type: typeof TURN_PROVENANCE_EVENT, data: SessionEventMap[typeof TURN_PROVENANCE_EVENT], options?: { readonly ignorable?: true }): unknown
}

/** Read one message's committed provenance directly from the append-only DSH log. */
export function readDshSessionTurnProvenance(
  session: DshSessionProvenanceLog,
  messageId: string,
): ProvenanceHandle | undefined {
  return readTurnProvenance(session.snapshotEvents(), messageId)
}

/** Append a completed-turn handle once; identical retries are intentionally idempotent. */
export function appendDshSessionTurnProvenance(
  session: DshSessionProvenanceWriter,
  messageId: string,
  handle: ProvenanceHandle,
): void {
  const event = appendTurnProvenance(session.snapshotEvents(), messageId, handle)
  if (event !== undefined) session.append(event.type, event.data, { ignorable: true })
}
