# bkn-dsh

[English](README.md)

将受治理的 OpenBKN 业务知识带入 DeepSeek Harness 对话。

## 为什么

企业决策依赖可信的业务对象、指标、规则、关系和权限范围内的证据；通用对话本身不能提供这一受治理上下文。

## 做什么

bkn-dsh 是一个增量式 DeepSeek Harness 插件。授权用户可为一个会话选择一个 OpenBKN 业务知识网络，在明确边界内分析问题，并查看每轮已完成回答可用的业务溯源。

## 面向谁

- 需要可解释、受治理分析的业务用户和分析师；
- 希望业务语义被一致复用的知识网络维护者；
- 需要最小权限知识访问、又不希望暴露任意数据接口的企业 AI 平台团队。

## 业务价值

- 让分析建立在授权的业务语义和平台数据之上；
- 将每个会话固定在一个明确、不可变的知识网络范围内；
- 保留原生 DeepSeek Harness 工作流，并增加可追溯的 OpenBKN 上下文；
- 降低获得可信业务洞察的交互成本，无需用户掌握查询语言。

发布包内的 README 也提供面向包使用者的同等产品介绍。

## 安装并开始使用

### 推荐方式：OpenBKN 兼容 DSH Runtime

对于 DSH `0.1.2-rc.1` 用户，请从项目 Releases 下载匹配的 OpenBKN Runtime 压缩包。该包包含固定版本的 DSH Runtime、版本受限的兼容桥接以及 bkn-dsh 插件产物；首次启动时仍使用 DSH 原生插件管理器激活插件，不会修改已有 DSH 安装。

唯一前置条件为 Node.js 20 或更高版本。发布 profile 在构建阶段由 DSH 原生插件管理器创建，首次启动时复制到隔离 Home；客户侧无需 `pnpm`，也不需要访问 npm registry。

1. 在下载目录使用同目录的 `.sha256` 文件校验压缩包，然后解压：

   ```bash
   shasum -a 256 -c openbkn-dsh-runtime-*.sha256
   ```
2. 启动包内的 DSH Web：

   ```bash
   ./openbkn-dsh-runtime-*/bin/dsh web
   ```

   Windows 请先使用 `Get-FileHash` 校验发布摘要，再在解压目录运行 `bin\\dsh.cmd web`。
3. 打开 DSH Web，在侧栏点击 **OpenBKN**；填写 OpenBKN 平台地址，通过引导完成 CLI 登录或输入平台 Token，并测试连接。
4. 选择有权限的业务知识网络，为它新建本地工作区或继续已有工作区，然后开始业务会话。

Runtime 使用隔离的 OpenBKN DSH Home（可用 `OPENBKN_DSH_HOME` 覆盖），不会改动 `~/.dsh`。平台地址仅作为非敏感 DSH 设置保存；Token 只保存在 DSH credential。不要将 OpenBKN Token 写入 Cordis YAML。

### 面向 DSH 维护者的源码构建路径

兼容补丁只适用于主动构建精确上游源码版本 `dsh-v0.1.2-rc.1` 的维护者。它采用失败即拒绝策略，不能应用于桌面应用包或其他 DSH 版本。具体源码构建步骤请见 [兼容补丁包](compat/dsh-0.1.2-rc.1/README.zh.md)。

后续 DSH 版本若已提供所需能力，则无需使用此桥接。
