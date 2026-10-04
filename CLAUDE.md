# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

bkn-dsh = OpenBKN business-context plugin for DeepSeek Harness (DSH). Plugin source: `packages/openbkn-business-context` (`@openbkn/dsh-business-context`). Target DSH is pinned to `dsh-v0.2.0-rc.2`. The plugin runs on an unpatched DSH (desktop app, npm CLI, source build) and writes nothing to the DSH session log; `compat/dsh-0.2.0-rc.2/` is the fail-closed patch series needed only to build the plugin and the runtime from source, and `runtime/` + `scripts/` build the self-contained OpenBKN DSH Runtime archive. **Runtime archives are discontinued (decision 2026-09-30)**: the product goal is that installing the plugin alone delivers every feature; do not cut new `openbkn-dsh-runtime-v*` releases, and the runtime tooling is slated for removal.

## Commands

Order matters: the plugin build imports `@deepseek-ai/dsh-typert-generator/tsdown`, whose `lib/` only exists after the pinned DSH source is built. `.github/workflows/compatible-runtime.yml` is the reference sequence.

```bash
node scripts/configure-pinned-dsh-generator.mjs --dsh <dsh-checkout>   # point the generator override at a DSH source tree
node compat/dsh-0.2.0-rc.2/apply.mjs  --dsh <dsh-checkout>          # add --revert to remove the series
node compat/dsh-0.2.0-rc.2/verify.mjs --dsh <dsh-checkout>
pnpm runtime:build -- --dsh <dsh-checkout> --output release/runtime    # builds patched DSH + generator

pnpm --filter @openbkn/dsh-business-context test                      # builds both faces, then runs tests
node --test compat/dsh-0.2.0-rc.2/tests/*.test.mjs tests/*.test.mjs runtime/tests/*.test.mjs
pnpm run package:check

pnpm runtime:profile -- --runtime release/runtime --plugin <tgz> --output release/profile
pnpm runtime:package -- --runtime release/runtime --profile release/profile --plugin <tgz> --output release/artifacts --platform darwin-arm64
node scripts/check-runtime-portability.mjs --output release/artifacts --platform darwin-arm64
```

- pnpm must be 11.7.0 (DSH's `packageManager`; `corepack pnpm@11.7.0`). pnpm 10 fails the frozen install of the patched lockfile.
- Node: `^22.19.0 || >=24.0.0` everywhere (READMEs, runtime manifest, plugin engines, launcher guard). Node 23 is rejected on purpose.

## Gotchas

- Plugin and runtime-bundle versions read `<dsh-version>-openbkn.<openbkn-platform-version>` (e.g. `0.2.0-rc.2-openbkn.0.2.0`): the DSH revision they pair with plus the OpenBKN platform release they are built for. A republished bundle with unchanged inputs appends `-<n>`. The manifest validator refuses a `plugin.version` that does not start with the pinned DSH version.
- The committed `pnpm-lock.yaml` is generated for the CI generator path `release/deepseek-harness`. Local installs against another DSH path need `--no-frozen-lockfile`; never commit the resulting lockfile / `pnpm-workspace.yaml` override diff.
- Never hand-edit the DSH checkout. Changes to it go through a new patch in `compat/<version>/patches/` with sha256 updated in `manifest.json`; apply/verify refuse a dirty tree, wrong tag/commit, or mismatched patch hashes.
- Patch files must keep LF bytes (CI sets `core.autocrlf false`); do not let an editor or git reformat them.
- Portability gate (`runtime/bundle-portability.mjs`): bundles may contain only relative symlinks, no build-machine paths (native, forward-slash and JSON-escaped forms, see `prefixForms`), and no `file:` references in JSON or YAML. Keep scrub and detection on the same shared helpers.
- Tests run on macOS and Windows CI: build expected paths with `join()`/`resolve()`, never hardcoded POSIX strings; probe symlink support with `canCreateSymlinks()` and skip explicitly; POSIX-only assertions (exec bits) must be guarded; spawn `pnpm` with `shell: true` on win32.
- Scripts imported by tests must not run side effects at import time (run the CLI body only when executed as the main module).
- Manifest / pnpm-output parsing fails closed with context (`readManifest`, `readCompatibilityManifest`, `parsePackManifest`): wrap with the file path and the next step, keep `cause`, never swallow.
- Security boundary: the OpenBKN token lives only in DSH credentials. Never write it to Cordis YAML, settings, fixtures, or logs. The platform address is non-sensitive.
- Provenance degradation: platform failures never throw out of `getTurnProvenanceView`; each pane degrades by itself. The reader still emits `LICENSE_REQUIRED` for 403 + `permission_denied` on the observability routes (and passes through the truncated `required_action`), but the service maps it unconditionally to `domain-not-authorized` — verified against OpenBKN 0.1.4, those read routes are gated by the deployment's static business-domain allow-list, not by license, and capabilities are never consulted. The `license-required` degradation enum is kept unused for a future license-gated read route.

## Repo etiquette

- Pre-release accuracy check: run the G6 eval batch (`node docs/eval/run-eval.mjs --list` for the questions; grade a recorded run with `--answers`) against a live platform + model, and file the results markdown under `docs/evidence/`. Not in CI — it needs credentials.

- Remote: `origin` = openbkn-ai/bkn-dsh, the only remote; the maintainer has push access. Work lands on a feature branch pushed to `origin` and merges into `main` through a PR (squash, PR number in the subject). PRs trigger only Claude Code Review (code paths) and CodeQL — no build/test CI — so run the plugin tests, `package:check`, and the repo `node --test` suites locally before opening one. Rulesets `main`/`protect` block direct pushes and require one approving review; the author cannot approve their own PR, and docs-only PRs get no automatic Claude review, so request one by commenting `/review` on the PR or by dispatching `automation-claude-review.yml` with the PR number (or ask a human reviewer). Both paths share one concurrency group: a newer run cancels a running one. `compatible-runtime` runs via `workflow_dispatch` or an `openbkn-dsh-runtime-v*` tag.
- Commits use conventional prefixes (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`).
- Release gate (added after `…-2`, 2026-10-04: a fix written after the live run shipped with a misdiagnosed cause and needed `…-3`). A `v*` tag is pushed only when all of these hold:
  1. **Acceptance runs on the release candidate, not a local pack.** Run the build-only rehearsal (`release-plugin.yml`, `publish=false`) on the release branch and install that artifact for the live run; record its sha256.
  2. **No change after acceptance.** Any commit to the package after the live run — review fixes included — means a new rehearsal artifact and a re-run of the affected acceptance items. The artifact rehearsed on `main` before tagging must unpack identical to the accepted one.
  3. **A defect seen in acceptance is reproduced before it is fixed.** Capture the real response or call that failed (size, status, which limit or guard fired) and write a failing test from it; do not ship a fix or a user-facing message based on reading the code alone. Then show the fix on the live case.
  4. **Every anomaly in the live run is triaged with the user before tagging** — fix now, or ship with it written in the changelog as a known limitation. Timeouts, degraded panes and refused calls count even when the answer came out right.
  5. **The platform under test is what it claims to be**: check each service image tag and the live `tools/list`, not one version endpoint.
- Pushes, tags and releases need explicit user approval. Two tag prefixes release different artifacts:
  `openbkn-dsh-runtime-v*` builds the runtime archives and cuts a GitHub Release (`compatible-runtime.yml`);
  `v*` publishes `@openbkn/dsh-business-context` to npm and then cuts a GitHub Release whose notes are that version's CHANGELOG section and whose asset is the published tarball (`release-plugin.yml`; an existing release for the tag is left unchanged). A `v*` tag must match both
  `packages/openbkn-business-context/package.json` and the runtime manifest's `plugin` block — the workflow fails otherwise.
- When a release artifact is produced, record its SHA-256, platform, build base commit, and the verification commands.
