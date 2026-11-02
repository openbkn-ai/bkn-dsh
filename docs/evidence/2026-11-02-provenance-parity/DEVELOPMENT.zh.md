# DSH 业务溯源平台一致性：本地开发记录

日期：2026-11-02。分支：`feat/provenance-platform-parity`。基线：`cfd377f88fe89a42e97577e62d1f06bec2875a3c`。

本记录描述已发布 0.2.1 之后的本地开发增量，不改变已发布的 `0.2.1-rc.3-openbkn.0.2.1-2` 包、tag、Release 或 latest。当前候选未安装到日常 DSH，没有推送、远端 CI 或发布。

## 目标与实现

按维护者确认，DSH 中采用平台业务会话详情的布局和操作方式，移除与当前 DSH 会话无关的“返回业务溯源列表”。复用基线是 Studio `release/0.2.0` 的 `90d3b92a909a3b98ad3e74b78b08ecf4fbdc3535`，不是当前部署页面逐字节一致的声明。

开发由三个并行子任务完成：平台组件复用、Host 数据与动作边界、独立验收；主智能体负责 DSH 接线、依赖锁、编译产物、完整回归与可视检查。

- 复用真实 `BusinessProvenanceScene`、普通操作列表/检查器、受管函数 TimeRail、证据阅读/图谱、原文、Markdown、生成解释、Agent 分析和历史结果；沿用平台样式、主题、语言及展示算法。
- DSH 回答入口固定到可信 Interaction；保留当前平台 Conversation 的轮次搜索、分页、收起/展开。当前目标在首 50 轮之外、搜索不可见或列表不完整时，不回退到首项或最新一轮。
- 相同 Operation ID 的多 attempt 独立展示与选择；关闭、切换回答/轮次、刷新及卸载会取消旧请求，迟到结果不能覆盖新页面。
- 同一 Interaction 的搜索、分页、初次定位和列表元数据回包保留详情与当前显式动作；只有真正切换 Interaction 或显式刷新才重置详情生命周期。新增两项回归在修正前均失败，修正后均通过，见 `scene-list-boundaries-before.log` / `scene-list-boundaries-after.log`。
- 新增固定 Host Remote 流，使用原有认证/证书运输；Host 验证会话、消息 handle、平台、Conversation、KN 和配置版本。轮次切换须验证成员关系；解释、Markdown、历史和动作前先读取 detail 核对 KN。
- 打开、切换、刷新均为只读。生成解释与 Agent 分析仅由显式按钮触发；分析提交 Host 从平台取得的原始 Markdown，忽略浏览器传入的替代文本。
- 新增分块序号、编码、结束帧、UTF-8 总预算和取消边界。错误跨 Remote 仅传固定分类及安全 HTTP 状态，平台已解析的分析错误仍保留其 code/message。

## 必要嵌入差异及红线

1. 去掉全局列表返回入口；窗口关闭/焦点、语言、局部 CSS/AntD portal、剪贴板和下载改由 DSH 当前查看器承载。内部 Inspector 的 Escape 只关闭内层详情，再按 Escape 才关闭外层。
2. 精确锚点、跨页定位、partial/truncated 止扫、重试 attempt 和迟到结果隔离属于入口/呈现安全边界，不改平台记录。
3. 原平台旧证据组件只为 invalid 改色，现补显原始 `status`、`validationStatus`、`reasonCode`；字段原样保留，不重新裁决、不删记录、不改节点边。
4. 共享输入、图连通高亮、派生摘要、受管函数聚合失败等展示语义沿用平台原组件。单支选择经平台持久化共享节点连到两条查询时，按平台规则高亮；同值而无平台关系的节点不新增关联。旧插件独立选择算法没有覆盖回这套平台组件。
5. 复制复用平台兼容 helper，包括原生 Clipboard API 失败时的本地 textarea 回退及焦点/selection 恢复；回退节点限制在当前查看器。下载保留原始 Markdown，创建的 URL 在操作后释放。

没有业务计算、模型回答改写或平台输出修复。原文、载荷、未知字段、失败、缺失和 invalid 均忠实呈现。协议/权限/身份校验只决定当前请求能否安全读取，不修改平台内容。

另有两项运输/权限差异需明确：HTTP 非成功响应仅显示固定分类和 HTTP 状态，不透传任意响应体的错误原因；已解析 SSE `error` 的 code/message 及业务记录中的原因则保留。detail 不可读时，KN 预检也会阻止解释、Markdown、历史和动作，因而平台旧版 detail 404 后直接取 Trace Markdown 的回退在这里不可用。不能宣称这两个边界与平台页面完全相同，详见[后端合同复核](./CONTRACT-REVIEW.zh.md)。

## 变更范围与构建修复

新增源码限溯源目录及固定数据适配；共享文件仅含溯源 Remote/客户端注册、4 个 DTO 类型出口、时间链术语、所需依赖和构建配置。67 个非溯源既有源码文件使用基线 SHA-256 检查，独立脚本见 [check-current-scope.mjs](./check-current-scope.mjs)，避免将本轮范围限制永久写入普通测试。

原有依赖、Host pins、兼容范围及锁文件中的既有 package/snapshot 项保持不变；新增依赖用于平台 UI 和 DOM 验收。原锁已有 `cordis-plugin-include` 的 1.0.7 / `~1.0.9` peer 警告保留，未为此升级其他模块。Studio 源码的 `LicenseRef-OpenBKN` 文件头及完整来源许可已保留。

首次完整回归发现浏览器打包缺陷：环境变量未固定、AntD locale 子路径外部化、CJS 条件解析选择了 vfile 的 Node 分支。现限定浏览器解析、固定生产环境并打入 UI 依赖；真实 factory smoke 在没有 Node globals 的 DOM 沙箱中加载，只允许 Host 的 `react`、`react/jsx-runtime`、`react-dom`。Typert 新增的递归 JSON codec 为本插件持有，旧 Remote 类型不改。

补全 sparse checkout 的仓库测试输入时，Git 清理了被排除的本地 ignored `release` 目录，导致一次 Typert 测试找不到本地 generator；已将该目录加入本 worktree 的 sparse cone 并恢复原链接，后续单项通过。首次仓库测试也因 `.github` 未检出而失败，补齐未改动的文件后 68 项通过。均保留初次日志，不把环境缺失记为产品修复。完整插件回归在列表生命周期修正后达到 743 项通过、1 项 Windows 跳过；随后独立后端合同核对发现并处理 SSE 控制帧遗漏，最终受影响回归另记于验证回执。

## 已完成的证据

- Host / Client 本地编译、默认插件测试、平台 adapter/clipboard 测试、仓库测试和包审计：最终结果及命令见 [VALIDATION.json](./VALIDATION.json) 和对应日志。
- 最终插件 **746 项通过、1 项 Windows 专项跳过**（747 总计），仓库 **68/68**，本次范围保护 **2/2**；包审计通过。最终候选 125 文件，其中 124 与工作树逐字节一致，只有 `package.json` 为等义序列化差异；开发测试/harness 声明未入包。
- [HOST-GATEWAY.json](./HOST-GATEWAY.json)：官方 npm `0.2.0-rc.2` 与 `0.2.1-rc.3` Gateway、实际生产 service 和生成的 Host/Client codec。每个 Host 15 次受控 GET，零真实平台/CLI/模型调用；覆盖长包、字段保留、跨页定位、取消和拒绝越界。不是桌面实机或真实平台通过。
- 后端源码核对发现真实分析会发送 `meta/tool_call/done`，原样例未覆盖，修前两项失败。现只扩展合法帧白名单，不重写帧数据；受影响回归 **50/50**。最终 [HOST-GATEWAY-SSE.json](./HOST-GATEWAY-SSE.json) 在双 Gateway 走完整编译后的 Reader → Scope → Host/Client codec：每个 Host 显式分析有 1 次纯内存模拟 POST，真实网络/平台 POST/CLI/模型调用为 0；原始状态、UTF-8 分片、CRLF、heartbeat 均保留。最终 lib 摘要与该证据一致。
- 独立受控 fixture 有 73 轮；DOM 覆盖精确入口、普通/受管函数、重试、搜索/partial、阅读/图谱、共享输入、invalid 原因、显式动作/错误、取消和嵌套 Escape。见 [验收矩阵](./ACCEPTANCE-MATRIX.zh.md) 与 [范围复核](./SCOPE-REVIEW.zh.md)。
- 浏览器受控可视检查覆盖桌面普通左右分栏、证据图谱/局部全屏、窄窗口布局、受管函数内部失败展开、Host 样式哨兵未被全局 CSS 覆盖；截图在 [screenshots](./screenshots)。这里使用合成 fixture，不能替代同记录平台对照。一次普通页切换 managed 的浏览器控制连接超时未记 PASS；新隔离页可正常打开 managed 并展开内部调用，未据此推断产品根因。

## 实机验收仍缺什么

- 当前 Mac DSH `0.2.1-rc.5` 隔离安装本地候选，确认真实加载、回答入口、关闭/重开/切轮/缩放；当前日常实例未替换。
- 用同账号、同一真实多轮 Conversation / Interaction 对比平台页面与插件。当前默认 CLI `auth status --json` 显示 `hasToken=true, expired=true`；未更改认证、未绕过 TLS，也不据此断言 DSH 已登录状态失效。
- 测量真实 sample07 `int_794daf4c8064143c6f2ae3b291fb0ce3` detail 字节及平台 59 次调用。当前 detail/分析上限 8 MiB、Markdown 1 MiB；超限返回明确错误，不截断。旧版约 31 MB 的 `/operations` 证据不能直接证明当前 detail 大小。
- 真实权限拒绝、记录未披露、证书/认证变化、长记录和慢请求；Windows 原生窗口、剪贴板和保存文件需分别验证。
- 在明确允许写入的测试平台执行生成/更新解释和 Agent 分析，验证真实流式结果、错误和历史。受控动作测试不能代填真实 POST 验收。
- 用户按真实业务记录确认布局、交互和信息一致。部署页面若已偏离本次固定 Studio 基线，需要先核对差异，再决定是否跟进平台版本。

以上未执行项保持未执行，不因已有版本曾经验收或自动测试通过而补记完成。

## 本地候选

`release/openbkn-provenance-parity-local.tgz`，869455 字节，SHA-256 `c0debad668fd6f8dc21ee2187c62a00fb46f5291b4f0f33c433adc8b30cfe327`。仅供隔离验收，未安装、未发布；manifest 暂保留原版本，不是新的公开版本。包内摘要见 [PACKED-FILES.json](./PACKED-FILES.json)，本地源码/构建输入摘要见 [SOURCE-MANIFEST.json](./SOURCE-MANIFEST.json)。
