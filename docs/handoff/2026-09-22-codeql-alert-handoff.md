# 交接：PR #31 的 CodeQL 告警处置（2026-09-22）

> 自包含文档，面向接手人；无需原会话上下文。

> **决策（2026-09-22，最终）**：告警二（探针 TLS）已**根治**——采纳同事给出的简化方案（优于本文路径 a 的 re-exec）：删除 `NODE_TLS_REJECT_UNAUTHORIZED` 开关行，调用时在命令前带 `NODE_EXTRA_CA_CERTS=<平台 CA pem>`（该变量本就于命令行设置、Node 启动时读取，无需子进程）。落地 commit `b5ece5f`（本分支改写英文提交信息后的同内容提交；改写前的 `f48ca83` 位于 #31 的旧分支，不在本 PR）（探针 + 两份文档命令同步，历史 JSON 证据保留加注记）；实测 V0-1..V0-7 全 pass 无 TLS 错误；**CodeQL 转绿**，PR ref 无 open 告警（#11/#12 维持 dismissed），`OPENBKN_PROBE_INSECURE_TLS` 废弃。告警一的 ReDoS 修复已包含在 PR 内；main 存量 6 处 ReDoS（告警 #1–#6）仍建议日后单独小 PR 统一修复。本文转为决策记录存档。

## 背景与范围

- **PR**：https://github.com/openbkn-ai/bkn-dsh/pull/31 「feat(interaction): Interaction 成为 OpenBKN 访问边界，消除绑定会话空 Interaction 噪声」
- **分支**：`feat/interaction-noise-reduction`（直连 origin，无 fork），当前 HEAD `a87dfa8`。噪声线本体 7 个提交（`e25702c..9903ccc`）已过目标审计 + QA，测试 176/176 + 仓库根 49/49 + typecheck + package:check + probe V0-1..4 全绿。
- **问题**：CI 仅剩 **CodeQL 一个红叉**，含两个独立告警，其一已解决、其二即本交接主题。

## 告警一（已解决）：ReDoS

- 规则 `js/polynomial-redos`（高危），命中 `scoped-business-context.ts` 的 `normalizeBaseUrl`（`value.trim().replace(/\/+$/, '')`）。
- **定性**：main 存量债务的再归因——同一模式在 origin/main 共 **7 处**（`auth.ts:133`、`business-context-service.ts:474`、`openbkn-cli-subprocess.ts:86`、`platform-reader.ts:234`、`session-binding.ts:92`、`workspace-binding-registry.ts:97`、`scoped-business-context.ts`），本 PR 只是把函数移行，CodeQL 按「PR 改动行」重新归因。
- **处置**：PR 内 commit `9889c66` 将该文件实现改为等价线性循环（剥全部尾斜杠，行为不变），176/176 + typecheck 复验通过。**其余 6 处存量（告警 #1–#6，常开）待单独小 PR 统一修复**——不在 #31 范围。

## 告警二（未解决，本交接核心）：探针禁用证书校验

- 规则 `js/disabling-certificate-validation`（高危），命中 `packages/openbkn-business-context/tests/probes/dsh-event-model.probe.mjs` 的 `checkV0_6`（约 263 行）：

  ```js
  if (process.env.OPENBKN_PROBE_INSECURE_TLS === '1') process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  ```

- **定性**：测试探针专用、显式环境变量门控、面向本机自签 TLS 的开发平台（`https://192.168.50.28`，kind 集群 EE 0.1.4）；生产代码路径不涉及。属「有意为之的测试配置」而非漏洞。
- **已尝试且证明无效的手段**（不要重复）：
  1. 内联抑制注解 `// codeql[js/disabling-certificate-validation]`——前置行（`af303d6`，后被 amend）与**行尾同行**（`c13f968`）两种形式均被忽略；规则 ID 已经 alerts API 核实无误。结论：**本仓库的 CodeQL 配置不采纳内联抑制**。
  2. 告警驳回（dismiss，`used in tests`，驳回理由已留痕 Security 页）——**每次 push 触发新分析会生成新告警号**（#11 已驳回 → 空提交 `a87dfa8` 触发重扫后 #12 又开），驳回不跨分析持久。
  3. 重跑分析：CodeQL 的 workflow run **不允许 rerun**，只能靠新提交触发。
- **关键事实**：main 分支**无分支保护**，此红叉**不阻塞合并**；Analyze 两个 job 及其余检查全绿。

## 两条解决路径（二选一）

**路径 a（推荐，约半小时，根治）**：

探针 `checkV0_6` 改为「**父进程 re-exec 子进程 + `NODE_EXTRA_CA_CERTS` 注入平台 CA**」：检测到 `OPENBKN_PROBE_CA=<pem 路径>`（本机为 `~/.dsh/openbkn-dev-ca.pem`）且非子进程标记时：

```js
spawnSync(process.execPath, [__filename, ...argv], {
  env: { ...process.env, NODE_EXTRA_CA_CERTS: caPath, OPENBKN_PROBE_CHILD: '1' },
})
```

透传子进程退出码——这是 Node 官方安全信任机制，扫描器不报警；**废弃 `OPENBKN_PROBE_INSECURE_TLS` 接口**。注意：

- `NODE_EXTRA_CA_CERTS` 只在进程启动时读取，运行中改 `process.env` 无效，故必须 re-exec；
- 需同步更新文档中该环境变量的调用说明（`docs/handoff/2026-09-22-interaction-noise-pr-handoff.md` §7、两份 interaction 证据文档）；
- 改后连平台重跑一次 V0-6 验证（需 `openbkn auth token` 可用 + 平台在线）。

**路径 b（零工作量，务实）**：带红叉合并（不阻塞）；在 PR 留言说明定性 + Security 页驳回记录；接受「今后任何触碰该探针文件的 PR 都会重新挂红叉」。

## 环境与坑位备忘

- 平台：`https://192.168.50.28`（kind-bkn-dev，EE 0.1.4），CA 在 `~/.dsh/openbkn-dev-ca.pem`，`openbkn auth token` 可用；
- **pre-push 钩子坑**：在无 node_modules 的临时 worktree 里 push 会被钩子挡掉——提交可在 worktree 做，**push 回主树执行**；
- **lockfile 红线**：本地 `pnpm install/add` 会把 `pnpm-lock.yaml` 顶段 overrides 改写为本地形态，提交前必须 `git checkout -- pnpm-lock.yaml`（#25 曾因此炸掉 CI）；
- 工作树另有**溯源线 20 个未提交文件**（provenance v1-v2，独立 PR 线），与 #31 无关，勿混入。

## 流程硬规则

1. commit/PR 一律中文；**PR 提交前先把总结给用户确认**；
2. 关 issue 必须用英文 closing keyword（`Closes #N`）；
3. 直连 `origin = openbkn-ai/bkn-dsh`（kalias 有 ADMIN/push），无 fork。

## 相关标识

| 项 | 值 |
| --- | --- |
| PR / 分支 | #31 / `feat/interaction-noise-reduction` @ `a87dfa8` |
| 关键 commit | `9889c66`（ReDoS 修复）、`c13f968`（注解尝试）、`a87dfa8`（触发重扫的空提交，信息含驳回说明） |
| 告警 | #11 已驳回、#12 开（PR ref）；#1–#6 main 存量 ReDoS |
| 最新红叉 check run | 106622138101（annotation 指向 probe 263 行） |
