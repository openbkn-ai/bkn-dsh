# -8 首次使用验收轮 · 会话 2 交接（2026-10-08 23:00 前后，额度耗尽前写）

接手 agent 从本文档继续。会话 1（同日早些时候）完成了 F0/F1/F2/F3 主链，见
`C:\Users\kalia\.zcode\cli\memories\projects\openbkn-2b4de8da09f4c279\memory\windows-first-use8-run.md`。
本会话 2 完成了 F3-401 收尾、F4 全部、F1 后半，F5 刚开头即被取消。

## 0. 任务与固定交付（不变）

- 交付 commit `59ac630784ac3a6d8cfce3eecc47e5f283cd1882` 的
  `docs/evidence/first-use8-20261008/WINDOWS-HANDOFF.md`（本地已 checkout 于
  `C:\bkn-verify\diag6-source\docs\evidence\first-use8-20261008\`，同目录有
  WINDOWS-RESULTS-TEMPLATE.md 待填）。
- 候选 source `23ac2daa6d3538235f33a9627a8cf2d6819649205`；CI run 37725960498 publish=false；
  tgz SHA `6a946030a6152d2899609fac95c66cd246e36cca5a8ce4e5f87ed379cbe706ea`（175800B/66 文件）；
  清单 SHA `31298c18cc87ac7a44039f8311e51340a56a830ecbad9fd270bd5ecf275ad257`；
  版本 0.2.0-rc.2-openbkn.0.2.0-8。三形态 66/66 已核验（fu8-verify66-*.json）。
- 平台 https://192.168.50.28（admin/<redacted>，仅本人隔离测试，凭据不入 Git/交接件之外）。
- 安全规则全部继续有效：不改 main/不发布/不打 tag；不复制日常凭据（~/.dsh 保护）；
  token/raw 日志留 private；提交前凭据扫描；提交信息英文；F8 前禁调 cleanup.ps1；
  F0–F6 禁用 run-case.ps1。

## 1. 本会话完成项（证据都在 C:\bkn-verify\first-use8-evidence\）

### F3-401 全链路闭环（详见 f3-notes.md）
- shim `auth login <url>`（3 参契约）exit 0 → reject-token.flag 自动清除，token 更新 22:16:56。
- 同一故障 Host 30164 面板从 401 恢复"找到 2 个网络"（f3-recovery-final-axtree.txt）。
- 恢复报告 1e04b23f 7/7 pass，历史失败项 recovered=true（OpenBKN-diagnostic-20261008T141957421Z-1e04b23f.json，SHA 257551109d81aa1b3a123e797243ee032f32cb6a17af88951a2dcada912430b9）。
- Host 30164 树全停（f3-stop-log.txt）。
- **经 UI 恢复 patch**：设置→高级设置(AXExpand)→cliPath 设回真实路径→保存（"设置已保存"）。
  patch 链：D8DB193A(健康) → 2EBBA5DB(fault) → c7626921(UI 恢复；前 8 行 openbkn 条目与基准逐字节一致，
  Host 追加了自身 ui-chat/ui-settings/ui-settings-account 条目=记录在案的预期变更)。
- 恢复期 Host 27536 已停。

### F4 全部（详见 f4-notes.md）
- **TLS 无 CA 轮**：Host 30856 无 NODE_EXTRA_CA_CERTS → 面板通用失败提示；
  诊断分类 **context-loader → tls-failed**（报告 6525760d，其余 6 项通过）；设置地址未清空。
  带 CA 重启（1544）→ 2 网络恢复，报告 7e3c2781 全通过（当前失败更新；tls-failed 历史留在 6525760d）。
- **不可达轮**：UI 存 https://192.0.2.1（TEST-NET-1）→ 面板进入新平台待登录；
  诊断 **login-state → platform-mismatch**（platformMismatch=true，CLI 平台围栏拒绝复用旧平台 token）；
  点"使用 OpenBKN CLI 登录并同步" → CLI 连不通失败 → 诊断 **cli → cli-execution-failed exitCode=1**
  （报告 2758a428）。UI 改回原地址 → 2 网络恢复（f4-unreachable-restored-panel-axtree.txt）。
- **403：not-run**（无真实 403 条件，未创建/修改平台账号）。

### F1 后半（顺带完成）
- 合法地址已存在时提交 `ht!tp://not a valid url with spaces` → 就地提示
  "请输入完整的 HTTP(S) 平台地址…" + 输入保留 + patch SHA 不变 c7626921
  （f1-desktop-after-valid-invalid-submit-axtree.txt、f1-desktop-patch-sha.txt 追加行）。

### F6 部分直接证据（在 F4 中产生）
- 空闲改地址→待登录+platform-mismatch 围栏（不向新地址发旧 token）；改回→恢复。
- 仍缺：handoff 指定的保留域 `https://first-use8-no-platform.invalid` 一轮、"忙时(业务回合中)改设置被拒/禁用"，
  原 patch 字节级断言、绑定哈希不变。Token 隔离若 UI/JSON 不足证则标 insufficient-evidence。

## 2. 机器当前状态（接手时第一件事：核对）

- **Host 1544 仍在运行**（f4-recovery-host.pid，带 CA 正常环境，子进程 30580/28644/31164/13012）。
- ~~patch 测试脏态~~ 【会话3已恢复→c7626921，见 s3-restore-notes.md】原：baseUrl=**https://192.0.2.1**（F5 取消前最后一次保存所致），
  cliPath=真实路径，SHA 46fa4b387f860dfd3f221f621e73bcde420d43a690a46a80f5c9d41e2ce513fb。
- 无残留 CLI login 进程。
- **接手第一步建议**：绑定 pid 1544 → 打开 OpenBKN 面板 → 设置 → 地址改回 https://192.168.50.28
  → 保存 → 确认"找到 2 个网络"（这本身补一轮 F6"改回原平台恢复"证据）→ 记录 patch SHA。
  或者直接停 1544 后按需重启（见 §4 启动配方）。

## 3. F5 被取消时的状态

- 计划：地址改 192.0.2.1 → 点登录（慢请求 ~20s）→ 立即 Close 面板 → 等 80s 验证面板不被旧结果重开。
- 实际：setValue+保存已执行（patch 已变 192.0.2.1），登录按钮点击及之后全部未执行/未取证。
  **f5-* 证据文件一个都没有**。F5 全部项仍待测：
  (a) 请求进行中关闭面板→旧请求结束不重开面板（可用上述慢窗口法）；
  (b) 关闭后再打开/刷新正常； (c) 保存引起重载时旧请求返回不覆盖新状态。
  若赶不上可控延迟窗口就如实记未实测。

## 4. 关键操作配方（本会话验证过的坑）

1. **Host 启动 env**（唯一正确配方；错一个就卡 31 元素欢迎 splash）：
   ```
   DSH_HOME=C:\bkn-verify\first-use8-desktop\dsh-home
   BKN_CONFIG_DIR=C:\bkn-verify\first-use8-desktop\bkn-config
   NODE_EXTRA_CA_CERTS=C:\bkn-verify\unified7-c91fe09-authentication-recovery\windows-kit\certificates\openbkn-dev-ca.pem
   ```
   ⚠️ 不存在 C:\bkn-verify\first-use8-kit（会话 2 曾因此白起两次 Host 9636/2626）。
   无 CA 启动 = F4 TLS 故障态（有意为之才用）。
2. **computer-use**：`setupComputerUseRuntime` bootstrap → getApp({pid}) →
   getAXState({disableDiffing:true})。**高级设置展开必须用
   `app.performSecondaryAction(idx,'AXExpand')`**（click 无效）。setValue 只对 textfield。
   高级设置里 cliPath 字段名"OpenBKN CLI 执行路径"。
3. **诊断导出模式**：导出诊断报告 → blob 保存对话框（默认下载目录 D:\mydocs\downloads）→
   点"保存(S)"；文件已存在会弹"确认另存为"→点"是(Y)"。对话框有时失焦自动保存（已发生两次，如实记录）。
   报告归档到 evidence 并记 SHA，凭据扫描（当前全部干净）。
4. **面板被关后**：点侧栏 "OpenBKN business knowledge networks" 按钮重开；关诊断窗用其右上 Close。
5. **PS 停 Host 树**：CIM 枚举 Name='DeepSeek Harness.exe' 按 ParentProcessId 递归收子进程
   再 Stop-Process -Force（实例见 f3-stop-log.txt 生成命令，会话历史可查）。pid 文件格式 `pid:ticks`，
   解析取冒号前。
6. 平台会话不跨设备码保持；确认设备码页面用 browser-use evaluate 直点 DOM 按钮可靠。
   授权落盘首选直接 CLI `auth login --device --timeout 300`（dev 桌面 root）。

## 5. 剩余待办（按优先级）

1. **恢复 patch 基准**（§2 第一步）。
2. **F5** 三小项（§3）。
3. **F6 正式轮**：保留域 `https://first-use8-no-platform.invalid` 空闲改址→待登录/围栏→改回；
   忙时（已有绑定业务会话的回合中）改设置应被拒/禁用且不改 patch；空闲保存/重连可靠；
   旧会话绑定哈希不变；不足证的 Token 隔离断言标 insufficient-evidence。
4. **F7**：两个独立故障 root 的业务坏导入（`exports['./business'].default` 缺失）与
   诊断坏导入（`exports['./diagnostics'].default`）→ 分别定位 `module-resolution-failed`、
   诊断坏导入时业务保留/降级；每变体记录基包/变体 SHA、变更文件前后 SHA、实际安装身份，恢复固定包。
   之后 Standard 真实问答+溯源+重启续接（**需 Host 配模型 API key**——尚无；无模型则 F7 真问答 not-run）。
5. **F8**：UI+CLI 双路径卸载/重装三形态（三哈希链：卸载前=卸载后立即=重装后 用户patch/绑定/工作区文件；
   包 row/依赖消失；重装逐文件核验；CLI 不 logout）。F8 取证完成前禁调 cleanup.ps1。
6. **npm 形态** F2/F3（npm root 的 Host 是 18507 端口 web 形态，启动脚本 step-fu8-launch-npm.ps1）。
7. **source 形态最小链**：F0→F1→F2→F3 正常授权/列网→重启回读→F8（bin.js 入口，端口 18408）。
8. **N6 收态**：after 37 路径哈希（user-state-before.json 37/37 为基准）、owned PID 归档、
   身份核验后停止全部进程、端口扫描零残留。
9. **RESULTS 回传**：填 WINDOWS-RESULTS-TEMPLATE.md（diag6-source 内）→
   新分支 `docs/first-use8-windows-results` → 英文 commit → push（固定 commit 仓库，
   远端 origin 指向 openbkn-ai/bkn-dsh）。提交前凭据扫描全套证据。

## 6. 证据文件速查（本会话新增）

- f3-recovery-final/diagnostics-open/export-dialog-*.txt、OpenBKN-diagnostic-…-1e04b23f.json
- f3-recovery-settings-open/advanced-open/after-save-axtree.txt、f3-notes.md、f3-stop-log.txt
- f4-tls-host.pid、f4-tls-panel/diagnostics/settings/export-dialog-axtree.txt、
  f4-tls-recovered-panel/diagnostics-axtree.txt、OpenBKN-diagnostic-…-6525760d.json
- f4-unreachable-saved/panel/diagnostics(-after-login)/login-outcome/export-dialog/restored-panel-*.txt、
  OpenBKN-diagnostic-…-2758a428.json、f4-recovery-host.pid、f4-stop-log.txt、f4-notes.md
- f1-desktop-after-valid-invalid-submit-axtree.txt（f1-desktop-patch-sha.txt 有追加行）

## 7. 会话 3 进展（Claude Code，2026-10-08 22:55–23:10）

- patch 已恢复基线 c7626921（s3-restore-notes.md，兼作 F6"改回原平台恢复"证据）。
- **F5 三项全部 PASS**（f5-notes.md，报告 1bdcf068 / a4c1354e）。注意：慢窗口实测仅 ~3-6s，不是 §3 写的 ~20s；
  第一次尝试点击未生效已如实记为无效轮。
- 机器状态：Host 1544 运行中，patch=c7626921，2 网络，无残留 login 进程。
- 下一步：F6 正式轮（§5 第 3 项）。

## 8. 会话 3 续（2026-10-09 06:20–15:30）— 结果索引
- desktop: F6 PASS、F7 问答/溯源/重启续接 PASS（f6-f7-notes.md）；**缺陷候选**：重登后运行中 Host 的 MCP 仍用被拒 token，
  诊断无 context-loader 行（f7-defect-stale-mcp-token.md）；F7 坏导入：业务 PASS、诊断 PARTIAL（配置 RPC 挂在
  diagnostics 入口，诊断坏导入时首次配置不可用）（f7-badimport-notes.md）；F8 UI+CLI PASS（f8-desktop-notes.md）。
- npm: F2 PASS、F3 缺 CLI 提示 PASS、F3 首次授权 PASS（第 2 次）；F3-401 fixture 轮**中途暂停**，npm patch 当前 cliPath=shim
  （s3-npm-state.md 有完整恢复步骤）。
- source: F1、F2 PASS（s3-source-notes.md）。
- 阻塞：192.168.50.28 被本机 Clash Verge TUN 劫持（源地址 198.18.0.1，TLS ECONNRESET）。用户计划修好后继续。
- 用户另提 192.168.50.129（无 license，CA=“OpenBKN Test 015 Local CA”，本机无该 CA）：无 license 补充探索测试延后，
  属规范外补充证据，单独成节。
- 待办：npm F3-401 收尾→npm F4–F8→source F3/关面板/F8→N6→RESULTS→（可选）.129 无 license 补充轮。
- 当前进程：npm Host 35384（fixture env）、source Host 16276、desktop Host 33376 在跑。
