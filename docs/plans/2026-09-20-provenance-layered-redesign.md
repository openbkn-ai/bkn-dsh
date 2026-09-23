# 方案：业务溯源重做（时间链 + 证据链 + 分层授权降级）

> 类型：可执行改造方案（交给开发 agent）。
> 基线：`feat/dsh-0.1.6-alpha.2-compat`，行号以成稿时源码为准，实施前复核。
> 关联：`docs/plans/2026-09-20-interaction-noise-reduction.md`（噪声治理，本方案与之互补，见第 9 节）；`docs/reviews/2026-09-20-goal-gap-analysis.md` G6/G9。

## 1. 现状与问题

| # | 问题 | 证据 |
| --- | --- | --- |
| P1 | 证据链是硬编码占位 | `provenance-view.ts` `buildProvenanceView` 返回 `evidence: { kind: 'unavailable' }`；`types.ts:100-101` 注释「Enterprise Interaction projection does not define an evidence-chain DTO」 |
| P2 | 句柄丢弃本地已有标识符 | `native-mcp-provenance.ts` 只取 `interaction_id`，`requestIds/traceIds/receiptIds` 恒 `[]`、`partial` 恒 `true` |
| P3 | 降级一刀切，403 打死整个面板 | `business-context-service.ts` `remoteGetTurnProvenanceView`：两个读取都失败即抛 `RemoteError`／通用 Error，前端整体显示「需企业版」；**本地可得的执行过程也一并消失** |
| P4 | 没有时间主线 | 「执行溯源」只有平台 operations 列表，无会话侧时间骨架与耗时 |
| P5 | 授权语义混淆 | `platform-reader.ts` 把两条 observability 路由都标 `licenseGated: true`，而 `provenance-view.ts` 注释称 operations 是 **Community** 事实；M5 证据里 403 原文是「业务域未获准…required_action=request_authorization」（域授权），但当时**同时**升了企业版并补发了 `x-business-domain`，两个变量未隔离 |

## 2. 先做两个验证（结论会改写方案的一半）

### V1：observability 路由的门到底是 License 还是业务域授权

**做法**：对同一个 interaction 发三次 `GET /api/agent-observability/v1/interactions/{id}/operations`：
1. 企业版 + 已授权域（现状，预期 200）；
2. 企业版 + 未授权域（把 `businessDomain` 配成一个未授权的域）；
3. 若有社区部署或可临时降级：社区版 + 已授权域。

**记录**：每次的 HTTP 状态、`error.code`、`error.message`、`required_action`，以及同时 `GET /api/safe/v1/capabilities` 的 `licensed`/`edition`/`features`。

**分叉**：
- **域授权门** → operations 归 Layer 1（社区版可得），社区版能看到「时间链 + 平台执行事实 + 回执清单」，只缺业务图；
- **License 门** → operations 归 Layer 2，社区版只有 Layer 0，本地时间链的完成度就更关键。

方案其余部分与结论无关，只是 `sources` 徽章与降级文案取值不同。

### V2：OpenBKN MCP 返回里到底带哪些标识符

**做法**：取一条现成的绑定会话日志（或新跑一轮），把本轮 `mcp__openbkn__*` 的 `tool/result` 原始 JSON 打出来，逐个工具记录字段名：是否有 `interaction_id`、`conversation_id`、`request_id`、`trace_id`、`receipt_id`／`bkn_receipt`、`operation_id`。

**分叉**：若检索类结果自带 receipt → 证据链在社区版也能立起来（Layer 0 自带证据）；若只有 `finish_interaction` 带 `interaction_id` → 证据链完全依赖 Layer 1/2，社区版证据页显示 `reason: 'not-authorized'` 或 `'no-receipts'`。

**约束**：打印原始载荷只在本地排查时进行，**不得写进仓库、日志或任何 evidence 文档**（可能含业务数据）；只把**字段名清单**记入结论。

## 3. 目标模型：三层数据源，各自独立降级

| 层 | 内容 | 来源 | 授权要求 |
| --- | --- | --- | --- |
| **L0 执行时间链** | 提问 → start → 各次调用（耗时/成败）→ finish → 回答 | **DSH 会话事件（本地）** | 无 |
| **L1 平台执行事实** | operation_id、request/trace/receipt、平台口径状态与耗时 | observability `operations` | 见 V1 |
| **L2 业务图与证据解析** | 业务对象/关系投影、回执内容 | observability `business-graph` + 回执解析 | 企业版 |

**核心原则**：L0 永远渲染；L1/L2 是**对 L0 的补全**，缺失只影响自己那一部分，绝不阻断整体。

### 降级矩阵

| 情形 | 时间链 | 执行事实 | 业务图 | 证据链 |
| --- | --- | --- | --- | --- |
| 企业版 + 域已授权 | ✅ 本地 | ✅ 平台补全 | ✅ | ✅ 解析 |
| 企业版 + 域未授权 | ✅ | ⚠️ `domain-not-authorized` | ⚠️ 同左 | ⚠️ 同左 |
| 社区版（V1=域门） | ✅ | ✅ | ⚠️ `license-required` | ✅ 清单（不解析） |
| 社区版（V1=License 门） | ✅ | ⚠️ `license-required` | ⚠️ 同左 | 视 V2 而定 |
| Token 失效 | ✅ | ⚠️ `authentication-required` | ⚠️ 同左 | ⚠️ 同左 |
| 平台不可达 | ✅ | ⚠️ `platform-unavailable` | ⚠️ 同左 | ⚠️ 同左 |

## 4. DTO 设计

### 4.1 时间链节点

```ts
export interface ProvenanceTimelineNode {
  /** 本轮内的展示顺序，从 0 起 */
  readonly seq: number
  readonly kind: 'question' | 'lifecycle' | 'discovery' | 'retrieval' | 'answer'
  /** 去掉 mcp__openbkn__ 前缀的短名，仅工具节点有 */
  readonly tool?: string
  /** SessionEvent.time（epoch ms） */
  readonly at: number
  /** result.time - call.time；无结果事件时省略 */
  readonly durationMs?: number
  readonly outcome?: 'ok' | 'error'
  /** 白名单投影后的摘要，绝不是原始载荷 */
  readonly summary?: string
  /** L1 可得时补全；无法可靠对齐时整体省略 */
  readonly platform?: {
    readonly operationId?: string
    readonly requestId?: string
    readonly traceId?: string
    readonly receiptId?: string
    readonly status?: string
  }
}
```

### 4.2 证据链

```ts
export type ProvenanceEvidenceView =
  | { readonly kind: 'unavailable'; readonly reason: EvidenceUnavailableReason }
  | { readonly kind: 'ready'; readonly receipts: readonly ProvenanceReceiptRef[] }

export type EvidenceUnavailableReason =
  | 'no-receipts'            // 本轮确实没有回执（例如纯 schema 查询）
  | 'not-authorized'         // 域未授权或 License 不足
  | 'platform-unavailable'

export interface ProvenanceReceiptRef {
  readonly receiptId: string
  readonly operationId?: string
  readonly toolLabel?: string
  readonly status?: string
  readonly durability?: string
  readonly source: 'platform' | 'mcp-result'
  /** 可复制的核验指引，例如 `openbkn trace receipts get <id>`；只是文本，不触发任何执行 */
  readonly verifyHint?: string
  /** 仅企业版可解析时存在 */
  readonly detail?: ProvenanceReceiptDetail
}
```

`ProvenanceReceiptDetail` 的字段等 V1/V2 结论出来后按真实响应定义；**在此之前不要凭空造 DTO**（P1 就是这么来的）。

### 4.3 来源与完整度

```ts
export interface ProvenanceSources {
  readonly timeline: 'local-session'
  readonly operations: 'platform' | 'unavailable'
  readonly business: 'platform-enterprise' | 'unavailable'
  readonly evidence: 'platform' | 'mcp-result' | 'unavailable'
  readonly degraded: readonly ProvenanceDegradation[]
}

export interface ProvenanceDegradation {
  readonly pane: 'operations' | 'business' | 'evidence'
  readonly reason:
    | 'license-required'
    | 'domain-not-authorized'
    | 'authentication-required'
    | 'platform-unavailable'
  readonly edition?: string
  /** 平台给出的 required_action，原样透传（已截断） */
  readonly requiredAction?: string
}
```

### 4.4 视图整体

```ts
export interface ProvenanceView {
  readonly interactionId: string
  readonly conversationId?: string
  readonly sources: ProvenanceSources
  readonly timeline: readonly ProvenanceTimelineNode[]   // L0，恒非空
  readonly execution: { readonly status?: string; readonly operations: readonly ProvenanceOperationView[] }  // L1
  readonly business: ProvenanceBusinessView              // L2
  readonly evidence: ProvenanceEvidenceView
}
```

`execution`/`business` 保持现有形状，避免改动面外溢。

### 4.5 句柄 v2（持久化，谨慎）

```ts
{
  schemaVersion: 2,
  interactionId, status, partial,
  conversationId?,            // 新增：跨轮续接展示
  turn?: number,              // 新增：重建时间链时定位本轮事件
  requestIds, traceIds, receiptIds,   // 新增：从本轮 MCP 结果收集（依 V2）
}
```

**兼容要求（必须做对，否则老会话溯源全打不开）**：
1. `normalizeProvenanceHandle` 接受 `schemaVersion` 为 1 或 2；v1 读入后在内存升级为 v2 形状（新增字段留空），**不回写**会话事件；
2. `appendTurnProvenance` 的 `sameHandle` 比较必须让「存储的 v1」与「内存升级后的 v2」判定为相等，否则会误抛 `TurnProvenanceConflictError`——现有冲突逻辑是按字段比的，务必加针对性单测；
3. 会话事件是 append-only，不做迁移写。

**不要把时间链写进句柄**：会话事件里已经有全部原始素材，时间链在**读取时重建**。句柄只存标识符骨架，避免膨胀与敏感数据二次落盘。

## 5. 实现规格

### 5.1 L0：时间链重建（新增 `src/turn-timeline.ts`）

纯函数，输入 `(events, turn)`，输出 `readonly ProvenanceTimelineNode[]`：

1. 定位本轮：从句柄的 `turn`（v2）或由 `messageId` 反查 `assistant/message` 事件的 `data.turn`（v1 兼容路径）。
2. 收集本轮事件：`user/message`（提问节点）、`tool/call` + 对应 `tool/result`（按 `callId` 配对）、最终 `assistant/message`（回答节点）。
3. 只保留 `mcp__openbkn__*` 工具；按 `SessionEvent.time` 排序；`durationMs = result.time - call.time`。
4. `kind` 按工具分组判定，**复用噪声治理方案 v2 的两组常量**（`LIFECYCLE_TOOLS` / `MANAGED_IN_INTERACTION_TOOLS`），两处不要各写一份。因 v2 已撤销 discovery 的豁免（schema/skills 同样必须在 Interaction 内），`kind` 取值相应改为 `'question' | 'lifecycle' | 'managed' | 'answer'`；若展示上仍想区分「查 schema」与「查数据」，在时间链内部按工具短名细分，不要重新引入分组常量。
5. `summary` 走**字段白名单**投影：
   - `bkn_start_interaction`：`conversation_mode`、是否带 `conversation_id`（只显示有/无，不显示值）；
   - `bkn_finish_interaction`：`execution_status`；
   - 检索类：工具短名 + 结果条数（若结果 JSON 顶层有可数数组）；
   - 其余：只有工具短名。
   **禁止**把工具参数值或响应体文本放进 `summary`——既有边界是「浏览器不接触原始 MCP 载荷」。
6. 连续同名同结果的调用可折叠为 `query_object_instance ×3`（折叠仅影响展示，`platform` 字段则不折叠：折叠节点不带 `platform`）。

### 5.2 L1 对齐（`provenance-view.ts`）

在 `buildProvenanceView` 中把 L1 的 operations 往 L0 节点上挂：

- 对齐规则：同一 interaction 内，按 `tool_name` 相同 + 时间先后顺序一一配对；
- **对齐不确定就不挂**：同名工具数量与本地节点数量不一致、或平台 `started_at` 缺失时，整组放弃 `platform` 补全，只在执行事实页原样列出 operations。宁可少显示，不要错关联。
- `execution.operations` 保持现有投影不动（`ProvenanceOperationView` 不变）。

### 5.3 证据链（`provenance-view.ts` + reader）

- 回执来源优先级：平台 operations 的 `receipt_id`（source `platform`）> MCP 结果内嵌回执（source `mcp-result`，依 V2）。
- `verifyHint` 由宿主拼字符串，**不扩展 `openbkn-cli-subprocess.ts` 的三条命令白名单**。
- 本轮确实没有任何回执（例如只做了 schema 查询）→ `{ kind: 'unavailable', reason: 'no-receipts' }`，文案要说清「本轮没有产生需要回执的业务操作」，与「没权限看」区分开。

### 5.4 降级替代抛错（`business-context-service.ts`）

`remoteGetTurnProvenanceView` 改为**永不因平台不可得而抛错**：

```
handle 不存在                      → 返回 undefined（不变）
L0 重建                            → 恒成功（纯本地）
L1/L2 各自 allSettled，失败归类为 degradation：
  LICENSE_REQUIRED + capabilities.licensed === false   → 'license-required'（带 edition）
  LICENSE_REQUIRED + licensed !== false                → 'domain-not-authorized'（带 required_action）
  AUTHENTICATION_REQUIRED                              → 'authentication-required'
  其余                                                  → 'platform-unavailable'
返回带 sources.degraded 的完整视图
```

这同时修掉现有逻辑的一个钝角：`licensed !== false` 时现在抛的是笼统的「records are unavailable」，用户根本不知道是域授权问题。`provenanceLicenseDecision` 相应改为返回**降级原因**而非「提示/不提示升级」二选一。

`required_action` 需要 reader 在 403 分支里带出来：现有代码已经读了 4 KB 以内的错误体并解析 `error.code`，顺手取 `error.required_action`（截断 256 字符）即可，仍不外泄响应体其余内容。

### 5.5 UI（`ProvenanceOverlay.tsx`）

- 标签页从三个变四个：**时间链（默认）** / 执行事实 / 业务图 / 证据链；或保留三个、把时间链作为「执行」页的主视图而 operations 作为其明细表——**推荐后者**，减少用户心智负担，实施时二选一即可。
- 每个面板顶部一枚来源徽章：`本地会话` / `平台` / `平台·企业版`，以及 partial 标记。
- 不可用的面板显示对应 `reason` 的具体文案与下一步动作（升级企业版 / 联系管理员授权业务域并给出 `required_action` / 重新登录 / 稍后重试），**不再整面板一句「需要企业版」**。
- 现有 `licenseRequired` 单一布尔状态改为按面板的降级状态。

## 6. 文件清单

| 文件 | 改动 |
| --- | --- |
| `src/turn-timeline.ts` | **新增**：L0 时间链重建纯函数 |
| `src/types.ts` | 新增 timeline/evidence/sources DTO；`ProvenanceView` 扩展；`ProvenanceHandle` v2 |
| `src/provenance-handle.ts` | 接受 v1/v2，v1 内存升级；`sameHandle` 兼容 |
| `src/turn-provenance.ts` | 冲突比较兼容 v1/v2 |
| `src/native-mcp-provenance.ts` | 收集 `conversation_id`、`turn` 与本轮可得的 request/trace/receipt id（依 V2） |
| `src/provenance-view.ts` | 组装四段视图；L1 对齐；证据链投影；删除硬编码 `evidence: unavailable` |
| `src/platform-reader.ts` | 403 分支带出 `required_action`（截断） |
| `src/business-context-service.ts` | 降级替代抛错；`provenanceLicenseDecision` 改为返回降级原因 |
| `src/client/ProvenanceOverlay.tsx` | 时间链渲染、来源徽章、按面板降级文案 |
| `tests/*` | 见第 7 节 |
| `docs/evidence/` | V1/V2 结论（只记字段名与错误码，不记载荷） |

## 7. 测试

### 7.1 单测（不需平台）

- `turn-timeline`：① 典型轮（start→discovery→retrieval×3→finish→answer）节点顺序、耗时、折叠正确；② 失败调用标 `outcome: 'error'`；③ 非 OpenBKN 工具被排除；④ 缺失 `tool/result`（超时/中断）时节点仍在、`durationMs` 省略；⑤ `summary` 不含任何参数值或响应体片段（用含敏感值的 fixture 断言不出现）。
- `provenance-handle`：v1 读入升级为 v2 且字段留空；v2 往返；非法版本仍拒绝；**v1 存储 vs v2 内存不触发冲突**。
- `turn-provenance`：同一 messageId 的 v1 事件重复读取不抛冲突。
- `provenance-view`：① L1 缺失时 timeline 仍完整、`sources.operations === 'unavailable'`；② 对齐不确定时不挂 `platform`；③ 证据链三种 `reason` 分支；④ 业务图缺失不影响其他字段。
- `business-context-service`：四类失败各自映射到正确的 `degradation.reason`；**任何一种都不再抛错**；`licensed !== false` 时给 `domain-not-authorized` 且带 `requiredAction`。
- 回归：插件与仓库测试全绿（当前 119/49，新增后写明新计数）。

### 7.2 行为验收（需平台，并入 G6 评测与 round9 的 E2E）

| 场景 | 期望 |
| --- | --- |
| 企业版正常一轮业务问答 | 四段齐全；时间链节点数与实际调用数一致；平台字段挂上 |
| 把 `businessDomain` 改成未授权域 | 时间链照常；其余三段显示 `domain-not-authorized` 并带 required_action |
| Token 失效 | 时间链照常；其余显示需重新认证（不是 License 提示） |
| 停掉平台后打开旧会话的溯源 | 时间链照常显示，其余 `platform-unavailable` |
| 社区版（若可得） | 按 V1 结论对照降级矩阵逐格核对 |
| 打开 v1 老会话的溯源 | 正常打开，时间链由会话事件重建，不报错 |

## 8. 风险

| 风险 | 缓解 |
| --- | --- |
| 句柄版本兼容做错 → 老会话溯源全挂 | 专门单测（7.1 第 2、3 条）；append-only 不迁移 |
| L0/L1 错误对齐 → 展示错误的 receipt | 对齐不确定即不挂，宁缺毋错 |
| `summary` 泄露业务数据到浏览器 | 字段白名单 + 敏感 fixture 断言 |
| 证据链 DTO 又变成臆测 | V2 出结论前不定义 `ProvenanceReceiptDetail` |
| 时间链重建成本 | 只在打开面板时重建、只扫本轮事件；必要时按 turn 建索引 |

## 9. 与噪声治理方案的衔接

- 噪声治理后，非业务轮不再产生 interaction，也就没有句柄 → **「查看业务溯源」入口应当在该轮不出现**，而不是出现后显示空面板。实施时在 `getTurnProvenanceHandle` 返回 undefined 的轮次隐藏入口（若当前是常驻显示，需一并改）。
- 两个方案都要动 `scoped-business-context.ts` 的工具分组常量与 `business-context-service.ts`，**建议同批实施或明确先后**，避免同文件冲突。先做噪声治理更合理：溯源的验收用例本身依赖「业务轮恰好一个 interaction」。

## 10. 实施顺序

1. **V1 + V2 验证**（半天，先出结论）；
2. L0 时间链 + 分级降级（不依赖验证结论，先让社区版有东西看，并修掉 P3）；
3. 句柄 v2 + 本地标识符收集；
4. 证据链按 V1/V2 结论落地；
5. UI 重排与来源徽章；
6. 业务图维持现有投影，仅改为独立降级。

## 11. 约束

不 `reset --hard`/`clean`；DSH 树只经 compat apply/revert 变更；不读取或输出凭据；**排查期打印的 MCP 原始载荷不得入库、不得进日志或 evidence 文档，只记字段名**；浏览器侧不接触原始 MCP 载荷（既有边界）；不扩展 CLI 子进程命令白名单。推送、打 tag、Release、向上游提 PR 需用户另行授权。
