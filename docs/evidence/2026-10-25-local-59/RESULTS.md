# 第59轮：独立 Desktop GUI 构建/签名路径与 Windows 最小材料

2026-10-25。**已查清官方两基线的GUI构建/签名和隔离路径，准备本地Windows r1材料；尚未形成独立GUI制品。** 本轮是源码/配置评审与材料准备，不是GUI构建、签名或Windows验收。`local-development-preacceptance`、`ciRun=null`、`formalAcceptanceEligible=false`。

## 已确认的差异

官方source old0.2.0-rc.2 /639ed015、新0.2.1-rc.3 /1f81c047保持。两版developmentLauncher实际纯函数都生成DSH_DESKTOP_DEV_APP=1与main/renderer/Host调试设置；生成的launcher未固化回补runtime和primary runtime路径。源码helper还会adhoc签新copy并lsregister、注册dsh协议。它不能直接满足本轮“不影响现有Host”的隔离要求；本轮没有调用这个有副作用helper。

rc.3本地Mac环境函数实际把传入独立appId改回com.deepseek.harness；旧版CLI和builder都限制unsigned仅Windows。productName、协议、global CLI、共享DSH home、Electron userData/logs及OTA/mandatory-policy仍需独立发行集成，不能只改appId或替换ASAR。完整评审、源行锚点、工具lock和后续执行顺序见[构建签名路径](DESKTOP-GUI-BUILD-SIGNING.md)。

本机只读签名身份查询报告0 valid identities。未读私钥、未签名、未公证或修改信任。GUI仍需隔离源码/入口/builder胶水、干净全仓构建及实际制品验证；**不是只缺签名证书**。当前没有向用户索要证书/密码或操作签名设备。[签名能力边界](SIGNING-AVAILABILITY.json)。

## 新增检查与证据复用

- 实际执行官方developmentLauncher纯函数（两基线），以及从rc.3原文件抽取的环境函数及实际常量。只转译/计算launcher与配置；不构建、启动GUI或调用codesign/lsregister。[函数评审](OFFICIAL-FUNCTION-REVIEW.json)。
- 新gui-contract计划/回执校验器5组检查通过：拒绝官方身份、全局协议/CLI/调试设置、错版本/候选、重叠路径（含Windows大小写）及未构建/未签名GUI；通过只代表计划字段符合规则，**不会替官方程序实现这些规则**。
- Windows探针只做node --check。真实原生Windows语义NOT_RUN；没有在Mac重跑已通过的同源/跨源/CLI加载/认证/UI/B1/G6。
- 第53轮策略/SDK与服务组合、第57轮完整Host/归档/后端对照、第58轮实际 -32原生加载和CLI管理认证保留原身份；它们不替代新GUI和Windows门槛。

## Windows r1准备材料

本地目录：[handoff r1](../../handoff/2026-10-25-021-host-backport-windows-r1/README.md)。新分支/提交均null，未推送。包含冻结 -32、官方CLI SDK0.2.0、两MCP payload、原补丁系列、原样复用的tar/profile校验工具、新合成原生探针、结果模板及后续会话提示词；不含Windows完整runtime、GUI、个人配置/凭据或业务原件。

输入包分别82/9/12/12文件逐项核对。KIT-FILES SHA256为 `8b3d1a6973637d8a6e2303354019b88d6f849986687fadb599684d15d2940933`。运行一次`verify-inputs.mjs --require-gui`：输入PASS，GUI如预期BLOCKED/exit2；GUI-ARTIFACTS两项NOT_BUILT、executionAuthorized=false，不允许自行补成BUILT。[材料身份与检查](WINDOWS-MATERIALS.json)。

Windows官方feed当前rc.3，固定URL/大小289415960/SHA512已取回并保存；未下载/执行安装器，原生Authenticode与实际ASAR仍待验证。旧版摘要来自历史完整官方URL取件，来源限制随材料披露，不将当前旧新版rc.2结果转记rc.3。[feed记录](WINDOWS-FEED.json)。

后续最小范围是实际新制品身份/隔离、每实际Node或Electron路径仅一次同源307+跨源307的stock/protected对照、必要时一次普通CLI认证与owned退出。W1只用合成loopback，零真实问题；W3真实登录必须先评审原W-LIFE与当前日常Chrome身份并另获明确执行范围。未重跑完整旧UI/argv/tar/取消/超时/B1。当前Windows仍固定d20a266做-31原UI与-30 W-LIFE，不扩容。

## 上游、保护与当前缺口

DSH读取时master仍22ddee37，最新rc.3。Foundry main从d31470a8新增2提交/20文件至a50d1b7d：edition authzresource扩展按资源类型回退、逐次license gate与5秒期限；archive SQL cleanup增加stale/revision fence。定向评审未见MCP/CLI/GUI或插件消费路径变化，非全量审计；正式0.2.0不部署、不迁移。[上游评审](UPSTREAM-REVIEW.json)。

只新增本轮证据/准备材料和更新6份状态文档，原修改、冻结 -30/-31/-32、第57/58轮输入和原Host/ASAR/home均保留。没有启动Host、真实CLI登录/模型/业务工具或Sandbox，没有改正式0.2.0服务和数据配置，没有提交、推送、CI、PR/tag/发布、协议/CLI注册或远端issue写入。保护核对见[PRESERVATION.json](PRESERVATION.json)。

#105继续OPEN。GUI源码集成、全量构建、真实GUI/签名/公证、Windows及最终候选门槛仍未完成；既有其他合同缺口保留。当前无需用户提供凭据，实际签名阶段才需要明确发行主体与可用签名环境。[剩余项](BLOCKERS.md)。
