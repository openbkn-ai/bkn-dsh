# Windows：统一 -7 固定 CI 包复测

## 可直接复制的任务

> 请按本交接验证统一 `0.2.0-rc.2-openbkn.0.2.0-7` CI 包。先取得本目录说明的固定 ZIP，核验 ZIP SHA、verify-kit 和 tgz 逐文件身份。在 Windows 原生官方 Desktop 0.2.0-rc.2 与官方 npm DSH 0.2.0-rc.2 两形态，使用新的隔离 root，完全移除旧插件后安装本轮固定包。按下表完成无需登录的受影响复测，取得产品导出的 JSON，并核对用户状态与进程清理。原 -6 结果只作历史，不计入本轮通过。没有真实账号时，把登录/真实来源图/问答/live guard 写为 not-run，不造 Token、不借模型答案证明 guard。不做旧版本到 -7 就地升级，不改候选或 main，不发布、不打 tag、不移动 dist-tag。只允许调整测试 helper 的路径/语法偏差并留 diff；你不是唯一开发者，不回退其他人的修改。交回脱敏证据与异常清单，等待主开发复核。

固定源和 CI：main `3414bdec3c956cc0d580aebd959ac6f3439bb352`，run **37478119730**，`release-plugin.yml` / `publish=false`。完整 tgz/ZIP SHA 和下载方法见同目录 `README.md`、交接根目录的 `FIDELITY-REMOTE-KIT.json`；`candidate-manifest.json` 的 tgz SHA 是开测前的唯一包身份。不要用 npm `@rc`（当前是 -4），不要用旧 e972d31 CI7 或三题局部包。

## 环境与准备

继续使用 Windows 已核验的 `C:\bkn-verify` 工具树和 CLI 0.1.5，记录实际路径与版本。**新建** `unified7-fidelity-desktop`、`unified7-fidelity-npm` 两 root，不覆盖已有 diag6 证据。桌面必须是实际 `.exe`；npm 使用其 `.cmd` shim。不使用 WSL、patched Host、inspector；不设置全局 `setx`，不复制日常凭据。

本包 `windows/prepare.ps1`、`run-case.ps1`、`cleanup.ps1` 来自 Windows `54f6669` 的 `helpers-fixed/`，已修正首次初始化、UTF-8 BOM 和 PID 复用；`collect-state-hashes.ps1` 沿用原已测试脚本。`verify-kit.ps1` 的候选身份随本轮更新，并移除了旧升级基包依赖，仍需在 Windows 原生 PowerShell 先解析及执行。

```powershell
$UnifiedKit = (Get-Location).Path
# Use native System32 tar, not a Git/MSYS tar selected earlier on PATH.
# This changes only the current test shell, not the machine's persisted PATH.
$env:Path = "$env:SystemRoot\System32;$env:Path"
Get-Command tar | Select-Object Source
& (Join-Path $UnifiedKit 'verify-kit.ps1')
if (-not $?) { throw 'Kit verification failed' }
$UnifiedManifest = Get-Content -Raw -LiteralPath (Join-Path $UnifiedKit 'candidate-manifest.json') | ConvertFrom-Json
$UnifiedTgz = Join-Path $UnifiedKit $UnifiedManifest.candidate.artifact.path
$UnifiedDesktopRoot = 'C:\bkn-verify\unified7-fidelity-desktop'
$UnifiedNpmRoot = 'C:\bkn-verify\unified7-fidelity-npm'
$env:DSH_HOME = Join-Path $UnifiedNpmRoot 'dsh-home'
$env:BKN_CONFIG_DIR = Join-Path $UnifiedNpmRoot 'bkn-config'
# Replace these two paths with the EXISTING isolated tools recorded by Windows.
$UnifiedNpmCli = 'C:\bkn-verify\diag6-tools\node_modules\.bin\dsh.cmd'
$UnifiedBknCli = 'C:\bkn-verify\diag6-tools\node_modules\.bin\openbkn.cmd'
foreach ($UnifiedCli in @($UnifiedNpmCli, $UnifiedBknCli)) {
  if (-not (Test-Path -LiteralPath $UnifiedCli -PathType Leaf)) { throw "Set the actual isolated CLI path: $UnifiedCli" }
  & $UnifiedCli --version
  if ($LASTEXITCODE -ne 0) { throw 'CLI version failed' }
}
$env:NODE_EXTRA_CA_CERTS = Join-Path $UnifiedKit 'certificates/openbkn-dev-ca.pem'
```

Desktop：已验证官方 CLI 不接受从未由应用初始化的 desktop profile。先确认用户 Desktop 已正常关闭；从本 shell 设置 `$env:DSH_HOME=Join-Path $UnifiedDesktopRoot 'dsh-home'` 和 `$env:BKN_CONFIG_DIR=Join-Path $UnifiedDesktopRoot 'bkn-config'`，仅启动官方 Desktop 初始化本测试 profile，再正常退出。该 root 在 prepare 前只能含 `dsh-home`。随后：

```powershell
& (Join-Path $UnifiedKit 'windows/prepare.ps1') -TestRoot $UnifiedDesktopRoot -Form desktop -CandidateTgz $UnifiedTgz
if (-not $?) { throw 'Desktop preparation failed' }
& (Join-Path $UnifiedKit 'windows/prepare.ps1') -TestRoot $UnifiedNpmRoot -Form npm -CandidateTgz $UnifiedTgz -NpmDshCli $UnifiedNpmCli
if (-not $?) { throw 'npm preparation failed' }
```

若同名 root 已有旧测试内容，选择新的 root；不要删整个目录后覆盖。若主动选择复用本轮旧 profile，先用该形态 CLI 执行 `plugin --profile <prepared.profile> remove @openbkn/dsh-business-context`、核对三个 row 都消失，再安装本轮包；这是卸载重装，不作升级测试。保留正常用户模型、CLI 凭据、会话与无关 patch。

每场景先运行状态哈希采集，再运行 setup。示例为 npm；Desktop 把 root/form 改为对应值：

```powershell
$UnifiedRoot = $UnifiedNpmRoot
$UnifiedForm = 'npm'
$env:BKN_CONFIG_DIR = Join-Path $UnifiedRoot 'bkn-config'
& (Join-Path $UnifiedKit 'windows/collect-state-hashes.ps1') -TestRoot $UnifiedRoot |
  Set-Content -Encoding utf8 (Join-Path $UnifiedRoot 'evidence/before-W1.json')
& (Join-Path $UnifiedKit 'windows/run-case.ps1') -TestRoot $UnifiedRoot -CaseId W1 -Form $UnifiedForm -CandidateTgz $UnifiedTgz -PlatformBaseUrl 'https://192.168.50.28' -CliPath $UnifiedBknCli -Port 18267
if (-not $?) { throw 'Case setup failed' }
# OpenBKN -> top-right 诊断 -> 导出诊断报告; verify the saved file.
& (Join-Path $UnifiedKit 'windows/cleanup.ps1') -TestRoot $UnifiedRoot -CandidateTgz $UnifiedTgz
if (-not $?) { throw 'Cleanup failed' }
```

证书只适用于已核对身份的测试平台；不改系统信任库、不禁用 TLS 校验、不绕过浏览器证书警告。npm raw 启动日志可能含本机访问 Token，留在 private/，禁止回传。新 helper 记录 PID+创建时间，并校验当前端口监听归属；有 skip 日志必须查证真实残留，不能把 skip 当成成功清理。

## 本轮矩阵（Desktop/npm 各一列）

| ID | 操作 | 通过标准 / 证据 |
|---|---|---|
| W0 | 安装同一固定 CI tgz，确认真实安装目录与新 Host | 版本一致，66 个文件全部匹配；进程/CLI/profile 对应正确，未开 inspector。静态核验与实际加载分列 |
| R1/W1 | 合法 baseUrl，未登录打开 OpenBKN 和诊断 | 三 row 各一、侧栏仅一个入口、右上角仅“诊断”；business/bootstrap/diagnostics 加载 pass；显示正常登录入口。无凭据时不要求 Context Loader / 目录全绿 |
| W2a | `-CaseId W2`（缺 baseUrl） | `business-entry fail/configuration-invalid`、`configField=baseUrl`；诊断可打开和导出 |
| W2b | cleanup 后用 `-CaseId W1 -PlatformBaseUrl 'ht!tp://not a valid url with spaces'` | 同 W2a，**必须在 configuration 阶段拦截**；不能是 context-loader 下游 network fail。导出另命名 W2b；复制/区分本次 setup 记录，别覆盖 W1 正常证据 |
| W2c | 分别 `file:///C:/bkn-test` 和 `relative/path`；其后恢复合法 URL | 非 HTTP(S)/相对值同样拒绝；恢复后 business 加载成功且旧 failure 不作为当前失败。标明这是重启配置恢复，不能冒充同进程在线恢复 |
| W3 | `-CaseId W3` 业务坏导入 | 基包不变，记录变体 SHA 与入口文件差异；OpenBKN 外框和诊断保留，`business-entry fail/module-resolution-failed`；未知连接提示引导诊断而非无依据检查 Token |
| W4 | `-CaseId W4` 初始化失败 | 独立诊断保留、初始化分类准确；撤销故障恢复 |
| W10 | `-CaseId W10` 诊断坏导入 | 业务面板仍可用；明确诊断不可用。此降级态无导出按钮时只报 UI 证据，不编造 JSON |
| W9 | 不用真实凭据，沿用旧 Windows canary 流程 | JSON 不出现 canary、配置值或私有路径；至少核对短凭据/别名用例开发覆盖是否仍仅为开发证据，不用 raw 会话替代产品报告 |
| H01 | 核对报告 hostForm 与真实目标 | 普通 Node 无形态证明时报告 unknown 可接受；Node 存在不能单独证明 npm。真实形态另用 exe/CLI/profile 佐证 |
| R9 | 整包 remove -> 新 Host 确认 -> 重装本候选 | 本包三 row/UI 消失，用户会话/无关 patch 保留；重新安装后三 row 各一。不要加入 -4/-5/-6 升级 |
| F02（无需账号） | 跑下节六项官方 npm 核心 fixture 探针 | 6 项明确 pass，保留 native turn/end；这不是真实模型/平台验收 |
| F01（需登录） | 授权业务图至少两个元素 | Trace ref_type/ref_id 与每元素来源一致；未披露/未知不猜测。无账号记 not-run；模拟 fixture 不作真实来源证明 |
| G6 / live guard（需登录） | 同一包、真实网络/模型或确定性 ToolRuntime | 无凭据均 not-run。有凭据先通知用户再按原题及独立 oracle 复测；未被要求时不新增费用/平台更改 |

W2b 是 Windows 原 -6 的已复现缺陷，必须有本轮两形态导出 JSON；其他项证据等级照实记录。每个故障撤销后记录 Host 停止、端口释放、新安装逐文件一致。测试工具的评分器/CLI 单元通过不计为真实 G6/guard。

## 回传

填写 `RESULTS.template.md`，每形态列：完整包身份、原始症状、实际状态/code/evidence、JSON 报告 id/绝对下载路径/SHA、退出码、判定和限制。用户状态写明确选定文件及内容 SHA；mtime 扫描只能说明未发现 mtime 变化，不能证明内容不变。不要写“全部通过”覆盖 not-run。

报告可沿用已授权的独立 docs 分支提交并推送，给出 commit 和可读路径，不动 main/release；只包含脱敏证据。发现插件缺陷先回传，不改固定包继续凑通过。平台 #2029、受限账号缺失、历史设置向导/启动根因分别保持开放。

## F02：无需账号的回答一致性受控运行时验证

此项使用官方 npm DSH 的核心库和固定 CI 包的文件副本，模型/工具均为 fixture，不读取 CLI 凭据或平台数据。它不是原生 Desktop 实际问答、G6 或平台权限验收。

```powershell
$FidelityNpmDshPackage = 'C:\bkn-verify\diag6-tools\node_modules\@deepseek-ai\dsh'
$FidelityInstalledPackage = Join-Path $UnifiedNpmRoot 'dsh-home/profiles/web/node_modules/@openbkn/dsh-business-context'
$FidelityProbeWork = Join-Path $UnifiedNpmRoot 'fidelity-standalone-probe'
# New work directory only; do not reuse or modify the installed package.
node (Join-Path $UnifiedKit 'probe/prepare-fidelity-probe.mjs') --runtime $FidelityNpmDshPackage --plugin $FidelityInstalledPackage --work $FidelityProbeWork --files (Join-Path $UnifiedKit 'candidate/candidate-files.json')
if ($LASTEXITCODE -ne 0) { throw 'Controlled probe preparation failed' }
$FidelityOutput = @(node (Join-Path $UnifiedKit 'probe/tests/probes/answer-fidelity-runtime.probe.mjs') --runtime $FidelityNpmDshPackage --plugin (Join-Path $FidelityProbeWork 'package'))
if ($LASTEXITCODE -ne 0) { throw 'Controlled runtime probe failed' }
[IO.File]::WriteAllText((Join-Path $UnifiedNpmRoot 'evidence/fidelity-runtime.jsonl'), ($FidelityOutput -join "`n") + "`n", (New-Object Text.UTF8Encoding($false)))
$FidelityRows = @(Get-Content (Join-Path $UnifiedNpmRoot 'evidence/fidelity-runtime.jsonl') | ForEach-Object { $_ | ConvertFrom-Json })
$FidelityCases = @($FidelityRows | Where-Object { $_.scenario })
if ($FidelityCases.Count -ne 6 -or @($FidelityCases | Where-Object { $_.passed -ne $true }).Count -ne 0) { throw 'Expected six explicit passing scenarios' }
```

必须分别回传：`corrected-same-turn`（一轮、一次通知、一次数据检索、终态 completed）；`second-mismatch-errors`（一次通知，第二次仍错则 error）；`unbound-unaffected`（零通知）；`full-question-summary-rejected`（完整清单不能只给摘要，真实 human 事件顺序已捕获）。`headerless-cached-reprint`（同一 Interaction 关闭前，一次通知、一次原始取数、一次缓存重印、终态 completed，原缺头结果保留）。`scoped-inventory-cached-repair`（同一 Interaction 关闭前，范围内零记录不能冒充测量零；一次原始取数、一次缓存修复，原不一致结果保留）。保留实际版本、安装文件核验、peer bridge 和 JSONL；Windows junction 与原生 PowerShell 仍须在本机实测。准备失败不算插件通过/失败，记录具体偏差后修 helper。
