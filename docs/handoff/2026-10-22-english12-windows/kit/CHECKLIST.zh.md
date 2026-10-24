# -12 Windows 原生复核清单

本轮对象是 **CI build-only 候选 -12**，从已发布 -11 修复而来，尚未发布 npm。精确源码、CI run、tgz 摘要及宿主完整性以同目录 `pins.json` 为准。固定官方 DSH **0.2.0-rc.2**（Desktop 和独立 npm/Web）、OpenBKN **0.2.0**、`@openbkn/bkn-sdk@0.2.0`。Node 使用 22.19+ 的 22.x 或 24+，不使用 23。最新可用 DSH 0.2.1-rc.2 不在本轮范围内。

本轮修复：关闭浮层保留表单/搜索/展开状态；待完成的单次 CLI 登录在关闭后继续同步；诊断保留原报告；同一回合溯源保留页签与选择；中文溯源引用标签和英文 URL 空格。未加入其他开发分支的新登录状态机、CSV、原生溯源或 0.2.1 适配。

**验收全过程及验收结束后均不执行 npm publish、dist-tag、生产 v* tag、平台部署或宿主补丁。预期 rc=-11、latest=-10。即使本轮全 PASS，也只回传结果，交维护者独立复核。** 保留 -11 的原始失败包和旧 profile，不覆盖它们。

## 1. 环境与包检查

在原生 Windows 测试环境下载 ZIP 和同名 `.sha256`，先用 `Get-FileHash -Algorithm SHA256` 核对外部公布的 ZIP 摘要再解压。在解压后的 `windows-english12-acceptance-v1` 中运行命令；所有 TestRoot、截图、下载和回传文件放在包目录外，包目录须保持只读。

```powershell
node --version
node .\verify.mjs kit .
npm.cmd view @openbkn/dsh-business-context dist-tags --json --registry https://registry.npmjs.org
```

记录 Windows、PowerShell、Node、宿主、浏览器及账号授权范围。脚本是适配 PS5.1 解码的 ASCII 源码，回执写无 BOM UTF-8。若被执行策略阻止，读过脚本后仅使用当前进程的执行策略，不修改持久策略。

已安装的官方 Desktop 0.2.0-rc.2 可以继续使用，记录 About 与文件身份；不要重装、启动或覆盖个人其他版本。未安装时使用独立测试机，并由用户安装官方包：

```powershell
.\Get-DesktopInstaller.ps1 -DownloadDirectory C:\bkn-verify\english12-downloads
```

下载脚本验证固定官方 URL 的完整 SHA-256 和 Authenticode，不自动安装。签名、签名者或摘要异常即保留原文件并报告。不要自动升级宿主。

沿用可达的 OpenBKN 0.2.0 平台。CLI 可使用已有精确 0.2.0，或固定安装到专用目录：

```powershell
npm.cmd install --prefix C:\bkn-verify\english12-cli --save-exact --registry https://registry.npmjs.org @openbkn/bkn-sdk@0.2.0
& 'C:\bkn-verify\english12-cli\node_modules\.bin\openbkn.cmd' --version
```

面板高级设置填写该 openbkn.cmd 绝对路径。每个形态在自己的 BKN_CONFIG_DIR 正常登录；不复制另一形态的凭据。LAN 自签 CA 通过已核实的 `NODE_EXTRA_CA_CERTS` 传给启动终端，保留 TLS 校验。记录平台服务镜像（无权限就明确未知）和实时 tools/list **含 schema** 与 reference 契约的差异；25 工具、18 受管是基线，不是仅凭名称判定兼容的依据。用户自行完成设备授权。

## 2. Desktop 启动

先完全退出同一安装的应用和托盘。替换为实际官方 0.2.0-rc.2 安装位置，不启动个人其他版本。

```powershell
$English12DesktopApp = Join-Path $env:LOCALAPPDATA 'Programs\DeepSeek Harness\DeepSeek Harness.exe'
.\Prepare.ps1 -Step Init -Form desktop -TestRoot C:\bkn-verify\english12-desktop -DesktopApp $English12DesktopApp
.\Start-Host.ps1 -TestRoot C:\bkn-verify\english12-desktop -BootstrapDesktop
```

等真实应用初始化 desktop profile，核对 About 后从菜单完全退出，再运行：

```powershell
.\Prepare.ps1 -Step Install -Form desktop -TestRoot C:\bkn-verify\english12-desktop
.\Start-Host.ps1 -TestRoot C:\bkn-verify\english12-desktop
.\Collect-Receipt.ps1 -TestRoot C:\bkn-verify\english12-desktop -Phase before-locale
```

脚本设置独立 DSH_HOME、BKN_CONFIG_DIR 和 Electron user-data-dir，CLI 来自同一 Desktop 安装。安装回执检查候选全部文件，不能代替实际界面检查。Desktop 模态浮层阻止访问宿主设置是宿主现状；本轮**关闭插件 → 宿主切语言 → 重开同一界面**，验证状态保留。另做一次不切语言的关闭重开对照。会话内建议条和溯源入口无需关闭，仍应即时更新。

## 3. npm/Web 启动

不使用 Desktop CLI 或全局 dsh 代替独立 npm 宿主：

```powershell
.\Prepare.ps1 -Step Init -Form npm -TestRoot C:\bkn-verify\english12-npm -Port 18411
npm.cmd install --prefix C:\bkn-verify\english12-npm\tools --save-exact --registry https://registry.npmjs.org @deepseek-ai/dsh@0.2.0-rc.2
.\Prepare.ps1 -Step Install -Form npm -TestRoot C:\bkn-verify\english12-npm
.\Start-PrivateWebConsole.ps1 -TestRoot C:\bkn-verify\english12-npm
```

推荐用 Start-PrivateWebConsole 在另一个可见的私有 PowerShell 窗口启动，当前自动化工具只收到该控制台 PID。操作者在本机从这个窗口打开启动 URL，**自动化不要读取、截屏或采集这个私有窗口**。如果执行策略阻止子窗口运行脚本，在该窗口读过脚本后仅处理当前进程策略，不更改持久或组织策略。

启动终端不要使用 Start-Transcript、Tee-Object、重定向或录屏。新窗口中的 Start-Host.ps1 直接前台调用官方 dsh.cmd，启动 URL 中有本地 token，仅本地打开，不写入报告/聊天。另开 PowerShell 到包目录：

```powershell
.\Collect-Receipt.ps1 -TestRoot C:\bkn-verify\english12-npm -Phase before-locale
```

同一 profile 开两个客户端：A 保持插件界面，B 通过宿主「Settings → General → Language」切换；A 必须原地更新。另测 A 关闭重开。只通过宿主语言设置切换，不改浏览器/OS 语言或底层 locale 数据。

## 4. 两种形态分别记录 E00–E10

| 项 | 复核步骤和判据 |
| --- | --- |
| E00 | 核对官方宿主、profile、候选 tgz SHA、所有安装文件及进程回执。Desktop 是真实原生应用；npm 是专用 tools 安装。保留 npm tools/package-lock.json 和 About 截图。 |
| E01 | 中文→English→中文。Desktop 按“关闭→切语言→重开”，会话建议条/溯源按钮同时检查；Web A 保持打开、B 切宿主。区分两个流程的结果，不写 Desktop 开着模态时切换成功。 |
| E02 | 先保存合法平台配置、从目录进入设置，再在设置表单输入未保存 URL `https://unsaved.invalid` 和 CLI 路径，展开高级设置；按各形态流程切换后值/展开状态保留。输入 `not-a-url` 保存触发本地校验，关闭重开及切语言后原错误仍在且翻译更新。不得保存无效地址；结束点“返回网络目录 / Back to networks”，应不保存草稿即可回目录。另验证保存合法配置可正常继续。首次尚未配置时必须先完成配置，返回按钮不会绕过此先决条件。 |
| E03 | 已登录目录中输入搜索词，展开一条网络。切换/重开后搜索、展开和命中数保留；原始网络名/ID/描述不翻译。点新增的 Refresh status 可主动重新读取，切语言本身不读目录。 |
| E04 | 记录诊断 reportId、createdAt、状态/计数。关闭切语言重开后仍为同一报告，说明和按钮翻译。显式“重新采集 / Collect again”才生成新报告；导出原始 JSON，原始错误和事实保留。当前界面没有条目展开控件，不要求不存在的操作。 |
| E05 | 在独立未登录配置中点击一次 CLI 登录。待用户授权时先关闭重开：仍显示连接中；再次关闭、切宿主语言、重开仍是同一请求。用户正常授权，自动到目录，无需 Refresh status、无重复授权页。另一次在面板保持关闭时完成授权：不得自动弹出；手动重开直接看到结果。失败/过期原样保存，不能用已登录状态替代。 |
| E06 | 真实完成回合的执行溯源，记录 Interaction ID、顺序、平台引用和状态。切语言/关闭重开同一回合，ID和状态不变，中文引用标签为交互 ID/请求/追踪/回执/操作/状态；英文对应原标签。`tool · N 项` 仅在真实数据产生时检查，否则单列 BLOCKED。当前无时间线展开控件。 |
| E07 | 同一真实回合打开业务上下文图/证据链。切语言及关闭重开保留当前页签；有非空图时选择第二节点并检查选择保留。零节点、无回执或降级须如实记录，对缺少数据的子项标 BLOCKED；没有缩放/证据展开控件就不要求这些操作。不得用 fixture 或改平台数据冒充真实证据。 |
| E08 | 反向切回中文，复查表单错误、搜索、诊断、三个页签和引用标签。记录视口/缩放，检查截断/重叠/乱码；原始英文工具名、平台状态值、ID和业务内容保留原样是预期。英文登录提示应有 `Platform URL: https://...` 空格。 |
| E09 | 宿主保存 English，完全退出后冷启动，同一 profile 第一次打开插件即英文；再保存中文重复。两次分别采集 restart-en / restart-zh 回执及首屏，不得在同一次启动里补造两个回执。冷启动不要求保留上次进程的未保存状态。 |
| E10 | 正常配置、CLI/MCP、目录、绑定网络、标准模式的一条只读业务问题及真实完成溯源。记录问题、模型原答、Interaction ID与平台结果；不重写模型回答，不宣称完整 G6 准确性。复用该回合给 E06/E07，避免重复查询。 |

发起 E05 前，先确认用户已在 Chrome 登录平台且能及时确认设备授权；不要在设备码等待期间做长时间对照。超时原样保留。两个时序分别使用该形态的两个全新 TestRoot（例如 english12-desktop 与 english12-desktop-closed、english12-npm 与 english12-npm-closed）。先退出第一个 Host，再按相同步骤初始化/安装第二个；npm 第二 root 用另一个空闲端口，例如 18413。不清空、覆盖或复制第一 root 的凭据。第二 root 的 Host/package、进程与清理回执放在回传目录的独立子目录并列入 additionalEvidence。

E05 有两个授权时序，均须实际观察；时间不足就如实标部分/未测。始终保留一个登录进程，不通过反复点登录构造结果。登录期间与完成后执行安全进程快照，排查上次未退出 runner（只记录 PID/父 PID/路径/创建时间，不录命令行）：

```powershell
# form/root 与实际当前 HostReceipt 对应，先在登录待完成时采集 Host 回执
.\Collect-Receipt.ps1 -TestRoot C:\bkn-verify\english12-desktop -Phase login-pending
.\Snapshot-Processes.ps1 -TestRoot C:\bkn-verify\english12-desktop -Phase login-pending -HostReceipt C:\bkn-verify\english12-desktop\evidence\login-pending-host.json
# 授权后再采集；npm 使用自己的 root/receipt
.\Snapshot-Processes.ps1 -TestRoot C:\bkn-verify\english12-desktop -Phase login-completed -HostReceipt C:\bkn-verify\english12-desktop\evidence\login-pending-host.json
```

上次局部 error 与平台 completed 的差异未有完整原因。本轮若复现，只导出出错工具名、经过脱敏的结构化错误 code/message/HTTP status、是否实际 dispatch、相邻请求 ID/时间与对应平台 operation；区分本地 guard 拒绝/结构校验/平台失败。不能凭 completed 覆盖本地 error，不能凭单个 error 判整回合业务失败。不要回传 session 全文、请求授权头或 token。

切语言的“无新增插件请求”需要明确边界：记录切换前 WebSocket 请求序号/时间和切换后序号；只回传消息 ID、方法名、时间，不含授权字段或业务敏感参数。累计日志中以前的 plugin RPC 不能算切换新增。Desktop 关闭/重开和显式 Refresh 的请求与纯语言设置分开统计。

## 5. 重启与清理

在各次冷启动和收尾分别运行对应形态的 Collect-Receipt，Phase 不覆盖原件：

```powershell
.\Collect-Receipt.ps1 -TestRoot C:\bkn-verify\english12-desktop -Phase restart-en
.\Collect-Receipt.ps1 -TestRoot C:\bkn-verify\english12-desktop -Phase restart-zh
.\Collect-Receipt.ps1 -TestRoot C:\bkn-verify\english12-desktop -Phase after-locale
```

npm 使用 english12-npm。重启先尝试正常退出 / Ctrl+C，记录是否成功；若 Web 仍不响应，可在第二终端使用本轮新鲜回执：

```powershell
.\Stop-Host.ps1 -TestRoot C:\bkn-verify\english12-npm -HostReceipt C:\bkn-verify\english12-npm\evidence\after-locale-host.json
```

若无 Tee 的直接启动仍不响应 Ctrl+C，另建全新、独立的 npm 控制 root，仅安装同版本官方宿主、不装插件，用单独端口直接启动 CLI 并重复；记录启动包装方式与进程树，不据此直接归因插件或宿主，更不能启动个人实例。控制实例也要留下停止/端口清理证据。

Host 停止后，按 private-console 回执的 PID/创建时间核对并关闭本次私有控制台；不要关闭个人其他 PowerShell 窗口。

Stop 仅按同 root 的 PID、可执行路径、创建时间核对后结束该测试树，并检查已捕获子进程和 18411 监听；PID 复用或身份不符即拒绝。Desktop 优先应用菜单退出，必要时也仅对其当前回执使用 Stop。若已正常退出，仍可运行 Stop 生成清理回执；它会结合本 root 的历史进程快照检查残留，不会自动结束已脱离宿主的 orphan。另保留独立的进程/监听快照；保留进程清单中的安全字段，不读取或删个人配置/崩溃日志，不使用 kill-all-node。仍残留的 runner 记录为未解决异常，不扩大匹配杀进程。

## 6. 回传

包目录外新建 `C:\bkn-verify\english12-return`，从 RESULTS.template.json 复制 RESULTS.json。填写真实操作者/日期、平台/CLI身份、E00–E10 的 PASS/FAIL/BLOCKED/NOT_RUN、每个子项的实际观察和证据相对路径。E06/E07 部分子项缺数据则整项 BLOCKED，并在 notes 写清已通过部分，不能整体 PASS。`manualConfirmed` 仅由实际人工看过证据的操作者据实填写；维护者另行审阅。

每种形态分别放 desktop/、npm/，包含 before/after-locale 和两次冷启动 Host/package 回执、截图/录屏、诊断、登录前后进程快照、清理结果和脱敏最小异常。`cleanupReceipt` 填该形态实际清理 JSON 的相对路径（保留原时间戳文件名亦可），`additionalEvidence` 引用额外回执和进程文件；anomalies 保留每个异常的 evidence 引用与原状。截图必须隐去本地访问 token/设备授权 URL/凭据，保留本机原件，并说明打码字段。

禁止回传整个 TestRoot、private、DSH_HOME、bkn-config、Electron 用户目录、cookies、session 全文、任何凭据或授权 URL。不得改写 -11 原始包，不得为让检查器通过改真实状态。

```powershell
node .\Review-Results.mjs C:\bkn-verify\english12-return\RESULTS.json
npm.cmd view @openbkn/dsh-business-context dist-tags --json --registry https://registry.npmjs.org
```

新检查器即使人工确认未完成或有 FAIL/BLOCKED，仍完整遍历两形态所有回执和引用，分别输出 structuralChecksPassed 与 acceptanceReady。退出 1 可以是预期的未通过验收，应保留完整输出，无需改临时报告做 dry-run。结构通过不代表截图真实性或验收通过。

将回传目录打 ZIP，报告下载/共享路径、SHA-256、文件总数、两形态结果矩阵、异常、清理结果，以及验收前后 rc/latest。**到回传为止，不发布 npm、不改任何 dist-tag。**
