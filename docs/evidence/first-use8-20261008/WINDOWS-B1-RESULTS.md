# Windows B1 最小复现与文档补正结果

> 保留 not-run / insufficient-evidence，不把历史原件缺失补成通过；B3 补证按用户决定暂缓。

## 固定身份与执行窗口

| 项 | 实际值 / 原件 |
|---|---|
| 执行 handoff 完整 commit / 返回分支 / 日期与时区 | `8e3707f0d3df993bc3919d65dee36e382f73c85c`（`origin/docs/first-use8-b1-handoff`，与交付通知一致）/ `docs/first-use8-b1-windows-results`（独立 worktree `C:\bkn-verify\fu8-b1-results-wt`）/ 2026-10-09T16:10Z–17:45Z（本地 Asia/Shanghai 2026-10-10 00:10–01:45） |
| 审核证据基线 | `72b917b7c3a5e94d99a8ffaefe20c81212f10b60`；增量保留到 `4f4aba063985cb012ff1debea8c03071b4c14eee` |
| 候选 source / CI / version | `23ac2daa6d3538235f33a9627a8178a48f3e1ebf` / `37725960498` / `0.2.0-rc.2-openbkn.0.2.0-8` |
| tgz 实际路径 / 字节 / SHA；清单 SHA | `C:\bkn-verify\first-use8-download\openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-8.tgz` / 175800 / `6a946030a6152d2899609fac95c66cd246e36cca5a8ce4e5f87ed379cbe706ea`；清单 Git blob `31298c18cc87ac7a44039f8311e51340a56a830ecbad9fd270bd5ecf275ad257`（worktree 检出副本因 `core.autocrlf=true` 为 CRLF，SHA `08b75554…`，非内容变化）——`b1-minimal/b1-r0-identity.txt` |
| 安装件实际路径 / 版本 / count / missing / diff / extra | `C:\bkn-verify\first-use8-desktop\dsh-home\profiles\desktop\node_modules\@openbkn\dsh-business-context` / `0.2.0-rc.2-openbkn.0.2.0-8` / 66/66 / [] / [] / []；`verify-install.ps1`（SHA `611b92cb1f442b6c8ecb721c7b9ef27bf7a6b53fd56b7903042a1ba87f9b4fb4`）完整输出 + exit=0 见 `b1-minimal/b1-r0-verify-install.txt`，JSON `b1-minimal/b1-r0-desktop-001013-install-verify.json`；未重装 |
| Desktop exe/版本、CLI/Node 版本、profile/root、平台/网络/CA | `C:\Users\kalia\AppData\Local\Programs\DeepSeek Harness\DeepSeek Harness.exe` ProductVersion 0.2.0.0（运行时 DSH 版本未从 UI 读到，诊断显示"未知"）；openbkn CLI 0.1.5；Node v24.21.0；profile `desktop` / root `C:\bkn-verify\first-use8-desktop`；`https://192.168.50.28` / `supply_ontology_hand`；CA SHA `89e53b4e…`（启动脚本校验） |
| Host PID / UTC 创建时间 / listener / 子进程摘要 | **13480** / `2026-10-09T16:19:11.2097290Z` / `127.0.0.1:19387`（owner 35060）/ 子进程 gpu 19344、utility 13060、renderer 35876、node 主 35060——`b1-minimal/b1-r0-host.json`；R0 与 R1 为同一 Host（停止前核对 PID+创建时间+exe+listener 全部一致，`b1-stop-13480.txt`） |
| 本轮开始/结束、自然到期时间、已知并发授权事件 | R0 登录 token 写入 16:26:37Z，`expiresAt` 17:26:37.019Z（本地字段，非平台撤销状态）；17:29:25Z `auth status --json` → `expired:true, hasToken:true`。已知并发授权事件：无（本轮仅此 Desktop root 登录；不推断平台撤销或互踢） |

## R0–R2 时间线与判定

| 步骤 | 实际时间 / Host / session | 结果 | 原件路径、取证方式、说明 |
|---|---|---|---|
| R0 37 路径 before + 固定包核验 | 16:10Z | pass | `b1-user-state-before.json`（37 唯一、37 存在，本轮重新采集）；固定包 66/66 |
| R0 产品登录 / 目录 / 实际 MCP 工具成功 | 登录 16:26Z；问题 ~16:32Z；Host 13480；session `session-d2b592dc-9f32-426a-9305-46f195d24a28` | pass | 产品按钮发起、用户授权；`cliEqualsVault=true`（`b1-r0-credential-summary.json`）；面板 2 个网络；`bkn_start_interaction` {"conversation_mode":"new","question":"这个知识网络有哪些对象类型？只列名称，不查询实例。","agent_name":"bkn-agent-dsh-business-context"} → `int_4995d72c910cdd7272eb77f22661f2ee` active（transcribed，`b1-r0-tool-record.md`）；UI 诊断 **e3eb36f8** 全 pass，含 observed:context-loader（toolsPublished=true） |
| R1 自然过期 / 产品登录状态 | 17:26:37Z 过期；17:29Z 观察 | 到期确认 | CLI `auth status --json` `expired:true`（`b1-r1-auth-status.txt`，未运行 `auth token`）；同 Host 面板显示"使用 OpenBKN CLI 登录并同步"待登录态 |
| R1 同 Host 产品重登 / CLI 退出 / 目录可读 | 点击#1 17:29:53Z 未触发登录（无进程、token 未变；窗口获得焦点所致，不计失败）；点击#2 17:31:14Z 登录进程启动；17:31:35Z CLI 写入；17:31:37Z vault 同步；17:31:46Z 登录进程已退出；~17:32Z 面板 2 个网络 | pass | `tokenChanged=true`、`cliEqualsVault=true`（`b1-r1-credential-summary.json`，仅布尔/时间）；`b1-r1-timeline.txt`。未关面板 |
| R1 新业务会话工具调用（至多两轮） | 17:33:26.910Z；Host 13480；新 session `session-b536a561-8500-4350-970b-552df9a4541e` | **pass（首轮即成功）** | `bkn_start_interaction`（同参数）→ 已完成，152 ms，`int_ec98bb0a4d38341adaa29cfc685e0862` / `conv_29d3a8b6393b3478855b0cf579615926` / active；模型随后冗余发起的 continue 调用在 0 ms 返回本地守卫 "An OpenBKN interaction is already open in this turn…"（非鉴权）；`get_kn_detail` 成功；`bkn_finish_interaction` completed（transcribed，`b1-r1-tool-record.md`）。**无 Public.Unauthorized**。transport HTTP 状态无直接证据 |
| R1 UI 诊断采集 | 17:36:13Z（工具调用后约 3 min） | pass | **966db169**：observed:context-loader 存在且 pass（toolsPublished=true）；login-state recovered=true lastFailureCode=not-logged-in |
| R2 独立 CLI 同网络控制（仅失败时） | — | not-run | R1 成功，按判定表不执行；未创建探针 Interaction |
| R2 固定包原 root 重启 / 失败 session 重试 | — | not-run | 同上 |

本轮结论：**本轮未复现**。在同一 Desktop Host（13480）中，真实凭据自然过期 → 产品按钮重登 → 新业务会话的 `bkn_start_interaction` 首次即成功，诊断含 context-loader 行且通过。这**不代表历史异常已解决**，也不自动清除发布风险。

根因证据与缺口：本轮与原失败（2026-10-09 06:22）可见差异——原轮 Host（1544）自前一日 22:37 起运行约 8 h，期间经历过改址到 192.0.2.1 并改回（F5，22:59–23:08）、前一份 token 于 00:28 过期后闲置约 6 h，且重登后诊断无 context-loader 行（Clash TUN 劫持发生在 07:05，晚于原失败，不属于其前置条件）；本轮 Host 只运行约 1 h、仅一次过期。这些差异只是线索，**未证明**原故障走 `OpenBknMcpManager.ensureMounted()` 早返回分支或其他路径；未直接观察 Token 在请求上的使用或客户端归属，不能写"旧 Token 已确认"。

## 文档补正

| 项 | 完成状态 | 修改文件/位置 | 实际核对与仍缺原件 |
|---|---|---|---|
| C1 Desktop F8 6 SAME / 2 DIFF；卸载后起链 8/8 | done | `WINDOWS-RESULTS.md` F8 UI 行、D3；`windows/f8-desktop-notes.md` 追加段 | 依据原 `f8-desktop-ui-compare-remove.txt`（6 SAME/2 DIFF）与 `f8-desktop-ui-compare-reinstall.txt`；撤回 mtime 因果断言；两项紧邻卸载保持性 insufficient-evidence |
| C2 F4 围栏/CLI行为与 MCP 网络分类分列 | done | `WINDOWS-RESULTS.md` F4 行、未测项；`windows/f4-notes.md`、`windows/s3-npm-state.md` 追加段 | 未追加离线矩阵；MCP 网络不可达分类记"未验证" |
| C3 实际 verifier 脚本及历史重装 JSON/输出 | done（含缺口） | `WINDOWS-RESULTS.md` verifier 行；新增 `windows/verifier/`（2 脚本 + 9 份历史 JSON）、`windows/verifier-files.sha256.txt` | 两脚本均比对字节数/SHA/missing/diff/extra；`verify-install.ps1` 另核清单 SHA，`step-fu8-verify66.ps1` 不核。缺口：历史 Write-Host 全流与独立退出码原件不存在，仅 JSON；本轮 R0 新核验单列 `b1-minimal/`，未冒充历史 |
| C4 历史停止脚本身份检查范围与本轮核对 | done | `WINDOWS-RESULTS.md` owned PID 段 | 原 `stop-host.ps1` 仅比较 PID+创建时间，exe 只打印、listener 未校验、会话 3 删去进程名比较；无当时人工核对原件 → 缺口。本轮改用 `b1-minimal/scripts/stop-desktop-b1.ps1`（PID+UTC 创建时间+exe+listener） |
| C5 B1 根因/HTTP 状态措辞与重启对照时点 | done | `WINDOWS-RESULTS.md` B1 条目；`windows/f7-defect-stale-mcp-token.md` 追加段 | 旧失败原件未改；"重启是否恢复尚未证实"由 `f6-f7-notes.md`（06:31 恢复）替代 |
| C6 B2 已知限制；B3 暂缓补证 | done | `WINDOWS-RESULTS.md` B2/B3 条目；`windows/f7-badimport-notes.md`、`windows/s3-source-notes.md` 追加段 | 未执行 B3 |
| C7 22 份基线导出+新件计数、实际 Git blob 比较、`.129` 分时点 | done | `WINDOWS-RESULTS.md` 导出段、凭据/Git 句、未测项；`windows/b1-minimal/b1-c7-git-blob-compare-8e3707f.json` | `git cat-file -p 8e3707f:<path>` 实测 22/22 与本地原件及 Downloads 原件 identical；`report-inventory.mjs` 未读 Git 已注明。B1 新增 2 份（e3eb36f8、966db169）→ 截至本提交共 **24 份**已归档 JSON（5151f034 等仅 UI 查看不计） |

## 文件来源、哈希与收态

新增资料完整 SHA 见 `windows/b1-minimal/FILES.sha256.txt`（清单不自引用）。诊断报告：

| 场景/形态 | reportId | 实际下载路径 | bytes / SHA-256 | 原件仍在 | 当前 Git blob 比较 |
|---|---|---|---|---|---|
| R0 / Desktop | e3eb36f8 | D:\mydocs\downloads\OpenBKN-diagnostic-20261009T163854630Z-e3eb36f8.json | 2827 / 5438abe24ce65289d829be8f406273087e8e97d67f0dba3ac0b52964a947b4da | yes | 提交后实测见 `b1-minimal/b1-git-blob-compare-final.json` |
| R1 / Desktop | 966db169 | D:\mydocs\downloads\OpenBKN-diagnostic-20261009T173613390Z-966db169.json | 2823 / 9914c927ce74da2c312da8b56e9dbac37743440a9fe0e9090260c7b6de752aa9 | yes | 同上 |

- 本轮 37 路径 before/after：37 唯一路径，37 存在，**37 相同 / 0 差异 / 0 缺失**（`b1-user-state-before.json` 16:10Z → `b1-user-state-after.json` 17:39Z）。隔离 root 的预期变化（token.json、version-check、state.json、`.credentials.yaml`、`cordis.yml`、两份新会话绑定/会话文件/projcache、`workspace.json`）另列 `b1-isolated-root-changes.txt`（仅路径）；profile patch 保持 `c7626921…`。
- 自有进程身份检查、停止原生输出与终态扫描：`b1-stop-13480.txt`（核对后停止 5 进程树，剩余 0，19387 不再监听）；`b1-final-scan.txt`（17:39Z，范围仅本轮：DeepSeek Harness 0、19387 listener 0、auth login 0）。不泛化为整机零进程。
- 平台探针新增 Interaction：R2 not-run，未新增。业务会话产生的 `int_4995d72c…`、`int_ec98bb0a…` 均由产品自身 `bkn_finish_interaction` 收尾（completed）。
- 原件保留位置：`C:\bkn-verify\first-use8-b1-evidence\`；含个人桌面/任务栏的截图（`local-only-*.jpg`）仅本机保留，回传的是转录（标 `transcribed`）。凭据：仅布尔/时间字段入库，`b1-r0-credential-summary.json` 入库副本删去了 token 哈希前缀字段（本机原件保留，用于 `tokenChanged` 比较）。提交前凭据扫描独立执行，命中即停。
- 执行偏差：(1) R1 第 1 次点击未触发登录（窗口焦点），第 2 次才发起，不属于"授权超时重试"；(2) 工具原件为 UI 详情面板人工转录，非原生 stdout；(3) 运行时 DSH 版本 UI 显示"未知"，仅记录磁盘 exe 版本。
- 未改候选/source/helper/main，未重出包、未发布/tag/dist-tag；仅修改 `docs/evidence/first-use8-20261008/` 下文档并新增本轮证据。
