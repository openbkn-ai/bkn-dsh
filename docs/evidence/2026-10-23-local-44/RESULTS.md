# 第44轮：r2 Windows回传、PS5.1回归修正与登录流收尾分诊

r2报告支持关闭A/B修正版原helper的InitializeOnly和正常启动门槛；官方argv回归仍fail，不能用kit外诊断副本改写。已在本机修正回归脚本一行并准备本地r3，没有改helper、插件-30、SDK或官方Host。

来源是用户提供的文本附件，原字节已私有保存，附件SHA为88dd93804ab87c7fe923ffee301c8fc905b2e7196f950c7c65930a88420568ec。它不是Windows RESULTS-redacted.md文件；主会话未读取/核验Windows原报告4060506d…549b4及354项证据清单。不要把附件SHA当原报告SHA。Windows报告条件和完整摘要见[接收记录](windows-r2-reported-results.json)。

## 结果合并

| 边界 | r2 Windows报告 | 当前判断 |
|---|---|---|
| 原helper A/B InitializeOnly/正常启动 | pass/pass，实际profile82文件共享框架，零EPIPE | 按远程报告关闭该门槛，保留原条件与证据；主会话未读Windows私有原件 |
| 官方Windows5.1 argv回归 | fail：Native argv element count differs | 测试脚本缺陷，原fail保留 |
| kit外单行修正诊断 | 两分支匹配 | 只作诊断；修正版官方回归原生复跑待验 |
| runner残留 | 两次60–80秒观察未出现 | 不等于已修复，不抹去743eb4a原finding |
| 新Chrome树和runner | 同次约370ms采样消失 | 浏览器消失副作用继续开放，先后和原因未知 |
| Job | inAnyJob；无成员列表 | 不能证明同Job或Job为空 |
| 默认Chrome已运行 | 中途判断被撤回，54508可能是别的自动化Chrome | 条件未覆盖；不能拿本次结果关闭该条件 |
| 平台保留 | 只登录/列网，无数据摘要比对 | 不宣称平台数据已做前后相等验证；主会话本轮无平台动作 |

未追加C/D、完整UI/B1、真实模型或Sandbox，保留最小范围。个人110文件/日常41文件摘要一致、正常Host退出与端口释放是Windows报告结论。别的会话-11页面、Chrome与.playwright-mcp未触碰，不能为补条件而清理。

## 已独立完成的回归修正

一行差异见[diff](argv-regression-fix.diff)：`@(Get-Content ... | ConvertFrom-Json)`改为`@((Get-Content ... | ConvertFrom-Json))`。这次错误来自主会话新增回归脚本的PS5.1兼容遗漏，不是r2原helper启动错误复发。

使用本机PowerShell7.6.8和真实Node argv sink：正常PS7模式、模拟PS5.1“单个非枚举数组对象输出”的模式均通过两个分支；旧冻结脚本在模拟模式精确重现Native argv element count differs，额外实际参数的负对照仍被拒。见[原失败](json-array-original.json)、[修正验证](json-array-fixed.json)与[负对照](json-array-negative.json)。模拟只覆盖数组输出契约，不冒充Windows5.1原生运行。

本地[r3跟进](../../handoff/2026-10-23-021-local-30-windows-r3/FOLLOWUP.md)保留同-30、同helper0e3466f3…4943a7和SDK，新增兼容夹具及说明；26项输入/82候选文件/SDK校验通过。r3尚未提交或推送，没有新Git取件身份；远端r2的96f8f76仍含原回归缺陷。下一次只需先做一次修正版官方PS5.1回归，无须因测试修正重跑A/B启动/UI/B1。

## 登录流收尾的候选机制

当前生产客户端index.tsx的remotePort拿首个yield即return，再dispose登录流。固定DSH ClientStreamHandle的return/dispose会结束generation；stream-client在未消费terminal时发送cancel，server仅在逻辑流仍active时把它转为AbortSignal，subprocess会终止仍属管理范围的进程。若server已自然结束并移除该流，迟到cancel会被丢弃。

本机提取并执行了未修改的生产remotePort函数，使用可控流夹具：首结果路径未消费terminal并请求提前关闭；完整消费到terminal的对照没有模型化取消请求。详情见[受控生命周期检查](login-stream-lifetime.json)。这个夹具没有执行真实native Remote传输、Windows Job或浏览器，不是Windows根因证明；报告中的modelCancelRequested是夹具事件，不是实测wire帧。

该路径给出比“看见runner就判断泄漏”更具体的时序假设，但不能据此确认Chrome被Job杀掉，也不能排除Chrome自身退出/转交。Windows当前没有成员和先后证据，本轮未修改生产登录流、SDK或Host；如未来修改必须另建候选并验证，不混入固定-30。

补默认Chrome条件时，需用户明确确认日常Chrome窗口及其进程身份；“有根进程”“快捷方式指向默认”“出现新根”都不足以证明配置，正常窗口也可能复用已有根。不要接管别的自动化Chrome/-11页面。条件明确后先只选一个Desktop做一次登录对照；Job身份不可得就保持未知，不复制/长期持有Job句柄或注入Host来改变kill-on-close生命周期。

## 约束与未完成

DSH仍687f282e，Foundry正式仍v0.2.0；本次新增6个未发布main提交至0b447996，检查了UNION文本/契约、GraphExplorer、trace和值类型API等，未部署、未扩展工具。见[上游核对](upstream-review.json)。

正式0.2.0不替换，本轮无Host/平台运行、生产包变更、提交、推送或CI；其他工作树和冻结交接保留。慢读取消、浏览器信任、真实RDP、npm窗口、完整G6/安全/低权限/CE非空/旧销售/固定CI门槛继续开放。r2本次观察不能关闭完整合同，ciRun=null、formalAcceptanceEligible=false。

保存检查另观察到独立english12-review工作树HEAD从319aaed推进到1c758ff；本会话未对其执行提交或变更、未读取/采用该代码，不回滚其他会话活动。详见preservation-final.json，不能声明全部其他工作树HEAD未变。主工作树753个既有文件中仅5个本地状态入口和1个回归脚本改变，其余747原字节保持，HEAD/分支/index不变。
