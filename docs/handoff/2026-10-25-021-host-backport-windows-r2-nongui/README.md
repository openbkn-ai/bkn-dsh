# #105 Windows 非 GUI 最小材料 r2（本地准备态）

仅验证固定 Host 的原生 MCP factory / ToolRuntime 同源回补。独立 GUI、生产签名、W-LIFE、日常 Chrome 身份和真实 CLI 登录均不是本材料的前提。r1 保留原字节作为历史；其 GUI gate 不适用于本材料。

当前没有新 Git 交接提交或远端分支。材料仍为 `local-development-preacceptance`、`ciRun=null`、`formalAcceptanceEligible=false`。Windows 执行及新交接推送不在本机本轮准备授权中，等待后续固定交接；不要给当前 d20a266 补证会话追加任务。

输入仅含冻结 -32（SHA256 `46626510825fe9146aef12c27a1724acbb455aeac22aa600358add0fc8e1c9f8`，82 文件）、旧/rc.3 两份 12 文件 MCP payload、原补丁/归属及校验材料。没有 GUI、完整 Windows runtime、CLI 安装包、CA、登录配置或业务记录。12 文件 payload 不能独立启动 Host，也不代表 Windows 兼容已经通过。

在任务 Node 24.19.0 下执行 `node kit/verify-inputs.mjs`，输出存到 kit 外。校验通过即可完成输入准备；无需 `--require-gui`，无需提供 GUI/签名/W-LIFE 回执。后续执行仍须具备 [最小计划](kit/WINDOWS-MINIMAL-PLAN.md) 所列固定 Windows runtime 和全新任务副本。

使用方式见 [非 GUI 准备步骤](kit/SETUP-NON-GUI.md)、[会话提示词](kit/WINDOWS-PROMPT.md) 和 [回传模板](kit/RESULTS-TEMPLATE.md)。本材料只读校验器和原生探针的结果分开记载；Mac 材料校验不作 Windows 原生执行结论。

保持正式 192.168.50.129 原样 0.2.0，保留数据配置；不采用远端 -11、不改 -30/-31/-32、不修改现有 Host、不推送、不跑 CI。
