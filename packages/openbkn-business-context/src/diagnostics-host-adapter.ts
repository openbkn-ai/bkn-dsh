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
 * cordis 4.0.4's declaration order (`PENDING=0 … UNLOADING=5`) and every
 * failure conclusion is cross-checked against `fiber.await()`, so a single
 * misread number cannot fabricate a category.
 *
 * All types here are structural: this package does not depend on
 * `@deepseek-ai/cordis-plugin-loader`, and any shape drift degrades to
 * `component-unknown-state` / insufficient evidence instead of throwing.
 * @module diagnostics-host-adapter
 */

import type { Context } from '@deepseek-ai/cordis'
import {
  BUSINESS_CONFIG_FIELDS,
  BUSINESS_ENTRY_ID,
  DIAGNOSTICS_ENTRY_ID,
  DIAGNOSTICS_CODES,
} from './diagnostics-contract.js'

/**
 * Fiber state numbers in the pinned cordis 4.0.4 declaration order. Only
 * FAILED is load-bearing (it implies `fiber.await()` rejects); the others
 * merely annotate the waiting case.
 */
const PINNED_FIBER_FAILED = 3

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
  | { readonly kind: 'unknown-state' }

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
 * Observe one entry through the public fiber lifecycle: `await()` resolves
 * for a loaded (or recovered) plugin and rethrows the recorded startup
 * failure otherwise, so the decision never rests on a state number alone.
 * A bounded timeout reports still-loading fibers as waiting rather than
 * blocking the report.
 * @param entry - the loader entry to observe.
 * @param timeoutMs - how long to wait for an unsettled fiber.
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
    // `await()` only settles after lifecycle work; a settled, non-throwing
    // fiber is loaded (or was disposed after unloading, which for our rows
    // only happens on shutdown).
    return { kind: 'active' }
  } catch (error) {
    if (error instanceof TimeoutMarker) {
      // A fiber that neither loads nor fails within the budget is still
      // waiting for injected services; the public surface does not expose
      // which, so the observation stays non-specific.
      return fiber.state === PINNED_FIBER_FAILED
        ? { kind: 'unknown-state' }
        : { kind: 'waiting-services' }
    }
    const name = (error as { name?: unknown } | null)?.name
    if (name === 'ValidationError' || configurationFieldOf(error) !== null) {
      return { kind: 'configuration-invalid', field: configurationFieldOf(error) }
    }
    return { kind: 'initialization-failed' }
  }
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
  readonly business: LoaderEntryLike | undefined
  readonly diagnostics: LoaderEntryLike | undefined
} {
  let business: LoaderEntryLike | undefined
  let diagnostics: LoaderEntryLike | undefined
  for (const entry of loader.entries()) {
    const id = entry?.options?.id
    if (id === BUSINESS_ENTRY_ID) business = entry
    else if (id === DIAGNOSTICS_ENTRY_ID) diagnostics = entry
  }
  return { business, diagnostics }
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
