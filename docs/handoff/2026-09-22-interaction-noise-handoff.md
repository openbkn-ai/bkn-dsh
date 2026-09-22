# Handoff：交互噪声治理工作线全记录（供 QA 审核）

> 生成日期：2026-09-22。本文自包含，面向无本会话上下文的 QA agent。
> 工作线：消除绑定会话中的无效 Interaction 噪声（空 Interaction 堆积）。
> 状态：**代码、审核、提交、行为验收全部完成**；待推送；与另一条并行工作线（溯源）共存于同一工作树。

## 1. 目标与方案

- 问题：会话绑定知识网络后，任何问题（含寒暄）都触发 `bkn_start_interaction`/`bkn_finish_interaction`，平台 Trace 堆积空 Interaction。
- 方案：`docs/plans/2026-09-20-interaction-noise-reduction.md`（v3，已含三轮审核处置与 V0 判定回写）。核心规则：**Interaction 是任何模型发起 OpenBKN 访问的边界；不访问的轮次不建 Interaction**；`conversation_id` 由插件持有（会话事件持久化 + 每轮注入 + guard 兜底 + 严格失效语义）。
- 静态依据：`docs/evidence/2026-09-21-dsh-event-model-static.md`（DSH `0.1.6-alpha.2` 源码阅读，5 条实现约束 C1–C5）。

## 2. 里程碑时间线

| 阶段 | 产出 | 结论 |
| --- | --- | --- |
| V0 probe（09-21/22） | `packages/openbkn-business-context/tests/probes/dsh-event-model.probe.mjs`（V0-1..V0-4 运行时、V0-6 平台形状、V0-7 生产链路） | 全部 pass；V0-6 实测伪造 conversation → `resource_not_disclosed`，与 `invalid_params` 可机器区分 → 受控回退可实施。证据：`docs/evidence/dsh-event-model-probe.md` |
| 实现（09-21） | 新增 `src/interaction-lifecycle.ts`（纯状态机）+ 重写 `src/scoped-business-context.ts`（两组工具、guard 规则 2–5、同步 `tools/result` 监听、provider 形态 conversation 段）+ `src/managed-session-policy.ts` 分诊门控 | 单测全绿（详见 §4） |
| 审核修正（09-22，四轮） | 三份报告：`docs/reviews/2026-09-22-interaction-noise-implementation-review.md`、`-fix-review.md`、`-fix-review-round3.md` | 全部闭环（处置见 §3） |
| 提交分拆（09-22） | 噪声线 5 commits（见 §5），HEAD 纯净树自洽验证 | 溯源线改动留工作树未提交 |
| 基线测量（09-22） | `docs/evidence/2026-09-22-interaction-baseline.md` §1–§2 | 该 agent 名下 9 conversation 中 3 个零业务（33%）；空 Interaction 精确枚举不可得（口径限制记录在案） |
| 行为验收（09-22） | 同文档 §3 | §9.2 用例通过（见 §6） |

## 3. 审核处置链（P0→N2，全部已修复并有测试锁定）

1. **P0 错误码取值层级**：平台信封嵌套 `{"error":{"code":...}}`（bkn-foundry `session_guard.go` `lifecycleToolErrorWithDetails`），初版只读顶层致受控回退永不触发。修复：提取下沉为 `projectLifecycleOutcome`（`src/interaction-lifecycle.ts` 导出，**生产/单测/probe 共用同一实现**）；probe 新增 V0-7 把 V0-6 实测信封经真实 ToolRuntime 失败路径（`throw new Error(text)`，同 dsh-mcp-client 行为）送入构建产物 `lib/index.js` 的生产函数验证。
2. **P1a 失效不清内存 id**：失效 fold 现同时置标志并清 `conversationId`；`persistConversationChange` tombstone 判定联动（「id 从有到无 + invalidation」）。
3. **P1b 同轮 finish 后可再开**：`denialFor` 增 `startsThisTurn > 0` 门（也保护 `native-mcp-provenance` 的 `completed.size === 1`）。
4. **N1 矛盾拒绝回路**：规则 2 收进 `denialFor` 并按 `startsThisTurn` 分叉文案——本轮已完成时告知「用已有结果作答」，不再指示 start。
5. **P2-2 告警可观测**：`code=interaction-left-open, turn=%d, interactionId=%s`。
6. **P3-1 / N2**：`recordedAt` 如实解析；`lastConversationEvent` verbatim 返回末条事件（tombstone 与「从未有过」可区分，解锁失效诊断），`restoreFrom` 自过滤 active。
7. **P2/P2-1/写法**：双重断言改交集写法；失效/finish 分支键省略（exactOptionalPropertyTypes 安全）。

## 4. 静态验证状态（QA 可重跑）

```bash
cd bkn-dsh
pnpm --filter @openbkn/dsh-business-context test          # 插件：实测 192/192（纯净 HEAD 树为 176/176，差值为溯源线测试）
node --test compat/dsh-0.1.6-alpha.2/tests/*.test.mjs tests/*.test.mjs runtime/tests/*.test.mjs   # 仓库根：实测 49/49
pnpm --filter @openbkn/dsh-business-context typecheck      # 通过
pnpm run package:check                                     # 通过（probe 不进发布包）
cd packages/openbkn-business-context
node tests/probes/dsh-event-model.probe.mjs                # V0-1..V0-4，实测 4/4 pass
NODE_EXTRA_CA_CERTS=~/.dsh/openbkn-dev-ca.pem node tests/probes/dsh-event-model.probe.mjs --v0-6   # + V0-6/V0-7（需 openbkn CLI 已登录 + 自签平台）
```

注意：本地跑 pnpm 后检查 `pnpm-lock.yaml` 是否被改写为 `link:../deepseek-harness`，被改写则 `git checkout -- pnpm-lock.yaml`（CLAUDE.md 明令不提交该 diff）。

## 5. 提交清单（main，领先 origin 5 个，未推送——推送需用户授权）

| commit | 内容 |
| --- | --- |
| `e25702c` | feat(interaction)：实现 + 测试 + probe（`index.ts` 噪声导出块经 update-index 从混合文件拆出） |
| `f946869` | docs：方案 v3、V0 静态/运行时证据、CHANGELOG、中英 README 已知限制 |
| `13d147a` | docs：三轮审核报告 |
| `5c9b1ed` | docs：噪声基线测量 |
| `e339722` | docs：§9.2 验收结果回填 + V0-5 实测判定 |

溯源线改动（15 M + untracked：`business-context-service.ts`、`native-mcp-provenance.ts`、`turn-timeline.ts`、`ProvenanceOverlay.tsx`、`types.ts` 等）**留工作树**，属另一条工作线，不在本次审核范围。kind 收敛（`question/lifecycle/managed/answer`）发生在溯源线文件中，已随其测试更新。

## 6. 行为验收结果（09-22 实测，§9.2）

环境：本地 Runtime（`release/runtime`+`release/profile`，插件 `0.1.5-rc.1`）+ `dsh web` + DeepSeek-V41-Flash + 平台 EE 0.1.4（supply_ontology_hand）。同一会话 13 轮：

- 非访问轮 **0** Interaction（寒暄×2、绑定问询、通用知识、已有结论直答——共 5 轮）。**证据等级（QA 勘误后修正）**：主证据为本地行为观测（会话页面无任何 `mcp__openbkn__` 工具块 + 分诊/guard 结构保证「无 start 即拒业务调用」）；「conversation 总数不增」仅为侧证——lifecycle-only Interaction 在平台 Trace 不可见且 continue 模式不新增 conversation，平台侧无法反证。
- 访问轮**每轮恰好 1** Interaction——QA 全量翻页复核：126 条 trace 归属 10 个 interaction，一一对应、全部终态 completed。**轮次构成（QA 勘误后修正）**：统计时刻为 9 个，其后取消用例重问轮与 01:11 独立核对问各 +1（平台现存 10）；「13 轮 = 5 + 9」的加法不成立，实际含 5 非访问 + 8 常规访问 + 2 取消中断/重问 + 统计后核对轮；每个 Interaction 恰对应一次提问，核心性质不受影响。
- 零业务 conversation 占比 **33% → 0%**；
- Schema 类轮 guard 拒二次 start，模型照文案复用，无「拒→重试→再拒」回路；
- `/compact`（63 项）与页面重载后续接均 continue 同 conversation（**V0-5 实测成立**）；
- UI 取消（页面内 Esc）：DSH 继续执行完该轮并正常 finish（`int_3e3525b7…` 终态 `completed`），**未产生未闭合残留**（先前把执行中瞬时 `active` 误读为残留，已在证据中修正）；
- 检索答案（销售订单 40 张）与 M5 历史 MySQL 独立核对一致。

**未覆盖项（如实记录）**：会话失效受控回退无法在本部署触发（生命周期会话管理路由被业务域授权 403）；超时/401/5xx/参数错误不清除 id 需故障注入未执行；检索失败→finish(failed) 与 finish 自身失败未注入；turn-stopping 告警运行时输出未见（web 进程 logger 不落 stdout，内容由单测锁定）。

## 6a. QA 审核结论（2026-09-22）

**通过**——7 项入口全数核验（静态重跑计数一致、HEAD 纯净树独立 worktree 复验、commit 清单吻合、审核处置链逐条落地、平台 Trace 交叉核验、两处实现取舍与基线口径均接受）；2 条 P3 文档勘误（轮次加法口径、非访问轮证据等级）已按建议修正至本文件与 `docs/evidence/2026-09-22-interaction-baseline.md` §3.1。复核注意事项：`trace search` 默认 limit 50 会截断，全量统计必须翻页；平台能力缺口建议后续向 bkn-foundry 提出（lifecycle 事件入 Trace 或 interaction list-by-conversation 枚举）。

## 6b. QA 补测：第二知识网络与诱导/边界问法（2026-09-22）

应要求补测两项并**全部通过**：① **第二知识网络**（`worldcup_vega_catalog_bkn`，世界杯，非供应链）复验分诊；② **诱导性/边界性问法**（原验收未覆盖的问法类型）。同一会话 11 轮、唯一 conversation `conv_86e003f0…`：

- 非访问 6 轮全部 0 调用（寒暄、绑定问询、越位——足球域内通用知识、NBA 域外、已答事实复述、业务上下文中的天气诱导）；
- 访问 5 轮每轮恰 1 Interaction 且全部闭合：2 completed + 3 **failed**——被明确指示用工具查网外内容（天气/越位字段/2030 东道主）时，模型合规访问后如实报告无数据并以 `outcome=failed` 收尾，**以「查无结果」形态自然覆盖了 §6 未覆盖项中「检索失败→finish(failed)」**（工具报错注入仍属未覆盖）；
- 错误前提（「中国男足夺冠」）不编造：查证后纠正为「网内最好成绩 1999 女足亚军」并说明数据边界；通用知识附答时显式声明「非本网络数据」；
- 无拒绝回路、无零业务 conversation、无残留。

证据与环境增补备忘：`docs/evidence/2026-09-22-interaction-worldcup-supplement.md`（要点：UI 添加 workspace 走原生目录选择器不可自动化，可靠路径为改 workspace 存储文件+重启进程；页面 innerText 不含 `bkn_*` 工具名，工具调用判定必须以平台 trace 为准）。

## 6c. QA 补测（二）：故障注入与受控回退（2026-09-22）

原「未覆盖项」中三项已补 L4 实测（证据：`docs/evidence/2026-09-22-interaction-fault-injection.md`）：

- **会话失效受控回退**（事件伪造死 id 等价触发）：真实 `resource_not_disclosed` 信封 → tombstone 落盘（seq 251）→ 恰一次受控 new（`conv_f71fecf3`，双侧确认）→ 后续轮 continue 续接正常；模型在失效轮不重试、以已有上下文作答并声明来源。全链路通过。
- **invalid_params 不清 id**（模型级参数注入，`conversation_mode "renew"`）：真实嵌套信封、事件零新增、下一轮 continue 原 id 恢复。
- **finish 自身失败**（`outcome "bogus"`）：finish 失败 → interaction 保持 open → 模型以合法 outcome 重试 → 闭合 completed。

仍不可注入（如实记录）：401（MCP initialize 即验 token，换坏 token 会挂工具面而非产生运行中 401）、超时（`toolCallTimeoutMs` 编译于插件、本地平台响应快）、5xx、平台真实 close（lifecycle 路由要求内部信任 headers + 业务域授权，admin 不可调，设计使然——建议向 bkn-foundry 提测试钩子需求）。网络层代理注入被插件 CLI 平台 fence 与 mcpUrl origin fence 挡住——**两道 fence 的拦截行为本身构成插件安全设计的正面验证**。意外收获：代理实验产生两轮「工具面不可用」真实样本，模型三次失败即停、不编造、0 新 Interaction。

## 7. QA 审核建议入口

1. 重跑 §4 全部命令并核对计数。
2. 抽查 `e25702c` diff 与三份审核报告的处置一一对应（§3）。
3. 交叉核验验收证据：用 `openbkn trace search --from 2026-09-22T00:00:00Z --json` 复核 9 个 interaction 与唯一 conversation 的归属；`openbkn trace interactions get <id>` 抽查状态。
4. 复审两处实现取舍：conversation 段 provider 形态（`agent/pre-step` 晚于 `systemPrompt.assemble`，见 `scoped-business-context.ts` 注释）；`lastConversationEvent` verbatim vs `restoreFrom` 折叠语义（`interaction-lifecycle.ts` 注释）。
5. 基线口径限制（lifecycle-only Interaction 在 Trace 不可见）是否可接受，或需平台侧补枚举能力。

## 8. 验收环境重建备忘（如需复现）

- Runtime：`pnpm runtime:build -- --dsh <DSH 源码树> --output release/runtime`（先 compat apply/verify，pnpm 11.7.0）→ 插件 `pnpm pack` → `node scripts/prepare-compatible-runtime-profile.mjs --runtime release/runtime --plugin <tgz> --output release/profile`。
- 插件 config：`release/profile/home/profiles/web/cordis.patch.yml` 写 `baseUrl: https://192.168.50.28` + `allowInsecureTls: true`；自签平台另需进程级 `NODE_TLS_REJECT_UNAUTHORIZED=0`；模型经 `DEEPSEEK_API_KEY` 环境变量（不落文件）。
- workspace 绑定：`release/profile/home/storages/openbkn_workspace_bindings.json`（与服务同构格式：unit `openbkn_workspace_bindings` version 1，table `bindings`，key `<baseUrl>::<knId>`；读侧为插件自身 zod，格式错会显式失败）。
- 浏览器自动化注意：fill+Enter 偶发不提交（以 transcript turns 计数核实，勿信草稿）；宿主层 Esc 会取消 ZCode 工具调用，页面内中断须用 `evaluate` dispatch `KeyboardEvent`。
