# Windows verification helper scripts (DIAG-01)

These scripts prepare and drive the isolated test root for the W0–W12
verification matrix. They are test-tooling only and are **not** part of the
npm package. They never touch the user's real `$DSH_HOME`, credentials, or
running dsh processes; every mutation stays under `-TestRoot`.

The two forms are kept strictly apart: `desktop` installs into the
**desktop** profile and starts the real DeepSeek Harness application
(inheriting the isolated `DSH_HOME`), while `npm` installs into the **web**
profile and starts `dsh web`. Choosing the desktop CLI binary alone is not
desktop-form evidence — the application itself must be the host under test.

> Native Windows 10 / PowerShell 5.1 verification on 2026-10-06 produced
> the fixes now included here. See the `54f6669` evidence under
> `docs/handoff/2026-10-06-diagnostics-windows/windows-results/`.
> Fresh desktop profiles must first be initialized by the official app
> under the isolated DSH_HOME; prepare then accepts a root containing only
> that dsh-home. Config patches use BOM-less UTF-8. Re-parse and smoke any
> changed kit on Windows; prior -6 execution does not accept a new -7 pack.

## Order

```powershell
# 1. Prepare (once per form)
.\prepare.ps1 -TestRoot C:\openbkn-wv -Form desktop -CandidateTgz <path-to-candidate.tgz>
.\prepare.ps1 -TestRoot C:\openbkn-wv-npm -Form npm -CandidateTgz <path-to-candidate.tgz> -NpmDshCli <official-npm-dsh.cmd-path>

# 2. Record the pre-case state hashes
.\collect-state-hashes.ps1 -TestRoot C:\openbkn-wv > before.json

# 3. Run a case (W1 baseline, W2 config, W3 import, W4 init, W10 diagnostics fault)
.\run-case.ps1 -TestRoot C:\openbkn-wv -CaseId W1 -Form desktop -CandidateTgz <path> [-PlatformBaseUrl https://... -CliPath C:\path\to\openbkn.cmd]

# 4. In the selected real Host, open OpenBKN, then the top-right diagnostic
#    button (the sidebar has only one OpenBKN entry). Export the JSON,
#    and fill the results template. Then clean up:
.\cleanup.ps1 -TestRoot C:\openbkn-wv -CandidateTgz <path-to-candidate.tgz>

# 5. Record the post-case hashes and diff.
.\collect-state-hashes.ps1 -TestRoot C:\openbkn-wv > after.json
```

## Scope and safety

- `prepare.ps1` refuses to continue when the desktop/npm CLI cannot be found
  or is not version 0.2.0-rc.2; it rejects a reused test root except the
  explicitly pre-initialized dsh-home-only case. Each form
  sets both DSH_HOME and BKN_CONFIG_DIR under its own root.
- The npm form uses a .cmd shim (not a PATH .ps1 wrapper) and can select an
  isolated official CLI explicitly with -NpmDshCli. Verify its Host source
  separately; a desktop shim shadowing PATH is not npm-form evidence.
- `run-case.ps1` W3/W4/W10 build a **controlled variant copy** of the
  candidate (recorded base/variant SHA-256 plus before/after file hashes). The
  pristine candidate itself is never edited; `cleanup.ps1` reinstalls it.
- `run-case.ps1` records the launcher's PID and creation time, plus the npm
  listener's child PID, port and creation time. Cleanup checks the Host
  path/form, creation time, exact port and current listener ownership before
  stopping it. A refused identity is logged as skip and needs investigation;
  a stale PID file does not authorize stopping a different process.
- `collect-state-hashes.ps1` prints hashes of the profile's package.json,
  patch layer, and lockfile — never file contents.
- Startup logs stay under the private/ directory because they may contain a
  localhost access token. Do not share them or append them to case evidence.

## Cases not constructible by script

W5–W9 and W11 need real accounts, credentials, or platform behaviour (first
login in a fresh store, genuine 401/403, TLS failures against isolated
endpoints, MCP handshake failures, the real business regression). Follow the
short manual steps in the Windows verification task document; mark anything
you could not construct as untested rather than substituting a stub.
