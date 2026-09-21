# 噪声治理实施审核（2026-09-22）

> 审核对象：`docs/plans/2026-09-20-interaction-noise-reduction.md`（v3）的实施改动，工作树未提交状态。
> 结论：**方向与结构正确，但有 1 个 P0 会让「受控失效回退」在真实平台上完全不触发**，另有 2 个 P1。建议修完 P0/P1 再进行 §9.2 行为验收。
> 方法：只读核对源码与证据，并独立追到 DSH 与 OpenBKN 平台两侧源码求证。**未重跑测试**（本地 `pnpm` 会改写 lockfile，CLAUDE.md 明令不提交），实现方自报的 182/182、49/49、typecheck、package:check 记为自报未复核。

## 1. 审核范围

噪声治理线（本次审核对象）：

```
新增  src/interaction-lifecycle.ts
新增  tests/interaction-lifecycle.test.ts
新增  tests/probes/dsh-event-model.probe.mjs
新增  docs/evidence/dsh-event-model-probe.md
改动  src/scoped-business-context.ts
改动  src/managed-session-policy.ts
改动  tests/scoped-business-context.test.ts、tests/managed-session-policy.test.ts
改动  CHANGELOG.md、README.md、README.zh.md
```

工作树同时并存溯源线的改动（`business-context-service.ts`、`provenance-*`、`turn-timeline.ts`、`ProvenanceOverlay.tsx` 等）。**已核实**：`business-context-service.ts` 的 diff 中无任何 lifecycle/conversation/tools\_result 相关行，实现方「生命周期接线全部收进 agent 作用域插件、未动该文件」的说法成立，冲突面规避有效。

## 2. 确认无误的部分

| 项 | 核实方式 |
| --- | --- |
| 两组工具常量并集 === 原 19 个 `MANAGED_OPENBKN_TOOLS` | 逐项点数：lifecycle 2 + 受管 17 |
| guard 保持无副作用，状态只由已落定结果驱动 | `scoped-business-context.ts:99-120` |
| `tools/result` 监听器为同步（约束 C2） | 同上，无 `async`/`await` |
| 提示词四层语义齐全 | `managed-session-policy.ts` diff：分诊正反例、「schema/skills 读取即访问」、「不得用 schema 判断」、「工具可能未列出直接调用」、「失败也要 finish」均在；`agent_name`、「不得编造」条目未动 |
| `systemPrompt.section` 的 provider 形态合法 | DSH 源码 `packages/core/system-prompt/src/index.ts:61-66`：`text: string \| ((context: AssembleContext) => string)`，每次 assembly 求值。实现方改用 provider 规避 pre-step 晚一轮的做法**正确且有据** |
| `restoreFrom` 对 tombstone 的处理 | `interaction-lifecycle.ts:86-95`：末条 `invalidated` → undefined，等价「无可用会话」提示态 |
| CHANGELOG / 双语 README 的「未闭合 Interaction」已知限制 | 三处文本均已写入，含观测项建议 |
| 平台侧失效码的源码佐证 | 复核 `bkn-foundry` `lifecycle_middleware.go:349-373` 的状态映射，与证据文档一致 |

## 3. 发现

### P0-1（阻断）失败结果的错误码取值层级错误 → 受控回退永不触发

**事实链（三处独立证据）**：

1. **平台真实错误信封是嵌套的**。`bkn-foundry/adp/context-loader/agent-retrieval/server/driveradapters/mcp/session_guard.go:595-617`：
   ```go
   errorValue := map[string]any{"code": value.Code, "message": ..., "retryable": ..., "required_action": ...}
   envelope := map[string]any{"error": errorValue}
   raw, _ := sonic.Marshal(envelope)
   return mcpsdk.NewToolResultError(string(raw))
   ```
   即 `{"error":{"code":"resource_not_disclosed",...}}`，`code` 在 **`error` 之下**。

2. **实现只读顶层**。`scoped-business-context.ts:188-194`：
   ```ts
   const text = result.error.message.slice(0, 4_096)
   const parsed = parseJsonRecord(text)
   const errorCode = identifier(parsed?.code) ?? identifier(parsed?.error_code) ?? identifier(parsed?.errcode)
   ```
   对真实信封，`parsed.code === undefined`、`parsed.error` 是对象 → `errorCode` 恒 `undefined` → `classifyFailure` 恒返回 `'other'` → `conversationInvalidatedThisTurn` 永不置位 → **§5.3 的受控回退死路**。

3. **probe 之所以通过，是因为它用了另一套提取逻辑**。`tests/probes/dsh-event-model.probe.mjs:340-352` 的 `extractCodeTokens` 用 `visit()` **递归**查找 code 类字段，且读的是 `value.content` 文本；而且 V0-6 直接用原生 MCP client `callTool`，**从未经过 DSH 工具注册表**，因此也从未产生过生产路径上的 `ToolExecutionResult`。证据与实现验证的不是同一条链路。

**传导链已核实**（错误文本确实会进 `error.message`，所以只是层级错，不是位置错）：MCP 结果 `isError` → `deepseek-harness/packages/mcp/mcp-client/src/tools.ts:296-298` `throw new Error(text)`（text = content 文本块）→ `packages/core/tools/src/index.ts:1879-1887` `toolErrorResult` 把 `error.message` 设为该文本。**信封 JSON 会完整落在 `result.error.message`**，`JSON.parse` 可解析——差的只是取 `parsed.error.code` 而非 `parsed.code`。

**连带：单测夹具也不是平台形状**。`tests/scoped-business-context.test.ts:64` 用的是 `{ isError: true, error: { message: '{"code":"..."}' } }`（顶层）。测试因此绿得毫无意义——它证明的是一条平台不会产生的形状。

**修复**：
1. `projectLifecycleResult` 改为先看 `parsed.error?.code`，再回退顶层 `code`/`error_code`/`errcode`（保留有界解析与 256 字符上限，不引入递归全树扫描，避免把无关字段误当错误码）；
2. 单测夹具改用真实信封 `{"error":{"code":"resource_not_disclosed","message":"...","retryable":false,"required_action":"..."}}`，并保留一条顶层形状用例作为兼容；
3. 加一条负例：`{"error":{"code":"invalid_params"}}` → `'other'`，且不清除 `conversation_id`。

**验收**：新增/改造后的单测全绿；§9.2「`continue` 返回明确会话失效」用例在真实平台上观察到恰好一次受控 `new`。

### P1-1（需在 P0-1 之后修）失效后未清除内存中的 `conversation_id`

`interaction-lifecycle.ts:126-131`：start 失败且判定为 `conversation-invalid` 时返回 `{ ...state, conversationInvalidatedThisTurn: true }`——**`conversationId` 原样保留**。tombstone 事件确实写了（`scoped-business-context.ts:173-179`），但内存状态不消费它。

后果（P0-1 修好后才会显现，所以别漏）：

- 同轮：注入段仍渲染「A prior OpenBKN conversation is available: <死 id>… 用 continue」，与 guard 允许 `new` 的判定自相矛盾，模型大概率先撞一次拒绝；
- 跨轮：`onTurnStart` 清掉 `conversationInvalidatedThisTurn` 但保留死 id → 提示继续用死 id → guard 的「已有 conversation 时禁止 `new`」分支挡住 `new` → 只能再撞一次平台失败才能重新拿到回退许可。**每轮多一次必失败的平台调用 + 一次无效拒绝，且每轮重复写一条 `invalidated` 事件**。

**修复**：失效分支同时清除 `conversationId`（返回 `{ open: state.open, startsThisTurn: state.startsThisTurn, conversationInvalidatedThisTurn: true }`）。**注意联动**：`persistConversationChange` 的 tombstone 条件当前依赖 `after.conversationId === before.conversationId`，清除后该条件不再成立，必须改为以「本轮刚发生失效」为准并用 `before.conversationId` 写 tombstone。

**验收**：单测——失效后 `state.conversationId === undefined`、tombstone 写且只写一次；跨轮后注入文案为「无可用会话」；§9.2 场景下不出现每轮重复的失败调用。

### P1-2 同轮 finish 之后可再开第二个 Interaction

`denialFor` 的重复 start 规则只在 `state.open === true` 时拒绝（`interaction-lifecycle.ts:166-169`）。成功 finish 后 `open` 变 false，模型若在同一轮继续追加 OpenBKN 访问，会被允许**再开一个 Interaction**。`startsThisTurn` 已在状态里累加，但没有任何判定使用它。

后果：违反方案 §3「每个需要访问 OpenBKN 的用户轮次恰好一个 Interaction」；更实际的是**该轮溯源直接丢失**——`native-mcp-provenance.ts:44` 的 `completed.size !== 1` 会让两个 finish 的轮次返回 undefined。

**修复**：`denialFor` 的 start 分支加一条——`!state.open && state.startsThisTurn >= 1 && !state.conversationInvalidatedThisTurn` → 拒绝，文案给出确切下一步（本轮的 OpenBKN 访问已结束，请基于已获得的结果作答；如确需更多数据，应在 finish 之前完成）。受控失效路径（`conversationInvalidatedThisTurn`）需豁免，否则与 P1-1 的回退冲突。

**验收**：单测「finish 成功后同轮第二次 start 被拒」+「受控失效后的 `new` 仍放行」；§9.2 加一条「一轮内追问」用例，确认仍是 1 个 Interaction。

### P2-1 双重断言回归

`scoped-business-context.ts:93`：`const events = ctx as unknown as ScopedAgentEvents`。第五轮审核曾专门要求**消除**本文件中的 `as unknown as` 双重断言（当时是 `scoped-business-context.ts:56`），并以「结构兼容、直接传入」的方式关闭。本次实施又引入一处，且旁边两行用的正是推荐写法（`ctx as Context & { systemPrompt: ScopedSystemPrompt }`）。

**修复**：改为 `ctx as Context & ScopedAgentEvents` 形式的交集断言；若因 Cordis 的 `on` 重载导致交集不成立，则直接使用 DSH 的事件类型而非自定义结构体，并在注释里说明为何无法用交集。

### P2-2 未闭合告警不可观测

`scoped-business-context.ts:130-135` 的告警把 `START_INTERACTION_TOOL` 常量切片后打印，等于每次都是同一句话，既无 `interactionId` 也无轮次。而 README 承诺「观测项应跟踪未闭合 Interaction 计数」——按现状无法据此计数或定位。

**修复**：打印 `lifecycle.interactionId`（平台标识符，非业务数据，与既有溯源展示的口径一致）与轮次；若坚持不打 id，则至少输出一个稳定的可计数事件名。

### P3-1 `recordedAt` 被丢弃

`interaction-lifecycle.ts:214` 的 `parseConversationEvent` 校验后返回 `recordedAt: 0`，把事件里真实的时间戳丢掉。当前无人消费，但类型声明说它有意义，属于会误导后来者的字段。**修复**：解析真实值（非法则丢弃该事件），或从类型里去掉该字段。

### P3-2 V0-5 未实测

证据文档把 V0-5（会话恢复后不残留 open）记为「结构性覆盖」，理由是结构保证 + 单测 + 行为验收覆盖。可以接受，但它是**方案 §2 表格里唯一没有运行时证据的一项**，§9.2 的「重载会话后问业务问题」用例必须实跑，不能再降级。

## 4. 修复顺序

1. **P0-1**（否则整个失效回退是死代码，后续验收全部失真）；
2. **P1-1**（P0-1 修好后才会显现，注意 tombstone 条件联动）；
3. **P1-2**（独立，单测即可覆盖）；
4. P2-1 / P2-2（低风险，可与上面同批）；
5. P3-1、P3-2 随手处理；
6. 再进行方案 §9.2 的基线测量与行为验收（九组正常路径 + 五组异常/取消路径）。

## 5. 未复核项

- 实现方自报的插件 182/182、仓库 49/49、typecheck、`package:check` 本轮**未重跑**（避免本地 `pnpm` 改写 lockfile）。修完上述问题后请重跑并在回应里写明新计数。
- §9.2 行为验收与噪声基线对比未执行（需完整 Runtime + 模型对话）。
- probe 的 V0-1…V0-4 本轮未重跑，仅复核其断言逻辑与证据记录的一致性；V0-6 的**提取逻辑与生产路径不一致**已在 P0-1 中指出，修复后建议让 probe 复用生产的 `projectLifecycleResult`，从根上消除两套解析。

## 6. 约束

不 `reset --hard`/`clean`；DSH 树只经 compat apply/revert 变更；本地 `pnpm` 产生的 lockfile / `pnpm-workspace.yaml` 改写不得提交；日志与证据不含业务载荷与凭据；提交时噪声治理线与溯源线按文件分拆。推送、打 tag、Release、向上游提 PR 需用户另行授权。
