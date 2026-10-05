# DSH 0.2.0-rc.2 兼容补丁

[English](README.md)

该源码包用于在精确版本的 DeepSeek Harness `dsh-v0.2.0-rc.2` 源码树上，从本仓库**构建** OpenBKN Business Context 插件包（OpenBKN Runtime 归档已停止发布）。它是临时兼容桥接，不替代 DSH 原生插件管理。

**使用插件不需要补丁。** 从插件 `0.2.0-rc.2-openbkn.0.2.0-1` 起，插件通过 DSH 自己的插件管理器装在未打补丁的 DSH `0.2.0-rc.2` 上即可使用——官方桌面版、npm 命令行、源码检出都一样；见仓库 README。

## 支持范围

仅支持提交 `639ed015397290b3745d163aafe02ffee4aa3f84`（tag `dsh-v0.2.0-rc.2`）上干净的 DSH Git 源码工作树。不要用于桌面应用包、其他 DSH 版本或存在本地修改的工作树。

补丁仅提供插件所需的能力：外部插件的已发布 Typert 协议识别（`analyzer.ts` 的 `isTypeMetaSymbol`；缺失时插件 10 个公开 Remote 方法只能发现 0 个）。补丁②（可忽略插件非界面会话记录的写入侧，让 `Session.append` 接受非界面事件的 ignorable 标记）**已退役**：从 `0.2.0-rc.2-openbkn.0.2.0-1` 起插件不往会话日志写任何东西，不再用到它；它只为保证已发布的 `openbkn-dsh-runtime-v0.2.0-rc.2-openbkn.0.2.0` 归档可复现而留在系列里，下一个系列会去掉。

与 `dsh-v0.1.6-alpha.2` 不同：上游锁文件本身已与自身 `patchedDependencies` 一致（pristine 工作树上 `pnpm install --frozen-lockfile` 可直接通过），但 runtime 闭包的 deploy 在 `patchedDependencies` 声明了不属于部署闭包的补丁时会拒绝运行——在 `dsh-v0.2.0-rc.2` 上是 `@electron/osx-sign`、`@fortune-sheet/core`、`@fortune-sheet/react`、`exceljs` 四项。补丁③移除这四项注册，并以上游锁文件为基线、仅剥离这四项及其 `(patch_hash=…)` 后缀派生出新锁文件——其余解析与上游逐字节一致，冻结安装可重复，且全量 `pnpm run build` 可通过（早期的整棵重生成会把 micromark 工具链重解析出两份共存的 `micromark-util-types`，客户端 typecheck 直接失败）。这四个上游补丁携带的客户端侧修复因此不进入部署的 runtime 闭包（本来也不会进入：`pnpm deploy` 直接拒绝它们）。

插件刻意不在此使用凭证引用式 MCP 请求头：它在挂载时解析 Token 传入字面 Authorization 头、每回合重新挂载轮换，兼容打补丁与已发布两种 `@deepseek-ai/dsh-mcp-client`——0.1.7 的 MCP client 公开面（`Config`、transport、headers、reconnect）与 `0.1.6-alpha.2` 相比没有变化。DSH 侧的凭证头实现保留在 `kalias/deepseek-harness` 的 `fix/mcp-credential-headers` 分支，供上游通道打开后贡献。

本补丁不会读取或写入 OpenBKN Token。

## 应用与验证

在本仓库源码目录执行：

```bash
node compat/dsh-0.2.0-rc.2/apply.mjs --dsh /path/to/deepseek-harness
node compat/dsh-0.2.0-rc.2/verify.mjs --dsh /path/to/deepseek-harness
```

按 DSH 自身的构建说明重新构建打了补丁的源码树，然后在本仓库构建本地插件产物（完整步骤见[源码构建指南](../../docs/guides/install-with-patch.md)）。打出的包可以通过 DSH 原生插件命令装进任何 DSH `0.2.0-rc.2`，打没打补丁都行（`pnpm dsh` 是 DSH 工作区的 CLI，本仓库不提供）：

```bash
pnpm --filter @openbkn/dsh-business-context build
pnpm --filter @openbkn/dsh-business-context pack --pack-destination /tmp/openbkn-plugin
cd /path/to/deepseek-harness
pnpm dsh plugin --profile web add file:/tmp/openbkn-plugin/openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-4.tgz
```

切换 DSH 版本前先移除整个补丁系列：

```bash
node compat/dsh-0.2.0-rc.2/apply.mjs --dsh /path/to/deepseek-harness --revert
```

命令在修改任何内容前会校验补丁摘要、精确基线提交、干净工作树与完整补丁系列；任一校验失败即不做任何改动（fail-closed）。

## 源码 dev 形态

在 `dsh-v0.1.6-alpha.2` 上以源码 dev 形式直接运行 DSH（`pnpm dsh web` 走 tsx）时，任何插件的工具派发都会失败（`Cannot read properties of undefined (reading 'prepare')`）。在 `dsh-v0.2.0-rc.2` 上，2026-09-30 的实测没有复现：dev 形态下带工具调用的问答正常。支持的形态仍是构建后运行（`node apps/cli/lib/bin.js web`）。
