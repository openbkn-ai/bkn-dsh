# F7 bad-import variants (desktop) — session 3, 2026-10-09 14:40-15:02

Script: s3-scripts/f7-badimport-root.ps1 (new root per variant; real app initializes profile then exits;
native `dsh plugin --profile desktop install <fixed tgz>`; edit exactly one export target in the INSTALLED
package.json; root bootstrap export "." untouched; relaunch real DeepSeek Harness.exe).
Fixed tgz SHA 6a946030a6152d2899609fac95c66cd246e36cca5a8ce4e5f87ed379cbe706ea verified by script.
Installed identity: <root>\dsh-home\profiles\desktop\node_modules\@openbkn\dsh-business-context
(real directory, LinkType empty — not a symlink/junction).
Base package.json SHA (both roots): 1bb5bfec0267d0255f7b3807683e17e855cbb80a119695bbc9f73cdc76351a99
Only changed file per variant: package.json (copies: f7-badimport-<v>-package.base.json / .variant.json).
Setup logs: f7-badimport-<v>-setup.txt. Host PIDs: f7-badimport-*-host.pid; stops: s3-stop-f7-*.txt.

## Variant B — exports['./business'].default -> ./lib/business.fu8-missing.js : PASS
- root C:\bkn-verify\first-use8-desktop-f7-business; variant package.json SHA
  5525a153fb719359940722f2cf352fc517b72d8d0f00f6a9673b232b62c185df; Host 23240.
- Sidebar entry present (bootstrap alive); panel opens with generic "暂时无法验证…" + 设置/诊断 usable (f7b-business-panel.jpg).
- Diagnostics fa344603: bootstrap-entry pass; business-entry FAIL component/module-resolution-failed
  (entryPresent=true, nextAction "…panel cannot start until the listed stage is fixed"); diagnostics-entry pass.
  Report OpenBKN-diagnostic-20261009T064710448Z-fa344603.json
  SHA 9223fd88f082ad58229c03d1e1f9943859d71c9bd32bb5e52f1d9d6dd0b3f423 (credential scan 0).
- Restored: package.json back to base SHA 1bb5bfec… (byte copy of the captured original).

## Variant D — exports['./diagnostics'].default -> ./lib/diagnostics.fu8-missing.js : PARTIAL (finding for main dev)
- root C:\bkn-verify\first-use8-desktop-f7-diagnostics; variant package.json SHA
  35af8f7b6f82b3d8021158ba4f97f577d2081416b8ff62ed3c1617d0bb9ac6e9; Host 23340.
- Diagnostics explicitly degraded: "诊断服务不可用（诊断入口未随插件启动或连接中断）。请截图或复制此提示发给支持人员。"
  (f7d-diagnostics-unavailable.jpg). No report export possible (expected).
- Business entry IS loaded, but on this fresh (unconfigured) profile:
  * panel shows the generic "暂时无法验证 OpenBKN 连接…" instead of the F0 address form (f7d-noconfig-panel.jpg);
  * 设置 shows "当前无法读取插件设置。请查看诊断，确认配置组件已启用后重试。" and the address input does not accept
    input; 保存并继续 does nothing; patch unchanged ef189a8c… (f7d-noconfig-settings-unreadable.jpg,
    f7d-noconfig-save-ignored.jpg).
  * Root cause (code read, lib/client.js:7100-7124, lib/diagnostics.js:504): the configuration RPC
    getConfiguration/save is served by the DIAGNOSTICS entry; with it missing, configurationPort is undefined.
- Control (same fault root, deliberate patch prewrite baseUrl=https://192.168.50.28 + real cliPath; patch SHA
  d8db193a… = desktop F2 healthy bytes): business reads the config and shows pending-login with
  "使用 OpenBKN CLI 登录并同步" (f7d-prewrite-business-ok.jpg); diagnostics still explicitly unavailable
  (f7d-prewrite-diagnostics-unavailable.jpg). => business logic retained; diagnostics degraded explicitly.
- FINDING: a diagnostics-entry import failure also removes configuration editing (address/cliPath), so a
  first-use user cannot configure the plugin at all, and the business panel's own message is the generic
  "cannot verify connection" rather than pointing at the missing configuration/diagnostics component.
  Spec asks "诊断坏导入业务保留、明确降级": diagnostics degrade is explicit; business is retained for an already
  configured profile but NOT usable for first-use configuration. Main dev to judge design vs defect.
  Platform-dependent business continuation (login/list) not exercised: 192.168.50.28 unreachable at the time
  (local Clash TUN), see s3-npm-state.md.
- Restored: package.json back to base SHA 1bb5bfec…; the prewritten patch is left in this fault root only.

## Observation
- Desktop Host 30928 (F7 restart host) was found already exited at ~14:35 (not stopped by me; s3-stop-30928.txt
  "not running"); likely closed by the user/session. No impact on recorded results.

# npm form (dsh.cmd web, fresh web roots) — 2026-10-09 20:40-20:48 (s3-scripts/f7-badimport-npm-root.ps1)
- Same fixed tgz, same base package.json SHA 1bb5bfec…, installed dir is a real directory (LinkType empty).
- Variant B (root C:\bkn-verify\first-use8-npm-f7-business, port 18517, Host 32804): variant SHA 5525a153…;
  diagnostics 3444c4c7 bootstrap pass / business-entry FAIL component/module-resolution-failed / diagnostics pass;
  panel generic message, 设置/诊断 usable. PASS. Report OpenBKN-diagnostic-npm-f7b-3444c4c7.json SHA 4317a0ae…
  Restored package.json -> 1bb5bfec…
- Variant D (root C:\bkn-verify\first-use8-npm-f7-diagnostics, port 18527, Host 35172): variant SHA 35af8f7b…;
  diagnostics view "诊断入口未随插件启动或连接已中断…" (explicit degrade); 设置 shows "当前无法读取插件设置…" and BOTH
  inputs are disabled=true in the DOM; panel generic "暂时无法验证…". Same PARTIAL finding as desktop (config RPC lives
  in the diagnostics entry). Restored package.json -> 1bb5bfec…
- Both npm fault Hosts stopped identity-checked (s3-stop-f7-npm-*.txt).

## 2026-10-10 wording update (C6, B1 handoff 8e3707f)
- B2 is recorded as a known limitation: the configuration service shares its owner with the diagnostics entry (already
  disclosed on macOS). With the diagnostics export broken, first-time configuration is unavailable; an already-configured
  profile falls back to the business login entry; the full business chain in this fault state was not tested.
