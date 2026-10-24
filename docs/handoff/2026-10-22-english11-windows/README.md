# Windows acceptance handoff: English-only plugin -11

Prepared on 2026-10-22 (Asia/Taipei) from published source tag `v0.2.0-rc.2-openbkn.0.2.0-11`, commit `a767c6b3d9b6c383e8c8f7f71bac7d934d1993b0`.

This handoff packages the already-published artifact; it does not change or rebuild the plugin. The original development worktree and its unrelated work remain untouched. Runtime-bundle production remains discontinued. The downloadable kit is test tooling plus the ordinary npm plugin tarball, not a replacement DSH runtime.

The operator entrypoint is [kit/CHECKLIST.zh.md](kit/CHECKLIST.zh.md). It covers the official Windows Desktop application and an isolated official npm/Web Host, both fixed to DSH 0.2.0-rc.2, with E00-E10 required separately for each form. Locale changes use the Host's native settings; both hot directions, state retention, the three original provenance tabs, dynamic counts, raw platform/model text and two cold starts are required.

The package identity, upstream snapshot, official Windows installer URL and observed full-file digest are frozen in [kit/pins.json](kit/pins.json). The installer itself is downloaded from the official HTTPS version URL on the Windows machine and checked there, including Authenticode. It is not bundled or automatically executed. Installing the npm Host still requires registry access for dependencies. No credentials or organization-specific CA are distributed.

## Build and verification

```bash
python3 docs/handoff/2026-10-22-english11-windows/build-kit.py \
  --package <published-11.tgz> --references <published-verification-directory> \
  --output <new-output-directory>

ENGLISH11_KIT=<absolute-staged-kit-directory> node --test \
  docs/handoff/2026-10-22-english11-windows/tests/kit.test.mjs

pwsh -NoProfile -File docs/handoff/2026-10-22-english11-windows/tests/local-helper-smoke.ps1 \
  -KitRoot <absolute-staged-kit-directory>
```

The staged kit contains the published tgz, per-file package manifest, a manifest of every kit file, frozen release verification references, source identity, operator scripts/checklist, an all-NOT_RUN result template and a maintainer promotion procedure. The builder records the source commit and dirty flag; release only a kit whose source is committed and whose dirty flag is false. The zip uses deterministic entry timestamps and carries a separate SHA-256 sidecar. Output directories must be new; originals are never overwritten.

The helper scripts refuse incompatible Host versions, mixed Desktop/npm installations, existing initialization roots, occupied npm ports, package file drift and incomplete result reports. They do not kill other processes, copy personal stores, remove credentials, publish npm packages or change dist-tags. Default cache locations used by official npm/pnpm may still be shared; profile isolation is not a claim that system credential stores or all caches are isolated.

## Local tooling validation

Node 22.22.3; portable official PowerShell 7.6.7 on macOS arm64 (download SHA-256 `50dde99bb066adacbb9a748182d09eb9beff25119dc3b12e85c84b6b6b1c5da9`). Eight tooling tests passed: original package integrity, tamper/extra-file refusal, all-74-file installed-copy comparison, false version/client refusal, pending-result refusal, explicit structural/visual boundary, wrong receipt/missing restart refusal, and skipped/anomalous/outside-root evidence refusal. Five PowerShell scripts parsed; ASCII source, BOM-free JSON, environment restoration on exceptions, benign native stderr and failing native exit handling passed the helper smoke. These are test-tool results with synthetic fixtures, not Windows application or UI acceptance. The synthetic fixtures are temporary and are never packaged as acceptance evidence.

The official fixed Windows installer was downloaded again on 2026-10-22: 289313640 bytes, SHA-256 `d61cd8882f8b8a1251144320493ad27920d15139503eba2465b9579eee720cfc`, matching the prior observation. Native Windows Authenticode, actual installed About version, Windows PowerShell 5.1 execution, both real Host forms and every E00-E10 UI item remain pending. The release artifact remains 207328 bytes / 74 files, SHA-256 `ed29647e30a7e7c91d22217fdd810e0d3a1e7f49ca4a1274c5b4486f7b206f60`.

## Promotion boundary

At preparation: `rc=0.2.0-rc.2-openbkn.0.2.0-11`, `latest=0.2.0-rc.2-openbkn.0.2.0-10`. The user has authorized promotion after Windows passes, not before. Keep `latest` unchanged until returned native evidence for both forms is independently reviewed. `Review-Results.mjs` checks only report consistency and references; it cannot validate screenshot truth or authorize promotion. Observed anomalies are retained and block its readiness result for maintainer disposition; do not remove observations to make the script pass. See [kit/PROMOTE-LATEST.md](kit/PROMOTE-LATEST.md).
