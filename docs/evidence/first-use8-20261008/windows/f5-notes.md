# F5 - in-flight request vs panel close / reload (desktop, Host 1544, session 3, 2026-10-08)

Tooling: Claude computer-use (screenshots, not AX tree). Slow request = CLI login against
https://192.0.2.1 (TEST-NET-1). Observed window: "正在连接 OpenBKN…" lasts ~3-6 s, then generic
failure + 重试 (NOT ~20 s as assumed in HANDOFF-SESSION2 §3). Login click + close therefore had to be
issued in the same action batch with no wait.

## Invalid attempt (recorded, not counted)
- 22:59 login click after save-to-192.0.2.1 did not register (no busy state; diagnostics f44fb248
  showed observed:cli failureCount=0 exitCode=0). Panel was closed + 80 s watched, but since no request
  was in flight this round proves nothing for F5a. Not counted.
- 23:02 a login click did run (busy -> generic failure, ~5 s) — this is login #1 below.

## F5a - close panel while request in flight: PASS
- 23:03:3x patch baseUrl=192.0.2.1, panel pending-login; clicked 登录 -> zoom shows "正在连接 OpenBKN…"
  (f5a-login-inflight-before-close.jpg) -> clicked panel Close immediately (f5a-panel-closed.jpg).
- Watched 20 s and 80 s: panel NOT reopened (f5a-after-20s.jpg, f5a-after-80s.jpg).

## F5b - reopen after close: PASS
- Reopened panel: fresh pending-login state for 192.0.2.1 (f5b-reopened-panel.jpg), not a stale overlay.
- Diagnostics 1bdcf068 (23:05:41): observed:cli failureCount=2 lastFailureCode=cli-execution-failed
  recovered=true — proves both login #1 (23:02) and the closed-panel login (23:03) actually executed and
  failed; observed:login-state platform-mismatch (expected for 192.0.2.1).
  Report OpenBKN-diagnostic-20261008T150541996Z-1bdcf068.json
  SHA 911d19e94ecd3d8c1b38cabc50ab09c7c679c70985890cc19c01f3e48b14a9e3 (credential scan: 0 hits).

## F5c - save-triggered reload while old request in flight: PASS
- 23:07:1x clicked 登录 (192.0.2.1) -> "正在连接…" (f5c-1) -> 设置 opened while busy (f5c-2) ->
  address set to https://192.168.50.28 -> 保存并继续 -> "设置已保存，正在检查连接…" (f5c-3), all within
  ~2 s, i.e. before the old login's ~5 s failure.
- +15 s and +45 s: panel "找到 2 个网络" (f5c-4, f5c-5); old login failure never surfaced.
- Diagnostics a4c1354e (23:08:16): all 6 checks pass; observed:cli failureCount=0 exitCode=0;
  login-state loggedIn=true; platform-network-list networkCount=2 (f5c-6). No cli-execution-failed was
  recorded after the reload => stale result neither overwrote UI nor polluted the new state's counters.
  (Cannot distinguish "old result discarded" vs "old CLI child killed on reload" from UI; either satisfies
  the requirement. No leftover openbkn login process afterward.)
  Report OpenBKN-diagnostic-20261008T150816301Z-a4c1354e.json
  SHA 967e4cdaf8665c6b12fe8cccf8b82ba7000d04bac927fe2cd9c8d4706d4dd12f (credential scan: 0 hits).

## End state
- patch SHA c762692112e44062c34411ab5e05a08ed0c889d7dcb8ff3162c3f5b3268e7cc2 (baseline, byte-identical).
- Host 1544 still running, 2 networks.
