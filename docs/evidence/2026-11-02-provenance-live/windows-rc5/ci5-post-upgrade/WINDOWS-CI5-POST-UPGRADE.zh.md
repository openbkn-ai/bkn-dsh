**Windows CI5：平台升级后的最小影响范围补测**

结论：严格 padding 与自身输出触发器重叠的静止 Esc 用例在本次真实宽窗几何下通过；Space 已限定前置状态并记录 class / UIA 变化；答案锚定仅部分核实，运行时身份链仍有 UNKNOWN。本报告不作完整发布验收，不覆盖六份旧报告。

| 项目 | 本轮状态 | 核实范围 |
| --- | --- | --- |
| 真实答案入口锚定 | PARTIAL_WITH_RUNTIME_UNKNOWNS | 历史真实 S/M 完成 receipt 与当前平台轮次相容；两个真实入口分别显示第 3 / 第 2 轮；opaque handle、运行时 Host receipt、actual selected I 未暴露 |
| 输出摘要 Space | OBSERVED_PREOPEN_CONTEXT_NOT_CLOSED_TO_OPEN_PASS | 自然焦点在 trigger，悬停已打开弹层；open class 短暂清除再恢复；不计 closed→Space 打开 PASS |
| 严格 padding∩自身 trigger 静止 Esc | PASS_AT_SAMPLED_TIMES | 一次原生 1920×800 调整后，真实 section 焦点、真实 padding 命中；子弹层关闭、父页保留，到 3 秒采样未重开 |

候选仍为 [CI5 run 41548846010](https://github.com/openbkn-ai/bkn-dsh/actions/runs/41548846010)，source `ae903656193d3fc5214469bc0e6ee1108e233075`，artifact 13191140519，publish=false。TGZ SHA256 为 `14f4bb7fb61c892017343c832fdc8b37d892706b9a7aa2146779eef00ee9e3ff`；此前安装的 126 文件核对来自旧 CI5 证据，本轮未安装或构建。当前 client.js 实际哈希仍为 `f7184c97d65d9bf72c192172f8e1815aee022d05df5c54905dc3c7a32c113e10`。

运行环境为 Windows 10 Pro 19045 x64、官方 Desktop 0.2.1-rc.5；EXE SHA256 `7ae939b5a82b220fbd8ad04dfbafaaedb5a49ab43dc884a5db6381f678dd0cc4`，本轮末尾签名仍为 Valid。Desktop build commit、实际 served client digest、loaded plugin version、会话实际模型元数据均为 UNKNOWN。所有 UI 操作均通过 Windows MCP；无 DOM/CSS/焦点或消息/handle 注入。

平台恢复 gate 使用原有隔离 managed CLI generation、已有 CA，TLS 校验开启。用户经主会话声明平台为 OpenBKN 0.2.0 正式版；官方 CLI --version 为 0.2.0，health 的实际 `ServerVersion` 为 0.2.0。此值只证明 bkn-backend health 的版本字段；各服务镜像、commit、Ready 和全平台版本一致性未知。未扩大到管理后台、SSH、kube 或其他版本发现；可选 MCP 版本探针未执行，无 tools/call。

| UTC 时间 | 请求与结果 |
| --- | --- |
| 04:09:39 | health 200；原 C / 原 I 两次 GET 均 401；本地现有凭据 expired=true |
| 04:13:56.103–.193 | 官方 SDK 正常 currentTokenFresh needsRefresh 策略一次，POST /oauth2/token 200；未强制登录或刷新，未输出、复制 token |
| 04:13:56.208–.318 | GET 原 C conversation 列表 200；7455 bytes，SHA256 `118827de33fc6ab6eed7c4fd857bbd7797fe8c628eaf3d273f96ba98d29a85da` |
| 04:13:56.319–58.166 | GET 原 I detail 200；69244 bytes，SHA256 `150f5409f426413784f7de8882562f0df0d41a7a02dd9acd8f42bdcb2d1644c8` |
| 04:27:32.045–34.215 | 同 C 当前交互列表 GET 200；4 轮，SHA256 `e7fb822547242dbf92529f3c64070794498b3e7cab2d0e6aeaa427094f9a8086` |

正常续期前后 subject 与用户名哈希一致；与升级前的 subject/scope 对照因缺少原始快照而 UNKNOWN。未保存或打印原始平台业务响应正文及错误正文。当前列表只有目标第 2 轮有输入/输出预览，第 1/3/4 轮列表预览为空；原生页实际显示“当前轮次列表不完整；保留当前交互，不自动切换”。没有补造数据或强制旧轮号。此前维护期间的 404 与限制保留；新的 200 不抹去历史，也不证明旧失败唯一原因。

真实离线 DSH 日志的 S 为 `session-58973674-89a4-43ae-a2b7-9f32e86032e3`，C 为 `conv_3d9d7a82c9984b25ae8d0c18a47adfe4`。读取真实 completed MCP finish result，并按同 DSH turn 对应后续最终 assistant message：

| DSH turn | 真实 assistant message | 历史 completed receipt 的 I | 当前平台轮次 |
| --- | --- | --- | --- |
| 3 | 265a325b-fc39-43b0-b90f-90de3e2ecd03 | int_3bda877eb0d04b041a9390c97184fba7 | 1 |
| 4，目标 | 5f3949b4-75d3-4a3f-978d-e16d9a828e86 | int_b00aabd41e40ea38eb1f9589f6057557 | 2 |
| 5，先前一直使用的入口 | 8d5d7d8b-ec23-4628-889a-7ec132fcad28 | int_c3d3f535dde4e5771e41d2dd5b781aee | 3 |

先前入口属于 turn5，04:30:19 点击后原生页显示同 C、默认第 3 轮，与该答案实际 receipt 相容，不能据此判为目标第 2 轮锚定错误或通过。

随后正常滚动定位 turn4 的真实答案，渲染的独特结尾与 1924 字符原消息匹配；UIA 可见业务溯源按钮 runtimeId `[42,1247264,4,4,5,2504]`、rect `[1178,705,91,26]`。04:44:51.713 在 `(1225,718)` 只点击一次，加载完成后显示同 C、当前第 2 轮，选中行 class 为 `obp-BusinessProvenanceScene-roundSelected`。此时未点击轮次列表。此前 SourceText 补测曾手动选择第 2 轮，故该一次入口观测也不是独立跨轮重置证明。

UIA 的按钮父级仅暴露共享滚动 root，没有答案专属 messageId / 父容器、opaque handle、运行时 Host RPC receipt 或 actual selected I。当前第 2 轮与 API 目标 I 的相容性属于关联推断，不能以离线历史 receipt 补造运行时凭据链。手动选择第 2 轮只保证 SourceText 补测上下文，不算答案入口锚定验收。

Space 前置状态：真实搜索框点击后 Tab×6，自然焦点落在输出 trigger `[1407,571,434,69]`，鼠标先在中立位置，弹层关闭；移动至 `(1450,632)` 后，悬停已打开输出弹层。稳定 UIA hit 为 section，焦点仍为输出 trigger，section 未获焦。

04:38:41.825–42.359 通过 Windows MCP Shortcut 发送 Space。返回后 0、0.5、1.5、3 秒截图均见输出弹层；第一份后台 UIA poll 已在键请求前结束，因此不用于判断这次操作的瞬态。仅作一次必要确认：04:39:54.565–.642 通过 Windows MCP PowerShell 的 SendKeys，在相同 trigger 焦点和固定鼠标位置发送 Space，并由另一只读 UIA 进程同步采样，未增加点击或改焦点。

| 确认采样（相对输入请求） | 实际 UIA 信号 |
| --- | --- |
| 请求前约 63ms | 同输出 trigger 保持焦点，open class 存在；section on-screen |
| +122.9ms | open class 移除；section 仍报告原 rect、offscreen=false |
| +264.7ms | class 仍移除；section rect 出现缩放变换 |
| +392.1ms | open class 恢复；section 短暂报告 offscreen=true、负坐标 |
| +597.9ms | open class 存在；section 恢复原 rect、offscreen=false |

确认中焦点始终为同一输出 trigger。输入返回后约 0.521、1.481、2.999 秒采样均为 open class 存在、section on-screen。无 sub-500ms 截图捕获视觉关闭区间，因此仅报告 class 清除/恢复及 UIA offscreen 信号；视觉关闭再展开、DOM activeElement、实际 keydown/click target 均 UNKNOWN。这不是 closed→Space 打开 PASS；也不据此归因于本次 Escape 修复或宣称平台总体行为正常。未重跑键盘矩阵。

原始窗口 Win32 rect `[632,290,1296,828]`、showCmd=1。在该尺寸，输出 trigger `[1407,571,434,69]` 完全落入 section `[1187,562,696,528]`，严格 padding∩自身 trigger 的旧 SKIP 仍成立。

本轮只做一次原生宽短窗调整到 `[320,290,1920,800]`，同 HWND 2164908、PID 29808、创建时间均核实。原生页保持可用，获得真实几何：

- 输出 section：`[1432,534,696,528]`。
- popup inner：`[1420,522,720,552]`。
- 自身输出 trigger：`[1407,571,746,69]`。
- 另一输入 trigger：`[642,571,746,47]`。
- 目标 padding 点 `(1426,632)`：在 section 外、popup inner 内、同一输出 trigger 内、另一输入 trigger 外；实际 UIA hit 为 `ant-popover-inner`。

真实点击 section 的 `(1450,632)` 后，UIA 确认焦点为输出 section；仅移动到 padding 点，无再次点击或改焦点。04:41:20.376–20.909 发送 Esc，鼠标一直固定。名义 0/0.5/1.5/3 秒样本均为子弹层关闭、父页保留、焦点回自身输出 trigger；后续稳定 FromPoint 命中自身 trigger，未重开。0.5 秒采样序列实际约从工具返回后 665ms 开始，因前一个 UIA 读取耗时；完整时间保留在 JSON 和私有事件中。键实际发生时间位于请求/返回区间内未知，离散样本不证明中间没有瞬时变化。只对本次真实几何与采样范围判 PASS。

04:42:01 Win32 核实恢复为原 `[632,290,1296,828]`、showCmd=1；无第二种布局尝试、CSS 修改或焦点注入。

04:46:16.236–16.805 按“应用 → 退出”，未 Stop-Process；04:46:18 核实任务 PID 29808、children 30748/25124/10224、Host 9328 全部退出，端口 65235 释放；末尾同 task EXE 路径无进程，launcher/poller 4988/9004 亦不存在。日常 Desktop 17728、children 11984/13556/10548、Host 11576 的路径与 UTC 创建时刻均与 fresh Before 一致，日常端口 58794 保留。初次进程比较存在 string-versus-DateTime 类型比较 false，已用 typed UTC instant 重新核实；保留初次记录及更正文件，不将 false 误报为进程重启。

1376 个 fresh Before 非凭据文件：1376 同哈希、0 changed、0 missing、0 unreadable。六份旧报告全部同字节/哈希；协议值与本轮 fresh Before 一致，末尾 action=unchanged。协议 guard 仅允许“当前恰为本任务 EXE”时恢复本轮 Before，未覆盖无关值或回滚旧 rc2。

原始样本与 binding：
- 原始会话 349071 bytes，SHA256 `49cce19d02d2410b8e34cc8b9d0568d88e871f02325427eb5357f5df3c13469c`，保持不变。
- 原始 binding 286 bytes，SHA256 `008b60ef33f7842b580c16b6bc15eb8148a7330118cfd8f4e55cc802e8e27a7f`，保持不变。
- 当前隔离会话副本 349153 bytes，SHA256 `81bbe0c2a2351dbfd3bbf1e5e091d162167eddc05256db144806d5ad26a4552b`，266 记录/6 turn，在本轮读取与退出后字节不变；它与原始样本大小不同，差异来源 UNKNOWN。任务 binding 与原始 binding 同哈希。

保留的历史限制包括：39 个旧基线 null 仍 UNKNOWN；初始 964 基线的两个日常文件差异不抹去；之前 callback 后默认 userData 至少 42 个非凭据文件 mtime、之前日常 rc2→rc5 安装触发原因 UNKNOWN；此前共享 pnpm cache 增量变化保留；新日常路径未枚举。不能据 1376 个当前文件一致推导整个历史流程完全隔离。

本轮新增业务提问、解释生成、Agent 分析、平台业务写入均为 0；未修改原记录。正常凭据续期是上述唯一授权认证 POST。平台记录 after-state 未测量，零主动业务写入不证明服务端记录完全不变。无源码/Host/插件更新、安装、构建、远程 CI、commit、push、merge、tag、publish 或 latest。

私有截图、UIA 和事件保留于 `C:\bkn-verify\provenance-ci4-win-20261102\ci5-post-upgrade-20261103-120609\private`；关键索引见配套 JSON 的 evidence.files。公报仅含必要标识符、版本、状态、时间、几何及哈希，无原始业务响应正文或凭据。
