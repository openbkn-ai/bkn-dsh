# Windows 验证总结报告：bkn-dsh `0.2.0-rc.2-openbkn.0.2.0-1`

> 执行：2026-09-30 23:30 – 2026-10-01 01:35（北京时间），按 `docs/handoff/2026-09-30-windows-verification.md` 执行。
> **结论：在 Windows 上，"原版 DSH 只装插件即可使用全部功能"不成立。** 两种形态在默认配置下第 1 项都失败（`spawn openbkn ENOENT`）。在 `cordis.patch.yml` 里给插件加上 `cliPath: <openbkn.cmd 的绝对路径>` 之后，两种形态的第 1–11 项全部通过。
> **本次没有修改任何插件代码或 DSH 安装。** 缺陷只做了定位和复现（见第 4 节），修复留给 Mac 端结合代码分析；`cliPath` 只是本机验证用的配置绕过，已随 `.dsh` 还原一并撤销。

## 1. 环境

| 项 | 值 |
|---|---|
| Windows | Windows 10 Pro 10.0.19045.5854 |
| Node | v24.21.0（scoop `nodejs-lts`；这台机器原来的 Node 所在的 E: 盘已不存在） |
| `dsh.cmd --version` | npm 版 `0.2.0-rc.2`；桌面版自带 `resources\runtime\cli\bin\dsh.cmd` 也是 `0.2.0-rc.2`；桌面版卸载程序显示的版本号是 `0.2.0-rc.2` |
| 插件（`plugin list`） | `@openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-1`（web 和 desktop 两个 profile 一致） |
| 插件包来源 | CI 产物：`gh run download 36711975014 -R openbkn-ai/bkn-dsh -n plugin-tarball`，sha256 `6c5a320df70b80482e9ab76f798284b29acce96c106d4bbb04453521ac7fa7eb`（`Get-FileHash` 核对一致） |
| OpenBKN CLI | `@openbkn/bkn-sdk@0.1.5-rc.1`（npm latest `0.1.5` 连不上这台平台，见发现 2） |
| pnpm | npm 版需要单独安装，装了 11.7.0（与桌面版内置版本相同）；桌面版自带 pnpm 11.7.0 |
| 平台 | `https://192.168.50.28`（EE 0.1.4），Windows 为 `192.168.50.99`，同一网段 |
| 模型 | 两种形态都手动选了 DeepSeek-V41-Flash / High（desktop profile 的默认是 GLM-5.3 + PTC 模式） |
| desktop profile 的特殊情况 | 用户原有的 profile，开着 agent-team、auto-review、schedule 三个 experimental bundle（标题栏会显示"智能体团队"），**不是纯原版默认配置** |

## 2. 验收结果

默认配置 = 按说明文件只写 `baseUrl`；+cliPath = 在同一条目下再加 `cliPath: C:/Users/kalia/scoop/persist/nodejs-lts/bin/openbkn.cmd`。

| # | npm 命令行（`dsh web`） | 桌面版 | 备注 |
|---|---|---|---|
| 1 | ❌ 默认配置 / ✅ +cliPath | ❌ 默认配置 / ✅ +cliPath | 两种形态默认配置下 `openbknBusinessContext/status` 都返回 `{"ok":false,"error":{"code":"gateway/internal","message":"spawn openbkn ENOENT"}}`，界面显示的是"无法验证 OpenBKN 连接。请检查 Token 和平台地址后重试。" |
| 2 | ✅ | ✅ | 取消后回到网络列表 |
| 3 | ✅ | ✅（第二次才成功） | Windows 原生"Select Workspace Directory"对话框；绑定成功，标题栏出现徽标。桌面版第一次选目录时，对话框开了约 5 分钟后报 `directoryPicker/pick failed: Failed to fetch`（见发现 5），重试后成功 |
| 4 | ✅ 40 张 / 全部"已确认" | ✅ 40 张 / 全部"已确认" | |
| 5 | ✅ `int_722ed9b3…`，completed，11 个节点 | ✅ `int_18e7fdc6…`，completed，12 个节点 | npm 那一轮有一个 `search_instance ×2 error` 节点（见发现 6） |
| 6 | ✅ | ✅ | npm 形态：停止并重启 `dsh web`；桌面形态：应用 → 退出，确认进程数为 0，再重新启动 |
| 7 | ✅ 40 家 | ✅ 40 家 | 两种形态第 2 轮都是 `continue`，且 `conversation_id` 与第 1 轮相同（日志见第 3 节） |
| 8 | 模型自己拒绝，没有发起调用 | 模型自己拒绝，没有发起调用 | 第 3 轮没有任何工具调用；模型给出的理由是会话绑定在 `supply_ontology_hand` 上 |
| 9 | ✅（附说明） | ✅（附说明） | 模型先发起的是 `bkn_start_interaction`（不是 `get_kn_detail`），被插件拒绝：`OpenBKN tools are available only in a session bound to an OpenBKN knowledge network. Do not retry…`；模型没有重试 |
| 10 | ✅ | ✅ | PTC 模式：没有工具调用，直接提示新建标准模式会话 |
| 11 | ✅ | ✅ | 卸载插件后第 4 项的会话能打开，3 轮历史完整；OpenBKN 入口、徽标、溯源按钮消失；`cordis.patch.yml` 里留下的 OpenBKN 条目不会导致报错 |

会话日志检查（所有测试会话）：带 `openbkn/` 类型的事件 = 0，带 `ignorable` 标记的事件 = 0。事件总数：npm 第 4 项会话 114、第 9 项 30、第 10 项 24；桌面第 4 项会话 120、第 9 项 30、第 10 项 24。

## 3. 第 7、8、9 项的日志摘录

只列工具名、`kn_id`、`conversation_mode`、`conversation_id` 和是否出错，不含业务数据。

npm 形态，第 4/7/8 项所在会话 `session-4abe3a34`：
```
turn 1 | bkn_start_interaction | mode=new      | conv_ret=conv_8b6462b4bfad3f103a567d245c14d951 | isError=false
turn 1 | get_kn_detail         | kn_id=supply_ontology_hand | isError=false
turn 1 | search_instance       | kn_id=(缺失)               | isError=true  | 插件拦截：This session is bound to OpenBKN knowledge network "supply_ontology_hand"…
turn 1 | search_instance       | kn_id=supply_ontology_hand | isError=true  | Structured content does not match the tool's output schema: data must have required property 'nodes'
turn 1 | query_object_instance ×3 / get_object_types / query_metric | kn_id=supply_ontology_hand | isError=false
turn 2 | bkn_start_interaction | mode=continue | conv_arg=conv_8b6462b4bfad3f103a567d245c14d951 | conv_ret=同上 | isError=false
turn 2 | query_object_instance | kn_id=supply_ontology_hand | isError=false
turn 3 | （无工具调用）
```
桌面形态，会话 `session-93a7a310`：
```
turn 1 | bkn_start_interaction | mode=new      | conv_ret=conv_a88a9cdd5e2bae51f18a846f91bbb6b8 | isError=false
turn 1 | get_kn_detail / search_schema / query_object_instance ×4 / query_metric ×3 | kn_id=supply_ontology_hand | isError=false
turn 2 | bkn_start_interaction | mode=continue | conv_arg=conv_a88a9cdd5e2bae51f18a846f91bbb6b8 | conv_ret=同上 | isError=false
turn 2 | query_object_instance / query_metric | kn_id=supply_ontology_hand | isError=false
turn 2 | run_code（mcp__openbkn__ 平台工具） | isError=false
turn 3 | （无工具调用）
```
第 9 项（两种形态相同，会话 `session-c0ab7c36` / `session-ed8f6c26`）：
```
turn 1 | bkn_start_interaction | mode=new | isError=true | OpenBKN tools are available only in a session bound to an OpenBKN knowledge network. Do not retry; …
```

## 4. 发现（按严重程度）

1. **🔴 阻断：插件在 Windows 默认配置下无法使用。** `OpenBknCliSubprocess` 把裸命令名 `openbkn` 作为 argv[0] 交给 `ctx.subprocess.spawn`；DSH 的 `spawn()` 不会自己解析 PATHEXT，而 Windows 上 CLI 的实际文件是 `openbkn.cmd`，于是报 `ENOENT`。
   - 已验证：用绝对路径指向 `.cmd` 时 DSH 可以正常执行。在 Node 里直接跑，`spawn('openbkn')` 报 ENOENT，`spawn('openbkn.cmd')` 报 EINVAL。
   - 建议：spawn 之前先调用 DSH 自带、能识别 PATHEXT 的 `subprocess.resolveExecutable(cliPath, env)`，并补一个 win32 测试。
   - 附带问题：界面把这个错误显示成"请检查 Token 和平台地址"，会误导用户排错方向，建议区分"CLI 不可用"这类错误。
2. **🔴 文档：按文档装的 CLI 连不上测试平台。** `npm i -g @openbkn/bkn-sdk` 会装到 latest `0.1.5`。从 `0.1.5-rc.2` 起，CLI 在发任何请求前都会先读 `GET /api/bkn-backend/v1/health`，并要求平台版本和 SDK 版本的主版本号完全一致。0.1.4 平台上这个接口返回 404，所以 `auth login` 失败（"Cannot verify platform version … returned HTTP 404. The request was not sent."）。
   - 已核实：`0.1.4` 和 `0.1.5-rc.1` 没有这个检查，`0.1.5-rc.2` 有。
   - Mac 上发现不了这个问题，因为那里装的是早先的 rc.1。
   - 需要决定：文档里固定 CLI 版本，或者把测试平台升到与 CLI 版本一致。另外插件版本名里写的是 `openbkn.0.2.0`，而测试平台是 0.1.4，这一点也需要确认。
3. **🟡 文档：npm 形态漏了 pnpm 这个前置条件。** `dsh plugin add` 只是把命令转给 PATH 里的 pnpm，没装 pnpm 就直接失败（"'pnpm' is not recognized"）。桌面版自带 pnpm，没有这个问题。
4. **🟡 两种形态共用网络 ↔ 工作区的关联。** 关联存在 `~/.dsh/storages/openbkn_workspace_bindings.json`，属于 DSH 全局存储，不按 profile 区分。在 npm 形态里关联过的网络，到了桌面版会直接显示"继续会话 / 新建会话"，**不再提供"新建工作区"**。按现在的验收顺序（先 npm 后桌面），桌面版的第 2、3 项没法照原样测。本次的做法是把这个文件移到产物目录之后再测桌面版。
5. **🟡 原生目录选择器的表现。**
   - npm 形态：对话框由 `node.exe` 弹出，**不会自动到前台**，要点任务栏才能看到。对话框打开期间，面板显示的是"正在绑定当前会话…"，文字不准确。
   - 桌面形态：对话框会出现在最前面。但开了大约 5 分钟后，面板报 `无法打开本机目录选择器：directory picker failed: client api: directoryPicker/pick failed: Failed to fetch`，重试后才成功。这大概率是 DSH 上游接口的超时。
6. **ℹ️ 平台 schema 不一致。** 有一次 `search_instance` 调用报 `Structured content does not match the tool's output schema: data must have required property 'nodes'`。看起来和平台有关，与 Windows 无关，建议在 Mac 上也查一下。
7. **ℹ️ Windows 上的其他观察：**
   - 桌面版菜单：窗口左上角菜单栏"应用"下有"关于 DeepSeek Harness / 检查更新… / 管理 dsh 命令… / 退出"。
   - "管理 dsh 命令…"会识别出 npm 版 `dsh` 的冲突，并提示"另一个 dsh 的优先级更高"。点"安装"后，**用户 PATH 的最前面**多了 `…\DeepSeek Harness\resources\runtime\cli\bin`，但安装结果的反馈有延迟。
   - `cordis.patch.yml` 的初始内容：新建的 `web` profile 里是 `[]`；用户已有的 `desktop` profile 里是一长串条目，只能追加。
   - 第一次打开 `dsh web` 时会弹出"预览版说明"，点"继续"后 DSH 会**往 `cordis.patch.yml` 末尾追加** `ui-settings-general` 条目。以后脚本化修改这个文件时要按条目 id 定位，不能直接往末尾追加。
   - CA：设成用户环境变量 `NODE_EXTRA_CA_CERTS` 后，从开始菜单启动的桌面版能拿到它（能列出网络、能调用平台）。但**当时已经在运行的 Claude 桌面版进程没有拿到**，在它的终端面板里执行 `openbkn auth login` 时 TLS 失败（DEPTH_ZERO_SELF_SIGNED_CERT）。说明文件里"重新打开终端和应用"这一步要写得更明确。

## 5. 还原情况

- `%USERPROFILE%\.dsh` 已按测试前备份还原。与备份逐文件对比没有差异；唯一的"差异"是 794 个测试前就悬空的 pnpm junction，它们指向已卸载的社区版 `C:\Program Files\DSH Desktop\…`，这也是备份时 robocopy 报 794 个失败的原因。
- DSH 凭证库里插件同步进去的 `OPENBKN_MCP_TOKEN` 已随还原移除，没有另存副本。OpenBKN CLI 自己保存的登录状态保留。
- 备份：`C:\Users\kalia\.dsh-backup-20260930`。
- 实验产物（全部是移动，没有删除）：`C:\Users\kalia\.dsh-backup-20260930\_experiment-artifacts\`，包括测试会话、session-bindings、`web` profile、desktop profile 的 node_modules/lockfile、两份 workspace-binding 文件；被修改过的原文件在测试结束时的副本放在 `modified-originals\`。
- 工作目录、日志和解析脚本：`C:\Users\kalia\bkn-verify\`（`logs\`、`tools\read-session.mjs`、`tools\calls.mjs`）。
- 用户 PATH：已恢复为测试前的值（删掉"管理 dsh 命令…"加的桌面版 cli 目录，注册表类型仍是 `REG_EXPAND_SZ`）。
- 按用户要求保留：用户环境变量 `NODE_EXTRA_CA_CERTS`；scoop 安装的 nodejs-lts、gh；npm 全局安装的 `@deepseek-ai/dsh@0.2.0-rc.2`、`@openbkn/bkn-sdk@0.1.5-rc.1`、`pnpm@11.7.0`。

## 6. 对说明文件的修订建议

1. 前置条件第 3 条写明 CLI 的版本（例如 `npm install -g @openbkn/bkn-sdk@<与平台一致的版本>`），并说明 CLI 会检查平台版本。
2. npm 形态的前置条件加上 pnpm（与 DSH 的 `packageManager` 一致，11.7.0）。
3. 第 1 节第 4 条的"重新打开终端和应用"要写明：设置环境变量之前就已经在运行的程序（包括 IDE 或 agent 宿主，以及它们内置的终端）要**完全退出后重开**，否则拿不到 `NODE_EXTRA_CA_CERTS`。
4. 第 2 节修改 `cordis.patch.yml` 时，提醒首次打开 `dsh web` 后 DSH 可能自己往文件末尾追加条目，编辑时要按 `id` 找到插件条目再改。
5. 两种形态依次测试时，会共用 `~/.dsh/storages/openbkn_workspace_bindings.json`。要么先测桌面版，要么在两种形态之间把这个文件移走，否则第二种形态的第 2、3 项测不到"新建工作区"。
6. 第 3 节可以补上 Windows 上的菜单位置："应用 → 管理 dsh 命令…"。
