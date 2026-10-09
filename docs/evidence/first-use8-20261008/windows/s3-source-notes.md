# source form (DSH local build 0.2.0-rc.2-639ed01, node bin.js, port 18408) — session 3, 2026-10-09 15:20-15:30
- Host 27740 (session 1, F0) used for F1; stopped identity-checked (s3-stop-source-27740.txt; original pid file kept
  as f0-source-host.pid.orig-27740); relaunched as 16276 (s3-source-f2-restart-host.txt) with same env + CA.
- F1 PASS: empty submit / ht!tp://not a valid url with spaces / file:///C:/test / relative/path -> each shows
  "请输入完整的 HTTP(S) 平台地址，例如 https://openbkn.example.com。", input kept; patch SHA unchanged cdc61a08…
  before/after (f1-source-patch-sha.txt). (Independent fault-root persisted-invalid part was done on desktop in
  session 1; spec's source minimal chain does not require it.)
- F2 PASS: saved baseUrl https://192.168.50.28 + cliPath C:\bkn-verify\diag6-tools\node_modules\.bin\openbkn.cmd
  -> patch 84500334… (byte-identical to npm F2 result), ui-settings-general entry preserved, no fake login;
  restart -> panel reads back 平台地址 https://192.168.50.28 + login entry (f2-source-patch.txt).
- Model-key prompt "添加一个 API Key" dismissed with 稍后配置 each launch (no key configured in source root).
- PENDING (needs 192.168.50.28 reachable + user device login): F3 normal auth/list, restart readback with auth,
  "login in progress -> close panel -> not reopened", F8 native uninstall/reinstall.

## Close-panel-during-login (source, Host 31276) — 2026-10-09 19:34
- 19:34:37 clicked "使用 OpenBKN CLI 登录并同步" -> "正在连接 OpenBKN…"; 19:34:39 clicked panel Close.
- Panel NOT reopened (checked 19:34:39 and 19:36:40: no panel in DOM). => spec assertion "已关闭面板不被旧结果重开" PASS.
- FINDING: closing the panel actually ABORTED the CLI login: at 19:35:54 (77 s after start, < 120 s CLI default timeout)
  no `auth login` process existed and no bkn-config store was created. The user reported Chrome was closed while they
  were still authorizing; `Get-Process chrome` = 0 at 19:35:54. Prior to this attempt the user had closed all old
  platform tabs (Chrome had exited), so the CLI's browser-open launched a NEW Chrome inside the login subprocess.
  Mechanism (code read): @deepseek-ai/dsh-subprocess-local runs the CLI in a Windows Job Object (runner.js imports
  spawnCurrentTokenJobProcess/terminateJob; index.js selects "windows-job" on win32); cancel => terminateJob kills
  every process in the job, including a browser spawned by the CLI. Not proven by process capture (Chrome start/exit
  not logged) — mechanism + timing + user report.
  Impact: user loses the in-progress authorization and their browser window. Spec says close must not claim to cancel
  browser OAuth; here it does more than claim — it kills the browser in this scenario. For main dev to judge.

## F3 normal auth + list — PASS (2026-10-09 19:40, Host 31276)
- After the close-panel abort, user pre-opened Chrome (logged in to the platform) and replied 开始; product login ->
  user confirmed within 120 s -> source bkn-config store created (token exp 20:41:48) -> panel "找到 2 个网络".
## Restart readback with auth — PASS
- Host 31276 -> 19388 (20:18): panel "找到 2 个网络" without re-login.
## F8 native uninstall/reinstall (UI, in-app browser) — PASS (2026-10-09 20:55-20:59)
- 插件 -> @openbkn/dsh-business-context v0.2.0-rc.2-openbkn.0.2.0-8, 3 components 运行中 -> 卸载 -> confirm.
  After: package text + sidebar entry gone; tracked user files 6/6 SAME (patch 84500334, workspace.json, CLI store incl.
  token.json -> no logout); dependency + plugin dir removed (f8-source-ui-compare-remove.txt).
- 添加插件 (fixed tgz) -> 已安装 (压缩包) -> pre-enable 6/6 SAME -> 立即启用 -> 3 x 运行中 + sidebar back;
  verify-install 66/66 OK (f8-ui-reinstall, source); before -> after-enable 6/6 SAME.
- Profile manifest bytes eef36333 -> 7b889960: proven key-ORDER-only change ("dependencies" moved after "dsh"),
  identical content (f8-source-profile-package.before/after.json). This explains the same byte delta on desktop/npm.
- Restart (29380): panel reads back https://192.168.50.28 (pending login: token expired 20:41).
- CLI-path F8 not required for source minimal chain; not run.
