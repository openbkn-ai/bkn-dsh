# Windows -6 诊断候选验收结果（本机独立实测 · 按主 agent 两轮复核意见修订）

> 修订说明（第 2 轮复核意见已落实）：
> 8. 数量口径更正：第 2 次提交（5f41fcb）实际变更 19 个文件；结果目录现有诊断 JSON **desktop 6 份 + npm 9 份 = 15 份**（另含状态哈希/prepared 12 份）；
> 9. npm 非法 URL 补导出 JSON（073b491e，business-entry 未拦截）；README 原先误引缺-baseUrl 报告支持非法 URL 结论——已纠正为 addbb3eb（desktop）+ 073b491e（npm）；
> 10. cleanup 身份核验补强：父 PID 停前按形态核验（desktop=ExecutablePath 与 prepared.desktopAppPath 相等；npm=命令行含本轮 dsh.cmd 路径），子进程四重核验（node.exe + CLI 树路径 + ' web ' + 端口正则带数字边界 `(\s|$)`），已实测；
> 11. 原始 before-W2/W3/W4/W10.json 已恢复为 b2c0eca 原值，补测哈希另存 before-W-*-r2.json；
> 12. 原用户状态表述收窄为"mtime 扫描未发现变化"（不以 mtime 证明内容未变）。
>
> 修订说明（第 3 轮复核意见已落实）：
> 13. helper 身份核验补强至创建时间维度：run-case 记录 `pid:creationTicks`（父）与 `pid:port:creationTicks`（web 子进程）；cleanup 停止前比对创建时间，子进程另核验当前端口监听归属。实测：**同 pid 同端口但创建时间不符的伪造记录被拒绝**（两条 skip 日志），真实记录经"listener verified"后停止、端口释放；
> 14. 修正后的三个 helper 以可执行文件随结果目录交付（`helpers-fixed/`，原生 PowerShell 解析通过），交付 ZIP 保持字节锁定；下次构建 kit 时合入；
> 15. 非诊断 JSON 计数更正为 **20 份（desktop 8 + npm 12）**；"隔离偏差"段残留的"确认未变"措辞已清除。

> 修订说明（对应复核意见逐条落实）：
> 1. W2 npm 报告编号已在表格与证据文件间对齐（b10fcb42/2f59d3c7/0214f597 三份 JSON 同分类）；
> 2. W7 补齐两份导出 JSON（W7a-npm-abde94b0 network-unreachable、W7b-npm-d4e7522f tls-failed）；
> 3. npm 侧 W2/W3/W4 证据由"UI 快照"升级为真实导出 JSON（复核指出下载需点击保存目的地对话框——已处理，三份 JSON 入档）；
> 4. 收窄判定：W1 副作用表述、W4 存储初始化子项、W9 嵌套错误/日志子项、W10 未测子项、U1/W12 范围（见各行）；
> 5. 新增披露：本轮一次隔离偏差（详见"隔离偏差与纠正"）；
> 6. helper cleanup 收紧为"PID+端口+命令行"三重核验（不再按路径扫停）并实测验证；
> 7. 首次提交实为 44 个文件（此前反馈误写 30）。

- 日期/Windows/PowerShell：2026-10-06；Windows 10 19045（win32）；原生 Windows PowerShell 5.1.19041.5848（无 WSL、无 inspector）
- CLI 0.1.5 / npm DSH/Node/pnpm / Desktop/随附 Node：
  - OpenBKN CLI 0.1.5（隔离 @openbkn/bkn-sdk 安装，实测 `--version` 输出 0.1.5）
  - npm DSH 0.2.0-rc.2（隔离 @deepseek-ai/dsh 安装，实测 `--version` 输出 0.2.0-rc.2）；npm 形态 Node v24.21.0 / pnpm 11.7.0
  - Desktop 0.2.0-rc.2（官方安装；exe FileVersion 0.2.0-rc.2；随附 runtime node 24.18.1 / pnpm 11.7.0；桌面 dsh.cmd --version=0.2.0-rc.2）
  - npm 11.19.0（install-scripts 隔离告警涉及 koffi/node-pty；`dsh web` 实测正常，未重建）
- CI run/source/tgz SHA/实际安装文件一致性：CI 37337765993（publish=false）、源码 commit 144afa503c7d…、候选 tgz SHA-256 ffcd77722e83…ef43（162,967B/65 文件）；获取 HEAD=37fc23b4d356…5f1；ZIP SHA eac27ecf…72fd 核验通过；verify-kit.ps1 通过；两形态安装后逐文件 SHA 与清单 65/65 一致
- 两形态 profile、实际 Host PID/启动路径、不开 inspector 证据：desktop=隔离 DSH_HOME C:\bkn-verify\diag6-desktop（profile desktop，Desktop exe 原生启动）；npm=隔离 web profile C:\bkn-verify\diag6-npm（隔离 dsh.cmd web，端口 8231-8280）；应用设置记录 developerTools:false；全程未开启 DevTools/inspect
- 平台各服务镜像、tools/list 来源和检查时间：测试平台 192.168.50.28:443 可达（2026-10-06 ~10:20 与 ~11:45 两轮）；真实 tools/list 与各服务身份需登录态 → not-run（隔离 store 从未登录；原用户 store 未触碰）

| Case/子项 | Desktop | npm | 证据级别 | JSON 路径/报告编号 | 操作/结果/异常 |
|---|---|---|---|---|---|
| W0 | pass | pass | 实机安装+逐文件哈希 | tgz ffcd7772…；两形态 65/65 | 桌面首启初始化为 Windows 特有前置（helper diff prepare.ps1） |
| W1 | pass | pass | 产品入口一次导出 JSON | desktop 20e57aba / npm e5c1a19c | 侧栏单一 OpenBKN→面板右上角仅"诊断"→导出；编号与面板一致；passive；checks 见 JSON。**收窄**：无登录凭据+passive 只能证明"导出时无可刷新 token 且无登录态检查记录"，不能证明 getReport 全路径零平台请求——该强结论未验证 |
| W2 缺 baseUrl | pass | pass | JSON 导出（两形态） | desktop e35583f2；npm b10fcb42/2f59d3c7/0214f597（三轮一致） | business-entry=fail/configuration-invalid/configField=baseUrl |
| W2 非法格式 | fail(候选行为) | fail(候选行为) | JSON 导出（两形态） | desktop addbb3eb；npm 073b491e（另 172d20a3 UI 记录同结论） | 非法格式未被 configuration 拦截：business-entry=pass，仅 not-logged-in。两形态一致 → 主开发判定 |
| W3 | pass | pass | JSON 导出（两形态） | desktop b8062c24；npm 5349bb3a（另 aa8e40a3/33db54bf 两轮 UI 记录一致） | business-entry=fail/module-resolution-failed；变体 SHA 见 evidence/W3-*.md |
| W4 apply() 抛错 | pass | pass | JSON 导出（两形态） | desktop 73033c09；npm b53dcd31（另 32c3ff70/6f94a7b9 一致） | business-entry=fail/initialization-failed |
| W4 存储初始化失败子项 | not-run | not-run | — | — | 未能从包外构造该受控故障（HANDOFF 允许"未能构造的子项留未测"） |
| W5 CLI 不可用 | pass(desktop 轮) | — | JSON | desktop W9 轮 163170fb | observed:cli=fail/cli-missing，与登录状态区分 |
| W5 首次未登录 | pass | pass | 多轮 UI+JSON | 各轮 login-state=not-logged-in | 空 BKN_CONFIG_DIR 从未登录；面板登录入口+诊断可开 |
| W5 平台不匹配 | not-run | not-run | — | — | 需真实平台权限账号 |
| W6 | not-run(真实) | not-run(真实) | — | — | 无真实受限账号；受控拒绝见 W7 轮（受控≠真实平台权限语义，分别标注） |
| W7 连接失败 | not-run(desktop) | pass | JSON 导出（npm） | W7a-npm-abde94b0（闭合端点+虚构凭据，有界 ~12s） | observed:context-loader=fail/network-unreachable；面板文案"无法连接 OpenBKN Context Loader MCP"；重试入口在；后续健康态由 W1/W9 轮证明 |
| W7 TLS 失败 | not-run(desktop) | pass | JSON 导出（npm） | W7b-npm-d4e7522f（真实平台自签证书、本轮进程不加载 CA；未禁用证书校验） | observed:context-loader=fail/tls-failed；与 network-unreachable 分立 |
| W7 有限超时恢复 | 部分 | 部分 | — | — | 等待有界✓、重试入口✓；"超时后重试恢复连接"完整链路需可连端点+登录 → 未单测 |
| W8 MCP 连接失败 | — | 部分(npm) | 同 W7a | abde94b0 | 连接失败=network-unreachable；**目录请求失败（MCP 通、目录挂）需真实平台 → not-run**；两类未混同 |
| W9 canary 值不泄漏 | pass(desktop) | — | JSON | 163170fb | canary baseUrl/cliPath/伪造 token 文件内容在导出 JSON 零出现（grep=0） |
| W9 嵌套 cause/headers/新增日志 | not-run | not-run | — | — | 未构造嵌套错误与日志捕获子项；仅验证了配置值与凭据文件不入导出 |
| W10 降级+业务保留+关闭重开 | pass | pass | 产品 UI 记录（降级态无导出按钮） | W10-*-dialog.md（两形态各两轮） | "诊断服务不可用（诊断入口未随插件启动或连接中断）"如实显示；业务登录入口+平台地址正常；关闭重开同样降级；无 raw error |
| W10 多 Host/并发覆盖/导出失败路径/主动复测 | not-run | not-run | — | — | 按 HANDOFF optional/not-run；未构造并发与导出故障注入 |
| W11 真实登录/列目录 | not-run | not-run | — | — | 无凭据；CLI 0.1.5 兼容=observed:cli pass（exitCode 0，多轮）；fixture 解析覆盖未测 |
| W12 重装/卸载/撤销恢复 | pass(desktop+npm) | pass | 实机 | R9-npm.md、transcript | 整包卸载两形态：row/UI 消失、deps 清空、用户 patch 保留；故障撤销后重装正常（W9 轮 business-entry=pass）；重复安装"共 3 个·3 运行中" |
| W12 就地升级 -4→-6 / 迁移 | 仅作观察留档 | 仅作观察留档 | 实机观察 | U1-upgrade.md | **按项目决策（2026-10-06）：不做就地升级路径，发布采用旧版本完全卸载后重装；下列观察仅留档非门禁**：-4 ID-only/name-qualified canary 均生效；升 -6 后旧 name 断言跳过 override；删 name/改 ./business 两写法恢复；ID-only 保留 |
| W12 就地升级 -5→-6 | not-run | not-run | — | — | 按项目决策取消（重装路径） |

- R1 pass（desktop 插件管理器三 row 各一运行中；npm 重复安装轮同）；R2 pass（多轮）；R3–R8 not-run（需真实登录/绑定/模型/两个真实网络）；R9 pass（两形态）；U1 见 W12 升级行（决策后仅留档）
- G6：评分器自测 3/3（not-run 单列、无权限排除、全未测不得计成功）；真实模型 G6 not-run（无凭据；不继承 macOS 7/10；g6-marks.json 未生成）；评分依赖 js-yaml 4.3.2 隔离安装
- live guard：guard-probe-cli.test.mjs 4/4（含 Windows .cmd/PATH/空格&用例）；--live 真实 ToolRuntime not-run（需登录+两个真实网络）
- 变体 base/variant SHA、修改文件前后 SHA：evidence/W3|W4|W10-*.md（run-case 记录，base 均为 ffcd7772…）
- 报告下载完成绝对路径：desktop 全部经原生另存为直存 evidence；npm 经浏览器下载+保存对话框确认（复核提醒后补全），早期两份静默下载件已从 Downloads 回收入档；Downloads/Recent 残留已清
- 原生 helper 修正（helper-diffs.diff，共 4 处）：prepare.ps1 桌面首启例外；run-case.ps1 无 BOM patch 写入（PS5.1 BOM 曾致 Host"未能保存设置"启动故障）+ 记录 web 子进程（端口监听者→evidence\*.children.pid）；cleanup.ps1 FileInfo -LiteralPath + 仅停记录在案子进程（PID+端口+命令行三重核验，`*.pid` 排除 `*.children.pid`）——已实测：`stopping recorded npm web child pid 15104 (port 8280)` 后端口释放
- 已选原状态哈希：各 root evidence/before-*.json、after-*.json（仅隔离测试根内 profile 文件——**不构成原用户状态证明，见下**）
- **npm cordis.patch.yml 前后哈希变化解释（复核指出）**：patch 是本轮受控变量——每轮 run-case/W7/U1 脚本按 case 写入对应内容（健康/缺 baseUrl/非法 URL/canary），before-*.json 在写前快照、after 反映复位值；全部变化均来自本轮受控写入，非 Host 自行改写
- **原用户状态核验（收窄后的事实）**：验收开始时原用户无 DSH 进程、无 %APPDATA%\DeepSeek Harness；用户默认 home ~/.dsh（9 月起在用）除下述偏差外，**mtime 扫描未发现变化**（mtime 不构成内容未变的证明；profiles/desktop、profiles/work、sessions、storages 未见本轮时间戳）
- **补测与原始记录的关系**：npm 补测轮的状态哈希另存为 before-W*-r2.json，b2c0eca 中的原始 before-W*.json 已恢复并保留，保证首轮前后配对完整
- **隔离偏差与纠正（本轮自纠，2026-10-06 复核追查时发现）**：10:30 的 `dsh web` 冒烟测试未设 DSH_HOME，初始化了用户默认 home 的 ~/.dsh/profiles/web（仅 4 个样板文件：package.json 空 deps + 空 cordis 骨架；无插件/会话/凭据写入）；已确认内容后删除该目录；~/.dsh 其余状态 **mtime 扫描未发现变化**（不以 mtime 证明内容未变）。教训已写入 helper（run-case 固定设置 DSH_HOME）
- 本轮 PID/临时登录与清理：零登录；结束态本轮进程 0 残留（多次全量核验）；两 profile 候选已卸载；canary 伪造凭据已删；patch 复位；首启自动创建的空默认工作区目录已删；IAB 遗留保存对话框已逐一关闭
- 所有异常/未测/根因未知项：
  1) 非法格式 baseUrl 未被 configuration 校验拦截（候选缺陷，两形态一致；源码层面仅要求字符串必填——复核确认）
  2) Desktop 每次启动重现设置向导（跳过充值完成态似不持久；DSH 应用层，根因未定位）
  3) npm 11.19 install-scripts 隔离告警（不影响 dsh web）
  4) 诊断报告 dshVersion/pluginLoadedVersion=null（与 manifest knownLimitations 一致）
  5) BOM patch 曾致 Host 启动故障（helper 已修，非候选问题）
  6) macOS G6 三项失败未被本轮消除；发布门禁不因本轮放行
