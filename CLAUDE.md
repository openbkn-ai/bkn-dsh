# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

bkn-dsh = OpenBKN business-context plugin for DeepSeek Harness (DSH). Plugin source: `packages/openbkn-business-context` (`@openbkn/dsh-business-context`). Target DSH is pinned to `dsh-v0.1.6-alpha.2`; `compat/dsh-0.1.6-alpha.2/` is the fail-closed patch series and `runtime/` + `scripts/` build the self-contained OpenBKN DSH Runtime archive.

## Commands

Order matters: the plugin build imports `@deepseek-ai/dsh-typert-generator/tsdown`, whose `lib/` only exists after the pinned DSH source is built. `.github/workflows/compatible-runtime.yml` is the reference sequence.

```bash
node scripts/configure-pinned-dsh-generator.mjs --dsh <dsh-checkout>   # point the generator override at a DSH source tree
node compat/dsh-0.1.6-alpha.2/apply.mjs  --dsh <dsh-checkout>          # add --revert to remove the series
node compat/dsh-0.1.6-alpha.2/verify.mjs --dsh <dsh-checkout>
pnpm runtime:build -- --dsh <dsh-checkout> --output release/runtime    # builds patched DSH + generator

pnpm --filter @openbkn/dsh-business-context test                      # builds both faces, then runs tests
node --test compat/dsh-0.1.6-alpha.2/tests/*.test.mjs tests/*.test.mjs runtime/tests/*.test.mjs
pnpm run package:check

pnpm runtime:profile -- --runtime release/runtime --plugin <tgz> --output release/profile
pnpm runtime:package -- --runtime release/runtime --profile release/profile --plugin <tgz> --output release/artifacts --platform darwin-arm64
node scripts/check-runtime-portability.mjs --output release/artifacts --platform darwin-arm64
```

- pnpm must be 11.7.0 (DSH's `packageManager`; `corepack pnpm@11.7.0`). pnpm 10 fails the frozen install of the patched lockfile.
- Node: `^22.19.0 || >=24.0.0` everywhere (READMEs, runtime manifest, plugin engines, launcher guard). Node 23 is rejected on purpose.

## Gotchas

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

- Remotes: `origin` = openbkn-ai/bkn-dsh (upstream, pull-only for this user), `fork` = kalias/bkn-dsh. Work lands on fork branches; `compatible-runtime` runs via `workflow_dispatch` on the fork.
- Commits use conventional prefixes (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `ci:`).
- Pushes, tags and releases need explicit user approval. Two tag prefixes release different artifacts:
  `openbkn-dsh-runtime-v*` builds the runtime archives and cuts a GitHub Release (`compatible-runtime.yml`);
  `v*` publishes `@openbkn/dsh-business-context` to npm (`release-plugin.yml`). A `v*` tag must match both
  `packages/openbkn-business-context/package.json` and the runtime manifest's `plugin` block — the workflow fails otherwise.
- When a release artifact is produced, record its SHA-256, platform, build base commit, and the verification commands.
