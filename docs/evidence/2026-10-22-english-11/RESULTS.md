# English-only plugin -11 release evidence

Date: 2026-10-22 (Asia/Taipei).

## Frozen scope and baseline

The release starts at published Latest `v0.2.0-rc.2-openbkn.0.2.0-10`, source `5b885dd7492fd42951b21729984f0d1e99da8b0d`. Its registry/GitHub tarball SHA-256 is `798917740c96edc9364e27e27226168422e5fa78b97cd7b9ddf6a279fbf1b6f9`. The development branch `feat/021-localization-login` and its existing uncommitted work are preserved in their original worktree.

Reuse the developed English resources and locale provider, adapted onto the released client surfaces. Keep the released login flow, three provenance tabs, requests, Host code, Remote contracts, access policy, dependency pins and DSH 0.2.0-rc.2 support. No new 0.2.1 compatibility claim, native provenance view, CSV export or platform deployment is made.

## Verification boundaries

Local build: Node 22.22.3, pnpm 11.7.0, retained DSH 0.2.0-rc.2 generator. The downloaded published -10 tarball is used for direct byte comparison: all six non-client JavaScript files match; only `lib/client.js` differs. Local dependency resolution adds only the locale type package and React renderer test dependencies.

Local plugin tests: 443 passed, one Windows-only skip. Seven focused locale tests cover dictionary/placeholder completeness, existing-error updates without new reads, nested 401 messages, unsaved settings, a pending login, all three retained provenance tabs with graph selection, and verbatim platform text. Existing controller/authentication assertions still validate the rendered Chinese text and refusal behavior. Type checking passed. Repository checks, fixed CI artifact, actual Mac hosts and publication identities will be appended when verified.

Latest upstreams were checked live: DSH `dsh-v0.2.1-rc.2` is a prerelease at `687f282e8625c6b8d11ff58211a90524be2e4317`; OpenBKN's latest formal release is `v0.2.0`. These checks do not upgrade the supported DSH pin or the installed platform. This client-only release retains -10 tool contracts and denies unreviewed tools.

Windows live UI acceptance, a fresh model/G6 batch and npm `latest` promotion remain open. Existing -10 operational limitations remain applicable. Historical development-branch -11 CI artifacts are different candidates and are not used as acceptance evidence for this release.
