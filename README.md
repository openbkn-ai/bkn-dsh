# bkn-dsh

Current -7 candidate scope and pending release acceptance: [release handoff](docs/handoff/2026-10-06-release-7/README.md). Historical -5/-6 packages and the earlier CI7 retain their original identities; they do not represent the combined candidate.

[中文](README.zh.md)

Bring governed OpenBKN business knowledge into DeepSeek Harness conversations.

## Why

Enterprise decisions need trusted business objects, metrics, rules, relationships, and permission-aware evidence. General-purpose chat alone does not provide that governed context.

## What

bkn-dsh is an additive DeepSeek Harness plugin that lets authorized users select one OpenBKN business knowledge network for a conversation, analyze within that explicit scope, and inspect available business provenance for each completed answer.

> Version prerequisite: the provenance views need a valid OpenBKN token and a `businessDomain` the deployment allows (`x-business-domain`; the stock chart allow-lists `bd_public`, no admin action needed). Verified against OpenBKN 0.1.4: the observability read routes have **no license gate**, so community deployments show the full provenance panel; the business graph may carry fewer enriched references there (enterprise optimizer, unverified). No upgrade prompt is ever shown for reads — a 403 always means the domain or account was refused.

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

## Install

Upgrading from <= -5 with a `name`-qualified override? See the migration note in the [package README](packages/openbkn-business-context/README.md#upgrading-name-qualified-overrides-required-for--6). and start

From plugin `0.2.0-rc.2-openbkn.0.2.0-1` on, an unpatched DeepSeek Harness `0.2.0-rc.2` is all you need: install the plugin package with DSH's own plugin manager. The same package works on all three forms of DSH:

| DSH form | How you run it |
| --- | --- |
| Official desktop app `0.2.0-rc.2` | the DeepSeek Harness app |
| npm CLI | `npm install -g @deepseek-ai/dsh@0.2.0-rc.2`, then `dsh web` |
| Source checkout, built | `dsh-v0.2.0-rc.2` checkout after `pnpm install && pnpm run build`, then `node apps/cli/lib/bin.js web` |

Verified on macOS arm64 for all three forms: install, binding, Q&A with tool calls, business provenance, reopening a session after a restart, and continuing its platform conversation ([evidence](docs/evidence/2026-09-29-desktop-direct-install.md)). On Windows 10, the desktop app and the npm CLI were verified too: with the default configuration, sign-in, binding, and Q&A pass (round 2, after the CLI-lookup fix); the remaining items — provenance, restart and continue, unbound and PTC refusals, uninstall — passed in round 1 with `cliPath` set, before that fix ([results](docs/handoff/2026-10-02-windows-verification-round2.md)). The source-checkout form was not run on Windows.

### Before you start

1. **OpenBKN CLI sign-in.** Install the CLI version that matches your platform and run `openbkn auth login <platform-url>` once. For an OpenBKN 0.1.5 platform use `npm install -g @openbkn/bkn-sdk@0.1.5`; for 0.1.4 use `@openbkn/bkn-sdk@0.1.4` (`0.1.5-rc.1` also works). CLI `0.1.5-rc.2` and later check the platform version through `/api/bkn-backend/v1/health` before every request and refuse platforms that lack it, such as 0.1.4. **Log in before you open the OpenBKN panel**: up to plugin `0.2.0-rc.2-openbkn.0.2.0-3` the panel shows "无法验证 OpenBKN 连接" (cannot verify the OpenBKN connection) instead of a sign-in prompt when the CLI has never logged in. The same message can appear with CLI 0.1.5 when the stored login came from CLI 0.1.4; refreshing the session once cleared it in our test: `openbkn auth token > /dev/null` (PowerShell: `openbkn auth token > $null`). The command prints the access token, so discard its output as shown instead of letting it reach the terminal. The plugin reads the token through the `openbkn` CLI, so DSH must find it on the `PATH` of the DSH process (the desktop app takes `PATH` from your login shell on macOS); on Windows it finds the `openbkn.cmd` shim. Otherwise set `cliPath` (step 2) to the CLI's absolute path. DSH adds the Windows extension only to a bare name, so on Windows the path must name the shim itself, e.g. `C:/Users/<you>/AppData/Roaming/npm/openbkn.cmd` (`where.exe openbkn` shows it).
2. **pnpm, for the npm CLI only.** The npm `dsh` hands `plugin add` to the `pnpm` on `PATH`; install it first (`npm install -g pnpm@11.7.0`, the version DSH itself uses). The desktop app bundles its own.
3. **Self-signed platform certificate** (skip for a publicly trusted one). DSH must trust the platform CA through `NODE_EXTRA_CA_CERTS=<CA pem path>`:
   - `dsh web` from a terminal: prefix the command with the variable.
   - Desktop app on macOS: `export NODE_EXTRA_CA_CERTS=…` in `~/.zprofile` or `~/.zshrc`. The app reads the login-shell environment at startup, including Dock and Finder launches.
   - Windows: set it as a user environment variable, then fully quit and restart every program that should see it, including terminals inside IDEs or agent hosts that were already running.
4. **Use Standard mode.** A session bound to an OpenBKN network must run in DSH's **Standard mode** (标准模式). PTC mode is not supported yet: the plugin refuses `run_code` there and the model asks you to start a new session in Standard mode. The mode is chosen in the mode menu before the first message is sent and cannot be changed afterwards.

### 1. Install the plugin

Close the desktop app (or stop `dsh web`) first. The desktop app must have been started once so that its profile exists.

```bash
# Desktop app (macOS). The app menu "Manage dsh command…" can also put `dsh` on your PATH.
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" plugin --profile desktop add @openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-6

# npm CLI
dsh plugin --profile web add @openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-6

# Source checkout, from the DSH checkout root
node apps/cli/lib/bin.js plugin --profile web add @openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-6
```

On Windows, run `dsh.cmd` in place of `dsh`.

### 2. Set the platform address

Add the entry below to the profile's patch layer, `~/.dsh/profiles/<profile>/cordis.patch.yml` (`desktop` or `web`; under `$DSH_HOME` if you set one; `%USERPROFILE%\.dsh\…` on Windows). The file is a YAML list. A newly created profile may hold only `[]`: replace that line with the entry, because appending after `[]` makes the file invalid. DSH itself may append entries later (for example after the first-run notice), so find the plugin's entry by its `id` when you edit it again.

```yaml
- id: openbkn-business-context
  config:
    baseUrl: https://<your-openbkn-platform>
    # cliPath: /absolute/path/to/openbkn   # only if DSH cannot find the CLI on PATH; on Windows end it with openbkn.cmd
```

The platform address is not sensitive. Never put the OpenBKN token in Cordis YAML; the plugin keeps it only in DSH credentials.

### 3. Bind a network and ask

1. Start DSH (open the desktop app, or run `dsh web`) and click **OpenBKN** in the sidebar.
2. Pick an authorized knowledge network and create its local workspace (**新建工作区** / New workspace opens the folder chooser), or continue its existing workspace.
3. In the new session, keep **标准模式** (Standard mode), then ask. Each completed answer offers **查看业务溯源** (view business provenance: execution trace, business context graph, evidence).

With `dsh web` on macOS, the folder chooser opens on the machine that runs `dsh web`. A remote or SSH session uses DSH's browse backend, which cannot create a workspace from the plugin panel: associate the network with an existing local workspace first.

### Uninstall

With DSH stopped, run `dsh plugin --profile <profile> remove @openbkn/dsh-business-context` and delete the leftover `node_modules/@openbkn` in that profile directory. Sessions stay readable: the plugin writes nothing to the DSH session log. Binding records under `$DSH_HOME/openbkn/session-bindings/` stay behind; while the plugin is installed, it removes the record of a session DSH no longer stores once the record is seven days old.

### Backup and known limitations

- **Backup and moving machines**: copy `$DSH_HOME/openbkn/session-bindings/` (per-session network bindings) and `$DSH_HOME/storages/openbkn_workspace_bindings.json` (workspace ↔ network associations) together with the session logs. Provenance and conversation continuity are re-derived from the session log, but the bindings are not.
- **Network scope — important limitation of the platform `run_code`**: in a bound session the plugin refuses any direct query whose `kn_id` is missing or names another network, and it does not offer action execution. But the platform's `run_code`, `execute_skill` where the deployment enables it (and `execute_published_tool`) run on the platform: from OpenBKN 0.1.5 on, a `run_code` script can call every other platform tool as a function — including other networks' queries and `execute_action` — and models often prefer it. Calls made inside the script do not pass through the plugin, so there the bound network and the no-action rule rest on the session prompt only. Every platform operation still appears with its receipt in the business provenance. Platform-side scoping of `run_code` is being worked out with the OpenBKN team.
- **Unbound sessions**: OpenBKN tools are refused in any session that is not bound through the OpenBKN panel, including a session whose binding record cannot be read, or conflicts with its log, when the session is opened. Such a session still opens and keeps its history; the plugin logs a payload-free warning, but the UI does not show a binding-error state yet. A record that becomes unreadable while its session is already running does not revoke the running session's access until the session is reopened.
- **Associations are shared by every host and profile** in one `$DSH_HOME` (`storages/openbkn_workspace_bindings.json`): a network associated in `dsh web` offers *continue* / *new session* in the desktop app, not *New workspace*.
- **One running host while changing associations**: each host keeps the workspace associations in memory and rewrites the whole store from that copy, so taking turns is not enough — a host that was already running overwrites the other's change on its next write. When the desktop app and `dsh web` share one `$DSH_HOME`, quit the other host before creating or changing a workspace association, and restart a host before using it to change associations after the other one did.

### Upgrading from `0.2.0-rc.2-openbkn.0.2.0`

That release wrote plugin events into the session log. Sessions it bound on an unpatched DSH (desktop app, npm CLI, unpatched source build) are refused on reload, and neither upgrading nor uninstalling the plugin repairs them. Start new sessions after upgrading. Sessions it wrote on a patched DSH or in a Runtime archive stay readable.

### Runtime archives (discontinued)

OpenBKN Runtime archives are no longer published: installing the plugin into DSH is the only supported way to use it. The last archive, [`openbkn-dsh-runtime-v0.2.0-rc.2-openbkn.0.2.0`](https://github.com/openbkn-ai/bkn-dsh/releases/tag/openbkn-dsh-runtime-v0.2.0-rc.2-openbkn.0.2.0) (patched DSH `0.2.0-rc.2` with plugin `0.2.0-rc.2-openbkn.0.2.0`), stays downloadable but receives no updates.

### Building from source

The [compatibility series](compat/dsh-0.2.0-rc.2/README.md) is needed only to build the plugin package from this repository, not to use the plugin: patch 0001 lets DSH's Typert generator recognize the plugin's published protocol. Patch 0002 is retired (no plugin build from `…-1` on uses it), and patch 0003 served only the discontinued Runtime archives. See the [source-build guide](docs/guides/install-with-patch.md).

Known plugin limitation: a turn that is cancelled or fails between `bkn_start_interaction` and `bkn_finish_interaction` leaves that Interaction unclosed on the platform side. The plugin deliberately does not auto-finish it (the platform semantics of an injected finish are not yet verified); it logs a payload-free warning instead, and observability should track the unclosed-Interaction count. Automatic closing is future work.

## Prerequisites and trial path

The plugin needs a reachable OpenBKN platform with at least one knowledge network you can access.

1. **Platform** — run one locally with [bkn-foundry](https://github.com/openbkn-ai/bkn-foundry) (`deploy/dev/mac.sh` on macOS; Docker engine with ≥16 GB memory), or use your organization's deployment.
2. **Sample data** — import a sample knowledge network from [bkn-samples](https://github.com/openbkn-ai/bkn-samples) (`supply_ontology_hand` is the primary end-to-end dataset).
3. **Credentials** — `openbkn auth login <platform-url>` once; the plugin reads the token through the CLI handshake only.
4. **Bind** — open the OpenBKN panel in DSH, pick the network, and start a session in its workspace.

## Supported DSH versions

Exactly one upstream DSH revision is supported at a time — currently `dsh-v0.2.0-rc.2`, pinned by [the compatibility manifest](compat/dsh-0.2.0-rc.2/manifest.json). A scheduled workflow (`upstream-dsh-watch`) watches upstream tags and opens a tracking issue whenever a release moves ahead of the pin; until the compatibility series is regenerated for it, newer DSH revisions are out of scope.

Check your version with `dsh --version`, then pair it like this:

| Your DSH version | Compatibility series | Plugin to install | Prebuilt runtime archive |
| --- | --- | --- | --- |
| `dsh-v0.2.0-rc.2` (current pin): desktop app, npm CLI, or source build | not needed to use the plugin; [`compat/dsh-0.2.0-rc.2/`](compat/dsh-0.2.0-rc.2/) builds it from source | `@openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-6` from npm (Standard mode) | discontinued; last one: [openbkn-dsh-runtime-v0.2.0-rc.2-openbkn.0.2.0](https://github.com/openbkn-ai/bkn-dsh/releases/tag/openbkn-dsh-runtime-v0.2.0-rc.2-openbkn.0.2.0) |
| `dsh-v0.1.7-rc.2` (previous series) | [`compat/dsh-0.1.7-rc.2/`](compat/dsh-0.1.7-rc.2/) (archived) | `@openbkn/dsh-business-context@0.1.7-rc.2-openbkn.0.2.0` from npm, or build from git tag [`v0.1.7-rc.2-openbkn.0.2.0`](https://github.com/openbkn-ai/bkn-dsh/tree/v0.1.7-rc.2-openbkn.0.2.0) | [openbkn-dsh-runtime-v0.1.7-rc.2-openbkn.0.2.0](https://github.com/openbkn-ai/bkn-dsh/releases/tag/openbkn-dsh-runtime-v0.1.7-rc.2-openbkn.0.2.0) |
| `dsh-v0.1.6-alpha.2` (previous series) | [`compat/dsh-0.1.6-alpha.2/`](compat/dsh-0.1.6-alpha.2/) (archived) | `@openbkn/dsh-business-context@0.1.5-rc.2` from npm, or a source build from git tag [`v0.1.5-rc.2`](https://github.com/openbkn-ai/bkn-dsh/tree/v0.1.5-rc.2) | [openbkn-dsh-runtime-v0.1.6-alpha.2-openbkn.1](https://github.com/openbkn-ai/bkn-dsh/releases/tag/openbkn-dsh-runtime-v0.1.6-alpha.2-openbkn.1) |

Since the `0.2.0-rc.2` round, the plugin and the runtime bundle share one version scheme — `<dsh-version>-openbkn.<openbkn-platform-version>` — so the version number declares both compatibility dimensions at a glance: `0.2.0-rc.2-openbkn.0.2.0` pairs DSH `0.2.0-rc.2` with OpenBKN platform `0.2.0`, and a republish with the same pair appends `-<n>` (`0.2.0-rc.2-openbkn.0.2.0-6`). The runtime manifest validator rejects any manifest whose plugin version does not carry its pinned DSH revision. Releases before this round keep their historical version numbers.

The plugin's declared DSH peers must match your runtime — DSH's version fence refuses mismatched installs. **Do not build the plugin from current `main` for a `0.1.6-alpha.2` runtime**: since the `0.2.0-rc.2` retarget its peers declare `0.2.0-rc.2`, and the install will be rejected. [`compat/dsh-0.1.2-rc.1/`](compat/dsh-0.1.2-rc.1/) is a historical archive with no npm pairing.
