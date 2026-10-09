# F8 desktop — UI + CLI uninstall/reinstall (session 3, 2026-10-09 15:04-15:17)

Snapshot tool: s3-scripts/f8-snapshot.ps1 (paths + SHA only); compare: s3-scripts/f8-compare.mjs.
Tracked user state: profile cordis.patch.yml, storages/openbkn_workspace_bindings.json, storages/workspace.json,
openbkn/session-bindings/*, workspaces/** (empty dir), bkn-config/** (CLI store incl. token.json — hashed only).
cleanup.ps1 NOT used. No setup re-run between steps.

## UI path (native plugin manager) — PASS
- Host 31068. 插件 -> 已安装 @openbkn/dsh-business-context v0.2.0-rc.2-openbkn.0.2.0-8, 3 components 运行中 (f8-ui-1).
- 卸载 -> confirm "卸载后它提供的功能会消失" -> 卸载 (f8-ui-2). After: 已安装 section gone, sidebar OpenBKN entry gone (f8-ui-3).
- Hash chain before(f8-desktop-ui-before.json) -> after-remove (f8-desktop-ui-after-remove.json):
  patch c7626921, workspace bindings 03fb4ecc, session binding 008b60ef, CLI store (state.json, version-check,
  token.json 68bc9524) all SAME => no logout, store untouched. Dependency removed, plugin dir removed.
  DEVIATION (recorded): baseline was captured BEFORE Host start; at 15:04:41 (2 s after Host start, ~3 min before
  uninstall) the Host auto-created a new session in the bound workspace and the plugin wrote
  session-bindings/session-922de6f6-….json and updated storages/workspace.json. mtimes (15:04:41) prove the uninstall
  did not touch them; from after-remove onward the chain is 8/8 SAME.
- Reinstall via 添加插件 with the fixed tgz path (recognised as 压缩包) -> 已安装 (f8-ui-4); pre-enable snapshot
  8/8 SAME vs after-remove; 立即启用 -> 3 components 运行中, sidebar back (f8-ui-5).
- verify-install 66/66, missing/differs/extra empty (f8-ui-reinstall verify JSON in first-use8-evidence-20261008).
- Restart (Host 21200): panel reads back 平台地址 https://192.168.50.28 (pending login only because token expired 07:22)
  (f8-ui-6). Patch unchanged c7626921.
- Note: profile package.json (host-owned manifest, not user patch) bytes 2c3581be (pre) -> 76957e2b (after re-enable);
  same dependency; original bytes were not captured, so the byte delta is unexplained but semantically equivalent.

## CLI path — PASS
- `dsh.cmd plugin --profile desktop remove @openbkn/dsh-business-context` exit 0 (f8-desktop-cli-remove.txt);
  user files 8/8 SAME; dependency + bundle entry removed; profile package.json == UI-removed bytes (34150728).
- `dsh.cmd plugin --profile desktop install <fixed tgz>` exit 0 (f8-desktop-cli-install.txt); user files 8/8 SAME;
  profile package.json == UI re-enabled bytes (76957e2b); verify-install 66/66 OK.
- Host 33376 after CLI reinstall: 3 components 运行中, sidebar entry present (f8-cli-7).
- CLI credentials never logged out; token.json SHA identical across the whole chain.

## 2026-10-10 correction (C1, B1 handoff 8e3707f) — history above kept as written
- before -> after-remove over the union of paths is **6 SAME / 2 DIFF** (storages/workspace.json changed;
  openbkn/session-bindings/session-922de6f6-….json added). "8/8 unchanged across uninstall" is NOT supported.
- The 15:04:41 mtimes are only an ordering clue; the claim "mtimes prove the uninstall did not touch them" is WITHDRAWN.
  Preservation of these two items immediately around the uninstall = insufficient-evidence.
- after-remove -> pre-enable -> after-enable is 8/8 SAME. The 6 originally tracked items (patch, workspace bindings,
  old session binding, CLI store x3) are SAME before -> after-remove. The Desktop CLI round (8/8) stands on its own originals.
