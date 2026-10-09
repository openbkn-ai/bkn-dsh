# Session 3 - patch baseline restore (2026-10-08 ~22:57 local)

- Pre-state: Host 1544 (+children 30580/28644/31164/13012) running; patch baseUrl=https://192.0.2.1,
  SHA 46fa4b387f860dfd3f221f621e73bcde420d43a690a46a80f5c9d41e2ce513fb. Panel showed pending-login
  with "平台地址: https://192.0.2.1".
- Action (UI, same Host 1544): OpenBKN -> 设置 -> 平台地址 = https://192.168.50.28 -> 保存并继续.
- Result: panel "找到 2 个网络" (worldcup_vega_catalog_bkn, supply_ontology_hand) - s3-restore-baseurl-panel.jpg.
- Patch SHA after: c762692112e44062c34411ab5e05a08ed0c889d7dcb8ff3162c3f5b3268e7cc2
  == pre-F4 baseline (byte-identical). Counts as F6 "switch back to original platform recovers" evidence
  (192.0.2.1 -> 192.168.50.28, no re-login needed, no patch drift).
- Tooling note: session 3 drives UI via Claude computer-use (screenshots), not AX tree; typing used the
  clipboard fast path (user clipboard overwritten). Clicking a textfield makes textinputhost.exe frontmost
  -> it must be in the allowlist.

## Model key check (23:20)
- User reported configuring a TEST-ONLY DeepSeek API key (to be revoked after testing). No file write observed
  at that time; dsh-home/.credentials.yaml already had a DEEPSEEK_API_KEY ref (mtime 23:07:17 from F5c save).
- Smoke test: new non-business session in 默认工作区 "收到指令确认", prompt "只回复两个字：收到" -> "收到" (1 s,
  DeepSeek-V41-Flash). SIDE EFFECT: this session persists in desktop user state; expect it in N6 hash diffs.
- .credentials.yaml holds secrets: never copy into evidence / commits.

## Observation: CLI token natural expiry (23:16:55) -> not-logged-in
- bkn-config token.json (written 22:16:56 by F3 shim login) expiresAt=2026-10-08T15:16:55Z (=23:16:55 local, 1 h TTL).
  refreshToken present (94 chars). At 23:24 panel showed pending-login for the REAL platform 192.168.50.28.
- Diagnostics 483b44f3 (23:24:55): observed:login-state FAIL authentication/not-logged-in loggedIn=false
  failureCount=1; cli exitCode=0; platform-network-list last pass ~17 min earlier (networkCount=2, stale).
  Report OpenBKN-diagnostic-20261008T152455926Z-483b44f3.json SHA 092ac3299af0d90ffea4b176b054c831231da35e291a89a09186dc3e973dbc57.
- Product did not use the refresh token / did not distinguish "expired" from "never logged in". Recorded as an
  OBSERVATION for main dev (not an F-item failure; no spec line requires silent refresh). Impact on this run:
  every remaining real-auth step needs a fresh user device-code login, and the 1 h window constrains F6/F7.
