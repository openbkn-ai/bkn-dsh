# 0.2.1 正式候选整合与发布记录

2026-10-26。维护者已授权本线整合、推送、最终build-only CI、审查合并及按既定门槛发布。当前仍在候选准备阶段，不将授权或本地通过记为已发布。

- 发布版本：`0.2.1-rc.3-openbkn.0.2.1`，不加复发后缀，npm名称仍为`@openbkn/dsh-business-context`。
- 宿主目标：官方0.2.0-rc.2/639ed015及0.2.1-rc.3/1f81c047。旧生成器是独立构建基线，未静默升级工具或用户Host。
- 平台证据：保留正式OpenBKN0.2.0及CLI0.2.0；官方最新Release仍v0.2.0。维护者已明确：命名中的0.2.1为本次发布标识，平台实测仍披露正式0.2.0，不宣称已在0.2.1平台验收。
- 在独立checkout整合19个本线功能提交、1203个已扫描的本地修改/公开证据文件，并三方合并最新main。产品源码68文件保持本线冻结-32实现；主线不同的关闭/本地化策略不替代本线已验证约定。独立Windows交接/回执为无共同源码祖先的证据分支，固定引用保留，无遗漏的产品实现路径；没有把旧二进制快照倒灌为最新源码。
- 首个命名候选R1为82文件，与冻结-32相比仅package.json及两份README不同；所有实现及生成文件逐字节相同。详见LOCAL-CANDIDATE.json及LOCAL-CANDIDATE-FILES.json。
- 本地插件617pass/1平台skip，仓库72pass、类型和包审计通过；最后命名拒绝/配套归档的13项聚焦检查通过。实际CI结果另记，不重复UI/G6/B1或重定向矩阵。
- 两份已验证12文件profile MCP配套保持原字节，归档摘要、文件清单、许可和放置/恢复说明随仓库及CI候选提供；官方Host/签名保持，不构建独立GUI发行体系。
- #99/#105进入Project12 In progress；#95/#96开始In review，按自身标准评估关单。原#94关闭保持，#98按自身标准保留历史未确认问题；#93/#97原生非空依赖继续外部#2517跟踪，不能改为已验。业务问题#2515/#2516及#2517均在Project12，不等待上游修完才推进插件。
- 真实业务源数据、现有配置、正式平台和冻结-30/-31/-32未替换；本轮不运行模型、Sandbox或新真实业务回合。

发布仍需正式CI制品、必要实机证据、独立审查与公开包逐文件核对；latest最后迁移。原欢迎态菜单FAIL、未知exit code、runner/浏览器因果及环境/证据限制保留，不因命名或收尾改写结果。

## CI R1与新增安全修补R2

R1的build-only CI 40349578570全成功，未发布；下载包82文件与本地R1逐文件相同，两份profile MCP配套归档与既有摘要相等。其记录保留，不覆盖后续候选。

推送时核对到默认分支11条依赖告警，不能把旧风险处置自动套给新告警。实际原生读取入口以4096个合成无效operations对照既有500上限，确认拒绝前访问了4096个元素。已提#107并先进入Project12 In progress；保留失败回归和原件，不做OOM攻击或真实平台调用。

R2仅对原生读取的既有21个数组限额及64项pair-graph限额提前准入，超限时在Zod逐项校验前拒绝；没有新增限额或业务算法，没有改Zod/Host/SDK版本、配套MCP或冻结包。四类数组及record的受控零元素访问回归、原有原生合同/服务49项通过；新增record回归之前的完整插件618pass/1skip，类型检查通过。最终CI会覆盖最后测试集合。原生非空平台样本仍未验，不以这项受控修补冒充已验。

#95已按自身四项标准留证关闭，#98按自身“未知保持开放”条款保留；#96仍在In review，待本次读取边界修补验收后再判断。最终CI/实际形态/审查与公开制品核对仍待完成。

## 独立审查与集中修正

PR106的首轮审查批准了ed70cc4，但明确保留本线关闭登录与legacy无身份拒绝的行为说明。关闭仍取消本次未完成请求、不撤销平台已完成授权；legacy仅在实际工具schema允许缺少bkn_context时保留无身份路径，formal0.2.0关闭采集仍须返回managed IDs。此处没有绕过guard或采用平行发布线关闭策略。

审查提出CSV两项真实输入边界缺陷：无canonical结果且content缺失会TypeError；含星号文件名在Windows不可落盘却通过本地校验。两项先留失败测试，再改为受控不完整结果拒绝及可移植路径拒绝，不改变CSV内容、公式或结果。新增宿主命名列表改复用compat/dsh-hosts.json，schema只描述命名语法，避免新引入的多处支持名单。

19ac084的CI40356656291因集中处理这些审查项而请求取消，不作发布候选；后续以包含全部修正的固定提交重新build-only。没有改版本号、冻结包或现有Host/平台，也没有重复UI/B1/G6。

集中修正后本地全套：插件621pass/1平台skip，仓库73pass，原生/CSV受影响61pass，类型和82文件包审计通过。待提交固定最终CI；CI R1、R2及本地失败回归分别保留，不混用摘要。

## 最终CI与按项收尾（2026-10-27）

最终CI40361613728在db68c800成功、publish=false，前一轮40356656291实际cancelled。候选27ccf15c…6b3e3，232091B/82文件；与本地构建除package.json的等义格式/键序外逐字节相等；相对冻结-32只有business.js、package.json及两份README不同。不是R1仅元数据等价结果。两份companion仍是原摘要，client.js和其他生成实现不变。

四个新隔离Mac实际npm/官方Electron Desktop后端均加载此CI包，3组件active、导出Service类身份、profile内protected MCP及manager已注册实例一致；每行公开打包Reader验证有效detail/explanation及4类拒绝，全部退出0、fixture关闭。没有GUI/UI/向量重跑；见MAC-FINAL-HOST.json。独立CSV ToolRuntime探针先因直接Node导入缺少Host模块映射失败，私有原件保留；仅旧npm在链接同一物理依赖后通过，其他3行未完成该独立探针，不冒称通过。正式CI两版npm的原CSV探针通过；本地新增星号向量已在实际旧npm ToolRuntime验证，源码61项受影响测试含缺content拒绝。

此外对该CI包补一次真实平台只读正向：先遇到test_supply过期，未派发；仅在隔离副本恢复已授权登录，再在新rc.3 npm Host开原生Session，start→search_schema→finish。独立平台读回completed、唯一search_schema Operation，Host exit0/端口释放。没有模型、Function/run_code/Sandbox或业务数据写入；只新增测试会话/Interaction。原个人配置/Host/正式0.2.0和冻结包不改。见LIVE-FINAL-METADATA.json。

独立评审对db68c800批准，CodeQL全部通过；3条inline意见已回复并解决，2项非阻断行为边界和schema语法/语义分工明确解释。#95/#96/#105/#107按自身标准关闭，#94保持；#93/#97仍等真实非空原生样本，#98保留历史未确认条件，#92/#99待总体验收/发布身份。Project阶段已按实际工作更新，计数和外部归属见ISSUE-AUDIT.json。

本次没有全局安全豁免、依赖/Host升级或新GUI体系。Windows最终CI包只补四后端实际加载/profile/Reader及一处CSV变化边界，材料已准备并随本轮提交；旧UI/GUI/B1/向量不重跑。没有收到Windows最终包结果前不宣称其通过或迁移latest。main rehearsal和公开包逐文件身份继续作为发布门槛。
