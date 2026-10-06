# PR #64 review follow-up

Date: 2026-10-06. Review target: `935d90c9a57069d1310f14b5527279919a8e4047`. The review requested changes; successful workflow execution was not approval.

## Changes

- The four active READMEs now use -7 consistently for install commands, compatibility tables, package-layout changes and override migration anchors. The npm registry currently contains releases through -4; -5/-6 are unpublished development candidates. Explicit notices direct pre-publication tests to the fixed CI tarball instead of an unavailable npm version. Published -4 instructions remain accessible separately. Restore both installation headings and remove their stray text.
- Align `plugin.artifact` with `plugin.version` in the runtime manifest. The manifest validator now rejects a mismatched package/version filename; the release workflow invokes that validator before building or publishing. No runtime archive is produced.
- Replace the review planner's 100-file GraphQL list with all paginated REST pages. Check both total count and uniqueness; incomplete results fail instead of claiming full coverage. Re-review instructions require a first review of files omitted by an earlier truncated list, even when unchanged in the follow-up commit.
- Record the project rule that agent-authored PR titles, descriptions and follow-up comments use English; update the PR description in English.

## Validation

- Before fixes: the artifact-mismatch regression failed with “Missing expected exception”; both planner regressions failed against the original 100-file behavior. After fixes: all seven focused tests passed.
- Repo suites: 60/60 passed, including late-file enumeration and incomplete-list rejection.
- Plugin suite: 312 passed, one Windows-only test explicitly skipped on macOS; typecheck and 65-file package audit passed.
- Both edited workflow YAML files parse successfully. The same validator used by the release gate accepts the updated manifest.
- Live planner run on PR #64: `file_total=541`, `file_listed=541`, `skip_round=false`. This verifies enumeration, not that every file has been read or independently reviewed; review coverage still depends on the next verdict.
- The fresh local pack contains 65 files; only README.md and README.zh.md differ from the previous combined local pack. Executable package files remain byte-identical. See `review-followup-pack-identity.json`.

## Release boundary

Repository rules require a supplemental PR into the protected candidate branch to update PR #64. After that reviewed branch update, run a fresh build-only rehearsal (`publish=false`) because package README bytes changed. Previous CI pack acceptance cannot be transferred to the new digest. CI artifacts and subsequent real-host/Windows acceptance remain separate. This follow-up does not merge into main, tag, publish to npm or promote a dist-tag.
