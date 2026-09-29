import type { BusinessNetworkBinding } from './types.js'

export type { BusinessNetworkBinding } from './types.js'

/**
 * DSH event type earlier plugin releases appended for the selected business
 * network. New bindings live in the plugin's own binding store; logs that
 * already carry this event stay readable.
 */
export const BUSINESS_NETWORK_BOUND_EVENT = 'openbkn/business-network-bound'

/**
 * The same event after DSH's session-format v3→v4 migration, which namespaces
 * every unknown ignorable event as `plugin:<type>` while keeping its payload.
 */
export const MIGRATED_BUSINESS_NETWORK_BOUND_EVENT = `plugin:${BUSINESS_NETWORK_BOUND_EVENT}`

/** Minimal DSH session-log shape needed to restore an OpenBKN binding. */
export interface SessionEventLike {
  readonly type: string
  readonly data: unknown
}

/** `bound`: the caller must persist `binding` before using it; `already-bound`: nothing to write. */
export type BindBusinessNetworkResult =
  | { readonly kind: 'bound'; readonly binding: BusinessNetworkBinding }
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
    if (event.type !== BUSINESS_NETWORK_BOUND_EVENT && event.type !== MIGRATED_BUSINESS_NETWORK_BOUND_EVENT) continue
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
 * Decide whether a selection creates the session's one immutable binding.
 * `existing` is the binding already resolved for the session, if any.
 */
export function bindBusinessNetwork(
  existing: BusinessNetworkBinding | undefined,
  requested: BusinessNetworkBinding,
): BindBusinessNetworkResult {
  const next = normalizeBinding(requested)
  if (existing === undefined) return { kind: 'bound', binding: next }
  if (!sameIdentity(existing, next)) throw new BusinessNetworkBindingConflictError(existing, next)
  return { kind: 'already-bound', binding: existing }
}

/** Validate and normalize one stored binding payload (a log event or a binding record). */
export function parseBinding(value: unknown): BusinessNetworkBinding {
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

/** Two bindings name the same platform and knowledge network (display names may differ). */
export function sameIdentity(left: BusinessNetworkBinding, right: BusinessNetworkBinding): boolean {
  return left.platformBaseUrl === right.platformBaseUrl
    && left.knowledgeNetworkId === right.knowledgeNetworkId
}
