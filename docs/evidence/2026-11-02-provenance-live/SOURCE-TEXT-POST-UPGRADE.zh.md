# 平台更新后的受影响复核

## 本次接续结果（公开原件已核收）

维护者确认环境就绪，声明目标为OpenBKN 0.2.0正式版。Windows原会话已完成只读接续，固定CI5/source ae90365/TGZ14f4bb7f及官方DSH Desktop 0.2.1-rc.5。两份[最终公开原件](./windows-rc5/ci5-post-upgrade/WINDOWS-CI5-POST-UPGRADE.zh.md)按字节数和SHA完整接收，主会话与独立只读评审核收一致，见[核收及剩余限制](./windows-rc5/ci5-post-upgrade/INTAKE-REVIEW.zh.md)。结果为SCOPED_COMPLETED_WITH_RUNTIME_ANCHOR_UNKNOWNS，不是完整发布验收。

健康GET为200、端点ServerVersion=0.2.0；原C/I最初在现有凭据过期时401，官方SDK正常续期一次后均200，续期前后subject指纹相同、TLS开启。各服务镜像/commit/Ready仍UNKNOWN，升级前身份/scope快照不可得，可选MCP元数据探针未运行。一次正常认证POST不属于业务写入；端点自述不等于全服务身份。

一次真实宽短窗下，严格padding∩自身输出trigger的静止Escape已在实际命中、自然section焦点及离散采样范围内通过，随后恢复原Bounds并正常退出。原窗口没有该几何条件的旧SKIP不改。Space前置为trigger自然持焦、hover已经打开；捕获open class清除/恢复及UIA短暂offscreen，无亚500ms视觉关闭证据，不计closed→Space打开PASS。[受控两Scene对照](./SOURCE-TEXT-SPACE-COMPARISON.json)在相同前提下未观察到差异，不替代Windows通用或平台现场证明。

离线历史receipt、渲染位置/特征及页面结果与第3/第2轮相容；目标答案正常滚动后单次点击显示同C/第2轮。但实际按钮→messageId、opaque handle、运行时Host receipt、selected I仍UNKNOWN；此前手选过第2轮，单次重开也不证明独立跨轮重置，完整锚定保持PARTIAL。

1376个fresh文件摘要及六份旧报告不变，任务owned进程/端口释放、日常实例继续。当前隔离Session副本比原始样本多82 bytes，来源UNKNOWN，本轮副本和原件各自未变；历史39 null/两项差异/至少42mtime/新增路径未枚举等不抹去。69244字节detail是GUI前gate，本轮服务器After未测量，零业务写入或本地摘要不替代它。本轮问答、依据生成、Agent分析及业务写入均0；代码/包未变，无新构建或CI、合并/标签/发布/latest。

发布前仍按声明范围处置运行时完整锚定、Space交互预期/平台现场差异、实际服务部署身份/合同及会话副本差异等限制。以下保留恢复前的历史检查点和原定范围，不把旧404或SKIP回填为当时通过。

## 维护阶段检查点

2026-11-03。主会话于02:54:01 UTC记账：维护者告知192.168.50.28正在更新（不是精确消息接收或升级开始时刻）；实际升级开始/结束、目标版本和服务镜像未知。两条已获准只读对照于Windows本地10:54:27完成：原conversation列表与原Interaction detail均404。GUI当时的实际GET路径/入口身份日志未捕获，不以静态代码补造现场请求；也不将resize在先或平台更新说明认作唯一原因。

当时停止新的平台请求和平台依赖补测，仅完成离线报告核收。已执行的SourceText交互结果保留在其当时的样本/候选范围内；当前平台可用性、原记录服务器After字节、严格padding交叠原生路径仍待闭合。

## 本次接续采用的最小范围（原计划）

1. 维护者确认更新完成后，先记录实际部署版本及相关服务身份、官方CLI版本和合法测试账户/业务域是否相同；与既有固定来源和契约分开。不能只凭历史GitHub标签或单一version端点宣布新平台兼容，不自动升级pin或工具允许名单。
2. 使用已有授权且正常验证TLS的官方读通道，核对原conversation列表GET及原Interaction detail GET是否可读，记录状态、实际ID及必要的内容摘要。若仍404/拒绝，先分诊真实路由、权限/业务域和契约，继续保留UNKNOWN；不改平台记录、不清理状态、不更换样本制造通过。读取恢复时只比较原件，不把字节差异自动判为插件修改或尝试覆盖服务器输出。
3. 仍用CI5/source ae90365/TGZ14f4bb7f…及官方Windows rc.5，确认同一原答案入口能打开原生详情，并核其S/M、handle/Host receipt和selected Interaction。此前末次重开默认第3轮，只证明入口可打开；应与平台当时真实I/轮次对应，不强制旧编号。另对hover后Space未分类观察，先记录自然焦点与动作后开闭，不用后续一次再开通过覆盖。再补此前因平台不可用未执行的严格padding交叠检查。实际交叠必须有几何/命中证据；不交叠就保留SKIP。保留原窗口与可逆调整窗口的不同范围，并恢复task窗口/正常退出、核对进程端口和保护清单。

该接续不重跑完整业务E2E、保存/复制或分析busy等无关已通过项，不新增业务问答、依据生成、Agent分析或业务写入。若新平台带来实质契约变化，另行记录适配需求和所需受影响验证，不能把旧候选/旧平台通过直接迁移为新平台发布验收。无自动合并、标签、发布或latest变更。
