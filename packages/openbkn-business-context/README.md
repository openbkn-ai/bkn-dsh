# bkn-dsh

OpenBKN business knowledge, network-scoped access, diagnostics, and provenance for DeepSeek Harness.

[中文](README.zh.md)

Bring governed enterprise business knowledge into DeepSeek Harness conversations.

## Why bkn-dsh

General-purpose AI can reason fluently but often lacks the trusted business context required for real decisions. Enterprise knowledge is distributed across systems, rules, processes, metrics, and relationships, while access must remain consistent with the user's identity and permissions.

OpenBKN turns that fragmented knowledge into governed business knowledge networks. bkn-dsh makes those networks available where users already analyze and act: the DeepSeek Harness conversation experience.

## What it does

bkn-dsh connects DeepSeek Harness to OpenBKN so an authorized user can:

- sign in to OpenBKN without affecting local DSH work;
- select a business knowledge network they are allowed to access;
- analyze business questions within that network's objects, relationships, rules, and metrics;
- keep each conversation scoped to one explicit business context;
- inspect a layered provenance view per result: a local execution timeline that always renders, platform operation facts (request/trace/receipt ids) and the enterprise business graph that each degrade independently, and a receipt list with CLI verification hints.

The integration is designed as an additive DSH plugin. It preserves the native DSH conversation experience while OpenBKN remains the authority for identity, permissions, business semantics, and traceable evidence.

Ordinary answers use the tool results and DSH's native model output. The plugin enforces access and Interaction boundaries, but does not rewrite answers, force a report format, or retry/reject a turn based on natural-language consistency. Completion records execution status; factual correctness is checked separately in evaluations.

## Who it is for

- **Business users** who need reliable analysis without learning query languages or platform APIs.
- **Analysts and decision makers** who need to understand not only an answer, but also the business objects, relationships, indicators, and evidence behind it.
- **Enterprise AI platform teams** that need governed knowledge access without exposing unrestricted data interfaces to users or models.
- **Knowledge network owners** who want their curated business semantics to be used consistently in everyday AI workflows.

## Business value

- **More accurate analysis** — answers are grounded in explicit business semantics and current authorized data.
- **Safer enterprise adoption** — users and models operate within the selected network and the platform's permission boundary.
- **Explainable decisions** — every completed analysis can be traced to business context, execution facts, and available evidence.
- **Lower interaction cost** — users ask business questions naturally instead of navigating multiple systems or writing technical queries.
- **Reusable organizational knowledge** — governed knowledge networks become a shared decision layer across conversations and teams.

## Install and start

Use an unpatched DeepSeek Harness `0.2.0-rc.2`: the official desktop app, npm CLI (`@deepseek-ai/dsh@0.2.0-rc.2`), or a built source checkout. In DSH's **Plugins** page, choose **Add plugin**, enter `@openbkn/dsh-business-context@latest`, and select your registry. Or stop DSH and run:

```bash
dsh plugin --profile <desktop|web> add @openbkn/dsh-business-context@latest
```

On Windows, use `dsh.cmd`. A source build uses `node apps/cli/lib/bin.js plugin --profile web add @openbkn/dsh-business-context@latest` from the DSH checkout root. Choose the actual profile and `DSH_HOME` of the Host you run; `desktop` and `web` are separate profiles. For a downloaded package, replace the package spec with its absolute `.tgz` path.

Install an OpenBKN CLI version that matches the platform. For OpenBKN 0.1.5, use `npm install -g @openbkn/bkn-sdk@0.1.5`; for 0.1.4, use `@openbkn/bkn-sdk@0.1.4` (`0.1.5-rc.1` also works). CLI `0.1.5-rc.2` and later require a platform health/version endpoint absent in 0.1.4. You do not need to sign in before configuring the plugin. The npm DSH CLI also requires pnpm on `PATH` (`npm install -g pnpm@11.7.0`); the desktop app bundles it. For a self-signed platform certificate, configure `NODE_EXTRA_CA_CERTS` for the DSH process and fully restart it; detailed platform-specific instructions are in the [repository README](https://github.com/openbkn-ai/bkn-dsh#before-you-start).

### Configure, authorize, and ask

1. Start DSH and click **OpenBKN** in the sidebar footer. An unset address is a normal **待配置** (not configured) state, with diagnostics available. Before configuration, the plugin does not contact OpenBKN or read its CLI credentials.
2. Enter an absolute `http://` or `https://` platform address and click **保存并继续** (Save and continue). Invalid input is rejected without changing the saved configuration. The address is saved through DSH's configuration editor in the current profile and applied by normal component reload. Saving it does not prove that a connection or authorization succeeded.
3. If DSH cannot find the CLI, set `cliPath` in **高级设置** (Advanced settings); the default is `openbkn`. On Windows, an absolute path must include the shim filename, for example `C:/Users/<you>/AppData/Roaming/npm/openbkn.cmd`. Use **设置** (Settings) at the top right to edit the same form later. Wait for an active business turn to finish before changing the platform address.
4. Choose **使用 OpenBKN CLI 登录并同步** (Sign in with OpenBKN CLI and sync), complete browser authorization, and return to DSH. If an existing credential is rejected, use the same action to sign in again. A 403 may require an administrator to grant access; another sign-in with the same account does not guarantee recovery.
5. Select an authorized knowledge network, create or continue its workspace, and ask in a new **标准模式** (Standard mode) session. PTC mode is not supported. Completed answers offer **查看业务溯源** (View business provenance).

The form preserves other configuration fields and reports higher-priority overrides that prevent a setting from applying. Temporary network/TLS failures do not erase the saved address. Existing sessions keep their original platform and network binding; changing the address does not rebind them. No YAML editing or manual token entry is needed for this flow. The OpenBKN CLI and DSH credentials manage tokens; never put them in configuration files.

Closing the panel keeps it closed when an earlier request finishes. It does not promise to cancel browser authorization already in progress. For full setup and workspace chooser details, see the [repository README](https://github.com/openbkn-ai/bkn-dsh#install-and-start).

## Uninstall

Remove the package through DSH's **Plugins** page. If DSH asks you to stop the profile, stop it before retrying. Alternatively, with DSH stopped:

```bash
dsh plugin --profile <desktop|web> remove @openbkn/dsh-business-context
```

Removal unloads the package components and removes its profile dependency. It retains user profile overrides, DSH/OpenBKN credentials, CLI sign-in state, sessions, network/workspace bindings, and workspace files. It does not log out or wipe data. Do not delete the entire `node_modules/@openbkn` directory, which may contain other packages. Configuration and bindings can be reused after reinstalling.

Current versions do not add plugin events to the DSH session log, so uninstalling keeps sessions readable. The original `0.2.0-rc.2-openbkn.0.2.0` release had a separate session-log limitation; see the [repository history note](https://github.com/openbkn-ai/bkn-dsh#upgrading-from-020-rc2-openbkn020). While installed, the plugin may prune bindings for sessions that no longer exist once a record is at least seven days old; uninstall does not run a blanket cleanup.

## Package layout (changed in -7)

The package root is a minimal bootstrap plugin that keeps the host serving the browser bundle. Import the business API from `@openbkn/dsh-business-context/business`; the Remote boundary types live on `@openbkn/dsh-business-context/types`. Diagnostics remains on `@openbkn/dsh-business-context/diagnostics`.

### Upgrading name-qualified overrides (required for -7)

The host treats a `name` field in a profile override as an assertion about
the row it patches. When upgrading from published versions <= -4 to `-7` the business row loads from
`@openbkn/dsh-business-context/business`, so an override that keeps the old
bare package name is skipped and its `config` is silently lost:

```yaml
# Stops matching after upgrading to -7 — baseUrl/cliPath are dropped:
- id: openbkn-business-context
  name: '@openbkn/dsh-business-context'
  config: { baseUrl: ..., cliPath: ... }
```

Fix it by deleting the `name` line (the `id` alone addresses the row), or
by asserting the new subpath name
`'@openbkn/dsh-business-context/business'`. ID-only overrides keep working
unchanged.

## Diagnostics

When something does not work, click **OpenBKN** in the sidebar footer, then **诊断** at the top right of the panel and export the report. There is only one OpenBKN sidebar entry. The panel frame and diagnostics action remain available when the business component cannot import or its services are not ready. The diagnostics service runs as an independent plugin row; if its implementation cannot start, the panel explicitly reports that diagnostics is unavailable. The exported JSON contains only whitelisted facts — stages, classification codes, bounded evidence such as HTTP statuses and exit codes, and coverage notes. It never contains tokens, raw error text, URLs, or file contents. Send the exported file to support.

## License

[Apache License 2.0](LICENSE)
