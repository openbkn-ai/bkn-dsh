# bkn-dsh

[English](README.md)

将受治理的 OpenBKN 业务知识带入原生 DeepSeek Harness 对话。

## 为什么

企业决策依赖可信的业务对象、指标、规则、关系和权限范围内的证据；通用对话本身不能提供这一受治理上下文。

`bkn-dsh` 是一个增量式 DeepSeek Harness 插件：保留原生 DSH 工作流，同时由 OpenBKN 继续作为身份、权限、业务语义和 Trace 数据的权威来源。

## 面向谁，以及带来的价值

- **业务用户和分析师**：在已授权业务知识网络内自然提问，无需学习平台 API 或查询语言。
- **知识网络维护者**：让已沉淀的业务语义、函数和指标被一致复用。
- **企业 AI 平台团队**：以明确边界和最小权限接入业务知识，而不是向模型开放不受约束的数据接口。

它让可信业务洞察更快可得，并在平台提供数据时保留清晰的网络边界和可追溯性。

## 当前核心能力

- 通过 OpenBKN CLI 登录并在 Host 侧同步凭据；不具备 CLI 的部署可使用手动 Token 兜底。
- 自动配置并测试 OpenBKN Context Loader MCP 连接。
- 已授权知识网络目录：支持本地搜索、工作区关联状态和分批加载。
- 一个本地 DSH 工作区对应一个 OpenBKN 业务知识网络；在该工作区原生新建的会话会自动继承绑定。
- 受管业务会话：每个 DSH 会话稳定对应一个 `conversation_id`，每个用户问题对应一个 OpenBKN `interaction_id`。
- 受范围约束的 Agent 指引和 OpenBKN MCP 访问，支持已发布业务函数，以及只读的 `run_code` 兜底。
- 逐轮业务溯源：平台返回的执行事实会展示；业务上下文图和证据链仅使用 OpenBKN 正式投影 DTO，不从模型文本或 MCP 原始输出推断。

## 安装前置条件

1. 兼容的 DeepSeek Harness Web profile。当前包面向 DSH `0.1.2-rc.1` 插件依赖集合。
2. DSH Host 能访问的 OpenBKN 平台地址，以及拥有目标业务知识网络读取权限和 Context Loader MCP 使用权限的账号。
3. 推荐登录方式需要在 Host 安装 OpenBKN CLI，并可通过 `PATH` 调用；若 CLI 不可用，可改用平台 Token。
4. 从源码安装时，两个仓库均需要 Node.js 和 pnpm。

## 从本仓库安装

以下是本地开发安装方式，请替换为你的实际检出路径。

1. 构建插件：

   ```bash
   cd /path/to/bkn-dsh
   pnpm install
   pnpm --filter @openbkn/dsh-business-context build
   ```

2. 将包添加至 DSH Web profile：

   ```bash
   cd /path/to/deepseek-harness
   pnpm dsh plugin --profile web add file:/path/to/bkn-dsh/packages/openbkn-business-context
   ```

3. 在 `~/.dsh/profiles/web/cordis.patch.yml` 配置平台地址。上一步会添加插件行；如缺少 `config`，补充如下：

   ```yaml
   - id: openbkn-business-context
     config:
       baseUrl: http://localhost:8081
       # 仅当 CLI 不在 PATH 时设置：
       # cliPath: /absolute/path/to/openbkn
       # 仅当 Context Loader 使用非标准端点时设置：
       # mcpUrl: https://openbkn.example/api/agent-retrieval/v1/mcp/
   ```

   `baseUrl` 必填。默认 MCP 地址为 `/api/agent-retrieval/v1/mcp/`；不要把 OpenBKN Token 写入该 YAML 文件。

4. 重启 DSH Web profile，使其加载新的插件和配置。

## 首次连接与日常使用

1. 在 DSH 侧边栏选择 **OpenBKN**。
2. 选择 **使用 OpenBKN CLI 登录并同步**，完成本机 CLI 登录；插件会同步凭据并验证 Context Loader MCP。无 CLI 部署则展开 **手动输入 Token**，选择 **保存并测试连接**。
3. 在已授权网络目录中搜索并展开目标网络。
4. 尚未关联本地工作区时选择 **新建工作区**；已关联时选择 **继续会话** 或 **新建会话**。
5. 在原生 DSH 对话中提出业务问题。该工作区后续新建的会话会自动继承同一个知识网络绑定。
6. 回答完成后，打开其 **业务溯源** 查看 OpenBKN 执行事实，以及平台已正式投影的业务上下文图或证据。

## 运行边界

- 一个本地工作区只能映射一个业务知识网络；需要使用另一个网络时，请选择另一个工作区。
- OpenBKN 暂不可用或用户未登录时，本地 DSH 工作不受影响。
- 插件不会伪造溯源。平台没有返回正式图或证据投影时，对应视图会保持空态。
- Token 仅保存在 DSH credentials 或本机 CLI 凭据存储中，不写入会话历史、提示词、浏览器状态或 profile YAML。

## 许可证

[Apache License 2.0](LICENSE)
