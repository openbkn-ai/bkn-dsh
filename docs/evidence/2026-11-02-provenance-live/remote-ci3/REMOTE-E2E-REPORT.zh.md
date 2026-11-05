# Mac 固定 CI -3 原生溯源 E2E 回执

2026-11-02，Asia/Taipei。结论：当前 fea3 候选存在一项插件键盘 FAIL，不能标全量通过或正式发布验收通过。

固定源码 f13fe10c4d6041fd7ce7be5007e0740051ec29c0，CI41404675956，artifact13122759006。实际 tgz fea3d0052efc7188e989bd2582be8c6930eea03b903418103da4c28fc96b61a1，877043字节、126文件；官方 rc.5 GUI 安装并启用，126/126一致。CLI因desktop专属管理拒绝exit1的原记录保留，未绕过。

真实官方Desktop rc.5/build d4db512、Node24.21.0/Electron44.7.0。独立profile/user-data-dir；最终进程96749，backend62362。复用真实Session session-3e319448-0974-4199-a3fb-aa0ee980611a，通过原生finish回执关联int_3e92559bb0fbe9e5f83c110ce7ca3100，未注入handle、未发新业务问答。

已过实机边界：新平台场景与6次调用；缺绑定时保留本地时间线；零失败筛选；调用选择和原始输入/输出预览；部分列表提示且不默选其他轮；原文Popover；真实OS复制和原生保存；三条结论、证据/步骤/本体标识与API相符；图谱层与局部全屏；分析入口、显式启动、终态及只读历史重开。生成/分析各一次，没有为补覆盖重跑。

唯一已确认插件FAIL：分析完成后AX焦点在HTML内容节点，直接Escape未关侧栏。一次Tab回到历史选择框后，Escape才正常单独关层并回焦入口。原始失败截图/AX保留；原因本轮未知，AX不等于DOM activeElement证明。分析前双向Tab、聚焦层内Escape和关闭按钮通过，不能覆盖此FAIL。主会话已安排局部修复和后续新CI，本机未改生产代码。

平台结果单列：解释由not_generated变ready，生成时间2026-11-02T11:49:34.239078101Z；3结论、0条成立、问答对partial，10处invalid_schema_reference原样展示。顶层144节点/234边没有全部验收。分析db975623-4176-42b8-a084-7dffd7ec83f6已completed，decision=not_evaluable，建议0条，历史摘要与UI一致。不能把completed当业务结论正确。

原始Markdown5842字节，SHA256 4512e97e159d882f016719e9b76dcad53aba7a4a9a840b8db2311d1e939038d3，160处“请求失败。”来自平台正文。OS粘贴与原生保存逐字节匹配，草稿未发送且已清空。模型自述“没有事实输入”不证明插件丢输入：侧栏是预取，Host开始分析时会重读；实际POST、当次重取摘要、原始SSE帧和模型最终消息未捕获，服务端/模型实际输入UNKNOWN。固定源码发送{markdown}只能作为源码证据。前后Markdown相同也不是当次POST证明。

未覆盖：其他机器双轮/BOM59调用、managed父/内部调用没有合法本机入口；原生在途取消/迟到竞态、异常网络制造、Windows及全平台兼容不外推。刷新序列保留当前Interaction，但调用详情回到首项，未隔离触发点或Studio差异，另留观察。原文输出通过MarkdownText排版，不用AX中缺少Markdown语法串判字节丢失。

收态：3次正常退出均exit0；已捕获18个owned身份无存活，Harness进程0，55552/62362监听释放。126文件和已检查的EXE/ASAR+4个日常profile文件不变；原Session SHA不变，任务副本原70行不变、仅增加session/end-seed。原问题/答案/操作/时间链前后相同。dsh关联仅时间戳变化，守卫恢复后与Before字节一致（863edaca…f59）；无全局清理。正常授权足迹和新增解释/分析保留，不声称全机/全业务库逐字节不变。无push/merge/tag/发布/CI/latest操作。私有原件和截图仅留远程，清单不含凭据文件或自身条目。
