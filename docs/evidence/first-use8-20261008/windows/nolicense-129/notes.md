# EXPLORATORY (outside the -8 spec): no-license platform https://192.168.50.129 — 2026-10-09 23:10-23:30
- CA: C:\bkn-verify\platform-129\openbkn-test-015-ca.crt (PEM despite .crt), subject=issuer=CN=OpenBKN Test 015 Local CA,
  CA:TRUE, no private key, 2026-10-09..2027-10-09, SHA-256 fd6d4aaa860cb744c170df65a24478211895129ec09b3fa302e768b2f7a4a97f.
  openssl verify of the .129 leaf (CN=DominicZhangdeMac-mini.local) = 0 (ok). Passed only via NODE_EXTRA_CA_CERTS.
- Route: direct (source 192.168.50.99), not via Clash TUN.
- Form: npm/web (computer-use unavailable for desktop). Root C:\bkn-verify\first-use8-nolicense-npm, port 18537,
  Host pid in host.pid; fixed tgz verified 66/66 (verify-install label nolicense).
- UI: address https://192.168.50.129 + real cliPath saved; login started by the USER clicking the button in the shared
  browser pane (23:19); store created under platforms/aHR0cHM6Ly8xOTIuMTY4LjUwLjEyOQ.
- Directory: panel "找到 2 个网络" (same two networks as .28) — NOT license-gated.
- Diagnostics 5151f034 (23:20:36): ALL pass incl. context-loader toolsPublished=true, platform-network-list networkCount=2.
- Controlled CLI probes (same store, openbkn 0.1.5):
  * GET /api/safe/v1/capabilities -> nginx 404 HTML.
  * bkn_start_interaction OK -> int_1750e86798c214062ea7f96fb71e4651 (left active).
  * GET /api/agent-observability/v1/interactions/<id>/operations -> nginx 404 HTML.
  * GET …/business-graph -> nginx 404 HTML.
- Code (lib/business.js ~1505-1530, ~2950): licenseGated 403 + {code:"permission_denied"} -> LICENSE_REQUIRED ->
  provenance reason "domain-not-authorized"; 404 without {code:"resource_not_disclosed"} -> PLATFORM_UNAVAILABLE ->
  reason "platform-unavailable".
- INFERENCE (not yet UI-observed): on this no-license deployment provenance will degrade as "platform-unavailable"
  (temporary-sounding) instead of the license-specific "domain-not-authorized", because the observability API is absent
  (nginx 404) rather than returning 403 permission_denied. Needs a real Standard turn to confirm in the UI.

## CORRECTION + UI result (23:34-23:40)
- The earlier "nginx 404" probes were a PROBE FLAW: `openbkn call <path>` routed those paths differently. Direct HTTPS
  with the same store's Bearer token (exactly what the plugin does) returns 200 JSON for:
  * /api/agent-observability/v1/interactions/<id>/operations and /business-graph
  * /api/safe/v1/capabilities -> {"licensed":false,"edition":"community","state":"trial","features":[],...}
  => platform IS unlicensed (community/trial), but these provenance APIs are NOT license-gated on it.
- The earlier INFERENCE ("provenance would degrade to platform-unavailable") is WITHDRAWN.
- Real Standard turn (model key entered by the user; workspace created by the user via the panel + native picker):
  answer completed with tool calls (get_kn_detail, query_object_instance, run_cypher, run_code; some run_code errors
  handled), session "查询知识网络对象类型与采购库存关联" (answer.jpg).
- Provenance int_b117ef009d6eb3fe4523dd8ae7c18fa7: execution tab completed/10 nodes + "平台执行事实" with
  Request/Trace/Receipt; business-context tab 10 elements with source operation; evidence-chain tab receipts
  "来源：平台" (provenance-execution.jpg). NO degradation.
- Diagnostics c99eb04b (23:37:42): all pass incl. observed:platform-operations and observed:platform-business-graph.
- Conclusion: on this unlicensed (community/trial) deployment every plugin path exercised works; the plugin's
  LICENSE_REQUIRED / "domain-not-authorized" branch was NOT reachable here, so that branch remains untested on a real
  platform (would need a deployment that answers 403 {code:"permission_denied"}).
