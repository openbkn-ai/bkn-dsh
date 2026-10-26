# Maintainer procedure: promote only after Windows acceptance

Authorization: the user requested preparing Windows Desktop and npm/Web acceptance for plugin -11, and moving npm `latest` only after that acceptance passes. This is a conditional authorization; elapsed time, a prepared kit, green tooling checks, or a populated template does not satisfy it.

1. Review the returned native Windows evidence independently. Both official DSH 0.2.0-rc.2 forms must have E00-E10 accepted, with actual locale hot switching, both cold starts, preserved state, and unchanged business content. Run `node Review-Results.mjs <RESULTS.json>` for structural consistency. It does not establish visual truth. No unresolved FAIL/BLOCKED/NOT_RUN item or new anomaly may be silently waived.
2. Verify the installed package receipts: all 74 files match the published package SHA-256 `ed29647e30a7e7c91d22217fdd810e0d3a1e7f49ca4a1274c5b4486f7b206f60`. Check the actual Host/process/profile, not only the package's version string or diagnostic fields that were already unavailable in -10. Review Windows Authenticode/installer provenance and actual About version. Keep existing macOS acceptance and file-for-file published/accepted candidate equivalence as separately recorded evidence in `reference/`.
3. Re-read current registry tags and published tarball integrity, and save the exact raw output with UTC time. Expected starting tags are `latest=-10`, `rc=-11`. If they changed meanwhile, stop and reconcile the current release state. Refresh both upstream release/contract status; do not change pins or deploy anything. A changed platform/Host or modified plugin requires affected re-acceptance, not editing the old report.

```powershell
npm.cmd view @openbkn/dsh-business-context dist-tags --json --registry https://registry.npmjs.org
npm.cmd view @openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-11 dist --json --registry https://registry.npmjs.org
```

4. After review, record who reviewed which immutable evidence archive/digest and when, the pass conclusion, all observed limitations and their dispositions, and the current registry state. Only then use the maintainer's normal npm authentication to move the existing version's tag. Do not re-publish or rebuild the package. Do not distribute maintainer npm credentials with the acceptance kit.

```powershell
npm.cmd dist-tag add @openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-11 latest --registry https://registry.npmjs.org
npm.cmd view @openbkn/dsh-business-context dist-tags --json --prefer-online --registry https://registry.npmjs.org
npm.cmd view @openbkn/dsh-business-context@latest version dist.integrity --json --prefer-online --registry https://registry.npmjs.org
```

5. Confirm `latest` resolves to the full -11 version, `rc` remains -11, and the published integrity/digest is unchanged. Preserve the original command output, any authentication/registry errors (redacted only for secrets), and read-back time. Append the Windows evidence and final tag read-back to the existing -11 release. If promotion fails, report it as failed/pending; do not imply that successful Windows acceptance itself moved `latest`.

No command in the kit's preparation, launch, verification or result-review scripts performs this mutation.
