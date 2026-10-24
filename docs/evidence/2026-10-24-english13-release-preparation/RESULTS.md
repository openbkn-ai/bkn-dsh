# English -13 release preparation

Status: acceptance complete; formal `publish=false` build and file-equivalence check pending in this preparation. No npm publication, dist-tag write or production tag is authorized by this record.

## Accepted candidate

- Package: `@openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-13`.
- Source: `91b2297b3070277ce0cba25a986bcaec35256f05`.
- CI: [39968315495](https://github.com/openbkn-ai/bkn-dsh/actions/runs/39968315495), build-only.
- SHA-256: `8290a0b89d9af5118b0aeabc09499c5085114047f469fe631835b808f52d3675`; 74 files.
- Supported/tested hosts: official DSH `0.2.0-rc.2` Desktop/npm-Web on macOS and native Windows. OpenBKN/CLI baseline: `0.2.0`.

## Acceptance evidence

- [macOS candidate record](../2026-10-23-english13-copy/RESULTS.md): exact-candidate UI and package checks; this dated record's pending Windows status is historical.
- [Windows final run, cafix2](https://github.com/openbkn-ai/bkn-dsh/blob/6cd071adc41dcd19e949fadb1767aaf1772079ab/docs/evidence/english13-copy-cafix2-20261024/COPY-RESULTS.md): Desktop Host/package/cleanup and both forms' run history. Its four cropped-image PASS claims were not accepted as proof of the complete target sentence.
- [Windows image supplement](https://github.com/openbkn-ai/bkn-dsh/blob/4b89bacedd0c988f216396b8696b26748ac9a27e/docs/evidence/english13-copy-image-supplement-20261024/IMAGE-SUPPLEMENT.md): npm Chinese/English images and new `copy13img` receipts accepted; Desktop cropped-image claims remained insufficient.
- [Desktop complete originals](https://github.com/openbkn-ai/bkn-dsh/blob/cfa6b2eb0ca8d194c34d58ec05b7333b03c1488a/docs/evidence/english13-copy-image-supplement-20261024/originals/ORIGINALS.md): full PNGs independently opened and complete Chinese/English title and explanation verified. This closes the Desktop copy evidence gap without rerunning the Host.
- Chinese Desktop original SHA-256: `ad1629010b529cb2fb4df2b4a705b2619ed2c745f445fea98c174edc410859c0`; English: `b7784a0c440208fb5b0dd9237a3f2f76706b9ea0d0adda2060cedc1f1404a8de`.

Original archives, cropped images, historical FAIL/BLOCKED records and human-confirmation fields are not rewritten. The maintainer's independent material review is distinct from a new native Windows run or user manual sign-off.

## Reused baseline and retained limits

- The accepted -12 client-state/login-recovery and unaffected -11 localization/cold-start evidence are reused only within their reviewed scope. The -13 candidate changes one Chinese explanation plus generated declaration/version relative to -12; 71 files, six Host/Remote JS files, dependencies and pins are unchanged.
- A7 is an expected duplicate-start guard denial; keep raw error and dispatch=unknown. Correct captured RPC interpretation is `result.ok=false` and `result.error`, not an unverified top-level `ok=true`; the earlier repro2 script's actual response was not retained.
- Windows runner/carrier lifetime and Ctrl+C remain known issues. Desktop overlays remain modal. Live counted-timeline/nonempty-graph selection branches remain BLOCKED; Web diagnostics may lack Host metadata. No new full G6/model or DSH 0.2.1 compatibility claim is made.
- Windows CA-bundle repair and later successful login are separately recorded; historical process CA environments and unretained payloads stay unknown. No insecure TLS workaround is part of the release.

## Formal-build gate

The release preparation uses the existing `release-plugin.yml` path with `publish=false`. Compare unpacked path sets and every file's bytes, including package.json, to the accepted CI artifact. A compressed tarball hash alone is not the equality criterion. Before an eventual registry publication, record the formal source/run and all file digests here; after an authorized publication, compare the registry-served package before a separate latest promotion.

## Current read-only preparation checks (2026-10-24)

- Public registry readback: `rc=-11`, `latest=-10`, -13 absent. These are observations, not tag writes.
- CA-verified live MCP `tools/list`: 25 tools; full schemas identical to the accepted -13 baseline (canonical SHA-256 `a679358f8b9a45948ac9f5a11f1044899922fe32487d887bc10c94c76a995be6`). No tools/call, login, deployment or data mutation was performed.
- Core retrieval, observability and backend deployments remain on `0.2.0` and ready. An unrelated `agent-operator-integration` deployment reports 0/1, `CreateContainerError`; the cluster was not changed and this is not represented as a healthy full-platform run.
- Open Dependabot alerts concern `@modelcontextprotocol/client@2.0.0` in the pinned DSH MCP peer stack (high OAuth issuer-binding, medium cross-origin redirects). The plugin tarball contains no MCP SDK implementation and mounts DSH's transport with an explicit bearer header, not an SDK OAuth provider. The HTTP transport path remains relevant to redirect hardening; no exploit or absence of exposure is established by this check. The advisories are retained in the release notes and remain an upstream-risk disposition before any production tag.
