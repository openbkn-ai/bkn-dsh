# -9 CLI 检测与安装：Windows 独立复测交接

当前固定输入已切换至 Windows 反馈收尾后的新候选。Windows 本轮执行 [WINDOWS-FOLLOWUP.md](WINDOWS-FOLLOWUP.md) 的 F90–F97；下方 C90–C99 是完整基线协议，已在旧 `cf591d7` 候选上完成，不要求本轮无条件全矩阵重跑。

只验证本轮 CLI 检测、显式安装和状态提示。不要扩展到平台语义、模型答复、Token 续期、历史故障或旧版升级；不发布、不打 tag、不改 main。候选尚未发布，因此复测必须使用固定 CI tgz，不能用 npm latest 替代。

## 固定输入

| 项 | 固定值 |
|---|---|
| 仓库/分支 | `openbkn-ai/bkn-dsh` / `feat/cli-setup-9` |
| 源码 | `6b372ff703d773a4c47ff3cf13972a047fa81ebd` |
| 插件 | `0.2.0-rc.2-openbkn.0.2.0-9` |
| build-only CI | [38058120767](https://github.com/openbkn-ai/bkn-dsh/actions/runs/38058120767)，`publish=false` |
| tgz/完整 SHA/字节/文件数 | 以本交接提交的 [candidate-manifest.json](../../evidence/cli-setup9-20261010/candidate-manifest.json) 为准 |
| 逐文件清单 | [candidate-files.json](../../evidence/cli-setup9-20261010/candidate-files.json)，清单 SHA 同上 |
| Host | 官方 Desktop + 官方 npm DSH `0.2.0-rc.2`；记录实际可执行文件与版本 |
| 安装目标 | 已发布的 `@openbkn/bkn-sdk@0.1.5`，不是 SDK main 或 latest |
| Node | `^22.19.0 || >=24.0.0`；Node 23 明确拒绝自动安装 |

以通知给出的完整**交接 commit**创建独立 worktree。源码 commit 与交接 commit 不同：后者只增加验收/交接文件，不改变包内容。首轮 `0a2278d` / CI `38020188895`、评审前 `e669bd6` / CI `38023447204` 与首次评审后 `cf591d7` / CI `38028568470` 均为历史候选，不能用于本轮终验。评审修复改了包内源码，必须下载本表的新 CI 包；沿用旧包的结果需标为历史。

```powershell
git fetch origin
git worktree add -b docs/cli-setup9-followup-windows-results C:\bkn-verify\cli9-followup-results-wt <handoff-commit>
Set-Location C:\bkn-verify\cli9-followup-results-wt
New-Item -ItemType Directory -Force C:\bkn-verify\cli9-followup-candidate | Out-Null
gh run download 38058120767 --repo openbkn-ai/bkn-dsh --name plugin-tarball --dir C:\bkn-verify\cli9-followup-candidate
$taskTgz = 'C:\bkn-verify\cli9-followup-candidate\openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-9.tgz'
# 独立子进程，保存全流与独立退出码；避免外层 Stop 吞掉 native stderr。
& powershell -NoProfile -ExecutionPolicy Bypass -File .\docs\handoff\2026-10-10-cli-setup9\verify-candidate.ps1 -Tarball $taskTgz *> C:\bkn-verify\cli9-followup-candidate\verify-native.txt
$taskVerifyExit = $LASTEXITCODE
$taskVerifyExit | Set-Content C:\bkn-verify\cli9-followup-candidate\verify-exit.txt
if ($taskVerifyExit -ne 0) { throw 'Candidate verification failed' }
```

`verify-candidate.ps1` 已纳入 PS5.1 数组计数括号修正，清单 -text 的 CRLF checkout oracle 已在 Mac 执行；**本轮 canonical verifier 尚未在 Windows 原生执行**。Windows 有脚本错误时保留原件、失败输出和最小修正 diff，不修改候选、身份或清单来让检查通过。

## 隔离与启动

先采集选定日常 profile、CLI package/bin 和用户 PATH 的 before 内容哈希/值摘要。不要借用、删除、覆盖或升级用户日常 CLI/store。不要给插件管理员权限，不修改系统 PATH、registry、证书信任或 Node 安装。

两形态各用独立 root，npm prefix **必须包含空格**，例如 `C:\bkn-verify\cli9\npm\CLI Prefix`、`...\desktop\CLI Prefix`。只在启动测试 Host 的子进程中设置：

- `DSH_HOME=<root>\dsh-home`；`BKN_CONFIG_DIR=<root>\bkn-config`（空目录，不复制 Token）。
- `npm_config_prefix=<root>\CLI Prefix`；`npm_config_cache=<root>\npm-cache`。
- “确实缺失”轮的 PATH 只保留真实 Node/npm 工具目录和 Windows 必需目录，不包含已有 `openbkn.cmd`；`PNPM_HOME` 不指向日常 CLI。
- Windows 探测还会检查 `%APPDATA%\npm`。若那里有日常 CLI，应先做只读复用轮；缺失/安装轮对测试进程设置独立 `APPDATA=<root>\AppData`，记录这一**环境 fixture**，避免误用日常 SDK。不要修改用户环境变量。Desktop 同时指定独立 Electron user-data-dir，确认窗口属于本轮 PID。
- npm prefix/cache/registry 由真实 npm 读取；记录有效 registry。不得关闭 TLS 校验，不在报告中收录带凭据 registry URL。

先独立执行 `node --version`、`npm --version`、`npm prefix --global`，留存命令、时间、退出码和原生输出。确认 prefix 是本轮目录，插件安装前那里没有 SDK/bin。DSH 内部能解析/执行哪个 npm 才是验收对象，终端能运行不代表 Host 能运行。

插件安装沿用 DSH 原生能力：npm 形态 `dsh plugin install --profile web <tgz>`；Desktop 用隔离窗口的插件管理器安装同一 tgz 并启用。不要用 CLI 强行管理 desktop profile。可使用已有**经四项身份核验**的启动/停止 helper，但需记录本轮执行文件路径、SHA、参数和版本；旧 helper 里的候选版本/故障变体不能照搬。

每次安装后对实际 `node_modules\@openbkn\dsh-business-context` 再调用 verifier 的 `-InstalledPackagePath`，应为 **69/69 + missing/different/extra 全空**（文件数以最终 manifest 为准）。默认不要求登录、平台或模型 Key。C99 与 C91/C92/C93 共用同一安装轮，避免为别名额外安装一份 SDK。

## 必测矩阵（Desktop / npm 各跑一遍）

| ID | 操作 | 通过条件 |
|---|---|---|
| C90 身份/入口 | 固定包安装、启用、打开 OpenBKN → 设置 → 高级设置 | 三入口保持可用；只有一个侧栏 OpenBKN 入口；显示 CLI 检测状态；安装件逐文件一致 |
| C91 缺失只读 | `cliPath=openbkn`；打开高级设置，等待检测终态，不点安装 | 明确“未检测到”；没有 SDK 文件产生、没有 npm install；不直接判定为“用户从未安装” |
| C92 真实安装 | 点击“检测并安装 CLI” | 固定 SDK 0.1.5 安装至隔离 prefix；显示检测/安装/可用；实际 `<prefix>\openbkn.cmd --version` exit 0 / 0.1.5；路径填入草稿，**保存后**持久化；无假进度或假成功 |
| C93 PATH 之外与复用 | 先保持 prefix 不在 Host PATH 再检测；再重启测试 Host，把已有 prefix 加入其 PATH | 两轮都找到并使用已有 CLI，不再安装、不升级；若能直接执行，填入路径并保存即可，不强制重启 |
| C94 自定义路径与逐字输入 | 用真实逐字键盘输入不存在的绝对路径（不可只用 fill/setValue 整串），保留前两个字符和完整路径的焦点/值；点击检测；再逐字恢复真实 cmd 路径 | 自动只读检测期间不禁用路径框、不失焦、不吞字；自定义失败提示明确，绝不安装/覆盖；恢复可用，无旧提示残留；空格路径真实执行成功 |
| C95 前置条件 | 独立 fixture：找不到 npm；不支持的 Node（含 23） | 明确环境提示，安装未启动；不自行安装 Node，不提权，不改 PATH。Node 版本 fixture 可只拦截 `--version`，不得冒充真实安装 |
| C96 安装失败 | 独立新 prefix，npm 安装子命令受控返回 EACCES、ECONNRESET、证书码；退出 0 但不生成可用 bin | 权限/网络/证书/验证失败各有明确提示；没有 ready 假成功；raw stderr canary 不进 UI/JSON。这是受控故障，不计为真实 OS/network 失效 |
| C97 面板生命周期与输入锁定 | 真实 npm 安装前加可记录的短延迟；检查显式安装前检测及安装中路径框/保存按钮锁定；连续点击、关面板、重开高级设置 | 每 Host 只有一次 install；显式操作期间不能改写草稿路径，轮询不暂时解锁；关面板不杀 npm；重开看到已有安装/终态；最后真实 CLI 验证。若错过 installing 阶段，记未捕获，不补造 |
| C98 状态/配置边界 | 保存路径、关面板重开；查看诊断；卸载插件 | 保存仍由 DSH ConfigEditor；CLI 可执行≠已登录；检测不清除旧 auth/CLI 失败；不发起授权、模型请求。插件卸载不卸载独立 SDK；本轮 prefix 保留作证，不动日常 CLI |
| C99 Windows 默认命令别名 | C91 先确认 openbkn 缺失，再逐字改为 openbkn.cmd 并检查；C92 使用该别名点击安装；已安装后再检测别名 | 缺失时是 missing/canInstall=true，显式安装成功；安装后复用同一 prefix，不增加 install；不存在的绝对 .cmd 路径仍不可自动安装 |

CLI 安装耗时限 180 秒（加 subprocess 清理余量），只读单命令限 5 秒/整体检测 25 秒。失败输出由 Host 投影到受控原因，Client 不接收 npm 原文。不要把“重启后可能可用”写成已证实 PATH 根因。

C95/C96/C97 fixture 在**本轮独立测试目录**编写，保留原文件/改动 diff/前置条件/真实调用路径。只拦截明确子命令，其余交给真实 Node/npm。必须先证明 helper 可区分 `npm.cmd` 与真实 Node npm-cli；**不能绕过 DSH subprocess 来算产品通过**。如 native `.cmd`/空格路径执行失败，立即保存产品错误和真实调用，定为候选缺陷，不做 helper 规避。

C98 鉴权失败“不被清除”已由单测覆盖；现场没有既有失败输入则如实记未构造，禁止用伪凭据误触平台。缺平台/模型不影响 C90–C97，不扩展登录测试。

## 证据与收尾

本轮用 [FOLLOWUP-RESULTS-template.md](FOLLOWUP-RESULTS-template.md)，结果放 `docs/evidence/cli-setup9-20261010/followup/windows/`；旧轮模板和结果保持历史。每轮记录 UTC 时间、Host PID/创建时间/exe/listener、启动/fixture完整参数、场景/输入、产品 UI 原文或截图、实际安装 prefix、CLI/SDK 版本、原生输出与独立退出码。诊断 UI 导出件和 Host API 件分开标注；不得把人工转录写成机器原件。

停止前归档 parent/child PID 原件及四项核验输出，不能消费后删除唯一记录。只停止本轮身份匹配的 PID；复用或创建时间/exe/listener 不符时拒绝停止，重新人工核验。收尾检查本轮进程/端口为零，日常状态按同一路径清单作 after 哈希；不宣称整个机器零进程。SDK 保留在独立 prefix 属预期，不随插件卸载。

下载原件/日志逐件完整 SHA-256；仓库 Git blob 必须真实读取比较。字节一致、换行归一一致、原件已清除分别列明。保留报告计数与场景时间关系；未采集的历史 stdout 不补造。

推送前扫描整个新增 diff 的真实凭据，包含 launch token、Authorization、API Key、密码、带凭据 registry URL。测试 canary 标注清楚，真实凭据不推送。回传独立证据分支、完整 commit、两形态矩阵、候选缺陷、执行偏差、not-run 和清理结论；不要推进本任务源码分支或 main。等待主开发复核后才讨论发布。
