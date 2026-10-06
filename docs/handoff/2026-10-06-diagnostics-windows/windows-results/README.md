# Windows -6 候选原生验收结果（供主 agent 复核）

- 执行分支：自交付 commit `37fc23b4d356478cc8af657a87f546696d1365f1`（fix/diagnostics-d0-s2）检出
- 候选：`0.2.0-rc.2-openbkn.0.2.0-6`（源码 `144afa5`，CI 37337765993，publish=false，tgz SHA `ffcd7772…ef43`，65 文件逐哈希一致）
- 环境：Windows 10 19045 / 原生 PowerShell 5.1 / Desktop 0.2.0-rc.2（随附 node 24.18.1）+ 隔离 npm DSH 0.2.0-rc.2 / Node 24.21.0 / pnpm 11.7.0 / OpenBKN CLI 0.1.5；全程无 WSL、无 inspector（应用设置 developerTools:false）
- 执行时间：2026-10-06；测试根：C:\bkn-verify（desktop / npm 两隔离 DSH_HOME+BKN_CONFIG_DIR）
- **本目录第 2 次提交为按主 agent 复核意见的整改**（判定收窄、npm 证据升级为 JSON、W7 补档、cleanup 收紧、隔离偏差披露；详见 RESULTS.md 顶部"修订说明"）

## 读法
1. **RESULTS.md** — 完整矩阵（W0–W12 逐项两形态、R1–R9/U1、G6、live guard、变体 SHA、清理记录、异常清单），判定已按复核意见收窄
2. **probe-tests.md** — 评分器自测 3/3、guard-probe CLI 测试 4/4；真实 G6/live guard not-run 及原因
3. **helper-diffs.diff** — helper 修正 4 处：prepare 首启例外；run-case 无 BOM patch + web 子进程 PID 记录（按端口监听者解析）；cleanup `-LiteralPath` + 仅停记录在案子进程（PID+端口+命令行三重核验，`*.pid` 排除 `*.children.pid`）——子进程机制已实测（记录 pid 15104/port 8280 被精确停止、端口释放）。verify-kit.ps1 保持原字节（自哈希锁定；System32 前置 PATH 为环境级 workaround）
4. **desktop-evidence/ 、npm-evidence/** — 导出 JSON（desktop 7 份 + npm 11 份）、UI 快照记录、变体 base/variant SHA、前后状态哈希。npm W2/W3/W4/W7 均已升级为真实导出 JSON（复核提醒保存对话框需确认后补全；早期两份静默下载件亦已回收）

## 一句话结论
核心门槛（W0–W4、W10）两形态通过且 npm 侧为 JSON 级证据；W7 连接/TLS 分类（network-unreachable / tls-failed 分立）为 JSON 级；W9 canary 零泄漏；R1/R2/R9/W12 重装卸载通过；**候选缺陷：非法格式 baseUrl 不被 configuration 阶段拦截（两形态一致）**；真实登录依赖项全部 not-run。**就地升级路径按项目决策（2026-10-06）取消，发布采用旧版本完全卸载后重装；-4→-6 观察仅留档非门禁。发布门禁不因本轮放行。**

## 复核重点
- W2 非法 URL 未拦截的接受/排期（desktop addbb3eb；npm 0214f597 + b10fcb42/2f59d3c7 三轮一致）
- 隔离偏差披露（RESULTS"隔离偏差与纠正"节）：10:30 冒烟未设 DSH_HOME 曾初始化 ~/.dsh/profiles/web 样板骨架，已确认并清除；原用户其余状态 mtime 核验未变
- helper diff 是否合入 kit（BOM 写入修正是硬需求；cleanup 子进程机制已按"记录+三重核验"收紧并实测）
- 观察项：Desktop 每次启动重现设置向导（DSH 应用层，根因未定位）；npm 11.19 install-scripts 隔离告警（不影响 dsh web）
