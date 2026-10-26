# 第45轮：Windows -30 r3 独立交接回执

本轮仅按用户明确授权推送新的独立分支 `handoff/windows-local30-r3-20261023`，完整固定提交 `fac4db78a1a974192fa13fdbe62063331cf04ec1`。英文提交信息带 `[skip ci]`；33文件独立根提交，无工作流、无开发源码。只执行显式新分支refspec且关闭followTags，没有PR、标签、发布、CI dispatch、Host启动或平台动作；不采用/合入/修改另一路-11。

## 固定身份与范围

- 候选仍为 `0.2.0-rc.2-openbkn.0.2.0-30`，231075字节、82文件，SHA256 `6d95ff7517dbe409875fd398784fe01049ba26d2b97c43fad65c817d3ea18ee9`。
- 交付KIT-FILES SHA256 `7daaca61691706ef476ce007eb4c49e8a8f538a30dc73764fea6f6a4281308d0`，26项输入；清单自身另计。
- 原helper SHA256 `0e3466f3da61bd2cac8f263c03573ad03206dea7cf20ac58d8f94e433b4943a7`；修正版官方argv回归 SHA256 `0a2ff6b813ac5364738e9db712a796c4aceb81f64cf2127085aeba5e420dcafd`。
- SDK、Host pins、全部准备态r3执行字节不变；没有重建或生产源码变更。相对冻结r2执行边界只有回归脚本一行@((pipeline))与新增模拟夹具；helper/-30/SDK均原字节。
- 第44轮本地r3准备快照KIT `82d1b74c43728301016928b527742d1cee66e45413412de17fdc76b7735bc936`和ZIP保留，不能混作本次远端交付摘要。本次仅在隔离交接树更新三份交付/范围文档并重算清单。

[固定远端入口](https://github.com/openbkn-ai/bkn-dsh/blob/fac4db78a1a974192fa13fdbe62063331cf04ec1/README.md)、[远端完整任务](https://github.com/openbkn-ai/bkn-dsh/blob/fac4db78a1a974192fa13fdbe62063331cf04ec1/WINDOWS-TASK.md)、[可直接粘贴的固定提示词](WINDOWS-PROMPT.md)。

Windows先只复跑一次官方PowerShell5.1 argv回归，不启动Desktop、CLI、浏览器或访问平台。A/B原helper初始化/正常启动按原r2Windows报告保留，不复跑启动验收、UI或B1。P1失败停止依赖P2。仅P1通过且用户确认日常Chrome可见窗口/进程身份后，才复用一个既有隔离Desktop做单次正常成功登录取证；不重装/初始化、不扩展C/D或第二Desktop。缺条件则blocked。所选Desktop为P2必要准备启动，不重新计分A/B启动矩阵。

只读时间线分开记录直接CLI、runner、原日常Chrome窗口/根和登录新树；不触碰其他会话Chrome/-11/.playwright-mcp，不复制/持有Job句柄或强杀。r1残留与r2有限窗口未残留、浏览器关闭顺序/Job未知分别保留；受控客户端函数的提前return/dispose不是Windows因果证据。本轮未改变生产登录流。

## 交付验证

本机PowerShell7.6.8/任务Node24.19.0的官方argv两分支匹配6/10项，未启动Host或访问平台；这不是Windows5.1原生通过。26项输入、82候选文件、SDK注册表integrity通过。未重复与本次传输无关的生产测试或完整Host矩阵。

提交前33个staged blob全部匹配审计摘要。六类凭据/私钥模式扫描包含两份tgz展开内容，共122份文本、0命中；不将此有限模式扫描表述为绝对无秘密证明。原始Windows证据/私人附件未进入提交。

从origin全新clone至带空格路径，命令级core.autocrlf=true；全部33文件逐字节匹配，Git text属性均unset，checkout干净。verify-kit再核对26输入/82候选文件/SDK通过。具体见[取件验证](remote-checkout-verification.json)和[产物审计](artifact-audit.json)。

远端ref精确指向固定提交，记录检查时Actions/PR列表为空；旧-27、旧-30、r2及Windows旧结果refs均未变，见[远端状态](remote-state.json)。没有dispatch或创建PR，不推送Windows结果。

## 保留与限制

原开发工作树793个既有修改/未跟踪文件中，788个原字节保持，仅五个状态入口按本轮交接更新；原HEAD/分支/index不变。既有其他工作树refs不变，仅增加新的独立交接工作树。第44轮准备kit、ZIP、所有旧报告与失败保留，见[保留校验](preservation.json)。

正式OpenBKN0.2.0不替换，数据配置保留；本轮没有平台读写、登录、服务或Host操作，未做也不宣称新的平台全量前后数据核验。Windows原生P1及有条件P2仍待执行，原私有Windows文件未由本机独立读取。完整G6、安全/低权限、CE非空、历史销售、最终固定CI候选及完整验收合同继续开放。ciRun=null，formalAcceptanceEligible=false，仍为local-development-preacceptance。
