---
name: runtime-rebuild-verify
description: Rebuild the OpenBKN DSH Runtime archive for the local platform from a clean pinned DSH tree and run the release verification chain (compat round-trip, tests, package check, portability gate, launcher smoke). Use before recording a release artifact or answering a review round.
disable-model-invocation: true
---

Rebuild and verify the Runtime for `$ARGUMENTS` (a platform: `darwin-arm64` or `win32-x64` — darwin-x64 was dropped from the release matrix; default to the current machine's platform). Follow `.github/workflows/compatible-runtime.yml` order; it is the source of truth if this file drifts.

## Preconditions (stop and report if any fails)

- bkn-dsh working tree is clean (`git status --short` empty) — record `git rev-parse --short HEAD` as the build base.
- `corepack pnpm@11.7.0 --version` works; `node --version` satisfies `^22.19.0 || >=24.0.0`.
- The DSH checkout is at tag `dsh-v0.1.7-rc.2` with a clean tree. The workspace copy at `../deepseek-harness` may carry applied patches: never `git checkout`/`reset` it — revert with `node compat/dsh-0.1.7-rc.2/apply.mjs --dsh ../deepseek-harness --revert` only after the user confirms. Prefer a fresh clone at `release/deepseek-harness` (gitignored), which also matches the committed lockfile.

## Steps

```bash
DSH=release/deepseek-harness
[ -d "$DSH" ] || git clone --depth 1 --branch dsh-v0.1.7-rc.2 https://github.com/deepseek-ai/deepseek-harness.git "$DSH"
node scripts/configure-pinned-dsh-generator.mjs --dsh "$DSH"
corepack pnpm@11.7.0 install --frozen-lockfile
node compat/dsh-0.1.7-rc.2/apply.mjs --dsh "$DSH"
node compat/dsh-0.1.7-rc.2/verify.mjs --dsh "$DSH"
node compat/dsh-0.1.7-rc.2/apply.mjs --dsh "$DSH" --revert
corepack pnpm@11.7.0 runtime:build -- --dsh "$DSH" --output release/runtime
corepack pnpm@11.7.0 --filter @openbkn/dsh-business-context test
node --test compat/dsh-0.1.7-rc.2/tests/*.test.mjs tests/*.test.mjs runtime/tests/*.test.mjs
corepack pnpm@11.7.0 run package:check
corepack pnpm@11.7.0 --filter @openbkn/dsh-business-context build
corepack pnpm@11.7.0 --filter @openbkn/dsh-business-context pack --pack-destination release/plugin
```

Take the tgz name from `packages/openbkn-business-context/package.json` version, then:

```bash
corepack pnpm@11.7.0 runtime:profile -- --runtime release/runtime --plugin release/plugin/<tgz> --output release/profile
corepack pnpm@11.7.0 runtime:package -- --runtime release/runtime --profile release/profile --plugin release/plugin/<tgz> --output release/artifacts --platform <platform>
node scripts/check-runtime-portability.mjs --output release/artifacts --platform <platform>
```

## Smoke checks

- Extract the archive into a scratch directory outside the source tree; `find <dir> -type l` shows only relative links.
- `<dir>/bin/dsh --version` (Windows: `bin\dsh.cmd --version`) prints the DSH version.
- `node <dir>/runtime/.../.bin/semver 1.2.3` prints `1.2.3` when present.
- `grep -r "$HOME" <dir>` has no hits.

If `pnpm install --frozen-lockfile` modifies `pnpm-lock.yaml` or `pnpm-workspace.yaml`, do not commit that diff.

## Report

Output a table: each command → exit code and test counts (tests/pass/fail/skipped), plus the artifact file name, SHA-256 (from the `.sha256` sidecar, cross-checked with `shasum -a 256`), platform, build base commit. List anything skipped or not verified. Do not push, tag or upload anything.
