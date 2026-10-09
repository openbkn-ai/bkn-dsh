# npm form state (session 3, 2026-10-09 ~07:15) — PAUSED mid F3-401 round

- F2 PASS: UI save baseUrl=https://192.168.50.28 + cliPath C:\bkn-verify\diag6-tools\node_modules\.bin\openbkn.cmd
  into profile web; patch cdc61a08 -> 84500334; pre-existing ui-settings-general entry preserved; no bkn-config
  created (no fake login). Restart (26508 -> 6336) read back address + cliPath. (f2-npm-patch.txt)
- F3 missing CLI: cliPath -> C:\bkn-verify\first-use8-npm\no-such-cli\openbkn.cmd -> panel "DSH 找不到 OpenBKN CLI…
  cliPath 中填写它的绝对路径（Windows 上填写 openbkn.cmd）" ; restored real path via UI -> patch back 84500334.
- F3 first real auth: attempt #1 (06:48) failed — user confirmed a stale device page from the desktop login;
  diagnostics e5350016 login-state not-logged-in, cli failureCount=2 lastFailureCode=cli-execution-failed
  (OpenBKN-diagnostic-npm-f3-e5350016.json, copied from the in-progress .tmp download — delayed download, content
  verified to carry reportId e5350016). OBSERVATION: that login runner (pid 35252, child of Host 6336) was still
  alive 10+ min after the panel showed failure; only cleared by Host stop.
  Attempt #2 (06:56) PASS: token written to first-use8-npm\bkn-config (exp 07:57:13), panel "找到 2 个网络".
- F3-401 fixture round IN PROGRESS (state left deliberately):
  auth-fault dir C:\bkn-verify\first-use8-npm\auth-fault (shim + reject-token.flag), Host 35384 started with
  BKN_AUTH_FIXTURE_* env (s3-npm-f3-fault-host.txt); cliPath set to shim VIA UI (patch now != 84500334).
  Before 401 could be observed, platform 192.168.50.28 became unreachable (local Clash Verge TUN intercepts:
  Test-NetConnection SourceAddress 198.18.0.1, TLS handshake ECONNRESET for any request, ping 100% loss).
  Diagnostics 6a0d907c: platform-network-list network/tls-failed — ACCURATE for this environment failure
  (probe: fetch with/without token -> ECONNRESET before TLS established). NOT a product defect.
- TODO when .28 is back: observe 401 (auth-rejected) -> product re-login via shim (user authorizes) -> flag auto-cleared
  -> recovered=true -> restore real cliPath via UI -> patch == 84500334 (+ expected UI entries only).
2026-10-09T17:34:28+08:00 hosts 35384(npm) 16276(source) 33376(desktop) found gone (no reboot; LastBoot 2026-10-07). Not stopped by me.
2026-10-09T17:38:35+08:00 flag parked during login #1 (17:35-17:37), token exp 18:37:26; flag restored now

# === npm results, 2026-10-09 17:34-20:39 (resumed after .28 fixed; all UI via in-app browser pane) ===
## F3-401 fixture round — PASS (closed)
- Host 29340 with BKN_AUTH_FIXTURE_* env; cliPath = shim (set via UI earlier). Flag parked during login #1
  (17:35-17:37, product login through shim pass-through; token exp 18:37:26), flag restored 17:38.
- Reopen panel -> "Context Loader MCP 拒绝了当前凭据（HTTP 401）。请使用 OpenBKN CLI 重新登录并同步。"
  Diagnostics e82b2153: context-loader auth-rejected httpStatus=401 (OpenBKN-diagnostic-npm-f3-401-e82b2153.json
  SHA 29927d6d…). (exported file was a .tmp in-progress download; content carries reportId — copied.)
- Re-login attempts #2 (17:40) and #3 (19:13) FAILED by timeout: the product CLI login waits only 120 s; user finished
  later. OBSERVATION: after each failed login the dsh-subprocess-local runner (e.g. 21484) stayed alive with only a
  conhost child. Real token expired 18:37 in between (recorded; 401 had already been observed).
- Attempt #4 (19:26, user-timed): success; fixture removed reject-token.flag itself; token exp 20:27:20; panel 2 networks.
  Diagnostics b1a96ca5: ALL pass; context-loader recovered=true lastFailureCode=auth-rejected; cli recovered=true
  (OpenBKN-diagnostic-npm-f3-recovered-b1a96ca5.json SHA c9e569eb…).
- cliPath restored via UI -> patch 84500334… byte-identical to F2 healthy (f3-npm-patch-shas.txt).
## F7 use — PASS
- Workspace C:\bkn-verify\first-use8-npm\workspaces\supply-ontology via native picker (user clicked it; computer-use
  unavailable) -> session-266df4c3 bound to supply_ontology_hand (f6-npm-binding-hashes.txt).
- Turn (20:12-20:13, 1 m 15 s): 12 types with data x3 instances, 3 types no data source flagged, 19 relation types;
  provenance int_2e5c2642eda808be9da5858c53ca4d6e completed, 25 nodes, Op+Receipt per call
  (f7-npm-answer.jpg, f7-npm-provenance-int_2e5c2642.jpg).
- Restart (29340 -> 30488, no fixture env) -> same session reopened with binding chip; follow-up turn used tools
  (bkn_start_interaction continue, query_metric, query_object_instance); some tool errors (run_cypher unsupported,
  invalid_business_ref) handled by the model (f7-npm-after-restart-resume.jpg). Bindings unchanged across restart.
## F6 — PASS
- Busy (turn running 20:13:02): settings shows "业务回合仍在运行，请等回合结束后重新打开设置。", both inputs disabled=true;
  保存并继续 click -> patch/bindings unchanged.
- Idle -> https://first-use8-no-platform.invalid (20:35): pending-login; diagnostics b9d6323e platform-mismatch
  platformMismatch=true; bkn-config/platforms still only the .28 dir; bindings unchanged.
  (OpenBKN-diagnostic-npm-f6-invalid-b9d6323e.json SHA db261dc4…)
- Idle back -> https://192.168.50.28: patch 84500334 (byte-identical), bindings unchanged. Panel pending-login only
  because the token expired at 20:27 — post-switch reconnect with a live token NOT re-observed for npm (desktop did).
## F4 — PASS
- TLS: Host 35364 WITHOUT NODE_EXTRA_CA_CERTS -> generic panel failure; diagnostics 61756b9f context-loader tls-failed,
  others pass; address kept (patch 84500334). Restart with CA (11712) -> 2 networks + workspace association.
  (OpenBKN-diagnostic-npm-f4-tls-61756b9f.json SHA 7988f893…)
- Unreachable 192.0.2.1: pending-login + login fails fast; diagnostics 866aa61e login-state platform-mismatch
  platformMismatch=true + cli cli-execution-failed (failureCount=1). (OpenBKN-diagnostic-npm-f4-unreachable-866aa61e.json
  SHA f2eb7483…). 403 not-run (no real 403 condition).
## F5 — PASS (time-critical clicks dispatched as synthetic DOM .click() in the page, because the browser tool's
## per-action latency (~1 s+) exceeds the ~5 s failure window; recorded as a method deviation)
- a) 20:29:43.351 login click -> "正在连接 OpenBKN…" -> 20:29:43.655 Close; at 20:29:53 and 20:31:15 panel not in DOM.
- b) reopen 20:31:36 -> fresh pending-login for 192.0.2.1.
- c) 20:32:08.188 login -> 20:32:08.9 settings -> address set to https://192.168.50.28 -> save 20:32:09.013
  -> pending-login for .28; at +45 s unchanged; patch 84500334. Diagnostics fe1f0cc4 cli failureCount=0 (old login
  result not recorded into the new state), login-state not-logged-in (token expired 20:27, accurate).
  (OpenBKN-diagnostic-npm-f5c-fe1f0cc4.json SHA 01cc15b9…)
- A first F5a attempt with normal clicks missed the window (login already failed) — not counted.
