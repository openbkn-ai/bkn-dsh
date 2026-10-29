# Draft: origin-scoped additional CA support for CLI device authorization

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

Provide a supported way to supply additional trust for exactly the configured HTTPS origin (scheme, normalized host and effective port), while retaining certificate chain, validity and hostname verification. Auth requests should reject cross-origin redirects before dispatching a request body or credential. Same-origin redirects, cancellation and normal device authorization should retain their existing behavior. A stable refusal category would let embedding applications explain an unsupported trust configuration without exposing raw CLI output.

An implementation may use a scoped transport option or another origin-fenced API. The plugin does not require a new authentication protocol or a global trust setting, and has not patched the CLI/SDK. Do not resolve this by disabling TLS verification, modifying the user's system trust, or broadening a process-wide CA variable.

## Current disposition and acceptance boundary

The maintainer explicitly chose to keep imported-certificate CLI login blocked and continue MCP/HTTP/UI work. Existing normal-trust CLI flows remain unchanged. Local MCP and HTTP success does not certify this CLI path. This draft requires separate authorization before public submission; no issue, project stage or assignee was changed in this round.
