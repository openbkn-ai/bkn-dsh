# Windows -31 UI / -30 lifecycle 最小结果（2026-10-24/25 最小差异复验）

- 固定 branch / full commit / clean checkout：`handoff/windows-local31-ui-life30-20261024` / `d20a266fa550dd854c9bd7d30bd04c088de9bbfe` / 干净（clone 后与收尾 `git status --porcelain` 均空）。checkout：`C:\bkn-verify\021-local31-ui-life30-20261024-235238`（detached）。
- KIT-FILES SHA256 / ui31 tgz SHA256 / lifecycle30 tgz SHA256：`61bace60c424eade7904ab1ed592cd5a0a7e1b332a0b768215a8eecba1298996` / `22ba0e17235ccb3c93d585f2811604f5221375ac9e3496e92e6d8c1756196e4a`（231535 B / 82 文件） / `6d95ff7517dbe409875fd398784fe01049ba26d2b97c43fad65c817d3ea18ee9`（231075 B / 82 文件）。SDK 0.2.0 两 kit 均 officialRegistryIntegrityMatched=true；candidateDelta 恰为 `lib/client.js`、`lib/types/client/locales.d.ts`、`package.json`（verify-handoff 实测）。
- kind=local-development-preacceptance; ciRun=null; formalAcceptanceEligible=false
- 实测旧/新 Host 版本/ASAR 身份/内置运行时与实际插件加载证据：
  - A 旧 Desktop：exe `df4e91fd91f6f1bee19a1990b0e167bfe06abf8353279d82bbb8e60edb6ba0d3`、ASAR `983ca71114e6dfd353fc79af5a1f9481a250ee64c2a3c757673029b811b23bc2`、FileVersion 0.2.0-rc.2、Authenticode Valid（与 r3 报告逐字一致）；原 -30 home installed82 只读闭包 exit=0。
  - B 新 Desktop：exe `9c789407850773ce7d914a3ec0476852bf1ceea69789d8ccf4e39be953f4bf52`、ASAR `47874618bf5b3011fcaac10cd4c85f69da333e70d4f99b921207c78d0999512a`、FileVersion 0.2.1-rc.2、Authenticode Valid（与 r2 报告一致）。内置运行时未替换（helper 以 Electron 校验，未采集具体 Node 版本，如实记未知）。
  - 实际加载 -31 证据：A/B 启动闭包 `installed.matched=82, version=-31`、`runtime.pluginVersion=-31`（A：host 0.2.0-rc.2 / cordis 4.0.4 / schemastery 3.18.4；B：host 0.2.1-rc.2 / 4.0.5 / 3.18.5，均 samePhysicalPackage、noMixedDsh）；且 -31 独有文案 passiveHistoryNotice 在 A/B 诊断页实际渲染（该键仅存在于 -31 locale），设置页显示“CLI 0.2.0 可用”。磁盘版本号不作为加载证据使用。
- 原 -30 与新 ui31 副本路径（私有记录，仅脱敏描述回传）：源为既有已离线任务 home（r2 轮 home-A-desktop-old / home-B-desktop-new，各 11 文件）；副本为本轮 run 根下 `ui31-home-A`、`ui31-home-B`（11 文件逐文件 SHA 复制，node_modules 跳过）。每项实际使用的 candidate：A/B UI 检查均 -31（22ba0e17…）；生命周期项（L0–L4）未执行，无 candidate 使用。

| 子项 | 候选/Host | PASS/FAIL/BLOCKED/NOT_RUN | 证据/UTC/限制 |
|---|---|---|---|
| L0 用户确认现存日常Chrome窗口/根身份 | -30/所选单Desktop | **BLOCKED** | 等待用户当前确认（根 PID/UTC创建时间/exe）；旧 PID11368 不可沿用。未确认前未启动任何任务 Desktop，未触碰日常 Chrome |
| L1 不登录的现成DevTools carrier可观察性 | -30 | NOT_RUN | 依赖 L0 与任务 Desktop 启动 |
| L2 一次登录item/end/cancel与30/60秒进程时间线 | -30 | NOT_RUN | 依赖 L1；本轮零登录 |
| L3 一次close/reopen与正常退出/Chrome状态 | -30 | NOT_RUN | 依赖 L2 |
| L4 特定Job成员/terminate因果 | -30 | UNKNOWN/BLOCKED | 无现成可靠入口，不注入/复制句柄；本轮未启动 |
| U0 副本保留/官方安装/实际加载身份 | -31 A/B | **PASS** | clone-task-home 11/11×2 逐文件 SHA；官方自带 dsh.cmd 安装 -31 exit=0×2；安装后 9/9 数据文件逐字节不变 + 允许的 profile package.json/pnpm-lock 变化 + 1 条披露的安装操作日志；helper 闭包 82/82×2 |
| U1 五个Reference标签zh/en/zh、原值保持 | -31 A；B快查 | **BLOCKED** | A/B 均未登录：插件“登录并同步”即使 hasToken=true 也必然走浏览器授权（实测已取消，未打开任何浏览器窗口）；本轮无登录授权，Reference 视图不可达；未制造业务数据；无 404 空态冒充 |
| U2 三弹层Escape/父层/焦点、局部Tab/800×600 | -31 A；B快查 | **PASS**（溯源子项 NOT_RUN） | A：Escape 三场景（设置视图、弹层内控件、诊断层）均只关插件层、原生父面板保持、焦点回入口（截图可见焦点环）；Tab×6 环回首控件、Shift-Tab 回末控件（未逃出弹层）；嵌套“CLI 安装版本”下拉 Escape 一次被消费、弹层不连关；窗口 664×538（<800×600）及展开高级设置均无溢出。溯源弹层需含溯源的既有会话，副本无此数据 → 该子项 NOT_RUN。B 快查：Escape 关闭+焦点回入口 ✓、Tab 包含性 ✓（与 A 同一 -31 bundle） |
| U3 两眉标/主按钮可读性 | -31 A | **PASS** | 实测像素采样（WCAG）：业务页眉标 8.54:1、诊断页眉标 10.38:1、主按钮白字/绿底 5.21:1（源常量 #087D72 交叉一致）、保存并继续 5.0:1；均≥4.5。只查看按钮，未为外观点击登录。截图私有 |
| U4 被动历史说明、原JSON事实 | -31 A；B快查 | **PASS** | -31 被动说明原文渲染于 A/B 诊断页；报告标明“模式 被动采集”+生成时间；“磁盘版本不代表当前已加载版本”+插件（已加载）=未采集；检查项为历史观察（observed:cli exitCode=0、observed:login-state loggedIn=false 为真实观察事实）；未点击重新采集/导出（不重做 JSON 保存流程）；面板使用后 home 副本复检无新写入 |
| P 保留/owned退出/原kit与原home摘要 | -30/-31 | **PASS** | A/B 均“应用→退出”菜单正常退出；owned 进程 0、端口 19387/51811 释放；原 home 11/11×2 与克隆时逐字节一致；checkout/kit 干净；冻结 kit 前后 SHA 不变（verify-handoff 首尾口径一致） |

未重跑 argv、A/B启动验收、tar、四组合闭包、完整UI、目录/取消/超时/B1；未运行模型/G6/Sandbox/Function/run_code/BOM/CSV。未升级DSH/SDK/平台、未采用-11、未推送/CI/PR/tag/release。

只摘录本次stream类型/方向/序号/UTC：无（生命周期段未执行，零 stream 观察，零登录）。不上传HAR/原始帧/账号/凭据。进程采样精度：本轮无定时采样（GUI 检查为实时交互取证）；owned 启动记录来自原 helper 的 CIM 单次采样（A：PID 21980 / 2026-10-24T16:00:11.352Z / 127.0.0.1:19387 ←PID 25940；B：PID 26860 / 2026-10-24T16:23:05.356Z / 127.0.0.1:51811 ←PID 6584）。同次消失不判先后。Job成员/因果未知：无现成可靠入口（未实现新探针）。原始私有文件仅Windows：`C:\bkn-verify\021-local31-ui-life30-run-20261024-235413\`（evidence/、results/、ui31-home-A/B/、tmp-diff/）。

- 脱敏报告路径及完整SHA256：`C:\bkn-verify\021-local31-ui-life30-run-20261024-235413\results\RESULTS-021-local31-ui-life30-20261024.md` = 见 manifest
- evidence manifest路径及完整SHA256（区分private文件）：`C:\bkn-verify\021-local31-ui-life30-run-20261024-235413\results\evidence-manifest.json` = 见 manifest 自身记录
- 关键截图/小型脱敏时间线文件名及完整SHA256：见 manifest（U2-A-escape3-from-settings.png、U2-A-tab6-wrap.png、U2-A-shifttab-wrap-last.png、U2-A-nested-select-escape-once.png、U4-A-diagnostics-view.png、U-B-escape2.png、U-B-diagnostics.png 等）
- 失败原件/受阻条件/后续需要用户配合：
  1) W-LIFE 全段 BLOCKED：需要用户**当前**确认日常 Chrome 窗口已打开及根 PID/UTC创建时间/exe（不可沿用 11368，不可由 PPID/自动化窗口推定）；
  2) U1 BLOCKED：需要一次明确的浏览器登录授权（实测“登录并同步”在 hasToken=true 时仍发起浏览器授权等待，已在出现浏览器前取消，面板确认“已取消本次登录等待…平台上已完成的授权不会撤销”）；授权后可在 A 副本上补 U1（zh→en→zh 标签）并连带补 W-LIFE 的受控观察；
  3) 溯源弹层 U2 子项 NOT_RUN：需含溯源记录的既有会话（副本无业务数据，不制造）；
  4) 800×600 未精确设定窗口尺寸：以更小的 664×538 与展开态覆盖（无溢出）；本轮无窗口 resize 授权手段。
- before/after覆盖范围、owned收态和日常Chrome状态：原任务 home（11/11×2 逐字节一致）、冻结 kit（git status 干净、首轮 verify-handoff 全绿）、本轮副本与全部证据保留；个人配置/日常安装本轮零接触（W-LIFE 未执行，日常 Chrome 全程未触碰、未读取、未关闭）；平台仅只读 auth status（hasToken=true）与插件状态刷新，未做平台数据前后比对（不声称平台数据未变以外的结论）；owned 收态：两台 Desktop 菜单退出后 DeepSeek Harness 进程 0、端口 19387/51811 无监听。
