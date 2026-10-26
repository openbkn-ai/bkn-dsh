# Windows A7 最小取证提示词

只补 **现有 -12 npm/Web 原回合的一条失败事件**。不复测功能、不重新提问、不重新登录、不升级/重装插件、不重启已退出的宿主，不跑 D1–D4 / E00–E10 / G6，也不调查 runner 或 Ctrl+C；这两项先作为已知问题保留。全过程不执行 npm publish、任何 dist-tag 或生产 v* tag，预期仍 rc=-11、latest=-10。

目标：原 TestRoot `C:\bkn-verify\english12-npm`，工作区 `C:\bkn-verify\english12-workspaces\npm-supply`，Interaction ID `int_c307c7650a1b644186676b3f1af48f29`，2026-10-23 10:43 左右（Asia/Taipei，02:43Z）。只定位该回合中**第二次** `mcp__openbkn__bkn_start_interaction`、`conversation_mode=continue`、时间线显示 error/0 ms 的调用。不是前一次成功的 new 调用，也不是另发一次相同问题。

从该测试实例已有的会话持久化记录里本地过滤。若宿主仍运行且已有轨迹详情可直接读取，也可使用；不要为取证重启。不要把整个日志、会话或用户/助手消息正文输出到工具、聊天或回传包。仅保存下列脱敏投影：

1. **定位与配对**：sessionId、turn、callId/toolCallId、工具名、调用及结果事件时间、来源文件相对路径/事件序号。将原 `tool/call` 与相同 callId 的 `tool/result` 配对；按实际日志形态读取 `message.toolCallId` 或 `message.source.callId`，不假设只有一种格式。
2. **调用参数白名单**：`conversation_mode`、`conversation_id`；`agent_name`、`question` 仅记字段是否存在、类型、是否为空及长度，**不附正文**。如原记录还有 interaction_id / kn_id，仅记实际存在的技术 ID，不补造字段、不把 kn_id 当作该工具的必填要求。
3. **原始失败**：保留结果的实际 `isError` 位置和值（message 顶层或旧格式 content 内）、原始错误 code/message/HTTP status（若有）；错误文本只遮盖凭据和无关敏感内容，保留有诊断意义的原措辞。若只有纯文本，就写纯文本；缺失字段填 null 并说明，不能把 error 标签改写成猜测的错误码。
4. **最小关联上下文**：前一次成功 start 只取 callId、mode、返回 conversation_id/interaction_id；后续 finish 只取 callId、交互 ID和完成状态。不要附完整参数、平台输出、模型回答或整段相邻会话。
5. **是否实际发往平台**：仅根据已有同 callId/请求 ID/时间关联的 dispatch 或请求错误事实填写 true / false / unknown，并给出处。0 ms、平台操作 completed、平台列表里没有 start，都不能单独当作 false 或成功证据；没有证据就填 unknown，不新抓包、不新发请求。

输出到包目录外的新目录 `C:\bkn-verify\english12-a7-return`：`A7-event.json`（上述最小投影）及 `A7-notes.md`（实际查找位置、脱敏字段、缺失项）。有现成失败详情截图可加一张；没有就不补拍。不要修改原 english12-delta-return.zip 或其中状态，不清理原会话。

若原事件已不存在、无法只读解析或结果只有 error 标志而没有错误内容，**立即停止扩展**，在 notes 写明查了哪个测试存储/事件类别、找到了哪些定位字段、缺哪部分；不为找齐证据重启、重登、发问或重跑全量。此时可只回传 notes 及已取得的最小定位信息，不伪造完整事件。

打成新的 `english12-a7-return.zip`，回传 SHA-256、实际文件数和维护端可访问的本机共享路径/私密链接。先在本地检查脱敏再返回；不自动上传到公开 release。禁止包含 token、设备码、授权 URL、请求授权头、cookies、bkn-config、private、整个 DSH_HOME 或会话全文。
