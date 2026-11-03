# SourceText 局部修复与定向回验

2026-11-03。用户在核收专项报告后要求安排后续工作。范围仅为已连续两次复现的“输出原文hover后点击重叠弹层，Escape后指针留驻仍可见”，不改其他已测试功能，不改变平台和模型的原文、状态、原因或计算。

## 依赖与分工

1. 浏览器子智能体：使用脱敏fixture和实际组件，先保留真实布局/遮挡/pointer路径的修前失败、DOM命中和时序，再做相同路径修后验证。不得用JSDOM冒充布局。
2. 修复子智能体：在SourceText内做最小状态/焦点修复，并在既有native-dialogs测试补确定性回归。等浏览器修前证据后才动生产代码；尽量保持共享焦点helper不变。
3. 只读评审子智能体：检查固定Studio/DSH父容器契约及相关上游变化，评审dismiss guard的解除、显式新激活和卸载边界。
4. 主会话：维护旧证据、审查范围和输出红线，完成必要本地构建/测试/包审计，再按既有集成授权交付新build-only CI精确包。Windows原会话已准备复用隔离官方rc.5、home/userData及同一第2轮，收到身份和SHA后只做受影响回验。

## 关闭层级决定

保持现有纯hover行为：hover不接管键盘焦点；焦点仍在父详情搜索框时，Escape由父详情处理。明确进入原文popup/trigger时，Escape只关闭原文层，父详情保留，并防止同一留驻hover立即重开。真正离开后重新悬停或明确新激活应可正常再开。

这是DSH模态父容器的局部适配决定。固定Studio源码没有DSH父modal，也没有现场平台同序列对照，不称平台现场已验证相同。不增加document级Escape拦截，不将普通hover预览升级为抢焦模态层。

## 验证与状态

生产源码已完成本地修复，只改Scene内的SourceText。owned Escape仅抑制正在进行的hover visit；trigger和完整本实例popup root（含padding/arrow）共同构成悬停区域，真实离开或明确新激活可恢复。root监听局部挂载、对称卸载，没有document/window监听；共享focus hook及其他插件源码不变。

修前Windows两次复现保持。受控真实浏览器另捕获了Esc后的退出动画、popup遮挡消失导致trigger重新mouseenter、约120ms后再次出现的路径；这是受控重演机制，不升级为Windows原现场唯一根因。开发中又先证失败并修复“中性指针键盘关闭后首hover被抑制”和“section外popup padding过早解除guard”两项残留，原报告/日志均保留。最早浏览器报告用节点存在误代可见性的概括已修正，旧件仍留存，后续按矩形及祖先display/visibility/opacity判断。

本地最终构建及插件826项中825通过、1项既有Windows专项跳过；仓库79/79、包审计126文件通过，见[本地检查](./SOURCE-TEXT-LOCAL-VALIDATION.json)。新增9个JSDOM边界；sourceLayer等待由默认1s改为与ready一致的10s，保留原超时日志，不改断言或把环境超时当产品失败。Node使用已有24.19.0进程PATH及pnpm11.7.0，不改全局环境。

本地参考包[字节对照](./SOURCE-TEXT-LOCAL-ARTIFACT.json)：SHA256 `75a52410cb0de49d4554d220007e58aa3f5882666825d5f612453689160e4bcb`，877506字节、126文件；相对旧CI4仅client.js变化，其他125文件逐字节相同。旧CI4/a520329/cf9ab及所有FAIL/UNKNOWN保持；这份本地包不作为Windows或正式发布验收。

真实浏览器默认矩阵包含六基础序列、五扩展边界和两项嵌入的键盘关闭后首hover断言，使用静态内存transport，不访问平台。最终产品源码SHA为 `0a95cbb2c9a467cc2c00ccce331d4847e47350e076e50debec429f9c92d597ff`。交付probe加强必需路径前提、父层保留及不触发生成/分析的全快照断言后，同矩阵再次退出0，独立只读核收通过：最终原报告415024字节、SHA256 `ae023c4320af482575ed958ab3598f9aad5d04e050d5320c76adf1b6a98c0282`，Scene摘要与当前源一致，padding实际可执行；错误和非loopback请求均为空。见[派生摘要及原件SHA](./SOURCE-TEXT-BROWSER-REGRESSION.json)和[可复用probe](../../../packages/openbkn-business-context/tests/probes/source-text-pointer.README.md)。不可执行padding时明确SKIP/PARTIAL，record-baseline只采样模式不能作PASS。

[上游只读核对](./SOURCE-TEXT-UPSTREAM.zh.md)确认固定Studio/Foundry release及官方DSH rc.5没有升级；未发布main的其他合同变化单独记录，不宣称兼容已扩展。

本地门槛及独立评审已核收。修复已提交/推送为 `ae903656193d3fc5214469bc0e6ee1108e233075`，对应PR独立批准和CodeQL通过，见[评审记录](./SOURCE-TEXT-REVIEW-CI-STATUS.json)。新build-only [CI41548846010](https://github.com/openbkn-ai/bkn-dsh/actions/runs/41548846010) 已成功，实际npm发布及GitHub Release均跳过。精确TGZ SHA `14f4bb7fb61c892017343c832fdc8b37d892706b9a7aa2146779eef00ee9e3ff`，artifact13191140519，126/126及整段解压tar与本地参考相同，相对CI4仍只有client.js变化。主会话独立重算TGZ、路径和tar后，已派原Windows会话按[定向清单](./WINDOWS-SOURCE-TEXT-RETEST-HANDOFF.zh.md)回验，安装回合 `01a19eb7-803e-7b02-8016-7188213a1492` 与解锁后回合 `01a19f37-f9a5-7571-b9b9-524520bb0a23` 已完成，报告已原字节核收。见[CI实际包审计](./CI5-ARTIFACT-QA.zh.md)及[实际CI结果](./CI5-RESULT.json)。旧包和已发布-2保持不变，不补记原生PASS。

本轮新增业务问答、依据生成、Agent分析、平台业务写入均为0。不会重跑完整业务E2E，不自动合并、打标签、发布或移动latest。Windows最终回验必须安装新CI精确候选，不能以本地源码或本地包替代。

## 历史安装后锁屏门槛（已解除）

远程已回报CI5实际ZIP/TGZ与安装后的126文件均匹配，新Before已保存、task/day进程及端口分列、协议按精确守卫恢复为日常rc.5。当时前景是LockApp.exe锁屏，task窗口激活受阻，六类原生交互均未执行。主会话已请求本人解锁DESKTOP-IEJNBRE Windows桌面；不是要求DSH或OpenBKN重新登录，不索要凭据。问卷中显示的“已解锁”选项不是已提交答复，不能当成桌面解锁证据。得到真实答复后仍需核实实际可交互桌面，再继续同一精确包回验；安装/进程存在不作新UI加载或原生PASS。

后续只读会话核对确认Windows MCP、隔离rc.5与当前Console均在同一Session1；WTS锁标志为0、前景LockApp且窗口激活受阻，已排除控制器误连其他RDP会话。当时需本人实际解锁，不通过修改安全策略、凭据复制或降级宿主绕过。

## 解锁后的继续执行

维护者已在主会话真正提交“已解锁，继续回验”。Windows随后实际核实桌面可操作、前台PID32304对应原隔离rc.5，并返回同一历史会话；先前锁屏门槛已解除。接续回合为 `01a19f37-f9a5-7571-b9b9-524520bb0a23`，该阶段按六类序列及有界边界执行，结果见下；没有重装、重跑模型或以问卷选项代替现场证据。

## CI5首轮核收与平台维护（历史阶段）

两份[Windows原报告](./windows-rc5/ci5-source-text-retest/WINDOWS-CI5-SOURCE-TEXT-RETEST.zh.md)和[独立核收](./windows-rc5/ci5-source-text-retest/INTAKE-REVIEW.zh.md)已保存。六类操作序列按其实际预期通过，原输出故障两轮、键盘关闭后首次hover、明确新激活、跨字段独立和后续父Escape均有范围内实机观察；输入hover-click点击已关层，不称混合Escape通过。实际keydown/DOM目标/采样间短暂重开仍未知。

原窗口strict padding无交叠条件；一次可逆task窗口1920×800调整后，原生场景两次回退NATIVE_NOT_AVAILABLE/记录404，strict仍SKIP，已恢复原Bounds。最后入口默认第3轮仅证明可开、不证明原答案锚定；hover后Space仍开的设置观察未分类，保留为稳定后待核，不用另一次再开通过覆盖。

主会话02:54:01 UTC记账用户“50.28正在更新”，Windows02:55:25 UTC获知并记账；精确升级起止及版本未知。两条获准只读对照在02:54:27 UTC完成，原conversation/detail均404；它们不是当时GUI失败请求的取证。已停止新平台访问，维护说明与现象相容，但不认定唯一原因或resize因果。server原记录After没有可比较内容，零写操作/本地Session哈希不替代该After。接续按[更新后最小复核](./SOURCE-TEXT-POST-UPGRADE.zh.md)，不重跑无关矩阵或模型。

task菜单正常退出，owned进程/端口释放，日常实例仍运行；1376可比摘要及四份旧报告不变，旧39 null/旧2差异/至少42mtime/未枚举新增路径等限制完整保留。结果为SCOPED_UI_RETEST_WITH_PLATFORM_MAINTENANCE_OPEN_ITEMS，releaseAcceptance=false，不代签人工或全局发布验收。代码和CI5包没有在回验后变化。

## 平台恢复后的有界补核（当前）

两份[新原报告](./windows-rc5/ci5-post-upgrade/WINDOWS-CI5-POST-UPGRADE.zh.md)已按[RECEIPT](./windows-rc5/ci5-post-upgrade/RECEIPT.json)原字节核收；JSON23950字节/SHA c9cb31f0…、中文11182字节/SHA d8c755bb…。仍是ae903656/CI5/14f4bb7f、官方Windows rc.5，本轮只重核client.js与EXE身份，126文件安装匹配引用上一阶段，不写成重新安装或内存加载版本已证。完整接续与限制见[平台恢复后记录](./SOURCE-TEXT-POST-UPGRADE.zh.md)。

平台目标为维护者声明的正式OpenBKN0.2.0，实际health200且ServerVersion0.2.0；原C/I初次GET401与现有隔离凭据过期一致，一次官方SDK正常needsRefresh续期POST200后原C/I均GET200，TLS保持开启。续期前后subject及用户名哈希相同，不替代缺失的升级前subject/scope对照；各服务镜像/commit/Ready和全平台版本一致性仍UNKNOWN。新的200不覆盖维护期间404，不证明旧GUI失败唯一原因；69244字节detail只用于GUI前gate，server after-state没有测量，业务写入0不等于服务器记录已证未变。

严格padding本次完成：仅一次原生1920×800调整，真实UIA命中ant-popover-inner，点(1426,632)同时在自身输出trigger内、section外、另一输入trigger外。真实点击section获焦后只移动到padding，静止指针Escape后各离散采样点至约3s子关父留、未见重开并回自身trigger；名义0.5s采样实际工具返回后约665ms开始，原Bounds恢复。状态为PASS_AT_SAMPLED_TIMES，仅限本次真实几何与离散采样；原窗口无交叠SKIP仍保留，不称采样间绝无瞬态。

Space前提已核为trigger持焦、hover已开。一次必要确认记录open class短清后恢复、UIA短暂offscreen，未捕获视觉关闭区间，故仅为OBSERVED_PREOPEN_CONTEXT_NOT_CLOSED_TO_OPEN_PASS，不把原始“仍开”观察改写成闭态Space打开PASS。两版Scene相同前提的受控对照未观察到对应差异，不作为Windows/平台等价或无因果风险的证明。

离线日志的completed receipt分别映射turn5/第3轮和turn4/第2轮。两次根据渲染位置/特征定位的入口页面分别显示第3/第2轮，与该离线映射及平台轮次相容；实际按钮→M未捕获，不能写成运行时对应已证，也不把第3轮当作目标第2轮锚定错误。UIA未暴露答案messageId、opaque handle、运行时Host receipt或actual selected I，目标入口前又曾手选第2轮，完整运行时锚定及独立跨轮重置仍UNKNOWN，不补记完整PASS。

本轮task正常菜单退出、owned进程/端口释放、日常进程和协议保持；1376项fresh非凭据文件同哈希、六份旧报告和原Session/binding保持按新报告接收。当前隔离副本349153字节与原样本349071字节不同，差异来源UNKNOWN，本轮前后副本不变不抹去该差异；旧39 null、旧2差异、至少42mtime和未枚举新路径等历史限制继续保留。新增问答/依据/分析/业务写入均0，唯一认证POST是正常SDK续期。新原报告为SCOPED_COMPLETED_WITH_RUNTIME_ANCHOR_UNKNOWNS、releaseAcceptance=false；代码与CI5包无变化，不作完整发布验收。
