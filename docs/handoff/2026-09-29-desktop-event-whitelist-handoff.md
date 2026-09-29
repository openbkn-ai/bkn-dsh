# 交接：官方 Desktop 兼容性、V4 溯源回归与旧会话迁移（2026-09-29）

> **历史阶段文档（2026-09-30 标注）**：本文是 2026-09-29 分析开始前的交接状态，其中"桌面版未直装实验""完整性描述符是否运行时强制"等待验证项都已有结论。现状以这些文档为准：结论与方案见 `../plans/2026-09-29-official-desktop-support.md`，审核复核与修订设计见 `../reviews/2026-09-29-desktop-support-plan-review.md`，实测（首轮失败、修复后第二轮通过）见 `../evidence/2026-09-29-desktop-direct-install.md`。

> 自包含文档，面向接手人；无需原会话上下文。**任务性质：分析与方案探索，不自动改代码。**

## 要回答的问题

bkn-dsh 插件目前唯一受支持的运行形态是 OpenBKN 兼容 DSH Runtime（源码树打补丁后构建）。用户想知道：**DeepSeek Harness（DSH）官方桌面版 app 能否支持 bkn-dsh？如果有办法，办法是什么、代价是什么？**

当前结论：**当前插件不能原样宣称兼容官方 Desktop；修改插件而保持官方 app 原样是一条可行的工程路线，但尚未完成端到端验收。** Desktop 已有外部插件、Remote 与 Web UI 插槽，无须先重写 Electron 界面。事件白名单是确定阻塞，但补上 `ignorable` 写入接口仍不够：还须修复 V4 工具结果解析和旧事件迁移后的读取。

**优先级调整：先修复 V4 溯源/时间线解析，再推进官方 Desktop 持久化适配。** 结构变化在 `0.1.7-rc.2` 已发生，并非 `0.2.0` 新引入；它影响兼容 Runtime 与官方 Desktop 的共同解析代码。0.2.0 已有模块级失败复现；0.1.7 发布线的实际 UI 影响是静态强推断，仍待该版本真实日志或端到端复验。

## 版本与证据边界

- 插件分析基线：`efa6df2`，版本 `0.2.0-rc.2-openbkn.0.2.0`。该 retarget 提交没有修改事件解析器。
- 官方 Desktop：本机 `/Applications/DeepSeek Harness.app`，版本 `0.2.0-rc.2`，内置 Node `24.18.1`；分析期间签名校验通过。没有安装插件、修改应用包或写入用户会话。
- 2026-09-29 在线核对时，上游默认分支是 **`master`**，HEAD 为 `639ed015397290b3745d163aafe02ffee4aa3f84`，与 `dsh-v0.2.0-rc.2` 基线一致。当时未发现更新发布可直接解决写入缺口；PR 列表接口返回 404、issues 未启用，不能据此断言不存在内部开发或未公开计划。接手时重新核对版本。
- 下文“模块探针”指本次分析会话中的独立进程/纯内存调用，未启动完整产品业务链路，未产生仓库内独立 probe 报告。用户随后独立复核了源码与历史证据，但未重跑这些探针。

## 问题机制（三层，均有源码实证）

插件共有三种自定义事件，全部传入 `{ ignorable: true }`，**仅迁移网络绑定不能消除全部重载风险**：

| 事件 | 状态用途 | 写入位置（相对插件包 `src/`） |
|---|---|---|
| `openbkn/business-network-bound` | 会话知识网络绑定 | `dsh-session-binding.ts:42` |
| `openbkn/managed-conversation` | 平台 conversation 连续性及失效标记 | `interaction-lifecycle.ts:308`（`recordConversationEvent`） |
| `openbkn/turn-provenance` | 最终答案对应的溯源句柄 | `dsh-session-provenance.ts:42` |

1. **白名单是构建期静态集合**。`packages/core/session/src/known-event-types.ts` 的 `KNOWN_SESSION_EVENT_TYPES`（约 60 项）由 `scripts/gen-persistence-catalog.ts` 从仓库自身事件表生成，只含 DSH 第一方事件类型。第三方插件事件按构造不在其中，且**与插件是否安装无关**——同一份宿主构建里集合是死的。

2. **读取侧按白名单硬拒绝**。`packages/session/session-persistence/src/storage-contract.ts` 的 `validateStoredEvents()`：`!KNOWN_SESSION_EVENT_TYPES.has(event.type) && event.ignorable !== true` 即抛错，整个会话拒绝重载。实测报错（G2 实验⑤）：
   > Failed to load history: failed to observe session "…" : contains event type "openbkn/business-network-bound" (seq 20) unknown to this harness and not marked ignorable; refusing to interpret the log — it was likely written by a newer harness

3. **逃生门 `SessionEvent.ignorable` 只修了读取侧，写入侧是缺口**。事件信封上的 `ignorable?: true` 标记是上游官方兼容机制：读取侧原生认它（带标记的未知事件宿主不拒绝、也不解释其业务含义，**记录本身保留在日志中、插件可自行读取**）；但 stock `Session.append()` **没有设置该标记的写入选项**。0.2.0-rc.2 的原始实现只提取第三参数中的 surface 元数据，忽略 `ignorable`，因此上述事件落盘后会被读取侧拒绝。使用 `git show HEAD:packages/core/session/src/index.ts` 检查未打补丁的原貌，不要为了比较而 stash、checkout 或改动用户的补丁树。

上游设计意图（重要）：`.agents/notes/implemented/architecture/2026-08-30-retain-ignorable-external-session-events.md`（在上游仓库内）明说 `ignorable` 字段**就是为依赖它的第三方插件保留的**，"事件名注册机制被有意否决（不能分类省略安全性）"，且"只有在替代机制覆盖该第三方插件的事件生产、持久化、重载、传输全链路之后才可移除该字段"。**上游文档承认缺口存在，但写入侧至今没落地。**

## 已验证证据

- G2 实验（`docs/evidence/m6-stock-dsh-install.md`，2026-09-20，stock `dsh-v0.1.6-alpha.2` 源码构建宿主）：①插件安装/加载 ✅ ②侧栏入口 ✅ ③10 个 Remote 方法注册 10/10 ✅ ④绑定+事件落盘 ✅ ⑤**重启后拒绝重载 ❌（截图 `m6-stock-dsh-reload-refused.png`）** ⑥卸载插件后同形拒绝 ❌，且会话从侧栏消失（比报错横幅更隐蔽）。
- 同 doc 补充实验：**0.1.6-alpha.2** 的 stock 源码 dev 形态工具派发失败（`ctx.tools[TOOL_RUNTIME_SCHEDULER].prepare`），原生工具同样失败。该历史结果不能直接外推到 0.1.7/0.2.0，也不能仅凭 Desktop 是打包形态就宣称其真实工具链已通过。
- 0.2.0-rc.2 静态比对：`storage-contract.ts` 拒绝逻辑同形；stock `Session.append` 同样无 ignorable 写入选项。
- **官方 app 安装产物模块探针**：以 `ELECTRON_RUN_AS_NODE=1` 加载 `app.asar/dsh/node_modules/@deepseek-ai/dsh-session/lib/index.js` 与 `dsh-session-persistence/lib/index.js`；逐种执行 `Session.create → append(type, {probe:true}, {ignorable:true}) → JSON 序列化/反序列化 → validateStoredEvents`。三种事件均不在白名单、返回事件已冻结且没有 `ignorable`、读取校验均拒绝；对照副本显式添加信封标记后均通过并保留事件类型。此探针验证事件准入机制，不验证业务 payload、实际落盘或完整 UI 重启。

## 优先修复：V4 工具结果解析回归

当前 `native-mcp-provenance.ts` 的 `firstLifecycleRecord`（约 93 行）和 `turn-timeline.ts` 的 `firstResultRecord`（约 160 行）只识别旧式嵌套块：

```text
旧：message.role = "user"
    message.content = [{type: "tool-result", toolCallId, content: [text, ...]}]
新：message.role = "tool"
    message.toolCallId = ...
    message.content = [text, ...]
```

| DSH 版本 | 已知结构与证据 | 不可越过的结论边界 |
|---|---|---|
| 0.1.6-alpha.2 / V3 | 旧嵌套结构；用户独立复核了 9/19 真实 `session.v3.jsonl.zstd` 中的 MCP 结果。M5 和 9/22 时间线 E2E 均运行在此版本 | 这些通过记录不能证明后续 V4 版本可用 |
| 0.1.7-rc.2 / V4 | llm 已移除 `tool-result` 内容块，`createToolResultMessage` 及 `appendToolResult` 使用新结构；与 0.2.0 对应实现一致 | 未取得该版本真实 V4 业务日志或溯源 UI 复验；发布线受影响是静态强推断 |
| 0.2.0-rc.2 / V4 | 官方 app 自带 `createToolResultMessage()` 生成的新结构交给当前插件解析函数，结果为空；旧结构对照返回溯源句柄 | 已复现模块级解析失败，尚未完成真实业务问答/UI 复验 |

**“retarget 全验证通过”与此问题没有矛盾。** [CHANGELOG](../../CHANGELOG.md) 的 0.1.7 节记录了构建、测试、打包和真实模型 turn 的 smoke；用户本轮核对的 0.2.0 验证声明也仅到 smoke，没有声称验收溯源。两者都不能代替业务 finish、答案关联、溯源浮层及时间线的验证。`efa6df2` 没有修改解析器；`native-mcp-provenance.test.ts` 的成功 fixture 仍使用旧嵌套结构，因此测试通过未覆盖 V4。既有 E2E 版本见 [M5](../evidence/m5-e2e.md) 和 [9/22 时间线验证](../evidence/2026-09-22-timeline-e2e-stage1.md)。

下一步应先让两个解析入口兼容旧嵌套结构与 V4 平铺结构，保持失败结果、未完成 interaction、多 interaction 歧义及最终答案关联的现有拒绝边界。复用一个明确的结构归一化入口是否合适，由实现时按现有代码判断，不需要顺带重构业务服务。新增测试必须包含官方新结构或官方构造函数生成的结果，不能只复制旧 fixture。`tools/result` 运行时回调与持久化 `tool/result.data.message` 是不同接口，勿把持久化结构修复盲目套到生命周期回调上。

## 旧数据：V3→V4 改名与 required 日志需分开处理

上游 `packages/session/session-format-v3-to-v4/src/extension-identities.ts` 的 `namespaceV3OpaqueEvent` 会将 V3 中未知且 `ignorable: true` 的事件改为 `plugin:${event.type}`。例如：

```text
openbkn/business-network-bound → plugin:openbkn/business-network-bound
```

三种 OpenBKN 事件都应纳入历史读取审计。当前插件按原名匹配，迁移后可能丢失绑定、conversation 连续性或已保存的答案溯源。模块对照已确认：同一绑定记录迁移前被 `readBusinessNetworkBinding` 识别，经上游改名函数处理后不被识别；这不是完整日志迁移实测。

- **旧日志已带 ignorable**：检查迁移后的命名、payload 与答案/turn 引用，设计明确的旧格式读取或迁移。不能仅把“扫描旧日志没有报错”当作业务状态恢复成功。
- **旧日志没有 ignorable**：宿主可能在插件读取前就拒绝加载；插件升级或 sidecar 改造不会自动修复。需要另行设计有备份、按确切事件 schema 验证的恢复流程，禁止泛化为“所有未知事件都可忽略”。

## 现有补丁与桌面扩展边界

- **现有解**：compat 补丁 0002（`compat/dsh-0.2.0-rc.2/patches/0002-plugin-ignorable-session-events.patch`）给 `packages/core/session/src/index.ts` + `types.ts` 补上 `Session.append` 的 `ignorable` 写入选项。补丁只应用于干净源码树，构建出 OpenBKN Runtime（自带补丁版 DSH + 配对插件）分发。
- **到不了桌面版的原因**：
  1. 补丁是 fail-closed 设计，`apply.mjs` 只接受指定 commit 的干净 Git 源码工作树，明确排除桌面应用包（`compat/dsh-0.2.0-rc.2/README.zh.md`）。
  2. 桌面版是 Electron 壳（`apps/desktop`，`@deepseek-ai/dsh-desktop`，自述 "Electron desktop shell for a bundled dsh runtime and external plugins"），捆绑的 runtime 树带**完整性描述符**（`apps/desktop/src/runtime-tree.ts`：封存时写 `desktop-runtime.json` 逐文件 sha256）+ macOS 原生签名 + electron-updater 自动更新。**注意（2026-09-29 复核更正）：运行时启动只读取描述符并做结构校验（`readDesktopRuntime`），不做逐文件 sha256 校验**——完整哈希校验用于打包检查；就地改包的实际障碍是 macOS 签名失效与自动更新覆盖，而非哈希。

- Desktop 的正式扩展路径：初始化应用后完全退出，使用 **Desktop 随附 CLI** 执行 `dsh plugin --profile desktop add <package>`，再重开；npm CLI 不能管理 Desktop 保留 profile。Host 与插件使用同一 Electron Node-mode 进程，客户端使用共享 Web UI。插件现有 `client/index.tsx` 注册侧栏、会话标识、答案操作与浮层，无须先重写这些产品界面。此处是接入能力，不是当前插件安装验收。
- `apps/desktop/src/main.ts` 的 `runtimeResources()` 只在 `!app.isPackaged` 时读取 `DSH_DESKTOP_DSH_DIR`；正式包不能靠这个环境变量换 Runtime。
- `NODE_OPTIONS`：本次独立 Electron Node-mode 探针的 data-URL 预加载未执行，输出提示环境变量被禁用。此结果只覆盖本机本次调用环境，不能外推到所有系统/启动方式；构建脚本过滤变量本身也不等于运行时证明。
- 插件安装另一份 patched `dsh-session` 不等于替换宿主已经创建的 Session；解析规则保留宿主自身依赖解析边界。就地改 ASAR/重签名、运行时替换方法或修改白名单不作为正式推荐路线，尤其修改白名单无法保证插件卸载后仍可读。

## 建议执行顺序

1. **先修 V4 解析，复验现有发布线。** 修复上述两个解析器及相应 fixture，覆盖 0.1.6 旧结构和 0.1.7/0.2.0 新结构；优先取得 0.1.7 真实日志或执行一次受控业务问答，验证答案溯源和时间线。0.2.0 同样要求真实业务验证，不能止于一般模型 turn。此项是已发布版本线的共性回归，不是 Desktop 专属增强。
2. **处理 V3→V4 历史状态读取。** 覆盖三种事件的原名、迁移名及冲突情况；验证绑定、conversation 失效标记和 message/turn 关联。无标记 required 日志恢复单列，不能在普通加载时静默改写。
3. **推进保持官方 app 原样的插件适配。** stock 路径必须停止写入全部三种不受支持的自定义事件。会话绑定可复用现有 `storageDomain` 接入方式；conversation 和答案溯源优先从原生工具调用/结果日志恢复，必要时维护可重建缓存。该方案尚未实现、未验收。若需探测写入能力，只用独立内存 Session，禁止向用户会话写探测事件，也不要用函数参数个数推断能力。
4. **同步准备上游写入接口提案。** 补丁 0002 可作起点，默认仍 required，明确可省略事件的边界，补写入/重载/传输/插件缺席和未标记拒绝测试；保留历史数据处理约束。上游发布该接口只解决持久化缺口，不能替代插件解析和迁移修复。提交 PR 是另行授权的对外操作，本交接不自动授权发送。

sidecar 方案需具体处理的成本：

- **提交顺序**：绑定持久化成功后再启用业务能力；现有同步监听器不能直接塞入未等待的异步写入。
- **故障恢复**：日志与缓存并非同一事务，以可核验的原生日志恢复派生状态，防止崩溃后串 conversation 或串答案。
- **fork/导出与跨机迁移**：sidecar 不自动随日志复制，必须规定继承、重新绑定或额外导出流程。卸载插件是否删除 sidecar 取决于卸载策略，不能直接称其必然丢失。
- **状态缺失**：不能根据当前工作区映射静默重写历史会话的知识网络。
- **多进程**：`storageDomain` 当前缺少跨进程变更同步、跨表事务及自动 schema 迁移；不能假设 CLI 与 Desktop 并发写天然一致。

## 验收条件

| 验证层级/场景 | 必须观察的结果 |
|---|---|
| 解析器测试 | 两代工具结果均能提取；失败、未完成、歧义结果保持正确拒绝；最终答案关联不漂移 |
| 历史数据测试 | 三种事件迁移后恢复正确；失效标记不会复活旧 conversation；缺标记日志按明确策略处理 |
| 0.1.7 与 0.2.0 Runtime 业务复验 | 真实 finish 后答案溯源入口、平台记录及时间线相互对应；记录实际 Runtime/插件版本 |
| 官方 Desktop 安装及退出重开 | UI/Remote/工具实际可用；绑定不变，历史可读，下一轮 continuation 正确 |
| 官方 Desktop 卸载插件后重开 | 普通历史仍可读；重新安装的数据保留行为符合声明 |
| fork、导出导入、存储失败及崩溃 | 按明确规则继承或要求重新绑定，不静默错绑，不将未持久化状态报告成功 |

只有完成对应层级才能更新支持声明。本文本次更新只合并分析与复核结论，不表示已经修复、重跑产品验收或发布新版本。

## 关键文件索引

**bkn-dsh 仓库**（`/Users/kalias/Documents/project/app/openBKN/bkn-dsh`）：
- `docs/evidence/m6-stock-dsh-install.md` — G2 实验全记录（本问题最核心证据）
- `compat/dsh-0.2.0-rc.2/` — 现行补丁系列；`patches/0002-plugin-ignorable-session-events.patch` 即写入侧参考实现；`README.zh.md` 补丁边界
- `packages/openbkn-business-context/src/session-binding.ts` / `dsh-session-binding.ts` — 插件事件写入与恢复路径
- `packages/openbkn-business-context/src/interaction-lifecycle.ts` / `dsh-session-provenance.ts` — 另两种自定义事件
- `packages/openbkn-business-context/src/native-mcp-provenance.ts` / `turn-timeline.ts` — V4 解析修复入口；相关测试在同包 `tests/`
- `packages/openbkn-business-context/src/workspace-binding-registry.ts` / `scoped-business-context.ts` — 现有存储接入与同步生命周期约束
- `CHANGELOG.md`、`docs/evidence/m5-e2e.md`、`docs/evidence/2026-09-22-timeline-e2e-stage1.md` — 区分 retarget smoke 与旧版业务验收
- `README.zh.md` — 当前分发口径（Runtime 唯一受支持形态）

**DSH 上游源码**（`/Users/kalias/Documents/project/app/openBKN/dsh-020`，commit `639ed01`，**工作树带 5 个未提交的 compat 补丁文件**：`packages/core/session/src/index.ts`、`types.ts`、`packages/typert/generator/src/analyzer.ts`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`；用 `git show HEAD:<path>` 看 stock 原貌，保留现有修改）：
- `packages/core/session/src/known-event-types.ts` — 白名单本体（生成物，勿手改）
- `scripts/gen-persistence-catalog.ts` — 白名单生成器
- `packages/session/session-persistence/src/storage-contract.ts` — 拒绝逻辑（`validateStoredEvents`）
- `packages/core/session/src/types.ts` — `SessionEvent.ignorable` 信封定义与安全语义注释
- `packages/llm/llm/src/message.ts`、`packages/core/agent-loop/src/tool-calls.ts` — 新版工具消息构造及落入 session 的形状
- `packages/session/session-format-v3-to-v4/src/extension-identities.ts` — `namespaceV3OpaqueEvent` 改名规则
- `packages/storage/storage-domain/README.md` — sidecar 能力与限制
- `.agents/notes/implemented/architecture/2026-08-30-retain-ignorable-external-session-events.md` — 上游设计意图（含中英双语版）
- `apps/desktop/`（`@deepseek-ai/dsh-desktop`）— Electron 壳；`src/runtime-tree.ts`、`src/host-process.ts`、`src/core-package-set.ts`、`src/update-coordinator.ts` 为完整性/更新相关入口

另有 `/Users/kalias/Documents/project/app/openBKN/deepseek-harness` 旧树与 `dsh-017`，用于历史对照。0.1.7 retarget 基线为 `477b4f420553e8a52c2fbccc464d7561b239c443`（见 CHANGELOG）；此次 `dsh-017` 存在缺失 tag/父提交对象的情况，可读取 HEAD 文件但部分历史命令失败。比较版本时用可核验的提交对象或发布产物，不凭目录名或工作树内容判断代际，也不要自动修复这些工作树。

## 事实与推断标注

- **静态已核实**：三种事件写入缺口；0.1.7 已使用 V4 新结构；解析器只认旧嵌套块；V3→V4 改名；Desktop 正式插件入口、开发变量边界与启动时不做逐文件哈希校验。
- **模块级已复现**：官方 0.2.0 安装产物拒绝三种未标记事件、接受并保留显式标记记录；官方工具消息构造函数的结果不能被当前溯源解析器提取；绑定事件改名后现有读取函数不识别。
- **历史运行证据**：0.1.6 的 G2 重载拒绝与兼容 Runtime 的 M5/时间线通过；用户本轮另核实了 0.1.6 的真实 V3 工具结果。没有把这些记录迁移成新版验收。
- **重要推断/待验收**：0.1.7 发布版的实际溯源 UI 影响；插件侧 sidecar/原生日志恢复方案的完整可用性；官方 Desktop 的真实问答、完整重启、卸载与数据迁移行为。
