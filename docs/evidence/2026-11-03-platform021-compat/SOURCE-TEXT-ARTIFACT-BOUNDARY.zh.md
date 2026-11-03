# 原文 artifact 与 SourceText 验收边界

2026-11-03；源码核对与已核收现场报告的取证说明。整理本文件未新增平台/模型/业务调用或测试；不是产品修复，CI6源码、包及旧raw报告不变。

**结论：当前仅缺少 `interaction_question`、`interaction_result`，不足以证明插件回归、原文已删除、版本不兼容或隐私策略生效；不得用 DSH 消息、summary 或历史通过记录补填、代签本次原文验收。**

## 已确认的源码边界

- **Core 正式 0.2.0 支持授权原文 reader。** Foundry `81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b` 的 [`socket.go:72–77`](https://github.com/openbkn-ai/bkn-foundry/blob/81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b/bkn-trace/agent-observability/src/extension/enterpriseroute/socket.go#L72) 声明可选 `InteractionArtifactReader`；[`enterprise_interaction_reader.go:94–154`](https://github.com/openbkn-ai/bkn-foundry/blob/81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b/bkn-trace/agent-observability/src/driveradapter/api/httphandler/enterprise_interaction_reader.go#L94) 核调用者 scope、当前 Interaction 引用、artifact 类型及所属记录后读取正文。公共 [`summary.go:198–222`](https://github.com/openbkn-ai/bkn-foundry/blob/81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b/bkn-trace/agent-observability/src/domain/valueobject/evidencevo/summary.go#L198) 只有 preview/ref，完整原文为 `json:"-"`。artifact 内部的 `text/question/result/answer/summary` 解码键不是 native detail 别名。固定 main `1a3a76edb993d3944afb94a135392d33c90a0432` 未改此命名和读取逻辑，亦非正式 0.2.1 pin。
- **EE 可返回 graph 200 而不附原文。** 本地 `openbkn-ee` 快照 `aa6b3826ff0ce7150da011121c448ca575cedfa3` 的 `bkn-trace/agent-observability/businessprovenance/resolver.go:113–120` 声明两字段为顶层可选字符串；`http.go:295–368` 动态读取授权 artifact，不写回封存图。缺能力、引用、内容或读取错误均可能不附原文；读取报错可使两项补充均空，handler 仍保留图并返回 200。`http_test.go:380–490` 禁止以 preview 冒充原文。**正式 Foundry 不含该 EE 实现；此快照不能当作 50.28 当前部署 pin，缺字段也不能唯一归因为授权、数据或读取故障。**
- **插件保留字段，使用方式与 Studio 一致。** CI6 `f01b316fbfb6be681af81e2267a7b3341e659efd` 的 [`platform-reader.ts:219–240`](https://github.com/openbkn-ai/bkn-dsh/blob/f01b316fbfb6be681af81e2267a7b3341e659efd/packages/openbkn-business-context/src/platform-reader.ts#L219)、`provenance-detail-scope.ts:167–173` 保留 detail JSON；[`normalizers.ts:57–64`](https://github.com/openbkn-ai/bkn-dsh/blob/f01b316fbfb6be681af81e2267a7b3341e659efd/packages/openbkn-business-context/src/client/platform-provenance/normalizers.ts#L57) 仅映射顶层 snake 字段，不删原文、不猜包装或别名。[`BusinessProvenanceScene.tsx:397–434`](https://github.com/openbkn-ai/bkn-dsh/blob/f01b316fbfb6be681af81e2267a7b3341e659efd/packages/openbkn-business-context/src/client/platform-provenance/business-provenance/BusinessProvenanceScene.tsx#L397) 缺原文时显示摘要提示或“未记录”，不提供全文 popover，不以 DSH、解释 view 或 summary 反补。固定 Studio release/0.2.0 `90d3b92a909a3b98ad3e74b78b08ecf4fbdc3535` 的 [`business-provenance.service.ts:328`](https://github.com/openbkn-ai/bkn-studio/blob/90d3b92a909a3b98ad3e74b78b08ecf4fbdc3535/src/modules/bkn-trace/business-provenance/business-provenance.service.ts#L328) 与 [`BusinessProvenanceScene.tsx:372`](https://github.com/openbkn-ai/bkn-studio/blob/90d3b92a909a3b98ad3e74b78b08ecf4fbdc3535/src/modules/bkn-trace/business-provenance/BusinessProvenanceScene.tsx#L372) 同义；“未记录”空态文案不证明后端从未保存。

## 当前进度与最小现场证据

**Mac最终[企业28补充](./mac-rc5/MAC-CI6-EE028-FIELD-RECONCILIATION.zh.md)已按原bytes/SHA核收并独立复核：**同S/C/I/KN、6个Operation ID及顺序一致；旧JSON仅去两原文字段后与当前深度相等。当前候选Reader与Studio同route200的bytes/SHA相同，Studio自身也显示未记录；另3个指定既有I同样缺原文。当前CLI caller sub为opaque未知、Studio主体未独立核实，响应相等不代替主体同一性。Core答案ref非空、正文未读取，不证明原文可读。S1–S3仍NOT_RUN，不能以旧CI3/CI4曾打开全文代签当前；缺字段的部署根因仍未知。

以下为本次核收采用的最小脱敏现场要求，不返回业务正文、凭据或 artifact 内容：

1. 实际 origin、当前授权主体等价检查、S/C/I/KN 与实际选中 I；核对 6 个 operation 身份，不能只比数量。
2. 当前 native detail 请求路径、状态、Content-Type、根键列表；两字段分别记录 `hasOwn/type/是否非空/长度`，区分 absent、null、空串及包装位置。
3. 同平台、同主体、同 I 的平台页面原文按钮/摘要状态，以及页面实际 detail 响应的同组字段存在性，保留与插件的对应关系。
4. 若两侧均缺，再记录当前 Core summary 的 `question_preview/result_preview/question_artifact_ref/result_artifact_ref` 存在性、非空性及 `evidence_completeness/partial_reasons`。这只能缩小定位范围，不证明正文已删除。

同一响应原文非空、平台页可打开而插件不可打开，才有继续定位插件传输/映射的直接差异证据。本次核收未建立新增必须修改 CI6 的事实；不补填、不重新生成、不修改平台或模型输出。
