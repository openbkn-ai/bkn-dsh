# M5：端到端问答验证记录

> **注记（2026-09-20）**：本文为当时证据快照，部分内容已被后续修改取代——
> ① `runtime/prepare-compatible-runtime.mjs` 的 LOCAL-ONLY workaround 已随 BLOCKER-3 修复删除（osx-sign 处理折叠进补丁 0003，恢复 frozen 安装）；
> ② 「401/403 + permission_denied → LICENSE_REQUIRED」已按复审收窄：401 一律认证错误，403 仅在 `licensed === false` 时提示企业版；
> ③ 测试计数自 117 起随各轮新增用例增长（当前 119）。历史正文保留下文不作改写。
> ④ 「溯源视图现状」节对 403 的归因（需在管理面对 bd_public 做生命周期授权）经 v0.1.4 源码核实为**误诊**：真实原因是插件当时未发送 `x-business-domain` 头（空域被 chart 默认允许清单 `BKN_TRACE_PUBLIC_LIFECYCLE_BUSINESS_DOMAINS=bd_public` 拒绝），打通靠的是补发该头，与升级企业版/license 无关。详见 `2026-09-20-provenance-v1-v2.md` V1 修订记录。

日期：2026-09-19。环境：打包版 OpenBKN Runtime（`openbkn-dsh-runtime-0.1.6-alpha.2-openbkn.1-darwin-arm64`，bin/dsh web，端口 3082）+ supply_ontology_hand 样例 + DeepSeek 平台模型（deepseek_flash，用户提供的 API Key 经 DSH 环境变量注入，未落任何文件）。

## 运行形态
- 打包 Runtime 经 CI 对齐路径产出：`runtime:build`（pnpm 11.7 + 本地 workaround）→ `runtime:profile` → `runtime:package`，`bin/dsh web` 启动。
- 会话以 Standard 模式（非 PTC）创建，固定绑定知识网络（横幅：「This conversation is permanently bound to this OpenBKN business knowledge network. 供应链本体知识网络-手工版」）。
- 模型：DeepSeek-V41-Flash（DSH 原生 llm-deepseek 插件）。
- 工作区绑定：因浏览器内无法完成原生目录选择器，改由页面调用插件远端 `bindNetworkWorkspace('supply_ontology_hand', '/Users/kalias/Documents/workdocs/DSH_workspace')` 完成（等价于 UI 流程的数据操作）。

## 业务问答验收（3 问，全部经 MySQL 独立核对）

| # | 问题 | 回答要点 | 工具调用 | 数据核对 |
|---|---|---|---|---|
| 1 | 382-000005 有多少张销售订单？什么状态？ | 40 张，全部「已确认」；明细 SO0000001–20、SO0000501–520 | 8 次 | DB：40 张/已确认，全表 800 张 ✓ |
| 2 | 382-000005 在各成品仓的可用库存？ | 3 成品仓合计 534（苏州 325/乌鲁木齐 127/哈尔滨 82），含批次明细与口径说明 | 5 次 | DB：325/127/82，其他仓 232/44/6 ✓ |
| 3 | 382-000005 的标准交期？ | 生产固定提前期 = 1 天（自制件），含抽样对照与口径说明 | 8 次 | 与 erp_material 一致 ✓ |

每轮回答均标注数据来源（知识网络 supply_ontology_hand + 数据资源表名），并带「查看业务溯源」入口。

## Trace 留证（计划 M5.7 的 CLI 路径）
- 平台侧 interaction（与三问一一对应）：
  - `int_6bf606cea4f281f56ca66638bd8f0bbf` — 销售订单问题
  - `int_9aa7d2225b038463509c6ab2b65b6d37` — 库存问题
  - `int_dc0e24eca6ab8738002ad48e767501e6` — 标准交期问题
- 操作明细：`openbkn --json trace interactions operations int_dc0e24ec…` → `query_object_instance`（op_5e74f405…，receipt rcpt_f1080801…，receipt_status=completed，evidence_durability=durable）
- 会话 id：conv_299543a4e99e378666c50d4bbcb40432

## 溯源视图现状（限制记录）
- 每轮回答下方有「查看业务溯源」按钮；点击后打开溯源面板（执行溯源 / 业务上下文图 / 证据链 三个标签），但数据读取失败。
- 根因：面板读取走 `/api/agent-observability/v1/interactions/{id}/operations|business-graph`，平台对该业务域返回 `permission_denied（请求的业务域未获准执行公共生命周期写入，required_action=request_authorization）`——需要在平台管理面对 bd_public 域做生命周期授权；同数据的 CLI 通道（trace interactions operations / receipts get）读取正常。
- 结论：溯源数据完整存在于平台并可用 CLI 取证；面板数据读取受平台域授权策略限制，属平台侧配置项，不是插件缺陷。

## 环境记录
- DeepSeek API Key 仅通过环境变量 `DEEPSEEK_API_KEY` 注入 DSH 进程；OpenBKN Token 只存在于 DSH credentials 与 CLI 凭证存储，未写入任何 YAML/代码文件。
- `~/.dsh/settings.yaml` 的 `agent-presets` 已从 `ptc` 改为 `standard`（备份：/tmp/settings.yaml.bak）。原因：dsh-v0.1.6-alpha.2 源码 dev 模式下 PTC 工具派发存在 `Cannot read properties of undefined (reading 'prepare')` 缺陷（工具调用必失败）；Runtime 分发路径同样以 Standard 模式验证通过。
- `runtime/prepare-compatible-runtime.mjs` 有一段标注 LOCAL-ONLY 的 workaround（剔除 alpha 锁文件中 deploy 闭包未使用的 @electron/osx-sign 补丁行 + 非冻结安装），是本地 pnpm 11 构建所必需；是否保留由用户决定（CI 用 pnpm 10 不受影响，但 CI 对该 alpha 锁文件会报 patchedDependencies 配置不匹配——属上游需重新生成锁文件的问题）。

## 修复跟进（提交 issue 后完成）
- 上游 issue：openbkn-ai/bkn-dsh#22（已提）；kalias 已评论认领并推送修复分支 `feat/dsh-0.1.6-alpha.2-compat`（fork: kalias/bkn-dsh）。
- 插件修复（已实测验证）：platform-reader 将 401/403 + `error.code=permission_denied` 分类为 `LICENSE_REQUIRED`；`getTurnProvenanceView` 抛 `openbkn/provenance-license-required`（含平台 license edition）；溯源面板据此渲染「业务溯源为企业版能力…升级并激活企业版权证后即可查看」提示（截图见会话记录）。117/117 测试通过。
- 会话重载修复：compat 新增 0003-plugin-ignorable-session-events.patch（`Session.append` 非界面事件接受 `LogOnlyEventIntent`，写入侧桥接），系列补丁 0004 为 lockfile；修复前写入的会话日志已按帧结构手工补标记（备份 /tmp/session.v3.jsonl.zstd.bak），重启后 3 轮对话完整恢复。
- 修复后的 Runtime 产物已重新构建（runtime:build → profile → package）并在 3082 端口实测。

## 企业版实测（2026-09-19，用户升级企业版后）
- 平台许可：`{"licensed":true,"edition":"enterprise","features":[...,"business_provenance"]}`。
- **溯源面板全部打通**：执行溯源（6 个操作事实，含 Request/Trace/Receipt 全链路 id）、业务上下文图（企业投影渲染物料对象+属性+知识网络节点，RESOLVED）、证据链（DTO 未定义的占位，插件既有设计）。
- 前置原因与最终修复：observability 路由要求请求携带 `x-business-domain` 头（企业版按域鉴权）。platform-reader 已补发该头（默认 bd_public，可由配置 businessDomain 覆盖），commit 28eea4c。
- 环境备注：宿主通过 credentials 保险库取令牌，外部手动 `openbkn auth token` 刷新会使面板已同步令牌失效（测试期假象），重新打开面板即自动重同步。
