# PR 准备交接:交互噪声治理线(2026-09-22,供 PR agent 使用)

> 本文自包含,面向无本会话上下文的 PR agent。任务:为「交互噪声治理」工作线准备 PR。
> QA 状态:**审核通过**(7 项入口全数核验,两条 P3 文档勘误已落地)+ 两轮补测通过。代码与文档均在本地 main,领先 origin 6 个 commit,**未推送**。

## 1. 仓库与提交范围

- 仓库:`github.com/openbkn-ai/bkn-dsh`(origin 直连,无 fork)
- 分支:本地 `main`,领先 `origin/main` **6 个 commit**(建议整线一个 PR):

| commit | 内容 |
| --- | --- |
| `e25702c` | **feat(interaction)**:Interaction 成为 OpenBKN 访问边界,conversation_id 由插件持有(实现 + 测试 + probe,8 文件 +1413/-62) |
| `f946869` | docs:方案 v3、V0 静态/运行时证据、CHANGELOG、中英 README 已知限制 |
| `13d147a` | docs:三轮审核报告(implementation-review / fix-review / fix-review-round3) |
| `5c9b1ed` | docs:噪声基线测量(改动前行为,33% 零业务 conversation) |
| `e339722` | docs:§9.2 行为验收通过——回填结果与 V0-5 实测判定 |
| `1d5ecd6` | docs:QA 审核通过;落地两条 P3 勘误并入库 handoff 报告 |

## 2. 待入库的未提交产物(建议第 7 个 commit,PR 前先行提交)

QA 在 `1d5ecd6` 之后又完成了两轮补测,产物未提交,全部是 docs:

| 文件 | 状态 | 内容 |
| --- | --- | --- |
| `docs/evidence/2026-09-22-interaction-worldcup-supplement.md` | untracked | 补测(一):worldcup 第二 KN 分诊复验 + 5 条诱导/边界问法(11 轮,0 编造 0 噪声) |
| `docs/evidence/2026-09-22-interaction-fault-injection.md` | untracked | 补测(二):受控回退全链路 + invalid_params 不清 id + finish 失败可重试;不可注入项根因 |
| `docs/handoff/2026-09-22-interaction-noise-handoff.md` | M(在库版 + §6b/§6c 增量) | handoff 报告新增两节补测结论 |

建议 commit message(中文,docs 前缀):
`docs(interaction): QA 补测——第二知识网络与诱导问法、故障注入与受控回退全链路`

## 3. 严禁混入的排除范围(溯源线,另一条工作线,单独 PR)

以下文件是**并行溯源工作线**的工作树改动,不属于本 PR,**不得** `git add`(按文件精确添加,不要用 `git add -A`):

```
 M docs/evidence/m5-e2e.md
 M packages/openbkn-business-context/src/business-context-service.ts
 M packages/openbkn-business-context/src/client/ProvenanceOverlay.tsx
 M packages/openbkn-business-context/src/index.ts            ← 溯源线增量;噪声线的 index.ts 导出块已在 e25702c 内
 M packages/openbkn-business-context/src/native-mcp-provenance.ts
 M packages/openbkn-business-context/src/platform-reader.ts
 M packages/openbkn-business-context/src/provenance-handle.ts
 M packages/openbkn-business-context/src/provenance-view.ts
 M packages/openbkn-business-context/src/turn-provenance.ts
 M packages/openbkn-business-context/src/types.ts
 M packages/openbkn-business-context/tests/business-context-service.test.ts
 M packages/openbkn-business-context/tests/native-mcp-provenance.test.ts
 M packages/openbkn-business-context/tests/provenance-handle.test.ts
 M packages/openbkn-business-context/tests/provenance-view.test.ts
 M packages/openbkn-business-context/tests/turn-provenance.test.ts
?? docs/evidence/2026-09-20-provenance-v1-v2.md
?? docs/plans/2026-09-20-provenance-layered-redesign.md
?? docs/plans/2026-09-21-provenance-timeline-handoff.md
?? packages/openbkn-business-context/src/turn-timeline.ts
?? packages/openbkn-business-context/tests/turn-timeline.test.ts
```

其他红线:`pnpm-lock.yaml` / `pnpm-workspace.yaml` 的本地改写不得提交(CLAUDE.md 明令,提交前 `git checkout --` 还原)。

## 4. PR 描述素材(可直接改写为 body)

**标题建议**:`feat(interaction): Interaction 成为 OpenBKN 访问边界,消除绑定会话空 Interaction 噪声`

**动机**:会话绑定知识网络后,任何问题(含寒暄)都触发 start/finish 生命周期对,平台 Trace 堆积空 Interaction——基线实测该 agent 名下 **33% 的 conversation 零业务调用**。

**方案要点**(详版在 `docs/plans/2026-09-20-interaction-noise-reduction.md` v3):
- Interaction 是任何模型发起 OpenBKN 访问的边界;不访问的轮次不建 Interaction;
- conversation_id 由插件持有:会话事件持久化 + 每轮注入(provider 形态)+ guard 兜底 + 严格失效语义(仅平台失效码清 id,写 tombstone,每轮恰一次受控 `new`);
- 同步 `tools/result` 监听 + `denialFor` 规则 2–5 集中判定,防「拒→重试→再拒」回路;
- 错误码提取 `projectLifecycleOutcome` 为生产/单测/probe 共用单一实现(平台嵌套信封 `{"error":{"code":...}}`,经 V0-7 构建产物链路验证)。

**测试证据**(全部本地实测,QA 独立复核):
- 静态:插件 192/192(HEAD 纯净树 176/176)、仓库根 49/49、typecheck、package:check、probe V0-1..V0-4 4/4、含平台 V0-6/V0-7 6/6;
- 行为(§9.2,DeepSeek-V41-Flash + 平台 EE 0.1.4,supply KN):非访问轮 0 Interaction、访问轮恰 1、零业务 conversation **33%→0%**、压缩/重载续接(V0-5 实测)、UI 取消无残留;
- QA 补测(一)(worldcup 第二 KN + 诱导问法,11 轮):非访问 6 轮全 0 调用;诱导问法 5/5 落在「0 调用」或「恰 1 合规访问」,0 编造 0 残留;
- QA 补测(二)(故障注入):受控回退全链路(真实 `resource_not_disclosed` → tombstone → 恰一次受控 new → 续接)、invalid_params 不清 id、finish 失败保持 open 可重试。

**已知限制**(README 双语与 CHANGELOG 已写入,PR body 可引用):
- 轮结束时未闭合的 Interaction 保持 open 平台侧(告警 `code=interaction-left-open, turn=N, interactionId=...` 可观测);
- 分诊(无关问题不调用工具)是提示词对模型的引导,非机制禁止;误判兜底为「包成恰 1 个合规 Interaction」;
- 401/超时/5xx 的端到端注入在本部署无干净路径(分类与提取由 V0-6 真实形状 + 单测 + V0-7 生产链覆盖)。

**评审指引**:`docs/reviews/` 三份审核报告 + `docs/handoff/2026-09-22-interaction-noise-handoff.md` §3 处置链(P0→N2 全闭环)与 §6a QA 审核结论。

## 5. QA 可信度摘要(handoff §6a/§6b/§6c)

- 审核 7 项入口全数核验:静态重跑计数一致(含 HEAD 纯净树独立 worktree 复验)、commit 清单吻合、审核处置链 7/7 代码+测试落地、平台 Trace 交叉核验、两处实现取舍与基线口径接受;
- 两条 P3 文档勘误(轮次构成口径、非访问轮证据等级)已落地在库;
- 复核提示:`openbkn trace search` 默认 limit 50 会截断,全量统计须翻页。

## 6. 流程硬规则(不可省略)

1. commit/PR **一律中文**;
2. **PR 提交前必须先把 PR 标题+正文总结给用户确认**,不得直接 push/开 PR(推送、打 tag、Release 均需用户另行授权);
3. 若 PR 需关闭 issue,**必须用英文 closing keyword**(`Closes #N` / `Fixes #N` / `Resolves #N`),中文「关闭 #N」不生效;本线暂无已知关联 issue,若用户补充则按此格式;
4. 溯源线文件按 §3 排除;lockfile 改写不提交;
5. 基于本地 main 直推 origin(无 fork 工作流)。

## 7. 供评审者复跑的验证命令

```bash
cd bkn-dsh
pnpm --filter @openbkn/dsh-business-context test          # 预期 192/192(纯净 HEAD 树 176/176)
node --test compat/dsh-0.1.6-alpha.2/tests/*.test.mjs tests/*.test.mjs runtime/tests/*.test.mjs   # 49/49
pnpm --filter @openbkn/dsh-business-context typecheck && pnpm run package:check
cd packages/openbkn-business-context && node tests/probes/dsh-event-model.probe.mjs        # V0-1..4: 4/4
OPENBKN_PROBE_INSECURE_TLS=1 node tests/probes/dsh-event-model.probe.mjs --v0-6            # +V0-6/V0-7(需平台+CLI 登录)
```

注意:本地跑 pnpm 后检查 `pnpm-lock.yaml` 是否被改写,被改写则 `git checkout -- pnpm-lock.yaml`。

## 8. 行为复验环境(仅当评审要求实跑)

本机 kind 集群 OpenBKN EE 0.1.4(https://192.168.50.28)+ 本地构建 Runtime(`release/runtime` + `release/profile/home`,插件 0.1.5-rc.1)在运行;dsh web(3083 端口)可能仍在跑,token 见其 stdout 日志(`/tmp/dsh-web-qa3083.log`)。完整重建步骤见 handoff §8 与两份补测证据文档的环境备忘;QA 注入用会话 `session-0165d688`(含死 id→受控 new 的完整事件链)保留可查。
