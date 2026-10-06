# Answer fidelity repair — 2026-10-06

## Trigger and responsibility

The unified `-7` CI candidate built from `7553cc1` failed answer delivery on the official macOS Desktop Host. Its successful `run_code` result contained 313 BOM parent-child rows, while the final answer contained 314, including an invented level-3 row. A separate no-data answer changed the physical source `supply_demo_hand.erp_material` to `supply_ontology_hand.erp_material`, despite correct `get_kn_detail` metadata. Original evidence remains in `../unified-7-acceptance-20261006/`; it is not replaced with corrected answers.

These are tool-result-to-answer failures. The independent before/after CLI snapshots agreed with the successful tool result. The repair is a plugin consistency safeguard; it does not establish that a platform calculation defect caused either failure. The separate capability timeout remains outside this repair.

## Change and limits

The plugin uses the supported DSH `agent/turn-stopping` boundary. It reads native events for the current turn, matches successful OpenBKN calls to results, and checks the latest non-interrupted assistant message. It never rewrites assistant messages, raw results, platform records or session history.

- Complete detail handoff: successful `mcp__openbkn__run_code`, JSON envelope with `exit_code: 0`, table columns `level|parent|child_code|child_name|std_usage|available_qty|uom`, and `DETAIL_ROWS`/`TOTAL_ROWS`/`BOM_ROWS` plus `EMITTED` counts matching parsed rows. A page/preview cannot replace a complete handoff. Lifecycle echoes of model-written answers cannot become data authority.
- Comparison: row multiplicity, levels, names, usage, available stock, units and `*` absent-row markers. Explicit Chinese level headings are accepted. Full-detail requests require all observed rows; intentional subsets may only contain matching observed rows. Unrelated summary tables do not inherit detail columns.
- Physical source check: explicit `data_source.name` disclosed by successful schema tools, in JSON or actual TOON formatting. The known physical basename must not acquire a different invented schema prefix. This is a bounded metadata consistency check, not a general natural-language fact checker.
- First mismatch: one producer-labelled Host steering notice carries the observed transcription and asks for one replacement answer, retaining original scope and caveats. A second mismatch throws `AnswerFidelityError`; native `turn/end` is `error`, not `completed`. No second Interaction or extra business retrieval is required for transcription repair.
- Bounds: 1,000,000 text characters, 10,000 rows, and at most 64,000 characters of table in corrective context. Unsupported tool formats and absent explicit handoffs are not claimed verified. This safeguard cannot prove business calculation correctness, independent snapshot freshness or semantic completeness of every answer.
- The platform's earlier `bkn_finish_interaction` execution status and the Host final-answer validation are distinct facts. A completed platform execution does not override a failed Host answer validation.

Session export preserves every assistant attempt and correction notice. Its separate `finalAnswer` and Markdown select the latest non-interrupted message, with its native turn-end reason; failed and corrected tables are not concatenated to produce a false row count. Credential redaction applies to every exported text.

## Compatibility checked

Supported Host: official DSH `0.2.0-rc.2`, source tag `dsh-v0.2.0-rc.2` / `639ed015397290b3745d163aafe02ffee4aa3f84`. The official stop boundary re-reads steering before closing the turn. `createUserMessage`, its extensible producer source and `agent.steer()` are public APIs. A direct peer dependency on matching `@deepseek-ai/dsh-llm` was added; no Host patch or provider interception is used.

Upstream check on 2026-10-06: DSH `master` was `5badb15009ae1756c3afe0ae0cef1faafc290ccc` (`dsh-v0.2.1-alpha.1`); it was not substituted for the supported baseline. OpenBKN foundry `main` was `180ff56b565589f02f913d8e436043fd46f84157`, with latest release `v0.1.5`. No newly discovered tool was added to the guard whitelist.

## Validation before review

- Captured-failure regressions reject the actual 314-row answer and the invented source name; the transcription generated from the captured successful result has 313 rows and preserves the legitimate repeated child in level 4.
- Scoped hook tests cover one notice, unchanged original events, a persistent mismatch, cancellation, per-turn reset and native/unbound scope isolation.
- Official npm DSH runtime probe uses scripted model/tool fixtures, without credentials or a live platform: corrected answer ends `completed` in one turn; persistent mismatch ends `error`; unbound session is unchanged. Each scenario executes data retrieval once. Results are in `runtime-probe.jsonl`.
- Plugin tests: 329 total, 328 pass, 0 fail, 1 skip. Repository Node tests: 50/50. Evidence-export Python tests: 9/9. Typecheck succeeds after normal generation/build.
- Package audit, final diff check and pack identity are recorded in `local-validation.json`.

This section is local/source and controlled-runtime evidence. PR approval, a new CI tarball, exact-artifact real-model acceptance and Windows retest are separate required steps; they are not inherited from these tests or from the old candidate.

## Delivery state at source review

New CI artifact and real-model replay: pending. Windows delivery: held until approval, build-only CI and Mac exact-artifact checks pass. Version remains `0.2.0-rc.2-openbkn.0.2.0-7`; no npm publish, release tag or dist-tag action is authorized by this repair request.

The three original questions will each be run once against the new fixed CI artifact with the configured real model. All intermediate failed/corrected attempts remain evidence. BOM rows will be compared independently against before/after CLI snapshots; source names, units, caveats, native completion and scope will be checked separately. If that fixed artifact fails, it is not handed to Windows as ready.
