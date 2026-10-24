# English UI release: plugin -13

Version: `@openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-13`

Supported and tested: official DSH `0.2.0-rc.2`, OpenBKN `0.2.0`, macOS and native Windows Desktop/npm-Web.

The plugin follows DSH's Chinese/English language preference. Its settings, network directory, diagnostics, context card, suggestion and existing provenance tabs use the selected language. Platform facts, network names, raw identifiers and model answers keep their original values.

This release includes the accepted -12 modal recovery fixes: dismissing a Desktop overlay to change the Host language retains drafts, validation errors, directory state, the last diagnostics report and provenance view. A pending CLI login continues across dismissal and synchronizes after authorization. The final -13 change completes the Chinese platform-execution explanation; its English resource is unchanged.

## Acceptance and artifact identity

- Accepted source: `91b2297b3070277ce0cba25a986bcaec35256f05`.
- Build-only candidate: [Actions 39968315495](https://github.com/openbkn-ai/bkn-dsh/actions/runs/39968315495).
- Candidate tarball SHA-256: `8290a0b89d9af5118b0aeabc09499c5085114047f469fe631835b808f52d3675`, 74 files.
- Both macOS forms were checked on that exact candidate. Native Windows Desktop and npm/Web target-copy evidence and corresponding Host/package/cleanup receipts have been independently reviewed. Earlier -11/-12 evidence is reused only for unchanged behavior.
- Formal-build equality is recorded in the [release preparation results](../evidence/2026-10-24-english13-release-preparation/RESULTS.md). A matching formal artifact reuses this acceptance; a changed artifact needs review of its affected scope.

## Known limitations

- Windows command carrier lifetime and Ctrl+C behavior remain known issues. Do not broadly terminate unrelated Node, Chrome or DSH processes.
- Desktop overlays remain modal; close them before changing the Host language and reopen afterward.
- Available live data did not cover counted timeline summaries or nonempty graph selection; those branches remain BLOCKED. This release does not claim a new full business/model G6 acceptance run.
- Web diagnostics may lack authoritative Host-form or loaded-version metadata. Original null/unknown values remain unchanged.
- Self-signed platforms need the correct signing CA in the Node trust configuration and a fresh Host process. Preserve certificate verification. Complete device authorization within the platform's expiry window.
- The identified A7 duplicate-start event is an expected guard refusal, with its raw error and runtime dispatch=unknown preserved. Missing historical response/process evidence is not reconstructed.

The package keeps the six -11 Host/Remote JavaScript files, dependencies and DSH pins unchanged. The unfinished 0.2.1 compatibility, native provenance and CSV-export work is outside this release.

## Publication sequence

This document prepares the release; it does not assert that -13 is on npm. Once publication is explicitly authorized, the existing workflow publishes to `rc` first. Verify that the registry-served package is file-for-file equivalent to the accepted formal artifact before separately promoting `latest`. No npm tag is moved by this preparation.
