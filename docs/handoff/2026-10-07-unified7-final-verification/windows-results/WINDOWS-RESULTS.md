# Windows final verification results

日期/操作人/handoff commit：2026-10-07 晨 / Windows agent（ZCode）/ handoff `150d85d7e7d49d2091b918b641faee72e629081b`（分支 docs/unified7-final-verification）
证据分支/固定回传 commit：`docs/unified7-final-verification-windows` / 本次回传 commit（见推送输出）
包版本/source/原 CI/主线彩排/tgz SHA：`0.2.0-rc.2-openbkn.0.2.0-7` / `3414bde…` / CI 37478119730（publish=false）/ 主线彩排 37500800409（main 870e269，产物与原 tgz 整包相同——按 handoff 记录，未重复核验 CI 产物，本轮用同一固定 tgz）/ `6bbab278…63a8`（177,442B/66 文件）
kit commit/ZIP SHA/实际工具路径和版本：kit `1fcffa9…` / ZIP `df0016c6…`（248,434B，本轮未重新下载，沿用已核验本地 diag7-fidelity；verify-kit 原生输出再次通过并存档 verify-kit-native.txt）/ 工具树 C:\bkn-verify\diag6-tools（npm DSH 0.2.0-rc.2、CLI 0.1.5 实测输出；Node 24.21.0、pnpm 11.7.0、PS 5.1）
两隔离 root/profile/实际 Host/端口：unified7-fidelity-desktop（desktop profile，Desktop exe 原生启动）/ unified7-fidelity-npm（web profile，隔离 dsh.cmd web，18301-18303）；证据目录 unified7-final-evidence-20261007（新建，未覆盖原记录；原证据另存 snapshot-*-before-final）

| ID | Desktop | npm | 原件绝对路径 / reportId / bytes / SHA / 实际退出码 | 判定依据及限制 |
|---|---|---|---|---|
| A0 identity | pass | pass | verify-kit-native.txt（exit 0）；a0-identity-current.json：两形态 66/66（missing/differs/extra 全空，v=-7，实际安装路径在档） | 静态身份与实际加载（插件管理器三 row、报告 pluginDisk=-7）分列；user-state-before.json=37 个日常/保护文件开始前内容哈希 |
| A1 W4 fail→recovery | pass | pass | desktop：A1-desktop-W4fault-88487be9.json（fail/initialization-failed）→ A1-desktop-recovered-659d6bc5.json（全 pass，旧失败无残留）；npm：A1-npm-W4fault-be8eccbe.json（UI 导出）→ A1-npm-recovered-53df4e9b.json（Host API）+ UIexport-…-76ea8184.json（延迟落盘的 UI 导出，内容同 pass）。变体 SHA 见 a1-*-W4-md.txt（基包 6bbab278…，business.js 前后 SHA）；变体安装件核对：W4 轮恰好 business.js 1 处差异，恢复轮 66/66；全量原生 stdout/退出码存 a1-*.txt | 重启恢复（新 Host），不冒充同进程恢复；npm 恢复证据为 API+UI 双证（ZCode 重启致 UI 导出延迟，见偏差记录） |
| A2 R9 adjacent patch hashes | pass | pass | desktop：beforeHash=afterHash=afterReinstallHash=**E70A7C04…（三次完全一致）**，A2-desktop-patch-{beforeHash,afterHash,afterReinstallHash}.txt；npm：**6E73523D…（三次完全一致）**；卸载后 deps 空、@openbkn 0 文件、三 row/UI 消失；重装 exit 0（A2-*-reinstall-native.txt）、66/66、新 Host 三 row/v-7 | 卸载前后紧邻取哈希、中间无 setup；测试 patch 层（两 root 无真实用户 patch）；无 Host 重写发生，无需单独解释项 |
| A3 state and owned cleanup | pass | pass | owned-pids-final.md（全表：pid:ticks/端口/身份核验输出/停止结果）；user-state-after.json：**37/37 与开始前完全一致（内容哈希级）**；final-residual-check.json：node=0、app=0、端口 0；A2 停止输出在 a2/a3 脚本存档 | 本次 before/after 均为内容哈希（此前"未验证"缺口已闭合）；执行偏差 1 项（ZCode 重启）如实记录 |
| A4 synchronized F02 | n/a | **pass 6/6** | A4-prepare-native-*.txt（exit 0，probePackage 路径与 probe --plugin 参数**完全相同**，A4-path-consistency 存档）；A4-fidelity-runtime-*.jsonl（六场景显式 pass：corrected-same-turn / second-mismatch-errors / unbound-unaffected / full-question-summary-rejected / headerless-cached-reprint / scoped-inventory-cached-repair）；A4-summary.json（起止时间/退出码/SHA=BA544874…/bytes） | 全新 fidelity-final-probe-\<stamp\> 目录；fixture 不算真实模型/平台验收 |
| B1 real login | not-run | not-run | — | 无真实账号/凭据（未借用日常凭据） |
| B2 F01 | not-run | not-run | — | 同上 |
| B3 original three questions | not-run | not-run | — | 无模型凭据；不产生模型费用 |
| B4 live guard | not-run | not-run | — | 需有效登录+两个授权网络 |
| B5 remaining G6 | not-run | not-run | — | 同 B1/B3 |

## State files and adjacent hashes
- 日常选定文件（profiles/{desktop,work} 的 package.json/cordis.patch.yml/pnpm-lock.yaml + sessions/storages 保护清单）：**37 项 before/after 内容哈希全部一致**（user-state-before.json / user-state-after.json，仅哈希无正文）
- A2 紧邻哈希链见上表；受控写入序列（健康→canary→健康）仅存在于测试 root 的 patch，日常 profile 未发生任何写入

## Owned process table
owned-pids-final.md（全表+停止输出+终态扫描）；本轮无 cleanup skip；boot.pid 记录本轮全部成功（无引号错误复发）

## Model/data provenance
不适用：B3/G6 未执行（无凭据）；F02 为受控 fixture（A4 段分列）

## Export identity and Git equality
本轮 8 份新 JSON（A1×5 + UIexport×2 + A1 npm W4 1 份）本地原件路径/bytes/SHA 见 evidence 清单；Git blob 一致性按换行归一比较（本地 CRLF/Git LF），提交后以 exports 一致性记录归档；**npm 恢复报告同时持有 UI 导出件（76ea8184）与 Host API 件（53df4e9b），内容判定一致**

## Remaining items
1. B1–B5 全部 not-run（无真实账号/模型/双网络凭据）——补测需用户提供隔离登录
2. 执行偏差（非候选缺陷）：ZCode 宿主重启一次，致 npm UI 导出延迟落盘与保存对话框不可用，已用 Host API 补证并双证一致
3. 开放项沿用：深层库存能力超时、平台 #2029 大结果落库、历史故障机器根因、设置向导重现根因
4. 不得据本轮测试通过宣称发布；发布门禁由主 agent 决定
