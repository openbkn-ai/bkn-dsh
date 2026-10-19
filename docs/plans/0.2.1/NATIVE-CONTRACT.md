# 0.2.1 原生溯源读取合同（2026-10-18）

2026-10-19 补充：后续正式验收按 [ACCEPTANCE-CONTRACT.md](ACCEPTANCE-CONTRACT.md)，仅使用本机 `https://192.168.50.129`。下文 50.28、EE/Studio 快照和既有非空样本保持为历史证据，不是本轮测试目标或正式发布平台验收。正式 `v0.2.0` 的采集关闭状态仍保留 managed 身份；插件 handle 可以保留该身份对及 `recording=disabled`，但不请求或声称已有记录证据。旧版无身份降级独立保留。新正式 schema 与 lifecycle fixture 是源码投影；原生 detail/explanation 在正式本机部署上的非空、权限与 UI 对照仍待执行。

本轮已在现有部署上通过 #93 的最小真实数据门槛：当前 CLI 凭据能读取原生 detail 和既存非空 explanation，并与原生 Studio 中同一会话、问答和业务记录对照。此结论仅适用于下述环境；不等于固定候选包的 DSH 实机验收、受限账号验收或普遍平台兼容性。

实现提交：`4857c31225576f4f4b083ca26bb9469ab671b363`，分支 `feat/021-localization-login`。完整执行结果见 [开发证据](../../evidence/2026-10-18-021-development.md)。旧范围快照和归档身份清单保持原样。

本地评审修复提交：`1f7bc6bf11a10ac4bc69b125fd451d4afe69887c`。修复结果预算和 UTF-16 计数，并补充边界/选择测试；没有重新执行本节真实平台读取或获得新的 DSH 实机证据。

跨视图联动提交：`ce8ebcb8c4f396c39e1db77fa8b235efe9cbc921`。只消费既有 DTO 的公开引用，补齐步骤/执行节点/来源/证据/业务定义与处理的选择导航；19 项新增受控测试通过，没有增加 API、DTO 字段或平台写入。

2026-10-19 边界修复提交：`542b3dd9127a7c9d9ba0f263fa2eee3c0e8814e8`。补齐 schema/argument 引用合同、explanation timeRail 唯一性、已加载回答同步隔离、平台 invalid 原状态/原因展示与分页。新增 20 项回归；插件 540 项中 539 pass、1 Windows skip。没有新增真实读取、平台写入或候选实机验收；以下真实数据仍是 2026-10-18 的历史证据。

第二轮联动/来源修复：`902f337b9e0859ea42f3c76f82161d180edf4f78`。修复共享定义误联、重复跳转、跨列表分页，分别展示原始记录和解释记录中的问答；新增 21 项回归，定向 115/115、插件全量 561 项中 560 pass、1 Windows skip。此为本地受控结果，没有新增平台或宿主实机验收。

共享输入选择修复：`5b5f2f582f60b4fe73399820ba87d612c4fb6dd0`。修复回溯遇到公共输入时扩展另一查询的误联；直接选择共享输入仍保留两条查询，平台明确披露的结果依赖也保留。新增 18 项回归，两个选择文件 75/75；插件全量 579 项中 578 pass、1 Windows skip。未修改平台/模型输出，未新增真实平台或宿主验收。

## 真实读取及页面对照

- 平台：`https://192.168.50.28`；OpenBKN CLI **0.2.0**，用户自行完成登录后读取现有凭据。
- Interaction：`int_f35935e702d1a01c91e42253f881e02c`。
- Conversation：`conv_2e0aca17afb184e741447d01b611175e`。
- 网络：`worldcup_vega_catalog_bkn`。使用既有世界杯样例记录，没有新建 Interaction、重跑业务查询或调用模型制造样本。
- 两个具体对象 GET 均为 **200**；既存解释 `schema_version="1"`、`status="ready"`，外层及 view 的 Interaction ID 一致。含 **3 条结论、1 项需求、1 条调用事件**。
- 原生页面核对路径：可观测性 → 业务溯源 → 该世界杯会话 → 时间链 / 证据链。页面显示同一会话、问答、一次赛事查询，以及三条结论和业务函数的输入、处理、输出。只读取页面，没有点击“更新依据”或分析按钮。
- 最终以**本次实现的 `OpenBknPlatformReader` 和 Node 默认 fetch**再次读取成功。使用现有开发 CA 的 `NODE_EXTRA_CA_CERTS`，TLS 校验开启；没有修改系统信任库或关闭校验。投影后的 native 整体为 **119,886 字节**（该样本），调用记录完整性为平台返回的 `complete`，不表示整个答案正确。
- 真实 API 读取与原生网页核对不证明新插件已被 DSH Desktop/npm 实际加载。网页使用现有管理员会话；CLI 列表属于其授权 owner scope，不据此宣称两种身份的全量列表或权限等价。

## 公开合同及投影

前缀：`/api/agent-observability/v1/business-provenance`。

| 读取 | 校验及返回 |
|---|---|
| GET `/interactions/{id}` | 精确 Interaction ID；有界 time rail 元数据、平台记录问答、正式披露的主操作网络、调用记录完整性与缺口。去除 inline 输入/输出、原始 payload。 |
| GET `/interactions/{id}/explanations` | schema 必须为字符串 `"1"`；`not_generated` 单列；ready 必须有 generated_at、同一 view.interactionId 和合法字段。保留需求、结论、归因/支持状态、图、问答对、业务函数与输入/处理/输出、计算依据、正式关系和 notices。 |

本轮插件没有生成解释的 POST 入口。打开、切换视图和选择记录均不 POST、不调用业务工具。不生成时提示到原生平台显式操作；平台生成可能调用模型和持久化结果，不属于本轮已执行操作。

合同依据：Studio `c778f73bdd50370e792dba9706e0ec95fd074d72` 的 `evidence-chain.types.ts`、`current-explanation.service.ts` 和 `business-provenance.service.ts`，EE `aa6b3826ff0ce7150da011121c448ca575cedfa3` 的 HTTP handlers，再以本次真实 schema-1 样本检查投影。是公开字段的轻量适配，没有导入 Studio 应用或私有 UI 实现。

## 身份、关系和降级

- Remote 仍只接受已有 DSH session/message。Host 从已关联 handle 获得 Interaction ID，不接受浏览器给任意 Interaction、网络、URL 或 token。
- 请求前保留平台 fence；响应后核对绑定身份和凭据代际。绑定比较平台/网络字段，而不是每次读取产生的对象引用。显式披露的主操作网络冲突时拒绝整个 native 投影。
- 两个新接口独立记录诊断 subject；解析、结构、身份和投影校验之后才记录读取成功。scope、总体投影另有 subject，其他接口成功不会消除其失败。
- UI 只使用平台明确披露的 claim.nodeIds、支持结论 ID、Operation ID 和图关系。数值相等、时间相近、名称相似都不补边。缺失端点保留引用记录，不制造节点。candidate / unbound / missing / partial 原样显示，不改为已确认。
- 选择状态使用实体类型+ID 区分。来源/输出/定义引用与执行节点引用可跨标签导航，只有可唯一解析的公开目标才可点击。步骤与精确事件须同时匹配 timeRailItemId、Operation ID、attempt；操作级引用可保留多尝试关联，具体步骤不串选其他尝试。问答对切换清除选择，不混用顶层和问答对 evidence edges；只改变 Client 状态，不因点击关联重读或生成解释。
- `schemaRefs` 只按公开合同定位原 ID 或 `schema:` 前缀节点；两者都存在时保留歧义。managed argument 的 `sourceKind: function_argument` / sourceRef 是 Operation 引用，列出已披露步骤，无步骤时显示该操作已有事件；不映射到同 ID 证据，也不任选某次尝试。合同依据为同一 EE 的 `evidencechain/v016_contract.go` 545、711–730 行。
- 函数及关系的 `validationStatus`、`reasonCode` 原样展示，包括 invalid 和未知状态；同问题未关联记录也保留可查。invalid 不触发删除、重判、改写关系或 invalid-response，关联只用于导航，不代表平台或插件确认结论。平台缺失/歧义的引用仍保持文本。
- `uses_schema` 按固定合同的函数→定义建立导航依赖；关系 Operation 信息不归属为 schema 的执行。具体结论/证据/执行/事件/步骤的选择不经共享定义带入另一独立处理链；直接选定义时仍可检查其全部已披露使用者。异常端点角色保留原边/端点入口但不猜依赖，不改写平台状态。
- 共享具体输入按平台披露的 `businessInputs.sourceRef` / `evidenceRefs` 索引。回溯到共同输入只保留上下文，不将它当作新的活动选择；直接选共同输入仍关联全部公开使用者。执行→输出→处理的补充定位只依据活动目标的下游引用，不据公共祖先增加另一分支。平台明确披露输出被另一处理消费时保留该依赖，不自行拆分、合并或裁决查询；原节点/边/状态/原因与模型答案保持原样。字段依据为同一 EE `v016_contract.go` 833–847 行及 Studio `evidence-chain.types.ts` 137–143 行；共享输入回归是合成样本，实际部署拓扑仍待核验。
- 平台原始记录和解释记录中的问答分开标注。detail 合法缺少字段时明确提示“未披露原文”，不判断未记录、读取失败或权限原因；解释问答仍以独立来源可展开查看。两来源不互补字段或裁决正确性，显式空字符串保持原值。不提供 DSH 最终答案逐字锚点，不传 answerRange，不改写模型答案。
- 关闭面板发出本次读取的取消信号；结果按本地请求代际绑定 session/message，在渲染时同步检查，已加载旧内容不会进入新请求首次提交。语言切换只重绘，不重建请求或业务连接。此为受控组件/信号证据，实际 DSH Remote/CLI/HTTP 退出仍待验收。

| 情况 | native 状态 |
|---|---|
| 已存解释 ready、合法空结论 | 都是合法 ready；空结论有单独文案 |
| `not_generated` | `not-generated`，不当错误或空证据 |
| 401 / 缺凭据 | `authentication-required` |
| 403 | `access-denied`，不推断许可原因 |
| 404 | `not-disclosed-or-unavailable`，保留路由/记录未披露歧义 |
| schema、身份、类型、枚举或重复 ID（含 explanation timeRail）无效 | `invalid-response`；不去重、改名或挑选尝试 |
| 平台函数/关系明确返回 `validationStatus: invalid` | 合法记录；保留原状态、原因和导航，不由插件重新裁决 |
| 读取 / 图 / DTO 超预算 | `result-too-large`，不静默截断 |
| 其他网络或服务故障 | `unavailable` |
| Trace 显式 disabled/unavailable | 不请求新接口，保留原始原因与本地时间线 |

真实验证覆盖 ready 非空样本；未生成、拒绝、缺路由、无效结构、预算和取消等由受控测试覆盖，未冒充这些状态均在真实部署上触发过。旧 operations/graph 与本地时间线仍可展开查看，各自降级；旧回执仍是引用，不声称独立完整回执核验。

## 冻结预算

| 层 | 预算 |
|---|---|
| 两个原生 GET | 每个原始响应 8 MiB；独立等待 30 秒，随面板取消 |
| native DTO | `native` 字段整体最多 1,000,000 字节，并遵守更小的 maxResultBytes；含 not-generated 和失败说明。超出后独立降级；若连降级说明都放不下则完全省略该字段，以外层 `sources.degraded` 的 native/result-too-large 明示原因，保留本地/历史视图。不是整个 ProvenanceView 的总大小上限 |
| 图 | top-level 与问答对投影累计最多 500 节点、1000 边；不做隐形截断 |
| 展示数组 | 最多 64 需求、256 结论、64 问答对/问答对图、500 time rail 项、128 notices；业务函数输入/输出各最多 128 项 |
| 文字 | 单个展示文本最多 16,384 UTF-16 code units；超限拒绝，不截短冒充完整 |

Client 展示另行分页：默认每页 20 条、业务处理卡片 3 项、输入/输出行各 5 项、节点/schema 引用 10 项。先切片再构建元素，显示总数/范围和翻页控件，跳转显示目标页；完整 DTO 不裁剪。分页归属以问答对、列表角色和记录 ID 区分；每次明确导航有独立本地代际，同一目标重复跳转也重新定位。跨标签返回定位活动目标，语言切换保留当前选择/分页，切换问答对或新请求重置。合法密集合成样本的渲染量测试不等同真实浏览器性能验收。

原来的 20 秒业务工具默认超时、历史图 200/400 上限和宿主/平台 pin 没有调整。
