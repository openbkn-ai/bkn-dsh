# bkn-dsh

**Illustrated user guide:** [English](docs/user-guide/README.en.md) · [中文](docs/user-guide/README.zh.md) · [PDF (中文)](docs/user-guide/bkn-dsh-9-user-guide.zh.pdf). Includes installation, CLI setup, sign-in, supply-chain Q&A, provenance, and diagnostics with numbered screenshots.

Published -7 history: [GitHub Release](https://github.com/openbkn-ai/bkn-dsh/releases/tag/v0.2.0-rc.2-openbkn.0.2.0-7), [cumulative update notes](docs/releases/2026-10-06-unified-7-notes.md), and [publication verification](https://github.com/openbkn-ai/bkn-dsh/releases/download/v0.2.0-rc.2-openbkn.0.2.0-7/PUBLICATION-VERIFICATION.json). Historical -5/-6 packages and earlier -7 candidates retain their original identities; acceptance remains limited to the recorded artifacts and scenarios.

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

## Install and start

Have an existing `name`-qualified override from a version <= -4? See the [package migration note](packages/openbkn-business-context/README.md#upgrading-name-qualified-overrides-required-for--7). Fresh installs do not need this migration.

From plugin `0.2.0-rc.2-openbkn.0.2.0-1` on, an unpatched DeepSeek Harness `0.2.0-rc.2` is all you need: install the plugin package with DSH's own plugin manager. The same package works on all three forms of DSH:

| DSH form | How you run it |
| --- | --- |
| Official desktop app `0.2.0-rc.2` | the DeepSeek Harness app |
| npm CLI | `npm install -g @deepseek-ai/dsh@0.2.0-rc.2`, then `dsh web` |
| Source checkout, built | `dsh-v0.2.0-rc.2` checkout after `pnpm install && pnpm run build`, then `node apps/cli/lib/bin.js web` |

Historical acceptance of earlier packages on macOS arm64 covered all three forms: install, binding, Q&A with tool calls, business provenance, reopening a session after a restart, and continuing its platform conversation ([evidence](docs/evidence/2026-09-29-desktop-direct-install.md)). On Windows 10, the desktop app and the npm CLI were verified too: with the default configuration, sign-in, binding, and Q&A pass (round 2, after the CLI-lookup fix); the remaining items — provenance, restart and continue, unbound and PTC refusals, uninstall — passed in round 1 with `cliPath` set, before that fix ([results](docs/handoff/2026-10-02-windows-verification-round2.md)). The source-checkout form was not run on Windows in that baseline. These dated results do not replace acceptance of a new package or the configuration flow described below.

### Before you start

1. **OpenBKN CLI.** Install the CLI version recommended for your platform: for OpenBKN 0.1.5, use `npm install -g @openbkn/bkn-sdk@0.1.5`; for 0.1.4, use `@openbkn/bkn-sdk@0.1.4` (`0.1.5-rc.1` also works). CLI `0.1.5-rc.2` and later require the platform health/version endpoint, which 0.1.4 lacks. You can configure the plugin before signing in; the panel starts CLI authorization when needed. DSH must find `openbkn` on its own process `PATH`. The macOS desktop app reads the login-shell environment; Windows uses `openbkn.cmd`. If discovery fails, set the CLI's absolute path in **设置 → 高级设置** (Settings → Advanced settings). On Windows, name the shim itself, for example `C:/Users/<you>/AppData/Roaming/npm/openbkn.cmd`; `where.exe openbkn` shows its location.
2. **pnpm, for the npm CLI only.** The npm `dsh` hands `plugin add` to the `pnpm` on `PATH`; install it first (`npm install -g pnpm@11.7.0`, the version DSH itself uses). The desktop app bundles its own.
3. **Self-signed platform certificate** (skip for a publicly trusted one). DSH must trust the platform CA through `NODE_EXTRA_CA_CERTS=<CA pem path>`:
   - `dsh web` from a terminal: prefix the command with the variable.
   - Desktop app on macOS: `export NODE_EXTRA_CA_CERTS=…` in `~/.zprofile` or `~/.zshrc`. The app reads the login-shell environment at startup, including Dock and Finder launches.
   - Windows: set it as a user environment variable, then fully quit and restart every program that should see it, including terminals inside IDEs or agent hosts that were already running.
4. **Use Standard mode.** A session bound to an OpenBKN network must run in DSH's **Standard mode** (标准模式). PTC mode is not supported yet: the plugin refuses `run_code` there and the model asks you to start a new session in Standard mode. The mode is chosen in the mode menu before the first message is sent and cannot be changed afterwards.

### 1. Install the plugin

In DSH's **Plugins** page, choose **Add plugin** and enter `@openbkn/dsh-business-context@latest`. Select your registry and install the package. You can also install from a terminal while DSH is stopped; the desktop app must have been started once to create its profile:

```bash
# Desktop app (macOS). “Manage dsh command…” can also add dsh to PATH.
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" plugin --profile desktop add @openbkn/dsh-business-context@latest

# npm CLI
dsh plugin --profile web add @openbkn/dsh-business-context@latest

# Source build, from the DSH checkout root
node apps/cli/lib/bin.js plugin --profile web add @openbkn/dsh-business-context@latest
```

On Windows, use `dsh.cmd` in place of `dsh`. Use the actual profile and `DSH_HOME` of the Host you run; the default `desktop` and `web` profiles are separate. To install a downloaded package, replace the package spec with its absolute `.tgz` path.

### 2. Configure in the OpenBKN panel

1. Start DSH and click **OpenBKN** in the sidebar footer. An unset address is a normal **待配置** (not configured) state: the component stays enabled and diagnostics remains available. The plugin does not contact OpenBKN or read its CLI credentials until an address is configured.
2. Enter your platform's absolute `http://` or `https://` address and choose **保存并继续** (Save and continue). A malformed address is rejected without changing the saved configuration. Saving the address does not itself prove that the platform is reachable or authorized.
3. If DSH cannot find the CLI, open **高级设置** (Advanced settings) and set `cliPath`; its default is `openbkn`. The panel's **设置** (Settings) action lets you edit the same form later. Wait for an active business turn to finish before changing the platform address.
4. When prompted, choose **使用 OpenBKN CLI 登录并同步** (Sign in with OpenBKN CLI and sync), complete browser authorization, and return to DSH. If an existing credential is rejected, use this action to sign in again. A 403 may require the platform administrator to grant access; signing in as the same account does not guarantee recovery.

Settings are saved through DSH's configuration editor to the current profile and applied by its normal component reload. Other configuration fields are preserved. A higher-priority override may prevent a setting from taking effect; the panel reports this instead of silently bypassing it. A temporary network or certificate error does not erase the saved address. Existing sessions keep their original platform and network binding; changing the address does not rebind them.

You do not need to edit YAML or paste an access token for this flow. Tokens remain managed by the OpenBKN CLI and DSH credentials. For administrator-managed advanced configuration, an ID-only profile override still works:

```yaml
- id: openbkn-business-context
  config:
    baseUrl: https://<your-openbkn-platform>
    # cliPath: /absolute/path/to/openbkn
```

The platform address is not sensitive. Never put tokens in Cordis YAML. An invalid address supplied in configuration remains a configuration error; it is distinct from an address that has not been set.

### 3. Bind a network and ask

1. After authorization, pick an accessible knowledge network and create its local workspace (**新建工作区** / New workspace opens the folder chooser), or continue its existing workspace.
2. In the new session, keep **标准模式** (Standard mode), then ask. Each completed answer offers **查看业务溯源** (view business provenance: execution trace, business context graph, evidence).
3. For connection or setup problems, open **诊断** (Diagnostics) at the top right of the OpenBKN panel and export the report. Closing the panel keeps it closed when an earlier request finishes; it does not promise to cancel browser authorization already in progress.

With `dsh web` on macOS, the folder chooser opens on the machine that runs `dsh web`. A remote or SSH session uses DSH's browse backend, which cannot create a workspace from the plugin panel: associate the network with an existing local workspace first.

### Uninstall

Use DSH's **Plugins** page to remove the `@openbkn/dsh-business-context` package. If the Host asks you to stop the profile, do so before retrying. Alternatively, stop DSH and run:

```bash
dsh plugin --profile <desktop|web> remove @openbkn/dsh-business-context
```

Removal unloads the package's components and removes its profile dependency. It does not erase user overrides in the profile patch, DSH/OpenBKN credentials, CLI sign-in state, sessions, network/workspace bindings, or workspace files. This is an uninstall, not a logout or data wipe. Do not delete the entire `node_modules/@openbkn` directory: it may contain other packages.

Sessions written by current plugin versions stay readable because the plugin does not add events to the DSH session log. Retained configuration and bindings can be reused after reinstalling. While installed, the plugin may prune session-binding records whose session no longer exists and whose record is at least seven days old; uninstalling does not run a blanket cleanup. See the historical session-log limitation below for the original `0.2.0-rc.2-openbkn.0.2.0` release.

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
3. **Configure and authorize** — enter the platform address in the OpenBKN panel, then use its CLI sign-in action. The plugin reads the token through the CLI handshake only.
4. **Bind** — open the OpenBKN panel in DSH, pick the network, and start a session in its workspace.

## Supported DSH versions

Exactly one upstream DSH revision is supported at a time — currently `dsh-v0.2.0-rc.2`, pinned by [the compatibility manifest](compat/dsh-0.2.0-rc.2/manifest.json). A scheduled workflow (`upstream-dsh-watch`) watches upstream tags and opens a tracking issue whenever a release moves ahead of the pin; until the compatibility series is regenerated for it, newer DSH revisions are out of scope.

Check your version with `dsh --version`, then pair it like this:

| Your DSH version | Compatibility series | Plugin to install | Prebuilt runtime archive |
| --- | --- | --- | --- |
| `dsh-v0.2.0-rc.2` (current pin): desktop app, npm CLI, or source build | not needed to use the plugin; [`compat/dsh-0.2.0-rc.2/`](compat/dsh-0.2.0-rc.2/) builds it from source | `@openbkn/dsh-business-context@latest` from npm or a published `.tgz` (Standard mode) | discontinued; last one: [openbkn-dsh-runtime-v0.2.0-rc.2-openbkn.0.2.0](https://github.com/openbkn-ai/bkn-dsh/releases/tag/openbkn-dsh-runtime-v0.2.0-rc.2-openbkn.0.2.0) |
| `dsh-v0.1.7-rc.2` (previous series) | [`compat/dsh-0.1.7-rc.2/`](compat/dsh-0.1.7-rc.2/) (archived) | `@openbkn/dsh-business-context@0.1.7-rc.2-openbkn.0.2.0` from npm, or build from git tag [`v0.1.7-rc.2-openbkn.0.2.0`](https://github.com/openbkn-ai/bkn-dsh/tree/v0.1.7-rc.2-openbkn.0.2.0) | [openbkn-dsh-runtime-v0.1.7-rc.2-openbkn.0.2.0](https://github.com/openbkn-ai/bkn-dsh/releases/tag/openbkn-dsh-runtime-v0.1.7-rc.2-openbkn.0.2.0) |
| `dsh-v0.1.6-alpha.2` (previous series) | [`compat/dsh-0.1.6-alpha.2/`](compat/dsh-0.1.6-alpha.2/) (archived) | `@openbkn/dsh-business-context@0.1.5-rc.2` from npm, or a source build from git tag [`v0.1.5-rc.2`](https://github.com/openbkn-ai/bkn-dsh/tree/v0.1.5-rc.2) | [openbkn-dsh-runtime-v0.1.6-alpha.2-openbkn.1](https://github.com/openbkn-ai/bkn-dsh/releases/tag/openbkn-dsh-runtime-v0.1.6-alpha.2-openbkn.1) |

Since the `0.2.0-rc.2` round, the plugin and the runtime bundle share one version scheme — `<dsh-version>-openbkn.<openbkn-platform-version>` — so the version number declares both compatibility dimensions at a glance: `0.2.0-rc.2-openbkn.0.2.0` pairs DSH `0.2.0-rc.2` with OpenBKN platform `0.2.0`, and a republish with the same pair appends `-<n>` (`0.2.0-rc.2-openbkn.0.2.0-7`). The runtime manifest validator rejects any manifest whose plugin version does not carry its pinned DSH revision. Releases before this round keep their historical version numbers.

The plugin's declared DSH peers must match your runtime — DSH's version fence refuses mismatched installs. **Do not build the plugin from current `main` for a `0.1.6-alpha.2` runtime**: since the `0.2.0-rc.2` retarget its peers declare `0.2.0-rc.2`, and the install will be rejected. [`compat/dsh-0.1.2-rc.1/`](compat/dsh-0.1.2-rc.1/) is a historical archive with no npm pairing.
