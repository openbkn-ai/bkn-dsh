# CI6 两端增量回执核收与发布门槛

**2026-11-04最新核收：**Mac已复用Windows真实原生会话，在固定CI6/官方Macrc.5/匹配CLI020下完成SourceText S1、S3四键盘路径及S2左padding原生补证，见[核收及取证边界](./MAC-SOURCE-TEXT-CLOSEOUT.zh.md)。原文/平台读取能力可用，原Mac旧样本#82独立，不再当作全部Mac测试前置。S2几何为原生截图估计，精确DOM/AX命中未知、arrow未测；早期退场观察/初次SKIP/窗口位置偏差保留。正式CLI021安装继续待验，不查registry、不改包、不跑新CI或模型/平台业务写。

2026-11-03首轮两端增量及随后补充已核收；2026-11-04新增MacSourceText回执另存。**预发布范围与本次Mac限定UI补证已有明确通过项；正式CLI安装和正常发布流程仍未闭合，不能按全部版本计划完成签收。未发现要求修改现有包的新产品回归证据。**

固定包仍为源`f01b316fbfb6be681af81e2267a7b3341e659efd`、CI41596006291、artifact13212518096、TGZ877732字节/SHA256 `4500fa4357cdcdcb9914a39794aedb9096c948192c2bf0f35ecf4fadb882f046`。首轮五份及两端补充共十一份公共原件从实际native命令输出恢复后，逐一核字节数和SHA；Windows另核13个分块和整段gzip摘要。见[核收清单](./RECEIVED-ARTIFACTS.json)、[Mac原件](./mac-rc5/MAC-CI6-RESULTS.zh.md)、[Windows原件](./windows-rc5/WINDOWS-CI6-PLATFORM021-VERIFICATION.zh.md)。原件不改，补充另存：[Windows指标/续期](./windows-rc5/WINDOWS-CI6-METRIC-SUPPLEMENT.zh.md)、[Mac原生SourceText前提](./mac-rc5/MAC-CI6-SOURCE-TEXT-129-SUPPLEMENT.zh.md)。另已核收[企业28原文阶段对照](./mac-rc5/MAC-CI6-EE028-FIELD-RECONCILIATION.zh.md)；密文交接见[28卡双方回执](./CARD-028-HANDOFF.json)。此轮不重跑已通过项、构建或发布CI。

## 最新确认的环境能力与分工

用户后续明确确认以下能力矩阵，覆盖此前“只用129”的临时分工。部署能力身份来自用户确认，不是由404反推版型或许可；原件中的404事实、NOT_RUN及当时UNKNOWN保持原样。

| 环境 | 匹配CLI | 当前验收范围 |
| --- | --- | --- |
| 50.28，企业版正式0.2.0 | 任务独立CLI0.2.0 | 恢复Mac原28会话，仅补S1–S3企业业务溯源交互；保留原绑定，不重跑已通过项。 |
| 50.129，社区版0.2.1-main | 官方CLI0.2.1-rc.1 | 主测新CLI及列明的社区版连接/受管合同增量；企业业务溯源不在该部署能力范围，不用它签收EE原生界面。 |

129企业业务溯源接口的404不再列作发布阻断，也不要求插件改包或平台为本轮补装EE能力。具体历史请求的唯一失败原因仍不追认；社区版新CLI验收与企业版原生溯源验收分别归因。

## 已通过的范围

| 范围 | 核收结果 |
| --- | --- |
| 两端原生Host与包 | 官方Desktop0.2.1-rc.5、GUI安装CI6、正常退出后冷启动、最终126/126文件匹配；新CLI安装目标实际渲染。不是仅靠磁盘版本标题推断加载。 |
| CLI入口与保护 | 新0.2.1目标、实际旧0.2.0检测及不覆盖；隔离官方0.2.1-rc.1实际版本可见。Windows有Host→runner→cmd.exe→Node的真实进程证据和中英文指引。正式0.2.1安装未执行。 |
| 新目标原生认证 | 50.129正常device flow与面板目录同步成功，两端均显示2个真实网络。Mac保留专用浏览器超时、授权URL接力与最终产品流程的区别；Windows四项加密卡认证回执均为true。 |
| 企业28原生恢复与字段对照 | 官方Mac rc.5、固定CI6、匹配CLI020下正常GUI授权恢复，从原答案进入企业原生页面；同一S/C/I/KN、6个Operation ID及顺序一致。当前Reader与Studio实际同route200响应bytes/SHA相同，Studio也显示原文未记录；旧JSON仅删两原文字段后与当前深度相等。此为平台当前未披露原文的对照通过，不是S1–S3通过，也不推定同caller或唯一根因。 |
| 证书与origin | 未改认证/证书实现、未增加全局TLS绕过或跳过版本检查。原生连接使用原包的精确origin/证书/SPKI身份pin；Windows独立CA探针另为rejectUnauthorized=true。不把身份pin写成系统默认CA链通过。 |
| 实平台受控合同 | 26个已注册工具目录及schema；官方rc.5 ToolRuntime、候选factory/guard/Reader连接真实50.129。26份输入schema保留，选定固定源码合同中9个实际注册工具的输入/输出结构相符；其余分类保留，不称26个都向模型开放或全部已实调。 |
| 受管理边界与最小查询 | 缺context、跨KN和新增drill在派发前拒绝；最小对象查询参数、content及structuredContent保持，Interaction正常完成。Mac遗漏metric version的负例是平台拒绝且确实派发，保留failed记录，不改写成插件本地拒绝。 |
| CSV交付 | Mac受控真实平台发布函数生成一级9行CSV，候选导出1030字节/SHA与平台完全一致。不是完整BOM、GUI下载点击或新模型回合的重跑。 |
| 退出与有界保全 | Mac首轮原生GUI退出0、列明进程/端口释放、7保护文件/229旧证据/126包文件保持；本次企业28补充另核7项摘要及必要配置/系统关联恢复，未重跑首轮全面矩阵；Windows菜单退出、5任务进程/端口释放，1376日常文件/18旧报告/4原会话绑定/默认CLI及Host文件保持。两端各自未枚举范围、环境失败和预期认证/治理记录变化保留。 |

以上原生UI、独立Reader/ToolRuntime和模型E2E分开接收。受控进程的装配失败/退出1不覆盖成GUI成功；真实GUI成功也不替代尚未执行的原生溯源动作。

## 当前发布门槛与最新验收变化

| 项 | 明确判断及下一步 |
| --- | --- |
| 正式CLI0.2.1安装与最终身份 | **阻断本次“含正式0.2.1安装支持”的放行。** 2026-11-03 22:06台北时间复查[官方精确npm版本](https://registry.npmjs.org/%40openbkn%2Fbkn-sdk/0.2.1)仍404；20:50核收的latest为0.2.0、rc为0.2.1-rc.1，SDK release/0.2.1仍固定1cd2839、SDK main仍57d39f0，未见正式tag。现有rc.1结果有效，但不能代填精确正式安装。正式包可得后只核其身份/差异及受影响安装验证，不自动重跑整套。 |
| Mac S1–S3企业版原生溯源验收 | **已按限定范围核收，不再等待原Mac样本迁移。** 真实Windows原Session在官方Macrc.5隔离恢复，S1、S3四路径及S2左padding取得原生证据。精确DOM/AX命中、arrow及瞬时动画行为不作通过声明，详见[补证核收](./MAC-SOURCE-TEXT-CLOSEOUT.zh.md)。保留原记录缺原文、先前NOT_RUN和初次SKIP，不补造、不改平台/模型输出。 |
| PR/main与发布流程 | 仍须按既定独立审批、合并后制品等价核对和发布流程推进。本次局部UI回执不替代这些步骤；本轮未推送或发起CI/发布，动态PR/tag/npm状态需发布前另核。 |

Mac三项动作分别记录，原件及历史阶段状态保留：

| ID | 原生动作与当前核收结果 |
| --- | --- |
| S1 | 已核收输出hover→正文覆盖自身trigger→Escape，1.378s/3.080s样本子关父留且未重开；原生指针留驻。 |
| S2 | 原生宽窗左padding路径按截图估计几何及1.351s/3.082s样本接收；精确DOM/AX节点命中未知，arrow未单测。初次SKIP不改。 |
| S3 | 输入/输出各Enter、Space四条稳定路径通过，Escape子关父留、回入口、首次真实hover重开；400ms前瞬时行为不外推。 |

## 当前不单独阻断的取证/样本限制

- **129企业业务溯源404是部署能力范围限制。** 新受控Interaction的detail/Markdown404、Core operations200；补充用真实候选Reader检查已知两个C，共5次GET，原生conversation/rounds及历史DSH detail均404。该历史样本来自rc.3 npm/Web，仅作数据来源，不记为rc.5 GUI通过；同origin原生答案入口及GUI回退未执行。用户后续已明确129为社区版、无法验EE业务溯源，因此这些404不再作为本次发布阻断，不据此修包、补装EE或声称完整Core回退。原件当时的UNKNOWN保留，不将后续能力说明倒填为每条404的唯一根因；本轮不宣称已完成021企业原生溯源验收。
- **企业28旧样本缺原文不等于整个平台或Mac不能验收。** 原样本与Studio同响应缺字段的历史证据保留，#82独立跟踪；后来Mac复用Windows真实样本Reader200且原文非空，经官方隔离恢复完成上述UI动作。鼠标权限亦已真实恢复。不能用DSH/preview补原文，也不能再由单条旧样本外推整体测试不可行。
- **正向metric version/query**尚无平台披露的可用ID/已发布version，保留NOT_RUN。已有独立合同测试和现场schema/透传证据，未发现参数改写或失败正例；缺定义不当作产品故障，也不能宣称该实际指标路径通过。Windows已完成有界只读发现：两个KN的官方published目录各一次404，未开启新Interaction或实调指标，按缺前提停止。[SDK固定collection](https://github.com/openbkn-ai/bkn-sdk/blob/1cd2839652733e2ce6690b14e76ff8e9d73861dc/src/api/object-metrics.ts#L260)与[Foundry公开路由](https://github.com/openbkn-ai/bkn-foundry/blob/1a3a76edb993d3944afb94a135392d33c90a0432/adp/bkn/bkn-backend/server/driveradapters/object_metric_v1_handler.go#L36)一致；这两次404本身不证明无指标或许可状态，社区版身份另据用户确认。仅有有效披露后再补一次正例，不猜、不创建或发布指标。
- **Windows独立官方SDK自然续期已补录PASS**：20:54台北时间正常currentTokenFresh在自然过期后返回并持久化新token，同一身份、expired=false；没有改时钟/expiry或强制刷新。[补充原件](./windows-rc5/WINDOWS-CI6-METRIC-SUPPLEMENT.zh.md)保留首轮NOT_RUN的当时事实。Mac和原生Host续期状态转移未据此代填；当前认证代码未改，另有官方SDK受控正常refresh覆盖，不为取证反复登录。
- **finish_unconfirmed现场负例、新模型E2E、所有指标/工具实调**不属于本次必须强造的真实现场事件；已过控制用例保留，未执行不写通过，不扩大为全部业务正确性保证。
- **一次测试工具输出的短期challenge/device-code脱敏偏差**保留于私有历史证据；公开补充经独立复核不含实际短期码、token、卡、私钥或原始业务正文。不再声称全过程零泄露，也不以此认定插件包泄露。后续测试工具应先脱敏再输出，不通过重跑登录覆盖旧偏差；当前包不因此修改。
- **运行包诊断字符串、完整中间wire/handle、私有截图及全机差异**的缺失不自动阻断；已有真实冷启动、新UI、全包摘要与进程链支持当前归因，保全仅覆盖所列基线。
- 50.129社区版是`0.2.1-main.20261103005009.sha0acbbb4`，不同服务镜像分别记录；Studio等标签不同，不伪装全平台正式021，也不要求所有基础设施镜像同号。该main环境承担新CLI预发布验证，最终正式身份出现后核差异；50.28企业版正式020的S1–S3不外推为021企业版通过。

## 最新目标与未完成事项的接续

用户曾提出从本机加密交接50.28卡，随后临时撤回并改为只用50.129；该阶段主会话没有读取、加密或推送28卡，Mac依此完成了129有界调查。用户最新明确两端部署能力不同，现恢复上述企业版28/社区版129分工；“只用129、取消28卡”不再是当前执行结论。主会话已完成28卡的收件人加密Git交接，独立分支handoff/ci6-platform028-cards-20261103、commit7619f5aa；两端ciphertextHashVerified/recipientMatched/gcmAuthenticated/localCardCreated均true，见CARD-028-HANDOFF.json。不回传明文、私钥或凭据。此前129卡密文交接及Windows成功登录保持。

Mac的129调查及原企业28补充按各阶段事实保留；新增[真实会话SourceText补证](./MAC-SOURCE-TEXT-CLOSEOUT.zh.md)已核收。S1、S3四条稳定键盘路径和S2左padding按各自取证范围接收，arrow/精确命中/瞬时动画不代签；原件、候选、日常保护项及收态已核。Windows本次仅读取既有原会话资料，没有重跑已过矩阵。正式CLI021安装仍待验；平台#82恢复需独立方案/授权，不是MacUI补测前置。无新问题、解释/分析或平台业务写，无包改动/新CI/发布。
