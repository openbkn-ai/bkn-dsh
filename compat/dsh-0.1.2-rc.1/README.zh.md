# DSH 0.1.2-rc.1 兼容补丁

[English](README.md)

该源码包用于让精确版本的 DeepSeek Harness `dsh-v0.1.2-rc.1` 支持 OpenBKN Business Context。它是临时兼容桥接，不替代 DSH 原生插件管理。

## 支持范围

仅支持提交 `a66e4702047846cdaa10c66c9d3df3951f5ea70d` 上干净的 DSH Git 源码工作树。不要用于桌面应用包、其他 DSH 版本或存在本地修改的工作树。

补丁仅提供插件与可重复 Runtime 构建所需的能力：Streamable HTTP MCP 的凭证引用请求头、外部插件的已发布 Typert 协议识别、可忽略的插件非界面会话记录，以及新增源码依赖对应的 lockfile 条目。它不会读取或写入 OpenBKN Token。

## 应用与验证

在本仓库源码目录执行：

```bash
node compat/dsh-0.1.2-rc.1/apply.mjs --dsh /path/to/deepseek-harness
node compat/dsh-0.1.2-rc.1/verify.mjs --dsh /path/to/deepseek-harness
```

按 DSH 自身的构建说明重新构建该源码工作树，再构建本地插件产物并通过 DSH 原生命令安装：

```bash
pnpm --filter @openbkn/dsh-business-context build
pnpm --filter @openbkn/dsh-business-context pack --pack-destination /tmp/openbkn-plugin
pnpm dsh plugin --profile web add file:/tmp/openbkn-plugin/openbkn-dsh-business-context-0.1.3.tgz
```

切换 DSH 版本前，如需完整移除该系列：

```bash
node compat/dsh-0.1.2-rc.1/apply.mjs --dsh /path/to/deepseek-harness --revert
```

工具会在任何修改前校验补丁摘要、精确基线、干净工作树和完整补丁状态；任一校验失败均不会修改目标。
