请执行Windows r2最小补证；唯一代码修正是controller白名单补传OS。原5e55d09及c0fa28d8失败/诊断证据保留，不修改旧checkout或旧taskRoot，不扩成完整验收或GUI发行工程。

固定分支 `handoff/windows-local32-profile-gui-r2-20261026`；完整提交和KIT SHA以主会话转发值为准。另建独立干净checkout，detached到该完整提交，不改已有checkout。只用冻结-32（tgz SHA256 `46626510825fe9146aef12c27a1724acbb455aeac22aa600358add0fc8e1c9f8`）及本kit唯一rc.3回补，不采用远端-11。先读README和INPUTS，再用已有任务Node24.19.0运行 `kit/verify-inputs.mjs`，输出留checkout外。

前轮输入/资源/profile准备通过，GUI前因OS漏传受阻；GUI/真实业务加载/正常退出/After/Restore仍未执行。不要重复诊断A/B、prepare或inspect专项，也不重跑本机5项环境回归；保留controller对新taskRoot必须做的输入/准备/保全检查。

范围只有两件，同一实例完成：① 冻结-32真实业务模块自动挂载profile层回补MCP；② 原官方0.2.1-rc.3 GUI窗口启动并通过菜单正常退出。复用前轮已有官方rc.3 EXE（SHA256 `fd7d298f4ba03ee9bab1719a892afeaef5c09bf50c574a592a64c85f64574c0c`）和任务Zod4.4.3目录。优先从前轮 `C:\bkn-verify\021-host32-mcp-nongui-20261025-run\` 私有记录定位，不扫描个人配置或全盘。缺资源就BLOCKED，不重装、升级、下载最新或重建GUI。

选择不存在的新taskRoot（位于checkout外），执行README给出的 `run-gui-proof.mjs --exe ... --zod-dir ... --task-root ...`。保持controller存活，记录私有输出。脚本仅解包冻结82/12文件和复制Zod到全新profile；不复制现有home、凭据、模型配置、会话、workspace或旧patch。

**GUI启动前必须先完成系统关联备份。** controller调用 `system-association.ps1 Before`，完整导出HKCU\Software\Classes\dsh与dsh UserChoice对照树，或明确保存不存在状态，附原值类型和摘要；备份失败禁止启动。不要弱化执行策略、权限、证书或UserChoice保护，不做全机注册表备份。此轮不需要Chrome身份、浏览器或真实登录。

`official-gui-started` 后记录该任务PID的实际UTC创建时间、EXE、子树和监听；电脑操作只绑定这一任务窗口，不关闭其他实例。保留一份窗口可见记录，停在欢迎页即可，不点击登录/API Key。等待 `real-business-autoload-result`：三个冻结组件active、实际Service类身份一致，公开configureToken建立一次127.0.0.1合成连接；观察器在业务manager挂载后才核对registry实例与manager fiber.runtime相同、所选物理文件在新profile、MCP SHA为 `b3cd7156c0b8639656ce117530fec4d006b74cafdc9a78ac426fec084e62972c`。仅看到文件或手动import/mount不算通过。

然后通过官方菜单退出一次并记录。controller应观察exit0、保存After、受限恢复三个确定的dsh注册写点，并验证Before/Restored相等；UserChoice仅比较、不写，原有key/ACL不删除。守卫失败、并发变化或差异不明则留证BLOCKED，不猜测恢复。再按本轮PID/UTC创建/EXE/子树/监听检查收态。若菜单退出失败先记FAIL，再按身份清理owned树；强制清理不等于正常退出通过。

**停止条件：**真实业务自动加载有实例级证据；一个官方GUI有窗口与正常退出证据；启动前备份、退出后恢复/差异和原数据配置保全有证据；fixture及owned进程/端口收净。达到后立即停止，不扩测。脚本出错保留原件报告受阻，不擅改冻结kit、候选或Host，也不反复启动取得PASS。

明确不做：不重跑已过8/8 stock/protected、重定向向量、argv/tar/闭包、UI/语言/800×600、目录、真实登录、取消超时、B1、W-LIFE、RDP。不开真实模型/业务回合，不访问正式平台或执行G6/Function/run_code/Sandbox/BOM/CSV。正式192.168.50.129保持原样0.2.0，不替换平台、不改既有Host、不动个人配置数据或日常Chrome。-30/-31/-32保持冻结。不新建独立GUI入口、构建、签名/appId、更新、安装或迁移体系。不推送（包括结果分支）、不跑CI、不开PR、不打tag、不发布。

按 `RESULTS-TEMPLATE.md` 聊天回传：固定身份、逐项PASS/FAIL/BLOCKED/UNKNOWN、脱敏结果/证据摘要、私有原件目录、收态与所有偏差。原.reg、SID、完整日志、token和个人路径只留Windows，不上传。主会话准备验证不是本轮Windows通过；本轮也不等于全局SDK/OAuth、全形态rc.3或正式发布验收。
