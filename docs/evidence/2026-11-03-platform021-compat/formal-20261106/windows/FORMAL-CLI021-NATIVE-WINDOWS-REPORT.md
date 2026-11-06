Windows 原生正式 CLI 0.2.1 补验：**PASS_SCOPED_FORMAL_CLI021_NATIVE**。

在同一官方 Desktop 0.2.1-rc.5、原 CI6 插件包下，实际进入 OpenBKN 设置 → 高级 → 固定版本 0.2.1，点击一次“检测并安装 CLI”。新独立 prefix 中真实 npm 安装成功，面板提示“CLI 0.2.1 可用”并自动填入绝对 .cmd 路径；实际 --version 为 0.2.1、退出码 0。未用外部安装命令代替这一验收项。

- 原插件版本：0.2.1-rc.3-openbkn.0.2.1-3；原 TGZ 877732 bytes，SHA256 4500fa4357cdcdcb9914a39794aedb9096c948192c2bf0f35ecf4fadb882f046；原 126 个发布文件在收尾时全部一致。
- 正式 SDK：@openbkn/bkn-sdk@0.2.1；官方 npm gitHead 41e57219ca774e3c9f82050851a39a7e25678e43；TGZ 232660 bytes，SHA256 d699db94b0ab61b1b888c8b3936b21723827a0ae8849f78f8ebd64fb725e4452。
- 官方 npm SRI：sha512-8t1tm/X0Z/9IwWcp5uL4XlegfOQliFvIzsMHCcZLcttxnbd+RcCYilQ6OQE0gw1Sl2kotrgkiwN3rRQOWPu5bw==。校验通过；真实原生安装产生的 npm 缓存 TGZ 与官方包字节完全相同，已安装 9 个发布文件全部匹配。
- 独立 CLI 路径：C:\bkn-verify\provenance-ci4-win-20261102\formal-cli021-20261106T044618Z\cli-prefix\openbkn.cmd。保留日常默认 CLI 0.2.0。

保存配置时先自动复用了原隔离环境的 129 授权。为完成本次明确要求的浏览器登录，使用正式 CLI 官方 auth logout，仅移除该隔离 129 store 的本地凭据，再点击原生“使用 OpenBKN CLI 登录并同步”。浏览器核对 129 origin、固定证书与 SPKI 范围后，用本地受限信息卡完成正常设备确认和登录；原生面板于 2026-11-06T05:10:09.0605868Z 显示“登录并同步成功”，列出 2 个知识网络。没有手工编辑 token 或到期时间，没有对日常凭据 store 操作。

当前进程的被动诊断 c6556b8b，生成显示时间 2026/11/6 13:10:30（Asia/Taipei），记录 CLI、login-state、context-loader、platform-network-list 全部通过；toolsPublished=true、networkCount=2。诊断中最初 CLI 缺失和未登录记录均显示 recovered=true。MCP 工具发布发生在本次原生登录后的连接中，目录只读路径为 GET /api/bkn-backend/v1/knowledge-networks?limit=100。现场也观察到 Host worker PID 28556 连接 129:443。未重新枚举工具目录或增加对象查询。诊断的观察年龄固定在报告生成时，属于该进程的历史观察；不是额外执行的主动探测。诊断没有采集 Host 与已加载插件版本，版本身份由固定文件与原包哈希证据限定。

129 health 当前返回 HTTP 200、ServerVersion 0.2.1，TLSv1.3 authorized=true，rejectUnauthorized=true。本机没有逐一检查服务端 17 个 chart/image；该项仍引用主会话证据。CE enterprise provenance 保持不支持的范围限制，本次没有请求 EE 接口。

已通过应用菜单正常退出：本次 5 个进程全部结束，127.0.0.1:64413 无监听，授权浏览器已退出，未强制终止进程。临时 CLI 路径已恢复原隔离 profile 的原字节。Host 启动曾触碰 byte-identical cordis.yml 的 mtime，收尾已恢复原 mtime，保留首次检查记录并只复查受影响的 profile 组。

保护项完成：1376 个既有日常文件、23 个旧公开报告、4 个原始会话/绑定文件、2 个默认 CLI 文件、5 个原隔离 profile 文件、2 个官方 Host 文件，最终 bytes/SHA256/mtime 均一致；默认 CLI 仍为 0.2.0，dsh 协议注册值一致，官方 EXE 签名 Valid。未枚举新增日常路径；隔离 Electron userData 和 129 授权 store 的正常更新是预期变化，不宣称全机零变化。

保留的准备/采集限制：全新软件 profile 在 Host 欢迎页停止，未进入 CLI 安装验收，随后正常关闭；正式验收复用既有隔离 home。初版 Python→cmd 版本采集遇到引号语法问题，直接 PowerShell 与原生 Host 检测成功。浏览器登录 helper 首次早于窗口创建，增加窗口就绪等待后完成同一次原生登录，没有再次点击登录按钮。以上原始记录保留。

本次未访问 50.28，未重跑模型问答、Agent 分析、业务溯源/指标/guard/CSV/SourceText 矩阵，未构建、改包、触发 CI、发布、合并、推送或打标签。旧报告及其中的未知文件、阶段/缓存/回调证据边界保持原结论。

公开 JSON 仅含派生结论、公开软件身份及本地证据的路径/bytes/SHA256。截图与辅助功能原始记录仅留本机，不嵌入公开文件；不导出信息卡、账号、密码、token、设备码、OAuth URL 或业务原文。完整证据索引见同目录 JSON 的 localEvidence。
