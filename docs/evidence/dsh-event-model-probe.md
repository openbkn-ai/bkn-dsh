# V0 probe：DSH 0.1.6-alpha.2 事件模型与平台失效码（运行时实测）

> 用途：`docs/plans/2026-09-20-interaction-noise-reduction.md`（v3）第 2 节 V0 的**运行时部分**，静态部分见 `docs/evidence/2026-09-21-dsh-event-model-static.md`。
> 性质：真实运行时实测（非源码推断）。probe 可重复执行，手动运行，不进 CI 与发布包（`package.json` 的 `files` 白名单只含 `lib/` 等，`tests/` 不发布）。
> 运行对象：npm 安装的插件 pinned 依赖 `@deepseek-ai/dsh-tools@0.1.6-alpha.2`（与源码树 `dsh-v0.1.6-alpha.2` 同版本；源码树带 compat 补丁，见第 4 节边界）。平台侧为本机 kind 集群 OpenBKN EE 0.1.4（自签 TLS，probe 以 `OPENBKN_PROBE_INSECURE_TLS=1` 显式放行）。
> 日期：2026-09-21。观测只含计数、布尔、错误码与工具短名，无参数值、响应体、业务数据或凭据。

## 1. 命令与版本

```bash
cd packages/openbkn-business-context
node tests/probes/dsh-event-model.probe.mjs            # V0-1..V0-4（本地真实运行时）
OPENBKN_PROBE_INSECURE_TLS=1 node tests/probes/dsh-event-model.probe.mjs --v0-6   # + V0-6（平台侧）
```

DSH 运行时版本：`@deepseek-ai/dsh-tools@0.1.6-alpha.2 (npm)`。插件版本：`@openbkn/dsh-business-context@0.1.5-rc.1`（开发工作树）。

## 2. 证据记录

```json
{"check":"V0-1 agent-scoped tools/result only receives its own Agent","dshVersion":"@deepseek-ai/dsh-tools@0.1.6-alpha.2 (npm)","command":"node tests/probes/dsh-event-model.probe.mjs","observation":{"scopedCallsReceived":{"a":2,"b":2},"foreignEventsSeen":false,"untaggedListenerSeesAllAgents":true},"verdict":"pass"}
{"check":"V0-2 model-path guard coverage: exec.agent present; agentless execution bypasses scoped guard","dshVersion":"@deepseek-ai/dsh-tools@0.1.6-alpha.2 (npm)","command":"node tests/probes/dsh-event-model.probe.mjs","observation":{"guardInvocationsForAgentCall":1,"guardAgentMissingCount":0,"guardInvocationsAfterAgentlessCall":1},"verdict":"pass"}
{"check":"V0-3 synchronous tools/result listener updates state before the next guard judgment","dshVersion":"@deepseek-ai/dsh-tools@0.1.6-alpha.2 (npm)","command":"node tests/probes/dsh-event-model.probe.mjs","observation":{"startResultIsError":false,"managedCallGuardDenied":false,"managedCallIsError":false},"verdict":"pass"}
{"check":"V0-4 cancellation/throw paths still emit tools/result","dshVersion":"@deepseek-ai/dsh-tools@0.1.6-alpha.2 (npm)","command":"node tests/probes/dsh-event-model.probe.mjs","observation":{"throwPathResultEmitted":true,"abortBeforeDispatchResultEmitted":true,"abortBeforeDispatchCode":"ABORTED_BEFORE_DISPATCH","abortDuringBodyResultEmitted":true,"abortDuringBodyCode":[null]},"verdict":"pass"}
{"check":"V0-6 platform conversation-invalidation error shapes (no successful interaction started)","dshVersion":"@deepseek-ai/dsh-tools@0.1.6-alpha.2 (npm)","command":"OPENBKN_PROBE_INSECURE_TLS=1 node tests/probes/dsh-event-model.probe.mjs --v0-6","observation":{"shapes":{"forgedConversationContinue":{"toolIsError":true,"codeTokens":["resource_not_disclosed"]},"invalidParameter":{"toolIsError":true,"codeTokens":["invalid_params"]},"unauthenticated":{"transportError":"SdkHttpError"},"timeout":{"transportError":"Error"}},"machineDistinguishableFromParameterError":true},"verdict":"pass"}
{"check":"V0-7 production-chain extraction of the platform envelope through a DSH ToolExecutionResult","dshVersion":"@deepseek-ai/dsh-tools@0.1.6-alpha.2 (npm)","command":"OPENBKN_PROBE_INSECURE_TLS=1 node tests/probes/dsh-event-model.probe.mjs --v0-6","observation":{"toolResultIsError":true,"extractedErrorCode":"resource_not_disclosed","classification":"conversation-invalid"},"verdict":"pass"}
```

### 2026-09-22 补充：生产链路复核（审核修正后）

实现评审（`docs/reviews/2026-09-22-interaction-noise-implementation-review.md`）指出初版取值只读信封顶层，而平台真实信封嵌套（`bkn-foundry` agent-retrieval `session_guard.go` 的 `lifecycleToolErrorWithDetails` 构造 `{"error":{"code":...}}`，`code` 在 `error` 之下）。已修复，并以 **V0-7** 闭合验证链：

- V0-6 直连 MCP 只验证了平台侧形状；V0-7 把该次实测信封原文送入**真实 ToolRuntime** 的工具失败路径（`throw new Error(text)`，与 dsh-mcp-client 对 isError 结果的行为一致），再由插件**构建产物** `lib/index.js` 导出的生产函数 `projectLifecycleOutcome`/`classifyFailure` 提取，断言得到 `resource_not_disclosed` → `conversation-invalid`。
- 提取函数已移入纯模块 `src/interaction-lifecycle.ts` 并导出——probe、单测与插件监听器共用同一份实现，不再存在「验证的与生产跑的不是同一逻辑」。
- 单测夹具同步改为平台真实嵌套信封（`{"error":{"code":...}}`），并保留顶层旧形状的兼容读取。

## 3. 结论

| # | 待验证 | 运行时结论 | 判定 |
| --- | --- | --- | --- |
| V0-1 | agent-scoped `tools/result` 只收到本 Agent 的调用 | 两个 Agent 交叉各调 2 次：各自监听器恰好收到 2 条、无外来事件；服务级无标签监听器收到全部 4 条（C1 的两种注册形态都实测成立） | **成立** |
| V0-2 | 模型发起的调用 `exec.agent` 一定存在 | 带 agent 的执行 guard 恰好触发 1 次、`exec.agent === undefined` 计 0 次；随后一次无 agent 的执行后 guard 总数不变（scoped guard 整体旁路，C3 实测确认） | **成立（限带 agent 的执行）** |
| V0-3 | start 的成功结果先于下一次 guard 判定到达 | 同步监听器置位后，紧接的受管工具调用未被误拒（C2 成立） | **成立（监听器同步时）** |
| V0-4 | 取消 / 超时 / 抛错时结果事件仍到达 | 抛错、派发前取消、body 内取消三条路径都发出 `tools/result`；派发前取消的 `error.info.code === 'ABORTED_BEFORE_DISPATCH'`，**body 内取消的 info.code 为空**（识别「用户取消」只能依赖派发前取消码，派发后取消需按错误文本/状态另行处理） | **成立** |
| V0-5 | 会话恢复后不残留 open 状态 | probe 未单独模拟；由实现结构保证（`open` 仅存内存且每轮重置，`conversationId` 从会话事件回放）+ `interaction-lifecycle` 单测（`restoreFrom`/`onTurnStart`）+ 9.2 行为验收「重载会话后问业务问题」覆盖 | **结构性覆盖** |
| V0-6 | 平台「conversation 失效」错误码可机器判定 | 伪造 `conversation_id` + `continue` → 工具结果 `isError: true`，错误码 `resource_not_disclosed`；对照：参数错误 `invalid_params`、未认证与超时均为传输层错误（无工具级错误码）。**形状可机器区分** | **成立** |

### V0-6 的平台源码佐证（bkn-foundry，EE 0.1.4）

- `adp/context-loader/agent-retrieval/server/driveradapters/lifecycle_middleware.go:359-364`：HTTP 状态映射将 `conversation_not_found`、`resource_not_disclosed`、`capability_not_licensed` 同归 404（ee-design §4.5 的遮蔽语义：不存在/未授权/未 licensed 故意不可区分），`conversation_owner_mismatch`、`permission_denied` 归 403。
- `bkn_start_interaction` 的 continue 请求为 `POST /conversations/{id}/interactions`（`lifecycle_adapter.go:450-452`）；本版后端对不存在的 conversation 实际返回 `resource_not_disclosed`（`conversation_not_found` 仅存在于状态映射表，未见发射点）。
- 对插件的意义：`resource_not_disclosed` 表示「该 conversation_id 对当前身份不可继续」（含不存在与遮蔽两种根因）；`conversation_owner_mismatch`（403 族）表示旧 id 不属于当前身份，同样不可继续。两者均可作为受控失效判据；`invalid_params`、传输层错误（超时/401/5xx）不触发失效——与 v3 方案 5.3 的收紧语义一致。

## 4. 对实现的直接输入

1. **受控失效回退可以实施**：`classifyFailure` 识别错误码 `resource_not_disclosed` 与 `conversation_owner_mismatch` 为 `'conversation-invalid'`，其余（含 `invalid_params`、无法解析的文本、无 info 的失败）一律 `'other'`，不清除 `conversation_id`。
2. **取消识别**：仅派发前取消有稳定 `ABORTED_BEFORE_DISPATCH` 码；`turn-stopping` 告警不依赖该码区分来源，只记录状态。
3. probe 依赖 pnpm 的传递安装路径解析 `@deepseek-ai/dsh-scope` 与 `@modelcontextprotocol/client`，重跑需在插件包目录内执行（见第 1 节命令）。

## 5. 边界与重跑要求

- 运行时对象是 npm 发布的 `0.1.6-alpha.2`（插件 pinned 依赖）；静态证据读的是带 compat 补丁的源码树。两者同版本，但 **DSH 升级时必须重跑 probe 并复核两份证据文档**（v3 方案第 2 节第 5 条）。
- V0-6 平台侧绑定 OpenBKN EE 0.1.4 的错误码族；平台升级可能改变码值，重跑 `--v0-6` 分支即可复核。
- probe 不创建任何成功的 Interaction（不调用 `new` 成功路径），平台侧无残留。
