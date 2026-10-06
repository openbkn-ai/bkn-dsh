# Windows -6 候选原生验收结果（供主 agent 复核）

- 执行分支：自交付 commit `37fc23b4d356478cc8af657a87f546696d1365f1`（fix/diagnostics-d0-s2）检出
- 候选：`0.2.0-rc.2-openbkn.0.2.0-6`（源码 `144afa5`，CI 37337765993，publish=false，tgz SHA `ffcd7772…ef43`，65 文件逐哈希一致）
- 环境：Windows 10 19045 / 原生 PowerShell 5.1 / Desktop 0.2.0-rc.2（随附 node 24.18.1）+ 隔离 npm DSH 0.2.0-rc.2 / Node 24.21.0 / pnpm 11.7.0 / OpenBKN CLI 0.1.5；全程无 WSL、无 inspector（应用设置 developerTools:false）
- 执行时间：2026-10-06；测试根：C:\bkn-verify（desktop / npm 两隔离 DSH_HOME+BKN_CONFIG_DIR）
- 本目录自 b2c0eca 起经主 agent 三轮复核整改（详见 RESULTS.md 顶部修订说明 1–15 条）

## 读法
1. **RESULTS.md** — 完整矩阵（W0–W12 逐项两形态、R1–R9/U1、G6、live guard、变体 SHA、清理记录、异常清单），判定已按复核意见收窄
2. **probe-tests.md** — 评分器自测 3/3、guard-probe CLI 测试 4/4；真实 G6/live guard not-run 及原因
3. **helpers-fixed/** — 修正后的三个可执行 helper（原生 PowerShell 解析通过），交付 ZIP 保持字节锁定，下次构建 kit 时合入；**helper-diffs.diff** 为其相对 ZIP 原件的逐行差异
4. **desktop-evidence/ 、npm-evidence/** — 诊断报告导出 JSON 共 **15 份（desktop 6 + npm 9）**；状态哈希与 prepared 共 **20 份（desktop 8 + npm 12，npm 补测轮为 before-W-*-r2.json、原始 before-W*.json 保留 b2c0eca 原值）**；另有 UI 快照记录与变体 base/variant SHA

## 一句话结论（按证据强度如实表述）
- **通过且为 JSON 级证据**：W1（两形态导出）、W2 缺-baseUrl（两形态）、W3/W4 故障分类（两形态）、W7 连接/TLS 分类（npm）、W9 canary 值零泄漏（desktop）。
- **通过，证据为逐文件哈希比对（非诊断 JSON）**：W0（两形态 65/65 一致）。
- **通过，证据为实机操作记录（UI 观察/插件管理器状态/磁盘核验，非诊断 JSON）**：W12 重装/卸载/撤销恢复（两形态）、R1 三 row、R2 未登录入口；U1 升级观察按项目决策仅留档。
- **候选缺陷（fail，两形态 JSON：desktop addbb3eb + npm 073b491e）**：非法格式 baseUrl 不被 configuration 阶段拦截。
- **通过但仅产品 UI 记录（无导出 JSON，降级态无导出按钮）**：W10 诊断故障降级与业务入口保留（两形态）；其多 Host/并发/导出失败子项 not-run。
- **not-run**：真实登录依赖项全部（真实 G6、live guard、W6 真实权限、R3–R8、平台 tools/list）；就地升级按项目决策取消（发布走"旧版本完全卸载后重装"）。
- **发布门禁不因本轮放行**（候选缺陷 + 登录依赖未测 + macOS G6 三失败均未消除）。

## 复核重点
- W2 非法 URL 未拦截的接受/排期（desktop **addbb3eb**、npm **073b491e**；缺-baseUrl 的 b10fcb42/2f59d3c7/0214f597 是另一子项证据，勿混引）
- 隔离偏差披露（RESULTS"隔离偏差与纠正"节）：10:30 冒烟未设 DSH_HOME 曾初始化 ~/.dsh/profiles/web 样板骨架，已确认并清除；原用户其余状态 **mtime 扫描未发现变化**（不以此证明内容未变）
- helper（helpers-fixed/ + diff）：cleanup 停止前核验 = 记录 PID 存活 + **创建时间一致**（拒绝 PID 复用）+ 形态身份（desktop=exe 路径 / npm=CLI 路径）；web 子进程另加 node.exe、' web '、端口数字边界与**当前监听归属**。实测含确定性复用拒绝用例：同 pid 同端口、创建时间不符的伪造记录被拒（skip 日志），真实记录"listener verified"后停止、端口释放
- 观察项：Desktop 每次启动重现设置向导（DSH 应用层，根因未定位）；npm 11.19 install-scripts 隔离告警（不影响 dsh web）
