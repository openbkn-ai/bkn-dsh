/**
 * Pure interaction-lifecycle state machine for the noise-reduction design
 * (`docs/plans/2026-09-20-interaction-noise-reduction.md` §6). One instance
 * lives per bound Agent; it is driven only by settled `tools/result` facts
 * (constraint C2: listeners are synchronous, so this module must stay
 * synchronous too) and read by the scoped guard, which stays side-effect free.
 *
 * Two lifetimes are deliberately separated (§5.1): `open` is a per-turn
 * in-memory flag that never survives a turn boundary, while `conversationId`
 * is the cross-turn platform continuity identity whose source of truth is the
 * durable session event log — never model memory.
 */

export const START_INTERACTION_TOOL = 'mcp__openbkn__bkn_start_interaction'
export const FINISH_INTERACTION_TOOL = 'mcp__openbkn__bkn_finish_interaction'

/** Durable DSH event type for the managed OpenBKN conversation continuity. */
export const MANAGED_CONVERSATION_EVENT = 'openbkn/managed-conversation'

declare module '@deepseek-ai/dsh-session/types' {
  interface SessionEventMap {
    /** Cross-turn OpenBKN conversation identity held by this DSH session. */
    'openbkn/managed-conversation': ManagedConversationEventData
  }
}

/**
 * Platform error codes that mean "this conversation_id cannot be continued by
 * the current identity" and therefore justify one controlled `new` retry per
 * turn (§5.3). Verified against OpenBKN EE 0.1.4 — see
 * docs/evidence/dsh-event-model-probe.md §3: `resource_not_disclosed` covers a
 * missing/undisclosed conversation (the 404 cloaking family), and
 * `conversation_owner_mismatch` covers an id owned by another identity.
 * Timeouts, authentication failures, 5xx, and parameter errors are absent on
 * purpose: those must keep the held conversation_id.
 */
export const CONVERSATION_INVALID_ERROR_CODES = ['resource_not_disclosed', 'conversation_owner_mismatch'] as const

export interface InteractionLifecycleState {
  /** Whether this turn's Interaction is open; never crosses a turn boundary. */
  readonly open: boolean
  readonly interactionId?: string
  /** Cross-turn platform conversation identity; source of truth is the event log. */
  readonly conversationId?: string
  /** A platform-judged conversation invalidation already happened this turn. */
  readonly conversationInvalidatedThisTurn: boolean
  readonly startsThisTurn: number
}

/** The no-payload projection of one settled lifecycle tool result. */
export interface LifecycleToolResultProjection {
  readonly interactionId?: string
  readonly conversationId?: string
  readonly errorCode?: string
}

export interface ManagedConversationEventData {
  readonly conversationId: string
  readonly status: 'active' | 'invalidated'
  readonly recordedAt: number
}

/** Minimal event-log shape shared by restore and append paths. */
export interface SessionEventLike {
  readonly type: string
  readonly data: unknown
}

/** DSH Session capability surface needed to persist conversation events. */
export interface ManagedConversationSession {
  append(type: typeof MANAGED_CONVERSATION_EVENT, data: ManagedConversationEventData, options?: { readonly ignorable?: true }): void
  snapshotEvents(): readonly SessionEventLike[]
}

/** A closed turn with no held conversation — the state before any OpenBKN access. */
export function initialState(): InteractionLifecycleState {
  return { open: false, conversationInvalidatedThisTurn: false, startsThisTurn: 0 }
}

/**
 * Rebuild the state from a session event log. `open` is always false after a
 * restore (the flag never survives a turn boundary); `conversationId` follows
 * the last durable conversation event, so a tombstone (`invalidated`) read as
 * undefined is exactly the "no prior conversation available" prompt state.
 */
export function restoreFrom(events: readonly SessionEventLike[]): InteractionLifecycleState {
  const last = lastConversationEvent(events)
  const conversationId = last !== undefined && last.status === 'active' ? last.conversationId : undefined
  return conversationId === undefined ? initialState() : { ...initialState(), conversationId }
}

/**
 * The last durable conversation event, verbatim — including a closing
 * tombstone. Unlike {@link restoreFrom}, a tombstone is distinguishable from
 * "no event ever existed", which is what a diagnostic reader (has this
 * session's conversation ever been judged invalid?) needs.
 */
export function lastConversationEvent(events: readonly SessionEventLike[]): ManagedConversationEventData | undefined {
  let last: ManagedConversationEventData | undefined
  for (const event of events) {
    if (event.type !== MANAGED_CONVERSATION_EVENT) continue
    const data = parseConversationEvent(event.data)
    if (data !== undefined) last = data
  }
  return last
}

/** Reset the per-turn flags at `agent/pre-step` (step 1); the conversation id survives. */
export function onTurnStart(state: InteractionLifecycleState): InteractionLifecycleState {
  return {
    open: false,
    conversationInvalidatedThisTurn: false,
    startsThisTurn: 0,
    ...(state.conversationId === undefined ? {} : { conversationId: state.conversationId }),
  }
}

/** Classify a failed lifecycle call: only explicit platform invalidation codes count. */
export function classifyFailure(payload: LifecycleToolResultProjection): 'conversation-invalid' | 'other' {
  return payload.errorCode !== undefined
    && (CONVERSATION_INVALID_ERROR_CODES as readonly string[]).includes(payload.errorCode)
    ? 'conversation-invalid'
    : 'other'
}

/** The settled-outcome shape `projectLifecycleOutcome` reads; matches DSH's ToolExecutionResult. */
export interface LifecycleOutcomeLike {
  readonly isError: boolean
  readonly content?: readonly { readonly type?: string; readonly text?: string }[]
  readonly error?: { readonly message: string }
}

/**
 * No-payload projection of one settled lifecycle result — the single
 * production extraction shared by the plugin, its tests, and the V0 probe.
 * Success: the first JSON record disclosing ids (the platform puts
 * `interaction_id`/`conversation_id` at the top level of lifecycle results).
 * Failure: a bounded parse of the error text for the error-code field only.
 * The platform's envelope nests it as `{"error":{"code":...}}`
 * (agent-retrieval `lifecycleToolErrorWithDetails`), and DSH's MCP client
 * surfaces that text through `error.message`, so both levels are read;
 * anything unparsable classifies as "not determinable" and never clears the
 * held conversation.
 */
export function projectLifecycleOutcome(result: LifecycleOutcomeLike): LifecycleToolResultProjection {
  if (result.isError) {
    const parsed = parseJsonRecord((result.error?.message ?? '').slice(0, 4_096))
    const nested = asRecord(parsed?.error)
    const errorCode = identifier(parsed?.code)
      ?? identifier(nested?.code)
      ?? identifier(parsed?.error_code)
      ?? identifier(nested?.error_code)
      ?? identifier(parsed?.errcode)
      ?? identifier(nested?.errcode)
    return errorCode === undefined ? {} : { errorCode }
  }
  for (const block of result.content ?? []) {
    if (block?.type !== 'text' || typeof block.text !== 'string') continue
    const parsed = parseJsonRecord(block.text)
    if (parsed === undefined) continue
    const interactionId = identifier(parsed.interaction_id)
    const conversationId = identifier(parsed.conversation_id)
    if (interactionId !== undefined || conversationId !== undefined) {
      return {
        ...(interactionId === undefined ? {} : { interactionId }),
        ...(conversationId === undefined ? {} : { conversationId }),
      }
    }
  }
  return {}
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}

function parseJsonRecord(value: string): Record<string, unknown> | undefined {
  try {
    const parsed: unknown = JSON.parse(value)
    return asRecord(parsed)
  } catch {
    return undefined
  }
}

function identifier(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const normalized = value.trim()
  return normalized.length > 0 && normalized.length <= 256 ? normalized : undefined
}

/**
 * Fold one settled lifecycle tool result into the state. Only a successful
 * start opens an Interaction; a failed finish keeps it open so the model may
 * retry; every other tool leaves the lifecycle untouched. A platform-judged
 * invalidation also drops the held conversation id from memory — the durable
 * tombstone records it, and keeping a dead id here would have the next turn's
 * prompt and guard both insist on a continuation the platform already refused.
 */
export function onToolResult(
  state: InteractionLifecycleState,
  name: string,
  ok: boolean,
  payload: LifecycleToolResultProjection = {},
): InteractionLifecycleState {
  if (name === START_INTERACTION_TOOL) {
    if (!ok) {
      if (classifyFailure(payload) !== 'conversation-invalid') return state
      // The dead id leaves memory with the tombstone recording it; keeping it
      // here would have the next turn's prompt and guard both insist on a
      // continuation the platform already refused. Keys are omitted rather
      // than set to undefined so exactOptionalPropertyTypes stays viable.
      return {
        open: state.open,
        conversationInvalidatedThisTurn: true,
        ...(state.interactionId === undefined ? {} : { interactionId: state.interactionId }),
        startsThisTurn: state.startsThisTurn,
      }
    }
    return {
      open: true,
      startsThisTurn: state.startsThisTurn + 1,
      conversationInvalidatedThisTurn: state.conversationInvalidatedThisTurn,
      ...(payload.interactionId === undefined ? {} : { interactionId: payload.interactionId }),
      ...(payload.conversationId === undefined
        ? (state.conversationId === undefined ? {} : { conversationId: state.conversationId })
        : { conversationId: payload.conversationId }),
    }
  }
  if (name === FINISH_INTERACTION_TOOL) {
    if (!ok) return state
    const conversationId = payload.conversationId === undefined ? state.conversationId : payload.conversationId
    return {
      open: false,
      conversationInvalidatedThisTurn: state.conversationInvalidatedThisTurn,
      startsThisTurn: state.startsThisTurn,
      ...(conversationId === undefined ? {} : { conversationId }),
    }
  }
  return state
}

/**
 * The scoped guard's decision for one managed tool call (§6.3 rules 2–5).
 * The caller's catalogue check has already rejected non-managed names (rule
 * 1), so any other name reaching here is a managed in-interaction tool.
 * Returns a model-visible denial with the exact next step, or `undefined` to
 * allow. Rule 2 branches on `startsThisTurn` so a turn that already completed
 * its interaction is told to stop accessing instead of being sent into a
 * start that rules 3–5 would then reject — no deny→retry→deny loops.
 */
export function denialFor(
  state: InteractionLifecycleState,
  toolName: string,
  args: Readonly<Record<string, unknown>>,
): string | undefined {
  if (toolName === START_INTERACTION_TOOL) {
    if (state.open) {
      return 'An OpenBKN interaction is already open in this turn; continue using it, or finish it with mcp__openbkn__bkn_finish_interaction first.'
    }
    if (state.startsThisTurn > 0) {
      // One Interaction per accessing turn (§3): this start follows a finished
      // one in the same turn. A second interaction would also orphan the
      // turn's provenance capture (completed.size !== 1).
      return 'This turn already completed its one OpenBKN interaction; do not start another in the same turn. Answer from the results you already have, and let the user ask again if separate business work is needed.'
    }
    const mode = typeof args.conversation_mode === 'string' ? args.conversation_mode : undefined
    if (state.conversationInvalidatedThisTurn && state.startsThisTurn === 0) {
      // One controlled `new` per turn is the only sanctioned recovery (§5.3).
      if (mode === 'continue') {
        return 'The prior OpenBKN conversation was judged invalid by the platform in this turn; start a new one with conversation_mode "new" and no conversation_id.'
      }
      return undefined
    }
    if (mode === 'new' && state.conversationId !== undefined) {
      return `This DSH session already has an OpenBKN conversation ${JSON.stringify(state.conversationId)}; call bkn_start_interaction with conversation_mode "continue" and conversation_id ${JSON.stringify(state.conversationId)}.`
    }
    if (mode === 'continue') {
      if (state.conversationId === undefined) {
        return 'No prior OpenBKN conversation is available for this DSH session; call bkn_start_interaction with conversation_mode "new" and no conversation_id.'
      }
      if (args.conversation_id !== state.conversationId) {
        return `The conversation_id does not match the conversation held by this DSH session; call bkn_start_interaction with conversation_mode "continue" and conversation_id ${JSON.stringify(state.conversationId)}.`
      }
    }
    return undefined
  }
  if (toolName === FINISH_INTERACTION_TOOL) {
    if (!state.open) {
      return 'No OpenBKN interaction is open; do not call bkn_finish_interaction.'
    }
    return undefined
  }
  // Rule 2: every other managed tool needs this turn's open Interaction.
  if (state.open) return undefined
  if (state.startsThisTurn > 0) {
    return 'This turn already completed its one OpenBKN interaction; no further OpenBKN access is possible in this turn. Answer from the results you already have, and let the user ask again if separate business work is needed.'
  }
  return 'Start mcp__openbkn__bkn_start_interaction before any OpenBKN access in this turn, then retry this call.'
}

/** Append one durable conversation event; the session log stays the source of truth. */
export function recordConversationEvent(
  session: ManagedConversationSession,
  conversationId: string,
  status: ManagedConversationEventData['status'],
): void {
  session.append(MANAGED_CONVERSATION_EVENT, { conversationId, status, recordedAt: Date.now() }, { ignorable: true })
}

function parseConversationEvent(data: unknown): ManagedConversationEventData | undefined {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return undefined
  const candidate = data as Record<string, unknown>
  if (typeof candidate.conversationId !== 'string' || candidate.conversationId.length === 0) return undefined
  if (candidate.status !== 'active' && candidate.status !== 'invalidated') return undefined
  return {
    conversationId: candidate.conversationId,
    status: candidate.status,
    recordedAt: typeof candidate.recordedAt === 'number' && Number.isFinite(candidate.recordedAt) ? candidate.recordedAt : 0,
  }
}
