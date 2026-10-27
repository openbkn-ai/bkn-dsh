# Windows只读补遗的接收与更正

来源：用户从Windows会话转回的既有原件只读澄清；没有再次启动Host、改文件、跑测试或推送。原结果0d9666c、报告11961121…和manifest d3052b31…不改；主会话没有取得115项私有原件。本文件是脱敏接收记录，不假装原Windows文件本就包含这些内容。

- 正确HOME下旧npm C/D/E三次、 新npm J一次超过90秒没有观察器结果，共4次；不包括错误HOME的A/B，亦不包括移除business的H诊断。超时实例的业务组件状态/apply时间仍UNKNOWN，不能称业务已就绪只是探针晚到。
- E：PID39680，创建2026-10-26T23:23:10.0005830Z；这才是公开host-identity-npm-old.txt所记录的实例，结果为超时。旧npm成功I的PID/实际创建时间未记录，不能拿E身份证明I。I输出mtime远程读为23:30:29.804Z，约22–23秒仅为会话推断。
- 新npm J超时后K成功；K PID36736/实际创建23:33:21.3319340Z，结果mtime23:33:24.510Z，约3.18秒。两个Desktop成功输出相对READY约60/100毫秒，不能外推为npm任意启动可靠。
- H移除business bundle后20秒内诊断行执行到未声明注入的属性读取并报错，证明apply已运行；有business时diag行也曾不执行。这个对照指向集成路径，尚不能在候选、Host loader和测试配置之间定责。新建#108分诊，不重开#105协议回补，不先修候选。
- 正确HOME的C期间，交接目录仍生成7文件：anonymous id、合成credential、4个profile模板和workspace；均已移存。写入cwd的机制UNKNOWN，不将合成credential描述为真实凭据泄漏。
- A/B为单独的PowerShell只读HOME误用事故：远程称用户目录只观察到4个web profile模板，检查后两次删除；NTUSER.DAT类watch被EBUSY拒绝。没有用户目录前置快照，部分原错误/身份日志已覆盖，删除过程仅会话记录。不能声称个人状态逐字节不变，也不为补证做个人全库审计。

四个成功实例的实际业务类/profile MCP/Reader功能证据及CSV对照仍接收；旧npm成功实例的PID/收态关联单列INSUFFICIENT_EVIDENCE，不能被最终无残留报告自动补齐。原formalAcceptanceEligible=false不改。第74轮原初“只需区分观察器迟到”的措辞由本补遗修正为实际集成问题待定责，记录不回写原Windows报告。

最小决策：保持rc并只分诊一个失败npm组合（可用现有完整/去business对照、完整身份/就绪/写点记录，不新增框架或全矩阵）；或维护者明确接受新启动/写入归属未知及旧npm身份缺证的限制后继续latest。未明确前不迁移，不自动降级支持承诺。#108进入Project12 In progress；#99继续Validating。
