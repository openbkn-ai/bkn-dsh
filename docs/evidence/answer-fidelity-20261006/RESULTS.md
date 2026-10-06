# Answer fidelity repair — 2026-10-06

## Trigger and responsibility

The unified `-7` CI candidate built from `7553cc1` failed answer delivery on the official macOS Desktop Host. Its successful `run_code` result contained 313 BOM parent-child rows, while the final answer contained 314, including an invented level-3 row. A separate no-data answer changed the physical source `supply_demo_hand.erp_material` to `supply_ontology_hand.erp_material`, despite correct `get_kn_detail` metadata. Original evidence remains in `../unified-7-acceptance-20261006/`; it is not replaced with corrected answers.

These are tool-result-to-answer failures. The independent before/after CLI snapshots agreed with the successful tool result. The repair is a plugin consistency safeguard; it does not establish that a platform calculation defect caused either failure. The separate capability timeout remains outside this repair.

## Change and limits

The plugin uses the supported DSH `agent/turn-stopping` boundary. It reads native events for the current turn, matches successful OpenBKN calls to results, and checks the latest assistant message only if it is non-interrupted and has no pending tool-call block. A later intermediate message clears the candidate; an older answer is not revalidated. It never rewrites assistant messages, raw results, platform records or session history.

- Complete detail handoff: successful `mcp__openbkn__run_code`, JSON envelope with `exit_code: 0`, table columns `level|parent|child_code|child_name|std_usage|available_qty|uom`, and `DETAIL_ROWS`/`TOTAL_ROWS`/`BOM_ROWS` plus `EMITTED` counts matching parsed rows. A page/preview cannot replace a complete handoff. Two different self-declared complete tables produce `detail-handoff-conflict`: neither the last nor the largest is guessed to be authoritative, and no smaller replacement is supplied. Identical repeated handoffs are accepted. Lifecycle echoes of model-written answers cannot become data authority.
- Comparison: row multiplicity, levels, names, usage, available stock, units and `*` absent-row markers. Explicit Chinese level headings are accepted. Full-detail requests require all observed rows; intentional subsets may only contain matching observed rows. Unrelated summary tables do not inherit detail columns.
- Physical source check: explicit `data_source.name` disclosed by successful schema tools, in JSON or actual TOON formatting. The known physical basename must not acquire a different invented schema prefix. This is a bounded metadata consistency check, not a general natural-language fact checker.
- First mismatch: one producer-labelled Host steering notice carries the observed transcription and asks for one replacement answer, retaining original scope and caveats. A second mismatch throws `AnswerFidelityError`; native `turn/end` is `error`, not `completed`. No second Interaction or extra business retrieval is required for transcription repair.
- Bounds: 1,000,000 text characters, 10,000 rows, and at most 64,000 characters of table in corrective context. Unsupported tool formats and absent explicit handoffs are not claimed verified. This safeguard cannot prove business calculation correctness, independent snapshot freshness or semantic completeness of every answer.
- The platform's earlier `bkn_finish_interaction` execution status and the Host final-answer validation are distinct facts. A completed platform execution does not override a failed Host answer validation.

Session export preserves every assistant attempt and correction notice. Its separate `finalAnswer` and Markdown select the latest final-form message, with its native turn-end reason; a pending/interrupted message or a new turn clears the candidate. Failed and corrected tables are not concatenated to produce a false row count. Credential redaction applies to every exported text.

## Compatibility checked

Supported Host: official DSH `0.2.0-rc.2`, source tag `dsh-v0.2.0-rc.2` / `639ed015397290b3745d163aafe02ffee4aa3f84`. The official stop boundary re-reads steering before closing the turn. `createUserMessage`, its extensible producer source and `agent.steer()` are public APIs. A direct peer dependency on matching `@deepseek-ai/dsh-llm` was added; no Host patch or provider interception is used.

The pinned driver [commits `turn/start` at line 305](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/core/agent-loop/src/agent.ts#L305) before [committing native `user/message` at line 421](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/core/agent-loop/src/agent.ts#L421). Native UserMessage has no `turn` field. The runtime probe asserts that exact order and includes a summary-only full-detail request which would silently pass if the human question were missed. The [stop boundary at line 360](https://github.com/deepseek-ai/deepseek-harness/blob/639ed015397290b3745d163aafe02ffee4aa3f84/packages/core/agent-loop/src/agent.ts#L360) passes the turn signal; its catch/finally writes a native error outcome when a listener throws.

Upstream check on 2026-10-06: DSH `master` was `5badb15009ae1756c3afe0ae0cef1faafc290ccc` (`dsh-v0.2.1-alpha.1`); it was not substituted for the supported baseline. OpenBKN foundry `main` was `180ff56b565589f02f913d8e436043fd46f84157`, with latest release `v0.1.5`. No newly discovered tool was added to the guard whitelist.

## Validation before review

- Captured-failure regressions reject the actual 314-row answer and the invented source name; the transcription generated from the captured successful result has 313 rows and preserves the legitimate repeated child in level 4.
- Scoped hook tests cover one notice, unchanged original events, a persistent mismatch, cancellation, per-turn reset and native/unbound scope isolation.
- Official npm DSH runtime probe uses scripted model/tool fixtures, without credentials or a live platform: corrected answer ends `completed` in one turn; persistent mismatch ends `error`; unbound session is unchanged; summary-only full-detail delivery triggers correction, proving the native human question is captured. Each scenario executes data retrieval once. Results are in `runtime-probe.jsonl`.
- Plugin tests: 332 total, 331 pass, 0 fail, 1 skip. Repository Node tests: 50/50. Evidence-export Python tests: 11/11. Typecheck succeeds after normal generation/build.
- Package audit, final diff check and pack identity are recorded in `local-validation.json`.

This section is local/source and controlled-runtime evidence. PR approval, a new CI tarball, exact-artifact real-model acceptance and Windows retest are separate required steps; they are not inherited from these tests or from the old candidate.

The first independent PR review approved the initial head while flagging the intermediate-message edge and two assumptions. The source revision excludes pending tool calls; verifies the native question ordering with an omission-sensitive runtime scenario; and refuses conflicting self-declared complete batches instead of silently shrinking the answer. Updated source approval is required before CI delivery.

## Delivery state at source review

New CI artifact and real-model replay: pending. Windows delivery: held until approval, build-only CI and Mac exact-artifact checks pass. Version remains `0.2.0-rc.2-openbkn.0.2.0-7`; no npm publish, release tag or dist-tag action is authorized by this repair request.

The three original questions will each be run once against the new fixed CI artifact with the configured real model. All intermediate failed/corrected attempts remain evidence. BOM rows will be compared independently against before/after CLI snapshots; source names, units, caveats, native completion and scope will be checked separately. If that fixed artifact fails, it is not handed to Windows as ready.

The second source review approved `078539d`. Its remaining conflict question is intentional: contradictory complete handoffs cannot be repaired by changing prose, so the turn cannot end completed; a new explicitly scoped query is needed. The follow-up adds interrupted-message regressions on both checker and exporter without changing runtime or package content.

## Exact CI replay: empty-stock representation follow-up

PR #69 was approved on its final head `0ff4ec5` and merged as `2abd71d`. Build-only CI [37458538284](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37458538284) succeeded with 332 plugin tests (331 pass, 1 skip), 60 repository tests, and all 16 declared package targets. The CI tgz was `5aee755974ca3551d0414511806c9b8ad7535fe82c96edea70252c7a595b41ee`, 173136 bytes, 66 files. The official Desktop installation matched every file; selected credential/configuration content hashes were unchanged.

That artifact is **not accepted or handed to Windows**. The standard lead-time question completed correctly, but the original BOM question ended in a native error after one correction. Its successful, complete 313-row tool handoff used `无合格库存行` for 48 parent-child rows without eligible inventory and `未提供` for their units. The initial numeric-only parser dropped those rows, so it reported `tool-detail-incomplete`, even when the replacement faithfully printed all 313 rows. The first 9-row excerpt still was incomplete and must be rejected. The absent rows refer to the established query scope, not measured zero inventory everywhere.

The full redacted attempts and native error remain in `ci-2abd71d-bom-failed.json` / `.md`; `ci-2abd71d-verdict.json` records the failed candidate and held third question. Two regressions first failed against the reviewed implementation (16 pass / 2 fail), then passed after adding stock-only explicit absence normalization and the disclosed missing-unit spelling (18/18 focused tests). Unknown stock values and nonnumeric usage remain rejected; removing the absence marker still fails validation. No answer, original trace or independent platform oracle was edited to obtain this result.

The follow-up source requires a new independent PR approval, CI artifact and real-model replay. No result from `2abd71d` is promoted into acceptance of that next artifact. Controlled standalone probes required a separate verified copy with matching official peers; this does not change the real Host/profile. An initial npm preparation wrote an override outside its `config` wrapper and was not counted as a pass; the next fixed-artifact check will use the correct wrapper.

The follow-up review approved `54e3455` and recommended pinning the output vocabulary and preserving the marker legend. The next revision pins `0*` / `?` for scoped row absence / undisclosed units, keeps unknown quantities rejected, includes their explanations in the deterministic correction table, and accepts case-equivalent `NO_ROW`. The final PR head must be approved before the next CI run.


## Exact CI replay: missing-column handoff follow-up

PR #70 was independently approved on `6dff220` and merged as `e1568ec`. Build-only CI [37462485682](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37462485682) succeeded (334 plugin tests: 333 pass, 1 skip; 60 repository tests; all 16 targets). The artifact ZIP digest was verified byte-for-byte; tgz SHA was `bd9ef90d755d499c663316278a17342d8724cc720bcc823f80a8653164371299`, 173487 bytes, 66 files. Installation matched 66/66 files. A stale earlier credential-hash baseline was rejected and preserved as a preparation deviation; a fresh adjacent before/after full remove/install check preserved both selected files.

This artifact is also **failed and held**. The lead-time question completed with the correct one-day manufacturing scope and `supply_demo_hand.erp_material`. The BOM turn ended in native error after one correction: its successful complete `run_code` output printed 313 rows, 48 scoped-absence markers, and matching DETAIL_ROWS/EMITTED, but omitted the column header. Headerless values have no verified positional meanings and must not be admitted. An independent CLI comparison found all 313 delivered rows and eight fields correct; that does not override the native error or supply the missing tool metadata. The third question was not run. Raw failed/corrected attempts remain in `ci-e1568ec-bom-failed.json` / `.md`; identity and verdict remain alongside them.

The follow-up checks this narrowly defined producer defect at settled `tools/result`, while the original Interaction remains open. A full-detail request with equal positive declared/emitted counts and no supported columns receives at most one producer notice. It requests a labelled reprint of cached rows with their known meanings; no new business retrieval, guessed positions or second Interaction. Guards and the original result remain unchanged. Canceled/failed executions, closed Interactions, partial pages and headed malformed data do not get this repair. The existing one-final-answer correction and fail-closed stop remain separate. If repair is unavailable or again wrong, completion is still refused.

The producer contract now pins the literal header immediately after DETAIL_ROWS and retains the same full labelled text in a sandbox cache. Sandbox cache creation is local calculation bookkeeping, not a platform business write or a user-accessible deliverable. Supported named columns are still required; the checker cannot establish business calculation correctness.

Local validation: 338 plugin tests (337 pass, 0 fail, 1 skip), 60 repository tests, typecheck and package audit. Five official npm-core and five official Desktop ASAR-core fixture scenarios pass. The new scenario records one turn, one data retrieval, one cached reprint and one producer notice before the original finish call; the headerless result remains in the log. This is controlled runtime evidence, not real sandbox/model acceptance. A fresh independent PR approval, CI package and original-question replay are required before Windows delivery.
