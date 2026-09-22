# 噪声治理修复复核（2026-09-22，第二轮）

> 审核对象：针对 `docs/reviews/2026-09-22-interaction-noise-implementation-review.md`（首轮）四条问题的修复，工作树未提交状态。
> 结论：**P0-1、P1-1、P1-2、P2-1 四条全部修复成立，且 P0-1 的修法优于最小改动（提取函数下沉为共用生产实现 + 新增 V0-7 闭合验证链）。** 新发现 1 条 P2（由 P1-2 的修复引入的矛盾拒绝路径），另有首轮列出的 P2-2、P3-1 两条未处理。
> 方法：只读核对源码与证据。**未重跑测试**（避免本地 `pnpm` 改写 lockfile），实现方自报的 189/189、49/49、typecheck、`package:check` 记为自报未复核。

## 1. 首轮问题的处置核实

### P0-1 错误码取值层级 —— 修复成立（修法优于预期）

`interaction-lifecycle.ts:134-160` 的 `projectLifecycleOutcome`：

```ts
const parsed = parseJsonRecord((result.error?.message ?? '').slice(0, 4_096))
const nested = asRecord(parsed?.error)
const errorCode = identifier(parsed?.code) ?? identifier(nested?.code)
  ?? identifier(parsed?.error_code) ?? identifier(nested?.error_code)
  ?? identifier(parsed?.errcode)  ?? identifier(nested?.errcode)
```

逐项核实：

- 覆盖平台真实信封 `{"error":{"code":...}}`（`bkn-foundry` `session_guard.go:595-617`），同时保留顶层旧形状；**未**引入递归全树扫描，避免把无关字段误当错误码——与首轮建议一致。
- **提取逻辑下沉为单一生产实现**并经 `src/index.ts` 导出（第 46、53 行），插件监听器（`scoped-business-context.ts` 的 `tools/result`）、单测与 probe 三者共用。首轮指出的根因「验证的与生产跑的不是同一条链路」被真正消除，而不只是改一行取值。
- **V0-7 闭合了链路缺口**（`tests/probes/dsh-event-model.probe.mjs:340-390`）：把 V0-6 实测到的信封原文，经真实 `ToolRuntime` 的失败路径（`throw new Error(text)`，与 `deepseek-harness/packages/mcp/mcp-client/src/tools.ts:296-298` 对 isError 结果的行为一致）送入**构建产物** `lib/index.js` 的生产函数，断言 `resource_not_disclosed → conversation-invalid`。`lib/` 未构建时降级为 `not-run` 而非静默通过，处理得当。
- 单测夹具已换成真实嵌套信封（`tests/scoped-business-context.test.ts:65`、`tests/interaction-lifecycle.test.ts:123-140`），并保留顶层兼容用例、`error_code` 嵌套变体、无 code、不可解析、成功取 id 五组。

残留（不构成缺陷，仅记录）：V0-7 用 `throw new Error(envelopeText)` 模拟 mcp-client，其前提是 `extractText` 把平台的单个文本块原样取出。该假设来自 DSH 源码阅读而非实跑 MCP→ToolRuntime 全链；平台若改为多文本块，拼接结果可能不再是可解析 JSON（此时按设计降级为 `'other'`，不清 id，属安全侧失败）。

### P1-1 失效后清除内存 id —— 修复成立

- `interaction-lifecycle.ts` 失败分支在判定 `conversation-invalid` 时同时置位标志并清除 `conversationId`；非失效码仍原样返回 `state`（超时/401/5xx/参数错误不清 id 的语义保持）。
- `scoped-business-context.ts` 的 `persistConversationChange` 判定已按首轮提示联动改写为「id 从有到无 + 本轮失效置位」→ 写 tombstone；新 id 出现则写 `active` 并 `return`，两分支互斥，不会同轮重复写。
- 跨轮行为核对：失效后 `conversationId === undefined` → 注入段渲染「无可用 conversation」→ `denialFor` 的「已有 conversation 时禁止 new」分支不再触发 → 直接放行 `new`。首轮指出的「每轮多一次必失败调用 + 重复 tombstone」已消除。

### P1-2 同轮第二个 Interaction —— 修复成立

`denialFor` start 分支新增 `state.startsThisTurn > 0` 门，位置在 `open` 检查之后、受控失效分支之前。核对三条路径：

| 序列 | 结果 |
| --- | --- |
| start 成功(计数=1) → finish 成功 → 再 start | **拒绝** ✔ |
| start 失败(计数不变) → 重试 start | 放行 ✔（失败不累加计数） |
| start(continue) 失效 → 受控 new | 放行 ✔（失效只由失败产生，计数仍为 0，新门不挡） |

`native-mcp-provenance.ts:44` 的 `completed.size === 1` 前提由此保住。

### P2-1 双重断言 —— 修复成立

`scoped-business-context.ts` 改为 `ctx as Context & { on: ScopedAgentEvents['on'] }`，与相邻两行的交集写法一致，`as unknown as` 已消除。

## 2. 新发现

### N1（P2）finish 之后同轮再访问时，两条拒绝文案互相矛盾

**路径**：某轮 start 成功 → finish 成功（`open=false`、`startsThisTurn=1`）→ 模型又调一个受管非生命周期工具（例如追加一次 `query_object_instance`）。

1. guard 规则 2（`scoped-business-context.ts:107-110`）先命中：
   `Start mcp__openbkn__bkn_start_interaction before any OpenBKN access in this turn, then retry this call.`
   —— **指示模型去 start**；
2. 模型照做，`denialFor` 的新门立刻拒绝：
   `This turn already completed its one OpenBKN interaction; do not start another in the same turn...`

两步指令互相矛盾，正是方案 §11 与首轮都点名要避免的「拒绝→重试→再拒绝」回路。虽然第二条文案给了出路（用已有结果作答），但模型至少要撞两次拒绝才拿到正确指引，且第一条把它明确推向一个必被拒的动作。

**修复**：规则 2 按 `startsThisTurn` 分支给不同文案——`startsThisTurn === 0` 时维持现文案；`startsThisTurn > 0 && !open` 时直接告知「本轮的 OpenBKN 访问已结束，请基于已获得的结果作答」，不要再指示 start。建议把这段判定也移进 `denialFor`（规则 2 目前散在 guard 里，与其余规则分居两处，本身也是可读性负担）。

**验收**：单测——finish 之后同轮调用 `query_object_instance`，断言拒绝文案**不含** `Start mcp__openbkn__bkn_start_interaction`；§9.2 的「一轮内追问」用例观察日志中不出现连续两次拒绝。

## 3. 首轮遗留未处理

| 项 | 状态 | 说明 |
| --- | --- | --- |
| **P2-2** 未闭合告警不可观测 | **未处理** | `scoped-business-context.ts` 的 `turn-stopping` 仍打印 `START_INTERACTION_TOOL` 常量切片，每次同一句话，无 `interactionId`、无轮次。而 README 双语已对外承诺「观测项应跟踪未闭合 Interaction 计数」——按现状无法计数也无法定位。建议打印 `lifecycle.interactionId`（平台标识符，与溯源展示口径一致，非业务数据）与轮次 |
| **P3-1** `recordedAt` 被丢弃 | **未处理** | `parseConversationEvent` 仍返回 `recordedAt: 0`，而写入侧 `recordConversationEvent` 用的是 `Date.now()`。类型声明该字段有意义却被解析层清零，会误导后来者。解析真实值或从类型移除，二选一 |
| P3-2 V0-5 未实测 | 不变 | 仍为「结构性覆盖」。§9.2 的「重载会话后问业务问题」必须实跑，不得再降级 |

## 4. 代码风格类观察（不阻塞）

- `onToolResult` 失效分支用 `...(state.conversationId === undefined ? {} : { conversationId: undefined })` 显式写入 `undefined` 键，而同文件其他位置一律用「省略键」表达缺失。两种写法混用；若将来开启 `exactOptionalPropertyTypes` 会直接编译失败。建议统一为省略键。
- guard 里的规则 2 与 `denialFor` 里的规则 3–5 分居两处，随 N1 一并收拢更清晰。

## 5. 未复核项

- 实现方自报的插件 189/189、仓库 49/49、typecheck、`package:check` 本轮未重跑（避免 lockfile 改写）。N1 修复后请重跑并写明新计数。
- probe 本轮未执行；仅核对了 V0-7 的构造逻辑、降级分支与证据记录的一致性。
- 方案 §9.2 行为验收与噪声基线对比仍未执行（需完整 Runtime + 模型对话），这是本方案唯一剩下的实质缺口。

## 6. 建议处理顺序

1. **N1**（唯一新问题，单测即可覆盖，改动很小）；
2. P2-2 告警可观测化（README 已对外承诺，不宜再拖）；
3. P3-1 `recordedAt` 与第 4 节的写法统一（随手）；
4. 重跑测试并记录计数；
5. 进行 §9.2 基线测量与行为验收（九组正常路径 + 五组异常/取消路径 + 重载会话用例）；
6. 提交时噪声治理线与溯源线按文件分拆。

## 7. 约束

不 `reset --hard`/`clean`；DSH 树只经 compat apply/revert 变更；本地 `pnpm` 产生的 lockfile / `pnpm-workspace.yaml` 改写不得提交；日志与证据不含业务载荷与凭据。推送、打 tag、Release、向上游提 PR 需用户另行授权。
