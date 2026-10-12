# bkn-dsh Recent Updates

[中文](2026-10-12-recent-updates.zh.md)

**Period: September 21–October 12, 2026**

**Current published plugin: -9** (`@openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-9`)

**Currently supported DSH version: 0.2.0-rc.2**, including the official desktop app, npm CLI, and source-built hosts.

This summary covers updates merged into main over the past three weeks, across multiple plugin releases.

These updates improve the flow from installation, configuration, and sign-in to business questions, provenance, and troubleshooting. Users can complete the main setup steps inside DSH, work with authorized business knowledge networks, and inspect the execution process and business sources behind answers.

## 1. Installation and First Use

- **Install directly into official DSH.** Installing the plugin is sufficient; no separate OpenBKN Runtime download or host runtime patch is required. Standalone Runtime archives are no longer updated.
- **Configure inside the panel.** Enter the platform URL in the OpenBKN panel and apply it with “保存并继续” (Save and continue). Advanced settings accept a CLI path without manually editing YAML.
- **Enable before configuration.** Fresh installations enter a pending-configuration state. Settings and diagnostics remain accessible before a platform URL is provided.
- **Detect and install the CLI.** Check for an existing CLI and display its version and executable path. If none is found, use “检测并安装 CLI” (Detect and install CLI) to see installation and verification progress or failure details. Existing usable versions are retained.
- **Get specific configuration guidance.** Invalid platform URLs, directories mistakenly entered as executables, and missing CLI installations receive separate guidance. Invalid submissions do not overwrite existing settings.

## 2. Sign-in and Connection Recovery

- **Improve first-time sign-in.** Fix cases where never-signed-in users or credentials with an unknown expiry were incorrectly shown a connection-verification error.
- **Sign in again from the panel.** After credentials are refused, use “使用 OpenBKN CLI 登录并同步” (Sign in and sync with OpenBKN CLI), authorize in the browser, and return to DSH without pasting a token.
- **Distinguish failure causes.** Expired authentication, insufficient permissions, certificate issues, network failures, and unknown connection errors receive appropriate guidance instead of being attributed to the account or platform URL indiscriminately.
- **Handle configuration changes more reliably.** Diagnostic observations follow platform URL changes, while existing sessions retain their original platform and network bindings. Stale requests cannot reopen the panel or overwrite newer state after it is closed, reopened, or reloaded.

## 3. Knowledge Networks and Business Sessions

- **Restore bindings in the official desktop app.** Network bindings are saved independently and atomically. Reopening a session restores its binding and business-conversation continuity, with support for historical session records.
- **Resolve concurrent binding requests consistently.** Conflicting networks produce an explicit conflict; repeated binding to the same network remains consistent, and failed attempts can be retried.
- **Strengthen scope checks.** Direct platform tool calls reject missing, incorrectly typed, or cross-network knowledge-network arguments. Unbound sessions cannot directly use OpenBKN business tools.
- **Avoid unnecessary execution records.** Greetings, clarifications, and questions that need no platform access do not create additional business Interactions. Platform-accessing turns enter the managed execution lifecycle.
- **Improve capability discovery and calling guidance.** Instructions reflect the tools and capabilities actually available, with explicit reasons for unsupported calls.
- **Preserve native DSH answers.** Answers use native model output. The plugin retains business context, access governance, and provenance without adding automatic correction turns or forcing fixed BOM and inventory answer formats.
- **Clarify Standard mode requirements.** The panel identifies Standard mode as the required mode for business sessions and provides guidance when PTC mode is used instead.

## 4. Business Provenance and Evidence

- **Introduce layered provenance.** Inspect the local execution timeline, platform operations, business context graph, and evidence chain for each answer. The timeline shows call order, durations, and status, with consecutive calls to the same tool grouped for display.
- **Handle failures independently in each view.** Local timelines remain available when platform records cannot be read. Views distinguish denied access, undisclosed records, oversized records, and temporary unavailability.
- **Read larger operation records.** Raise the raw-response limit to 64 MB so longer business turns can display their operation records, with an explicit message when the limit is exceeded.
- **Correct source-network attribution.** Identify each business element’s source from platform-disclosed references, rather than assigning mixed-network data to a single source.
- **Provide evidence lookup guidance.** Show platform receipts with copyable CLI query commands for further inspection of individual operations.

## 5. Diagnostics and Troubleshooting

- **Add a unified diagnostics entry.** Open diagnostics from the top-right corner of the OpenBKN panel to inspect component loading, configuration, CLI, sign-in, and platform-request status.
- **Keep diagnostics available during business-component failures.** Independent diagnostics can still provide information when business configuration, imports, or initialization fail. Damage to shared package files still requires reinstalling the package.
- **Classify failures more precisely.** Distinguish configuration, CLI, authentication, permissions, TLS, network, and response-parsing problems. Report insufficient evidence when the cause cannot be determined.
- **Export diagnostic reports.** Export permitted checks as JSON for administrator troubleshooting, retaining necessary status while excluding credentials and other sensitive content.
- **Improve observation accuracy.** Track each endpoint’s successes and failures separately and retain prior failure information after recovery. “重新采集” (Collect again) refreshes observed state; it does not actively perform a complete reconnection test.

## 6. Cross-platform Support, Documentation, and Delivery

- **Improve Windows CLI resolution.** Recognize entry points such as `openbkn.cmd` using Windows executable-resolution rules, fixing failures to locate the CLI under default settings.
- **Clarify workspace selection.** Direct users to the system folder chooser when it opens. Cancellation returns normally, and actual failures retain their specific causes.
- **Add illustrated Chinese and English user guides.** Supply-chain examples and annotated screenshots cover installation, configuration, sign-in, network selection, business questions, provenance, and diagnostics. Offline HTML and a Chinese PDF are available.
- **Improve release verification.** npm publishing includes provenance attestations and creates a corresponding GitHub Release. Package-export checks, cross-platform verification, and artifact reconciliation are strengthened.

## Usage and Upgrade Notes

- Install or update `@openbkn/dsh-business-context@latest` from the DSH plugin page, complete configuration and sign-in, and use Standard mode for business sessions.
- Uninstalling the plugin retains user configuration, credentials, workspaces, and session data. An independently installed CLI is also retained.
- If business calls remain refused after a successful sign-in, restart DSH and retry the existing session. The root cause of this intermittent issue remains unresolved.
- If Windows uninstall reports `EPERM` for `pnpm-lock.yaml`, retry removal and verify that the plugin package is gone.
- Longer queries, including deep BOM and inventory analysis, may still time out. This update does not claim to resolve every complex business question. Calls made internally by platform scripts or skills also bypass the plugin’s direct-tool scope checks.

## Links

- [Current plugin release](https://github.com/openbkn-ai/bkn-dsh/releases/tag/v0.2.0-rc.2-openbkn.0.2.0-9)
- [Chinese illustrated guide](../user-guide/README.zh.md)
- [English user guide](../user-guide/README.en.md)
- [Full changelog](../../CHANGELOG.md)
