# 当前提交审核：官方 DSH 支持、业务约束与用户体验

> 审核日期：2026-09-30。
> 审核基线：`a19b2ba`（包含 `0fe6c17` 桌面最小闭环、目录选择器修复、孤儿绑定清理、PTC 拒绝、`6e9d190` 版本更新及 Runtime 停发文档）。
> 插件版本：`0.2.0-rc.2-openbkn.0.2.0-1`；目标宿主：DSH `0.2.0-rc.2`，上游 `639ed01`。
> 用途：交接给后续开发 agent，作为复现、修复和验收依据。下面的修复建议尚未实施，优先级为本次审核建议。
> 操作边界：审核只读；仅在临时目录执行隔离探针，结束后删除自身临时目录。没有修改插件代码、用户配置、真实会话或凭证，没有安装插件、运行真实模型问答、提交或发布。用户随后授权新增本报告。

## 1. 结论与交接重点

当前版本已基本达成“官方 DSH 不打补丁，只安装插件即可完成业务问答、溯源和重启续接”的核心目标。架构已从三类状态另存收敛为：**只另存不可变绑定，conversation 和 provenance 从宿主原生日志恢复**。这一方向合理，旧方案的大部分同步问题已消失。

但当前实现仍有三个应优先处理的业务约束问题：

| ID | 优先级 | 问题 | 证据级别 | 属性 |
|---|---|---|---|---|
| R1 | P1 | 同一会话并发绑定两个不同网络，两个请求均返回成功 | 当前源码 + 真实文件存储隔离探针复现 | 本轮异步绑定实现的问题 |
| R2 | P1 | 工具守卫没有强制比较查询 `kn_id` 与会话绑定，主要依赖提示词 | 当前源码注册的守卫探针复现 | 既有约束缺口，不是桌面适配新回归 |
| R3 | P1 | 绑定损坏或冲突时静默按普通会话继续执行，界面隐藏徽标 | 当前源码 + 明确允许该行为的现有单测 | 当前恢复路径的问题 |

建议先处理 R1、R3，再完成 R2 的宿主侧约束及间接访问路径审计。PTC 提示前移、错误状态可见性随后处理。这里的顺序是实施建议，不意味着 R2 风险较低。

不要将以下情况误写为已完成：最终 npm 下载包三宿主验收、Windows 验收、双宿主并发写入验收、真实 fork 验收。也不要把“PTC 按预期拒绝”计作“支持 PTC”。

## 2. 基线与证据边界

### 2.1 相关文档

- [三轮桌面及多宿主实测记录](../evidence/2026-09-29-desktop-direct-install.md)
- [当前发版计划](../handoff/2026-09-30-release-0.2.0-rc.2-1-plan.md)
- [上一轮方案复核](2026-09-29-desktop-support-plan-review.md)
- [原方案 A](../plans/2026-09-29-official-desktop-support.md)：历史方案，不应再照三类状态另存的旧清单实施。
- [当前用户安装说明](../../README.zh.md)

### 2.2 本次实际执行

以下结果来自本次审核执行，而不是引用前一位 agent 的测试声明：

| 验证 | 命令或方法 | 结果 |
|---|---|---|
| 插件源码测试 | 在 `packages/openbkn-business-context/` 执行 `node --import tsx --test --test-reporter=dot tests/*.test.ts` | 退出码 0 |
| 仓库、兼容及 Runtime 测试 | 仓库根执行 `node --test --test-reporter=dot compat/dsh-0.2.0-rc.2/tests/*.test.mjs tests/*.test.mjs runtime/tests/*.test.mjs` | 退出码 0 |
| 包内容审计 | 仓库根执行 `node scripts/package-bundle.mjs --check` | 通过，版本 `…0.2.0-1`，52 个文件 |
| 并发绑定 | 当前 TS 源码 + 临时目录中的真实 `SessionBindingStore` | R1 复现 |
| 网络范围守卫 | 挂载当前策略函数，捕获其真实注册的 guard，模拟 start 成功 | R2 复现 |
| 文档与截图 | 阅读新增证据、发版计划，检查桌面执行溯源和 PTC 拒绝截图 | 与对应正常路径声明相符 |

限制：没有重新构建发布包；包内容审计只验证文件清单等打包要求，不证明现有 `lib` 与最终源码逐字对应。没有执行插件目录的全部 `.test.mjs` 构建产物测试，因此不能把上表改写为“完整发布测试全部重跑通过”。没有重新安装插件或发起真实模型问答，也没有重跑本机双宿主或 Windows 实验。

三宿主正常流程的真实运行结论引用仓库既有实测记录；本次独立核实的是源码、上述测试、隔离探针和截图。实测包来自不同阶段的提交，不等同于最终发布包全量验收。

## 3. R1：并发绑定突破不可变约束

### 3.1 位置与机制

- `packages/openbkn-business-context/src/dsh-session-binding.ts:62–77`：先读绑定、判断冲突，再 `await records.write(...)`。
- `packages/openbkn-business-context/src/session-binding-store.ts`：原子替换文件，但不负责“检查后仅写一次”的串行化。
- `packages/openbkn-business-context/src/business-context-service.ts:378–397`：写完调用 `mountIfBound`，策略通过 `WeakSet` 只挂载一次。

两个请求可以同时读到未绑定，再分别写 A 和 B，且均返回 `kind: bound`。原子文件替换保证完整文件，不保证绑定决策唯一。DSH 的跨进程会话写锁也不能排除同进程内两个异步请求。

已验证：两个不同绑定请求均成功，最终磁盘仅保留一个。进一步影响为静态推断：若策略在第一次提交后挂载，第二次提交再覆盖记录，已挂载策略、请求返回值和磁盘绑定可能不一致。

### 3.2 可复现探针

在 `packages/openbkn-business-context/` 执行。只读源码，只写自己创建的临时目录；不触碰 `~/.dsh`。

```bash
node --import tsx --input-type=module <<'JS'
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SessionBindingStore } from './src/session-binding-store.ts';
import { bindDshSessionBusinessNetwork } from './src/dsh-session-binding.ts';
const root = await mkdtemp(join(tmpdir(), 'bkn-review-'));
try {
  const records = new SessionBindingStore(root);
  const session = { id: 'review-session', snapshotEvents: () => [] };
  const binding = id => ({
    platformBaseUrl: 'https://example.invalid',
    knowledgeNetworkId: id,
    displayName: id,
  });
  const results = await Promise.allSettled([
    bindDshSessionBusinessNetwork(session, records, binding('network-A')),
    bindDshSessionBusinessNetwork(session, records, binding('network-B')),
  ]);
  console.log(JSON.stringify({
    results: results.map(r => r.status === 'fulfilled'
      ? { status: r.status, ...r.value }
      : { status: r.status, error: r.reason.message }),
    onDisk: records.read(session.id)?.binding.knowledgeNetworkId,
  }));
} finally {
  await rm(root, { recursive: true, force: true });
}
JS
```

本次输出：A、B 都是 `fulfilled / bound`，磁盘为 A。不要依赖最后一定是 A；缺陷判据是两个不同网络均报告绑定成功。

### 3.3 修复边界与验收

按会话串行化完整决策：“读取 → 判断冲突 → 写入 → 激活策略”。覆盖显式 Remote 绑定、工作区自动绑定及 fork 继承等实际入口，避免只在某个 UI 按钮上禁用重复点击。

验收要求：

1. 同一会话并发绑定 A/B：只能一个成功，另一个明确冲突。
2. 同一会话并发绑定 A/A：结果幂等，不产生相互覆盖的决策。
3. 不同会话的绑定互不阻塞、互不覆盖。
4. 写入失败不激活新策略，后续重试不会被残留的失败 Promise 永久阻塞。
5. 返回值、磁盘记录、界面徽标及已挂载策略使用同一个网络。

## 4. R2：绑定网络未在工具执行边界强制校验

### 4.1 位置与影响

- `packages/openbkn-business-context/src/scoped-business-context.ts:116–125`：guard 校验工具白名单，然后进入 lifecycle 规则。
- `packages/openbkn-business-context/src/interaction-lifecycle.ts:287` 起的 `denialFor`：校验 interaction 状态和 conversation 续接规则，不比较绑定网络。
- `packages/openbkn-business-context/src/managed-session-policy.ts:30`：要求 `kn_id` 必须等于绑定网络，但这是模型提示词。

本次探针中，会话绑定 A，interaction 已成功开始后，`query_metric(kn_id=A)` 和 `query_metric(kn_id=B)` 均无拒绝信息。

证据边界：这证明插件守卫放行了不同网络参数，不证明已经读取了其他网络数据，也不证明平台授权失效。若账号同时获准访问 A、B，平台权限本身未必会阻止模型误查 B。所选会话范围与账号有权访问的全部范围需要区分。

### 4.2 可复现探针

在 `packages/openbkn-business-context/` 执行，无网络请求、无用户数据写入：

```bash
node --import tsx --input-type=module <<'JS'
import { mountBoundBusinessNetworkTool } from './src/scoped-business-context.ts';
const guards = [], listeners = {};
const ctx = {
  tools: {
    guard: f => { guards.push(f); return () => {}; },
    get: () => undefined,
  },
  systemPrompt: { section: () => () => {} },
  on: (name, f) => { listeners[name] = f; return () => {}; },
  logger: { warn: () => {} },
};
const agent = { ctx, session: { snapshotEvents: () => [] } };
mountBoundBusinessNetworkTool(agent, { baseUrl: 'https://example.invalid' }, {
  platformBaseUrl: 'https://example.invalid',
  knowledgeNetworkId: 'network-A', displayName: 'A',
});
listeners['tools/result']({ name: 'mcp__openbkn__bkn_start_interaction' }, {
  isError: false,
  content: [{ type: 'text', text: JSON.stringify({
    interaction_id: 'int-A', conversation_id: 'conv-A', execution_status: 'in_progress',
  }) }],
});
for (const kn_id of ['network-A', 'network-B']) {
  console.log(JSON.stringify({
    bound: 'network-A', requested: kn_id,
    denial: guards[0]({
      name: 'mcp__openbkn__query_metric', arguments: { kn_id, metric_id: 'test' },
    }) ?? null,
  }));
}
JS
```

当前输出两个 `denial: null`。

### 4.3 修复边界与验收

先按实际工具契约确认哪些工具接受或要求 `kn_id`，再在宿主执行边界比较绑定值；缺失、空值、错误类型、不同网络应按各工具契约明确处理。不要对 start/finish 等不接受 `kn_id` 的生命周期工具机械增加必填参数。

间接访问需要单独核实：`execute_tool` 和平台 `mcp__openbkn__run_code` 的内层网络范围由谁强制执行，现有平台接口是否提供绑定上下文。不能只对顶层参数加一次比较，就宣称所有路径都已锁定。也不要未经产品判断直接删除已有业务能力。

验收要求：

1. 正确网络的合法调用通过；错误网络在远程执行前被拒绝。
2. 参数不合法不能通过省略或类型变化绕过校验。
3. 生命周期工具继续按自己的契约工作。
4. 用同时有权访问 A/B 的测试身份验证“选中 A 就不能在该会话查 B”；与平台 403 授权测试分开。
5. 记录间接执行工具的强制约束位置和实际验证结果；未解决的路径明确标注，不能算验收通过。

## 5. R3：恢复错误静默降级为普通会话

### 5.1 位置与现有行为

- `packages/openbkn-business-context/src/business-context-service.ts:406–428`：恢复异常被捕获，`bindingOrUnbound` 返回 `undefined`。
- 同文件 `refreshManagedMcpAtTurnStart`：绑定不可用时仍调用 `next()`。
- `packages/openbkn-business-context/src/client/BoundNetworkBadge.tsx:55–64`：非“agent 尚未 live”错误最终显示为 `absent`。
- `packages/openbkn-business-context/tests/business-context-service.test.ts`：测试 `an unreadable or conflicting binding leaves the turn running as a native, unbound session` 明确保证这一行为。

单个文件读取函数会抛错，但服务层将它转换为“未绑定”；因此不能用文件解析器的 fail-closed 注释证明完整执行路径也是 fail-closed。

重新打开历史会话时，损坏/冲突会阻止绑定策略挂载，却不阻止普通会话继续运行。用户没有清晰错误提示。对已经挂载策略的活跃会话，错误后的具体表现需要另测，不能一概声称策略必然被卸载。

### 5.2 建议与验收

区分“从未绑定”和“已知绑定恢复失败”，新增可呈现的错误状态，保留历史可读性，阻止约束不明的受管会话继续执行，提供重试或明确恢复指引。不要通过删除损坏文件、自动改绑另一个网络来掩盖问题。

验收要求：

1. 未绑定的普通 DSH 会话不受影响。
2. 绑定文件格式损坏、不可读、日志与记录冲突时，历史仍可打开，界面显示明确状态。
3. 错误状态下不能静默进入普通工具执行路径。
4. 恢复后策略、徽标及下一轮执行一致；测试新打开和已活跃两种情况。
5. 诊断信息足以定位问题，但不泄露凭证或业务载荷。
6. 更新当前“允许继续普通执行”的单测，不能保留旧期望后仅补 UI 文案。

完全缺失的 sidecar 是否能判定为曾绑定，需要结合原生日志、工作区关联等现有证据单独设计；本次没有证明所有缺失场景都可无歧义识别。

## 6. 用户体验改进

### U1 / P2：把 PTC 提示前移到首条消息之前

当前 `src/client/index.tsx:239–241` 创建/打开会话，不预检模式；PTC 限制通过策略提示词及 `run_code` guard 实现。用户可能先完成绑定、发送问题、等待模型回复，才得知模式已经锁定，需要重建会话。

证据：[PTC 拒绝截图](../evidence/2026-09-30-desktop-08-ptc-refused.png)。停止 17 次盲目重试的修复有效，但它没有消除首次使用绕路。

建议先查宿主现有会话创建和模式选择 API；如能安全指定标准模式，就在 OpenBKN 新建流程中使用。否则在发送前提供固定提示和可执行指引。不要把自动切换能力当成已经存在，也不要未经用户选择修改整个 profile 的默认模式。

验收：默认 PTC 的 profile 中，用户在第一次业务请求发给模型之前得知限制；标准模式不受影响；“继续会话”也能说明已有 PTC 会话不可切换。PTC 功能实现本身不纳入此项。

### U2 / P2：不要把所有溯源缺失都隐藏成无入口

`src/client/turn-provenance-controller.ts:20` 起的加载逻辑遇到读取失败会隐藏入口；只有完成且能关联到答案的 interaction 才能形成当前 handle。

应区分：普通问候无需溯源、业务执行尚未完成、执行失败/取消、暂时读取失败、确实无可用关联。失败/未完成记录不能伪装成 completed provenance，也不能从模型文本编造关联。

验收：完整业务回答保留正常入口；可恢复错误有重试；业务执行未完成有相应说明；非业务对话不平白增加告警。

### U3 / 体验建议：溯源首屏优先回答“结论依据是什么”

[当前溯源截图](../evidence/2026-09-30-desktop-06-provenance-run3.png)以 Interaction ID、工具名称、Op/Receipt、耗时为主，更适合技术排障。业务用户更关心使用的指标、筛选条件、业务对象以及结论的限制。

建议保留现有技术详情，优先展示平台实际披露的业务依据。若平台不提供，显示明确限制；不要让模型生成看似可信的证据摘要。截图中的平台工具 `mcp__openbkn__run_code` 与 DSH PTC 的裸 `run_code` 是两回事，不应因同名尾缀误判标准模式实测无效。

### U4 / 体验边界：免补丁尚不等于业务用户可自主安装

CLI 登录、PATH、自签 CA、手工 YAML、完全退出宿主仍是安装前提。文档已改善，目录选择器取消也已按正常选择处理，但实际仍偏向由技术人员预配置。

这是产品成熟度判断，不是要求本次扩展出安装向导。后续优化可先做配置状态诊断和明确的修复入口，复用已有能力。

## 7. 共享存储、备份和支持范围

### 7.1 多宿主的工作区关联仍可能覆盖

会话绑定分文件解决了不同会话覆盖同一整表的问题，但 `src/workspace-binding-registry.ts:26–30` 仍使用默认 `single` JSON domain。

本次核实上游 `dsh-020-stock/packages/storage/storage-json/src/single-unit.ts`：每个实例从内存状态序列化并原子替换整个文件；`storage-domain/src/spec.ts` 说明默认布局为 `single`。不同宿主进程的缓存不会因此自动合并。

因此 Desktop、Web 同时运行并修改关联时仍有丢更新风险。本次是静态核实，没有重跑双宿主实验。三种宿主分别可用，不能推出共享 DSH_HOME 下并发写入可靠。

后续验收应覆盖两个进程先打开同一存储，再分别写不同网络关联，重新打开后两条都在，并校验“一个工作区不能被不同网络占用”的跨进程一致性。仅改成 per-record 不能自动解决缓存可见性和跨记录约束。若暂不处理，应明确同时写入的支持限制。

### 7.2 备份不再只包含会话日志

网络绑定现在位于 `$DSH_HOME/openbkn/session-bindings/`。文档应明确备份、搬迁需包含该目录及工作区关联记录。仅复制会话日志不能保证完整恢复绑定；不能因为溯源可从原生日志重建，就宣称所有插件状态都随会话携带。

没有必要在本次修复中预设一个全新导入导出系统；先写清边界并验证既有备份方式。

### 7.3 已接受的范围限制

- 只支持固定 DSH `0.2.0-rc.2`；不能从当前结果推导新版本自动兼容。
- PTC 暂不支持，本次已明确拒绝；平台 MCP 的 `run_code` 不等于 PTC。
- 旧插件在 stock 宿主写出的必需未知事件，不能靠升级插件自动修复。
- 取消/失败后 interaction 可能未闭合，已有文档记录；不要未经平台语义验证自动补 finish。
- 用户已决定停止发布 Runtime 归档；不要为了修本报告问题恢复 Runtime 维护或扩大到旧用户迁移。
- G6 暂缓、Windows 另行安排，应按发版计划追踪，不应在报告中伪装成完成项。

## 8. 目标达成矩阵

| 目标 | 当前判断 | 证据边界 |
|---|---|---|
| 官方桌面版免补丁安装、问答 | 核心路径已有支持 | 既有真实实测记录，本轮未重跑 |
| 重启后正常打开 | 旧阻断已解决，新代码不再追加三类插件事件 | 源码及既有桌面记录 |
| V4 溯源解析 | 已修复 | 当前源码测试、真实日志 fixture |
| V4 工具失败状态 | 已识别消息级 `isError` | 源码测试及既有实测记录 |
| conversation 重启续接 | 从原生日志重放，已有续接记录 | 当前实现及既有多宿主记录 |
| V3 迁移事件读取 | 已识别 `plugin:openbkn/*` | 当前测试与迁移 fixture |
| fork | 按继承边界复制绑定，避免持续读父最新状态 | 本轮仅静态与单测，无真实宿主 fork 验收 |
| 单会话不可变网络范围 | 尚不完整 | R1、R2 |
| 绑定异常恢复 | 尚不完整 | R3 |
| 三宿主同时运行 | 未验收 | 工作区关联存储仍有并发风险 |
| Windows | 未验收 | 计划交给另一台机器执行 |
| 最终 npm 发布包 | 不能宣称验收完成 | 本次审阅时发版计划仍有未完成项 |

## 9. 开发 agent 接手顺序与交付要求

1. 先确认实际 HEAD 和脏文件。本报告行号绑定 `a19b2ba`，后续提交可能漂移；先查符号，不回退他人修改。
2. 运行 R1/R2 隔离探针，保留修复前结果。R3 从现有测试及服务/界面链路复核。
3. 修复 R1 与 R3，分别增加有意义的回归测试；覆盖恢复、显式绑定、自动绑定等实际入口。
4. 修复 R2，记录直接参数校验与间接执行的边界。测试通过不代替真实授权/范围验收。
5. 处理 U1/U2；U3/U4 是后续产品体验建议，避免为此次约束修复引入无关 UI 重构。
6. 按变化风险执行构建、类型检查、测试和包检查。只有最终待发布包才进入宿主验收，记录 commit、包 SHA256、宿主/平台版本及所用模式。
7. 真实宿主至少验证标准模式绑定问答、溯源、重启续接、异常提示及卸载后可读；跨网络测试用有权访问两个测试网络的身份。需要改用户环境或产生真实模型调用时，先核实已有授权并遵循仓库的备份与还原约束。

开发交付应逐项回填：解决了哪个 R/U 项、实现位置、测试结果、真实宿主证据、剩余限制。若经核实某项不成立，给出可复现的反证及适用条件，不以现有测试全绿代替解释。

本报告没有授权提交、推送、发版、删除用户会话或修改凭证。后续 agent 按用户分配的实际任务执行，不要将本报告的修复建议当成对外操作授权。
