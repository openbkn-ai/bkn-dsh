# Windows 验证结果：bkn-dsh `0.2.0-rc.2-openbkn.0.2.0-3`

> 执行：2026-10-04 约 17:30 – 18:40（北京时间），按 `docs/handoff/2026-10-04-windows-verification-v3.md`（`37af045`）执行。
> 范围：官方桌面版和 npm 命令行（`dsh web`）两种形态，各跑第 2 节的 12 项。
> **没有修改任何插件代码或 DSH 安装；没有发布、打 tag、合并；没有推 `main`。** 本文所在分支 `docs/windows-verification-v3-results` 从 `37af045` 切出。

证据标记：**【跑】** 实际运行得到的（命令输出、会话日志、页面 DOM 脚本）；**【屏】** agent 读屏得到的（截图和放大截图，没有人工复核）；**【读】** 读文件或配置得到的。没做的项写「未测」。

## 0. 结论

1. **`-3` 在 Windows 上，默认配置（`cordis.patch.yml` 只写 `baseUrl`，不加 `cliPath`）、CLI `0.1.5`、平台 0.1.5 下可用。** 两种形态的 12 项里，除第 7 项的「跨网络 `kn_id` 被拒」之外全部达到期望；第 7 项那一半在两种形态里都**没有被触发**（模型自己拒绝或自行改写了 `kn_id`），记为未测。
2. **`-3` 修的大记录溯源面板在 Windows 的两个宿主进程里都正常显示**：一轮 179 条平台操作、原始响应约 53.7 MB（压缩口径），面板完整列出，`completed` / `failed` / `pending` 的数量与平台侧逐项一致。
3. 本轮没有发现插件层面的失败。发现的异常（第 5 节，共 11 条）主要是平台侧、模型侧和流程侧的，其中**需要 Mac 端关注的是 A1、A7、A8**。

## 1. 环境

| 项 | 值 | 证据 |
|---|---|---|
| Windows | Microsoft Windows 10 Pro，`10.0.19045.5854` | 【跑】`cmd /c ver` |
| Node / npm / pnpm | `v24.21.0` / `11.19.0` / `11.7.0`（npm 形态单独装的 pnpm；桌面版自带的 pnpm 也是 11.7.0） | 【跑】 |
| `dsh.cmd --version` | npm 全局版 `0.2.0-rc.2`；桌面版自带 `…\resources\runtime\cli\bin\dsh.cmd` 也是 `0.2.0-rc.2` | 【跑】 |
| OpenBKN CLI | `@openbkn/bkn-sdk` **`0.1.5`**（本轮从 `0.1.5-rc.1` 升上来，`npm i -g @openbkn/bkn-sdk@0.1.5`） | 【跑】`openbkn --version` |
| 平台 | `https://192.168.50.28`；`GET /api/bkn-backend/v1/health` → `ServerName: bkn-backend, ServerVersion: 0.1.5`；本机（Windows，`192.168.50.99`）与平台在同一网段，全程可达 | 【跑】 |
| 开工前平台确认 | `openbkn --json context tools supply_ontology_hand` 输出里有 `"search_capabilities"`（Git Bash 里用 `grep` 代替 `findstr`，结果一样）。另按文档特征逐条核对：共 **28** 个工具；有 `search_capabilities`、`execute_tool`；**没有** `find_skills`、`search_tools`、`execute_skill` | 【跑】 |
| 模型 | 两种形态都选 DeepSeek-V41-Flash / High（桌面版 `desktop` profile 的默认是 GLM-5.3 + PTC，每个新会话都手动改了） | 【屏】【跑】 |
| 插件 | `@openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-3`，直接从 npm 装（桌面版用自带 `dsh.cmd`，npm 形态用全局 `dsh.cmd`） | 【跑】 |
| `plugin list` | 两个 profile 都是 `└── @openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-3`，`1 package` | 【跑】 |
| 配置 | 两个 profile 的 `cordis.patch.yml` 里只有 `- id: openbkn-business-context` + `config.baseUrl: https://192.168.50.28`，**没有 `cliPath`** | 【读】 |
| 桌面版 profile | 用户原有的 `desktop`，开着 agent-team、auto-review、schedule 三个 experimental bundle，会话标题栏会出现「智能体团队」。**不是纯原版默认配置** | 【读】【屏】 |

### 1.1 包校验

| 项 | 值 |
|---|---|
| `npm view …-3 dist.shasum`（`--registry https://registry.npmjs.org/`） | `e872edaf944dd04752af7b9ba2363d9073b0c7bb`，**与交接消息里给的一致** 【跑】 |
| `dist.integrity` | `sha512-kgLVLya7chMzCdsDYgNy1jig2sQL9nNXmP3aI5L/Y+aZiyhXueSJ5qjX0/D9KkoFbuxPW370W8jhSHs6Bh81HA==` 【跑】 |
| 发布时间 / dist-tags | `2026-10-04T08:57:01.999Z`；我开工时 `latest` 和 `rc` **都已指向 `-3`**（见 6.1） 【跑】 |
| 我自己 `npm pack` 下来的 tgz | 133,264 字节；**sha1 = `e872edaf…`（与 `dist.shasum` 一致）**；sha512 integrity 与上一行一致；sha256 = `8c329753332996454620c9d2f79d8f94f630d4f9c9277b1a5cf006ac8c6d6947` 【跑】 |
| 解包后 | 52 个文件；tree-hash（排序后的 `<sha256>  <路径>` 行，LF 拼接、末尾带 LF，再取 sha256）= `53c29251ef78d416d5d2bcec6a39ef4e9d7aeda70cdc76ac8b2740361ac2ee25`。逐文件哈希见附录，Mac 端可以对 CI 候选产物解包后用同样方法比对 【跑】 |
| 装进两个 profile 的内容 | 两个 `pnpm-lock.yaml` 里该包的 `resolution.integrity` 都与上面的 `dist.integrity` **逐字符相同** 【跑】；卸载前我在桌面版 profile 已安装的 `lib` 里 grep 到 `resolveExecutable`、`cli-unavailable`、`toolCallTimeoutMs`、`search_capabilities` 四个特征 【跑】 |
| 未做 | 没有对已安装目录逐文件求哈希：第 12 项会卸载插件，我是卸载之后才想起来要做 |

## 2. 验收结果

| # | 期望（交接文件） | 桌面版 | npm 命令行 |
|---|---|---|---|
| 1 | 面板列出网络，有「标准模式」提示 | ✅ 2 个网络，提示在 【屏】 | ✅ 同左 【跑】 |
| 2 | 新建工作区，原生选择器弹出，绑定成功，标题栏出现徽标 | ✅ 选择器直接出现在最前面；选 `ws-desktop-v3` 后绑定成功。草稿阶段只有输入框上方的绑定提示，**标题栏徽标要发出第一条消息后才出现**（第 3 项里确认） 【屏】 | ✅ 选择器同样出现在最前面；选 `ws-web-v3`，绑定成功 【屏】【跑】 |
| 3 | 9 个；`528-000036`=34；`791-000007`、`791-000015`=0；日志里 `search_capabilities`、`execute_tool` 成功，没有「only permits managed OpenBKN tools」 | ✅ 全部满足 【屏】【跑】 | ✅ 全部满足 【跑】 |
| 4 | 溯源能打开；`search_capabilities`、`execute_tool` 标「受管访问」；平台执行事实带 Request / Trace / Receipt | ✅ `int_041d5cbb5a781102f1ff313a96ec9b4e`，`completed`，9 个节点；平台执行事实列出 26 条，与平台侧 26 条一致 【屏】【跑】 | ✅ `int_d0375fa5caf21e3f297fa0c1bc8887b2`，`completed`，7 个节点；列出 15 条，与平台侧 15 条一致 【跑】 |
| 5 | 完全退出再重开，历史完整，徽标和溯源入口都在 | ✅ 退出后进程数为 0，从开始菜单快捷方式重开；会话自动恢复，溯源内容与重启前一致 【屏】【跑】 | ✅ 杀掉 `dsh web` 进程树（监听数 0）后重启；历史、徽标、溯源入口都在，溯源内容一致 【跑】 |
| 6 | 1 天；第 2 轮 `continue`，`conversation_id` 与第 1 轮相同 | ✅ 见 3.1 【屏】【跑】 | ✅ 见 3.2 【跑】 |
| 7 | ① 跨网络 `search_capabilities` 被拒，文案含 `bound to OpenBKN knowledge network "supply_ontology_hand"`；② `list_knowledge_networks` 被拒，文案以 `mcp__openbkn__list_knowledge_networks is not supported` 开头；毫秒级 | ① **未触发（未测）**：模型自己拒绝，没有发起调用。② ✅ 被拒，0 ms 【屏】【跑】 | ① **未触发（未测）**：模型把 `kn_id` 自行改成绑定的 `supply_ontology_hand` 再调用，调用成功，并如实告诉了用户。② ✅ 被拒，0 ms 【屏】【跑】 |
| 8 | 新建绑定会话问 BOM；回答完成；平台执行事实正常列出，不是「记录过大」或「不可用」 | ✅ 新建会话，完整跑了一轮（见 4）；面板列出 **179 条**，与平台侧一致 【屏】【跑】 | ✅ **没有让模型重跑**，而是打开桌面版建的同一个会话读同一份平台记录（理由和做法见 4.3）；列出 **179 条**，数量和状态与平台侧一致 【跑】 |
| 9 | `Request timed out` 耗时约 20 秒，不是 60 秒 | ✅ 6 次，20.014 – 20.037 s 【跑】 | ✅ 在 npm 宿主打开同一会话，时间链里 3 个超时分组都显示 `20.0 s` 【跑】 |
| 10 | 默认工作区会话调用 `bkn_start_interaction` 被拒，提示从 OpenBKN 入口开业务会话 | ✅ 被拒，0 ms，模型没有重试 【跑】 | ✅ 被拒，1 ms 【跑】 |
| 11 | 绑定工作区里选 PTC 模式提问：不调用工具，提示用标准模式新建会话 | ✅ 零工具调用，模型提示 【屏】【跑】 | ✅ 同左 【跑】 |
| 12 | 退出，`plugin remove`，重开：第 3 项会话仍能打开且历史完整；OpenBKN 入口消失 | ✅ 「3 轮 14 步」，无徽标、无溯源按钮；入口消失 【屏】【跑】 | ✅ 「3 轮 15 步」，三轮内容都在，无徽标、无溯源按钮；入口消失 【跑】 |

会话日志检查（7 个测试会话全部）：类型含 `openbkn/` 的事件数 **0**，带 `ignorable` 标记的事件数 **0**；在工具返回结果里「only permits managed OpenBKN tools」只出现在第 8 项的 `glob`、`pwsh` 两次被拒上（见 A6，不是对 `search_capabilities` / `execute_tool` 的拒绝）。`dsh web` 的三份启动日志里没有 error / warn 行。

## 3. 第 3、6、7 项的会话日志摘录

只列工具名、`kn_id`、`conversation_mode`、`conversation_id`、是否出错、耗时。

### 3.1 桌面版，会话 `session-f876b3a8-da53-428d-a723-621854712acc`

`conversation_id` = `conv_d45847a007c3924675184b2912a4a444`

| 轮 | 工具 | `kn_id` / 模式 | 结果 | 耗时 |
|---|---|---|---|---|
| 1 | `bkn_start_interaction` | `new` | 成功，返回上面的 `conversation_id`，`int_041d5cbb…` | 165 ms |
| 1 | `search_capabilities` | `supply_ontology_hand` | **失败**：平台 `resource_not_disclosed`（见 A1） | 37 ms |
| 1 | `search_capabilities` | `supply_ontology_hand` | 成功 | 300 ms |
| 1 | `execute_tool` ×3 | `supply_ontology_hand` | 成功 | 1219 / 2161 / 1716 ms |
| 1 | `get_skill_content` | `supply_ontology_hand` | 成功 | 77 ms |
| 1 | `bkn_finish_interaction` | — | 成功 | 87 ms |
| 2 | `bkn_start_interaction` | **`continue`**，`conversation_id` 参数 = `conv_d45847a0…`（与第 1 轮相同），返回值同 | 成功 | 100 ms |
| 2 | `execute_tool` | `supply_ontology_hand` | 成功 | 1322 ms |
| 2 | `bkn_finish_interaction` | — | 成功 | 71 ms |
| 3 | `bkn_start_interaction` | `continue`，同一个 `conversation_id` | 成功 | 124 ms |
| 3 | `list_knowledge_networks` | — | **被插件拒绝**：`Error: mcp__openbkn__list_knowledge_networks is not supported in an OpenBKN business session by this version of the bkn-dsh plugin. Do not retry it; continue with the managed OpenBKN tools.` | 0 ms |
| 3 | `bkn_finish_interaction` | — | 成功 | 69 ms |

第 3 轮**没有** `search_capabilities` 调用：模型回复「`search_capabilities`（`kn_id = worldcup_vega_catalog_bkn`）——未调用」，理由是本会话的绑定是权威的。

### 3.2 npm 命令行，会话 `session-a509a0f4-71d6-472b-9229-324d07716eab`

`conversation_id` = `conv_96359b6ee861efe2bfb85f3d0ce2fd46`

| 轮 | 工具 | `kn_id` / 模式 | 结果 | 耗时 |
|---|---|---|---|---|
| 1 | `bkn_start_interaction` | `new` | 成功，`int_d0375fa5…` | 144 ms |
| 1 | `search_capabilities` | `supply_ontology_hand`（带 `limit: 20`） | 成功 | 302 ms |
| 1 | `execute_tool` ×2 | `supply_ontology_hand` | 成功 | 1745 / 2005 ms |
| 1 | `bkn_finish_interaction` | — | **失败**：平台 `invalid_params`（模型多传了 `conversation_id`，见 A2） | 30 ms |
| 1 | `bkn_finish_interaction` | — | 成功（重试，去掉该字段） | 69 ms |
| 2 | `bkn_start_interaction` | **`continue`**，`conversation_id` 参数 = `conv_96359b6e…`（与第 1 轮相同），返回值同 | 成功 | 129 ms |
| 2 | `execute_tool` | `supply_ontology_hand` | 成功 | 1330 ms |
| 2 | `bkn_finish_interaction` | — | 成功 | 69 ms |
| 3 | `bkn_start_interaction` | `continue`，同一个 `conversation_id` | 成功 | 107 ms |
| 3 | `list_knowledge_networks` | — | **被插件拒绝**，文案同 3.1 | 0 ms |
| 3 | `search_capabilities` | **`supply_ontology_hand`**（我要求的是 `worldcup_vega_catalog_bkn`，模型自己改了） | 成功 | 244 ms |
| 3 | `bkn_finish_interaction` | — | 成功 | 72 ms |

### 3.3 第 10、11 项

| 形态 | 第 10 项（默认工作区会话） | 第 11 项（绑定工作区，PTC） |
|---|---|---|
| 桌面版 | `bkn_start_interaction`（`new`）被拒，0 ms：`Error: OpenBKN tools are available only in a session bound to an OpenBKN knowledge network. Do not retry; tell the user to open a business session from the OpenBKN sidebar…` | 0 次工具调用，24 个事件 |
| npm | 同上，1 ms | 0 次工具调用，24 个事件 |

## 4. 第 8 项（`-3` 修的大记录溯源面板）

### 4.1 桌面版，新建会话完整跑一轮

- 会话 `session-c0396b67-7278-400f-af72-af740ed5cf9b`，Interaction `int_63fb6ab6b4f03322b8b50210918dab11`。
- 17:53:42 发出，18:00:17 结束，**用时 394.4 秒（6 分 34 秒）**（会话日志里 `turn/start` 到 `turn/end` 的时间差 【跑】）；界面显示「1 轮 21 步」，**用量 2.5M tok**（缓存命中 94%）。 【屏】
- 插件日志里 27 次工具调用，其中 9 次出错（6 次超时 + 3 次被拒，见 A5、A6）。 【跑】

### 4.2 平台侧数据

`openbkn --json trace interactions operations <Interaction ID>`： 【跑】

| 指标 | 第 3 项那一轮（桌面版） | 第 8 项这一轮 |
|---|---|---|
| `entries` 条数 | 26 | **179** |
| 状态 | `completed` 23 / `pending` 3 | `completed` 145 / `pending` 28 / `failed` 6 |
| CLI `--json` 输出字节数（缩进后的文本） | 13,268,744 | **72,400,692**（1,057,487 行） |
| 压缩成单行后的字节数（原始响应体的近似值） | 9,881,790 | **53,656,617**（≈ 51.2 MiB） |

说明：
- 文档要求「响应字节数」。CLI 的 `--json` 输出做了缩进，约比原始响应大 35%，不能直接和插件的上限比；所以我同时给出压缩后的大小。
- **真正的原始 HTTP 响应体字节数没有量到**：要量它得自己用 curl 带 Token 去请求，那会把 Token 放进命令行，违反执行约束。
- 对照上限：`-3` 把这条路由的上限放宽到 64 MiB（67,108,864）；本轮压缩口径 53.7 MB，**占 80%**。`-2` 的上限是 8 MiB（8,388,608）：第 3 项那个只有 26 条操作的普通问题，压缩后也有 9.9 MB，**已经超过了 `-2` 的上限**。

### 4.3 面板显示

| 宿主 | 结果 |
|---|---|
| 桌面版（新跑的这一轮） | 时间链 26 个节点；超时的 `execute_tool` 分组显示 `error` 和 `20.0 s`；**「平台执行事实」列出第 1 – 179 条**，没有「记录过大」或「不可用」。点开后 8 秒内已完整显示，没有精确计时 【屏】 |
| npm 宿主（打开同一个会话） | 同一个 Interaction，26 个节点；**179 条**，`completed` 145 / `failed` 6 / `pending` 28，与平台侧完全一致；从点击到「平台执行事实」出现 **6.7 秒** 【跑】 |

**对「只跑一次」的处理**：交接文件第 8 项写「只跑一次」，交接消息又写「两种形态各跑一遍」，这两句矛盾。我的做法是：模型只在桌面版里跑一次（耗时、耗 token 的是这一步）；npm 形态里打开**同一个会话**重新读同一份平台记录，两个宿主进程读的是同一份 53.7 MB 数据，对比更干净，还省下一轮约 2.5M token。两种形态共用 `~/.dsh/sessions`，所以 npm 宿主能直接打开桌面版建的会话。npm 形态下**没有**新建会话让模型重跑 BOM 问题，这一点已经和交接文件的字面不一致，请知悉。

## 5. 异常清单

每条单独列出，即使最终回答是对的。

**A1. 【需要 Mac 端关注】平台对一次 `search_capabilities` 返回 `resource_not_disclosed`。**（桌面版第 3 项，37 ms）
- 错误体：`{"error":{"code":"resource_not_disclosed","message":"授权范围内不存在该请求","retryable":false,"required_action":"verify_scope_or_identifier"}}`。时间链里这一条显示 `error`。
- 失败的那次参数是 `{kn_id, query}`（外加插件注入的 `bkn_context`）；紧接着模型再发一次，多带了 `response_format: "json"`，成功。
- 本轮全部 `search_capabilities` 调用共 5 次：失败的那次是**唯一一次既没带 `limit` 也没带 `response_format` 的**；其余 4 次都至少带了一个（`limit: 20` ×2，`response_format: json` ×2）。样本太小，**不能据此下结论**，只是一条线索。
- 平台侧该 Interaction 的 26 条操作里没有这次失败的调用，说明它在执行之前就被拒了。npm 形态里没有复现。
- 回答最终是对的（重试成功）。

**A2. 模型把 `conversation_id` 传给了 `bkn_finish_interaction`，被平台拒绝。**（npm 第 3 项，30 ms）
- `invalid_params`：`bkn_finish_interaction received unsupported field(s): conversation_id. Remove them and retry`。参数是模型自己传的（日志里是模型发出的参数），第二次去掉后成功。桌面版同样的步骤没有出这个错。
- 回答不受影响。要不要在提示词里把 0.1.5 这个工具的入参写清楚，由 Mac 端判断。

**A3. 平台上每个 Interaction 都带着一批一直 `pending` 的内部操作。**
- 第 3 项（桌面）26 条里 3 条，第 3 项（npm）15 条里 2 条，第 8 项 179 条里 28 条。
- 这些操作的来源是 `internal`，名字是已发布函数的 UUID（比如「BOM 清单」函数的 id），有 Receipt，**没有 Request / Trace**，Interaction 已经 `completed` 之后仍是 `pending`。面板如实显示了 `pending`。
- 看起来是平台把函数执行的「内部记录」一直没有关闭。这是平台侧的数据特征，不是插件的问题；但用户在面板里会看到「pending」，可能被问到。

**A4. 第 7 项：跨网络检查在两种形态里都没有被触发。**
- 桌面版：模型直接拒绝发起调用（「这正是该绑定要挡住的用法」），0 次调用。
- npm：模型把 `kn_id` 自行换成绑定的 `supply_ontology_hand` 后调用，成功，并明确告诉用户「未按该 kn_id 调用……作为替代，我只调用了一次……」。
- 所以插件里 `bound to OpenBKN knowledge network "supply_ontology_hand"` 这条拒绝文案**本轮没有出现过**，这一半记为**未测**。被触发的是同一个守卫层里的另一条规则（`list_knowledge_networks` 在排除清单里，被拒，0 ms），说明 Windows 上守卫层是生效的，但不能替代跨网络 `kn_id` 检查的实机证据。
- 判断：这与 Mac 验收时「缺 `kn_id`」那项一样，是模型守规矩导致检查无法在实机触发。见 6.2。

**A5. 第 8 项：6 次 `execute_tool` 超时。**
- 6 次 `Error: Request timed out`，耗时 20,037 / 20,014 / 20,027 / 20,023 / 20,018 / 20,018 ms，**都在 20 秒左右**（符合第 9 项的期望）。
- 它们是 3 组连续失败（2 + 3 + 1），也就是模型在同一类深层展开上连续重试了几次，一共白等了约 120 秒。模型在回答里说明「4–5 层该函数在 depth≥4 时调用超时」，之后改用了其他口径。
- 平台侧对应有 6 条 `failed`，全部是 `execute_tool`，与插件日志一一对应。
- 与 Changelog 里「平台网关 60 秒 504」的说明一致，属已知的平台限制。**建议（提示词层面）**：遇到 `Request timed out` 后不要原样重试同一深度。

**A6. 第 8 项：模型尝试了不该用的工具，全部被拒。**
- `run_cypher`：被拒，`… is not supported in an OpenBKN business session by this version of the bkn-dsh plugin`，0 ms。
- `glob`、`pwsh`：被拒，`This OpenBKN business session only permits managed OpenBKN tools.`，各 0 ms。
- 注意：这条文案在这里**是对的**（这两个不是 OpenBKN 工具）。交接文件第 3 项「没有 only permits managed OpenBKN tools」应只针对 `search_capabilities` / `execute_tool` 的调用，见 6.3。

**A7. 【需要 Mac 端关注】第 8 项：模型用了 3 次 `run_code`，其中有 13 次 `execute_tool` 是在脚本里发生的，没有经过插件的守卫。**
- 平台侧 28 条 `execute_tool`，其中 15 条在 `run_code` 的时间窗口之外（等于插件日志里看到的 15 次），**13 条落在 `run_code` 的时间窗口之内**（按 `started_at` / `finished_at` 归类，这是时间窗口推断，不是平台直接标注）。这 13 条不受插件的 `kn_id` 检查和 20 秒超时约束。
- 本轮的检查结果：全部 179 条操作的输入里，带 `kn_id` 的有 176 条，**取值全部是 `supply_ontology_hand`**；另外 3 条是 `run_code` 自身，没有 `kn_id` 字段。**没有观察到跨网络访问。**
- 这是 CHANGELOG 里写的「方案 B」已知限制的实测数字：这一轮里近一半（13/28）的 `execute_tool` 绕过了插件。

**A8. 【需要 Mac 端关注】第 8 项：记录大小已用掉 64 MiB 上限的约 80%。**
- 179 条操作，压缩后 53.66 MB，上限 67.11 MB（见 4.2）。Mac 验收时同类问题是 112 条、约 50 MB；这次模型探索得更多，条数多了约 60%。
- 面板读成功了，而且 6.7 秒内显示；但余量只有约 20%，再多探索一轮就会掉进「记录过大」的降级。`-3` 把上限从 8 MiB 提到 64 MiB，对这类问题只是把悬崖往后推了一段。
- 判断：如果平台那个路由一直没有分页或摘要形式，这个上限迟早会被撞到，需要考虑别的办法（例如流式解析、或只取需要的字段）。

**A9. 第 8 项的成本。** 单轮 6 分 34 秒、用量 2.5M tok。交接文件估计「几分钟、token 较多」，实际是评测题估计值（50–180 万）的上沿以上。 【屏】

**A10. 平台函数的说明与返回不一致。**（第 6 项，两种形态都出现）
- 「标准交期」函数的说明里提到会一并返回「按物料属性采用的采购或生产口径」，实际只返回 `leadtime_days`。模型两次都如实指出「无法确认这 1 天对应采购口径还是生产口径」。回答没有错，但这是平台函数元数据的问题。 【屏】【跑】

**A11. `dsh plugin add` 装一个发布不到一天的包时，pnpm 会往 profile 的 `pnpm-workspace.yaml` 里自动写一条排除。**
- 两个 profile 都出现：`Added 1 entry to minimumReleaseAgeExclude in pnpm-workspace.yaml (set minimumReleaseAgeStrict to true to gate these updates with a prompt)`，写入的是 `- '@openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-3'`。
- 装包没有失败，只是对用户 profile 的一次静默修改；用户把 `minimumReleaseAgeStrict` 设成 `true` 的话，行为会不同（我没有测）。 【跑】【读】

**附：不算异常，但值得记录的现象**
- 卸载插件后，`cordis.patch.yml` 里的 `openbkn-business-context` 条目留在原处；两种形态重启都没有报错，会话正常打开（第 12 项）。 【跑】
- npm 形态第一次打开页面会弹「预览版说明」，点「继续」后 DSH 往 `cordis.patch.yml` 末尾追加 `ui-settings-general` 条目，我的条目在它前面，没有被破坏（README 已有这条提醒）。 【读】

## 6. 对交接文件和发布流程的意见

**6.1 验证放在发布之后，闸门顺序和 `-1` 时不同。**
- 我开工时 `latest` 和 `rc` 两个 dist-tag 都已经指向 `-3`（`npm view @openbkn/dsh-business-context dist-tags`）。任何人现在 `npm i @openbkn/dsh-business-context` 拿到的就是还没经过 Windows 验证的包。`-1` 当时是用 CI 产物发布前验的。
- 如果 Windows 验出问题，补救只能是发 `-4` 加 `npm deprecate`。判断：以后先发到非默认标签（比如 `next`），验完再把 `latest` 提上去；或者把「Windows 验证」放回发布之前的 CI 彩排产物上。
- 本轮没有发现需要撤回的问题，所以这只是流程意见。

**6.2 第 7 项用大模型来测安全边界，实机触发不了。**
- 跨网络 `kn_id` 能不能被拒，取决于模型愿不愿意发起调用，而模型被绑定提示词约束得很好：桌面版拒绝发起，npm 形态改写成绑定的 `kn_id`。这与 Mac 验收时缺 `kn_id` 那项是同一个问题。
- 判断：如果要在实机证明这条检查生效，需要绕开模型，直接对插件的工具运行时发一次带错误 `kn_id` 的调用（比如在测试里或者写一个小脚本）；否则这一项在每个平台上都会是「未测」。我这边只能照现有文档跑，做不到。

**6.3 第 3 项和第 7 项的措辞需要收紧。**
- 第 3 项「没有 only permits managed OpenBKN tools」应改成「`search_capabilities` / `execute_tool` 的调用没有被这条文案拒绝」。第 8 项里 `glob`、`pwsh` 被拒时这条文案合法出现。
- 第 7 项「文案以 `mcp__openbkn__list_knowledge_networks is not supported` 开头」：实际结果前面还有 DSH 加的 `Error: ` 前缀（平台报错也有同样的前缀），文档里加一句即可。
- 第 2 项「标题栏出现网络徽标」：草稿阶段没有标题栏徽标，只有输入框上方的绑定提示；徽标要发出第一条消息后才出现。

**6.4 预期的哈希只写在聊天里。** 文档只说「记录 `dist.shasum`」，没有写应该是多少；sha1 本身也偏弱。建议把 `dist.integrity`（sha512）直接钉进文档，并给出 CI 候选产物和发布包「解包后逐文件哈希一致」的比对方法（本文附录给了发布包的逐文件哈希和 tree-hash）。

**6.5 第 8 项「只跑一次」和「两种形态各跑一遍」互相矛盾**，见 4.3。

**6.6 CLI 版本矩阵可以更新。** 本轮用的是正式版 `@openbkn/bkn-sdk@0.1.5` 配 0.1.5 平台，登录、列网络、读 Token 都正常，补上了第二轮留下的「正式版 CLI 配 0.1.5 平台未验证」。文档里「0.1.4 或 0.1.5 都可以」可以改成「装与平台版本一致的 CLI」。

## 7. Windows 特有的发现

- **原生目录选择器**：本轮两种形态都**直接出现在最前面**（第一轮 npm 形态不会，第二轮开始出现在前面）。面板上的提示文字也已改成「请在弹出的系统窗口中选择工作区目录（窗口可能被其他窗口挡住……）」。选择器每次都打开在上一次用过的目录。 【屏】
- **整目录备份**：`%USERPROFILE%\.dsh\profiles\work\.dsh-module-fallback\node_modules` 里有 8 个目录联接点（junction）。`robocopy /E /SL` 不加 `/SJ` 时会把联接点指向的内容展开拷贝，备份比原目录多出 345 个文件（12926 vs 12581）。文档里的「整目录备份」在 Windows 上要说明用哪种方式，还原时也不能整目录镜像回去。`/SJ` 我没有试。 【跑】
- **环境变量**：用户环境变量里的 `NODE_EXTRA_CA_CERTS` 在本轮的 agent 宿主进程里仍然没有（宿主是在设置之前启动的），我给每个 CLI 命令单独 `export` 了；桌面版用开始菜单快捷方式（`explorer.exe` 启动，父进程确认为 `explorer`）启动，能拿到它。 【跑】
- **桌面版窗口的点击**：用屏幕操作工具时，窗口失焦后的**第一次点击会被吞掉**，要先点一下标题栏再点目标。这应该是测试工具和 Electron 窗口的交互，不确定是不是 DSH 的行为，只影响复现步骤。

## 8. 未测和局限

- **未测**：第 7 项①（跨网络 `kn_id` 被拒）在两种形态里都未触发；插件里 `bound to OpenBKN knowledge network …` 的拒绝文案本轮从未出现。
- **没有做**：npm 形态下用新会话让模型重跑 BOM 问题（用重读同一份记录代替，见 4.3）；对已安装目录逐文件求哈希（见 1.1）；量原始 HTTP 响应体字节数（见 4.2）；`minimumReleaseAgeStrict: true` 时的安装行为。
- **操作方式的局限**：桌面版是屏幕操作 + 读屏，npm 形态是 Claude 内置浏览器里的页面脚本（面板当时没在屏幕上显示，模拟点击不可用，所以用 DOM 脚本点击和读文本）。这些【屏】项没有经过人工复核；如果需要，建议人工抽查：桌面版第 2、4、8 项的截图（选择器是否在最前面、徽标、179 条列表）。
- **平台是放行桩**：Mac 的评估写明「本集群为放行桩，权限类结论不作为证据」，本轮同样适用。

## 9. 还原情况

- 测前备份：`C:\Users\kalia\.dsh-backup-v3`（12,926 个文件，0 个失败；因 junction 被展开，比原目录多 345 个文件，见第 7 节）。
- **已还原**：逐文件对比 `.dsh` 与备份没有差异（桌面版 `desktop` profile 的 `cordis.patch.yml`、`package.json`、`pnpm-workspace.yaml`，`storages/workspace.json`，`.credentials.yaml` 都用备份覆盖）。插件同步进 DSH 凭证库的 `OPENBKN_MCP_TOKEN` 随之清除，**没有另存副本**。OpenBKN CLI 自己保存的登录状态保留。
- **实验产物**（全部是移动，没有删除）：`C:\Users\kalia\.dsh-backup-v3\_experiment-artifacts\`，包括两个工作区的会话、`openbkn\session-bindings`、`web` profile、`desktop` profile 的 `node_modules` / `.plugin-manager` / `pnpm-lock.yaml`、两份 workspace-binding 文件、各会话的 `session_projcache`，以及测试结束时被修改文件的副本（`modified-originals\`，不含凭证文件）。其中包括 2 个没有消息的空草稿会话（切换工作区时留下的）。
- 本轮留下的全局改动：**OpenBKN CLI 从 `0.1.5-rc.1` 升到 `0.1.5`**（按用户指示继续使用 0.1.5）。PATH 和用户环境变量没有改动。
- 工作目录、日志和脚本：`C:\Users\kalia\bkn-verify\`（`v3\logs`、`v3\npm-tarball`、`tools\calls2.mjs`、`tools\tree-hash.mjs` 等）。`v3\logs\ops-*.json` 里是平台操作的原文（含业务数据），只在本机，没有提交。

## 附录：`…-3` 发布包的逐文件哈希

`npm pack @openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-3` 解包后的 52 个文件，`sha256  相对路径`。tree-hash = `53c29251ef78d416d5d2bcec6a39ef4e9d7aeda70cdc76ac8b2740361ac2ee25`（把下面 52 行按路径排序、LF 拼接、末尾加一个 LF，再取 sha256）。

<details>
<summary>展开</summary>

```
c71d239df91726fc519c6eb72d318ec65820627232b2f796219e87dcf35d0ab4  LICENSE
99ac57cb57c4c79a8cc1b5fc44238c55050cfebc02f4b941228d20672ab6608e  README.md
8f2a6e391a2d5a9471bd21bc4c4ce9b2c05a47f09e7bbaf480f6b17ab884b43a  README.zh.md
85a598829e2f395f80fa30b1bbfd4d39d5e2df54d6ed88eb2f070b207bd7f374  cordis.patch.yml
3462fbe3d37607525a699a915d22d45e477c62a4fb7b0b9dd5a97d33ebdb96ba  lib/client.js
9b1e8f87b0f7227c83398d0bb116bcb676bd2d34298b5484873d327a9e44ebb3  lib/index.js
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
4e30c02c43ab5a2d276f71563e943c2109aeff3e8f6ef3c47e605b6755ebef46  package.json
```

</details>
