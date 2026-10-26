# Windows changed-boundary plan

当前为**准备态**。输入校验PASS不授权Host启动/登录/签名/安装。完整runtime与独立GUI尚未交付，不自行补包、改pin、使用latest或替换签名门槛。

| ID | 前提 | 只验证变化处 | 当前状态 |
|---|---|---|---|
| W0 | 固定新交接身份及本kit摘要 | 4输入包82/9/12/12文件、源码基线/SDK、官方来源、GUI实际版本/ASAR/签名；原配置摘要与owned任务根 | 输入可校验；GUI/完整Win runtime BLOCKED |
| W1 | 已核验的新隔离stock/protected Host/profile，后续明确执行授权 | 每基线/实际Node或Electron路径仅同源307一次+跨源307一次；stock应第二源1，protected应0。实际factory、原生ToolRuntime、独立物理包与-32身份 | NOT_RUN |
| W2 | 独立GUI固定制品、其签名/隔离检查通过 | 新appId/名称/路径；原Host、全局dsh命令和dsh协议不变；冷启动确实使用回补runtime和独立home/userData/sessionData/logs/journal；3组件与新GUI菜单/入口最低检查 | BLOCKED |
| W3 | W-LIFE原补证结果已评审；当前日常Chrome窗口+根PID/UTC/exe已确认；隔离CLI配置与最小普通登录另获明确授权 | 若最终GUI胶水改变认证载体/路径，仅一次真实普通CLI登录和网络列表读回；不重跑取消/超时/长时B1 | BLOCKED，不自动登录 |
| W4 | 本轮实际启动过owned进程 | 原生退出或既有identity-checked停止；核对PID/UTC/exe/端口再操作，确认runner/监听/副本前后摘要；保留新增记录和续期凭据 | NOT_RUN |

已通过的52跳转向量、完整UI、双语全量、目录绑定、默认超时、argv、tar、长时B1不重跑。W1是Windows新边界：原包正对照能发现夹具不转发/假拒绝；不能只看错误文案或0请求就记PASS。原生GUI的单次冷启动/隔离属于新制品门槛，不称为UI全矩阵重验。

## W1探针接入（仅前提满足后）

`windows-native-mcp-probe.mjs`是verification-only Cordis插件，不是独立Host或GUI launcher。只在新的空/合成profile插入，stock阶段不复制真实CLI凭据、不配置真实平台、不运行真实问题；两例独立目录保留。

任务根先写 `OPENBKN-VERIFY-OWNERSHIP.json`：

```json
{"purpose":"host-backport-synthetic-only","independentCopy":true,"browserOrPlatformLoginAllowed":false}
```

由owned启动上下文显式提供：BKN_VERIFY_TASK_ROOT、BKN_VERIFY_RUNTIME、BKN_VERIFY_PROFILE、BKN_VERIFY_OUTPUT、BKN_VERIFY_HOST（精确两版之一）、BKN_VERIFY_MODE（stock-control/protected）。runtime、安装的-32、实际MCP包和输出父目录必须实路径落在新taskRoot内部；输出放独立results子目录。探针不做CLI登录、不接真实平台、不触发模型；新临时Session仅含合成数据。

该模块在Mac仅做语法检查，Windows实际加载和语义执行NOT_RUN。不要在Mac重跑已通过的同类调用。需要输出fixtureListenersClosed、mcpDisposalErrors、same/cross结果、第二源计数、实际factory摘要、Node/Electron；仍需外部W4负责整个Host退出。

## 身份和签名

官方rc.3 feed的版本/大小/SHA512已固定在OFFICIAL-WINDOWS-INPUTS.json；本机仅取feed元数据，没有下载/执行安装器。旧版完整字节摘要来自历史官方固定URL取件，原生签名结果不在此重新声称。Windows须核对Get-AuthenticodeSignature、时间戳、实际安装器/ASAR版本及源制品摘要；不能只读FileVersion。

独立GUI不会继承原官方ASAR修改前的签名。自己的发行签名与官方来源签名是两个检查；缺任一材料就BLOCKED，不移除安全校验。生产签名/HSM/证书选择属于单独构建阶段，不在验收会话中补造。
