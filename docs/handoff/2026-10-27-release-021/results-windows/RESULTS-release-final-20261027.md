# Windows 最终候选最小差异验证（0.2.1-rc.3-openbkn.0.2.1，2026-10-27）

kind=final-ci-candidate-affected-validation；ciRun=40361613728；formalAcceptanceEligible=false（按覆盖范围如实判断，未达完整正式合同）。

## 一、固定身份

- 提交：`f36103e6af0d3b5ed838696c5efd0fd272c4ec9e`（分支 feat/021-release-final，全新 detached checkout；**首尾 `git status --porcelain` 均为空**——首查后出现过 4 个任务生成物落在交接目录，已整体移入 run 根 private/stray-handoff-artifacts 保留为失败原件（空 web profile 骨架 + 本地合成 grant，创建于 2026-10-27T07:17:58–07:18:00 本轮 npm-old 启动尝试期间；非冻结输入、非用户数据；移动后 checkout 恢复干净、被跟踪文件零改动）。
- CI 候选：`27ccf15c46e4f71ef850ee481e22556b70f4d4795e89d7d587a2e3210fc6b3e3`，232091 字节，**82/82 与 CANDIDATE-FILES.json 全等**（tgz 解包核对 + 四副本安装后逐一复核），版本 0.2.1-rc.3-openbkn.0.2.1。business.js SHA256 = `ca9125bd7ce9d017f8c0a9a1fa097ff8165e8943dfbde5dad96f31406b2bd537`（四行探针运行时实测相等）。候选源码 db68c800…；已发布 npm 重打包 3a877e1f… 本轮未使用（仅记录）。
- Companion：mcpOld `0e06001c…`（12/12）用于旧行、mcpRc3 `48694ca3…`（12/12）用于新行（compat/mcp-profile-backport/，与 ARTIFACTS.json 一致）；profile 层入口实测均为 `b3cd7156c0b8639656ce117530fec4d006b74cafdc9a78ac426fec084e62972c`。
- 运行来源（复用已核验）：任务 Node 24.19.0；npm 旧=官方 0.2.0-rc.2 运行根副本（stock MCP 758d8fc4…）、npm 新=官方 0.2.1-rc.3 registry 安装副本（stock 758d8fc4…）、Desktop 旧=官方 Electron 44.0.0（asar dsh 0.2.0-rc.2，stock 758d8fc4…）、Desktop 新=官方 Electron 44.7.0（asar dsh 0.2.1-rc.3，stock 758d8fc4…）。**四个源运行根 stock MCP 均未替换（收尾复核实测 758d8fc4…）**。

## 二、四行矩阵（全部 PASS）

每行：同一 synthetic-fixture（baseUrl http://127.0.0.1:57187）+ profile 层 cordis.patch.yml（business 行 config：baseUrl/mcpUrl=fixture、cliPath=任务内 never-executed-cli.exe、双超时 3000ms；观察器行无外层 id insert）+ 探针 env（OS 等父环境正常透传）。

| 行 | Host/Node/Electron | 加载证据 | Reader 六项 | 结论 |
|---|---|---|---|---|
| 旧 npm | 0.2.0-rc.2 / Node 24.19.0 | 3 组件 active；svc instanceof 候选导出类=true；businessSha=ca9125bd…；公开 remoteConfigureToken→业务自身 manager 合成连接（publicConfigureNormal=PASS）；registry 实例===manager fiber.runtime；MCP 物理位于 profile（node_modules/@deepseek-ai/dsh-mcp-client/lib/index.js）SHA=b3cd7156…；pluginVersion=0.2.1-rc.3-openbkn.0.2.1 | 6/6 | **PASS** |
| 新 npm | 0.2.1-rc.3 / Node 24.19.0 | 同上全项 | 6/6 | **PASS** |
| 旧 Desktop 后端 | 0.2.0-rc.2 / Node 24.18.1 / Electron 44.0.0 | 同上全项 | 6/6 | **PASS** |
| 新 Desktop 后端 | 0.2.1-rc.3 / Node 24.21.0 / Electron 44.7.0 | 同上全项 | 6/6 | **PASS** |

Reader 六项（每行 packedNativeReaderChecks 完整出现）：valid detail unchanged；operations 超限受控拒绝（OUTPUT_OVERFLOW）；time_rail 超限受控拒绝（OUTPUT_OVERFLOW）；valid explanation unchanged；错误数组容器拒绝（INVALID_RESPONSE）；65>64 pair 记录拒绝（OUTPUT_OVERFLOW）。

证据文件：`results/autoload-{npm-old,npm-new,desk-old,desk-new}.json`。

**偏差披露（观察器挂载非确定时延）**：npm 行观察器行偶发 >90s 才 apply（npm-old 第 4 次启动 ~22s 成功、npm-new 第 2 次在 180s 窗口内成功；Desktop 行 2 秒即出）。期间做过只读隔离诊断（diag 无注入行在移除 business bundle 后立即激活；#105 探针交叉对照在旧 profile 成功、新 profile 失败→当时疑似候选阻塞；后续全量 profile 自然挂载成功，证明并非确定性阻塞，与 #105 记录的挂载非确定性同类）。诊断过程副产品即上文 stray artifacts。Desktop 两行无此现象。

## 三、CSV 最小变化边界（PASS）

`csv-export-runtime.probe.mjs --runtime <npm-new 任务运行根> --plugin <候选>`（官方 ToolRuntime；平台响应/文件端口/run_code 全合成）。**布局说明**：直接 Node 导入时候选的裸导入符（@deepseek-ai/schemastery）缺 Host loader 映射（ERR_MODULE_NOT_FOUND，原文保留）；按任务书许可，将候选目录复制进**任务 runtime 副本** node_modules/@openbkn/（82/82 复核 0 差异；junction 方案因 Node realpath 还原失效，改用复制；均仅写任务副本）后与 ToolRuntime 同物理 Host 依赖。

- 两场景（capture enabled/disabled）`passed=true`，其中 **"Windows star filename"（q*.csv）在平台派发与文件写入前受控拒绝**（denied 断言 reads/writes 零增量；不静默重命名；无原始文件系统错误文本）。
- 其余对照全过：closed Interaction、wrong/missing network、missing context、不同 Interaction/Conversation、path traversal、absolute path、URL source、read-only Session、Host/excluded read/grep/present/run_shell、bad digest（retrieved-but-never-written）、正向保存（BOM/CRLF/UTF-8/逐字节与 sha256/new path 校验，writes=1）、finished Interaction、unrelatedAgentInvisible。
- 共享源码回归"missing or malformed content returns the controlled incomplete-result error"：**共享回归已验证（主会话既有证据），本轮 Windows 未单独执行**——按任务书区分列报，不计入本轮 Windows PASS 项。

## 四、收态与保全

- Desktop 后端：`{type:'shutdown'}` IPC → shutdown-complete → **exit code=0**（两行各 215s 观测窗，真实退出码）。
- npm 行：按记录 PID 身份停止（host-identity-*.txt 含 pid/实际 createdUtc/exe），remaining=0。
- fixture：按 cmdline 身份停止（pid 26912，创建 23:10:46Z）；任务 node host 残留 0；DeepSeek Harness 进程 0。
- 保全复核：四 profile 候选 82/82、companion 12/12 零差异；源运行根 stock MCP 两 npm 副本 758d8fc4… 未替换；Desktop asar 内 stock 未动（启动校验时实测）；候选 tgz 27ccf15c… 未变；checkout 干净（HEAD=f36103e…，stray 已移出保留）；旧任务目录与既有 Host 全部未触碰。

## 五、结论汇总

| 项 | 结论 |
|---|---|
| 固定输入/候选/companion 核对 | PASS |
| 旧 npm 行（自动加载+Reader 六项） | PASS |
| 新 npm 行 | PASS |
| 旧 Desktop 后端行 | PASS |
| 新 Desktop 后端行 | PASS |
| CSV q*.csv 变化边界（含正负对照） | PASS（Windows 实测） |
| CSV missing/malformed content | NOT_RUN（共享源码回归已验证，非本轮 Windows 执行） |
| 平台非空原生溯源样本 | 缺口保留（本轮为合成响应，非平台验收） |
| 观察器挂载非确定时延（npm 行） | 偏差披露（不判 FAIL：最终均在窗口内完成且 Desktop 无此现象） |

未执行（按任务书）：8/8 重定向矩阵、301–308 向量、GUI/UI/语言/800×600/目录、argv/tar、登录/取消/超时、B1、W-LIFE、RDP、低权限负例、真实模型/G6/Function/真实 run_code/Sandbox/BOM/CSV 业务题；未访问平台（192.168.50.129 保持 0.2.0）；未采用 -11/-13；未推送/CI/PR/tag/发布。四行与 CSV 通过不等于完整 GUI、平台非空原生、模型 G6 或整体正式验收通过。
