# Windows local-30 复验交接

本分支 `handoff/windows-local30-20261022` 只交付已经完成 Mac 本地验证的 **-30** 预验包和 Windows 执行材料，不包含完整开发源码，也不是正式发布或 CI 候选。开始前核对主会话给出的完整 Git 提交 SHA；不要从本分支构建插件，不要取 npm latest 或另一路远端 -11。

## 固定输入

- 候选版本：`0.2.0-rc.2-openbkn.0.2.0-30`
- tgz SHA256：`6d95ff7517dbe409875fd398784fe01049ba26d2b97c43fad65c817d3ea18ee9`
- tgz：231075 字节，82 文件。
- 交接 KIT-FILES.json SHA256：`7f1505eb85b16d2e345f7d6948292d106a1fb9cc35ac6899b30e76f6c64a0a18`，覆盖 23 个执行输入文件。
- `ciRun=null`，`formalAcceptanceEligible=false`；源码基点 933b0ab 加本地修改，不能用该源码基点重建本包。
- 正式平台：`https://192.168.50.129` / 正式 0.2.0，保持不替换，保留数据和配置。

入口：[完整执行任务](WINDOWS-TASK.md)、[验收步骤](docs/handoff/2026-10-22-021-local-30-windows/HANDOFF.md)、[结果模板](docs/handoff/2026-10-22-021-local-30-windows/RESULTS-TEMPLATE.md)。交接目录不可写入运行产物，否则严格清单校验会失败。结果写入新的独占任务目录。

## 首次校验

用系统 Node 24.19.0，在当前仓库根目录的 PowerShell 执行：

```powershell
git rev-parse HEAD
$taskKit=Join-Path (Get-Location) 'docs\handoff\2026-10-22-021-local-30-windows'
$taskExpectedKitSha='7f1505eb85b16d2e345f7d6948292d106a1fb9cc35ac6899b30e76f6c64a0a18'
if((Get-FileHash (Join-Path $taskKit 'KIT-FILES.json') -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskExpectedKitSha){throw 'Kit inventory identity mismatch'}
node (Join-Path $taskKit 'verify-kit.mjs')
if($LASTEXITCODE -ne 0){throw 'Handoff verification failed'}
```

确认 `git rev-parse HEAD` 与主会话回传的完整提交一致后才能继续。Git 属性保持原始字节，Windows autocrlf 不应改写清单输入；不以重新计算预期 SHA 绕过不符。

## 边界

旧交接 `handoff/windows-local27-20261022 / fd87974` 及其结果分支 `results/windows-local27-20261022 / fb77c07` 原样保留；本轮结果只属于 -30。另一路远端 -11 是用户明确排除的独立版本，不采用、不合入、不修改；它的发布/CI 不能作为本轮验收依据。

不得推送、跑 CI、开 PR、打标签、发布、改正式平台或覆盖日常应用。完整模型 G6、Function/run_code、BOM/业务 CSV 仍受 Sandbox 安全前置条件约束；本轮只做合同中安全可测项。CE 非空原生解释、低权限账号等缺口保留 blocked。便携 B1 是只读协议夹具，不是真实模型答案或 G6。

原始业务响应、启动/登录日志、token、密码、设备登录 URL/code 留 Windows 私有目录；按模板回传脱敏结果、原始错误摘要、证据路径/SHA 和受阻原因。当前交接授权不包含结果分支推送。
