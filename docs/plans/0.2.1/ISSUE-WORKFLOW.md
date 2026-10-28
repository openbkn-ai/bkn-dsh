# 0.2.1 issue 指派与关单规则

## 当前状态：Windows 原生 UI 补证有界收尾（2026-10-29）

#93已完成企业既存样例API/Studio同记录对照；#97已在固定 `0.2.1-rc.3-openbkn.0.2.1` 候选、官方DSH rc.3 npm/Web隔离Host完成三条非空结论、当前问答切片11条关系、来源及步骤/定义联动，十项聚焦对照通过。二者均已关闭completed、Project 12 Done。Mac只读回放由公开Session/Workspace API建立，不是新模型回合；见[#93对照](../../evidence/2026-10-27-issue93-native-studio/RESULTS.md)及[#97结果](../../evidence/2026-10-28-issue97-native-linkage/RESULTS.md)。

新增[Windows公开补证及接收边界](../../handoff/2026-10-27-release-021/native-ui-supplement-windows/RESULTS-native-ui-supplement-20261028.md)：同一固定候选在官方rc.3 Desktop上，指定既存记录的原生GET读取、三条结论、当前切片11条关系和主要来源/步骤/定义展示，按远程报告接收为 **PASS_WITH_LIMITS**。Windows采用直接构造存储的回放，本地答案正文来自另一条旧会话，答案归因绑定 **NOT_VALIDATED**；不冒充Mac公开API流程或新模型端到端。schema引用强制切换证据视图 **UNKNOWN/证据不足**；早期渲染崩溃唯一根因 **UNKNOWN**；真实业务CSV条件项 **NOT_RUN**。后续成功不覆盖首次FAIL/BLOCKED，也不由Mac通过代填Windows子项。任务GUI须继承 `DSH_HOME`、`BKN_CONFIG_DIR` 和任务CA配置，避免CLI取token时落入默认配置。

主会话仅核对六份公开Git文件、摘要和校验输出，未取回Windows私有截图/AX/崩溃/注册表原件；manifest为206条私有文件SHA256加1条说明。更正后的六份公开文件按字节纳入本次从main建立的干净文档分支，不合入旧结果提交的历史；既有公开历史未改写，不因本次脱敏而消失。固定候选82文件及profile回补12文件的保全、后期实例菜单退出和收态按远程报告接收，不外推全部Windows形态或平台0.2.1。`formalAcceptanceEligible=false`及原平台PARTIAL/空结论保持。

#2573仍为平台侧OPEN，维护者已明确指派可观测性负责人 **leecky** 并读回确认；本次不改变issue状态/项目阶段，不把企业样例可读称为原平台已修。旧“未分派”文字仅为当时事实，当前不再列为待办。完整模块分工以工作区项目规则为准，不另复制负责人表。

本次只收尾脱敏材料和六份计划/合同台账，通过必要独立评审及默认CodeQL后合并；不运行构建、测试或发布CI，不启动Host/平台/模型，不重跑已过项，不改固定包、现有Host、正式0.2.0/数据配置及冻结-30/-31/-32。`latest`推广和本机npm CLI仍由维护者处理，不新增工程或补证门槛。下方2026-10-28及更早检查点均保留其历史身份，不覆盖本节。

> 第77轮收尾决定（2026-10-27）：维护者明确将#108按本轮未复现的有界调查认定完成；#98经原失败/owner修复/长时及Windows证据审阅后按调查完成关闭，历史未知不称已修。#99/#92按本版插件验收与发布交接收尾；#93/#97真实非空原生验证继续开放、由Foundry#2517跟踪。GitHub现有Release已改为prerelease并补最终说明，8份资产不变。**npm latest推广及本机npm CLI认证由维护者后续自行处理，本会话停止登录且不修改dist-tag。** 不新建工程、不重跑已过项或CI、不改候选/Host/正式0.2.0/数据配置及冻结包；最终文档按独立PR交付。见[第77轮收尾](../../evidence/2026-10-27-local-77/RESULTS.md)。以下旧轮次的OPEN、待决及不推送限制按历史保留，本轮授权仅覆盖明确收尾资料和元数据。

> 第76轮收尾（2026-10-27）：Windows旧npm完整配置/去business各一次、总2次已结束，本次未复现；完整路径spawn记录→结果约2.252秒，对照diag约1.10秒。不称已修、不关闭#108、不追加启动，rc保持、latest不迁移。full真实CIM身份缺失、对照90秒窗口失效至外层130秒及退出未知单列，不能报整体验收全PASS；run6遗留fixture本轮才清理，纠正旧“零残留”总结并保留原件。9个Git对象及7项manifest映射摘要已核对，42项private记录中6项已公开、其余36项未取回。#108 In progress（本轮执行已结束，根因未知）、#99 Validating；不新增工程/重跑，不改候选/Host/正式0.2.0/数据配置或冻结包，不推送/CI。见[第76轮审阅](../../evidence/2026-10-27-local-76/RESULTS.md)。下方第75轮“尚未执行”和更早待选方案均为历史。

> 第75轮决定（2026-10-27）：维护者已选保持rc并有界分诊，不再待选方案。仅Windows旧npm0.2.0-rc.2/Node24.19.0，完整配置及去business各最多启动一次；每案固定90秒观察窗（非性能SLA），不重试/扩矩阵。复用f36103e候选和旧工具，私有测试副本只补身份/就绪/写点日志，不改候选/Host/正式0.2.0。#108 In progress、#99 Validating，latest不迁移；Windows尚未执行，不能报PASS/已修。见[第75轮与完整执行提示词](../../evidence/2026-10-27-local-75/RESULTS.md)。下方第74轮“待维护者选择”仅为历史过程。


## 第74轮发布状态（历史，最新见上）

包 `0.2.1-rc.3-openbkn.0.2.1` 已经由PR106合并main `ddbf578b93efca1872e0ae9781dafae5713e9deb`，main build-only CI40368159024及发布CI40369214007成功，npm/GitHub公开制品与已实测CI40361613728逐文件核对完成（package.json仅等义序列化差异）。OpenBKN0.2.1仅发布标识，平台实测仍正式0.2.0；已有Host、数据配置和冻结-30/-31/-32不改，不采用平行-11/-13。

Windows最终候选结果 `0d9666c36a48d33ced6cb2966d6f25d8a8257360` 已接收：唯一父提交f36103e，只有results-windows目录10文件新增，报告/manifest及8项公开证据摘要匹配。四后端实际业务Service/profile回补、24项打包Reader检查及CSV双场景按其范围PASS；Host完整运行/退出和源根保全按远程报告接收，115项私有原件未读。共享missing/malformed-content回归不是本轮Windows执行，原报告formalAcceptanceEligible=false保持；不外推完整GUI、真实非空原生或模型/G6合同通过。见[第74轮审阅](../../evidence/2026-10-27-local-74/RESULTS.md)。

只读澄清已回传：正确HOME下旧npm C/D/E共3次、新npm J一次超过90秒无输出，不含HOME误配A/B或去business诊断H；去business时diag可执行，归属仍未定。旧npm公开身份文件属于超时E，成功I的PID/创建时间缺失；正确HOME的C在checkout生成7文件（含合成credential/workspace）且写入机制UNKNOWN。A/B用户目录4模板清理只按会话记录接收，没有前置快照，不称个人状态逐字节不变。已提#108（Project12 In progress），保留成功功能结果、旧npm身份/收态关联记证据不足，不同#105协议问题混并、不新增90秒SLA。当前只需集中决定保持rc做一个失败组合的有界分诊，或明确接受新限制后继续latest；未决定前不启动新测试或迁移。

#99保持OPEN/Validating，Windows功能结果已核对；#108进入Project12 In progress，新发现未明确处置前不迁移npm latest。#92保持In progress；#93/#97等待外部真实非空原生样本，#98历史未确认条件保持；#94/#95/#96/#105/#107仍按各自标准已关闭。正式平台/CLI、模型业务归属和D1–D5原决定不变。npm当前rc指向新版本，latest保持既有0.2.0-rc.2-openbkn.0.2.0-13；这不表示采用平行发布线。

当前插件Project共11项，6项OPEN（#92/#93/#97/#98/#99/#108）、5项CLOSED（#94/#95/#96/#105/#107）；#108的阶段已在项目界面核对。

本轮只读取/审阅现有证据和同步文档，无新测试/Host/平台/模型/Sandbox执行、构建、推送、CI或dist-tag变更。下列第73轮及更早检查点保留当时身份，不覆盖本节。

## 当前待办与关单边界（2026-10-26）

以[六组工作](REMAINING-WORK.md)及用户第71轮明确归属原则收敛。本轮获授权向OpenBKN提报，已创建并读回#2515/#2516/#2517，不推送代码、不跑CI。#94保持已关闭；#93/#96/#97的当前平台非空依赖转外部#2517跟踪，不伪称非空已验，也不再作为其他插件步骤的全局停止条件。#98历史未确认条件保留，#99仍要求正式候选/插件实际兼容，不要求插件修正模型业务内容。

#95的d20a266原补证049d9f46已接收，本轮调查结束；状态/UI观察与L0偏差、carrier/Job未知、菜单退出异常分列，不追加登录或要求Windows完整定责。#105 Windows非GUI8f94288f的12文件/10项manifest/8份JSON已核对，最终8/8子项完成；不因GUI/签名未完重开此子项，不把整体#105或#99自动关闭。采用GUI回补交付才补实际加载；对外分发修改GUI才处理生产签名。旧r1 gate仅历史。

第70轮接收e7b383b/b7941883：Windows真实业务/profile回补、GUI启动及备份/手工恢复按报告通过；用户D1明确接受欢迎态官方X终止整树作本轮最小退出依据，原菜单FAIL、exit code未观测保留，不重跑菜单。#105最小验证子项收尾，整体按自身标准记录，不自动关闭或套用#99全部门槛。第70轮当时未决的D2–D5现按第71轮明确决定执行，历史报告原件不改。见[第70轮](../../evidence/2026-10-26-local-70/RESULTS.md)及[当前清单](REMAINING-WORK.md)。

第71轮D5已明确接受按建议收尾：#95历史未知及旧菜单异常保持原finding、不称已修，停止本轮完整Job/抓包调查；D1不覆盖旧实例，#99不追加为其自身条件。D2销售/字段已提OpenBKN #2515/#2516，D3由#2517分类；原始FAIL不改写，不等上游修完才推进插件。D4指定权限图的实际平台/rc.3 Host场景已通过，旧无供应链题不伪称已跑。本轮没有关闭本插件issue、替换平台、改Host或冻结包；远端动作仅用户明确要求的三次上游提报。

## 第59轮 #105 GUI路径评审完成，仍OPEN

2026-10-25：完成独立GUI构建/签名路径评审、纯函数取证和Windows最小材料准备；GUI隔离源码集成、实际GUI/签名/Windows/最终候选仍缺，不关#105。新gate/输入通过不当GUI通过，0本机有效签名身份仅是一个限制。原已关闭issue保持，d20a266原补证不扩容，冻结包/Host/正式0.2.0保持，无远端issue写入/推送/CI。 见[结果](../../evidence/2026-10-25-local-59/RESULTS.md)、[GUI构建签名路径](../../evidence/2026-10-25-local-59/DESKTOP-GUI-BUILD-SIGNING.md)与[剩余项](../../evidence/2026-10-25-local-59/BLOCKERS.md)。下文保留各轮历史身份。

## 第58轮 #105 本地加载/认证缺口补齐，仍 OPEN

2026-10-25：回补Host上的冻结 -32 原生加载和CLI管理认证本地范围通过，证据覆盖两版完整npm/web和两版官方Desktop后端。首轮准备超时保留；GUI签名/Windows/最终候选及浏览器carrier未验，不关闭#105，不把不同制品证据拼接成GUI通过。原已关闭issue保持，Windows仍按d20a266补原范围，原Host/正式0.2.0/冻结候选保持；本轮无远端写入、推送或CI。 见[本轮结果](../../evidence/2026-10-25-local-58/RESULTS.md)与[剩余项](../../evidence/2026-10-25-local-58/BLOCKERS.md)。下文保留各轮历史身份。

## 第57轮 #105 仍开放，交付证据分层补齐

2026-10-25：#105的完整Mac npm派生交付及官方Desktop后端隔离验证已完成本轮范围；实际CLI认证、签名GUI/Windows与最终候选门槛未完，因此不关单。已关闭issue按自身标准保持，不因总合同重开；本轮没有远端issue写入。冻结 -30/-31/-32和d20a266原Windows范围保持，无推送/CI。 见[本轮结果](../../evidence/2026-10-25-local-57/RESULTS.md)、[完整交付方案](../../evidence/2026-10-25-local-57/HOST-DELIVERY-PLAN.md)及[剩余项](../../evidence/2026-10-25-local-57/BLOCKERS.md)。下文保留各轮历史身份。

## 第56轮本机新形态补证

冻结 -32 在官方rc.3 Mac Desktop隔离副本的安装/profile及受影响UI最小验证有证据；#99仍缺最终CI、平台/模型、Windows和完整人工等门槛。过期CLI独立续期后，两Mac形态现成五Reference的zh/en/zh与原值保持有证据；没有新的Host登录生命周期观察，不据正常退出关闭#95。只读确认#105仍OPEN，实际官方Desktop SDK2.2.0没有transport fetch/redirect覆盖，未安装回补。#94既有关单保持，没有远端issue写入或新的推送/CI。见[本轮证据](../../evidence/2026-10-25-local-56/RESULTS.md)。

## 第55轮 Windows 回传核对

74c4d731报告与公开证据摘要匹配，新增两版rc.2 Desktop的 -31 局部UI报告证据，非完整验收。U1/溯源/精确尺寸有缺口，冻结 -30 生命周期零观察，因此不据本轮关闭#95或#99。只读API确认#94 CLOSED、#95/#99/#105 OPEN，无远端issue写入；#105未因UI回传而修复。主树和冻结包无变更，不推送/CI。见[第55轮合并](../../evidence/2026-10-25-local-55/RESULTS.md)。

## 第54轮核对

-31 修复已逐文件承接到 -32，源码/包/隔离官方 rc.3 npm-web 受影响 UI 最小验证有证据；不是 #99 最终候选或完整形态验收。#105 的 Host 修复没有加入本轮环境，继续开放；#94 已关单状态不变，其他 issue 不借本轮 UI 测试泛化关单。Windows 仍按 d20a266 的 -31 UI / -30 生命周期回传，待按原身份汇总。没有远端 issue 写入、推送或 CI。见[第54轮](../../evidence/2026-10-25-local-54/RESULTS.md)。以下为历史核对记录。

## 第53轮核对

#105仍OPEN：完成官方同源策略评审、四文件草案、固定源码archive副本的MCP JS构建及服务组合验证；完整Host/签名/分发、候选及实际形态门槛未完，不关单。#99当前新版兼容目标改为rc.3，旧rc.2/-30/-31及Windows d20a266证据保持原身份，不直接转记；#94既有关单不因总验收重开。主树-32仅后续开发元数据，未构建产物；本轮rc.3验证输入是-31私有派生fixture及复制源码，后续整合新候选须重新核对-31修复的承接。没有远端issue写入。见[第53轮](../../evidence/2026-10-25-local-53/RESULTS.md)。

## 第52轮新增安全项核对

[#105](https://github.com/openbkn-ai/bkn-dsh/issues/105)仍OPEN。本线适用性与合成复现已独立验证，最小拒绝跳转补丁仅准备在独立文本副本；同源兼容合同、真实Host交付及必要Windows验证未完成，不关单，不沿用另一发布线-13风险接受。冻结-30/-31、d20a266和既有已通过项不变；当前Windows范围不扩大，待回传统一汇总。见[第52轮方案](../../evidence/2026-10-25-local-52/MINIMAL-REMEDIATION.md)。下方各轮状态保留原时间和范围。

2026-10-24 纳入用户经协调会话补充的要求。组织Project为 [OpenBKN0.2.1 / #12](https://github.com/orgs/openbkn-ai/projects/12)；仓库仅限openbkn-ai/bkn-dsh。本机会话通过GitHub API独立核对当前账户为kalias，#92–#99全部OPEN且assignee包含kalias。Project成员归属由协调会话现场核对；本机gh缺read:project，不将其表述为本机重新读取项目成功。

## 逐项关单

1. 每个issue按自身最新正文、评论和用户修订的完成条件判断。开发及该项要求的验证完成后，先记录具体源码身份、候选版本/tgz SHA/逐文件身份、对应测试与必要实机证据、剩余限制，再关闭该issue。不等所有无关项完成。
2. 受控、fixture、源码执行、真实Host、真实平台/模型、人工可读性验收分别标注；测试绿色不代替该项要求的实机证据。不能把平台completed状态当答案正确。
3. 不把#99的全部固定候选/最终验收门槛无条件套在每个实现issue上。例如#94正文将Mac/Windows两形态实测和英文可读性总验收归到#99；#94应按自身字典、控制器、渲染和边界标准独立核对并收尾。
4. #98保留“未复现不能宣称已修、未确认问题继续开放”的要求。既有MCP配置owner路径的真实失败/修复和同Host复验可记其明确范围；不据此覆盖所有未确认历史长时条件，也不把它们重新统称为完全未复现。
5. #92是范围总览，在关联交付及其验收条件满足后收尾。各分项的开放、通过、范围限制及用户处置决定都要可追踪。
6. 关单不扩大已有授权。当前仍不改-30、不推送、不跑CI、不合并/tag/发布，不替换正式0.2.0，保留数据配置；新远端动作按会话明确授权。用户已授权完成后的issue关单，不需为同一动作重复索权。
7. 插件忠实显示平台状态、原因、记录与披露关系，不仲裁模型回答、不自动纠错、不重算业务或补造关系。

## 第49轮核对状态（2026-10-24）

| Issue | 当前状态 | 对应证据和收尾边界 |
|---|---|---|
| [#92 范围总览](https://github.com/openbkn-ai/bkn-dsh/issues/92) | OPEN / kalias | 完整合同、关联交付及验收仍开放；本轮r3不构成总览完成 |
| [#93 原生API/凭据/非空样本](https://github.com/openbkn-ai/bkn-dsh/issues/93) | OPEN / kalias | 保留历史样本合同证据；当前正式0.2.0非空原生路由/样本缺口不因标准operations可读而关闭 |
| [#94 zh/en](https://github.com/openbkn-ai/bkn-dsh/issues/94) | CLOSED / kalias | 独立-31补齐标签后308双语key/28文件，两基线各617pass/1skip、类型/包审计及3项packed UI通过；按自身标准完成并[留证关闭](https://github.com/openbkn-ai/bkn-dsh/issues/94#issuecomment-6385727060)。实机/人工/最终CI仍归#99 |
| [#95 登录状态/生命周期](https://github.com/openbkn-ai/bkn-dsh/issues/95) | OPEN / kalias | 049d9f46有界补证已接收，旧UI/状态结果复用，L0偏差/carrier/Job未知及菜单退出异常独立记录；不追加B3或把runner未重现称已修，按自身标准另做关单审查 |
| [#96 Host/预算/降级](https://github.com/openbkn-ai/bkn-dsh/issues/96) | OPEN / kalias | 既有受控守卫/预算/降级、历史独立合同样本与当前404分别保留；显式依赖#93当前目标非空合同前提，且本轮未完成完整关单审查；不以#99全部门槛替代本项标准 |
| [#97 双视图/联动](https://github.com/openbkn-ai/bkn-dsh/issues/97) | OPEN / kalias | 真实非空原生样本关键字段/关系及完整人工联动仍缺；不补造来关闭 |
| [#98 B1](https://github.com/openbkn-ai/bkn-dsh/issues/98) | OPEN / kalias | 第34轮MCP owner失败与修复、第38轮Mac长时和Windows既有B1各保留原身份/条件；r3没有新增B1，历史未确认条件不被runner无残留覆盖 |
| [#99 固定候选实机验收](https://github.com/openbkn-ai/bkn-dsh/issues/99) | OPEN / kalias | r3 argv子项按Windows回报PASS；-30仍local-development-preacceptance，ciRun=null/formalAcceptanceEligible=false，最终固定CI候选与完整验收未完成 |
| [#105 同源回补](https://github.com/openbkn-ai/bkn-dsh/issues/105) | OPEN | Windows非GUI8/8子项已完成；Mac源级/Host/CLI复用。实际交付及GUI路径按选定路线处理，优先核实profile依赖回补是否覆盖真实插件静态导入；不默认为独立GUI构建，不沿用其它发布线风险接受 |

本轮已关闭：#94，仅按其自身本地实现/受控验证条件，已更新清单并发表英文证据评论后关闭；原-30未改，改动仅在独立本地-31。其他issue继续按自身缺口开放，未重复指派。见[关单回执](../../evidence/2026-10-24-local-49/issue94-closure-receipt.json)。

当前查询时间、每项正文摘要及状态见[第49轮issue记录](../../evidence/2026-10-24-local-49/issues-current.json)。
