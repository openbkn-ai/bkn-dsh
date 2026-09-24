# Changelog

All notable changes to this project are documented here.

## Unreleased

Nothing yet.

## 0.1.5-rc.2 (2026-09-24)

Layered business provenance (design: `docs/plans/2026-09-20-provenance-layered-redesign.md`; verification: `docs/evidence/2026-09-20-provenance-v1-v2.md` and `docs/evidence/2026-09-22-timeline-e2e-stage1.md`).

- The provenance panel is rebuilt as independent layers: a local execution timeline rebuilt at read time from DSH session events (question → lifecycle/managed calls with durations and whitelist-only summaries → answer; consecutive same-tool calls fold for display), platform operation facts attached to timeline nodes only when the tool-name pairing is unambiguous, and the enterprise business graph as its own pane. A platform failure now degrades only its own pane; the local timeline always renders.
- Evidence chain: receipts listed from the platform operations read model with a copyable `openbkn trace receipts get <id>` hint; "this turn produced no receipts" is distinguished from "not authorized to read".
- Provenance handle schema v2 adds `conversationId` and `turn`; stored schema-v1 events upgrade in memory, never conflict with a v2 re-capture, and the session log stays append-only.
- A 404 `resource_not_disclosed` from the observability routes now degrades the platform panes as `record-not-disclosed` ("the record is not on this platform, or not disclosed to this account; retrying will not change that") instead of a retryable `platform-unavailable`; the evidence pane gets the matching unavailable reason. Other routes and every other 404 keep the existing `platform-unavailable` mapping, and the 403/404 error-envelope reads are stream-capped at 4 KB (shared helper) instead of buffered whole.
- Package surface: the managed tool-group constants (`LIFECYCLE_TOOLS`, `MANAGED_IN_INTERACTION_TOOLS`) and `managedConversationSectionText` are no longer re-exported from the package entry — import `scoped-business-context` directly. No in-repo consumers; the removal only narrows the published export surface.
- **Behavior change**: `getTurnProvenanceView` no longer throws `openbkn/provenance-license-required` and no longer consults capabilities to decide an upgrade hint. Verified against OpenBKN 0.1.4: the observability read routes are gated by the deployment's static business-domain allow-list (chart default `bd_public`), not by license — so a 403 `permission_denied` always degrades as `domain-not-authorized` (with the platform's `required_action`), 401 as `authentication-required`, and everything else as `platform-unavailable`. The `license-required` degradation enum is kept for a future platform that actually gates reads by license.

- Stale OpenBKN credentials no longer masquerade as a plugin failure: the MCP manager recognizes the SDK's 401/403 handshake brands in the cause chain and reports the matching next step ("re-login with `openbkn auth login`" / "ask the administrator to authorize this account"). Found by the G6 eval batch (`docs/evidence/2026-09-23-g6-eval-batch.md`).
- Runtime bundle version moves to `0.1.6-alpha.2-openbkn.2` (manifest only; binaries unchanged) so a future runtime archive built from this manifest carries the rc.2 profile and never collides with an existing rc.1 home at bootstrap. npm-only release: no runtime archives are rebuilt for rc.2.

Interaction noise reduction (design: `docs/plans/2026-09-20-interaction-noise-reduction.md`; runtime evidence: `docs/evidence/dsh-event-model-probe.md`).

- An Interaction is now the boundary for every model-initiated OpenBKN access, not one per user question. Turns that need nothing from OpenBKN (greetings, clarifications, general knowledge, questions about the binding itself) call no managed tool and create no platform Interaction; a turn that touches OpenBKN — including schema or skill reads — creates exactly one, enforced by a scoped guard (denials carry the exact next step, and `conversation_mode`/`conversation_id` mistakes are corrected with the held value). The managed tool catalogue converges from three groups to two: lifecycle tools, and everything else inside the Interaction.
- The managed `conversation_id` is held by the plugin, not by model memory: persisted as an ignorable session event, restored by replay, and injected into each turn's system prompt through a per-assembly section provider. Only platform-judged invalidation codes (`resource_not_disclosed`, `conversation_owner_mismatch` — verified against OpenBKN EE 0.1.4, envelope `{"error":{"code":...}}` read through the settled tool result's error text) allow one controlled `new` per turn; the dead id is dropped from the in-turn state and tombstoned so replay never resurrects it. Timeouts, authentication failures, 5xx, and parameter errors keep the held id. A turn that finished its one interaction cannot start a second one in the same turn.
- Adds `tests/probes/dsh-event-model.probe.mjs` — a repeatable, payload-free probe of the DSH event model (scoped `tools/result`, guard coverage, sync-listener ordering, cancellation paths, platform invalidation shapes, and the production-chain error-code extraction V0-7 which replays the live platform envelope through a real ToolRuntime into the plugin's own built projector). Manual run only; re-run after every DSH upgrade.
- Known limitation: a turn cancelled or failed between start and finish leaves the Interaction unclosed platform-side (no auto-finish in this iteration). It emits a countable, locatable warning instead — stable code token `interaction-left-open` plus the turn number and interaction id, no business payload; observability can count residues off that record (see README known limitations). Behavioral acceptance (plan §9.2) passed on 2026-09-22 against the live platform: zero-Interaction turns produce none, accessing turns exactly one, conversation continuity survives skip/compress/reload — evidence in `docs/evidence/2026-09-22-interaction-baseline.md`; an in-UI cancellation was observed to let DSH finish the turn normally (no residue), while the residue path itself (hard kill) remains covered only by the unit-tested warning.

## 0.1.5-rc.1 (2026-09-21)

First release published to npm as `@openbkn/dsh-business-context`, under the
`rc` dist-tag. Later versions publish from CI (`release-plugin.yml`, on a `v*`
tag) through npm trusted publishing, each with a provenance attestation.

- Harden the plugin's outbound security boundary, and surface bind errors that
  were previously swallowed.
- Windows and CI hardening from the online acceptance runs: bash test gates,
  an assembled-runtime entrypoint smoke test, win32 pnpm spawning, and
  case/separator-normalized mirror-root matching with pure matching tests.
- Dropped the darwin-x64 release target (Intel-mac CI runners proved
  unrecoverable); the matrix now covers darwin-arm64 and win32-x64.

## 0.1.3 (2026-09-06)

- Establish the DSH Cordis bundle structure for authenticated, session-bound OpenBKN business context.
- Add a controlled platform-level OSDK runner and safe OpenBKN CLI authentication boundary.
- Add additive native DSH UI contributions for network selection, bound context, prompt suggestions, safe tool summaries, and per-turn provenance.
- Add release package auditing and security guidance.

## 0.1.4 (2026-09-19)

Target DSH: `dsh-v0.1.6-alpha.2` (`ddefc45fbc7f8e46dd73185e68295696d1297887`).

- Retarget the plugin and compatible runtime from `dsh-v0.1.2-rc.1` to `dsh-v0.1.6-alpha.2`: bump every `@deepseek-ai/dsh-*` peer/dev dependency to `0.1.6-alpha.2` and bump the plugin package to `0.1.4`.
- Rebuild the compatibility series as `compat/dsh-0.1.6-alpha.2/` with three patches: external published-protocol recognition in the typert analyzer (without it the analyzer discovers 0 of the plugin's 10 public Remote methods), the write side of ignorable plugin session records (`Session.append` accepts `LogOnlyEventIntent`; the read side is native, but without it stored plugin events refuse session reload), and the release-lockfile pair (the upstream alpha lockfile is inconsistent with its own `patchedDependencies`; the patch removes the unused `@electron/osx-sign` registration and carries the pnpm 11.7 lockfile so installs stay frozen and repeatable). The previous MCP credential-headers patch is dropped: the plugin deliberately mounts the MCP client with a literal Authorization header resolved per turn, which works on published and patched clients alike; a DSH-side implementation stays on `kalias/deepseek-harness` for upstream.
- Adapt plugin sources to the new DSH API surface: `agent/created` listeners must return `undefined`, session navigation moves from `sessions.open(id)` to `UiWorkspace.openSession(id)`, and the resolved MCP client config now carries the upstream `maxInstructionBytes` default.
- Surface an explicit enterprise-license hint when provenance reads are license-gated (#22): the platform reader classifies `permission_denied` gates as `LICENSE_REQUIRED` on the observability routes only, the service reports `openbkn/provenance-license-required` with the deployment's license edition, and the provenance overlay explains the enterprise capability instead of a generic connection/permission message. Platform reads now also send the `x-business-domain` header enterprise deployments authorize on (configurable via `businessDomain`).
- Make the runtime bundle portable: symlinked closure entries are replaced with real copies, build-machine paths are scrubbed from text payloads, the seeded profile keeps a registry-style pin instead of a build-time `file:` path, and `scripts/check-runtime-portability.mjs` fails the release when any of these regress. The launcher now also refuses Node builds older than the supported range.
- Unify toolchain contracts: CI uses pnpm 11.7.0 (the DSH-pinned version) with a frozen lockfile, and Node requirements read `^22.19.0 || >=24.0.0` everywhere (READMEs, runtime manifest, plugin engines, launcher guard).
- Sync the compatible-runtime workflow and runtime manifests to the new DSH tag, plugin artifact `openbkn-dsh-business-context-0.1.4.tgz`, and bundle version `0.1.6-alpha.2-openbkn.1`, and add pre-package gates (compatibility round-trip, plugin tests, compatibility/runtime unit tests, package check, portability scan).
- Verified on a clean `dsh-v0.1.6-alpha.2` worktree: apply/verify revert round-trip with a frozen pnpm 11.7 install, full DSH build, plugin tests 119/119, native plugin install, isolated-directory runtime boot, and web-profile E2E with enterprise provenance reads.
