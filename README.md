# bkn-dsh

[中文](README.zh.md)

Bring governed OpenBKN business knowledge into DeepSeek Harness conversations.

## Why

Enterprise decisions need trusted business objects, metrics, rules, relationships, and permission-aware evidence. General-purpose chat alone does not provide that governed context.

## What

bkn-dsh is an additive DeepSeek Harness plugin that lets authorized users select one OpenBKN business knowledge network for a conversation, analyze within that explicit scope, and inspect available business provenance for each completed answer.

> Version prerequisite: the provenance views require an OpenBKN enterprise license with business-domain authorization (`x-business-domain`). Community-edition users see an upgrade prompt instead of provenance data — the rest of the plugin works on the community edition.

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

For users of DSH `0.1.6-alpha.2`, download the matching OpenBKN Runtime archive from the project releases. It contains the pinned DSH runtime, the version-fenced compatibility bridge, and the bkn-dsh plugin artifact. It uses DSH's native plugin manager on first start; it does not patch or change an existing DSH installation.

The only prerequisite is Node.js ^22.19.0 or >=24.0.0 (matching the pinned DSH release). Runtime archives are published for darwin-arm64 and win32-x64; there is no Intel-mac (darwin-x64) build. The release profile is created
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

### Source-build path: plugin package + compatibility patch

Two artifacts work together on your own DSH source checkout at the exact upstream revision `dsh-v0.1.6-alpha.2`:

1. **Plugin package** — `openbkn-dsh-business-context-<version>.tgz` (from the project releases, or build it with `pnpm --filter @openbkn/dsh-business-context pack`). It installs and uninstalls through DSH's native plugin manager.
2. **Compatibility patch script** — [`compat/dsh-0.1.6-alpha.2/`](compat/dsh-0.1.6-alpha.2/) in this repository, applied to the DSH source tree before you build it:

   ```bash
   git clone --depth 1 --branch dsh-v0.1.6-alpha.2 https://github.com/deepseek-ai/deepseek-harness.git ~/dsh-src
   node compat/dsh-0.1.6-alpha.2/apply.mjs  --dsh ~/dsh-src   # from this repository
   node compat/dsh-0.1.6-alpha.2/verify.mjs --dsh ~/dsh-src
   cd ~/dsh-src && pnpm install && pnpm build
   pnpm dsh plugin --profile web add file:<path-to-plugin-tgz>
   ```

**The patch is required, not optional**: on an unpatched DSH the plugin installs, loads, and binds knowledge networks, but the session events it persists are rejected on every DSH restart (the upstream event whitelist is a build-time static set). The patch adds the missing write side so sessions reload normally and stay portable after the plugin is uninstalled. It is fail-closed and must not be applied to a desktop bundle or another DSH version; revert it with `apply.mjs --revert` before changing DSH versions. See [the compatibility package](compat/dsh-0.1.6-alpha.2/README.md) and the step-by-step [install guide](docs/guides/install-with-patch.md) (configuration, credentials, uninstall, known caveats).

Known upstream limitation: running DSH directly from source in dev form breaks tool dispatch for any plugin (`Cannot read properties of undefined (reading 'prepare')`); full Q&A requires a packaged form — the recommended Runtime above, or `scripts/build-compatible-runtime.mjs --dsh <clean-checkout> --output <dir>` from this repository.

Known plugin limitation: a turn that is cancelled or fails between `bkn_start_interaction` and `bkn_finish_interaction` leaves that Interaction unclosed on the platform side. The plugin deliberately does not auto-finish it (the platform semantics of an injected finish are not yet verified); it logs a payload-free warning instead, and observability should track the unclosed-Interaction count. Automatic closing is future work.

## Prerequisites and trial path

The plugin needs a reachable OpenBKN platform with at least one knowledge network you can access.

1. **Platform** — run one locally with [bkn-foundry](https://github.com/openbkn-ai/bkn-foundry) (`deploy/dev/mac.sh` on macOS; Docker engine with ≥16 GB memory), or use your organization's deployment.
2. **Sample data** — import a sample knowledge network from [bkn-samples](https://github.com/openbkn-ai/bkn-samples) (`supply_ontology_hand` is the primary end-to-end dataset).
3. **Credentials** — `openbkn auth login <platform-url>` once; the plugin reads the token through the CLI handshake only.
4. **Bind** — open the OpenBKN panel in DSH, pick the network, and start a session in its workspace.

## Upgrade and uninstall

- **Runtime N → N+1**: download the new archive into a fresh directory and start it; the isolated OpenBKN DSH home (`OPENBKN_DSH_HOME`, default under your data directory) carries sessions and settings across runtime versions, so nothing is migrated by hand.
- **Source-build trees**: before changing the DSH revision, revert the compatibility series (`apply.mjs --revert`), switch, and re-apply the matching series if one exists for the new revision.
- **Uninstall the plugin**: `dsh plugin --profile <name> remove @openbkn/dsh-business-context`, then remove the leftover `node_modules/@openbkn` inside that profile directory. With the compatibility patch applied, sessions created while the plugin was installed remain readable after uninstall (their plugin events are ignorable); without it, stored sessions that contain plugin events are refused on reload.

## Supported DSH versions

Exactly one upstream DSH revision is supported at a time — currently `dsh-v0.1.6-alpha.2`, pinned by [the compatibility manifest](compat/dsh-0.1.6-alpha.2/manifest.json). A scheduled workflow (`upstream-dsh-watch`) watches upstream tags and opens a tracking issue whenever a release moves ahead of the pin; until the compatibility series is regenerated for it, newer DSH revisions are out of scope.
