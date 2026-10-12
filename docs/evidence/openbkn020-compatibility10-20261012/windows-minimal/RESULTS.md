# Windows -10 最小变化复测结果

- 固定 handoff commit：`4d66a6bf222180c43b2946d8e0e79523c140f4e5`
- 结果 branch / 完整 commit：`docs/compatibility10-minimal-windows-results`（完整 commit 见回传；Git blob 对照见同目录 `GIT-BLOB-CONSISTENCY.json`）
- 开始 / 结束（UTC）：2026-10-12 15:59 – 16:27
- 插件源码 / CI / tgz SHA / 版本 / 安装路径：`9a35c0d9d1263b5f39b24d596f07dbcedbf25d04` / CI 38209375894（artifact `plugin-tarball`，`gh run download`）/ `a91adc9e342faa4f763d73487cd56d2f4ead8bb21bf755ca11426f77d90c9bae`，188215 B / `0.2.0-rc.2-openbkn.0.2.0-10` / npm `C:\bkn-verify\compat10-minimal\npm\dsh-home\profiles\web\node_modules\@openbkn\dsh-business-context`，Desktop `C:\bkn-verify\compat10-minimal\desktop\dsh-home\profiles\desktop\node_modules\@openbkn\dsh-business-context`
- SDK source-build SHA / 版本 / Node / pnpm / DSH 版本：kit `candidate/openbkn-bkn-sdk-0.2.0.tgz` `7391c658e831b9f11bc36fd7fcecfa30e41ecc4123a005bfee811e44b60eb43c`（212707 B，源 `c404354793146edab944b7e5a79908bf41ddd591`）装入隔离 prefix `C:\bkn-verify\compat10-minimal\sdk`（`npm.cmd install --prefix … --no-audit --no-fund <tgz>` exit 0；`openbkn.cmd --version` → `0.2.0` exit 0）/ Node v24.21.0（项目允许 ≥24）/ npm 11.19.0 / pnpm 11.7.0 / Desktop `DeepSeek Harness.exe` FileVersion 0.2.0-rc.2，npm DSH `@deepseek-ai/dsh` 0.2.0-rc.2（`C:\bkn-verify\diag6-tools`）
- 平台实际地址 / health 版本 / 两形态真实 profile：`https://192.168.50.28` / `GET /api/bkn-backend/v1/health` → `ServerVersion 0.2.0-release.20261011115044.sha06c5a87`（`evidence/platform-health.txt`）/ npm profile `web`、Desktop profile `desktop`

| 项 | Desktop | npm | 原件 / 判定范围 |
|---|---|---|---|
| V0 70 文件核验 | pass | pass | 候选 `node verify-candidate.mjs --tarball`（PowerShell 子进程，`>` 全流 UTF-16）exit 0，70/70（`verifier/verify-native.txt`/`-exit.txt`）。安装后 `--installed`：npm `evidence/npm-installed-verify.txt`、Desktop `evidence/desktop-installed-verify.txt` 各 exit 0，expected 70 / matched 70，missing/different/extra 空，installed.version `0.2.0-rc.2-openbkn.0.2.0-10`。安装方式：npm `dsh plugin install --profile web <tgz>`；Desktop 插件管理器 添加插件→本地 tgz→立即启用（单独装/卸轮带 pnpm PATH，未开 OpenBKN 面板） |
| V1 系统/未知信息/产品导出 | pass | pass | 诊断 UI：操作系统 **Windows**；Desktop 运行形态“桌面版”，npm“未识别（当前报告无法确认形态）”；DSH 版本、插件（已加载）均“未采集…”，附“未采集的基础信息不代表故障…磁盘版本不代表当前已加载版本。”；磁盘版本 `…-10`。产品导出：npm `e6071fd1`、Desktop `2c354224`，JSON `target.platform=win32` 保留，`pluginLoadedVersion=null`（`evidence/OpenBKN-diagnostic-*-v1-*.json`，下载原件路径/SHA 见 `evidence/reports.txt`） |
| V2 明确选择/识别 CLI 0.2.0 | pass | pass | 首次高级设置 `CLI 安装版本` 默认“请选择版本”，此时“检测并安装 CLI”禁用，提示“请选择与平台一致的版本后…”。明确选 0.2.0、填 cliPath `C:\bkn-verify\compat10-minimal\sdk\node_modules\.bin\openbkn.cmd` → “CLI 0.2.0 可用。路径已填入，请点击“保存并继续”应用。”；保存后 patch 含 baseUrl+cliPath（`patches/*-patch-after-v2.yml`；所选安装版本不持久化）。各 Host 由产品按钮启动 `openbkn auth login`，操作员浏览器授权（npm 存储 16:17Z、Desktop 存储 16:22Z，独立 BKN_CONFIG_DIR）→ 列网“找到 2 个网络”：`worldcup_vega_catalog_bkn`、`supply_ontology_hand`。只测已有 CLI 识别/版本选择；本地源码包安装不证明插件 npm 自动安装 0.2.0 |
| V3 真实受管只读调用/来源 reader（全机器一次） | pass | ← | `minimal-native.probe.mjs`（runtime 官方 npm DSH 0.2.0-rc.2 `C:\bkn-verify\diag6-tools`，plugin=固定 tgz 解包，cli=隔离 0.2.0）exit 0，16:19:27–16:19:32Z（`evidence/probe-meta.txt`、`evidence/probe-phases.jsonl`）。`before-status authenticated`；baseline start 无错、有 interaction_id、无 Public.Unauthorized；real-reader-profile 15 object types → `query_object_instance` limit 1 无错 → finish 无错；`real-provenance-getInteractionOperations` pass（entries 0：仅证明本次返回为空）、`getInteractionBusinessGraph` pass；`baseline-closed-after-finish refused=true`；`diagnostic-context-loader pass`；`complete passed=true`。探针无模型，不代表完整 UI Host 问答 |
| V4 受控导航/Trace 两分支（全机器一次） | pass | ← | `controlled-navigation pass` (objectTypeCount 201, indicesInvented=false)；`controlled-trace-disabled` 与 `controlled-trace-unavailable` 均 pass（noInventedIds、noContextInjected、crossNetworkDenied、closedAfterFinish）。受控 fixture，不扩写为平台实测 |
| V4 真实大网络/自然降级（无条件 not-run） | not-run | ← | `real-reader-profile navigation=false`：平台无现成大网络/自然降级；未改平台、未造网络、未停服务 |
| V5 B1 最小同步（不声称历史已修） | pass（短流程未复现） | ← | 同一 owner `same-owner-reconcile` start 无错、无 Public.Unauthorized、有 interaction_id → `search_schema` 无错 → finish → 关闭后拒绝。短流程未复现 Unauthorized；不宣称自然过期重登、8 小时长跑或历史 B1 已修 |
| V6 同清单保护文件/ owned PID /收态 | pass | pass | before/after 同 1157 路径清单（first-use8 列表 + 日常 scoop openbkn* + 日常 bkn-sdk 全部文件）及 PATH/HKCU 环境变量名/`%APPDATA%\npm`/日常 SDK 版本摘要：记录完全一致（`evidence/daily-*.json`）。owned Host：Desktop 25396（安装轮）、13056；npm 25492——均以本 kit `stop-owned-host.ps1` 原件停止 exit 0，`remainingTreeProcs=0 recordedPortsStillListening=0`（`evidence/f97/*`）。终态无 DeepSeek Harness / dsh bin.js 进程，18607/19387 无监听 |

## 原件与字节

逐件本机原件路径、原始 bytes/SHA-256 与证据副本对照见 `LOCAL-PROVENANCE.json`（61 件，全部逐字节一致）；提交后的 Git blob 对照见 `GIT-BLOB-CONSISTENCY.json`（本目录 `-text`，不做换行归一）。重点件：

| 文件 | 场景/reportId | 本机绝对路径 | 原件在档/快照 | 原始 bytes/SHA-256 | Git blob | 判定 |
|---|---|---|---|---|---|---|
| verifier/verify-native.txt | V0 候选 | C:\bkn-verify\compat10-minimal\verify-native.txt | 原件在档（UTF-16） | 见 LOCAL-PROVENANCE | 见 GIT-BLOB-CONSISTENCY | identical |
| evidence/OpenBKN-diagnostic-npm-v1-e6071fd1.json | V1 npm e6071fd1 | 下载 D:\mydocs\downloads\957a000f-501c-4772-b5d1-0ef754f17ee4.tmp（浏览器临时名，之后可能被浏览器改为正式名，按 SHA 追踪）；副本 C:\bkn-verify\compat10-minimal\evidence\ | 副本在档 | 2868 / 6af525d32336deded1b8fbdc507b11fab5f12a41756c030c51982e74a9522e4e | 同上 | identical |
| evidence/OpenBKN-diagnostic-desktop-v1-2c354224.json | V1 Desktop 2c354224 | D:\mydocs\downloads\OpenBKN-diagnostic-20261012T160923679Z-2c354224.json | 原件在档 | 2868 / e6530f4885ce01200698879c105a9a4e71462a63e41f9499b1c4cff01a662282 | 同上 | identical |
| evidence/probe-phases.jsonl | V3–V5 | 由 C:\bkn-verify\compat10-minimal\probe\native-private.txt（UTF-16 全流，私有不入库）提取 phase 行转 UTF-8 | 提取件 | 见 LOCAL-PROVENANCE；私有全流 SHA 见 reports.txt | 同上 | 提取件，非原件逐字节 |

## 执行偏差与未测项

- 候选/helper 未改动；kit `stop-owned-host.ps1` 与 -9 canonical blob 同字节（`9fd7b9aa…`）。本轮 helper（`scripts/`）由 -9 轮脚本按路径替换生成，`f97-run.ps1` 只包装 kit 停止脚本并保存全流/退出码/前后快照。
- 顺序：Desktop 屏幕锁定期间先运行 V3–V5 探针（16:19Z），Desktop V2 登录/列网在其后（16:22Z）完成；两者存储独立，不影响判定。
- 授权：探针存储首次 `auth login --device` 在 16:14:33Z 超时（exit 2，CLI 等待约 2 分钟），16:15:19Z 重发后 16:16:15Z exit 0。三个存储（探针 / npm Host / Desktop Host）各自独立授权，未复制 token。
- Desktop 点击“使用 OpenBKN CLI 登录并同步”后面板关闭，未见面板内进度；CLI 浏览器登录照常完成，重开面板已列网（观察项）。
- 停止：首次对 npm/Desktop 停止调用时我的命令把记录路径写成字面 `…\f97\$l-record.json`，kit helper 读文件 PathNotFound、外层 exit 1、Host 未受影响（原件 `evidence/f97/*-attempt1-badpath-*`）；改正路径后原件停止 exit 0。不是 helper 身份拒绝。
- 操作员输入：npm 形态 V1/V2 在内置浏览器中用 DOM ref 点击和 CDP 输入完成（窗口被 Desktop 遮挡无法截图）；Desktop 用 computer-use；未用 JS 设置被测字段的值（版本下拉 npm 形态用 form_input 选择）。
- 未测：npm 自动安装 0.2.0（未发布）；真实大网络/自然降级与 Trace 开关真实分支；0.1.5 实机；模型/G6；长时 B1 / 自然过期重登。

## 收态与范围

before/after 同清单一致；owned PID/exe/UTC 创建时间/listener 与停止原件、退出码在 `evidence/*-host.json`、`evidence/f97/`；本轮进程端口终态为零（不延伸为整机）。私有：探针全流 `native-private.txt`、`probe-interactions.private.jsonl`、登录输出、各 `dsh-home`/`bkn-config`、含 launch token 的启动日志——仅本机。凭据扫描：全部新增 diff（launch token、Authorization/Bearer、API Key、device code、密码、带凭据 URL、JWT），结果见回传。未修改源码/平台/main，未发布/tag/dist-tag；仅新增本目录与 `.gitattributes` 对本目录的 `-text`/whitespace 规则。
