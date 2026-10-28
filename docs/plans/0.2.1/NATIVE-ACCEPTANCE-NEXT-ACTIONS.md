# 0.2.1 原生业务溯源：当前证据与最小后续动作

## 当前状态：Windows 原生 UI 补证有界收尾（2026-10-29）

#93已完成企业既存样例API/Studio同记录对照；#97已在固定 `0.2.1-rc.3-openbkn.0.2.1` 候选、官方DSH rc.3 npm/Web隔离Host完成三条非空结论、当前问答切片11条关系、来源及步骤/定义联动，十项聚焦对照通过。二者均已关闭completed、Project 12 Done。Mac只读回放由公开Session/Workspace API建立，不是新模型回合；见[#93对照](../../evidence/2026-10-27-issue93-native-studio/RESULTS.md)及[#97结果](../../evidence/2026-10-28-issue97-native-linkage/RESULTS.md)。

新增[Windows公开补证及接收边界](../../handoff/2026-10-27-release-021/native-ui-supplement-windows/RESULTS-native-ui-supplement-20261028.md)：同一固定候选在官方rc.3 Desktop上，指定既存记录的原生GET读取、三条结论、当前切片11条关系和主要来源/步骤/定义展示，按远程报告接收为 **PASS_WITH_LIMITS**。Windows采用直接构造存储的回放，本地答案正文来自另一条旧会话，答案归因绑定 **NOT_VALIDATED**；不冒充Mac公开API流程或新模型端到端。schema引用强制切换证据视图 **UNKNOWN/证据不足**；早期渲染崩溃唯一根因 **UNKNOWN**；真实业务CSV条件项 **NOT_RUN**。后续成功不覆盖首次FAIL/BLOCKED，也不由Mac通过代填Windows子项。任务GUI须继承 `DSH_HOME`、`BKN_CONFIG_DIR` 和任务CA配置，避免CLI取token时落入默认配置。

主会话仅核对六份公开Git文件、摘要和校验输出，未取回Windows私有截图/AX/崩溃/注册表原件；manifest为206条私有文件SHA256加1条说明。更正后的六份公开文件按字节纳入本次从main建立的干净文档分支，不合入旧结果提交的历史；既有公开历史未改写，不因本次脱敏而消失。固定候选82文件及profile回补12文件的保全、后期实例菜单退出和收态按远程报告接收，不外推全部Windows形态或平台0.2.1。`formalAcceptanceEligible=false`及原平台PARTIAL/空结论保持。

#2573仍为平台侧OPEN，维护者已明确指派可观测性负责人 **leecky** 并读回确认；本次不改变issue状态/项目阶段，不把企业样例可读称为原平台已修。旧“未分派”文字仅为当时事实，当前不再列为待办。完整模块分工以工作区项目规则为准，不另复制负责人表。

本次只收尾脱敏材料和六份计划/合同台账，通过必要独立评审及默认CodeQL后合并；不运行构建、测试或发布CI，不启动Host/平台/模型，不重跑已过项，不改固定包、现有Host、正式0.2.0/数据配置及冻结-30/-31/-32。`latest`推广和本机npm CLI仍由维护者处理，不新增工程或补证门槛。下方2026-10-28及更早检查点均保留其历史身份，不覆盖本节。

## 固定身份与发布状态

- 插件：`@openbkn/dsh-business-context@0.2.1-rc.3-openbkn.0.2.1`。实测采用 CI [40361613728](https://github.com/openbkn-ai/bkn-dsh/actions/runs/40361613728) 的固定 tgz，SHA256 `27ccf15c46e4f71ef850ee481e22556b70f4d4795e89d7d587a2e3210fc6b3e3`，232091 字节、82 文件；演示收尾字节未变。
- PR106 已合并源码；main build-only CI40368159024 和发布 CI40369214007 已完成，公开包与接受候选的差异仅为等义 package.json 序列化。[Release](https://github.com/openbkn-ai/bkn-dsh/releases/tag/v0.2.1-rc.3-openbkn.0.2.1) 保持 prerelease。[PR109](https://github.com/openbkn-ai/bkn-dsh/pull/109) 已经独立评审、合并；不再列作待办。
- 本次原生演示为 macOS、官方 DSH `0.2.1-rc.3` npm/Web、新隔离 profile 和工作区。OpenBKN 平台与 CLI 实测仍为正式 `0.2.0`；包名中的 OpenBKN `0.2.1` 是发布标识。
- 演示曾经维护者明确批准临时启用同一 0.2.0 Core 的官方 EE 开发模式服务，结束后已恢复原正式 0.2.0 服务。该证据不等于默认社区部署具有原生路由、正式企业授权或生产 EE 验收，也不转记 Windows/Desktop 或平台 0.2.1 验收。
- `latest` 推广和本机 npm CLI 由维护者自行处理；本会话不登录 npm、不修改 dist-tag，不代为转正式 Release。

## 已有真实证据与仍缺的证据

本页为脱敏摘要。原始 API 响应、截图、运行与收态记录私有保留；不向公开仓库附业务行、原问答、账号/记录身份、凭据、数据库备份或私有 EE 源码/制品。原50.129演示结论仍为 **PARTIAL，formalAcceptanceEligible=false**；下表的解释状态/独立读回/环境恢复行属于该历史演示。本轮企业既存样例补证只完成#93/#97自身标准，不冒充全局正式验收。

| 范围 | 已验证事实 | 仍未完成或不得外推 |
|---|---|---|
| 实际加载、真实读取 | 固定候选在实际页面显示正确版本，3 个组件运行；一个小型只读模型回合完成，返回 5 行、总记录数 137；未改写问答/业务结果 | 不是全部业务口径的独立正确性验收；不要求为此重跑 G6/BOM/CSV |
| #93 原生接口和凭据 | 原50.129凭据/非空detail证据保留；本轮另按新增企业平台授权，复用既存样例完成同记录API/Studio问答、执行、结论字段、业务输入处理输出、Operation引用及状态对照，detail/explanations均GET 200 | #93自身标准已完成关闭；本轮API来自Studio当前浏览器会话，旧CLI/Reader凭据证据按原范围复用，不冒充账号范围等价或全形态验收 |
| #97 双视图/非空联动 | 固定候选一个隔离rc.3 npm/Web Host，企业既存记录3条结论/当前切片11条边、证据来源和步骤/业务定义跳转已核对；未披露引用保留提示，10项聚焦对照通过 | #97自身标准已完成关闭/Done；为既存记录只读回放，不是新模型回合或Windows/Desktop非空验收。原50.129字段证据及PARTIAL记录保留 |
| Windows既存记录UI | 指定记录的原生GET、3条结论/11条切片关系、主要来源/步骤/定义按远程回执接收PASS_WITH_LIMITS；[公开材料](../../handoff/2026-10-27-release-021/native-ui-supplement-windows/RESULTS-native-ui-supplement-20261028.md)和摘要已核对，私有原件未取回 | schema强制切视图UNKNOWN、答案归因绑定NOT_VALIDATED、崩溃唯一根因UNKNOWN、真实CSV NOT_RUN；不新增补测或外推Windows模型端到端 |
| 解释状态与关系 | 资源 `status=ready`，但 `generationStatus=analysis_pending`、`claims=[]`，问答切片的问题为空；顶层证据图 56 节点/93 边，当前问答切片只有 3 条 implements 边 | 不将 ready 解释为归因完成；不把顶层 93 边当作当前切片已显示/核实的支持关系，不补造 claim 或边 |
| 独立读回 | 同一 Interaction、3 个 Operations/Receipts 身份对应；Core 后续为 `execution_status=completed` / `evidence_status=partial`，3 个 Receipt 为 completed / `evidence_durability=pending` | completed 不等于证据完整；解释缓存仍为生成时 assembling/analysis_pending，未自动 POST 刷新或用重复生成隐藏首个结果 |
| 环境收态 | 原服务 Deployment spec 和正式镜像恢复 Ready；8 个 PVC 绑定、18 项迁移账本及 400 项列定义摘要保持；任务 Host/转发停止，固定包不变 | 新演示 Agent、Session、Interaction、解释及正常授权/审计记录保留；不称全库逐字节不变 |

## 平台依赖与归属

[Foundry #2517](https://github.com/openbkn-ai/bkn-foundry/issues/2517) 已由平台完成 Community/EE 能力边界分类及文档澄清，不重开，也不继续作为当前待办。

原50.129证据通道的独立外部依赖为 [Foundry #2573](https://github.com/openbkn-ai/bkn-foundry/issues/2573)：**OPEN，已按维护者明确指示分派 leecky。** 本次不更改项目阶段，不以指派代表已开始处理；创建时Backlog/未分派仅为历史。插件侧只提供复现场景/证据和获准的集成验证，不认领平台实现。

已证实原配置 Evidence consumer 未启用，当前记录的 Evidence ledger 为零；获准的临时启用尝试在创建 reader 前被官方 `message.timestamp.type is not LogAppendTime` 守卫拒绝，尝试已撤回。Kafka 管理查询超时，精确配置值及来源 UNKNOWN；未证明这些条件是缺失问题 artifact 的唯一原因。未改 topic/ACL/offset/保留消息，未绕过检查、人工补 artifact 或合成结论。

## 已完成项与下一步

#93与#97已按各自标准完成，不重跑。下表#2573的外部处理不重新作为既有插件RC发行或已完成补证的前置；平台目标环境问题继续独立保留。

| 顺序 | 责任方 | 最小动作与交付物 | 停止条件 |
|---|---|---|---|
| 已完成 | 维护者指定归属 | #2573已指派可观测性负责人leecky，读回确认 | 指派已保存；平台issue保持OPEN，本次不改项目阶段 |
| 后续平台跟踪 | 平台负责人leecky | 依据 #2573 现有证据分类环境/配置/平台原因，提供匹配目标部署的受支持处理方案、存量证据/消息保留策略，以及可授权读取的原生 API/Studio 入口和一个小样本 | 可核对的环境/版本与读取前提已交付；需要更改现有服务/正式平台时，另经维护者明确批准后由平台侧处理。本插件任务不据此自动部署或重建环境 |
| 已完成 | 插件验收：#93 | 企业既存真实样例已完成API/Studio同记录补证，原始响应/DOM/截图私有保存，脱敏摘要及哈希已归档 | 已关闭completed、Project Done；不重跑，不将其通过外推#97或原50.129平台缺陷已修 |
| 已完成 | 插件验收：#97 | 同一企业既存样例在固定候选真实面板完成结论→证据→来源及步骤/定义跳转，复用#93 Studio对照 | 已关闭completed、Project Done；不重跑，不将其通过外推原平台缺陷已修 |
| 后续内容工作 | 演示/手册 | 可用本轮真实非空结论、选择联动、来源/步骤截图编写既存记录只读展示章节；完整操作视频尚未录制 | 明示既存记录回放与新模型端到端差别，不把原PARTIAL改写通过，不为录制另建发行体系或增加发布门槛 |

#97已复用#93核对的既存记录完成本轮，不为补表发模型或生成解释。若确实需要新增执行，仍须先核对安全条件和明确授权。面板打开依旧 GET-only，不默认触发生成。再次出现相同平台问题即补充 #2573 证据并停止受影响子项，不重跑已通过的安装/加载、UI、B1、重定向、全矩阵或业务评测。

这些缺口不重新阻塞已经完成的独立插件 RC 发行，也不默认降级完整原生溯源承诺。历史 FAIL/UNKNOWN/BLOCKED 和已接受限制保持；仅在插件制品或相关调用边界真正改变时，才按现有规则准备新候选并复验受影响项。本轮补齐#97既存记录的只读插件联动并关闭#97，#93维持已完成，#2573不改状态；补证轮次保持固定包、Host、正式平台和冻结-30/-31/-32，未推送或跑CI；本次文档收尾仅执行必要独立评审及默认CodeQL，不运行构建、测试或发布CI。
