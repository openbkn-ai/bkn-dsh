import type { BusinessNetworkSummary } from '../types.ts'

export const INITIAL_NETWORK_DIRECTORY_LIMIT = 20

export interface NetworkDirectorySelection {
  readonly networks: readonly BusinessNetworkSummary[]
  readonly total: number
  readonly hasMore: boolean
}

/**
 * Pure browser-side presentation over the already-authorized catalogue. It
 * neither broadens visibility nor changes the stable Host catalogue itself.
 */
export function selectNetworkDirectory(
  networks: readonly BusinessNetworkSummary[],
  query: string,
  limit = INITIAL_NETWORK_DIRECTORY_LIMIT,
): NetworkDirectorySelection {
  const needle = query.trim().toLowerCase()
  const matching = networks.filter(network => matches(network, needle))
  const ordered = [
    ...matching.filter(network => network.workspacePath !== undefined),
    ...matching.filter(network => network.workspacePath === undefined),
  ]
  const shown = ordered.slice(0, Math.max(0, limit))
  return { networks: shown, total: ordered.length, hasMore: shown.length < ordered.length }
}

function matches(network: BusinessNetworkSummary, needle: string): boolean {
  if (needle.length === 0) return true
  return [network.id, network.displayName, network.description]
    .filter((value): value is string => value !== undefined)
    .some(value => value.toLowerCase().includes(needle))
}
