# 平台业务溯源上游刷新

2026-11-02，06:33 UTC 核查。此次只读源码与 GitHub Git/Contents API，对现有 checkout 不作切换、修改或 fetch；仅新增本报告。没有升级 pin、请求真实平台、执行生成/分析、构建或测试。

**结论：已确认的固定 Studio/Core `release/0.2.0` 沿革中未发现新增阻断。** Studio release 仍是 `90d3b92a909a3b98ad3e74b78b08ecf4fbdc3535`；Foundry release 仍是 `81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b`。main 已有按需优化与新 UI，不能据此宣称当前插件与未发布 main 逐项一致，也不应在本候选中直接换入。EE 对应源码沿革存在下述缺口，不能宣称新版 EE 的兼容性已确认；源码没有变化也不等于实际部署、Host 加载或真实写入动作已验收。

## 核查身份与方法

| 来源 | 固定/历史来源 | 本次远端身份 |
| --- | --- | --- |
| Studio release/0.2.0 | 本插件复用 `90d3b92a909a3b98ad3e74b78b08ecf4fbdc3535` | 同一 SHA，无该分支新增差异 |
| Studio main | 先前记录 `d8de7dab18b89d5d49fe54ab22166872a32b5f7f` | `31b33b2c12ee13eb02de181604cab838be90d32b`，2026-11-02；下列关键 main 文件 blob 与先前记录中的 main blob 仍相同 |
| Foundry release/0.2.0 | 本地 Core 及恢复快照 `81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b` | 同一 SHA |
| Foundry main | 与 release 分支分离的开发线 | `cf98755f7a0953ba436936c07724e4b2a5bdd193`，2026-11-02 |
| EE 实现 | 恢复快照声明 `3a8647e22072a75f253250cfac73af9ef7394547` | 候选私有仓库 `bkn-foundry-ee` 的 main 为 `a17f0c2cb858363f0a27d5d9622cdc45a6948482`；但 baseline SHA 在该仓库无效、`release/0.2.0` 为 404，且当前完整树没有旧 `businessprovenance/` 路径，尚未证明它是该快照的对应沿革 |

GitHub Latest：Foundry `v0.2.0`；Studio 仓库 Latest 标签仍是历史 `v0.1.3`，不能把其 Latest 元数据当作部署中 Studio 的版本。各来源分开核对，不能把 Core commit 当作 Studio/EE commit。

Studio 两个精确 commit 的 recursive tree 均 `truncated=false`（1845/2274 entries），逐文件 blob 比较覆盖 `business-provenance`、`evidence-chain`、对应 locale 与 MarkdownText；对有差异的产品文件读取完整 diff。Foundry 大 compare 有 490 commits 且分支 diverged，GitHub compare 文件列表有上限，不以其前 300 文件声称全量无变化。Core 两个完整树为 6114/6703 entries，选定 `evidencesvc`、`evidencevo`、`httphandler`、`enterpriseroute` 前缀共有 56 项 blob 新增或变化；选中企业路由接口未变，不将其余未逐项审计的 main 实现称作合同等价。候选 EE main 完整树 5483 entries、`truncated=false`，没有旧实现路径。

## 相对固定 Studio release 的重要 main 差异

| 边界 | 源码变化 | 对当前候选的判断 |
| --- | --- | --- |
| 完整详情载荷 | service 显式请求 `deduplicate_payloads=true`；响应可用 `time_rail_payloads_shared`、`shared_inline` 表示与 operation 共用内容，按 `operation_id:attempt` 回填，缺少对应原载荷时报错 | 已证实 Studio 客户端主动 opt-in，当前插件不发该参数、仍消费固定来源的展开格式；新版后端不带参数时的默认行为尚未独立证实，不能据此扩大兼容声明。现有 16 MiB detail 预算不应被删除或用插件截断替代。未来若采用，需先补后端证据及跨 attempt、缺引用、原字节回归 |
| Markdown 获取 | Scene 从选中轮次即预取改为复制、下载、打开分析时按需请求，合并同轮在途请求并核对轮次身份；空文本报错 | 原文内容合同没有改变；当前候选保留 release 的预取方式。main 方式是性能/交互后续项，不构成本固定基线的阻断 |
| 本轮输入/输出原文 | `SourceText` 的 MarkdownText 展示和 hover/click Popover 没有此轮上游变化；MarkdownText 组件及样式 blob 均未变 | 插件本轮只增加嵌入式键盘/焦点边界，不得重写平台输入、输出或用 preview 补造缺失原文 |
| 分析输入与 SSE | `POST .../analysis` 的 `{markdown}`、Bearer、401 后 refresh/retry 及 token/structured/error 消费保持；分析预览仍只读 TextArea，main 将 autoSize 改为固定 14 行 | 浏览器显示的 Markdown 不是业务事实授权。插件 Host 仍重新读取选中平台 Markdown，再发固定分析端点；禁止接受浏览器任意业务 Markdown。现有六类原生 SSE 白名单保持，不能因为 Studio 仅使用其中三类而删掉 meta/tool_call/done |
| 解释语言 | `generateCurrentExplanation(id, locale)` 发送 `{locale}`；解析 `locale`，缺失时按 `zh-CN` 展示；UI 新增中英文选择、已生成语言、替换提示及 busy 防重复 | 当前固定 release 生成合同为 `{}`；未经升级完整合同与回归，不应向旧平台发送 locale。新语言选择 UI 不属于本次固定来源的已实现范围 |
| 状态/证据呈现 | 加入 canceled/handed_off/abandoned 文案；016 使用真实 attempts 的失败条数提示，移除旧 completeness 展示；016 加入平台 `view.notices`，legacy 提示抽为公用组件 | 这是平台新展示语义。当前固定来源没有同步这些 main UI，不能宣称最新 main 完全同版；插件继续忠实保留 invalid、原因及原记录，不能自行推导新失败状态 |
| 全局会话列表 | 移除会话级证据完整性列/筛选及相应 query 类型字段 | DSH 当前会话没有平台全局列表，不属于本次适配范围；轮次及详情合同仍分开检查 |
| Studio 通用认证 | `http.ts` 新增 `skipAuthRefresh`；业务接口 refresh 后仍 401 时，通过 `/safe/v1/me` 确认会话确实被拒后才清除登录 | 属于 Studio 浏览器会话管理变化；分析的独立 fetch 路径未随之变更。插件继续使用 DSH credentials/Host 已授权传输，不搬入 Studio token manager 或全局会话副作用 |

精确源码：Studio main 的 [详情 service](https://github.com/openbkn-ai/bkn-studio/blob/31b33b2c12ee13eb02de181604cab838be90d32b/src/modules/bkn-trace/business-provenance/business-provenance.service.ts#L263)、[Scene](https://github.com/openbkn-ai/bkn-studio/blob/31b33b2c12ee13eb02de181604cab838be90d32b/src/modules/bkn-trace/business-provenance/BusinessProvenanceScene.tsx#L948)、[解释 service](https://github.com/openbkn-ai/bkn-studio/blob/31b33b2c12ee13eb02de181604cab838be90d32b/src/modules/bkn-trace/evidence-chain/current-explanation.service.ts#L247)、[016 展示](https://github.com/openbkn-ai/bkn-studio/blob/31b33b2c12ee13eb02de181604cab838be90d32b/src/modules/bkn-trace/evidence-chain/BusinessProvenance016.tsx#L164)、[通用认证](https://github.com/openbkn-ai/bkn-studio/blob/31b33b2c12ee13eb02de181604cab838be90d32b/src/framework/request/http.ts#L81)。

关键 blob：Scene `eb286d7b6fec6f5a7585fc6ae0caa5c06e01fe3c`，service `07ead96b3679ee9edd048aecc1b17ec8db3d4787`，016 `d1f237333b79b17a9d4d31351efb3ad71647d51a`，Panels `908180db165b32d8f472d32b5c1c57e1d1a752b0`，types `aba7980a850065d2eb89307f4a56ec1c10bfe685`；MarkdownText `f6f3f702bfb2b68d0047d7eb18a14cc003e8b73b` 及其样式 `b5b12be5331cc33ea83b67fb13093d03e8fcbf33` 在 release/main 相同。

## 后端证据缺口与权限/验收边界

恢复目录里的 EE `businessprovenance/http.go` 与 `current_explanation_http.go` 可以继续作为旧固定来源的静态合同证据；其声明 SHA 未在上述候选仓库解析成功，不能把候选仓库的 main 当作已验证后继。**新版 EE 的 deduplicate 默认值、locale 参数可选性/默认值，以及认证/KN scope 的变化尚未证实。** 后续若验收目标是新平台/main，应先提供对应后端仓库/commit或目标部署身份，再核查；这是一项证据缺口，不是已经复现的当前候选缺陷。不为此升级 pin 或放宽已有 KN 校验。

固定来源的详情、解释、Markdown、历史和分析端点、响应 envelope、会话过滤及原生 SSE 合同见[原合同复核](../2026-11-02-provenance-parity/CONTRACT-REVIEW.zh.md)。当前插件的 `ProvenanceDetailScope` 仍以可信 DSH Conversation/Interaction/KN 为锚点：同会话成员验证、detail 的 KN 预检、Host 固定端点、逐次身份/权限 guard；没有因为上游优化而放宽这些约束。Markdown/解释自身不声明 KN，不能仅凭它们可读就省略 detail 预检。

实际部署的 Studio/EE/服务镜像 commit 本轮没有重新识别；远端分支或源码声明不能补写为部署证据。当前第三本地候选的只读实机结果与未验收项仍以[开发记录](./DEVELOPMENT.zh.md)为准：真实生成/更新、Agent SSE/错误/历史写入仍未执行；两种图谱/全屏和跨视图联动仍需要可读既有解释的真实样本，Windows 与最终远端候选产物需分别验收。现有 HTTP 错误中性化、detail 不可读时不走 Trace Markdown 回退这两项安全适配差异继续保留。

此次结论支持继续对固定基线做 build-only CI 和远程 E2E 准备，不是新版平台兼容、发布或人工验收结论。未更改源码、包、fixture 或 pin；未对平台/模型输出加裁决、清洗或修正。
