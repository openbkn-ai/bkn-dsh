# Windows #105 非 GUI 最小验证结果（冻结 -32，run3）

kind=local-development-preacceptance；ciRun=null；formalAcceptanceEligible=false。本轮不推送任何分支、不跑 CI、不开 PR、不打 tag、不发布；正式 https://192.168.50.129 保持原样 0.2.0 未访问；不采用 -11/-30/-31 资产；-30/-31/-32 保持冻结。

## 一、固定输入与校验

- 固定 commit：`a362d783d75b8b1ff80b55ba0e497fe1a56c8ade`（分支 handoff/windows-local32-mcp-nongui-20261025，detached，`git status --porcelain` 为空）。
- KIT-FILES SHA256：`c12655058e6b57e485894fd594a2f592f5f2d7335c7425f5175e12b2e02fbee4`（kitFilesMatched=19）。
- verify-inputs：**PASS** —— plugin32=82 文件（0.2.0-rc.2-openbkn.0.2.0-32，46626510…）、mcpOld=12 文件（0.2.0-rc.2，0e06001c…）、mcpRc3=12 文件（0.2.1-rc.3，48694ca3…），包摘要/字节数/文件清单全部吻合；hostStartedByVerifier=false。
- 任务 Node：24.19.0（`C:\bkn-verify\021-local30-r2-run-20261023-133254\tools\node-v24.19.0-win-x64\node.exe`）。

## 二、路径对照结果

| 路径 | Host/SDK/Node/Electron 及实际 MCP SHA | stock 同源/第二源 | protected 同源/第二源 | 结论与证据 |
|---|---|---|---|---|
| 旧 rc.2 npm/Node | dsh 0.2.0-rc.2（npm-0.2.0-rc.2 新副本）+ mcp-client 0.2.0-rc.2（stock 入口 758d8fc4… 已验证）/ MCP-SDK 2.0.0 / Node 24.19.0 | 安装 82/82+闭包 PASS（cordis 4.0.4/schemastery 3.18.4/noMixed）；**探针 fiber 未激活**（详见受阻项） | 未执行（依赖同路探针） | **BLOCKED**：web Host 上下文中探针 fiber 不激活（6+ 次启动确定性复现；同 inject 列表的极简诊断插件 2/3 次激活——非确定性对照；run() 未进入即无 loopback 服务监听、无输出、无失败记录；fiber 精确状态被 enableLogs 门控不可观测）。曾启动的 3 个 Host 均按 PID 清理（remaining=0） |
| 新 rc.3 npm/Node | — | — | — | **BLOCKED**：本机无 0.2.1-rc.3 npm runtime（已有 npm-0.2.1-rc.2 不能代替 rc.3）；官方 feed 有 rc.3 安装器但未下载/未验签（OFFICIAL-WINDOWS-INPUTS：installerIncluded=false、nativeSignatureAndActualAsarRuntimePending=true）；按任务书不为齐表重建发行体系 |
| 旧 rc.2 Electron backend | dsh 0.2.0-rc.2（desktop 副本 app.asar/dsh）+ mcp-client 0.2.0-rc.2（asar 内 stock 758d8fc4… / protected 解析至 profile 内 payload b3cd7156…）/ MCP-SDK 2.0.0 / **Node 24.18.1（Desktop 捆绑 runtime，如实记录）** / **Electron 44.0.0** | **同源成功**（syntheticResult=true）；**第二源=1 且携带合成 Session+问题**（正对照成立） | **同源成功**；**第二源=0**（cross isError=true——protected 拒绝跨源 307） | **PASS（stock 与 protected 双 PASS）**：dsh-desktop-host 经 ELECTRON_RUN_AS_NODE spawn（args 与 stdio 按 SETUP）、{type:'ready'} IPC、探针完成、{type:'shutdown'}→shutdown-complete→exit 0（90.0/90.1s）；protected 前置：-32 安装 82/82 + mcpOld payload 12/12 应用到 profile node_modules（entry=b3cd7156…） |
| 新 rc.3 Electron backend | — | — | — | **BLOCKED**：本机无 0.2.1-rc.3 Desktop（官方 feed 安装器未下载/验签；useHistoricalNewRc2ForRc3=false；历史 rc.2 不代替 rc.3） |

- 实际 profile/插件身份：两行 Desktop 副本均以空 DSH_HOME/cli-config 经 dsh-app-boot initProfile（web.bundles）初始化，官方 dsh.cmd 安装 -32（82/82 inventory+content 匹配，pluginVersion=0.2.0-rc.2-openbkn.0.2.0-32）；protected 变体另在 profile node_modules 物理放置 mcpOld payload（12/12，entry b3cd7156…，version 0.2.0-rc.2）。
- 合成对照口径：仅 127.0.0.1、合成 Bearer（synthetic-windows-backport-only）、合成 Session（windows-backport-fixture）与问题（windows-local-synthetic-question）；每次运行同源 307 + 跨源 307 各一次；使用实际原生 MCP factory 与 ToolRuntime。

## 三、fixture/MCP 清理与 owned 收态

- 探针自清理：fixtureListenersClosed=true、mcpDisposalErrors=[]（stock/protected 两报告一致）；两个 loopback 服务端口随进程退出释放。
- Desktop Host 收态：stock/protected 均经 {type:'shutdown'} IPC → shutdown-complete → exit 0（90.0/90.1s）；关后 DeepSeek Harness 进程 0、端口 19387 无监听（探针 Web UI 曾短暂使用 19387，已释放）。
- npm 行曾启动的 3 个 Host 均按记录 PID 清理（remaining=0）。
- 最终核对：my task node=0、DeepSeek Harness=0、port 19387=0、Chrome 根 12416 存活且创建时间不变；原 home/原 Desktop/原 kit 未改动；本轮副本（desktop-rc2-stock/protected、home-desktop-*、runtime-npm-rc2-*）全部保留。

## 四、受阻项与原因（缺哪项只阻塞哪行）

1. 旧 rc.2 npm/Node：探针 fiber 在 Windows web Host 上下文不激活（PENDING/未 apply；同 inject 的极简插件可激活——差异不在 inject 列表与导入面[assert/http/fs/path/url/crypto 全测过]，精确根因需 enableLogs 或更深的 loader 工具，超出本轮）。安装/82 文件/闭包均 PASS，仅探针执行受阻。
2. 新 rc.3 npm/Node：缺 rc.3 npm runtime。
3. 新 rc.3 Electron backend：缺 rc.3 Desktop（官方安装器未下载/验签）。
4. 另：Desktop protected 的 payload 应用于 profile node_modules（真实 FS）而非 asar 内 stock 副本——解析优先级经实测验证（探针实际 MCP SHA=b3cd7156）。

## 五、证据清单

- 脱敏公开证据（本报告同目录）：`verify-inputs.json`、`desktop-stock.json`、`desktop-protected.json`（两份探针报告含 host/node/electron/MCP SHA/对照结果，无凭据无平台数据）。
- 私有证据（仅本机 `C:\bkn-verify\021-host32-mcp-nongui-20261025-run\`）：各 Host 日志、安装日志、82 文件/闭包核对输出、payload 应用记录、bisect 诊断序列、npm 行探针诊断。
- 未执行：GUI、登录、真实模型/G6/Sandbox/Function/run_code/BOM/CSV、平台业务、argv/tar、A/B 启动验收、闭包套件重跑、目录绑定、登录取消/超时、B1/长时/52 跳转。后端通过不转记 GUI 通过或 rc.3 完整兼容通过。

## 六、rc.3 专项补测（用户授权本机搭建环境后执行，2026-10-26）

用户指示"优先处理 0.2.1-rc.3 的问题，把环境在本机搭好实测，不因缺环境 BLOCK"。据此将原 BLOCKED 的两行 rc.3 环境在本机新建并实测：

### 环境搭建（全部新副本，均在任务根内）

- **rc.3 npm runtime**：13 个 @deepseek-ai/*@0.2.1-rc.3 包官方 registry 全部存在（dist.integrity 逐一取得）；按 -30 轮模板生成 pinned 清单（cordis 4.0.5/schemastery 3.18.5/zod 4.4.3/四个 cordis-plugin 固定版），隔离 npm cache 安装 562 包成功。**官方 rc.3 的 dsh-mcp-client@0.2.1-rc.3 lib/index.js 实测 SHA=758d8fc4…（与 rc.2 stock 逐字节相同）**——即官方 rc.3 仍不含重定向保护，payload（b3cd7156）为被测修复，探针断言对两代 Host 通用成立。stock/protected 两副本（robocopy），各自空 DSH_HOME/BKN_CONFIG_DIR web profile 安装 -32：82/82 inventory+content 匹配，闭包 PASS（host 0.2.1-rc.3、cordis 4.0.5、schemastery 3.18.5、noMixed/noSplit）。
- **rc.3 Desktop**：官方 feed 安装器下载 289415960 字节（尺寸精确一致）；**sha512(base64) 程序化比对与 kit 快照 OFFICIAL-WINDOWS-INPUTS 及当前 nightly.yml 均完全一致**（q5IGr2Bf+Tvv…dDOw==；注：早前一次肉眼比对差异系我方转录笔误，程序化比对为准）；Authenticode Valid（Hangzhou DeepSeek）；NSIS 两段解包（未运行安装器）得 app 树；身份核验：exe FileVersion 0.2.1-rc.3（sha256 fd7d298f4ba03ee9bab1719a892afeaef5c09bf50c574a592a64c85f64574c0c）、asar dsh 0.2.1-rc.3、dsh-desktop-host/dsh-app-boot 存在、bundled mcp-client 0.2.1-rc.3（stock 758d8fc4）、cordis 4.0.5/schemastery 3.18.5、primary-runtime desktopVersion 0.2.1-rc.3。stock/protected 两副本，initProfile(web.bundles)+自带 dsh.cmd 安装 -32（82/82×2），profile 层 cordis.patch.yml 注入探针行。

### 探针执行结果（每次同源 307+跨源 307 各一次，实际原生 MCP factory+ToolRuntime，仅 127.0.0.1 合成数据）

| 路径 | 模式 | 实际 MCP SHA | 同源 | 跨源/第二源 | Node/Electron | 结论 |
|---|---|---|---|---|---|---|
| rc.3 npm/Node | stock-control | 758d8fc4…（官方 runtime 实测） | 成功 | 跨源成功；第二源=1 且携带合成 Session+问题（正对照成立） | 24.19.0 / — | **PASS** |
| rc.3 npm/Node | protected | b3cd7156…（mcpRc3 payload 12/12 经 temp+rename 应用后实测） | 成功 | 跨源 isError=true；第二源=0 | 24.19.0 / — | **PASS** |
| rc.3 Desktop backend | stock-control | 758d8fc4…（asar 内官方副本实测） | 成功 | 跨源成功；第二源=1（正对照成立） | 24.21.0 / Electron 44.7.0 | **PASS** |
| rc.3 Desktop backend | protected | b3cd7156…（payload 置于 profile node_modules，解析优先级实测生效） | 成功 | 跨源 isError=true；第二源=0 | 24.21.0 / Electron 44.7.0 | **PASS** |

- 探针自清理：fixtureListenersClosed=true、mcpDisposalErrors=[]（四份报告一致）。
- Desktop Host 均经 {type:'shutdown'} IPC → shutdown-complete → exit 0（90.0/90.1s）；npm Host 按记录 PID 停止（remaining=0）。
- 最终收态：任务 node=0、DeepSeek Harness=0、探针端口 0 监听、Chrome 根 12416 未动、冻结 kit 干净（git status 空）、原目录/原配置保留。

### 关键方法发现（同时解除 rc.2 npm 行的受阻原因）

rc.2 npm 行此前用 `--patch` 命令行叠加层注入探针行，fiber 在 web Host 中反复不激活；本轮改用 **profile 层 cordis.patch.yml**（Desktop 行已证可靠的同一机制）后，npm rc.3 探针一次激活成功。即 rc.2 npm 行的 BLOCKED 是叠加层挂载的非确定性问题，非探针或 Host 缺陷；按用户"rc.2 以后再说"的优先级，该行维持 BLOCKED 记录，复测路径已明确（profile 层 patch）。

### rc.3 证据（本机 run 根）

- 报告：results/npm-rc3-stock.json、npm-rc3-protected.json、desktop3-stock.json、desktop3-protected.json（公开，无凭据无平台数据）。
- 私有：rc3 安装日志、安装器校验输出、身份核验输出、Host 日志（仅本机）。

## 七、rc.2 npm 行复测（用户指示"快速做掉"，2026-10-26）

按第六节明确的复测路径执行：rc.2 npm 两副本改用 **profile 层 cordis.patch.yml**（替换 --patch 叠加层）注入探针行；protected 侧补装 -32（82/82）并将 mcpOld payload 12 文件 temp+rename 应用于 runtime 副本（entry=b3cd7156…，version 0.2.0-rc.2）。

| 模式 | 实际 MCP SHA | 同源 | 跨源/第二源 | Node | 结论 |
|---|---|---|---|---|---|
| stock-control | 758d8fc4… | 成功 | 跨源跟随；第二源=1（合成 Session+问题，正对照成立） | 24.19.0 | **PASS** |
| protected | b3cd7156… | 成功 | 跨源拒绝；第二源=0 | 24.19.0 | **PASS** |

Host 按记录 PID 停止（remaining=0）；探针自清理 fixtureListenersClosed=true、mcpDisposalErrors=[]。

## 八、最终汇总（四路径 × stock/protected = 8 条探针）

| 路径 | stock | protected |
|---|---|---|
| 0.2.0-rc.2 npm/Node | PASS（第二源=1） | PASS（第二源=0） |
| 0.2.1-rc.3 npm/Node | PASS（第二源=1） | PASS（第二源=0） |
| 0.2.0-rc.2 Desktop backend | PASS（第二源=1） | PASS（第二源=0） |
| 0.2.1-rc.3 Desktop backend | PASS（第二源=1） | PASS（第二源=0） |

全部 8 条：同源 307 成功、stock 正对照（第二源收到合成 Session+问题）成立、protected 第二源恒为 0、实际 MCP 入口 SHA 与模式逐一相符、fixture/MCP 清理无错。原第二节表中 rc.2 npm 行的 BLOCKED 由本节复测结果取代。
