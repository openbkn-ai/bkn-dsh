import type {} from '@deepseek-ai/dsh-session/types'
import {
  BusinessNetworkBindingConflictError,
  bindBusinessNetwork,
  readBusinessNetworkBinding,
  sameIdentity,
  type BindBusinessNetworkResult,
  type BusinessNetworkBinding,
  type SessionEventLike,
} from './session-binding.js'
import type { SessionBindingRecord } from './session-binding-store.js'

declare module '@deepseek-ai/dsh-session/types' {
  interface SessionEventMap {
    /** Binding event written by earlier plugin releases; read-only now. */
    'openbkn/business-network-bound': BusinessNetworkBinding
  }
}

/** The binding-store capability the DSH adapter needs. */
export interface SessionBindingRecords {
  read(sessionId: string): SessionBindingRecord | undefined
  write(record: SessionBindingRecord): Promise<void>
}

/** The small real-DSH Session surface needed to resolve a binding. */
export interface DshSessionLog {
  readonly id: string
  snapshotEvents(): readonly SessionEventLike[]
}

/** Session surface needed to decide fork inheritance. */
export interface DshForkableSessionLog extends DshSessionLog {
  readonly header: { readonly parentSession?: string; readonly isSeeded?: boolean }
  readonly inheritedEventCount: number
}

/**
 * Resolve the session's binding: an event already in its log (written by an
 * earlier plugin release, possibly renamed `plugin:` by DSH's v3→v4
 * migration) or the plugin's own record. Both present and naming different
 * networks is a conflict, never a silent pick.
 */
export function readDshSessionBusinessNetwork(
  session: DshSessionLog,
  records: Pick<SessionBindingRecords, 'read'>,
): BusinessNetworkBinding | undefined {
  const fromLog = readBusinessNetworkBinding(session.snapshotEvents())
  const fromRecord = records.read(session.id)?.binding
  if (fromLog !== undefined && fromRecord !== undefined && !sameIdentity(fromLog, fromRecord)) {
    throw new BusinessNetworkBindingConflictError(fromLog, fromRecord)
  }
  return fromLog ?? fromRecord
}

/**
 * Persist the selected business network without touching the DSH session log.
 * Resolves only once the record is durable, so callers enable the business
 * capability strictly after persistence; reselecting the same network is a
 * no-op.
 */
export async function bindDshSessionBusinessNetwork(
  session: DshSessionLog,
  records: SessionBindingRecords,
  requested: BusinessNetworkBinding,
): Promise<BindBusinessNetworkResult> {
  const result = bindBusinessNetwork(readDshSessionBusinessNetwork(session, records), requested)
  if (result.kind === 'bound') {
    await records.write({
      schemaVersion: 1,
      sessionId: session.id,
      binding: result.binding,
      boundAtSeq: session.snapshotEvents().length,
      recordedAt: new Date().toISOString(),
    })
  }
  return result
}

/**
 * Copy a parent's binding into a forked session whose inherited log prefix
 * reaches the point where the parent was bound — the same reach the old
 * in-log event had. Fresh spawns (`isSeeded` false) inherit nothing. The copy
 * makes the child independent of the parent's record afterwards.
 * @returns the inherited binding, or undefined when nothing was inherited.
 */
export async function inheritForkedBusinessNetwork(
  session: DshForkableSessionLog,
  records: SessionBindingRecords,
): Promise<BusinessNetworkBinding | undefined> {
  const parentSession = session.header.parentSession
  if (session.header.isSeeded !== true || parentSession === undefined) return undefined
  if (readDshSessionBusinessNetwork(session, records) !== undefined) return undefined
  const parent = records.read(parentSession)
  if (parent === undefined || parent.boundAtSeq >= session.inheritedEventCount) return undefined
  await records.write({ ...parent, sessionId: session.id, recordedAt: new Date().toISOString() })
  return parent.binding
}

