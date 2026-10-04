# Windows 验证结果 v4：bkn-dsh `0.2.0-rc.2-openbkn.0.2.0-4` 候选包（发布前）

> 执行：2026-10-04 约 21:00 – 22:30（北京时间），按 `docs/handoff/2026-10-04-windows-verification-v4.md`（`4ee70bb`）执行。
> 测的是 CI 候选包，不是 npm 上的包。**没有修改任何插件代码或 DSH 安装；没有发布、打 tag、合并；没有推 `main`，也没有碰 `release/` 分支。** 本文所在分支 `docs/windows-verification-v4-results` 从 `4ee70bb` 切出。

证据标记：**【跑】** 实际运行得到的（命令输出、会话日志、页面 DOM 脚本、进程采样）；**【屏】** agent 读屏得到的（截图和放大截图，没有人工复核）；**【读】** 读文件或源码得到的。没做的项写「未测」。

## 0. 结论

1. **候选包校验通过**：sha256 与要求一致；装进两个 profile 的目录，在安装后和卸载前**两次**逐文件比对，52 个文件都与候选包解包**逐字节一致**。
2. **两个明确回答**：
   - **① CLI 0.1.5 全新登录后 `auth status --json` 是否含 `expired`：含。** 不经过 DSH 的终端登录后，我执行的第一条 `openbkn` 命令得到的键是 `baseUrl, userId, hasToken, username, expired`（`expired` 值为 `false`）。从 CLI 0.1.5 源码看，`expired` 只在算不出过期时间时才缺省（既没有 JWT `exp`，也没有登录时按 `expires_in` 存下的 `expiresAt`），所以 macOS 上「0.1.4 登录后换成 0.1.5」是令牌迁移的情形，不是全新登录的情形。
   - **② 从面板发起登录是否走通：走通。** `dsh web`（npm 形态）从「从未登录」状态点「使用 OpenBKN CLI 登录并同步」：Chrome 在命令发出 0.5 秒后自动打开，用户授权后面板**不重启**就列出网络，从点击到列出 12.6 秒（含约 10 秒的人工授权），没有报错。桌面版没有测（文件里这一节只要求 npm 形态）。
3. **`-4` 要修的两个状态都过了**：登出后（`baseUrl, userId, hasToken`）和从未登录（`{"hasToken":false}`），面板都显示登录入口，不是「无法验证 OpenBKN 连接」。
4. **回归 R1–R9：桌面版和 npm 形态全部通过。**
5. 没有发现插件层面的失败。需要 Mac 端关注的是：**面板等待浏览器授权期间只显示「正在连接 OpenBKN…」、不可取消**（A2），以及**文件本身有三处按字面执行会出问题**（第 6 节）。

## 1. 环境与包校验

| 项 | 值 | 证据 |
|---|---|---|
| Windows | Microsoft Windows 10 Pro，`10.0.19045.5854` | 【跑】 |
| Node / pnpm | `v24.21.0` / `11.7.0` | 【跑】 |
| `dsh.cmd --version` | npm 全局版 `0.2.0-rc.2`；桌面版自带 `…\resources\runtime\cli\bin\dsh.cmd` 也是 `0.2.0-rc.2`；桌面版卸载项 `DisplayVersion 0.2.0-rc.2` | 【跑】 |
| OpenBKN CLI | `@openbkn/bkn-sdk` **`0.1.5`**（`openbkn --version`） | 【跑】 |
| 平台 | `https://192.168.50.28`，`/api/bkn-backend/v1/health` → `ServerVersion: 0.1.5`；`openbkn --json context tools supply_ontology_hand` 共 **28** 个工具，有 `search_capabilities`、`execute_tool`，没有 `find_skills`、`search_tools`、`execute_skill` | 【跑】 |
| 候选包来源 | `gh run download 37202050194 -R openbkn-ai/bkn-dsh -n plugin-tarball`；该 run：`release-plugin`，`workflow_dispatch`，分支 `release/0.2.0-rc.2-openbkn.0.2.0-4`，提交 **`c4b5dce`**，`success` | 【跑】 |
| 候选包 sha256 | **`c4a8effbe5f84ecb399ee45ddf705c9468ef311910dcf58f62e47a0c71687a02`**，**与要求一致**（`Get-FileHash` 与 Node 两种方式各算一次，同值）；133,806 字节 | 【跑】 |
| 解包 | 52 个文件；tree-hash（排序后的 `<sha256>  <路径>` 行，LF 拼接、末尾带 LF，再取 sha256）= `f4e90f96d5c82e8b8c8cc505847995c6d3624f9870c58a71d7a3d010f3a5c5ad`，逐文件哈希见附录 | 【跑】 |
| 与已发布的 `-3` 相比 | 文件列表相同，只有 4 个文件内容不同：`README.md`、`README.zh.md`、`lib/index.js`、`package.json`（`lib/client.js` 没变，和「只改了宿主侧的状态解析」相符） | 【跑】 |
| 安装 | 两个 profile 都用 `plugin add file:C:/Users/kalia/bkn-verify/v4/candidate/…-4.tgz`；`plugin list` 都是 `└── @openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-4`，`1 package` | 【跑】 |
| **已装目录逐文件比对** | 对 `web` 和 `desktop` 两个 profile 的 `node_modules/@openbkn/dsh-business-context`：**安装后立刻比对一次、卸载前再比对一次，四次都是 52 个文件、tree-hash `f4e90f96…`，与候选包逐字节一致** | 【跑】 |
| 配置 | 两个 profile 的 `cordis.patch.yml` 只有 `- id: openbkn-business-context` + `config.baseUrl: https://192.168.50.28`，**没有 `cliPath`** | 【读】 |
| 模型 | DeepSeek-V41-Flash / High，每个新会话发送前都在模式菜单明确选了标准模式（或 R8 的 PTC） | 【屏】【跑】 |
| 桌面版 profile | 用户原有的 `desktop`，开着 agent-team、auto-review、schedule 三个 experimental bundle（标题栏会出现「智能体团队」），**不是纯原版默认配置** | 【读】【屏】 |

## 2. 登录状态 L1–L7（npm 形态 `dsh web`，不经过模型）

`dsh web` 的启动环境：去掉了 agent 宿主注入的代理变量，带 `NODE_EXTRA_CA_CERTS`；L3b 和 L4 额外设了 `BKN_CONFIG_DIR`（见下）。

| # | 操作 | 结果 |
|---|---|---|
| L1 | 已登录：`auth status --json`；打开面板 | 键：`baseUrl, userId, hasToken, username, expired`（**有 `expired`**）。面板列出 2 个网络，2.55 秒 【跑】 |
| L2 | 关掉 `dsh web`；**用户执行** `openbkn auth logout`；读 `auth status --json` | 键：`baseUrl, userId, hasToken`（`hasToken: false`），**没有** `username`、**没有** `expired`。`auth list` 显示「(no saved sessions)」，磁盘上 `token.json` 为 0 个。**登出不等于「从未登录」：`baseUrl` 还在** 【跑】 |
| L3 | 登出状态下打开 `dsh web` → 点 OpenBKN | **显示登录入口**，不是「无法验证 OpenBKN 连接」，用时 522 ms。第一屏文字：「使用本机 OpenBKN CLI 登录。登录完成后，插件会在 Host 内同步凭据、连接 Context Loader MCP，并加载你有权限访问的业务知识网络。 平台地址：https://192.168.50.28」；按钮：「使用 OpenBKN CLI 登录并同步」「手动输入 Token（兼容无 CLI 部署）」「刷新状态」 【跑】 |
| L3b | **用户执行** `openbkn auth delete https://192.168.50.28` | 输出 `{"deleted": false}`：**空操作**。源码里 `auth delete` 只删 `token.json`，而登出已经删过，所以它在登出之后什么也改不了，到不了「从未登录」（见 A1 和第 6 节）【跑（用户执行）】【读】。**改用空 `BKN_CONFIG_DIR` 复现「从未登录」**：`auth status --json` = `{"hasToken":false}`（键只有 `hasToken`，和 macOS 一致）；此时的面板同样**显示登录入口**，506 ms，不是「无法验证」 【跑】 |
| L4 | 在面板里点「使用 OpenBKN CLI 登录并同步」；**用户在浏览器授权** | **走通**，见下表 【跑】 |
| L5 | L4 成功后读 `auth status --json` | 键：`baseUrl, userId, hasToken, username, expired`（**有 `expired`**）。**这不是干净读数**：插件在登录后自己跑了 `auth token` 和 `auth status`（A4） 【跑】 |
| L6 | （L4 没有失败，没有走失败回退）改作**干净读数**：用户在终端执行 `openbkn auth login https://192.168.50.28`；我执行的**第一条** `openbkn` 命令，此时没有任何 DSH 进程在运行 | 22:02:58 读到：键 `baseUrl, userId, hasToken, username, expired`，**`expired` 存在，值 `false`**；平台、用户（`266c6a42-…`）与登录前一致。这就是问题 ① 的答案 【跑】 |
| L7 | 「手动输入 Token」入口 | 登录页上存在「手动输入 Token（兼容无 CLI 部署）」，页面上有 `OpenBKN Token` 密码输入框；**没有输入任何内容** 【跑】 |

**L3b 和 L4 的做法**：`dsh web` 进程带 `BKN_CONFIG_DIR=C:\Users\kalia\bkn-verify\v4\bkn-config-empty`（一个空目录）启动。DSH 给子进程清洗环境变量时只去掉名字匹配 `KEY|PASSWORD|SECRET|TOKEN` 的和所有 `DSH_*`（`@deepseek-ai/dsh-subprocess` 的 `scrubbedParentEnv`），所以 `BKN_CONFIG_DIR` 会传给 CLI 子进程 【读】；登录之后 `token.json` 确实出现在这个临时目录里，而你真实的 `~\.bkn` 没有被改动，证实了这一点 【跑】。

### L4 的时间线

进程采样器每 0.4 秒抓一次命令行含 `auth login`、`oauth2/device`、`openbkn` 的进程，授权码已打码。本地时间： 【跑】

| 时间 | 事件 |
|---|---|
| 21:59:29.2 | 我点击面板按钮；面板立刻显示「正在连接 OpenBKN…」 |
| 21:59:29.8 | DSH 的子进程运行器启动 `cmd.exe /c …\openbkn.CMD auth login https://192.168.50.28` → `node …\bkn-sdk\dist\cli.js auth login https://192.168.50.28` |
| 21:59:29.8 | CLI 执行 `cmd.exe /d /s /c "start https://192.168.50.28/oauth2/device/verify?user_code=<redacted>"` |
| 21:59:30.3 | `chrome.exe --single-argument https://192.168.50.28/oauth2/device/verify?user_code=<redacted>` 被拉起：**浏览器在登录命令发出后 0.5 秒自动打开** |
| 21:59:40.4 | 插件运行 `openbkn auth token`，随后 `openbkn auth status --json`：登录子进程已退出（用户授权用了约 10 秒） |
| 面板 | 点击后 12.607 秒，面板从「正在连接 OpenBKN…」变成网络列表（2 个网络），**没有重启 `dsh web`，没有任何报错** |

等待期间面板**只显示过一种文字**：「正在连接 OpenBKN…」，没有「请在浏览器里完成授权」之类的提示（A2）。

## 3. 回归 R1–R9

先桌面版，再 npm 形态；两者之间把 `storages\openbkn_workspace_bindings.json` 移走了（会话绑定文件 `openbkn\session-bindings\` 保留）。

| # | 期望 | 桌面版 | npm 命令行 |
|---|---|---|---|
| R1 | 列出网络，有「标准模式」提示 | ✅ 2 个网络，提示在 【屏】 | ✅ 同左，2.06 秒 【跑】 |
| R2 | 新建工作区，绑定成功 | ✅ 原生选择器自动出现在最前面；选 `ws-desktop-v4`；出现绑定提示 【屏】 | ✅ 选择器同样在最前面；选 `ws-web-v4`；出现绑定提示 【屏】【跑】 |
| R3 | 9 个；`528-000036`=34；`791-000007`、`791-000015`=0；`search_capabilities`、`execute_tool` 没被「only permits managed OpenBKN tools」拒绝 | ✅ `int_53d74348a0f6ee2a1f69a6ca71983e78`；5 次调用全部成功：`bkn_start_interaction` 167 ms、`search_capabilities` 329 ms、`execute_tool` 2049 / 1679 ms、`bkn_finish_interaction` 92 ms 【屏】【跑】 | ✅ `int_74a72a91ce7a1abf7bc3dac312f591d2`；5 次调用全部成功：142 / 308 / 1219 + 3107 / 130 ms 【跑】 |
| R4 | 溯源能打开；平台执行事实条数 = `trace interactions operations` 的 `entries` 长度 | ✅ 6 个节点；面板列到第 **15** 条，平台侧 `entries` = **15**（13 `completed` / 2 `pending`）；两个工具标为「受管访问」 【屏】【跑】 | ✅ 6 个节点；面板 15 条 = 平台侧 15（13 / 2，面板显示了 2 条 `pending`） 【跑】 |
| R5 | 完全退出再重开：历史、徽标、溯源入口都在 | ✅ 退出后进程数 0；从开始菜单快捷方式（父进程 `explorer`）重开；会话自动恢复，三样都在 【屏】【跑】 | ✅ 杀掉 `dsh web` 进程树（监听数 0）后重启；「1 轮 5 步」，问题、表格、徽标、溯源入口都在 【跑】 |
| R6 | 1 天；第 2 轮 `continue`，`conversation_id` 与第 1 轮相同 | ✅ 「1 天」；第 2 轮 `bkn_start_interaction`：`continue`，`conversation_id` 参数 = 返回值 = `conv_a0c41a89d9586df0bdc681f753058b3a`（与第 1 轮相同），96 ms 【屏】【跑】 | ✅ 「1 天」；`continue`，`conv_2323698370d34a37ccfb23f52acc53f9`（与第 1 轮相同），327 ms 【跑】 |
| R7 | 默认工作区会话调用 `bkn_start_interaction` 被拒 | ✅ 被拒，0 ms：`Error: OpenBKN tools are available only in a session bound to an OpenBKN knowledge network. Do not retry; tell the user to open a business session from the OpenBKN sidebar…` 【跑】 | ✅ 同文案，1 ms 【跑】 |
| R8 | 绑定工作区里选 PTC 模式：零工具调用，提示用标准模式 | ✅ 零工具调用（24 个事件）；模型提示「发送第一条消息之前……选为标准模式」 【屏】【跑】 | ✅ 零工具调用（24 个事件），提示同上 【跑】 |
| R9 | 退出，`plugin remove`，重开：R3 的会话仍能打开，历史完整；OpenBKN 入口消失 | ✅ 「2 轮 10 步」，无徽标、无溯源按钮，侧栏入口消失 【屏】 | ✅ 「2 轮 9 步」，问题、表格、追问都在，无徽标、无溯源按钮、入口消失 【跑】 |

会话日志检查（本轮 6 个测试会话）：类型含 `openbkn/` 的事件数 **0**，带 `ignorable` 标记的事件数 **0**；工具返回结果里「only permits managed OpenBKN tools」**0 次**，`Request timed out` **0 次**。`dsh web` 的 6 份启动日志里没有 error / warn 行。 【跑】

## 4. 异常清单

每条单独列出，即使结果是对的。

**A1. 【文件按字面执行不通】`auth delete` 在登出之后是空操作，L3b 到不了「从未登录」。**
- 源码：`auth delete <url>` → `deletePlatform` → `deleteToken`，只在 `token.json` 存在时删它；登出已经删过。它不会清 `state.json` 里的「当前平台」指针，所以 `auth status` 还会带 `baseUrl`。用户实测输出 `{"deleted": false}`。 【读】【跑（用户执行）】
- macOS 上他们是靠把进程的 `HOME` 指向空目录得到「从未登录」的。Windows 上等价的做法是 `BKN_CONFIG_DIR`（CLI 源码里的配置目录开关）指向空目录，本轮用的就是它。

**A2. 【需要 Mac 端关注】面板等待浏览器授权期间只显示「正在连接 OpenBKN…」，没有提示，也不能取消。**
- 实测等待期间只有这一种文字（采样间隔 300 ms，整个 12.6 秒里只出现过它）。浏览器没弹出，或者用户没注意到时，面板看起来就是卡住。 【跑】
- 源码：`AuthCoordinator.beginLogin()` 调用 `this.cli.run(['auth','login', baseUrl])`，**没有传取消信号**，`remoteBeginLogin` 也不接收界面的取消；CLI 会一直等到设备码过期（窗口取 `expires_in`，我没有量具体值）。 【读】
- **未测**：用户一直不授权、授权中途关掉面板、设备码超时之后面板会怎样。这三种路径没有 Windows 特有的部分，可以在 macOS 上测。

**A3. 【风险点，本轮没有触发】CLI 在 Windows 上用 `start` 开浏览器，URL 里有 `&` 会被截断。**
- `openBrowser(url)` 的 Windows 分支是 `spawn('start', [url], { shell: true, detached: true })`，参数不加引号，`cmd.exe` 会把 `&` 当成命令分隔符。 【读】
- 本轮设备码流程的 URL 只有一个查询参数（`?user_code=…`），实测 Chrome 打开了完整地址。 【跑】
- 如果平台以后换成带多个参数的授权地址，在 Windows 上浏览器会打开被截断的 URL。

**A4. 面板登录后的 `auth status` 读数被插件自己的调用污染，不能回答问题 ①。**
- 21:59:40 插件在登录后自己执行了 `auth token` 和 `auth status`。按 CLI 源码，Token 缺 `expiresAt` 时 `auth token` 会触发刷新并补上它（`needsRefresh = expiresAt === undefined || …`），可能把「缺 `expired`」的状态改成「有」。 【读】
- 所以 L5 只能作为参考；**问题 ① 的结论以 L6 的干净读数为准**（见第 0 节）。

**A5. 【更正上一轮的线索】`resource_not_disclosed` 与「缺 `limit` / `response_format`」无关。**
- 上一轮（`-3` 报告 A1）我记录：唯一失败的那次 `search_capabilities` 是唯一一次既没带 `limit` 也没带 `response_format` 的，并把它作为线索。
- 本轮两个形态的第一次 `search_capabilities` **都只带 `{kn_id, query}`，都成功了**（桌面版 R3 329 ms，npm R3 308 ms）。这条线索不成立，上一轮那次失败仍是原因不明的孤例（两轮共 7 次调用中 1 次，且本轮 0 次）。 【跑】

**A6. 平台上每个 Interaction 仍带着一直 `pending` 的内部操作。**
- 本轮两个 R3 的 Interaction 都是 15 条操作，13 `completed`、2 `pending`；面板如实显示 `pending`。与上一轮一致，是平台侧数据特征。 【跑】

**A7. 平台函数「标准交期」的说明与返回不一致，模型再次指出。**
- R6 里模型在两个形态下都说明：函数说明里提到会返回采购或生产口径，但实际只返回 `leadtime_days`。回答是对的。与上一轮一致。 【屏】【跑】

**A8. 卸载插件后 `cordis.patch.yml` 里留着 OpenBKN 条目。** 两个形态重启都没有报错，会话正常打开（R9）。 【跑】

**A9. npm 形态首次打开页面仍会弹「预览版说明」**，点「继续」后 DSH 往 `cordis.patch.yml` 末尾追加 `ui-settings-general`；我的 OpenBKN 条目在它前面，没有被破坏（README 已有这条提醒）。 【跑】

## 5. 还原情况

- **`.dsh`**：测前备份 `C:\Users\kalia\.dsh-backup-v4`（12,926 个文件，失败 0；`profiles\work` 下的目录联接点会被展开，备份比原目录多约 345 个文件，沿用上一轮的做法，还原不整目录镜像）。**已还原**：逐文件对比与备份没有差异（`desktop` profile 的 `cordis.patch.yml`、`package.json`、`storages\workspace.json`、`.credentials.yaml` 都用备份覆盖）。插件同步进 DSH 凭证库的 `OPENBKN_MCP_TOKEN` 随之清除，**没有另存副本**。
- **实验产物**（全部是移动，没有删除）：`C:\Users\kalia\.dsh-backup-v4\_experiment-artifacts\`，包括两个工作区的会话、`openbkn\session-bindings`、`web` profile、`desktop` profile 的 `node_modules` / `.plugin-manager` / `pnpm-lock.yaml`、两份 workspace-binding 文件、各会话的 `session_projcache`、被修改文件在测试结束时的副本（`modified-originals\`，不含凭证文件），以及我用来复现「从未登录」的临时 CLI 配置目录（`cli\bkn-config-empty`，里面的登录已经用 `auth logout` 清掉，`token.json` 为 0 个）。其中有 1 个没有消息的空草稿会话（切换工作区时留下的）。
- **CLI 登录**：**已恢复**。你在终端里重新登录后，平台和用户（`266c6a42-…`）与测试前一致，`auth status --json` 的键是 `baseUrl, userId, hasToken, username, expired`，`openbkn bkn list` 能列出 `supply_ontology_hand` 和 `worldcup_vega_catalog_bkn`。
- **偏离文档的一处**：文档要求「动 CLI 登录状态之前先备份」。CLI 的 Token 是 `~\.bkn\platforms\…\users\…\token.json` 里的明文 JSON，整目录备份会在磁盘上多出一份带 Token 的副本，和「Token 不写进任何文件」冲突，所以我**只备份了不含密钥的 `state.json` 和 `version-check.json`**（`C:\Users\kalia\.bkn-state-backup-v4`），每一步记录 `auth status --json` 的键，结束时用登录恢复。还原后 `state.json` 与备份逐字节相同；`version-check.json` 只有缓存时间戳不同。
- 本轮没有改动 PATH 和用户环境变量；工作目录、日志和脚本在 `C:\Users\kalia\bkn-verify\v4\`（`logs\ops-*.json` 里是平台操作原文，含业务数据，只在本机，没有提交）。

## 6. 对这份交接文件的意见

1. **L3b 按字面执行不通**（A1）：`auth delete` 在登出之后是空操作。建议改成「`BKN_CONFIG_DIR` 指向空目录再启动 `dsh web`」，并写明 DSH 会把这个变量传给 CLI 子进程（名字里不能带 `KEY` / `TOKEN` / `SECRET` / `PASSWORD`，也不能以 `DSH_` 开头）。
2. **§0「动 CLI 登录状态之前先备份」与「Token 不写进任何文件」自相矛盾**：CLI 的凭据是明文 `token.json`。建议改成「只备份不含密钥的 `state.json`，结束时用登录恢复，并核对平台和用户一致」。
3. **L5 不能干净地回答问题 ①**（A4）：面板登录后，插件会自己跑 `auth token` / `auth status`。建议把「用户在终端登录，我的第一条 `openbkn` 命令读 `auth status --json`」（现在的 L6）直接写成回答 ① 的正式步骤，而不是 L4 失败时的回退。同时在文件里说明：`expired` 缺不缺取决于 Token 里有没有 JWT `exp` 或存下的 `expiresAt`，和 CLI 版本关系不大；macOS 的触发条件是旧版本写下的 Token，不是全新登录。
4. **L 节只覆盖 npm 形态。** 桌面版是 Electron 宿主，起 CLI 子进程、开浏览器的路径与 `dsh web` 不是同一个进程模型，面板登录在桌面版上**没有测过**。如果需要，可以补一轮：登出 → 在桌面版里点登录 → 授权（需要用户再配合一次）。
5. **L4 建议加三种路径**（都没有 Windows 特有部分，可在 macOS 上测）：用户一直不授权、授权中途关掉面板、设备码超时。现在的实现没有取消信号（A2），这三种情形面板的表现没有人看过。
6. **这一轮的顺序是对的**：先测 CI 候选包，再发布。上一轮（`-3`）是先发布后验证，这一轮把闸门放回了发布之前，建议保持。
7. **发布后的比对**：已发布的 `-4` 解包后的 tree-hash 应当是 `f4e90f96d5c82e8b8c8cc505847995c6d3624f9870c58a71d7a3d010f3a5c5ad`（候选包 tgz 的 sha256 和 npm 上的 tgz 不会相同，因为打包时间戳不同，要比解包后的逐文件哈希）。附录给出了逐文件哈希，方便直接 diff。
8. **R 节的判据都是可机器检查的**（条数一致、`conversation_id` 相同、事件数为 0），这一点很好，建议保持。

## 附录：候选包逐文件哈希

候选包（run `37202050194`，`c4b5dce`）解包后的 52 个文件，`sha256  相对路径`。tree-hash = `f4e90f96d5c82e8b8c8cc505847995c6d3624f9870c58a71d7a3d010f3a5c5ad`（把下面 52 行按路径排序、LF 拼接、末尾加一个 LF，再取 sha256）。

<details>
<summary>展开</summary>

```
c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4  LICENSE
dbdeb84c2b32881da90fb811af8f5971184816f31ee30297b8240b5a70da913e  README.md
250ed56903f18de1cc4bab265ecc26058aade849ec556f1d728d87c25c5663fb  README.zh.md
85a598829e2f395f80fa30b1bbfd4d39d5e2df54d6ed88eb2f070b207bd7f374  cordis.patch.yml
3462fbe3d37607525a699a915d22d45e477c62a4fb7b0b9dd5a97d33ebdb96ba  lib/client.js
fa5edb1c2e5f82b4512f383d5658a4decb144c80e161ea7b00ac9d8d96e6f72e  lib/index.js
5e2d26ee86d0fe170dac8cd3f5854e67bdea334c57f40a5766ace57b8304c17d  lib/typert.host.d.ts
71eeb8d6de7e21f865bd24c52e921843b1b980ad8f1a4942be611b485a362707  lib/typert.host.js
be056647a549717d538a51e278c4ce6ea0a666a39d0b13e2ec9be935b3588a50  lib/typert.remote-client.d.ts
d3bc893e23288a0d50f7027e43b7e4e7eaa3549c2c4f8054673aa5eec745f313  lib/typert.remote-client.js
03bab5120ec1855f297421f22a90f9363f5af9724ecf48586a76c3b1b9b0bde2  lib/types/auth.d.ts
1cd74630394bd7cdfd9f70ec100d1fed290f98aeb7a66eea9864b26787775895  lib/types/business-context-service.d.ts
4a6cc71b686d9ad79923e7206a01fa3d2688de83a8334de5afa18b05833252bf  lib/types/business-graph-model.d.ts
a76067557bb935f31eea0d81370f398fa7b979197c64055a8db7808d48bcc07a  lib/types/business-network-catalog.d.ts
87028f24515ac814f7ae0aa90f4bc3d7784031fdeb1bbe56bcb4b95ca2e8de1a  lib/types/client/BoundNetworkBadge.d.ts
07ee9643f7d0e56a8281081df56a01350a10587a35d8ffb52fc8abc0cf831275  lib/types/client/OpenBknContextToolView.d.ts
f6f306c7e19edfd5dd937ffc588d91427a0b0ca1b60405dbacb5537973993575  lib/types/client/OpenBknEntry.d.ts
80e96447d0a8eaae24bbcf02df5163457354cfdc292aa1005b37fb81e6a3e68d  lib/types/client/OpenBknOverlay.d.ts
332d939dcbe152e963d6af3f6c952589eb48b0da18f899f2c10036993fd0dddd  lib/types/client/ProvenanceOverlay.d.ts
e447021c1d1d64de0521db8db834362275538084e2f9a183445d261f33ddb018  lib/types/client/SuggestionDock.d.ts
e5545baac9fd979c28b30bcfde30cd0d9b9c0dacec7fc3ba924d17761a703b83  lib/types/client/TurnProvenanceActions.d.ts
b450d4fff6020d6c8c8cc21469c1fe0f1e945557b06898be453a14178ad0d0af  lib/types/client/index.d.ts
10bfbab117331d6970c4dd7a386eea47349e7a394661645217c749679d30ab80  lib/types/client/network-directory.d.ts
6379f76a62cc6dc432b52636199a975e3bc7b43d04a7f8972df0a0b9e218ddfd  lib/types/client/openbkn-ui-controller.d.ts
0e612bc5beb58e1091de1362ef2f29bf7df426b8b18cfe7d4ae866110ebd9ced  lib/types/client/suggestion-dock-controller.d.ts
eb633affb0bf66242ee1ff3256a14fa1a7c96f380a8f39769a12e514ab6e749b  lib/types/client/turn-provenance-controller.d.ts
2d7b42ff0292d39dd5b8cc18ad3940f97162b05103bf8befc52f7fc4691990d0  lib/types/config.d.ts
7314da6ebbe8557425e6adb77dc6880d027454ad629a5507bffc9d81fa0eeb68  lib/types/dsh-session-binding.d.ts
edf7040012d1750f0f6a00ea0572df2833e97f3da5008de89c15aab904c38b85  lib/types/dsh-session-provenance.d.ts
d922f20f06840a3c04016c279d52f45c2b467bcdb1f0973b6e19a664f7be6d8b  lib/types/index.d.ts
032942766f8d88c6417aa7d350af38f45587134408d75639a378f2b0b7215784  lib/types/interaction-lifecycle.d.ts
bef249332959baa3f77b8d5f61ab1d4112a91d474fccb8dda7a48b64cd7aeda0  lib/types/interaction-references.d.ts
99ce1b9500b077c737bf668160d02328dc7dc925073094cba96aab7d6f2ee163  lib/types/managed-session-policy.d.ts
4c6dcf2937ad7d2c7cc4caa6dcef77da38af8d745d08364170ce27ccaa920351  lib/types/native-mcp-provenance.d.ts
e730e047f1c1210c1164c4c45fe69b21d04c288888d9e16b7fae6e15c36617e2  lib/types/network-capability-profile.d.ts
cde112144bc68ad205d2bbb66d494846bb5798bc65b3aac67bc74e072a5b9463  lib/types/openbkn-cli-subprocess.d.ts
ecf769597d197fbfcfd80034899f40eac9eae75bdcf959be6966ff00412f8c12  lib/types/openbkn-mcp-manager.d.ts
32d68ce653b0ebbe3a5d0b380390528784cb2e86df5bf0240889537c5a8b68a2  lib/types/platform-reader.d.ts
a5f9f84828bf5f6f3918f0c58697e390127c0cb13eb548c3549b980ea5ce4e52  lib/types/provenance-handle.d.ts
bed493bf5672501a5198a0ca3cfdd49b3058765f219eee181bd614b640c4e16a  lib/types/provenance-view.d.ts
48bd58e5fa20d1289a2003b3dacfa464dceef17f7c69078217b44ac06eb8ecfc  lib/types/scoped-business-context.d.ts
83904ea6070f4c5f8dffd1699ad2d15b0d98d26486f4de6f97c2195034d144c0  lib/types/session-binding-store.d.ts
f25525d56b82bee53a1f9797cb918d27c08f6a91b25978cf828b1a068a8388fc  lib/types/session-binding.d.ts
8d9e3f08022253cda24fe783f9a9f55eb907cd539fb5228c1925599ba9d2b7fa  lib/types/suggested-prompts.d.ts
76c2db2de38642a8f58a93148b29777ed70c6929b000d6af2e6663bf465e504d  lib/types/timeline-fold.d.ts
6e55da8a63bf08a9ad2011cb4385d0668c059b36bfa79130e046b6951de4ccf4  lib/types/tool-result-message.d.ts
c001a16c2de58f21b1ef49e6e8d473545b4ea40239d16c48cc3da64751127742  lib/types/trailing-slashes.d.ts
7cd5cb900a8516e880eb66a30936e8b7473d2d24221402d4f4f21e54a414c4c1  lib/types/turn-provenance.d.ts
eb90b0871add78ba00b08ea743329c3a40c609c0a4e1ac972b3867adf08fb937  lib/types/turn-timeline.d.ts
dde9e2299e8453e6163461e3323652d575793d53f481ca47af49dfe480e3f281  lib/types/types.d.ts
56499a16199296f15fa6b088924b2d21d75356a8f4c931af60c83b81ead81d96  lib/types/workspace-binding-registry.d.ts
292a110a7583ad3f33f11f569f897c0ac0cc82a837e9384c798e2bc057239de1  package.json
```

</details>
