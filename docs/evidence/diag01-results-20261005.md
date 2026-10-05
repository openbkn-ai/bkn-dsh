# DIAG-01 执行结果

报告日期：2026-10-05。执行者／职责：主开发（D0–D3 全部）。代码仓库：独立 worktree `bkn-dsh-diag-work`（新 checkout，非原 `bkn-dsh` 目录），分支 `feat/diagnostics-v1`，HEAD `18dcb7b`，干净无 dirty。原 `bkn-dsh` checkout（`fix/search-capabilities-contract`，cc97d88）未被改动。

## 固定输入与环境

| 项目 | 实际值／证据 |
|---|---|
| 候选版本、源码 commit、build-only run | `0.2.0-rc.2-openbkn.0.2.0-5`；源码 commit `50d6e2f`（tgz 构建基点）；build-only run **未执行**（需用户授权远端 CI） |
| tgz SHA-256、逐文件清单 | `bc5f0c76729bb4247772143c920972a55a9bb4559a15333925d42961a5892bd5`，62 文件；清单 `release/candidate/candidate-files.txt`；元数据 `release/candidate/candidate-manifest.json` |
| 故障变体基包／差异文件及哈希 | 见下文开发阶段各行；基包均为上述 tgz 或其 -4 前身，差异文件与哈希随场景记录 |
| OS、Node、pnpm | macOS（darwin arm64）；Node v24.19.0；pnpm 11.7.0 |
| Desktop / 随附 CLI / Host Node | 桌面版未在本轮驱动（`/Applications/DeepSeek Harness.app` 存在；W2–W4 桌面版验证归 Windows agent，macOS 桌面版见剩余限制） |
| npm DSH / CLI / Host Node | 官方 npm 包 `@deepseek-ai/dsh@0.2.0-rc.2`（未打补丁、未开 inspector）；OpenBKN CLI 0.1.4（`~/.nvm/.../bin/openbkn`）；Host Node v24.19.0 |
| OpenBKN CLI 与实际平台各服务版本 | 平台 kind 集群 bkn-dev（192.168.50.28，0.1.5 服务镜像集，pod 全 Running）；本轮未逐服务重核 `tools/list`（见剩余限制） |
| 实际 Host/profile 匹配和未开 inspector | 独立 `$DSH_HOME=/tmp/openbkn-d0/dsh-home`，`dsh plugin --profile web install` 安装 tgz；`--dump-config` 显示双 row；全程无 `--inspect` |
| 报告 schema 与诊断入口版本 | schema v1（`src/diagnostics-contract.ts`）；Host 子路径入口 `@openbkn/dsh-business-context/diagnostics`；Remote `openbknDiagnostics/getReport` |

## 开发阶段（主开发填写）

| 项目 | 状态 | 证据类型 | 命令／退出码／报告 | 剩余限制 |
|---|---|---|---|---|
| D0 配置／模块／初始化失败时入口可用 | **部分通过（S2 未过门槛）** | 真实 npm Host + 浏览器 UI | `docs/evidence/diagnostics-d0.md`：S0 双 row 激活；S1 缺 baseUrl → `configuration-invalid`+`configField=baseUrl`；S3 apply 抛错 → `initialization-failed`；S4 诊断自身坏 import → 面板降级不崩；审核轮补验 waiting 场景（依赖缺失 → `insufficient-evidence`/`component-waiting-services`，不再误报已加载） | **S2（主入口 import 失败）未通过 D0 门槛 2**：浏览器不下发本包 client bundle（DSH 服务策略），包内 UI 不可用；Host 侧诊断服务仍活。宿主最小接口建议已记录，未改宿主，完整功能对该场景为已声明的降级 |
| D1 Host 分类、脱敏、passive/active | 通过（passive 部分） | 单测 + 实机观察 | canary 测试：嵌套 cause/URL/header/body/消息不进报告；有界 20 key；恢复语义；四边界（reader/auth/CLI/MCP）接线；实机观察到 `login-state pass`、`mcp-initialization-failed fail`、恢复后 `toolsPublished=true pass` | **active 主动复测未实现**（涉及真实平台凭据请求，须独立验收）；被动导出确认不发平台请求、不刷 Token |
| D2 独立 UI、导出、并发/取消 | 通过（部分） | 单测 + 实机 | 面板随时可达（sidebar 按钮）；业务错误页"导出诊断"入口（实机验证）；导出文件名/序列化单测；stale-load epoch 单测；实机下载事件触发（沙箱浏览器留 `.crdownload`，桌面版实测待 Windows 轮） | 复测的取消/进度条未做（与 active 复测同批）；导出失败的 UI 兜底未实测 |
| D3 类型、构建、测试、包、安装生命周期 | 通过 | 本地全套 | typecheck 0；插件测试 283（282 pass/0 fail/1 skip symlink）；repo node suites 57/57；package:check 0（62 文件含 diagnostics.js+observer chunk）；git diff --check 0；pack 0（SHA 稳定复现） | CI 彩排未跑（授权问题，非技术） |
| macOS desktop/npm 候选实机 | npm 形态通过；desktop 未测 | 实机 | npm 形态：正常登录（CLI 同步）+ 列目录（2 个网络）+ 诊断面板 4 项 pass + S1/S3 取证复核 | macOS 桌面版实机未驱动（Windows agent 覆盖 W2–W4 桌面版；macOS 桌面版可在放行前补） |
| live 守卫与真实平台操作记录 | 未测（本轮） | — | `tests/probes/guard-runtime.probe.mjs` 未重跑 | 本轮改动不触及工具挂载/guard 路径（仅加旁路观察），守卫逻辑未变；发版前按 gate 重跑 |
| G6 实际平台与模型 | 未测（本轮） | — | — | 需模型凭据与完整 eval；改动不含模型路径，按发布 gate 在彩排后执行 |

### 过程中抓到并修复的真实缺陷（均有失败先例）

1. `import { FiberState } from '@deepseek-ai/cordis'`：发布版 cordis bundle 擦除了 const enum，named import 在真实 Host 上导致整个诊断入口 failed to import（typecheck/单测均不可见）。改为公开 `fiber.state` 数值 + `fiber.await()` rethrow 互证。
2. 未在 `ctx.inject` 声明 `remote.openbknDiagnostics` → `cannot get property without inject`。
3. Remote 方法无 signal 调用 → 服务端 `signal.aborted` 崩溃；参数改可选。
4. **-5 真机回归**：D2 把 controller 提升到 apply 作用域后 port 闭包再次失去 inject 声明（缺陷 2 复发），真实平台联调时抓到并修复（commit 50d6e2f），随后 S1/S3/正常路径全部复核。
5. sanitize 的 `Number.isFinite(boolean)` 误杀布尔值；字符串自由文本可穿透（canary 测试抓到）→ 字段白名单（仅 configField）。

## Windows 场景（Windows agent 填写）

未执行。测试包就绪：`scripts/windows-verification/`（prepare/run-case/collect-state-hashes/cleanup + README），覆盖 W1/W2/W3/W4/W10 的脚本构造；W5–W9、W11 手工步骤见任务文档。候选身份见 `release/candidate/candidate-manifest.json`。

## 状态保护与清理

- 测试全部在 `/tmp/openbkn-d0`（独立 DSH_HOME + 隔离 profile）进行；用户真实 `~/.dsh` 的 profile、凭据、session 未被写入或修改。
- 平台为只读操作（列目录/状态查询），无数据变更。
- 本轮启动的 `dsh web` 进程已全部停止（pkill 本轮端口）。
- 受控故障变体仅存在于 `/tmp/openbkn-d0/s2-variant|s3-variant|s3b|s4-variant`；原 tgz 未修改。
- DSH 源码 checkout（worktree 内 release/deepseek-harness）compat 序列 apply→verify→revert 后保持干净；`runtime:build` 输出在 release/runtime（worktree 内，未提交）。

## 异常、未知与建议

- 已验证问题：见"过程中抓到并修复的真实缺陷"5 项；全部有对应修复与测试/实机复核。
- 仅推断／未测：active 复测、macOS 桌面版实机、CI build-only 彩排、live guard probe 重跑、G6、平台 `tools/list` 逐服务重核（发版 gate 项，与 -4 相比插件行为变化仅在旁路观察）。
- 是否满足完整 DIAG-01：**部分满足**。被动诊断全链路（分类/脱敏/独立入口/导出/业务回归）在真实 npm Host 上验证通过；**D0 门槛 2 未通过**（S2 场景包内 UI 随宿主策略消失，见上表）；主动复测、macOS 桌面版、Windows 验收、下载完成、CLI 0.1.5 配对、发布彩排未完成，按计划列为限制而非默认关闭。
- 需要用户决定：① 是否授权推送分支与 build-only 彩排（release gate 第 1 条）；② Windows 验收排期（包已就绪）；③ active 复测是否单独立项；④ 宿主最小接口建议（业务入口 import 失败时仍下发 client bundle）是否走上游反馈。

本报告不构成合并或发布授权。

## 审核轮（2026-10-05 晚）

外部审核对 `5602a49` 提出 3×P1 + 4×P2，全部确认成立并在后续 commit 修复：

| 问题 | 修复 | 复验 |
|---|---|---|
| P1 已启动误报（pending/disposed fiber 也 resolve） | `observeEntry` settle 后必读 state；stuck lifecycle 报 unknown | 单测（never-started/disposed/stuck 三用例）+ 实机 waiting 场景：`insufficient-evidence`/`component-waiting-services` |
| P1 恢复后残留旧失败 | observer 改按 subject 关联；listNetworks/MCP/登录补成功边界；`recovered`+`lastFailureCode` 证据 | 单测（platform-mismatch 纠正、目录读恢复）+ 实机恢复终态（5 项 pass，旧失败清除） |
| P1 Windows desktop 实为 web | desktop 形态独立 desktop profile + Start-Process 真实桌面应用（继承隔离 DSH_HOME） | 脚本已改；原生 PowerShell 试跑未做（作者机器无 pwsh，README 已注明） |
| P2 分类丢失原因 | reader 保留 httpStatus；TLS（CERT/SSL/TLS/SIGNATURE）/超时/5xx（platform-unavailable）细分；mismatch 归 configuration；401/403 → auth-rejected 不再推断登录态 | 单测（TLS、401、恢复）+ 实机 TLS 场景（context-loader fail 正确） |
| P2 cli-output-invalid 未接线 | auth 解析失败全部经 `cliOutputInvalid` 记录 | 单测（stdout 非法 JSON → observed:cli/cli-output-invalid） |
| P2 顶层 inject 依赖业务服务 | 顶层仅 `['slots','remote']`；sessions/conversation/workspaces/uiWorkspace 下沉业务段 | 构建+全套测试；实机 UI 注册正常 |
| P2 脚本 $home/$_.Force 错误 | `$homeDir`、`Remove-Item $_ -Force` | 人工复核；原生试跑未做（同上） |
| P2 manifest SHA 无效 | 身份改由 `git rev-parse` 生成写入 | `git cat-file -t` 验证通过 |

附带修复：构建前清理 lib/ 陈旧 hash chunk（曾把旧 observer chunk 打进包，62→63 文件）。修复后重出候选：源码 `63b4f43d…`，tgz SHA `0fb74a68…`，62 文件；六命令验证序列全过（typecheck/插件 290 测试 289 pass/57 repo suites/package:check/diff-check/pack）。

## 二审轮（2026-10-05 晚二）

第二轮审核对 `56c1831` 提出 1×P1 + 4×P2，全部确认并修复（终 commit `ed5d039`，候选 tgz SHA `e2d34931`，62 文件）：

| 问题 | 修复 | 复验 |
|---|---|---|
| P1 目录成功清除溯源失败 | reader 失败归属调用方法的检查点 subject（platform-directory / platform-provenance / platform-capabilities），目录成功只恢复目录 subject | 请求路径测试（受控 403 + 目录 200 → provenance 仍 fail、directory pass 互不干扰） |
| P2 401/403 分类未接入实际请求 | 401/403/LICENSE 抛点补 `httpStatus`；测试改走真实 reader 方法（mock fetcher） | 单测断言 `auth-rejected` + `httpStatus=401/403` |
| P2 CLI 恢复残留 | CLI 检查点边界移到 subprocess.run 出口（每次调用一条成败记录）；解析失败由下一次干净退出恢复 | 调用链测试（exit 1→0、非法 JSON→有效输出均 recovered） |
| P2 MCP 路径丢 TLS 原因 | 分类器抽取 + 共享传输标记；二轮探针只走到 SdkError 的 message（'fetch failed'）而误判链被截断——**三轮审核用真实 SDK 2.0.0 + 本地自签 HTTPS 证实原始链保存在 `SdkError.data.cause`**（证书码在 data.cause.cause.code） | 三轮修复：遍历 data.cause 路径后 MCP TLS 正确投影 `tls-failed`（SDK 形状单测锁定） |
| P2 cleanup 硬编码 web | 改用 `prepared.profile` | 人工复核；原生 PowerShell 试跑仍未做 |

复验环境同前（官方 npm dsh 0.2.0-rc.2、隔离 DSH_HOME、无 inspector）：正常路径 6 项 pass（cli/login-state/context-loader/platform-directory 四检查点）；TLS 场景 context-loader=network-unreachable；六命令验证全过，插件测试 294（293 pass）。D0 S2 门槛与发布验收项保持开放。

## 三审轮（2026-10-05 晚三）

第三轮审核对 `d2b2153` 提出 2×P1 + 3×P2，全部确认并修复：

| 问题 | 修复 | 复验 |
|---|---|---|
| P1 溯源/capabilities 成功无边界 | reader 各接口成功后记录自身 subject 的 pass | 请求链测试：business-graph 403→200 恢复（recovered=true），operations 不受影响 |
| P1 列表成功掩盖详情失败 | subject 细化到接口级（platform-network-list / -network-detail / -operations / -business-graph / -capabilities）；service 的目录成功记录移除，边界统一在 reader | 请求链测试：详情持续 403 + 列表 200 → list pass、detail fail 并存 |
| P2 SDK 保留 TLS 原因（data.cause） | transportMarkersOf 有界遍历 `data.cause` 路径；修正二轮"TLS 已丢失"的错误结论 | SDK 形状单测（DEPTH_ZERO_SELF_SIGNED_CERT 位于 data.cause.cause.code → tls-failed）+ 实机 TLS 场景复核 |
| P2 CLI 输出超限沿用旧 pass | lossy 抛点先记录 `cli-output-invalid`（evidence lossy=true）再抛 | 调用链测试（lossy stdout → fail 观察） |
| P2 MCP 401 误归未登录 | 凭据在场被拒统一 `auth-rejected` + httpStatus；仅缺凭据才 not-logged-in | 单测（401 brand → auth-rejected + httpStatus=401） |

修复后：299 插件测试（298 pass）、六命令全过；实机 TLS 场景 context-loader 从 network-unreachable 修正为 tls-failed；正常路径全 pass。
