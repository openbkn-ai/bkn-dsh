import type { BusinessNetworkSummary } from './types.js'

/**
 * Convert one platform response into the bounded data shape consumed by the
 * network selector. The platform remains the authorization authority; this
 * function only removes unneeded fields and rejects malformed rows.
 */
export function parseVisibleBusinessNetworks(value: unknown): readonly BusinessNetworkSummary[] {
  const entries = entriesOf(value)
  if (entries === undefined) throw new Error('OpenBKN returned an invalid network list.')

  const seen = new Set<string>()
  const networks: BusinessNetworkSummary[] = []
  for (const entry of entries) {
    const network = networkOf(entry)
    if (network === undefined || seen.has(network.id)) continue
    seen.add(network.id)
    networks.push(network)
  }
  return networks
}

function entriesOf(value: unknown): readonly unknown[] | undefined {
  if (!isRecord(value)) return undefined
  if (Array.isArray(value.entries)) return value.entries
  if (isRecord(value.result) && Array.isArray(value.result.entries)) return value.result.entries
  return undefined
}

function networkOf(value: unknown): BusinessNetworkSummary | undefined {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string') return undefined
  const id = value.id.trim()
  const displayName = value.name.trim()
  if (id.length === 0 || displayName.length === 0) return undefined
  const description = stringOrUndefined(value.description) ?? stringOrUndefined(value.comment)
  return {
    id,
    displayName,
    ...(description === undefined ? {} : { description }),
  }
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
