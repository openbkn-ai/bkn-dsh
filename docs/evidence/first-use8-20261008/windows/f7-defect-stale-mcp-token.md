# DEFECT CANDIDATE: running Host keeps using a rejected token for Context Loader MCP after CLI re-login;
# diagnostics do not observe the tool-call 401 (desktop, Host 1544, 2026-10-09 06:22-06:30)

## Preconditions
- Host 1544 started 2026-10-08 22:37 (with CA). Earlier CLI token (login 23:28:46) expired 00:28:45; Host idle overnight.
- 06:22:06 user completed product-initiated device login ("使用 OpenBKN CLI 登录并同步") -> bkn-config token.json
  rewritten, expiresAt 07:22:06. Panel then listed 2 networks (directory path OK).
- 06:23 new business workspace C:\bkn-verify\first-use8-desktop\workspaces\supply-ontology bound to
  supply_ontology_hand (session-58973674-...; binding SHAs in f6-binding-hashes.txt).

## Observed
1. 06:24 Standard session turn 1 ("这个知识网络里有哪些对象类型？…"): model called bkn_start_interaction twice;
   both returned {"code":"Public.Unauthorized","description":"认证失败","details":"token is invalid"}.
   Model reported failure honestly, no fabricated answer (f7-defect-1-turn1-unauthorized.jpg).
2. dsh-home/.credentials.yaml rewritten at 06:24:33 (after turn 1 started); its OPENBKN_MCP_TOKEN ref is
   byte-equal to the CLI accessToken (compared by SHA-256 prefix 4e34a02f5423 only; values never printed).
3. 06:25 turn 2 ("凭证已更新，请重新…"): same Public.Unauthorized x2 (f7-defect-2-turn2-unauthorized.jpg).
   => not a one-off sync race: the running MCP connection does not pick up the refreshed credential.
4. 06:26 diagnostics d2adf6a1: ALL checks pass; report contains NO observed:context-loader check at all
   (ids: bootstrap-entry, business-entry, diagnostics-entry, observed:cli, observed:login-state,
   observed:platform-network-list, observed:platform-network-detail). The tool-call 401s are invisible to
   diagnostics, so the product's 401 -> re-login -> recover path (proven in F3) is never triggered.
   Report OpenBKN-diagnostic-20261008T222631340Z-d2adf6a1.json SHA 5d4efce76c4a7977fef3b37eb057b32138b433762f7a2946758213bcaa970336
5. Controlled probe (independent of Host): same BKN_CONFIG_DIR, same token,
   `openbkn context tool-call supply_ontology_hand bkn_start_interaction --args {...agent_name:first-use8-cli-probe}`
   -> exit 0, interaction_id int_9a4223264538250bb11e8ac0da694c7e, conversation conv_8c7995d8ef11c4f2261c684bfe21caad.
   => platform + token are valid; the defect is on the Host/plugin MCP credential path.
   (Probe left one active platform interaction record; not finished.)

## Expected
- After a successful product login, the business MCP connection uses the new token (or reconnects), OR
- a tool-call 401 is surfaced as observed:context-loader auth-rejected so the panel/diagnostics guide re-login.

## Repro sketch
Let the CLI token expire while Host runs -> product re-login -> immediately use a bound Standard session.

## Not yet established
- Whether Host restart clears it (next step, also needed for F7 restart-resume).
- Whether the stale token is the pre-expiry access token (likely) — not inspected to avoid handling secrets.

## 2026-10-10 update (C5, B1 handoff 8e3707f) — original failure records above are unchanged
- Title wording: "running Host's business MCP calls still rejected after re-login; restart recovers". The stale-token
  explanation is a root-cause CANDIDATE, not established.
- `Public.Unauthorized` / "token is invalid" is the TOOL-level return content; there is no direct evidence of the
  transport HTTP status, so it is not written as HTTP 401.
- Stale token, SDK, client reuse and server-side MCP session are all still to be determined.
- "Not yet established: whether Host restart clears it" is superseded: f6-f7-notes.md records that after restart
  (Host 1544 -> 30928, 06:30) the same session's tools worked (06:31 "Interaction 已建立").
- A fresh minimal reproduction is reported separately in ../WINDOWS-B1-RESULTS.md and windows/b1-minimal/.
