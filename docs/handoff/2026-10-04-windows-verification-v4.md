# Windows 验证：bkn-dsh `0.2.0-rc.2-openbkn.0.2.0-4` 候选包（发布前；交给 Windows 机器上的 Claude 执行）

> 建立：2026-10-04。`-4` **还没有发布**。用户决定：Windows 把需要测的都测完，再最终发布。所以这一轮测的是 CI 候选包，不是 npm 上的包。
> 本文取代 `2026-10-04-windows-verification-v3-supplement.md`（那份的内容已并入第 2 节）。
> 执行结果已记录在 `2026-10-04-windows-verification-v4-results.md`（原始提交 `9d1c50f`）。以下 L3b、备份和 L5/L6 步骤按该轮发现更正；原结果报告保留原样。剩余补测见 `2026-10-04-windows-verification-v4-followup.md`，不必重跑本文件全部内容。
> 结果写成 `docs/handoff/2026-10-04-windows-verification-v4-results.md`，提交到一个新分支并推送。**分支名不要以 `release/` 开头**（仓库规则保护这类分支，推不上去也删不掉），不要推 `main`。

## 背景

- `-4` 相对 `-3` 只改了一处宿主侧代码：插件对 `openbkn auth status --json` 的解析（PR #57）。
  - CLI 从未登录时输出只有 `{ "hasToken": false }`。`-3` 及之前的版本把它当成无效状态，面板显示「无法验证 OpenBKN 连接」，而不是登录入口。
  - CLI 0.1.5 算不出 Token 过期时间时不输出 `expired`。`-3` 同样报错。macOS 上的触发条件是「CLI 0.1.4 登录后换成 CLI 0.1.5」。
- macOS 上已在同一个候选包上验收：面板三种登录状态、守卫探针 16 项（不经过模型，直接对 DSH 工具运行时发调用）。记录在 `docs/evidence/2026-10-04-openbkn-0.1.5-capability-contract.md` 的「`…-4` 候选包验收」。
- Windows npm 形态已完成面板登录（12.6 秒，无需重启）；桌面版面板登录仍未测。原始执行前，这条完整路径在任何平台上都没有验收。
- 上一轮（`-3`）的环境准备、平台确认方法、验收项措辞见 `2026-10-04-windows-verification-v3.md` 和你自己的结果报告；下面只列这一轮的内容。

## 0. 约束

- Token、模型密钥只能留在 CLI / DSH 凭据库；不新增其他副本，不放进命令行参数、截图或日志。直接执行 `openbkn auth token` 时丢弃输出：`openbkn auth token > $null`。守卫探针可在内存中取 Token 连接 MCP，不能打印或保存它。
- **登出、登录、在浏览器里授权，都由用户本人操作。** 到这些步骤时停下来请用户执行，不要代做。
- 优先用独立 `DSH_HOME` 和 `BKN_CONFIG_DIR`，保留用户原环境。确需改动 `.dsh` 时沿用上一轮还原流程（注意 junction 和凭据文件）；CLI 只备份不含密钥的 `state.json` 等状态，不复制 `token.json`，结束时由用户登录恢复并核对平台和用户。实验产物移动，不删除。
- 每个场景新建会话；截图只截 DSH 窗口。
- 不修改插件代码或 DSH 安装，不发布、不打 tag、不合并。
- 证据分三类标注：实际运行、读屏、读文件。没做的写「未测」。**实机里的每个异常都单独列出**，即使结果是对的。

## 1. 候选包

```powershell
gh run download 37202050194 -R openbkn-ai/bkn-dsh -n plugin-tarball
Get-FileHash .\openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-4.tgz -Algorithm SHA256
```

sha256 必须是 `c4a8effbe5f84ecb399ee45ddf705c9468ef311910dcf58f62e47a0c71687a02`。不一致就停下报告。

安装时包参数写 `file:C:/完整/路径/openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-4.tgz`。`plugin list` 应显示 `@openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-4`。

**安装后、卸载前**，对已安装的插件目录逐文件求哈希，与候选包解包后的逐文件哈希比对（上一轮这一步是卸载后才想起来的）。

环境：CLI `@openbkn/bkn-sdk@0.1.5`（记录 `openbkn --version`）；平台确认命令同上一轮；`cordis.patch.yml` 只写 `baseUrl`，不加 `cliPath`。

## 2. 登录状态（npm 形态 `dsh web`，不需要模型）

每一步记录 `openbkn auth status --json` 输出里**有哪些键**（不记值），以及面板第一屏的文字。

| # | 操作 | 期望 / 要记录的 |
|---|---|---|
| L1 | 现状（已登录）：`openbkn auth status --json`；打开 `dsh web` → 点 OpenBKN | 键的列表，是否有 `expired`。面板列出网络 |
| L2 | 关掉 `dsh web`。**请用户执行** `openbkn auth logout`。然后 `openbkn auth status --json` | 键的列表。本轮 Windows 登出后实测为 `baseUrl, userId, hasToken`，不能当成「从未登录」 |
| L3 | 未登录状态下打开 `dsh web` → 点 OpenBKN | **显示登录入口**（「使用 OpenBKN CLI 登录并同步」按钮、平台地址），不是「无法验证 OpenBKN 连接」 |
| L3b | 关掉 `dsh web`，把该测试进程的 `BKN_CONFIG_DIR` 指向新空目录；在同一环境读 `auth status --json`，再启动面板。不要用 `auth delete`：登出后它是空操作，不清当前平台指针 | 键只有 `hasToken`，值为 `false`；面板显示登录入口。该变量会传给 CLI 子进程，测试后恢复原进程环境 |
| L4 | 在面板里点「使用 OpenBKN CLI 登录并同步」。**请用户在弹出的浏览器里完成授权** | 授权完成后面板列出网络，不需要重启 `dsh web`。记录浏览器、等待文案、耗时和报错。Windows npm 已完成；桌面版见补测文件 |
| L5 | L4 成功后读 `openbkn auth status --json` | 只记录面板登录后的状态。插件自己会执行 `auth token` / `auth status`，可能刷新 Token，所以此读数不能独立回答全新登录是否含 `expired` |
| L6 | 完全停止 DSH，**请用户在终端执行** `openbkn auth login https://192.168.50.28`；之后第一条 CLI 命令必须是 `auth status --json` | 这才是全新登录的干净读数；本轮实测有 `expired:false`。是否缺省取决于 JWT `exp` 或保存的 `expiresAt`，不能推广成所有认证响应都必含该键 |
| L7 | 「手动输入 Token」入口 | **不测**（需要把 Token 交给界面，超出约束）。只确认入口在登录页上存在 |

## 3. 回归（两种形态：先桌面版，再 npm；或在两者之间移走 `storages\openbkn_workspace_bindings.json`）

模型用 DeepSeek-V41-Flash / High，发送前在模式菜单选标准模式。

| # | 操作 | 期望 |
|---|---|---|
| R1 | 侧栏点 OpenBKN | 列出网络，有「标准模式」提示 |
| R2 | `supply_ontology_hand` → 新建工作区，选新建的空目录 | 绑定成功 |
| R3 | 问「382-000005 的一级主料有几个？各自的生产可用库存是多少？」 | 9 个；`528-000036`=34；`791-000007`、`791-000015`=0。日志里 `search_capabilities`、`execute_tool` 的调用没有被「only permits managed OpenBKN tools」拒绝 |
| R4 | 「查看业务溯源」 | 能打开；平台执行事实列出操作，条数与 `openbkn --json trace interactions operations <id>` 的 `entries` 长度一致 |
| R5 | 完全退出再重开，打开这个会话 | 历史、徽标、溯源入口都在 |
| R6 | 追问「那 528-000036 的标准交期是多少？」 | 1 天；`conversation_mode: continue`，`conversation_id` 与第 1 轮相同 |
| R7 | 新建默认工作区的会话（标准模式）：「直接调用一次 mcp__openbkn__bkn_start_interaction，conversation_mode 用 new，question 用 test」 | 被拒，提示从 OpenBKN 入口开业务会话 |
| R8 | 绑定工作区里新建会话，发送前选 PTC 模式，问「382-000005 的一级主料有几个？」 | 零工具调用，提示用标准模式新建会话 |
| R9 | 退出，`plugin remove`，重开 | R3 的会话仍能打开，历史完整；OpenBKN 入口消失 |

**这一轮不做**：上一轮第 8 项的大 BOM 问题（`-4` 没有改读取逻辑，单轮约 250 万 token）；上一轮第 7 项的跨网络调用（靠模型触发不了，已由 macOS 上的守卫探针覆盖）。

会话日志检查同上一轮：类型含 `openbkn/` 的事件数应为 0。

## 4. 回传

- 环境与包校验：Windows / Node / `dsh.cmd --version` / CLI 版本 / 候选包 sha256 / `plugin list` / 已安装目录与候选包的逐文件比对结果。
- 第 2 节 L1–L7 的结果，以及两个明确回答：① CLI 0.1.5 全新登录后 `auth status` 是否含 `expired`；② 从面板发起登录是否走通。
- 第 3 节 R1–R9 在两种形态下的结果。
- 异常清单（每条单独列）。
- 还原情况：CLI 是否已恢复登录，`.dsh` 是否与备份一致。
- 对这份交接文件的意见。
