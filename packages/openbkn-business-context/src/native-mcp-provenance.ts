import { toolResultIsError, toolResultTexts } from './tool-result-message.js'
import { parseLifecycleRecord, unrecordedLifecycleReason } from './interaction-lifecycle.js'
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
 * Recover a completed interaction or explicit unrecorded state returned by
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

  const completed = new Map<string, { interactionId?: string; conversationId?: string; recording?: 'disabled' | 'unavailable'; resultIndex: number }>()
  for (const [index, event] of events.entries()) {
    if (event.type !== 'tool/result') continue
    const data = record(event.data)
    if (data?.turn !== turn) continue
    const message = record(data.message)
    const source = message === undefined ? undefined : record(message.source)
    const callId = source?.kind === 'tool' && typeof source.callId === 'string' ? source.callId : undefined
    if (callId === undefined || calls.get(callId) !== OPENBKN_FINISH_INTERACTION_TOOL) continue
    const interactionId = completedInteractionId(message)
    const recording = toolResultIsError(message) ? undefined : firstUnrecordedReason(message)
    if (recording !== undefined) completed.set(callId, { recording, resultIndex: index })
    else if (interactionId !== undefined) completed.set(callId, { interactionId, conversationId: lifecycleConversationId(message), resultIndex: index })
  }
  if (completed.size !== 1) return undefined

  const [, completedInteraction] = [...completed][0]!
  const answer = finalAssistantMessageAfter(events, turn, completedInteraction.resultIndex)
  if (answer === undefined) return undefined
  return {
    messageId: answer,
    handle: {
      schemaVersion: 2,
      ...(completedInteraction.interactionId === undefined ? {} : { interactionId: completedInteraction.interactionId }),
      ...(completedInteraction.recording === undefined ? {} : { recording: completedInteraction.recording }),
      requestIds: [],
      traceIds: [],
      receiptIds: [],
      status: 'completed',
      // The verified MCP contract (2026-09-20) discloses interaction and
      // conversation ids on lifecycle calls only; request/trace/receipt ids
      // exist solely in the platform operations read model.
      partial: true,
      ...(completedInteraction.conversationId === undefined ? {} : { conversationId: completedInteraction.conversationId }),
      turn,
    },
  }
}

function firstUnrecordedReason(message: Record<string, unknown> | undefined): 'disabled' | 'unavailable' | undefined {
  for (const text of toolResultTexts(message)) {
    const parsed = jsonRecord(text)
    if (parsed === undefined) continue
    const reason = unrecordedLifecycleReason(parsed)
    if (reason !== undefined) return reason
  }
  return undefined
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
  // A failed finish call never yields a completed interaction, whatever its text says.
  if (toolResultIsError(message)) return undefined
  const parsed = firstLifecycleRecord(message)
  if (parsed?.trace_recorded === false) return undefined
  if (parsed?.execution_status !== 'completed') return undefined
  return identifier(parsed.interaction_id)
}

function lifecycleConversationId(message: Record<string, unknown> | undefined): string | undefined {
  const parsed = firstLifecycleRecord(message)
  if (parsed === undefined) return undefined
  return identifier(parsed.conversation_id)
}

function firstLifecycleRecord(message: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  for (const text of toolResultTexts(message)) {
    const parsed = jsonRecord(text)
    if (parsed?.interaction_id !== undefined) return parsed
  }
  return undefined
}

function jsonRecord(value: string): Record<string, unknown> | undefined {
  return parseLifecycleRecord(value)
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
