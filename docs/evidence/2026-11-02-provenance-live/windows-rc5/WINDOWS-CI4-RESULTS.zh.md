# Windows CI4 业务溯源回执（2026-11-02）

WINDOWS_E2E_REPORT_BEGIN

结论：Windows 官方 Desktop 0.2.1-rc.5 实际运行中，固定候选的业务溯源入口、轮次定位、主要图谱操作、原生导出以及 Agent 终态直接 Esc 均有实测证据；不能据此宣称完整发布验收通过。平台原始 Markdown 自带 217 处“请求失败”，两次真实 Agent 分析均已结束但结果为事实不足。悬停原文弹层的 Esc 有一次未立即消失的观察。没有将未知项记为通过。

## 身份和范围

- Windows 10 Pro 10.0.19045 x64。正式签名的官方 Desktop 0.2.1-rc.5，关于窗口显示版本；EXE SHA-256 `7ae939b5a82b220fbd8ad04dfbafaaedb5a49ab43dc884a5db6381f678dd0cc4`，Electron 44.7.0、内置 Node 24.21.0。Desktop build commit 未采集。
- 固定 build-only CI `41444758077`，源码 `a52032956314cf582c0f39ed3dab2f8e80e91085`，交接文档 `e8bbe823d3c4c85c6423549836338d351d3bad36`。ZIP 877321 字节 / SHA-256 `3a7c905c268aad2eaca45d7839d6adb9da57c9bdad06f9bd0f2fd25283d8d8d9`；TGZ 877325 字节 / SHA-256 `cf9abdf4ac085506793501f5f4c7e2d3f6ff4bc8c873e07c4b6b401064ec6b8a`。126 个发布文件与清单一致；退出后隔离 profile 安装文件仍 126/126 相同。
- 冷启动后插件管理页显示启用，诊断页显示 bootstrap、business、diagnostics 已加载；诊断中内存加载版本为“未采集”，因此安装文件哈希不等于对内存模块哈希的独立证明。GUI 实际运行使用 rc.5，早期 rc.3 探索不计入验收。
- 原有真实 Windows 历史会话 `session-58973674-89a4-43ae-a2b7-9f32e86032e3` 整体复制到任务 profile，保留原 session 和绑定字节；未伪造句柄。Conversation `conv_3d9d7a82c9984b25ae8d0c18a47adfe4`；第 2 轮 Interaction `int_b00aabd41e40ea38eb1f9589f6057557`。未新增业务问答；本轮生成依据 1 次、分析 2 次。

## 逐项结果

- W1 安装与冷启动：**PASS（上述范围）**。官方内置 CLI 安装固定 TGZ，冷启动后原生页显示启用；实际宿主内存加载版本仍 **UNKNOWN**。
- W2 入口与选择：**PASS（已操作部分）**。原答案 1、2 各自重开后定位对应业务轮次；零结果搜索保留当前轮次，清除后恢复；快速切换最终显示最后选择的第 1 轮，刷新保留第 2 轮。选择后关闭界面正常返回答案。实际是否有在途 HTTP、是否完成取消未捕获，取消语义 **UNKNOWN**。
- W3 时间链／证据链：**PASS（已操作部分）**。第 2 轮 4 次成功、0 次失败；零失败筛选显示空态。选择第二个操作后右侧切换到对应业务对象及 Operation ID，记录输入可展开。一次生成依据后 UI 明示原始调用记录缺失 1 处；两个问答对可选择，阅读／图谱模式、业务节点联动和图谱全屏后 Esc 返回父详情均实测。原文键盘 Enter 打开、鼠标离开后 Esc 可关闭。**FAIL（一次观察）**：鼠标停在输出原文触发／弹层附近时直接 Esc 后弹层仍可见，移开鼠标后消失；原因及复现范围未知，未作为全键盘路径失败推断。
- W4 Markdown：**PASS（平台原始 HTTP 字节与原生 Save 一致）**；真实复制粘贴读回与平台／Save **不逐字节相同**，差异为下列 CRLF/LF，诊断归一化后文本相同。未修改原件。
- W5 Agent：**PASS（UI／焦点路径）**。第一次分析直接显示终态并可重开；第二次由聚焦的真实开始按钮通过 Enter 启动，捕获到真实忙碌画面及终态。第二次从开始到终态之间没有 Tab、点击或手动设焦；终态直接 Esc 仅关闭分析侧栏，保留父详情，截图可见焦点回到 Agent 入口。历史下拉显示两次并可切换。两次平台记录均 completed，结果均为事实不足／不可评估；这不是业务优化结论通过。最终 POST 正文和 provider 帧未捕获，模型为何称仅收到“请求失败”仍 **UNKNOWN**。
- W6 安全状态／边界：**PASS（实际样本部分）**。第 1 轮时间链显示 7 次调用、6 成功／1 失败；第 4 轮显示 `abandoned`、输出未记录；生成依据显示缺失告警，未抹成全绿。认证拒绝、断网、低权限等未人为制造，属于 **UNKNOWN / NOT RUN**。

## 三方 Markdown 原件

对同一第 2 轮，用任务专属已授权 OpenBKN 0.2.0 SDK 的只读 GET，验证 TLS 并在 SDK 文本解码前捕获目标 HTTP 200 原始响应字节；未读取、打印或复制凭据。

| 原件 | UTF-8 字节 | SHA-256 | CRLF / LF | BOM |
| --- | ---: | --- | --- | --- |
| 平台 HTTP 原始 body | 6306 | `caeb1e32d62c389d115b07c3e6904cfc9d24ea02da75127eb675f92fbfa68aa7` | 0 / 124 | 无 |
| 原生 Save 文件 | 6306 | `caeb1e32d62c389d115b07c3e6904cfc9d24ea02da75127eb675f92fbfa68aa7` | 0 / 124 | 无 |
| 真实粘贴到空白草稿后再复制的读回文本，按 UTF-8 编码 | 6430 | `2c36b056cf2d58766ce034b62386852e743c926b4406756001adfdee16cee77d` | 124 / 124 | 无 |

平台 body 与 Save 逐字节相等，且平台 body 已包含 217 处“请求失败”。剪贴板读回与这两者原始字节不等；只在诊断比较中将 CRLF 改为 LF 后逐字符相等。原始响应、Save、读回分别保存在 `private/platform-round2-markdown.raw`、`native-exports/round2.md`、`private/clipboard-paste-readback.utf8`；不把系统换行表示差异当作插件改写平台正文。

## Agent 两次记录

- 第 1 次 `775cc859-f9fa-46bb-8266-bebf8421abbf`：2026-11-02 23:18:27–23:18:28 +08，平台状态 completed；当时未捕获忙碌／终态直接 Esc，重开历史后可见结果。
- 第 2 次 `a1c5f424-6193-4468-8320-ef27ee266432`：2026-11-02 23:43:47–23:43:50 +08，平台状态 completed；专门补测忙碌及终态直接 Esc。两条历史由只读平台响应核对。均未应用建议，也未开展第三次分析或第二次依据生成。

## 收态及环境变化

- 任务 rc.5 Desktop PID 4172、Host PID 27724 在“应用 → 退出”后消失，任务端口 51430 释放；退出码未捕获，为 UNKNOWN。日常安装版 PID 17728／Host 11576 仍运行，端口 58794 保持。`dsh` 协议当前指向日常 rc.5；仅在当前值精确匹配任务路径时恢复为当时日常 rc.5 路径。
- **早期事件单列**：登录回调曾以隔离 DSH profile、默认 Electron userData 启动第二实例。默认 userData 至少 42 个非凭据文件的修改时间落在回调后；没有逐文件 Before，因果和原内容未知。日常安装版在此期间从 rc.2 变为 rc.5 并带 `--updated`，触发原因未知。最初 964 个日常 profile／会话基线文件中最终仍有 2 个摘要变化（desktop profile `package.json`、一个旧 session），其余 962 相同；不覆盖新增文件。
- **rc.5 后段 fresh Before 单列**：1415 项中 39 项基线因占用不可读；1376 个可比较文件最终摘要均相同，不代表整个过程或新增文件未变。未回滚、删除或覆盖日常文件。原历史 session 和绑定的 SHA-256 分别仍为 `49cce19d02d2410b8e34cc8b9d0568d88e871f02325427eb5357f5df3c13469c`、`008b60ef33f7842b580c16b6bc15eb8148a7330118cfd8f4e55cc802e8e27a7f`；原测试工作区仍空。
- 测试用空白 Notepad++ 草稿已关闭；复制测试后剪贴板内容已变化，未在无法确认当前归属时强行恢复。安装使用共享 pnpm 内容缓存，属于附加缓存变化。未改生产源码、未发布或合并；未声称人工完整验收。

证据截图及机器对照保存在 `C:\bkn-verify\provenance-ci4-win-20261102\private`，包括 `w2-second-answer-reopen.png`、`w3-graph-node-selection.png`、`w3-output-esc-focus.png`、`w3-output-keyboard-esc.png`、`w5-second-immediate.png`、`w5-second-later.png`、`w5-second-terminal-direct-esc.png`、`w5-two-analysis-history.png` 及两份日常文件差异 JSON。

WINDOWS_E2E_REPORT_END
