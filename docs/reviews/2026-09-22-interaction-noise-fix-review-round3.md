# 噪声治理修复复核（2026-09-22，第三轮）

> 审核对象：针对第二轮复核（`2026-09-22-interaction-noise-fix-review.md`）的 N1、P2-2、P3-1 及一条不阻塞观察的修复，工作树未提交状态。
> 结论：**四项全部修复成立，代码层可以收尾。** 仅剩 1 条 P3 级 API 命名问题（新导出的 `lastConversationEvent` 名实不符），不阻塞提交。两轮审核的所有功能性条目至此闭环。
> 方法：只读核对源码与测试断言。**未重跑测试**（避免本地 `pnpm` 改写 lockfile），自报的插件 192/192、仓库 49/49、typecheck、`package:check`、probe 4/4 记为自报未复核。

## 1. 逐项核实

### N1 矛盾拒绝回路 —— 修复成立

- 规则 2 已从 guard 收入 `denialFor`（`interaction-lifecycle.ts` 末段），guard 现在只剩白名单一条判定，规则 2–5 同居一处；
- 文案按 `startsThisTurn` 分叉，核对两条分支：
  - `startsThisTurn === 0 && !open` → `Start mcp__openbkn__bkn_start_interaction ... then retry this call.`（原语义保留）
  - `startsThisTurn > 0 && !open` → `This turn already completed its one OpenBKN interaction; no further OpenBKN access is possible in this turn...`（**不再指示 start**，回路消除）
- 断言锁死到位且**分两层**：`tests/interaction-lifecycle.test.ts:189/197` 锁纯函数两种文案，`tests/scoped-business-context.test.ts:175` 锁 guard 出口不含 `then retry this call`。这比只在一处断言更稳。
- `denialFor` 的文档注释（`interaction-lifecycle.ts:238-246`）写明了前置条件「调用方已按白名单拒绝非受管名称」，并解释了分叉理由。规则 2 现在对任意非生命周期名称生效，这条注释是必要的契约声明，已具备。

### P2-2 告警可观测 —— 修复成立

`turn-stopping` 监听器改为接收 payload 并输出：

```
code=interaction-left-open, turn=%d, interactionId=%s   （id 未知时为 unknown）
```

稳定 token 可计数、`turn` + `interactionId` 可定位，兑现了 README 双语已对外承诺的「观测项应跟踪未闭合 Interaction 计数」。`interactionId` 属平台生命周期标识（与会话事件、溯源 handle 同类），非参数值或响应体，符合「日志只打工具短名与状态码、不打业务载荷」的约束。

### P3-1 `recordedAt` —— 修复成立

- `parseConversationEvent` 改为 `typeof === 'number' && Number.isFinite(...)` 才采用，缺失降级 0 而非编造；
- 新增导出 `lastConversationEvent`，`restoreFrom` 改为委托它取 `conversationId`——两处遍历逻辑合一，无重复实现；
- 往返单测覆盖（`tests/interaction-lifecycle.test.ts:107-118`），含 `recordedAt` 缺失的降级用例。

### 不阻塞观察（写法统一）—— 修复成立

`grep "conversationId: undefined\|interactionId: undefined" src/interaction-lifecycle.ts` 零命中，失效分支与 finish 分支均改为键省略写法。将来开启 `exactOptionalPropertyTypes` 不会编译失败。

## 2. 本轮唯一新发现

### N2（P3，不阻塞）`lastConversationEvent` 名实不符，且已进公共导出面

```ts
export function lastConversationEvent(events): ManagedConversationEventData | undefined {
  ...
  last = data.status === 'active' ? data : undefined   // 末条是 tombstone → 返回 undefined
  return last
}
```

函数名承诺「最后一条会话事件」，实际语义是「最后一条**仍持有 id 的** active 事件」：末条为 `invalidated` 时返回 `undefined`，与「从未有过会话」不可区分。单测里那句 `'a tombstone is not an id holder'` 恰好说明作者清楚这层语义，但名字没有表达出来。该函数已从 `src/index.ts:41` 导出，属包的公共面。

影响：`restoreFrom` 的用法正确（它要的就是 id 持有者），所以**当前无功能缺陷**；风险在于后来者想用它做「这个会话的 conversation 是否被判失效过、何时失效」的诊断读取时会拿到 `undefined` 而误判。

**建议（二选一）**：
1. 重命名为 `lastActiveConversationEvent`，语义与名字一致；或
2. 让它返回末条事件（无论 `active` / `invalidated`），由 `restoreFrom` 自行按 `status === 'active'` 过滤——这样顺带解锁失效诊断的读取能力，也更符合「verbatim」的注释措辞。

**验收**：改名或改语义后，`restoreFrom` 的现有断言（tombstone → 无 id）保持通过；若取方案 2，新增一条「末条为 tombstone 时可读到 `invalidated` 记录」的断言。

## 3. 状态总览

| 轮次 | 条目 | 状态 |
| --- | --- | --- |
| 首轮 | P0-1 错误码层级 | ✅ 闭环（含 V0-7 生产链路验证） |
| 首轮 | P1-1 失效未清 id | ✅ 闭环 |
| 首轮 | P1-2 同轮二开 | ✅ 闭环 |
| 首轮 | P2-1 双重断言 | ✅ 闭环 |
| 二轮 | N1 矛盾拒绝回路 | ✅ 闭环 |
| 二轮 | P2-2 告警不可观测 | ✅ 闭环 |
| 二轮 | P3-1 `recordedAt` | ✅ 闭环 |
| 二轮 | 写法统一（exactOptionalPropertyTypes） | ✅ 闭环 |
| 三轮 | N2 `lastConversationEvent` 命名 | ✅ 闭环（见第 6 节） |

**代码层到此收尾完成。** 剩余的是非代码缺口。

## 4. 剩余缺口（与前两轮一致，未变）

1. **§9.2 行为验收与噪声基线对比**——唯一的实质缺口。需完整 OpenBKN DSH Runtime + 模型对话，九组正常路径 + 五组异常/取消路径 + 「重载会话后问业务问题」（V0-5 至今仍只有结构性覆盖，此处必须实跑，不得再降级）。改前取基线、改后同组复测，两组数字写入回应与 `docs/evidence/`。
2. **全部改动未提交**，且与溯源工作线并存于同一工作树，提交时须按文件分拆。
3. 本轮未重跑测试与 probe；N2 处理后请重跑并写明计数。

## 5. 收尾确认（2026-09-22，N2 修复后补记）

N2 已按方案 2 修复并经本轮只读复核，**三轮审核的全部条目闭环，代码层收尾完成，无新发现**：

- `lastConversationEvent` 遍历到末条即返回，不再按 status 过滤——末条为 tombstone 时原样返回 `status: 'invalidated'` 的记录，与「从未有过会话」的 `undefined` 可区分，诊断读取（这个会话的 conversation 是否被判失效过）不再误判；
- `restoreFrom` 自行判 `status === 'active'` 才持有 id，tombstone 折叠为「无可用 conversation」，既有语义未变；
- 两函数的文档注释写明了分工（verbatim 读 vs 折叠读）；
- 单测把两个语义**钉在同一份事件序列上**：`lastConversationEvent(events.slice(0, 2))` 断言返回 tombstone 本身，`restoreFrom(events.slice(0, 2)).conversationId` 断言为 `undefined`。同夹具对比比分开两份更能防回归。

自报计数（未复核）：插件 192/192、仓库根 49/49、typecheck 通过、lockfile 干净。

**交接时只剩第 4 节的两项非代码事项**（§9.2 行为验收与基线对比、提交分拆）；第 4 节第 3 条「N2 处理后重跑」已由本次自报计数覆盖。

## 6. 约束

不 `reset --hard`/`clean`；DSH 树只经 compat apply/revert 变更；本地 `pnpm` 产生的 lockfile / `pnpm-workspace.yaml` 改写不得提交；日志与证据不含业务载荷与凭据。推送、打 tag、Release、向上游提 PR 需用户另行授权。
