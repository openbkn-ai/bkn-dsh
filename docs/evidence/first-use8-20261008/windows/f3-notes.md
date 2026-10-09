# F3 desktop (first authorization + 401 fixture) — execution notes

## Timeline (2026-10-08, Asia/Shanghai local)
- F3 first authorization: product login button exercised (auth flow opened, device code issued);
  token persisted via direct CLI `auth login --device --timeout 300` because concurrent
  Chrome tabs consumed earlier device codes (recorded as deviation, listed separately).
- After token landed: same-Host panel listed 2 networks (supply_ontology_hand, worldcup_vega_catalog_bkn).
  Evidence: f3-desktop-final-axtree.txt
- 401 fault injection: patch cliPath -> auth-fault shim (openbkn-auth-fixture.cmd),
  reject-token.flag present, Host relaunched WITH fixture env (pid 30164, f3-fault-host.pid).
  Panel showed 401 rejection + product re-login entry: f3-fault-401-panel-axtree.txt
- Recovery: shim `auth login <url>` (3-arg contract, default 120s) completed with exit 0
  ("Logged in to https://192.168.50.28 as admin"); fixture auto-cleared reject-token.flag
  (auth-fault dir afterwards contained only the shim). token.json updated 22:16:56.
- Same-Host recovery verified on pid 30164: panel "找到 2 个网络".
  Evidence: f3-recovery-final-axtree.txt
- Recovery diagnostic report (passive): reportId 1e04b23f, 7/7 checks pass,
  observed:cli failureCount=1 recovered=true lastFailureCode=cli-execution-failed exitCode=0,
  observed:context-loader failureCount=1 recovered=true lastFailureCode=auth-rejected toolsPublished=true,
  observed:login-state loggedIn=true, observed:platform-network-list networkCount=2.
  File: OpenBKN-diagnostic-20261008T141957421Z-1e04b23f.json
  SHA256: 257551109d81aa1b3a123e797243ee032f32cb6a17af88951a2dcada912430b9
- Fault host 30164 stopped (identity: exe C:\Users\kalia\AppData\Local\Programs\DeepSeek Harness\DeepSeek Harness.exe,
  start 22:05:22, children 15044,11724,8832,31316,31128 all stopped, remain=0). See f3-stop-log.txt.

## Patch SHA chain (desktop profile cordis.patch.yml)
- healthy backup (F2-saved baseline): D8DB193A43FFE335B061DD53D26BEA35EDF8686FEBC3278CE6EA17C6CE6018A9
- faulted (cliPath -> shim):        2EBBA5DBB99CD97AC8BBFC1DD94ECEF08BB0DF25F57910EBE57334146EE36659
- restored via UI (settings -> advanced -> cliPath -> save):
  c762692112e44062c34411ab5e05a08ed0c889d7dcb8ff3162c3f5b3268e7cc2
  Lines 1-8 (openbkn-business-context: baseUrl + real cliPath
  C:\bkn-verify\diag6-tools\node_modules\.bin\openbkn.cmd) byte-identical to healthy backup.
  EXPECTED additional change: Host appended its own UI entries
  (ui-chat transcriptView/performanceUsage, ui-settings, ui-settings-account onboarding
  state step=done completion=api-key). These are product-written UI settings, not OpenBKN
  business-context config; recorded as the patch's expected change per handoff.
- Recovery host: pid 27536 (f3-recovery-host.pid), started 22:28:33, stopped after save
  verification (remain=0).

## Deviations (recorded honestly)
1. First-authorization completion state was reached by direct CLI (button flow was exercised
   but did not itself persist the token): platform was redeployed; Chrome/IAB sessions did not
   survive across device codes, and concurrent login processes competed for codes. The device
   code shown in IAB (94LHNc44) displayed "无效的设备码" because an earlier confirmation had
   already consumed it; the concurrent shim login process completed the authorization itself
   within its default 120s window (exit 0 authoritative).
2. Two intermediate Host launches (pids 9636, 2628) stayed on the 31-element welcome splash
   because NODE_EXTRA_CA_CERTS pointed to a nonexistent path (C:\bkn-verify\first-use8-kit\...);
   the unified7 kit path is the correct one. Not a product defect; recorded as operator error.
3. Diagnostic export save dialog committed on defocus (file landed correctly in Downloads,
   verified and archived; no manual 保存 click was needed).
4. shim only accepts the 3-arg contract `auth login <url>`; --timeout is rejected by design.
