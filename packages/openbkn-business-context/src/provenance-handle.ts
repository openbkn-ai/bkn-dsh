import type { ProvenanceHandle } from './types.js'

export type { ProvenanceHandle } from './types.js'

const MAX_IDENTIFIERS = 32

/** Validate untrusted platform metadata before it becomes a Client-visible provenance reference. */
export function normalizeProvenanceHandle(value: unknown): ProvenanceHandle {
  if (!isRecord(value)) throw new TypeError('Provenance handle must be an object.')
  if (value.schemaVersion !== 1) throw new TypeError('Unsupported provenance handle schema version.')
  if (value.status !== 'completed' && value.status !== 'failed') throw new TypeError('Provenance handle must describe a completed turn.')
  if (typeof value.partial !== 'boolean') throw new TypeError('Provenance handle partial state is invalid.')
  return {
    schemaVersion: 1,
    interactionId: identifier(value.interactionId, 'interaction id'),
    requestIds: identifiers(value.requestIds, 'request ids'),
    traceIds: identifiers(value.traceIds, 'trace ids'),
    receiptIds: identifiers(value.receiptIds, 'receipt ids'),
    status: value.status,
    partial: value.partial,
  }
}

function identifiers(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value)) throw new TypeError(`Provenance handle ${label} are invalid.`)
  if (value.length > MAX_IDENTIFIERS) throw new RangeError(`Provenance handle ${label} exceed the limit.`)
  return [...new Set(value.map(item => identifier(item, label)))]
}

function identifier(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > 256) {
    throw new TypeError(`Provenance handle ${label} is invalid.`)
  }
  return value.trim()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
