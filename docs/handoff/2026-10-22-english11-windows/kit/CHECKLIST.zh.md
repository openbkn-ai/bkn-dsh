# -11 Windows 验收操作清单

状态：**待 Windows 原生执行**。此包准备于 2026-10-22（Asia/Taipei）。脚本检查、macOS 结果及历史 Windows 结果都不能填成这次的 Windows 通过。

## 1. 本轮固定对象

| 对象 | 固定值 |
| --- | --- |
| 插件 | `@openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-11` |
| 插件发布 tag / 源码 | `v0.2.0-rc.2-openbkn.0.2.0-11` / `a767c6b3d9b6c383e8c8f7f71bac7d934d1993b0` |
| 发布 tgz SHA-256 | `ed29647e30a7e7c91d22217fdd810e0d3a1e7f49ca4a1274c5b4486f7b206f60` |
| DSH | 官方 **0.2.0-rc.2**；Desktop 与 npm/Web 分别验收 |
| Node | `22.19+`（22.x）或 `24+`；不使用 Node 23 |
| 业务平台 / CLI | OpenBKN **0.2.0** / `@openbkn/bkn-sdk@0.2.0` |

本版只新增客户端英文国际化。保留 -10 登录、治理和三个溯源页签；不含开发分支的新版登录进度、原生溯源、CSV 或 DSH 0.2.1 兼容。不要拿同名的历史开发候选 -11 或 -29 代替本包。

截至准备时：DSH 最新可用为 `dsh-v0.2.1-rc.2`，OpenBKN 最新正式版为 `v0.2.0`；这里仍锁定上述旧宿主。npm `rc=-11`，`latest=-10`。本包不执行 `npm publish`、`dist-tag`、宿主补丁或平台部署。

## 2. 环境与完整性

使用指定的原生 Windows 测试机或虚拟机，建议 x64、Windows PowerShell 5.1 或 PowerShell 7。记录实际 Windows、PowerShell、Node、浏览器和宿主版本。不要覆盖个人现有 DSH 安装；若机器已安装 0.2.1，使用独立测试环境安装 0.2.0-rc.2。Desktop 安装仍是普通官方安装器的人工操作。

1. 从本 release 下载 `windows-english11-acceptance-v1.zip` 和同名 `.sha256`，用 `Get-FileHash -Algorithm SHA256` 与单独公布的 zip 摘要核对，然后解压。
2. 以下命令均在解压出的 `windows-english11-acceptance-v1` 目录执行；**工作根目录放在包目录外**。不要在包内保存下载文件、截图或结果，否则完整文件集检查会拒绝。
3. 检查 `node --version`，再执行：

```powershell
node .\verify.mjs kit .
```

每个辅助脚本也会重复检查包完整性。PowerShell 脚本是 ASCII 源码，配置与回执写入无 BOM UTF-8。若本机执行策略阻止脚本，先阅读脚本，再仅对当前 PowerShell 进程执行 `Set-ExecutionPolicy -Scope Process Bypass`；不修改机器或用户持久策略。

尚未安装 Desktop 0.2.0-rc.2 时，可先下载固定官方安装器：

```powershell
.\Get-DesktopInstaller.ps1 -DownloadDirectory C:\bkn-verify\english11-downloads
```

脚本验证固定 URL 的完整字节摘要和 Windows Authenticode，**不执行安装器**。安装器摘要是从官方 HTTPS 下载完整文件后观测的值，并非归档厂商 feed 的签名摘要；如果签名不是 `Valid`、签名者异常、摘要变化或文件下载失败，保留原始文件/回执，停止该步骤并调查。人工安装后在 About 中确认版本，不启动自动更新。

OpenBKN 使用测试账号和可达的 0.2.0 平台，具备至少一个知识网络、一个真实完成回合与溯源数据。记录平台相关服务镜像 tag/版本、CLI `--version` 以及支持团队提供的实时 MCP 工具目录核对结果；沿用现有平台，不升级或迁移。当前发布记录的 25 个工具及 18 个受管工具见附带 `reference/english11-release-verification.json`。如平台契约已变，先报告差异，不能把环境问题解释为语言验收通过。

使用已有 CLI，或固定安装到专用目录：

```powershell
npm.cmd install --prefix C:\bkn-verify\english11-cli --save-exact --registry https://registry.npmjs.org @openbkn/bkn-sdk@0.2.0
& 'C:\bkn-verify\english11-cli\node_modules\.bin\openbkn.cmd' --version
```

面板高级设置填写其 `openbkn.cmd` 绝对路径，再从当前形态的面板完成正常登录。仅在需要时使用已核实的组织 CA，通过 `NODE_EXTRA_CA_CERTS` 传给启动宿主的 PowerShell；保留 TLS 校验。用户自行完成登录，不回传密码、Token、浏览器授权 URL 或凭据文件。

## 3. Desktop：必须启动真实应用

先从应用菜单完全退出 DSH（包括后台/托盘实例）。将路径替换为实际安装位置；常见位置是 `%LOCALAPPDATA%\Programs\DeepSeek Harness\DeepSeek Harness.exe` 或 `C:\Program Files\DeepSeek Harness\DeepSeek Harness.exe`。脚本从同一安装目录寻找配套 CLI，拒绝版本不符或混用 npm CLI。

```powershell
$English11DesktopApp = Join-Path $env:LOCALAPPDATA 'Programs\DeepSeek Harness\DeepSeek Harness.exe'
.\Prepare.ps1 -Step Init -Form desktop -TestRoot C:\bkn-verify\english11-desktop -DesktopApp $English11DesktopApp
.\Start-Host.ps1 -TestRoot C:\bkn-verify\english11-desktop -BootstrapDesktop
```

首次启动等待官方应用初始化 Desktop profile。确认 About 为 0.2.0-rc.2，然后通过应用菜单**完全退出**，再安装与启动：

```powershell
.\Prepare.ps1 -Step Install -Form desktop -TestRoot C:\bkn-verify\english11-desktop
.\Start-Host.ps1 -TestRoot C:\bkn-verify\english11-desktop
.\Collect-Receipt.ps1 -TestRoot C:\bkn-verify\english11-desktop -Phase before-locale
```

脚本为这次启动设置独立 `DSH_HOME`、`BKN_CONFIG_DIR` 和 Electron `--user-data-dir`；不复制个人配置。Desktop 的系统凭据存储仍按原版宿主实现，本轮不宣称修复或隔离了历史 B1 限制。不要复制另一形态的凭据来制造登录通过。`Prepare` 的安装文件检查通过仅代表这 74 个文件与发布包相符；还必须完成下面的真实界面矩阵。

## 4. npm/Web：使用独立官方 npm CLI

不要用 Desktop 自带 CLI 假扮 npm 形态；不改全局 `dsh`。在另一工作根目录安装精确的官方宿主：

```powershell
.\Prepare.ps1 -Step Init -Form npm -TestRoot C:\bkn-verify\english11-npm -Port 18411
npm.cmd install --prefix C:\bkn-verify\english11-npm\tools --save-exact --registry https://registry.npmjs.org @deepseek-ai/dsh@0.2.0-rc.2
.\Prepare.ps1 -Step Install -Form npm -TestRoot C:\bkn-verify\english11-npm
.\Start-Host.ps1 -TestRoot C:\bkn-verify\english11-npm
```

最后一条命令在当前终端前台运行，正常启动原版 `dsh.cmd web --port 18411 --no-open`；使用它本地输出的授权地址打开浏览器。该地址可能含本地访问 Token，**不要复制进报告或截图**。换一个 PowerShell 窗口到包目录执行：

```powershell
.\Collect-Receipt.ps1 -TestRoot C:\bkn-verify\english11-npm -Phase before-locale
```

Web 使用 `web` profile，与 Desktop 的 `desktop` profile 分别记录。保持启动终端运行；每次重启先在该终端按 `Ctrl+C`，确认端口释放后再次运行 `Start-Host.ps1`。端口已占用时脚本拒绝启动，不结束其他进程。

## 5. 两种形态分别执行 E00–E10

**唯一语言入口是 DSH「设置 → 通用 → 语言 / Settings → General → Language」**。不要改浏览器/操作系统语言、改源码、设置测试全局变量或直接改 locale 配置来替代宿主操作。

Desktop 中保持插件面板打开，再打开宿主设置操作语言；若宿主设置覆盖面板，返回后不得主动刷新插件或重开窗口。npm/Web 建议同一 profile 打开第二个客户端：A 保持插件当前界面，B 打开宿主设置切换语言；录屏同时显示 B 的宿主语言设置和 A 的即时变化。第二客户端仅复用本次测试的本地授权地址，不能指向另一 DSH_HOME 或 profile。

| 编号 | 实际操作与通过条件 | 必须留存的最小证据 |
| --- | --- | --- |
| E00 | 核对真实 Windows、About/CLI 的 DSH 0.2.0-rc.2、当前 form/profile、发布 -11 文件以及启动进程。Desktop 是真实应用；Web 是专用 npm CLI 的真实服务。 | About/版本截图、`before-locale-host.json` 及其引用的 package 回执、安装包摘要；npm `tools/package-lock.json` 可作依赖版本证据，经检查后回传。 |
| E01 | 宿主设为中文，首次打开 OpenBKN；网络、设置、诊断、未配置/登录提示正常。宿主切到 English 后，插件已打开界面的自有文案更新，无需刷新、重新登录或重启。 | 连续录屏或有时间顺序的宿主设置和同一面板截图，含中文、English 两态。 |
| E02 | 设置面板填入但**不保存** `https://unsaved.invalid`，展开高级设置，改一个未保存 CLI 路径；切换语言后输入、展开状态与当前面板保留。再输入 `not-a-url` 点保存触发本地校验，切换语言后错误文案更新且非法地址未保存；最后关闭或恢复真实地址。 | 同一表单前后截图；记录保存结果/错误原文与是否发出额外请求。不要用保存无效平台地址触发新登录。 |
| E03 | 在真实平台网络目录输入搜索词，记录命中条数、网络名称与已有关联；切换语言后搜索词、选择和当前视图保留。计数文案变为 `Networks found: N` 等英文，平台提供的中文网络名/数据保持原文。 | 搜索前后截图及原网络名称、计数和选择记录。 |
| E04 | 打开诊断、展开一个条目，记录状态/计数；中英文切换后标题、说明、操作按钮更新，条目状态及平台原始错误/事实不被翻译或改写。点击 Refresh status / Export diagnostics report 仍正常。 | 两态诊断截图和经敏感信息检查的原始导出 JSON；失败计数、恢复状态均原样保留。 |
| E05 | 在需要登录的真实状态点击 CLI 登录，浏览器授权尚未完成时切换宿主语言；原按钮/登录状态随之更新，授权仍可完成，且未重复弹出授权或清空表单。完成后仍能读取目录。 | 登录待完成与完成后截图/录屏、实际发起次数与观察说明；用户自行操作授权。若无法构造待完成状态，写 BLOCKED，不能用已登录截图替代。 |
| E06 | 在真实完成的同一业务回合打开「执行溯源 / Execution provenance」，展开时间线条目再切换语言。当前页签、展开项、Interaction ID、操作顺序和计数保留；插件生成的 `tool · N 项` 对应变为 `tool · items: N`。 | 同一回合/条目的两态截图；Interaction ID；原始用户问题、平台记录和模型回答不变。 |
| E07 | 在同一回合分别打开「业务上下文图 / Business context graph」「证据链 / Evidence chain」并切换语言。图中选中项、缩放/当前视图与证据展开状态保留；仅插件自有标签/模板改变。 | 两个页签各自的中英文截图；图选择和证据项标识记录。任何降级/403/空白都保留并说明。 |
| E08 | 从 English 切回中文，检查上述已打开面板、错误、搜索、三个页签及动态条数；检查截断、重叠、按钮不可见、乱码或插件自有中文残留。原始中文业务内容是预期，不算残留。 | 反向切换的连续录屏/截图；视口、缩放比例及异常清单。 |
| E09 | 先在宿主保存 English，正常退出并用同一 `Start-Host.ps1` 冷启动，第一次打开插件即为英文；再保存中文、退出、冷启动，第一次打开即为中文。不能靠重开后再手动切语言补救。 | 两次冷启动的宿主语言与插件首屏截图；各自 `restart-en-host.json`、`restart-zh-host.json` 及关联包回执。 |
| E10 | 一次正常的平台配置/CLI/MCP/网络目录检查、网络绑定、标准模式只读业务问题和已完成回合可用溯源。在 English 下按钮可用、中文原始业务数据与模型输出保持原文；保留完成状态和真实平台记录。 | 最小业务记录、Interaction ID、诊断导出、网络绑定/完成回合截图；任何失败与恢复时间线。无需重复整批 G6，也不能用该小样本宣称完整业务准确性。 |

E06/E07 可复用本次 E10 的真实回合，避免重复业务查询。缺少模型配置或平台溯源授权时，对应项记 `BLOCKED`；不要用 fixture、静态截图、手工写入数据、历史 -10/-29 或 macOS 结果代替。切换语言本身不应发起新的登录、目录读取或业务查询；如观察到重复请求，保留触发操作与原始响应并报告，不重写证据。

发生 `sign-in-required` 时记录首次现象和恢复步骤。本版保留 -10 的凭据相关限制；正常 CLI 授权/刷新后恢复也不能抹掉首次失败。新的失败、超时、降级或不能验证的状态都先阻断提升，由维护者审阅是否属于已披露限制。

收尾时每种形态至少执行：

```powershell
# Desktop 的这三条使用 english11-desktop；npm/Web 使用 english11-npm。
# 在对应 Host 正在运行时采集，Phase 不能覆盖已有文件。
.\Collect-Receipt.ps1 -TestRoot C:\bkn-verify\english11-desktop -Phase restart-en
.\Collect-Receipt.ps1 -TestRoot C:\bkn-verify\english11-desktop -Phase restart-zh
.\Collect-Receipt.ps1 -TestRoot C:\bkn-verify\english11-desktop -Phase after-locale
```

这些命令应分别在 E09 的对应语言重启后及全部完成后执行，不能在最后一次启动中连续补采成两个语言证据。回执证明进程/安装文件，语言状态依赖同时的真实截图/录屏。

## 6. 回传与判定

创建包目录外的 `english11-return`，复制 `RESULTS.template.json` 为 `RESULTS.json`，填写操作者、测试时间、平台/CLI/宿主身份，逐项写 `PASS` / `FAIL` / `BLOCKED` / `NOT_RUN` 和证据的相对路径。不得批量把默认值改成通过。两种形态分别放在 `desktop/`、`npm/`，每项至少引用一份实际截图/录屏/原始记录；机器回执是附加身份依据。

每个形态回传 `evidence/` 中的安装包、前后、两次重启回执及其引用的 package JSON；截图以 `E01-zh.png`、`E01-en.png` 等命名，保留时间顺序。将 `RESULTS.json` 中 `hostReceipt` 填为 `desktop/after-locale-host.json` / `npm/after-locale-host.json`，`restartReceipts` 填为两次重启的 JSON；每个形态完成全部人工检查后才设置 `manualConfirmed=true`。

**不要回传**整个 TestRoot、`private/`、`dsh-home/`、`bkn-config/`、Electron 用户目录、cookies、session 全文、启动授权 URL 或凭据。导出诊断与录屏先检查敏感信息；需要打码时保留本机原件，在回传副本注明打码字段和原因，不改动失败事实。

```powershell
node .\Review-Results.mjs C:\bkn-verify\english11-return\RESULTS.json
```

该命令只检查回传结构、版本、文件摘要及证据引用是否齐全，**不会识别截图内容，也不会修改 npm 标签**。即使通过，仍由维护者独立审阅真实 Windows 原始证据。两种形态全部通过、异常已审结且发布物身份不变后，按 `PROMOTE-LATEST.md` 执行提升并读回确认。当前包未附任何 Windows 通过结论。
