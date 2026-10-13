# 来源说明

本文件为 GitHub #92 的归档快照，保存日期 2026-10-13。任务当前状态与后续决策以 [#92 最新正文/评论](https://github.com/openbkn-ai/bkn-dsh/issues/92) 为准；离线接手入口见 [README.md](README.md)。

---

# bkn-dsh 0.2.1：冻结范围与执行入口

冻结日期：2026-10-13（Asia/Taipei）。用户已确认本范围；当前仅建立计划与分析档案，尚未开始实现或验收。

## 目标与基线

让普通用户在 DSH 中看懂插件、登录进度与业务回答的来源。0.2.1 是本轮插件功能计划名称，不代表已升级 DSH 或 OpenBKN 平台，也不直接决定 npm 的完整版本串。

- 产品：`openbkn-ai/bkn-dsh` / `@openbkn/dsh-business-context`。
- 已发布功能基线：`0.2.0-rc.2-openbkn.0.2.0-10`，PR #89 主线合并提交 `5b885dd7492fd42951b21729984f0d1e99da8b0d`。
- 原接受源码：`9a35c0d9d1263b5f39b24d596f07dbcedbf25d04`。
- 固定宿主：DSH `dsh-v0.2.0-rc.2` / `639ed015397290b3745d163aafe02ffee4aa3f84`。
- 0.2.0 SDK 曾使用用户授权的分支构建：`c404354793146edab944b7e5a79908bf41ddd591`；正式 npm 状态应在开工、验收和发布前重新查询。
- 当前功能边界以仓库 `AGENTS.md` / `CLAUDE.md` 为准；本计划不改变三入口、网络访问治理与原生模型作答职责。

## 本轮必须交付

| 内容 | 最小实现 | 完成条件 |
|---|---|---|
| 中英文随宿主切换 | 使用 DSH 公共 locale 服务；本插件拥有的面板、设置、CLI 检测/安装、登录、诊断、溯源文案完整 zh/en | 已打开的面板和失败状态随语言切换立即更新；不添加独立语言设置；不翻译模型回答、业务数据、协议 ID 或原始 JSON |
| 登录进度与结果可见 | 等待浏览器授权、成功、失败、超时、取消/重试、重复点击保护 | Desktop 与 npm 下用户能知道当前状态；对面板关闭/进度丢失先实证，确认插件原因后只修对应生命周期 |
| 原生业务溯源的轻量呈现 | 每条已关联回答保留入口；以“事件链 / 证据链”组织平台记录，业务名称与输入/处理/输出优先，技术细节折叠 | 读取同一 Interaction 的原生解释和关联数据；联动仅依服务器披露的关系；缺失、未生成、拒绝、不可用、部分结果分别说明，并保留可用的本地时间线和历史只读证据 |

### B1 为条件性工作

B1：历史长时运行中，重新登录/同步后列网成功，但新业务 Interaction 的 MCP 返回 Unauthorized，重启后恢复。后续短流程和自然过期复测未再现；根因仍未知。

本轮先做有边界的最小复现。只有稳定重现并证明属于插件，才增加最小修复和回归；未复现时保留开放记录，不写“已修复”，不每轮强制重复 8 小时测试。不在插件新增跨客户端 token 管理、平台轮换策略或无依据的全局重连。

## 溯源范围的明确限制

- 采用“平台原生数据 + DSH 内轻量双视图”，不搬入完整 Studio 应用。
- 打开面板默认只读。先 GET 已存在解释；`not_generated` 与错误、空证据分别呈现。
- 若提供“生成/重新生成解释”，只能用户明确点击后由 Host 调用平台 POST；说明可能调用平台配置的 Claim Agent 并写入解释结果，显示生成状态，不自动生成或重跑业务工具。
- 本轮问答/证据显示以平台记录为准；平台记录的 answer 与 DSH 最终回答可能不同。聊天正文逐字锚定不作为核心交付，除非证明文本和范围一致。
- 不添加最终答案仲裁、自动纠错回合、固定业务报表、业务计算或推断出来的证据关系。
- 不根据 `licensed:false`、403 或 404 自行宣判企业版不可用；检查实际接口、能力与响应。旧 `/operations`、`/business-graph` 可读不代表新企业端点可读。
- 不调整宿主版本、平台部署、许可策略、全局工具超时或 SDK token 轮换机制。

## 依赖顺序与估算

1. P0：用一个已有真实 Interaction 完成原生 API/凭据/非空解释样本验证，冻结 DTO 和降级语义（1–2 人日）。没有可用契约时说明阻碍，不擅自改平台或悄悄降低目标。
2. P1：语言字典与登录体验可独立推进；新溯源 UI 与双语同时设计。
3. P1：Host 读取、校验与有界投影 → 事件链/证据链 UI → 受控测试。
4. P1：B1 最小复现；仅确认插件缺陷时接入最小修复。
5. 固定 CI 候选 → Mac 受影响实测 → PR → Windows 独立 handoff 与最小复测 → 发布准备。

原先 zh/en 估算 4–6 人日；加入原生溯源后，推荐溯源方案约 8–12 人日，整轮约 **12–18 工程人日**（翻译与验收复用，不简单相加）。这是规划估算，不是已执行时间、agent 墙钟承诺或固定上线日；首次契约验证后复核。若 B1 需复杂修复或平台缺接口，另行确认范围和排期。

## 交付和发布边界

- 验收只针对变化与仓库要求的发布门槛；不自动扩大到历史全矩阵、升级矩阵、长时运行或此前暂缓项目。
- Mac/Windows 各覆盖 Desktop/npm：语言切换、登录状态、同回答溯源读取、双视图联动、降级、脱敏导出；条件性缺陷只验证受影响路径。
- 测试、真实宿主、实际平台读取、真实模型评测和人工可读性验收分开记载；不把 fixture 当实机或把 completed 当回答正确。
- 包身份固定到 source/CI/tgz SHA/逐文件清单；包内容变化后重出候选并只复跑受影响项。主线与公开包必须对照接受候选；`latest` 最后迁移。
- 当前授权只固化项目范围与分析，不自动授权开发、平台写入/部署、合并、tag、npm publish 或 dist-tag。
- 后续执行先核对本会话与当时的授权，按仓库发布规则推进；PR 和 commit 内容必须英文。


---

# 原生业务溯源可行性分析（归档）

分析性质：此前已完成源码/契约检查，2026-10-13 建档并复查关键文件。没有据此宣称新企业端点已在 CLI 凭据下实机通过，没有运行新的 Host、业务查询、解释生成或模型评测。

## 结论与方案取舍

技术可行，推荐在插件中实现轻量“事件链 / 证据链”，复用平台原生业务溯源数据和交互语义。插件负责绑定、授权访问与展示；平台负责业务语义、证据生成，模型负责自然语言答案。

| 方案 | 估算 | 判断 |
|---|---:|---|
| 只整理现有三标签内容 | 3–5 人日 | 改善布局，但拿不到原生解释、需求/结论关系和丰富的来源细节，不作为已批准目标的替代品 |
| 原生接口 + DSH 轻量双视图 | 8–12 人日 | 本轮推荐并纳入范围；复用现有授权/Interaction 框架与平台解释，不复刻后台 |
| 完整移植 Studio 工作台 | 20–30+ 人日 | 涉及应用依赖、全局导航、历史浏览、分析任务与权限适配，本轮排除 |

## 当前插件链路与可读性问题

`McpClient → bkn_start_interaction → 业务工具 → bkn_finish_interaction → 同一回合最终 assistant 消息关联 → getTurnProvenanceView()`。

服务验证绑定与平台身份，读取 `/api/agent-observability/v1/interactions/{id}/operations` 和 `/business-graph`。现有执行溯源/业务上下文图/证据链三个标签共用这些读取；证据链主要是 Operation/Receipt 引用与 CLI 查看提示，不是独立 receipt 全文请求，不能宣称完整回执核验。

现有布局偏协议字段、技术 ID 和分散的列表；用户需要理解“问了什么、经过什么处理、结论依赖什么来源”。新视图应业务名称优先，过程和证据可联动，技术细节保持可展开但不占第一屏。

## 原生平台已经提供的合同

完整 API 前缀：`/api/agent-observability/v1/business-provenance`。

| 接口 | 已核对的作用 | 0.2.1 使用范围 |
|---|---|---|
| GET `/interactions/{id}` | 当前 Interaction 的 time rail、问答、操作解析、业务对象、查询/上下文/派生事实等 | 按真实字段需要读取并投影；不要为了补展示去重新调用业务工具 |
| GET `/interactions/{id}/explanations` | 已存当前解释，`schema_version="1"`、精确 interaction ID、`status=not_generated|ready` | 面板首次打开的只读入口；结构校验后才记成功 |
| POST 同一 `/explanations`，body `{}` | 生成当前解释；原生前端设置 120 秒等待 | 仅显式用户动作；独立于全局 20 秒业务工具超时，不默认打开就生成 |
| conversations/interactions 分页、markdown、analysis SSE/history | 全局工作台与分析优化功能 | 本轮不引入 |

原生 `EvidenceChainView` 包含 question/answer、requirements、claims、execution/evidence graph、notices、generationStatus、questionPairs、selectedPairGraphs、timeRail 等。只展示合同正式披露的关系；相等值、时间接近、模型叙述不能作为补画关系的依据。checked/located 等状态也不是“整个回答已正确”的保证。

## 认证、版本与数据身份

- Host 根据当前 DSH session/message 已验证的 handle 获取 interaction ID；不接受浏览器/模型任意指定外部 ID、网络、URL 或凭据。token 保留在 Host，浏览器只收脱敏、授权、有限大小的 DTO。
- 后端新能力的源码有 `business_provenance` 企业组装/可用性检查，并授权到具体 Interaction 和 access-profile fingerprint。未达到 EditionEnterprise 时可能普通 404；404 同时可能是对象未披露/路由缺失，因此前端不要猜 license 根因。
- 无 license 平台上旧 operations/graph 全功能正常的历史实测，不等于新 explanation API 已授权。
- 平台解释所用的 recorded answer 不保证与 DSH 最终 assistant 文本字节一致。先在溯源面板清楚标为平台记录；若要正文锚点，必须证明文本、Unicode 位置与范围一致，不能强改模型答案来匹配。
- 登录同步、切换 binding、面板关闭/重开时用已有请求身份/取消机制拒绝陈旧结果，不让旧权限或旧回答的结果冒充当前结果。

## 组件复用与大小限制

原生 Studio 场景依赖 AntD、Studio HTTP/上下文、路由、样式及 react-i18next；并非可直接安装到 DSH 的独立组件。优先复用契约和纯展示逻辑，按 DSH 公共 UI/locale 服务做小适配；不导入完整应用或私有页面内部模块。

当前插件默认：请求 30 秒、业务工具 20 秒、结果 1,000,000 字节、图 200 节点/400 边；已读 operations 与 graph 的原始读取上限和投影上限不同。原生证据视图预算约 8 MiB、500 节点/1000 边。必须为新增展示明确网络读取/DTO/UI 三层预算，并保留 partial/gap/notices，不能静默截断后显示完整；不为新视图一概提高全局默认值。

平台 #2128 的大历史数据限制、后端缺失证据和超预算失败仍归平台，插件展示优化不能补回数据。

## 首阶段必须解决的未知

1. 当前 CLI 授权凭据是否能读取新企业端点；部署是否包含对应能力。
2. 至少一个已有真实非空 Interaction 的解释字段、ID/网络关系与原生页面一致；不拿空返回证明完整能力。
3. 已存在解释能否直接读取；未生成/无授权/不存在/结构不合法/部分结果的真实合同如何区分。
4. GET 与显式 POST 的独立超时、取消、错误和平台生成费用/模型条件；不因客户端等待失败就声称平台未写入。
5. 能否只靠公开合同完成轻量 UI，不引入全局历史导航、正文锚点或上游修改。

前两项未通过时记录阻碍与平台依赖，向用户提出有限选项；不自行把方案改成完整 Studio 移植或插件计算解释。

## 已检查的源码入口

插件路径前缀 `packages/openbkn-business-context/src/`，以上插件基线可用固定提交链接定位：
- `business-context-service.ts`：`remoteGetTurnProvenanceView()`。
- `platform-reader.ts`：现有 operations/graph 请求及分类、结果预算。
- `provenance-view.ts` / `types.ts`：受控投影与 ReceiptRef。
- `native-mcp-provenance.ts`：finish 和最终消息关联。
- `client/ProvenanceOverlay.tsx`：现有三视图。
- `config.ts`：预算与超时。

原生 Studio `bkn-studio`：本地分析提交 `c778f73bdd50370e792dba9706e0ec95fd074d72`；release/0.2.0 检查提交 `a7d00ddb83835c1f2ec7da1429ebce4b1a976086`。此前已核对以下四文件远端与本地字节相同，不把此结论延伸为整个应用一致：
- `src/modules/bkn-trace/business-provenance/business-provenance.service.ts`
- `src/modules/bkn-trace/evidence-chain/current-explanation.service.ts`
- `src/modules/bkn-trace/evidence-chain/CurrentExplanationPanel.tsx`
- `src/modules/bkn-trace/evidence-chain/evidence-chain.types.ts`

EE 后端 release/0.2.0 `aa6b3826ff0ce7150da011121c448ca575cedfa3`：`bkn-trace/agent-observability/businessprovenance/http.go`、`current_explanation_http.go`；此前核对这两个文件远端/本地字节一致。开工应重新核查目标部署与 upstream，不自动更新 pin。

DSH locale：`packages/client/locale/README.md`，公共 API `ctx.locale.register(ns, { zh, en })` 与 `ctx.locale.bind(ns)`。稳定错误码/参数留在控制器，渲染时翻译，已打开状态随 locale revision 更新。旧 223 个汉字片段/10 个客户端文件清单只是旧规划快照，新增 -9/-10 内容必须重新盘点。


---

# 本轮排除与外部跟进

本表为 2026-10-13 规划时的归属/边界记录，不替代 upstream 最新 issue 或现场诊断。外部源码合并与实际部署、生效、实机验收分别记录。

| 侧 | 项目 | 暂不并入 0.2.1 核心的理由 |
|---|---|---|
| 插件 | B2：诊断入口坏导入时首次配置不可用 | 属三入口服务归属/架构限制，不借溯源或双语重构扩大处理 |
| 插件 | 主动连接复测 | 当前重新采集为被动采集；本轮没有新增主动探针/自动修复的需求 |
| 插件 | 全局 20 秒超时优化、原故障用户机器根因 | 分别需逐层计时和真实用户报告；不能靠 UI 改造猜根因或放大默认超时 |
| 插件维护 | #62/#63 仍开放、文档 PR #90、评审自动化 PR #51 | #62/#63 的修复已有发布历史，状态清理不是重复开发；其他 PR 独立处理 |
| DSH/环境 | 隔离 Desktop 带入旧模型 Key；Windows pnpm 卸载 EPERM；欢迎向导重现 | 需定位宿主/系统存储或包管理器；插件不重写宿主设置和安装器，EPERM 保留已知限制 |
| DSH/环境 | 浏览器下载/保存窗口；实际 Host/已加载版本公共识别；MCP `_meta` 保留 | 原因或稳定上游入口未证实，不能以猜测替代信息，继续跟进对应宿主边界 |
| DSH/环境 | 手动关面板取消登录与浏览器退出的完整定责 | 登录进度任务只修已实证的插件生命周期；历史 B3 补证按用户决定暂缓，不据此声称宿主根因 |
| OpenBKN/SDK | npm SDK 0.2.0 正式发布/自动安装实机 | 在官方发布后验证；源构建验证不能冒充 npm 发布验收，不自动选择未发布版本 |
| OpenBKN | #2029、#2011、#2106 合并后的部署/业务确认；#2004 深层库存超时 | 平台存储、执行链、schema 和执行能力归 upstream；插件不进行 DB 迁移或重复业务计算 |
| OpenBKN | #2128 大历史溯源预算、证据截断 | 新 UI 必须诚实显示部分/不可用，但不扩为后端限额和存储修复 |
| OpenBKN/未知 | 重复 token 失效/重新登录恢复 | 与多端登录的时序相关不证明互踢或 rotation；独立 store，不在插件做跨客户端 token 管理 |
| 验收 | 受限账号 G6、所有历史长时/升级/完整矩阵 | 受限账号按用户决定未测；0.2.1 只补变化和仓库必需门槛，不以计划补造历史证据 |

本轮可交付后，再单独评估是否纳入下一版；不得以“顺手处理”为由进入 0.2.1 包。


## 关联项目与任务

[OpenBKN 0.2.1](https://github.com/orgs/openbkn-ai/projects/12)。以下任务均为计划，尚未实现/验收；依赖与发布边界按本总览执行。


## 执行任务索引（当前均未完成）

- [ ] [plan(0.2.1/P0): 原生业务溯源 API、凭据与非空样本验证](https://github.com/openbkn-ai/bkn-dsh/issues/93)
- [ ] [feat(0.2.1/P1): 插件完整 zh/en 文案随 DSH 语言切换](https://github.com/openbkn-ai/bkn-dsh/issues/94)
- [ ] [feat(0.2.1/P1): 登录等待、结果与重试状态可见](https://github.com/openbkn-ai/bkn-dsh/issues/95)
- [ ] [feat(0.2.1/P1): 原生溯源 Host 接口、有界 DTO 与诚实降级](https://github.com/openbkn-ai/bkn-dsh/issues/96)
- [ ] [feat(0.2.1/P1): 事件链与证据链双视图、选择联动和业务详情](https://github.com/openbkn-ai/bkn-dsh/issues/97)
- [ ] [investigate(0.2.1/P1): B1 最小复现；确认插件根因后再修](https://github.com/openbkn-ai/bkn-dsh/issues/98)
- [ ] [test(0.2.1/P1): 固定候选 Mac/Windows 最小验收与发布准备](https://github.com/openbkn-ai/bkn-dsh/issues/99)

执行顺序：01 → 04 → 05 → 07；02 与 03 可独立推进并与 05 集成；06 为条件性调查，不默认承诺修复。每个任务正文包含责任边界、依赖与完成标准。
