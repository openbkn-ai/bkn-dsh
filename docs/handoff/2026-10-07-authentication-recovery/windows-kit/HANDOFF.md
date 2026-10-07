# Windows：鉴权恢复 + 原生回答边界统一 -7 复测

## 可复制的任务

> 请测试本 kit 锁定的统一 `-7`，源码 `c91fe090e0aac2dc72a4ff1b3d221d72baa432ba`、CI `37570295456`、tgz SHA `fa168d8113e8dd43348ea4751c7e4d297049e2c1ddced9c586e6d3a1f3f0718c`、65 文件。第一步采集日常/保护文件 before 内容哈希，再核验下载与 kit。优先验证 R1 的真实产品登录恢复，并执行 E1 旧回传补正。用官方 Windows Desktop/npm DSH 0.2.0-rc.2 两形态，隔离 home、完全卸载重装，不做旧版本升级。验证诊断正常/非法 URL、原生输出受控探针及用户状态/进程收态。具备你自己的隔离登录与模型时才跑原始两题；否则明确 not-run，不借用 Mac 凭据。插件现在保留模型输出，不再自动纠错或裁决终答；原生 completed 和事实正确分别判定。保留原始症状、工具错误和模型错误。你不是唯一开发者，不回退别人的改动，不改候选/main，不发布/tag/dist-tag。只在证据分支提交脱敏结果，回传固定 commit 供复核。

旧 `6bbab278` / 66 文件候选、旧六项自动纠错探针仅作历史。本次不继承其通过结论，也不重跑未受影响的整个 W0–W12 矩阵。下载说明在交接根 `WINDOWS-NOTICE.md`；执行身份以本目录 `candidate-manifest.json` 为准。**解压后先 Set-Location 到 windows-kit 根目录，再执行以下 Get-Location 示例**，不要在父目录运行。

本轮固定包已在 Mac 官方 Desktop 实测：明确 MCP 401 → 产品 CLI 正常浏览器授权 → 同 Host 恢复（7 检查 pass），无 CA → tls-failed，原配置/真实 CLI 恢复 → 7 检查 pass，四份产品 UI 下载；新包官方 npm 核心 fixture 8/8、live guard 16/16。前一原生输出候选 `2813f3a/3c345ef6` 的五题 native completed 是历史记录：**完整 BOM 仅一级 9 项，全量覆盖未通过；无此物料题夹带无关统计，负向标准未通过；结构口径解释未证实。** 本鉴权修复未重跑真实模型题，也未宣布质量问题已解决。正式发布仍待决定。

## 0. 开始前与身份

先沿用你在 `a6c9459` 的 37 项日常/保护文件清单，采集新的 before 内容哈希；当轮 after 必须同清单，不补造缺失前态。原证据路径为 `docs/handoff/2026-10-07-unified7-final-verification/windows-results/user-state-before.json`。固定旧证据 `09018faeeb476c6f93c4557b35c151f97839a8b1` 在远端 `docs/unified7-final-verification-windows` 分支；先 fetch 此分支并用 git show 固定 SHA 读取原件，勿覆盖旧证据。37 个记录实际 34 个唯一路径，报告两种数量。该清单哈希证明仅限选定文件，不等于整个用户 home 未变。保存 Node、两个 DSH CLI、OpenBKN CLI 的实际版本/路径；Node 使用 DSH 支持的 `^22.19.0 || >=24.0.0`，不能用 Node 23。

所有 PowerShell `Write-Host` 属信息流 6，**使用 `*>&1` 捕获全部流**。上轮只用 `2>&1` 导致部分日志仅有换行，不能继续把这种日志当执行成功证据。Host 启动日志可能含 launch token，仍留私有目录，不直接提交。verifier、安装、prepare、probe、cleanup 的安全原生输出和退出码都要存档；检查实际内容非空。

```powershell
$ErrorActionPreference = 'Stop'
$NativeKit = (Get-Location).Path
$NativeEvidence = 'C:\bkn-verify\authentication-recovery-c91fe09-evidence'
New-Item -ItemType Directory -Force -Path $NativeEvidence | Out-Null
$env:Path = "$env:SystemRoot\System32;$env:Path"
Get-Command tar | Select-Object Source
& (Join-Path $NativeKit 'verify-kit.ps1') *>&1 |
  Tee-Object -FilePath (Join-Path $NativeEvidence 'verify-kit-native.txt')
if (-not $?) { throw 'Kit verification failed' }
# The output must include: version -7, 65 files, CI 37570295456, publish=false.
$NativeManifest = Get-Content -Raw -LiteralPath (Join-Path $NativeKit 'candidate-manifest.json') | ConvertFrom-Json
$NativeTgz = Join-Path $NativeKit $NativeManifest.candidate.artifact.path
$NativeExpected = Get-Content -Raw -LiteralPath (Join-Path $NativeKit 'candidate/candidate-files.json') | ConvertFrom-Json
$env:NODE_EXTRA_CA_CERTS = Join-Path $NativeKit 'certificates/openbkn-dev-ca.pem'
```

原生解析全部 `.ps1` 并存档结果。verifier 是静态检查，不能替代实际 Host 安装/启动；证书只用于已核对身份的测试平台，不改系统信任、不关闭 TLS 校验、浏览器证书警告仍由用户处理。

## 1. 两形态安装与诊断（N0/N1/N2）

复用 Windows 已核验的隔离工具树，选择新的两 root，例如 `C:\bkn-verify\authentication-recovery-c91fe09-desktop` 和 `...-npm`。有旧插件的隔离 profile 先用**该形态 CLI** 执行 `plugin --profile <desktop|web> remove @openbkn/dsh-business-context`，再装固定包；不要删除模型配置、登录凭据或会话。全新 desktop profile 需先由真实应用初始化并正常退出；只选择桌面 CLI 不算桌面验收。npm CLI 禁止管理 desktop profile。

`windows/prepare.ps1`、`run-case.ps1`、`cleanup.ps1` 和状态 helper 与前 kit 逐字节相同（见 `helper-origin.json`）；新 verifier/探针输入仍需 Windows 实测。首次初始化 root 只能含 `dsh-home`，不要在 prepare 前向该 root 写 evidence 等目录。

```powershell
$NativeDesktopRoot = 'C:\bkn-verify\authentication-recovery-c91fe09-desktop'
$NativeNpmRoot = 'C:\bkn-verify\authentication-recovery-c91fe09-npm'
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

没有凭据/模型则 **not-run**，不得造拒绝账号、借 Mac token、把脚本答案记作真实问答。其余 G6 和真实受限账号按独立状态保留；Mac 本轮 16 项 direct ToolRuntime live guard 已完成，不能替代 Windows 本机或受限账号验收。

## 3a. R1：明确 MCP 401 → 产品 CLI 登录 → 恢复（两形态）

先从当前形态的 prepared.json 明确设置 DSH_HOME/BKN_CONFIG_DIR（不能沿用另一形态 prepare 留在 shell 的环境），再完成该形态独立正常授权，`openbkn auth status --json` 确认为本平台 `hasToken=true`；无需模型。保留 store，本轮不复制 Desktop token 到 npm，不删除有效 token 来制造过期。新包仍由 OpenBKN CLI 管理 token，插件只提供明确 401 的恢复入口；此项不是自动续期验收。

在 prepare 完成后创建测试用 fault 目录。此 fixture 仅在 Host 的 CLI `auth token` 返回值上注入公开无效字符串，原授权 store 保持；真实 `auth login <baseUrl>` 成功才清除故障标志。保存原 patch 的字节副本与 SHA，修改仅限隔离 profile 的 `openbkn-business-context.config.cliPath`（保留原 baseUrl/model/workspace 等）。不要把 fixture 设到用户日常 profile。

```powershell
$AuthTestRoot = $NativeDesktopRoot # npm round: explicitly set NativeNpmRoot
$AuthPrepared = Get-Content -Raw -LiteralPath (Join-Path $AuthTestRoot 'evidence/prepared.json') | ConvertFrom-Json
$env:DSH_HOME = $AuthPrepared.dshHome
$env:BKN_CONFIG_DIR = $AuthPrepared.bknConfigDir
# First complete this form's normal real CLI authorization; status must show
# this platform hasToken=true. Do not copy a token from the other form.
# Continue only after that authorized isolated bkn-config exists.
if (-not (Test-Path -LiteralPath $env:BKN_CONFIG_DIR -PathType Container)) { throw 'Authorize this isolated CLI store first' }
$AuthFaultRoot = Join-Path $AuthTestRoot 'auth-fault'
New-Item -ItemType Directory -Path $AuthFaultRoot | Out-Null
# Resolve these from the actual tools; do not substitute an unrelated CLI version.
$AuthCliEntry = 'C:\bkn-verify\diag6-tools\node_modules\@openbkn\bkn-sdk\dist\cli.js'
$AuthNode = (Get-Command node).Source
$env:BKN_AUTH_FIXTURE_CLI_ENTRY = $AuthCliEntry
$env:BKN_AUTH_FIXTURE_ROOT = $AuthFaultRoot
# Fixture enforces BKN_CONFIG_DIR == this TestRoot/bkn-config; do not change it to another form or daily store.
$AuthFixtureJs = Join-Path $NativeKit 'auth/openbkn-auth-fixture.mjs'
$AuthShim = Join-Path $AuthFaultRoot 'openbkn-auth-fixture.cmd'
$AuthCommand = '@"' + $AuthNode + '" "' + $AuthFixtureJs + '" %*' + "`r`n"
[IO.File]::WriteAllText($AuthShim, $AuthCommand, [Text.UTF8Encoding]::new($false))
[IO.File]::WriteAllText((Join-Path $AuthFaultRoot 'reject-token.flag'), 'controlled test fault', [Text.UTF8Encoding]::new($false))
# Set isolated business config cliPath to AuthShim and launch the actual form.
# Do not use run-case to overwrite the authenticated model/profile.
```

1. 重启该形态真实 Host，打开 OpenBKN。诊断 `context-loader / auth-rejected / httpStatus=401`；面板须明确 MCP 401、显示“使用 OpenBKN CLI 登录并同步”，不能只剩未知错误/重试，也不能写“MCP 已连接”。保存 UI 和真实产品导出件。
2. 点击上述产品按钮，完成正常浏览器授权（浏览器安全警告/新密码由用户接管）。Host 调用 CLI 正常 `auth login <baseUrl>`。保留只含步骤/退出码的证据，Token/回调码/启动认证日志不回传。
3. 如授权超时/失败，保留实际 CLI 退出和界面，不把未完成请求写成通过；超时/取消 UX 本轮未改。成功后 fault flag 由 fixture 自动清除，插件同步 CLI token、恢复网络目录和正常诊断；在同一 Host 采集失败/恢复报告，当前失败不残留。不能手工删除 flag 再称产品登录恢复通过；CLI 登录后仍被拒则应保留登录入口并记真实失败。
4. 停止所有本轮 owned PID，按身份核验留下全流；恢复原 patch 的准确字节与 CLI 路径，原件/最终 SHA 分别记录。若需再次启动健康 Host，另列 owned PID 与清理记录。受控 patch 与隔离 credential 改变属于本轮预期，不能写成日常配置被修改。

这次输入的本平台账号只可在获授权的本人隔离环境使用，凭据不入交接/证据；如果没有独立授权则 R1 明确 not-run；不要把脚本 fake login 算真实产品恢复。fixture 是测试工具，不进 tgz；本轮为新输入，Windows 须留原生 Node/PS 运行记录。403/网络/TLS 的分类回归已有源码调用链验证；如做无 CA 控制轮，诊断应 tls-failed，面板不应将其当作 401 登录恢复，恢复 CA 后再清理。

## 3b. E1：旧 Windows 报告补正（不改历史原件）

完整读取 `WINDOWS-OLD-EVIDENCE-REVIEW.md`。在证据分支新增补正章节，逐项处理：

- 旧 `09018fa` 终态有 `dshApps=6`。查当前仍存的 PID/exe/创建时间/实际端口并区分本轮 owned 与他人进程；当前零只能证明当前。两 ticks 差恰为 8 小时，先核对启动器 UTC/local 转换；不得以关闭保护来“修复”清理。
- 旧 37 项哈希只覆盖 A 批，不能延伸到 B；历史停止原生行缺失保持 insufficient-evidence。此次 N6 必须有真实 before/after 与停止全流，不补造过去。
- 旧 npm 问答的 `*` 差异：如本地仍有原始 Markdown/完整 innerHTML，脱敏提交原件、路径/SHA，区分文字/渲染；没有则收窄为原因未证实，不编造 host 结论。
- 旧 F01 属性 operation `08a7669763a9b0b43b64789ca86b02ec` 若平台仍保留，可用本人隔离 CLI independently 核查对应回执；记录命令/目标 operation 与 response。查不到则保留部分闭环，不把 inventory 的一个回执算全图核验。
- 修正文档仍写“无模型/desktop 未执行”的旧状态。未绑定拒绝来自插件，不叫平台硬拒；模型不跨网不等于强制 wrong-kn_id guard。旧 copied token 事件仅写拒绝/重登恢复，根因未知。

N0–N6、R1、E1 分别判定。B3 旧纠错包通过不继承；本轮原生 completed 与事实正确仍分开。

## 4. N6：收态与回传

采集同清单 after 内容 SHA、卸载/重装紧邻 patch SHA（如实际执行）、逐轮所有 owned PID（创建时间、可执行路径、端口归属、停止前身份核验、停止结果原生全流）、最后端口/进程扫描。cleanup 的 skip 不能算已停止；PID 文件在消费前留副本。不得停止用户其他 Host，也不得将控制目录的 mtime 扫描写成内容未变证明。

真实产品导出的 JSON 留存本地绝对路径、报告 id、原始文件 SHA、数量；提交前核对 Git 内容。若 CRLF/LF 归一才一致，明确写“换行归一内容一致”，不要叫字节一致。API 报告与产品下载分列，下载延迟如实留偏差记录。提交前扫描凭据，raw profile/启动日志不回传。

填写 `RESULTS.template.md`，在独立 docs 分支提交/push，给固定 commit 和报告路径。N0–N6、R1、E1 分别判定，不以未测试项填通过。不动 main、不发布、不打 tag、不移动 npm dist-tag。
