# Windows local-30 r3 最小复验

独立交接分支 `handoff/windows-local30-r3-20261023`；执行前核对主会话提供的完整固定提交。此分支是33文件产物树，不含开发源码/工作流；不用其他tip，不采用/合入/修改远端-11。

- 唯一候选 `0.2.0-rc.2-openbkn.0.2.0-30`：231075字节/82文件，SHA256 `6d95ff7517dbe409875fd398784fe01049ba26d2b97c43fad65c817d3ea18ee9`。
- 交付KIT-FILES SHA256 `7daaca61691706ef476ce007eb4c49e8a8f538a30dc73764fea6f6a4281308d0`，26项输入加清单自身。不要混用本地准备快照摘要。
- 原r2/r3 Desktop helper SHA256 `0e3466f3da61bd2cac8f263c03573ad03206dea7cf20ac58d8f94e433b4943a7`。
- 本次修正版官方argv回归 SHA256 `0a2ff6b813ac5364738e9db712a796c4aceb81f64cf2127085aeba5e420dcafd`；相对r2仅JSON数组求值一行变化，新兼容性夹具不替代Windows5.1。
- helper、插件、SDK、Host pins、其他执行脚本均与冻结r2一致；不重建、不换包。

先读[完整任务](WINDOWS-TASK.md)、[P1/P2细则](docs/handoff/2026-10-23-021-local-30-windows-r3/FOLLOWUP.md)及[结果模板](docs/handoff/2026-10-23-021-local-30-windows-r3/RESULTS-TEMPLATE.md)。

**先只跑一次P1官方argv回归**，不启动Desktop、浏览器或CLI、不访问平台。A/B原helper初始化/正常启动按r2Windows报告已通过，不复跑启动矩阵、UI、B1或C/D。P1失败保留原错并停止依赖P2。

**只有P1通过且用户确认日常Chrome已打开及窗口/进程身份后，才选一个Desktop做P2**。优先复用A的已验证隔离环境；只用本次原helper启动该一个Desktop作单次正常成功登录取证准备，不重装/InitializeOnly。日常Chrome可复用已有根，不触碰另一个会话的Chrome/-11/.playwright-mcp。采集直接CLI、runner、日常窗口/根及新登录树约60–80秒时间线，再菜单正常退出；无Job成员/顺序证据则未知，不强杀/持有Job句柄，不改生产包。

保持正式OpenBKN0.2.0和https://192.168.50.129，保留数据配置及日常安装。不要推送结果、不跑CI、不开PR/标签/发布、不替换平台。ciRun=null，formalAcceptanceEligible=false，仍为local-development-preacceptance。原r2回归fail、r1残留及r2有限未残留各保留原身份，完整验收门槛不因此关闭。

使用系统PowerShell5.1与任务Node24.19.0；所有输出写kit外，核对KIT摘要再运行verify-kit.mjs。根.gitattributes禁文本转换，不修改冻结输入。原始证据留Windows，仅回传脱敏主要结果、报告及证据绝对路径/完整SHA和受阻项。
