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

通过 DeepSeek Harness 原生插件管理器安装 bkn-dsh：

```bash
pnpm dsh plugin --profile web add @openbkn/dsh-business-context
```

重启 DSH Web。在 Web 界面侧栏选择 **OpenBKN**，填写平台地址并按引导完成 OpenBKN 认证。插件仅将平台地址保存为非敏感 DSH 设置，Token 保存于 DSH credential；随后它会测试 MCP 连接、列出当前用户可见的知识网络，并让用户在该网络关联的本地工作区中继续或新建会话。

不要把 OpenBKN Token 写入 Cordis YAML 文件。

## DSH 兼容性

若使用 DSH `dsh-v0.1.2-rc.1` 的源码构建，本版本需要 [RC 兼容补丁包](compat/dsh-0.1.2-rc.1/README.zh.md) 中的三项能力。该工具刻意采取失败即拒绝的策略：仅支持精确、干净的该版本源码，绝不修改桌面应用包或其他 DSH 版本。先应用并验证兼容补丁，再按 DSH 常规方式构建并安装插件。

后续 DSH 版本若已在上游提供这些能力，则无需使用此补丁包。
