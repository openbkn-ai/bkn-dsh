# Windows -13 文案最小复核（可直接转发）

请只复核 **-12 → -13 的一处溯源说明漏译**，覆盖已验收的官方 DSH **0.2.0-rc.2 Desktop 与 npm/Web**。本轮不重装宿主、不重新登录、不新发业务问题、不跑 D1–D4 / E00–E10 / G6、不调查 runner 或 Ctrl+C、不再补 A7。**禁止 npm publish、任何 dist-tag、生产 v* tag；通过后也只回传。预期 rc=-11、latest=-10。**

## 下载与身份

- [windows-english13-copy-v1.zip](https://github.com/openbkn-ai/bkn-dsh/releases/download/review-english13-20261023/windows-english13-copy-v1.zip)
- [ZIP SHA-256](https://github.com/openbkn-ai/bkn-dsh/releases/download/review-english13-20261023/windows-english13-copy-v1.zip.sha256)
- 插件固定为 `0.2.0-rc.2-openbkn.0.2.0-13`。CI 来源、源码提交及内嵌 tgz 摘要见包内 `pins.json`；逐文件身份由 `package-files.json` 校验，共 74 文件。它是新的 CI 候选，不是 npm 上的 -11，也不是旧 -12。
- 保留原 english11-return.zip、english12-delta-return.zip、A7 补证包和旧报告，不覆盖、不重新标 PASS。本轮仅产生新的 copy 结果。

将 ZIP 解压到新的工具目录，在解压后的 `windows-english13-copy-v1` 中执行。回传材料放在包目录外，避免工具完整性检查失败。

```powershell
Get-FileHash -Algorithm SHA256 C:\bkn-verify\windows-english13-copy-v1.zip
node .\verify.mjs kit .
npm.cmd view @openbkn/dsh-business-context dist-tags --json --registry https://registry.npmjs.org
```

## 安装一次、每形态只看一处

沿用原来的隔离 TestRoot `C:\bkn-verify\english12-desktop` 和 `C:\bkn-verify\english12-npm`，保留其登录、CA、配置、会话及 Electron 用户目录。先正常退出这两个测试宿主；不要启动或停止个人实例。若 root 已移动、宿主/CLI/平台有变化、原完成回合不可用或出现登录页，记录差异并停止该项，回传 BLOCKED，不自行重建环境或扩大测试。

只使用本包脚本；旧 -12 脚本绑定旧包身份，不适用于 -13。以下升级保留原 `english12-state.json`，另写 `english13-state.json`；不要把后者改回 -12，也不要直接重跑旧 kit。

Desktop：

```powershell
.\Upgrade-From12.ps1 -TestRoot C:\bkn-verify\english12-desktop
.\Start-Host.ps1 -TestRoot C:\bkn-verify\english12-desktop
.\Collect-Receipt.ps1 -TestRoot C:\bkn-verify\english12-desktop -Phase copy13
```

等 Desktop 界面实际出现后再收集回执。打开 -12 时已经完成的原会话/原回合，进入“查看业务溯源”→“执行溯源”，查看“平台执行事实”下的说明。中文应完整显示：

> 平台口径的操作状态、耗时与请求 / 追踪 / 回执引用。

截一张能看清该句的局部图，然后关闭浮层→在宿主设置切 English→重开同一回合的同一位置，截一张英文局部图。英文应为原有句子：

> Operation status, duration, and Request / Trace / Receipt references recorded by the platform.

npm/Web：

```powershell
.\Upgrade-From12.ps1 -TestRoot C:\bkn-verify\english12-npm
.\Start-PrivateWebConsole.ps1 -TestRoot C:\bkn-verify\english12-npm
.\Collect-Receipt.ps1 -TestRoot C:\bkn-verify\english12-npm -Phase copy13
```

在独立私有终端本地打开启动地址；不要让自动化读取/截屏这个终端，不用转录、重定向或 Tee-Object。等 Web 界面实际就绪后收集回执。复用原完成回合，按同样方式检查并各留一张中英文局部图；可关闭浮层切语言后重开，不要求双客户端或保持面板打开。无需观察复杂状态保留、请求计数或重做整套即时切换。最后将各测试宿主恢复到本轮开始时的语言即可，不另截恢复图。

每形态只需：**一套当前 Host/package 回执（74 文件匹配），同一处中文图 + 英文图，实际 PASS/FAIL/BLOCKED。** 看不到该说明时记 BLOCKED，不新提问找数据。只判断插件这条说明，不把原始工具名、ID、平台值或模型回答中的英文判成漏译。

## 退出与回传

每形态正常退出；若仍残留，使用本轮新回执按身份停止对应测试树，不调查 Ctrl+C 原因，不批量杀 Node：

```powershell
.\Stop-Host.ps1 -TestRoot C:\bkn-verify\english12-desktop -HostReceipt C:\bkn-verify\english12-desktop\evidence\copy13-host.json
.\Stop-Host.ps1 -TestRoot C:\bkn-verify\english12-npm -HostReceipt C:\bkn-verify\english12-npm\evidence\copy13-host.json
npm.cmd view @openbkn/dsh-business-context dist-tags --json --registry https://registry.npmjs.org
```

先将 `COPY-RESULTS.template.zh.md` 复制到新的 `C:\bkn-verify\english13-copy-return\COPY-RESULTS.md`，填写实际结果及相对证据路径。只收本轮两形态各一套 Host 与其引用的 package 回执、共四张局部图、两份本轮 cleanup 回执、前后 npm 标签。本轮未测的旧功能标“沿用 -12 基线”，不能写本轮 PASS；不运行旧 Review-Results.mjs。

A7 记为“已定位 npm/Web 事件属于预期重复 start 守卫拒绝，原 error 保留，dispatch=unknown”，无需再取证或触发。runner / Ctrl+C 继续作为已知问题，缺条数/非空图仍沿用 BLOCKED。

用新的 `english13-copy-return.zip` 回传实际文件数、SHA-256 及维护端可访问的本机共享路径/私密链接。提交前检查截图及 JSON；不包含 token、授权 URL、设备码、cookies、private、bkn-config、完整会话或 DSH_HOME。不要自动上传公开 release，也不要重新打包原 -11/-12/A7 原件。全部通过仍不发布、不改 npm 标签。
