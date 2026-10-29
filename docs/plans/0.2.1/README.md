# bkn-dsh 0.2.1 接手入口

## 自动登录增量 PR 集成与 CI 差异检查点（2026-10-30）

维护者已授权整合自动登录增量及52b3f32，通过必要独立评审和build-only CI后正常合并。CI40920391148（publish=false、源码42fe362）成功：插件657 PASS/1 SKIP、仓库73 PASS，两官方npm运行时受控检查通过。独立评审复现并修复旧凭据跨新授权代次的竞态；3项新增源码/编译用例均通过。

原auto.local.2/96dc62d7/94文件仍是冻结验收基准；同名未发布CI修订包为7c99d259/94文件，只有business.js及两份类型声明不同，91项相同。客户端、CLI预加载、授权浏览器、原生MCP与版本元数据不变，已有Mac/Windows界面证据按原身份复用；未重跑真实Host/业务验收。首轮CI缺CHANGELOG的失败及原退出码/精确时刻/唯一根因UNKNOWN保留。

完整身份、首次失败、修复/独立评审和差异证明见[集成检查点](../../evidence/2026-10-30-auto-login-integration/RESULTS.md)。正式PR审批/合并以关联PR记录为准。本次不发布、不改Host/正式0.2.0或数据配置，不动latest/本机npm CLI；原formalAcceptanceEligible=false及未决发布门槛不默认降级。


## 最新收口：登录成功状态修复（2026-10-30）

维护者已授权先修复、本地验证通过后再推独立交接分支并交Windows复验；此范围覆盖旧“仅文档/源码冻结”的后续限制，不改写原93f3e85和ea6be318。Windows fa6e2fb核心认证/复用及首次等待文案滞留保留为历史；auto.local.2的Windows最小复验8b5ee49现已返回，当前面板无需关闭或刷新即自动显示成功与目录，按本轮标准PASS并收口。

最小修复源码 `dbf53d329eae704e580e555f9da37f7c05a8111a`，候选 `0.2.1-rc.3-openbkn.0.2.1-auto.local.2` / `96dc62d7ef9bded5ca45861a9d8d5e0f627f30a365a38590d7cbb541a9867571` / 94文件。仅client.js与包版本变化，Host/TLS/CLI/MCP等92项完全相同。13项聚焦检查、类型/构建/包审计、原生rc.3句柄/selector/打包UI受控对照及官方Mac GUI合成授权自动更新通过。受控清理延迟证明原consumer可阻塞成功反馈，不断言Windows现场唯一根因已确认。

Windows本轮已在一个官方rc.3 Desktop完成一次真实授权后的当前面板自动更新；公开proof确认实际版本/MCP身份与两个授权网络，退出进程树及关联恢复按远程报告接收。退出码和精确翻转时刻仍UNKNOWN，上轮唯一根因未确证；不追加测试。其余已过项继续复用。见[本轮证据](../../evidence/2026-10-30-auto-login-status/RESULTS.md)及[最小交接](../../handoff/2026-10-30-auto-login-status-windows/README.md)。不改现有Host/正式0.2.0/数据配置，不建GUI体系、不跑CI/发布/改latest；未决发布门槛不默认降级。

接收明细见[Windows收口记录](../../evidence/2026-10-30-auto-login-status/WINDOWS-CLOSEOUT.md)：11个公开Git对象与9项非自身manifest映射已核对，私有原件未取回，manifest自身摘要另记。本次仅本地文档收口，不推送或跑CI；auto.local.2仍未发布、formalAcceptanceEligible=false，未决正式发布门槛不默认降级。

以下2026-10-29及更早的“当前/未执行/不推送”描述是当时检查点，不覆盖本节的新授权与已收到Windows结果。

## 历史检查点（2026-10-29及以前）

> 最新授权（2026-10-29）：维护者明确接受私有环境首次自动信任，以及origin/IP/叶证书变化后的自动更新与重新浏览器授权。此前手工证书确认及CLI阻断是中间方案，已被本次明确决定覆盖；不改写其历史失败或验收结果。

## 当前增量：私有平台自动登录

本地未发布候选 `0.2.1-rc.3-openbkn.0.2.1-auto.local.1`，`ciRun=null`、`formalAcceptanceEligible=false`。首次只需点击CLI登录并完成官方账号授权；平台身份变化后进入新授权代次，旧代次凭据不得用于新身份。普通token过期由官方CLI续期；服务端撤销或拒绝续期仍需重新授权，不能承诺永久会话。

实现复用官方CLI设备授权、DSH子进程/存储和原生MCP factory。专用CLI子进程加载origin/IP/叶指纹限定的dispatcher，官方CLI文件不改；独立Chrome/Edge采用平台SPKI例外，日常浏览器与系统信任不改。原生MCP的同源/fetch回补已随插件交付，只选择插件拥有的连接，不要求用户放置profile companion，不改Host安装根。维护者接受用观测指纹替代公共CA/名称身份验证；保留证书日期检查，不把过期证书判为通过。

已有本地证据：651项源码测试（650通过、1项Windows专用跳过）；旧基线构建/新rc.3类型通过；合成首次授权、重开/重启和官方CLI续期、证书变化及跨源拒绝；无手工companion的新profile实际加载；企业0.2.0真实账号授权后同步与只读目录、打包MCP实际实例身份已通过。先前HTTPS默认端口被转成0的实际缺陷已修复，保留首次失败。完整身份、归档和未执行门槛见[本轮结果](../../evidence/2026-10-29-auto-platform-login/RESULTS.md)。

仅补登录/信任受影响边界。不重跑G6/B1/已过矩阵，不新建GUI发行体系。现有兼容CLI及Chrome/Edge为前提；官方Mac Desktop受影响登录补证已完成，见下述记录；物理Windows及公开新候选独立评审/CI/替换仍未执行，未默认降级。保持正式0.2.0、现有Host、公开包及冻结-30/-31/-32；不推送、不跑远端CI，latest与本机npm CLI仍由维护者处理。

### 冻结93f3e85的官方Mac Desktop补证与Windows准备

同一ea6be318候选、94文件和原官方rc.3 App完成真实授权、实际CLI preload/MCP实例、只读目录、面板重开及Desktop重启免授权；两次官方菜单退出均exit0。首轮钥匙串提示保留，已用只读HOME对照定位为验证脚本伪造HOME；改为真实HOME后，维护者确认同一任务浏览器只读重开无提示，没有重复账号授权或修改系统钥匙串。启动前备份的URL关联配置已按当前==After守卫恢复，字节与Before一致。详见[补证记录](../../evidence/2026-10-29-auto-desktop-login/RESULTS.md)。

[Windows最小材料](../../handoff/2026-10-29-auto-login-windows/README.md)已离线校验，只补一个既有官方rc.3 Desktop的CLI载体、独立浏览器取消/一次授权、MCP和重开/重启/正常退出及关联恢复。维护者已授权仅向 `handoff/windows-auto-login-93f3e85-20261029` 推送文档/材料交接子提交，Windows仍未执行；不重跑已过项、不新增GUI体系。生产源码及候选仍固定93f3e85/ea6be318；不更新main/开发分支、不建PR、不跑CI，取件SHA由主会话推送后读回。

## 历史中间增量：手工面板证书与CLI阻断

### 原2026-10-29中间方案快照

本节是历史固定包收尾之后新授权的本地开发，工作副本为`bkn-dsh-panel-cert-login`，不改变下方已发布包、冻结-30/-31/-32及旧轮次验收身份。见[本轮实现/候选/分层结果](../../evidence/2026-10-29-panel-cert-login/RESULTS.md)。本地候选为`0.2.1-rc.3-openbkn.0.2.1-cert.local.2`，尚未发布，`ciRun=null`、`formalAcceptanceEligible=false`。

已实现面板选择单张PEM、预览origin/签发者/有效期/指纹、明确确认后持久化及撤销；MCP/目录/原生GET使用origin限定的连接级CA，保留证书链/日期/名称校验。插件637项（636通过/1项Windows专用跳过）、类型、包审计、两固定Host原生MCP合成HTTPS8项及一个真实Mac rc.3 npm/Web Host的受影响面板/加载/读取已验证，具体候选归档和UI复用边界见结果记录。没有更改现有Host代码或平台，也未重跑业务矩阵。

**CLI缺口不降级为通过。** 官方CLI0.2.0在合成跨origin307后跟随至第二源；进程级附加CA不是origin边界。维护者明确选择保持导入证书后的CLI登录阻断，先整理[SDK issue草稿](../../evidence/2026-10-29-panel-cert-login/SDK-ISSUE.md)，继续MCP/HTTP/UI。草稿未提报，不猜测CLI/SDK负责人。没有为CLI注入CA环境变量或修改SDK。

剩余范围仅为：获得origin限定的CLI契约后补最小真实账号认证；另行授权公开替换时才进行独立评审/新CI候选及受影响Windows、官方Desktop验证。此前已通过项不重跑，未执行项不默认为已知限制接受。当前无推送、PR、远端CI、发布/标签/资产变更；不操作维护者负责的latest及本机npm CLI。不新增GUI发行体系或业务内容仲裁。

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

## 当前执行入口：六组收敛（2026-10-26）

以[当前剩余工作](REMAINING-WORK.md)的六组任务、停止条件和依赖为准：①#105本线处置 ②Windows原补证/登录UI ③原生溯源平台依赖 ④业务观察归属/执行安全 ⑤两版Host实际兼容 ⑥正式候选/关单/发布准备。

发布视图按[五项最小清单](REMAINING-WORK.md#发布最小收敛清单)：#105配套交付、业务观察/归属提报、原生溯源平台依赖、最终候选兼容/授权、正式候选/发布手续。第71轮用户明确插件不干涉模型与OpenBKN交互的业务内容；盘点错误当时的可复现场景/条件后交OpenBKN处理，不让外部业务问题卡住插件下一步。若证据指向插件自身，仍按插件缺陷处理；不改写历史FAIL。

Windows e7b383b结果b7941883已核对6个公开Git对象、4项manifest摘要及欢迎窗截图；113项私有原件未读。真实业务自动加载、GUI启动、先备份及手工受限恢复按报告PASS。用户已明确D1：官方X使整棵进程树退出可作本轮最小退出依据；原菜单FAIL、exit code未观测和controller超时保留，不为菜单入口重跑。见[第70轮汇总](../../evidence/2026-10-26-local-70/RESULTS.md)。

[D2–D5已落实](REMAINING-WORK.md#集中决策清单)：销售/字段混用已提报Foundry #2515/#2516，原生路由问题提报#2517；D5按建议作为已知问题/证据限制收尾，不称已修。D4用户新权限图（供应链有权、世界杯无权）已在隔离CLI/实际rc.3 Host通过，原“无供应链权限”的模型题没有伪称已跑。见[第71轮](../../evidence/2026-10-26-local-71/RESULTS.md)。当前无待决范围项，推送/CI/发布仍未授权。

#105非GUI Windows子项已完成：固定a362d783交接，8f94288f回传，四路径stock/protected最终8/8。主会话独立核对12文件、10项公开manifest摘要与8份探针JSON；46项私有证据未读。结果见[第63轮](../../evidence/2026-10-26-local-63/RESULTS.md)。不重跑向量/Host/UI/B1，不把后端通过转记GUI或正式候选。原r1/r2准备态保持历史身份；不再把“Windows非GUI待验”列为当前门槛。

- 冻结-30/-31/-32、原Host/正式0.2.0和数据配置保持；单次交接推送已完成，本轮无新增推送/CI。
- 已通过向量、Host/CLI、UI、argv/tar/B1证据按原身份复用；只补未测或变化路径。
- 原d20a266补证049d9f46已接收并结束本轮调查；UI通过与L0偏差、carrier/Job未知、菜单退出异常分列，不要求Windows重写旧报告或再登录。
- 原生非空、G6内容/安全问题保留原结果并交上游，不阻塞独立插件步骤；D4指定权限场景已补。最终候选兼容、CI与公开制品身份仍需完成。原官方App＋profile payload路线已有Mac/Windows分层证据，不新建GUI发行体系。
- 历史各轮为证据索引；其独立GUI/完整定责等路线描述不自动增加当前待办。第60轮结果见[本地验证](../../evidence/2026-10-25-local-60/RESULTS.md)。

## 第59轮 GUI路径查清与Windows材料准备

2026-10-25：独立GUI的源构建、身份/数据/协议/CLI/更新隔离及签名路径已列清；官方快捷路径不能直接当独立发行。本机0有效代码签名身份，源码隔离集成/全仓GUI构建/签名/Windows仍未完成。Windows r1已冻结 -32/CLI/两payload，输入PASS、缺GUI正确BLOCKED，无远端提交，不启动Host/登录。已有加载/认证/UI/跳转/B1结果不重跑，原Host/平台/数据配置与冻结包保持，等待d20a266原补证，不推送/CI。 见[结果](../../evidence/2026-10-25-local-59/RESULTS.md)、[GUI构建签名路径](../../evidence/2026-10-25-local-59/DESKTOP-GUI-BUILD-SIGNING.md)与[剩余项](../../evidence/2026-10-25-local-59/BLOCKERS.md)。下文保留各轮历史身份。

## 第58轮 实际加载与认证本地缺口补齐

2026-10-25：新增两版回补npm/web与官方Desktop后端四个隔离副本的冻结 -32 实际加载/CLI管理认证证据。三组件、模块类身份和实际MCP入口确认；真实CLI登录、凭据同步、2网及独立读回通过；首轮准备超时不计通过。原Host、个人CLI、冻结 -30/-31/-32及正式0.2.0保持。未重跑旧UI/B1/G6或跳转套件；派生GUI/Windows/固定CI仍未验，#105保持开放，等待d20a266原Windows补证，无推送/CI。 见[本轮结果](../../evidence/2026-10-25-local-58/RESULTS.md)与[剩余项](../../evidence/2026-10-25-local-58/BLOCKERS.md)。下文保留各轮历史身份。

## 第57轮 #105 完整 Host 交付预验

2026-10-25：完整Mac npm/web本地派生交付、两版归档迁移后的实际Host调用及官方Desktop后端入口隔离对照已补齐；#105签名GUI/Windows/实际插件CLI授权与正式候选仍未验。原Host和冻结 -30/-31/-32不改；SDK版本不升，当前官方Host不能据此标为已修。无平台替换、推送或CI，Windows等待d20a266原范围回传。 见[本轮结果](../../evidence/2026-10-25-local-57/RESULTS.md)、[完整交付方案](../../evidence/2026-10-25-local-57/HOST-DELIVERY-PLAN.md)及[剩余项](../../evidence/2026-10-25-local-57/BLOCKERS.md)。下文保留各轮历史身份。

## 第56轮 rc.3 Mac Desktop 本地最小补证

2026-10-25：官方签名/公证rc.3的新隔离Mac Desktop实际加载冻结 -32，82文件/profile闭包通过，补齐该形态受影响More菜单、弹层焦点、中英文历史说明、原生窗口800×600及既有历史溯源降级检查。后续CLI正常续期后只补Mac两形态非空五Reference的zh/en/zh与原值保持，原生业务解释仍404；未发模型/新业务回合、不重跑旧形态/构建/源码套件，不将非空平台/G6或完整人工项记为通过。原 -30/-31/-32、现有Host/正式0.2.0/数据配置保持，owned应用已正常退出，无提交/推送/CI。#105与最终门槛保持开放，Windows仍按用户另开会话的d20a266补原缺口。见[本轮结果](../../evidence/2026-10-25-local-56/RESULTS.md)及[剩余项](../../evidence/2026-10-25-local-56/BLOCKERS.md)。

## 第55轮 Windows 回传已合并

2026-10-25：固定结果74c4d731的11文件对象、报告/manifest及8项公开证据摘要已独立核对，原始私有运行证据未读。Windows -31/两版rc.2的安装、历史说明、对比度和局部键盘按报告通过；Reference、溯源、精确800×600及 -30 生命周期缺口单列，不转记当前 -32/rc.3。勘误“纯locale/无行为改动”，实际包有Escape/焦点及颜色修复；原对比度采样文件的多JSON值格式另存规范化派生件。没有新构建/重跑/Host或平台动作，无提交/推送/CI；原候选保持。见[合并结果](../../evidence/2026-10-25-local-55/RESULTS.md)与[只补缺口方案](../../evidence/2026-10-25-local-55/WINDOWS-GAPS.md)。以下为各轮历史状态。

## 第54轮 -32 本地候选与 rc.3 受影响 UI

2026-10-25：-31 的 7 文件修复已完整承接到 -32，本地构建、6 项受影响测试和 82 文件审计通过。最终本地包 SHA256 `46626510825fe9146aef12c27a1724acbb455aeac22aa600358add0fc8e1c9f8`；隔离官方 rc.3 npm/web 完成实际安装、profile 同物理包闭包及受影响 UI 最小验证。首轮 UI 与最终包仅两份 README 不同，最终包重装/重载和英文检查单独记录。不是固定 CI 或八组合验收；其他形态、#105、安全/G6/人工门槛保留。-30/-31、d20a266 Windows 原范围及原 Host/正式0.2.0/数据配置保持，无推送/CI。见[本轮结果](../../evidence/2026-10-25-local-54/RESULTS.md)和[剩余项](../../evidence/2026-10-25-local-54/BLOCKERS.md)。下文保留各轮历史身份与当时状态。

## 第53轮同源回补与rc.3目标

第53轮（2026-10-25）：按用户指示将新版兼容目标改为0.2.1-rc.3 /1f81c047fc48fa190a683e469daa699857e9afe8，保留旧0.2.0-rc.2及旧构建生成器。后续开发元数据-32未构建；原-30/-31、31开发副本与d20a266交接冻结。-31的metadata-only私有派生fixture在隔离rc.3完成六项受控运行、实际profile共用Cordis4.0.5/Schemastery3.18.5及复制源码Host/Client类型检查；不是-32或完整rc.3验收。官方同源helper已评审，四文件Host回补在两固定源码archive副本构建MCP JS bundle并通过12项真实服务组合检查；实际SDK跨源30项第二源请求0，同源30项、52组官方向量和在途abort通过。没有应用到现有Host；#105保持开放，SDK仍2.0.0/2.2.0，不借用-13豁免。rc.3真实UI/Desktop/Windows/最终候选仍待验，Windows仍按旧rc.2的d20a266原范围回传，不扩大或转记。正式0.2.0/数据配置保持，无真实平台/模型/Sandbox、推送、CI或远端issue写入。 [证据与限制](../../evidence/2026-10-25-local-53/RESULTS.md)

## 第52轮安全修复准备

第52轮（2026-10-25）：#105 适用于本线固定Host的MCP SDK2.0.0/2.2.0，另一发布线-13风险接受不构成本线豁免。已准备独立一行requestInit.redirect=error草案；真实npm SDK及两官方Mac Electron运行时的60个候选跨源301/302/303/307/308×POST/GET/DELETE场景第二源请求0，普通MCP/SSE/DELETE及401与4项factory接缝检查通过。合成复现不等于真实泄漏；草案同时拒绝同源跳转，同源合同和完整Host交付仍未完成，#105/发布安全门槛开放。公开Host Config无fetch/redirect注入，不能只改插件配置宣称已修。未应用草案、未改-30/-31/DSH/正式0.2.0/数据配置，未重跑UI/B1/G6，无推送/CI/远端issue写入。Windows仍按d20a266执行，待结果合并。 [方案与证据](../../evidence/2026-10-25-local-52/MINIMAL-REMEDIATION.md)

## 第51轮本机差异验证

第51轮（2026-10-25）：保持-30/-31及Windows d20a266冻结，本机完成同一-31两固定Host的Desktop/npm-web受影响UI预验。旧Desktop五Reference标签zh-en-zh且原ID/status相同，三弹层键盘/关闭焦点及800x600通过；新版Desktop和npm两版只补差异快捷检查。npm原运行根-27与失效代理配置冲突仅在新副本纠正，官方DSH/依赖代码逐字节保留；历史round40模块profile-30事实不改写。正式CLI已恢复登录，无Host登录/B1/业务模型重跑。MCP SDK实际2.0.0/2.2.0仍适用#105重定向风险，未借用另一发布线豁免，包/Host不修补。12表78635行/选定业务配置保持，owned应用/端口/任务页收态。Windows、Job因果、Sandbox/完整G6、CE非空、低权限和最终CI/人工门槛仍开放，无推送/CI/平台替换。 [证据](../../evidence/2026-10-25-local-51/RESULTS.md)


## 第50轮独立交接（2026-10-24）

已授权的第50轮独立交接已推送：handoff/windows-local31-ui-life30-20261024 / d20a266fa550dd854c9bd7d30bd04c088de9bbfe。KIT SHA61bace60c424eade7904ab1ed592cd5a0a7e1b332a0b768215a8eecba1298996；61文件新远端副本逐字节核对，两包各82文件和SDK完整性通过。-31仅受影响UI，在任务home新副本安装；生命周期用冻结r3/-30单Desktop现成carrier/cancel补证，缺前提BLOCKED，无Job注入/句柄复制。已过argv/启动/完整UI/B1等不重跑。无工作流、Actions/PR列表为空；无开发/main推送、CI、发布或平台动作，不采用另一路-11。正式0.2.0、数据配置和既有工作保留。Windows原生补证待回传，仍为local-development-preacceptance，非最终CI/总验收。见第50轮RESULTS和WINDOWS-PROMPT。 [证据](../../evidence/2026-10-24-local-50/RESULTS.md)


## 第49轮本地收敛（2026-10-24）

原-30/r3及主工作树生产源码继续冻结；独立detached工作树`bkn-dsh-local49-ui`完成未发布本地-31，SHA256 22ba0e17235ccb3c93d585f2811604f5221375ac9e3496e92e6d8c1756196e4a，231535字节/82文件。只比-30改变client.js、client语言声明和package版本，Host/Remote文件相同。补齐5个Reference标签、被动诊断历史说明、眉标/按钮对比度；真实浏览器受控DOM先复现Escape连关父层，再验证panel内处理只关插件层。两依赖基线各617 pass/1Windows skip，类型/包审计、实际packed client3项通过；非实机总验收。

#94按自身字典/状态/渲染/隔离标准完成并已关闭，见[关单评论](https://github.com/openbkn-ai/bkn-dsh/issues/94#issuecomment-6385727060)；#99实机/人工/最终CI不随之关闭。原UI controller加原-30/native链新增4组通过：成功自身signal未abort，首结果可cancel；后续close abort保留operation，但流已收尾时未新增cancel，reopen未重复登录。未改生产登录/Job策略，#95及Windows Job归属/因果继续开放。

Windows最小补证草案分开-31受影响UI和原-30单Desktop carrier/cancel；不重跑已过argv/原helper启动/闭包/完整UI/B1，不复制句柄、不注入Host，缺现成只读Job来源记未知。仅本地材料，无新远端取件提交。正式0.2.0、数据配置/凭据保持，不升级DSH、不推送、不跑CI。Foundry未发布main新增授权分页/内容过滤提交8fd261a8，仅审阅未部署。详见[第49轮证据](../../evidence/2026-10-24-local-49/RESULTS.md)与[Windows草案](../../evidence/2026-10-24-local-49/WINDOWS-MINIMAL-PLAN.md)。当前无需用户操作。


## 第48轮本地诊断（2026-10-24）

已核对两版固定官方Mac Desktop ASAR实际boot/浏览器包，并用未改动boot回调、Connection/Gateway验证默认选择 `/api/remote.mux` WebSocket、`rpc.open`缺席。原-30消费者/服务stream加固定源码process生命周期共6组通过：首结果后cancel在服务端活跃时可经abort/terminate IPC触达注入terminateJob；terminal对照与迟到cancel不会，但非空fixture Job仍使runner等待。Windows API/直接结果/Job状态注入，无真实CLI、浏览器、Windows Job或完整Host UI，不能据此归因现场或称已修。继续冻结-30、不改终止策略，#95开放。

独立关单审查发现#94自身遗漏：28客户端文件、302双语key及19项现有定向检查通过，中文受控渲染仍有插件写死的Request/Trace/Receipt/Op/Status标签；保持开放并记为后续源码/候选变动待办，不以#99未完代替本项判断。#92–#99本轮仍OPEN，未修改远端issue；#96显式原生合同前提与#98未确认历史条件分别保留。

源码167文件、两版安装各82文件和每版16个固定源码blob、ASAR/-30/helper/r3身份均校验保持。未升级DSH/替换正式0.2.0、未改数据配置/凭据、未重包/提交/推送/CI。上游DSH状态同第47轮；Foundry正式仍v0.2.0，未发布main新增24提交至1e50a4fb含可选OAuth注册，300文件compare截断，未部署/套用。详见[第48轮证据](../../evidence/2026-10-24-local-48/RESULTS.md)。当前无需用户操作。


## 第47轮合并状态（2026-10-24）

收到Windows r3粘贴回报：固定fac4db78/-30的P1官方PS5.1 argv一次通过6/10两分支；P2仅A，用户确认的日常Chrome根11368被复用，CLI/runner同次约370ms采样消失，之后约4分钟无残留，原Chrome根在登录和Host退出后保持。浏览器信任仍BLOCKED。Windows原报告/清单未独立读取；r1残留、r2新树消失、r3既有根幸存各保留，不把r1新根/一直未关补为已证事实，不宣称runner修复或Job/浏览器因果。Mac6组受控证据保持原层次。

原-30/helper及r3交付保持冻结，未改源码/Host/正式0.2.0/数据配置，没有提交、推送、CI或部署。上游刚发布DSH rc.3 /1f81c047，选定7个Gateway/subprocess生命周期源码与当前新版rc.2相同；master大比较截断，未作全量差异或兼容声明，不升级pins。Foundry正式仍v0.2.0，未发布main新增HTTP错误包抽取到b058d07f，仅审阅未部署。

已纳入[逐项关单规则](ISSUE-WORKFLOW.md)：按每项自身标准完成并留证后关闭，不等无关项，不将fixture当required实机证据；#94等不无条件继承#99总门槛，#98未确认条件与#92总览收尾规则保持。本次只读核对#92–#99均OPEN/kalias，未关单或发表评论；#95/#99仍开放。见[第47轮完整汇总](../../evidence/2026-10-24-local-47/RESULTS.md)。其他合同缺口不因本轮关闭，后续交付分别列已关闭及仍开放issue。此前“等待r3”保留为历史状态。

## 第46轮本地诊断状态（2026-10-23）

暂不改-30，已用原打包登录consumer/service stream、两版官方Gateway真实loopback WebSocket及固定源码common binding / WindowsJobOwner / WindowsJobRunner（Windows API注入）补齐6组最小复现。首结果return会发cancel；受控延迟发送完成、服务端仍活跃时，注入的直接结果已结束后仍可abort并经terminate IPC调用注入terminateJob。读完terminal对照不发cancel，服务端移除后的迟到cancel被忽略；两对照中刻意非空的fixture Job仍使runner等待。调用方operation均未abort，不能把读完stream当完整runner修复。

这是受控线路/源码证据，没有真实CLI、Desktop carrier、Windows Job、浏览器或平台执行；现场Job成员、选路、关闭顺序/原因仍未知。两版Gateway归档integrity/执行字节、每版六个固定git源码blob及原-30各82文件核对一致。r3 fac4db78和输入保持冻结，Windows按既有范围执行，待结果回来统一判断，不追加矩阵。正式0.2.0、数据配置/其他worktrees保留，没有生产修改、提交、推送或CI。DSH仍687f282e，Foundry正式仍v0.2.0，新增5个未发布提交到2466c45f仅审阅未部署。见[第46轮证据](../../evidence/2026-10-23-local-46/RESULTS.md)。完整合同/其余门槛不关闭，本机当前无需用户配合。

## 第45轮交接状态（2026-10-23）

用户明确授权的r3独立交接已推送：`handoff/windows-local30-r3-20261023` / `fac4db78a1a974192fa13fdbe62063331cf04ec1`；交付KIT SHA256 `7daaca61691706ef476ce007eb4c49e8a8f538a30dc73764fea6f6a4281308d0`。原-30、r2 helper、SDK、Host pins与准备态r3全部执行字节不变，未重建。33文件独立产物树无workflow/开发源码；全新origin取件逐字节及26输入/82候选文件/SDK校验通过，检查时Actions/PR为空。没有CI、标签、发布、开发/main推送、Host启动或平台动作。

Windows先只跑一次官方PS5.1 argv回归，不复跑A/B启动验收、UI/B1。仅P1通过且用户确认日常Chrome可见窗口/进程身份后，才复用一个既有隔离Desktop做单次正常登录runner/浏览器取证；不重装/初始化、不扩展矩阵，缺前提blocked。r1残留/r2有限未残留、浏览器关闭顺序/Job未知各保留，不宣称修复。正式0.2.0、数据配置、旧refs与另一路-11保持；不授权Windows结果推送。见[第45轮回执](../../evidence/2026-10-23-local-45/RESULTS.md)和[固定提示词](../../evidence/2026-10-23-local-45/WINDOWS-PROMPT.md)。此前“r3未推送”保留为准备快照历史。完整合同及其余开放门槛不因交接关闭。

2026-10-23第44轮：收到96f8f76的Windows r2报告，A/B原helper初始化/正常启动及实际profile通过，按远程报告关闭该门槛。官方PS5.1 argv回归fail来自主会话新增测试的数组包装遗漏，原fail保留；本机仅改一行为@((pipeline))并补契约夹具，PS7正常/模拟PS5.1输出均经真实Node argv通过，额外参数负对照仍拒绝，Windows原生官方复跑待验。r3仅本地准备，同-30/helper/SDK不变，未提交/推送；下一步先仅跑一次官方回归，不重跑A/B启动/UI/B1。runner在60–80秒窗口内未残留，但新Chrome树同次采样消失，默认日常Chrome已运行条件未覆盖，54508判断已撤回；Job身份/先后/原因仍未知。首结果return/dispose的客户端提前收尾及原生cancel契约给出候选时序机制，受控夹具不是真实Windows因果证明，未改生产代码。正式0.2.0和数据配置保留，本轮无Host/平台运行、提交/推送/CI，不采用另一路-11，不触碰其他会话浏览器。见[第44轮](../../evidence/2026-10-23-local-44/RESULTS.md)及[本地r3](../../handoff/2026-10-23-021-local-30-windows-r3/FOLLOWUP.md)，Windows私有原件未在主会话独立读取。

2026-10-23第43轮：按用户本轮授权，r2已推至独立 `handoff/windows-local30-r2-20261023` / `96f8f7656103e8e066a12ea8d9d05d5e7dd96339`，候选仍同一-30，远端KIT摘要为f340d205…1e0e004；执行脚本与第42轮准备快照相同，仅更新交接/最小范围说明。全新origin取件32文件/25输入/82包文件/SDK校验通过，检查时Actions/PR为空。Windows只做公共argv回归和A/B原helper初始化/正常启动、各一次登录runner取证，必要时才加一个npm对照，不重跑完整矩阵。正式0.2.0及数据配置保留，旧交接和另一路-11不动，不跑CI；未授权Windows结果推送。完整验收仍开放。见[第43轮交接](../../evidence/2026-10-23-local-43/RESULTS.md)，下方r2尚未推送是第42轮准备历史。

2026-10-23第42轮：已收到743eb4a/-30的Windows四组合报告：实际profile闭包、82文件及有边界B1均报告pass，8个Interaction各唯一普通查询completed；主会话未读取Windows私有原件。A/B使用补丁launcher，原helper两处argv优先级错误已在本机复现并仅加括号修正；新r2材料未提交/推送，Windows5.1及A/B原版helper启动待复验。成功登录runner残留是待分诊finding，Job/浏览器后代原因未证实；不强杀或改生产实现。在途读取取消insufficient-evidence、浏览器信任blocked、RDP断连not-run及完整G6/安全/低权限/CE非空/旧销售/固定CI门槛继续开放。正式0.2.0保持，本轮无Host/平台动作、生产包变更、提交/推送/CI。另一路-11独立排除。见[第42轮汇总](../../evidence/2026-10-23-local-42/RESULTS.md)和[r2定向复验](../../handoff/2026-10-23-021-local-30-windows-r2/FOLLOWUP.md)，下方待收Windows文字为历史。

2026-10-22第41轮交接更新：用户专项授权的独立分支 `handoff/windows-local30-20261022` 已推送，固定提交 `743eb4a09f1577ba4490f1f6ccbaad834d68a43f`；只交付同一 -30 包及 Windows 材料，不同步开发分支。远端全新拉取的30文件、23项交接输入、候选82文件和官方SDK integrity通过，Actions/PR查询均为空，原生Windows复验待执行。另一路远端 -11 按用户决定独立排除，不采用、不合入、不修改，不设合流前置要求；覆盖下方历史“未来合流评审”表述。正式0.2.0及数据配置保留，不授权CI/发布或结果推送。旧fd87974/fb77c07冻结。后文第40轮“尚未交接”是准备阶段历史，当前取件身份与摘要见[第41轮交接记录](../../evidence/2026-10-22-local-41/RESULTS.md)。

保存日期：2026-10-13，Asia/Taipei。此目录保存已确认的计划、分析与源码路径，供其他会话或 agent 接手；不是实现完成、实机验收或发布证明。

## 当前开发状态（2026-10-22）

第40轮本地候选为 **-30**，82 文件、SHA256 `6d95ff7517dbe409875fd398784fe01049ba26d2b97c43fad65c817d3ea18ee9`。已修 Schemastery peer 与实际 profile 校验覆盖、英文标签间距，完成四 Mac 组合的实际同物理闭包、四个官方 CLI 原位升级保留配置、英文/焦点/窄窗等受影响 UI 及短 B1 普通查询。两源码基线各613 pass/1 Windows skip，类型、70项仓库、包审计和双Host各6组受控检查通过。9个真实 Interaction 独立读回仅普通查询/completed；不是模型 G6，也不把原 -29 四小时结果改记为 -30。

新23文件[Windows交接材料](../../handoff/2026-10-22-021-local-30-windows/HANDOFF.md)已在本机准备并校验，包含系统tar、持久Desktop日志和便携B1夹具；Windows原生尚未执行，Git-only取件还没有新的远端固定提交。旧fd87974/-27和结果fb77c07冻结。本轮没有提交、合并、推送、CI或平台替换，数据/配置保留、测试资源退出。另一路 kalias 的 -11 标签发布 workflow 早于本轮，未采用，未来合流需单独审阅。完整G6、安全、低权限、CE非空、Windows及最终固定CI候选继续开放。见[第40轮结果](../../evidence/2026-10-22-local-40/RESULTS.md)和[剩余门槛](../../evidence/2026-10-22-local-40/BLOCKERS.md)。

### 第39轮历史状态

第39轮已接收Windows结果分支 `results/windows-local27-20261022 / fb77c07`，核对其唯一父提交fd87974、唯一新增报告及用户给定SHA256一致；该分支无workflow运行、无PR。原Windows报告逐字节归档，私有259份证据仍在Windows，本机未下载原件。结论为部分预验：A/C实际profile闭包fail，B/D同版本双拷贝证据不足，C在门槛停止；A/B/D部分UI已测，Windows B1查询/G6均未完成，浏览器CA信任未过。

本机静态核对确认-29仍有相同Schemastery声明/私有profile解析差异及英文标签无间距；现kit仅检查runtime根，未覆盖实际profile闭包。依赖共享契约/校验器为优先待办，peer修改方案尚未验证；同时记录英文排版、Windows tar和启动日志、其余诊断观察。保留第38轮Mac长时B1实际结果及所有原失败，完整八组合/正式候选未通过。本轮只汇总文档，未修源码、重建包、启动Host、接触平台、提交、合并、推送或CI。Mac-29 / Windows-27 / CI-12保持分开，正式0.2.0不替换。见[第39轮汇总](../../evidence/2026-10-22-local-39/RESULTS.md)及[优先待办](../../evidence/2026-10-22-local-39/BLOCKERS.md)。

### 第38轮历史状态

第38轮保持原样本地-29，补齐不依赖Sandbox的B1长时协议路径：两版实际Mac Desktop及两版npm/web后端连续4小时30秒（477次采样），四个后端与两个原生主进程未变，正式CLI自然过期且等待期间凭据变化0。正常刷新、每Host独立浏览器重新登录、公开配置编辑器两次owner重载后，新Session普通查询均返回总计数40；16个Interaction的标准记录均completed，operations仅query_object_instance/completed。不是模型G6、完整销售明细或全部历史条件证明；npm页面未宣称连续打开4小时。

生产源码和包未改，没有重跑无关构建/测试，没有提交、推送、CI或平台替换。业务数据/选定配置、个人DSH五文件、原有596个工作区修改核对保留，四task patch恢复、测试资源已关闭；保留正常刷新后的凭据与新Session。收尾AX观察误拉起旧应用的自动化异常另记并已关闭，个人配置和Sandbox聚合再次核对一致。Windows仍fd87974/-27，远端ref未变，结果待回传。完整G6、低权限、CE非空联动、完整矩阵与最终CI候选继续开放。详见[第38轮结果](../../evidence/2026-10-22-local-38/RESULTS.md)及[剩余门槛](../../evidence/2026-10-22-local-38/BLOCKERS.md)。下方记录保留当时包/轮次身份，当前B1进展以本条为准。

### 第37轮历史状态

第37轮（2026-10-22）当前本地候选为 **-29**，82文件，SHA256 `dec3417310b4e50a80f987c69f573e41d78725ae2caabdd6ebfbf00b8a3914f6`。实际Desktop复现-27关闭溯源后HTTP/冷态CLI继续读取；-28通过原生可取消Remote stream及请求所属signal修复，两版Desktop与两版npm/web均完成CLI进程终止、4个HTTP取消、重新打开复验。随后真实npm诊断重新采集会丢失焦点，-29保留刷新按钮节点；4个Mac组合的刷新焦点、Escape及实际JSON导出通过。-29相对-28仅client.js/版本元数据改变，Host/Remote字节一致，取消源码未再变；实测结果按原包身份沿用，不写成全部矩阵重跑。

两套源码基线各611 pass / 1 Windows skip，类型、66项仓库、82文件包审计与双Host各6组受控通过；没有新增模型G6或Sandbox执行。正式0.2.0、业务12表78635行和选定配置、个人DSH配置保留，原任务patch恢复、临时应用/端口停止。旧销售/字段标签/连接恢复原失败、低权限暂缺、CE非空原生解释、B1长时、完整8组合与固定CI候选继续开放。

Windows此前经用户专项授权已交接 `handoff/windows-local27-20261022` / `fd879740e4292836a24dc1e411ee335619ba4c41`，仍为原-27，本轮复核冻结材料未变，尚未收到Windows结果。其结果不能覆盖后续取消/诊断焦点差异；需要以后独立交接复验。当前没有新提交、推送或CI，开发分支HEAD仍933b0ab，CI候选仍-12。当前CLI未过期，无需用户重新登录或选目录。

见[第37轮本地证据](../../evidence/2026-10-22-local-37/RESULTS.md)和[剩余项](../../evidence/2026-10-22-local-37/BLOCKERS.md)。

### 第35轮历史状态（2026-10-21）

第35轮继续使用原样本地-27，没有修改生产插件。旧销售原始调用已逐步核对：产品编码误用于sales_order_id，正确Function已完整发现但未执行，最后取消条件读取全表800并误报20单；两版发现的关键ID、参数与use_rule相同。TOON/JSON格式不同保留为观察，不由单个回合断言原因，也不改写旧失败。

本轮三个不依赖执行的G6原题在两版Mac npm/web与实际Desktop共12项，结果9 pass / 1 fail / 2 blocked。旧Desktop标准交期核心正确，但附加字段把group_type物料分类误标成group_name存货类别，完整答案未接受；两版npm在同Session连接恢复时选择run_code/Function，被执行前保护阻断，不能计恢复业务成功。Desktop两版恢复普通查询成功，认证/连接错误实际UI可读。完整目录未删改，8个业务Interaction/operations可读且无Sandbox执行。独立SQL、原答案/调用和失败均留存；评测新增标签混用禁止项，7项检查通过。完整G6继续未通过。

Windows[本地预验交接包](../../handoff/2026-10-21-021-local-27-windows/HANDOFF.md)已准备并本机校验，固定当前tgz/82文件、正式CLI完整性、双Host、CA、校验/进程脚本及结果模板；没有原生Windows实跑，也没有发送/推送。官方GitHub release不附Desktop安装器，已改用官方Windows feed/固定URL并单列签名/实际版本门槛。四份任务profile/原工作区绑定已还原，临时转发停止；npm临时-27挂载收态恢复原-23安装字节，Desktop保留-27，原会话与当前凭据引用保留。正式0.2.0、安全候选不部署、数据/配置及个人DSH保留；没有提交/推送/CI。见[第35轮结果](../../evidence/2026-10-21-local-35/RESULTS.md)和[当前G6边界](../../evidence/2026-10-21-local-35/G6-BLOCKERS.md)。

当前未发布本地插件为 **-27**，82文件，SHA256 `5a24a54fa327f04c79884b8303d44d0b2f0bae69e844169c31d28a69af832aef`。第34轮在实际新版Desktop复现 `Public.Unauthorized / token is invalid`：真实重新登录后仍失败。原生Cordis探针与生产失败回归定位到MCP子组件挂在调用方root、越过业务配置owner销毁的生命周期缺陷；-26保留构造时owner后，两版真实Desktop均在同Host重载/重新登录的新Session普通查询返回40。该回合由本地协议驱动选择工具，不是真实模型G6，也不证明所有历史长时触发条件已消除。

两版-26原生目录取消/重试/选择/绑定、登录取消/默认超时/进程退出/真实CLI重试，以及中英文目录与诊断交互已检查。视觉复核另发现诊断白底继承浅字，-27仅补诊断前景色并保留失败回归；两版官方Desktop冷启动复验中英文、800×600、滚动、键盘和实际JSON导出通过。两源码基线各606 pass / 1 Windows skip，类型、66项仓库、82文件包审计及同-27包双宿主六组受控通过。-27与-26仅client.js/版本元数据改变，后端/Remote字节一致；保留-26未受影响验证的原身份，不改写为-27新实跑。

正式0.2.0保持原样，安全候选不部署；用户已经决定暂不替换，不再等待同一部署确认。业务12表78635行、选定配置、用户修改和个人DSH配置保留；任务临时协议provider已移除、patch恢复、回环服务停止。G6依赖逐题列清：Sandbox/Function/CSV暂缓、低权限仍“暂缺”、普通查询与认证/连接原题另列待验。第31轮-23旧9 pass/1 fail/1未测、新10 pass/1未测仅为历史结果；旧销售明细失败保留。完整G6、八组合、CE非空原生解释及发布门槛未通过。最新远端仍933b0ab/-12；没有新提交、推送或CI。见[第34轮结果](../../evidence/2026-10-21-local-34/RESULTS.md)、[G6待验项](../../evidence/2026-10-21-local-34/G6-BLOCKERS.md)和[此前安全候选](../../evidence/2026-10-21-local-32/SECURITY-CANDIDATE.md)。当前无需用户继续选目录或登录。

### 第31轮业务检查点（保留原-23结果）

按[正式版验收合同](ACCEPTANCE-CONTRACT.md)开发，仅使用本机 `https://192.168.50.129`。官方 OpenBKN `v0.2.0`、正式 CLI `0.2.0`、TLS/登录和真实 MCP 已验证，原始数据与配置保留；历史 `50.28` 不是测试端点。保留旧构建 pin/生成器，同时支持两个精确 DSH 目标。

最新远端 build-only 候选仍为 `933b0ab` / `-12`，其双 Mac CLI zh/en 404 空态通过。后续至本轮 `-23` 均在本地推进。用户已确认优先级0为主料、非0为替代条，去根399行/333种；本体规则已落实到样例函数和本机已有Function/Skill，见[口径修正](../../evidence/2026-10-19-local-bom-rule/RESULTS.md)。采购G6另已固定为只查产品本身PR=0、PO=0，不自动展开BOM；该约定已落实到样例、本机对象说明和独立评测。

当前插件仍为未发布 `0.2.0-rc.2-openbkn.0.2.0-23`，同一tgz/80文件在两版官方Mac CLI web加载一致。业务迭代已推进到第31轮：225项样例源码验证、完整Function明细和独立SQL核对通过，源代码冻结后只补充BOM对象粒度说明；评测器7项本轮通过。插件未变更的源码/类型/73项仓库检查及六组受控结果沿用-23，当前安装字节另已重核。两版完整BOM/库存399行/333种文件及新版40单销售文件均从最终链接实际打开，摘要未变。12张原表78635行保留，库存2项和销售1项指标属性及用户已有修改保留。见[第31轮证据](../../evidence/2026-10-20-local-31/RESULTS.md)。没有新提交、推送或远端CI。

完整G6仍未通过：当前旧版9/10已测、新版10/10已测（各2项认证/连接负例沿用同一插件）；各1项低权限负例按用户“暂缺”未执行。本轮8个业务原题/宿主为新会话。旧版销售明细仍把全表第一页误报为产品20单并漏最终表，不能用另一题正确的40单计数或历史成功答案替代。新版完整BOM/库存和40单销售CSV已通过；16个业务Interaction/operations可读，CE非空业务解释仍404。**完整八组合、G6、非空原生解释、B1、SDK安全决策和人工/固定CI候选门槛继续开放。** 当前默认CLI无需重新登录；其他配置模型的独立对照尚待信息。全部收敛前不推送、不跑CI，不用答案仲裁、自动纠正回合或修改原始文件掩盖失败。

## 实现与交接历史

首次实现提交为 `4857c31225576f4f4b083ca26bb9469ab671b363`，分支 `feat/021-localization-login`，实现 zh/en、登录状态及原生事件/证据视图。以下保存各阶段结果；当前产物和验收状态以上文为准。

本地评审修复为 `1f7bc6bf11a10ac4bc69b125fd451d4afe69887c`，其后补充冻结预算上限测试，新增 37 项关键边界测试。跨视图联动提交 `ce8ebcb8c4f396c39e1db77fa8b235efe9cbc921` 已补齐执行步骤、来源/证据节点、业务定义与业务处理的统一选择、引用跳转和精确尝试区分，另新增 19 项测试。2026-10-19 五项边界修复提交 `542b3dd9127a7c9d9ba0f263fa2eee3c0e8814e8` 已补齐真实合同引用、重复 timeRail ID 校验、旧回答同步隔离、平台 invalid 状态/原因原样展示与全记录保留，以及密集引用分页；新增 20 项回归。第二轮修复 `902f337b9e0859ea42f3c76f82161d180edf4f78` 进一步隔离共享定义与结论链、重复导航和跨列表分页，并将原始/解释问答按来源展示、不补写缺失原文；新增 21 项回归。

共享输入选择修复 `5b5f2f582f60b4fe73399820ba87d612c4fb6dd0` 已避免回溯公共输入时误联另一查询，保留直接选择共享输入关联两条查询及平台明确披露的跨查询依赖；只调整本地展示导航，不改平台记录、状态或模型输出。新增 18 项回归，两个选择文件 **75/75**；该轮插件全量 **579 项中 578 pass、1 Windows skip**，仓库 60 pass，类型/兼容检查及包 dry-run 79 文件通过。**本地实现与受控测试通过，实机/人工验收仍未闭环；不等于所有开发边界覆盖。** 该轮按用户要求只保留本地；后续远程交接的专项推送授权见下文。

- [开发内容、验证结果与未完成项](../../evidence/2026-10-18-021-development.md)
- [已核对真实样本与冻结的原生读取合同](NATIVE-CONTRACT.md)
- [新增需求：支持 DSH 0.2.1-rc.3 并保留 0.2.0-rc.2 兼容](DSH-COMPATIBILITY.md)
- [远程接手：当前检查点、失败证据与后续步骤](../../handoff/2026-10-19-021-dsh-compat/README.md)

2026-10-19 用户新增并授权执行 `DSH-COMPAT`：同一插件候选包支持 DSH **0.2.1-rc.2 与 0.2.0-rc.2**，列为 #99 验收前置项。最初检查点 `0a362b32f9ce8cc931fc6878e78acc3985f045a3` 登记双版本源身份、调整 peer 声明、固定 Zod 并补四项元数据回归；当时旧基线插件 578 pass / 1 skip、仓库 64 pass，新宿主适配尚未完成。该阶段用户授权同步功能分支并交接指定远程会话，没有授权远端 CI 或发布。其后的适配、两次专项 build-only 授权与最新本地优先顺序见上文和验收合同。

以下为交接顺序与任务索引；历史范围中的“宿主升级不在本轮”由上述新增双版本兼容需求补充，但不自动升级用户实际宿主或平台。原始范围快照/归档清单保留其保存时的状态，不能把历史“未开始”文字当作当前执行状态。

## 先读这几个入口

| 入口 | 用途 |
|---|---|
| [项目的 bkn-dsh 专属视图](https://github.com/orgs/openbkn-ai/projects/12/views/6) | 组织已有 OpenBKN 0.2.1 项目，已关联 bkn-dsh；八项计划在建档时均为 Backlog |
| [#92 总览](https://github.com/openbkn-ai/bkn-dsh/issues/92) | 整轮范围、原生溯源可行性分析、功能边界、估算与七项任务索引 |
| [#93 P0 任务](https://github.com/openbkn-ai/bkn-dsh/issues/93) | 验证现有 CLI 凭据、新原生接口和真实非空样本，冻结溯源合同 |
| [冻结范围与完整分析快照](SCOPE-AND-ANALYSIS.md) | #92 的本次归档，可离线阅读；任务当前状态仍以 GitHub 为准 |
| [源码与环境路径](SOURCES.md) | 可移植的仓库相对路径、Mac 当前绝对路径、已核对提交与证据边界 |
| [归档身份清单](planning-manifest.json) | 来源 issue、更新时间、正文摘要与插件/上游参考基线 |

**#92 是总计划；#93 是其中的一项前置验证任务。** 溯源 Host/UI 实现先通过 #93；语言和登录状态工作可独立推进。总览中的任务清单是关联索引，建档时没有设置 GitHub 原生 sub-issue 父子字段。

## 接手顺序

1. 阅读仓库根目录 `AGENTS.md`、`CLAUDE.md` 和本目录。核对新会话实际收到的执行授权；保存计划不等于已授权开始开发或发布。
2. 读取 GitHub #92 与所接任务的最新正文/评论，检查是否有后续范围修正。本地快照保留原分析，不覆盖后续决策。
3. 检查目标 checkout 的 branch/HEAD/worktree、既有修改、main 最新提交和上游变化。已有 worktree 不应默认切分支、重置或复用为测试 home。
4. 原生溯源工作先执行 #93：用已有可读 Interaction 验证真实非空数据、授权、schema、身份和预算。没有可用样本时记录缺口，不制造业务记录或改平台来凑 pass。
5. 按下表承担明确文件职责；需要协作时按当时用户授权分配，避免多人同时改 DTO、入口或打包清单。
6. 固定候选前完成 `DSH-COMPAT` 的公开接口差异核对与适配；保留旧版本支持和测试，不用直接替换 pin 代替双版本兼容。
7. 受控测试与实际运行分列。两个 DSH 版本分别覆盖 Mac/Windows Desktop/npm；Mac 验收后提供独立、固定候选身份的 Windows handoff。发布依仓库规则及用户当时明确授权。

## 任务索引与依赖

| Issue / 本地任务 | 任务 | 依赖 |
|---|---|---|
| [#93](https://github.com/openbkn-ai/bkn-dsh/issues/93) | P0 原生 API/凭据/非空样本验证 | 首个溯源门槛 |
| [#94](https://github.com/openbkn-ai/bkn-dsh/issues/94) | 插件完整 zh/en 随宿主语言切换 | 可独立盘点；新溯源文案与 #97 集成 |
| [#95](https://github.com/openbkn-ai/bkn-dsh/issues/95) | 登录等待、结果、取消和重试状态可见 | 可独立推进；先复现异常再定责 |
| [#96](https://github.com/openbkn-ai/bkn-dsh/issues/96) | 原生溯源 Host 读取、有界 DTO、降级 | #93 通过 |
| [#97](https://github.com/openbkn-ai/bkn-dsh/issues/97) | 事件链/证据链双视图、联动与业务详情 | #93/#96；配合 #94 |
| [#98](https://github.com/openbkn-ai/bkn-dsh/issues/98) | B1 有边界的最小复现 | 第34轮已定位并修复MCP配置owner路径，两版真实Desktop有边界复验；全部历史长时条件未覆盖 |
| [DSH-COMPAT](DSH-COMPATIBILITY.md)（新增 P1） | 支持 DSH 0.2.1-rc.3，保留 0.2.0-rc.2；本地适配/受控验证通过，待实机验收 | 两版合同与正式平台基线；#94–#97 保持功能和回归 |
| [#99](https://github.com/openbkn-ai/bkn-dsh/issues/99) | 固定候选双宿主版本、Mac/Windows 最小验收与发布准备 | #94–#97、DSH-COMPAT 交付；#98 的调查结论 |

快速读取（以下仅查询，不安装、不启动 Host）：

```sh
gh issue view 92 --repo openbkn-ai/bkn-dsh --comments
gh issue view 93 --repo openbkn-ai/bkn-dsh --comments
git status --short
git branch --show-current
git rev-parse HEAD
```

Projects API 的现有 gh 登录在建档时缺少 `read:project/project` 权限；项目内容通过已登录网页保存并刷新核对。无需 Projects 权限即可用仓库 issue 链接和此目录接手；确需调整项目字段时再使用有权限的网页或登录。

## 保持边界

- 当前核心：zh/en、登录状态、平台原生数据的事件链/证据链，以及新增的 DSH 0.2.1-rc.3 / 0.2.0-rc.2 双版本兼容；B1 仅条件性修复。
- 插件只负责认证集成、网络访问治理、Interaction、诊断和溯源展示。业务语义/计算归平台，自然语言答案归模型。
- 不做答案仲裁、自动纠错回合、证据补造、全局历史工作台、平台部署、许可策略或跨客户端 token 管理；双版本兼容需求不自动升级用户实际宿主。
- 普通打开面板只 GET 已存在解释；POST 生成必须是显式用户动作并核对执行授权，可能调用平台模型与持久化结果。
- 当前已有本地源码与受控测试结果，固定候选和实机结果以顶部最新证据为准，完整双宿主八组合尚未验收；不要把 -10 产物或旧 `/tmp` 辅助目录当 0.2.1 交付。
