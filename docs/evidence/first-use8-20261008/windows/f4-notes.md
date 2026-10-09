# F4 (failure preservation) desktop — execution notes 2026-10-08

## TLS round (no CA)
- Host pid 30856 (f4-tls-host.pid) launched WITHOUT NODE_EXTRA_CA_CERTS
  (same DSH_HOME/BKN_CONFIG_DIR; patch baseUrl=https://192.168.50.28, real cliPath).
- Panel: generic "暂时无法验证 OpenBKN 连接，当前原因尚未确定" + 重试; settings/diagnostics available.
- Diagnostics (report 6525760d, 22:34:35): observed:context-loader FAIL
  code=tls-failed failureCount=1; other 6 checks pass (login-state loggedIn=true, cli exitCode=0).
  => TLS classification accurate; NOT misreported as 401/generic.
- Settings kept saved address (https://192.168.50.28) — not cleared.
- Report exported: OpenBKN-diagnostic-20261008T143435407Z-6525760d.json
  (an earlier export attempt auto-committed on dialog defocus; file identical report id).
- Recovery: host 30856 tree stopped (f4-stop-log.txt); relaunch WITH CA (pid 1544,
  f4-recovery-host.pid) => panel "找到 2 个网络"; diagnostics report 7e3c2781: 7/7 pass,
  context-loader failureCount=0 toolsPublished=true (current failure updated; tls-failed
  history preserved in the fault-period report 6525760d).

## Unreachable round (same host 1544)
- UI saved baseUrl=https://192.0.2.1 (TEST-NET-1, guaranteed unroutable). Save toast shown;
  patch updated accordingly. Panel entered "new platform awaiting login" state
  ("设置已保存，请使用 OpenBKN CLI 登录并同步") — old platform token NOT reused.
- Diagnostics before login (report 756792a8): observed:login-state FAIL
  code=platform-mismatch platformMismatch=true — CLI platform fencing active.
- Clicked "使用 OpenBKN CLI 登录并同步": CLI login to 192.0.2.1 failed;
  panel moved to generic failure + 重试.
- Diagnostics after login attempt (report 2758a428, 22:42:48):
  observed:cli FAIL code=cli-execution-failed exitCode=1;
  observed:login-state FAIL platform-mismatch (failureCount=2); entries pass.
  => network failure classified at CLI layer with exit code evidence, not TLS/401.
- Report exported: OpenBKN-diagnostic-20261008T144248160Z-2758a428.json
- Restored baseUrl=https://192.168.50.28 via UI => panel recovered to 2 networks
  (f4-unreachable-restored-panel-axtree.txt); patch baseUrl back to original.

## 403
- No real 403 condition available (no test account/authorization state that yields 403
  on this platform; per handoff no platform accounts created/modified). RECORDED not-run.

## Also completed in this session (recorded here, evidence separate)
- F1 second half: with valid address saved, submitting `ht!tp://not a valid url with spaces`
  => in-place hint "请输入完整的 HTTP(S) 平台地址…" + input preserved + patch SHA unchanged
  (c7626921…, see f1-desktop-patch-sha.txt; f1-desktop-after-valid-invalid-submit-axtree.txt).
- F6 partial direct evidence: switching to a new address => panel awaits fresh login,
  diagnostics platform-mismatch=true (old token not reused for new address);
  switching back restored 2 networks. Busy-time rejection & binding-hash invariance still
  to be tested in F6 proper.

## Deviations
- None product-related this round. (One earlier duplicate-file confirm dialog on export;
  both copies are the same report id, archived once.)
