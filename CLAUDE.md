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

## Upstream contracts and test maintenance

These rules apply to plugin iterations, incident diagnosis, compatibility changes, and release reviews. Check both upstreams: the DSH host and the OpenBKN platform (Context Loader / agent-retrieval, CLI/SDK, and sandbox when affected).

- **Refresh the baseline before making a compatibility claim.** Record the plugin branch/commit and package version, upstream commits/tags and latest releases, the versions actually deployed/loaded, and the check date. Inspect upstream changes since the previously verified baseline, not only the newest commit. A local checkout, an old review, or an unchanged platform version string is insufficient. Distinguish the latest available version from the supported and tested versions; checking upstream does not authorize automatically upgrading pins or deploying.
- **Review the executable contract.** Compare the supported platform's MCP `tools/list` and input/output schemas with upstream source/contracts. Check renamed, added, retired, and conditionally enabled tools; required parameters; result shapes; lifecycle/context propagation; and network scope. Update managed-tool policy, `KN_SCOPED_TOOLS`, routing prompts, capability-result handling, and affected CLI/SDK/sandbox callers together. New tools stay denied until reviewed; never fix drift by allowing every `mcp__openbkn__*` tool. Keep retired names only behind an explicit, tested version-compatibility path.
- **Keep the test tools current.** Review unit/contract tests, mocks, fixtures, snapshots, `docs/eval/supply-ontology.yaml`, `docs/eval/run-eval.mjs`, and relevant verification scripts against the current supported contract whenever it changes. Record upstream version/commit and capture provenance for contract fixtures. Do not use a copy of the implementation's old whitelist as the only test oracle, blindly accept new snapshots, or treat historical evaluation answers as evidence for a new release. Compare the upstream catalogue with the managed subset and classify meaningful differences as supported, intentionally excluded, or requiring adaptation.
- **Cover the changed boundary.** A tool migration needs focused regression coverage for allowed calls after a successful Interaction start, denial before start, rejection of missing/wrong-type/cross-network `kn_id` for network-scoped tools, correct discovery-to-execution arguments/results, and continued denial of excluded tools. Assert that denied calls do not dispatch to the platform. Keep any intentionally supported legacy path covered separately. A test that passes while the real upstream contract is incompatible is a coverage gap, not release acceptance.
- **Verify the delivered artifact.** Inspect the actual release `.tgz` and its version/digest for the updated policy, prompts, and contract handling. Then verify what the target host loads, including reload/restart behavior, and run the affected managed Interaction path on the matching live platform with provenance. Source tests, package contents, installation, real-host execution, and human acceptance are separate evidence levels. If live validation is unavailable, state that limitation and leave that acceptance item open.
- **Recheck before release and after upstream changes.** The existing `.github/workflows/upstream-dsh-watch.yml` watches DSH tags only; it does not establish OpenBKN platform compatibility. Include OpenBKN contract changes in the iteration/release checklist even when DSH has not moved. Updating agent-retrieval or sandbox alone cannot repair a denial in the installed plugin's guard. Periodic monitoring or CI enforcement is only established when its workflow has actually been implemented and verified.

Historical regression to preserve: on 2026-10-03, main `948e359` and the released `0.2.0-rc.2-openbkn.0.2.0-1` package still allowed `search_tools` / `find_skills` and prompted `search_tools`, while OpenBKN had consolidated discovery into `search_capabilities` (#1397) and retired the old tools (#1403). The plugin rejected `search_capabilities` before dispatch although `search_schema` worked. At that baseline, `search_capabilities` was also missing from `KN_SCOPED_TOOLS`, and 23 focused tests passed despite the mismatch. This is a dated incident example, not a claim about later revisions.

## Repo etiquette

- Communicate with the user in Chinese, including progress updates, questions, explanations and final replies.
- All PR content must be in English: titles, descriptions, reviews, inline comments, follow-up comments and generated bot notices. Automated review prompts and output templates follow the same rule; bots have no language exception.
- All Git commit messages must be in English, including both subject and body, and merge or squash commit messages. Check the language before submitting a PR, review or commit. Preserve identifiers, commands, paths and quoted source text when needed; write the surrounding explanation in English.

- Pre-release accuracy check: run the G6 eval batch (`node docs/eval/run-eval.mjs --list` for the questions; grade a recorded run with `--answers`) against a live platform + model, and file the results markdown under `docs/evidence/`. Not in CI — it needs credentials.

- Remote: `origin` = openbkn-ai/bkn-dsh, the only remote; the maintainer has push access. Work lands on a feature branch pushed to `origin` and merges into `main` through a PR (squash, PR number in the subject). PRs trigger only Claude Code Review (code paths) and CodeQL — no build/test CI — so run the plugin tests, `package:check`, and the repo `node --test` suites locally before opening one. Rulesets `main`/`protect` block direct pushes and require one approving review; the author cannot approve their own PR, and docs-only PRs get no automatic Claude review, so request one by commenting `/review` on the PR or by dispatching `automation-claude-review.yml` with the PR number (or ask a human reviewer). Both paths share one concurrency group: a newer run cancels a running one. `compatible-runtime` runs via `workflow_dispatch` or an `openbkn-dsh-runtime-v*` tag.
- Commits use conventional prefixes (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`).
- Release gate (added after `…-2`, 2026-10-04: a fix written after the live run shipped with a misdiagnosed cause and needed `…-3`). A `v*` tag is pushed only when all of these hold:
  1. **Acceptance runs on the release candidate, not a local pack.** Run the build-only rehearsal (`release-plugin.yml`, `publish=false`) on the release branch and install that artifact for the live run; record its sha256.
  2. **No change after acceptance.** Any commit to the package after the live run — review fixes included — means a new rehearsal artifact and a re-run of the affected acceptance items. The artifact rehearsed on `main` before tagging must unpack identical to the accepted one.
  3. **A defect seen in acceptance is reproduced before it is fixed.** Capture the real response or call that failed (size, status, which limit or guard fired) and write a failing test from it; do not ship a fix or a user-facing message based on reading the code alone. Then show the fix on the live case.
  4. **Every anomaly in the live run is triaged with the user before tagging** — fix now, or ship with it written in the changelog as a known limitation. Timeouts, degraded panes and refused calls count even when the answer came out right.
  5. **The environment under test is what the docs tell users to run**: check each platform service image tag and the live `tools/list`, not one version endpoint, and use the OpenBKN CLI version the README recommends for that platform — the plugin parses the CLI's `auth status` output, which changed between 0.1.4 and 0.1.5 (`-2` and `-3` were accepted with CLI 0.1.4 against a 0.1.5 platform).
  6. **`latest` moves last.** A `v*` tag publishes under the `rc` dist-tag; `latest` is promoted only after every form the release claims (desktop, npm CLI, Windows) has been verified. A form accepted on the rehearsal candidate (rule 1) is not run again: it is enough to show that the published package unpacks file-for-file identical to that candidate (`package.json` differs only in key order). A form not covered before the tag — Windows so far — is verified on the published package while it is still only on `rc`. `-3` had `latest` moved before the Windows run.
  7. **Guard rules are verified without the model.** A model that follows the session prompt will not send a wrong or missing `kn_id`, so those refusals cannot be triggered through chat (seen on macOS and Windows). Exercise them against the real DSH tool runtime with the packed plugin instead.
- Pushes, tags and releases need explicit user approval. Two tag prefixes release different artifacts:
  `openbkn-dsh-runtime-v*` builds the runtime archives and cuts a GitHub Release (`compatible-runtime.yml`);
  `v*` publishes `@openbkn/dsh-business-context` to npm and then cuts a GitHub Release whose notes are that version's CHANGELOG section and whose asset is the published tarball (`release-plugin.yml`; an existing release for the tag is left unchanged). A `v*` tag must match both
  `packages/openbkn-business-context/package.json` and the runtime manifest's `plugin` block — the workflow fails otherwise.
- When a release artifact is produced, record its SHA-256, platform, build base commit, and the verification commands.
