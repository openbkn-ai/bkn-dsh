# 第71轮：归属决定落实、OpenBKN问题提报与新账户权限验证

2026-10-26。用户明确D2/D3由OpenBKN归属处理，插件不干涉模型与平台的业务交互；D5按建议保留已知限制收尾。随后用户提供新测试身份并自行完成首次改密，本轮补齐其指定的“供应链有权、世界杯无权”权限场景。冻结-30/-31/-32、现有Host代码及正式0.2.0不替换；没有代码推送、CI、模型或Sandbox执行。

## 归属与提报

本轮使用GitHub连接器先检索相关问题并核对既有设计/修复，再按用户明确授权创建以下三项。逐项读回标题/正文相等；公开正文使用占位产品与脱敏条件，没有密码、token、实际业务行、平台地址或原始会话ID。

| 问题 | 实际证据和归属边界 | 已提报 |
|---|---|---|
| 旧销售Function未调用且误报总数 | 第31/35轮：正确Function已发现，两份原请求目录确有execute_tool，模型未调用、改读无过滤全表后误称20而基准40，且遗漏交付。模型/元数据/调用方原因仍待分类，不断言平台执行器已证实有错 | [Foundry #2515](https://github.com/openbkn-ai/bkn-foundry/issues/2515) |
| 标准交期附加字段标签混用 | 第35轮旧Desktop：主值1天正确，但将group_type值当作group_name对应类别；原schema和SQL区别明确。没有发现插件丢工具/改字段证据，模型内部原因未知 | [Foundry #2516](https://github.com/openbkn-ai/bkn-foundry/issues/2516) |
| 原生detail/explanations不可用 | 第14轮固定正式构建，同Interaction标准记录及27条operations200；TLS入口/服务直连均原生text/plain404。关联既有#546设计，请平台确认Community边界、部署配置还是缺陷，不从404推断许可或无业务数据 | [Foundry #2517](https://github.com/openbkn-ai/bkn-foundry/issues/2517) |

既有[质量计划#2192](https://github.com/openbkn-ai/bkn-foundry/issues/2192)与[结果引导#1780](https://github.com/openbkn-ai/bkn-foundry/issues/1780)是相关工作，不冒称其已覆盖本次具体失败。Sandbox复用既有[#2294](https://github.com/openbkn-ai/bkn-foundry/issues/2294)、已合并修复[#2301](https://github.com/openbkn-ai/bkn-foundry/pull/2301)/[#2303](https://github.com/openbkn-ai/bkn-foundry/pull/2303)，没有重复建缺陷、重开已合并修复或部署候选。

npm恢复回合的旧BLOCKED来自执行前Sandbox保护，没有完成业务调用，不报告成已证实的执行器失败。历史BOM/CSV成功与失败按原版本保留，不重复测试或改判分。

这落实的是责任边界，不把错误改为正确：模型/OpenBKN内容问题有当时条件与issue后转外部跟踪，不等待修完才推进插件；若证据指向插件丢参、鉴权、治理或展示自身缺陷，仍应在插件处理。没有添加答案仲裁、纠正回合或重复算法。

## D4实际范围与身份

用户给出的真实权限图是供应链可访问、世界杯不可访问。原G6 YAML要求的是无供应链权限，方向相反；本轮覆盖用户指定的跨网络授权目标，**不伪称原题或模型负例已跑，不修改历史G6分数**。没有把本次rc.3 npm结果外推成两Host/全OS/全部UI通过。

- 正式CLI0.2.0，使用新独立BKN_CONFIG_DIR，清除BKN_TOKEN/BKN_USER覆盖；登录后确认有效身份与未过期状态。凭据只留任务私有配置，未写Cordis YAML、公开证据或issue。
- 固定原平台HTTPS，经现有CA执行Node/CLI校验；没有禁用TLS或修改系统信任。IAB首访出现证书不受信错误；改用已能打开的Chrome独立无痕窗口，未由代理越过浏览器警告，浏览器正常CA信任仍不记通过。
- 首轮官方CLI密码入口超时，浏览器随后显示首次改密；该密码变更由用户完成。第一次120秒设备流程因需再次登录而超时，原件保留；最终用600秒授权窗口供人工接力并由代理使用用户提供的更新后凭据完成正常登录。600秒仅为本次接力，不计默认登录超时验收，不修改CLI/Host。
- 实际执行已有官方原生rc.3 npm CLI入口，采用新空home/profile；冻结-32解包82文件，profile同源MCP payload12文件及Zod4.4.3。Host运行根保留stock MCP；实际Service类为冻结导出类，business.js `9901a046…`、业务选中的profile MCP入口`b3cd7156…`。

## 新增权限场景结果

| 检查 | 实测结果 |
|---|---|
| 当前身份网络目录 | 只返回供应链，世界杯不在目录中 |
| 独立平台只读网络详情 | 供应链200且身份匹配；世界杯403 Public.Forbidden，只有拒绝响应，无网络详情/业务行 |
| 实际Host创建本轮原生Session | 使用官方agents.create创建，不注入假Agent或CLI结果，不配置/调用模型 |
| 绑定无权世界杯 | 冻结Service明确拒绝：requested network not visible to current identity，无业务数据返回 |
| 绑定有权供应链 | 成功，按实际目录/详情建立该Session绑定 |
| 原生ToolRuntime跨网请求 | 在真实managed Interaction内请求世界杯search_schema，被绑定网络守卫拒绝 |
| 同Session供应链schema读取 | 成功；仅元数据读取，不调用Function/run_code |
| 正式平台独立读回 | Interaction HTTP200/completed；operations HTTP200，仅一条search_schema（供应链）；不是以completed代替前述权限判定 |
| 本轮收态 | Agent标准dispose，Host收到身份核对后的SIGTERM并exit0；任务PID无存活、127.0.0.1:63659无监听；Host原入口与stock MCP摘要保持 |

权限场景PASS，模型调用0、Sandbox调用0；没有重跑8/8、跳转向量、UI/语言/800×600、B1/W-LIFE或完整G6。原数据配置没有本轮写入操作；新增测试授权会话、任务Session及一条诊断Interaction是正常测试足迹，保留原件，不冒称平台零写入或本轮全库摘要审计。

测试无痕窗口和本轮创建的临时IAB标签已关闭，原管理员Chrome窗口仍在。未提取浏览器保存密码或平台密码；首次改密由用户完成，随后仅使用用户明确提供的既有凭据登录，不更改或回滚凭据，没有改账号权限或默认管理员CLI配置。

## 决定及下一步

D1原欢迎态退出口径保持；D2/D3按三项OpenBKN提报转归属跟踪；D4本轮指定场景通过；D5已知问题/环境与证据限制按建议收尾，仍不称历史根因已修。计划入口、待办、验收合同、原生合同、兼容说明、关单规则、scope入口、CLAUDE及未发布CHANGELOG同步。

不再把外部业务/原生路由问题、缺测试账号或D2–D5待决作为插件全局停止条件。剩余为最终候选/配套payload身份、声明支持形态的最小兼容证据和另行授权的CI/审查/发布流程。当前仍为`local-development-preacceptance; ciRun=null; formalAcceptanceEligible=false`，没有代码推送、CI、tag/发布或本插件远端关单。

两上游只读复核与第70轮相同：DSH默认22ddee37/最新rc.3，Foundry默认94ad3c2e/正式v0.2.0；未部署main或修改固定工具合同/fixture。公开结构化结果见[DECISIONS-AND-PERMISSIONS.json](DECISIONS-AND-PERMISSIONS.json)，本轮脱敏/文件/保全核对见[VALIDATION.json](VALIDATION.json)。完整登录日志、凭据、原生Host日志、平台响应、测试ID只留私有release/local-71，不放入公开issue或证据包。
