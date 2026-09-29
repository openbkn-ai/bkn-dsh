# 官方 DSH 桌面版支持：分析与方案 A（插件自有存储）改动清单

> **状态（2026-09-30）**：方案 A 已按审核复核后的修订版实施完成，并在官方桌面版上复测通过（`../evidence/2026-09-29-desktop-direct-install.md`「第二轮」）；代码在分支 `feat/desktop-support-min-loop`，**未提交**。实际实现与本文 §3、§4.1–§4.3 有两处不同，以 `../reviews/2026-09-29-desktop-support-plan-review.md` §3 为准：
> 1. 只有绑定单独存储，而且没有用 storage-domain，改为每个会话一个文件 `$DSH_HOME/openbkn/session-bindings/<sessionId>.json`；溯源和 conversation 状态都从会话日志现算。
> 2. §4.0 的修复范围扩大为：内容解析、错误状态解析，以及 `plugin:` 历史事件名识别。
> 下文 §3–§4.3 保留原稿，只作设计过程记录。

> 日期：2026-09-29。类型：分析结论 + 可执行改动清单（尚未实施）。
> 前置：`../handoff/2026-09-29-desktop-event-whitelist-handoff.md`（问题机制）、`../evidence/m6-stock-dsh-install.md`（G2 实验）、`../evidence/2026-09-29-desktop-direct-install.md`（本次桌面直装实测）。
> 核对基线：bkn-dsh `main` @ `5f8672a`；DSH `dsh-v0.2.0-rc.2` @ `639ed01`（上游远端 HEAD 同此提交）；本机桌面版 0.2.0-rc.2。

## 1. 结论

官方桌面版 0.2.0-rc.2 目前不能直接支持 bkn-dsh。实测结果：插件能装、能加载、能认证、能绑定，问答和工具调用都成功；但会话一旦写入插件事件，重启后就无法重载。

宿主和插件都不改是走不通的。可选路径：

| 路径 | 能否让桌面版支持 | 代价与风险 | 建议 |
|---|---|---|---|
| **A. 插件改用自有存储**（不再写会话事件） | 能，不用改宿主 | 推翻"不建旁路存储"的设计；要自己处理 fork 继承、孤儿记录、多进程写入 | **推荐**，唯一不依赖上游的路径 |
| B. 上游合入 `Session.append` 写入侧 | 能，随官方版本发布 | GitHub 上游是只读镜像，issues 已关闭，PR 不可提；时间不可控；上游提出的会话层重构（§2.6）可能让补丁形态失效 | 并行争取，不作为交付依赖 |
| C1. 改桌面安装包 | 技术上可行（完整性校验不在运行时执行，asar 完整性 fuse 关闭） | 破坏签名和公证、会被自动更新覆盖 | 不采用 |
| C2. 通过 `NODE_OPTIONS` 预加载 | **未验证**：从终端调用时会被 Electron 拦截（"invoked by other apps"）；桌面 Host 由应用自己 spawn，路径不同，没有实测 | 污染全局环境，不可支持 | 不采用，也不再投入验证 |
| D. 维持现状（只支持 OpenBKN Runtime） | 不能 | 零成本 | 方案 A 落地前的现状 |

方案 A 落地后还有一个附带收益：运行时不再需要补丁 0002。OpenBKN Runtime 可以简化，stock Web 和桌面版也都能用同一个插件包。

## 2. 依据（已核实）

### 2.1 桌面版等同于 stock 宿主
- 静态核实：桌面版 `app.asar` 里打包的 `Session.append` 构造事件时没有 `ignorable` 字段，也没有 `LogOnlyEventIntent`；读取侧的拒绝报错串 "unknown to this harness and not marked ignorable" 出现 2 次。
- 实测（2026-09-29）：桌面版写入的 `openbkn/business-network-bound` 和 `openbkn/managed-conversation` 都不带 `ignorable`，重启后会话被拒绝重载，报错和 G2 ⑤ 完全一致。

### 2.2 桌面版运行时只缺补丁 0002
- 0001（Typert `analyzer.ts`）只在构建插件时生效：用打补丁的 generator 构建出的 tgz 已经带上协议信息。桌面版实测中实际走到的 Remote（认证状态、网络列表、工作区关联与绑定、建议芯片、溯源视图）都正常；没有逐项验证全部 Remote。
- 0003 是构建 Runtime 用的 lockfile 补丁。
- 桌面 profile 设置了 `autoInstallPeers: false`，peer 依赖由运行时解析（`profiles/node_modules` 拦截层）提供，实测安装和加载都正常。

### 2.3 完整性校验不在运行时执行，但改安装包不可取
- 桌面启动时只调用 `readDesktopRuntime`（`apps/desktop/src/runtime-tree.ts:150`），检查描述符结构和版本；逐文件 sha256 的 `verifyDesktopRuntime` 只出现在打包脚本里（`prepare-dsh.ts`、`sign-primary-runtime.ts`、`smoke-packaged-runtime.ts` 等）。
- 已安装二进制的 Electron fuse：`EnableEmbeddedAsarIntegrityValidation` 关，`OnlyLoadAppFromAsar` 关，`EnableNodeOptionsEnvironmentVariable` 开，`RunAsNode` 开。
- Host 进程继承 Electron 的环境变量（并合并登录 shell 的环境，`host-process.ts:199`）。`app-boot` 的 `BOOTSTRAP_NAMES` 只禁止从被发现的 `.env` 文件里设置 `NODE_OPTIONS`。
- 所以方案 C 技术上可行，但会破坏签名、被更新覆盖、污染全局环境，排除。

### 2.4 插件无法在进程内绕过
- profile 的解析拦截只作用于 `profiles/**` 下的模块，宿主模块从 `app.asar` 加载，profile 没法替换宿主的 `dsh-session`。
- `append` 生成的事件被 `deepFreeze` 冻结；jsonl 持久化写盘用的是 `session/event` 回调收到的原事件对象（`session-persistence-jsonl/src/storage.ts:535` `enqueueLive(event)`）；重写 `append` 需要模块私有状态（`attachments` 等），插件访问不到。

### 2.5 插件写 3 种会话事件，任何一种都会导致无法重载

| 事件 | 写入点 | 读取点 |
|---|---|---|
| `openbkn/business-network-bound` | `dsh-session-binding.ts:42` | `business-context-service.ts` 140/235/376/410/418，`scoped-business-context.ts:158` |
| `openbkn/turn-provenance` | `dsh-session-provenance.ts:42`（由 `captureTurnProvenance` 在 `agent/turn-stopping` 时调用） | `business-context-service.ts:150/173` |
| `openbkn/managed-conversation` | `interaction-lifecycle.ts:308`（由 `scoped-business-context.ts:170/176` 调用） | `scoped-business-context.ts:98` `restoreFrom` |

### 2.6 上游状态
- 远端 HEAD 是 `639ed01`（`dsh-v0.2.0-rc.2`，2026-09-29 发布），之后没有新 tag，写入侧仍然缺失。GitHub Release 不带安装包，`hasIssuesEnabled=false`。
- 上游设计笔记 `2026-08-30-retain-ignorable-external-session-events` 明确说：`ignorable` 字段就是为"当前依赖此字段的一个第三方插件"保留的；按事件名注册的方案被有意否决。
- 上游有两份已提出、尚未实施的笔记在计划重构会话层（`2026-09-06-logical-session-storage-rebuild`、`2026-09-10-session-capability-protocols`），`Session` 这个具体类的 API 可能会变。
- fork 上已有 `kalias/deepseek-harness` 分支 `feat/ignorable-session-events-write-side`（`3af39d4`，基于 0.1.6-alpha.2），要贡献得先 rebase 到 0.2.0-rc.2。

### 2.7 storage-domain 约束（方案 A 的设计依据）
- 落盘位置是 `$DSH_HOME/storages/<domain>.json`，home 级共享（实测插件已有的 `openbkn_workspace_bindings` 就在这里），所以 CLI、Web、桌面各个 profile 看到的是同一份。
- 打开时全量加载进内存，读取是同步的。**写入先落盘，再更新内存**：`put` 还没 resolve 时，同步 `get` 读到的是旧值（`storage-domain/README.zh.md`「内存具有最终决定权」）。
- 变更只在单个进程内可见。CLI 和桌面同时写同一个 domain 时，没有跨进程合并。
- 不支持迁移：已存版本和 spec 不一致时直接拒绝打开（`version-mismatch`）。
- 不提供会话删除钩子，需要自己清理孤儿记录。

## 3. 方案 A 设计

**原则**：
1. **新写入只进自有存储**，所有宿主一律如此，不做能力探测。原因是判断 `append` 是否支持 `ignorable` 的唯一可靠办法就是真写一次，而写下去就已经不可逆了。
2. **读取按"会话日志 → 自有存储 → 父会话链"的顺序**。会话日志优先，是为了兼容打补丁 Runtime 已经写下的带 `ignorable` 的事件，保证旧会话照常可读。
3. 会话日志里不再出现任何插件事件。卸载插件后会话照样能打开，G2 ⑥ 那种"会话从侧栏消失"的问题也跟着消除。

**存储结构**（一个 domain，三张表）：

```ts
defineDomain({
  name: 'openbkn_session_records',
  version: 1,
  tables: {
    bindings:       domainTable<string, BindingRecord>(...),        // key: sessionId
    turnProvenance: domainTable<string, TurnProvenanceRecord>(...), // key: `${sessionId}::${messageId}`
    conversations:  domainTable<string, ConversationRecord>(...),   // key: sessionId（只保留最后状态）
  },
})
```

每条记录带上 `sessionId`、`recordedAt`，以及写入时的 `workspacePath`（取自 `session.header.cwd`），用于孤儿清理和排查。

**fork 和子代理**：`SessionHeader.parentSession` 存在时，读不到就沿父链回溯（设最大深度，比如 16，防止环）。
- 绑定：继承父会话的绑定。
- 溯源：按 messageId 在父链上查（fork 继承的消息 id 不变）。
- managed-conversation：继承父会话的最后状态。这和原来"seed 继承事件"的语义一致。

## 4. 改动清单

### 4.0 前置：修复 v4 消息形状导致的溯源失效（独立 bug，应先修）
所有 0.2.0-rc.2 宿主都受影响，和桌面无关，详见 evidence「附带发现」。
- `src/native-mcp-provenance.ts` `firstLifecycleRecord`：兼容 v4 的 `{role:'tool', content:[{type:'text'}]}`，同时保留对旧 `tool-result` 外壳的兼容（旧会话可能是这种形状）。
- `src/turn-timeline.ts` `firstResultRecord`：同样处理。
- 测试：`tests/native-mcp-provenance.test.ts`、`tests/turn-timeline.test.ts`、`tests/business-context-service.test.ts` 补上 v4 形状的 fixture，并保留旧形状用例。建议从本次桌面会话日志（`release/desktop-probe-backup/probe-artifacts/sessions/`）里脱敏截取 seq 48–54 作为回归 fixture。

### 4.1 新增 `src/session-record-store.ts`
- `OpenBknSessionRecordStore extends Service`，`static inject = ['storageDomain']`，照搬 `workspace-binding-registry.ts` 的开关模式（`Service.init` 里打开 domain，用 `ctx.effect` 注册关闭）。
- **write-through 覆盖层**：`Map<key, record>` 优先于 `table.get`；写入先更新覆盖层，再入队 `table.put`；`put` resolve 后删掉覆盖项。这是为了满足插件现有的同步语义：`bind` 之后马上 `mountIfBound`，以及 C2 约束下必须同步的 `tools/result` 监听。
- 写入失败：记 `logger.warn`（只带 code，不带业务内容），并**保留覆盖层**，让本进程内的行为保持一致。下次写入时重试，或在 `dispose` 时 flush。
- 同步接口：`getBinding(sessionId)`、`setBinding(...)`、`getTurnProvenance(sessionId, messageId)`、`setTurnProvenance(...)`、`getConversation(sessionId)`、`setConversation(...)`，都支持父链回溯参数。
- 孤儿清理：`Service.init` 时异步扫描一次，删除会话已不存在的记录。会话是否存在用 `sessionPersistence.list`/`open` 判断，具体接口实施时确认；拿不到判断能力就先不清理，记为已知限制。

### 4.2 改写入和读取路径
- `src/dsh-session-binding.ts`
  - `bindDshSessionBusinessNetwork`：不再 `session.append`，改为 `store.setBinding`；冲突检测改为基于"日志 + store"合并后的结果。
  - `readDshSessionBusinessNetwork`：先 `readBusinessNetworkBinding(session.snapshotEvents())`，读不到再 `store.getBinding(session.id, {parents})`。
  - `DshSessionBindingLog` 接口去掉 `append`，增加 `id` 和 `header.parentSession`。
- `src/dsh-session-provenance.ts`：`appendDshSessionTurnProvenance` 改为写 store；`readDshSessionTurnProvenance` 按"日志 → store → 父链"读取。冲突语义不变（`TurnProvenanceConflictError`）。
- `src/interaction-lifecycle.ts`：`recordConversationEvent` 改为写 store（`ManagedConversationSession` 接口去掉 `append`）；`restoreFrom` / `lastConversationEvent` 增加一个参数，合并日志里最后一条事件和 store 记录（按 `recordedAt` 取较新的一条）。
- `src/scoped-business-context.ts`：98 行 `restoreFrom` 传入 store；170/176 行改调新的写入接口。
- `src/business-context-service.ts`
  - `static inject` 增加 `'openbknSessionRecordStore'`。
  - `bind` / `captureTurnProvenance` / 所有 `readDsh*` 调用处传入 store（或者把 store 注入这些 helper 的工厂）。
  - 顶部注释里"append the immutable DSH session event"要同步改掉。
- `src/index.ts`：`await ctx.plugin(OpenBknSessionRecordStore)`（放在 `OpenBknWorkspaceBindingRegistry` 之后）；按需导出。
- `src/session-binding.ts`、`src/turn-provenance.ts`：保留纯函数（读旧日志还要用）。注释里"no in-memory side store exists"等表述要改。
- `declare module '@deepseek-ai/dsh-session/types'` 里的 3 个 `SessionEventMap` 扩展保留：读旧日志时需要这些类型；写入路径不再使用它们。

### 4.3 测试
- 新增 `tests/session-record-store.test.ts`：
  - 写后立即同步读；
  - 模拟 `put` 延迟和失败，覆盖层保持生效；
  - 重开 domain 后记录可重载；
  - fork 父链回溯，包括深度上限和环；
  - `version-mismatch` 时失败并带清晰上下文。
- 改 `tests/dsh-session-binding.test.ts`、`tests/business-context-service.test.ts`、`tests/interaction-lifecycle.test.ts`、`tests/scoped-business-context.test.ts`、`tests/turn-provenance-controller.test.ts`：用 fake store。**原来"append 带 `{ignorable:true}`"的断言改为"会话日志中不出现 `openbkn/*` 事件"**。
- 新增兼容用例：日志里已有 `ignorable` 事件时，读取优先取日志，且不会再往 store 写一份重复记录。
- `tests/install-lifecycle.test.mjs`：卸载后 store 文件保留、会话可打开（如该测试覆盖到这一层）。

### 4.4 验收（真实宿主）
1. **stock 源码宿主**：重做 G2 ①–⑥，第⑤、⑥步应翻转为通过。
2. **官方桌面版**：按 `../evidence/2026-09-29-desktop-direct-install.md` 的步骤重跑，重启后会话可重载、溯源入口可见。
3. **OpenBKN Runtime（带补丁）**：回归 m5 的 3 个问题；用旧 Runtime 写下的会话（带 `ignorable` 事件）在新插件下可读。
4. G6 评测批次跑一轮（仓库约定的发版前检查）。

### 4.5 文档与发布
- `README.md` / `README.zh.md`：把"补丁是必需项"改为"Runtime 为推荐形态；stock Web 与官方桌面版可直接安装"。补充桌面安装步骤：`<app>/Contents/Resources/runtime/cli/bin/dsh plugin --profile desktop add …`，安装前要完全退出应用。自签 CA 环境目前只验证过"从终端启动并注入 `NODE_EXTRA_CA_CERTS`"；从 Dock 启动时经登录 shell 注入**尚未验证**，验证前不写进正式安装步骤（见 §6）。
- `docs/guides/install-with-patch.md`：新增"无补丁安装（Web / 桌面）"一节。
- `compat/dsh-0.2.0-rc.2/README*.md`：把 0002 标记为"方案 A 落地后不再需要，保留一个版本过渡"。**本批不删补丁**，删除放到下一个 DSH 版本重新打补丁时一起做。
- `CHANGELOG.md`：新条目。
- 插件包版本号按规则追加 `-<n>`（`0.2.0-rc.2-openbkn.0.2.0-1`）。发布 npm 需要用户批准（`v*` tag）。

## 5. 风险与已知限制

| 风险 | 影响 | 应对 |
|---|---|---|
| CLI 和桌面同时运行时各自写同一个 domain | **原稿判断有误**：storage-domain 默认 `single` 布局每次整份重写文件，不同会话的记录也会互相覆盖 | 已改为每个会话一个文件、读取时现读文件，并依托 DSH 的会话级跨进程写锁保证单写者（见审核复核 §3.2） |
| 会话导出、分享时不带绑定和溯源 | 导出的会话打开后是未绑定状态 | 已知限制，写进 README |
| store 无限增长（每条回答一条溯源记录，全量加载进内存） | 内存和启动耗时增加 | 孤儿清理 + 后续可按 `recordedAt` 设保留上限 |
| 升级 schema 时 domain 拒绝打开 | 插件整体初始化失败 | v1 字段一次设计到位；以后升版写显式迁移 |
| 上游会话层重构 | 读取旧日志的路径（`snapshotEvents`）可能变 | 方案 A 把插件对 `Session` 的依赖降到只读 `snapshotEvents` / `header` / `id`，比依赖 `append` 签名更稳 |

## 6. 并行事项（不阻塞方案 A）
- 上游写入侧：把 fork 分支 rebase 到 `dsh-v0.2.0-rc.2`，按上游口径写好说明（默认仍是 required，`ignorable` 由写入方显式声明），等有渠道时再提交。
- 桌面版自签 CA 用户指引：确认从 Dock 启动时，登录 shell 注入的 `NODE_EXTRA_CA_CERTS` 能否生效。
