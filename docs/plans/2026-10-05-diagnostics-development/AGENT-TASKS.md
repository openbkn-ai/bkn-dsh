# 开发 agent 执行任务

## 主开发 agent：可直接复制的指令

> 请执行本交接包中的 DIAG-01 开发计划。先读仓库 AGENTS.md、CLAUDE.md 和 DEVELOPMENT-PLAN.md，以已发布 -4 的源码 a134f5d573e11846bb6665d1c170510149d09d4d 为基线建独立开发分支，保留原 worktree 的所有修改。先完成 D0：在真实、未打运行时补丁且未开 inspector 的支持 Host 中，证明主组件配置校验、模块解析和初始化失败时，独立诊断 Host/UI 仍可用并取得对应错误证据；核对两上游及 CLI/平台契约。D0 通过后冻结报告/Remote 接口，再完成 Host 分类与脱敏、独立面板和导出、打包、测试与 macOS 回归。交付一个固定新候选及完整 Windows 验收包，按 results-template.md 回报，不把 mock 或文件完整性当运行时验收。如果需要修改宿主，报告最小依赖和范围变化，不擅自升级或部署。本任务不默认授权推送、远端 CI、对外评论、合并、打 tag、发布或移动 latest；按用户现有授权核对相应步骤，先完成本地可评审成果。你不是唯一在代码库中工作的 agent，不得覆盖或回退其他人的修改。

一名主开发可完成全部阶段。若用户安排多个开发 agent，按下面职责拆分；D0 和集成必须有一个负责人。

## 职责与文件所有权

下表使用 `P = packages/openbkn-business-context`；带 `P/` 的路径都位于插件包内，其余路径相对**执行 agent 的 bkn-dsh Git root**。新增文件名为建议，D0 选定后再冻结，不要求机械照搬。

| 工作包 | 单一负责人 | 所有权 | 输入／输出 |
|---|---|---|---|
| D0 基线、Host 取得错误方式、依赖隔离和协议 | 主开发 | `docs/evidence/diagnostics-d0.md`；拟新增 `P/src/diagnostics-contract.ts` 与 `P/tests/` 契约测试 | 输出真实 Host 证据、schema/Remote 接口及对应 commit |
| D1 Host 采集与分类 | Host agent | 拟新增 `P/src/diagnostics.ts`、`P/src/diagnostics-host-adapter.ts`、`P/src/diagnostics-service.ts`、`P/src/diagnostics-redaction.ts`；`P/src/` 下 business-context-service、auth、openbkn-cli-subprocess、platform-reader、openbkn-mcp-manager 的观测边界；`P/tests/` 对应 Host/脱敏测试 | 使用 D0 固定协议；输出实现、测试、可重复故障场景定义 |
| D2 UI 与导出 | UI agent | 拟新增 `P/src/client/diagnostics-controller.ts`、`P/src/client/OpenBknDiagnostics.tsx`、`P/src/client/diagnostics-export.ts`；同目录 OpenBknOverlay、openbkn-ui-controller；`P/tests/` 对应客户端测试 | 使用 D0 fixture 和接口；输出面板、导出与可用性证明 |
| D3 入口、包与最终集成 | 主开发／集成 agent | `P/src/index.ts`、`P/src/client/index.tsx`、`P/src/types.ts`、`P/package.json`、`P/tsdown.config.ts`、`P/cordis.patch.yml`、`P/tsconfig*.json`；`scripts/package-bundle.mjs`；`P/tests/` bundle/install/client-slot/Typert 测试；根与包 READMEs、`CHANGELOG.md`、`runtime/openbkn-dsh-runtime.manifest.json`、验收辅助脚本 | 集成 D1/D2，生成固定候选和 Windows 包 |

未列的业务策略、guard 允许目录、平台部署、DSH pin、兼容补丁和发布 workflow 默认不改。如 D0 必须修改构建生成器，主开发单独说明原因和最小影响，不能让 UI/Host agent 各自改入口。

协作规则：共享代码库时不回退其他人修改；协议变动交主开发更新并通知两方，不以临时 any 或自由对象绕过契约。优先独立 worktree；只合入各自负责的提交。入口改动由集成 agent 操作，其他 agent 提供接入说明。未经用户授权，不向其他 Codex 聊天发送消息。

## Host agent：可复制的任务

> 负责 D1 的 Host 采集、错误分类与脱敏，文件所有权见上表。必须等待主开发交付通过 D0 的 Host 通道和固定 DTO/Remote 契约，不能把实现建立在业务组件已成功启动或 inspector 可用的假设上。默认导出只做被动采集；active 复测独立、有预算和释放，不登录、刷新 Token、调用模型或执行业务工具。分类沿用已有错误和真实协议，保证配置、模块、存储、CLI、认证、网络、MCP、目录阶段可区分。raw Error/输出不能进入新增缓冲、Remote 或文件。用嵌套秘密/cause/URL canary 验证脱敏，未知错误明确证据不足。提供对应真实故障的复现与撤销方式，不修改入口/打包或 UI 文件。你不是唯一开发者，保留并适配其他人的修改。

## UI agent：可复制的任务

> 负责 D2 的 UI、控制器和安全 JSON 导出，文件所有权见上表。必须使用主开发冻结的诊断 DTO，开发时可用明确标记为模拟的 fixture；模拟不算实机验收。确保诊断入口不依赖 remote.openbknBusinessContext 或会话/工作区初始化；提供集成说明，由主开发修改 client/index.tsx。错误页显示已验证阶段、诊断编号和下一步，加入导出；未知情况不默认归因 Token。复测连接处理超时/取消/关闭后重开及并发结果，不改此前暂缓的整体登录等待流程。验证桌面和浏览器下载流程；不得读取或导出 raw host errors/credentials/config/logs。不修改 Host 业务、协议或打包文件。你不是唯一开发者，保留并适配其他人的修改。

## 环境与构建步骤

本地父目录 `/Users/kalias/Documents/project/app/openBKN` 不是 Git root，原 `bkn-dsh` checkout 是旧分支且有用户修改。以下为**新 checkout 示例**；已有适用 managed worktree 时优先复用，先检查 dirty。目标目录已存在则换一个，不删除／重置它。

```bash
git clone --branch main https://github.com/openbkn-ai/bkn-dsh.git bkn-dsh-diag-work
cd bkn-dsh-diag-work
git switch -c feat/diagnostics-v1 a134f5d573e11846bb6665d1c170510149d09d4d
git rev-parse HEAD
git status --short
node --version
pnpm --version
```

先检查远端后续提交；若要换开发基线，记录变更和理由，并重新核对包与支持契约，不直接沿用 -4 的证据。

按现有 `release-plugin.yml` 顺序准备生成器，命令逐条执行，任何失败均先处理：

```bash
git clone --depth 1 --branch dsh-v0.2.0-rc.2 https://github.com/deepseek-ai/deepseek-harness.git release/deepseek-harness
git -C release/deepseek-harness rev-parse HEAD
node scripts/configure-pinned-dsh-generator.mjs --dsh release/deepseek-harness
pnpm install --frozen-lockfile
node compat/dsh-0.2.0-rc.2/apply.mjs --dsh release/deepseek-harness
node compat/dsh-0.2.0-rc.2/verify.mjs --dsh release/deepseek-harness
node compat/dsh-0.2.0-rc.2/apply.mjs --dsh release/deepseek-harness --revert
pnpm runtime:build -- --dsh release/deepseek-harness --output release/runtime
```

这一步使用现有工具构建生成器，不是交付新的 runtime archive。产品实机验收必须使用官方未打运行时补丁的 Desktop/npm Host。不要手改 DSH checkout、复用旧 lib 假装干净构建或提交本机 generator override/依赖锁差异。不要改变全局 Git/pnpm 配置来绕过故障。

实施完成后按顺序运行并保存退出码：

```bash
pnpm run typecheck
pnpm --filter @openbkn/dsh-business-context test
node --test compat/dsh-0.2.0-rc.2/tests/*.test.mjs tests/*.test.mjs runtime/tests/*.test.mjs
pnpm run package:check
git diff --check
pnpm --filter @openbkn/dsh-business-context pack --pack-destination release/plugin
```

在支持 glob 的 bash/zsh 中执行上述 node suites；Windows 本地执行时使用实际文件展开，不能把未展开的 glob 当测试。若 typecheck 在未改基线上有已知失败，也需记录基线及新差异，不能静默跳过。新增 schema/export/import/install 生命周期检查必须针对实际解包内容。

## 固定候选与交接完成标准

1. 新版本检查未占用后同步 package version、runtime manifest 的 plugin 字段和 CHANGELOG；不更改 DSH pin 或停用的 runtime 产品线。
2. 完成本地测试及真实 Host D0 后，核对用户是否已授权推送与远端 build-only 彩排。获授权后在特性分支执行 `release-plugin.yml` 的 `publish=false`，不能借 `v*` tag 触发构建。
3. 从该 run 下载实际候选，用 SHA-256 和逐文件 SHA 清单绑定；检查全部 exports/main/types 都入包、新诊断 Remote 正确生成、源码映射/秘密/开发脚本没有误入包。
4. macOS 和 Windows 安装**同一个候选**；每次记录磁盘安装版本、Host 实际加载版本/来源、普通桌面与 npm 形态。某字段无法取得就填 unknown，不由磁盘包推定内存版本。
5. 向用户提供候选 tgz、已填写 [candidate manifest](candidate-manifest.template.json)、Windows 脚本和已验证步骤。模板中任何 null/空身份字段都意味着还不能派发固定候选验收。
6. 回报 D0–D3 已验证/未测、命令退出码、剩余限制和 Windows 事项；交回用户转发，不自行发布或移动标记。

真实 guard probe 仍使用仓库现有 `tests/probes/guard-runtime.probe.mjs --plugin <解包目录> --live <实际平台> --kn <绑定网络> --other-kn <不同网络> --cli <实际CLI>`，记录 mode=live、包身份、退出码和真实平台操作记录。先按 probe 文件的使用说明准备依赖；不带 live 的 stand-in 模式只能算模拟覆盖。真实 MCP fixture 和平台错误不能含密钥或业务正文。
