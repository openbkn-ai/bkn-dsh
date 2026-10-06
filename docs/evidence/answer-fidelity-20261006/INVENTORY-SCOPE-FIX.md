# Scoped inventory handoff correction

The `3ac73cc` CI candidate is held. Its actual Desktop BOM turn completed natively and delivered 313 rows. An independent CLI oracle found 43 absence-marker differences: the seven other fields matched, but the script decided absence using global inventory-record existence instead of the established seven-warehouse, usable-status scope. Before/after snapshots of the queried fields match. The answer also incorrectly said reservation had not been deducted from available stock; the live inventory property comment explicitly defines available stock as inventory minus reserved.

`ci-3ac73cc-bom-failed.json` / `.md` preserve the original native turn, including all attempts and the header-repair notice. The verdict, independent difference report, and scope row-count fixture retain the failed candidate identity. The third question was not run on this failed candidate. The earlier preparation login-expiry deviation remains separate.

The correction has two parts:

- Direct fallback guidance filters before grouping, tracks eligible row counts independently of quantity sums, and caches batches. A new explicit fallback handoff audit column, `scoped_stock_rows`, distinguishes no eligible row (`0*`, unknown unit) from eligible records summing to measured zero. The producer check requests one repair from cached records before finishing. Invalid audited candidates are not promoted to authoritative detail; an unaudited reprint cannot clear the failure. Conflicting valid complete handoffs still fail.
- Targeted JSON schema retrieval provides inventory property comments before explanations. A narrow consistency check rejects the observed explicit contradiction when the returned comment defines inventory minus reserved. A capability's display-only rule does not undo that field formula. Unknown formulas are not inferred.

The scope checker validates disclosed metadata and transcription, **not** the correctness of the platform query/calculation. Legacy unmarked seven-column handoffs remain supported. The independent CLI comparison still checks all eight acceptance fields, including scoped absence. The new test annotates the captured table with an independent CLI row-count fixture; those annotations are synthetic test evidence, not metadata present in the original turn or a rewrite of it. The original capture remains unchanged.

Upstream refresh on 2026-10-06: DeepSeek Harness `master` remains `5badb15009ae1756c3afe0ae0cef1faafc290ccc`; OpenBKN foundry `main` remains `180ff56b565589f02f913d8e436043fd46f84157`. The supported Host remains official unmodified DSH `0.2.0-rc.2`; CLI is `0.1.5`. The live `get_object_types` schema supports `ids`, `kn_id`, `response_format=json`, and managed context; the targeted inventory schema was freshly captured. No pin or managed-tool allowlist changed.

Source tests and local packs do not accept the candidate. A new independently reviewed source head, build-only CI artifact, exact installed file identity, and fresh real-model original-question replay are required before Windows delivery. No npm publish, tag, or dist-tag change is authorized.
