# F6 / F7 (desktop) - session 3, 2026-10-09 06:22-06:40

Login: user device login 06:22:06 (token exp 07:22:06). Business workspace
C:\bkn-verify\first-use8-desktop\workspaces\supply-ontology <-> supply_ontology_hand, session-58973674-...
(created via panel "新建工作区", folder chosen in native picker). Binding/patch hash chain: f6-binding-hashes.txt.

## DEFECT CANDIDATE first (see f7-defect-stale-mcp-token.md)
Before restart, with the fresh login, both Standard turns failed: bkn_start_interaction -> Public.Unauthorized
"token is invalid"; diagnostics d2adf6a1 all-pass with no context-loader row; CLI probe with same token OK.
Host restart (1544 -> 30928, s3-stop-1544.txt / s3-f7-restart-host.txt) cleared it.

## F7 use - PASS (with the defect above recorded separately)
- After restart the SAME session reopened with its binding chip; binding SHAs unchanged across restart.
- Turn 3 (06:31): tools work ("Interaction 已建立", f7-after-restart-interaction-ok.jpg); native model answer listing
  15 object types + PO/inventory relation + instances.
- Turn 5 (06:33-06:35): per-type definitions + 1 instance each; 4 types returned
  "object type has no published data source" and the model reported them as failures (no fabrication)
  (f7-answer-15-types.jpg).
- Provenance panel "查看业务溯源": Interaction int_c3d3f535dde6e5771e41d2dd5b781aee, completed, 19 nodes:
  bkn_start_interaction (continue, conversation: yes) -> run_code x2 (receipts) -> query_object_instance x10
  -> query_object_instance x4 error -> bkn_finish_interaction completed (f7-provenance-int_c3d3f535.jpg).
- Restart-resume: session + binding resumed after Host restart; start_interaction used mode=continue.
- No plugin answer-judging/correction observed.
- Bad-import variants: see f7-badimport-notes.md (separate fault roots).

## F6 address change - PASS
- Busy (turn in progress, 06:32 and 06:34): settings form shows "业务回合仍在运行，请等待回合结束后重新打开设置。";
  address field read-only (Ctrl+A selected text, typed value not accepted); clicking 保存并继续 did nothing;
  patch c7626921 and binding SHAs unchanged (f6-busy-*.jpg, f6-binding-hashes.txt).
- Idle -> https://first-use8-no-platform.invalid: saved (patch f0a6afa7...), panel pending-login for new address;
  diagnostics 51769d0a login-state platform-mismatch platformMismatch=true (CLI platform fence; old token not reused).
  bkn-config/platforms still only the 192.168.50.28 dir (no token written/sent for .invalid).
  Bindings unchanged. Report OpenBKN-diagnostic-20261008T223653003Z-51769d0a.json
  SHA a15ca766ae91c820195ced8f897b4b8812dde592c0227e1d7328061508132368.
- Idle back -> https://192.168.50.28: 2 networks, workspace association intact, patch back to c7626921 (byte-identical),
  bindings unchanged; follow-up business turn used tools successfully WITHOUT restart (f6-idle-restored-tool-ok.jpg).
- Token isolation at network level (no request to .invalid carrying a token) and resource release:
  insufficient-evidence from UI/JSON alone (no packet capture); fence + absence of a new platform store recorded above.
