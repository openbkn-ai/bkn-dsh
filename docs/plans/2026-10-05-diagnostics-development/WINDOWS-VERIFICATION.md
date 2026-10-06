# Windows agent：诊断功能实机验收

## 可直接复制的任务

> 请验收主开发交付的 DIAG-01 固定候选及测试包，先阅读本文件和已填写的 candidate-manifest.json。仅在 Windows 原生普通桌面版和官方 npm DSH 中运行，不用 WSL 或 patched runtime，不开启 inspector。先核对 tgz SHA、源码/工作流身份和真实加载目标；清单未填完或辅助脚本缺失时，回报输入未齐，不用模板占位值开测。在隔离环境完成 W0–W12，真实 Host 故障与模拟/受控协议结果分别标注，不能把静态文件完整当运行正常。只处理本轮进程、profile 和 CLI store，保护原用户凭据与状态。仅回传脱敏报告、逐项结果、版本/包身份、操作/退出码和清理证据；不合并、不发布、不打 tag、不移动 dist-tag，不修改 main/release 或向其他聊天发送消息。你不是唯一开发者，不回退其他人的修改。

## 1. 执行前必须收到的交付物

- 固定候选 `.tgz` 与 SHA-256，完整候选逐文件清单；清单中版本、源码 commit、build-only run、Windows 目标版本已填写。
- 产品报告 schema、D0 已通过的真实 Host 证据、主开发 macOS 结果。
- 可运行的 `windows/prepare.ps1`、`run-case.ps1`、`collect-state-hashes.ps1`、`cleanup.ps1`，以及真实 Desktop/npm 入口的启动步骤。
- 各故障场景的准备／复现／撤销方式。需要损坏包文件的场景应提供从同一候选复制而来的**故障变体**，列明基包 SHA、修改文件及前后哈希；不能把故障变体当新候选或修改原 tgz。
- 受影响原功能回归步骤，优先复用 -4 已有 L/R 清单，主开发应随包提供，不能要求测试者从旧聊天猜步骤。

本计划 ZIP 只有文档和模板，**当前不是上述可执行验收包**。脚本参数是约定的交付要求，必须由主开发实现并试跑后再派本任务。

## 2. 固定环境与隔离

1. 记录 Windows/PowerShell、官方桌面版、桌面随附 Node/CLI、npm DSH/Node/pnpm、OpenBKN CLI 和平台服务版本。支持目标是 DSH `0.2.0-rc.2`、pnpm `11.7.0`；优先沿用已验证 Node `24.21.0`，差异只记录，不自行升级。
2. npm 与桌面使用各自正确 CLI。**不能用全局 npm CLI 管理 Desktop 的保留 profile**；桌面安装与启动须由主开发提供已验证的随附 CLI/入口。
3. 新建独立 test root。npm 形态限制 `DSH_HOME`、`BKN_CONFIG_DIR` 在本轮子进程；不使用 `setx`。桌面不能仅凭设置 `DSH_HOME` 假定已隔离，须核对真实 Host command line/profile 和安装结果；不能确认则使用独立测试账户或回报未测，不能触碰原 profile。
4. 保留原用户 DSH 运行状态，不杀其进程。多个 Host 并存时，检查报告命中的目标确实是本轮 Host，且正常用户操作能区分实例；不能静默取第一个 PID。
5. 原用户已选状态文件只做前后 SHA-256，不复制 token.json/credentials，不输出内容。文件名单由用户既有授权或本轮约定确定；五个文件未变不能扩大为整目录未变。
6. Host 不带 `--inspect`，不打开开发者工具替代产品入口；记录验证方式。找不到运行时错误时回报 insufficient-evidence，不能临时开 inspector 把核心门槛改成通过。

## 3. 命令约定

在主开发交付的 Windows 验收包根目录打开独立 PowerShell。准备脚本应校验版本和环境，不自行下载/升级、关闭用户进程或改全局策略。遇到脚本策略阻止，回传提示；不全局放宽执行策略。

```powershell
$DiagKit = (Get-Location).Path
$DiagManifestPath = Join-Path $DiagKit 'candidate-manifest.json'
$DiagManifest = Get-Content -Raw $DiagManifestPath | ConvertFrom-Json
if (-not $DiagManifest.candidate.version -or
    -not $DiagManifest.candidate.sourceCommit -or
    -not $DiagManifest.candidate.build.runId -or
    -not $DiagManifest.candidate.artifact.path -or
    -not $DiagManifest.candidate.artifact.sha256) {
  throw 'Candidate manifest is incomplete; ask main developer for the fixed kit'
}
$DiagTgz = Join-Path $DiagKit $DiagManifest.candidate.artifact.path
$DiagDigest = (Get-FileHash $DiagTgz -Algorithm SHA256).Hash.ToLowerInvariant()
if ($DiagDigest -ne $DiagManifest.candidate.artifact.sha256) {
  throw 'Candidate SHA-256 mismatch'
}
$DiagRoot = 'C:/bkn-verify/diagnostics-v1'
if (Test-Path $DiagRoot) { throw 'Choose a new test root; do not overwrite prior evidence' }
& (Join-Path $DiagKit 'windows/prepare.ps1') -TestRoot $DiagRoot -Manifest $DiagManifestPath
if (-not $?) { throw 'Preparation failed' }
```

`prepare.ps1` 需验证路径在 test root 内并输出本轮目标信息。安装方式由其准备结果给出：npm 使用 `dsh plugin --profile web add <固定tgz>`，桌面使用随附 CLI 的 `plugin --profile desktop add <固定tgz>`。记录退出码、最终 profile/包文件一致性和真实 Host 加载来源；任何交互确认按用户选择记录，不能绕过 npm 年龄或其他安全策略。

场景脚本交付后使用以下约定；不要现在执行不存在的脚本，也不要把未实现参数当成已有接口。

```powershell
& (Join-Path $DiagKit 'windows/run-case.ps1') -TestRoot $DiagRoot -CaseId 'W1' -Form 'desktop'
if (-not $?) { throw 'Case preparation/execution failed; record before continuing' }
& (Join-Path $DiagKit 'windows/run-case.ps1') -TestRoot $DiagRoot -CaseId 'W1' -Form 'npm'
if (-not $?) { throw 'Case preparation/execution failed; record before continuing' }
```

脚本退出成功只证明准备／采集脚本完成，不能替代下表的 UI 人工检查和报告证据。每个场景先撤销上一项故障，再进行下一项；记录预期错误是否实际触发。

## 4. 验收矩阵

除 W0 的包身份核验外，桌面和 npm 各有结果列。开发时的 fixture/模拟 Host 只作开发覆盖；Windows 关键项必须使用真实 DSH Host。所有报告从产品入口生成。

| ID | 场景／最小操作 | 必须取得的证据与通过条件 |
|---|---|---|
| W0 | 正常固定候选安装与目标确认 | tgz SHA/逐文件清单一致；目标形态/profile 正确；诊断对应实际本轮 Host；不开 inspector；安装版本与加载版本的证据分别列出 |
| W1 | 正常启动，打开诊断并导出 | 一次普通用户操作取得 JSON；被动导出不发请求/不刷新 Token；已观察成功步骤与尚未检查项区分；报告编号与面板一致 |
| W2 | 缺 baseUrl；非法格式另一个子项 | 主组件真实校验失败，独立入口可用，取得配置失败类别；不能只有「URL 不合法」静态检查；撤销后恢复且旧失败不冒充当前失败 |
| W3 | 主组件模块解析失败 | 故障变体触发真实 import 错误；独立诊断 Host/UI 不跟着失败，报告模块类别；原候选不变；配置缺失与 import 错误不能混同 |
| W4 | 业务初始化/依赖服务；存储初始化失败分别记录 | 真实 Host 内受控失败，诊断仍可用且类别/阶段对应；平台地址与 Token 不被错误指责；未能构造的子项留未测 |
| W5 | CLI 不可用；首次未登录；平台不匹配 | CLI 路径/启动失败与未登录区分；首次未登录使用空独立 BKN_CONFIG_DIR，不用 logout+auth delete 假装从未登录；报告不包含用户名/平台原地址 |
| W6 | 认证/权限拒绝 | 在真实操作中取得阶段、HTTP 状态及允许的服务端码；受控 HTTP 服务与真实 OpenBKN 拒绝分列；没有受限测试账户/权限时真实拒绝留未测，不借本机 permissive stub 证明权限 |
| W7 | 连接失败、TLS 失败、有限超时分别测试 | 使用隔离端点触发明确错误；不禁用证书检查；总等待有界；后续步骤 not-run；错误分类以观测为准，超时后重试恢复，无残留诊断连接 |
| W8 | MCP 握手失败；目录请求失败 | 两者分别在真实 Host 触发，报告阶段不混同；MCP 成功而目录失败不能写全部连接失败；模拟协议服务与真实平台证据明确区分 |
| W9 | 脱敏与状态保护 | 嵌套 cause、headers、URL、CLI/响应中虚构 canary 均不进导出/UI/新增日志；不可脱敏段明确缺失；不读取或复制真实秘密；前后状态哈希及诊断请求记录符合 passive/active 区分 |
| W10 | 诊断不可用、关闭重开、连续复测、多 Host、导出失败 | 降级显示诊断未完成；不虚构健康；诊断复测能取消且释放本轮资源；过期/并发结果不覆盖新状态；目标明确；导出失败不打印 raw Error |
| W11 | 正常浏览器登录、CLI 0.1.5 兼容与业务回归 | 用户在隔离账户/CLI store 授权后正常列目录；保留 hasToken-only、expired 缺失的解析覆盖（fixture 与实测分列）；按主开发给定原 L/R 步骤回归绑定/工作区/溯源，异常单列 |
| W12 | 升级/重装/卸载及清理 | 从 -4 升到候选不重复 row；诊断与业务入口正确；卸载只清理本包；撤销故障后正常恢复；原用户已选文件哈希、原进程和登录状态按约定核对 |

「真实 Host + 受控 HTTP 服务」可以证明 Host 的分阶段错误处理，不能证明真实 OpenBKN 的权限语义。测试代码/包变体提供的受控初始化异常同样必须注明变体，不能称原候选自身出现了该故障。

优先执行 W0–W4：这决定完整诊断方案是否成立。若核心入口失败，回报事实并保留证据；其余独立检查可继续，但不能将整项判通过。浏览器授权需用户实际操作，不替用户使用原账户登出或改 Token。

## 5. 清理与回传

在隔离测试环境撤销故障、停止仅本轮创建的进程、卸载隔离候选；若测试产生临时登录，使用本轮 BKN_CONFIG_DIR 登出。不结束原用户 DSH，不清空其 profile 或登录。不直接删除 test root，保留脱敏证据；秘密不得成为备份/回传材料。

```powershell
& (Join-Path $DiagKit 'windows/cleanup.ps1') -TestRoot $DiagRoot -Manifest $DiagManifestPath
if (-not $?) { throw 'Cleanup incomplete; include outstanding items in report' }
```

按 [结果模板](results-template.md) 回传：

- 固定候选身份、OS/PowerShell/所有实际运行版本、CLI/Host 类型和未开 inspector 的确认方式。
- W0–W12 各子项的桌面/npm 通过、失败或未测，实际触发的阶段和诊断 JSON 文件名；异常与证据不足单列。
- 人工操作、开始/结束时间、退出码；受控/模拟/真实平台标记；故障变体的差异与清理。
- 已选原用户状态哈希前后比较、DSH 正常写入的区分记录、临时登录与进程清理结果。

本任务不自动授权推送报告。优先将本地报告和包交回用户；用户明确授权后才在独立 docs 分支提交并推送，报告不得包含 Token、授权地址/码、密钥、原始业务数据、原始配置或完整环境变量。
