# DSH 0.2.0-rc.2 Compatibility Patch

[中文](README.zh.md)

This source package prepares an exact DeepSeek Harness `dsh-v0.2.0-rc.2` checkout for **building** the OpenBKN Business Context plugin package from this repository (OpenBKN Runtime archives are discontinued). It is a temporary compatibility bridge, not a replacement for DSH's plugin manager.

**Using the plugin needs no patch.** From plugin `0.2.0-rc.2-openbkn.0.2.0-1` on, the plugin installs on an unpatched DSH `0.2.0-rc.2` — the official desktop app, the npm CLI, or a source checkout — through DSH's own plugin manager; see the repository README.

## Supported target

Only a clean Git source checkout at commit `639ed015397290b3745d163aafe02ffee4aa3f84` (tag `dsh-v0.2.0-rc.2`) is supported. Do not use it on a desktop application bundle, a different DSH release, or a worktree with local changes.

The series adds only the capabilities required by the plugin:

- recognition of the published Typert protocol in an external plugin
  (`packages/typert/generator/src/analyzer.ts`, `isTypeMetaSymbol`); without
  it the analyzer discovers 0 of the plugin's 10 public Remote methods;
- **retired:** the write side of ignorable plugin session records
  (`Session.append` accepting a `LogOnlyEventIntent`, `{ ignorable: true }`,
  for non-surface events). Plugin builds from `0.2.0-rc.2-openbkn.0.2.0-1` on
  write nothing to the session log and no longer use it. It stays in the
  series only so the published `openbkn-dsh-runtime-v0.2.0-rc.2-openbkn.0.2.0`
  archive remains reproducible, and will be dropped from the next series.

- the release-lockfile pair: the upstream lockfile itself is consistent with
  its own `patchedDependencies` (a frozen `pnpm install` succeeds on the
  pristine tree), but the runtime closure deploy refuses to run while
  `patchedDependencies` declares patches for packages outside the deployed
  closure — on `dsh-v0.2.0-rc.2` that is `@electron/osx-sign`,
  `@fortune-sheet/core`, `@fortune-sheet/react`, and `exceljs`. The patch
  removes those four registrations and derives the lockfile from the upstream
  one by only stripping those four entries and their `(patch_hash=…)` suffixes
  — every other resolution stays byte-identical to upstream, for a frozen,
  repeatable install that also passes the full-tree `pnpm run build` (a
  earlier full regeneration re-resolved the micromark toolchain into two
  coexisting `micromark-util-types` versions and broke the client typecheck).
  Client-side fixes carried by those four upstream patches are therefore not
  part of the deployed runtime closure (they were not part of it anyway;
  `pnpm deploy` rejects them).

The plugin deliberately does not use a credential-reference MCP header here:
it mounts the MCP client with a literal Authorization header resolved at
connection time and re-mounted per turn, which works on both patched and
published `@deepseek-ai/dsh-mcp-client` builds — the 0.1.7 MCP client surface
(`Config`, transports, headers, reconnect) is unchanged from `0.1.6-alpha.2`.
A DSH-side implementation of credential-backed MCP headers is kept as
`kalias/deepseek-harness` branch `fix/mcp-credential-headers` for upstream
contribution.

It never reads or writes an OpenBKN token.

## Apply and verify

From a checked-out copy of this repository:

```bash
node compat/dsh-0.2.0-rc.2/apply.mjs --dsh /path/to/deepseek-harness
node compat/dsh-0.2.0-rc.2/verify.mjs --dsh /path/to/deepseek-harness
```

Rebuild the patched DSH checkout using its normal build instructions. Then
build the local plugin artifact from this repository (the full sequence is in
[the source-build guide](../../docs/guides/install-with-patch.md)). The
package can be installed into any DSH `0.2.0-rc.2`, patched or not, through
DSH's native plugin command (`pnpm dsh` is the DSH workspace's CLI; this
repository does not provide one):

```bash
pnpm --filter @openbkn/dsh-business-context build
pnpm --filter @openbkn/dsh-business-context pack --pack-destination /tmp/openbkn-plugin
cd /path/to/deepseek-harness
pnpm dsh plugin --profile web add file:/tmp/openbkn-plugin/openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-4.tgz
```

To remove the complete series before changing DSH version:

```bash
node compat/dsh-0.2.0-rc.2/apply.mjs --dsh /path/to/deepseek-harness --revert
```

The command verifies every patch digest, the exact base revision, a clean target, and the full patch series before modifying anything. If a check fails, it makes no change.

## Source-dev form

Running DSH directly from a source tree in dev form (`pnpm dsh web` over tsx)
broke tool dispatch for every plugin in `dsh-v0.1.6-alpha.2` (`Cannot read
properties of undefined (reading 'prepare')`). On `dsh-v0.2.0-rc.2` it did not
reproduce in the 2026-09-30 test: Q&A with tool calls worked in dev form. The
supported form is still the built one (`node apps/cli/lib/bin.js web`).
