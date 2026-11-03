# Mac CI6：50.129 原生 SourceText 前提补充

结论：已接续支持 CLI 0.2.1 的现有 CI6，找到一条原始绑定 50.129 的真实历史 DSH 会话；当前该样本的原生 conversation、rounds、detail 均为 404。因此 S1–S3 继续 NOT_RUN，未把 404 或历史证据记作当前 GUI 通过。本轮没有等待新包，也没有启动 GUI。

## 固定身份

- 源 f01b316fbfb6be681af81e2267a7b3341e659efd；CI 41596006291；artifact 13212518096。
- 候选 0.2.1-rc.3-openbkn.0.2.1-3，877732 bytes，SHA256 4500fa4357cdcdcb9914a39794aedb9096c948192c2bf0f35ecf4fadb882f046，126 文件；未改候选、未重装。
- 官方 Mac Desktop rc.5；只读候选 Reader 在官方 Electron 44.7.0 / Node 24.21.0 中执行，非 GUI/Host 启动，exit 0。
- 独立官方 CLI 0.2.1-rc.1，目标 https://192.168.50.129。health 200，ServerVersion=0.2.1-main.20261103005009.sha0acbbb4；不称正式平台 0.2.1 全面验收。

## 有界调查和实际结果

原有演示 receipt 与原生持久化 Session/绑定共同定位到 session-a83f8f70-3ba6-4dd7-8cf9-bc1a7a1410f8；C=conv_f9393d61b4aec2cf1c65a9f8564910cc，I=int_194b763886daf8e1c49a88a528da2d1d，KN=supply_ontology_hand，原始绑定 origin=50.129。该历史模型回合来自官方 rc.3 npm/Web，只作为样本来源，不转记 rc.5 验收。原生压缩会话 SHA256 542469ac20f2bce33106c265840a164aad177c01c42af01af06cf3c066b0fe79，当前仍相同；未复制、重放或读取输出到公共报告，未构造 handle。

先完成一轮只读预检，再用 CI6 内真实 OpenBknPlatformReader 核实其产品路径和请求策略：

| 既有样本 | conversation | rounds | detail / Core |
| --- | --- | --- | --- |
| 上述真实 DSH 样本 | 404 | 404 | 原生 detail 404；Core detail 404/resource_not_disclosed |
| 本轮已完成 CI6 的 C=conv_1ea64d10d4e5ea3e211ab81fa7962dea / I=int_baa39f5f03996a54e0e5aa407b46186e | 404 | 404 | 原报告原生 detail 404、Core operations 200/9条，均未重跑 |

实际候选 Reader 共 5 个 GET，使用 Bearer（未披露）、x-business-domain=bd_public、正常 TLS 校验、redirect=error。精确路径：

- `/api/agent-observability/v1/business-provenance/conversations?conversation_id=<上述实际C>&page=1&page_size=50`
- `/api/agent-observability/v1/business-provenance/interactions?conversation_id=<上述实际C>&page=1&page_size=50`
- `/api/agent-observability/v1/business-provenance/interactions/int_194b763886daf8e1c49a88a528da2d1d`

五次均返回 text/plain、19 bytes，相同响应 SHA256 b16e15764b8bc06c5c3f9f19bc8b99fa48e7894aa5a6ccdad65da49bbf564793；候选归类 NATIVE_NOT_AVAILABLE/httpStatus=404。完整 URL/status/时刻/Reader 身份见补充 JSON。调查限已知两个 C，不声称穷尽所有平台会话。404 的唯一根因仍 UNKNOWN，不归因于社区/企业、许可、权限、删除或缺投影。

## 原有 UI 项保留

- S1 NOT_RUN：输出 hover→覆盖自身 trigger 的 popup 正文点击→Escape→指针留驻约 1s/3s，子关父留且不重开。
- S2 NOT_RUN：真实 padding/arrow 与 trigger 重叠路径；未启动 GUI，未调整窗口。
- S3 NOT_RUN：输入/输出键盘明确激活→Escape→返回 trigger→首次真实 hover 重开；未以 DOM 事件代替。

缺少的是：50.129 同 origin 的既有真实 DSH 答案及其可读原生 conversation/rounds/detail。仅 Core operations 可读、另一个 token、新包标签或合成 handle 均不能替代。由主会话跟踪原生读取前提，前提成立后只补这三项，不为制造样本创建新问答、解释或分析。

## 保全与边界

原 CI6 JSON 13183 bytes/SHA256 1d325c745e4988437426b2af3673ec88897591ab6a96ad9f04bac9085a725873；原中文报告 5351 bytes/SHA256 1843cb905433b9f3f762c8f18edfc2b8a3c94fe165df7b777aba84690f6caa78，均未覆盖。候选 TGZ、源 HEAD/干净 checkout、原旧平台 workspace 绑定摘要及所查历史 Session 摘要保持。绑定摘要仍 3596b01e095397137ff33b617089beeb06aa06cbcb76ddf052a26113e5cc8f02。

本补充未启动 GUI/Host、fixture、浏览器或监听；短 Reader/CLI 子进程已退出，无新增这些对象需要收态，因此不重跑全机清理或既有 R5。没有新模型回合、业务 tools/call、解释生成、Agent 分析、Session 重放、平台/Host/绑定改动；不重跑已过安装/登录/查询/CSV。正常 CLI token 访问可能按官方流程续期，不声称整个认证或服务器状态逐字节不变。原始响应等只留本机；公共产物无凭据、业务正文、账号路径。之前旧目标续期检查保留为历史，不再访问 50.28，不再等待其卡片。

仅追加本补充；无推送、PR、合并、tag、发布、latest 或 CI。
