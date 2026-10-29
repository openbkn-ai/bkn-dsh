# Windows 自动登录成功状态复验接收（2026-10-30）

**本轮受影响主项 PASS，可以停止 Windows 追加测试。** 修复源码dbf53d3、交接40fe7a5、auto.local.2/96dc62d7/94文件的身份一致。公开结果提交为 `8b5ee4902463b79a89f06b4628977217356fd80c`，其唯一父为f1b4b8b；不能把结果提交误认成修复源码或取件HEAD。源报告、manifest、proof等11个公开Git blob已逐个核对，并以原字节保存在[windows-results](windows-results/RESULTS-auto-login-status-fix-20261030.md)。报告SHA256为a95157863b199790f95821d626fb1dfef70ad44efbbafd8833b2fb3f970ebe58。

## 接收判定与证据层级

- Windows远程报告：本地+08:00的00:31:48唯一一次点击登录，00:31:56完整AX仍等待，00:32:09观察器proof落盘，00:32:19完整AX出现成功和两个授权网络、等待文案消失；期间未关闭/刷新/诊断/切换语言/重开。proof落盘至首见成功约10秒；不是授权完成耗时或产品SLA。精确翻转时刻与浏览器授权完成时刻UNKNOWN，不用proof文件mtime替代人工授权完成时刻。`t-click.txt`虽然字段名含Local，其值带Z，应按UTC解释后换算+08:00。
- 直接核对公开proof：auto.local.2、三组件active、类身份、authenticated、real-read-only、networkCount=2、registry实例===manager fiber.runtime、包内MCP41db8cdb、无manual companion。主会话未取回私有AX/截图/进程清单/.reg原件，UI过程和系统收态按远程报告接收，不冒充本机重演或直接逐图审阅。
- 菜单正常退出一次、进程树/端口清理、After unchanged=True、受限Restore及UserChoice/ACL未变按回执接收。公开退出码文件确为空值，保留UNKNOWN；不为补退出码再启动Host或修一套启动器。目录/认证持久化、取消及其他已过项沿用auto.local.1，因为本轮归档只改client.js/package.json；没有把它们记成auto.local.2本轮重新执行。
- 公开报告、proof、点击时间、三份verify、身份/退出码/final-digests共9项摘要与manifest对应条目一致。42项manifest里的其余私有原件未取回；manifest自身条目的摘要不等于当前文件，原文保留，当前manifest独立SHA256为f6e2d18b85fa8445bd9a5b1e1df9d5602669db1e697fbbf0a40ed3897594f3ae。未取得此前manifest原件，不能推断该自身条目的来源，也不把它写成全部42项内容已验证。详见[接收核对记录](WINDOWS-REVIEW.json)。

## 收口边界与后续

本地受控清理延迟的复现/修复、官方Mac GUI合成授权及本轮Windows真实授权共同覆盖新增成功反馈边界；这不证明上轮五分钟滞留的唯一根因，也不把一次成功推广成所有启动时序或整体正式发布验收。保留原auto.local.1异常及首败、Windows退出码未知，主项无需继续补测。

本轮只接收公开材料、同步本地计划/合同/待办，没有启动Host、重跑测试、改候选/Host/正式0.2.0或业务数据配置。新增公开副本放在证据目录，冻结交接kit及KIT-FILES没有新增文件或被改写。auto.local.2仍是未发布本地候选，ciRun=null、formalAcceptanceEligible=false；若继续公开发布增量，仍按原独立评审、固定CI候选及发布门槛执行，不默认降级。本轮不推送、不建PR、不跑CI/发布，不操作维护者的latest和本机npm CLI，不改#93/#97/#2573。
