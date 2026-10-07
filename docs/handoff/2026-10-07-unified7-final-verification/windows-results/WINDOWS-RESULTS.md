# Windows final verification results

日期/操作人/handoff commit：2026-10-07 晨 / Windows agent（ZCode）/ handoff `150d85d7e7d49d2091b918b641faee72e629081b`（分支 docs/unified7-final-verification）
证据分支/固定回传 commit：`docs/unified7-final-verification-windows` / 本次回传 commit（见推送输出）
包版本/source/原 CI/主线彩排/tgz SHA：`0.2.0-rc.2-openbkn.0.2.0-7` / `3414bde…` / CI 37478119730（publish=false）/ 主线彩排 37500800409（main 870e269，产物与原 tgz 整包相同——按 handoff 记录，未重复核验 CI 产物，本轮用同一固定 tgz）/ `6bbab278…63a8`（177,442B/66 文件）
kit commit/ZIP SHA/实际工具路径和版本：kit `1fcffa9…` / ZIP `df0016c6…`（248,434B，本轮未重新下载，沿用已核验本地 diag7-fidelity；verify-kit 原生输出：原 A0 采集 verify-kit-native.txt 因 `2>&1` 只余空行，修正后以 `*>&1` 重采通过并存档 corr1-verify-kit-native-\*.txt）/ 工具树 C:\bkn-verify\diag6-tools（npm DSH 0.2.0-rc.2、CLI 0.1.5 实测输出；Node 24.21.0、pnpm 11.7.0、PS 5.1）
两隔离 root/profile/实际 Host/端口：unified7-fidelity-desktop（desktop profile，Desktop exe 原生启动）/ unified7-fidelity-npm（web profile，隔离 dsh.cmd web，18301-18303）；证据目录 unified7-final-evidence-20261007（新建，未覆盖原记录；原证据另存 snapshot-*-before-final）

| ID | Desktop | npm | 原件绝对路径 / reportId / bytes / SHA / 实际退出码 | 判定依据及限制 |
|---|---|---|---|---|
| A0 identity | pass | pass | verify-kit-native.txt（exit 0）；a0-identity-current.json：两形态 66/66（missing/differs/extra 全空，v=-7，实际安装路径在档） | 静态身份与实际加载（插件管理器三 row、报告 pluginDisk=-7）分列；user-state-before.json=37 个日常/保护文件开始前内容哈希 |
| A1 W4 fail→recovery | pass | pass | desktop：A1-desktop-W4fault-88487be9.json（fail/initialization-failed）→ A1-desktop-recovered-659d6bc5.json（**4 项 pass + 预期的 not-logged-in**（当时无凭据），旧失败无残留）；npm：A1-npm-W4fault-be8eccbe.json（UI 导出）→ A1-npm-recovered-53df4e9b.json（Host API）+ UIexport-…-76ea8184.json（延迟落盘的 UI 导出，判定同 pass）。**修正（配对）**：a1-desktop-W4-043505-W4-md.txt 为运行前快照，含上一轮 pid 19728/变体 343DEAA5；本轮 A1 故障相实际为 pid 22548/变体 E3B4CDDB（post-run 副本 a1-desktop-W4-043505-W4-md-r2.txt，与 RECOVER 相副本同哈希 68520c08…，恢复相跑 W1 无新 W4 元数据，故恢复相证据中的 W4-md 沿用故障相元数据）。npm 侧 W4-md 两副本一致（10580/10668/18301，变体 738BAADB…）。变体安装件核对：W4 轮恰好 business.js 1 处差异，恢复轮 66/66；全量原生 stdout/退出码存 a1-*.txt | 重启恢复（新 Host），不冒充同进程恢复；npm 恢复证据为 API+UI 双证，**判定一致不等于字节一致**（1854/1850/1852 字节互不相同）；UI 导出落盘延迟与 ZCode 重启仅时间顺序关联，**因果未证实**（见偏差记录） |
| A2 R9 adjacent patch hashes | pass | pass | desktop：beforeHash=afterHash=afterReinstallHash=**E70A7C04…（三次完全一致）**，A2-desktop-patch-{beforeHash,afterHash,afterReinstallHash}.txt；npm：**6E73523D…（三次完全一致）**；卸载后 deps 空、@openbkn 0 文件、三 row/UI 消失；重装 exit 0（A2-*-reinstall-native.txt）、66/66、新 Host 三 row/v-7 | 卸载前后紧邻取哈希、中间无 setup；测试 patch 层（两 root 无真实用户 patch）；无 Host 重写发生，无需单独解释项 |
| A3 state and owned cleanup | pass | pass | owned-pids-final.md（修正版全表：pid:ticks/端口/pid 原件；**停止动作的原生控制台行未留存，标 insufficient-evidence**，见"留存状态"节——pid 原件与零残留终态在档，五重身份核验过程性断言降级为会话记录引用）；user-state-after.json：**37/37 与开始前完全一致（内容哈希级）**；final-residual-check.json：node=0、app=0、端口 0 | 本次 before/after 均为内容哈希（此前"未验证"缺口已闭合）；执行偏差 1 项如实记录（归因限定见 A1 行） |
| A4 synchronized F02 | n/a | **pass 6/6** | A4-prepare-native-*.txt（exit 0，probePackage 路径与 probe --plugin 参数**完全相同**，A4-path-consistency 存档）；A4-fidelity-runtime-*.jsonl（六场景显式 pass：corrected-same-turn / second-mismatch-errors / unbound-unaffected / full-question-summary-rejected / headerless-cached-reprint / scoped-inventory-cached-repair）；A4-summary.json（起止时间/退出码/SHA=BA544874…/bytes） | 全新 fidelity-final-probe-\<stamp\> 目录；fixture 不算真实模型/平台验收 |
| B1 real login | **pass** | **pass** | b-batch/b1/（B1-SUMMARY.md + axtree/PNG/快照/pid 原件） | 设备授权流（用户浏览器确认）；token 落隔离 bkn-config；两形态列网 2、绑定 workspace-supply、刷新"已关联优先显示"；npm 复用隔离 store（交接允许，见偏差 4） |
| B2 F01 provenance | **pass**（图 13 元素样例） | **pass**（6 元素三层闭环） | b-batch/b3/B2-F01-SUMMARY.md + f01-q2-*.txt/json；b-batch/b3-desktop/d-f01-q2-graph-axtree.txt | 图元素 ref（op id/工具/网络）↔证据链回执↔CLI `trace receipts get` 平台核验闭环（npm）；desktop 记录图结构样例，未逐元素重放 |
| B3 original three questions | **3/3 pass** | **3/3 pass** | b-batch/b3/（三题快照+对账 B3-Q2-RECON.md+oracle 20 文件）；b-batch/b3-desktop/B-DESKTOP-SUMMARY.md | DeepSeek-V41-Flash High 新会话；独立 oracle 作答前预采集；Q2 两形态均 313/313 行零缺零多零差值（npm 需续轮、desktop 首轮完成）；Q1/Q3 全要点命中；已知开放项（容量上限/深层库存超时）如实记录 |
| B4 live guard | **2 核心用例 pass** | **2 核心用例 pass** | b-batch/b4/B4-LIVE-GUARD-SUMMARY.md + 快照；b-batch/b3-desktop/d-guard-*.txt | 未绑定会话平台硬拒绝 + 跨网隔离（worldcup 绑定会话问 supply 数据无跨网披露）；其余 live guard 细分用例 not-run，不宣称全量通过 |
| B5 remaining G6 | not-run | not-run | — | 受限账号仍缺，unauthorized-network 等保持 not-run（用户决定） |

## State files and adjacent hashes
- 日常选定文件（profiles/{desktop,work} 的 package.json/cordis.patch.yml/pnpm-lock.yaml + sessions/storages 保护清单）：**37 项 before/after 内容哈希全部一致**（user-state-before.json / user-state-after.json，仅哈希无正文）
- A2 紧邻哈希链见上表；受控写入序列（健康→canary→健康）仅存在于测试 root 的 patch，日常 profile 未发生任何写入

## Owned process table
owned-pids-final.md（修正版全表+终态扫描）；本轮无 cleanup skip；boot.pid 记录本轮全部成功（无引号错误复发）。**修正**：A2 新 Host 的 pid 原件（A2-desktop-newhost.pid、A2-npm-newhost.children.pid）已随本次修正提交入库；cleanup/A2/A3 停止动作的 Write-Host 原生行因外层脚本 `2>&1` 不捕获 Information 流而未留存（已核对会话日志不可回收），如实标 insufficient-evidence，非追溯补造

## Model/data provenance
不适用：B3/G6 未执行（无凭据）；F02 为受控 fixture（A4 段分列）

## Export identity and Git equality
**修正（provenance 补交）**：A 批 6 份报告 = **5 份产品 UI 导出 + 1 份 Host API**（A1-desktop 故障/恢复 2、A1-npm 故障 1、UIexport×2、A1-npm-recovered-53df4e9b 为 Host API）。每份的采集通道、归档绝对路径、SHA-256、字节数与 Git blob 逐一对比见 **report-provenance.md**（本地原件 vs `git show HEAD:` 字节级 SHA 全部 identical，无换行归一处理）。API 件与 UI 件只宣称判定一致，不宣称字节一致。

## Remaining items
1. B 批已于 2026-10-07 晚全部执行（见上表）；本提交为 B 批独立回传（b-batch/，72 文件）
2. **token 复制共享失效实证（G6"自动续期"开放项现场证据）**：npm 复用 desktop 设备授权 token 后，两份字节相同的 token 先后被平台判 401（desktop 10:33、两侧 10:44 起）；desktop 以独立设备授权重登（用户确认用户码 jrqMJCN4）后全部通过。npm 侧结果均在事件前取得，不受影响
3. **产品行为观察（非判定项）**：token 失效态 OpenBKN 面板仅"重试/诊断"无重新登录入口，重试不恢复，需 CLI `auth login --device` 修复
4. 执行偏差（如实）：desktop 自动化输入曾误粘剪贴板残留（用户 API key 片段）入 composer，**未发送即清除**，未进入会话/请求，证据文件已扫描确认无残留
5. 开放项沿用：深层库存能力超时、平台 #2029 大结果落库、历史故障机器根因、设置向导重现根因、token 自动续期（新增上述实证）
6. 不得据本轮测试通过宣称发布；发布门禁由主 agent 决定

## 本修正提交内容（amendment，2026-10-07 晚）
1. **corr1-verify-kit-native-\*.txt**：以 `*>&1` 重采 verify-kit 原生输出（原 verify-kit-native.txt 仅一空行，系 `2>&1` 不捕获 Write-Host/Information 流）；kit 未改动
2. **A2 pid 原件补交**：A2-desktop-newhost.pid（8892:…）、A2-npm-newhost.children.pid（3396:18303:…）
3. **配对修正**：a1-desktop-W4-043505-W4-md-r2.txt（post-run，pid 22548/变体 E3B4CDDB；原 043505 副本为运行前快照 pid 19728）；npm W4-md 副本核对一致无需重采
4. **report-provenance.md**：6 份报告 5 UI+1 API 的通道/路径/SHA/Git 字节级对比
5. **owned-pids-final.md 修正版** + 本文件措辞修正（4 pass+预期 not-logged-in；API/UI≠字节一致；下载延迟归因未证实；停止日志未留存标 insufficient-evidence）
