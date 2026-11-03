# 远程Mac合并续验清单

## 最新接续状态（2026-11-03）

首轮[公共回执](./mac-rc5/MAC-CI6-RESULTS.zh.md)和[129前提补充](./mac-rc5/MAC-CI6-SOURCE-TEXT-129-SUPPLEMENT.zh.md)已精确核收，见[清单](./RECEIVED-ARTIFACTS.json)及[发布分级](./INTAKE-REVIEW.zh.md)。后者404事实与S1–S3未执行状态不改。

用户随后确认：50.28为企业版正式020，是原生业务溯源验收目标，使用独立匹配官方CLI020；50.129为社区main021，主测CLI021，不承担企业版页面验收。这覆盖临时“只129/取消28卡”的接续点，恢复本机28卡加密交Mac/Win。Mac先用现有正常授权恢复原28会话，**只补原S1–S3**；不等待新包、不改原绑定、无新模型/解释/分析。129已过项全部保留。Windows只收卡不重跑。

最终[企业28原文对照补充](./mac-rc5/MAC-CI6-EE028-FIELD-RECONCILIATION.zh.md)已核收：正常GUI授权/原答案原生入口恢复；同S/C/I/6个Operation ID一致，Reader与Studio同route响应bytes/SHA相同，旧JSON仅去两原文字段后深度相等；另3个已知I也未披露原文。S1–S3均未执行（S2不是几何SKIP）；Swift独立进程postEventAccess=false，未申请权限/发事件。已完成本轮必要收态与7项摘要保全，不再扩大搜索。待合法可读原文入口与可用已授权输入路径/人工指针后只补三项。卡4项认证均true，原件和包不改。

维护者于2026-11-03要求：新包支持CLI0.2.1后，将远程当前未完成的复核与新增兼容验收一起继续，不能漏项，也不重跑无关已通过项。指定chat为`01a15340-6507-7660-a68d-68994e283415`，host为`remote-control:env_e_6ac8760a8c308328a9dcf5dc28dd0d18`。先完成当前任务的收态，收到新CI产物确切身份后再执行。

唯一新候选已固定：源`f01b316fbfb6be681af81e2267a7b3341e659efd`，CI41596006291成功/publish=false，artifact13212518096；TGZ877732字节/SHA `4500fa4357cdcdcb9914a39794aedb9096c948192c2bf0f35ecf4fadb882f046`，126文件，见[完整身份](./CI6-ARTIFACT-IDENTITY.json)。只用这个实际CI包，不用本地参考c140…或旧CI5代替。正式CLI0.2.1公共包当前仍E404；已有main/rc可以如实做预发布范围验证，正式安装项留待可得，不将其改manifest伪装正式版。

## 接续点与身份

原SourceText回验turn`01a1a039-d277-7610-8793-323084dc45e0`在安装/冷启动CI5后被维护者暂停。已完成CI5 SHA/126文件/官方rc.5签名核对，并建立日常profile、原会话和197份旧证据的摘要基线；这些只接受为原CI5身份，不代替新候选安装证明。后续turn`01a1a043-cd4e-74e3-8c94-6db60f86ddda`按维护者要求正常退出/保全，不再用CLI0.2.0推进。

已读回该暂停turn的最终摘要：隔离GUI退出0、任务进程/端口释放，Host/日常profile/原会话/197份旧证据摘要保持，系统关联恢复原字节；SourceText仍NOT_RUN。这是远程收态摘要，私有原件未在本轮重新传输核SHA，不升级为主会话独立文件核验。

共享`.test-tools`已漂移为0.2.1-main，而原复核描述的正式0.2.0目标可能与之不匹配。此处先前环境说明和维护者新指定50.129测试环境应由现场只读身份核对消歧，不能凭版本标题覆盖health/image或强制绕过版本检查。为每条任务记录实际origin、平台版本/部署ref、CLI实际包/version/hash、插件artifact/hash和当前会话绑定；若目标不一致，先停止该条请求并记录配对问题，不擅自改平台或重绑原会话。

恢复后已回报：新测试origin为`https://192.168.50.129`、现场health/镜像对应0.2.1-main；原溯源会话仍绑定50.28。主会话已核当前只读命令中的真实origin并共享Windows；此为进度接收，完整部署/安装/病例原件仍待最终传输核收。两范围分别验，不把旧会话改绑到新平台。

## 新包到达后顺序

| ID | 必须保留/完成的项目 | 当前状态与验收边界 |
| --- | --- | --- |
| R0 | 核原暂停收态及旧证据摘要，保留两次SDK版本预检结果和历史失败 | 首轮有界保全回执已核收，保留先前暂停摘要及失败；不扩大成全机核验。 |
| R1 | 核新CI源commit/run/artifact/TGZ/全部文件、官方Mac Desktop0.2.1-rc.5及签名；隔离profile官方更新后退出冷启动 | PASS：真实CI6、官方rc.5、GUI安装后及退出后126/126文件匹配，正常冷启动及新UI可见；诊断加载版本字段未采。 |
| R2 | 在任务独立目录准备匹配CLI0.2.1，核其官方包/源和依赖身份；不覆盖默认CLI、共享.test-tools或日常配置 | 预发布范围PASS：隔离官方rc.1归档/SRI/实际版本及1084文件记录；未覆盖共享工具。正式021仍404，不记正式安装通过。 |
| R3 | 通过插件面板核0.2.1安装选项、真实CLI检测/实际版本、已有CLI不覆盖及正常登录/同步 | 选项/实际版本/已有020不覆盖PASS；产品流程登录后实际2网络。正式精确安装仍NOT_RUN。 |
| R4 | 新平台原生登录、正常取token/续期、CLI/MCP/Reader共用正确origin和受限证书链 | PARTIAL：同129原生device flow、取token及同步通过；保留超时/授权URL接力/最终产品流程区别。自然续期首轮未观察，不强造过期；本机信息卡正常授权且不回传秘密。 |
| S1 | 原未完成项：输出原文hover→点击覆盖自身trigger的popup正文→Escape，指针留驻时约1s/3s子关父留且不重开 | NOT_RUN：原28入口已恢复但当前未披露原文，无全文trigger；待合法可读样本与真实hover路径后补，不用历史/Windows代填。 |
| S2 | 原未完成项：popup padding/arrow与自身trigger重叠的同一路径 | NOT_RUN：缺全文入口，未采padding/arrow几何、未调整窗口，不写成几何PASS/SKIP；前提成立后有界采样。 |
| S3 | 原未完成项：输入/输出键盘明确激活→Escape只关子层/回入口，随后首次真实hover重开 | NOT_RUN：缺全文入口及已验证的真实hover输入路径；待前提恢复后做键盘激活/Escape/首次hover，不派发DOM事件。 |
| C1 | 现场完整tools/list/input/output schema、分页与新增/条件工具分类 | PASS：实采单页26工具及input/output schema，选定固定源码9个共同工具结构相符；33 source metadata不是live工具数，新drill仍deny。 |
| C2 | 依平台当前发现结果核新query_metric的version/query和结果透传，及当前KN/context拒绝无dispatch | PARTIAL：KN/context/drill无派发拒绝及最小对象查询通过。遗漏version确实到达平台并记failed；当前未披露已发布metric/version，正例NOT_RUN。Windows只补尚缺前提。 |
| C3 | 最小managed查询→finish及可读溯源，平台CSV→精确字节交付链 | PARTIAL：受控实平台查询/finish、一级9行CSV1030字节与平台SHA相同；native detail/Markdown404、Core operations200。同129原生DSH答案入口/conversation/rounds未验。 |
| R5 | 正常退出owned GUI、核PID创建时间/端口及日常/旧证据/原会话保全，记录原始文件摘要 | 首轮PASS：原生GUI退出0、任务进程/端口释放，7保护文件/229旧证据/126包文件保持，配置/关联恢复；保留实际治理/CSV变化和未枚举范围。新续验仅补其必要收态。 |

不新增模型问题、解释生成、Agent分析或自动纠正回合；不改平台/模型输出，不升级当前已验0.2.0环境，不自动放开drill工具，不重跑其他完整矩阵。新的最小查询/CSV只针对当前目标与测试样本，实际环境或授权不足时保留该条待验，不伪造回执。

结果分别注明原CI5补充项与新候选/新平台范围，逐项PASS/FAIL/NOT_RUN/证据不足。提供脱敏JSON/中文报告、bytes/SHA及原文件；原业务正文/凭据/私有截图保留远程。最终CLI/平台未固定则不替正式发布签收，不推送/合并/tag/发布/latest。
