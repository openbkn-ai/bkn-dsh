import { createHash } from 'node:crypto'
import type { BusinessNetworkBinding } from './types.js'

const MAX_ENTRIES = 48
const MAX_IDENTIFIER_LENGTH = 160

export interface NetworkCapabilityProfile {
  readonly schemaVersion: 1
  readonly profileVersion: string
  readonly knowledgeNetworkId: string
  readonly conceptGroups: readonly NamedCapability[]
  readonly objectTypes: readonly NamedCapability[]
  readonly relationTypes: readonly RelationCapability[]
  readonly actionTypes: readonly NamedCapability[]
}

export interface NamedCapability {
  readonly id: string
  readonly name?: string
}

export interface RelationCapability {
  readonly id: string
  readonly sourceObjectTypeId: string
  readonly targetObjectTypeId: string
}

/**
 * Project the platform summary into the small, non-instructional index the
 * managed-session policy may expose to an Agent. The original platform payload
 * is deliberately not retained.
 */
export function buildNetworkCapabilityProfile(
  binding: BusinessNetworkBinding,
  payload: unknown,
): NetworkCapabilityProfile {
  const detail = detailOf(payload)
  const networkId = identifier(detail.id)
  if (networkId === undefined || networkId !== binding.knowledgeNetworkId) {
    throw new Error('OpenBKN knowledge-network detail does not match the selected network.')
  }
  if (!Array.isArray(detail.object_types) || !Array.isArray(detail.concept_groups) || !Array.isArray(detail.relation_types)) {
    throw new Error('OpenBKN knowledge-network detail is not a summary response.')
  }

  const profile = {
    schemaVersion: 1 as const,
    knowledgeNetworkId: networkId,
    conceptGroups: named(detail.concept_groups),
    objectTypes: named(detail.object_types),
    relationTypes: relations(detail.relation_types),
    actionTypes: named(Array.isArray(detail.action_types) ? detail.action_types : []),
  }
  return {
    ...profile,
    profileVersion: createHash('sha256').update(JSON.stringify(profile)).digest('hex').slice(0, 16),
  }
}

function detailOf(payload: unknown): Record<string, unknown> {
  if (!isRecord(payload)) throw new Error('OpenBKN knowledge-network detail is not a summary response.')
  return isRecord(payload.result) ? payload.result : payload
}

function named(values: readonly unknown[]): readonly NamedCapability[] {
  const seen = new Set<string>()
  const result: NamedCapability[] = []
  for (const value of values) {
    if (result.length === MAX_ENTRIES || !isRecord(value)) continue
    const id = identifier(value.id)
    if (id === undefined || seen.has(id)) continue
    seen.add(id)
    const name = identifier(value.name)
    result.push({ id, ...(name === undefined ? {} : { name }) })
  }
  return result
}

function relations(values: readonly unknown[]): readonly RelationCapability[] {
  const seen = new Set<string>()
  const result: RelationCapability[] = []
  for (const value of values) {
    if (result.length === MAX_ENTRIES || !isRecord(value)) continue
    const id = identifier(value.id) ?? identifier(value.relation_type_id)
    const sourceObjectTypeId = identifier(value.source_object_type_id) ?? nestedId(value.source_object_type)
    const targetObjectTypeId = identifier(value.target_object_type_id) ?? nestedId(value.target_object_type)
    if (id === undefined || sourceObjectTypeId === undefined || targetObjectTypeId === undefined || seen.has(id)) continue
    seen.add(id)
    result.push({ id, sourceObjectTypeId, targetObjectTypeId })
  }
  return result
}

function nestedId(value: unknown): string | undefined {
  return isRecord(value) ? identifier(value.id) : undefined
}

function identifier(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  return normalized.length > 0 && normalized.length <= MAX_IDENTIFIER_LENGTH ? normalized : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
