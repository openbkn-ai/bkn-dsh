# Windows local-30 r2 定向复验

交接分支：`handoff/windows-local30-r2-20261023`。执行前核对主会话提供的完整固定commit，不跟随其他分支或任意tip。此独立分支含交接产物，不含完整开发源码或工作流。

## 固定身份

- 唯一插件 `0.2.0-rc.2-openbkn.0.2.0-30`，231075字节/82文件，SHA256 `6d95ff7517dbe409875fd398784fe01049ba26d2b97c43fad65c817d3ea18ee9`。
- r2 KIT-FILES SHA256：`f340d205a6290c9e9eea9cfaef08561a5a596496bdb75a1e30c43ccd71e0e004`；25项执行输入，另有KIT-FILES自身。
- r2原Desktop helper SHA256：`0e3466f3da61bd2cac8f263c03573ad03206dea7cf20ac58d8f94e433b4943a7`。
- 插件、SDK、Host pins、所有执行脚本与第42轮准备材料一致；只有交接阶段/本轮范围说明更新。原Desktop helper相对743eb4a只修两处argv括号。
- 这仍是local-development-preacceptance，ciRun=null，formalAcceptanceEligible=false；不重建、不换包，不采用远端-11。

## 本轮执行范围

按[完整任务](WINDOWS-TASK.md)及[r2定向复验](docs/handoff/2026-10-23-021-local-30-windows-r2/FOLLOWUP.md)执行，使用[本轮结果模板](docs/handoff/2026-10-23-021-local-30-windows-r2/RESULTS-TEMPLATE.md)。A/B初始化、正常原helper启动和runner取证优先；只做一次公共PowerShell5.1 argv回归，每个Desktop一次正常成功登录，不重跑完整UI/B1矩阵。需要同轮npm对照时最多选择C/D之一，说明触发理由。

HANDOFF中的完整矩阵为背景，不能扩大当前任务。已通过和原失败仍属于743eb4a的原条件；不得重写，也不能把补丁launcher结果转记原版helper通过。根README/WINDOWS-TASK的本轮范围优先。

## 首次校验

系统任务Node固定24.19.0，Desktop内置Node独立记录。当前仓库根目录PowerShell执行：

```powershell
$taskKit=Join-Path (Get-Location) 'docs\handoff\2026-10-23-021-local-30-windows-r2'
if((Get-FileHash (Join-Path $taskKit 'KIT-FILES.json') -Algorithm SHA256).Hash.ToLowerInvariant() -ne 'f340d205a6290c9e9eea9cfaef08561a5a596496bdb75a1e30c43ccd71e0e004'){throw 'Kit identity mismatch'}
node (Join-Path $taskKit 'verify-kit.mjs')
if($LASTEXITCODE -ne 0){throw 'Kit/candidate verification failed'}
powershell.exe -NoLogo -NoProfile -File (Join-Path $taskKit 'test-desktop-launcher-argv.ps1') -Launcher (Join-Path $taskKit 'start-owned-desktop.ps1') -NodeExe (Get-Command node.exe).Source
if($LASTEXITCODE -ne 0){throw 'Windows5.1 argv regression failed'}
```

所有结果/临时文件写到kit外的新任务目录，不能改冻结输入重算摘要绕过。保留旧743eb4a/-30和更早fd87974/-27输入与证据。另一路-11独立，不采用、不合入、不修改。

正式0.2.0及数据配置保持，唯一平台https://192.168.50.129。不推送、不跑CI、不创建PR/标签/发布或部署；不改浏览器信任、证书例外、默认浏览器、日常安装和全局环境。原始证据留Windows私有目录，回传脱敏报告与完整摘要；没有结果推送授权。
