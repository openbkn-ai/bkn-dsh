# bkn-dsh

[中文](README.zh.md)

Bring governed OpenBKN business knowledge into DeepSeek Harness conversations.

## Why

Enterprise decisions need trusted business objects, metrics, rules, relationships, and permission-aware evidence. General-purpose chat alone does not provide that governed context.

## What

bkn-dsh is an additive DeepSeek Harness plugin that lets authorized users select one OpenBKN business knowledge network for a conversation, analyze within that explicit scope, and inspect available business provenance for each completed answer.

## Who it serves

- Business users and analysts who need explainable, governed analysis.
- Knowledge-network owners who want their business semantics reused consistently.
- Enterprise AI platform teams that need least-privilege knowledge access without exposing unrestricted data interfaces.

## Business value

- Grounds analysis in authorized business semantics and current platform data.
- Keeps each conversation in one explicit, immutable knowledge-network scope.
- Preserves native DeepSeek Harness workflows while adding traceable OpenBKN context.
- Reduces the cost of reaching trusted business insight without requiring query-language expertise.

The published package README contains the same product overview for package consumers.

## Install and start

### Recommended: OpenBKN-compatible DSH Runtime

For users of DSH `0.1.2-rc.1`, download the matching OpenBKN Runtime archive from the project releases. It contains the pinned DSH runtime, the version-fenced compatibility bridge, and the bkn-dsh plugin artifact. It uses DSH's native plugin manager on first start; it does not patch or change an existing DSH installation.

The only prerequisite is Node.js 20 or later. The release profile is created
with DSH's native plugin manager at build time and is copied into the isolated
home on first start, so customers do not need `pnpm` or registry access.

1. In the download directory, verify the archive with its adjacent `.sha256` file, then unpack it:

   ```bash
   shasum -a 256 -c openbkn-dsh-runtime-*.sha256
   ```
2. Start the bundled DSH Web runtime:

   ```bash
   ./openbkn-dsh-runtime-*/bin/dsh web
   ```

   On Windows, run `bin\\dsh.cmd web` from the unpacked directory and verify
   the release checksum with `Get-FileHash` before unpacking.
3. In DSH Web, click **OpenBKN** in the sidebar. Enter the OpenBKN platform address, complete the guided CLI sign-in or enter a platform token, and test the connection.
4. Select an authorized business knowledge network. Create its local workspace or continue an existing one, then start the business conversation.

The runtime keeps its profile under an isolated OpenBKN DSH home (`OPENBKN_DSH_HOME` can override it), so it does not alter `~/.dsh`. The platform address is a non-sensitive DSH setting; the token is stored only in DSH credentials. Do not put an OpenBKN token in Cordis YAML.

### Source-build path for DSH maintainers

The compatibility package is for maintainers who intentionally build the exact upstream DSH source revision `dsh-v0.1.2-rc.1`. It is fail-closed and must not be applied to a desktop bundle or another DSH version. See [the compatibility package](compat/dsh-0.1.2-rc.1/README.md) for its exact source-build procedure.

Later DSH releases that provide the required capabilities upstream do not need this bridge.
