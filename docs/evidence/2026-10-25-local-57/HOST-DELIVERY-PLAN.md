# #105 同源回补：完整 Host 交付方案 r1

日期：2026-10-25。当前仅本地开发预验，`ciRun=null`、`formalAcceptanceEligible=false`。本方案和产物不授权部署、签名发布、推送或 CI，不改变正式 0.2.0。冻结插件 -30/-31/-32 均不包含这项 Host 修复；安装插件本身不能修复 Host transport。

## 交付选择与固定身份

采用固定 Host 上的源级同源回补，不升级 DSH 或 MCP SDK。旧基线为 DSH 0.2.0-rc.2 / `639ed015397290b3745d163aafe02ffee4aa3f84` / SDK 2.0.0；新基线为 DSH 0.2.1-rc.3 / `1f81c047fc48fa190a683e469daa699857e9afe8` / SDK 2.2.0。旧生成器与 Zod4.4.3不变。每个派生产物使用额外 distributionId、外层摘要、FILE-LIST 和 HOST-BACKPORT 身份，明确与原样官方包区分；不能只看未变的 package version 判断是否回补。

已生成两份完整 **Mac arm64 npm/web Host**：独立 Node24.19.0、匹配 pnpm、原固定版本运行模块、MCP JS/声明/归属说明、相对启动脚本及完整性清单。它们不是依赖安装器、不含业务 home、凭据或冻结插件包，不覆盖系统 Node/日常 Host。另有两份仅12文件的 MCP payload tgz，用于经核验的副本，不是完整 Host 或可直接替换原应用的安装器。具体名称、大小与 SHA256 见 [ARTIFACTS.json](ARTIFACTS.json)。实际大文件保留于本机 `release/local-57/artifacts/`，没有推送。

## 源码、声明、归属与打包顺序

1. 从相应固定官方源码建立**新副本**。先应用[第53轮四文件回补](../2026-10-25-local-53/backport/)（两版原 patch SHA256 均为 `61a324660a4565cf7dba2701542e3c96000e564cfc94b9b4ce212972a9afcede`），再应用本轮相应 [packaging addendum](SOURCE-PACKAGING.json)。后者只补 package license/files 与 DSH 原许可证、helper 归属说明和派生身份文件，`git apply --check` 及实际应用核对均通过。不能把 helper 继续归类为纯 MIT。
2. helper 来自 MCP 官方提交 `433eb413dc305ebeb93b8ebcde0095a8fc0d5fa0`；保留其完整 licensing-transition notice 和许可证。原 DSH MIT 文本另存，不重新授权第三方代码。`package.json.files` 须实际打入全部通知和身份文件。
3. 两版复用第53轮已构建并验证的同一 transport JS：`b3cd7156c0b8639656ce117530fec4d006b74cafdc9a78ac426fec084e62972c`。本轮使用 TypeScript5.9.3 对匹配已发布依赖生成 package 级声明；已有5份声明有效 token 与原官方包相同，新增内部 helper 声明。不是上游全仓重新构建或全部下游源码类型检查。不得把旧声明漏装成“完整构建”。
4. 本轮完整 npm Host 从已核验的固定运行依赖白名单组装，不复制运行根的历史 home/log。删除新副本的 manager 安装状态和未被引用的私有 fixture；rc.3 的381个 pnpm 生成 shell shim 改为相对运行根。两份依赖文件差异审计没有发现范围外变更，见 [DELIVERY-DELTA.json](DELIVERY-DELTA.json)。原运行根保持。
5. 保留全部第三方 package 自带许可、Node LICENSE 和 pnpm 许可；将传输代码差异、元数据/通知差异、脚本迁移差异分别列入清单。新产物的文件清单和外层 SHA256 一起校验；清单仅验证完整性，不是签名或可信来源证明。
6. 日后由源码形成正式分发时，构建→pack→准备 runtime→核对实际 MCP JS/声明/归属→封装→解包再核对，次序不可省。官方 Desktop `package-target.ts` 会重新执行 build:official/release:pack/prepare:dsh；因此先改暂存 node_modules 后运行原 pipeline 会有覆盖补丁的风险。必须把源补丁和 packaging addendum 带入同一固定源构建，并在准备后与最终 ASAR 内各做一次摘要断言。当前没有执行整条官方打包/签名流水线。

## npm/web 的具体使用与回滚

只在新目录校验外层 SHA256 后解包。以包内 `tooling/node/bin/node scripts/init-home.mjs /absolute/new-home` 创建独立 home；可额外给出只读来源 home，脚本拒绝已存在目标和非依赖 symlink，排除 node_modules，保留来源。复制含私密配置的 home 仍只留本机。启动使用该包的绝对 `bin/dsh --home /absolute/new-home --profile web --host 127.0.0.1 --port NEW_PORT --no-open`；启动器先核验固定包清单和该派生发行的 home marker。它不修改系统 PATH，仅子进程环境生效。

若复制了旧 profile，依赖安装属于独立操作；不得自动升级或从 latest 解析 DSH/SDK。安装冻结插件后，必须对**实际 profile owner** 和 Node resolver 检查 MCP 入口的物理文件及 b3cd…摘要，同时检查 Cordis/Schemastery 共用关系。只检查 runtime 根包不能排除 profile 另带未回补的 MCP。当前冻结 -32 的新复制 profile 在两版官方解析器下都选中回补包；这是 owner 解析证据，不是 -32 完整 Host/平台验收。

升级/恢复和动态插件安装可能改变 closure，须使旧验证失效并重新核对；不能把此派生包当成任意插件安装后的自动安全保证。完整 bundle 保持不可写使用，home 在包外。回滚只切回原 Host 路径和原 home，保留新 home、失败日志与新 Session；不得用旧备份覆盖新增记录或已续期凭据。

## Desktop 交付与当前已验证边界

本轮从两份原官方 ASAR **只提取到新目录**，以各自原签名 Electron 可执行文件的 Node mode 启动未修改的官方 `dsh-desktop-host/lib/index.js`。使用 `initProfile` 与 Desktop 源码实际采用的 `PROFILE_TEMPLATES.web.bundles` 创建新 desktop profile；通过官方后端入口的 `profile: desktop`、ready IPC 和原生 MCP 注册/ToolRuntime 完成对照。没有绕过 CLI 对 desktop profile 的限制，也没有把 web profile 改名冒充 Desktop。

MCP payload 只写入新提取副本，使用临时文件后 rename，避免 pnpm 硬链接可能连带改写外部 store；不复制 npm 的 node_modules/.bin 到 Desktop 扁平包。其余原 Desktop 文件摘要保持。两版后端均获得 ready：原包跨源307使第二源收到合成 Session 和问题；回补后为0，同源成功。以 IPC shutdown 收尾。此阶段故意没有带 GUI launcher 的 DSH_CLIENT_VERSION，stock/protected 都有 product telemetry schema 缺值及其 client 等待警告；不能把该组合写成“所有 Desktop 组件健康”。

**当前没有带回补的 GUI .app/Windows installer。** 官方 packaged shell 忽略 `DSH_DESKTOP_DSH_DIR`，不能靠环境变量把新后端注入原签名应用。修改原 ASAR 会破坏原签名；本方案禁止覆盖、移除 quarantine 或用 adhoc 签名冒充原官方发行。

正式 GUI 交付选项是固定源的独立维护版，或上游提供相同基线的维护产物：保持 DSH 代码版本/依赖基线，另设派生发行身份、独立 appId/user-data/更新源，明确自己的签名责任。固定源脚本已有 `DSH_DESKTOP_APP_ID`、Mac signing identity/team 和 Windows签名参数，但本轮未配置或使用。Mac 需新制品 codesign深度/严格检查、notarization/staple/Gatekeeper；Windows 需签名身份与实际安装器核验。`--unsigned` / `--skip-notarization` 只能作本地开发分支，不能满足发布门槛。整包必须在 ASAR 内确认 MCP 实际加载摘要，不沿用原官方签名或本轮裸后端结论。现有官方应用、原 home 和平台始终保持。

## 后续最小验证与不扩大的范围

| 边界 | 已有证据 | 后续只补 |
|---|---|---|
| 策略/SDK | 第53轮52向量、跨源/同源各30、abort、普通/SSE/DELETE/401及两版服务组合 | 没有策略/SDK变化则不重跑 |
| 完整 Mac npm Host | 本轮两外层归档迁移到含空格新路径，原生注册与真实 ToolRuntime 同源成功/跨源0；实际物理包核对 | 实际插件候选加载与 CLI 管理认证的受影响路径，正式制品身份 |
| Mac Desktop backend | 两版匹配 Electron + 原入口 + ready IPC + stock/protected，范围外文件未变 | 最终独立 GUI 制品启动/签名/实际加载和受影响认证；不重跑已通过的所有 UI |
| Windows | 仍等待 d20a266 的 -31 UI / -30 W-LIFE 原范围结果 | **另行准备并授权交接**：同源/跨源最小对照、实际 owner/Node/Electron、归档/启动/签名路径及清理，不要求旧全矩阵重跑 |
| 平台/业务 | 本轮不访问正式平台、不运行模型/Sandbox | 既有完整合同缺口保持；不因该补丁变绿 |

Windows交付须单独从相同固定源码/Windows官方运行模块组装win-x64制品，沿用同一源补丁系列，记录其原生依赖ABI、Node/Electron及外层SHA；不能把本轮darwin-arm64完整包直接交给Windows，也不能只因12文件JS payload可解包就宣称兼容。现有d20a266的新版Desktop是0.2.1-rc.2，不是最终目标rc.3；它只证明自己的历史输入，不能替代将来的rc.3交付。新Windows交接先固定代码/归档身份，再只验证MCP实际owner、两个接收端计数、同源一次、受影响认证和owned退出；不要求U0–U4/B1完整重跑，也不将无证据条目标为通过。

当前 CLI-managed auth 仅保留原实现并复用第53轮显式401停止证据，本轮没有新浏览器登录或实际 OpenBknMcpManager 平台挂载。SDK版本仍在公告受影响范围；修复只覆盖这条 DSH Streamable HTTP factory，不能声明 SDK 全局或 OAuth 漏洞已修。若日后引入 SDK OAuth provider/withOAuth/direct token 流程，必须重新评审另一 OAuth 公告。另一发布线 -13 风险接受不适用本线，也不采用远端 -11。

截至本轮，源码/SDK策略、完整 npm 交付预验与 Desktop 后端隔离验证分别有证据；GUI分发、Windows、实际候选/CLI认证及正式验收仍未满足。[#105](https://github.com/openbkn-ai/bkn-dsh/issues/105)保持 OPEN，不做远端状态写入。Windows现有补证不因本方案扩容；等其结果回来统一汇总。
