/** Minimal identifiers explicitly disclosed by an OpenBKN interaction response. */
export interface InteractionReferences {
  readonly interactionId: string
  /** Operation ids are for execution presentation only; they are never request or Trace ids. */
  readonly operationIds: readonly string[]
}

const MAX_OPERATION_IDS = 32

/**
 * Recover only identifiers that the platform response explicitly labels.
 *
 * In particular, this deliberately does not inspect nested operation payloads:
 * old POC responses may contain arbitrary MCP output, while a future platform
 * contract can add request, Trace, and receipt ids to the provenance handle.
 */
export function extractInteractionReferences(value: unknown): InteractionReferences | undefined {
  if (!isRecord(value)) return undefined
  const interactionId = optionalIdentifier(value.interaction_id)
  if (interactionId === undefined || !Array.isArray(value.operations)) return undefined

  const operationIds: string[] = []
  for (const operation of value.operations) {
    if (operationIds.length === MAX_OPERATION_IDS || !isRecord(operation)) continue
    const id = optionalIdentifier(operation.operation_id)
    if (id !== undefined && !operationIds.includes(id)) operationIds.push(id)
  }
  return { interactionId, operationIds }
}

function optionalIdentifier(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  return normalized.length > 0 && normalized.length <= 256 ? normalized : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
