U1 upgrade/regression evidence (npm web form, 2026-10-06):
- baseline -4 (c4a8effb…, CI 37202050194) install: OK; sidebar 1 OpenBKN entry; panel NO 诊断 button (-4 predates diagnostics UI)
- -4 + ID-only canary patch (baseUrl https://canary-idonly-a.example.invalid): panel 平台地址 shows canary → applied ✓
- -4 + old name-qualified patch (name: '@openbkn/dsh-business-context', canary https://canary-namequal-b.example.invalid): panel shows canary → old assertion matched on -4 ✓
- upgrade to -6 keeping name-qualified patch: override SKIPPED (name assertion mismatch) → panel 无法验证 OpenBKN 连接 (per MIGRATION.md documented behavior) ✓; 诊断 button now present; sidebar 1 entry
- upgrade to -6 + ID-only canary: preserved and applied (panel shows canary) ✓
- migration A (delete name line): canary restored ✓
- migration B (name: '@openbkn/dsh-business-context/business'): canary restored ✓
- duplicate install (-6 over -6, same profile): plugin manager shows 共 3 个 · 3 运行中 (no duplicate rows) ✓
ports 8240-8246 used per round; private logs under diag6-npm/private/u1-*.log (contain access tokens, not returned).
