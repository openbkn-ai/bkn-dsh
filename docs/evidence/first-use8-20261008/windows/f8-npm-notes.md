# F8 npm (web profile) — UI + CLI uninstall/reinstall, 2026-10-09 20:46-20:53
Tracked user state (7 files): profile cordis.patch.yml, storages/openbkn_workspace_bindings.json, storages/workspace.json,
session-bindings/session-266df4c3…, bkn-config state.json / version-check.json / token.json. Baseline captured WITH the
Host running (lesson from desktop deviation).
## UI path (Host 11712, in-app browser) — PASS
- 插件 -> @openbkn/dsh-business-context v0.2.0-rc.2-openbkn.0.2.0-8, 3 components 运行中 -> 卸载 -> confirm 卸载.
- After remove: 已安装 gone, sidebar OpenBKN button gone; 7/7 SAME; dependency removed; plugin dir removed
  (f8-npm-ui-compare-remove.txt).
- 添加插件 with fixed tgz path -> 已安装 (压缩包); pre-enable 7/7 SAME; 立即启用 -> 3 x 运行中 + sidebar back.
- verify-install 66/66 OK (f8-ui-reinstall). before -> after-enable 7/7 SAME (token.json never changed => no logout).
- profile package.json (host-owned) eef36333 -> 7b889960 (same dependency; byte delta like desktop).
## CLI path — PASS
- Host stopped first. `dsh.cmd plugin --profile web remove @openbkn/dsh-business-context` exit 0 (f8-npm-cli-remove.txt);
  7/7 SAME; deps/plugin dir removed; profile package.json == UI-removed bytes (20743022).
- `dsh.cmd plugin --profile web install <fixed tgz>` exit 0 (f8-npm-cli-install.txt); 7/7 SAME; profile package.json ==
  UI re-enabled bytes (7b889960); verify-install 66/66 OK (f8-cli-reinstall).
- Restart (Host 7564): sidebar entry present; panel reads back 平台地址 https://192.168.50.28 (pending login: token
  expired 20:27).
