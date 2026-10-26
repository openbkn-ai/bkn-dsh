请执行 bkn-dsh Windows -30 r2 的最小定向复验，实际完成可测项并保留证据，不只给计划。

一、固定输入和边界

仓库：https://github.com/openbkn-ai/bkn-dsh.git
分支：handoff/windows-local30-r2-20261023
完整固定提交：96f8f7656103e8e066a12ea8d9d05d5e7dd96339
唯一插件：0.2.0-rc.2-openbkn.0.2.0-30
候选tgz SHA256：6d95ff7517dbe409875fd398784fe01049ba26d2b97c43fad65c817d3ea18ee9
候选大小/文件数：231075字节、82文件
本轮r2 KIT-FILES SHA256：f340d205a6290c9e9eea9cfaef08561a5a596496bdb75a1e30c43ccd71e0e004
本轮原start-owned-desktop.ps1 SHA256：0e3466f3da61bd2cac8f263c03573ad03206dea7cf20ac58d8f94e433b4943a7

只用本提交的r2和原-30包，不重建、不换包、不用npm latest。远端另一路-11独立排除，不采用、不合入、不修改。原743eb4a/-30及fd87974/-27和失败证据保留，不把旧提交当r2。

唯一平台https://192.168.50.129，保持当前正式OpenBKN0.2.0不替换，保留数据、配置和服务；不部署安全回补、不切EE，不使用50.28。不推送、不跑CI、不开PR、不打标签、不发布。主会话交接推送授权不延伸到Windows结果推送。

二、取件、阅读和校验

先检查本机现状，不reset、不覆盖任何旧目录。使用新的专用checkout、taskRoot与结果目录，例如在PowerShell执行：

$taskStamp=Get-Date -Format 'yyyyMMdd-HHmmss'
$taskCheckout="C:\bkn-verify\021-local30-r2-src-$taskStamp"
$taskRoot="C:\bkn-verify\021-local30-r2-run-$taskStamp"
$taskResults="C:\bkn-verify\021-local30-r2-results-$taskStamp"
if((Test-Path $taskCheckout) -or (Test-Path $taskRoot) -or (Test-Path $taskResults)){throw '请选择新的独占目录'}
git clone --single-branch --branch handoff/windows-local30-r2-20261023 https://github.com/openbkn-ai/bkn-dsh.git $taskCheckout
if($LASTEXITCODE -ne 0){throw 'Clone failed'}
$taskActualCommit=git -C $taskCheckout rev-parse HEAD
if($LASTEXITCODE -ne 0 -or $taskActualCommit -ne '96f8f7656103e8e066a12ea8d9d05d5e7dd96339'){throw 'Commit mismatch; stop and report'}
New-Item -ItemType Directory $taskRoot,$taskResults | Out-Null
$taskKit=Join-Path $taskCheckout 'docs\handoff\2026-10-23-021-local-30-windows-r2'

阅读根目录AGENTS.md、README.md、WINDOWS-TASK.md，以及r2目录FOLLOWUP.md、RESULTS-TEMPLATE.md、candidate-manifest.json、sdk-manifest.json和官方Host清单。HANDOFF.md中的完整矩阵仅为背景，本提示词及根任务的本轮定向范围优先。

找到上一轮已校验的任务Node24.19.0，仅在当前进程选用，不改变全局Node/PATH；Desktop内置Node另记，不替换。可以复用经原证据和摘要/版本核对的官方解压Desktop、官方SDK0.2.0执行文件，避免重复下载和安装；不能复用旧补丁launcher。

核对KIT-FILES和helper的完整SHA，运行verify-kit.mjs，确认25项输入、同-30的82文件及SDK integrity通过。任何不符先留证并停止依赖项，不改输入、预期SHA或校验器绕过。

用Windows PowerShell5.1运行一次公共参数回归：

powershell.exe -NoLogo -NoProfile -File (Join-Path $taskKit 'test-desktop-launcher-argv.ps1') -Launcher (Join-Path $taskKit 'start-owned-desktop.ps1') -NodeExe (Get-Command node.exe).Source
if($LASTEXITCODE -ne 0){throw 'Windows5.1 argv regression failed'}

结果和临时文件全部写kit外。r2只修helper两处参数拼接括号；插件、SDK、官方Host和其他执行脚本没有因此改变。不要改helper中的taskKit或打第二份补丁。

三、先完成A/B原helper启动

A是官方Desktop0.2.0-rc.2，B是官方Desktop0.2.1-rc.2。两者分别新建DSH_HOME、独立BKN_CONFIG_DIR和证据目录，不复制旧token，不触碰个人配置。固定官方Host身份来自清单，不能改exe/ASAR/pin/依赖凑通过。

每个组合依次：
1. 用本r2原start-owned-desktop.ps1和新home执行-InitializeOnly；保留原helper SHA、闭包输出、PID/UTC创建时间/exe、后端监听和持久日志。此时只是初始化/runtime校验，不作profile通过。
2. 通过菜单正常完全退出。按HANDOFF使用官方CLI或原生插件界面安装同一-30到desktop profile。
3. 以同一个未经修改的r2 helper正常启动，执行实际profile/安装82文件校验。旧Host共用Cordis4.0.4/Schemastery3.18.4，新Host共用4.0.5/3.18.5，必须同物理包；插件Zod4.4.3，Host按自身声明，不覆盖官方依赖。记录实际版本和加载证据，未采集的诊断字段保持未知。

初始化和正常启动都覆盖到才关闭该组合的原helper启动门槛。原743eb4a报告的补丁launcher通过不能代替本轮。遇到错误保留原输出，继续其他独立组合，不热修原件后改记通过。

四、每个Desktop只做一次成功登录及runner取证

本轮不重跑取消、默认超时、完整UI、完整B1或业务题。A/B各进行一次正常原生登录，验证正常认证/列网即可，不启动模型会话、B1夹具、Function、run_code或BOM/CSV。意外超时则保留失败，只做完成成功路径必需的正常重试，不扩成超时回归。

在登录前、进行中、直接CLI退出后、Host正常退出后采集有界进程时间线，至少包括PID、PPID、UTC创建时间、进程名、exe和本轮Host监听。覆盖runner、短命cmd/CLI及浏览器启动器；可采用现成只读事件或短时轮询，记录采样间隔、观察时长和可能漏掉短命进程的限制。成功后观察约60秒即可，不做四小时等待。

原始进程路径只留私有证据，不记录完整命令行、环境、设备URL/code、token或密码。不要按旧PID43556/7380认定本轮身份，防止PID复用。

直接CLI退出和整个管理范围退出分开判断：固定DSH的done可在target-exit后返回，而Windows runner等待Job清空；成功OAuth还会启动浏览器。浏览器后代是候选解释，尚未证明。PPID图只能给关联证据，不能当作Job成员列表或Job已空的证明。

只有已有且经核验、无需全局安装/提权/Host注入的只读Job诊断才使用。拿不到Job成员状态就如实保持根因未知。不要强杀整个Job、关闭个人浏览器、修改默认浏览器或给生产代码增加成功后terminate。若A/B不再残留，记录观察窗口和条件差异，不能宣称r2修复了runner，因为r2只改launcher参数。

先沿用原报告C/D成功无残留的历史对照。仅当A/B复现且确需同轮对照时，最多追加C或D一个组合的一次成功登录与同样取证，解释理由；不重跑其余npm UI/B1。

五、收态与范围限制

A/B通过菜单正常退出，核对已记录的主进程、后端、runner和端口收态。若仍有残留先留证；不按进程名批量杀，不触碰别人的资源。只在确认本轮身份及安全边界后清理；不能安全清理则报告具体阻碍。恢复仅本轮任务变更，保留旧验收目录、原始失败、新登录配置和会话。核对选定个人配置、日常安装前后摘要；平台只声明实际核验的视图，不扩大成全部数据未变。

浏览器信任仍blocked，既有Chrome证书例外来源未知；不导入CA、不删除例外、不越过证书警告、不把“不安全”页面当信任通过。NODE_EXTRA_CA_CERTS只按文档在本轮进程使用。登录/目录窗口需要配合时说明具体窗口和原因，继续其他独立项。

慢读取消、真正RDP断开重连、npm空控制台、其他UI观察、完整G6/恢复题/Function/run_code/BOMCSV、CE非空解释、低权限、安全、历史销售明细及最终固定CI继续开放，本轮不扩大执行。既有完整UI/B1通过保留原743eb4a证据和补丁launcher条件，不改写历史。

六、回传

按r2 RESULTS-TEMPLATE.md输出A/B逐项pass/fail/blocked/not-run/insufficient-evidence。回传：
- 本轮完整commit、候选/KIT/helper完整SHA、机器/PowerShell/Node和官方应用身份；
- 公共argv回归、A/B初始化与正常原helper启动、实际profile结果；
- 每次登录直接CLI退出与runner状态、观察时长、进程/Job证据和覆盖限制；
- 已验证事实、根因推断、仍未知事项分别列明，不把猜测写成修复；
- 关键证据绝对路径/完整SHA、原始错误摘要、收态和保留检查；
- 脱敏报告本身的绝对路径及完整SHA，并把主要结果直接贴回会话，便于主会话汇总。

所有原始证据留Windows本机私有目录，公开报告先脱敏并秘密扫描；截断摘要不补造。不要上传私有日志、凭据或业务原始记录，不自动创建或推送结果分支。

本轮仍是local-development-preacceptance，ciRun=null、formalAcceptanceEligible=false。完成定向复验不代表完整验收或正式发布通过。
