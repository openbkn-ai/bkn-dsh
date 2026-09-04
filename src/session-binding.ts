/** Durable DSH event type for the business network selected by a session. */
export const BUSINESS_NETWORK_BOUND_EVENT = 'openbkn/business-network-bound'

/** Minimal DSH session-log shape needed to restore an OpenBKN binding. */
export interface SessionEventLike {
  readonly type: string
  readonly data: unknown
}

/** Immutable identity of an OpenBKN business knowledge network. */
export interface BusinessNetworkBinding {
  readonly platformBaseUrl: string
  readonly knowledgeNetworkId: string
  readonly displayName: string
}

/** The event that a DSH adapter appends exactly once after a selection. */
export interface BusinessNetworkBoundEvent {
  readonly type: typeof BUSINESS_NETWORK_BOUND_EVENT
  readonly data: BusinessNetworkBinding
}

export type BindBusinessNetworkResult =
  | { readonly kind: 'bound'; readonly event: BusinessNetworkBoundEvent }
  | { readonly kind: 'already-bound'; readonly binding: BusinessNetworkBinding }

/** A durable session already names a different OpenBKN network or platform. */
export class BusinessNetworkBindingConflictError extends Error {
  constructor(readonly existing: BusinessNetworkBinding, readonly requested: BusinessNetworkBinding) {
    super(
      `This DSH session is already bound to ${existing.platformBaseUrl}/${existing.knowledgeNetworkId}; `
      + `cannot bind ${requested.platformBaseUrl}/${requested.knowledgeNetworkId}`,
    )
    this.name = 'BusinessNetworkBindingConflictError'
  }
}

/** Reconstruct the one permitted business-network binding from a DSH event log. */
export function readBusinessNetworkBinding(
  events: readonly SessionEventLike[],
): BusinessNetworkBinding | undefined {
  let binding: BusinessNetworkBinding | undefined
  for (const event of events) {
    if (event.type !== BUSINESS_NETWORK_BOUND_EVENT) continue
    const next = parseBinding(event.data)
    if (binding === undefined) {
      binding = next
      continue
    }
    if (!sameIdentity(binding, next)) {
      throw new BusinessNetworkBindingConflictError(binding, next)
    }
  }
  return binding
}

/**
 * Decide whether selection emits the one durable event. The caller appends the
 * returned event through DSH's session log; no in-memory side store exists.
 */
export function bindBusinessNetwork(
  events: readonly SessionEventLike[],
  requested: BusinessNetworkBinding,
): BindBusinessNetworkResult {
  const next = normalizeBinding(requested)
  const existing = readBusinessNetworkBinding(events)
  if (existing === undefined) {
    return {
      kind: 'bound',
      event: { type: BUSINESS_NETWORK_BOUND_EVENT, data: next },
    }
  }
  if (!sameIdentity(existing, next)) throw new BusinessNetworkBindingConflictError(existing, next)
  return { kind: 'already-bound', binding: existing }
}

function parseBinding(value: unknown): BusinessNetworkBinding {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('OpenBKN business-network binding event is malformed')
  }
  const candidate = value as Record<string, unknown>
  if (typeof candidate.platformBaseUrl !== 'string'
    || typeof candidate.knowledgeNetworkId !== 'string'
    || typeof candidate.displayName !== 'string') {
    throw new TypeError('OpenBKN business-network binding event is missing required fields')
  }
  return normalizeBinding({
    platformBaseUrl: candidate.platformBaseUrl,
    knowledgeNetworkId: candidate.knowledgeNetworkId,
    displayName: candidate.displayName,
  })
}

function normalizeBinding(binding: BusinessNetworkBinding): BusinessNetworkBinding {
  const platformBaseUrl = binding.platformBaseUrl.replace(/\/+$/, '')
  const knowledgeNetworkId = binding.knowledgeNetworkId.trim()
  const displayName = binding.displayName.trim()
  if (platformBaseUrl.length === 0 || knowledgeNetworkId.length === 0 || displayName.length === 0) {
    throw new TypeError('OpenBKN business-network binding fields must not be empty')
  }
  return { platformBaseUrl, knowledgeNetworkId, displayName }
}

function sameIdentity(left: BusinessNetworkBinding, right: BusinessNetworkBinding): boolean {
  return left.platformBaseUrl === right.platformBaseUrl
    && left.knowledgeNetworkId === right.knowledgeNetworkId
}
