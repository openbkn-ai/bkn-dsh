# 平台原生合同复核

日期：2026-11-02。范围：会话过滤、固定端点、成功响应 envelope、分析 SSE。此次子任务只读分析源码，仅新增本文档；不调用真实平台，不修改产品源码。

结论：`conversation_id` 过滤及固定路由符合现有平台合同；发现并交由 Host 子任务修复了一个真实合同遗漏：分析流会发送 `meta/tool_call/done`，原插件白名单却仅接纳 `token/structured/error`。成功响应 envelope 未发现同类阻断。HTTP 错误中性化和 detail 预检限制是仍需明确记载的差异。

## 来源身份

本地来源根目录：`/Users/kalias/Documents/project/app/openBKN/platform-local-recovery/upgrade-20261019-020`。

其 `VERSION-SOURCES.json` 声明：Core `81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b`，EE `3a8647e22072a75f253250cfac73af9ef7394547`，Studio `90d3b92a909a3b98ad3e74b78b08ecf4fbdc3535`。Core 声明与本地 `bkn-foundry` HEAD 一致。Studio 已有选定文件 Git blob 核对见本目录 `UPSTREAM-BASELINE.json`；本次没有追加远端逐 blob 核对或部署镜像身份验证。

以下 `EE/`、`Core/`、`Studio/` 分别指该来源根目录中的 `ee-source/bkn-trace/agent-observability/`、`core/bkn-trace/agent-observability/`、`ee-source/studio/bkn-studio/`。行号来自本次读取的本地源码。

## 会话过滤：确实支持

- `EE/businessprovenance/http.go:87-91` 注册 `/business-provenance/conversations`、`/interactions` 和 Interaction 资源路径；没有注册 `/conversations/{id}`。
- 同文件 `129-136` 的 `listQuery` 读取 `conversation_id`；`107-116` 将其传给 `ListConversations`。
- `Core/src/driveradapter/api/httphandler/enterprise_interaction_reader.go:47-57` 将其转为可信权限作用域内的 `SummaryQueryOptions.ConversationID`。
- `Core/src/domain/service/evidencesvc/summary.go:100-108` 显式识别指定 Conversation；`220-222` 将 projection 查询限定为单个 `ConversationIDs`；`2274-2277` 再按 Conversation 过滤候选。
- 同文件 `1980-1986` 要求 `ConversationID == ""` 才能使用无内容过滤的 identity-page 快速路径，因此指定会话不会走忽略此参数的快速路径。
- `Studio/src/modules/bkn-trace/business-provenance/business-provenance.service.ts:176-190,543-553` 的原 service 也使用列表端点，并将 `conversationId` 映射为 `conversation_id`。

当前插件读取 `/conversations?conversation_id=<可信会话>&page=1&page_size=50`，不是依靠 fixture 发明的接口；不需要另造会话详情 API。

## 固定资源与响应形状

共同前缀为 `/api/agent-observability/v1/business-provenance`。

| 操作 | 原生方法与路径 | 成功响应及来源 |
| --- | --- | --- |
| 会话/轮次列表 | `GET /conversations`、`GET /interactions` | 根对象 `{entries,total,page,page_size,partial,truncated,partial_reasons}`；`EE/businessprovenance/http.go:101-136`，原 Studio service `176-265` |
| 已有调用事实 | `GET /interactions/{id}` | 直接返回根 graph，非 `{data:...}` 包装；`EE/businessprovenance/http.go:163-219,238-307` |
| 已有解释/显式生成 | `GET` / `POST /interactions/{id}/explanations` | `{schema_version:"1",interaction_id,status:"not_generated"|"ready",generated_at?,view?}`；`EE/businessprovenance/current_explanation_http.go:18-23,33-41,108-116`。`view.interactionId` 使用平台解释 schema 的 camelCase，当前 scope 校验及 parser 与此一致 |
| Markdown | `GET /interactions/{id}/markdown` | `text/markdown; charset=utf-8` 原文；`EE/businessprovenance/http.go:198-207,253-268,831-844` |
| 历史 | `GET /interactions/{id}/analysis` | `{entries:[AnalysisHistoryRecord]}`，记录身份字段为 `interaction_id`；`EE/businessprovenance/http.go:469-500,582-594` 及 `analysis_history.go:16-29` |
| 显式 Agent 分析 | `POST /interactions/{id}/analysis` | `text/event-stream`，见下节；`EE/businessprovenance/http.go:480-501,605-735` |

生成解释接受空请求体或 `{}`，拒绝版本/来源等额外参数：`EE/businessprovenance/current_explanation_http.go:75-91`。当前插件固定发送 `{}`。

已将上述形状与插件 `provenance-detail-scope.ts`、平台目录 `normalizers.ts`、`adapter.tsx` 的消费路径对照，未发现第二个成功响应 envelope 阻断。此结论是源码合同复核，不是当前部署返回的实测结果。

## SSE 遗漏、修复和回归

真实平台输出由 `EE/businessprovenance/http.go:605-735` 定义：

| 事件 | 原生行为与约束 |
| --- | --- |
| `meta` | `618` 在开流时必发 `{analysis_id,status:"running"}`。`635-636` 也可以继续透传上游原始 `meta` |
| `token`、`tool_call` | `635-636` 原样透传上游 data；该代理分支没有规定 tool name/args 等额外字段，因此插件不能从受控 fixture 推导新的字段必填规则 |
| `structured` | `637-652` 由平台验证后发送 `{content:<原生结果对象>,analysis_id}`。这是平台验证，插件不重新验证业务结论 |
| `error` | `653-659` 发送 `{code,message}`，记录失败并中止；无 structured 却收到 done 时由平台转为 `analysis_empty_result`；流异常结束且尚未完成时由平台发送 `analysis_stream_interrupted`（`660-666,730-734`） |
| `done` | `668` 发送 `{analysis_id,status:"completed"}` |
| heartbeat | `725-727` 为纯注释 `: keepalive\n\n`，没有 data，不应当成损坏事件 |

原 Studio service `435-467` 逐帧解析后只消费 `token.content`、`structured.content` 和 `error.code/message`；`meta/tool_call/done` 不改变界面业务结果，自然忽略。其 `parseSSEFrame` 在 `499-516` 接纳任意事件名的 JSON 对象；纯注释无 data 时忽略。插件保留已确认的原生事件并让适配器按相同方式消费，未知事件仍可受控拒绝。

修复前，插件 Reader 与 scope 均只有三类白名单，因此真实开流的首个 `meta` 会触发 `INVALID_RESPONSE`。该问题已交给 Host 子任务，先以原生序列复现再修复：

- `SSE-NATIVE-BEFORE.log`：新增 3 项，1 通过、2 失败，Reader/Scope 均在首个 meta 被拒，退出码 1。
- `SSE-NATIVE-AFTER.log`：仅扩展两处已确认原生事件白名单；受影响四个测试文件合计 **50/50** 通过，退出码 0。没有增加控制帧额外必填字段，没有修改平台状态或模型输出。
- `HOST-GATEWAY-SSE.json`：官方 npm 双版本 Gateway 和实际生成 codec 的受控完整序列回放；模拟分析 POST 每个 Host 1 次，global fetch 封死，真实平台网络/POST 为 0。不能写作真实平台分析已通过。

## 尚需保留的差异

原 Studio 的 `analysisFetchError`（原 service `519-539`）会读取 HTTP 失败体中的 `{error:{code,message,status_code}}`。当前 Host 对非 SSE 的 HTTP 失败刻意只向 Client 暴露固定安全分类和 HTTP 状态；具体平台 HTTP 原因不会透传。这与已解析 SSE `error` 的 code/message 原样保留不同，不能泛称所有分析错误文字均与平台完全一致。

平台在旧 graph 不存在时仍可能提供原始 Trace Markdown：`EE/businessprovenance/http.go:245-248`。插件的 KN/detail 安全预检在 detail 不可读时会拒绝后续 Markdown/解释/历史/动作，因此这条 legacy Markdown 回退也受限。主记录已有“预检 detail 不可读不继续”的限制，不将其误记为该平台功能已在插件验收。

本次仅核对固定源码合同。当前部署服务身份、同记录响应、真实认证/证书/权限、平台分析与解释生成仍须实机执行；未执行项不能由这些源码位置或受控测试代填。
