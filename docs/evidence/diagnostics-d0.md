# DIAG-01 D0: diagnostics availability on a failing host (verified 2026-10-05)

## Baseline and environment

| Item | Value |
|---|---|
| bkn-dsh base | `a134f5d573e11846bb6665d1c170510149d09d4d` (`0.2.0-rc.2-openbkn.0.2.0-4` source), branch `feat/diagnostics-v1`, D0 commit `e1ebefe` |
| Host under test | official npm package `@deepseek-ai/dsh@0.2.0-rc.2` (no runtime patch, no inspector), driven via `dsh web --port <n> --no-open` |
| Isolation | dedicated `$DSH_HOME=/tmp/openbkn-d0/dsh-home`; plugin installed from a local `pnpm pack` tarball via `dsh plugin --profile web install` |
| Node / pnpm | v24.19.0 / 11.7.0 |
| Upstream drift | `origin/main` re-fetched at start of D0; HEAD was still `a134f5d`, so the -4 contract evidence remains current |

## Architecture decision (frozen)

- **Second cordis row in the same package.** `cordis.patch.yml` inserts
  `openbkn-business-context` (unchanged) plus `openbkn-business-context-diagnostics`
  whose module specifier is the subpath export `@openbkn/dsh-business-context/diagnostics`
  (`lib/diagnostics.js`). EntryOptions.name is the imported module specifier
  (cordis-plugin-loader 1.0.5 `config/entry.ts`), so one package feeds two
  independent fibers. The diagnostics entry imports only cordis,
  dsh-typert-protocol, schemastery, and node:fs — zero business modules
  (verified: `grep -c business-context-service lib/diagnostics.js` = 0).
- **Failure isolation is host-native.** `dsh-app-boot` startup policy treats a
  non-required failed entry as a warning and leaves siblings running
  (`auditStartupEntries`); `openbkn-business-context` is not in
  `requiredStartupEntryIds`. Verified live: every scenario below kept
  `dsh web` serving.
- **Error evidence comes from the public fiber surface only.** The adapter
  (`src/diagnostics-host-adapter.ts`) reads `entry.fiber`, the public
  `fiber.state` number, and `fiber.await()`'s documented rethrow of
  config-validation and startup errors — the same surface DSH's own boot audit
  uses. The private `_error` field is never touched.
- **Client registration is split.** `src/client/index.tsx` now mounts the
  generated remote contribution, then registers a diagnostics segment on
  `['slots', 'remote', 'remote.openbknDiagnostics']` (all satisfied by the
  local `$mount`; none waits on the Host) before the unchanged business
  segment waits on `remote.openbknBusinessContext`. `$mount` is a purely
  client-side install (api-gateway `ClientRemoteService`), which is why the
  business Host failure cannot block the diagnostics UI.
- **Report DTO.** `src/diagnostics-contract.ts` is dependency-free and shared
  by both faces; its types are re-exported through the types-only `./types`
  face because the typert generator requires remote boundary types to live on
  a public non-root type subpath (enforced by `TypertAnalysisError`, hit and
  fixed during D0).

### Frozen interfaces (schema version 1)

- Report DTO, codes, stages, statuses, sources, evidence whitelist: see
  `src/diagnostics-contract.ts` at commit `e1ebefe` (or later commits that
  only *add* codes — a removal or rename bumps `DIAGNOSTICS_SCHEMA_VERSION`).
- Remote namespace `openbknDiagnostics` with the single passive method
  `getReport(signal?) -> DiagnosticsReport`; generated descriptors live in
  `lib/typert.host.js` / `lib/typert.remote-client.js` alongside the business
  namespace (both are package-level aggregates).

## Live scenario results (npm-form host, no inspector)

All commands run against the isolated home; each scenario reinstalled the
pack/variant and restarted `dsh web`. The panel was driven through a real
browser session (sidebar button → dialog text).

| Scenario | Injection | Host log | Panel outcome |
|---|---|---|---|
| S0 baseline | full config in user patch layer | no warnings | both checks `pass` (`component-loaded`); target shows hostForm npm, platform darwin, disk version `-4` |
| S1 configuration failure | user patch omits `baseUrl` | `openbkn-business-context: ValidationError: $.baseUrl missing required value` (warning only; web keeps serving) | `business-entry` = `fail`, stage `configuration`, code `configuration-invalid`, evidence `configField=baseUrl`; `diagnostics-entry` = `pass` |
| S2 business import failure | controlled variant tarball: `import "./nonexistent-broken-module.js"` prepended to the business entry (base tarball sha256 `fe24e819…`, variant `2c07df3b…`) | `openbkn-business-context: failed to import` (warning only) | **Two-entry round (superseded): D0 gate 2 NOT met** — dsh-client-modules skipped the `fiber === undefined` row and served no client bundle, so no in-package UI reached the browser. **Three-entry round (-6, current): gate 2 PASSES** — the package root is now a minimal bootstrap row that keeps the bundle served; with the business entry broken the panel opens and reports `module-resolution-failed` (see diag-d0-s2-results-20261005.md) |
| S3 initialization failure | variant: `apply()` throws `S3 controlled initialization failure` after the registry plugin (variant sha256 `fcade75e…`) | `openbkn-business-context: Error: S3 controlled initialization failure …` (warning only) | panel opens; `business-entry` = `fail`, stage `component`, code `initialization-failed` |
| S4 diagnostics-service failure | variant: broken import prepended to `lib/diagnostics.js` (variant sha256 `bc47be71…`) | `openbkn-business-context-diagnostics: failed to import` (warning only; business unaffected) | panel still opens (client segment never waits on the Host service) and degrades explicitly: “诊断服务不可用…” with retry; underlying transport error was `RemoteError: active Service "openbknDiagnostics" is unavailable` |

Export path: the panel's “导出诊断报告” click produced a browser download
event (Blob + `a[download]` flow executed; the in-app test browser left the
file as `.crdownload`, an artifact of the sandboxed test browser — the real
download flow gets re-verified on desktop during D3 regression).

## Defects found by running on the real host (invisible to typecheck)

1. `import { FiberState } from '@deepseek-ai/cordis'` resolves in .d.ts but
   the published cordis bundle **erases the const enum**, so the named import
   is a missing export and the whole diagnostics entry failed to import.
   Fix: the adapter pins the numeric meaning and cross-checks every failure
   against `fiber.await()`; no FiberState import remains in any bundle.
2. Cordis reflect refuses undeclared service access
   (`cannot get property "remote.openbknDiagnostics" without inject`); the
   diagnostics client segment must list `remote.openbknDiagnostics` in its
   `ctx.inject` (it is locally satisfied by the same `$mount`, so this still
   waits on nothing).
3. A Remote method invoked without an abort signal reaches the Host with
   `signal === undefined`; `getReport` must treat the parameter as optional.

## Known boundary (host-side improvement, not silently patched)

When the business entry itself cannot be imported (`fiber === undefined`),
dsh-client-modules excludes the package's client bundle
(`processOne`: `entry.fiber === undefined … continue`), so **no in-package UI
of any kind reaches the browser**. The Host-side diagnostics service stays up
and keeps classifying the failure (module-resolution-failed), but the report
needs a non-UI channel in that one case. Minimal host interface that would
close the gap (for the user to decide, upstream): serve the client bundle
when the package still has a live entry (the diagnostics row), not only when
the row named by the client source survives. Until then, this scenario is
covered by the plan's pre-declared degradation: the external self-check v1
plus dsh's own startup warning and `$DSH_HOME/logs/startup-*.log`.

## D0 verdict

The "hardest boundary" holds on the unpatched npm host for configuration,
initialization, and diagnostics-service failures: the diagnostics entry,
its Remote namespace, and the panel stay available and return classified,
whitelisted evidence.

**D0 gate 2 history**: the two-entry layout did NOT meet it (a business
import failure removed the in-package UI — host serving policy, kept above
as the documented boundary and the superseded round's record). The
three-entry layout in `0.2.0-rc.2-openbkn.0.2.0-6` (bootstrap package root
+ `./business` + `./diagnostics`) PASSES it on the official npm dsh host:
S2 (business import failure → panel up, `module-resolution-failed`) and S4
(diagnostics import failure → business panel up, explicit degraded
diagnostics view) were both verified live, alongside S0/S1/S3/S5/S6 and the
U1/U2 upgrade-and-removal regressions. Whole-package-root faults (breaking
the bootstrap entry itself or the shared observer chunk) remain outside the
single-component fault model by design. Full matrix and identities:
`docs/evidence/diag-d0-s2-results-20261005.md`.

Review round (2026-10-05, later commits): `observeEntry` reads the settled
fiber state instead of trusting `await()` resolution; observations are
keyed by check-point subject with success boundaries reconciling earlier
failures; reader failures keep the HTTP status and classify TLS/timeout/5xx
separately (the MCP SDK's `data.cause` path included); CLI stdout parse
refusals and lossy outputs record bounded failures; the client entry's
top-level inject no longer waits on session/workspace services.
