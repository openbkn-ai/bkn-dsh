# Windows -6 诊断候选验收结果（本机独立实测）

- 日期/Windows/PowerShell：2026-10-06；Windows 10 19045（win32）；原生 Windows PowerShell 5.1.19041.5848（无 WSL、无 inspector）
- CLI 0.1.5 / npm DSH/Node/pnpm / Desktop/随附 Node：
  - OpenBKN CLI 0.1.5（隔离 @openbkn/bkn-sdk 安装，实测 `--version` 输出 0.1.5）
  - npm DSH 0.2.0-rc.2（隔离 @deepseek-ai/dsh 安装，实测 `--version` 输出 0.2.0-rc.2）；npm 形态 Node v24.21.0 / pnpm 11.7.0
  - Desktop 0.2.0-rc.2（官方安装 %LOCALAPPDATA%\Programs\DeepSeek Harness，exe FileVersion 0.2.0-rc.2；随附 runtime node 24.18.1 / pnpm 11.7.0；桌面 dsh.cmd --version=0.2.0-rc.2）
  - npm 11.19.0（install-scripts 隔离告警涉及 koffi/node-pty；`dsh web` 实测可正常启动，未重建）
- CI run/source/tgz SHA/实际安装文件一致性：CI 37337765993（publish=false）、源码 commit 144afa503c7d…、候选 tgz SHA-256 ffcd77722e83…ef43（162,967B/65 文件）；获取 HEAD=37fc23b4d356…5f1；ZIP SHA eac27ecf…72fd 核验通过；verify-kit.ps1 通过；两形态安装后逐文件 SHA 与清单 65/65 一致（missing=0 differs=0 extra=0）
- 两形态 profile、实际 Host PID/启动路径、不开 inspector 证据：desktop=隔离 DSH_HOME C:\bkn-verify\diag6-desktop（profile desktop，Desktop exe 原生启动）；npm=隔离 web profile C:\bkn-verify\diag6-npm（隔离 dsh.cmd web 启动，8231-8251 端口）；应用自身设置记录 developerTools:false；全程未开启 DevTools/inspect
- 平台各服务镜像、tools/list 来源和检查时间：测试平台 192.168.50.28:443 可达（2026-10-06 ~10:20 探测）；真实 tools/list 与各服务身份需登录态，本轮无真实凭据 → not-run（隔离 store 从未登录；原用户 store 依隔离规则未触碰）

| Case/子项 | Desktop | npm | 证据级别 | JSON 路径/报告编号/SHA | 操作/结果/异常 |
|---|---|---|---|---|---|
| W0 | pass | pass | 实机安装+逐文件哈希 | tgz ffcd7772…；安装件 65/65 一致 | 两形态 prepare 成功；桌面首启初始化为 Windows 特有前置（见 helper diff prepare.ps1） |
| W1 | pass | pass | 产品入口一次导出 | desktop: evidence/W1-desktop-20e57aba.json (SHA 1B5BDEF6…C3DB)；npm: evidence/W1-npm-e5c1a19c.json (SHA F8E5ED6D…79F2) | 侧栏单一 OpenBKN→面板右上角仅"诊断"→导出；报告编号与面板一致；passive 模式；checks: bootstrap/business/diagnostics-entry=pass、cli=pass(exitCode 0)、login-state=fail/not-logged-in（未登录为真实状态，如实报告）。getReport 本身无平台请求的证据=passive+无凭据可刷新；父面板业务读取以 observed:login-state 单列 ✓ |
| W2 缺 baseUrl | pass | pass | 真实 Host 受控故障 | desktop: evidence/W2-desktop-e35583f2.json (8CAA0D91…)；npm: 172d20a3*（见 W2-npm-dialog.md） | business-entry=fail/configuration-invalid/configField=baseUrl；外框+诊断可用；分类为真实校验而非静态检查 ✓ |
| W2 非法格式子项 | fail(候选行为) | fail(候选行为) | 真实 Host 受控故障 | desktop: W2b-desktop-addbb3eb.json；npm: 172d20a3 轮 W2b-npm-dialog.md | 非法格式 baseUrl（含空格/坏 scheme）未被 configuration 阶段拦截：business-entry=pass，仅 not-logged-in 失败。两形态一致 → 交主开发判定 |
| W3 | pass | pass | 故障变体（真实 import 错误） | desktop: W3-desktop-b8062c24.json；npm: aa8e40a3（W3-npm-dialog.md） | business-entry=fail/**module-resolution-failed**；侧栏单一 OpenBKN+外框不随失败；诊断独立可开；配置缺失与 import 错误未混同；变体 base/variant SHA 记录于 evidence/W3-*.md |
| W4 | pass | pass | 故障变体（apply() 受控抛错） | desktop: W4-desktop-73033c09.json；npm: 32c3ff70（W4-npm-dialog.md） | business-entry=fail/**initialization-failed**；诊断仍可用、阶段对应；平台地址/Token 未被误指 |
| W5 | 部分 pass | 部分 pass | 实机 | W9 轮报告 163170fb | CLI 不可用→observed:cli=fail/**cli-missing**（与登录状态区分）✓；首次未登录（空 BKN_CONFIG_DIR，从未 logout 伪装）→面板登录入口+诊断可开 ✓；平台不匹配→需真实平台权限账号 not-run |
| W6 | not-run(真实) | not-run(真实) | — | — | 无真实受限账号；受控拒绝归入 W7 轮（network-unreachable/tls-failed）；不以本机 permissive stub 证明权限 |
| W7 连接失败 | not-run(desktop) | pass(npm) | 受控端点+虚构凭据，有界等待 | 8250 轮 e37d8d02 前后、8251 轮报告 | 连接失败=observed:context-loader/**network-unreachable**（闭合端点）；TLS 失败=/**tls-failed**（真实平台自签证书、本轮不加载 CA，未禁用证书检查）；两类分别分类、等待有界、重试入口存在；后续恢复由 W1/W9 轮健康态证明 |
| W8 | 部分(npm) | 部分(npm) | 受控 | 8250/8251 轮 | MCP 连接失败=network-unreachable ✓；目录请求失败（MCP 通、目录挂）需真实平台+登录 → not-run |
| W9 | pass(desktop) | —（同代码路径，desktop 实测） | 故意植入 canary | W9-desktop-163170fb.json | canary baseUrl/cliPath/伪造 token 文件内容在导出报告与 UI 中零出现（grep CANARY=0）；不可脱敏段未虚构；被动/主动记录区分（observed:* 单列） |
| W10 | pass | pass | 故障变体（诊断 import 破坏） | 产品 UI 快照（transcript+无独立 JSON：诊断服务不可用时不提供导出） | 降级文案"诊断服务不可用（诊断入口未随插件启动或连接中断）"如实显示；业务入口保留（登录 UI+平台地址正常）；不虚构健康；关闭重开同样降级 ✓；主动复测/取消=optional/not-run；多 Host 并发=not-run；导出失败路径=not-run（该变体下无导出入口，未见 raw Error） |
| W11 | 部分 | 部分 | 实机 | W1/W9 轮 | 无真实浏览器登录（无凭据）→ R3-R8、真实列目录 not-run；CLI 0.1.5 兼容=observed:cli pass（exitCode 0，多轮）；hasToken-only/expired 解析覆盖未测（fixture 分列缺） |
| W12 | pass(desktop+npm) | pass(npm) | 实机升级/重装/卸载 | U1-upgrade.md、R9-npm.md | -4/-5→-6 升级、ID-only 保留、两种 name-qualified 迁移、重复安装三 row 各一（共 3 个·3 运行中）、R9 整包卸载（两形态：row/UI 消失、deps 清空、用户 patch 保留）；撤销故障恢复=W9 轮重装后 business-entry=pass |

- R1–R9 / U1 逐项结果：R1 pass（desktop 插件管理器三 row 各一运行中；npm 重复安装轮"共 3 个·3 运行中"）；R2 pass（未登录→登录入口+诊断可开，多轮）；R3-R8 not-run（需真实登录/绑定/模型/两个真实网络）；R9 pass（desktop+npm）；U1 pass（全子项，见 U1-upgrade.md）
- G6：评分器自测 3/3 通过（run-eval.test.mjs：not-run 单列、无权限账号排除、全未测不得计成功）；真实模型 G6 **not-run**（无真实登录/模型凭据；Windows 不继承 macOS 7/10 结果）；g6-marks.json 未生成（不得预填）
- live guard：guard-probe-cli.test.mjs 4/4 通过（含 Windows .cmd/PATH/带空格&路径用例）；--live 真实 ToolRuntime 探针 **not-run**（需有效登录+两个真实网络 ID）
- 每个变体 base/variant SHA：见各 root evidence/W3|W4|W10-*.md（run-case 记录 base ffcd7772… 与 variant SHA、修改文件前后 SHA）
- 报告下载完成绝对路径：desktop 全部经原生另存为对话框直存 C:\bkn-verify\diag6-desktop\evidence\*.json；npm W1 经浏览器下载落 D:\mydocs\downloads\ 后移入 evidence 并删除原件（其余 npm 轮因 IAB 下载通道回放缓存不可靠，改以产品 UI 快照为证，已在 dialog.md 注明）
- 原生 helper 修正 diff/语法与实际运行结果：四个 helper 原生解析全过；修正 3 处（prepare.ps1 首启例外、run-case.ps1 无 BOM patch、cleanup.ps1 LiteralPath+npm 子进程停止），diff 见 C:\bkn-verify\helper-diffs.diff；verify-kit.ps1 曾试改 tar 解析后因自哈希锁定回退，改用子进程 PATH 前置 System32（环境级 workaround，未改 kit 字节）
- 已选原状态哈希、父面板操作与被动导出的状态/请求分别记录：各 root evidence/before-*.json、after-*.json（collect-state-hashes 输出）；observed:* 与 entry 检查单列
- 本轮 PID/临时登录与清理、保留证据、未触碰原 profile 的范围：本轮零登录（无从登出）；结束态本轮进程 0 残留（app×多子进程、web 子进程全部核验身份后停止）；两 profile 候选均已卸载；canary 伪造凭据已删；patch 复位为健康配置；应用首启自动创建的空默认工作区目录（D:\mydocs\documents\deepseek-harness\，0 文件）已删除；%APPDATA% 无 DeepSeek Harness 目录（原用户环境未动）；C:\bkn-verify\ 保留全部脱敏证据（含 private/ 下含 token 的 web 日志——不回传）
- 所有异常/未测/客户根因仍未知项：
  1) 非法格式 baseUrl 未被 configuration 校验拦截（W2 子项 fail，交主开发）
  2) Desktop 每次启动重现设置向导（跳过充值完成态似乎不持久；DSH 应用层行为，与候选插件无关，未定位根因）
  3) npm 11.19 install-scripts 隔离告警（koffi/node-pty 脚本未跑；dsh web 实测正常）
  4) IAB 浏览器下载通道不稳定（首次成功、后续回放旧下载）；已改用 UI 快照取证
  5) 诊断报告 dshVersion/pluginLoadedVersion=null（与 manifest knownLimitations 一致）
  6) W1 首测时 BOM patch 曾致 Host "未能保存设置"启动故障——helper 已修（无 BOM 写入），候选本身在正确 patch 下无此问题
