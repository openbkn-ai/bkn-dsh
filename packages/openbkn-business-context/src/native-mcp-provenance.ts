import type { ProvenanceHandle } from './types.js'

const OPENBKN_FINISH_INTERACTION_TOOL = 'mcp__openbkn__bkn_finish_interaction'

interface EventLike {
  readonly type: string
  readonly data: unknown
}

export interface NativeMcpTurnProvenance {
  readonly messageId: string
  readonly handle: ProvenanceHandle
}

/**
 * Recover provenance only from a completed interaction explicitly returned by
 * the OpenBKN MCP finish call in the same DSH turn. No model text, tool args,
 * or unrelated MCP output participates in this association.
 */
export function findCompletedNativeMcpProvenance(
  events: readonly EventLike[],
  turn: number,
): NativeMcpTurnProvenance | undefined {
  const calls = new Map<string, string>()
  for (const event of events) {
    if (event.type !== 'tool/call') continue
    const data = record(event.data)
    if (data?.turn !== turn || typeof data.callId !== 'string' || typeof data.name !== 'string') continue
    calls.set(data.callId, data.name)
  }

  const completed = new Map<string, { interactionId: string; resultIndex: number }>()
  for (const [index, event] of events.entries()) {
    if (event.type !== 'tool/result') continue
    const data = record(event.data)
    if (data?.turn !== turn) continue
    const message = record(data.message)
    const source = message === undefined ? undefined : record(message.source)
    const callId = source?.kind === 'tool' && typeof source.callId === 'string' ? source.callId : undefined
    if (callId === undefined || calls.get(callId) !== OPENBKN_FINISH_INTERACTION_TOOL) continue
    const interactionId = completedInteractionId(message)
    if (interactionId !== undefined) completed.set(callId, { interactionId, resultIndex: index })
  }
  if (completed.size !== 1) return undefined

  const [, completedInteraction] = [...completed][0]!
  const answer = finalAssistantMessageAfter(events, turn, completedInteraction.resultIndex)
  if (answer === undefined) return undefined
  return {
    messageId: answer,
    handle: {
      schemaVersion: 1,
      interactionId: completedInteraction.interactionId,
      requestIds: [],
      traceIds: [],
      receiptIds: [],
      status: 'completed',
      // The current MCP response identifies an interaction, but not safe graph
      // or evidence references. The overlay must state that limitation.
      partial: true,
    },
  }
}

function finalAssistantMessageAfter(events: readonly EventLike[], turn: number, afterIndex: number): string | undefined {
  for (let index = events.length - 1; index > afterIndex; index -= 1) {
    const event = events[index]
    if (event?.type !== 'assistant/message') continue
    const data = record(event.data)
    if (data?.turn !== turn) continue
    const message = record(data.message)
    if (message === undefined || typeof message.id !== 'string' || !Array.isArray(message.content)) continue
    if (!message.content.some(block => record(block)?.type === 'tool-call')) return message.id
  }
  return undefined
}

function completedInteractionId(message: Record<string, unknown> | undefined): string | undefined {
  if (message === undefined || !Array.isArray(message.content)) return undefined
  for (const block of message.content) {
    const toolResult = record(block)
    if (toolResult?.type !== 'tool-result' || !Array.isArray(toolResult.content)) continue
    for (const content of toolResult.content) {
      const text = record(content)
      if (text?.type !== 'text' || typeof text.text !== 'string') continue
      const parsed = jsonRecord(text.text)
      if (parsed?.execution_status !== 'completed') continue
      const interactionId = identifier(parsed.interaction_id)
      if (interactionId !== undefined) return interactionId
    }
  }
  return undefined
}

function jsonRecord(value: string): Record<string, unknown> | undefined {
  try { return record(JSON.parse(value)) } catch { return undefined }
}

function identifier(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  return normalized.length > 0 && normalized.length <= 256 ? normalized : undefined
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}
