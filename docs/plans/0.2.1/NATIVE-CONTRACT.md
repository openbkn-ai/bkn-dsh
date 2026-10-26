# 0.2.1 原生溯源读取合同（2026-10-18）

## 当前依赖边界（2026-10-26）

用户D3已明确：OpenBKN路由/样本问题提报排查是环境还是平台，不让测试全局卡在这里。已提交[Foundry #2517](https://github.com/openbkn-ai/bkn-foundry/issues/2517)，附固定0.2.0构建、标准记录/operations200与TLS/直连原生404的既有对照，请平台确认Community边界、部署配置或缺陷。当前目标的非空原生联动仍未验，不补造数据或改为PASS，也不自动取消现有能力；该外部依赖不再阻塞其他插件验收/推进。已有读取/身份/预算/诚实降级/取消/陈旧结果守卫复用；若发现插件投影或鉴权自身有误仍须处理。不重复404、不为取样发模型或部署企业扩展。

## 第59轮 GUI原生集成边界

2026-10-25：GUI独立身份必须涵盖进程入口/单实例之前的数据根、cold-start runtime、global CLI/协议与更新来源；仅descriptor验证或改appId不是实现。未修改Host入口、runner/cancel/Job或发布carrier；新Windows探针仅合成loopback且未执行原生Windows，真实登录另有Chrome/W-LIFE前提。业务白名单/语义/凭据合同不改，已通过原生MCP与CLI证据复用，原GUI/Windows/最终候选门槛仍开。 见[结果](../../evidence/2026-10-25-local-59/RESULTS.md)、[GUI构建签名路径](../../evidence/2026-10-25-local-59/DESKTOP-GUI-BUILD-SIGNING.md)与[剩余项](../../evidence/2026-10-25-local-59/BLOCKERS.md)。下文保留各轮历史身份。

## 第58轮 CLI 管理认证实际 Host 证据

2026-10-25：冻结包的原OpenBknCliSubprocess/AuthCoordinator/凭据同步/OpenBknMcpManager路径在四个新隔离Host中完成真实官方CLI浏览器登录和目录读取，未注入假CLI结果、替换Service或直接配置token。实际MCP模块为第57轮b3cd…回补，SDK仍2.0.0/2.2.0；使用原服务方法而非浏览器Remote carrier。未请求业务工具/Interaction/模型/Sandbox，工具治理与数据语义不变。GUI、Windows、OAuth全局及最终候选验收不据此完成。 见[本轮结果](../../evidence/2026-10-25-local-58/RESULTS.md)与[剩余项](../../evidence/2026-10-25-local-58/BLOCKERS.md)。下文保留各轮历史身份。

## 第57轮 同源回补交付边界

2026-10-25：回补只在新派生Host的Streamable HTTP factory生效，复用第53轮同源/方法/跳转/401合同，SDK仍2.0.0/2.2.0。完整npm Host及匹配Electron官方Desktop后端入口已有原生注册/ToolRuntime对照；-32仅验证owner解析，不是实际OpenBknMcpManager平台挂载或CLI授权通过。插件工具白名单、业务参数、原始记录及身份治理不变；签名GUI、Windows和SDK OAuth边界继续开放。 见[本轮结果](../../evidence/2026-10-25-local-57/RESULTS.md)、[完整交付方案](../../evidence/2026-10-25-local-57/HOST-DELIVERY-PLAN.md)及[剩余项](../../evidence/2026-10-25-local-57/BLOCKERS.md)。下文保留各轮历史身份。

## 第56轮 rc.3 Mac Desktop 补证（2026-10-25）

官方rc.3新隔离Desktop实际加载冻结 -32，三弹层键盘与既有R40协议历史溯源降级检查通过：原completed Interaction/4节点保留，Tab/Shift-Tab边界、Escape恢复原回答入口，既有绑定名称保持。后续独立恢复CLI过期认证，仅对Desktop及新npm-home既有记录补五Reference实际zh/en/zh及原值保持；原生业务视图仍404，不补造平台事实，不重跑Host登录/B1或模型。800×600原生窗口滚动末项可达、语言/窗口恢复后正常菜单退出，原Host/正式0.2.0及数据配置保持。Windows仍按固定d20a266原缺口单独补证；#105未安装回补，无推送/CI。见[第56轮结果](../../evidence/2026-10-25-local-56/RESULTS.md)。

## 第55轮 Windows 回传合并（2026-10-25）

结果74c4d731的报告/manifest及公开证据摘要核对通过，私有运行证据未读。Windows -31/两版rc.2 的业务/诊断局部Escape、Tab和嵌套下拉按报告通过；溯源弹层因副本无既有会话NOT_RUN，Reference因未登录BLOCKED，不以空态冒称非空通过。-30生命周期因缺当前日常Chrome确认没有执行，carrier/cancel/Job及浏览器关闭因果无新证据。第54轮本机 -32/rc.3 npm/web历史溯源/认证降级和第51轮 -31 实机证据保留原身份，不相互替代。见[合并结果](../../evidence/2026-10-25-local-55/RESULTS.md)和[最小缺口方案](../../evidence/2026-10-25-local-55/WINDOWS-GAPS.md)。本轮只有文档/回传核对，Host/正式0.2.0/数据配置及所有冻结候选保持，无推送/CI。以下各轮为历史记录。

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

2026-10-23第42轮：Windows -30报告四组合标准记录404空态与关闭重开pass，但30ms关闭后重开命中缓存，无法证明在途读取取消，四格保持insufficient-evidence；不得由Mac历史取消或空态通过代替。CE非空解释缺路由保持。A/B原helper失败已本地复现并在独立r2修正，Windows原版helper启动待复验；成功登录runnerfinding另行分诊。正式0.2.0、原-30/743eb4a和其他工作树保持，本轮无生产包变更、Host/平台动作、推送或CI，r2未交接。见[第42轮](../../evidence/2026-10-23-local-42/RESULTS.md)。

2026-10-22第41轮交接更新：用户专项授权已交付 `handoff/windows-local30-20261022` / `743eb4a09f1577ba4490f1f6ccbaad834d68a43f`，要求Windows按同一 -30 复验标准记录/404空态和关闭取消等可测项；原生Windows尚未执行，CE非空原生解释缺口未关闭。另一路远端 -11 独立排除，不采用、不合入、不修改。正式0.2.0和数据配置保留，开发分支不推送，不跑CI。当前交接身份见[第41轮](../../evidence/2026-10-22-local-41/RESULTS.md)，下方第40轮尚未交接文字为历史。

2026-10-22第40轮：本地-30修profile闭包/校验覆盖与英文间距，四Mac实际闭包及受影响UI、9个普通查询标准Interaction读回通过；与-29的Host/Remote字节完全相同。没有新增非空原生解释或完整原生联动验收，历史-28取消保留原包身份。新Windows材料含标准记录/404空态关闭取消复验要求，尚未远端交接或原生执行；不将磁盘版本填成诊断未采集的加载版本。正式0.2.0保持，不推送、不跑CI，完整合同开放。见[第40轮](../../evidence/2026-10-22-local-40/RESULTS.md)及[剩余门槛](../../evidence/2026-10-22-local-40/BLOCKERS.md)。

2026-10-22第39轮：Windows-27结果fb77c07已接收并核对报告身份；原生事件/证据空态、非空解释/联动仍均blocked，未出现可补齐本合同的新助手回合。部分诊断/登录UI结果、profile闭包fail/不足、浏览器CA信任fail分别保留。原始私有证据仍在Windows，本机未下载；Mac-29既有原生/标准记录证据不转记Windows-27。正式0.2.0不替换，无合并/推送/CI。见[第39轮汇总](../../evidence/2026-10-22-local-39/RESULTS.md)。

2026-10-22第38轮：原样本地-29的四个Mac组合已补B1长时协议路径（4小时30秒、自然过期、正常刷新、真实浏览器重新登录、同Host owner重载后普通查询）。16个标准Interaction均completed、operations仅query_object_instance/completed。这不提供CE非空业务原生解释、选择联动、切换目标取消或模型G6证明；这些仍按原合同开放。正式0.2.0不替换，无推送/CI。见[第38轮结果](../../evidence/2026-10-22-local-38/RESULTS.md)与[剩余门槛](../../evidence/2026-10-22-local-38/BLOCKERS.md)。

2026-10-22第37轮：真实-27 Desktop关闭面板未及时取消HTTP/CLI的问题已复现并保留。-28以原生Remote stream和请求所属的CLI取消signal修复，在两个Desktop与两个npm/web实测CLI终止、4个HTTP断开及重新打开。-29保留相同Host/Remote字节与取消Client源码，另修诊断刷新焦点。该实测采用延迟正式平台原响应的只读TLS转发；不是非空原生解释、直接切换目标或完整MCP/B1验收。见[第37轮证据](../../evidence/2026-10-22-local-37/RESULTS.md)。保持正式CE0.2.0，不安装企业扩展、不推送、不跑CI。

2026-10-19 补充：正式验收按 [ACCEPTANCE-CONTRACT.md](ACCEPTANCE-CONTRACT.md)，仅使用本机 `https://192.168.50.129`。下文 50.28、EE/Studio 快照和既有非空样本保持为历史证据，不是本轮测试目标或正式发布平台验收。正式 `v0.2.0` 的采集关闭状态仍保留 managed 身份；插件 handle 可以保留该身份对及 `recording=disabled`，但不请求或声称已有记录证据。旧版无身份降级独立保留。新正式 schema 与 lifecycle fixture 是源码投影，其后正式本机的 live catalogue、managed 调用和标准记录读取已执行；相同真实 Interaction 的原生 detail/explanation 均返回 404。正式 CE 源码另有不挂载 legacy business-provenance 数据路由的边界测试，但插件仍保留 404 的路由/记录未披露歧义，不据此推断许可或删除原因。-12 CI 包在两版 Mac CLI 的 zh/en 404 空态复验通过；非空原生记录、实际选择联动与相关人工验收仍开放，详见[-12 复核](../../evidence/2026-10-19-ci-933b0ab-followup/RESULTS.md)。

本轮已在现有部署上通过 #93 的最小真实数据门槛：当前 CLI 凭据能读取原生 detail 和既存非空 explanation，并与原生 Studio 中同一会话、问答和业务记录对照。此结论仅适用于下述环境；不等于固定候选包的 DSH 实机验收、受限账号验收或普遍平台兼容性。

本机后续诊断（2026-10-19）：[实际 HTTPS/Service 对照及正式构建来源](../../evidence/2026-10-19-local-14/RESULTS.md)已将当前 404 定位到社区二进制没有挂载可选企业路由，标准 Interaction/operations 为200。下文历史非空样本不能补上此环境条件。继续保持社区版；没有要求整轮开发改用企业版，也未部署扩展或修改许可证。此现场诊断不改变插件对一般404的中立分类。

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
- 关闭面板发出本次读取的取消信号；结果按本地请求代际绑定 session/message，在渲染时同步检查，已加载旧内容不会进入新请求首次提交。语言切换只重绘，不重建请求或业务连接。此处原为受控组件/信号证据；第37轮追加两个Desktop与两个npm/web的实际关闭/Escape、CLI/HTTP退出及重新打开证据（-28，-29同实现沿用）。直接切换目标与非空联动仍未实测。

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
