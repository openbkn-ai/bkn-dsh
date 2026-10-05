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

> Note: the scripts were authored and hand-checked off-Windows; they have
> not been executed in a native PowerShell yet. If a syntax or environment
> assumption fails, fix it in the kit and record the adjustment — do not
> silently skip the case it was driving.

## Order

```powershell
# 1. Prepare (once per form)
.\prepare.ps1 -TestRoot C:\openbkn-wv -Form desktop -CandidateTgz <path-to-candidate.tgz>
.\prepare.ps1 -TestRoot C:\openbkn-wv-npm -Form npm -CandidateTgz <path-to-candidate.tgz>

# 2. Record the pre-case state hashes
.\collect-state-hashes.ps1 -TestRoot C:\openbkn-wv > before.json

# 3. Run a case (W1 baseline, W2 config, W3 import, W4 init, W10 diagnostics fault)
.\run-case.ps1 -TestRoot C:\openbkn-wv -CaseId W1 -Form desktop -CandidateTgz <path> [-PlatformBaseUrl https://... -CliPath C:\path\to\openbkn.cmd]

# 4. Exercise the UI in the browser it printed, export the diagnostics JSON,
#    and fill the results template. Then clean up:
.\cleanup.ps1 -TestRoot C:\openbkn-wv -CandidateTgz <path-to-candidate.tgz>

# 5. Record the post-case hashes and diff.
.\collect-state-hashes.ps1 -TestRoot C:\openbkn-wv > after.json
```

## Scope and safety

- `prepare.ps1` refuses to continue when the desktop/npm CLI cannot be found
  or its version cannot be established.
- `run-case.ps1` W3/W4/W10 build a **controlled variant copy** of the
  candidate (recorded base/variant SHA-256 plus the modified file hash). The
  pristine candidate itself is never edited; `cleanup.ps1` reinstalls it.
- `run-case.ps1` starts `dsh web` detached and records only **its own** pid
  files; `cleanup.ps1` stops only those pids. No user dsh is terminated.
- `collect-state-hashes.ps1` prints hashes of the profile's package.json,
  patch layer, and lockfile — never file contents.

## Cases not constructible by script

W5–W9 and W11 need real accounts, credentials, or platform behaviour (first
login in a fresh store, genuine 401/403, TLS failures against isolated
endpoints, MCP handshake failures, the real business regression). Follow the
short manual steps in the Windows verification task document; mark anything
you could not construct as untested rather than substituting a stub.
