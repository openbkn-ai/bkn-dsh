# DSH 0.1.6-alpha.2 Compatibility Patch

[中文](README.zh.md)

This source package prepares an exact DeepSeek Harness `dsh-v0.1.6-alpha.2` checkout for OpenBKN Business Context. It is a temporary compatibility bridge, not a replacement for DSH's plugin manager.

## Supported target

Only a clean Git source checkout at commit `ddefc45fbc7f8e46dd73185e68295696d1297887` (tag `dsh-v0.1.6-alpha.2`) is supported. Do not use it on a desktop application bundle, a different DSH release, or a worktree with local changes.

The series adds only the capabilities required by the plugin and reproducible
runtime build:

- recognition of the published Typert protocol in an external plugin
  (`packages/typert/generator/src/analyzer.ts`, `isTypeMetaSymbol`); without
  it the analyzer discovers 0 of the plugin's 10 public Remote methods;
- the write side of ignorable plugin session records: `Session.append` accepts
  a `LogOnlyEventIntent` (`{ ignorable: true }`) for non-surface events. The
  read side is native in `dsh-v0.1.6-alpha.2`, but without the write side a
  plugin-owned event is persisted as required and the stored session refuses
  to reload in any harness that lacks the plugin;
- the release-lockfile pair: the upstream alpha lockfile is inconsistent with
  its own `patchedDependencies` (an `@electron/osx-sign` entry the deploy
  closure never uses, which pnpm 11 refuses), so the patch removes that
  registration and carries the lockfile regenerated with pnpm 11.7 for a
  frozen, repeatable install.

The plugin deliberately does not use a credential-reference MCP header here:
it mounts the MCP client with a literal Authorization header resolved at
connection time and re-mounted per turn, which works on both patched and
published `@deepseek-ai/dsh-mcp-client` builds. A DSH-side implementation of
credential-backed MCP headers is kept as `kalias/deepseek-harness` branch
`fix/mcp-credential-headers` for upstream contribution.

It never reads or writes an OpenBKN token.

## Apply and verify

From a checked-out copy of this repository:

```bash
node compat/dsh-0.1.6-alpha.2/apply.mjs --dsh /path/to/deepseek-harness
node compat/dsh-0.1.6-alpha.2/verify.mjs --dsh /path/to/deepseek-harness
```

Rebuild the patched DSH checkout using its normal build instructions. Then install the plugin — **the plugin build must declare `0.1.6-alpha.2` peers, and building from this repository's current `main` does not**: since the `dsh-v0.1.7-rc.2` retarget, a `main` build declares `0.1.7-rc.2` peers and a `0.1.6-alpha.2` runtime refuses the install. Use one of these instead:

```bash
# Preferred: the npm release that pairs with 0.1.6-alpha.2.
# Run from the patched DSH checkout — `pnpm dsh` is the DSH workspace's CLI;
# this repository does not provide one.
cd /path/to/deepseek-harness
pnpm dsh plugin --profile web add @openbkn/dsh-business-context@0.1.5-rc.2
```

Or build the tarball from the matching git tag (clone this repository next to your DSH checkout, or pass your DSH path to the configure script):

```bash
git clone --branch v0.1.5-rc.2 https://github.com/openbkn-ai/bkn-dsh.git ~/bkn-dsh-0.1.6
cd ~/bkn-dsh-0.1.6
node scripts/configure-pinned-dsh-generator.mjs --dsh /path/to/deepseek-harness
pnpm install
pnpm --filter @openbkn/dsh-business-context build
pnpm --filter @openbkn/dsh-business-context pack --pack-destination /tmp/openbkn-plugin
cd /path/to/deepseek-harness
pnpm dsh plugin --profile web add file:/tmp/openbkn-plugin/openbkn-dsh-business-context-0.1.5-rc.2.tgz
```

The [version-pairing table](../../README.md#supported-dsh-versions) in the repository README lists every supported DSH revision with its series and plugin pairing.

To remove the complete series before changing DSH version:

```bash
node compat/dsh-0.1.6-alpha.2/apply.mjs --dsh /path/to/deepseek-harness --revert
```

The command verifies every patch digest, the exact base revision, a clean target, and the full patch series before modifying anything. If a check fails, it makes no change.

## Known upstream limitation (source-dev form)

Running DSH directly from a source tree in dev form (`pnpm dsh web` over tsx) breaks tool dispatch for every plugin in `dsh-v0.1.6-alpha.2` — any tool call fails with `Cannot read properties of undefined (reading 'prepare')` regardless of the agent preset, native tools included. This is upstream behavior, not covered by this patch series, and identical on patched and unpatched trees. Binding, network reads, and session persistence work in source-dev form; full Q&A requires a packaged runtime (see the repository README).
