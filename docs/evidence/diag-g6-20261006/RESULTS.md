# CI 候选 G6 真实模型与 macOS 业务回归

2026-10-06（Asia/Taipei）。**G6 未通过完整门禁：正向 5/7、反向 2/3、已测合计 7/10；1 项未测。** macOS 原生名称/交期查询、重启连续会话、未绑定调用拒绝及 PTC 拒绝已验证；溯源可打开，保留其数据完整性限制。候选源码与 tgz 本轮没有变化。

## 身份与环境

| 项目 | 实际运行 |
|---|---|
| 候选源码 | 144afa503c7d4746cbef01f74eaceff293b88cb5，fix/diagnostics-d0-s2 |
| CI | [37337765993](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37337765993)，build-only，publish=false |
| tgz SHA-256 | ffcd77722e83a003fe90e0dda296a3a49c3f2ba67bddda9095575dabd896ef43 |
| 安装身份 | 同一 CI tgz；65 个安装文件逐项匹配，[安装清单核对](installed-identity.json) |
| Host | 官方 macOS DeepSeek Harness.app 0.2.0-rc.2；随附 CLI 同版、Node 24.18.1；未修改运行时、未开 inspector |
| CLI / 平台 | 官方 OpenBKN CLI 0.1.5；真实 192.168.50.28、supply_ontology_hand 测试数据集 |
| 模型 | DeepSeek 官方 API，DeepSeek-V41-Flash / High，业务会话为标准模式 |
| 评测集 | docs/eval/supply-ontology.yaml，SHA-256 dfed0e81646aa28d4e4c68f83607462c428ed1423fc2c58b30c4f4b3644fcf23 |

模型密钥由用户在隔离 Desktop 设置中输入，本任务没有读出、复制或交付密钥。工作区注册与关联使用官方 Host 的 workspace/create、openbknBusinessContext/bindNetworkWorkspace API；后续会话、提问、追问和溯源通过原生 UI。系统目录选择器没有计为通过。操作数量及边界见 [run-identity.json](run-identity.json)；问答轮次与提供商 API 请求数分开。

独立 CLI 查询对照的是当前真实平台返回值，不扩大成独立数据库核验。原生轨迹的长工具结果会被 AX 截断，所存文本是 UI 证据，行尾空白已规范化、截图保留原样；完整数字对照另见白名单 CLI JSON。

## G6 逐项结果

按原评测集每条事实和禁止项评分；后续不同问题答对不会重写首次评测结果。实际布尔评分见 [g6-marks.json](g6-marks.json)，可重现输出见 [g6-results.md](g6-results.md)，调用标识及限定口径见 [case-status.json](case-status.json)。

| 场景 | 结果 | 必要依据与限制 |
|---|---|---|
| standard-lead-time | FAIL | 首次返回 1 天，但缺少自制/生产固定提前期及 erp_material 口径；随后猜测不存在的 ot_id=material，未补足证据。正确物料 ID 的独立 CLI 对照能取得这些字段。 |
| orders-count-status | PASS | 40 张、全部已确认、两个单号区间正确；run_cypher 不受支持后回退到指标查询成功。独立 CLI 40 行一致。 |
| finished-goods-inventory | PASS | 成品仓合计 534：苏州 325、乌鲁木齐 127、哈尔滨 82；明确仓范围及在途/占用口径。独立 CLI 对照一致。 |
| bom-structure | PASS | 来源、一级 9 个及前两级名称/用量可核对；回答明确展示前两级并给出全树统计，未宣称已展示五层全部明细。 |
| bom-usage-inventory | FAIL | 深度 4/5 请求超时，最终仅交付前三层 63 行；未完成“每个物料”的用量和库存，在途口径也未明确。5 层/313 行/272 物料及一级 34/0/0 与当前平台一致；不能以这些局部正确抵消缺失。 |
| purchase-flow | PASS | 区分 PR/PO、明确无可归属的未结项及关联/字段范围。独立物料编码查询 PR/PO 均为 0；模型实际 run_code 得到的 15 预测/424 MRP/69 已结 PR 未另做数据库核验。附带 BOM 333 是原始 priority=0 子件口径，CLI 核对为含根 334/不含根 333，不能与已发布 main_only 的 272 混用。 |
| sales-order-detail | PASS | 原生回答 40 行、9 个展示字段逐项对照 CLI 共 360 字段，零不一致；签约 1081、发货 1066。 |
| missing-object | FAIL | 正确说明目标无数据、目标查询均为 0，未编造目标库存/订单；但额外输出无关全表物料 3497/MRP 824，违反原用例“不输出任何非零业务数值”。 |
| invalid-token | PASS | 隔离虚构无效签名凭据触发真实 HTTP 401；本轮横幅明确要求重新登录，无业务回答/工具访问；诊断 auth-rejected/httpStatus=401。未撤销真实账号令牌。恢复默认 CLI store 后同一会话可查询 40 张订单。 |
| platform-unreachable | PASS（受控端点） | 官方 Host 请求关闭的 HTTPS 本地端点，立即失败；诊断 context-loader/network-unreachable，无业务调用。恢复真实地址和绑定、正常刷新有效登录后，同一会话 20 秒返回 40 张已确认订单。测试覆盖连接不可用端点，不代表真实集群停机实测。 |
| unauthorized-network | NOT-RUN | 用户明确没有真实受限账号。没有以虚构令牌、普通未绑定会话或模拟 403 代替权限验收。 |

反向连接用例的配置过程完整保留于 [platform-unreachable-setup.json](platform-unreachable-setup.json)。先前跨来源 mcpUrl 被凭据来源保护拒绝；全局代理先挡住 Host 自身 RPC，排除本地 RPC 后又未阻断原生 MCP。这些对照均未计为平台不可达通过。最终采用隔离 profile + 虚构 CLI 凭据 + 一条空白会话的非秘密绑定 URL fixture，离线备份后修改，测试结束恢复；Host 源码和运行时未改。

恢复后第一次重试另遇到 CLI 访问令牌过期，模型得到工具未注册拒绝，5 个 bash 试探请求均为 error，未取得业务数据；该失败留存。CLI 正常 auth token 刷新后，再通过面板“刷新状态”同步，第二次追问成功；[CLI 刷新证据](recovery-cli-refresh.json)没有令牌内容。恢复终态的 [诊断报告](platform-unreachable-restored-diagnostics.txt) 7 项 pass，其中 login-state 在同一进程显示 recovered=true/lastFailureCode=not-logged-in。跨 Host 重启的 context-loader 清除不当作同一进程恢复证据。

## 原生业务回归

详见 [regression-status.json](regression-status.json)。

| 项目 | 结果 | 实际证据 |
|---|---|---|
| R4 名称与交期 | PASS | 新标准会话返回名称、采购/生产两个固定交期值 1、自制属性及 erp_material 来源。首次简版 schema 没给单位，答案未擅自推断。它是不同问题，不覆盖 G6 首次交期 FAIL。 |
| R5 溯源三个视图 | 可打开，有限制 | 时间链、业务上下文图、证据链可打开，失败查询与 internal pending receipt 如实显示。R4 时间链 5 节点、2 个完成平台操作/receipt、正式图 33 元素/0 条视觉连线；来源网络显示未定位。召回的发起 PO 节点属于 schema 元数据，没有执行业务写动作。不能据此宣称完整图/所有 receipt 已闭合。 |
| R6 重启追问 | PASS | 旧历史与绑定保留；追问 16 秒完成。实际 start_interaction 为 continue，conversation_id=conv_21f64ffd5ba1c19f035caaa04ae60578 与 R4 相同，新 Interaction int_334efc26dcaceef02fe5175366a59d8c；追问溯源 6 节点可打开。完整字段定义确认“天”的单位；仍有一条平台 internal pending receipt。 |
| R7 普通未绑定会话 | PASS | 默认工作区普通标准会话的真实 query_object_instance 调用被绑定要求拒绝，无业务数据。工具定义可以全局可见，执行权限由 Host 拦截；跨网范围另外由已有同 CI 包 live guard 16/16 证明。 |
| R8 PTC | PASS | 绑定 PTC 会话真实提问明确要求创建标准模式会话，0 个受管业务调用。 |

该表限定本轮新增运行项目；升级/卸载与其他历史矩阵沿用各自原记录，不重新冠以本轮全矩阵通过。

## 启动异常与发布边界

首次恢复隔离 Desktop 时发生一次 desktop welcome: Web RPC failed；官方 settings/describe 边界为 gateway/definition-unavailable。该异常早于本轮连接故障 fixture，不能与后来的代理过度阻断告警混为一项。

同一 profile 暂时卸载 OpenBKN 后可启动，装回同一 CI 候选后也可启动；65 文件匹配，包源码和官方 Host 未修改。这证明恢复，根因尚未建立；不据此断定 OpenBKN 代码有错或已根治。原始 private 日志与完整 profile 均不进入交付物。

**发布验收仍未通过**：G6 三个失败需修复或明确取舍；真实权限账号场景、Windows 原生 pwsh/W0–W12 尚未验证；首次启动异常与溯源来源/receipt 完整性仍有上述限制。主动复测是用户已暂缓的可选能力。原故障用户机器尚未提供新报告，其根因仍需按 CUSTOMER-DIAGNOSIS.md 安装固定候选、复现并导出诊断来建立。

## 检查与清理

候选源码轮既有检查：build/typecheck 通过，插件 304 项（303 pass/0 fail/1 Windows-only skip）、repo suites 57/57、package audit、diff-check、pack 通过。当前新增评分器支持 not-run，3 个评分回归通过；这是仓库工具验证，与真实 G6 的 7/10 分开。

本轮桌面正常退出、owned exec exit=0，检查时无原生 App 进程；隔离业务 patch 与测试绑定逐字节恢复。用户自行配置的模型 profile 私密保留以便后续复测，未整目录归档。见 [cleanup.json](cleanup.json)。最终 Windows ZIP 的身份与静态核验见 [Windows ZIP 核验摘要](windows-handoff-validation.json)；Windows 实测结果由 Windows agent 回填。
