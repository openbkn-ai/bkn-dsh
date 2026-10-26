# Windows 最小补证草案：UI -31 与生命周期 -30 分开

本方案仅本地准备，未推送、未运行CI，没有新的远端分支/固定提交可取。冻结输入继续是r3 fac4db78a1a974192fa13fdbe62063331cf04ec1及其原-30。-31为本机独立开发包，必须在以后明确交接后核对其提交、tgz SHA与逐文件差异，不能用-30冒充-31，也不能采用另一发布线的-11。

正式0.2.0与既有数据配置不变，不升级/修补官方DSH或SDK；不运行模型、G6、BOM/CSV、Function/run_code或B1。保留任务home、个人配置、日常浏览器和失败原件。**不重跑**已通过的A/B原helper初始化/启动验收、官方argv回归、系统tar、四组合闭包、完整UI、取消/超时或B1查询。必要时用既有helper启动一个任务Desktop，只作为取证前提，不重新记为启动验收。

## W-UI：未来收到-31后，仅测客户端差异

候选当前本机SHA256 22ba0e17235ccb3c93d585f2811604f5221375ac9e3496e92e6d8c1756196e4a，231535 bytes /82文件。与-30只差lib/client.js、lib/types/client/locales.d.ts、package.json；Host与全部typert Remote文件完全相同。

1. 先只选择一个现有任务Desktop，建议A旧版；复用已验收profile与绑定，建立任务patch/home摘要。不要重新安装DSH或复制日常profile。候选交接必须包含明确可恢复的任务profile升级步骤和旧包备份，当前草案不授权直接改Windows冻结kit。
2. 打开一处已有记录的历史溯源区，用中文确认请求/跟踪/回执/操作/状态标签，切英文再切回，原名称、ID和completed等平台值保持；不制造新业务记录。缺少有这些字段的已有记录就记该子项BLOCKED，保留本地受控渲染结果，不能把404空态当非空标签通过。
3. 在业务、诊断、溯源三个插件弹层分别按一次Escape，检查插件层关闭、原生父面板保持、焦点回到入口。只在这些受影响弹层补Tab边界/Shift-Tab和800×600溢出；不重新做整个目录、登录或B1矩阵。若存在嵌套菜单，确认已消费的Escape不会连带关闭插件层。
4. 查看两个OPENBKN眉标和登录按钮文本的可读性；诊断被动模式说明须明确“历史观察/不会主动验证当前登录或连接”。导出JSON保持原始报告事实，不为说明文字重做原有文件保存回归。
5. 用同一包在B新版只做受影响弹层的Escape/Tab与文案快速检查；不重做A/B启动、argv、目录绑定、超时或B1。npm仅在Desktop发现形态特有问题，或最终候选差异另有要求时扩展。

PASS仅指对应变动子项；这不是完整Windows、非空原生解释或正式CI候选验收。

## W-LIFE：原-30，仅补一台Desktop的carrier/cancel观察

本段独立于UI-31，原-30不做源码、包、SDK或Host改动。使用用户已确认的日常Chrome现存窗口与根进程身份；不能以某个chrome.exe根、PPID或另一个自动化窗口代替确认。没有当前确认就先停在前置条件，不自动关闭/重开日常Chrome、不修改默认浏览器、不创建强制新树条件。

先在**不发起登录**的情况下预检官方Desktop自带F12 DevTools（固定main.ts定义toggleDevTools/F12），检查现成Network/WS是否能观察该任务的remote.mux。只读检查允许的启动transport形状，不改global、重连、断开socket或注入模块。若现成面板无法观察当前连接，则记carrier-capture BLOCKED；不要为了抓帧强制重载/重启并先跑一次无意义登录。

能观察时：

- 仅做一次正常登录，用现有进程采样器记录该任务Host/后端、CLI、runner，以及用户确认日常Chrome的PID、创建时间和exe身份。不要复制完整命令行、环境、设备URL、账号或token。
- 线路只摘录路径、方向、帧type、该beginLoginStream的关联序号，以及item/end/cancel时间。**不导出HAR、原始帧payload、请求头或cookie。** 不抓取其他Session/端点。成功后先不关闭面板，观察30秒；若runner仍在则继续至60秒，并保留未退出状态。
- 然后关闭/重开一次插件面板，检查是否新增同一stream的cancel；不开新查询、不重做B1。最后通过菜单正常退出该任务Desktop，核对owned进程/端口及日常Chrome根状态。
- end帧、服务端stream移除和Job退出是不同事实。DevTools看到end不能单独证明Host何时从active map移除；约250–370ms进程采样内的同次消失也不能判定先后。

本机已用原-30消费者、原始UI控制器及两版native Connection/Gateway做四组定向执行：UI成功时自身operation未abort，首结果消费仍可先cancel；后续close会abort保留的UI operation，但流dispose/remove后未新增cancel，reopen也不重启登录。Windows仅补这条因果链的现场缺口，不把本机夹具或r3无残留写成已修。

## Job证据边界与停止条件

特定Job成员列表的正确接口是QueryInformationJobObject的JobObjectBasicProcessIdList；它返回该Job及子Job中的进程ID。Microsoft文档见[结构说明](https://learn.microsoft.com/en-us/windows/win32/api/winnt/ns-winnt-jobobject_basic_process_id_list)和[查询接口](https://learn.microsoft.com/en-us/windows/win32/api/jobapi2/nf-jobapi2-queryinformationjobobject)。

当前固定runner只有内部Job句柄与isJobEmpty路径，未向外部暴露已核验的成员只读接口。外部IsProcessInJob(NULL)、PPID或同次采样消失都不能识别其Job。**本方案不复制/长期持有Job句柄，不启用新的调试服务，不向Host/runner注入代码，不改Job策略，不成功后强杀Job，不修改浏览器。** 若无现成且已核验的只读成员来源，成员/terminate调用归因继续UNKNOWN/BLOCKED，不编造脚本把它包装成PASS。

若W-LIFE只能确认carrier和cancel，报告就仅关闭这些证据子项。进一步Job诊断若需要修改运行时或启用调试入口，应先形成独立、最小、可回滚的具体方案再由用户决定；本草案不自动扩大授权。没有复现runner残留也不重试到“碰巧复现”，更不重跑已通过的登录矩阵。

## 回传

逐项使用PASS/FAIL/BLOCKED/NOT_RUN，列候选/Host完整身份、UTC时间与采样精度、Windows原报告及清单的完整SHA256、截图/小型脱敏时间线、未确认原因、恢复与owned退出结果。原始日志和私有文件仍留Windows本机；不推送、不跑CI、不上传凭据。当前未执行任何Windows新增项。
