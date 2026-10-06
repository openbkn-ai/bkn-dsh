# Windows -6 候选原生验收结果（供主 agent 复核）

- 执行分支：自交付 commit `37fc23b4d356478cc8af657a87f546696d1365f1`（fix/diagnostics-d0-s2）检出
- 候选：`0.2.0-rc.2-openbkn.0.2.0-6`（源码 `144afa5`，CI 37337765993，publish=false，tgz SHA `ffcd7772…ef43`，65 文件逐哈希一致）
- 环境：Windows 10 19045 / 原生 PowerShell 5.1 / Desktop 0.2.0-rc.2（随附 node 24.18.1）+ 隔离 npm DSH 0.2.0-rc.2 / Node 24.21.0 / pnpm 11.7.0 / OpenBKN CLI 0.1.5；全程无 WSL、无 inspector（应用设置 developerTools:false）
- 执行时间：2026-10-06；测试根：C:\bkn-verify（desktop / npm 两隔离 DSH_HOME+BKN_CONFIG_DIR）

## 读法
1. **RESULTS.md** — 按结果模板逐项填写的完整矩阵（W0–W12、R1–R9/U1、G6、live guard、变体 SHA、清理记录、异常清单）
2. **probe-tests.md** — 评分器自测 3/3、guard-probe CLI 测试 4/4 的原始摘要；真实 G6/live guard not-run 及原因
3. **helper-diffs.diff** — 对 kit 三个 helper 的原生修正（BOM-less patch、PS5.1 FileInfo 删除、npm 子进程清理）；verify-kit.ps1 保持原字节（自哈希锁定，改用 System32 前置 PATH 的环境级 workaround）
4. **desktop-evidence/ 、npm-evidence/** — 导出的诊断 JSON（含报告编号）、产品 UI 快照记录、变体 base/variant SHA（run-case 生成）、前后状态哈希

## 一句话结论
核心门槛（W0–W4、W10）桌面与 npm 两形态通过；U1/R1/R2/R9、W9 脱敏（canary 零泄漏）、W7 受控分类（network-unreachable / tls-failed 分立）通过；**发现 1 个候选行为问题：非法格式 baseUrl 不被 configuration 阶段拦截（两形态一致，见 RESULTS W2 行）**；真实登录依赖项（真实 G6、live guard、W6 真实权限、R3–R8、平台 tools/list）全部 not-run（无真实凭据，未伪造）。发布门禁不因本轮放行。

## 复核重点（建议）
- W2 非法 URL 未拦截是否接受/排期（desktop: W2b-desktop-addbb3eb.json；npm: npm-evidence/W2b-npm-dialog.md）
- helper 修正 diff 是否合入 kit（尤其 run-case.ps1 的 BOM 写入——PS5.1 下会破坏 Host 配置加载）
- 观察项：Desktop 每次启动重现设置向导（DSH 应用层，根因未定位）；npm 11.19 install-scripts 隔离告警（不影响 dsh web）
