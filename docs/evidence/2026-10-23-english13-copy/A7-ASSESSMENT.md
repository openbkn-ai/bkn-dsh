# A7: expected duplicate-start guard denial

Maintenance assessment on 2026-10-23. This covers the specifically identified npm/Web event, not every historical timeline error.

The Windows operator reported session `session-1dbb5f5d-0bee-4d08-8858-74a91a8d3d75`, turn 1, step 2. First start events 19/20 returned an active interaction `int_c307c7650a1b644186676b3f1af48f29`. A second start with `conversation_mode=continue` used the same conversation while that interaction was open. Its call/result pair is events 26/27, call ID `call_00_4gtJtuiUBbIjc0nequLh5361`, both at `02:43:10.694Z`. The paired result has `data.message.isError=true` and this 140-character plain-text error:

> Error: An OpenBKN interaction is already open in this turn; continue using it, or finish it with mcp__openbkn__bkn_finish_interaction first.

Later finish events 44/45 completed the first interaction. This completion does not contradict the rejected second start.

Independent local inspection of the accepted -12 CI tarball (SHA-256 `30a94300994296513b8d391acda69933acf1f4a77440e9da53486a0de5bd1a44`, 74 files) found the exact guard text at `lib/business.js:487`. The official DSH tools 0.2.0-rc.2 bundle creates `Error: ${denialReason}` with `isError=true` and takes the post-result path instead of dispatch when a guard denies. The two existing lifecycle/scoped-context unit-test files passed all 71 tests on macOS, including repeated-start refusal. These are static and unit-test facts, not a new Windows dispatch capture.

Disposition: expected governance refusal; retain the error event. No guard fix, automatic retry, model correction or new Windows business run is requested. Preserve runtime dispatch as `unknown`, error code and HTTP status as null; neither 0 ms nor static code is a runtime send receipt.

Evidence-transfer limit: the operator's `english12-a7-event.zip` reportedly contains two files and has SHA-256 `1a903d08763850f14bb824a89788e3de13dd1b4d4d2deaf942e30a23c09d7fee`. It remains on Windows, has not been received or independently byte-verified here, and must not be automatically uploaded publicly. The event details above are operator-reported. The original session's abbreviated digest is not treated as a complete hash; its read-only status/mtime is also operator-reported. Historical return files and manual-confirmation flags remain unchanged.
