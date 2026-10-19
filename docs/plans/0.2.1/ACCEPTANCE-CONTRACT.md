# 0.2.1 正式版开发与验收合同

更新：2026-10-19，Asia/Taipei。用户要求按正式版合同开发，并使用本机测试环境。本合同补充原计划及双宿主需求；历史证据不改写为本轮验收。

## 固定基线与验收环境

| 对象 | 本轮合同 |
|---|---|
| OpenBKN | 官方 `v0.2.0`，解引用后的 commit `81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b`；不能用同名版本字符串或 `06c5a87` 准备快照代替 |
| SDK/CLI | 正式 npm `@openbkn/bkn-sdk@0.2.0`；记录实际解析版本、可执行路径、TLS 与登录状态 |
| DSH 旧版 | `dsh-v0.2.0-rc.2` / `639ed015397290b3745d163aafe02ffee4aa3f84`；Cordis `4.0.4`，Schemastery `3.18.4`，pnpm `11.7.0` |
| DSH 新版 | `dsh-v0.2.1-rc.2` / `687f282e8625c6b8d11ff58211a90524be2e4317`；Cordis `4.0.5`，Schemastery `3.18.5`，pnpm `11.28.5` |
| 构建 | 保留固定旧版生成器和原有源构建补丁；同一 tgz 在两个未打补丁的官方 npm 宿主包集合中运行；宿主 closure 不得混入另一版本 |
| 本机平台 | `https://192.168.50.129`；context `kind-bkn-test-015-lan`；CA 为本机 `test-deploy/tls/ca.crt`，证书 SAN 已现场核对 |
| 其他机器 | 不连接 `192.168.50.28`；旧记录中的该地址仅为历史来源，不是本次测试端点 |

本机 2026-10-19 现场状态：主要业务服务仍运行 `0.2.0-release.20261011115044.sha06c5a87`，Studio 为 `...shac778f73`；CLI 实际为 `0.2.0`，当前 `baseUrl=https://192.168.50.129`，`hasToken=true`、`expired=true`。未读取 token，未启动登录、升级平台、执行业务或模型。当前本机部署不能充当上述正式平台合同的实机证明。

## 正式平台行为

- 所有发布 schema 要求 `bkn_context` 的业务工具，使用本回合 start 返回的 Conversation/Interaction 身份。缺失、错误类型或其他回合/会话身份由守卫拒绝且不得 dispatch；不自动补参数或修改模型输出。
- `capture_enabled=false`、`trace_recorded=false` 不取消 managed session。正式 start/finish 返回的身份应保留并用于调用和 finish；不能提示“没有当前 Interaction ID”。关闭采集不意味着生成了证据。
- 正式 start 失败且未返回身份时保持关闭，不将 Trace 不可用当作业务调用许可。正式 unavailable finish 可以关闭治理窗口并诚实降级，不能被重用为 start 成功。
- 溯源保留已披露身份和原状态；关闭采集时仅显示本地时间线与明确降级，不调用平台读取不存在的证据。不补造 request/trace/receipt ID。
- 大网络 navigation shell 允许索引数组为 null，保留平台披露的数量和 notice；不把缺失索引解释成零对象。
- 旧版显式 `continue_without_bkn_context`、无身份的降级仍是独立兼容路径；旧 fixture 通过不能替代正式合同。

源码 oracle：`tests/fixtures/context-loader-tools-v0.2.0-release.json`（位于插件包目录）。脚本核对输入 SHA 后执行官方纯 Go schema 和 `agentLifecycleView`，来源为正式 tag 的 `schemas.go`、`compact_view.go`、`lifecycle_adapter.go`、`session_guard.go` 及上游合同测试。26 项源目录工具已分类；24 项可投影 schema，inline PTC 两项明确没有伪造 schema。它不是 live `tools/list`，EE 条件目录和输出仍需现场核对。

## 分层完成条件

| 层次 | 必须记录 | 不能替代的下一层 |
|---|---|---|
| 源码合同 | 正式 tag/commit、schema、生命周期、调用者身份、工具分类和 fixture 来源 | 模拟、依赖声明不能证明加载 |
| 本地自动验证 | 插件/仓库测试、类型、原补丁 verify、包清单、双宿主同 tgz smoke；正式采集开启/关闭、旧合同回归、无混版 closure | npm 包集合 smoke 不是完整 CLI/浏览器/Desktop 验收 |
| 固定候选 | release 分支 commit、最终版本、build-only CI run、tgz SHA-256、逐文件摘要；验收期间不改包 | 本地 pack 不作为正式验收候选 |
| 本机实平台 | 正式服务镜像/摘要及实际代码身份，CLI 0.2.0、有效授权、TLS；live initialize/tools/list/schema 对照与受影响 managed 调用 | 快照版本端点、fixture、completed 状态不能证明实际正确 |
| 八个组合 | 同一个候选 × 两个 DSH × Mac/Windows × Desktop/npm；记录实际加载插件/宿主版本与 SHA | 一个版本/一种形态/非原生 Windows 不能代替另一项 |
| G6 与人工 | 正式平台+真实模型；已完成回答的非空原生溯源、zh/en、登录/取消/重试、选择联动、窄窗口/焦点/滚动/导出；异常逐项分诊 | 自动测试和脚本模型不作人工可读性或答案正确性结论 |
| 发布准备 | B1 同 Host 重新登录的有边界最小复现；未复现保持开放。候选变化后复验受影响项；公开包逐文件对照；latest 最后迁移 | 合并、tag、发布与 dist-tag 仍须相应授权 |

八个组合当前均为**待固定 CI 候选的实机验收**。本机有过旧发布包验收、或本轮本地 npm 运行通过，不改变此状态。CLI 过期或部署快照不匹配时，先完成独立开发与受控验证，明确保留实平台缺口；不绕过 TLS、复制凭据或静默升级现有环境。

发布前另须分诊仓库现有 Dependabot #1：`@modelcontextprotocol/client >=2.0.0 <2.2.0` 命中高危 OAuth 客户端凭据误投送告警 `GHSA-6qxp-vccf-f47h`。本轮旧宿主集合实际解析 `2.0.0`，新宿主集合为 `2.2.0`。受控功能测试通过不能关闭该安全门槛；须核对实际宿主、此插件路径的可达性以及上游修复/缓解方案，不擅自覆盖固定宿主依赖。当前未做漏洞利用验证，不宣称已暴露或已修复。

## 功能与数据边界

平台决定业务语义、计算、输入、依赖、invalid 状态及原因；模型决定回答。插件只按公开合同治理访问与呈现。保持共享输入直接选择关联全部使用者、单条输出不经共同输入误联另一分支、平台显式跨查询依赖保留，以及原记录/尝试/状态完整。不得新增答案仲裁、自动纠错、业务重算、证据补造或平台/模型输出改写。
