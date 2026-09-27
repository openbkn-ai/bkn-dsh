# DSH 0.1.7-rc.2 Compatibility Patch

[中文](README.zh.md)

This source package prepares an exact DeepSeek Harness `dsh-v0.1.7-rc.2` checkout for OpenBKN Business Context. It is a temporary compatibility bridge, not a replacement for DSH's plugin manager.

## Supported target

Only a clean Git source checkout at commit `477b4f420553e8a52c2fbccc464d7561b239c443` (tag `dsh-v0.1.7-rc.2`) is supported. Do not use it on a desktop application bundle, a different DSH release, or a worktree with local changes.

The series adds only the capabilities required by the plugin:

- recognition of the published Typert protocol in an external plugin
  (`packages/typert/generator/src/analyzer.ts`, `isTypeMetaSymbol`); without
  it the analyzer discovers 0 of the plugin's 10 public Remote methods;
- the write side of ignorable plugin session records: `Session.append` accepts
  a `LogOnlyEventIntent` (`{ ignorable: true }`) for non-surface events. The
  read side is native in `dsh-v0.1.7-rc.2`, but without the write side a
  plugin-owned event is persisted as required and the stored session refuses
  to reload in any harness that lacks the plugin.

- the release-lockfile pair: the upstream lockfile itself is consistent with
  its own `patchedDependencies` (a frozen `pnpm install` succeeds on the
  pristine tree), but the runtime closure deploy refuses to run while
  `patchedDependencies` declares patches for packages outside the deployed
  closure — on `dsh-v0.1.7-rc.2` that is `@electron/osx-sign`,
  `@fortune-sheet/core`, `@fortune-sheet/react`, and `exceljs`. The patch
  removes those four registrations and carries the lockfile regenerated with
  pnpm 11.7 for a frozen, repeatable install. Client-side fixes carried by
  those four upstream patches are therefore not part of the deployed runtime
  closure (they were not part of it anyway; `pnpm deploy` rejects them). The
  regeneration re-resolves a few versions inside exactly those subtrees
  (micromark/markdown tooling in root devDependencies and the client UI, and
  glob/rimraf under the desktop-packaging chain) — none of them deploy into
  the runtime closure, verified by inspecting the deployed closure and by
  the end-to-end smoke.

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
node compat/dsh-0.1.7-rc.2/apply.mjs --dsh /path/to/deepseek-harness
node compat/dsh-0.1.7-rc.2/verify.mjs --dsh /path/to/deepseek-harness
```

Rebuild the patched DSH checkout using its normal build instructions. Then
build the local plugin artifact (from this repository) and install it through
DSH's native plugin command (from the patched DSH checkout — `pnpm dsh` is
the DSH workspace's CLI; this repository does not provide one):

```bash
pnpm --filter @openbkn/dsh-business-context build
pnpm --filter @openbkn/dsh-business-context pack --pack-destination /tmp/openbkn-plugin
cd /path/to/deepseek-harness
pnpm dsh plugin --profile web add file:/tmp/openbkn-plugin/openbkn-dsh-business-context-0.1.7-rc.2-openbkn.0.1.4.tgz
```

To remove the complete series before changing DSH version:

```bash
node compat/dsh-0.1.7-rc.2/apply.mjs --dsh /path/to/deepseek-harness --revert
```

The command verifies every patch digest, the exact base revision, a clean target, and the full patch series before modifying anything. If a check fails, it makes no change.

## Known upstream limitation (source-dev form)

Running DSH directly from a source tree in dev form (`pnpm dsh web` over tsx)
broke tool dispatch for every plugin in `dsh-v0.1.6-alpha.2` — any tool call
failed with `Cannot read properties of undefined (reading 'prepare')`
regardless of the agent preset, native tools included. It is upstream
behavior, identical on patched and unpatched trees, and it is not covered by
this patch series. Whether it still reproduces on `dsh-v0.1.7-rc.2` has not
been confirmed; if source-dev tool calls fail with that signature, use a
packaged runtime (see the repository README). Binding, network reads, and
session persistence worked in source-dev form on `dsh-v0.1.6-alpha.2`.
