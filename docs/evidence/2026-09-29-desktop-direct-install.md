# 证据：官方 DSH 桌面版直装 bkn-dsh（2026-09-29 首轮 / 2026-09-30 修复后复测）

> **2026-09-30 更新**：修复版插件（方案 A 最小闭环，分支 `feat/desktop-support-min-loop`）已在同一桌面版上复测通过，包括重启后会话可重载、溯源入口可见、会话续接正常。见文末「第二轮」。下面的首轮记录保留原样，作为问题基线。

> 目的：验证 `docs/plans/2026-09-29-official-desktop-support.md` 中"桌面版行为与 stock 宿主一致"的推断，并补齐此前未实测的桌面形态链路（安装、UI、认证、CA、工具派发、重载）。
> 结论先行：**桌面版上插件安装、加载、认证、绑定、业务问答与工具调用全部成功；会话重启后被拒绝重载（G2 ⑤ 在桌面版复现）**。另发现一个与桌面无关、影响所有 0.2.0-rc.2 宿主的溯源采集回归。

## 环境

| 项 | 值 |
|---|---|
| 桌面应用 | `/Applications/DeepSeek Harness.app`，版本 `0.2.0-rc.2`，bundle id `com.deepseek.dsh`，Team `NAN929V4UM`，hardened runtime |
| 插件包 | `release/plugin/openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0.tgz`，sha256 `f1ad2b98e8e0a7ddc0ef766dea03182a1661ceea59c72dc3117136977c6dc407`（main `5f8672a` 构建，含打补丁 generator 的 Typert 协议） |
| 平台 | 本地 kind 集群 `https://192.168.50.28`（OpenBKN EE 0.1.4），自签 CA |
| 模型 | 桌面 profile 既有配置：`deepseek-account` / DeepSeek-V41-Flash High；会话切到「标准模式」 |
| 样例 | `supply_ontology_hand` |

## 步骤与结果

| # | 步骤 | 结果 |
|---|---|---|
| 1 | 退出桌面版 → `"<app>/Contents/Resources/runtime/cli/bin/dsh" plugin --profile desktop add file:<tgz>` | ✅ pnpm 11.7.0 安装 1 包；仅 peer 警告（profile `autoInstallPeers: false`，peer 由运行时解析提供） |
| 2 | `~/.dsh/profiles/desktop/cordis.patch.yml` 追加 `openbkn-business-context.config.baseUrl` | ✅ |
| 3 | 终端启动 `NODE_EXTRA_CA_CERTS=<CA pem> "<app>/Contents/MacOS/DeepSeek Harness"` | ✅ Host 起在 19387，无插件加载报错 |
| 4 | 侧栏出现 **OpenBKN** 入口；打开面板 | ✅ 状态为已认证（实际走到的 Remote：认证状态、网络列表、工作区关联与绑定、建议芯片；没有逐项记录全部 Remote）（插件经 `openbkn` CLI 握手取 token；`openbkn` 由登录 shell 的 PATH 提供）；列出 2 个网络（截图 01） |
| 5 | 选择 supply_ontology_hand → 新建工作区（Electron 原生目录选择器）→ 新会话 | ✅ 绑定成功，会话出现建议芯片、标题栏出现网络徽标 |
| 6 | 提问「382-000005 有多少张销售订单？什么状态？」 | ✅ 回答"共 40 张，状态全部为「已确认」"，与 m5 基线的 DB 核对一致（40 张/已确认） |
| 7 | 工具调用 | ✅ 6 次 MCP 调用全部成功：`bkn_start_interaction` → `search_schema` → `query_metric` ×2 → `query_object_instance` → `bkn_finish_interaction`；平台侧 `openbkn trace interactions operations int_ef93dd3f5e9863ffa44263d2a3dec1f9` 返回 4 条 operation，全部 `completed` 且带 receipt |
| 8 | 会话日志检查（`session.v4.jsonl.zstd`） | ❌（预期内）`openbkn/business-network-bound`（seq 3）、`openbkn/managed-conversation`（seq 22）均**不带** `ignorable` 字段，全日志 `"ignorable"` 出现 0 次 |
| 9 | 退出并重开桌面版，打开该会话 | ❌（预期内）拒绝重载，报错见下（截图 03） |
| 10 | 业务溯源入口 | ❌ 回答下无溯源入口；日志无 `openbkn/turn-provenance` 事件。**根因与桌面无关**，见「附带发现」 |

步骤 9 的原文报错：

> 历史加载失败：failed to observe session "session-43e4626a-…": session "session-43e4626a-…" contains event type "openbkn/business-network-bound" (seq 3) unknown to this harness and not marked ignorable; refusing to interpret the log — it was likely written by a newer harness (raw log: …/session.v4.jsonl.zstd) (gateway/internal)

步骤 6 的回答原文（取自会话日志 seq 54，替代截图）：

> **382-000005（北斗导航农机驾驶仪）共 40 张销售订单，状态全部为「已确认」。** … 计数用知识网络已建模指标「销售订单数」= count(sales_order_id)，过滤 `product_code = 382-000005`，按 `order_status` 分组 → 仅返回一组：已确认 = 40。交叉验证：销售订单对象实例查询同条件 `total_count = 40` …

截图：
- `2026-09-29-desktop-01-network-list.png`：重载失败后的会话页上再次打开 OpenBKN 面板，显示网络列表和已关联的工作区
- `2026-09-29-desktop-03-reload-refused.png`：会话重载被拒
- 回答页截图因截屏坐标换算错误没有留存，回答以日志原文为准

## 附带发现：0.2.0-rc.2 上溯源采集失效（所有宿主）

- 现象：`bkn_finish_interaction` 结果（seq 50）含 `execution_status: completed` 和 `interaction_id`，最终回答（seq 54）在其后，但 `agent/turn-stopping` 时没有写入 `openbkn/turn-provenance`。
- 离线复现：把该会话日志喂给插件的 `findCompletedNativeMcpProvenance`（用 tsx 直接跑 `src/native-mcp-provenance.ts`）返回 `undefined`。
- 根因：0.2.0-rc.2 的 v4 会话格式里，`tool/result` 消息是 `{role:'tool', toolCallId, content:[{type:'text', text}]}`，**不再有 `{type:'tool-result', content:[…]}` 这层外壳**。插件两处仍按旧形状解析：
  - `src/native-mcp-provenance.ts:97` `firstLifecycleRecord`
  - `src/turn-timeline.ts:164` `firstResultRecord`
- 影响：打补丁的 OpenBKN Runtime 0.2.0-rc.2 同样受影响（插件代码和会话格式都一样；这是静态推断，没有在 Runtime 上重跑）。现有单测没有发现，是因为 fixture 仍是旧形状（`tests/native-mcp-provenance.test.ts`、`tests/turn-timeline.test.ts`、`tests/business-context-service.test.ts`）。
- 不影响：`managed-conversation` 走 `tools/result` 事件的 outcome 投影，没有走会话消息形状，所以写入正常。

## 现场还原（已完成）

- 插件已 `dsh plugin --profile desktop remove`；profile 的 4 个原始文件已从备份还原。安装生成的 `node_modules`、`pnpm-lock.yaml`、`.plugin-manager` 已移入 `release/desktop-probe-backup/probe-artifacts/profile-residue/`。
- 实验会话目录（坏会话）已移入 `release/desktop-probe-backup/probe-artifacts/sessions/`，作为证据保留。
- 插件存储域文件 `~/.dsh/storages/openbkn_workspace_bindings.json`（本次实验创建）已移入 `…/probe-artifacts/storages/`。
- `~/.dsh/storages/workspace.json` 中由本次实验注册的 `DSH_workspace` 条目已删除；删除前的副本在 `…/probe-artifacts/storages/workspace.json.probe`。
- 桌面版已用 `open -a` 正常重开，侧栏恢复为实验前状态（无 OpenBKN 入口，仅「默认工作区」）。
- **更正（2026-09-30）**：上面这次重开时，`DSH_workspace` 仍在注册表里，桌面版按自身行为（每次启动都在当前工作区落盘一个草稿会话）在 `~/.dsh/sessions/--Users-kalias-Documents-workdocs-DSH_workspace--/` 下建了一个 417 字节的空会话，之后才删除注册。首轮还原漏掉了它，已在第二轮收尾时移入备份。
- **凭证审计**：`~/.dsh/.credentials.yaml` 在实验时间窗内被写过（首轮 21:55:33，第二轮 00:21:35），`refs` 下有 `OPENBKN_MCP_TOKEN`（只看条目名，不读值）。这是插件认证把 CLI token 同步进 DSH 凭证库，属于项目规定的合规存储位置。没有实验前基线，无法判断条目是新增还是刷新。按用户决定保留，未改动。
- 实验当时查到的平台 operation（`int_ef93…`，约 21:57）：`op_0b41aa36…/rcpt_f728bad1…`、`op_001d3134…/rcpt_13ebbe30…`、`op_b281e75b…/rcpt_c0d814e9…`、`op_82ac9e1d…/rcpt_e2d81873…`，均为 completed。完整 id 见 `../reviews/2026-09-29-desktop-support-plan-review.md` 附录 A。
- `release/` 已被 gitignore，以上备份不会进入提交。

## 未覆盖

- 没有经过 computer-use 以外的 Electron 特有路径（自动更新、强制更新遮罩、崩溃恢复对话框里的"禁用第三方插件"）。
- `NODE_EXTRA_CA_CERTS` 是通过终端启动注入的；从 Dock/Finder 启动时需要写进登录 shell 的启动文件（桌面版会读取 `~/.zprofile`/`~/.zshrc`），这一点没有实测。
- 没有测试卸载插件后坏会话的表现（G2 ⑥ 在源码形态观察到会话从侧栏消失）。

## 第二轮：修复版插件复测（2026-09-30）

插件包：`release/plugin-min-loop/openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0.tgz`，sha256 `40821222983114d9782b2f123576e37eec83a2de22fba9501cb2ea3ae257d0fa`，由分支 `feat/desktop-support-min-loop` 的工作树构建（未提交）。插件测试 222/222、类型检查、`package:check`、仓库级 51/51 均已通过。安装和启动方式与首轮相同（终端启动并注入 `NODE_EXTRA_CA_CERTS`）；工作区选的是新建的空目录 `~/Documents/openbkn-desktop-probe`。

| # | 验证点 | 结果 |
|---|---|---|
| 1 | 绑定 supply_ontology_hand | ✅ 绑定写入 `~/.dsh/openbkn/session-bindings/<sessionId>.json`（0600，`boundAtSeq: 3`），没有写进会话日志 |
| 2 | 提问「382-000005 有多少张销售订单？什么状态？」 | ✅ 40 张，全部「已确认」，与基线一致 |
| 3 | 答案下的「查看业务溯源」 | ✅ 可打开：Interaction `int_710c31a989ec16834511e84d84ba4203`，completed，9 个时间链节点，工具节点带平台 Op/Receipt（截图 04）。首轮没有这个入口 |
| 4 | 会话日志 | ✅ 共 72 条事件，`openbkn*` 事件 0 条，`ignorable` 标记 0 个 |
| 5 | **退出并重启后打开该会话** | ✅ **正常重载**：历史完整，绑定徽标和溯源入口都在（截图 05）。首轮在这一步被拒绝 |
| 6 | 重启后追问「这些订单对应的客户有几家？」 | ✅ 回答 40 家。日志显示第 2 轮 `bkn_start_interaction` 的参数是 `conversation_mode: continue`，`conversation_id: conv_840ccaf1ca0b705571ed306542e04607`，与第 1 轮一致。这个 id 完全由日志重放恢复，插件没有另存 |
| 7 | 平台交叉核对 | ✅ `int_710c…` 在平台上有 20 个 operation，全部带 receipt；状态有 completed 也有 failed，failed 是模型在 run_code 里的重试 |

截图：`2026-09-30-desktop-04-provenance.png`、`2026-09-30-desktop-05-reloaded.png`。两张都是按窗口 id 截的，只包含 DSH 窗口。

### 第二轮还原（已完成，已逐字节比对）
- 插件已卸载；profile 的 4 个文件与第二轮开始前的备份（`release/desktop-probe-backup/run2-before/`）以及首轮开始前的原始备份逐字节一致。
- `workspace.json` 已从 `run2-before` 恢复，逐字节一致。
- 以下文件均移入 `release/desktop-probe-backup/run2-artifacts/`，没有删除：
  - 安装残留（`node_modules`、`pnpm-lock.yaml`、`.plugin-manager`）；
  - 实验会话，以及首轮遗留的 `DSH_workspace` 空会话；
  - 插件存储域 `openbkn_workspace_bindings.json`；
  - 绑定记录目录 `~/.dsh/openbkn/`。
- 空目录 `~/Documents/openbkn-desktop-probe` 已删除。
- 桌面版已用 `open -a` 重开，侧栏无 OpenBKN 入口。应用启动时又按自身行为在「默认工作区」落盘了一个草稿会话（`session-e8bc7389…`）。这是你的正常使用数据，未改动。

## 第三轮：三种形态免补丁验收（2026-09-30）

逐项记录见 `docs/handoff/2026-09-30-release-0.2.0-rc.2-1-plan.md` 阶段一和 2.3。都在 macOS arm64 上，DSH 全部未打补丁。

| 形态 | 插件包 | 结果 |
|---|---|---|
| 源码检出，构建后运行（`dsh-020-stock`，`639ed01`，`node apps/cli/lib/bin.js web`） | main `0fe6c17` 构建 | ✅ 绑定、问答 40 张、溯源 11 个节点（失败调用标 `error`）、重启重载、`continue` 续接；日志 116 条事件、插件事件 0 条。dev 形态（`pnpm dsh web`）问答和工具调用也正常 |
| npm 命令行（`@deepseek-ai/dsh@0.2.0-rc.2`，`dsh web`） | 同上 | ✅ 绑定、问答 40 张、重启重载、`continue` 续接 `conv_a5f83bc3…`；日志 84 条事件、插件事件 0 条 |
| 官方桌面版，标准模式（`open -a` 启动，CA 来自 `~/.zprofile`） | 分支 `fix/picker-copy-orphan-bindings` 构建 | ✅ 绑定、问答 40 张、溯源 8 个节点、重启重载、`continue` 续接 `conv_dd5624dd…`；日志 100 条事件、插件事件 0 条（截图 06、07）。从 Dock 启动时读取登录 shell 里的 `NODE_EXTRA_CA_CERTS`，已实测 |
| 官方桌面版，PTC 模式 | 同上（含 `6c56b78`） | ✅ 按预期拒绝：1 轮 1 步，直接提示新建标准模式会话，`tool/call` 0 条（截图 08）。PTC 支持留待后续版本 |

另外：
- 孤儿绑定记录清理：在桌面版上实测，7 天前的孤儿记录在启动时被删除，昨天的对照记录保留。
- 目录选择器取消后回到网络列表，不再报错。

每轮都已按备份逐字节还原用户环境。
