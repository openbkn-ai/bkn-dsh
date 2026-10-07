# 发给 Windows agent：原生回答边界 -7 固定复测

请完整读取 [操作交接](windows-kit/HANDOFF.md)，执行新候选的 N0–N6 受影响矩阵。两形态继续用官方 DSH 0.2.0-rc.2，完全卸载重装；无凭据的真实问答项记 not-run，不升级旧版本、不改候选/main、不发布/tag/dist-tag。

本次取消插件终答硬校验、自动纠错和 BOM 固定格式，保留工具数据/模型原生输出与访问治理。**旧六项纠错探针已退休**，新预期是八项 native-output probe。不要看到故意错误的 fixture 答案被交付，就判成插件必须拦截它。

## 固定输入

| 项 | 身份 |
|---|---|
| Kit 内容固定 commit | `141adf7b8e95ffd68ffa06e86616296355560c28` |
| Source / approved PR | `2813f3ad3e175d94ee747a796f638cc8d1f3e712` / [#74](https://github.com/openbkn-ai/bkn-dsh/pull/74) |
| Build-only CI | [37562531405](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37562531405)，publish=false，npm Publish/GitHub Release skipped |
| Version | `0.2.0-rc.2-openbkn.0.2.0-7`，尚未发布 |
| tgz | SHA `3c345ef643589fbf79f4958598d4345544c632feac2a3b4f859403db1125b8f0`，165176 bytes，65 files |
| 本交接 ZIP | SHA `917e821836c4aed64646065e8fe3c72be606782449ef580ba7a5d2f973cbf67e`，215374 bytes，24 kit files |
| CI artifact ZIP | id 11457640383 / SHA `5a542ef9eb61d66fdfddd20f7176e11187cbdcf1ace8cb848dfd77c024319151`。**不是本交接 ZIP** |

[固定 ZIP 下载](https://raw.githubusercontent.com/openbkn-ai/bkn-dsh/141adf7b8e95ffd68ffa06e86616296355560c28/docs/handoff/2026-10-07-native-output/assets/windows-unified7-2813f3a-native-output.zip)；[固定 kit manifest](https://github.com/openbkn-ai/bkn-dsh/blob/141adf7b8e95ffd68ffa06e86616296355560c28/docs/handoff/2026-10-07-native-output/windows-kit/candidate-manifest.json)。不使用 npm @rc、旧 6bbab278/66-file 包或本地重 pack。

```powershell
$NativeDownload = 'C:\bkn-verify\windows-unified7-2813f3a-native-output.zip'
$NativeExtract = 'C:\bkn-verify\native-output-kit-2813f3a'
if ((Test-Path -LiteralPath $NativeDownload) -or (Test-Path -LiteralPath $NativeExtract)) { throw 'Choose fresh download/extract paths; preserve earlier evidence' }
Invoke-WebRequest -UseBasicParsing -Uri 'https://raw.githubusercontent.com/openbkn-ai/bkn-dsh/141adf7b8e95ffd68ffa06e86616296355560c28/docs/handoff/2026-10-07-native-output/assets/windows-unified7-2813f3a-native-output.zip' -OutFile $NativeDownload
if ((Get-Item -LiteralPath $NativeDownload).Length -ne 215374) { throw 'Kit ZIP size differs' }
if ((Get-FileHash -LiteralPath $NativeDownload -Algorithm SHA256).Hash -ne '917e821836c4aed64646065e8fe3c72be606782449ef580ba7a5d2f973cbf67e') { throw 'Kit ZIP SHA differs' }
Expand-Archive -LiteralPath $NativeDownload -DestinationPath $NativeExtract
$NativeKit = Join-Path $NativeExtract 'windows-kit'
# First collect the new selected daily/protected-file before hashes.
# Then read HANDOFF.md and run verify-kit with all streams captured (*>&1).
```

也可从远端取得固定 kit commit，在独立 checkout/worktree 读取该目录；不要重置你现有证据分支。ZIP 是原始交付字节，本地 checkout 则按 kit-files.json 检查全部文件身份。

## 执行与回传重点

1. **开测前**用原 37 项日常/保护文件清单重新采集 before；不得沿用旧 before 充当本轮。
2. 保存 verifier、安装、prepare、probe、cleanup 的原生全流及 exit code；PowerShell `Write-Host` 用 `*>&1`，只有换行的日志不算成功证据。raw Host 日志仍保密。
3. 两形态 65/65 文件、三 row/单一侧栏入口/右上角诊断、真实导出；非法 URL 仍在 configuration 阶段拒绝，恢复后清旧失败。
4. 全新 peer bridge + **8 个具名场景**。prepare.probePackage 必须与实际 --plugin 完全相同；fixture 是受控输出/guard 证据，不是真模型事实证明。
5. 有你自己的隔离授权/模型时才运行原始 BOM 构成/销售订单两题，分别记录 native completion 和独立事实。没有则 not-run，不借用 Mac 凭据。
6. 同清单 after 内容 SHA、全 owned-PID 表/停止身份与全流、端口收态；每份导出原件路径/id/SHA 与 Git 内容口径分别列清。

填写模板，在独立 docs 分支提交/push，回传固定 commit 供主开发复核。此前 helpers 与新 kit 逐字节一致，但新 verifier/候选/探针须原生执行，旧验收不能替代。

## Mac 结果和发布边界

[固定 Mac 结果](https://github.com/openbkn-ai/bkn-dsh/blob/141adf7b8e95ffd68ffa06e86616296355560c28/docs/evidence/model-output-boundary-20261007/RESULTS.md)：5 题原生完成、零插件纠错通知，销售订单 40 行/交期独立核对通过，8 项 fixture 与 16 项 live guard 通过，真实诊断下载 7 项 pass。

**完整 BOM 每个物料题仅交付一级 9 项，全量覆盖未通过**；部分结构口径解释未证实。这些质量缺口照实保留，不恢复插件裁判，不把 native completed 写成事实全对。Windows 先验证新包的接入/输出边界，发布及其余 G6/真实受限账号等门禁仍待后续决定。
