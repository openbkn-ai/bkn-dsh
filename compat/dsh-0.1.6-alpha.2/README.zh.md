# DSH 0.1.6-alpha.2 兼容补丁

[English](README.md)

该源码包用于让精确版本的 DeepSeek Harness `dsh-v0.1.6-alpha.2` 支持 OpenBKN Business Context。它是临时兼容桥接，不替代 DSH 原生插件管理。

## 支持范围

仅支持提交 `ddefc45fbc7f8e46dd73185e68295696d1297887`（tag `dsh-v0.1.6-alpha.2`）上干净的 DSH Git 源码工作树。不要用于桌面应用包、其他 DSH 版本或存在本地修改的工作树。

补丁仅提供插件与可重复 Runtime 构建所需的能力：外部插件的已发布 Typert 协议识别（`analyzer.ts` 的 `isTypeMetaSymbol`；缺失时插件 10 个公开 Remote 方法只能发现 0 个）、可忽略插件非界面会话记录的写入侧（alpha.2 的 `Session.append` 尚不接受非界面事件的 ignorable 标记，缺失时插件事件被按必需事件持久化、会话重启后无法加载；读取侧上游已原生支持），以及发布锁文件对：上游 alpha 锁文件与自身 `patchedDependencies` 不一致（含 deploy 闭包用不到的 `@electron/osx-sign` 注册，pnpm 11 会拒绝），补丁移除该注册并以 pnpm 11.7 重新生成锁文件，使安装可冻结、可重复。

插件刻意不在此使用凭证引用式 MCP 请求头：它在挂载时解析 Token 传入字面 Authorization 头、每回合重新挂载轮换，兼容打补丁与已发布两种 `@deepseek-ai/dsh-mcp-client`。DSH 侧的凭证头实现保留在 `kalias/deepseek-harness` 的 `fix/mcp-credential-headers` 分支，供上游通道打开后贡献。

本补丁不会读取或写入 OpenBKN Token。

## 应用与验证

在本仓库源码目录执行：

```bash
node compat/dsh-0.1.6-alpha.2/apply.mjs --dsh /path/to/deepseek-harness
node compat/dsh-0.1.6-alpha.2/verify.mjs --dsh /path/to/deepseek-harness
```

按 DSH 自身的构建说明重新构建打了补丁的源码树，然后安装插件——**插件构建必须声明 `0.1.6-alpha.2` peers，而从本仓库当前 `main` 构建不满足**：`dsh-v0.1.7-rc.2` retarget 之后，main 构建出的插件声明 `0.1.7-rc.2` peers，会被 `0.1.6-alpha.2` runtime 拒装。请改用以下任一方式：

```bash
# 首选：与 0.1.6-alpha.2 配对的 npm 发布版。
# 在打过补丁的 DSH 检出目录执行——`pnpm dsh` 是 DSH 工作区的 CLI，
# 本仓库不提供。
cd /path/to/deepseek-harness
pnpm dsh plugin --profile web add @openbkn/dsh-business-context@0.1.5-rc.2
```

或从配对的 git tag 构建插件包（把本仓库克隆到你的 DSH 检出旁边，或把你的 DSH 路径传给 configure 脚本）：

```bash
git clone --branch v0.1.5-rc.2 https://github.com/openbkn-ai/bkn-dsh.git ~/bkn-dsh-0.1.6
cd ~/bkn-dsh-0.1.6
node scripts/configure-pinned-dsh-generator.mjs --dsh /path/to/deepseek-harness
pnpm install
pnpm --filter @openbkn/dsh-business-context build
pnpm --filter @openbkn/dsh-business-context pack --pack-destination /tmp/openbkn-plugin
cd /path/to/deepseek-harness
pnpm dsh plugin --profile web add file:/tmp/openbkn-plugin/openbkn-dsh-business-context-0.1.5-rc.2.tgz
```

每个受支持的 DSH 版本与补丁系列、插件配对的对照表见仓库 README 的[版本配对表](../../README.zh.md#支持的-dsh-版本)。

切换 DSH 版本前先移除整个补丁系列：

```bash
node compat/dsh-0.1.6-alpha.2/apply.mjs --dsh /path/to/deepseek-harness --revert
```

命令在修改任何内容前会校验补丁摘要、精确基线提交、干净工作树与完整补丁系列；任一校验失败即不做任何改动（fail-closed）。

## 已知上游限制（源码 dev 形态）

在 `dsh-v0.1.6-alpha.2` 上以源码 dev 形式直接运行 DSH（`pnpm dsh web` 走 tsx）时，任何插件的工具派发都会失败——工具调用一律报 `Cannot read properties of undefined (reading 'prepare')`，与 agent 预设无关，原生工具同样受影响。这是上游行为，不在本补丁系列范围内，打补丁前后表现一致。源码 dev 形式下绑定、网络读取与会话持久化均正常；完整问答需使用打包形态的 Runtime（见仓库 README）。
