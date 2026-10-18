# 0.2.1 原生溯源读取合同（2026-10-18）

本轮已在现有部署上通过 #93 的最小真实数据门槛：当前 CLI 凭据能读取原生 detail 和既存非空 explanation，并与原生 Studio 中同一会话、问答和业务记录对照。此结论仅适用于下述环境；不等于固定候选包的 DSH 实机验收、受限账号验收或普遍平台兼容性。

实现提交：`4857c31225576f4f4b083ca26bb9469ab671b363`，分支 `feat/021-localization-login`。完整执行结果见 [开发证据](../../evidence/2026-10-18-021-development.md)。旧范围快照和归档身份清单保持原样。

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
- 平台问答明确标注为平台记录；不提供 DSH 最终答案的逐字锚点，不传 answerRange，不改写模型答案。
- 关闭面板取消本次 Remote/HTTP 读取；旧响应不会写入重开的面板。语言切换只重绘，不重建请求或业务连接。

| 情况 | native 状态 |
|---|---|
| 已存解释 ready、合法空结论 | 都是合法 ready；空结论有单独文案 |
| `not_generated` | `not-generated`，不当错误或空证据 |
| 401 / 缺凭据 | `authentication-required` |
| 403 | `access-denied`，不推断许可原因 |
| 404 | `not-disclosed-or-unavailable`，保留路由/记录未披露歧义 |
| schema、身份、类型、枚举或重复 ID 无效 | `invalid-response` |
| 读取 / 图 / DTO 超预算 | `result-too-large`，不静默截断 |
| 其他网络或服务故障 | `unavailable` |
| Trace 显式 disabled/unavailable | 不请求新接口，保留原始原因与本地时间线 |

真实验证覆盖 ready 非空样本；未生成、拒绝、缺路由、无效结构、预算和取消等由受控测试覆盖，未冒充这些状态均在真实部署上触发过。旧 operations/graph 与本地时间线仍可展开查看，各自降级；旧回执仍是引用，不声称独立完整回执核验。

## 冻结预算

| 层 | 预算 |
|---|---|
| 两个原生 GET | 每个原始响应 8 MiB；独立等待 30 秒，随面板取消 |
| native DTO | 整体最多 1,000,000 字节，并遵守更小的 maxResultBytes；超出后独立降级 |
| 图 | top-level 与问答对投影累计最多 500 节点、1000 边；不做隐形截断 |
| 展示数组 | 最多 64 需求、256 结论、64 问答对/问答对图、500 time rail 项、128 notices；业务函数输入/输出各最多 128 项 |
| 文字 | 单个展示文本最多 16,384 UTF-16 code units；超限拒绝，不截短冒充完整 |

原来的 20 秒业务工具默认超时、历史图 200/400 上限和宿主/平台 pin 没有调整。
