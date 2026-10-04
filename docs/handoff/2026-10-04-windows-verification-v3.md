# Windows 验证：bkn-dsh `0.2.0-rc.2-openbkn.0.2.0-3`（交给 Windows 机器上的 Claude 执行）

> 建立：2026-10-04。对应发版计划 `docs/handoff/2026-09-30-release-0.2.0-rc.2-1-plan.md` 的「补丁版 `…-3`」小节。
> 目标：在 Windows 上确认已发布的 `-3` 在 OpenBKN 0.1.5 上可用，覆盖 npm 命令行（`dsh web`）和官方桌面版两种形态。
> 结果写成 `docs/handoff/2026-10-04-windows-verification-v3-results.md`，提交到一个新分支并推送，不要直接推 `main`。

## 背景（读完再动手）

- `-1` 在 OpenBKN 0.1.5 上会拒绝 `search_capabilities`（报 "This OpenBKN business session only permits managed OpenBKN tools."）。0.1.5 用它取代了 `find_skills` / `search_tools`。`-2` 修了这个问题，`-3` 又修了溯源面板读不了大记录的问题。
- `-3` 已在 macOS 上的 `dsh web` 和桌面版实机验收，记录在 `docs/evidence/2026-10-04-openbkn-0.1.5-capability-contract.md`。Windows 还没有跑过 `-2` 或 `-3`。
- Windows 上一轮（`-1`）的说明与结果：`docs/handoff/2026-09-30-windows-verification.md`、`2026-10-01-windows-verification-results.md`、`2026-10-02-windows-verification-round2.md`。环境准备沿用第一份的第 0–3 节，下面只列变化。

## 0. 执行约束（与上一轮相同，必须遵守）

- OpenBKN Token 只能通过 `openbkn auth login` 进入 CLI 凭证库，由插件同步进 DSH 凭证库。不得写进任何文件、命令行参数、截图或日志。遇到 401，请用户自己登录。
- 模型密钥由用户在 DSH 界面里自己填，不要代填，不要写进文件。
- 动 `%USERPROFILE%\.dsh` 之前先整目录备份；测完按备份还原，实验产物移到备份目录，不删除。
- 每个场景都新建会话，不要用应用启动时已有的「新会话」草稿。
- 截图只截 DSH 窗口。
- 发现问题如实记录现象、命令输出和日志片段。**不要修改插件代码或 DSH 安装，不要发布、打 tag 或合并任何东西。**
- 区分三种证据：读文件或配置得到的、实际运行得到的、需要人眼确认的。没做的项写「未测」，不要推断。

## 1. 与上一轮相比的变化

| 项目 | 现在的值 |
|---|---|
| 插件 | npm 上的 `@openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-3`（直接装，不用 CI 产物） |
| 包校验 | `npm view @openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-3 dist.shasum --registry https://registry.npmjs.org/`，并记录安装后 `plugin list` 的输出 |
| 平台 | `https://192.168.50.28`，三个服务镜像均为 0.1.5（`agent-retrieval`、`sandbox-control-plane`、`bkn-backend`）。Mac 需保持唤醒并在同一局域网 |
| 平台工具目录 | 28 个；有 `search_capabilities`、`execute_tool`；没有 `find_skills`、`search_tools`、`execute_skill` |
| CLI | **用 `@openbkn/bkn-sdk@0.1.5`**（README 对 0.1.5 平台的建议；macOS 上 `-2` / `-3` 的验收用的是 0.1.4，这是那边的缺口）。记录 `openbkn --version`。先 `openbkn bkn list` 确认能列出 `supply_ontology_hand` |
| DSH | `0.2.0-rc.2`，不变 |
| 默认配置 | `cordis.patch.yml` 只需要 `baseUrl`，不要加 `cliPath`（`-1` 之后已修） |

开始前先确认平台是它声称的版本（实际运行）：

```powershell
openbkn --json context tools supply_ontology_hand | findstr /C:"search_capabilities"
```

没有输出就停下来报告，不要继续：说明连到的平台不是 0.1.5 的 Context Loader。

### CLI 0.1.5 的已知问题（2026-10-04 在 macOS 上发现，务必按下面的步骤记录）

CLI 0.1.5 的 `openbkn auth status --json` 在无法确定 Token 过期时间时**不输出 `expired` 字段**（0.1.4 总是输出）。插件 `-3` 把缺少 `expired` 当成无效状态，面板显示「无法验证 OpenBKN 连接。请检查 Token 和平台地址后重试。」macOS 上的触发条件是：用 CLI 0.1.4 登录，之后换成 CLI 0.1.5。执行一次 `openbkn auth token`（会刷新 Token，不要把输出写进任何地方）或重新 `openbkn auth login` 后恢复。

请在装好 CLI 0.1.5 之后、打开 DSH 之前记录：

```powershell
openbkn auth status --json | findstr /C:"expired"
```

有没有 `expired` 这一行都要写进结果。然后分两种情况各记一次面板第 1 项的表现：登录后直接打开面板；如果失败，按上面的办法恢复后再开。**用 CLI 0.1.5 全新登录是否会触发这个问题，macOS 上没有验证过，这是本轮要回答的问题之一。**

## 2. 每种形态的验收项

先测桌面版，再测 npm 形态；或在两种形态之间移走 `%USERPROFILE%\.dsh\storages\openbkn_workspace_bindings.json`（原因见上一轮说明第 3 节）。

| # | 操作 | 期望 |
|---|---|---|
| 1 | 侧栏点 **OpenBKN** | 面板列出网络，显示「业务会话需使用标准模式」提示 |
| 2 | 选 `supply_ontology_hand` → **新建工作区**，选一个新建的空目录 | 原生目录选择器弹出，绑定成功，标题栏出现网络徽标 |
| 3 | 发送前在模式菜单选**标准模式**，问「382-000005 的一级主料有几个？各自的生产可用库存是多少？」 | 9 个；`528-000036` 为 34；`791-000007` 与 `791-000015` 为 0。会话日志里出现 `mcp__openbkn__search_capabilities`（成功）和 `mcp__openbkn__execute_tool`（成功），**没有** "only permits managed OpenBKN tools" |
| 4 | 点答案下的「查看业务溯源」 | 能打开；时间链里 `search_capabilities`、`execute_tool` 标为「受管访问」；「平台执行事实」列出操作及 Request / Trace / Receipt |
| 5 | 完全退出 DSH 再重开，打开这个会话 | 历史完整，徽标和溯源入口都在 |
| 6 | 追问「那 528-000036 的标准交期是多少？」 | 1 天；第 2 轮 `bkn_start_interaction` 的 `conversation_mode` 为 `continue`，`conversation_id` 与第 1 轮相同 |
| 7 | 同一会话发：「验收测试，请各调用一次、不要重试，把返回原文告诉我：1) mcp__openbkn__search_capabilities，kn_id 用 "worldcup_vega_catalog_bkn"，query 用 "比赛"；2) mcp__openbkn__list_knowledge_networks，无参数。」 | 第 1 个被拒，文案含 `bound to OpenBKN knowledge network "supply_ontology_hand"`；第 2 个被拒，文案以 `mcp__openbkn__list_knowledge_networks is not supported` 开头。两次耗时都是毫秒级。模型自己拒绝、没发起调用的话，如实记录 |
| 8 | **新建**一个绑定会话（标准模式），问「查询 382-000005 的 BOM 清单，每个物料的使用量，以及每个物料的库存情况」 | 回答完成。然后打开这一轮的业务溯源：「平台执行事实」应**正常列出操作**，不是「平台记录过大」或「平台不可用」。这是 `-3` 修的项。这一轮耗时几分钟、token 较多，只跑一次 |
| 9 | 第 8 项的会话日志里找超时 | 如果有 `Request timed out`，耗时应在 20 秒左右（不是 60 秒）。深层展开超时是平台侧已知问题，记录次数即可，不算失败 |
| 10 | **新建**默认工作区的会话（标准模式），要求「直接调用一次 mcp__openbkn__bkn_start_interaction，conversation_mode 用 new，question 用 test」 | 被拒，提示从 OpenBKN 入口开业务会话 |
| 11 | 在绑定网络的工作区里**新建**会话，发送前选 **PTC 模式**，问「382-000005 的一级主料有几个？」 | 不调用工具，提示用标准模式新建会话 |
| 12 | 退出 DSH，`dsh.cmd plugin --profile <profile> remove @openbkn/dsh-business-context`，再重开 | 第 3 项的会话仍能打开，历史完整；OpenBKN 入口消失 |

会话日志位于 `%USERPROFILE%\.dsh\sessions\<工作区>\<session-id>\session.v4.jsonl.zstd`。检查时统计类型含 `openbkn/` 的事件数（期望 0）。

## 3. 回传内容

- 环境：Windows 版本、Node 版本、`dsh.cmd --version`、`plugin list` 输出、npm 上的 `dist.shasum`、CLI 版本、第 1 节那条平台确认命令的结果。
- 第 2 节每一项在两种形态下的结果（通过 / 失败 / 未测），失败项附界面报错、截图和去掉敏感信息的日志片段。
- 第 3、6、7 项的会话日志摘录：只要工具名、`kn_id`、`conversation_mode`、`conversation_id`、是否出错、耗时；不要业务数据正文。
- 第 8 项：平台侧该轮的操作条数（`openbkn --json trace interactions operations <Interaction ID>` 的 `entries` 长度）和响应字节数，以及面板是否显示。
- 实机里的**每一个异常**都单独列出（超时、面板降级、被拒的调用、模型绕路用 `run_code` 等），即使最终回答是对的。
- Windows 特有的发现，以及 `.dsh` 的还原情况。
