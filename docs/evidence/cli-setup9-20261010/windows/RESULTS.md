# CLI setup -9 Windows results

Windows 10 Pro 10.0.19045, operator run 2026-10-10 (UTC). Handoff executed: `docs/handoff/2026-10-10-cli-setup9/HANDOFF.md` @ `614b086e8c2147ad6890cad1fc7603029e44a31a`.

An earlier partial run against the superseded candidate (`e669bd6` / CI `38023447204`, handoff `bc6ee26`) was stopped when this handoff arrived; its npm-form results are **historical only** and are not used for any verdict below (local archive `C:\bkn-verify\cli9-hist-e669bd6`, not pushed).

## Identity and environment

- Handoff / source commit: handoff `614b086e8c2147ad6890cad1fc7603029e44a31a`; source `cf591d7cbd4af202d0bd893aab57202a72ec1644` (branch `feat/cli-setup-9`, PR openbkn-ai/bkn-dsh#86 head = 614b086).
- CI / version / tgz SHA-256 / bytes: build-only CI `38028568470` (publish=false), artifact `plugin-tarball` downloaded with `gh run download`; `openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-9.tgz`, 183195 bytes, `de8d216049b160f92c46d22ab1db37b4225b4424923e7efc3db404b116327630` (= candidate-manifest.json).
- Actual Host executable, version, form; native PowerShell version:
  - Desktop: `C:\Users\kalia\AppData\Local\Programs\DeepSeek Harness\DeepSeek Harness.exe`, FileVersion `0.2.0-rc.2`, launched with `--user-data-dir=<root>\electron-user-data`.
  - npm: `node.exe ...\@deepseek-ai\dsh\lib\bin.js web --port 18607 --no-open` (`dsh --version` = `0.2.0-rc.2`), node `C:\Users\kalia\scoop\apps\nodejs-lts\current\node.exe`.
  - Windows PowerShell `5.1.19041.5848`.
- Node/npm versions; effective registry: node `v24.21.0`, npm `11.19.0`, registry `https://registry.npmjs.org/` (no credentials) — `evidence/npm-preflight.txt`, `evidence/desktop-preflight.txt`. The Desktop plugin-manager dialog showed `安装源 中国大陆镜像源` for the plugin's own dependencies (Desktop setting, not the SDK install).
- Isolation roots / prefix with spaces / PATH and APPDATA fixture:
  - npm root `C:\bkn-verify\cli9\npm`, Desktop root `C:\bkn-verify\cli9\desktop`; each with `DSH_HOME=<root>\dsh-home`, empty `BKN_CONFIG_DIR=<root>\bkn-config`, `npm_config_prefix=<root>\CLI Prefix` (space), `npm_config_cache=<root>\npm-cache`, **environment fixture** `APPDATA=<root>\AppData` (daily `%APPDATA%\npm` exists), `PNPM_HOME` removed. Set only in the launched process (`scripts/env-npm.ps1`).
  - PATH modes: `missing` = Windows dirs + scoop `nodejs-lts\current` (no openbkn); `prefix-on-path` = + `<root>\CLI Prefix`; `fixture` = `C:\bkn-verify\cli9\fixtures\bin` first; `no-npm` = Windows dirs only (Host itself started by absolute node.exe / Desktop exe).
  - Independent `node --version` / `npm --version` / `npm prefix --global` / registry / `where` outputs with exit codes: `evidence/npm-preflight.txt`, `evidence/desktop-preflight.txt` (prefix empty before install).
- Candidate and installed-file verifier commands, raw output, independent exit codes: see Defects D1/D2 and `verifier/`. Final: candidate 69/69 exit 0 (`verifier/verify-native.txt`, `verify-native-exit.txt`); installed npm `evidence/npm-installed-verify.txt` 69/69 missing/different/extra empty; installed Desktop `evidence/desktop-installed-verify.txt` 69/69 empty (both exit 0).
- Daily state before/after scope and hashes: `evidence/daily-before.json` / `daily-after.json` — 1157 paths (first-use8 list + daily scoop `openbkn*` + every daily bkn-sdk file), user/machine PATH digests, HKCU env-var name digest, `%APPDATA%\npm` listing, daily SDK 0.1.5. **Records identical; all digests equal.** Also identical to the historical round's before snapshot (no drift across both rounds).

## Acceptance

Input for C94/C99 (and C93): npm form = one `type` event per character in the built-in browser (CDP insertText, separate actions ~20 ms apart); Desktop form = OS-level key presses via computer-use, one `key` per character (`shift+semicolon`, `backslash`, `space`…). Focus/disabled/save state recorded by a synthetic 20 ms DOM observer (npm: page JS; Desktop: injected through Desktop DevTools console) — machine logs `evidence/observer-*.json`. Desktop C95–C98 texts are transcribed from screenshot zooms (marked as transcription).

| Case | Desktop | npm | Evidence / exact assertion / limitation |
|---|---|---|---|
| C90 Identity / UI | pass | pass | 69/69 installed; one sidebar `OpenBKN`; panel 设置/诊断/×; advanced shows detection status. Desktop plugin detail lists 3 components bootstrap/business/diagnostics 运行中. `desktop-c90-c94-c99.txt`, `npm-plugin-install.txt`. |
| C91 Missing, read-only | pass | pass | `未在当前环境和常见安装位置检测到 CLI。点击下方按钮可安装 0.1.5。` prefix 0 files, no install process, button not clicked. `c91-npm.txt`, `desktop-c90-c94-c99.txt`. |
| C92 Real installation / save | pass | pass | Click with draft `openbkn.cmd`: 检测中→安装中→`CLI 0.1.5 可用。路径已填入，请点击“保存并继续”应用。`; draft auto-filled `<root>\CLI Prefix\openbkn.cmd`; independent `openbkn.cmd --version` → `0.1.5` exit 0; tree sha 5204d50c…, 1120 files; patch has no cliPath until Save; after Save cliPath persisted (npm patch 57ef4a6b…, Desktop 230af85c…). First save required baseUrl (entered `https://192.168.50.28`, URL only). No fake progress. `c92-c99-npm.txt`. |
| C93 Outside PATH / reuse | pass | pass | a) prefix not on PATH: per-char `openbkn` → auto-fill prefix path, 可用, no install (newest mtime unchanged). b) restarted Host with prefix on PATH: resolves `...\CLI Prefix\openbkn.CMD` (uppercase ext), no install. Not saved (not required). `c93a-c94-npm.txt`, `c93b-c98-npm.txt`, `desktop-c93b-c98.txt`. |
| C94 Per-character typing / custom / space path | pass | pass | Non-existent `...\no such dir\openbkn.cmd`: after first two chars value `C:` with focus; full value exact with focus; auto read-only detection never disabled/defocused the field (npm 21 and 24 state changes, focusLoss 0, disabled 0; Desktop log identical pattern). Message `未找到此路径。请修正路径，或改回 openbkn 后检测并安装。`; click → no install, dir not created, prefix unchanged. Per-char restore of real space path → 可用, old message gone. |
| C95 Prerequisites | pass | pass | Node fixture (only `--version` intercepted) v23.11.0 and v22.18.0: `当前 DSH 无法使用受支持的 Node.js（22 系列需 22.19 或以上，或使用 24 及更新版本）。请检查 Node.js，或重启 DSH 后重新检测。` before and after click; calls.log shows only `prefix --global` + `--version`, no install. No npm on Host PATH: `当前 DSH 找不到 npm，无法自动安装。请先安装 Node.js/npm；已安装时可重启 DSH 后重新检测。` no child process, prefix empty. No Node install / PATH change / elevation. |
| C96 Controlled failures | pass | pass | Fixture `npm.cmd` (only `install` intercepted, product call proven in calls.log with exact argv incl. `--prefix "...FX Prefix" --ignore-scripts --no-audit --no-fund --loglevel=error`): EACCES → `npm 安装目录没有写入权限。…`; ECONNRESET → `CLI 安装遇到网络错误。…`; cert → `CLI 安装遇到证书错误。…`; exit0 no bin → `安装命令已完成，但当前 DSH 尚无法使用 CLI。…`. No ready state. Canary absent from UI text (npm DOM check) and from diagnostics exports (npm ba61d2f2, Desktop 69099527: CANARY 0, raw codes 0). Controlled faults, not real OS/network failures. |
| C97 Explicit setup lock / close / reopen / duplicate | pass | pass | 60 s fixture delay before real npm, fresh prefix, saved cliPath=openbkn. Double-click → exactly **1** `install` per Host. Explicit pre-install detection and installing both lock path box + save (npm observer dis=true/save=dis; Desktop greyed); typed `x` not inserted. Panel closed; fixture/npm child alive under Host. Reopened settings: `正在安装 CLI 0.1.5 并验证是否可用…可以关闭面板，安装将在当前 DSH 中继续。 安装中…` (captured both forms). npm observer: zero state changes 07:13:28–07:14:07 (polling never unlocked; the old-candidate 20 ms 检测中 flicker is gone); Desktop zooms at +10/+20/+30 s stayed locked. Final auto-fill + 可用; independent `--version` 0.1.5 exit 0. |
| C98 Boundaries / uninstall | pass (one subcase not constructed) | pass (one subcase not constructed) | Save via DSH ConfigEditor patch; close-without-save + reopen shows saved path (unsaved draft discarded). Diagnostics UI export (npm 7d60b5ca, Desktop d18c2ec8): observed:cli pass + login-state not-logged-in (executable ≠ logged in). No authorization or model request initiated (npm page network list: only 127.0.0.1 Host APIs). Uninstall: npm `dsh plugin --profile web remove` (pnpm passthrough), Desktop plugin manager 卸载 + confirm; plugin gone, SDK in every prefix intact (tree sha unchanged, `openbkn.cmd --version` 0.1.5), OpenBKN config entry remains in patch. **Not constructed:** "detection does not clear a pre-existing auth/CLI failure" — no existing failure input; no fake credentials used (unit-test coverage per handoff). |
| C99 Default openbkn.cmd alias / reuse | pass | pass | Missing: per-char `openbkn` → `openbkn.cmd` gives missing + `检测并安装 CLI` (canInstall). Explicit install with alias succeeded (C92). After install, per-char `openbkn.cmd` reuses the same prefix, no extra install. Non-existent absolute `.cmd` stays not-installable (C94). |

Separate unit fixtures, controlled Host failures, real npm registry installation, UI, filesystem, API, and independent native CLI execution. No platform/model acceptance is claimed.

## Defects and execution deviations

### Candidate observations (no blocking defect found)

- O1 (both forms, low): while typing, intermediate values that are **existing directories** (`C:\`, `C:\bkn-verify`, `...\cli9\`, `...\CLI Prefix`) show `已找到 CLI，但当前 DSH 无法执行。请检查 Node.js 和路径；若刚安装，可重启 DSH 后重新检测。` — a directory is reported as a found CLI. Expected: treat a directory as not-a-CLI / path error. Logs: `observer-npm-r1.json` 07:01:23Z, `observer-desktop-r1.json` 07:33:46Z.
- O2 (both forms, copy): when the CLI is missing the main panel still says `请先安装与平台版本一致的 CLI（npm install -g @openbkn/bkn-sdk@<平台版本>）…` and does not mention the new `检测并安装 CLI`; it also shows this generic text while an install is in progress (C97 reopen of main panel).
- O3 (both forms, copy): `CLI 0.1.5 可用。路径已填入，请点击“保存并继续”应用。` is shown for a path that is already saved.
- O4 (both forms): explicit click on a **custom** non-existent path runs a ~16 ms detection without locking the field/save (default-command explicit path does lock). No install possible there, so not a defect.
- O5: PATH resolution fills `openbkn.CMD` (uppercase extension from PATHEXT); works.
- O6: controlled install failures are not reflected in the diagnostics report (observed:cli keeps the previous outcome).
- O7 (Desktop Host, outside plugin scope): with fresh `DSH_HOME`, `APPDATA` and `--user-data-dir`, Desktop wrote a `DEEPSEEK_API_KEY` ref into the isolated `dsh-home\.credentials.yaml` at 07:23:50Z when the settings page opened. Value hash equals the first-use8 test roots (not the daily profile). Isolation does not cover this store. No model request made; the credentials file is not archived. The operator printed the first 12 characters of that test key to the local session log while investigating; key revocation recommended.

### Script / helper defects (handoff verifier, unchanged since bc6ee26)

- D1 `verify-candidate.ps1` hashes the **checked-out** `candidate-files.json`; with `core.autocrlf=true` the checkout is CRLF and fails `File manifest SHA mismatch` (`verifier/verify-native.attempt1-checkout-crlf.txt`, exit 1). Git blob / LF export sha `f97a4310…` equals `filesManifestSha256`; checkout sha `4187788d…`. Workaround: run from `git -c core.autocrlf=false archive` export (no content change).
- D2 PowerShell 5.1: `@(Get-Content … | ConvertFrom-Json)` wraps the array as one element → `File count mismatch` (`attempt2-ps51-count.txt`, exit 1). Minimal fix `verifier/verify-candidate.ps51fix.diff` (extra parentheses only); fixed copy produced the final 69/69. Candidate, identity and manifest untouched.

### Execution deviations

- E1 Plugin install step (both forms) needs `pnpm`, which lives in scoop `nodejs-lts\current\bin` next to the daily `openbkn`. Install and uninstall ran in dedicated rounds with that dir appended (`WithPnpm`); OpenBKN panel was not opened in those rounds. All detection rounds used PATH without it.
- E2 Verifier run with Windows PATH (system `tar.exe`); a Git-Bash-inherited PATH puts GNU tar first (historical round).
- E3 My own helper bugs before first use (fixed, originals not product-related): PS 5.1 positional `Set-Content -NoNewline` wrote stray files and left fixture modes at `real`, so the first validation run really installed `left-pad` into `npm\Validate Prefix` (deleted; npm cache contains it); cmd `echo …exit=0>>file` treated `0>>` as a stream redirect. Final validation `evidence/fixture-validation.txt` proves fixtures resolve first, pass through non-targets (npm 11.19.0 / node v24.21.0), intercept only `install` / `--version`, and that direct `npm-cli.js` bypasses them.
- E4 Operator input misses (not product): npm 07:02:13Z a click after a layout shift missed the field (ctrl+a selected page, keys went nowhere; redone 07:02:52Z); Desktop 07:28:19Z WeType IME in Chinese mode turned `.` into `。` (corrected with Shift → English mode, re-typed); Desktop 07:32:3xZ one per-key batch missed the field (redone). The IME was left in English mode.
- E5 Desktop Host 1352 (fixture round) exited by itself during an operator usage-limit pause (~07:43Z–10:31Z), not via the stop helper (`desktop-c95-c96.txt`). C97 had not started; a new identical fixture Host 12836 ran C97.
- E6 Desktop UI texts in C95–C98 are screenshot transcriptions; npm texts are DOM machine records.

### Not run

- C98 "auth/CLI failure not cleared by detection": not constructed (see table).
- Real (non-fixture) OS permission / network / TLS failures: not run (controlled fixtures only, by design).

## Evidence inventory and cleanup

- Files: `evidence/` (per-case txt, Host identity JSON, stop logs, preflights, fixture validation, diagnostics UI exports, observer logs, daily snapshots), `scripts/` (helpers used), `fixtures/` (`npm.cmd`, `node.cmd`, full `calls.log`), `verifier/` (all native verifier outputs incl. failures, exit codes, fix diff, wrapper). `evidence/reports.txt` lists each download original name, bytes and SHA-256. Source labels: `OpenBKN-diagnostic-*.json` = diagnostics UI export (npm via browser download, Desktop via save dialog); `observer-*.json` = synthetic DOM observer (not product output); `*.txt` case files = operator records quoting UI text (machine log or transcription as stated); `fixtures/calls.log`, `npm-plugin-*.txt`, `*-installed-verify.txt`, `verifier/*` = native stdout.
- Git blob comparison (614b086): candidate-manifest.json, candidate-files.json, verify-candidate.ps1, HANDOFF.md — blob SHA-256 equals LF export byte-for-byte; CRLF checkout differs (newline only). Downloaded tgz byte-identical to manifest.
- Owned Hosts (pid / createdUtc / exe / listener), all stopped by the 4-item helper with `remainingTreeProcs=0 recordedPortsStillListening=0` except 1352 (self-exited, recorded): npm 1248, 11072, 8556, 13524 (`127.0.0.1:18607`); Desktop 2668, 5836, 4848, 1352, 12836, 14852, 10712 (`127.0.0.1:19387`, owner = renderer child). Final scan: no DeepSeek Harness / own dsh node process, ports 18607/19387 free. Not claiming whole-machine zero processes.
- Daily state: before/after identical (above). Daily npm/SDK/global PATH not modified. Isolated prefixes retained as evidence (SDK not removed by plugin uninstall, expected).
- Private artifacts kept local only: launch logs with launch tokens (`<root>\npm\private\*.log`), `dsh-home` trees incl. `.credentials.yaml`, Electron user-data, historical round `C:\bkn-verify\cli9-hist-e669bd6`.
- Credential scan, branch and commit: see commit message / report back.
