# Windows：统一 -7 发布前补测交接

2026-10-07 Mac结果更新：固定包补测新增两项失败——`bom-structure` native error、`sales-order-detail`错误答无订单；详见 [Mac RESULTS](../../evidence/unified7-final-verification-20261007/RESULTS.md)。本交接仍用于补齐固定包证据，**不是发布放行**。A批可继续；B批记录实际结果，不绕过错误。后续若修复换包，将另给新身份及受影响复测通知，不提前用未知包替换本表。

## 可直接交给 Windows agent 的任务

请在 Windows 原生官方 Desktop 0.2.0-rc.2 和官方 npm DSH 0.2.0-rc.2 两形态补测以下 A 批项目。继续使用已核验 `C:\bkn-verify` 工具树和固定 `-7` 包，保留既有结果及会话。B 批需要真实账号/模型：已有授权的隔离配置可以复用，否则由用户在隔离应用中正常配置；不要借用或复制日常凭据、在聊天回传密钥、创建权限来凑通过。有任何前提缺失，准确记录 not-run 并先完成其余项目。

你负责 Windows 操作与证据，不修改候选/helper 来改变判定，不改 main、不 tag、不 npm publish、不改 dist-tag。仅交付新的脱敏 evidence 和结果文档到独立 docs 分支。你不是唯一开发者，保留其他人的改动。原 a7fb50c/51830de/9fb3896 文件保持原样，旧缺失时序不补造。Windows 的模型费用只用于此次明确列出的题目，不做重复盲测。

## 固定输入及获取

| 项目 | 固定值 |
|---|---|
| 插件 | `@openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-7` |
| 已实测包源码 | `3414bdec3c956cc0d580aebd959ac6f3439bb352` |
| 原 CI | `37478119730`, publish=false |
| tgz SHA / bytes / 文件 | `6bbab27876e743032572ddce107fcce09e0d681f87bee19fba8d78180e5a63a8` / 177442 / 66 |
| 主线彩排 | `37500800409`，main `870e26958bde734f64c5af046f9bab134e3512e1`，产物与原 tgz 整包相同 |
| 固定 Windows kit commit | `1fcffa9227d14bac7ff8d628ebd0f8398a965675` |
| Windows ZIP SHA / bytes | `df0016c6d2b511c009f932402dd80155248c4ac61260cbd3cad70ecb483cef54` / 248434 |
| 既有 Windows 证据 | `9fb3896b979eff8fdebc1283ecb6316e0a888953` |

[固定 ZIP 下载](https://raw.githubusercontent.com/openbkn-ai/bkn-dsh/1fcffa9227d14bac7ff8d628ebd0f8398a965675/docs/handoff/2026-10-06-release-7/assets/windows-unified7-3414bde-fidelity.zip)。包内 README、HANDOFF、candidate-manifest、candidate-files 和 helper 均沿用，不重新取 npm @rc（它仍可能指向 -4）。三 row 结构和旧 name-qualified patch 的迁移方法见包内 README。

取本交接的远端分支 `docs/unified7-final-verification`；开测时记录实际 handoff commit。不要要求 kit commit 与 handoff commit 相同：前者绑定不可变包，后者绑定补测操作。

## 环境、记录和保留规则

1. 使用原生 PowerShell 5.1+，固定官方 Desktop/npm 和 CLI 0.1.5；不使用 WSL、patched Host 或 inspector。System32 tar 只在本测试 shell PATH 前置。
2. 可使用此前本轮隔离 root，但每批 evidence 新建唯一目录，如 `evidence/final-20261007-<time>`，不要覆盖 before-W1、W4、after-matrix 等原记录。已有 root/端口仍占用时先按 helper 身份规则检查；不清空整个 root。
3. 选定日常 `~/.dsh/profiles/{desktop,work}` 的 package.json、cordis.patch.yml、pnpm-lock.yaml，以及本次需要保护的会话/模型/凭据文件，**在开始前**采集存在性与内容 SHA；结束后用完全相同清单比较。凭据正文和日常会话正文不要回传。发现新增/删除/改变，记录实际写入操作及时间，不把正常 refresh 的变化宣称为不变。
4. 本次新增启动脚本和手动动作也要记录。kit 零 diff 不等于执行过程零偏差。配置写入用 BOM-less UTF-8；历史引号失败不应在新一轮沿用。
5. 每次启动保存 Host/子进程 PID、创建时间、exe/命令行（脱敏）、profile、端口与监听归属。cleanup 的原生 stdout/exit、停止后存在性、端口释放都要存档，记录不能只消费后删除而无副本。只停止本任务且身份匹配的进程。
6. 不复用升级场景。必要时完全 remove 后安装固定 tgz；保护会话、模型和无关 patch。

记录 verifier 的原生输出，并在写文件之前保留其成功状态。例如：

```powershell
$ErrorActionPreference = 'Stop'
$FinalKit = 'C:\bkn-verify\diag7-fidelity'
$FinalEvidence = 'C:\bkn-verify\unified7-final-evidence-20261007'
if (Test-Path -LiteralPath $FinalEvidence) { throw 'Choose a fresh evidence directory' }
New-Item -ItemType Directory -Path $FinalEvidence | Out-Null
$FinalUtf8 = New-Object Text.UTF8Encoding($false)
$env:Path = "$env:SystemRoot\System32;$env:Path"
$FinalVerifyOutput = & (Join-Path $FinalKit 'verify-kit.ps1') 2>&1
$FinalVerifyOk = $?
[IO.File]::WriteAllText((Join-Path $FinalEvidence 'verify-kit-native.txt'), ($FinalVerifyOutput -join "`r`n") + "`r`n", $FinalUtf8)
if (-not $FinalVerifyOk) { throw 'Kit verifier failed' }
```

不同日期/既有目录时换 `$FinalEvidence`，不要删除证据。SHA 取真实文件原始 bytes；若换行转换，分别记录两个 SHA 和转换，不把归一比较称作原始字节相同。

## A 批：无需平台账号，两形态各执行

| ID | 操作顺序 | 通过标准与必须保存的证据 |
|---|---|---|
| A0 | 记录前态；核验 kit/tgz；核验当前或新安装的 66 文件 | 原生 verifier 输出；实际路径/版本；missing/differs/extra 全空；实际 Host load 与静态身份分列 |
| A1 / W4 recovery | 用固定基包构造 W4 初始化失败，导出产品 JSON；按身份停止；撤销变体并安装固定健康 tgz；启动新 Host，再打开诊断导出 | 失败为 initialization-failed；新安装 66/66；恢复 business/bootstrap/diagnostics pass；旧 initialization-failed 不再作为当前失败。标明重启恢复，不冒充同进程恢复。保存两份 JSON、两个 reportId、基包/变体 SHA、执行时序和停止记录 |
| A2 / R9 patch | 在安装健康配置后固定 cordis.patch.yml，**紧邻卸载前**取 SHA；UI remove，立即取同文件 SHA（中间不运行重写配置的 setup）；核对 deps/三 row/UI 消失；重装固定包、新 Host，再取 SHA | 卸载前后 patch 存在且 SHA 相同；无关测试 patch、会话/模型选定文件保留；三 row 消失/重装各一；重装包 66/66。若 Host 正常写入某文件，单独解释，不用其覆盖 patch 哈希。canary 清理/健康写入必须发生在 beforeHash 前 |
| A3 / cleanup+state | 覆盖 A1/A2 的每次启动与停止，结束后核对用户状态 | 完整 PID/creationTicks/监听归属/cleanup 原生输出及结束态扫描；选定日常文件 before/after 内容哈希（仅哈希）；本次前态不能证明上次未采集的历史状态 |
| A4 / F02 synchronized capture | 用一个全新的 `fidelity-final-probe-<time>` 目录执行 kit 下 prepare-fidelity-probe.mjs，然后立即运行 answer-fidelity-runtime.probe.mjs | 原生 prepare 输出的 probePackage 与下一命令的 --plugin 目录完全相同；66 文件/官方 peers 核验；同次 stdout JSONL 六场景显式 pass；每步 exit code、实际命令、绝对路径、SHA、时间均保留。禁止把另外的 -record 目录输出配给这次执行 |

A4 沿用 kit HANDOFF 的命令，仅更换新 probe 目录并同时保留 prepare stdout。六场景名不变：corrected-same-turn、second-mismatch-errors、unbound-unaffected、full-question-summary-rejected、headerless-cached-reprint、scoped-inventory-cached-repair。第二次不匹配必须 native error，其余 completed；fixture 不算真实模型/平台验收。

W4 故障构造与健康恢复继续用 kit `windows/run-case.ps1` 的 W4/W1；恢复安装时明确 `-CandidateTgz` 为固定 tgz，不能仍使用变体。若 setup 会重写 patch，将其写入动作放在 A2 卸载 beforeHash 之前，且逐项记录。

## B 批：有真实隔离账号/模型才执行

| ID | 操作 | 通过标准与证据 |
|---|---|---|
| B1 / login | 两形态在隔离环境正常登录，配置平台和 CA，刷新状态、列网络、绑定 supply_ontology_hand | CLI 0.1.5 与平台匹配；MCP、目录、登录各 subject 正常；诊断真实导出，不要求无凭据时全绿；正常 refresh 的凭据轮换与安装保留分开记录 |
| B2 / F01 | 两形态打开真实业务图，至少两个元素，逐个查看来源；有第二授权网络时增加切换 | 每个元素 ref_type/ref_id/来源网络与独立授权 Trace 查询一致。未知/未披露不猜；跨网 UI 无第二网络则 not-run。保存 UI 操作记录及脱敏独立查询 |
| B3 / original questions | 用原模型 DeepSeek-V41-Flash、High、新测试会话逐题跑三道原题（下列），每题先确认正确绑定 | 真实 native completed；独立数据对照；完整失败/纠正轨迹保留。BOM 313 父子行/272物料/5层和八字段、48范围内空集标记、范围记录数需对当次独立查询核对，数据漂移先说明，不用旧答案硬判 |
| B4 / live guard | 原 kit probe/guard-probe-cli 对固定包和两个授权网络运行真实 ToolRuntime | 每项判定、实际派发/拒绝和退出码存档；错误/缺失/跨网 kn_id 不派发，排除工具不放行。fixture 或模型自觉不代替此项 |
| B5 / remaining G6 | 账号/模型仍可用时按原 eval/supply-ontology.yaml 补其余正向问题和受控负向场景 | 原问法、完整答案、工具事件、独立 oracle、逐项评分都保留。负向 Token/不可达只动专用测试配置，不使用户正常账号失效，不改平台或系统网络。真实受限账号仍缺时 unauthorized-network 维持 not-run |

三道原题（与此前失败/修复验收相同）：

1. `382-000005 的标准交期？`
2. `查询 382-000005 的 BOM 清单，每个物料的使用量，以及每个物料的库存情况`
3. `物料 999-999999 的库存和订单情况？`

若 Windows 无模型或平台凭据：完成全部 A 批，B1–B5 标明各自缺的前提。不要把“可以登录的 UI”计作登录成功；不要增加账号权限或制造受限账号。这些缺口与候选缺陷分别报告。

## 回传与完成条件

填写 WINDOWS-RESULTS.template.md，新增脱敏 evidence；每个原件记录真实绝对路径、报告 ID、bytes、原始 SHA，与 Git blob SHA 对照。新结果提交到独立 docs 分支并推送，回传固定 commit。commit message/PR 内容用英文；操作报告可以中文。不直接合并主线或发布。

必须同时给出：已验证 / 失败 / not-run / insufficient-evidence；helper 或启动器偏差；选定用户状态的内容哈希比较；owned PID 全表与停止记录；最后进程/端口扫描。若发现候选缺陷，停止该缺陷相关后续验收，保留原始脱敏证据并回报，不修改固定包凑通过。
