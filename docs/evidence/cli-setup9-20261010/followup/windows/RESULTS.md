# -9 CLI 收尾：Windows 受影响复测结果

交接完整 commit：`9f77446ff4a70731773ab96535cb6f892db3b84a`。执行时间（UTC）：2026-10-10 15:05 – 15:35。

source `6b372ff703d773a4c47ff3cf13972a047fa81ebd` / CI `38058120767` / 版本 `0.2.0-rc.2-openbkn.0.2.0-9` / tgz SHA `dd2d50a2fdda8e55f1ff355b6121113fc6106aeeb6664463bc218cb9b366c887` / 183344 bytes / 69 files。

结论：F90–F97 在 Desktop 与 npm 两形态均通过。无候选缺陷。环境/宿主偏差 1 项：Desktop 插件管理器首次卸载 pnpm `EPERM rename pnpm-lock.yaml`（宿主/环境层，重试成功，见偏差 V1）。C90–C99 旧结果见 `a2504c5`（`docs/evidence/cli-setup9-20261010/windows/`，候选 cf591d7），本轮不是全矩阵重跑。本轮不发布。

## 环境与固定输入

| 项 | 实际值 / 原件 |
|---|---|
| OS / 架构 / PowerShell / Node / npm | Windows 10 Pro 10.0.19045 x64 / Windows PowerShell 5.1.19041.5848 / node v24.21.0 / npm 11.19.0（`evidence/npm-preflight.txt`, `evidence/desktop-preflight.txt`，均 exit 0） |
| Desktop / npm DSH 实际路径与版本 | Desktop `C:\Users\kalia\AppData\Local\Programs\DeepSeek Harness\DeepSeek Harness.exe` FileVersion 0.2.0-rc.2，启动参数 `--user-data-dir=C:\bkn-verify\cli9f\desktop\electron-user-data`；npm `C:\Users\kalia\scoop\apps\nodejs-lts\current\node.exe C:\bkn-verify\diag6-tools\node_modules\@deepseek-ai\dsh\lib\bin.js web --port 18607 --no-open`（dsh 0.2.0-rc.2）。每个 Host 的 pid/createdUtc/exe/argv/listeners/env 见 `evidence/f9-*-host.json` |
| 两隔离 root / prefix（含空格）/ registry / PATH fixture | root `C:\bkn-verify\cli9f\npm`、`C:\bkn-verify\cli9f\desktop`；`DSH_HOME=<root>\dsh-home`，空 `BKN_CONFIG_DIR`，`npm_config_prefix=<root>\CLI Prefix`，`npm_config_cache=<root>\npm-cache`，环境 fixture `APPDATA=<root>\AppData`，移除 `PNPM_HOME`。registry `https://registry.npmjs.org/`（无凭据）。PATH：`fixture` = `C:\bkn-verify\cli9f\fixtures\bin` + Windows 目录 + scoop `nodejs-lts\current`；`missing` 去掉 fixture 目录。插件装/卸轮另加 scoop `current\bin`（pnpm，与日常 openbkn 同目录），见偏差 V2。npm/node fixture 只拦截 `npm install`（delay 60 s 后转真实 npm）与 `node --version`，校验见 `evidence/fixture-validation.txt` |
| 原生 verifier / 独立 exit / 清单完整 SHA | canonical `docs/handoff/2026-10-10-cli-setup9/verify-candidate.ps1`，CRLF 默认 checkout（`core.autocrlf=true`），`git check-attr text -- candidate-files.json` = `unset`；checkout 文件 SHA `30948677a13a8bc8b2bd62ffcf60c270e85cc6a379844ddd5ac0a55e656ecdd3` = manifest。独立 PS5.1 子进程，`*>` 全流 `verifier/verify-native.txt`（UTF-16 原件），`$LASTEXITCODE` → `verifier/verify-native-exit.txt` = **0**，69/69。包装脚本 `verifier/run-canonical-verify.ps1`（仅设置 Windows PATH 与工作目录，不改脚本） |
| 两形态安装件（69/69，missing/different/extra） | npm `evidence/npm-installed-verify.txt`、Desktop `evidence/desktop-installed-verify.txt`：canonical verifier `-InstalledPackagePath`，各 exit 0，expected 69 / matched 69，missing/different/extra 全空 |
| 开测 before 清单与范围 | `evidence/daily-before.json`（开测前重采，15:07Z）：同上一轮 1157 路径清单（first-use8 列表 + 日常 scoop `openbkn*` + 日常 bkn-sdk 全部文件）+ user/machine PATH 摘要 + HKCU 环境变量名摘要 + `%APPDATA%\npm` 列表 + 日常 SDK 0.1.5；与上一轮 after 完全一致 |

## 逐项结果

| ID | Desktop | npm | 输入 / 证据路径 / 未测边界 |
|---|---|---|---|
| F90 身份 | 通过 | 通过 | tgz SHA/字节与通知、manifest 一致；canonical verifier exit 0；安装件 69/69 全空。Desktop 经插件管理器 `添加插件` 输入本地 tgz 路径 → 已安装 → 立即启用；npm `dsh plugin install --profile web <tgz>`（`evidence/npm-plugin-install.txt`） |
| F91 目录与逐字输入 | 通过 | 通过 | npm：CDP 每字符一个 type 事件；Desktop：computer-use 系统级逐键。盘根 `C:\`、测试 root（npm `C:\bkn-verify\cli9f\npm`，Desktop `C:\bkn-verify\cli9f\desktop`）、带空格目录 `...\CLI Prefix` 均显示 `此路径是目录，请填写 CLI 可执行文件的路径。`；中间态里所有已存在目录都是目录提示，不存在的为 `未找到此路径…`（旧 O1 已修正）。目录态点 `检测并安装 CLI`：calls.log 无任何 npm/node 调用、无安装、prefix 指纹不变。随后逐字补全 `\openbkn.cmd` → `CLI 0.1.5 可用。`。输入期间 focusLoss 0、disabled 0（npm 31 次状态变化，Desktop 72 次；`observer-npm-r1.json`、`observer-desktop-r1.json`）。canInstall 以“不执行目录、点击不安装”判定；按钮本身仍显示（UI 未隐藏），记为观察 |
| F92 缺失主面板引导 | 通过 | 通过 | 缺 CLI 隔离环境，cliPath 默认 `openbkn`，只填 baseUrl `https://192.168.50.28` 后保存。主面板（npm DOM 原文 / Desktop observer DOM 原文 + 截图）：`设置已保存。当前 DSH 尚无法使用 OpenBKN CLI。请点击右上角“设置”→“高级设置”，使用“检测并安装 CLI”。若安装已启动，可在该处查看进度；安装完成后保存路径，再点击“使用 OpenBKN CLI 登录并同步”。已有 CLI 也可直接填写其可执行文件的绝对路径（Windows 上通常为 openbkn.cmd）。`；`重试` 后同文案去掉前缀。不再只引导手动 npm。失败在本地发生，未用平台凭据、未点登录 |
| F93 一次真实安装与安装中重开锁定 | 通过 | 通过 | 空 prefix，fixture delay 60 s 后转真实 npm。双击 → 每 Host `argv=install` 恰 1 次（`fixtures/calls.log`，含 `--prefix "...\CLI Prefix" --ignore-scripts --no-audit --no-fund --loglevel=error`）。预检与安装中 input/save 均锁（observer dis=true/save=dis），安装中键入 `x` 未进入。关面板后 fixture/npm 子进程仍存活（npm cmd 25560，Desktop cmd 26148）。返回主面板显示上述“设置→高级设置…可在该处查看进度”。再进高级设置：`正在安装 CLI 0.1.5 并验证是否可用…可以关闭面板，安装将在当前 DSH 中继续。 安装中…`；npm 15:11:38→15:12:11、Desktop 15:24:40→15:25:47 期间 observer **无任何状态变化**（轮询不解锁）。完成后自动填入 `<root>\CLI Prefix\openbkn.cmd` + `CLI 0.1.5 可用。路径已填入，请点击“保存并继续”应用。`。独立 `openbkn.cmd --version` → 0.1.5 exit 0（`npm-f93-version.txt`、`desktop-f93-version.txt`）；tree sha 5204d50c…，1120 files |
| F94 已保存提示 / patch 字段与哈希 | 通过 | 通过 | npm：保存前 `npm-patch-before-f94.yml` sha 70365aed… 489 B → 保存后 `npm-patch-after-f94.yml` 97adb450bdb47c475e586d6e8ebb430b58afe106c4ad08439186f35767e023d7 528 B。Desktop：`desktop-patch-before-f94.yml` 365d0e98… 360 B → `desktop-patch-after-f94.yml` d4f0bfe5968a128e54a140a542cdc68bf8f98bacd2ce21f6f6047ba26026b09c 403 B。两形态 diff 只有 `cliPath: openbkn` → `<root>\CLI Prefix\openbkn.cmd` 一行（判定只针对 cliPath）。关闭/重开设置 → 只显示 `CLI 0.1.5 可用。`（npm `[role=status]`，Desktop observer + 截图），不再要求保存 |
| F95 登录边界 / 卸载保留 SDK与patch | 通过（首次卸载宿主 EPERM，重试成功，见 V1） | 通过 | 诊断 UI 导出（npm fb55a24c / Desktop 1cb34f50）：observed:cli pass（recovered:true，lastFailureCode cli-missing）+ observed:login-state not-logged-in → CLI 可执行≠已登录；页面无授权/模型操作。卸载紧邻前后：npm `f95-npm-uninstall-before/after.txt`、Desktop `f95-desktop-uninstall-before/after/after-retry.txt`；patch 哈希不变（npm 97adb450…，Desktop d4f0bfe5…，cliPath/baseUrl 保留），SDK tree 5204d50c… / newest mtime 不变，`--version` 0.1.5。npm 卸载后新 Host：页面无 OpenBKN 按钮/文本；Desktop 重试后插件列表中三 row 与侧栏入口消失 |
| F96 PS5.1 canonical verifier 与 CRLF | 通过 | 通过 | 见“环境”表：canonical 脚本、原生 CRLF checkout、PS5.1，一次 exit 0，无 SHA/count 错误，无失败尝试；安装件核验两形态 exit 0 |
| F97 listener 错误/空记录拒绝及实际停止 | 通过 | 通过 | canonical `stop-owned-host.ps1`，独立子进程（`scripts/f97-run.ps1`）。副本只改 listeners：错误端口（npm 18699 / Desktop 19399，均无人监听）与 `listeners=[]` → `IDENTITY MISMATCH - refusing to stop`，外层 exit 1，前后快照 Host 存活、监听仍在。原件 → 四项匹配后停止，exit 0，`remainingTreeProcs=0 recordedPortsStillListening=0`，after 快照无进程无监听。全部 record/内部 Log/外层全流/exit/快照在 `f97/`（npm 23764，Desktop 26272）。其余 Host 也均用 canonical 原件停止（见收尾） |

C98 既有 CLI/auth 失败保留：有自然 CLI 失败输入——本轮缺 CLI 阶段产生的 `cli-missing` 失败，在安装成功后诊断仍保留 `recovered:true, lastFailureCode:"cli-missing", failureCount:3(npm)/2(Desktop)`，未被清除（`OpenBKN-diagnostic-*-f95-*.json`）。auth 失败保留：无自然输入，保持未构造，未借凭据。

## 证据来源与字节对照

来源标注：`OpenBKN-diagnostic-*.json` = 产品诊断 UI 导出（npm 浏览器下载 / Desktop 保存对话框）；`observer-*.json` = 合成 DOM observer（npm 页面 JS / Desktop DevTools 注入），非产品输出；`*-host.json`、`f97/*` = 启动/停止 helper 原件；`fixtures/calls.log`、`*-installed-verify.txt`、`verifier/*`、`npm-plugin-*.txt`、`*-f93-version.txt` = native 输出；`f91-npm.txt`、`f92-npm.txt`、`f93-npm.txt`、`f94-npm.txt`、`f95-*.txt` 案例文件（Desktop 案例记录直接写在本文件表格中） = 操作员记录（DOM 原文或截图转录，文中注明）；`*patch*.yml` = 实际 patch 文件拷贝。下载原件名、字节、完整 SHA-256 见 `evidence/reports.txt`。

Git blob 对照（交接 9f77446，真实读取 `git cat-file`）：`candidate-files.json` blob = 工作区文件逐字节一致（`-text`，SHA 30948677…）；`candidate-manifest.json`、`verify-candidate.ps1`、`stop-owned-host.ps1` 工作区为 CRLF checkout，去 CR 后与 LF blob 一致（换行归一一致，非逐字节一致；见 `evidence/git-blob-compare.txt`）；verifier 直接在该 checkout 上运行。本目录推送文件按 Git 默认换行策略入库（文本 LF blob，UTF-16 verifier 原件按二进制），不再单列自身哈希。

## 偏差 / 收尾 / 剩余项

偏差：
- V1（Desktop 宿主/环境）15:32:05Z 插件管理器首次 `卸载`：pnpm 日志 `[EPERM] EPERM: operation not permitted, rename '...\profiles\desktop\pnpm-lock.yaml.899940889' -> '...\pnpm-lock.yaml'`，界面短暂 toast“卸载失败…”，组件变“已停用”、侧栏入口消失，但依赖与插件文件仍在、`package.json` 哈希变化（4e20aba1… → daa2ebf1…，内容仍含依赖；未保留卸载前 package.json 原文，无法逐字 diff）。原件 `evidence/f95-desktop-attempt1/`。15:33Z 同 UI 重试成功（`f95-desktop-attempt2-operation-BIihHW/`）。本机运行 360 常驻进程（360tray、ZhuDongFangYu），未证实为占用者，不作根因结论。属 DSH 插件管理器/pnpm 在 Windows 的 rename 竞争，不属本候选。上一轮（a2504c5）同操作一次成功。
- V2 插件装卸轮（Desktop r0/r2、npm CLI）PATH 加 scoop `current\bin` 供 pnpm，该目录含日常 openbkn；这些轮未打开 OpenBKN 面板/未做 CLI 检测。
- V3 WeType 输入法在每个新 Desktop 进程默认中文：首次 `shift+semicolon`/`backslash` 产生 `：`/`、`（observer 15:27:20Z 可见），Shift 切英文后清空重输；npm 首次点击添加插件时点到对话框外，重做。
- V4 Desktop 中 DevTools `allow pasting` 首次输入早于警告出现，被当作 JS 报 SyntaxError，随后按提示重输。

Host 与停止（全部经 canonical `stop-owned-host.ps1` 原件停止，exit 0，`remainingTreeProcs=0 recordedPortsStillListening=0`；无自退出 Host）：npm 23764（15:08:21Z，listener 127.0.0.1:18607）、npm 25012（15:18:18Z，18607）；Desktop 14852（15:19:23Z，19387/子 23756）、26272（15:21:59Z，19387/子 24928）、25216（15:31:06Z，19387/子 4580）。内部 Log、外层全流、exit、前后快照：`f97/*-original-*`。

after：`evidence/daily-after.json` 同清单，与 before 记录与全部摘要一致（不延伸为整机未改动）。终态：无 DeepSeek Harness / dsh bin.js 进程，18607/19387 无监听。隔离 prefix 中 SDK 保留（预期）。Desktop 隔离 `.credentials.yaml` 本轮无 `DEEPSEEK_API_KEY` 引用；本轮未打开模型设置、未调用模型、未输出 Key。

未运行项：auth 失败保留（无自然输入）；真实非 fixture 的权限/网络/证书失败（不在本轮范围）。

仅本机保留：含 launch token 的启动日志、`dsh-home`（含 credentials）、Electron user-data。测试 Key 撤销与 Desktop 凭据隔离属外部状态，本轮未借用。

回传独立证据分支 `docs/cli-setup9-followup-windows-results`；不改候选/helper/源码/main，不发布、不打 tag。
