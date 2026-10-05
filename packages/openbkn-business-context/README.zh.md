# bkn-dsh

[English](README.md)

把经过治理的企业业务知识带入 DeepSeek Harness 会话。

## 为什么需要 bkn-dsh

通用 AI 可以流畅地推理，但通常缺少真实业务决策所需的可信上下文。企业知识分散在系统、规则、流程、指标和业务关系中，同时其访问必须始终符合当前用户的身份和权限。

OpenBKN 将这些分散知识组织为可治理的业务知识网络。bkn-dsh 则让用户可以在日常分析和行动发生的地方——DeepSeek Harness 会话中——直接使用这些知识网络。

## 它做什么

bkn-dsh 连接 DeepSeek Harness 与 OpenBKN，使经过授权的用户可以：

- 登录 OpenBKN，同时不影响 DSH 本地工作；
- 选择自己有权访问的业务知识网络；
- 基于该网络中的业务对象、关系、规则和指标分析业务问题；
- 让每个会话始终限定在一个明确的业务上下文中；
- 查看每轮结果的分层溯源视图：恒可渲染的本地执行时间链、独立降级的平台执行事实（Request/Trace/Receipt）与企业业务图、以及带 CLI 核验指引的回执清单。

该能力以 DSH 增量插件的方式集成，保留 DSH 原生会话体验；OpenBKN 继续负责身份、权限、业务语义和可追踪证据。

## 面向谁

- **业务用户**：无需学习查询语言或平台 API，也能获得可靠业务分析。
- **分析师与决策者**：不仅需要答案，还需要理解背后的业务对象、关系、指标和证据。
- **企业 AI 平台团队**：希望在不向用户或模型开放无限制数据接口的前提下，提供受治理的知识访问。
- **知识网络所有者**：希望沉淀的业务语义能在日常 AI 工作流中被一致、准确地使用。

## 业务价值

- **提高分析准确性**：回答建立在明确业务语义和当前授权数据之上。
- **降低企业应用风险**：用户和模型始终受所选知识网络及平台权限边界约束。
- **支持可解释决策**：每轮分析都可以追溯到业务上下文、执行事实和可用证据。
- **降低交互成本**：用户可以自然提问，不必在多个系统间切换或编写技术查询。
- **复用组织知识**：经过治理的知识网络成为跨会话、跨团队共享的决策语义层。

## 安装

适用于未打补丁的 DeepSeek Harness `0.2.0-rc.2`：官方桌面版、npm 命令行（`@deepseek-ai/dsh@0.2.0-rc.2`）或构建后的源码检出。在 DSH 停止时，用 DSH 自己的插件管理器安装：

```bash
dsh plugin --profile <desktop|web> add @openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-6
```

然后填写平台地址、用 `openbkn` CLI 登录，并从侧栏 **OpenBKN** 入口绑定网络。绑定的会话必须使用 DSH 的标准模式（暂不支持 PTC 模式）。分步配置、证书与卸载：[仓库 README](https://github.com/openbkn-ai/bkn-dsh/blob/main/README.zh.md#安装并开始使用)。

## 包入口结构（-6 起调整）

包根是最小引导插件，仅保证宿主持续下发本包的浏览器端。业务 API 请从 `@openbkn/dsh-business-context/business` 导入；Remote 边界类型在 `@openbkn/dsh-business-context/types`。诊断入口仍为 `@openbkn/dsh-business-context/diagnostics`。

### 升级 -6：name 断言配置需迁移

宿主把 profile override 里的 `name` 字段当作对目标 row 的断言。`-6` 起
业务 row 的加载路径变为 `@openbkn/dsh-business-context/business`，保留旧
裸包名的 override 会被整条跳过，其 `config`（如 `baseUrl`、`cliPath`）
不会生效：

```yaml
# -6 后不再匹配 —— baseUrl/cliPath 会丢失：
- id: openbkn-business-context
  name: '@openbkn/dsh-business-context'
  config: { baseUrl: ..., cliPath: ... }
```

修复方式：删除 `name` 行（仅用 `id` 定位 row），或把断言改为新子路径名
`'@openbkn/dsh-business-context/business'`。仅用 `id` 的配置不受影响。

## 诊断

遇到问题时，从侧边栏底部打开 **OpenBKN 诊断** 并导出报告。即使 OpenBKN 业务面板无法启动，诊断入口依然可用：它作为独立插件行运行，从不依赖业务服务。导出的 JSON 只包含白名单事实——阶段、分类代码、受限证据（HTTP 状态、退出码等）与覆盖说明，绝不包含令牌、原始错误文本、URL 或文件内容。把导出的文件发给支持人员即可。

## License

[Apache License 2.0](LICENSE)
