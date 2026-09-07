# DSH 0.1.2-rc.1 Compatibility Patch

[中文](README.zh.md)

This source package prepares an exact DeepSeek Harness `dsh-v0.1.2-rc.1` checkout for OpenBKN Business Context. It is a temporary compatibility bridge, not a replacement for DSH's plugin manager.

## Supported target

Only a clean Git source checkout at commit `a66e4702047846cdaa10c66c9d3df3951f5ea70d` is supported. Do not use it on a desktop application bundle, a different DSH release, or a worktree with local changes.

The series adds only the capabilities required by the plugin:

- credential references for streamable HTTP MCP headers;
- recognition of the published Typert protocol in an external plugin;
- ignorable, plugin-owned non-surface session records.

It never reads or writes an OpenBKN token.

## Apply and verify

From a checked-out copy of this repository:

```bash
node compat/dsh-0.1.2-rc.1/apply.mjs --dsh /path/to/deepseek-harness
node compat/dsh-0.1.2-rc.1/verify.mjs --dsh /path/to/deepseek-harness
```

Rebuild the patched DSH checkout using its normal build instructions. Then install bkn-dsh through DSH's native plugin command:

```bash
pnpm dsh plugin --profile web add @openbkn/dsh-business-context
```

To remove the complete series before changing DSH version:

```bash
node compat/dsh-0.1.2-rc.1/apply.mjs --dsh /path/to/deepseek-harness --revert
```

The command verifies every patch digest, the exact base revision, a clean target, and the full patch series before modifying anything. If a check fails, it makes no change.
