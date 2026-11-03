CI5 SourceText Windows 定向回验（2026-11-03，Asia/Taipei）

结论：六类基本序列、原输出重叠点击故障点及一次确认，在实际采样范围内通过。严格“section 外 padding 同时覆盖自身触发器”仍为 SKIP；单次原生窗口尺寸补测遇到 NATIVE_NOT_AVAILABLE／平台记录 404。平台正在更新，相关未闭合项保留，不能作为全局发布或升级后验收。

候选为 run 41548846010，source ae903656193d3fc5214469bc0e6ee1108e233075，publish=false，artifact 13191140519（plugin-tarball）。ZIP 877540 bytes，SHA256 ade22f125ead5bce70c29e06f22d509949ff0a006cd8047e8d6f8d81702e38f3。TGZ 877506 bytes，SHA256 14f4bb7fb61c892017343c832fdc8b37d892706b9a7aa2146779eef00ee9e3ff。官方 rc.5 CLI 安装 exit 0，126/126 文件哈希匹配；相对 CI4 仅 lib/client.js 改变，现为 f7184c97d65d9bf72c192172f8e1815aee022d05df5c54905dc3c7a32c113e10。没有本地构建或源码修改。

使用原隔离官方 Desktop 0.2.1-rc.5，EXE SHA256 7ae939b5a82b220fbd8ad04dfbafaaedb5a49ab43dc884a5db6381f678dd0cc4，签名 Valid。本次冷启动于 08:10:06.812；Desktop PID 32304、Host PID 6816、端口 49269、HWND 1116406，创建时间在各用例 UIA 观察中一致。10:24:02 已实际确认桌面可控。Windows UI 操作只用 Windows MCP；UIA 观察不注入焦点，不执行 DOM/CSS 修改。实际 served client digest、loaded plugin version、Desktop build commit 和有效模型会话元数据仍 UNKNOWN；请求模型为 gpt-6.1-sol/max。

原样本为 session-58973674-89a4-43ae-a2b7-9f32e86032e3、conversation conv_3d9d7a82c9984b25ae8d0c18a47adfe4、第 2 轮 Interaction int_b00aabd41e40ea38eb1f9589f6057557。矩阵开始前实际打开原生场景并确认 conversation／轮次；故障回退时没有取得可信失败 receipt，不能仅凭同名按钮替回退请求填写这些 ID。

| 基本序列 | 实际结果 |
| --- | --- |
| 输入 A：搜索持焦，纯 hover | 原文可见，焦点仍在搜索；Escape 关闭父详情及子弹层，符合指定容器策略。PASS |
| 输出 A：搜索持焦，纯 hover | 同上。PASS。首次设置发生在轮次未稳定时，未按 Escape；稳定后真实离开再 hover 才进入正式用例。 |
| 输入 B：hover → 真实点击 | UIA 命中输入触发器，点击切换为关闭，焦点在触发器；未补发无效弹层 Escape。PASS |
| 输出 B：hover → 重叠点真实点击 | (1450,632) 点击后 UIA 焦点进入输出 section；Escape 留驻，子层关闭、父层保留。一次确认结果相同。PASS |
| 输入 C：搜索 → Tab×5 → Enter | 中立指针 (925,450)，自然焦点到输入触发器；打开后 Escape 只关子层，焦点保留在输入触发器。PASS |
| 输出 C：搜索 → Tab×6 → Space | 中立指针，焦点到输出触发器；打开后 Escape 只关子层，焦点保留在输出触发器。PASS |

两条键盘关闭路径之后，没有额外制造 mouseLeave，首次实际 hover 均重新打开。输入通过 Enter 切换关闭后明确重新打开，再次 owned Escape 可关闭；输出从已观察关闭状态真实点击重新打开，焦点在输出触发器，再次 owned Escape 留驻可关闭。真实离开触发器与 popup 的联合区域再 hover、另一字段独立打开、后续搜索持焦的父层 Escape，以及原答案入口最后一次重开均通过。最后一次原答案重开默认第 3 轮，仅验证原入口可重开，不将其写成第 2 轮新用例。

两轮核心 Escape 的请求／工具返回分别为 10:30:16.216／16.745、10:31:07.487／08.015。以工具返回为零点，截图请求实际偏移分别为 [13,516,1505,3009]ms、[4,503,1505,3007]ms；各采样均为子层关闭、父层保留，指针不动。完整实际请求与返回时间保存在 private/interaction-events.json。真实 keydown 时刻和 DOM 事件目标 UNKNOWN；离散截图不能证明采样间从未重开。部分首次 UIA FromPoint 返回底层 trigger，原件保留，后续稳定命中和真实点击后 section 持焦另有记录；不将 UIA 存在／offscreen=false 单独当作 CSS 可见性。

原窗口 Bounds [632,290,1296,828]，正常状态 1；工作区 [0,0,2560,1400]。输出 section [1187,562,696,528]，popup inner [1175,550,720,552]，自身 trigger [1407,571,434,69] 完全在 section 内，因此 section 外 padding 与自身 trigger 无交叠。真实点击 section 后移至 (1450,556)，UIA 命中 ant-popover-inner，焦点仍在 section；未再点击／补焦，Escape 留驻可关闭，但这只是非交叠 padding 观察，不能替严格用例记 PASS。

经主会话追加授权，仅一次把任务窗口调整到 [320,290,1920,800]，HWND/PID/创建时间一致。同一原答案按钮经普通重开两次均显示 NATIVE_NOT_AVAILABLE 与“平台记录不可用（404）”，没有 source trigger／popover，无法取得同一 Interaction 的几何。停止尺寸尝试，严格用例及该补测均 SKIP。随后已核实 Bounds 完整恢复 [632,290,1296,828]、状态 1。未证明 resize 是原因；恢复后入口分诊指令到达时任务已退出，未为此重启。

另保留一项未分类设置观察：输出已 hover 打开且指针覆盖 popup 时，Space 后 UIA 仍见打开，随后的点击实际持焦 section，不能算“关闭后明确再开”。该步骤不计通过的再开证据；之后从实际关闭状态执行的真实点击再开已单独验证。机制 UNKNOWN，原件未删除。

主会话转达本人“50.28正在更新”，获知并记账时刻为 10:55:25（UTC 02:55:25），platformMaintenanceConfirmedByUser=true。升级精确开始／结束、具体 service／版本未知。此前获准的仅两条只读对照于 10:54:27 完成：

| 实际 GET 路径 | 请求—返回（本地时间） | HTTP |
| --- | --- | --- |
| /api/agent-observability/v1/business-provenance/conversations?conversation_id=conv_3d9d7a82c9984b25ae8d0c18a47adfe4&page=1&page_size=50 | 10:54:26.966—27.040 | 404 |
| /api/agent-observability/v1/business-provenance/interactions/int_b00aabd41e40ea38eb1f9589f6057557 | 10:54:27.040—27.054 | 404 |

对照通过官方 SDK 复用隔离 managed CLI 既有授权和既有 CA，TLS 校验开启，禁止 refresh／retry，仅允许上述两个 GET；没有输出凭据或任意错误 body。获知维护后停止全部平台访问。GUI 发生回退时的实际 session/message/conversation/Interaction、GET 路径和 wire status 没有可信请求／Host 失败 receipt，均 UNKNOWN。代码中初始 conversations GET 的 native 404 映射 NATIVE_NOT_AVAILABLE 仅为静态分流依据，不是 GUI 请求取证。独立对照不能回填当时请求。平台更新说明与不可用现象相容，不证明唯一根因；既有 UI 结果也不能升级为平台升级后验收。

任务于 10:48:13 通过“应用 → 退出”正常收态；32304、8068、26796、14016、6816 均已消失，49269 释放，实际 exit code UNKNOWN。日常 Desktop 17728／Host 11576 创建时间不变，仍监听 58794。fresh Before 的 1376 个可比文件全部哈希相同，0 缺失／不可读；旧 39 个 null 基线仍 UNKNOWN，未枚举新增路径。最初 964 基线的两处历史差异仍在（日常 package.json、既有 session-993270e5… 文件）。原始样本 session 与 binding 的哈希匹配；四份旧 CI4 报告原字节不变，旧 FAIL／UNKNOWN 保留。协议最终与 fresh Before 的日常 rc.5 命令一致，最终无需改写，恢复规则始终只允许精确 owned 当前值守卫。

历史 callback 至少 42 个默认 userData 文件 mtime、日常 rc.2→rc.5 升级触发原因未知、最初两处差异及 shared pnpm cache 增量均未抹除，不声称整个验证流程完全隔离。

本次新业务问答 0、依据生成 0、Agent 分析请求 0、发起的平台业务写入 0；诊断只读 GET 为上述 2 次。这是操作计数，平台记录 After 未测量。未 commit/push、新建 CI、merge、tag 或发布。报告 JSON 为机器可核对原件；截图、UIA、实际事件时间和环境收态原件留在同目录 private/。
