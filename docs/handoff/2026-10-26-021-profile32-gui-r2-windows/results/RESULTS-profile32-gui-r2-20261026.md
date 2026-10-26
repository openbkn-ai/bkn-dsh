# Windows r2：-32 真实业务 profile 自动加载 + 官方 rc.3 GUI 最小补证（2026-10-26）

`local-development-preacceptance; ciRun=null; formalAcceptanceEligible=false`

- **固定身份**：分支 handoff/windows-local32-profile-gui-r2-20261026，提交 `e7b383b96747dbeb3e6897c0e79039f7f3d1711c`（新独立 detached checkout，首尾 `git status --porcelain` 均空）；KIT-FILES `99ccd2ff0e15077916bb25992985e2ea2a10c2763d1c7b7f9b05baf4605e5178`（kitFilesMatched=13）；-32 tgz `46626510…`（82/82）；mcpRc3 payload `48694ca3…`（12/12）。verify-inputs PASS。**r2 修正核对**：run-gui-proof.mjs 相对 r1 仅 baseEnv 白名单加 `OS` 一项（逐行 diff 确认，PS 守卫与执行逻辑未变）；OS 从父环境真实透传（无伪造）。任务 Node 24.19.0。旧 checkout/taskroot-1(r1)/诊断 A/B 全部保留未动。
- **既有官方 rc.3 EXE**：复用前轮 `…\021-host32-mcp-nongui-20261025-run\rc3-app-x\DeepSeek Harness.exe`，controller 断言 SHA256=`fd7d298f…` 通过；inspect 前后 deepEqual（preservation PASS）。Node 24.21.0/Electron 44.7.0。Zod4.4.3 复用前轮任务 profile 目录（源/复制前后 inventory 全等）。
- **启动前系统关联备份：PASS 且先于 GUI**——controller 内 associations('Before') 成功（r1 的 OS 缺陷已由 r2 修正消除）：`HKCU\Software\Classes\dsh` 完整 .reg（SHA256 `8f3af673…`）；dsh UserChoice 树明确 `Exists=false`；账号 SID 记录（私有）；`backupComplete:true` 打印于 official-gui-started 之前。
- **新 profile：PASS**——冻结 82/12 在新 taskRoot 解开（清单全等）+ Zod 只读复制；未复制任何 home/凭据/模型配置/会话/workspace/旧 patch（preparation-private.json）。
- **真实业务自动加载：PASS（实例级证据全项满足）**（`taskroot-1\evidence\business-autoload-private.json`）：
  - 三个 loader 组件 active：`@openbkn/dsh-business-context`、`…/business`、`…/diagnostics` 全部 fiber state=2（active）；
  - Service 类身份一致：`svc instanceof business.OpenBknBusinessContextService`=true，business.js SHA256=`9901a046…`（与 INPUTS 一致）；
  - 公开配置→自有 MCP manager 建立合成连接：`svc.remoteConfigureToken('synthetic-profile-proof-only')` 返回 1 个合成网络；请求序列仅 `/mcp` initialize/notifications/tools/list 与 `/api/bkn-backend/v1/knowledge-networks`（全部 syntheticAuth=true，**无 tools/call**）；
  - 观察器在 manager 挂载之后检查（探针源码时序）；
  - registry 实例与 manager fiber.runtime 同一对象：`selectedModuleAlreadyRegistered=true`、`managerFiberUsesSelectedModule=true`；
  - 实际 MCP 物理文件在新 profile：`node_modules/@deepseek-ai/dsh-mcp-client/lib/index.js`（profile 相对路径），SHA256=`b3cd7156…`（与合同一致）；
  - `profileOverrideAutomatic=PASS`、`result=PASS`（Node 24.21.0/Electron 44.7.0）。
- **官方 GUI：启动/窗口 PASS；"菜单退出"记 FAIL（偏差，见下）**——PID 31980，**实际创建 UTC 2026-10-26T05:03:31.155Z**（CIM 实测，非 launchRequestedUtc），EXE=任务 rc3-app-x 副本，子树 6 进程，监听 127.0.0.1:51385（owner 36564）。窗口可见证据：`results\gui-window-welcome.png`（欢迎页，"欢迎使用 DeepSeek Harness"，仅含 添加 API Key/登录 两按钮——**均未点击**；无任何登录/设置操作）。
  - **退出偏差（如实记录）**：该 rc.3 欢迎窗为固定 616×708、**无菜单栏**（AX 树 31 元素无 menuitem；Alt 无效；F10 无效；点击左上区域无菜单；Win32 强制 resize 被钳回固定尺寸；实例另有隐藏窗口与托盘 NotifyIcon，但本机 UIA/MSAA 均无法枚举托盘按钮）。菜单查找耗时超过 controller 的 5 分钟退出等待 → controller 记录 `failure="No normal exit0 observed"` 并按设计跳过 After/Restore（此刻 owned 树仍在）。随后点击欢迎窗**官方关闭按钮（X）**（05:12:12Z）：**整棵进程树完整退出**（6/6 PID 消失、端口 51385 释放、系统无残留 DeepSeek Harness 进程）——真实完整终止、**非关闭到托盘**；但 exit code 未经 controller 观测（其等待已超时），且非菜单项退出 → "正常菜单退出"子项记 **FAIL（偏差）**，无强制清理发生（无需）。
- **After/受限 Restore：PASS（按 kit 预留手工路径补齐）**——GUI 退出后手工运行同脚本 `-Phase After` 与 `-Phase Restore`（同 EvidenceRoot 同 EXE）：After 捕获到 Electron 本轮写入的 handler（SHA256 `50ef3f8f…`，证明三个写点确为本轮 EXE 所写）；restore-check 守卫通过（当前==After、handler 指向本轮 EXE、账号一致）；仅恢复三个确定写点后 `restored` == **Before**（handler SHA `8f3af673…` 相等）；**UserChoice 前后均不存在（未写）**；无 key 删除、无 ACL 改动；脚本结论 "Scoped dsh association restore verified. UserChoice/ACL untouched."。
- **收态：PASS**——本轮 6 PID 全部消失、端口 51385 无监听、系统 DeepSeek Harness 进程 0、checkout 干净；原 EXE/ASAR/冻结 82/12/Zod 保全（controller preservation PASS）；fixture（loopback 服务器）已关闭；r1 全部原件保留。
- **结论**：核心目标（真实业务自动加载，实例级证据）**PASS**；关联备份/恢复与保全 **PASS**；官方 GUI 启动+窗口证据 **PASS**；"菜单正常退出" **FAIL（偏差：欢迎窗无菜单栏，改用官方关闭钮，进程树完整退出但 exit code 未被观测）**。
- **私有原件目录（仅 Windows）**：`C:\bkn-verify\021-profile32-gui-r2-20261026-run\`（taskroot-1 全部 evidence：.reg 导出、SID、autoload 报告、controller/host 日志；controller-private.log）。

未执行项：不重跑 8/8 矩阵/重定向向量/argv/tar/闭包/完整 UI/语言/800×600/目录/登录/取消超时/B1/W-LIFE/RDP；不访问平台（192.168.50.129 保持 0.2.0）、不运行真实模型/G6/Function/run_code/Sandbox/BOM/CSV；未采用 -11；未构建 GUI 发行体系；不推送、不 CI、无 PR/tag/发布。后台加载通过不自动转记人工 GUI、全局 SDK/OAuth 或最终发布通过。
