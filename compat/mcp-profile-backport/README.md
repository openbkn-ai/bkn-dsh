# Profile MCP companion for the 0.2.1 plugin release

The two archives in `ARTIFACTS.json` are the unchanged, previously verified
12-file MCP backports. Choose the archive matching the exact official Host:

| Host | Companion |
|---|---|
| DSH 0.2.0-rc.2 | `openbkn-mcp-old-same-origin-r1.tgz` |
| DSH 0.2.1-rc.3 | `openbkn-mcp-rc3-same-origin-r1.tgz` |

This is a profile dependency companion, not a replacement Desktop, installer,
Host upgrade or SDK-wide security fix. The plugin package alone does not install
this companion. Keep the original official application and its signature.

1. Stop the target task Host normally. Identify its actual active profile; do
   not infer it from a different Desktop or npm installation.
2. Back up the profile's `node_modules/@deepseek-ai/dsh-mcp-client` directory if
   present, and record absence if it does not exist. Preserve configuration,
   credentials, sessions, workspaces and all other dependencies.
3. Verify the chosen archive against `ARTIFACTS.json`. Extract its `package/`
   contents into that profile directory, preserving the complete 12-file set,
   including the license and notice. Do not overwrite installation-root modules.
4. Install the release plugin using the official Host's existing package flow.
   Before acceptance, compare the profile MCP files with the matching manifest
   and verify that the **business manager's mounted instance** selects the
   profile entry with SHA256
   `b3cd7156c0b8639656ce117530fec4d006b74cafdc9a78ac426fec084e62972c`.
   A disk file or a separately imported factory is not proof of business loading.
5. To roll back, stop the task Host and restore only the backed-up MCP directory;
   when it was originally absent, remove only the new task-owned directory after
   checking its identity. Do not restore an entire old home over new sessions.

Windows official GUI startup may update the `dsh` URL association. Reuse the
existing Before/After/scoped-Restore procedure and back up affected association
settings before GUI startup; do not modify UserChoice or ACLs. Existing isolated
procedures and receipts are linked from `docs/plans/0.2.1/REMAINING-WORK.md`.

Coverage is for the two fixed Hosts under normal startup. Package-manager
reinstallation, dependency cleanup and future Host upgrades may replace this
profile dependency and are not covered. OAuth providers and other Host consumers
are outside the verified fixed-Bearer bridge. No CA, IAM, updater or GUI packaging
system is added here.
