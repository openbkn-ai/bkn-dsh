/**
 * Minimal package-root entry: it exists only so the host keeps serving this
 * package's client bundle while the business and diagnostics implementations
 * live on their own subpath rows.
 *
 * dsh-client-modules attributes a package's browser half to a loader row
 * whose module specifier is the exact package name, and it skips rows whose
 * fiber never materialized. Making this root the smallest possible plugin —
 * no config requirements, no injected services, no imports of either
 * implementation — keeps that attribution alive exactly when `./business` or
 * `./diagnostics` fails to import, which is the S2/S4 availability boundary.
 * The typert analyzer also maps subpath exports to same-named sources, so
 * the package layout is root `index.ts` (this bootstrap), `business.ts`, and
 * `diagnostics.ts`; adding any import edge from here would reintroduce the
 * coupling this entry exists to remove. See docs/evidence/diagnostics-d0.md.
 * @module index
 */

/** Cordis identity used by the bundle's package-root row. */
export const name = 'openbkn-business-context-bootstrap'

/** Nothing: the bootstrap must activate on every host that can load the package. */
export const inject: readonly string[] = []

/**
 * Register nothing. The row's purpose is the package-root lifecycle itself;
 * both implementations are started by their own loader rows.
 */
export async function apply(): Promise<void> {}
