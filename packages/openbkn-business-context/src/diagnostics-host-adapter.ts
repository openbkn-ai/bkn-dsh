/**
 * Version-locked adapter over the Host Loader's public entry/fiber surface.
 *
 * DSH's own boot audit (`dsh-app-boot` `inactiveEntries`) reads plugin
 * failures through exactly this surface — `entry.fiber`, the public
 * `fiber.state` number, and `fiber.await()`'s documented rethrow of
 * config-validation and startup errors. The adapter mirrors that contract
 * without importing `FiberState`: the published cordis bundle erases the
 * const enum, so a named import of it breaks module resolution on every real
 * Host (verified on dsh 0.2.0-rc.2 during D0). State numbers are pinned to
 * cordis 4.0.4's declaration order (`PENDING=0 … UNLOADING=5`); rejections
 * are classified from the rethrow, and every non-throwing settle is followed
 * by an explicit state read, because `await()` alone also resolves for
 * fibers that never started or were disposed.
 *
 * All types here are structural: this package does not depend on
 * `@deepseek-ai/cordis-plugin-loader`, and any shape drift degrades to
 * `component-unknown-state` / insufficient evidence instead of throwing.
 * @module diagnostics-host-adapter
 */

import type { Context } from '@deepseek-ai/cordis'
import {
  BOOTSTRAP_ENTRY_ID,
  BUSINESS_CONFIG_FIELDS,
  BUSINESS_ENTRY_ID,
  DIAGNOSTICS_ENTRY_ID,
  DIAGNOSTICS_CODES,
} from './diagnostics-contract.js'

/**
 * Fiber state numbers in the pinned cordis 4.0.4 declaration order.
 * `await()` only settles in-flight lifecycle work — a fiber that is still
 * PENDING (never started or still waiting for services) resolves immediately,
 * so the post-await state must be read before calling anything loaded.
 */
const PINNED_FIBER_PENDING = 0
const PINNED_FIBER_ACTIVE = 2
const PINNED_FIBER_DISPOSED = 4

/** Upper bound for awaiting one fiber's lifecycle before calling it waiting. */
export const FIBER_OBSERVE_TIMEOUT_MS = 1_500

/** The public entry surface the adapter reads. */
export interface LoaderEntryLike {
  readonly options: { readonly id: string; readonly name: string }
  readonly fiber?: {
    readonly state?: number
    await(): Promise<unknown>
  } | undefined
}

/** The public loader surface the adapter reads. */
export interface LoaderLike {
  entries(): Iterable<LoaderEntryLike>
}

/** Observed outcome for one plugin entry. */
export type EntryObservation =
  | { readonly kind: 'active' }
  | { readonly kind: 'module-resolution-failed' }
  | { readonly kind: 'configuration-invalid'; readonly field: string | null }
  | { readonly kind: 'initialization-failed' }
  | { readonly kind: 'waiting-services' }
  | { readonly kind: 'unknown-state'; readonly state: number | undefined }

/**
 * Read the loader service from a plugin context without hard-injecting it.
 * The diagnostics entry injects `loader` itself; this helper exists for
 * callers (and tests) that received a context of unknown shape.
 * @param ctx - any Cordis context.
 * @returns the loader when it exposes `entries()`, else undefined.
 */
export function loaderOf(ctx: Context): LoaderLike | undefined {
  const candidate = ctx.get('loader') as unknown
  if (candidate === null || typeof candidate !== 'object' || typeof (candidate as LoaderLike).entries !== 'function') {
    return undefined
  }
  return candidate as LoaderLike
}

/**
 * Classify a config-validation rejection into a field whitelist hit.
 *
 * Schemastery rejections carry `$`-rooted paths (`$.baseUrl …`) in the
 * message; only field names from the closed {@link BUSINESS_CONFIG_FIELDS}
 * list may surface in evidence. No message text is ever returned.
 * @param error - the rejection recovered from `fiber.await()`.
 * @returns the whitelisted field name, or null when the message names none.
 */
export function configurationFieldOf(error: unknown): string | null {
  if (error === null || typeof error !== 'object') return null
  const message = String((error as { message?: unknown }).message ?? '')
  for (const field of BUSINESS_CONFIG_FIELDS) {
    if (message.includes(`$.${field}`) || message.includes(`${field} `)) return field
  }
  return null
}

/**
 * Observe one entry through the public fiber lifecycle. `fiber.await()`
 * rethrows the recorded startup rejection of a failed fiber, but resolving
 * alone proves nothing: a fiber that never started (deps missing) or was
 * disposed also resolves, so the settled state is classified explicitly.
 * A bounded timeout reports lifecycle work that never settles as waiting.
 * @param entry - the loader entry to observe.
 * @param timeoutMs - how long to wait for an unsettled lifecycle transition.
 * @returns the classified observation.
 */
export async function observeEntry(
  entry: LoaderEntryLike,
  timeoutMs: number = FIBER_OBSERVE_TIMEOUT_MS,
): Promise<EntryObservation> {
  const fiber = entry.fiber
  if (fiber === undefined) return { kind: 'module-resolution-failed' }
  try {
    await withTimeout(fiber.await(), timeoutMs)
  } catch (error) {
    if (error instanceof TimeoutMarker) {
      // A load/unload transition is stuck; nothing conclusive can be said.
      return { kind: 'unknown-state', state: fiber.state }
    }
    const name = (error as { name?: unknown } | null)?.name
    if (name === 'ValidationError' || configurationFieldOf(error) !== null) {
      return { kind: 'configuration-invalid', field: configurationFieldOf(error) }
    }
    return { kind: 'initialization-failed' }
  }
  // Settled without throwing: a FAILED fiber would have rethrown, so the
  // remaining states are exactly loaded, still waiting, or gone.
  const state = fiber.state
  if (state === PINNED_FIBER_ACTIVE) return { kind: 'active' }
  if (state === PINNED_FIBER_PENDING) return { kind: 'waiting-services' }
  return { kind: 'unknown-state', state }
}

/** Internal marker distinguishing the observation timeout from fiber errors. */
class TimeoutMarker extends Error {}

/** Race one promise against a deadline, reporting {@link TimeoutMarker}. */
function withTimeout(promise: Promise<unknown>, timeoutMs: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new TimeoutMarker()), timeoutMs)
    promise.then(
      value => { clearTimeout(timer); resolve(value) },
      error => { clearTimeout(timer); reject(error) },
    )
  })
}

/**
 * Find this package's entries in the loader tree.
 * @param loader - the loader service.
 * @returns the business and diagnostics entries when present, else undefined.
 */
export function findOwnEntries(loader: LoaderLike): {
  readonly bootstrap: LoaderEntryLike | undefined
  readonly business: LoaderEntryLike | undefined
  readonly diagnostics: LoaderEntryLike | undefined
} {
  let bootstrap: LoaderEntryLike | undefined
  let business: LoaderEntryLike | undefined
  let diagnostics: LoaderEntryLike | undefined
  for (const entry of loader.entries()) {
    const id = entry?.options?.id
    if (id === BOOTSTRAP_ENTRY_ID) bootstrap = entry
    else if (id === BUSINESS_ENTRY_ID) business = entry
    else if (id === DIAGNOSTICS_ENTRY_ID) diagnostics = entry
  }
  return { bootstrap, business, diagnostics }
}

/** Map an observation to the contract's code table (no message text involved). */
export function codeOfObservation(observation: EntryObservation): string {
  switch (observation.kind) {
    case 'active': return DIAGNOSTICS_CODES.componentLoaded
    case 'module-resolution-failed': return DIAGNOSTICS_CODES.moduleResolutionFailed
    case 'configuration-invalid': return DIAGNOSTICS_CODES.configurationInvalid
    case 'initialization-failed': return DIAGNOSTICS_CODES.initializationFailed
    case 'waiting-services': return DIAGNOSTICS_CODES.componentWaitingServices
    case 'unknown-state': return DIAGNOSTICS_CODES.componentUnknownState
  }
}
