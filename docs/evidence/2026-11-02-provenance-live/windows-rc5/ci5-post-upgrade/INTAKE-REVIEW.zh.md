# 平台恢复后 Windows CI5 补测核收

2026-11-03。主会话与独立只读评审已核对公开原件字节、摘要及两报告一致性；私有截图、UIA和事件原件仍留Windows，本核收不冒充主会话直接操作或对私有证据逐件复验。

- JSON：23950 bytes，`c9cb31f0000fdc3adec3b2c4c4b1240506f73530b08b7defd9cb80c822f2acdc`。
- 中文报告：11182 bytes，`d8c755bba37f19ce917ff16b290d1fe23f444684bd4441ea4c497f6173f834c6`。
- 原件及传输回合见[RECEIPT.json](./RECEIPT.json)。保留原BOM/CRLF等字节，不整理或改写原报告。首次JSON导出因未分块被截断，只补传该文件四个独立块后完整校验，没有重跑实机。

可接收结论`SCOPED_COMPLETED_WITH_RUNTIME_ANCHOR_UNKNOWNS`，`releaseAcceptance=false`、`allPassClaim=false`。未发现两原件核心事实冲突、凭据泄露或有证据支持的新必修产品代码项；不升级为完整发布或全流程隔离通过。

## 核收范围与必要限定

1. **候选未变。** CI5/source `ae903656193d3fc5214469bc0e6ee1108e233075`、TGZ `14f4bb7f…`；本轮重算已安装client.js和官方Windows rc.5 EXE摘要。126文件安装核对来自先前CI5，本轮没有重装或再次逐件验包。实际served client摘要、loaded plugin version及Desktop build仍UNKNOWN。
2. **原记录恢复可读。** 健康200、端点`ServerVersion=0.2.0`与维护者声明相容。直接GET原C/I在现有凭据过期时均401，官方SDK正常续期一次后均200，TLS开启，续期前后subject/用户名指纹相同。该401不作为插件登录故障或记录丢失证据；也没有升级前身份/scope快照可证明跨升级完整一致。各服务镜像、commit、Ready未知，可选MCP元数据探针未执行。正常`/oauth2/token`认证POST确实发生，不称全程只有GET。
3. **锚定仍为PARTIAL。** 离线真实日志中turn4/M `5f3949b4…`的completed receipt对应当前第2轮；turn5/M `8d5d7d8b…`对应第3轮。正常滚动、渲染位置/特征及两入口页面结果与之相容，能够解释此前第3轮观察，但报告“先前入口属于turn5”在此仅接收为关联推断。实际按钮→messageId、opaque handle、运行时Host receipt和selected I未捕获。目标单次点击前曾手选第2轮，该次观察不是独立跨轮重置证明，不升级完整锚定PASS。
4. **Space只是限定观察。** 最终按键前是trigger自然持焦、hover已开。第一次后台poll先于按键结束，不能作瞬态证据；一次有界确认捕获open class清除/恢复及短暂transform/offscreen信号，后续样本仍开。没有亚500ms视觉关闭截图、DOM焦点或实际keydown/click目标，不称视觉关闭再展开或closed→Space打开PASS。[本地两Scene对照](../../SOURCE-TEXT-SPACE-COMPARISON.json)仅支持两种受控自然焦点前提下未观察到修前修后差异，不是Windows唯一根因、完整包等价或平台现场证明。当前无证据显示Escape修复新增Space缺陷；发布前仍需处置交互预期及未捕获部分。
5. **严格padding补到限定实机PASS。** 原1296×828窗口旧SKIP保留。一次1920×800窗口中，点`(1426,632)`确在section外、popup inner内、同一输出trigger内、另一输入trigger外，UIA命中`ant-popover-inner`。真实点击section自然持焦，再移至该点固定，Escape后各离散样本子关父留、焦点回自身trigger，至约3秒未见重开。名义0.5秒样本实际约665ms开始；实际keydown和样本间瞬态未知，不声称连续三秒保证。该真实几何不需再换布局补测。
6. **恢复保全有界。** 原Bounds/showCmd已恢复，正常菜单退出，任务进程和端口释放；日常进程按路径和UTC创建时刻重核、端口保留。第一次字符串/DateTime比较false及typed UTC更正原件保留，不误报为重启。1376个fresh清单摘要、六份旧报告、原始Session/binding及本轮协议值一致；退出码UNKNOWN。

## 继续保留的限制

- 当前隔离Session副本349153 bytes，与原始样本349071 bytes不同，来源UNKNOWN。只证本轮读取至退出后该副本与原件各自未变，不声称从最初复制以来等同。旧39 null、初始两项差异、至少42项mtime、共享缓存增量、新路径未枚举和安装触发原因继续保留。
- 69244字节detail及摘要属于GUI前gate；本轮同资源服务器After未测量，原业务响应正文未保存或输出。零发起业务写入、原始本地摘要或新200均不能证明服务器内容完全未变，也不证明旧404唯一原因。“未修改原记录”仅按测试未发起业务写入接收。
- 未重跑完整E2E、业务问题、依据生成、Agent分析、保存/复制或已过矩阵；没有新代码、包、安装、构建或CI。本轮不验证历史未覆盖的取消、低权限、异常网络、复杂图谱组合或Mac CI5原生路径。
- 发布前按声明范围处置运行时完整锚定、Space交互预期/现场平台差异、实际部署身份/合同和会话副本差异等未决项；未知不自动成为已修或已接受限制。平台原文、invalid状态和原因仍忠实保留，不由插件重判、清洗、补造或改写。

本次只接收既存候选的只读实机补证，不含合并、标签、发布、latest或用户最终人工验收授权。
