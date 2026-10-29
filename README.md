# bkn-dsh

**Recent updates (September 21–October 12):** [English](docs/releases/2026-10-12-recent-updates.md) · [中文](docs/releases/2026-10-12-recent-updates.zh.md).

**Illustrated user guide (historical -9 workflow; use the current version and installation instructions below):** [English](docs/user-guide/README.en.md) · [中文](docs/user-guide/README.zh.md) · [PDF (中文)](docs/user-guide/bkn-dsh-9-user-guide.zh.pdf). Includes installation, CLI setup, sign-in, supply-chain Q&A, provenance, and diagnostics with numbered screenshots.

Published -7 history: [GitHub Release](https://github.com/openbkn-ai/bkn-dsh/releases/tag/v0.2.0-rc.2-openbkn.0.2.0-7), [cumulative update notes](docs/releases/2026-10-06-unified-7-notes.md), and [publication verification](https://github.com/openbkn-ai/bkn-dsh/releases/download/v0.2.0-rc.2-openbkn.0.2.0-7/PUBLICATION-VERIFICATION.json). Historical -5/-6 packages and earlier -7 candidates retain their original identities; acceptance remains limited to the recorded artifacts and scenarios.

[中文](README.zh.md)

Bring governed OpenBKN business knowledge into DeepSeek Harness conversations.

## 0.2.1 release status (2026-10-29)

`@openbkn/dsh-business-context@0.2.1-rc.3-openbkn.0.2.1` is published on npm under `rc`; the [GitHub Release](https://github.com/openbkn-ai/bkn-dsh/releases/tag/v0.2.1-rc.3-openbkn.0.2.1) is a prerelease. At this checkpoint, npm `latest` still points to `0.2.0-rc.2-openbkn.0.2.0-13`. Promotion and local npm authentication remain maintainer-owned; they have not been performed by this documentation update. Install the exact version below to select this release independently of dist-tags.

### Final CI and artifact identity

| Run | Result and scope |
| --- | --- |
| [Final candidate CI 40361613728](https://github.com/openbkn-ai/bkn-dsh/actions/runs/40361613728) | Passed with `publish=false`; source `db68c80070f3475a1a460c3c9fca84d26944e198`; build, tests, package inspection and controlled checks of the same tarball on both official npm Hosts. |
| [Main rehearsal CI 40368159024](https://github.com/openbkn-ai/bkn-dsh/actions/runs/40368159024) | Passed on `ddbf578b93efca1872e0ae9781dafae5713e9deb`; its 82-file candidate is byte-identical to the accepted final CI candidate. |
| [Publication CI 40369214007](https://github.com/openbkn-ai/bkn-dsh/actions/runs/40369214007) | Passed; published this version under npm `rc` and created the matching GitHub Release. |

The accepted CI tarball SHA256 is `27ccf15c46e4f71ef850ee481e22556b70f4d4795e89d7d587a2e3210fc6b3e3`. The published npm/GitHub tarball SHA256 is `3a877e1fa6ae218b36cfc4d65ca0bb1b6e17363880465ac164c31a89e14ed46d`: all 82 file paths match, only `package.json` serialization differs, and the parsed package metadata is equal. Both 12-file MCP companions and the release's eight assets retain their accepted identities. These are existing runs and artifacts; this status update rebuilds or republishes nothing.

### Compatibility and installation prerequisite

The exact declared runtime versions are official DSH **`0.2.0-rc.2` and `0.2.1-rc.3`**, as recorded in [the host matrix](compat/dsh-hosts.json). DSH `0.2.1-rc.4`, `0.2.2-alpha.2` and other versions are outside this artifact's declared and verified scope. The independent source-build generator remains pinned to `0.2.0-rc.2`; it is not the sole supported runtime.

The OpenBKN `0.2.1` component in this version is the maintainer-approved release identity. Actual platform/CLI evidence is for official **OpenBKN `0.2.0` and CLI `0.2.0`**; it does not establish platform `0.2.1` or current unreleased-main compatibility.

The #105 same-origin protection requires the **matching profile MCP companion**. The plugin tarball does not install it automatically. Follow the [placement, mounted-instance verification and rollback instructions](compat/mcp-profile-backport/README.md), retain the official application, and choose the companion for your exact Host. This protects the reviewed fixed-Bearer business bridge; it is not a stock-Host or global SDK/OAuth security fix. Package-manager reinstall/cleanup and future Host upgrades may replace the profile dependency.

### Acceptance scope and remaining limits

- The [0.2.1 plugin tasks](https://github.com/openbkn-ai/bkn-dsh/issues?q=is%3Aissue%20project%3Aopenbkn-ai%2F12) are closed, including #93/#97. The final candidate has recorded affected Mac/Windows Desktop-backend and npm checks; earlier GUI, locale, login, B1 and MCP-vector evidence is reused with its original artifact identity. This is not a claim that every scenario was rerun on every form.
- [#93's existing-record API/Studio comparison](docs/evidence/2026-10-27-issue93-native-studio/RESULTS.md) and [#97's Mac npm/Web linkage checks](docs/evidence/2026-10-28-issue97-native-linkage/RESULTS.md) are complete. The latter checks three claims and eleven current-pair relations through a read-only recall created with public Session/Workspace APIs; it is not a new model turn or a correctness verdict on the recorded answer.
- The [Windows rc.3 Desktop native-UI supplement](docs/handoff/2026-10-27-release-021/native-ui-supplement-windows/RESULTS-native-ui-supplement-20261028.md) is **PASS_WITH_LIMITS** for the specified existing record. Its directly constructed storage replay does not validate answer attribution/binding; a forced schema-reference view switch remains UNKNOWN, the initial renderer-crash cause remains UNKNOWN, and that supplement's optional real-business CSV case is NOT_RUN. Earlier packed CSV checks remain separate. Private screenshots, AX, crash and registry originals were not independently retrieved in the coordinating review.
- B1/#98 and startup/#108 are completed bounded investigations, not universal repair claims. Historical runner/browser/Job, menu-exit, startup-identity/window and cleanup qualifications remain recorded. Original G6/model FAIL/BLOCKED results and `formalAcceptanceEligible=false` records are not upgraded to overall acceptance.
- [Foundry #2573](https://github.com/openbkn-ai/bkn-foundry/issues/2573) remains a separate retained-platform evidence-channel issue. Existing enterprise samples do not prove that environment repaired. Business/model findings retain their upstream ownership; the plugin preserves platform states, reasons, records and native answers without arbitration, corrective turns or duplicate calculations.

See [the current acceptance ledger](docs/plans/0.2.1/REMAINING-WORK.md) for the dated evidence and maintainer dispositions. Frozen -30/-31/-32 and [earlier development checkpoints](docs/evidence/2026-10-21-local-34/RESULTS.md) are historical inputs, not the current published candidate or a pending-final-CI statement.

### CSV delivery and Interaction records

CSV delivery in this release uses the scoped `openbkn_export_csv` tool when the Host offers the required file services. After an existing platform CSV is created, the tool verifies and copies its exact UTF-8 bytes (up to 512 KiB) to a new file in the current DSH workspace. It requires the current bound Interaction and workspace write access; read-only sessions refuse delivery. Open the returned local file link only after export succeeds. Host read/grep/present remain unavailable. Managed guidance requires source precision in answers and CSV serialization, including avoiding Python default general formatting unless rounding is requested by the user or a disclosed platform rule. Model answer and file contents still require independent validation.

Export results include a verified `markdown_link`; repeat it with the answer and scope in the final message after finishing the Interaction, because progress messages may be collapsed. Count scope and requested calculation signs follow the platform contract; the plugin does not recalculate business results.

Formal capture-disabled responses retain managed Conversation/Interaction IDs: business calls still send the required `bkn_context`, and finish uses the current Interaction ID. Provenance preserves the disclosed identities, labels the absence of recorded evidence and keeps the local timeline. The earlier explicit no-identity downgrade remains a separate compatibility path. The plugin does not recalculate business results or alter model answers.

## Why

Enterprise decisions need trusted business objects, metrics, rules, relationships, and permission-aware evidence. General-purpose chat alone does not provide that governed context.

## What

bkn-dsh is an additive DeepSeek Harness plugin that lets authorized users select one OpenBKN business knowledge network for a conversation, analyze within that explicit scope, and inspect available business provenance for each completed answer.

> Version prerequisite: provenance availability depends on deployment capabilities, mounted routes and account permissions. Official 0.2.0 Community provides standard Interaction/operation records; native detail/explanations require the corresponding extension. #93/#97 now have an existing enterprise nonempty sample and scoped linkage evidence. [Foundry #2517](https://github.com/openbkn-ai/bkn-foundry/issues/2517) closed the Community/extension classification; [#2573](https://github.com/openbkn-ai/bkn-foundry/issues/2573) remains a separate retained-platform evidence-channel issue. Neither a 404 nor another environment's success establishes a license diagnosis or proves that deployment repaired.

## Who it serves

- Business users and analysts who need explainable, governed analysis.
- Knowledge-network owners who want their business semantics reused consistently.
- Enterprise AI platform teams that need least-privilege knowledge access without exposing unrestricted data interfaces.

## Business value

- Grounds analysis in authorized business semantics and current platform data.
- Keeps each conversation in one explicit, immutable knowledge-network scope.
- Preserves native DeepSeek Harness workflows while adding traceable OpenBKN context.
- Reduces the cost of reaching trusted business insight without requiring query-language expertise.

The published package README is a frozen release-time snapshot. This repository README and the matching GitHub Release carry the current release status; updating them does not modify the published package.

## Install and start

Have an existing `name`-qualified override from a version <= -4? See the [package migration note](packages/openbkn-business-context/README.md#upgrading-name-qualified-overrides-required-for--7). Fresh installs do not need this migration.

Keep the supported official DSH application/runtime and install this plugin with its own plugin manager. The reviewed #105 protection also requires the matching profile MCP companion described above; the plugin does not install it automatically. Use the exact Host version and profile covered by the release record. These entry points explain how to run DSH; the recorded Desktop/npm acceptance and historical source-build results retain their separate scopes:

| DSH form | How you run it |
| --- | --- |
| Official desktop app `0.2.0-rc.2` or `0.2.1-rc.3` | the matching official DeepSeek Harness app |
| npm CLI | For a fresh installation, choose `@deepseek-ai/dsh@0.2.0-rc.2` or `@deepseek-ai/dsh@0.2.1-rc.3`, then run `dsh web`; retain an existing supported installation. |
| Source checkout, built | Build the matching pinned DSH tag, then run `node apps/cli/lib/bin.js web`; see the source-build guide and its version-specific evidence. |

Historical acceptance of earlier packages on macOS arm64 covered all three forms: install, binding, Q&A with tool calls, business provenance, reopening a session after a restart, and continuing its platform conversation ([evidence](docs/evidence/2026-09-29-desktop-direct-install.md)). On Windows 10, the desktop app and the npm CLI were verified too: with the default configuration, sign-in, binding, and Q&A pass (round 2, after the CLI-lookup fix); the remaining items — provenance, restart and continue, unbound and PTC refusals, uninstall — passed in round 1 with `cliPath` set, before that fix ([results](docs/handoff/2026-10-02-windows-verification-round2.md)). The source-checkout form was not run on Windows in that baseline. These dated results do not replace acceptance of a new package or the configuration flow described below.

### Before you start

1. **OpenBKN CLI.** For this release's verified OpenBKN 0.2.0 platform, use `npm install -g @openbkn/bkn-sdk@0.2.0` and check `openbkn --version`. Older platform/CLI pairings belong to their historical releases and do not establish this release's acceptance. You can configure the plugin before signing in; the panel starts CLI authorization when needed. DSH must find `openbkn` on its own process `PATH`. The macOS desktop app reads the login-shell environment; Windows uses `openbkn.cmd`. If discovery fails, set the CLI's absolute path in **设置 → 高级设置** (Settings → Advanced settings). On Windows, name the shim itself, for example `C:/Users/<you>/AppData/Roaming/npm/openbkn.cmd`; `where.exe openbkn` shows its location.
2. **pnpm, for the npm CLI only.** The npm `dsh` hands `plugin add` to the `pnpm` on `PATH`. Use the matching Host's package manager: `pnpm@11.7.0` for DSH `0.2.0-rc.2`, or `pnpm@11.28.5` for `0.2.1-rc.3`. The desktop app bundles its own.
3. **Self-signed platform certificate** (skip for a publicly trusted one). DSH must trust the platform CA through `NODE_EXTRA_CA_CERTS=<CA pem path>`:
   - `dsh web` from a terminal: prefix the command with the variable.
   - Desktop app on macOS: `export NODE_EXTRA_CA_CERTS=…` in `~/.zprofile` or `~/.zshrc`. The app reads the login-shell environment at startup, including Dock and Finder launches.
   - Windows: set it as a user environment variable, then fully quit and restart every program that should see it, including terminals inside IDEs or agent hosts that were already running.
4. **Use Standard mode.** A session bound to an OpenBKN network must run in DSH's **Standard mode** (标准模式). PTC mode is not supported yet: the plugin refuses `run_code` there and the model asks you to start a new session in Standard mode. The mode is chosen in the mode menu before the first message is sent and cannot be changed afterwards.

### 1. Install the plugin

In DSH's **Plugins** page, choose **Add plugin** and enter `@openbkn/dsh-business-context@0.2.1-rc.3-openbkn.0.2.1`. Select your registry and install the package. You can also install from a terminal while DSH is stopped; the desktop app must have been started once to create its profile:

```bash
# Desktop app (macOS). “Manage dsh command…” can also add dsh to PATH.
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" plugin --profile desktop add @openbkn/dsh-business-context@0.2.1-rc.3-openbkn.0.2.1

# npm CLI
dsh plugin --profile web add @openbkn/dsh-business-context@0.2.1-rc.3-openbkn.0.2.1

# Source build, from the DSH checkout root
node apps/cli/lib/bin.js plugin --profile web add @openbkn/dsh-business-context@0.2.1-rc.3-openbkn.0.2.1
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

The published `0.2.1-rc.3-openbkn.0.2.1` artifact declares the exact pair in [the host matrix](compat/dsh-hosts.json): `0.2.0-rc.2` and `0.2.1-rc.3`. The old generator remains the independent build baseline. Final CI and scoped acceptance are recorded above and in the [acceptance contract](docs/plans/0.2.1/ACCEPTANCE-CONTRACT.md); controlled fixtures remain distinct from real Host, platform, model and human evidence.

Check your version with `dsh --version`, then pair it like this:

| Your DSH version | Compatibility series | Plugin to install | Prebuilt runtime archive |
| --- | --- | --- | --- |
| `dsh-v0.2.0-rc.2` (supported runtime and retained build pin) | Host build patches are not needed to install the plugin; #105 uses the separate profile companion; [`compat/dsh-0.2.0-rc.2/`](compat/dsh-0.2.0-rc.2/) is for source builds | `@openbkn/dsh-business-context@0.2.1-rc.3-openbkn.0.2.1` or the matching published `.tgz` (Standard mode) | discontinued; last one: [openbkn-dsh-runtime-v0.2.0-rc.2-openbkn.0.2.0](https://github.com/openbkn-ai/bkn-dsh/releases/tag/openbkn-dsh-runtime-v0.2.0-rc.2-openbkn.0.2.0) |
| `dsh-v0.2.1-rc.3` (supported runtime) | Official Host plus the matching profile MCP companion; old build generator retained | The same `@openbkn/dsh-business-context@0.2.1-rc.3-openbkn.0.2.1` artifact; scoped acceptance and limits above | no new runtime archive |
| `dsh-v0.1.7-rc.2` (previous series) | [`compat/dsh-0.1.7-rc.2/`](compat/dsh-0.1.7-rc.2/) (archived) | `@openbkn/dsh-business-context@0.1.7-rc.2-openbkn.0.2.0` from npm, or build from git tag [`v0.1.7-rc.2-openbkn.0.2.0`](https://github.com/openbkn-ai/bkn-dsh/tree/v0.1.7-rc.2-openbkn.0.2.0) | [openbkn-dsh-runtime-v0.1.7-rc.2-openbkn.0.2.0](https://github.com/openbkn-ai/bkn-dsh/releases/tag/openbkn-dsh-runtime-v0.1.7-rc.2-openbkn.0.2.0) |
| `dsh-v0.1.6-alpha.2` (previous series) | [`compat/dsh-0.1.6-alpha.2/`](compat/dsh-0.1.6-alpha.2/) (archived) | `@openbkn/dsh-business-context@0.1.5-rc.2` from npm, or a source build from git tag [`v0.1.5-rc.2`](https://github.com/openbkn-ai/bkn-dsh/tree/v0.1.5-rc.2) | [openbkn-dsh-runtime-v0.1.6-alpha.2-openbkn.1](https://github.com/openbkn-ai/bkn-dsh/releases/tag/openbkn-dsh-runtime-v0.1.6-alpha.2-openbkn.1) |

Since the `0.2.0-rc.2` round, the plugin and the runtime bundle share one version scheme — `<dsh-version>-openbkn.<openbkn-platform-version>` — so the version number declares both compatibility dimensions at a glance: `0.2.0-rc.2-openbkn.0.2.0` pairs DSH `0.2.0-rc.2` with OpenBKN platform `0.2.0`, and a republish with the same pair appends `-<n>` (`0.2.0-rc.2-openbkn.0.2.0-7`). The runtime manifest validator rejects any manifest whose plugin version does not carry its pinned DSH revision. Releases before this round keep their historical version numbers. For `0.2.1-rc.3-openbkn.0.2.1`, the OpenBKN component is the approved release identity; actual verified platform/CLI versions remain `0.2.0`, as stated above.

The plugin's declared DSH peers must match your runtime — DSH's version fence refuses mismatched installs. **Do not build the plugin from current `main` for a `0.1.6-alpha.2` runtime**: the current package peers declare only `0.2.0-rc.2 || 0.2.1-rc.3`, so an incompatible install is refused. [`compat/dsh-0.1.2-rc.1/`](compat/dsh-0.1.2-rc.1/) is a historical archive with no npm pairing.
