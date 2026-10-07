# Windows：原生回答边界修正后的统一 -7 复测

## 可复制的任务

> 请测试本 kit 锁定的统一 `-7`，源码 `2813f3ad3e175d94ee747a796f638cc8d1f3e712`、CI `37562531405`、tgz SHA `3c345ef643589fbf79f4958598d4345544c632feac2a3b4f859403db1125b8f0`、65 文件。第一步采集日常/保护文件 before 内容哈希，再核验下载与 kit。用官方 Windows Desktop/npm DSH 0.2.0-rc.2 两形态，隔离 home、完全卸载重装，不做旧版本升级。验证诊断正常/非法 URL、原生输出受控探针及用户状态/进程收态。具备你自己的隔离登录与模型时才跑原始两题；否则明确 not-run，不借用 Mac 凭据。插件现在保留模型输出，不再自动纠错或裁决终答；原生 completed 和事实正确分别判定。保留原始症状、工具错误和模型错误。你不是唯一开发者，不回退别人的改动，不改候选/main，不发布/tag/dist-tag。只在证据分支提交脱敏结果，回传固定 commit 供复核。

旧 `6bbab278` / 66 文件候选、旧六项自动纠错探针仅作历史。本次不继承其通过结论，也不重跑未受影响的整个 W0–W12 矩阵。下载说明在交接根 `WINDOWS-NOTICE.md`；执行身份以本目录 `candidate-manifest.json` 为准。

Mac 已验证新包 5 题原生完成、8 项受控探针、16 项 live guard 与诊断真实下载；**完整 BOM 每个物料题只交付一级 9 项，全量覆盖未通过**，结构口径解释也保留未证实。Windows 可执行本轮接入/输出边界复测，不把这些独立质量缺口写成已解决；正式发布仍待决定。

## 0. 开始前与身份

先沿用你在 `a6c9459` 的 37 项日常/保护文件清单，采集新的 before 内容哈希；当轮 after 必须同清单，不补造缺失前态。原证据路径为 `docs/handoff/2026-10-07-unified7-final-verification/windows-results/user-state-before.json`。该清单哈希证明仅限选定文件，不等于整个用户 home 未变。保存 Node、两个 DSH CLI、OpenBKN CLI 的实际版本/路径；Node 使用 DSH 支持的 `^22.19.0 || >=24.0.0`，不能用 Node 23。

所有 PowerShell `Write-Host` 属信息流 6，**使用 `*>&1` 捕获全部流**。上轮只用 `2>&1` 导致部分日志仅有换行，不能继续把这种日志当执行成功证据。Host 启动日志可能含 launch token，仍留私有目录，不直接提交。verifier、安装、prepare、probe、cleanup 的安全原生输出和退出码都要存档；检查实际内容非空。

```powershell
$ErrorActionPreference = 'Stop'
$NativeKit = (Get-Location).Path
$NativeEvidence = 'C:\bkn-verify\native-output-2813f3a-evidence'
New-Item -ItemType Directory -Force -Path $NativeEvidence | Out-Null
$env:Path = "$env:SystemRoot\System32;$env:Path"
Get-Command tar | Select-Object Source
& (Join-Path $NativeKit 'verify-kit.ps1') *>&1 |
  Tee-Object -FilePath (Join-Path $NativeEvidence 'verify-kit-native.txt')
if (-not $?) { throw 'Kit verification failed' }
# The output must include: version -7, 65 files, CI 37562531405, publish=false.
$NativeManifest = Get-Content -Raw -LiteralPath (Join-Path $NativeKit 'candidate-manifest.json') | ConvertFrom-Json
$NativeTgz = Join-Path $NativeKit $NativeManifest.candidate.artifact.path
$NativeExpected = Get-Content -Raw -LiteralPath (Join-Path $NativeKit 'candidate/candidate-files.json') | ConvertFrom-Json
$env:NODE_EXTRA_CA_CERTS = Join-Path $NativeKit 'certificates/openbkn-dev-ca.pem'
```

原生解析全部 `.ps1` 并存档结果。verifier 是静态检查，不能替代实际 Host 安装/启动；证书只用于已核对身份的测试平台，不改系统信任、不关闭 TLS 校验、浏览器证书警告仍由用户处理。

## 1. 两形态安装与诊断（N0/N1/N2）

复用 Windows 已核验的隔离工具树，选择新的两 root，例如 `C:\bkn-verify\native-output-2813-desktop` 和 `...-npm`。有旧插件的隔离 profile 先用**该形态 CLI** 执行 `plugin --profile <desktop|web> remove @openbkn/dsh-business-context`，再装固定包；不要删除模型配置、登录凭据或会话。全新 desktop profile 需先由真实应用初始化并正常退出；只选择桌面 CLI 不算桌面验收。npm CLI 禁止管理 desktop profile。

`windows/prepare.ps1`、`run-case.ps1`、`cleanup.ps1` 和状态 helper 与前 kit 逐字节相同（见 `helper-origin.json`）；新 verifier/探针输入仍需 Windows 实测。首次初始化 root 只能含 `dsh-home`，不要在 prepare 前向该 root 写 evidence 等目录。

```powershell
$NativeDesktopRoot = 'C:\bkn-verify\native-output-2813-desktop'
$NativeNpmRoot = 'C:\bkn-verify\native-output-2813-npm'
# Replace these with the actual EXISTING isolated official tools, not desktop shims on PATH.
$NativeNpmCli = 'C:\bkn-verify\diag6-tools\node_modules\.bin\dsh.cmd'
$NativeBknCli = 'C:\bkn-verify\diag6-tools\node_modules\.bin\openbkn.cmd'
& (Join-Path $NativeKit 'windows/prepare.ps1') -TestRoot $NativeDesktopRoot -Form desktop -CandidateTgz $NativeTgz *>&1 |
  Tee-Object -FilePath (Join-Path $NativeEvidence 'prepare-desktop.txt')
if (-not $?) { throw 'Desktop preparation failed' }
& (Join-Path $NativeKit 'windows/prepare.ps1') -TestRoot $NativeNpmRoot -Form npm -CandidateTgz $NativeTgz -NpmDshCli $NativeNpmCli *>&1 |
  Tee-Object -FilePath (Join-Path $NativeEvidence 'prepare-npm.txt')
if (-not $?) { throw 'npm preparation failed' }
```

每轮参数、实际 profile/包路径、PID 创建时间与 setup/cleanup 原生输出都记录。`run-case.ps1` 会覆写**测试 patch**，因此需要保护其余配置的已授权登录 profile 应采用现有健康配置手工启动，不能直接拿本 helper 重写。先保存既有 patch 哈希/受控副本，不碰日常 profile。

| 项 | 两形态通过标准与证据 |
|---|---|
| N0 | 固定 tgz SHA/大小、安装后全部 65 文件匹配；missing/diff/extra 为空，版本 -7；实际 Desktop.exe 或官方 npm `dsh web`、profile、端口/创建时间一致，无 inspector。包内已无旧 answer-fidelity 声明/实现 |
| N1 | 合法 baseUrl，三 row 各一，侧栏只一个 OpenBKN 入口；OpenBKN 面板右上角“诊断”正常打开，真实导出报告。未登录时如实记录 login/context 状态，不要求全绿 |
| N2 | 用独立轮 `W1 -PlatformBaseUrl 'ht!tp://not a valid url with spaces'`，业务仍在 configuration 阶段拒绝：`configuration-invalid/configField=baseUrl`，诊断可导出；恢复合法值重启后业务正常、旧失败不作当前失败。记录恢复前后报告，不冒充同进程恢复 |

运行 helper 时记录每条命令退出状态；切换/结束每轮先 cleanup 并检查真实残留。N2 setup/输出单独命名，避免覆盖正常 W1 证据。此范围不新增 W3/W4/W10、升级或广泛认证故障矩阵。

## 2. N3：官方 npm 核心受控探针（无需账号）

对本轮已安装候选的**文件副本**运行，与平台/模型/真实 Desktop 验收分开。全新 work 目录；prepare 输出 `probePackage` 必须与下一条实际 `--plugin` 相同。禁止将旧探针的六项纠错行为作为预期。

```powershell
$NativeRuntime = 'C:\bkn-verify\diag6-tools\node_modules\@deepseek-ai\dsh'
$NativeInstalled = Join-Path $NativeNpmRoot 'dsh-home/profiles/web/node_modules/@openbkn/dsh-business-context'
$NativeProbeWork = Join-Path $NativeNpmRoot ('native-output-probe-' + (Get-Date -Format 'yyyyMMddHHmmss'))
$NativePrepareCommand = @((Join-Path $NativeKit 'probe/prepare-native-probe.mjs'), '--runtime', $NativeRuntime, '--plugin', $NativeInstalled, '--work', $NativeProbeWork, '--files', (Join-Path $NativeKit 'candidate/candidate-files.json'))
node @NativePrepareCommand 1> (Join-Path $NativeEvidence 'probe-prepare-native.json') 2> (Join-Path $NativeEvidence 'probe-prepare-stderr.txt')
$NativePrepareExit = $LASTEXITCODE
if ($NativePrepareExit -ne 0) { throw 'Probe preparation failed' }
$NativePrepared = Get-Content -Raw -LiteralPath (Join-Path $NativeEvidence 'probe-prepare-native.json') | ConvertFrom-Json
if ($NativePrepared.probePackage -ne (Join-Path $NativeProbeWork 'package')) { throw 'Prepared package path differs' }
$NativeProbeCommand = @((Join-Path $NativeKit 'probe/tests/probes/native-output-runtime.probe.mjs'), '--runtime', $NativeRuntime, '--plugin', $NativePrepared.probePackage)
node @NativeProbeCommand 1> (Join-Path $NativeEvidence 'native-output-runtime.jsonl') 2> (Join-Path $NativeEvidence 'probe-stderr.txt')
$NativeProbeExit = $LASTEXITCODE
if ($NativeProbeExit -ne 0) { throw 'Native-output probe failed' }
$NativeCases = @(Get-Content (Join-Path $NativeEvidence 'native-output-runtime.jsonl') | ForEach-Object { $_ | ConvertFrom-Json } | Where-Object { $_.scenario })
foreach ($NativeScenario in $NativeManifest.outputBoundary.requiredFixtureScenarios) {
  $NativeMatch = @($NativeCases | Where-Object { $_.scenario -eq $NativeScenario -and $_.passed -eq $true })
  if ($NativeMatch.Count -ne 1) { throw "Expected explicit passing scenario: $NativeScenario" }
}
if ($NativeCases.Count -ne 8) { throw 'Expected exactly eight scenarios' }
```

另存命令实际 argv、起止时间、两个 exit code、prepare 输出/JSONL SHA 与路径一致性。8 项：`native-answer-no-arbitration`、`headerless-output`、`scientific-notation-structure`、`native-tool-error`、`cross-network-denied`、`before-start-denied`、`excluded-tool-denied`、`unbound-unaffected`。故意错误的答案正常交付仅证明原生输出边界，**不算事实正确**；跨网络/未启动/排除工具必须确实未调度。

PowerShell 5.1 的 `>` / `Tee-Object` 可能保存为 UTF-16LE。保留捕获原件并注明实际编码；需 UTF-8 分析副本时用 `Get-Content` 解码再以 BOM-less UTF-8 写另一文件，另记 SHA。不能把重编码副本称为原始字节输出。上例 PowerShell 的 JSON 读取支持带 BOM 原件。

## 3. N4/N5：真实模型受影响题（有隔离凭据时）

同一固定安装包、全新会话、绑定 `supply_ontology_hand`、记录真实模型和等级，不把旧纠错会话当新样本：

- N4：`382-000005 的 BOM 构成是什么？`
- N5：`列出 382-000005 的销售订单明细。`

检查原生 turn/end、零插件纠错通知、工具字段与错误原样记录；完整脱敏导出工具调用和最终答案。事实单独按 `eval/supply-ontology.yaml` 的原题标准、独立查询数据判断：BOM 结构题不要求库存审计列或固定表头；销售订单物料匹配看字段定义，`product_code` 才是材料编码，不能拿错误字段零行断言无订单。销量数量/状态/单号等须逐项核对，不仅看 completed。平台超时、模型编造或省略照实列出，不修候选来迎合单一答案。

没有凭据/模型则 **not-run**，不得造拒绝账号、借 Mac token、把脚本答案记作真实问答。其余 G6/live guard/真实权限仍沿用各自独立未测状态。

## 4. N6：收态与回传

采集同清单 after 内容 SHA、卸载/重装紧邻 patch SHA（如实际执行）、逐轮所有 owned PID（创建时间、可执行路径、端口归属、停止前身份核验、停止结果原生全流）、最后端口/进程扫描。cleanup 的 skip 不能算已停止；PID 文件在消费前留副本。不得停止用户其他 Host，也不得将控制目录的 mtime 扫描写成内容未变证明。

真实产品导出的 JSON 留存本地绝对路径、报告 id、原始文件 SHA、数量；提交前核对 Git 内容。若 CRLF/LF 归一才一致，明确写“换行归一内容一致”，不要叫字节一致。API 报告与产品下载分列，下载延迟如实留偏差记录。提交前扫描凭据，raw profile/启动日志不回传。

填写 `RESULTS.template.md`，在独立 docs 分支提交/push，给固定 commit 和报告路径。N0–N6 分别判定，不以未测试项填通过。不动 main、不发布、不打 tag、不移动 npm dist-tag。
