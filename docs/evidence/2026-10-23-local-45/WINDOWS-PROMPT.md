请接手 Windows -30 r3 的最小复验并实际执行，按下列顺序推进。先只完成 P1；P1 通过且确认日常 Chrome 已打开后，才在一个 Desktop 上做 P2。需要用户确认窗口或完成真实登录时，说明具体窗口和原因；不能把等待当作确认。

固定输入：
- 仓库：https://github.com/openbkn-ai/bkn-dsh.git
- 唯一分支：handoff/windows-local30-r3-20261023
- 唯一完整提交：fac4db78a1a974192fa13fdbe62063331cf04ec1
- kit：docs/handoff/2026-10-23-021-local-30-windows-r3
- KIT-FILES.json SHA256：7daaca61691706ef476ce007eb4c49e8a8f538a30dc73764fea6f6a4281308d0
- test-desktop-launcher-argv.ps1 SHA256：0a2ff6b813ac5364738e9db712a796c4aceb81f64cf2127085aeba5e420dcafd
- start-owned-desktop.ps1 SHA256：0e3466f3da61bd2cac8f263c03573ad03206dea7cf20ac58d8f94e433b4943a7
- 唯一插件：0.2.0-rc.2-openbkn.0.2.0-30；231075 字节、82 文件；tgz SHA256：6d95ff7517dbe409875fd398784fe01049ba26d2b97c43fad65c817d3ea18ee9

只用这个 -30，不采用、合入或修改远端 -11，不使用其他分支 tip。r3 相对 r2 只修官方 argv 回归的一行 JSON 数组求值，并新增兼容性夹具和交接说明；生产插件、helper、SDK、Host pins 不变，不重建或换包。

保持正式 OpenBKN0.2.0 不替换、不升级、不部署安全回补或 EE。唯一平台 https://192.168.50.129，保留数据配置、个人应用、全局环境、旧运行目录和原始失败。不推送任何结果，不跑 CI，不开 PR、不打标签、不发布。原始日志/凭据仅留 Windows 本机。不得修改冻结 kit/校验器或重算清单绕过失败。

一、取件与 P1：仅官方 argv 回归

新建独占 checkout 和 kit 外 evidence/results 目录，不覆盖已有目录。先复用核对过的任务 Node24.19.0，只在本 PowerShell 进程调整 PATH，不改全局 Node。不要为 P1 启动或检查 Desktop、浏览器登录或平台。

可在专用 PowerShell 窗口执行以下取件和门槛命令；如果 Node 不是24.19.0，先定位已有任务版并仅在当前进程切换，不用全局新版代替：

```powershell
$ErrorActionPreference='Stop'
$taskStamp=(Get-Date -Format 'yyyyMMdd-HHmmss')+'-'+([guid]::NewGuid().ToString('N').Substring(0,6))
$taskRoot=Join-Path 'C:\bkn-verify' ('021-local30-r3-'+$taskStamp)
if(Test-Path $taskRoot){throw 'Task root already exists'}
New-Item -ItemType Directory $taskRoot | Out-Null
$taskSource=Join-Path $taskRoot 'source'
$taskEvidence=Join-Path $taskRoot 'evidence'
New-Item -ItemType Directory $taskEvidence | Out-Null
git -c core.autocrlf=false clone --single-branch --branch handoff/windows-local30-r3-20261023 https://github.com/openbkn-ai/bkn-dsh.git $taskSource
if($LASTEXITCODE -ne 0){throw 'Clone failed'}
$taskHead=(git -C $taskSource rev-parse HEAD).Trim()
if($LASTEXITCODE -ne 0 -or $taskHead -ne 'fac4db78a1a974192fa13fdbe62063331cf04ec1'){throw 'Commit mismatch; stop'}
$taskKit=Join-Path $taskSource 'docs\handoff\2026-10-23-021-local-30-windows-r3'
$taskHashes=@{
 'KIT-FILES.json'='7daaca61691706ef476ce007eb4c49e8a8f538a30dc73764fea6f6a4281308d0'
 'test-desktop-launcher-argv.ps1'='0a2ff6b813ac5364738e9db712a796c4aceb81f64cf2127085aeba5e420dcafd'
 'start-owned-desktop.ps1'='0e3466f3da61bd2cac8f263c03573ad03206dea7cf20ac58d8f94e433b4943a7'
 'candidate\openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-30.tgz'='6d95ff7517dbe409875fd398784fe01049ba26d2b97c43fad65c817d3ea18ee9'
}
foreach($taskItem in $taskHashes.GetEnumerator()){
 if((Get-FileHash (Join-Path $taskKit $taskItem.Key) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $taskItem.Value){throw ('Input mismatch: '+$taskItem.Key)}
}
$taskNode=(Get-Command node.exe).Source
if((& $taskNode --version) -ne 'v24.19.0'){throw 'Use task Node24.19.0 in this process only'}
& $taskNode (Join-Path $taskKit 'verify-kit.mjs')
if($LASTEXITCODE -ne 0){throw 'Kit/candidate/SDK verification failed'}
```

读根 README.md、AGENTS.md、WINDOWS-TASK.md 和 r3 的 FOLLOWUP.md/RESULTS-TEMPLATE.md。再使用系统 powershell.exe 执行一次未经修改的官方回归，并保存完整 stdout/stderr、退出码和实际 PowerShell 版本：

```powershell
powershell.exe -NoLogo -NoProfile -File (Join-Path $taskKit 'test-desktop-launcher-argv.ps1') -Launcher (Join-Path $taskKit 'start-owned-desktop.ps1') -NodeExe $taskNode
if($LASTEXITCODE -ne 0){throw 'Official argv regression failed; stop dependent P2'}
```

验收输出应为 PowerShell5.1、两分支 nativeArgvMatched=true，argumentElements 分别为6和10，hostStarted=false、platformAccessed=false。这里的 initializeOnly 字段只描述 argv 分支，绝不执行 Desktop InitializeOnly。只调用这一次脚本，不重跑 A/B 启动、UI 或 B1。兼容性夹具 test-desktop-launcher-json-array.ps1 只是 Mac/PS7 输出合同模拟，不能替代 Windows 官方脚本。P1 失败保留原错和冻结输入，停止 P2，先回传；不能私改副本后算官方通过。

二、P2 前提：P1 通过，用户确认日常 Chrome 已打开

先请用户从平常入口打开或确认自己的日常 Chrome 可见窗口，再确认该窗口对应的 PID、UTC 创建时间、exe 及必要父链元数据。不要读取标签页、账户、浏览器配置、完整命令行或环境。窗口可能复用已有 Chrome 根，不能要求必须出现新根；单独看到 Chrome 根、默认快捷方式或 inAnyJob 都不足以确认日常实例。

此前 PID54508 被误认为日常 Chrome 的判断已撤回，不沿用。不得触碰另一个会话的 Chrome、-11 页面或 .playwright-mcp；无法可靠区分则 P2 BLOCKED，交付 P1 结果，不通过关闭其他浏览器造条件。

三、P2：只选一个 Desktop，单次正常成功登录取证

优先选 A（旧 Desktop0.2.0-rc.2），若 B（新 Desktop0.2.1-rc.2）更易安全复用已验证任务环境，可选 B 并说明理由；只做一个，不追加 C/D。

复用上一轮核对过的隔离官方解压应用、实际 -30 profile 和独立 CLI 配置。先做必要身份/摘要检查，保留原配置和凭据引用，不用个人全局 CLI、不复制个人 token，不重装、不改依赖/profile、不跑 InitializeOnly。条件不足就 blocked。所选 Host/框架 pins 见 kit；A 为639ed015/Cordis4.0.4/Schemastery3.18.4，B 为687f282e/4.0.5/3.18.5，保持同物理框架包；不替换官方内置 Electron/Node/Zod。

按本次原 start-owned-desktop.ps1 传入所选已有 ApplicationExe、DshHome、CliConfig、HostVersion 和新 Evidence；不带 InitializeOnly 或 ReadOnlyProtocol。这一次启动只是单次登录取证准备，不重跑/重新计分 A/B 启动验收。不得使用私有补丁 launcher。

在确认日常 Chrome 窗口仍开着后，只做一次插件面板正常成功登录。不要故意重测取消/超时、目录/UI/B1或业务题。真实超时则保留原件；必要重试说明原因。P2 平台访问仅 auth/列网所需范围，不发模型、Sandbox、Function、run_code、BOM/CSV、G6 或普通查询夹具。浏览器信任有问题就 blocked，不越过警告、不导入 CA 或改既存例外。

采集登录前、登录中、直接 cmd/CLI 退出后约60–80秒，以及 Host 菜单正常退出后的只读时间线：
- 所选 Host/后端/runner/cmd/CLI 的 PID、PPID、UTC 创建时间、进程名、exe 和已知任务监听；
- 已确认的日常 Chrome 窗口/根是否继续存活，是否出现独立登录新树及何时关闭；
- 采样方法/频率、短命进程覆盖、PID 复用及时间精度限制。

复用现成且经核验的安全元数据采样，不安装/提权、不向 Host 注入，不复制/持有 Job 句柄改变生命周期，不保存完整命令行、环境、设备 URL/code 或 token。IsProcessInJob(NULL)只说明在某个 Job；PPID 图不证明同 Job/成员。拿不到可靠只读 Job 证据就写未知；同次采样消失不能强行判先后或 Job 强杀。

保留两轮原观察：r1 -30 成功登录后 runner 残留到 Host 退出；r2 A/B 在60–80秒内未残留，但登录新 Chrome 树与 runner 在同次约370ms采样消失。本次无残留也不能写成“runner 已修复”。客户端首结果 return/dispose 与 stream cancel 是候选机制；本机受控函数夹具没有跑真实 Remote/Windows Job/浏览器，不能据此归因。生产插件/SDK/Host 本轮都不修改。

通过菜单正常退出所选 Desktop，核对本轮 owned PID/创建时间/exe、监听和日志收态，并确认原日常 Chrome 窗口/根仍在。不要按名称批量杀、强杀 Job 或个人浏览器。仍残留时先留证，无法安全收态就报告阻碍；仅恢复本轮实际变更，保留新登录配置/会话、旧目录与原始失败。不追加第二个 Desktop、npm 对照、RDP/长时、证书信任、慢读取消、UI、B1 或业务复验。

四、回传

按结果模板将 P1 与 P2 分开给 PASS/FAIL/BLOCKED/NOT_RUN。给出完整 commit、KIT/argv/helper/tgz SHA、实际系统 PowerShell/任务 Node/所选 Desktop 版本、原始错误、观察事实、推断与未知、配置/进程收态。A/B 原 helper 启动沿用 r2 Windows 报告，原 r2 官方回归 FAIL 不改写，旧 UI/B1 不记本次重跑。未做平台全量数据前后核对时，不声称已证明所有业务数据未变。

在 kit 外生成脱敏 RESULTS 和证据清单；回传报告主要内容、报告绝对路径及完整 SHA256、关键证据绝对路径及完整 SHA256、受阻项。秘密扫描后再回传，原始日志/凭据仍只在 Windows。不推送结果、不跑 CI、不创建 PR/标签/发布。

本轮 local-development-preacceptance，ciRun=null，formalAcceptanceEligible=false；完整 G6、安全/低权限、CE 非空、历史销售及最终固定 CI 等门槛继续开放。
