# `…-3` 之后暂不处理的事项

> 建立：2026-10-04。来源：`-3` 的 macOS 验收与 Windows 验证（`docs/evidence/2026-10-04-openbkn-0.1.5-capability-contract.md`、`docs/handoff/2026-10-04-windows-verification-v3-results.md`）。
> 用户决定（2026-10-04）：`-4` 只包含登录状态解析修复（PR #57）和「不经过模型的守卫实机测试」。下表各项不进 `-4`。

## A. 插件侧可以做、但这次不做的

| # | 事项 | 影响面 | 与上游平台的关系 | 建议 |
|---|---|---|---|---|
| A1 | **操作记录读取上限 64 MiB** | 一轮对话的平台操作记录超过 64 MiB 时，溯源面板的「平台执行事实」「证据链」显示「平台记录过大」，时间链不受影响。实测一轮 BOM 查询已到 50 MB（macOS，112 条）和 53.7 MB（Windows，179 条），余量约 20%。模型多探索一轮就会超限。只影响溯源展示，不影响问答 | 根因在平台：操作记录接口返回每条操作的完整 `input` / `output`，没有分页和摘要形态。已提 [bkn-foundry #2005](https://github.com/openbkn-ai/bkn-foundry/issues/2005) | 等 #2005。平台提供摘要或分页后，插件改用它，并把上限调回小值。若平台短期内不做，插件侧的备选是流式解析、边读边丢 `input` / `output`，改动较大，需要单独评估和验收。在此之前 README 写明该限制 |
| A2 | **超时后原样重试同一深度** | 已发布函数在 BOM 4 层以上展开时不返回。模型会对同一深度连续重试，每次等满 20 秒。Windows 一轮里 6 次超时，白等约 120 秒；macOS 一轮 5 次。回答最终正确，但慢，也多花 token | 根因在平台：函数执行超过入口网关 60 秒。已提 [bkn-foundry #2004](https://github.com/openbkn-ai/bkn-foundry/issues/2004) | 在会话提示词里加一条：`Request timed out` 之后不要用相同参数重试，改小范围或换路径。提示词改动要重跑评测集后再发 |
| A3 | **`bkn_finish_interaction` 入参** | 模型偶尔把 `conversation_id` 传给 `bkn_finish_interaction`，平台以 `invalid_params` 拒绝，模型去掉后重试成功。Windows npm 形态出现 1 次，桌面版和 macOS 未出现。多一次往返，不影响结果 | 平台 0.1.5 的入参校验是严格的，行为正确；属于模型侧波动 | 在提示词里写明该工具只接受 `interaction_id`、`outcome`、`answer`。与 A2 一起改、一起评测 |
| A4 | **绑定会话里不能用 `ask_user_question`** | 模型想向用户确认时调用 DSH 自带的提问工具，被插件拒绝（所有非 OpenBKN 工具都被拒）。模型只能直接在回答里发问。自绑定会话功能上线以来一直如此 | 无 | 评估把 `ask_user_question` 列为绑定会话允许的宿主工具。它不读写文件、不访问网络，风险低；但要确认它在 DSH 里的全部行为，并做实机验收 |
| A5 | **Token 刷新失败时的提示** | CLI 的登录状态看起来有效、但 `openbkn auth token` 刷新失败时，面板显示笼统的「无法验证 OpenBKN 连接」，而不是登录入口。PR #57 没有覆盖这一半 | 取决于 CLI 在刷新失败时的退出码和输出，目前没有真实样本 | 先拿到真实的失败输出（让 Token 实际过期，或向 CLI 维护者确认），再按发版闸门写失败用例后修复 |
| A6 | **提示词里的模式默认值** | 桌面版 profile 默认是 PTC 模式时，用户必须在发送第一条消息前手动改成标准模式，否则这一会话不能用，且不能再切换。面板有提示，但容易忽略 | 无。PTC 支持是之前决定的「方案 A：拒绝并提示」 | 维持现状。若要改善，可评估由插件在绑定会话创建时把模式预设为标准模式，需要确认 DSH 是否提供这个能力 |

## B. 平台侧的问题（已反馈上游）

| # | 事项 | 影响面 | 上游 issue | 插件侧在此期间的处理 |
|---|---|---|---|---|
| B1 | 已发布函数深层展开超过入口网关 60 秒，`execute_tool` 返回 504 | 「整个 BOM 每个物料的库存」这类问题反复超时，模型改用更浅的层数加指标补齐 | [bkn-foundry #2004](https://github.com/openbkn-ai/bkn-foundry/issues/2004) | 插件超时保持 20 秒（加长无用，只会让失败更慢）；见 A2 |
| B2 | 操作记录接口没有摘要形态和分页 | 见 A1 | [bkn-foundry #2005](https://github.com/openbkn-ai/bkn-foundry/issues/2005) | 读取上限 64 MiB |
| B3 | `run_code` 内的嵌套工具调用不受会话绑定网络的约束，脚本里可调用 `execute_action` | 插件的网络范围限制和「不执行动作」的限制对脚本内的调用无效，只剩提示词约束。Windows 一轮里 28 次 `execute_tool` 有 13 次发生在脚本内；该轮未观察到越界 | [bkn-foundry #2006](https://github.com/openbkn-ai/bkn-foundry/issues/2006) | README 已写明该限制。平台提供范围声明后，插件配合传入 |
| B4 | 已发布函数的内部操作记录在 Interaction 完成后仍为 `pending` | 溯源面板的平台操作列表里出现「pending」，名称是函数的 UUID，用户会以为有操作没跑完。每调用一次函数留一条 | [bkn-foundry #2011](https://github.com/openbkn-ai/bkn-foundry/issues/2011) | 面板如实显示。若平台不改，可评估在面板里把这类内部记录折叠或标注 |
| B5 | 样例函数「标准交期」的说明承诺返回采购/生产口径，实际只返回天数 | 模型按说明找口径找不到，回答里要额外说明或再查一次物料对象 | [bkn-samples #63](https://github.com/openbkn-ai/bkn-samples/issues/63) | 无 |

## C. 未复现、只记录的

| # | 现象 | 状态 |
|---|---|---|
| C1 | Windows 桌面版里一次 `search_capabilities` 被平台以 `resource_not_disclosed` 拒绝（37 ms），模型重试成功 | macOS 上用相同参数连调 6 次都成功。报告里「缺 `limit` / `response_format`」的线索不成立，原因未知。再出现时记录完整的请求参数、时间和平台日志 |
| C2 | 同一会话两轮回答的 BOM 物料数不一致（272 与 333） | 两次都是模型在 `run_code` 里自行计算，未核实哪个正确。属于回答准确性，需要评测题覆盖 |
| C3 | `dsh plugin add` 安装发布不到一天的包时，pnpm 往用户 profile 的 `pnpm-workspace.yaml` 写入一条 `minimumReleaseAgeExclude`（Windows 报告 A11） | 安装成功，但这是对用户 profile 的一次静默修改，来自 DSH 调用的 pnpm，不是插件的行为。用户把 `minimumReleaseAgeStrict` 设为 `true` 时的安装行为未测。只影响发布后 24 小时内安装的用户。处理：下次发版后在 `minimumReleaseAgeStrict: true` 下实测一次安装，再决定 README 是否需要说明 |

## D. 验证上的缺口

| # | 缺口 | 计划 |
|---|---|---|
| D1 | 跨网络 `kn_id`、缺 `kn_id` 的拒绝无法通过模型触发 | 已完成：固定 `-4` 候选在 macOS live 通过 16/16，Windows PATH／绝对 .cmd 两次均 16/16；主开发独立读取两次平台记录，均只有 search_capabilities。见 `../evidence/2026-10-05-rc4-windows-release-triage.md`。不涵盖 run_code 内嵌调用或账号授权隔离 |
| D2 | 评测集 11 题里只跑了 5 题 | 提示词改动（A2、A3）时一并全量跑 |
| D3 | 源码构建形态没有用 `-2` / `-3` 验证 | OpenBKN 0.2.0 整体回归时覆盖 |
| D4 | CLI 0.1.5 全新登录后 `auth status` 是否含 `expired`；CLI 未登录时 Windows 上的面板表现 | 已完成：干净终端登录有 expired:false；登出及从未登录显示登录入口；Windows 桌面面板登录 W3 已通过。见两份 v4 结果报告。W4 自然退出后长期 loading、通用错误文案、具体退出诊断及后续授权恢复仍未关闭，见主开发异常清单 |
