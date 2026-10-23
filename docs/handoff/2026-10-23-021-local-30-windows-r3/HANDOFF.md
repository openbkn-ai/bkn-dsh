# Windows -30 r3 固定交接

本次为用户明确授权的独立产物分支 `handoff/windows-local30-r3-20261023`。执行前核对主会话给出的完整提交；不要跟随其他分支或任意 tip。只用原 `-30`，不采用、合入或修改另一路 `-11`。不含开发源码或工作流。本轮范围由根 README / WINDOWS-TASK 和本目录 FOLLOWUP 决定，不重跑旧完整矩阵。

相对冻结 r2 `96f8f7656103e8e066a12ea8d9d05d5e7dd96339`，执行输入仅修改官方 argv 回归的一行 JSON 数组求值，并新增本地兼容性夹具。Desktop helper、插件、SDK、Host pins 和其余执行脚本保持原字节。A/B 原 helper 初始化与正常启动按已收到的 r2 Windows 报告通过，原官方 argv 回归 fail 保留。

固定插件 `0.2.0-rc.2-openbkn.0.2.0-30`：231075 字节、82 文件，SHA256 `6d95ff7517dbe409875fd398784fe01049ba26d2b97c43fad65c817d3ea18ee9`。helper SHA256 `0e3466f3da61bd2cac8f263c03573ad03206dea7cf20ac58d8f94e433b4943a7`。SDK 为官方 `@openbkn/bkn-sdk@0.2.0`，按 sdk-manifest 注册表 integrity 核对。公开 CA 不含私钥。KIT-FILES 覆盖 26 项输入；结果一律写到 kit 外。

系统任务 Node 固定 24.19.0，仅进程级 PATH；Desktop 内置 Electron/Node 按实际记录，不替换。旧 Desktop 0.2.0-rc.2 / commit639ed015397290b3745d163aafe02ffee4aa3f84 / Cordis4.0.4 / Schemastery3.18.4；新 Desktop 0.2.1-rc.2 / commit687f282e8625c6b8d11ff58211a90524be2e4317 / Cordis4.0.5 / Schemastery3.18.5。插件 Zod4.4.3；Host 自带 Zod 按其自身声明，不覆盖官方依赖。不得以同版本号替代同物理框架包证明。

先只执行 P1：系统 PowerShell5.1 官方 argv 回归一次；脚本内部覆盖初始化参数和正常参数，不启动 Host、浏览器或 CLI。兼容性夹具是 Mac/PS7 合同模拟工具，不能替代原生 Windows 回归。失败保留原件，停止依赖 P2，不修改冻结脚本绕过。

只有 P1 通过，且用户已确认日常 Chrome 窗口打开及窗口/进程身份后，才选择一个已有隔离 Desktop 做 P2 单次正常登录取证。优先复用 A 的已验证任务环境，实际可用性决定；不重装、不跑 InitializeOnly，不复跑 A/B 启动矩阵、完整 UI 或 B1。为这一次取证启动所选 Desktop 是 P2 必要准备，不转记为新一轮启动验收。环境不匹配时报告 blocked，不自动扩大安装或复验。

保持正式 `https://192.168.50.129` / OpenBKN0.2.0，不替换、不升级、不部署安全补丁/EE。保留业务数据、配置、个人安装、旧运行目录、失败和凭据引用。P1 不访问平台；P2 仅正常登录/插件列网所需访问，不发模型、Sandbox、Function、run_code、BOM/CSV 或业务回合。历史 B1/G6/销售/安全/低权限/CE非空等门槛不因本轮关闭。

不改系统 PATH、默认浏览器、证书信任或既存例外；不触碰其他会话 Chrome、-11 或 .playwright-mcp。只读窗口/进程元数据不等于 Job 成员证明。不要读取完整命令行、环境、标签页、账户或设备登录秘密。不要强杀 Job、个人浏览器，或复制/持有 Job 句柄改变生命周期。拿不到可靠成员/顺序证据就写未知。

只收态本轮拥有的进程，优先应用菜单正常退出；不停止既存日常 Chrome。结果和私有日志保留 Windows 本机；按 RESULTS-TEMPLATE 回传脱敏报告主要内容、绝对路径和完整 SHA256。不要推送结果、不跑 CI、不开 PR、不打标签、不发布。主会话本次交接推送不延伸为 Windows 结果推送授权。`ciRun=null`、`formalAcceptanceEligible=false`，仍是 local-development-preacceptance。
