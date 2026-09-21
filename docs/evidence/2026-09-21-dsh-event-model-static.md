# V0 静态预验证：DSH 0.1.6-alpha.2 事件模型与 guard 时序

> 用途：噪声治理方案 `docs/plans/2026-09-20-interaction-noise-reduction.md`（v3）第 2 节 V0 的**静态先行部分**。
> 结论性质：**源码阅读，非运行时实测**。V0-1…V0-4 已可按「静态成立」实施，但 probe 仍须跑一次确认；V0-5、V0-6 无法静态回答。
> 读取对象：`/Users/kalias/Documents/project/app/openBKN/deepseek-harness`，`git describe` = `dsh-v0.1.6-alpha.2`（工作树带 compat 补丁，本次只读未改）。
> 日期：2026-09-21。本文不含任何业务载荷、参数值或凭据。

## 1. 结论速览

| # | 待验证 | 静态结论 | 关键证据 |
| --- | --- | --- | --- |
| V0-1 | agent-scoped `tools/result` 只收到本 Agent 的调用 | **成立（有前提）** | `packages/core/scope/src/scoped-events.generated.ts:36`；`packages/core/scope/src/index.ts:170-183`；`packages/core/tools/src/index.ts:1675` |
| V0-2 | 模型发起的调用 `exec.agent` 一定存在 | **成立（限模型发起）** | `packages/core/agent-loop/src/tool-calls.ts:68-81`；旁路条件在 `packages/core/tools/src/index.ts:1128` |
| V0-3 | start 的成功结果先于下一次 guard 判定到达 | **成立（仅当监听器同步）** | `packages/core/tools/src/index.ts:1666-1685`（`notifyResult`） |
| V0-4 | 取消 / 超时 / 抛错时结果事件仍到达 | **成立** | `packages/core/tools/src/index.ts:1356-1363`、`1621-1628`、`1491-1510`、`1949` |
| V0-5 | 会话恢复后不残留 open 状态 | **无法静态回答**，须实测 | — |
| V0-6 | 平台「conversation 失效」错误码 | **无法静态回答**，须连平台实测 | — |

## 2. 逐条证据

### V0-1 作用域过滤

`tools/result` 的作用域键就是 `exec.agent`：

```
scoped-events.generated.ts:36
  'tools/result': args => (args[0] as Record<string, unknown>)['agent'],
```

发射端 `tools/src/index.ts:1675` 用 `scopeTarget(this, exec.agent)` 作为 dispatch 的 thisArg。

`scopeTarget`（`scope/src/index.ts:170-183`）的准入规则：

- 监听器上下文**无 scope 标签** → 一律准入（收到所有 Agent 的事件）；
- 有标签 → 标签等于 dispatch 键、或是该键的**祖先**才准入；
- 标签在 dispatch 键之下 → 不准入（事件只向上流，不向下）。

**推论（实现约束 C1）**：监听器必须注册在 **Agent 作用域的 ctx** 上。现有 `scoped-business-context.ts` 的 `scopedPolicyPlugin(...).apply(agent.ctx)` 正是这个位置，在此注册即自动只收本 Agent。若图省事注册在服务级 `this.ctx`（无标签），会收到**所有** Agent 的 `tools/result`，必须自行按 `exec.agent` 过滤——两种写法都能对，但不能混。

### V0-2 `exec.agent` 的存在性与 guard 旁路

guard 解析的旁路条件（`tools/src/index.ts:1125-1134`）：

```ts
private guardReason(exec: ToolExecution): string | undefined {
  const globalReason = this.layers.global.guardReason(exec)
  if (globalReason !== undefined) return globalReason
  if (exec.agent === undefined) return undefined      // ← scoped guard 被整体跳过
  for (const layer of this.layers.chainLayers(exec.agent)) { ... }
}
```

模型发起的调用一定带 agent（`agent-loop/src/tool-calls.ts:68-81`）：

```ts
const agent = ctx.agents.requireInitiator()
const planned: PlannedCall[] = toolCalls.map(block => ({
  block,
  exec: { callId: block.id, name: block.name, arguments: parseArguments(block.arguments), agent, signal },
}))
```

**推论（C3）**：本方案的所有 guard 规则只约束**模型发起**的调用，这正是目标范围。但要记住旁路是 `exec.agent === undefined` 而非「嵌套」——任何未来由宿主侧直接发起、不带 agent 的执行都不会经过我们的 scoped guard。放宽白名单（方案 B）或启用 PTC 前必须重新评估这一条。

### V0-3 结果到达与 guard 判定的先后

`notifyResult`（`tools/src/index.ts:1666-1685`）：

```ts
const callbacks = this.ctx.events.dispatch('emit', [scopeTarget(this, exec.agent), 'tools/result', exec, result])
for (const callback of callbacks) {
  try {
    const returned: unknown = callback(exec, result)
    void Promise.resolve(returned).catch(reportFailure)   // ← 异步监听器是 fire-and-forget
  } catch (error: unknown) { reportFailure(error) }
}
```

同步监听器在 `finishScheduledExecution` 返回前**内联执行完毕**，因此状态在结果回到 agent loop 之前就已更新，后续任何 guard 判定都能看到。异步监听器则只是被 `void` 掉，与下一次 guard 判定构成竞态。

**推论（C2，最容易踩坑的一条）**：`tools/result` 监听器**必须是同步函数**，内部不得 `await`。状态机的 `onToolResult` 也因此必须是纯同步的（这与 v3 方案「纯函数状态机」一致，实现时别顺手改成 async）。

### V0-4 失败路径的收敛

所有终态都汇入 `finishScheduledExecution` → `notifyResult`：

- guard 拒绝与 pre-execute 的 deny/cancel：`1491-1510` 构造 `{ kind: 'post-result', ... }`，在 `1356-1363` 落到 finish；
- 工具抛错：`1621-1628` 直接 finish；
- 派发前取消：结果带 `error.info = { name: 'AbortError', code: 'ABORTED_BEFORE_DISPATCH' }`（常量见 `1949`、`469`）。

**推论（C4）**：失败、拒绝、取消都会产生 `tools/result`，状态机可据此收敛；`ABORTED_BEFORE_DISPATCH` 可用于把「用户取消」与「平台报错」区分开，写告警时用它。

### 附带：会话事件的字段（两方案都用得到）

`agent-loop/src/tool-calls.ts:264` 与 `278-295`：

- `tool/call` → `{ turn, step, callId, name, arguments }`
- `tool/result` → `{ turn, step, message, error?（result.error.info）, meta? }`，并以 `sourceEventSeqs` 指回 call 事件

轮边界因此可由 `turn` 字段直接判定，无需另造计数。

## 3. 派生的实现约束（交接要点）

| 编号 | 约束 | 依据 |
| --- | --- | --- |
| C1 | `tools/result` 监听器注册在 `agent.ctx`（Agent 作用域）；若注册在服务级 ctx，必须自行按 `exec.agent` 过滤 | V0-1 |
| C2 | 该监听器**必须同步**，不得 async；状态机保持同步纯函数 | V0-3 |
| C3 | guard 只覆盖带 `agent` 的执行；放宽白名单或启用 PTC 前重新评估 | V0-2 |
| C4 | 失败/拒绝/取消均有结果事件；用 `ABORTED_BEFORE_DISPATCH` 识别取消 | V0-4 |
| C5 | 轮边界用事件里的 `turn` 字段，不要另起计数 | 附带 |

## 4. 仍须运行时验证（probe 的收窄范围）

静态结论把 probe 从「探索」压缩为「确认」，建议 probe 只保留四条断言 + 两项实测：

1. 确认 C1：两个会话交叉调用，断言监听器只收到本 Agent 的 callId；
2. 确认 C2：同步监听器下，`start` 后紧接的受管工具调用未被误拒；
3. 确认 C4：取消一次生成，断言收到 `tools/result` 且 `error.info.code === 'ABORTED_BEFORE_DISPATCH'`；
4. 确认 C3：guard 内统计 `exec.agent === undefined` 的次数，期望为 0；
5. **V0-5（无静态结论）**：会话恢复后立即发业务问题，断言状态机的 `open` 为 false、`conversationId` 从事件回放取回；
6. **V0-6（无静态结论，需平台）**：用伪造 `conversation_id` 调 `bkn_start_interaction --conversation_mode continue`，记录错误码形状；再与超时 / 401 / 5xx / 参数错误四类对照，判断能否机器区分。若不能，按 v3 方案 5.3 **不实现自动回退**。

probe 与证据格式沿用 v3 第 2 节：`tests/probes/dsh-event-model.probe.mjs`（手动运行，不进 CI 与发布包），证据字段 `{ check, dshVersion, command, observation, verdict }`，observation 只写计数、布尔、错误码与工具短名。

## 5. 适用边界

- 结论绑定 `dsh-v0.1.6-alpha.2`。上述四处实现全部是 DSH 内部结构，**升级 DSH 必须重跑 probe 并复核本文档的行号引用**。
- 仅覆盖 Standard 预设的模型发起路径；PTC 在该 alpha 有已知的工具派发缺陷，未纳入。
- 本次只读源码，未执行构建、测试或平台调用。

## 6. 仓库状态提示（交接用）

撰写本文时 `bkn-dsh` 工作树有另一路并行工作的未提交改动（溯源时间链：`src/turn-timeline.ts` 等新增与多个 provenance 文件修改）。噪声治理的开发请**另起分支或先与该会话对齐**，避免在 `scoped-business-context.ts`、`business-context-service.ts` 两个共用文件上互相覆盖——这两个文件两边都要动，是唯一的冲突面。
