# Windows 自动登录成功状态修复最小差异复验（2026-10-30）

kind=windows-auto-login-status-fix-validation；ciRun=null；formalAcceptanceEligible=false。
结果：**主项 PASS —— 面板在全程未被关闭/刷新/诊断/切换/重开的情况下，自行从"正在等待"翻转为"登录并同步成功"并显示真实网络目录。**

## 一、固定身份（全部核对通过）

- 取件：fetch `handoff/windows-auto-login-status-20261030`，FETCH_HEAD=交接提交 `40fe7a53795390391027e0244dc00eb96b593a98`；detached worktree `C:\bkn-verify\auto-login-status-40fe7a5-checkout`，HEAD 一致，首尾 git status 干净。
- 修复源码 `dbf53d329eae704e580e555f9da37f7c05a8111a`；候选 `0.2.1-rc.3-openbkn.0.2.1-auto.local.2`（tgz SHA256 `96dc62d7…`，259297B/94 文件）；KIT-FILES.json SHA256 `dd8f377c…`（与任务书一致）。CANDIDATE-DELTA：与 auto.local.1 仅 lib/client.js、package.json 两文件不同；实测安装后 lib/client.js SHA256=`9d15a9e74dc925066b3aacc88e6cdefc49b492916a4692ee601ab1ec110671f7`（=INPUTS.clientSha256），business.js/PackagedMcp SHA 与上轮相同（167e6571…/41db8cdb…）。
- `verify-inputs.mjs`（任务 Node 24.19.0）：离线 PASS；安装后 `--installed` 94/94 PASS（安装时与收尾各一次，results/verify-inputs-initial.json、verify-installed.json、verify-installed-final.json）。
- 复用上轮已核验资源：官方 rc.3 Desktop EXE `fd7d298f…`（启动前/收尾一致）、app.asar `04b32e3a…`（首尾一致，stock MCP `758d8fc4…` 未变）、官方 CLI 0.2.0 `dist/cli.js` `18445a26…`、association 脚本 `d5c874cb…`（材料原样）。CLI 解释器沿用上轮已核验的 scoop Node 24.21.0（≥22.19.0，材料明示可沿用，未调环境）。
- 平台 https://192.168.50.28（正式 0.2.0 未替换）；无 tools/call、无模型回合。

## 二、环境与安装

- 全新任务隔离：run 根 `C:\bkn-verify\auto-login-status-40fe7a5-run-20261030-0027\`（DSH_HOME、profiles\desktop、Electron user-data、空 CLI 配置、workspace 均新建）；真实 USERPROFILE/APPDATA/LOCALAPPDATA/HOME/OS/PATH 保留；未复制凭据/模型配置/会话/workspace；未动上轮任务目录。
- 官方 App 自带 dsh.cmd 安装（exit=0，private/plugin-add.log）；**无 MCP companion**（manualProfileCompanionPresent=false）。
- profile patch：baseUrl=https://192.168.50.28、cliPath=任务官方 CLI、requestTimeoutMs=10000；insert 仅 business-observer.mjs（**无 CLI carrier 探针，desktop-observer 未使用**，按材料口径）。

## 三、启动与主用例时间线（本地 +08:00，括注 UTC）

| 时刻 | 事件 | 证据 |
|---|---|---|
| 00:28:57 (16:28:57Z) | GUI 启动，PID 28440（CIM 实测创建时间） | results/gui-identity.txt；EXE/ASAR 启动前摘要 private/prelaunch-digests.txt |
| 00:29–00:31 | 欢迎页"添加 API Key→稍后配置"进入（未配置模型）；打开 OpenBKN 面板（未登录初始态） | evidence/welcome.png、main-entered.png、panel-initial.png + private/ax-panel-initial.txt |
| 00:31:48 (16:31:48.150Z) | **t_click：点击"使用 OpenBKN CLI 登录并同步"**（用户经确认就绪后，唯一一次） | private/t-click.txt |
| 00:31:56 | 首轮观察：面板"正在等待 OpenBKN CLI 完成浏览器授权并同步凭据…"（AX 全文） | evidence/panel-waiting-*.png + private/ax-waiting-20261029163156.txt |
| 00:32:09 | **t_proof：观察器写 proof-4041eba7….json**（授权状态检测，200ms 轮询） | proof 文件 mtime；后台轮询 00:32:18 iter=1 首见 |
| 00:32:19 | **t_success_first_seen：AX 全文出现"登录并同步成功"+"找到 2 个网络"，等待文案 0 次出现** | evidence/panel-poll-20261029163219..png + private/ax-poll-20261029163219..txt |
| 00:32:2x–32:3x | 后续轮询 no_change（成功态稳定）；owned CLI/独立授权浏览器收净（NONE-RECENT） | private/owned-procs-after-success.txt |
| ~00:34 | 应用菜单→退出（唯一正常退出；未重启、未重开面板测持久化——沿用 auto.local.1 已过项） | evidence/menu-exit-open.png |

面板从点击到成功全程保持打开，未发生任何点击/刷新/诊断/语言切换/重开（轮询为纯观察 AX+截图，不触发交互）。**t_proof→首次看见成功 ≤10 秒；精确翻转瞬间 UNKNOWN**（有界 (00:31:56, 00:32:19]，且授权完成必然先于 proof 00:32:09）。用户在浏览器内完成授权的精确时刻 UNKNOWN（未插桩）。

## 四、主项判定：PASS

当前面板**自行**切换为"登录并同步成功。"并显示账号实际网络目录："找到 2 个网络"（worldcup_vega_catalog_bkn、supply_ontology_hand——2 为账号实际权限值，未硬编码）。AX 文本与截图对应留存（成功态全文 ax-poll-20261029163219.txt：含成功文案与网络行、不含等待文案；PNG 同秒）。无关闭/刷新促成的改判路径。

观察器 proof（proof-4041eba7-ebac-480f-9a92-c7734fea59ea.json，result=PASS）：
- version=`0.2.1-rc.3-openbkn.0.2.1-auto.local.2`、businessSha256=`167e6571…`；
- 三组件 `@openbkn/dsh-business-context{,/business,/diagnostics}` 全部 state=2（active）；
- loadedClassIdentity=true；authKind=authenticated；platformKind=real-read-only；networkCount=2；
- packagedMcpRuntimeIdentity=true（registry 实例===manager fiber.runtime）；packagedMcpSha256=`41db8cdb…`；manualProfileCompanionPresent=false（无手工 mount/token/companion）。

成功后 owned CLI 与独立授权浏览器全部退出（private/owned-procs-after-success.txt：近 2 小时无 node/chrome 新进程）；日常浏览器未操作。

## 五、退出、恢复与保全

- 菜单正常退出一次：进程树 ROOT-GONE、无 DeepSeek/openbkn 残留、无任务端口监听（private/exit-sweep.txt）。**退出码 UNKNOWN**：包装 Start-Process -PassThru 捕获失败（`Wait-Process` cmdlet 不填充 ExitCode，需 `$p.WaitForExit()`——本轮启动器疏失，如实记录；进程收净以 CIM 核实）。
- 注册表：After unchanged=**True**（GUI 全程未改 dsh 关联写点）；Restore 验证通过（UserChoice/ACL 未动）；evidence/system-association/ 四相留档。
- 收尾复核：安装目录 94/94、tgz `96dc62d7…`、EXE `fd7d298f…`、ASAR `04b32e3a…` 首尾一致；checkout 40fe7a5 干净。
- 保全：上轮任务目录与本轮新数据全部保留；无首败（本轮无失败项）；无个人状态前置快照，不声称个人目录逐字节不变。未推送/PR/CI/发布/latest；#93/#97/#2573 未动；豁免项全部未跑。

## 六、UNKNOWN 与边界

1. 退出码 UNKNOWN（捕获方式错误，见上）；进程树/端口收净已核实。
2. 精确翻转瞬间 UNKNOWN（等待 AX 00:31:56 → 成功 AX 00:32:19 之间；proof 00:32:09 给出上界参考）。
3. 用户浏览器授权完成时刻 UNKNOWN（未插桩；先于 proof 写入）。
4. 本轮一次成功**不证明上轮 5 分钟滞留的唯一根因**（材料同口径）；仅判定 auto.local.2 在 Windows 现场无需关闭/刷新即可完成成功反馈。
5. 00:32:26/32:32 两轮轮询返回 no_change 增量（AX 摘要），成功态全文以 00:32:19 快照为准。

## 七、产物

- 报告：results/RESULTS-auto-login-status-fix-20261030.md；manifest：results/evidence-manifest.json
- 归档：results/archive/{proof….json, t-click.txt}；时间线辅助：results/gui-identity.txt、gui-exit-code.txt（空值即 UNKNOWN 记录）
- 私有原件（留 Windows 本机）：evidence/*.png、private/ax-*.txt（AX 全文）、进程清单、.reg/SID、CLI 配置、electron-user-data、logs/gui-*.log
