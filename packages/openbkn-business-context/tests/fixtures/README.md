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
