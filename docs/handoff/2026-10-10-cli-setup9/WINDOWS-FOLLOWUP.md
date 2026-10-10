# -9 CLI 体验收尾：Windows 受影响复测

本轮仅补目录路径分类、主面板 CLI 设置/安装进度指引、已保存路径提示，以及验收工具。不要扩展模型、平台语义、Token 管理、旧版本升级或 Desktop 凭据隔离修复。按此通知给出的完整交接 commit 建独立 worktree；不改源码/main，不发布/tag/dist-tag。

## 固定候选

- source：`6b372ff703d773a4c47ff3cf13972a047fa81ebd`。
- 版本：`0.2.0-rc.2-openbkn.0.2.0-9`。
- build-only CI：[38058120767](https://github.com/openbkn-ai/bkn-dsh/actions/runs/38058120767)，`publish=false`。
- 本交接提交中的 [candidate-manifest.json](../../evidence/cli-setup9-20261010/candidate-manifest.json) 锁定完整 tgz SHA、字节、文件数、清单 SHA；[candidate-files.json](../../evidence/cli-setup9-20261010/candidate-files.json) 是不可换行转换的哈希输入。
- 官方 Desktop 与 npm DSH `0.2.0-rc.2`；SDK 安装固定 `@openbkn/bkn-sdk@0.1.5`；Node 使用受支持的 22.19+ 或 24+，拒绝 Node 23。
- 旧 CI `38028568470` / tgz `de8d2160…` 仅是 C90–C99 历史基线，不能用于本轮实测。旧平台/模型账号及测试 Key 不需要，也禁止借用。

下载到全新的 `C:\bkn-verify\cli9-followup-candidate`，防止同名 -9 tgz 混淆。取包、建 worktree 的格式沿用 [HANDOFF.md](HANDOFF.md)，CI ID 换为上表。所有脚本用独立 PowerShell 子进程；外层 `*>` 捕获全流，调用后立即保存 `$LASTEXITCODE`。原生输出、内部记录和退出码用不同文件名。

当前 tgz 完整 SHA-256 是 `dd2d50a2fdda8e55f1ff355b6121113fc6106aeeb6664463bc218cb9b366c887`，183344 bytes / 69 files；清单 SHA-256 是 `30948677a13a8bc8b2bd62ffcf60c270e85cc6a379844ddd5ac0a55e656ecdd3`。本通知与 manifest 不一致时停止并回报，不自行挑选其他同版本包。

Mac 结果在 [followup/RESULTS.md](../../evidence/cli-setup9-20261010/followup/RESULTS.md)：两形态目录拒绝、一次真实安装、保存前后提示通过；Desktop 安装中重开仍锁定已捕获。Windows 仍需本轮原生执行，不能沿用 Mac 结论。

## 开始前

1. 在新采集窗口做日常文件/PATH/环境摘要 before；沿用旧清单时仍须开测前重采。先保存既有证据，不覆盖历史记录。
2. 保留 `core.autocrlf=true` 的原生 checkout 场景，确认 `git check-attr text -- docs/evidence/cli-setup9-20261010/candidate-files.json` 是 `unset`。不得改 SHA 或把文件转 LF 来绕过本轮 verifier。
3. 使用仓库 canonical `verify-candidate.ps1`，不使用改过的脚本副本。PS5.1 应原生 exit 0，文件计数等于 manifest；两形态安装后逐文件核验也必须一致。
4. 沿用旧轮已验证的隔离方法。插件装卸若需 WithPnpm 轮，明确记录，期间不打开 OpenBKN 面板；SDK 检测/安装轮不得把日常 CLI 带进 PATH。npm 的源、prefix/cache、Node/npm 路径及版本全部记录。prefix 保留空格。

## 执行矩阵（两形态）

| 项 | 操作 | 必须看到 / 记录 |
|---|---|---|
| F90 身份 | 下载、verifier、隔离安装 | tgz 完整 SHA/字节、清单 SHA、原生输出与独立 exit 0；安装后全部文件匹配，缺失/差异/额外为空 |
| F91 目录与输入 | 逐字输入现有目录（盘根、测试 root、带空格目录）；再输入真实 CLI 文件路径 | 目录提示“此路径是目录，请填写 CLI 可执行文件的路径。”；canInstall=false，不执行目录、不安装。输入不中断、不吞字、不因只读检测失焦；真实 CLI 仍可用 |
| F92 缺失引导 | 在缺 CLI 的隔离环境保存设置，使用产品正常入口触发 CLI 不可用 | 主面板引导“设置 → 高级设置 → 检测并安装 CLI”，含在该处查看安装进度；不再只引导手动 npm。缺 CLI 的失败在本地发生，不需要真实平台凭据 |
| F93 安装/返回面板 | 空的独立 prefix，显式点击安装；沿用受控延迟后转真实 npm 的 fixture，双击、关闭面板、返回主面板、再进入高级设置 | 每 Host 一次真实 0.1.5 安装；主面板指向设置查看进度；高级设置实际“安装中”，预检/安装/轮询持续锁定路径和保存；关面板不杀 npm。完成自动填入路径，未保存时提示保存；独立 --version exit 0 |
| F94 保存提示 | 完成 F93 后保存，关闭/重开设置 | 同一已保存路径只显示“CLI 0.1.5 可用。”，不要求再次保存；保存前后的 patch 字节/字段分别取证，判定只针对 cliPath，不宣称其他字段均已保存 |
| F95 边界与卸载 | 核验状态；经插件管理器/CLI 卸载 | CLI 可执行与登录态分开；只读检测不触发授权/模型。卸载前后紧邻 patch 哈希、SDK 文件摘要一致；三 row/入口消失；独立 SDK 保留 |
| F96 verifier | PS5.1 + CRLF 默认 checkout 原生执行 canonical verifier | 无清单 SHA/count 错误。保留失败尝试（如有）、stdout/stderr全流与独立退出码，不更改候选/清单凑通过 |
| F97 停止保护 | 在记录齐全的本轮 Host 上复制 identity JSON，只改 listener 端口为不属于该树的值，再用 canonical stop-owned-host.ps1；随后用原始记录停止 | 修改副本时必须拒绝（非零退出），Host仍存活；原始记录四项匹配后才停止。内部 Log、外层全流、独立退出码、before/after 进程/监听记录都留存；不删除唯一 PID 原件 |

F97 可再用 listeners=[] 的副本证明缺少 listener 证据也拒绝。不要用日常 Host，也不要真的复用 PID 来冒险。

canonical 停止脚本的调用为 `powershell -NoProfile -ExecutionPolicy Bypass -File .\docs\handoff\2026-10-10-cli-setup9\stop-owned-host.ps1 -HostJson <record.json> -Log <internal-log.txt>`。记录字段为 `pid`、UTC ISO 格式 `createdUtc`、实际完整 `exe`、`listeners` 数组（每项有 `port`）；在启动完成时从实际进程/监听采集。错误 listener 轮只改副本并确认 Host 仍存活，再用原件停止。脚本停止后仍有记录内进程或端口会返回失败，须保留输出并查明，不能把日志已写入当停止成功。

C98 的“检测不清除旧 CLI/auth 失败”：有自然存在的 CLI 失败时可顺手取证；没有则保持未构造。不得为了补它使用伪凭据触碰平台。既有单测仍保留；不将 CLI --version 当作登录成功。

## 取证与收尾

- 用新的 `docs/cli-setup9-followup-windows-results` 分支回传 `docs/evidence/cli-setup9-20261010/followup/windows/`。分别列 Desktop/npm 的事实、转录、未测和偏差；C90–C99 的旧结果引用 a2504c5，不能写成新版全矩阵重跑。
- 按 [FOLLOWUP-RESULTS-template.md](FOLLOWUP-RESULTS-template.md) 填写，不覆盖旧 RESULTS 或旧原件。
- 每个文件记录完整 SHA、字节、实际保存路径和来源；对要推送的当前文件直接读 Git blob 比较。CRLF 原件与 LF blob 分列，不把归一后相同写成逐字节相同；旧/终版快照分时点。
- canonical stop helper 的记录输入、内部 Log、外层 native 全流与退出码均保留；四项不符必须拒绝。自退出的 Host另列，不能补造停止动作。
- 同清单采 after，检查本轮进程与端口清零；SDK 保留属于预期。截图出现个人文件名/凭据时留本机，未脱敏日志/credentials不推送。扫描整个新 diff 后推独立证据分支，给出完整 commit。
- Desktop 旧测试 Key 隔离异常由持有人撤销及宿主侧另行调查；本轮不打开模型设置、不调用模型、不输出 Key，也不改插件凭据管理。
