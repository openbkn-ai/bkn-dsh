请在 Windows 继续 OpenBKN/DSH 0.2.1 的最小差异复验。请直接执行已授权范围；需要人工确认或遇到前提缺失时告诉我，并继续其他独立可测项。不要扩大范围，不重跑已通过项。

固定交接：
- 仓库：https://github.com/openbkn-ai/bkn-dsh.git
- 分支：handoff/windows-local31-ui-life30-20261024
- 完整提交：d20a266fa550dd854c9bd7d30bd04c088de9bbfe
- kit/KIT-FILES.json SHA256：61bace60c424eade7904ab1ed592cd5a0a7e1b332a0b768215a8eecba1298996
- UI候选：0.2.0-rc.2-openbkn.0.2.0-31，231535字节/82文件，SHA256 22ba0e17235ccb3c93d585f2811604f5221375ac9e3496e92e6d8c1756196e4a
- 生命周期候选：冻结0.2.0-rc.2-openbkn.0.2.0-30，231075字节/82文件，SHA256 6d95ff7517dbe409875fd398784fe01049ba26d2b97c43fad65c817d3ea18ee9
- lifecycle30目录逐字节来自r3提交fac4db78a1a974192fa13fdbe62063331cf04ec1；其KIT SHA256为7daaca61691706ef476ce007eb4c49e8a8f538a30dc73764fea6f6a4281308d0。

只使用上述固定提交，不跟随tip，不采用、合入或影响另一路远端-11。正式平台仅https://192.168.50.129 / OpenBKN0.2.0，保持不替换、不升级、不部署安全补丁；保留现有业务数据、配置、日常安装、旧任务环境、凭据引用及所有失败原件。DSH仍用已核验旧0.2.0-rc.2和新0.2.1-rc.2，不升级rc.3，SDK保持0.2.0。不推送任何代码或结果，不跑CI，不开PR、不打tag、不发布。

1. 在新的取件目录操作，不能覆盖或切换已有脏工作树。可用下面的PowerShell取件步骤；路径冲突即换新目录，不删除旧目录：

$taskBranch = 'handoff/windows-local31-ui-life30-20261024'
$taskCommit = 'd20a266fa550dd854c9bd7d30bd04c088de9bbfe'
$taskCheckout = Join-Path 'C:\bkn-verify' ('021-local31-ui-life30-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
if (Test-Path -LiteralPath $taskCheckout) { throw 'Use a new checkout directory' }
git -c core.autocrlf=false clone --single-branch --no-tags --branch $taskBranch https://github.com/openbkn-ai/bkn-dsh.git $taskCheckout
if ($LASTEXITCODE -ne 0) { throw 'Clone failed' }
git -C $taskCheckout checkout --detach $taskCommit
if ($LASTEXITCODE -ne 0) { throw 'Fixed checkout failed' }
if ((git -C $taskCheckout rev-parse HEAD).Trim() -ne $taskCommit) { throw 'Commit mismatch' }
if (git -C $taskCheckout status --porcelain) { throw 'Checkout must be clean' }
$taskKit = Join-Path $taskCheckout 'kit'
if ((Get-FileHash -Algorithm SHA256 (Join-Path $taskKit 'KIT-FILES.json')).Hash.ToLowerInvariant() -ne '61bace60c424eade7904ab1ed592cd5a0a7e1b332a0b768215a8eecba1298996') { throw 'KIT mismatch' }

先读根AGENTS.md、README.md、WINDOWS-TASK.md及kit/W-LIFE.md、W-UI.md、PROFILE-COPY.md、RESULTS-TEMPLATE.md。lifecycle30内的旧HANDOFF/FOLLOWUP和argv/B1/web脚本只保留历史原字节，不能据此扩大本轮执行。找出既有任务Node24.19.0的绝对路径，以其执行kit/verify-handoff.mjs；只用进程级PATH，不改系统Node/PATH。记录版本及校验结果，所有输出写kit/checkout外。两包只差lib/client.js、lib/types/client/locales.d.ts、package.json；Host/Remote、原helper/SDK/CA/pins不改。

2. 先W-LIFE，仍用原-30，只选一个既有已验收任务Desktop（优先A旧版）。只做必要身份/摘要检查，不重装或初始化。先让我确认当前日常Chrome窗口已打开，以及它对应的根PID、UTC创建时间和exe；不能沿用旧PID11368，不能凭任意chrome根、PPID或自动化窗口推定。没有当前确认则LIFE前提BLOCKED，继续独立UI，不关闭/重开我的Chrome造条件。

用lifecycle30原start-owned-desktop.ps1正常模式为所选任务Desktop启动，Evidence用新目录，不用InitializeOnly或ReadOnlyProtocol。这只是取证准备，不重算启动验收。先不登录，使用官方F12 DevTools现成Network/WS入口，检查能否观察本任务/api/remote.mux及安全关联stream。允许只读查看现成transport形状；不改global、刷新/重连/断开socket、注入模块或启新调试服务。看不到当前连接就carrier-capture BLOCKED，不先跑一次无意义登录。

可观察且入口可自然开始登录时，最多一次正常CLI浏览器登录；若已登录而不能自然开始，不先登出改变条件，记该前提BLOCKED。用现成安全采样器记录任务Host/后端、CLI、runner与已确认日常Chrome根的PID/UTC创建时间/exe，保留采样精度。线路只摘录路径、方向、type、该beginLoginStream关联序号及item/end/cancel的UTC时间；不保存完整命令行、环境、设备URL、账号、token、HAR、原始payload、请求头或Cookie，不采其他Session。

成功后先保持面板观察30秒；runner仍在才延至总60秒。随后只关闭/重开一次插件面板，检查同一stream是否新增cancel，不查询、不跑B1。最后菜单正常退出任务Desktop，核对owned进程/端口与原日常Chrome状态。同次250–370ms采样消失不能判先后，end帧不证明server active-map移除时间，更不证明Job空或浏览器关闭原因。

没有现成且已核验的特定Job只读成员入口，就将Job成员/terminate调用/浏览器关闭因果记UNKNOWN/BLOCKED。不得DuplicateHandle或持有Job句柄、注入Host/runner、改Job策略、强杀Job/浏览器、启新调试服务、改默认浏览器或证书信任。不要临时编造探针或反复登录到碰巧复现；r1残留、r2新树消失、r3既有根保留分别保留，不宣称已修。

3. W-UI才用-31。完全退出任务Desktop后，按PROFILE-COPY.md复制现有A/B任务home到各自新副本，排除node_modules并逐文件核对；不要选日常profile或复制个人token。保留原-30 home不动，用各自已核验官方Desktop附带resources\runtime\cli\bin\dsh.cmd，仅在副本安装固定-31，再用ui31原helper正常启动并核对实际加载版本。不得手工替换node_modules、重装DSH、允许不兼容版本或升级依赖；出现未解释配置/依赖变化、丢数据/绑定或闭包失败，保留副本和失败原件，停在对应项，不改冻结脚本绕过。必要的版本/82文件/实际profile身份校验不是重跑四组合闭包矩阵。

A旧Desktop仅复验：
- 已有Reference中的请求/跟踪/回执/操作/状态标签zh→en→zh，原名称、ID、completed等平台值不变；缺现成字段记录则该子项BLOCKED，404不能冒充非空标签PASS，不造新业务数据。
- 业务、诊断、溯源三个插件弹层的Escape只关插件层、原生父面板保持、焦点回入口；只补局部Tab/Shift-Tab边界、800×600溢出，存在嵌套菜单时检查已消费Escape不连关。
- 两个OPENBKN眉标和绿色主按钮文本可读性/4.5:1对比度；只看按钮，不为外观再触发登录。
- 被动诊断明确是历史观察、采集不主动验证当前登录/连接，原状态/时间/JSON事实保持；不重做JSON保存工作流，不把历史pass当当前认证证明。
B新Desktop只快速检查受影响Escape/Tab与文案，不重做A整套。不扩npm矩阵。

4. 不重跑已通过的官方argv、A/B初始化/启动验收、系统tar、四组合闭包、完整UI、目录取消/选择/绑定、登录取消/超时、B1；不发模型/G6、Sandbox、Function/run_code或BOM/CSV。缺前提只阻断依赖项，继续其他独立项；不是所有blocked都要求新安装或新登录。

5. 菜单正常退出本轮应用，必要时仅用未改stop-owned-host.ps1按PID/UTC/exe/端口核对本轮owned资源收态；不按进程名批量杀、不动其他会话/-11/日常Chrome。保留原home、全部副本、原始失败和新增记录；不要用旧快照覆盖回去删除新Session/Interaction或回滚新登录token。比较原task home、个人配置/日常安装、frozen kit和平台只读摘要的前后覆盖范围，不能由少量视图推断整库没变。

6. 按模板用中文回传每子项PASS/FAIL/BLOCKED/NOT_RUN、实际candidate/Host身份、UTC/采样精度、脱敏小型时间线、关键证据文件名、报告与manifest的Windows绝对路径及完整SHA256、恢复/owned退出/日常Chrome状态和受阻原因。原始私有证据仅留Windows，不上传秘密或推送结果。标记local-development-preacceptance，ciRun=null、formalAcceptanceEligible=false；不把局部UI或受控夹具当完整正式验收。
