# bkn-dsh

为 DeepSeek Harness 提供 OpenBKN 业务知识、网络范围治理、诊断与溯源。

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

普通回答使用工具结果与 DSH 原生模型输出。插件负责访问与 Interaction 边界，不改写回答、不强制报表格式，也不因自然语言一致性自动重试或拒绝回合。完成状态表示执行结束；事实正确性通过独立评测核对。

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

## 安装并开始使用

使用未打补丁的 DeepSeek Harness `0.2.0-rc.2`：官方桌面版、npm 命令行（`@deepseek-ai/dsh@0.2.0-rc.2`）或构建后的源码检出。在 DSH 的**插件**页面选择**添加插件**，填写 `@openbkn/dsh-business-context@latest` 并选择安装源。也可以停止 DSH 后执行：

```bash
dsh plugin --profile <desktop|web> add @openbkn/dsh-business-context@latest
```

Windows 上使用 `dsh.cmd`。源码构建从 DSH 源码根目录执行 `node apps/cli/lib/bin.js plugin --profile web add @openbkn/dsh-business-context@latest`。请使用实际启动的 Host 的 profile 与 `DSH_HOME`，`desktop` 和 `web` 是独立的 profile。安装下载包时，把包名替换为 `.tgz` 的绝对路径。

安装与平台版本匹配的 OpenBKN CLI：0.1.5 平台用 `npm install -g @openbkn/bkn-sdk@0.1.5`；0.1.4 平台用 `@openbkn/bkn-sdk@0.1.4`（`0.1.5-rc.1` 也可以）。CLI 从 `0.1.5-rc.2` 起要求平台提供健康/版本接口，0.1.4 没有该接口。配置插件前不必先登录。npm 版 DSH 还需要 `PATH` 中有 pnpm（`npm install -g pnpm@11.7.0`），桌面版自带。自签证书平台需为 DSH 进程设置 `NODE_EXTRA_CA_CERTS` 并完全重启；各形态的操作见[仓库 README](https://github.com/openbkn-ai/bkn-dsh/blob/main/README.zh.md#开始之前)。

### 配置、授权、提问

1. 启动 DSH，点击侧栏底部的 **OpenBKN**。未设置地址是正常的**待配置**状态，诊断仍可打开。配置前，插件不会连接 OpenBKN，也不会读取它的 CLI 凭据。
2. 填写绝对 `http://` 或 `https://` 平台地址，点击**保存并继续**。非法输入会被拒绝，不改动已保存配置。地址通过 DSH 配置编辑器保存到当前 profile，按正常组件重载应用；保存地址不代表连接或授权已经成功。
3. 展开**高级设置**检测 CLI，默认命令是 `openbkn`。检测到可用 CLI 后会显示版本并填入实际路径，点击**保存并继续**应用。未检测到时，**检测并安装 CLI**会先复查，再通过本机 npm 的安装源和全局目录安装 SDK **0.1.5**；本机需已有 Node.js 22.19+ 和 npm。已有可用 CLI 保留，不自动升级；损坏安装或自定义路径错误需先修正，不自动覆盖。Windows 上的绝对路径包含 shim 文件名，如 `C:/Users/<你>/AppData/Roaming/npm/openbkn.cmd`。以后可从右上角**设置**编辑；业务回合运行时先等它结束。
4. 点击**使用 OpenBKN CLI 登录并同步**，在浏览器完成授权，再回到 DSH。已有凭据被拒绝时，也使用这个入口重新登录。403 可能需要管理员授予权限，同账号重新登录不能保证恢复。
5. 选择有权限的知识网络，新建或继续其工作区，在新会话中保持**标准模式**再提问。暂不支持 PTC 模式。完成的回答提供**查看业务溯源**。

表单保留其他配置字段；更高优先级的覆盖阻止设置生效时，会明确报告。临时网络/TLS 失败不会清空已保存地址。已有会话保留原平台与网络绑定，改地址不会自动改绑。这条流程无需编辑 YAML，也不需要手动粘贴 Token；凭据仍由 OpenBKN CLI 与 DSH 凭证管理，不要把 Token 写进配置文件。

关闭面板后，旧请求完成不会重新打开它；这不代表已取消正在进行的浏览器授权。完整步骤及目录选择器说明见[仓库 README](https://github.com/openbkn-ai/bkn-dsh/blob/main/README.zh.md#安装并开始使用)。

## 卸载

在 DSH 的**插件**页面移除整包。宿主若要求停止 profile，先停止再重试。也可以停止 DSH 后执行：

```bash
dsh plugin --profile <desktop|web> remove @openbkn/dsh-business-context
```

卸载会卸载包组件、移除 profile 包依赖，保留用户 profile 配置、DSH/OpenBKN 凭据、CLI 安装与登录状态、会话、网络/工作区绑定和工作区文件。CLI 是独立安装的工具，卸载插件不会移除它，也不会退出账号或清空数据。不要删除整个 `node_modules/@openbkn` 目录，其中可能还有其他包。重装后可复用保留的配置与绑定。

当前版本不向 DSH 会话日志添加插件事件，因此卸载后会话仍可读。最早的 `0.2.0-rc.2-openbkn.0.2.0` 版本另有会话日志限制，见[仓库历史说明](https://github.com/openbkn-ai/bkn-dsh/blob/main/README.zh.md#从-020-rc2-openbkn020-升级)。插件安装期间可能清理对应会话已不存在且记录至少七天的绑定；卸载不会执行全量清理。

## 包入口结构（-7 起调整）

包根是最小引导插件，仅保证宿主持续下发本包的浏览器端。业务 API 请从 `@openbkn/dsh-business-context/business` 导入；Remote 边界类型在 `@openbkn/dsh-business-context/types`。诊断入口仍为 `@openbkn/dsh-business-context/diagnostics`。

### 升级 -7：name 断言配置需迁移

宿主把 profile override 里的 `name` 字段当作对目标 row 的断言。从已发布的 <= -4 版本升级到 `-7` 时
业务 row 的加载路径变为 `@openbkn/dsh-business-context/business`，保留旧
裸包名的 override 会被整条跳过，其 `config`（如 `baseUrl`、`cliPath`）
不会生效：

```yaml
# 升级到 -7 后不再匹配 —— baseUrl/cliPath 会丢失：
- id: openbkn-business-context
  name: '@openbkn/dsh-business-context'
  config: { baseUrl: ..., cliPath: ... }
```

修复方式：删除 `name` 行（仅用 `id` 定位 row），或把断言改为新子路径名
`'@openbkn/dsh-business-context/business'`。仅用 `id` 的配置不受影响。

## 诊断

遇到问题时，点击侧边栏底部的 **OpenBKN**，再点击弹出面板右上角的 **诊断** 并导出报告。侧边栏只有一个 OpenBKN 入口。即使业务组件导入失败或服务尚未就绪，面板外框和诊断按钮仍可用；诊断服务作为独立插件行运行，不依赖业务服务。诊断实现无法启动时，面板会明确提示诊断服务不可用。导出的 JSON 只包含白名单事实——阶段、分类代码、受限证据（HTTP 状态、退出码等）与覆盖说明，绝不包含令牌、原始错误文本、URL 或文件内容。把导出的文件发给支持人员即可。

## License

[Apache License 2.0](LICENSE)
