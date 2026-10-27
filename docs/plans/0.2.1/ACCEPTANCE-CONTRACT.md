# 0.2.1 正式版开发与验收合同

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

## 当前验收状态（2026-10-26）

第71轮用户明确D2/D3归属原则：插件不干涉模型与OpenBKN交互的业务内容；错误保留原始调用/响应/答案，盘点当时的版本与可复现场景/条件，提交OpenBKN分类和修复，不等上游修完才推进插件步骤。已提Foundry #2515（销售Function未调用/无过滤数据误报）、#2516（字段标签混用）、#2517（原生路由环境/能力边界确认），未将未知归属断言为平台服务缺陷。若实际证据指向插件丢参、错鉴权或错展示，仍须修复插件。D5按建议接受已知问题/环境/证据限制，不称已修。

D4用户提供的是“供应链有权、世界杯无权”。隔离正式CLI确认身份后，供应链详情200、世界杯403 Public.Forbidden；冻结-32在实际rc.3 npm Host拒绝世界杯绑定及跨网ToolRuntime请求，允许供应链schema读取，平台读回completed且只有一条search_schema Operation。仅本轮指定授权场景PASS；没有把原“无供应链权限”的YAML题、模型/UI或全形态测试记为执行。见[第71轮证据](../../evidence/2026-10-26-local-71/RESULTS.md)。

Windows r2固定e7b383b结果b7941883已接收：6个公开Git对象、报告/manifest及4项publicEvidence摘要匹配，欢迎窗截图已查看；113项私有原件未读。Before先于GUI、真实业务Service自动挂载profile回补及实例身份、GUI启动、手工After/Restore与保全收态按远程报告PASS；本机没有重跑。见[第70轮](../../evidence/2026-10-26-local-70/RESULTS.md)。

用户明确D1最小退出依据：欢迎态无菜单时，官方关闭按钮使整棵owned进程树退出、端口释放，可用于该轮最小退出验收。原“菜单退出”仍FAIL，exit code仍未观测，不补填0；controller超时与手工恢复分别记账，不为菜单入口重跑，不覆盖历史菜单异常或其他形态。

正式发布按[五项最小清单及已明确D1–D5](REMAINING-WORK.md)。独立G6仍保留真实FAIL/BLOCKED，当前目标非空原生联动仍未验；按用户决定转OpenBKN外部跟踪，不再充作插件全局停止条件或强迫插件修正业务内容。安全不足仅阻断受影响的新执行，不部署回补；插件权限守卫、准确展示、最终候选/兼容/制品身份和required checks保留。当前仍为local-development-preacceptance，ciRun=null，formalAcceptanceEligible=false；处置决定不构成推送/CI/发布授权。

以下第68轮及更早检查点保留当时状态；其中“Windows待回传/未执行”等历史描述不覆盖上述最新接收结论。

第68轮按用户单次授权将OS透传r2推到新独立分支 `handoff/windows-local32-profile-gui-r2-20261026` / `e7b383b96747dbeb3e6897c0e79039f7f3d1711c`，KIT SHA `99ccd2ff0e15077916bb25992985e2ea2a10c2763d1c7b7f9b05baf4605e5178`。controller与第67轮已测修正版逐字节相等，唯一代码差异为补传OS；其他变化只为交接身份说明/摘要。17个远端Git对象及checkout文件相等，输入82/12匹配，无workflow和检查时CI运行。不重跑第67轮5项或旧套件，Windows仅补新taskRoot的原短流程，Before/GUI/正常退出/Restore仍待r2实测，不能因推送或本地校验标PASS。见[交接回执](../../evidence/2026-10-26-local-68/RESULTS.md)。

第67轮接收5e55d09的Windows结果c0fa28d8：4个公开Git对象及报告/manifest/publicEvidence摘要匹配。输入、资源与profile准备PASS，controller漏传OS导致Before守卫失败，整轮BLOCKED；owned GUI未启动，真实业务自动加载、窗口/正常退出和After/Restore均NOT_RUN。完整环境诊断仅支持Before成功，不证明全链路。已在本地副本作一行OS透传修复，5项实际Node子进程环境回归通过；原PS守卫和候选不改，Windows原生修正版尚未执行、未推送、无新提交，不能标作验收通过。见[审阅与修复](../../evidence/2026-10-26-local-67/RESULTS.md)。

第66轮只补此前缺失的Mac npm/Web profile回补边界：旧rc.2/新rc.3各一个新隔离代码/home，运行根保持stock，冻结-32真实Service的manager自动挂载profile回补；三组件active、实例身份、一次合成连接及退出0通过。复用5e55d09观察器，不重跑跳转、GUI/UI、认证/B1或业务；Windows固定交接不改，仍待回传。另按#105原标准明确SDK OAuth仅在未来引入provider时重审，当前未配置provider/withOAuth/direct auth的桥接不要求新增全局OAuth工程；不宣称原SDK整体或其他消费者已修。见[第66轮](../../evidence/2026-10-26-local-66/RESULTS.md)。

第65轮用户单次授权的新Windows最小交接已推送：`handoff/windows-local32-profile-gui-20261026` / `5e55d090ee2996fe2a006a59bef012d28f8f278a`。仅一个已有官方rc.3 GUI＋新空profile，冻结-32真实业务模块自动挂载与窗口/正常退出；GUI前必须完整备份dsh关联配置或记录不存在，失败不启动，退出后只恢复三个已知写点并比较原内容，不改UserChoice/ACL。17文件远端原对象/checkout逐字节相等，workflow为0、检查时无CI运行；本地只有准备/Node静态/官方Electron只读身份验证，Windows PS5.1与GUI仍待回传。未重跑已过项、不扩GUI发行体系或发布范围。见[第65轮](../../evidence/2026-10-26-local-65/RESULTS.md)。

第64轮补齐Mac真实业务模块/profile层路径：冻结-32的原Service在旧rc.2/新rc.3隔离Desktop后端自行挂载回补MCP，挂载后callback/runtime身份相等，stock安装根未改；普通合成连接成功、跨源307第二源0、退出0。另仅用原官方rc.3 GUI和新profile补一次启动/实际挂载/菜单退出，未重跑向量、UI、登录或B1。该路线无需独立GUI发行或重签名，不等于Windows/旧Mac GUI、全局SDK/OAuth或最终候选通过。GUI启动后macOS URL处理器偏好文件摘要变化，当前dsh关联com.deepseek.dsh，缺启动前原文，范围未知如实披露；不称系统配置零变化。见[结果及最小交付边界](../../evidence/2026-10-26-local-64/RESULTS.md)。

#105 Windows非GUI子项按固定a362d783/-32及8f94288f回传验收：四路径stock/protected最终8/8，主会话独立核对12个Git对象、报告/manifest/verify-inputs摘要、10项publicEvidence与8份探针JSON；同源307均成功，stock第二源1含合成Session/问题，protected为0，factory SHA/fixture清理相符。无需再做Windows非GUI、Mac向量或旧UI/B1重跑。46项私有原件未读，82文件/闭包/安装器及Host全树收态依据远程报告接收。见[证据](../../evidence/2026-10-26-local-63/RESULTS.md)。

本结论仅覆盖两固定Host、Windows Node24.19.0与Electron44.0.0/44.7.0后端的合成307原生factory/ToolRuntime路径，不推广成任意Host版本、完整GUI、SDK全局/OAuth或最终CI候选通过。首次`--patch`注入未激活的记录保留，最终改用profile cordis.patch.yml；不能将这一调整定为通用CLI或插件缺陷。

Windows原run2/049d9f46的-31标签/溯源Escape/800×600客户区及-30登录/close-reopen观察已接收；本轮调查收尾，保留L0偏差、carrier/Job未知、菜单退出异常，正常菜单退出与owned清理分开，不追加文档重写或硬件采集。现有正式0.2.0、Host和冻结包保持，本轮不推送/CI或远端关单。

## 当前合同修订：归属红线与六组独立验收（2026-10-26）

按[六组工作](REMAINING-WORK.md)和本次用户明确决定执行，优先于历史路线。模型/OpenBKN内容错误的停止条件是留证、盘点、提报/分类，而非插件等待上游修完或改写答案。业务失败与平台非空缺口仍如实未验，不能改成成功；插件自己的协议/权限/治理/展示、实际ToolRuntime guard和最终CI候选要求继续保留。

1. **#105非GUI**：必要前提仅固定输入、Windows相应Node/Electron运行时、新owned副本/profile、冻结-32及实际MCP解析、合成对照和收态。独立GUI、生产签名、W-LIFE/Chrome、真实CLI登录均不是前提。输入完整性PASS不等于Windows运行PASS。执行范围见 [r2 N0–N3](../../handoff/2026-10-25-021-host-backport-windows-r2-nongui/kit/WINDOWS-MINIMAL-PLAN.md)。
2. **#105 GUI/交付**：当前最小方向是官方原App＋独立profile层MCP；第64轮已验证Mac真实业务自动挂载与rc.3 GUI启动/退出。无需独立GUI构建、appId、生产签名/公证或更新服务；只有以后明确选择分发修改GUI时才新增相应门槛。剩余只核对实际profile交付/恢复及尚未覆盖形态，不重跑已过向量/页面。官方原制品来源核验保留，不沿用被修改ASAR之前的签名。
3. **登录/B1**：只补已授权的d20a266缺口和实证缺陷；#95不扩为B3全量定责，B1既有有边界调查/长时证据复用，未复现历史条件仍开放记录，不默认要求重跑长时或RDP。
4. **矩阵/复验**：八组合真实覆盖与共享合同测试分层；不要求八份完整G6/UI/长时/升级。包或调用边界变化后只复验受影响项；历史包身份不转记最终候选，正式候选门槛仍按仓库发布规则。
5. **外部归属与授权**：原生路由由#2517确认环境/平台归属，销售/字段由#2515/#2516跟踪；不再因外部问题卡住插件步骤，不重复404、改模型输出、部署企业扩展或平台安全回补。低权限本轮有真实指定场景证据；旧逆向题和未覆盖形态不伪称已跑。未知版本如实显示未采集，不开发IAM/CA安装器。
6. **证据/关单**：按各issue自身标准，外部提报不等于修复或自动关闭本插件issue，不把#99全部门槛套给实现项；#94保持已关闭。D5已接受的限制准确披露；只按本轮实际范围保全，不每轮全库审计。本轮用户明确授权的远端动作仅三个OpenBKN issue提报，不包含代码推送、CI或发布。

当前完成文档/问题提报及新增D4授权验证；没有模型/Sandbox、代码推送、CI、平台替换或现有Host代码变更。新增测试登录会话和一条诊断Interaction为预期测试足迹，原业务数据配置未写入；下方历史描述不覆盖当前决定。

## 第59轮 GUI与Windows交付前置条件

2026-10-25：源码/纯函数评审与新descriptor gate完成，不能替代GUI隔离实现、全仓构建、实际签名/公证和Windows执行。旧/新Mac unsigned路径不同，官方开发app的协议注册/debug/cold-start路径须独立处理。Windows r1仅准备态，82/9/12/12输入匹配，--require-gui正确exit2；当前d20a266范围保持。第53/57/58结果按原层次复用，冻结 -30/-31/-32/现有Host/正式0.2.0保持，无推送/CI。 见[结果](../../evidence/2026-10-25-local-59/RESULTS.md)、[GUI构建签名路径](../../evidence/2026-10-25-local-59/DESKTOP-GUI-BUILD-SIGNING.md)与[剩余项](../../evidence/2026-10-25-local-59/BLOCKERS.md)。下文保留各轮历史身份。

## 第58轮 原生模块加载与 CLI 认证的范围内通过

2026-10-25：冻结 -32 在四个新隔离回补Host中实际运行：两版完整npm/web与两版官方Desktop后端；loader/类身份/82文件、实际MCP物理包、CLI过期后真实登录同步、MCP/目录及独立CLI读回均通过。此为原生服务方法验证，未验证浏览器Remote carrier、签名GUI或B1；浏览器“不安全”状态不记TLS信任通过。原包/Host/个人CLI/正式0.2.0保持，#105与完整合同仍开，Windows仍按d20a266原范围，不推送/CI。 见[本轮结果](../../evidence/2026-10-25-local-58/RESULTS.md)与[剩余项](../../evidence/2026-10-25-local-58/BLOCKERS.md)。下文保留各轮历史身份。

## 第57轮 #105 分层验收边界

2026-10-25：派生Host交付方案和本地完整npm/裸Desktop后端验证已补证；同源调用成功、跨源307第二源由1变0。源码/SDK策略复用第53轮，不重跑UI/B1/G6。两版归档可迁移与owner解析有证据，不能转记签名Desktop GUI、Windows、实际CLI认证、固定CI候选或完整合同通过。保持 -30/-31/-32及原样正式0.2.0；#105与发布门槛开放，Windows仍按d20a266补原缺口。 见[本轮结果](../../evidence/2026-10-25-local-57/RESULTS.md)、[完整交付方案](../../evidence/2026-10-25-local-57/HOST-DELIVERY-PLAN.md)及[剩余项](../../evidence/2026-10-25-local-57/BLOCKERS.md)。下文保留各轮历史身份。

## 第56轮 rc.3 Mac Desktop 新形态证据

2026-10-25：此前NOT_RUN的Mac Desktop已在官方rc.3新隔离副本实际安装同一冻结 -32，82文件/profile共用物理包及受影响UI最小检查PASS；包含菜单/三弹层焦点、中英文历史说明、800×600原生窗口滚动与既有历史溯源认证降级。后续恢复过期CLI后只补Mac两形态非空五Reference实际zh/en/zh及原值保持；原生业务解释仍404，没有Host登录/B1/模型或全形态人工验收，不转成正式CI候选通过。原Host/正式0.2.0与数据配置保持，正常退出收态；#105风险与Windows d20a266原补证范围不变，无推送/CI。见[结果与边界](../../evidence/2026-10-25-local-56/RESULTS.md)。

## 第55轮 Windows 回传与合并边界

2026-10-25：结果74c4d731的固定报告与公开证据摘要核对通过，私有运行证据未独立读取。Windows输入仍为d20a266、UI -31 / 生命周期 -30，A/B分别旧/新rc.2。安装/历史说明/对比度及局部键盘按报告PASS；U1 BLOCKED、溯源和精确800×600 NOT_RUN（保留664×538另尺寸通过），L0 BLOCKED、L1–L3 NOT_RUN、Job因果UNKNOWN。-31有实际UI行为修复，不能依据三文件差异称纯locale；-31登录不能转记 -30 生命周期。当前 -32/rc.3及最终CI门槛不随之通过。见[合并结果](../../evidence/2026-10-25-local-55/RESULTS.md)和[逐项矩阵](../../evidence/2026-10-25-local-55/CONSOLIDATED-MATRIX.json)。无Host/平台/数据配置动作、推送或CI。

## 第54轮 -32 本地最小验证状态

2026-10-25：-31 修复已承接到主树 -32，最终本地候选 SHA256 `46626510825fe9146aef12c27a1724acbb455aeac22aa600358add0fc8e1c9f8`（82 文件）。构建、6 项受影响测试、包审计和隔离 rc.3 npm/web 实际 profile 闭包通过；实际加载 -32，完成受影响 UI 最小检查。初包与最终包仅两份 README 不同，前后运行身份和限定复用依据见[本轮结果](../../evidence/2026-10-25-local-54/RESULTS.md)。`ciRun=null`、`formalAcceptanceEligible=false`；非空平台五标签、其他 rc.3 形态、#105、安全/G6/人工和最终同包验收仍开放。原 -30/-31/d20a266、现有 Host/正式0.2.0及数据配置不改，无推送/CI。下文各轮记录保留历史状态。

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

2026-10-23第42轮合同增量：Windows -30四组合报告实际profile/同包82文件、短B1及8条唯一普通查询Interaction读回通过；A/B功能结果注明“补丁launcher”，不能关闭原helper启动门槛。原helper两处argv优先级错误已本地复现并修于独立r2，Mac PowerShell7.6.8真实argv通过不替代Windows5.1/A/B原版helper启动。成功登录的直接CLI退出与整个runner管理范围清空分开验收：A/B仍有runnerfinding；取消/超时及最终Host退出的清理结果保留。在途取消insufficient-evidence、浏览器信任blocked、RDP断连not-run；平台摘要只覆盖报告列明三个视图。主会话未读取Windows原件，不补全截断摘要。r2未提交/推送，原候选不变，正式0.2.0不替换，无CI或生产动作；完整合同仍未通过。见[第42轮](../../evidence/2026-10-23-local-42/RESULTS.md)及[定向复验](../../handoff/2026-10-23-021-local-30-windows-r2/FOLLOWUP.md)。

2026-10-22第41轮交接例外：用户已授权并完成独立分支 `handoff/windows-local30-20261022` 推送，固定提交 `743eb4a09f1577ba4490f1f6ccbaad834d68a43f`，仅同一 -30 预验包与执行材料。开发/main不推送，不跑CI，不替换正式0.2.0，保留数据配置；不扩大为结果推送或发布授权。远端取件及摘要校验通过不等于Windows原生验收，完整合同继续开放。另一路远端 -11 明确独立排除，不采用、不合入、不修改，取代历史未来合流评审要求。旧fd87974/fb77c07保持。当前完整身份见[第41轮交接记录](../../evidence/2026-10-22-local-41/RESULTS.md)，下方第40轮未推送状态保留为历史。

更新：2026-10-22，Asia/Taipei。用户要求按正式版合同开发，并使用本机测试环境。本合同补充原计划及双宿主需求；历史证据不改写为本轮验收。

开发节奏（用户最新指示）：完成当前已授权 `933b0ab` 的 build-only CI；此后先在本机完成全部开发、本地构建与验证，收敛问题后再统一同步分支并执行最终远端 build-only CI。未完成项和失败不能通过再次触发 CI 代替。

## 第40轮当前状态（2026-10-22；本地 -30）

实际 profile 闭包门槛已在四 Mac 组合本地收敛：Schemastery peer，旧/新 Host 分别共用3.18.4/3.18.5，与Cordis一起比较realpath；官方解析器与插件parent的Node解析、真实运行观察分别保留。新校验器必须包含实际 profile 和候选82文件，installation-only 不作 profile 通过。四官方 CLI 原位升级均清理旧私有包并保留配置。插件Zod4.4.3与官方Host自身版本/声明分开验，不能覆盖官方二进制凑通过。

本地-30 SHA256 `6d95ff7517dbe409875fd398784fe01049ba26d2b97c43fad65c817d3ea18ee9`；两源码各613 pass/1 Windows skip、类型、70仓库、82文件包审计和双Host各6组受控通过；四Mac英文标签/焦点及短B1受影响路径复验，9个正式平台普通查询Interaction读回completed、仅query_object_instance。协议夹具不是模型G6，不迁移历史-29四小时/-28取消的包身份。新Windows23文件kit只在本地，Git-only取件没有新提交；Windows原生PowerShell/tar/关闭shell后日志及受影响矩阵保持not-run。

正式0.2.0、数据配置及个人文件保留，owned资源关闭；不提交/推送/CI/替换平台。远端本轮之前另有kalias -11标签workflow 39720608436，不是本轮运行或本会话的-12候选，未安装/采用；未来合流先评审#102重叠改动。完整G6/Sandbox安全、低权限、CE非空、其他诊断观察、Windows和最终固定CI候选仍开放。见[第40轮证据](../../evidence/2026-10-22-local-40/RESULTS.md)与[剩余门槛](../../evidence/2026-10-22-local-40/BLOCKERS.md)。下方旧矩阵保留原历史身份，当前增量以本节为准。

## 第39轮历史状态（2026-10-22；Windows结果已接收）

Windows `results/windows-local27-20261022 / fb77c07` 已只读拉取：唯一父提交fd87974、唯一新增报告、SHA256 `86adfeb6c5f3d0b205dbdafa95a3d9cac439fad0995b3c5484283a6fe59e61e9` 均核对一致，分支无workflow/PR。原报告逐字节保留，259份私有证据仍在Windows，现场结论按远程报告层次记录。A/C profile闭包fail；B/D同版本双拷贝证据不足；C后续未执行，A/B/D只有部分UI和登录证据，Windows B1普通查询/G6未完成，Chrome/Schannel信任未通过。详见[第39轮八组合汇总](../../evidence/2026-10-22-local-39/RESULTS.md)。

本机-29只读复核也存在旧Host根3.18.4/profile3.18.5及新版同版本不同realpath；kit的runtime根遍历未检查实际插件profile。新增优先门槛为共享框架契约与profile闭包/校验覆盖收敛，peer方案未验证，不能以根闭包通过代替。-29也保留英文标签/值无空格，另记录Windows tar选择及诊断/启动观察。既有Mac4小时30秒B1实跑按原条件保留；Mac-29、Windows-27和最后CI-12不是统一候选。当前只汇总，无生产修改、重建、Host/平台执行、提交、合并、推送或CI；正式0.2.0不替换，完整合同仍未通过。[剩余门槛](../../evidence/2026-10-22-local-39/BLOCKERS.md)已更新。

## 第38轮历史状态（2026-10-22；原样本地-29）

不依赖Sandbox的B1本机长时门槛已补齐：两版实际Desktop及两版npm/web后端保持原进程4小时30秒（477次采样），自然过期后正常刷新、独立真实浏览器登录和同Host两次owner重载后的新Session查询均通过。16个实际Interaction标准状态completed，唯一操作query_object_instance/completed，总计数均40；不是完整销售明细、远程模型G6、npm页面四小时或所有历史条件的证明。门槛事先固定，期间未用RPC/刷新保持活跃；使用正式129直连，无第37轮转发夹具。见[预定长时合同](../../evidence/2026-10-22-local-38/B1-LONG-CONTRACT.md)与[结果](../../evidence/2026-10-22-local-38/RESULTS.md)。

本轮生产源码/包未改，继续同-29/82文件及原SHA；没有提交、推送、CI或平台替换。数据、选定配置、个人五文件和既有工作区修改保留；任务配置恢复、进程/端口/防睡眠守卫关闭。收尾AX读取误启动已退出旧应用的自动化异常独立保留，关闭后再次核对个人配置和Sandbox聚合不变。Windows仍fd87974/-27待回传；完整G6/低权限/非空原生联动/完整矩阵及最终固定CI仍开放，[逐项门槛](../../evidence/2026-10-22-local-38/BLOCKERS.md)不因本轮协议路径通过而关闭。正式0.2.0保持原样，当前禁止推送/CI。

## 第37轮历史状态（2026-10-22；本地-29）

第37轮（2026-10-22）当前本地候选为 **-29**，82文件，SHA256 `dec3417310b4e50a80f987c69f573e41d78725ae2caabdd6ebfbf00b8a3914f6`。实际Desktop复现-27关闭溯源后HTTP/冷态CLI继续读取；-28通过原生可取消Remote stream及请求所属signal修复，两版Desktop与两版npm/web均完成CLI进程终止、4个HTTP取消、重新打开复验。随后真实npm诊断重新采集会丢失焦点，-29保留刷新按钮节点；4个Mac组合的刷新焦点、Escape及实际JSON导出通过。-29相对-28仅client.js/版本元数据改变，Host/Remote字节一致，取消源码未再变；实测结果按原包身份沿用，不写成全部矩阵重跑。

两套源码基线各611 pass / 1 Windows skip，类型、66项仓库、82文件包审计与双Host各6组受控通过；没有新增模型G6或Sandbox执行。正式0.2.0、业务12表78635行和选定配置、个人DSH配置保留，原任务patch恢复、临时应用/端口停止。旧销售/字段标签/连接恢复原失败、低权限暂缺、CE非空原生解释、B1长时、完整8组合与固定CI候选继续开放。

Windows此前经用户专项授权已交接 `handoff/windows-local27-20261022` / `fd879740e4292836a24dc1e411ee335619ba4c41`，仍为原-27，本轮复核冻结材料未变，尚未收到Windows结果。其结果不能覆盖后续取消/诊断焦点差异；需要以后独立交接复验。当前没有新提交、推送或CI，开发分支HEAD仍933b0ab，CI候选仍-12。当前CLI未过期，无需用户重新登录或选目录。

详见[第37轮证据](../../evidence/2026-10-22-local-37/RESULTS.md)及[受阻项](../../evidence/2026-10-22-local-37/BLOCKERS.md)。

## 第35轮历史状态

第35轮（2026-10-21）：同-27临时加载于两版官方Mac npm/web，实际两版Desktop仍加载同-27。三个原题各四个Mac组合得到9 pass / 1 fail / 2 blocked；4个同Session恢复回合另列，不与完整11题G6混分。旧Desktop首次标准交期回答的附加字段标签错误保留，虽核心1天/自制口径正确仍不接受整答；npm两版恢复选择执行路径并在派发前阻断，不算查询成功。两版Desktop恢复普通查询成功；认证/连接原题均模型前失败，真实UI可读且无业务数据。8个实际Interaction/operations可读，平台Sandbox存储聚合未变。历史-23完整G6分数不转记当前包。

旧销售完整Function在原始回合中已披露相同ID、业务schema与use_rule，未发现丢失契约；旧模型先用错字段、后未执行Function、又去掉条件，是可证实的路径偏差。TOON/JSON只是观察，内部选择原因未定。生产插件、平台Function/数据/配置均不为本轮答案问题改变，评测集新增字段标签混用禁止项，7项通过。Windows材料已本地准备，保留CI run=null与原生未测边界；本轮无提交/推送/CI，原样正式0.2.0不替换。见[第35轮结果](../../evidence/2026-10-21-local-35/RESULTS.md)、[当前G6](../../evidence/2026-10-21-local-35/G6-BLOCKERS.md)及[Windows交接](../../handoff/2026-10-21-021-local-27-windows/HANDOFF.md)。下方第34轮及更早说明保留其原始身份。

## 第34轮当前状态（2026-10-21；未发布本地-27）

平台保持原样正式0.2.0，两个安全候选不替换。当前-27为82文件，SHA256 `5a24a54fa327f04c79884b8303d44d0b2f0bae69e844169c31d28a69af832aef`。第34轮实际新版Desktop复现重新登录后 `Public.Unauthorized / token is invalid`；原生Cordis与生产失败回归定位MCP子组件越过业务配置owner销毁，-26最小修复后，两版同一Host在重载和真实重新登录后标准查询均返回40、仅有query_object_instance。工具由本地协议驱动选择，不是模型G6；不证明所有历史长时条件均已消除。

两版-26原生目录取消/重试/选择/绑定、登录等待/取消/默认超时/子进程退出/真实CLI重试、焦点/Esc和中英文交互已检查。后续视觉复核发现诊断浅字白底，-27仅设置自身前景色；两版官方Desktop冷启动的zh/en、800×600、正文滚动、键盘与真实JSON导出复验通过。两依赖源码各606 pass / 1 Windows skip、类型、66仓库项、82文件审计与同-27双宿主六组受控通过。-27相对-26只有client.js和版本元数据改变，Host后端/Remote字节一致；保留-26未受影响验证的明确来源，不宣称所有场景在-27新跑。

本机可做且不调用Sandbox的本轮验证完成。G6逐项依赖、普通查询/认证连接待验及低权限暂缺单列；第31轮-23模型结果不转记到当前包，旧销售明细失败保留。原始业务数据/选定配置/用户修改/个人DSH配置保留，临时provider与服务清理，当前无需用户登录或选目录。完整合同、真实模型G6、CE非空原生解释、Windows、人工联动与最终固定CI候选仍开放。没有新提交、推送或CI。见[第34轮证据](../../evidence/2026-10-21-local-34/RESULTS.md)、[G6待验清单](../../evidence/2026-10-21-local-34/G6-BLOCKERS.md)。以下第23至33轮文字保留各自历史身份。

## 固定基线与验收环境

| 对象 | 本轮合同 |
|---|---|
| OpenBKN | 官方 `v0.2.0`，解引用后的 commit `81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b`；不能用同名版本字符串或 `06c5a87` 准备快照代替 |
| SDK/CLI | 正式 npm `@openbkn/bkn-sdk@0.2.0`；记录实际解析版本、可执行路径、TLS 与登录状态 |
| DSH 旧版 | `dsh-v0.2.0-rc.2` / `639ed015397290b3745d163aafe02ffee4aa3f84`；Cordis `4.0.4`，Schemastery `3.18.4`，pnpm `11.7.0` |
| DSH 新版 | 第53轮按用户指示改为 `dsh-v0.2.1-rc.3` / `1f81c047fc48fa190a683e469daa699857e9afe8`；Cordis `4.0.5`，Schemastery `3.18.5`，pnpm `11.28.5`。既有 rc.2 证据保留原身份，不转记 rc.3 |
| 构建 | 保留固定旧版生成器和原有源构建补丁；同一 tgz 在两个未打补丁的官方 npm 宿主包集合中运行；宿主 closure 不得混入另一版本 |
| 本机平台 | `https://192.168.50.129`；context `kind-bkn-test-015-lan`；CA 为本机 `test-deploy/tls/ca.crt`，证书 SAN 已现场核对 |
| 其他机器 | 不连接 `192.168.50.28`；旧记录中的该地址仅为历史来源，不是本次测试端点 |

本机 2026-10-19 升级前状态：主要业务服务运行 `0.2.0-release.20261011115044.sha06c5a87`，Studio 为 `...shac778f73`；同名 CLI 0.2.0 来自本地构建包，登录已过期。该准备快照的历史结果不能充当正式平台证明。

用户随后明确授权升级本机平台、保留数据和配置。现已通过正式部署及数据保留检查：官方 Foundry `v0.2.0` / `81d57528`，16 个正式 0.2.0 Chart、原样例 Chart 0.1.0，17 个 release deployed、27 个运行 Pod Ready，迁移 Job Complete；正式 npm CLI 0.2.0 的 lock integrity 与注册表一致。运行镜像与注册表 ARM64 manifest/config 及正式 tag CI 的对应证据保存在本机 `test-deploy/formal-020/`。8 个原 PVC、39 表行数、选定 KN/模型/类型/工具/Skill/绑定数据、原 Trace 主键及非 Helm Secret/TLS/独立凭证保留检查通过。Sandbox 拉取失败已用同一正式镜像预载恢复；旧空目录标记已补回，未覆盖现有对象。

本轮部署结果与边界见 [正式平台升级证据](../../evidence/2026-10-19-formal-platform-upgrade.md)。用户已重新登录；正式 CLI、live initialize/tools/list/schema、采集开启/关闭的实际 managed 调用已执行。用户另行授权 `41507f9` build-only CI，生成固定 -11 候选；其后真实 UI 复现一处 404 空态文案缺陷，修复提交 `933b0ab` / 未发布 -12，两版依赖基线各 585 pass / 1 Windows skip、类型检查、66 项仓库测试及包审计通过，用户已授权其 build-only run `39268135924`，现已success，固定 -12 tgz SHA256 `513b2019895014871e9025bf8790b42e43c75867f5df8a71bb6f279a3b4f4336`；两版Mac CLI的zh/en 404空态复验通过，见[-12证据](../../evidence/2026-10-19-ci-933b0ab-followup/RESULTS.md)。详细候选、真实问答及未通过项见 [本轮验收证据](../../evidence/2026-10-19-ci-41507f9-acceptance/RESULTS.md)。用户 DSH 安装升级、PR、合并、tag、发布和 dist-tag 不在此次授权内。

本地后续：-13 修复了实际白字白底的关闭按钮，两版源码各586 pass / 1 Windows skip，实际Mac CLI对比度复验通过，见[本地-13证据](../../evidence/2026-10-19-local-13/RESULTS.md)。该阶段本地包为未发布 -14，补充与守卫一致的 spill 分页恢复和远端文件边界指引，修复独立评测器非布尔输入误计通过；两版源码各587 pass / 1 Windows skip、类型、仓库/评测器73项、79文件包审计、同包双宿主五组受控检查及实际分页/连接负例通过。-14 两次实际模型 BOM 回合仍未通过，见[根因与本地验证](../../evidence/2026-10-19-local-14/RESULTS.md)。-13/-14 都没有新远端CI、提交或推送。用户再次要求全部收敛前不推送、不跑CI；当前保持该限制。

404 已经进一步定位：同一已有 Interaction 的标准记录/27条操作在 HTTPS 与 Service 直连均200；原生业务 detail/explanations/list 均为完全相同的 plain-text404。运行的是正式社区构建，源码通过可选 enterprise mounter 提供业务解释路由，Community 未注册。这是当前部署不具备该功能，不是本次 CLI 登录过期或 DSH 读取路径被网关误转发。继续使用社区版；只有非空企业原生业务解释依赖对应扩展，不把“正式版”改成“企业版”，也不自动删除原验收条件。

BOM 正式验收口径已由用户确认：按本体，`alt_priority=0` 为主料，非 0 为替代条，`alt_method` 不参与判定。产品 `382-000005` 去根主料为399行、333种，含替代条为506行、407种。此前313/272来自函数和Skill额外排除 `alt_method="替代"` 的缺陷，仅保留为历史失败证据。应在 OpenBKN 样例函数、Skill 与独立评测中统一规则，并以本机实际执行和只读SQL交叉验证；保留原始数据、对象身份、绑定与其他配置。默认depth/全局统计混淆、数值转述和完整交付失败仍需分别验证。插件不得硬编码业务公式、改写答案或追加纠正回合。

该规则现已在样例源码及本机已有BOM函数/倒排Skill落实：189项样例测试、7项评测器测试、79文件包审计通过；同一 -14 插件在两版真实DSH的399行分页与SQL逐行核对通过。12张供应链表78635行前后摘要一致，其他KN/模型/本体/绑定未变。两次新模型回合仍未通过完整问答：旧版333种表格中11项库存未说明取整，新版CSV仅在远端生成、在DSH中不可打开。保留不推送/不跑CI限制，见[本体口径修正证据](../../evidence/2026-10-19-local-bom-rule/RESULTS.md)。


此前本地 `-18` 的库存精度指引与 CSV 交付，已在同一本地 tgz 的两版真实 Mac CLI web 宿主定向通过：各399行主料/333种、11种含小数库存逐项核对无差异，两个文件已实际打开且摘要未变。新增导出通过已有 managed run_code 读取当前 Conversation 的 CSV、由原生文件服务在当前工作区新建并验证，旧 DSH 使用 Session header 中的固定 cwd，新 DSH 优先使用 workingDirectory 服务；不使用进程 cwd。该阶段两版源码各597 pass / 1 Windows skip（总598），类型、仓库/评测器73项、80文件包审计、旧生成器补丁verify与同包双宿主六组受控检查通过。

该阶段不关闭完整BOM/G6：旧回答仍混淆含根400/334与去根399/333，额外派生差值列符号与列名相反；新回答最后仅引用“上面的链接”，文件须从原生改动卡打开。保留原始答案和文件，不做仲裁或追加纠正回合。12张业务原表78635行及上轮本体修正后的选定配置未变。见[本地-18证据与未通过项](../../evidence/2026-10-20-local-18/RESULTS.md)。

此前本地-23检查点（当前业务结果见下文）：未发布 `-23`，冻结 tgz SHA-256 `fd2b0126d66e5f7bad4241516d81724b03c0089552b6d3036b77364fc8e7368e`，两版实际 Mac CLI web 安装的80个文件一致。平台业务层返回 components / selected_depth / source_rows 三种显式范围及各自逐层统计；去根主料399行/333种、各层行数9/23/40/278/49。库存范围、无记录与实测0、小数和单行单耗含义分别披露。插件补齐正式 Function 发现到执行的扁平参数合同、受支持导出的工作区相对链接，以及拒绝 Host/raw-query 后仍可使用已注册导出的说明。不得把业务数字、答案仲裁或固定报告模板放入插件。

两版源码各599 pass / 1 Windows-only skip（600 total），类型、仓库/评测器73项、样例200项、80文件审计、旧生成器verify及同包双宿主六组受控检查通过。实平台/独立SQL核对全部399行、两种库存范围、全仓11种小数和30组逐层范围。当前生产可用仓CSV不含小数，不用它替代全仓11项精度证明。旧版两个完整BOM文件均从最终回答链接实际打开，原字节未变；新版在本轮BOM库存题只返回L1/L2的32行，没有完整CSV，仍失败。

采购 G6 已由用户明确固定为**只查产品本身，沿用直接查询基准**：`material_number=382-000005` 的 PR=0、PO=0。除非用户明确要求 BOM 关联采购，不展开子料、不把其单据加入本产品结果。该约定已写入评测和样例/本机 PR、PO 对象说明；只改 comment/update_time。元数据调整后的两版新会话均明确分别给出0/0；此前扩展到BOM的回答保留为范围越界失败。旧版额外诊断扫描、重复拒绝调用及其“未重试”表述仍单独记录为过程异常。

完整G6仍未通过：旧宿主8/10已测（正例5/7、负例3/3），新宿主5/10（正例2/7、负例3/3）；各有1项低权限负例未执行，用户已回复“暂缺”。18个真实Interaction及operations均200，非空企业原生路由仍404。12张原表78635行摘要未变，选定配置仅有两个既有Function、BOM/PR/PO三处对象说明和一个新增只读能力绑定的预期变化。负例用隔离无效凭据和临时HTTPS故障代理完成，现已恢复任务profile/工作区索引并停止代理，默认CLI无需重新登录。详见[本地-23完整证据](../../evidence/2026-10-20-local-23/RESULTS.md)。-15至-23没有提交、推送或远端CI；全部本地问题收敛前继续禁止这些操作，当前不具备最终CI条件。

## 本地业务状态（第31轮，同一-23插件；第32轮未重跑模型）

插件字节未变，仍是上述-23冻结tgz；第24至31轮是本机业务迭代，不是新发布版本。当前BOM/库存函数默认完整所选范围CSV及独立一级预览，只披露所选口径；原始含根审计统计显式`include_audit_scopes=true`才返回。分支区分父层/子层，行数与material_code去重数分别计算，`csv_export.columns`提供实际列名。新增只读销售明细与确切编码/所选数据集查询，计算/语义均在平台业务层；插件不改答案。业务源码225项通过，最后仅BOM对象说明调整，冻结代码未变；评测器7项本轮通过。

两版当前构成和完整库存CSV均为399行/333种，全部来源字段、单耗及库存/预留/记录数/无记录空值与独立SQL一致；四个原文件均从最终链接实际打开，摘要未变。新版销售40行、13源字段CSV也已打开并逐字段核对通过。生产仓文件当次没有小数；另以与当前全仓Function输出同字节的原件重核11种小数，不混称为当次模型UI覆盖。

本轮每版8个业务原题采用独立新Session；两项认证/连接负例明确沿用同一未变更插件的-23验证。G6当前为旧版9/10已测、新版10/10已测，各1项低权限负例仍“暂缺”未执行。旧版唯一业务失败是销售明细：正确函数已发现却未调用，未过滤的全表页返回total_count=800，最终误称按产品精确过滤后共20单且漏最终表/文件；SQL和同批数量题均为40。保留该失败，不用另一题或历史成功答案替代。G6及完整合同继续**未通过**。

16个本轮业务Interaction/operations均200，CE非空原生解释仍404。12张原表78635行未变；预期配置变化为两个既有Function修改、两个新增只读Function、六个对象comment与五个属性comment、三个增量只读绑定，原绑定、指标属性和其它配置保留。需区分已测、沿用及未测，不能把completed或评测器退出0当正确答案。其他已配置模型路由的独立对照仍待信息；未换模型。详见[第31轮完整证据](../../evidence/2026-10-20-local-31/RESULTS.md)。没有新提交、推送或CI，当前仍不具备最终远端build-only CI条件。

## 当前本地状态（第32轮：安全、Desktop和登录）

运行平台仍固定官方0.2.0，未自动升级；用户重新登录后，已按其授权用computer use完成后续本机CLI浏览器登录。正式Sandbox确认会持久化run_code event中的token：只读聚合670条执行中395条含非空token字段、8种不同值；未读取/导出值、验证有效性或证明外泄。trace关闭不能消除该存储问题。四文件上游安全回补及两个独立本地镜像已构建，存储/Go回归与实际镜像离线验证通过，见[具体候选和回滚](../../evidence/2026-10-21-local-32/SECURITY-CANDIDATE.md)。第33轮用户明确选择“保持当前正式0.2.0，暂不替换”；两个候选仅保留本地，不再等待同一部署确认，安全缺陷仍开放，可能调用Sandbox的模型验收继续待验。未来若另获部署授权，须单独标记“正式0.2.0＋安全回补”，不与原样正式镜像混称同一基线，也不改写旧结果。

本轮真实Desktop发现弹层焦点/Esc缺陷，以及登录取消后子进程继续运行。当前未发布本地插件为-25，SHA256 `ec33b3ff3776b28a939a12e7c8b822bfa2878e812db13edd3a0db59794a25d63`，229313字节、81文件。小型焦点hook补齐业务和诊断弹层；新增原生可取消Remote登录流，保留原unaryAPI及业务/权限/CSV边界。固定旧生成器未升级。两依赖基线各601 pass / 1 Windows skip、类型、66+7仓库/评测器、81文件审计与同包双宿主六组受控检查通过。

两个官方Mac Desktop均在独立home加载同-25包、逐文件一致，官方app签名及安装闭包核对通过。真实登录/同步、受控等待/取消/默认两分钟超时、进程回收、随后真实CLI重试与2网列举、zh/en业务/诊断和实际JSON导出已验证；新版另完成800×600窗口可读性和键盘导出。旧版工作区由用户选择后已绑定；新版系统脚本目录窗口超时，随后通过Desktop原生工作区入口和插件公开Remote完成同一隔离目录的授权绑定，真实UI显示对应业务会话入口，不把插件目录选择器交互记为通过。诊断的DSH/已加载版本仍“未采集”，不可用磁盘版本替代。实际Desktop业务模型、非空原生溯源及完整人工矩阵未完成。

B1短流程在两版真实DSH服务组合中保持同进程/Service/MCP owner，真实CLI凭据变化后新Session/Interaction查询成功，四个实际operations均只有query_object_instance；未复现Unauthorized。该探针没有原始长时Desktop或模型，不关闭原始B1。G6仍沿用第31轮-23的9/10与10/10已测结果及低权限暂缺，不把本轮直接查询冒充模型题通过。12张原表78635行、选定业务配置与用户已有修改保留，全局个人DSH五个文件摘要未变。详见[第32轮证据](../../evidence/2026-10-21-local-32/RESULTS.md)。没有新提交、推送或CI，完整合同继续未通过。

## 第33轮后续决定与登录恢复

用户已选择保留原样正式0.2.0，不替换两服务。正式CLI随后实际过期；已按既有授权从新版Desktop发起并用computer use完成浏览器登录，同一未重启Host显示登录同步成功、2网可见、原workspace绑定保留，CLI复验expired=false。两个Deployment完整spec/UID、Sandbox执行聚合、个人全局DSH五个文件与-25包摘要均未变。本轮没有模型回合，不关闭B1/G6；没有新实现、提交、推送或CI。详见[第33轮证据](../../evidence/2026-10-21-local-33/RESULTS.md)。

## 正式平台行为

- 所有发布 schema 要求 `bkn_context` 的业务工具，使用本回合 start 返回的 Conversation/Interaction 身份。缺失、错误类型或其他回合/会话身份由守卫拒绝且不得 dispatch；不自动补参数或修改模型输出。
- `capture_enabled=false`、`trace_recorded=false` 不取消 managed session。正式 start/finish 返回的身份应保留并用于调用和 finish；不能提示“没有当前 Interaction ID”。关闭采集不意味着生成了证据。
- 正式 start 失败且未返回身份时保持关闭，不将 Trace 不可用当作业务调用许可。正式 unavailable finish 可以关闭治理窗口并诚实降级，不能被重用为 start 成功。
- 溯源保留已披露身份和原状态；关闭采集时仅显示本地时间线与明确降级，不调用平台读取不存在的证据。不补造 request/trace/receipt ID。
- 回答及实际 CSV 均保留来源数值精度，序列化不能默默整数化或使用默认六位有效数字格式改变值。精度核对覆盖全部主料物料，不以回答里一两个正确例子替代实际文件。
- BOM统计须随数字披露是否含根、是否含替代、深度和行/物料粒度，逐层统计取相同范围；未经请求不增加派生差值。若确需差值，其实际运算顺序及符号须与列名一致。
- CSV 交付须在当前绑定KN和open Interaction内，经受支持导出返回已验证的本地文件；再实际打开并核对摘要、内容。只读或目录/身份不满足时拒绝；文件存在不等于完整问答通过。新工具是插件的受约束交付入口，不扩大平台MCP白名单或Host工具权限。
- 最终回答须自行包含实际已验证的文件链接与交付范围，不仅引用折叠进度中的“上面”。原生表格打开、内容完整和整题正确须分别核对。
- 采购问题给定产品/物料编码时，默认仅查询该编码本身的PR与PO；BOM关联采购须另有明确要求，不能以“可能更有用”为由扩大本题范围。
- 大网络 navigation shell 允许索引数组为 null，保留平台披露的数量和 notice；不把缺失索引解释成零对象。
- 旧版显式 `continue_without_bkn_context`、无身份的降级仍是独立兼容路径；旧 fixture 通过不能替代正式合同。

源码 oracle：`tests/fixtures/context-loader-tools-v0.2.0-release.json`（位于插件包目录）。脚本核对输入 SHA 后执行官方纯 Go schema 和 `agentLifecycleView`，来源为正式 tag 的 `schemas.go`、`compact_view.go`、`lifecycle_adapter.go`、`session_guard.go` 及上游合同测试。26 项源目录工具已分类；24 项可投影 schema，inline PTC 两项明确没有伪造 schema。它不是 live `tools/list`，EE 条件目录和输出仍需现场核对。

## 分层完成条件

| 层次 | 必须记录 | 不能替代的下一层 |
|---|---|---|
| 源码合同 | 正式 tag/commit、schema、生命周期、调用者身份、工具分类和 fixture 来源 | 模拟、依赖声明不能证明加载 |
| 本地自动验证 | 插件/仓库测试、类型、原补丁 verify、包清单、双宿主同 tgz smoke；正式采集开启/关闭、旧合同回归、无混版 closure | npm 包集合 smoke 不是完整 CLI/浏览器/Desktop 验收 |
| 固定候选 | release 分支 commit、最终版本、build-only CI run、tgz SHA-256、逐文件摘要；验收期间不改包 | 本地 pack 不作为正式验收候选 |
| 本机实平台 | 正式服务镜像/摘要及实际代码身份，CLI 0.2.0、有效授权、TLS；live initialize/tools/list/schema 对照与受影响 managed 调用 | 快照版本端点、fixture、completed 状态不能证明实际正确 |
| 八个组合 | 同一个候选 × 两个 DSH × Mac/Windows × Desktop/npm；记录实际加载插件/宿主版本与 SHA | 一个版本/一种形态/非原生 Windows 不能代替另一项 |
| G6 与人工 | 正式平台+真实模型；已完成回答的非空原生溯源、zh/en、登录/取消/重试、选择联动、窄窗口/焦点/滚动/导出；异常逐项分诊 | 自动测试和脚本模型不作人工可读性或答案正确性结论 |
| 发布准备 | B1 同 Host 重新登录的有边界最小复现；未复现保持开放。候选变化后复验受影响项；公开包逐文件对照；latest 最后迁移 | 合并、tag、发布与 dist-tag 仍须相应授权 |

八个组合当前目标（第70轮；新版目标rc.3，后端合成、历史GUI、本次D1最小退出与最终候选分别记账）：

| 平台 / 形态 | DSH 0.2.0-rc.2 | DSH 0.2.1-rc.3 |
|---|---|---|
| Mac npm CLI（web） | 第66轮冻结-32真实业务自动挂载profile回补PASS；-30/-31 UI等保留原身份；最终候选未完成 | 第54/56轮冻结-32实际profile/受影响UI及五Reference保留，第66轮实际业务/profile路径PASS；模型G6、非空原生业务解释及最终CI未完成 |
| Mac Desktop | 第64轮冻结-32真实业务/profile Desktop后端PASS；-30/-31 GUI/UI保留原身份，不转记旧Mac完整GUI；最终候选未完成 | 第56轮冻结-32实际安装/受影响UI及五Reference保留，第64轮原官方rc.3 GUI实际业务/profile加载和菜单退出0 PASS；模型G6、非空原生解释、最终候选及完整人工验收仍缺 |
| Windows npm CLI | 冻结-32安装/82文件/profile按8f94288f报告通过；实际Node24.19.0 stock/protected合成MCP对照PASS；最终CI/完整UI与业务验收未完成 | 冻结-32/实际rc.3 runtime与profile按报告通过，stock/protected合成MCP对照PASS；完整UI/G6/最终候选仍未验 |
| Windows Desktop | 冻结-32/匹配Electron44.0.0后端合成对照PASS；d20a266/-31 run2 UI子项及-30有限登录观察保持原身份，不拼成-32 GUI通过；最终候选未完成 | 第70轮冻结-32真实业务/profile回补、官方rc.3欢迎窗启动及备份/手工恢复按报告PASS；官方X终止整树按用户D1收尾，原菜单FAIL/exit code未观测保留。完整rc.3 UI/G6/最终候选未完成 |

以下表格为第39轮历史快照，保留原 rc.2 宿主和产物身份；后续修复证据见各轮记录，不能转记为 rc.3：

| 平台 / 形态（第39轮历史） | DSH 0.2.0-rc.2 | DSH 0.2.1-rc.2 |
|---|---|---|
| Mac npm CLI（web） | 第38轮-29同进程4小时30秒B1协议路径pass；第37轮诊断刷新/焦点/导出pass，取消保留-28身份。实际profile3.18.5/Host根3.18.4闭包待收敛；第35轮-27恢复run_code被阻断及旧销售失败保留，完整G6未过 | 第38轮-29同样B1路径与第37轮诊断结果；profile/Host根均3.18.5但不同物理拷贝待审。第35轮Function恢复被阻断和完整G6缺口保留 |
| Mac Desktop | 第38轮-29实际长时B1路径pass；第37轮刷新焦点/导出、-28取消结果分别保留。实际profile闭包缺口待收敛；第35轮-27字段标签整答fail及完整G6/CE非空门槛保留 | 第38轮-29实际长时B1路径pass；第37轮诊断及-28取消分别保留。实际profile闭包待收敛；第34/35轮登录/目录/非SandboxG6按原包身份保留，完整合同未过 |
| Windows npm CLI | C：-27安装82文件报告pass；profile闭包fail后停止，登录/UI/B1未运行，G6 blocked | D：-27部分UI/目录/JSON、取消/超时/真实重试、owned清理报告pass；闭包insufficient-evidence，B1无前置成功基线且查询blocked，浏览器信任fail |
| Windows Desktop | A：-27安装器/签名/82文件及部分UI有报告；混版闭包fail，后续停止，登录真实重试/B1查询/G6 blocked，浏览器信任fail | B：-27安装/签名/部分UI及同PID重新登录报告pass；同版本双拷贝闭包证据不足，B1查询/G6 blocked，浏览器信任fail |

Windows以上均为第39轮接收的远程执行报告，私有原件未在主会话独立复核；不把磁盘/元数据补成诊断“未采集”的加载版本，不把Mac-29功能结果转记Windows-27。profile闭包待收敛不抹去已观察功能结果，也不关闭完整兼容门槛。

Mac CLI 的状态仍不等于整项通过：非空原生溯源、完整人工交互及异常分诊开放；-12 已用自身CI产物完成两版Mac CLI的zh/en空态复验，完整G6仍未通过。CLI 过期或版本不匹配时保留实平台缺口，不绕过 TLS、复制凭据或静默升级现有环境。

发布前另须分诊仓库现有 Dependabot #1：`@modelcontextprotocol/client >=2.0.0 <2.2.0` 命中高危 OAuth 客户端凭据误投送告警 `GHSA-6qxp-vccf-f47h`。本轮旧宿主集合实际解析 `2.0.0`，新宿主集合为 `2.2.0`。受控功能测试通过不能关闭该安全门槛；须核对实际宿主、此插件路径的可达性以及上游修复/缓解方案，不擅自覆盖固定宿主依赖。官方公告及实际 transport 已核对；两版实际 McpClient 的合成 401 挑战均只请求 /mcp，没有进入 OAuth discovery/token 流程，支持本固定 Bearer 插件路径未触发所述流程。未做凭据误投送漏洞利用验证，不宣称整个宿主已安全或依赖已修复；上游修复或有边界缓解决策在发布前仍开放。

## 功能与数据边界

平台决定业务语义、计算、输入、依赖、invalid 状态及原因；模型决定回答。插件只按公开合同治理访问与呈现。保持共享输入直接选择关联全部使用者、单条输出不经共同输入误联另一分支、平台显式跨查询依赖保留，以及原记录/尝试/状态完整。不得新增答案仲裁、自动纠错、业务重算、证据补造或平台/模型输出改写。
