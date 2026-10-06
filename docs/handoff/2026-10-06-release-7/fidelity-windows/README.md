# Windows 统一 -7 受影响复测包

本包交给 Windows agent 执行原生 Desktop/npm 两形态复测。**它是待验收候选，不是发布包。** 同包 macOS 的三道原题、独立 BOM 逐行核对、诊断/配置/隔离和 live guard 已通过；历史失败候选与纠正过程保留在仓库。Windows 本轮验收仍待执行。

| 身份 | 值 |
|---|---|
| 插件 | `@openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-7` |
| 包源码 | `3414bdec3c956cc0d580aebd959ac6f3439bb352` |
| build-only CI | [37478119730](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37478119730)，`publish=false` |
| tgz SHA-256 | `6bbab27876e743032572ddce107fcce09e0d681f87bee19fba8d78180e5a63a8` |
| tgz / 清单 | 177442 bytes，66 个包文件；`candidate/` 内附 JSON/文本逐文件 SHA |
| 宿主 / CLI | 官方 DSH `0.2.0-rc.2`，OpenBKN CLI `0.1.5`；不替换 runtime，不开启 inspector |

仓库交付 commit 只包含交接、证据、helper 和核对器，不是上表的构建源码 commit。使用主 agent 消息给出的 **40 位交付 commit** 固定下载，不用随时移动的 main 或其他版本包替代。

## 获取并核验

先把下面占位 SHA 换成交接消息中的交付 commit。远端分支为 `docs/unified7-fidelity-acceptance`，ZIP 路径为 `docs/handoff/2026-10-06-release-7/assets/windows-unified7-3414bde-fidelity.zip`。`FIDELITY-REMOTE-KIT.json` 在该 commit 的交接根目录，记录 ZIP SHA/大小；不要把 ZIP SHA 与 tgz SHA 混用。

```powershell
$UnifiedDeliveryCommit = 'REPLACE_WITH_40_HEX_DELIVERY_COMMIT'
if ($UnifiedDeliveryCommit -notmatch '^[0-9a-f]{40}$') { throw 'Set the fixed delivery commit from the handoff message' }
$UnifiedRemoteBase = "https://raw.githubusercontent.com/openbkn-ai/bkn-dsh/$UnifiedDeliveryCommit/docs/handoff/2026-10-06-release-7"
$UnifiedDownloadRoot = Join-Path 'C:\bkn-verify' ('unified7-kit-' + $UnifiedDeliveryCommit.Substring(0, 8))
if (Test-Path -LiteralPath $UnifiedDownloadRoot) { throw 'Choose a fresh download directory; do not overwrite earlier evidence' }
New-Item -ItemType Directory -Path $UnifiedDownloadRoot | Out-Null
$UnifiedDescriptorPath = Join-Path $UnifiedDownloadRoot 'FIDELITY-REMOTE-KIT.json'
Invoke-WebRequest -UseBasicParsing -Uri "$UnifiedRemoteBase/FIDELITY-REMOTE-KIT.json" -OutFile $UnifiedDescriptorPath
$UnifiedDescriptor = Get-Content -Raw -LiteralPath $UnifiedDescriptorPath | ConvertFrom-Json
$UnifiedZip = Join-Path $UnifiedDownloadRoot 'windows-unified7-3414bde-fidelity.zip'
Invoke-WebRequest -UseBasicParsing -Uri "$UnifiedRemoteBase/assets/windows-unified7-3414bde-fidelity.zip" -OutFile $UnifiedZip
if ((Get-FileHash -LiteralPath $UnifiedZip -Algorithm SHA256).Hash -ne $UnifiedDescriptor.archive.sha256) { throw 'ZIP SHA-256 differs' }
if ((Get-Item -LiteralPath $UnifiedZip).Length -ne $UnifiedDescriptor.archive.sizeBytes) { throw 'ZIP size differs' }
$UnifiedKit = Join-Path $UnifiedDownloadRoot 'kit'
Expand-Archive -LiteralPath $UnifiedZip -DestinationPath $UnifiedKit
$env:PATH = "$env:SystemRoot\System32;$env:PATH"
& (Join-Path $UnifiedKit 'verify-kit.ps1') -KitRoot $UnifiedKit
if (-not $?) { throw 'Offline kit verification failed' }
```

也可从同一交付 commit checkout 仓库并使用 `docs/handoff/2026-10-06-release-7/fidelity-windows/` 目录。ZIP 和目录内容相同；完整包不依赖本机私有路径或未推送的文件。静态核验成功只证明身份/完整性；新版 verifier 必须在 Windows 原生 PowerShell 5.1 解析并冒烟，再开始宿主测试。Mac 没有替代这一步。

## 执行与回传

按 [HANDOFF.md](HANDOFF.md) 的顺序执行，填写 [RESULTS.template.md](RESULTS.template.md)。优先 W2b 非法 URL 的两形态产品 JSON，其次 #62/#63 受影响路径与正常/故障/导出/恢复。固定包出现缺陷先回传，不修改包后继续凑通过。

采用完全移除插件后重装，**不要求旧版升级矩阵**。保护用户会话、模型、凭据和无关 patch。没有凭据时登录、真实问答、live guard 和真实来源图均记 not-run；受限账号项按用户决定保持 not-run。真实平台 BOM 超时、历史故障机器启动根因各自保持开放，不据诊断隔离通过推断其根因。

三个启动/清理 helper 原样来自 Windows 已复核的 `54f6669` 结果；BOM-less UTF-8、PID 创建时间、端口当前归属及 PID 复用拒绝已有旧候选原生证据。新候选两形态是否通过仍以本轮回传为准。禁止发布、打 tag、迁移 npm dist-tag 或修改 main。

本次包在 macOS 官方 Desktop 完成三道原题，完整 BOM 已独立逐行核对；详细失败历史仍保留。Windows 必须重新核验当前包；原 -6 及旧 -7 结果不计作本轮通过。F02 是六项无需账号的官方核心 fixture 探针，不能代替 Windows 真实问答或权限验收。
