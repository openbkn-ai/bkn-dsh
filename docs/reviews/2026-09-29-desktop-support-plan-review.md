# 审核复核：官方桌面版支持方案（2026-09-29）

> 对象：`../plans/2026-09-29-official-desktop-support.md`（下称"方案"）与 `../evidence/2026-09-29-desktop-direct-install.md`（下称"证据"）。
> 输入：用户转来的一份外部审核意见（7 条设计问题 + 若干文档与还原口径问题）。
> 方法：逐条回到源码和实物核实（DSH `dsh-v0.2.0-rc.2` @ `639ed01`、插件 `main` @ `5f8672a`、本次桌面会话备份日志、已安装桌面二进制），只读，没有修改代码、配置或原方案文档。
> 状态：**结论待用户确认**。确认前不改方案、不动代码。

## 1. 总判断

审核的核心结论成立：方案 A 方向可行，但改动清单现在不能直接交给实现者照做。7 条设计问题全部成立；另有 2 条（`NODE_OPTIONS`、凭证）需要改口径。

复核中还有三点审核没提到，其中第一点会改变方案 A 的形态：

1. **三类记录里有两类不需要单独存储**。答案溯源和 conversation 状态都可以直接从 DSH 自己的会话日志（工具调用和结果事件）现算出来，只有绑定必须单独存。这样一来，fork 截止点、合并规则、同键竞争这些问题大部分自然消失（§3.1）。
2. **V3→V4 的 `plugin:` 改名是现存 bug**，不是方案 A 才引入的：0.1.x Runtime 写下的会话，在 0.2.0-rc.2 上已经读不出绑定（§2 第 4 条）。
3. 多宿主写冲突可以借 **DSH 已有的会话级跨进程写锁**解决，不需要另加 domain 级独占锁（§3.2）。审核建议的"第二个实例拒绝写入"会让第二个宿主完全用不了插件，代价过大。

## 2. 逐条核实

| # | 审核意见 | 结论 | 依据 |
|---|---|---|---|
| 1 | 写盘失败仍报告成功，重启丢状态 | **成立** | 方案 §4.1 确实是"失败只告警、保留覆盖层"。补充：`bindNetwork` 是 async Remote（`business-context-service.ts:309`），`agent/created` 的处理函数签名允许返回 Promise（DSH `core/agent/src/runtime-types.ts:261`），两条绑定路径都能等持久化完成后再启用能力 |
| 2 | 父链"最新状态"≠ fork 截止点快照；`parentSession` 不代表继承了日志 | **成立** | `SessionStore.fork(source, boundary)` 按截止点复制前缀（`core/session/src/index.ts:1257`）；子代理 `childSessionMeta` 总是写 `parentSession`，`isSeeded` 可以是 false（`subagent/src/child-agent.ts:139-150`） |
| 3 | 多宿主覆盖范围是整个 domain | **成立**（限默认 `single` 布局） | `storage-json/src/single-unit.ts:140` `publish()` 每次整份序列化替换文件。补充：`per-record` 布局每条记录单独一个文件（`per-record-unit.ts:218/287`），但 key 只允许 `[a-zA-Z0-9_-]+`（`:39`），方案里 `${sessionId}::${messageId}` 的 key 不合法；而且 domain 打开时全量加载进内存，别的进程之后新写的记录，本进程读不到。所以换布局也不够，见 §3.2 |
| 4 | 漏了 `plugin:` 历史事件名 | **成立，且是现存 bug** | `session-format-v3-to-v4/src/extension-identities.ts:75-78`：V3 中未知且 `ignorable` 的事件，迁移时被改名为 `plugin:<type>`。插件三个读取函数只匹配 `openbkn/*`，所以 0.1.x Runtime 写下的会话到 0.2.0-rc.2 会丢绑定、conversation 和溯源。这与方案 A 无关，现在就存在 |
| 5 | §4.0 漏了错误状态解析 | **成立** | `turn-timeline.ts:114` `toolResultFailed` 逐个检查内容块的 `isError`；v4 把它放在 `message.isError`（本次日志 seq 23 实测：`message.isError: false`，内容块里没有这个字段） |
| 6 | 覆盖层无条件删除导致同键竞争 | **成立** | 逻辑推演正确。若采纳 §3.1，溯源和 conversation 不再写入，只剩绑定；绑定每个会话只写一次，这个竞争基本消失，但代次校验仍应保留 |
| 7 | 合并规则自相矛盾，墙钟时间不保证因果 | **成立** | 方案 §3"日志优先"和 §4.2"按 `recordedAt` 取较新"确实冲突。若采纳 §3.1，conversation 状态从日志顺序折叠得出，顺序就是日志 seq，不依赖墙钟 |

文档与还原口径：

| 审核意见 | 结论 | 说明 |
|---|---|---|
| 凭证还原存在审计缺口 | **成立** | `~/.dsh/.credentials.yaml` 修改时间是 2026-09-29 21:55:33，落在实验时间窗内，`refs` 下有 `OPENBKN_MCP_TOKEN`（只看了条目名，没读值）。能确定实验期间写过这个文件；没有实验前基线，判断不了条目是新增还是刷新。这是 DSH 规定的合规存储位置（项目 CLAUDE.md），是否删除由用户决定。证据文档「现场还原」要补这一条 |
| `NODE_OPTIONS` 可行性未证明 | **成立，但结论要更精确** | 独立复现：从终端以 `ELECTRON_RUN_AS_NODE=1` 调用时，`NODE_OPTIONS` 预加载被拒（`node_main.cc:153` "Node.js environment variables are disabled because this process is invoked by other apps"），命令行参数 `--require` 则会执行。这条拦截针对的是"被其他应用调起"；桌面版的 Host 由应用自己 spawn（`host-process.ts:189`），路径不同，所以既不能判可行也不能判不可行。方案 C 应拆成"改包路线：可行但排除"和"预加载路线：未验证"。反正方案 C 已被排除，不建议为此继续投入 |
| Dock 启动的 CA 指引提前下结论 | **成立** | 方案 §4.5 写成了正式步骤，§6 又列为待验证。改为先验证再写入 |
| "Remote 方法全部可用"超出记录 | **成立** | 实验没有记录 Remote 调用明细。从 UI 行为只能推断认证状态、网络列表、工作区关联和绑定、建议芯片这几类方法被调用过，不能代替逐项验证。方案 §2.2 要改措辞 |
| 最初的 handoff 没有标为完成 | **成立，且我上一轮汇报有误** | 我上一轮说"把最初的交接文档标注为已完成"，实际只标了 `desktop-probe-progress.md`。`2026-09-29-desktop-event-whitelist-handoff.md` 没有改过 |

审核里的"本次没有重新查询平台"：平台 operation 和 receipt 是我在实验当时用 `openbkn trace interactions operations` 查的，原始输出只在当时的会话里，没有落盘。证据文档可以补上当时的 4 个 operation id 和 receipt id（下方附录 A）。

## 3. 修订后的设计方向（替代方案 §3–§4.2，待确认）

### 3.1 只单独存绑定，溯源和 conversation 从日志现算

- **答案溯源**：`findCompletedNativeMcpProvenance(events, turn)` 本来就是会话日志的纯函数，输入是 DSH 第一方的 `tool/call`、`tool/result`、`assistant/message` 事件，这些事件会正常持久化和重载。持久化它只是缓存一个可以重新算出来的结果。改为读取时现算：在所属轮次里找 finish 结果，再找它之后的最终回答。
  - 离线验证：审核已确认，把旧外壳补回后，本次日志能关联到 seq 54 的回答。修好 §4.0 的解析后，现算即可工作。
- **conversation 状态**：`interaction-lifecycle.ts` 的状态机由 `tools/result` 驱动，而这些结果（包括失败时的错误码）都在日志的 `tool/result` 里。重载时按 seq 顺序重放 start/finish 的结果，就能得到 conversationId 和失效标记。因果顺序等于日志顺序，没有墙钟问题；fork 截止点天然成立，因为子会话日志只含截止点之前的前缀；fresh spawn 的子代理日志里没有父会话的工具结果，天然不继承。
  - **待验证**：失败的 `tool/result` 在日志里是否保留了 `projectLifecycleOutcome` 需要的错误码。本次日志里只有成功结果。先用 `docs/evidence/2026-09-22-interaction-fault-injection.md` 场景下的真实日志确认；如果错误码没有落进日志，conversation 失效标记仍需单独存储。
- **兼容旧数据**：日志里已有的 `openbkn/*` 和 `plugin:openbkn/*` 记录，读取时仍然识别，并与现算结果做一致性校验。溯源按 messageId 比对，不一致就报冲突，不静默取其中一个。
- **收益**：方案 A 的写入面从 3 类缩到 1 类。审核第 2、6、7 条大部分消失，第 1 条只剩绑定这一条路径。

### 3.2 绑定：按会话分文件，借 DSH 的会话写锁保证单写者

- DSH 对每个会话有跨进程写锁（`session-persistence-jsonl/src/lease.ts`：`session.lock` 上的 flock，进程崩溃时由内核释放）。同一个会话同一时间只会在一个宿主里活着并写入。
- 存储：插件自有目录 `$DSH_HOME/storages/openbkn-session-bindings/<sessionId>.json`，每个会话一个文件，原子写入。**读取时现读文件**，不依赖打开时的全量内存快照，这样能看到其他进程后来写入的内容。不用 storage-domain：它的 `single` 布局有整份覆盖问题，`per-record` 布局有内存陈旧问题，两种都不合适。
- 写入时机：`bindNetwork` 和 `agent/created` 自动绑定都**等原子写入成功后**再挂载能力。写失败就让 Remote 报错，或者自动绑定不生效（记日志并在 UI 可见），fail-closed。
- 记录内容：`{ binding, boundAtSeq }`，`boundAtSeq` 是写入时的 `session.seq`。
- fork：子会话首次创建时，若 `header.isSeeded === true && parentSession` 存在，且父记录的 `boundAtSeq < inheritedEventCount`，就把父绑定**复制**进子会话自己的文件（copy-on-fork），之后不再依赖父记录。`isSeeded` 为 false（fresh spawn）时不继承；是否让子代理继承绑定作为独立策略决定（见 §4 问题 2）。
- 孤儿清理：因为有 copy-on-fork，清理只需判断会话自身是否存在，不再依赖父子关系。
- 冲突：日志里已有绑定事件（旧会话）与文件记录不一致时，报 `BusinessNetworkBindingConflictError`，不静默选一个。

### 3.3 §4.0 解析修复（可以独立先做，范围扩大）
- `native-mcp-provenance.ts` `firstLifecycleRecord`、`turn-timeline.ts` `firstResultRecord`：兼容 v4 的 `{role:'tool', content:[{type:'text'}]}` 和旧的 `tool-result` 外壳。
- `turn-timeline.ts` `toolResultFailed`：同时认 `message.isError`（v4）和内容块上的 `isError`（旧）。
- 三个读取函数（`readBusinessNetworkBinding`、`readTurnProvenance`、`lastConversationEvent`）同时识别 `openbkn/*` 和 `plugin:openbkn/*`，schema 校验和冲突处理不变。这一项修的是 0.1.x 会话在 0.2.0-rc.2 上丢绑定的现存 bug，价值独立于方案 A。
- 测试：
  - v4 成功、v4 失败、旧格式失败，且失败结果不能形成完成态溯源；
  - 真实日志回归：用本次桌面会话 seq 3–56 脱敏截取；
  - **经过真实 V3→V4 转换的 fixture**：调用上游 `session-format-v3-to-v4` 转换函数生成，不手写 `plugin:` 名字。

### 3.4 仍然无法恢复的边界
已经写下、但没带 `ignorable` 的日志（比如本次实验的会话、G2 的会话），方案 A 修不好，stock 宿主仍会拒绝加载它们。要恢复只能离线改写日志，给这些事件补上 `ignorable: true`。这涉及改写 DSH 拥有的数据文件（zstd 压缩的 v4 jsonl），不纳入本方案，只在文档里列为已知限制。

## 4. 需要用户决定的问题

1. **是否采纳 §3.1**（溯源和 conversation 改为从日志现算，只单独存绑定）。建议采纳。前提是先完成"失败错误码是否落进日志"这一项验证。
2. **子代理（fresh spawn）是否继承父会话的绑定**。原事件方案下子代理不继承，因为它的日志里没有父会话的事件。建议保持不继承，让行为与现状一致。
3. **§3.3 是否先单独实施**。它不依赖方案 A 的任何决定，而且修复了两个现存 bug：0.2.0-rc.2 上溯源失效，以及旧会话迁移后读不出。建议先做。
4. **凭证条目**：`~/.dsh/.credentials.yaml` 里的 `OPENBKN_MCP_TOKEN` 保留还是移除。它在合规位置，建议保留，只在证据文档里记录审计事实。

## 5. 确认后要改的文档（先列出，暂不动）
- 方案：§1 表格中方案 C 拆成两行；§2.2 改"Remote 全部可用"的措辞；§3–§4.2 按本文 §3 重写；§4.0 按 §3.3 扩大范围；§4.5 把 Dock CA 改为待验证；§5 风险表删掉"单条粒度冲突面小"。
- 证据：「现场还原」补上凭证审计事实；补附录 A 的 operation 和 receipt id；"Remote 方法全部可用"改为实际覆盖到的方法清单。
- 最初的 handoff：顶部加历史阶段标注，并链接到方案和证据文档。

## 附录 A：实验当时的平台查询结果（约 21:57 由 `openbkn --json trace interactions operations int_ef93dd3f5e9863ffa44263d2a3dec1f9` 返回，本次复核没有重查）

| operation_id | receipt_id | status |
|---|---|---|
| op_0b41aa36b164f4210735316e51d6ae84 | rcpt_f728bad180e05b53db8cc25c18667b70 | completed |
| op_001d3134e8cd5b6d7363f22559ccdfd4 | rcpt_13ebbe30df7f5297005a8a2c0c967b08 | completed |
| op_b281e75b51496f0a93c9eec923c4439f | rcpt_c0d814e942f359bee4827d90fd66a265 | completed |
| op_82ac9e1d81d32716a33354551f00932d | rcpt_e2d818733bc689f1815844764bc9a2ad | completed |
