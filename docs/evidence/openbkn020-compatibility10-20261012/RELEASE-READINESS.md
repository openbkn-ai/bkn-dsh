# -10 release readiness

The maintainer authorized Windows evidence intake, PR #89 merge, a main-branch build-only rehearsal, package reconciliation, npm publication and final `latest` promotion on 2026-10-13. This authorization does not expand the approved minimum acceptance or package scope.

## Accepted input and evidence

| Input | Fixed identity |
|---|---|
| Plugin | `0.2.0-rc.2-openbkn.0.2.0-10` |
| Accepted source | `9a35c0d9d1263b5f39b24d596f07dbcedbf25d04` |
| Build-only CI | [38209375894](https://github.com/openbkn-ai/bkn-dsh/actions/runs/38209375894) |
| Accepted tgz | 188215 bytes; 70 files; SHA-256 `a91adc9e342faa4f763d73487cd56d2f4ead8bb21bf755ca11426f77d90c9bae` |
| SDK source build | `release/0.2.0`, commit `c404354793146edab944b7e5a79908bf41ddd591`; 212707 bytes; SHA-256 `7391c658e831b9f11bc36fd7fcecfa30e41ecc4123a005bfee811e44b60eb43c` |
| Host | Official DSH `0.2.0-rc.2`, Mac/Windows Desktop and npm |
| Live backend | `0.2.0-release.20261011115044.sha06c5a87`; actual EE variants/digests are archived in the Mac results |
| Windows source snapshot | `af4e564fbc4c831a9ef81e563891beb568390e92`, proof against `5b7aeb98305e13cc68addb02faf5de3187f8de9f` |

[Mac results](mac-minimal/RESULTS.md) and [Windows results](windows-minimal/RESULTS.md) document the accepted scope. Mac evidence remains unchanged. Windows evidence was cherry-picked without changing its 64 directory files; only the repository attributes were combined with the existing Mac preservation rules. The Windows proof covers the 63 files present before the separately committed proof itself. Independent Git-blob recalculation matched all 63 declared byte counts and hashes; 61 files have Windows local-source comparison records and two were authored in its worktree. The Mac reviewer cannot independently reread the Windows filesystem.

Both installed forms on each OS matched the accepted 70-file package. UI acceptance covers diagnostic labels, actual product exports, explicit CLI version selection/detection, sign-in and listing. One native boundary probe per OS used the real CLI, credentials, MCP, reader and official tool runtime with constructed Agent/storage shells; it is not a full UI/model conversation. Controlled navigation/Trace branches are distinguished from live observations. Read-only provenance calls returned empty results; this is not evidence of a complete non-empty receipt chain.

The 2026-10-13 release preflight confirmed the pinned DSH tag at `639ed015397290b3745d163aafe02ffee4aa3f84`, SDK release branch at the accepted `c404354793146edab944b7e5a79908bf41ddd591`, and the unchanged live backend health version above. Official SDK npm `latest` was still 0.1.5. Foundry's `release/0.2.0` source had advanced to `a33e72f2525cc08ffac3a90ae5768c596a498e9c` through seven audit/deployment/documentation follow-ups; this was not deployed or accepted by this plugin release. The acceptance claim remains bound to the actual recorded platform and schemas, without upgrading pins or claiming the newer upstream HEAD was tested.

Windows selected-file/PATH summaries are identical across its recorded samples: 1157 file records, with environment variable **names**, not all values, hashed. Its after sample is at 16:23:40Z; final owned-Host stop records complete at 16:24:23Z. These are distinct observation times. Three owned Host records have PID/creation/executable/listener checks, original stop output and exit zero. Ten UTF-16 files were decoded for the additional credential scan. The attributes exception applies only to this evidence directory and preserves native CRLF/UTF-16 bytes.

## Retained limits

- The SDK was built from the fixed source by another session and explicitly authorized by the user. Local CLI recognition does not prove registry availability or plugin automatic installation from npm.
- Real large-network navigation, natural Trace disablement, fresh 0.1.5 real-host acceptance, model/G6 and non-empty receipt-chain acceptance were outside the user-approved minimum; controlled/source coverage remains separately recorded.
- Historical B1 has no confirmed cause or fix. A short same-owner synchronization check passed; an eight-hour run or natural-expiry recovery is not claimed and is not added as a recurring gate.
- Windows Desktop closed the panel when initiating CLI login; browser authorization succeeded and reopening showed networks. The progress-display observation is retained without assigning a plugin/Host cause or changing this package.
- Mac's initial copied-token test method caused refresh-token reuse/revocation before independent authorization. Selected daily-file equality does not prove unchanged server-side grants. The report retains this deviation; Windows used three independent stores without token copying.
- DSH, platform issues, localization and unrelated P2/P3 remain outside -10. The upstream nullable Schema issue stays separate as Foundry #2106.

## Remaining publication gates

PR #89 must merge through the existing review process. Run `release-plugin.yml` with `publish=false` on that exact main commit, then compare its unpacked paths, modes, links and file bytes with the accepted CI candidate. No package-source change is authorized after acceptance. A gzip-byte difference alone is not a payload difference; any actual payload difference must be resolved before tagging.

Only after that gate passes may the version tag publish via OIDC under `rc`. Fetch the public package, verify registry integrity and compare its complete contents with the accepted candidate. Any `package.json` normalization is permitted only after proving deep equality, without dropping fields. Reconcile the GitHub Release asset and tag/source identity, then promote `latest` last and verify it independently from the public registry.

The main/public reconciliation JSON, workflow identities, public digest and final tag status will be attached to the GitHub Release as publication evidence. This pre-merge document does not claim those later steps have already executed.
