# 独立范围与不干预边界复核

基线：本地 `feat/provenance-platform-parity`，HEAD `cfd377f88fe89a42e97577e62d1f06bec2875a3c`。

## 保持范围

`tests/fixtures/provenance-parity/protected-source-files.json` 保存 Git HEAD 原始 blob 的 SHA-256；67 个非溯源源文件逐文件核对不变，包括认证、登录、CLI/MCP、业务工具/策略、会话绑定、业务上下文逻辑、其他客户端模块。另有独立脚本扫描新源码，限定为平台溯源组件和专用 Host/浏览器运输文件。脚本是本任务验收证据（`check-current-scope.mjs`），不在永久默认测试中；未来已授权的登录/MCP开发不受这次哈希快照锁定。

共享文件逐 hunk 复核结果：

- `business-context-service.ts` 只新增溯源错误映射和可信会话/回答派生的 `provenanceDetailStream`，既有登录与工具逻辑未修改。
- `platform-reader.ts` 新增固定溯源 GET/显式 POST/SSE；共享 request 只加可选 `beforeDispatch` 与文本响应分支，缺省其他路径保持既有行为。
- `client/ProvenanceOverlay.tsx` 增加平台详情入口及可取消会话读取；生产走新详情时不调用旧 viewer load。
- `client/index.tsx` 增加溯源 adapter/stream/复制下载接线与当前语言读取。
- `client/locales.ts` 仅将旧 viewer 两处“事件链 / Event chain”纠正为“时间链 / Timeline”。
- `types.ts` 只新增新溯源 DTO 的 type re-export，未修改原有类型。
- 包配置、锁文件、客户端 tsconfig/tsdown、许可只涉及新平台组件及其运行/测试依赖。原有 cordis-plugin-include peer 提示未借机升级依赖。

`git diff --check` 已通过。该结果是工作树范围复核，不代表包安装或实际 Host 验收。

## 不干预平台/模型输出

受控回归按原文比较详情 payload、精度字符串、invalid 状态及 reasonCode、Markdown；同 Operation ID 的不同 attempt 保留分别选择。用户显式点击后才生成解释/请求 Agent 分析；Host 分析重新取得平台 Markdown，不采信客户端提交的业务文本。只读打开、搜索、切轮、切页签、刷新、打开分析侧栏都不自动调用生成/分析。

新增 invalid 区只展示平台现有状态/原因原值，不删除原记录，不把 invalid 重新裁决为有效/无效。组件内的格式、摘要和图展示继续采用选定平台版本的实现，未新增插件业务计算或模型纠正。

原平台 `BusinessProvenance016` 图中的选择高亮对已持久化边做双向连通遍历。若共享输入将两条查询连接，两支可以一起高亮；这是此次要求复用的平台行为。独立共享输入回归已核对：选择共享输入关联两条已记录查询；选择一支仍按平台连通规则高亮；同值但无持久化边的节点不产生关系。插件不以字段值相等补边，也不将旧插件的分支收窄规则套到平台图上。保留平台记录与展示语义的边界，不把这些显示高亮当作重新生成业务事实。

本次宿主适配还包括复用平台原有 clipboard helper 的可用 API / fallback 行为，以及嵌套 Inspector 的局部原生 Escape 监听。监听位于内层对话框节点，先消费内层 Escape，再让后续外层 Escape 关闭 DSH overlay；不挂全局 window/document 拦截。独立 DOM 回归通过内层关闭、外层保留及焦点还原；剪贴板 helper 的受控检查不等于 macOS 原生剪贴板验收。

## 尚需原生验收

当前可证明的是受控组件 DOM/行为、纯 Host scope/运输与静态范围。真实 DSH Host / Typert 运输、同记录同权限的平台页面视觉对照、macOS 剪贴板与文件保存、真实证书/登录/权限和长记录，以及 Windows 目标运行、真实生成/分析和人工验收仍需单独执行。不会将当前受控计数写成上述完成。

本机 CLI `auth status` 曾观察到 `expired=true`（主智能体只读检查）；这只说明当时 CLI 凭据状态，不能据此断言 DSH 面板登录失败。当前未完成真实平台同记录及真实 DSH UI 验收。
