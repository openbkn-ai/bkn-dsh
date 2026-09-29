import type {} from '@deepseek-ai/dsh-session/types'
import { findCompletedNativeMcpProvenance } from './native-mcp-provenance.js'
import { sameProvenanceHandle } from './provenance-handle.js'
import { TurnProvenanceConflictError, readTurnProvenance, type TurnProvenanceEvent } from './turn-provenance.js'
import { turnForMessage } from './turn-timeline.js'
import type { ProvenanceHandle } from './types.js'

declare module '@deepseek-ai/dsh-session/types' {
  interface SessionEventMap {
    /** Provenance event written by earlier plugin releases; read-only now. */
    'openbkn/turn-provenance': TurnProvenanceEvent['data']
  }
}

/** Minimal real-DSH session surface required to read assistant-turn provenance. */
export interface DshSessionProvenanceLog {
  snapshotEvents(): readonly { readonly type: string; readonly data: unknown }[]
}

/**
 * Resolve one finalized answer's provenance from the DSH log itself. The
 * handle is a pure function of DSH's own logged tool calls and results (the
 * explicit `bkn_finish_interaction` completion in the answer's turn), so it is
 * re-derived on every read instead of being stored. A provenance event that an
 * earlier plugin release wrote for the same answer must agree with the
 * re-derived one; a disagreement is reported, never silently resolved.
 */
export function readDshSessionTurnProvenance(
  session: DshSessionProvenanceLog,
  messageId: string,
): ProvenanceHandle | undefined {
  const events = session.snapshotEvents()
  const recorded = readTurnProvenance(events, messageId)
  const turn = recorded?.turn ?? turnForMessage(events, messageId.trim())
  const derived = turn === undefined ? undefined : findCompletedNativeMcpProvenance(events, turn)
  const derivedHandle = derived !== undefined && derived.messageId === messageId.trim() ? derived.handle : undefined
  if (recorded !== undefined && derivedHandle !== undefined && !sameProvenanceHandle(recorded, derivedHandle)) {
    throw new TurnProvenanceConflictError(messageId.trim())
  }
  return recorded ?? derivedHandle
}
