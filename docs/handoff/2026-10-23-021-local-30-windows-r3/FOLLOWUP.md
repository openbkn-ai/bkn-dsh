# 本地 r3：只修 argv 回归的 PS5.1 数组边界

本目录未提交/未推送；旧 r2 分支96f8f76保持冻结，没有新Git取件身份。插件仍为同一-30，helper SHA仍为0e3466f3da61bd2cac8f263c03573ad03206dea7cf20ac58d8f94e433b4943a7；不重建、不改SDK/Host，不采用另一路-11。

## P1：一次官方回归，不启动应用

r2 Windows报告的原helper A/B InitializeOnly和正常启动均通过。失败的是新加的test-desktop-launcher-argv.ps1：PS5.1把JSON数组作为一个管道对象输出，外层@(...)得到Count1。修正只把该行变成@((...))，让括号表达式先求值再由数组表达式枚举。原r2官方回归fail和Windows诊断副本pass保持，不能改写成原脚本已过。

下一次交接固定后，Windows只需用系统PowerShell5.1执行一次：

```powershell
powershell.exe -NoLogo -NoProfile -File (Join-Path $taskKit 'test-desktop-launcher-argv.ps1') -Launcher (Join-Path $taskKit 'start-owned-desktop.ps1') -NodeExe (Get-Command node.exe).Source
if($LASTEXITCODE -ne 0){throw 'Official argv regression failed'}
```

该回归只启动短命Node argv sink，不启动Desktop、CLI登录、模型或平台。不要为此重跑A/B启动、完整UI/B1或C/D。新加的test-desktop-launcher-json-array.ps1是在Mac/PS7本地模拟PS5.1单对象输出契约的夹具，不能替代Windows5.1官方回归。

本机已证明：旧脚本在模拟单对象输出时失败；新脚本在PS7正常输出与模拟输出都逐项匹配真实Node argv；额外实际参数仍被拒绝。Windows5.1原生复跑仍待执行。

## P2：浏览器/runner是独立开放问题

r2报告中A/B在60–80秒观察内无runner残留，但登录新建的Chrome树与runner在同次约370ms采样中消失。仅证明这一窗口内未残留，不能说修好了runner；Chrome消失的顺序与原因未知，IsProcessInJob(NULL)只证明在某个Job，不能识别runner所属Job。

“正常默认Chrome已运行”本轮未覆盖：中途把54508当默认实例的判断已被撤回，它可能属于另一自动化会话。仅有一个Chrome根、默认快捷方式或新根出现都不足以证明日常配置。后续需要用户从平常入口打开并确认自己的日常Chrome窗口，记录该窗口的进程身份与启动时间；如新窗口复用已有根，也不能以没有新根判为条件不满足。不得触碰其他会话的Chrome、-11页面或.playwright-mcp目录。

在这个前提明确且用户可配合时，先仅选一个Desktop做一次正常登录，采集原有日常Chrome根是否保留、登录新树/CLI/runner时间线和正常Host退出。无须重新做两版启动或四组合回归。缺少前提则blocked，不通过关闭个人浏览器、修改默认浏览器或清理别人的自动化环境造条件。不要复制完整命令行、环境或设备URL。

源码补充：当前客户端for-await拿首个结果即return并dispose，原生stream在未消费terminal时会走cancel；服务端若仍保留该流，其AbortSignal会触发管理范围终止。受控客户端函数检查证明了“首结果提前收尾”的路径，但没有执行真实native Remote/Windows Job/浏览器，因此只是浏览器关闭的候选机制，不能据此归因。服务端可能已自然完成并移除该流，时序必须核对。

本轮不修改生产登录流、SDK或Host。不要成功后强杀Job；不要为取证复制/长期持有Job句柄或向Host注入代码，这会改变最后句柄关闭的生命周期。只有现成、经核验且不会改变被测生命周期的只读事件/Job证据才使用；拿不到成员身份就保持未知。若后续需要改生产登录流，必须另建候选并复验，不能混入固定-30。

慢读取消、浏览器信任、RDP、npm空控制台、完整G6/安全/低权限/CE非空/旧销售/最终CI继续开放。正式0.2.0及数据配置保留，不推送、不跑CI、不发布；先回传脱敏结果和完整证据摘要。
