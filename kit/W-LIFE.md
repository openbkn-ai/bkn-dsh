# W-LIFE：只用原 -30，一台 Desktop，至多一次正常登录

冻结 r3 fac4db78 的 kit/原 -30/helper 原字节全部保持。旧 Windows r1残留、r2新Chrome树同次消失、r3用户确认既有Chrome根保留，是不同条件下的远程回报，不能合并成已修结论。

先选一个已验收任务 Desktop（优先 A），核对未改 -30 的82文件和官方 Host 身份。用户需**当前确认日常 Chrome 窗口已打开及其根 PID、UTC创建时间、exe**；旧 PID11368 不可沿用。不能从 PPID/任意chrome根/自动化窗口推定，不能关闭或重启个人Chrome、改默认浏览器、证书或现有例外。未确认则该段 BLOCKED，仍可独立做 UI。

使用 lifecycle30/start-owned-desktop.ps1 的正常模式在新的 Evidence 目录启动所选既有任务 Desktop，参数仍为 ApplicationExe、DshHome、CliConfig、HostVersion、Evidence；不用 InitializeOnly、不启 ReadOnlyProtocol。此启动只为取证，不重跑原helper验收。先在**不发起登录**时用官方 F12 DevTools 的现成 Network/WS 检查本任务 remote.mux 连接能否观察。只读现成 transport 形状；不修改 global、注入模块、刷新/重连/断开 socket，不启新调试端口/服务。DevTools 事后未捕获连接就 carrier-capture BLOCKED，**不先跑一次无意义登录**。

可观察且入口可自然开始登录时才：

1. 用既有进程采样器记录本任务 Host/后端、CLI、runner 与确认的日常 Chrome 根的 PID/UTC创建时间/exe；不得收集完整命令行、环境、账号、设备登录 URL或 token。现有登录态若不能自然开始登录，不主动登出改变条件，记 BLOCKED。
2. 至多一次正常 CLI 浏览器登录。线路只摘录 WS 路径、方向、帧 type、该 beginLoginStream 关联序号及 item/end/cancel 的 UTC 时间；只在本机观察后人工脱敏摘要，**不导出 HAR/原始帧payload/头/Cookie**，不采其他 Session/端点。
3. 成功后先保持插件面板，观察30秒；runner仍在才延到总60秒，保留未退出状态。不重试到碰巧复现。然后关闭/重开一次插件面板，看同一 stream 是否有新增 cancel；不发新查询/B1。
4. 菜单正常退出本轮 Desktop，核对 owned 进程/端口与日常 Chrome 根是否仍在。不得关闭个人Chrome或其他会话。只写可见事实：帧 end、server active-map移除、Job空、runner退出不是同一事实；约250–370ms同次采样消失不能判定先后。

固定 runner 只有内部 Job 句柄/isJobEmpty，未暴露已核验外部只读成员入口。本次不 DuplicateHandle/持有 Job句柄、不向 Host/runner 注入、不启调试服务、不修/升级SDK或DSH、不改 Job策略、不成功后强杀 Job/浏览器。IsProcessInJob(NULL)/PPID 不能识别特定 Job；无现成可靠来源则 Job成员/terminate调用/浏览器关闭因果 UNKNOWN/BLOCKED。不要临时编造探针冒充已证。特定 Job 查询合同参考 Microsoft 的 QueryInformationJobObject / JobObjectBasicProcessIdList，本轮不实现新句柄采集。

可只补 carrier/cancel 子项；受控 Mac证据不变：原 -30 成功时自身 operation未abort；首结果消费可 cancel；后续 close会abort UI保留operation，但流已dispose/remove后不新增cancel，reopen不重复登录。这些不等于 Windows因果。原始私有证据留本机，回传小型脱敏时间线与未知项。
