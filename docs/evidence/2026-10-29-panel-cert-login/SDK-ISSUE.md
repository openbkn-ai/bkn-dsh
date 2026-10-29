# Draft: origin-scoped additional CA support for CLI device authorization

> Later local increment: the maintainer explicitly accepts automatic private-platform trust. The plugin now scopes a dispatcher inside the dedicated official CLI child; the SDK files and its original public contract remain unchanged. The intermediate imported-CA refusal below is historical, not the current plugin behavior. This issue remains a local, unsubmitted upstream API draft; no upstream repair is claimed.

Status: local draft only; not submitted. Repository/owner assignment must be confirmed for the CLI/SDK module. The workspace platform-module table does not assign a CLI/SDK owner.

## Problem and integration impact

An application embedding the official OpenBKN CLI cannot currently attach an additional CA strictly to one normalized platform origin through its public CLI interface. A child-process `NODE_EXTRA_CA_CERTS` setting extends trust across that process; it does not fence redirect targets. The plugin therefore blocks browser login whenever a panel-imported platform certificate is selected, with `TRUST_CLI_UNAVAILABLE`, rather than lending that certificate to an unrestricted CLI process.

This finding concerns official OpenBKN CLI 0.2.0. It is not a claim that a real platform redirected credentials, that TLS verification was bypassed, or that any account credential leaked.

## Reproduction and observed result

The retained script is [cli-origin-proof.mjs](cli-origin-proof.mjs). Run it with an explicit task Node, the pinned official CLI entry, and a new output filename:

```sh
node cli-origin-proof.mjs <task-node> <official-sdk-dist-cli.js> <new-result.json>
```

OpenSSL is needed to create a temporary synthetic certificate. The script starts two HTTPS loopback listeners with that certificate and different ports, which are different origins. It supplies the certificate only to the isolated CLI child and uses a new temporary `BKN_CONFIG_DIR`. Origin A responds to `/oauth2/device/auth` with HTTP 307 to origin B. B responds with a synthetic HTTP 400 before any browser URI or authorization step exists. Both listeners and the temporary files are closed/removed afterward.

Observed on macOS with official CLI 0.2.0:

- A received `POST /oauth2/device/auth`, 60 body bytes, no Authorization header.
- B received `POST /synthetic-device-target`, the same 60 body bytes, no Authorization header.
- B request count was one. The CLI exited 1 at the synthetic stop, without a browser/account authorization.
- Both fixture listeners were closed.

See [the bounded result](CLI-ORIGIN-PROOF.json). The process-level CA variable is used only in this diagnostic to establish the missing origin boundary; the plugin does not set it.

## Expected public contract

The maintainer has clarified the final user experience: a fresh installation or a client with stale/incorrect CA configuration must let the user click the plugin's CLI login button, complete the official browser username/password authorization, and return to a synchronized usable plugin. There must be no additional end-user certificate selection or confirmation, including on first use. The current manual-import UI and imported-CA login block are intermediate local behavior, not completion of that requirement.

Default trusted certificates must remain usable even when an obsolete supplemental CA is configured. For private-CA deployments, a noninteractive trusted provisioning source and an origin-scoped CLI transport contract are needed; the source for a completely unknown private CA is still unresolved. This request does not authorize silently trusting arbitrary certificates or disabling TLS validation. It does not assume that an administrator-provisioning design has already been selected.

Provide a supported way to supply additional trust for exactly the configured HTTPS origin (scheme, normalized host and effective port), while retaining certificate chain, validity and hostname verification. Auth requests should reject cross-origin redirects before dispatching a request body or credential. Same-origin redirects, cancellation and normal device authorization should retain their existing behavior. A stable refusal category would let embedding applications explain an unsupported trust configuration without exposing raw CLI output.

An implementation may use a scoped transport option or another origin-fenced API. The plugin does not require a new authentication protocol or a global trust setting, and has not patched the CLI/SDK. Do not resolve this by disabling TLS verification, modifying the user's system trust, or broadening a process-wide CA variable.

## Current disposition and acceptance boundary

The maintainer explicitly chose to keep imported-certificate CLI login blocked and continue MCP/HTTP/UI work. Existing normal-trust CLI flows remain unchanged. Local MCP and HTTP success does not certify this CLI path. This draft requires separate authorization before public submission; no issue, project stage or assignee was changed in this round.

Subsequent goal clarification makes the above block a temporary safety disposition, not an acceptable final experience. See [the final login acceptance target and remaining gaps](LOGIN-ACCEPTANCE.md). Read-only recheck on 2026-10-29: main `d6006640781fc87c40e50677ba11c529c7e79d25` and release/0.2.0 `3f53eba22f53b52d80aa98a58926c9815d83a473` still have byte-identical TLS, OAuth and public option sources to the npm0.2.0 source baseline; npm latest remains0.2.0. No fix for this exact contract was found in the inspected public issues/PRs. SDK168 (account configuration), SDK198 (stdio bridge) and DSH105 (MCP origin fence) do not resolve this CLI CA/login boundary. SDK206 is a separate version-compatibility gate.
