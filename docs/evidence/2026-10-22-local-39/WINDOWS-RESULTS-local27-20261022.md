# 0.2.1 Windows Git 交接预验结果（-27，local-development-preacceptance）

- 日期/时区：2026-10-22（Taipei Standard Time, UTC+8）；执行窗口 00:34–07:45 本地，其中约 01:28–06:44 因 Claude 应用退出中断
- Windows：Microsoft Windows 10 Pro 10.0.19045，64-bit，屏幕 2560×1440 @100%
- PowerShell 5.1.19041.5848；Git 2.56.0.windows.1；tar：系统 `C:\Windows\system32\tar.exe`（bsdtar 3.5.2）
- Node / npm：本轮独占 `tools\node-v24.19.0-win-x64`（nodejs.org 官方 zip，SHA256 57f71ab3…4c73 与 SHASUMS256 一致；未做 GPG 签名校验）/ npm 11.17.0；未改全局 PATH（本机全局 Node 为 24.21.0，不符合要求，未使用）
- 交接 commit：fd879740e4292836a24dc1e411ee335619ba4c41（clone 后 HEAD 一致，工作区干净）
- KIT-FILES.json SHA256：53374ef97d0d3d1e5fd6ae1aff1e00950004979e4f81e0b7cf19a147878138d8（一致）；`verify-kit.mjs` 23 个 kit 文件全部一致
- 插件：0.2.0-rc.2-openbkn.0.2.0-27，tgz SHA256 5a24a54f…832aef，229683 字节，82 文件（一致）；ciRun=null，formalAcceptanceEligible=false
- CLI：`run\sdk\node_modules\.bin\openbkn.cmd`，@openbkn/bkn-sdk 0.2.0，registry integrity 一致
- 平台：仅 https://192.168.50.129；TCP 443 可达；Node+随包 CA：tlsAuthorized=true（302）；无 CA 负对照：UNABLE_TO_VERIFY_LEAF_SIGNATURE；Windows Schannel：不信任；用户级/机器级 Root 均无该 CA

本轮是本地开发包预验，不关闭最终固定 CI 候选、完整合同或发布验收。未替换平台、未推送、未开 PR、未打标签、未发布、未触发任何 CI。

## 关键发现

1. **fail（闭包）旧版 Host 上 Schemastery 运行期分裂**：插件 `package.json` 把 `@deepseek-ai/schemastery` 声明为普通依赖 `^3.18.4`；profile 安装时解析为 3.18.5。旧版 Host（npm runtime 与 Desktop asar）固定 3.18.4，插件 `lib/diagnostics.js`、`lib/diagnostics-observer-*.js` 从 profile 加载 3.18.5。按约束停止 C；A 同根因，已测结果保留但标注“混版条件下观察”，未继续 A 的新项。新版（B/D）版本一致（3.18.5），但仍是 profile 内独立物理拷贝，按 verify-kit 的 noSplitSchemastery（realpath 相同）口径不满足。建议：改为 peerDependency（与 cordis 一致），并让 verify-kit 同时检查实际 profile 目录。证据 E18。
2. **fail（i18n，外观级）英文诊断标题缺空格**：渲染为 “Report21349163 · Created2026/10/22 07:04:16 · ModePassive collection”；面板另有 “Platform URL:https://…”。原因：`lib/client.js` 7180–7188 行标签与值直接拼接。A（截图）与 D（DOM 文本）均复现。
3. **观察：面板自动预填个人全局 CLI**（`%USERPROFILE%\scoop\apps\nodejs-lts\current\bin\openbkn.CMD`），A/B/D 一致；本轮手动改为隔离 CLI 后再保存。未保存前不会写入配置。
4. **观察：登出态诊断的 nextAction** 为 “Export this report and send it to support…”，而不是提示登录；同一报告中 context-loader / network-list 仍显示 pass（被动模式沿用约 10–18 分钟前结果）。证据 E26。
5. **观察：npm/web 诊断 target.hostForm = "unknown"**（Desktop 为 desktop）。证据 E22。
6. **观察：OPENBKN 眉标对比度 3.68:1**（D，计算值），低于 WCAG AA 正文 4.5:1；其余抽样文本 ≥ 4.63:1。Desktop 深色主题下插件弹层保持浅色（可读）。
7. **观察：Esc 同时关闭诊断与其父面板**，焦点回到 OpenBKN 按钮（A/B/D 一致）。
8. **环境/宿主（非插件）**：从工具 shell 启动的旧版 Desktop 在 Claude 应用重启后 stdout 管道断开，官方 `NsisUpdater.checkForUpdates` 调 `console.info` 抛出未捕获 `write EPIPE`，弹出 Electron 主进程错误框。由本轮启动方式触发；记录为官方 Host 健壮性问题。
9. **校验器可移植性**：若 Git `usr\bin` 在 PATH 中排在 System32 之前，`verify-kit.mjs` 调到 GNU tar，`tar -tf C:\…` 报 “Cannot connect to C: resolve failed”（E01 原始失败）。原生新开 PowerShell 的注册表 PATH 下使用 bsdtar，通过（E02）。建议显式用 `%SystemRoot%\System32\tar.exe` 或加 `--force-local`。
10. **浏览器信任**：Windows Chrome 不信任平台 CA；用户在 Windows Chrome 中越过证书警告完成设备授权（地址栏“不安全”），不是本会话代操作。CLI 自身 TLS 由随包 CA 正常校验。Windows 浏览器信任项因此不能判 pass。

## 四组合矩阵

实际版本：A/B Desktop exe FileVersion 0.2.0-rc.2 / 0.2.1-rc.2，asar `dsh/package.json` 同；A 的 exe SHA256 与日常安装相同。D Host UI 显示“当前版本：0.2.1-rc.2”。Host 插件页显示 -27、3 组件运行中（A/B/D）。插件诊断中的 DSH 版本与插件已加载版本均为“未采集”，保持未知。

| 项目 | A 旧 Desktop | B 新 Desktop | C 旧 npm/web | D 新 npm/web | 证据 |
|---|---|---|---|---|---|
| 安装器取件/大小/摘要/Authenticode | pass（289313640，SHA256 d61cd888…，Valid，Hangzhou DeepSeek，GlobalSign EV） | pass（289385456，SHA512 与 nightly feed 一致，Valid） | n/a | n/a | E05 |
| 隔离运行（独立 DSH_HOME、--user-data-dir、不运行安装器、日常安装不变） | pass | pass | pass（独立 runtime/home） | pass | E10, E09/E27 |
| 实际 profile 82 文件 / 版本 | pass | pass | pass | pass | E13, E23, E17 |
| 依赖闭包 | **fail**（profile Schemastery 3.18.5 vs Host 3.18.4） | insufficient-evidence（同版本双拷贝） | **fail**（同 A；runtime 根闭包本身干净） | insufficient-evidence（同 B；runtime 根闭包干净） | E07, E18 |
| 独立 home / CLI 配置 / before 摘要 | pass | pass | pass | pass | E03, E09 |
| TLS、CLI 0.2.0、真实登录、列网 | pass（Node TLS、CLI 登录、2 个网络）；浏览器信任 fail | 同左 | not-run（混版停止） | 同 A | E04, E12 |
| zh/en 与切换后选择状态 | pass（英文标题缺空格见发现 2） | pass（登出态下验证；侧栏工作区保留） | not-run | pass（列表与绑定保留） | 截图、DOM |
| 登录等待/取消/超时/子进程退出/重试 | 取消 pass（3 PID ≤2s 退出）；超时 pass（116–121s 退出，提示超时）；真实重试 blocked（无人授权，第三次再次超时，之后因混版停止） | 关闭面板取消 pass；超时 pass（提示超时，退出时间仅界定 ≤134s）；真实重试 pass（同 PID 43484） | not-run | 取消 pass；超时 pass（~120s）；真实重试 pass（子进程 ~11s 退出） | E16, E25, E21 |
| 原生目录取消/重试/选择/绑定 | pass | pass | not-run | pass（DSH 官方 directory-picker-native worker） | 绑定 JSON |
| 诊断窄窗口/焦点/Tab/Esc/滚动 | pass（798×608 外框） | pass（804×608） | not-run | pass（视口 800×600，弹层 680×468） | 截图 |
| 诊断 JSON 保存并重开、秘密扫描 | pass（SHA256 76edd3af…） | pass（登出态，SHA256 489790a9…） | not-run | pass（浏览器下载，SHA256 1ce62116…） | E14, E26, E22 |
| 业务 CSV 导出 | blocked | blocked | blocked | blocked | 执行路径暂缓 |
| 事件/证据空态降级 | blocked | blocked | blocked | blocked | 按回合挂载，需真实助手回合 |
| 非空原生解释/联动 | blocked | blocked | blocked | blocked | CE 路由缺失 |
| B1 同 Host 配置重载/重新登录 | 配置重载 pass；重新登录 blocked（见上）；查询 blocked | 配置重载 + 登出 + 取消 + 真实重新登录 pass（同 PID 43484，网络与绑定恢复）；查询 blocked | not-run | 部分（同 PID 14636 内取消/超时/真实登录；无前置成功基线）；查询 blocked | E15, E24 |
| 标准交期 / Token 失效 / 平台不可达 / 其余 G6 | blocked | blocked | blocked | blocked | 无原生执行前阻断器 |
| 低权限负例 | blocked | blocked | blocked | blocked | 账号暂缺 |
| start-owned-web / stop-owned-host 脚本 | n/a | n/a | not-run | pass（身份三项匹配，进程树结束，端口释放） | E19 |
| 清理 owned 进程/端口、after 摘要 | pass（菜单退出） | pass（菜单退出） | n/a | pass | E27 |

## 收态

- 本轮进程全部退出；51427 无监听。个人配置 110 个文件 SHA 前后一致，5 个原本不存在的路径仍不存在；日常 Desktop userData/updater 42 个文件无差异。
- 本轮 CLI 配置（run\cli-config）最终为登出态；其中曾保存 admin token，仅在本轮私有目录。
- Chrome 中留有多个已过期的设备授权标签页（用户浏览器，未改动）。
- `.playwright-mcp` 临时输出已移出仓库到私有证据目录；仓库 `git status` 干净。

## 仍未关闭

完整合同、最终 build-only CI 候选、Windows 业务模型回合与 G6、Function/run_code/CSV、Sandbox 安全问题、SDK 安全门槛、低权限负例、非空原生解释、旧版销售明细历史失败、发布门槛，以及本轮新发现的 Schemastery 依赖声明问题。

## 证据摘要（原件仅留 Windows 私有目录，未入库）

私有目录：`C:\bkn-verify\021-local27-run-20261022a\evidence\`（259 文件，其中 213 个仅本地私有：截图、浏览器快照、启动日志、登录过程文件）。

| 文件 | SHA256 | 对应项 |
|---|---|---|
| RESULTS-redacted.md（本文件的来源，去掉本机源 IP 前） | 3afc5c26640bad8376cce67c3bfea2a32a17ae8306eb89f5ec66cce16385edff | 全部 |
| EVIDENCE-MANIFEST.json | 001721a6192d476887fe95b9b377ea93398b32d16bf1100f1aec4abb69c01cd0 | 证据清单 |
| raw/E14-A-desktop-old-diagnostic.json | 76edd3afb044788a94d225aab0afd725b2064561d84b055ed11ed25e33a6e104 | A 诊断导出 |
| raw/E26-B-desktop-new-diagnostic-loggedout.json | 489790a9d5bd7ea5be7c17a1c307939f0ce05810fd6c90291c9e8d7141f02c2b | B 诊断导出（登出态） |
| raw/E22-D-npm-new-diagnostic.json | 1ce62116a945a9479ec10e06028f70efad363f6923f32eb2f0480dc8bf2ca638 | D 诊断导出 |

## 建议主会话的下一步

1. 修复依赖声明：`@deepseek-ai/schemastery` 改为 peerDependency（与 `@deepseek-ai/cordis` 一致），确保旧 Host 加载 Host 的 3.18.4；`verify-kit.mjs` 增加对实际 profile 目录（插件 realpath 解析）的闭包检查，不只检查 runtime 根。
2. 修英文诊断标题与 “Platform URL:” 的标签/值空格（`lib/client.js` 约 7180–7188 行），并评估：cliPath 自动探测个人全局 CLI、登出态 nextAction 文案、npm/web 的 hostForm=unknown、OPENBKN 眉标对比度。
3. `verify-kit.mjs` 显式使用 `%SystemRoot%\System32\tar.exe` 或 `--force-local`。
4. 出新的本地交接身份后，Windows 复验受影响项：A、C 全部重跑（闭包、登录重试、UI 项），B、D 复验闭包与诊断文案；业务模型回合/G6 仍需先交付并原生验证执行前阻断器。
5. 浏览器信任：是否允许在 Windows 测试用户中导入平台 CA，或改用已信任设备完成设备授权，需要决定后写入交接说明。
