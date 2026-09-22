# 交接：业务溯源时间链（L0）收尾与落地

> 类型：可执行任务书（交给开发 agent）。日期：2026-09-21；2026-09-22 修订：三个决策点已由用户拍板，第 3 节改为**既定决策**，按本文直接执行，无需再回来确认。
> 前置阅读：`2026-09-20-provenance-layered-redesign.md`（设计）、`2026-09-20-interaction-noise-reduction.md`（噪声治理 v3，与本批有共用文件）、`../evidence/2026-09-20-provenance-v1-v2.md`（V1/V2 实测与源码核实结论）、`../evidence/2026-09-21-dsh-event-model-static.md`（DSH 事件模型静态结论）。
> 基线复核方式：本文行号为 2026-09-21 工作树实况，动手前用 `grep -n` 复核。

## 0. 状态一句话

分层溯源方案（时间链 L0 + 分层降级 + 证据链）**已在工作树实现且插件单测 149/149 全绿**（原基线 119），但**全部改动未提交、停在 `main` 工作树上**，且遗留 4 项代码债、1 个与噪声治理的枚举冲突、4 项待更新文档、全部平台侧行为验收未做。本文只覆盖这些剩余项。

**本批执行顺序：T1 → T2（a/b/c/d）→ T4a → T5。T3 不在本批内**（移交噪声治理批次，见 §3 决策 1）；T4b 与 T6 同理不做。

## 1. 已完成，不要重做

| 项 | 落点 | 证据 |
| --- | --- | --- |
| L0 时间链重建纯函数 | `src/turn-timeline.ts`（新增，未 git add） | `tests/turn-timeline.test.ts` 5 例 |
| 句柄 v2（`conversationId`/`turn`）+ v1 兼容升级 | `src/provenance-handle.ts`、`src/types.ts:24-45` | `tests/provenance-handle.test.ts` |
| v1 存储 vs v2 内存不误判冲突 | `sameProvenanceHandle`（比 `interactionId`+`status`），`src/turn-provenance.ts` | `tests/turn-provenance.test.ts`「a stored v1 event and a re-captured v2 handle…」 |
| 降级替代抛错 | `src/business-context-service.ts` `remoteGetTurnProvenanceView`（`allSettled` + `classify`） | `tests/business-context-service.test.ts` |
| 403 带出 `required_action`（截断 256） | `src/platform-reader.ts` `truncateRequiredAction` | 同上 |
| L1 往 L0 挂平台事实（对齐不确定即不挂） | `src/provenance-view.ts:89-127` | `tests/provenance-view.test.ts` |
| 证据链（平台 receipt_id + `no-receipts` 区分） | `src/provenance-view.ts:135-162`、`src/types.ts:139-176` | 同上 |
| UI：时间链渲染、来源徽章、按面板降级文案 | `src/client/ProvenanceOverlay.tsx` | 无单测（见 T2c） |
| 无句柄轮次隐藏入口（方案 §9） | `TurnProvenanceActions.tsx:18` `if (handle === undefined) return null` | 已成立，无需改 |
| `provenanceLicenseDecision` 与 `openbkn/provenance-license-required` RemoteError | 已删除 | — |

**两条已核实的正确性结论，禁止"顺手修正"**：

1. `tool/call` 会话事件里的 `arguments` 是**原始 JSON 字符串**（DSH `packages/core/agent-loop/src/tool-calls.ts:264` `arguments: block.arguments`；`parseArguments` 只作用于 `exec.arguments`）。`turn-timeline.ts:44` 的 `typeof data.arguments === 'string'` 判定正确。
2. 平台 operations 的 `tool_name` 是**去前缀短名**（`docs/evidence/m5-e2e.md:32`：`query_object_instance`），与时间链节点 `tool` 口径一致，`attachPlatformFacts` 的对齐键成立。

## 2. 待办任务

### T1（最高优先，先做）把现状固化到分支

**问题**：11 个源文件 + 6 个测试文件的改动加 4 个 untracked 文件全部堆在 `main` 工作树；噪声治理另一路工作要动同样的 `scoped-business-context.ts` / `business-context-service.ts`（见 `2026-09-21-dsh-event-model-static.md` §6）。

**做法**：
1. `git switch -c feat/provenance-layered-timeline`（从当前 `main`，**不要** `reset`/`stash -u`）；
2. 分两次提交：① `feat: rebuild per-turn provenance as layered timeline + independent degradation`（`packages/` 下全部 src/tests，含 untracked 的 `src/turn-timeline.ts`、`tests/turn-timeline.test.ts`）；② `docs: record the layered-provenance plan and the V1/V2 verification`（`docs/plans/`、`docs/evidence/2026-09-20-provenance-v1-v2.md`、`2026-09-21-dsh-event-model-static.md`、`m5-e2e.md` 的注④）；
3. **不 push、不打 tag**（需用户另行授权）。

**验收**：`git status` 干净；`pnpm --filter @openbkn/dsh-business-context test` 仍 149/149。

### T2 代码债收尾（纯本地，无需平台）

**a. 删除 `provenance-view.ts` 的死代码**（**改动前就已无调用点**，非本批引入）：`projectBusinessOperation:237`、`projectConversationContext:259`、`projectContextRelation:266`、`projectDerivedFact:278`，以及只被它们使用的 `projectBusinessElement:247`、`stringArray:308`、`numberValue:312`、`provenanceStatus:313`、`elementKind:314`。当前 `projectBusiness` 只消费 `assembly.operation_business_edges`。
- 注意：`tsconfig.base.json` 只有 `strict: true`，**没有 `noUnusedLocals`**，所以构建不会报这类死代码——要么删，要么在本任务里加 `noUnusedLocals` 并修全仓（后者属扩大范围，默认不做）。
- 删除后若 `ProvenanceConversationContext` / `ProvenanceContextRelation` / `ProvenanceDerivedFact` 类型也无生产者，保留类型但在 `types.ts` 注明"预留给平台尚未披露的契约"，不要连带删公有 DTO（`ProvenanceBusinessView` 的形状是对外的）。

**b. 移除臆测的证据 DTO（已决策：删）**：`types.ts:155` `durability`、`:160` `detail`、`:168` `ProvenanceReceiptDetail` 三者**都没有生产者**，而 V2 结论明确「`ProvenanceReceiptDetail` 维持不定义，直到平台披露回执内容契约」（`2026-09-20-provenance-v1-v2.md:84`）。这正是方案 §8 列为风险的"证据链 DTO 又变成臆测"。
- 做法：删这三项；在 `ProvenanceReceiptRef` 上留一行注释说明"回执内容契约未披露前不定义 detail"。
- 连带检查 `src/client/ProvenanceOverlay.tsx` 的证据链渲染（`:188` 起）是否引用了 `detail`/`durability`，有则一并去掉。

**c. 折叠逻辑下沉到纯函数并补测**：方案 §5.1-6 要求折叠在重建层，现实现在 UI 组件里（`ProvenanceOverlay.tsx:108-129` `TimelineGroup`/`Timeline`），不可单测。
- 做法：在 `src/turn-timeline.ts` 导出 `foldTimeline(nodes): readonly TimelineGroup[]`（或 `buildTurnTimeline` 直接产出带 `repeat` 计数的节点），UI 只负责渲染；
- 单测：连续同名同 outcome 折叠为一行；**带 `platform` 的节点不参与折叠**（现有实现已按此，必须锁死）；不同 outcome 不折叠；折叠行的时间取第一节点。

**d. 公有 API 面收敛**：`src/index.ts:32` 新导出了 `LIFECYCLE_TOOLS` / `DISCOVERY_TOOLS` / `BUSINESS_RETRIEVAL_TOOLS`。若外部无消费方，改回内部 import（`turn-timeline.ts` 直接从 `scoped-business-context.js` 取，已如此）。`tests/bundle-contract.test.mjs` 与 `pnpm run package:check` 会校验导出面，改完必须复跑。

**验收**：`pnpm --filter @openbkn/dsh-business-context test`（含 typecheck）全绿并写明新计数；`pnpm run package:check` 通过。

### T3 `kind` 枚举与噪声治理的冲突（**不在本批内**，移交噪声治理批次）

> 本批 agent 跳过本节，不要改 `scoped-business-context.ts` 的分组常量与 `types.ts:121` 的联合类型。本节是给噪声治理 agent 的现成改动点清单。

现状与两份方案不一致：

| | 现状代码 | 噪声治理 v3 / 溯源方案 §10 |
| --- | --- | --- |
| 工具分组 | 三组：`LIFECYCLE` / `DISCOVERY` / `BUSINESS_RETRIEVAL`（`scoped-business-context.ts:23-45`） | 两组：`LIFECYCLE_TOOLS` / `MANAGED_IN_INTERACTION_TOOLS` |
| `DISCOVERY_TOOLS` 注释 | "不需要 open interaction"（`:28`） | v3 §9.1 明确要求 `search_schema` 在无 open interaction 时**被拒** |
| 时间链 `kind` | 5 值 `question\|lifecycle\|discovery\|retrieval\|answer`（`types.ts:121`） | 4 值 `question\|lifecycle\|managed\|answer` |

**迁移动作（在选定的分支上做，改动点已定位）**：
`scoped-business-context.ts:23-45`（两组常量 + 并集单测）→ `turn-timeline.ts:1`（import）、`:103-108`（`kindForTool`）、`:138`（`summarize` 的检索分支判定）→ `types.ts:121`（联合类型）→ `ProvenanceOverlay.tsx:267`（`kindLabel`）、`:276`（`kindChipStyle`）→ `tests/turn-timeline.test.ts`、`tests/scoped-business-context.test.ts`。
若展示上仍要区分"查 schema"与"查数据"，按**工具短名**在时间链内部细分（方案 §5.1-4 的原话），**不要重新引入第三组常量**。

### T4a 平台侧行为验收 · 第一阶段（本批做；需 kind 集群 + 打包 Runtime）

方案 §7.2 六格全部未做（`2026-09-20-provenance-v1-v2.md:92` 说明本机历史会话已无真实 MCP 调用事件，只能新跑）。本批跑下表**除"正常一轮业务问答"的节点数精确对照以外**的全部：降级四格必须逐格走到，正常轮作基线（节点数与调用数若对不上，如实记录差值与原因猜想，不在本批改代码）。

前置：`bash ../bkn-foundry/deploy/dev/mac.sh cluster status` 健康；`openbkn bkn list` 能看到 `supply_ontology_hand`；DSH web 起在打包 Runtime 上（预设 `standard`）。

| 场景 | 操作 | 期望 |
| --- | --- | --- |
| 正常一轮业务问答（基线） | 绑定样例 KN，问一个需要检索的问题 | 四段齐全；`platform` 引用挂上；记录时间链节点数与实际 MCP 调用数（**精确对照留给 T4b**，本批只记数） |
| 域未授权 | 插件配置 `businessDomain` 改为 `bd_nonexistent_xyz` | 时间链照常；其余三段 `domain-not-authorized` 且显示平台 `required_action` |
| Token 失效 | 使凭据过期 | 时间链照常；其余"需重新认证"，**不出现**企业版提示 |
| 平台不可达 | 停平台后打开旧会话溯源 | 时间链照常；其余 `platform-unavailable` |
| v1 老会话 | 打开升级前记录的一轮 | 正常打开，时间链由 `messageId → turn` 反查重建，不报错 |
| lifecycle 对齐 | 观察 start/finish 是否也生成平台 operation 条目 | 若数量与本地节点不等，该组**不挂** `platform`（安全方向，记录实际行为即可） |

**留证**：`docs/evidence/2026-09-22-timeline-e2e-stage1.md`（截图路径 + `openbkn trace interactions operations <id>` 输出 + 逐格结论表）。**不得**把 MCP 原始载荷、参数值、token 写入证据。

**未验证风险（老实写进证据）**：① lifecycle 工具是否产生 operations 条目未实测；② v1 老会话重建路径本机无样本，只能在平台侧造一轮再降级验证。

### T4b 第二阶段（**不在本批内**）

"非访问轮 0 个 interaction、访问轮恰好 1 个、时间链节点数 = 调用数 + 2"的精准对照依赖噪声治理落地，随那一批补跑，另起一份证据文件，不要回填进 T4a 的证据。

### T5 文档同步

| 文件 | 改什么 |
| --- | --- |
| `README.md:15`、`README.zh.md:15` | 版本前提（gap G9）已被 V1 证伪：observability 读路由**无 License 门**，社区部署即可用，真正条件是"令牌有效 + `businessDomain` 在部署允许清单内（chart 默认 `bd_public`）"；业务图在社区部署的**内容深度**可能较低（无 EE optimizer 富集，未实测）。删掉"社区版用户看到的是升级提示"。 |
| `CHANGELOG.md` | 新增 Unreleased 条目：分层溯源（L0 时间链 / 独立降级 / 证据链清单 / 句柄 v2），并点名**行为变更**：不再抛 `openbkn/provenance-license-required`，403 一律按域授权解释。不要改写已发布的 0.1.5-rc.1 条目。 |
| `packages/openbkn-business-context/README*.md:21` | "业务来源、执行溯源、上下文图和证据"→ 按四段实际形态与各自降级语义重写一句。 |
| `CLAUDE.md`（仓库根，Gotchas 末条） | 现文"Provenance error mapping: … only 403 + `permission_denied` … → `LICENSE_REQUIRED`, and a license hint is shown only when capabilities report `licensed: false`"**已被本批作废**：reader 仍产出 `LICENSE_REQUIRED` 码，但服务层恒映射为 `domain-not-authorized` 降级，不再查 capabilities、不再提示升级。按此改写，并点明 `license-required` 枚举保留作未来复用。 |

### T6 发布（**需用户显式授权，默认不做**）

版本 bump、`v*` / `openbkn-dsh-runtime-v*` tag、push、Release 一律先问。`v*` tag 要求 `package.json` 与 runtime manifest 的 `plugin` 块一致，否则工作流失败。

## 3. 既定决策（2026-09-22 用户已拍板，不要重新征求意见）

1. **顺序：本批只做溯源，`kind` 迁移不在本批内。** 两份方案原文写的"建议先做噪声治理"已被代码事实反转（溯源做完、噪声治理没动）。本批按 T1 → T2 → T4a → T5 推进并合入；T3 的枚举迁移整体移交噪声治理批次执行（那边本来就要重写两组常量），避免在 `scoped-business-context.ts` 上二次冲突。本文 T3 一节保留为**给噪声治理 agent 的改动点清单**，本批 agent 不要动它。
2. **T2b：删。** `ProvenanceReceiptDetail`、`detail`、`durability` 三项一并删除，`ProvenanceReceiptRef` 上留一行注释说明契约未披露前不定义。不保留待接。
3. **T4 分两阶段。** 本批先跑**不依赖噪声治理**的部分（T4a）：降级四格（域未授权 / Token 失效 / 平台不可达 / v1 老会话）+ 一轮正常业务问答作基线，含 lifecycle 对齐的实际观察。"时间链节点数 = 调用数 + 2"的精准对照（T4b）依赖"业务轮恰好一个 interaction"，随噪声治理批次补跑。两阶段各自留证，不要合并成一份。

## 4. 命令

```bash
cd /Users/kalias/Documents/project/app/openBKN/bkn-dsh
pnpm --filter @openbkn/dsh-business-context test      # 构建两面 + 单测（当前 149/149）
node --test compat/dsh-0.1.6-alpha.2/tests/*.test.mjs tests/*.test.mjs runtime/tests/*.test.mjs
pnpm run package:check                                 # 导出面/打包校验（T2d 必跑）
```
pnpm 必须是 11.7.0（`corepack pnpm@11.7.0`）；对非 CI 路径的 DSH 检出安装要加 `--no-frozen-lockfile`，**不要提交由此产生的 lockfile / workspace override 变更**。

## 5. 红线

不 `reset --hard` / `clean`；DSH 树只经 `compat/dsh-0.1.6-alpha.2/apply.mjs --revert` 变更，不手改；不读取或输出凭据；时间链 `summary` 只走白名单投影，禁止把工具参数值或响应体带进节点、日志或证据文档；不扩展 `openbkn-cli-subprocess.ts` 的命令白名单；推送 / tag / Release / 上游 PR 需用户另行授权。
