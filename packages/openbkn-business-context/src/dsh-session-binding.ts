import type { SessionEventMap } from '@deepseek-ai/dsh-session/types'
import {
  BUSINESS_NETWORK_BOUND_EVENT,
  bindBusinessNetwork,
  readBusinessNetworkBinding,
  type BindBusinessNetworkResult,
  type BusinessNetworkBinding,
  type SessionEventLike,
} from './session-binding.js'

declare module '@deepseek-ai/dsh-session/types' {
  interface SessionEventMap {
    /** Immutable OpenBKN business-network identity selected for this DSH session. */
    'openbkn/business-network-bound': BusinessNetworkBinding
  }
}

/** The small real-DSH Session capability surface needed for durable binding. */
export interface DshSessionLog {
  snapshotEvents(): readonly SessionEventLike[]
}

/** DSH Session capability surface needed when a new binding is persisted. */
export interface DshSessionBindingLog extends DshSessionLog {
  append(type: typeof BUSINESS_NETWORK_BOUND_EVENT, data: SessionEventMap[typeof BUSINESS_NETWORK_BOUND_EVENT], options?: { readonly ignorable?: true }): unknown
}

/** Recover the binding directly from DSH's append-only session log. */
export function readDshSessionBusinessNetwork(session: DshSessionLog): BusinessNetworkBinding | undefined {
  return readBusinessNetworkBinding(session.snapshotEvents())
}

/**
 * Persist the selected business network as the one DSH session event. No
 * side-store is created; reselecting the same network is idempotent.
 */
export function bindDshSessionBusinessNetwork(
  session: DshSessionBindingLog,
  requested: BusinessNetworkBinding,
): BindBusinessNetworkResult {
  const result = bindBusinessNetwork(session.snapshotEvents(), requested)
  if (result.kind === 'bound') session.append(result.event.type, result.event.data, { ignorable: true })
  return result
}
