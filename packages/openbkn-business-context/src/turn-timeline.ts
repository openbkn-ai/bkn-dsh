import { LIFECYCLE_TOOLS, MANAGED_IN_INTERACTION_TOOLS } from './scoped-business-context.js'
import type { ProvenanceTimelineNode } from './types.js'

interface EventLike {
  readonly type: string
  readonly time?: number
  readonly data: unknown
}

/** How to locate the turn: directly (handle v2) or via its final assistant message (v1). */
export type TurnTimelineLocator = { readonly turn: number } | { readonly messageId: string }

const OPENBKN_TOOL_PREFIX = 'mcp__openbkn__'
const MAX_SUMMARY_LENGTH = 160
const MAX_TOOL_NODES = 64

/**
 * Rebuild this turn's execution timeline (Layer 0) purely from DSH session
 * events. The timeline is derived at read time and never persisted: the session
 * log already holds every raw fact. Summaries are whitelist projections — no
 * tool argument value and no response-body fragment crosses into a node.
 */
export function buildTurnTimeline(events: readonly EventLike[], locator: TurnTimelineLocator): readonly ProvenanceTimelineNode[] {
  const turn = 'turn' in locator ? locator.turn : turnForMessage(events, locator.messageId)
  if (turn === undefined) return []

  const nodes: MutableNode[] = []
  const calls = new Map<string, { name: string; time: number; arguments: string }>()
  const paired = new Set<string>()
  let questionEmitted = false

  for (const event of events) {
    const time = typeof event.time === 'number' ? event.time : 0
    if (event.type === 'user/message') {
      if (record(event.data)?.turn !== turn || questionEmitted) continue
      questionEmitted = true
      nodes.push({ kind: 'question', at: time, summary: questionSummary(event.data) })
      continue
    }
    if (event.type === 'tool/call') {
      const data = record(event.data)
      if (data?.turn !== turn || typeof data.callId !== 'string' || typeof data.name !== 'string') continue
      if (!data.name.startsWith(OPENBKN_TOOL_PREFIX)) continue
      if (calls.size < MAX_TOOL_NODES) calls.set(data.callId, { name: data.name, time, arguments: typeof data.arguments === 'string' ? data.arguments : '' })
      continue
    }
    if (event.type === 'tool/result') {
      const data = record(event.data)
      if (data?.turn !== turn) continue
      const message = record(data.message)
      const source = message === undefined ? undefined : record(message.source)
      const callId = source?.kind === 'tool' && typeof source.callId === 'string' ? source.callId : undefined
      if (callId === undefined) continue
      const call = calls.get(callId)
      if (call === undefined || paired.has(callId)) continue
      paired.add(callId)
      nodes.push({
        kind: kindForTool(call.name),
        tool: call.name.slice(OPENBKN_TOOL_PREFIX.length),
        at: call.time,
        durationMs: Math.max(0, time - call.time),
        outcome: toolResultFailed(message) ? 'error' : 'ok',
        summary: summarize(call.name, call.arguments, message),
      })
      continue
    }
    if (event.type === 'assistant/message') {
      const data = record(event.data)
      if (data?.turn !== turn) continue
      const message = record(data.message)
      if (message === undefined || typeof message.id !== 'string' || !Array.isArray(message.content)) continue
      // The final answer carries no pending tool call; intermediate model steps do.
      if (message.content.some(block => record(block)?.type === 'tool-call')) continue
      nodes.push({ kind: 'answer', at: time, summary: undefined })
    }
  }

  // Calls without a result (timeout, interruption) stay as nodes without a duration.
  for (const [callId, call] of calls) {
    if (paired.has(callId)) continue
    nodes.push({ kind: kindForTool(call.name), tool: call.name.slice(OPENBKN_TOOL_PREFIX.length), at: call.time, summary: undefined })
  }
  nodes.sort((left, right) => left.at - right.at || rank(left) - rank(right))
  return nodes.map((node, index) => ({ ...node, seq: index }))
}

type MutableNode = Omit<ProvenanceTimelineNode, 'seq'> & { seq?: number }

/** A v1 handle stores no turn; recover it from the turn's final assistant message. */
function turnForMessage(events: readonly EventLike[], messageId: string): number | undefined {
  let turn: number | undefined
  for (const event of events) {
    if (event.type !== 'assistant/message') continue
    const data = record(event.data)
    if (data?.turn === undefined || typeof data.turn !== 'number') continue
    const message = record(data.message)
    if (message === undefined || message.id !== messageId) continue
    turn = data.turn
  }
  return turn
}

function kindForTool(name: string): ProvenanceTimelineNode['kind'] {
  if ((LIFECYCLE_TOOLS as readonly string[]).includes(name)) return 'lifecycle'
  if ((MANAGED_IN_INTERACTION_TOOLS as readonly string[]).includes(name)) return 'managed'
  return 'lifecycle'
}

/** Terminal events sort after the calls that preceded them within one timestamp. */
function rank(node: MutableNode): number {
  return node.kind === 'question' ? 0 : node.kind === 'answer' ? 2 : 1
}

function toolResultFailed(message: Record<string, unknown> | undefined): boolean {
  if (message === undefined) return false
  for (const block of Array.isArray(message.content) ? message.content : []) {
    if (record(block)?.isError === true) return true
  }
  return false
}

/**
 * Whitelist projection per tool family. Only these named facts may appear;
 * argument values and response-body text are never interpolated.
 */
function summarize(name: string, rawArguments: string, message: Record<string, unknown> | undefined): string | undefined {
  const short = name.slice(OPENBKN_TOOL_PREFIX.length)
  if (name === 'mcp__openbkn__bkn_start_interaction') {
    const mode = stringField(parseJsonRecord(rawArguments), 'conversation_mode')
    const carriesConversation = stringField(firstResultRecord(message), 'conversation_id') !== undefined
    return trim(`${short}${mode === 'new' || mode === 'continue' ? ` · ${mode}` : ''}${carriesConversation ? ' · conversation: yes' : ''}`)
  }
  if (name === 'mcp__openbkn__bkn_finish_interaction') {
    const status = stringField(firstResultRecord(message), 'execution_status')
    return trim(`${short}${status === undefined ? '' : ` · ${status}`}`)
  }
  if ((MANAGED_IN_INTERACTION_TOOLS as readonly string[]).includes(name)) {
    const count = countableTopLevelArray(firstResultRecord(message))
    return trim(`${short}${count === undefined ? '' : ` · ${count} 项`}`)
  }
  return trim(short)
}

/** The user's own question text already lives in the transcript; a preview is not new exposure. */
function questionSummary(data: unknown): string | undefined {
  const message = record(record(data)?.message)
  const text = message === undefined ? undefined : firstText(message.content)
  return text === undefined ? undefined : trim(text.replace(/\s+/g, ' '))
}

function firstText(content: unknown): string | undefined {
  for (const block of Array.isArray(content) ? content : []) {
    const entry = record(block)
    if (entry?.type === 'text' && typeof entry.text === 'string' && entry.text.trim()) return entry.text
  }
  return undefined
}

/** First JSON object produced by this tool call's text blocks. */
function firstResultRecord(message: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (message === undefined) return undefined
  for (const block of Array.isArray(message.content) ? message.content : []) {
    const toolResult = record(block)
    if (toolResult?.type !== 'tool-result' || !Array.isArray(toolResult.content)) continue
    for (const content of toolResult.content) {
      const text = record(content)
      if (text?.type !== 'text' || typeof text.text !== 'string') continue
      const parsed = parseJsonRecord(text.text)
      if (parsed !== undefined) return parsed
    }
  }
  return undefined
}

function countableTopLevelArray(value: Record<string, unknown> | undefined): number | undefined {
  if (value === undefined) return undefined
  for (const entry of Object.values(value)) {
    if (Array.isArray(entry)) return entry.length
  }
  return undefined
}

function stringField(value: Record<string, unknown> | undefined, field: string): string | undefined {
  const raw = value?.[field]
  if (typeof raw !== 'string' || !raw.trim()) return undefined
  // Whitelist values are status-like tokens, not free platform text.
  return raw.trim().slice(0, 32)
}

function parseJsonRecord(value: string): Record<string, unknown> | undefined {
  try { return record(JSON.parse(value)) } catch { return undefined }
}

function trim(value: string): string | undefined {
  const normalized = value.trim()
  if (normalized.length === 0) return undefined
  return normalized.length > MAX_SUMMARY_LENGTH ? `${normalized.slice(0, MAX_SUMMARY_LENGTH - 1)}…` : normalized
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}

export { foldTimeline } from './timeline-fold.js'
export type { TimelineFoldGroup } from './timeline-fold.js'
