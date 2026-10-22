# Windows review handoff: plugin -12

This handoff distributes a build-only CI candidate based on published -11. It is not an npm release. The exact package version, source commit, CI run, tarball digest, official DSH 0.2.0-rc.2 pins and registry Host integrity are recorded in [kit/pins.json](kit/pins.json). Unrelated development worktrees remain untouched.

The current operator entrypoint is [delta/WINDOWS-DELTA-HANDOFF.zh.md](delta/WINDOWS-DELTA-HANDOFF.zh.md), with [delta/DELTA-RESULTS.template.zh.md](delta/DELTA-RESULTS.template.zh.md) for the return. The maintainer requested change-scoped Windows review: four affected client groups per form, one combined fresh-device authorization per form, one current Host/package receipt, and no repeat cold-start matrix, full business/G6 batch, installer roundtrip or no-plugin control. Historical evidence and unresolved gaps remain explicitly separate from current observations. The full-review protocol in [kit/CHECKLIST.zh.md](kit/CHECKLIST.zh.md) remains an immutable reference inside the existing ZIP; its E00–E10 and full-results checker requirements do not apply to the incremental protocol. Do not feed incremental results into `Review-Results.mjs` or fabricate the full-case/restart records it expects. The existing candidate and ZIP hashes are unchanged. Run Desktop and an independently installed official npm/Web Host separately. On Desktop, dismiss the plugin modal, change the native Host language and reopen the same view. On Web, client A keeps the plugin open while client B changes the same Host's language. Do not claim that the Desktop modal allows access to settings behind it.

The package contains the ordinary plugin tarball, not a patched or replacement DSH runtime. The official Windows installer is downloaded separately and checked for its fixed SHA-256 and native Authenticode. The kit never installs it automatically. No credentials or organization CA files are distributed.

## Build and tooling verification

```bash
python3 docs/handoff/2026-10-22-english12-windows/build-kit.py \
  --package <exact-ci-candidate.tgz> --references <review-reference-directory> \
  --output <new-output-directory>

ENGLISH12_KIT=<absolute-staged-kit-directory> node --test \
  docs/handoff/2026-10-22-english12-windows/tests/kit.test.mjs

pwsh -NoProfile -File docs/handoff/2026-10-22-english12-windows/tests/local-helper-smoke.ps1 \
  -KitRoot <absolute-staged-kit-directory>
```

The builder freezes all 74 package file hashes and every kit file, records the committed kit source and dirty flag, uses deterministic ZIP entry times, and writes an external SHA-256 sidecar. Output directories must be new. Release a kit only from committed source with a false dirty flag. `reference/MACOS-REVIEW.md` records actual native review boundaries; fixture tests and metadata never substitute for native acceptance.

Eleven Node tooling tests cover package identity, changed/extra files, forged installed versions, pending results, wrong Host/package receipts, missing restarts, unsafe evidence paths, full traversal despite manual-pending/FAIL/BLOCKED, extra Host/package receipts outside the primary slots, and missing/incomplete cleanup. Eight ASCII PowerShell scripts are parsed and helper behavior is smoke-tested under portable PowerShell 7.6.7 on macOS. That is not native Windows PowerShell 5.1 execution. Synthetic fixture data is temporary and never included as acceptance evidence.

The private-console launcher returns only a console PID to automation; an operator opens the local startup URL without recording or inspecting the console through an agent tool. The launcher does not relax execution policy or assert readiness. Web startup directly invokes the official CLI without a Tee-Object pipeline or startup-log capture. Operators use a private terminal without transcription, because the startup URL contains a local token. Try Ctrl+C first. `Stop-Host.ps1` validates the selected test root, executable, PID and creation time, terminates only that recorded Host tree, and records remaining processes/listeners. Earlier owned process snapshots help detect survivors after normal exit. It refuses reused PIDs and does not broaden the match to all Node/DSH processes. Preserve test data and failure evidence.

`Review-Results.mjs` audits all receipts and evidence references even when manual confirmation is pending or an early case fails. `structuralChecksPassed` covers identity/references; `acceptanceReady` additionally requires all cases, manual confirmation, anomaly disposition and cleanup. The script cannot establish screenshot truth or publish anything.

## Publication boundary

Keep **all** npm publication and dist-tag changes on hold, including after a successful Windows run. Expected registry state is `rc=-11`, `latest=-10`; -12 is installed from the embedded exact CI tarball. Do not create a production `v*` tag. The review asset uses a separate `review-*` prerelease tag and is not GitHub Latest. Return evidence for independent maintainer review before any later release or promotion step.
