# Windows 自动登录受影响项最小差异复验（2026-10-29）

kind=windows-automatic-login-affected-validation；ciRun=null；formalAcceptanceEligible=false。
结果：**主项全部 PASS；两项已记录偏差（CLI 解释器来源、面板等待文本滞后），无 FAIL/BLOCKED。**

## 一、固定身份（全部核对通过）

- 取件：fetch `handoff/windows-auto-login-93f3e85-20261029`，FETCH_HEAD=交接提交 `bde72dbd7cb056ed8b13eeea4bf00962ec5ad92e`；detached worktree `C:\bkn-verify\auto-login-bde72db-checkout`，HEAD 一致，首尾 `git status` 干净。
- 生产源码固定 `93f3e8560a7ab8834cab7fa97fa79677d71f1827`；候选 `0.2.1-rc.3-openbkn.0.2.1-auto.local.1`，tgz SHA256 `ea6be318b40f06a55e95e1bfd962f4f06fe230874574028750639f62e61194dc`、259279 字节、94 文件；KIT-FILES.json SHA256 `4f8dcde6b3ce8012ae64a065f68a5718e86346f0db18c7ff155a642965bf67e8`。
- `verify-inputs.mjs`（任务 Node 24.19.0）：KIT 全文件+归档 94 文件 PASS；安装后 `--installed` 94/94 PASS（安装时与收尾各一次）。
- 官方 rc.3 Desktop EXE SHA256 `fd7d298f4ba03ee9bab1719a892afeaef5c09bf50c574a592a64c85f64574c0c`（复用任务副本，未改日常安装）；app.asar 启动前/收尾均为 `04b32e3a872826ba15cfb2081c6a929a8d4ecaa65e09a2543e5a6b30e2eff1f0`（stock MCP `758d8fc4…` 随 asar 未变）。
- 官方 CLI 0.2.0 `dist/cli.js` SHA256 `18445a26bfb20f7a8cc8eecb50f499ff12c0ed564e0e3d8741850fcbe43f82a5`，engines `>=22.19.0`。
- system-association.ps1 SHA256 `d5c874cb5dd6af83fe64676ea5bc693d2bffc2a2302b9273a970a8fa081cced1`（材料原样）。
- 平台 https://192.168.50.28（正式 0.2.0，未替换）；仅授权、MCP 初始化与只读目录读取；无模型回合、无 tools/call。

## 二、环境与安装

- 新建任务隔离：`DSH_HOME`（run 根 `home\dsh-home`）、`profiles\desktop`（官方 boot initProfile + bundles 三件套 dsh-base/dsh-web-app/@openbkn/dsh-business-context）、Electron user-data（run 根）、空 CLI 配置（run 根 `cli-config`）。真实 USERPROFILE/APPDATA/LOCALAPPDATA 保留；无个人凭据/模型配置/旧 Session/workspace 复制。
- 安装：官方 App 自带 `resources\runtime\cli\bin\dsh.cmd plugin --profile desktop add <固定tgz>`（进程级 DSH_HOME，cwd=run 根），日志留 `private/plugin-add.log`。**未放置任何 profile MCP companion**（`@deepseek-ai/dsh-mcp-client` 不存在，`manualProfileCompanionPresent=false`）；安装器自动带入的 stock 依赖（zod 4.4.3 等）如实保留。
- profile patch：`openbkn-business-context` baseUrl=https://192.168.50.28、cliPath=任务官方 CLI（openbkn.cmd 绝对路径）、requestTimeoutMs=10000；`{insert:[desktop-observer.mjs]}`；preload-marker.mjs 复制到 run 根（SHA 与 kit 一致 `c48f94a6…`）。

## 三、启动前备份与 CLI 载体探针

- **Before 先于任何 GUI 启动**：完整 HKCU dsh handler 导出+UserChoice 存在性+账号身份记录成功（evidence/system-association/before/）。
- GUI 启动（材料给定 Start-Process 重定向日志形式）：gen1 PID 31624，CIM UTC 创建 `2026-10-29T14:29:22.967Z`，EXE/命令行/子进程留档（results/gui-identity-gen1.txt）；仅进程级 env（DSH_HOME、BKN_CONFIG_DIR=空配置、OPENBKN_AUTO_TASK、OPENBKN_AUTO_INSTALLED），启动前移除 ELECTRON_RUN_AS_NODE/NODE_OPTIONS/BKN_TOKEN/BKN_USER/BKN_PROFILE/BKN_BASE_URL，系统环境未写。
- 欢迎页经官方"添加 API Key→稍后配置"进入，未填写模型凭据。
- **CLI 载体探针 PASS**：`cli-probe-b3f59fcf83bf-private.json` exitCode=0、`preloadMarkerWritten=true`；marker 实测：Node **24.21.0**、execPath=`C:\Users\<account>\scoop\apps\nodejs-lts\current\node.exe`、electron=null、homeIsRealAccount=true、无 "Node.js environment variables are disabled"。见偏差 1。

## 四、受影响登录路径

1. **取消路径 PASS**：发起登录（owned CLI node.exe + 独立授权 Chrome 树出现，进程清单留档）→ 点"取消登录"→ 面板确认"已取消本次登录等待"→ 数秒后 owned CLI/浏览器全部收净（近 1h 无 node/chrome 新进程），父 Desktop 面板可用。未重跑 120 秒矩阵。
2. **真实授权 PASS（第 3 次发起）**：第 2 次发起后用户未在等待窗口内完成授权，面板显示"登录等待已超时。平台授权可能已完成"（按口径用户未完成不算失败；owned 进程收净留档）；刷新状态回未登录态后，经用户指示再发起一次，用户在独立 Chrome 完成授权。未写任何凭据/设备码/token/URL query 入报告；无凭据/证书警告出现。
3. **成功状态与目录 PASS**：面板显示 **"登录并同步成功。"** 及 **"找到 2 个网络"**（worldcup_vega_catalog_bkn、supply_ontology_hand，均"尚未关联本地工作区"）——2 为账号实际权限值，未硬编码。授权完成后 owned CLI/浏览器收净，日常浏览器未动。
4. **观察器 proof PASS**（proof-fa075223….json，授权后自动生成）：三组件 `@openbkn/dsh-business-context{,/business,/diagnostics}` 全部 state=2（active）；实际 Service 类身份 `loadedClassIdentity=true`；版本 `0.2.1-rc.3-openbkn.0.2.1-auto.local.1`、businessSha256 `167e6571…` 与 INPUTS 一致；`packagedMcpRuntimeIdentity=true`（registry 已挂载实例===业务 manager fiber.runtime）；packagedMcpSha256 `41db8cdb31f2f3403eb10e3e42c8114fdb9e54bbc1c76fb6dbdb2c2b931bc22d`（候选包内 lib/platform-mcp-client.js）；无手工 mount/配置 token；authKind=authenticated；platformKind=real-read-only；result=PASS。
5. **重开/重启复用 PASS**：关闭重开面板→"正在连接 OpenBKN…"→直接显示 2 网络目录，无登录按钮/授权窗口/新 owned 进程；gen1 菜单正常退出（ROOT-GONE、无 DeepSeek 残留；exit code 未观测=UNKNOWN）→ 归档 gen1（results/gen1-archive/）→ 同一任务 profile 重启一次（gen2 PID 2320，创建 `2026-10-29T14:55:31.709Z`）→ 欢迎页"稍后配置"进入（无模型凭据时官方正常路径）→ 重开面板直接显示 2 网络目录，**授权持久化确认，无新授权浏览器**（进程清单留档）→ gen2 菜单正常退出（ALL-CLEAN）。gen2 观察器未写新 proof（authorized generation 未变化，无覆盖）。

## 五、恢复与收尾

- **注册表**：After unchanged=**True**（本轮 GUI 运行未改 dsh 关联写点）；Restore 验证通过（"Scoped dsh association restore verified. UserChoice/ACL untouched."）；before/after/restore-check/restored 四相留档 evidence/system-association/。
- 进程/端口：gen1、gen2 均菜单正常退出，owned CLI/浏览器各阶段收净（private/*-procs-*.txt、*-exit-check.txt）。
- 收尾复核：候选 tgz/94/94（安装目录）不变；EXE/ASAR 哈希与启动前一致（stock MCP 未变）；checkout HEAD=bde72dbd、status 干净。
- 保全：旧任务目录、全部新数据（home/cli-config/user-data/日志）、失败原件（第 2 次超时截图/进程清单）保留；无个人状态前置快照，不声称"个人目录逐字节未变"。未推送、未跑 CI、未开 PR、未动 latest；#93/#97/#2573 未动；未跑任何豁免项（旧 Host/npm、完整 UI、语言/800×600、目录绑定、B1/W-LIFE/RDP、重定向/argv/tar、G6/Sandbox/Function/run_code/BOM/CSV、原生溯源）。

## 六、偏差与 UNKNOWN（全部如实记录）

1. **CLI 实际解释器为 scoop Node 24.21.0**（非偏好的任务 Node 24.19.0）：探针 marker 实测 execPath 指向 scoop nodejs-lts。原因：CLI 由 `openbkn.cmd` 按 PATH 解析 node，材料要求保留真实用户环境/PATH，未做进程级 PATH 注入。满足 CLI 下限 `>=22.19.0`；explorer 探针仅记录不判定。任务 Node 24.19.0 用于 verify-inputs/校验脚本。
2. **面板等待文本滞后**：第 3 次授权完成后（观察器 proof 已生成、owned CLI 已退出），面板"正在等待 OpenBKN CLI…"文本滞留超过 5 分钟未翻转（对照：第 2 次尝试同路径约 2 分钟即显示超时）；点击面板 X 后视图刷新，即显示"登录并同步成功。"+2 网络目录。成功文本与目录最终均出现（不判 FAIL），滞留现象留证（gen1-panel-wait-45s/120s.png 序列）；"取消或关闭面板会停止本次等待"口径下关闭面板无副作用，授权未受影响。
3. 第 2 次登录等待超时：用户未在窗口内完成授权，按材料口径不算失败；owned 进程收净留档后经用户指示重试一次成功。
4. run 目录名用 `auto-login-bde72db-run-20261029-1445`（外层任务指令要求以交接提交命名），材料内示例为 `auto-login-93f3e85-<后缀>`；以外层指令为准。
5. gen1/gen2 菜单退出 exit code 未观测（Start-Process 未捕获退出码）=UNKNOWN；进程树收净以 CIM 核实（ROOT-GONE/NO-LEFT）。
6. gen2 重启后欢迎页再次出现（"稍后配置"不持久化完成标记）；属官方路径预期行为，非授权持久化问题（授权由 OpenBKN 面板目录直读证实）。

## 七、回传清单（仅文件名+SHA256；原件留 Windows 任务目录）

见 results/evidence-manifest.json（证据哈希清单）。截图、进程清单、CLI 探针原件、.reg/SID、CLI 配置、Electron user-data 均在 `C:\bkn-verify\auto-login-bde72db-run-20261029-1445\`，未上传。
