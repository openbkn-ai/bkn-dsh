# Windows -10 最小变化复测（可立即并行执行）

## 范围与固定身份

只测 -10 改动，不等 Mac 收尾，不重跑全量 G6 / W0–W12 / 升级卸载 / -9 安装矩阵。使用独立结果分支；不改候选、插件源码、DSH、平台或许可开关，不推进 main，不发布、打 tag 或修改 dist-tag。

| 输入 | 固定值 |
|---|---|
| 插件版本 | `0.2.0-rc.2-openbkn.0.2.0-10` |
| 插件构建源码 | `9a35c0d9d1263b5f39b24d596f07dbcedbf25d04` |
| CI | [38209375894](https://github.com/openbkn-ai/bkn-dsh/actions/runs/38209375894)，`publish=false` |
| Artifact | `plugin-tarball`，ID `11728158282`，到期 2027-01-10 |
| tgz | `openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-10.tgz`，188215 字节，70 文件 |
| tgz SHA-256 | `a91adc9e342faa4f763d73487cd56d2f4ead8bb21bf755ca11426f77d90c9bae` |
| SDK | 本目录 `candidate/openbkn-bkn-sdk-0.2.0.tgz`，212707 字节，SHA `7391c658e831b9f11bc36fd7fcecfa30e41ecc4123a005bfee811e44b60eb43c` |
| SDK 源码 | `release/0.2.0` / `c404354793146edab944b7e5a79908bf41ddd591`；用户明确要求用该源码构建包；**npm 未发布，不等待** |
| DSH | 官方 `0.2.0-rc.2`，Desktop + npm/web；Node `24.19.0` 或项目允许版本；pnpm `11.7.0` |
| 平台 | `https://192.168.50.28`；后端 `0.2.0-release.20261011115044.sha06c5a87`，含本地构建 EE 组件，实际身份见 Mac `platform-images.json` |

这是新兼容候选；2026-10-11 handoff 中 `b2d90c19…` 的旧展示候选不适用。交接文档提交不替换构建源码身份。

## 开始前与取件

1. 从本次通知给出的**固定交接提交**建立独立 worktree 和结果分支，例如 `docs/compatibility10-minimal-windows-results`。先读本文件与 `RESULTS-TEMPLATE.md`。
2. 保存选定日常 profile / CLI 配置文件的 before 内容哈希，明确路径范围。使用 `C:\bkn-verify\compat10-minimal\` 下的新隔离根；不要复制日常 token/refresh token 到多个测试 store。每个需要登录的 store 自行独立授权，不写入证据或 Git。
3. 验收只需一个隔离 SDK prefix；两个 Host 用独立 DSH_HOME 和 BKN_CONFIG_DIR。不要改日常 SDK、PATH、APPDATA 或模型设置，不需配置模型 Key。
4. 使用 `gh run download` 获取固定 artifact，避免 PowerShell 5.1 重定向二进制 ZIP 导致转码。已持有同 SHA 的固定 CI tgz 可复用。

```powershell
$taskKit = '<本 worktree 的绝对路径>\docs\handoff\2026-10-12-compatibility10-minimal-windows'
$taskRoot = 'C:\bkn-verify\compat10-minimal'
New-Item -ItemType Directory -Force (Join-Path $taskRoot 'candidate') | Out-Null
gh run download 38209375894 -R openbkn-ai/bkn-dsh -n plugin-tarball -D (Join-Path $taskRoot 'candidate')
if ($LASTEXITCODE -ne 0) { throw 'CI download failed' }
$taskTgz = Join-Path $taskRoot 'candidate\openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-10.tgz'
node (Join-Path $taskKit 'verify-candidate.mjs') --tarball $taskTgz > (Join-Path $taskRoot 'verify-native.txt') 2>&1
$taskVerifyExit = $LASTEXITCODE
if ($taskVerifyExit -ne 0) { throw 'Candidate / SDK verification failed' }
npm.cmd install --prefix (Join-Path $taskRoot 'sdk') --no-audit --no-fund (Join-Path $taskKit 'candidate\openbkn-bkn-sdk-0.2.0.tgz')
if ($LASTEXITCODE -ne 0) { throw 'Isolated SDK install failed' }
$taskCli = Join-Path $taskRoot 'sdk\node_modules\.bin\openbkn.cmd'
& $taskCli --version
if ($LASTEXITCODE -ne 0) { throw 'SDK version command failed' }
```

安装依赖使用当前 npm 源；SDK 本体必须来自上述固定本地 tgz。不要运行 `npm install -g @openbkn/bkn-sdk@0.2.0`，当前 registry 无该版本。`verify-candidate.mjs` 读取原始字节并核验清单 SHA，交接目录为 `-text`；不能为“通过”而改清单或脚本。原生 Windows 执行结果仍由本轮记录，不以 Mac 验证替代。

## 最小矩阵与顺序

| ID | 执行范围 | 操作与通过条件 |
|---|---|---|
| V0 | Desktop / npm | 安装固定 tgz 后再次运行 verifier，加 `--installed <实际 package 目录>`；两形态均 70/70，版本正确，记录真实 profile 与路径 |
| V1 | Desktop / npm | OpenBKN → 诊断：系统显示 **Windows**；原 JSON 的 `platform=win32` 保留。未知形态/未采集 DSH 或已加载版本有中性解释，磁盘版本不冒充运行版本。每形态一次真实产品导出，保留原件路径/SHA/reportId |
| V2 | Desktop / npm | 高级设置首次安装目标为“请选择版本”；明确选择 0.2.0，填 `$taskCli`，识别“CLI 0.2.0 可用”，保存后可用并列网。只测已有 CLI 识别/版本选择；源码包安装不是插件 npm 自动安装通过证明 |
| V3 | 整台 Windows 一次 | 运行下述固定候选原生边界探针：真实 0.2.0 CLI / MCP / 官方 DSH 工具运行时，受管 start → 从真实 schema 选择对象类型、只读查 1 行 → finish；读取 profile/operations/business-graph，成功 finish 后查询必须拒绝。探针无模型，不称完整 UI 问答或答案评测 |
| V4 | 整台 Windows 一次 | 同探针受控覆盖导航 null 数组计数，Trace disabled/unavailable 无伪造 ID、无旧 context、跨网拒绝、finish 后关闭。平台若已有合法大网络/自然降级可额外读一次，否则实机分支 not-run，**不改平台/造大网络/停服务** |
| V5 | 整台 Windows 一次 | 探针同一 owner 再同步 CLI 凭据、新建受管轮次。无 Unauthorized 则只写“短流程未复现”；不宣称自然过期后重登、8 小时长跑或历史 B1 已解决。自然遇到过期可用产品按钮独立重登并记录，不主动扩大 soak |
| V6 | 整台 Windows 一次 | 同一清单 after 内容哈希； owned Host PID/UTC 创建时间/exe/listeners/停止输出留存；相关进程与端口释放。只停止本轮匹配树，保留原记录 |

先执行 V0–V2 两形态，再 V3–V5 一次。Desktop 与 npm 分开操作；最小矩阵不要求业务 workspace 升级/卸载或 G6 三题。来源接口返回空记录仅证明本次返回为空，不能扩写为回执/业务图全部完整。

## 原生边界探针（V3–V5，一次）

使用官方 npm DSH 库执行，与 UI 验收分列。可复用已有官方 `0.2.0-rc.2` npm 安装；`--runtime` 是持有 `package.json` / `node_modules` 的 npm prefix（可从该目录解析 `@deepseek-ai/cordis`、`dsh-tools` 等）。没有现成 prefix 时仅安装官方固定 DSH：`npm.cmd install --prefix <隔离 runtime prefix> @deepseek-ai/dsh@0.2.0-rc.2`。

```powershell
$taskRuntime = '<官方 npm DSH 0.2.0-rc.2 的 prefix 绝对路径>'
$taskProbe = Join-Path $taskRoot 'probe'
New-Item -ItemType Directory -Force $taskProbe | Out-Null
$env:DSH_HOME = Join-Path $taskProbe 'dsh-home'
$env:BKN_CONFIG_DIR = Join-Path $taskProbe 'bkn-config'
$env:NODE_EXTRA_CA_CERTS = Join-Path $taskKit 'openbkn-dev-ca.pem'
New-Item -ItemType Directory -Force $env:DSH_HOME | Out-Null
# 独立设备登录；在浏览器完成正常授权，不提交账号密码/token。
& $taskCli auth login https://192.168.50.28 --device
if ($LASTEXITCODE -ne 0) { throw 'Independent CLI login failed' }
$taskUnpack = Join-Path $taskProbe 'candidate'
New-Item -ItemType Directory -Force $taskUnpack | Out-Null
tar -xf $taskTgz -C $taskUnpack
if ($LASTEXITCODE -ne 0) { throw 'Candidate extraction failed' }
$taskPackage = Join-Path $taskUnpack 'package'
# 仅给探针解包目录补运行时依赖 junction，不改已安装插件或包字节。
New-Item -ItemType Junction -Path (Join-Path $taskPackage 'node_modules') -Target (Join-Path $taskRuntime 'node_modules') | Out-Null
node (Join-Path $taskKit 'minimal-native.probe.mjs') --runtime $taskRuntime --plugin $taskPackage --cli $taskCli --live https://192.168.50.28 --kn supply_ontology_hand > (Join-Path $taskProbe 'native-private.txt') 2>&1
$taskProbeExit = $LASTEXITCODE
```

先清理**当前测试子进程**里的 `BKN_TOKEN` / `BKN_BASE_URL` / `BKN_USER` 覆盖（若存在），不改持久环境变量。证书信任仅用已有测试 CA 的进程级设置；不得 `--insecure` 或跳过版本检查。CLI 登录 URL/code、日志可能带秘密；`native-private.txt` 与 `probe-interactions.private.jsonl` 仅留本机。回传提取的 `phase` JSON 行，先扫描再提交，并保存命令、起止、退出码；最终必须出现 `complete/passed=true`，两个 `controlled-trace-*` 均 pass。探针构造 Agent/storage 的最小外壳，但 CLI、凭据边界、MCP、护栏、reader 和官方工具运行时为真实实现；该证据不等于完整 UI Host/模型。

可为另一平台地址或测试数据缺失而停止，并如实列 blocked/not-run；不猜网络/对象 ID，不将失效旧 token 复制到多个 store 后归因为插件。

## 收态、回传及限制

- 使用本目录 `stop-owned-host.ps1`（与既有最终 helper 同字节）或已核验的等价方式；记录 `pid/createdUtc/exe/listeners`，原生 stdout/独立退出码和原件都要存。无监听的 Desktop 单独记录，不伪造监听核验通过，不绕过 helper 拒绝。
- 最小证据：两份产品 JSON + 两形态 CLI/诊断 UI 记录；verifier 原生输出/退出码/安装路径；一次 native probe 输出/执行身份；before/after 同清单；owned PID/停止/终态。截图里有个人文件名则只留本机，用脱敏文字/导出报告回传。
- 用 `RESULTS-TEMPLATE.md` 填 pass/fail/not-run/insufficient-evidence。逐件记录本机来源路径与 SHA、Git blob 字节是否相同；CRLF 归一仅可单列，不能称逐字节相同。把本轮证据路径设为 `-text`，保留 UTF-16 原生输出，不改旧原件。
- 独立证据分支推送后给完整 commit；只新增本轮证据，不覆盖原 Mac / 历史 Windows 记录。不发布、不合入 main，不改本次 feature branch。
- 本轮已知不覆盖：npm 自动安装 0.2.0（未发布）；真实大网络与 Trace 开关分支（无现成条件则 not-run）；0.1.5 实机；模型/G6；长时 B1。EPERM、DSH / 平台问题、英语及其他 P2/P3 沿用既有边界。
