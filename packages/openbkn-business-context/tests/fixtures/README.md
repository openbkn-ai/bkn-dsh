# Session-log fixtures

Real DSH session logs reduced to structure and identifiers. Every user, assistant, and reasoning text is
`[redacted]`, tool-call arguments are `{}`, and only the OpenBKN lifecycle tools
(`bkn_start_interaction` / `bkn_finish_interaction`) keep their result text (ids, status, platform error
envelopes). Other tool results keep only their `isError` flag. Plugin events keep their payloads.

| File | Origin |
|---|---|
| `v4-desktop-session.json` | Official DeepSeek Harness desktop 0.2.0-rc.2, native session format v4 (2026-09-29 probe, `docs/evidence/2026-09-29-desktop-direct-install.md`). One bound turn; plugin events written without `ignorable`. |
| `v3-migrated-session-5ef9.json` | OpenBKN Runtime 0.1.7-rc.2 v3 log (`session-5ef9fdd0…`), converted by DSH 0.2.0-rc.2's own restore path (`createSessionFormatCatalogWithChildren([]).createRestore(…)`). Plugin events arrive as `plugin:openbkn/*`. |
| `v3-migrated-session-0165.json` | Same conversion of `session-0165d688…`: 6 recorded provenances, a platform `resource_not_disclosed` invalidation and its tombstone. |
| `v3-migrated-session-7979.json` | Same conversion of `session-79798f58…`: 19 recorded provenances. |

Regenerate a migrated fixture by running the v3 log through the upstream catalog restore of the pinned
DSH tag, then applying the same allow-list reduction. Never hand-edit event order, sequence numbers, or
lifecycle result texts; the tests compare re-derived state against the records the plugin wrote at the time.

## 0.2.1 native-provenance contracts

- `native-provenance-schema1.json` is a **synthetic structural fixture**, independently authored from the schema-1 contract in OpenBKN Studio `c778f73bdd50370e792dba9706e0ec95fd074d72` (`evidence-chain.types.ts` and `current-explanation.service.ts`) and EE `aa6b3826ff0ce7150da011121c448ca575cedfa3`. It is not a live response or acceptance result. Equal-valued unrelated nodes, undisclosed endpoints, a candidate claim, a partial view and an inline fake token deliberately exercise the projection boundary. Inline payloads and answer offsets must not reach the Client.
- `context-loader-tools-20261018-live.json` contains the **live** input/output schemas of 25 tools, read through MCP initialize / initialized / tools/list with the current CLI identity. It contains no tool execution, token, MCP session ID or user rows. The deployed retrieval image and capture conditions are recorded in its `source`; `execute_skill` was not offered. This does not upgrade the supported release pin or establish model / Host acceptance.
- Current real-sample checks and the frozen projection limits are recorded under `docs/plans/0.2.1/NATIVE-CONTRACT.md`. Real business payloads remain outside the repository; synthetic fixtures must not be described as captured real records.
- `native-selection.ts` builds a **synthetic** schema-1 projection for cross-view selection tests from the same pinned Studio/EE field contracts above. It adds explicit input/output/schema references, two attempts of one operation, unrelated equal-valued nodes and a second question pair. Deliberate ambiguity/conflict variants are constructed inside tests (including defensive mutations of projected data); none is a captured live response. No Studio application code or model-produced relation is used as a test oracle.
