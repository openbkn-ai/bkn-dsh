# -10 Windows 复测 handoff

本轮只验收诊断基础信息展示，以及独立复现 B1；不修改候选、DSH/平台、鉴权管理、配置架构或其他 P2/P3，不发布、不打 tag、不迁移 dist-tag。代码基于已发布 -9，-10 build-only 候选尚未发布。

## 固定身份与获取

| 项目 | 固定值 |
| --- | --- |
| 源码 commit | `4daccf6b794ee7e9d55b9c7a45f29f5403c6d2a0` |
| CI | [38106903958](https://github.com/openbkn-ai/bkn-dsh/actions/runs/38106903958)，success，publish=false |
| artifact | `plugin-tarball` |
| 版本 / 文件 | `0.2.0-rc.2-openbkn.0.2.0-10` / 70 文件 |
| tgz bytes | 184146 |
| tgz SHA-256 | `b2d90c19d19bd473de38f519b9a4abb4b8a25c8468cd80195fefb7641e3bcdeb` |
| candidate-files SHA-256 | `3f5f8f03c2d549a2d5a9252a558a979b2921a5630055c801933ec83fa50d019f` |
| manifest / 清单 | `docs/evidence/diagnostics10-20261011/candidate-manifest.json`、`candidate-files.json` |
| Mac 结果 / B1 边界 | 同目录 `MAC-RESULTS.md`、`B1-REPRODUCTION.md` |

取 `feat/diagnostics-info-10` 远端分支。主开发交付回报提供包含本 handoff 的完整提交哈希，请 checkout **该固定提交**，记录 `git rev-parse HEAD`；源码提交是构建输入，不包含后续交接文档。新建独立结果分支，不推进源码分支或 main。

```powershell
$taskRoot = 'C:\bkn-verify\diag10'
New-Item -ItemType Directory -Force $taskRoot | Out-Null
gh run download 38106903958 --repo openbkn-ai/bkn-dsh --name plugin-tarball --dir "$taskRoot\package"
$taskTgz = Join-Path $taskRoot 'package\openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-10.tgz'
# 在固定 checkout 根运行；外层子进程存档原生 stdout/stderr，并记录独立退出码。
powershell -NoProfile -ExecutionPolicy Bypass -File .\docs\handoff\2026-10-11-diagnostics10-windows\verify-candidate.ps1 -Tarball $taskTgz *> "$taskRoot\verify-native.txt"
$taskVerifyExit = $LASTEXITCODE
if ($taskVerifyExit -ne 0) { throw "verifier failed: $taskVerifyExit" }
```

清单在 `.gitattributes` 设为 `-text`，Git checkout 必须保留固定字节。若清单 SHA 不匹配先停，不把原件转码后冒充通过。PS verifier 由已收尾 -9 canonical 脚本复用，仅换目录、fileCount 字段和临时目录名；本机无 pwsh，**原生 PS5.1 运行待本轮验证**。

## 环境与前态

- 官方 Windows Desktop 与 npm DSH **0.2.0-rc.2**；分别全新隔离 DSH_HOME/profile。Desktop 从 app 启动并用插件管理器安装 tgz；npm 用官方 CLI `plugin install --profile web <tgz>`，然后 `web --port <独占端口> --no-open`。不要用 npm CLI 安装 desktop profile。
- 不需模型 Key、平台账号或 SDK 安装即可完成 A 批。不要把旧测试 Key 或日常 credentials 复制到隔离 profile；遇到宿主自动带入 Key 只记录，不混入本轮插件修复。
- 开始前按现有固定清单采集选定日常文件的存在性/内容哈希，记清范围；before 缺失不能事后补造。只停止自己启动且身份匹配的 Host。
- 安装后再运行 verifier `-InstalledPackagePath <真实安装目录>`，必须版本/70文件/missing/different/extra 全部合格，原生输出与独立 exit code 入档。variant 仅允许对应 business 产物一文件变化。
- 使用原始全流捕获，不把 Write-Host 的空档案当“原生输出”。记录每轮 PID、UTC 创建时间、exe、listener 及子进程。`stop-owned-host.ps1` 原样复用 -9 canonical helper，HostJson 需有 pid/createdUtc/exe/listeners[].port；不匹配则拒绝停止，人工核验并记录偏差，不能删掉失败记录。

## A 批：展示验收（两形态）

| 项 | 操作 | 预期 / 原件 |
| --- | --- | --- |
| A0 | 固定包核验 + 安装 | version=-10，70/70，零 missing/diff/extra，原生 verifier 输出及 exit 0 |
| A1 | OpenBKN → 右上角诊断 | OS 显示 **Windows**；不用 win32 表述位数，不新增 x64/Win10 推断。Desktop 正常为“桌面版”，npm 正常为“未识别（宿主未提供形态标识）” |
| A2 | 基础信息 + 导出 | DSH/已加载版本缺值有原因；磁盘 -10 不补作已加载版本。有“未采集不代表故障 / 磁盘不代表已加载”说明；原始 JSON 仍 platform=win32、原有 hostForm/null、schemaVersion 不变 |
| A3 | 按 exports 解析 `./business`，一处追加不存在模块导入；启新 Host | business fail/module-resolution-failed；bootstrap/diagnostics pass；基础信息、诊断仍可见且 UI 导出可用。记变体基包/前后 SHA、唯一变更文件 |
| A4 | 停故障 Host → 固定包还原 → 新 Host | 70/70，新 UI 正常 business pass、无旧失败残留；每形态分别保存恢复报告 |

不要破坏 `lib/index.js`（bootstrap）或 diagnostics。本轮不重做 B2 配置入口隔离、主动诊断、SDK 自动安装或卸载 EPERM 矩阵。未配置情况下 configuration-required/not-run 是预期，不算连接失败。

每份产品导出保留 reportId、场景、绝对下载路径、原件字节数/SHA、是否仍在。本地原件和 Git blob 用 Buffer 原始字节比较；若仅 CRLF→LF 一致则单列 normalized，UTF-16/二进制不转码，不能写“逐字节一致”。截图含个人桌面或 credentials 则只留本地，以脱敏转录并标 transcribed 回传。

## B 批：B1 最小复现（先真实 Desktop，不并行登录）

**依赖独立隔离授权**。没有凭据则 A 批照常完成，B 批记 not-run；不借日常 token/Key，不创建跨客户端 token 管理。已有可用隔离账号/model 配置可复用，绝不把凭据提交仓库。本轮以产品操作为准，不用 Mac 方法 seam 探针代替真实 Host。

| 步骤 | 要做的事 / 必须记录 |
| --- | --- |
| R0 基线 | 产品登录，确认目录、绑定、新会话 start/finish 成功；诊断有 context-loader；记录同一 Host PID/UTC创建/地址/工具归属，token 本地 iat/exp（实际有才记）和采集时间，只输出 tokenChanged/cliEqualsVault 布尔，不输出 token/hash/前缀 |
| R1 最小条件 | 同 Host 先改址到 `https://192.0.2.1` 再恢复，使用已有配置 UI；无业务查询。Host 累计约 8 h，token 自然到期后闲置约 6 h，保留各事件 UTC 时间。期间不触发 auth token（它可能刷新），不重启 Host、不让其他 root 同账号登录；若到期时长不同如实列偏差，不能宣称严格复现历史条件 |
| R1 产品重登 | 通过产品按钮真实 CLI 登录并同步，记录 login exit、tokenChanged、cliEqualsVault、目录；然后新业务会话第一次 bkn_start_interaction 调用及 finish、诊断采集。不要重复启动已打开的 Interaction；0 ms 本地“已有 interaction”守卫不能算 Unauthorized |
| R2 仅失败时 | **在重启前**保留实际工具返回（是否 Public.Unauthorized）、HTTP 状态仅在有直接证据时记、context-loader 行、归属与事件时间。再用独立 CLI 同平台/同网络做控制（它可能刷新，记时间），最后原 root 重启对照并采报告；不改源码、SDK或平台以“试修” |

若 R1 成功，R2 not-run，结论写“该条件下未复现”，不是“已修复”。若失败，回传可重复操作及原件，主开发先定根因再修。不能用本地 expiresAt 推断平台撤销、不能把工具 Public.Unauthorized 直接写 HTTP 401、不能仅按他端登录时序断言互踢。正常业务 Interaction 由产品 finish 收尾；额外探针只关闭自己确切拥有的记录。

历史失败的线索和之前成功对照见 `B1-REPRODUCTION.md`。长时等待可分次采样留档，不需要不间断截图；窗口关闭/Host 退出/地址或平台变化均算执行偏差，不能隐去。

## 收尾与回传

按固定 before 清单采 after；保存停止全流、PID 身份核验和本轮 root/端口终态。API/平台原始日志和 credentials 只留本地；Git 新 diff 扫 launch token、Bearer/Authorization、API Key、JWT、密码、带凭据 URL，命中就停。

复制本目录 `RESULTS-TEMPLATE.md` 到独立证据目录，填写源代码/交接/候选身份、A0–A4 两形态判定、B1 的条件与原件边界。推独立证据分支，英文 commit；回报完整固定 commit 和入口。**不合并、不发布、不改候选、不扩大 -10 范围。**
