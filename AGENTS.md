# Windows -31 UI / frozen -30 lifecycle handoff

先读 README.md 和 WINDOWS-TASK.md，再读 kit/W-UI.md、W-LIFE.md 与 PROFILE-COPY.md。根任务范围优先于 lifecycle30 中的历史文档；历史 B1/argv/web 等脚本仅保存原字节，不代表本轮执行授权。

- 只用主会话固定提交；-31 仅复验受影响 UI，生命周期仍用原 -30。不采用/修改/合入另一路 -11。
- 不重跑已过 argv、A/B 初始化/启动验收、tar、四组合闭包、完整 UI、目录绑定、登录取消/超时或 B1。必要的身份核对和原 helper 启动仅为本轮前置条件。
- 不升级 DSH/SDK，不替换正式 https://192.168.50.129 的0.2.0，保留数据/配置/失败原件和日常应用。无模型/G6/Sandbox/Function/run_code/BOM/CSV。
- 冻结 lifecycle30 整包不改；仅在已离线的任务 home 的新副本中用官方 Desktop CLI 安装 -31。原 home/日常 profile 不改，不复制个人 token。
- 生命周期只选一个已验证任务 Desktop。先让用户确认日常 Chrome 的当前窗口及根 PID/创建时间/exe，再只读预检现有 DevTools WS 可采集性。缺条件 BLOCKED；不强制重连/刷新/注入/重试到复现。
- 不读取或回传完整命令行、环境、设备登录 URL、token、账号、HAR、原始帧或 Cookie；只摘录类型/方向/关联序号/UTC。Job 成员无现成可靠入口就 UNKNOWN/BLOCKED；不得复制句柄、启调试服务、注入 Host/runner、强杀 Job/浏览器或改默认浏览器/证书。
- 不推送、CI、PR、tag、release 或部署。结果写 kit 外；原始私有证据只留 Windows。每项 PASS/FAIL/BLOCKED/NOT_RUN；不把采样内同时消失写成先后或修复。
