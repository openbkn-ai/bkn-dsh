# 方案：消除绑定会话中的无效 Interaction 噪声（v3）

> 类型：可执行改造方案（交给开发 agent）。
> **v3（2026-09-20）**：按第二轮审核补强四点，取代 v2；v2 按首轮审核修订，取代 v1。变更见第 0 节。
> 基线：`feat/dsh-0.1.6-alpha.2-compat`；行号以成稿时源码为准，实施前复核。
> 关联：`docs/plans/2026-09-20-provenance-layered-redesign.md`（溯源重做，见第 10 节）；`docs/reviews/2026-09-20-goal-gap-analysis.md` G6。
> 审核结论：**有条件通过——先做 V0，再按本文实施。**

## 0. 修订记录（审核处置）

### v3（第二轮审核）

| 审核意见 | 处置 | 落点 |
| --- | --- | --- |
| 注入文案会把「跨轮的 conversation」和「本轮的 Interaction」混为一谈 | 采纳，改用审核给出的措辞；并在状态模型里明确两者生命周期不同 | 5.2、6.2 |
| 「continue 失败即允许 new」条件过宽：超时、认证失效、5xx、参数错误都不应清除 conversation_id | 采纳，收紧为**仅平台明确可机器判定的会话失效码**；新增 tombstone 事件；其余错误保留原 id | 5.3、6.2、V0-6 |
| 异常与取消场景未进验收 | 采纳，新增 5 条验收用例；取消场景的平台侧残留列为**已知限制**，须进发布说明与观测项 | 9.2、11、12 |
| V0 应可复现，而非一次性临时验证 | 采纳，V0 产出改为「可重复执行的 probe + 无载荷证据格式 + 精确版本与命令」 | 2 |

### v2（首轮审核）

| 审核意见 | 处置 |
| --- | --- |
| 不应默认允许 Discovery 工具在 Interaction 外执行 | 采纳，撤销 v1 的 D1；边界改为「Interaction 是任何模型发起的 OpenBKN 访问的边界」，工具由三组收敛为两组 |
| `conversation_id` 不能只靠模型记忆 | 采纳，新增插件侧持久化 + 每轮注入 + guard 兜底（第 5 节） |
| 事件模型假设需实测，不能因 parent token 断言嵌套「天然满足」 | 采纳，列为 V0；并更正 v1 的错误推断（见下） |

**对 v1「run_code 嵌套天然满足」的更正**（静态核实 `@deepseek-ai/dsh-tools@0.1.6-alpha.2` 安装包源码）：

- `guardReason(exec)` 先跑 global 层，随后 `if (exec.agent === undefined) return undefined` —— **`exec.agent` 缺失时 agent-scoped guard 被整体跳过**，只剩 global 层。这才是真实旁路条件。
- 嵌套派发处（`lib/index.js:1302-1303`、`lib/types/ptc.js:438-439`）为 `...exec.agent ? { agent: exec.agent } : {}` + `parent: exec.token`：父执行带 agent 时子调用才继承。
- 概念厘清：`mcp__openbkn__run_code` 在 **OpenBKN 平台侧**执行，其内部访问不回到 DSH 工具注册表；真正涉及嵌套的是 DSH 原生 `run_code`/PTC 子派发，而它在绑定会话里本就被白名单拒绝。
- 静态证据支持「模型发起的调用会经过 scoped guard」，但仍须按 V0 实测确认，不得按推断实施。

## 1. 问题与成因

**现象**：会话一旦绑定业务知识网络，任何问题——包括寒暄、澄清、通用知识——都会触发 `bkn_start_interaction` / `bkn_finish_interaction`，平台 Trace 堆积大量无业务操作的空 Interaction。

### L1 提示词无条件要求（直接原因）

`src/managed-session-policy.ts`：

- `'For each user question, start exactly one mcp__openbkn__bkn_start_interaction before business retrieval and finish it with mcp__openbkn__bkn_finish_interaction using the final outcome.'` —— 以「用户问题」为触发单位，无任何前置判定。
- `'Do not probe Bash or a tool list to test OpenBKN availability. Even if managed MCP tools are not listed in the initial tool catalog, directly call mcp__openbkn__bkn_start_interaction.'` —— 本意是解决 MCP 工具延迟注册导致模型不敢调用的真实问题，**改写时必须保留原意**。
- 整段 governance 共 15 条，通篇预设「这是业务会话」，没有为普通对话留出口。

### L2 工具白名单（结构性原因）

`src/scoped-business-context.ts` 的 `tools.guard`：命中 `MANAGED_OPENBKN_TOOLS`（19 个）才放行，其余一律拒绝。绑定会话里模型没有任何其他工具，任何需要动作的问题唯一可走的就是 OpenBKN。该白名单是刻意的最小权限设计，放宽属安全策略变更，列为独立可选项（第 7 节 B）。

### L3 溯源与 Interaction 强耦合（当初为什么这么设计）

`src/native-mcp-provenance.ts` 只认同轮内 `bkn_finish_interaction` 返回 `execution_status=completed` 的结果，`captureTurnProvenance` 才写入该轮溯源。**没有 Interaction 就没有该轮溯源。**

本方案的回答：**没有访问过 OpenBKN 的轮次本来就没有业务事实可溯，缺失是正确行为**。

附带佐证：同一函数在 `completed.size !== 1` 时返回 undefined，即一轮多 Interaction 反而丢溯源——与本方案同向。

### L4 绑定不可逃逸（本方案不处理）

绑定写入会话事件且不可更改。属产品向改动，列为后续（第 7 节 D）。

## 2. 前置验证 V0（必须先做，且必须可复现）

**静态先行已完成**：V0-1…V0-4 已由源码阅读得出「静态成立」结论，并派生 5 条实现约束（同步监听器、注册在 agent 作用域等），见 `docs/evidence/2026-09-21-dsh-event-model-static.md`。probe 因此从「探索」收窄为「确认」（该文档第 4 节列出 4 条断言 + V0-5/V0-6 两项实测）。下表保留完整清单与不成立时的退路。

用 DSH `0.1.6-alpha.2` 真实运行时做一个 probe，确认六件事：

| # | 待验证 | 判定方法 | 若不成立 | 判定（2026-09-21） |
| --- | --- | --- | --- | --- |
| V0-1 | agent-scoped `tools/result` 只收到本 Agent 的调用 | 两个会话交叉调用，记录订阅到的 callId 归属 | 改用 `exec.agent.id` 显式过滤 | **成立**（probe 实测：scoped 各 2/2 无外来，服务级收全部 4） |
| V0-2 | 模型发起的 MCP 调用其 `exec.agent` 一定存在 | guard 内记录 `exec.agent === undefined` 的次数 | 关键规则下沉 global guard 并自行按 agent 过滤 | **成立**（guard 内 agent 缺失计 0；无 agent 执行旁路 scoped guard 实测确认） |
| V0-3 | `start_interaction` 的成功结果先于下一次 guard 判定到达 | 连续 start→检索，断言检索未被误拒 | 改在 `tools/post-execute`（waterfall，可 await）更新状态 | **成立**（同步监听器下紧接收管调用未被误拒） |
| V0-4 | 取消 / 超时 / 工具抛错时 `tools/result` 仍到达，状态可收敛 | 三种失败各跑一次 | 增加 turn-stopping 兜底重置 | **成立**（三路径均有结果事件；派发前取消 code=`ABORTED_BEFORE_DISPATCH`，body 内取消无 info.code） |
| V0-5 | 会话恢复后不残留上一次的 open 状态 | 恢复会话后立即发业务问题 | 在 Agent 恢复钩子显式初始化 | **实测成立**（2026-09-22 行为验收：页面重载恢复 13 轮会话后业务问题仍 continue 同一 conversation，见 `docs/evidence/2026-09-22-interaction-baseline.md` §3.2） |
| **V0-6** | **平台对「conversation 不存在／已关闭／无效」返回什么可机器判定的错误码** | 用伪造的 `conversation_id` 调 `bkn_start_interaction --conversation_mode continue`，记录错误码与 message 形状；再与超时、认证失效、参数错误三类错误对照 | 无法机器区分 → **不实现自动回退**，改为向用户提示并要求人工新开会话（见 5.3） | **成立**（伪造 id→`resource_not_disclosed`；参数错误→`invalid_params`；未认证/超时为传输层错误。可机器区分，受控回退按 5.3 实施；平台源码佐证 `conversation_owner_mismatch` 亦属不可继续） |

**可复现要求（v3 新增）**：

1. probe 以**可重复执行**的形式落盘：`tests/probes/dsh-event-model.probe.mjs`（手动运行，不进 CI，不进发布包——`package.json` 的 `files` 白名单本就不含 `tests/`，确认即可）；
2. 证据输出为固定格式的**无载荷**记录：`{ check, dshVersion, command, observation, verdict }`，observation 只写计数、布尔、错误码与工具短名，**不写参数值、响应体、业务数据、凭据**；
3. 记录精确版本与命令：DSH tag、插件版本、运行预设（Standard）、完整命令行；
4. 结论写入 `docs/evidence/dsh-event-model-probe.md`，并回写本文档第 2 节的判定列；
5. **DSH 升级时必须重跑**——`tools/result`、`exec.agent`、guard 时序这三项是本方案的地基，升级后不得假定不变。在 `docs/plans` 与升级清单里标注这条。

## 3. 核心规则

> **Interaction is the boundary for any model-initiated OpenBKN access, not only data retrieval. A turn that does not access OpenBKN creates no Interaction.**

| 场景 | 是否建 Interaction | 允许的 MCP 工具 |
| --- | --- | --- |
| 寒暄、通用知识、插件使用说明、询问当前绑定的知识网络 | 否 | 不调用任何 `mcp__openbkn__*` |
| 需要业务对象 / 关系 / 指标 / 规则 / 函数 / Skill / **Schema** 的问题 | 是，**该轮恰好一个** | start 之后，全部受管工具均可用 |
| 已开启后重复 `start` | 拒绝 | 引导继续使用或先 finish |
| 未开启就调用任何受管工具 | 拒绝 | 引导先 start |
| 未开启就 `finish` | 拒绝 | 不产生孤儿 finish |

计数口径：**每个需要访问 OpenBKN 的用户轮次恰好一个 Interaction**（一条用户消息含多个相关业务子问题时共享同一个）。

「当前会话绑定的是哪个知识网络」不需要 MCP：网络 id、名称、说明来自插件写入的不可变会话绑定与系统提示。

## 4. 改动一：提示词分诊门控

**文件**：`src/managed-session-policy.ts` 的 `buildManagedSessionPolicy().governance`

**删除**：`'For each user question, start exactly one ...'`。

**新增（建议措辞，可打磨，四层语义必须保留）**：

```
Decide first whether answering this turn requires anything from OpenBKN.
- Requires OpenBKN: business objects, relations, metrics, rules, published
  functions, skills, AND the network's schema — anything whose answer depends on
  the bound network's governed semantics or data.
- Does NOT require OpenBKN: greetings, clarifying questions about the
  conversation, questions about this plugin or about which knowledge network this
  session is bound to (that identity is already given above), and general
  knowledge. Answer those directly and call no mcp__openbkn__ tool at all.
An Interaction is the boundary for every OpenBKN access, not only for data
retrieval: when this turn needs OpenBKN, call mcp__openbkn__bkn_start_interaction
first, perform all OpenBKN work inside it — schema, skills, tool discovery,
queries, metrics, execution — and close it with
mcp__openbkn__bkn_finish_interaction using the final outcome, including when the
work failed. Exactly one Interaction per turn that touches OpenBKN; a turn that
touches nothing creates none.
Never inspect schema or skills to decide whether you need OpenBKN — reading them
is already an OpenBKN access.
The managed OpenBKN tools may be absent from the initial tool catalog because they
register after the session starts. Do not probe Bash or a tool list to test
availability; when this turn needs OpenBKN, call
mcp__openbkn__bkn_start_interaction directly.
```

**必须保留的语义**：① 工具可能未列出、直接调用；② 需要访问的轮次恰好一个 Interaction；③ `agent_name` 固定值（现有条目不动）；④ 「不得编造业务事实」（现有条目不动）；⑤ **失败也要 finish**（`outcome=failed`，见 9.2 第 1 条）。

**`conversation_mode` 条目改写**：现有措辞隐含「每轮都有 Interaction」。改为由宿主注入当前值（第 5 节），提示词只保留规则：

```
Use conversation_mode "new" only when the managed context above says no prior
OpenBKN conversation is available; otherwise use "continue" with exactly the
conversation_id given there. Never invent or recall a conversation_id from earlier
tool output.
```

## 5. 改动二：`conversation_id` 由插件持有

模型不承担状态保存责任。

### 5.1 两个生命周期，不要混淆（v3 明确）

| | 生命周期 | 存放 | 跨轮 | 会话恢复后 |
| --- | --- | --- | --- | --- |
| **Interaction**（`state.open`） | 单轮、短生命周期 | 仅内存 | **不保留** | 一律视为未开启 |
| **conversation_id** | 跨轮的平台会话连续性标识 | 会话事件（持久） | **保留**，即便本轮没有任何 OpenBKN 访问 | 回放恢复 |

注入文案与状态命名都必须体现这个区别——不得让模型以为平台上存在一个跨轮「未关闭的 Interaction」。

### 5.2 持久化与注入

**来源**：`bkn_start_interaction` 成功结果中的 `conversation_id`（若 `finish` 也返回，以最后一次成功值为准）。字段名以 V0/首次实现的实测为准。

**持久化**：写入会话事件（沿用绑定/溯源事件做法，带 `{ ignorable: true }`，卸插件后会话仍可重载）。事件只存 `conversationId`、写入时间与状态（`active` / `invalidated`），**不存问题文本或任何业务参数**。

**恢复**：回放会话事件取最后一条有效记录——这正是压缩、截断、恢复场景下模型记忆不可靠而事件可靠之处。

**运行时缓存**：per-Agent `WeakMap`，仅作读取加速，真相源是会话事件。

**注入**：系统提示段落在 Agent 作用域挂载时一次性注册（`systemPrompt.section(...)` 返回 disposer）。在 `agent/pre-step`（`step === 1`）持有 disposer，**每轮重新注册** `openbkn:managed-conversation` 段落（order 建议 522，与现有 520/521 不冲突）：

- 有值：
  ```
  A prior OpenBKN conversation is available for this DSH session: <id>.
  When this turn needs OpenBKN, start with conversation_mode "continue"
  and exactly this conversation_id.
  ```
- 无值（含首次与已失效后）：
  ```
  No prior OpenBKN conversation is available for this DSH session.
  When this turn needs OpenBKN, start with conversation_mode "new".
  ```

若 V0 显示每轮重注册有副作用（提示缓存、顺序校验），退路是并入 `openbkn:managed-session` 段整段重注册。

### 5.3 严格的失效语义与回退（v3 收紧）

**默认：任何失败都不清除 `conversation_id`。** 只有平台返回**明确、可机器判定**的「conversation 不存在／已关闭／无效」错误码时才走回退：

1. 允许**同轮的一次**受控 `new`（每轮至多一次，避免反复重开）；
2. 写入一条 `invalidated` 的 tombstone 会话事件，使恢复回放不会再读到旧值；
3. 记录不含业务参数的状态日志（工具短名 + 错误码 + 动作）；
4. `new` 成功后把新 id 以 `active` 事件写入。

**明确不触发回退**（保留原 id，把错误如实交给模型/用户）：网络超时、认证失效（401）、服务端 5xx、参数错误、工具执行超时、用户取消。

**错误码识别**：失败结果的平台错误码位于 MCP 结果文本的 JSON 里。只做**有界解析**并只取错误码字段（≤4 KB，取不到就按「不可判定」处理），不得把响应体其余内容带入状态、日志或前端。可识别的具体码值由 **V0-6** 给出；**V0-6 若无法机器区分，则不实现自动回退**——改为向用户提示「平台会话已不可用，请新建会话」，由人工决定。

### 5.4 guard 兜底

guard 可读 `exec.arguments`，对 `bkn_start_interaction` 做参数校验：

- 持有 `conversationId` 而参数为 `new`，且本轮未发生 5.3 所述的受控失效 → 拒绝：
  `This DSH session already has an OpenBKN conversation <id>; call bkn_start_interaction with conversation_mode "continue" and conversation_id "<id>".`
- 参数为 `continue` 但 `conversation_id` 与持有值不符 → 拒绝并给出正确值。
- 本轮已发生受控失效 → 放行一次 `new`。

guard 只能拒绝、不能改写参数（调用身份不可变，wrapper 仅可替换 signal），所以「注入 + 拒绝时给出正确值」是唯一可行组合。

## 6. 改动三：生命周期机制化（guard）

### 6.1 工具分组（两组）

`src/scoped-business-context.ts`：

```ts
const LIFECYCLE_TOOLS = [
  'mcp__openbkn__bkn_start_interaction',
  'mcp__openbkn__bkn_finish_interaction',
] as const

/** 其余全部受管工具：schema、skills、tool discovery、查询、指标、执行、run_code */
const MANAGED_IN_INTERACTION_TOOLS = /* MANAGED_OPENBKN_TOOLS 去掉 LIFECYCLE_TOOLS */
```

单测锁死：两组并集 === 原 `MANAGED_OPENBKN_TOOLS`。**新增 OpenBKN 工具默认归入 `MANAGED_IN_INTERACTION_TOOLS`**（默认受管，不是默认放行）。

### 6.2 状态机（新增 `src/interaction-lifecycle.ts`，纯模块）

```ts
export interface InteractionLifecycleState {
  /** 本轮的 Interaction 是否开启；不跨轮 */
  readonly open: boolean
  readonly interactionId?: string
  /** 跨轮保留的平台会话标识；来源是会话事件 */
  readonly conversationId?: string
  /** 本轮已发生「平台明确判定的会话失效」，允许一次受控 new */
  readonly conversationInvalidatedThisTurn: boolean
  readonly startsThisTurn: number
}
```

导出纯函数：`initialState()`、`restoreFrom(events)`（回放取最后一条 `active`，遇 `invalidated` 则为 undefined）、`onTurnStart(state)`（重置 `startsThisTurn` 与 `conversationInvalidatedThisTurn`；`open` 归 false；**`conversationId` 保留**）、`onToolResult(state, name, ok, payload)`、`classifyFailure(payload)`（→ `'conversation-invalid' | 'other'`）、`denialFor(state, toolName, args)`。

**状态由结果驱动**：订阅 `tools/result`，只有**成功**的 start 才算开启；guard 保持纯判定、无副作用。

### 6.3 guard 规则（叠加在现有白名单之后，顺序即优先级）

1. 不在 `MANAGED_OPENBKN_TOOLS` 内 → 维持现有拒绝文案（行为不变）。
2. `MANAGED_IN_INTERACTION_TOOLS` 且 `state.open === false` → 拒绝：
   `Start mcp__openbkn__bkn_start_interaction before any OpenBKN access in this turn, then retry this call.`
3. `bkn_start_interaction` 且 `state.open === true` → 拒绝：
   `An OpenBKN interaction is already open in this turn; continue using it, or finish it with mcp__openbkn__bkn_finish_interaction first.`
4. `bkn_start_interaction` 的 `conversation_mode`/`conversation_id` 与持有状态不符 → 5.4 文案。
5. `bkn_finish_interaction` 且 `state.open === false` → 拒绝：
   `No OpenBKN interaction is open; do not call bkn_finish_interaction.`

**文案要求**：模型可见，必须给出确切下一步；验收专门检查有无「拒绝→重试→再拒绝」回路。

### 6.4 边界

- **状态归属**：per-Agent，绝不全局。
- **轮边界**：复用 `business-context-service.ts` 已有的 `agent/pre-step`（`step === 1`）与 `agent/turn-stopping`。
- **会话恢复**：`open` 一律 false；`conversationId` 从会话事件恢复——两者处理方式不同（见 5.1），别混。
- **未关闭的 Interaction**：`turn-stopping` 时若仍 open，第一期只 `ctx.logger.warn`（工具短名 + 状态码），不自动补 finish。这会在平台侧留下未完成 Interaction，属**已知限制**（见 11、12）。
- **嵌套调用**：见第 0 节更正与 V0-2。

### 6.5 不改动

`native-mcp-provenance.ts`、`turn-provenance.ts`、`refreshManagedMcpAtTurnStart`、绑定语义、`agent_name` 规则均不动。

## 7. 不在本批内

- **B 放宽工具白名单**（`toolScope: 'openbkn-only'（默认，现状） | 'openbkn-plus-native-readonly'`）：安全边界变更，需单独评审；若实施**必须重跑 V0-2**。
- **自动补 finish**：宿主主动收尾，涉及平台语义、失败重试与 outcome 一致性。
- **D 绑定临时旁路**。
- **平台侧空 Interaction 回收**：可作兜底，不替代本方案。

## 8. 文件清单

| 文件 | 改动 |
| --- | --- |
| `src/managed-session-policy.ts` | 分诊门控措辞；`conversation_mode` 条目改为引用注入段 |
| `src/interaction-lifecycle.ts` | **新增**：状态机、分组判定、参数校验、失败分类 |
| `src/scoped-business-context.ts` | 两组常量；guard 规则 2–5；订阅 `tools/result` |
| `src/business-context-service.ts` | `pre-step` 调 `onTurnStart` 并重注册 conversation 段；`turn-stopping` 未关闭告警；写入 conversation 事件 |
| `src/dsh-session-binding.ts` 或新增事件模块 | conversation 事件（`active` / `invalidated`）的追加与回放，带 `ignorable: true` |
| `tests/probes/dsh-event-model.probe.mjs` | **新增**：V0 可重复 probe（手动运行，不进 CI 与发布包） |
| `tests/…` | 见第 9 节 |
| `docs/evidence/dsh-event-model-probe.md` | V0 结论（无载荷格式） |

## 9. 验收

### 9.1 单测（不需平台，必须全绿）

- `managed-session-policy`：① 不再含 `For each user question`；② 含分诊规则与「schema/skills 也算 OpenBKN 访问」；③ 含「不得用 schema 判断要不要访问」；④ 仍含「工具可能未列出，直接调用」；⑤ 含「失败也要 finish」；⑥ `agent_name` 与「不得编造」条目不变。
- `interaction-lifecycle`：start 成功→open；start 失败→仍 closed；finish 成功→closed；重复 start 被拒；`onTurnStart` 重置本轮标志但**保留 conversationId**；初始态 closed；`restoreFrom` 取最后一条 `active`、遇 `invalidated` 返回 undefined；`classifyFailure` 对会话失效码返回 `'conversation-invalid'`，对超时/401/5xx/参数错误返回 `'other'`；`'other'` 不清除 conversationId。
- `scoped-business-context`：① 非白名单仍被拒；② **`search_schema` 在无 open interaction 时被拒**（v1 期望与此相反，勿写错）；③ start 成功后放行；④ `new` 与持有 conversation 冲突时被拒且文案含正确 id；⑤ 受控失效后放行一次 `new`；⑥ 两组并集等于原 `MANAGED_OPENBKN_TOOLS`。
- conversation 事件：追加、回放取最后值、tombstone 生效、老会话（无该事件）回放为 undefined。
- 回归：插件与仓库测试全绿（当前 119/49，新增后写明新计数）。

### 9.2 行为验收（需平台，并入 G6 评测集）

改前取基线，改后同一组问题复测。

**正常路径**

| 用例 | 期望 |
| --- | --- |
| 「你好」 | 0 次 OpenBKN 调用、0 个 Interaction |
| 「这个会话绑定的是哪个知识网络？」 | 0 次调用 |
| 「用一句话解释什么是 BOM」 | 0 次调用 |
| 「这个网络里有哪些对象类型？」（Schema 类） | 1 个 Interaction，`search_schema` 在其内 |
| 「382-000005 有多少张销售订单？」 | 1 个 Interaction，start+检索+finish 齐全，溯源可打开 |
| 一条消息含两个相关业务子问题 | 仍只有 1 个 Interaction |
| 业务 → 寒暄 → 业务 | 2 个 Interaction；寒暄轮 0；第二个 `continue` 且 id 一致 |
| 长会话压缩后再问业务问题 | 仍 `continue`，id 正确 |
| 重载会话后问业务问题 | 仍 `continue`，id 正确 |

**异常与取消路径（v3 新增）**

| 用例 | 期望 |
| --- | --- |
| 检索工具失败但模型可继续 | 仍调用一次 `finish_interaction`，`outcome=failed`；该轮不产生「完成态」溯源 |
| `continue` 返回**明确会话失效** | 仅允许一次受控 `new`；写入 tombstone；后续轮用新 id `continue` |
| 网络超时 / 401 / 5xx / 参数错误 | **不清除** conversation_id，不出现误回退 `new`；错误如实呈现 |
| 用户取消生成 | 第一批不自动 finish；产生无载荷告警；平台侧留下未完成 Interaction——**已知限制**，须在发布说明与观测项中承认 |
| `finish_interaction` 自身失败 | 本轮不生成完成态溯源；状态告警可观测 |
| 任意用例 | 无「拒绝→重试→再拒绝」回路 |

**基线测量**：改前统计近期 `agent_name=bkn-agent-dsh-business-context` 的 Interaction 总数与「无业务 operation」占比（子命令以 `openbkn trace --help` 为准）。改后同组问题复测，两组数字写入回应与 `docs/evidence/`。

**判定口径**：非访问轮 Interaction 产生率 0；访问轮恰好 1；Schema 类调用全部落在 Interaction 内；`conversation_id` 在跳轮、压缩、恢复三场景正确续接，且在四类非失效错误下不被清除。

## 10. 与溯源方案的衔接

- 本方案后，非访问轮没有句柄 → 「查看业务溯源」入口应在该轮不出现，而非显示空面板。
- 两方案都改 `scoped-business-context.ts` 的分组常量与 `business-context-service.ts`，**建议先做本方案**：溯源验收依赖「访问轮恰好一个 Interaction」。
- 溯源时间链的 `kind` 复用这里的两组常量，取值为 `'question' | 'lifecycle' | 'managed' | 'answer'`。

## 11. 风险与已知限制

| 项 | 说明 | 处置 |
| --- | --- | --- |
| 模型过度保守 | 该查的业务问题直接答了（幻觉） | 评测含「必须查」正例；保留「不得编造业务事实」条目 |
| Schema 也需 Interaction 的开销 | 简单 schema 问题也要 start/finish | 刻意取舍：访问了业务语义就该受管可追溯；目标是**零访问轮不建 Interaction** |
| 拒绝回路 | 文案不可执行导致反复重试 | 文案给确切下一步；验收检查回路 |
| conversation 续接失效 | 注入未生效或平台拒绝旧 conversation | 严格失效语义（5.3）+ 三个续接场景 + 四类非失效错误各一条验收 |
| **取消/异常留下未完成 Interaction** | 第一批不自动补 finish，平台侧会残留 | **已知限制**：写入发布说明（CHANGELOG + README 已知限制段），并在观测项中单列「未闭合 Interaction 计数」；自动收尾单列后续设计 |
| V0 结论推翻实现前提 | 事件模型与假设不符 | V0 先行，结论回写本文档 |
| DSH 升级使地基失效 | `tools/result`、`exec.agent`、guard 时序可能变 | probe 可复现（第 2 节），升级清单里强制重跑 |
| PTC 未验证 | 该 alpha 的 PTC 工具派发本身有缺陷 | 仅在 Standard 预设下验收并注明 |

## 12. 实施顺序

1. **V0（含 V0-6）**，产出可复现 probe 与无载荷证据，结论回写本文档；
2. 两组常量 + 状态机 + guard 规则 2、3、5；
3. 提示词分诊门控；
4. `conversation_id` 持久化 + 每轮注入 + guard 规则 4 + 严格失效回退（依 V0-6 结论决定是否实现自动回退）；
5. 基线测量 → 正常路径与异常路径验收 → 数字与限制写入回应；
6. 把「取消/异常留下未完成 Interaction」写进 CHANGELOG 与 README 已知限制段。

## 13. 约束

不 `reset --hard`/`clean`；DSH 树只经 compat apply/revert 变更；不读取或输出凭据；日志只打工具短名与状态码，不打参数、token 或平台响应体；会话事件不存问题文本与业务参数；probe 证据不含业务载荷；回应中区分实测/自报/未验证。推送、打 tag、Release、向上游提 PR 需用户另行授权。
