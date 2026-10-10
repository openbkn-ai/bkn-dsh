# -9 CLI 体验与验收工具收尾：Mac 实测结果

结论：目录路径提示、主面板设置/安装引导、已保存 CLI 路径提示均已修复。在下载的新 CI 候选上，macOS 官方 npm 与 Desktop 两形态受影响检查通过：安装件各 69/69，一次产品按钮安装真实 SDK 0.1.5，保存并重开提示正确。Desktop 还捕获了安装中关闭并重开后仍安装、持续锁定的状态。本文件保留 Mac 采集窗口及其限制；之后 Windows 已回传同候选的 F90–F97，见 [Windows RESULTS](windows/RESULTS.md)。2026-10-11 证据收尾不改包，PR 合并与主线 build-only 比对已获授权，尚未发布/tag/latest。

## 固定身份与环境

| 项 | 值 |
|---|---|
| 源码 | `6b372ff703d773a4c47ff3cf13972a047fa81ebd` |
| build-only CI | [38058120767](https://github.com/openbkn-ai/bkn-dsh/actions/runs/38058120767)，success / publish=false |
| 版本 | `0.2.0-rc.2-openbkn.0.2.0-9` |
| tgz SHA-256 | `dd2d50a2fdda8e55f1ff355b6121113fc6106aeeb6664463bc218cb9b366c887` |
| 大小 / 文件 | 183344 bytes / 69 files |
| 逐文件清单 SHA-256 | `30948677a13a8bc8b2bd62ffcf60c270e85cc6a379844ddd5ac0a55e656ecdd3` |
| Host | 官方 npm DSH / Desktop 均 `0.2.0-rc.2`；实际路径/版本见 `mac-environment.json` |
| Node / npm / pnpm | 24.19.0 / 11.17.0 / 11.7.0 |
| 隔离 root | `/private/tmp/bkn-cli9-followup-mac/{npm,desktop}` |
| prefix / registry | 各自 `CLI Prefix`（含空格）；`https://registry.npmjs.org/` |
| 平台与凭据 | `http://127.0.0.1:1`，未发起平台登录/模型调用；两隔离 BKN store 终态无文件 |

[manifest](../candidate-manifest.json)、[文件清单](../candidate-files.json)、`candidate-download.json` 与 `ci-run.json` 绑定同一候选。本地包与下载 CI 包的 69 个解包文件逐字节一致；live 接受对象是下载的 CI tgz。旧 `cf591d7` / CI `38028568470` / `de8d2160…` 保存于 `prior/`，不作为新包验收。

本轮环境是显式缺失 fixture：只对 Host 子进程设置 PATH/ZDOTDIR/prefix/cache/DSH_HOME/BKN_CONFIG_DIR，Desktop 额外独立 user-data-dir。未修改用户 PATH、证书或 DSH 运行时。`PNPM_HOME` 沿用进程原值，开测缺失状态与零 install 已实际确认，未借用日常 CLI。npm wrapper 仅记录 install 调用并在真实 npm 前延迟（npm 8 秒、Desktop 60 秒），不生成 bin 或伪造成功。

## 修复及实测

证据归档说明：若干重复 AX 回读保存的是“界面未变化”的增量提示，不是完整可见文案原档。Desktop 的安装中关闭/重开观察来自会话实时 AX，按 [转录证据](UI-OBSERVATIONS-transcribed.md) 标注；原 `.txt` 保留，不把它们冒充完整截图/AX。npm 目录与已保存终态有实际产品截图，已查看。解锁后另启动同隔离 Desktop，补采 `desktop-directory-full-ax.txt` 与 `desktop-ready-saved-full-ax.txt`，均为关闭增量模式的完整终态；补采没有重新安装或保存，install 仍为 1、patch 字节不变（`desktop-recapture-check.json`）。

| 项 | npm | Desktop | 证据（相对本目录） |
|---|---|---|---|
| 安装件身份 | 69/69，缺失/差异/额外全空 | 69/69，缺失/差异/额外全空 | `*-installed-identity.json` |
| 目录路径 | 38 个逐字符回读均聚焦、可编辑；现有目录显示“此路径是目录，请填写 CLI 可执行文件的路径。” | 原生 setValue 输入现有目录，得到相同提示 | `npm-directory-typing.json`、`npm-directory.png`、`desktop-directory-full-ax.txt` |
| 目录不可安装 | 点检测/安装后 install=0、SDK 不存在 | 点检测/安装后 install=0、SDK 不存在 | `*-directory-no-install.json` |
| 主面板缺失引导 | 设置→高级设置→检测并安装 CLI，提示该处查看安装进度 | 相同引导；安装中返回主面板仍引导到该处 | npm AX；`UI-OBSERVATIONS-transcribed.md`（Desktop 转录） |
| 真实安装 | 一次实际 npm install，固定 SDK 0.1.5、含空格 prefix；独立 --version exit 0 | 相同 | `*-final-cli-check.json`、`*-npm-wrapper.py` |
| 安装锁/重开 | 捕获 installing 与路径锁；关闭/重开的时点未证明仍在安装，不能计入该瞬间验收 | 安装中关闭、主面板→设置→高级设置，仍 installing，路径/保存均禁用 | `npm-installing.txt`、`UI-OBSERVATIONS-transcribed.md`（Desktop 转录）及重复 AX 回读 |
| 保存前提示 | 自动填入新绝对路径并要求保存 | 相同 | npm AX；Desktop 转录 |
| 保存后重开 | 显示保存的路径，仅“CLI 0.1.5 可用。”，无重复保存提示 | 相同 | `npm-ready-saved.txt/png`、`desktop-ready-saved-full-ax.txt` |
| 登录边界 | 保存后显示 CLI 登录入口；BKN store 为空 | 相同 | Desktop 转录及 `*-final-cli-check.json` |
| 收尾 | PID/创建时间/exe/listener 匹配后停止；所列树与端口清空 | 包括初始化 Host，均保留停止记录 | `*-owned-stop.json`、`desktop-initialization-stop.json`、`desktop-recapture-stop.json`、`*-process-history.jsonl` |
| 选定日常状态 | 两形态共用开测 before；最终 10/10 内容哈希一致 | 同一采集窗口 | `daily-before.json`、`daily-after.json` |

安装调用记录与产品 ready 状态、独立实际 bin 输出共同证明真实安装；本轮没有独立归档 npm installer stdout/exit，不把 UI 当安装器原生输出。Desktop 的目录输入不计作逐字符完整字符串证明，该证明来自 npm。未声称两形态全量 C90–C99 重跑；未重做鉴权失败、模型、平台故障、权限/TLS fixture 或升级。

## 验收工具与旧 Windows 证据

- canonical verifier 的 PS5.1 数组计数补括号；候选清单用 `.gitattributes -text` 保存不可转换字节。`crlf-checkout-oracle.json` 实际启用 `core.autocrlf=true`、提交、删除、checkout，输入/checkout/Git blob 均为当前清单 `30948677…`。这不能替代 Windows 原生 PowerShell 执行。
- canonical `stop-owned-host.ps1` 对 PID、创建时间、exe、非空已记录 listener 全匹配才停止，停止后仍有记录内进程/监听也报失败。后续 Windows F97 已原生验证错误/空 listener 拒绝与有效记录停止，不能将其归入此前 Mac 采集窗口。
- [旧 Windows 回传复核](WINDOWS-REVIEW.md) 固定 `a2504c54dbd3855b53dd2e13c568f565ba4c04aa`。它是旧候选 C90–C99 的历史基线，不是新包结果。1157 条选定文件记录与列出的摘要前后一致；环境变量名称摘要不证明全部值。observer 原件 CRLF 与 Git LF 分列，不写成逐字节一致。历史停止 helper 的 listener 告警不当作拒绝证明。
- Windows C98 既有鉴权失败保持未构造，单测不替代现场；本轮无需平台/模型凭据。Desktop 旧测试 Key 来源未定责，持有人表示会撤销，未收到完成确认；属于宿主/持有人处理，不扩大 -9。

## 验证、评审与执行偏差

- 插件 **414（413 pass / 0 fail / 1 既有 skip）**；仓库 **60/60**；typecheck/package:check/diff-check/pack 均 exit 0，原生输出与命令在 `local-checks.json` 及各日志。
- 本地使用已安装依赖，并关闭 pnpm run 的自动重装检查；未修改 workspace override/锁文件。干净 build-only CI 成功，不依赖该本地措施。文档更新后另跑 release-notes 检查，6/6 通过（`release-notes-tests.txt`）。
- `6b372ff` 的源码评审 APPROVED，唯一非阻塞提醒是验收仍绑定旧包；本报告、新 manifest 与 Windows handoff 关闭该身份缺口。后续文件只在仓库，不进 tgz。
- Desktop helper 两次试用 CLI 管理 desktop profile，被官方 CLI 正确拒绝（exit 1）；初始化不能解除这一宿主限制。失败输出保留，最终通过官方 Desktop 插件管理器安装/启用，不把失败计入通过。
- 完整 AX 补采曾在重置编号后使用旧元素 id，被操作接口拒绝；刷新编号后补采成功，没有保存目录草稿或重装 SDK。桌面欢迎页重现仍按“稍后配置”进入，不调查宿主根因。
- 浏览器定位“设置”首次命中两个按钮；改用插件 dialog 范围。一次等待使用了错误文案，未匹配，实际 UI 文案回读后按产品操作继续。没有修改页面、Host 运行时或候选来规避。

`upstream-refresh.json` 已刷新 DSH/Foundry/SDK：列出的 Foundry/SDK 新提交涉及资源/图形能力，未改变本轮固定 SDK 安装/CLI 路径边界；不升级支持版本，不用 main 的源码推断部署或授权行为。

本轮新增/更新文件的凭据模式扫描见 `credential-scan.json`，两张产品截图已查看。提交后实际读 Git blob 与当前原件字节比对，结果见 `git-blob-consistency.json`；证明文件不自引用，目标为首个交付提交，随后只增加该证明文件。

Windows 已按 [WINDOWS-FOLLOWUP.md](../../../handoff/2026-10-10-cli-setup9/WINDOWS-FOLLOWUP.md) 完成 F90–F97；剩余任务仅为 [来源/字节补证](../../../handoff/2026-10-10-cli-setup9/WINDOWS-EVIDENCE-CLOSEOUT.md)，不再重跑矩阵。Mac 本轮测试 Host 已停止，私有 launch 日志留在本机；隔离 SDK/prefix/cache/profile 保留复核。10/10 仅指列明文件，不延伸到整个用户目录或全机器状态。
