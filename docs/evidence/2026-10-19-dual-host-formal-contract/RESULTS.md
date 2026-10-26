# 双 DSH 宿主与正式平台合同开发结果

日期：2026-10-19，Asia/Taipei。仓库 `openbkn-ai/bkn-dsh`，分支 `feat/021-localization-login`，接手基线 `0b7392464168f4dfeead669314b25da940d9c929`。本目录随开发提交保存；最终提交身份用该文件所在 Git commit 定位。

## 结论与边界

正式 OpenBKN `v0.2.0` 合同适配、两个固定 DSH 的源码依赖验证，以及同一 tgz 的官方 npm 运行时受控验证已通过。**未完成固定 CI 候选、正式平台实机、Desktop/完整 CLI、Windows、真实模型与人工验收，不是可发布结论。** 用户后续要求正式版合同和本机环境，已经纳入 [验收合同](../../plans/0.2.1/ACCEPTANCE-CONTRACT.md)。

未发布包版本递增为 `0.2.0-rc.2-openbkn.0.2.0-11`，避免本次开发产物继续冒用历史 -10 身份。保留旧 DSH 构建前缀及原生成器；运行支持目标由精确双版本 peers/清单表达。2026-10-19 npm 查询：公共 `latest`/`rc` 仍为 -10，-11 查询为 E404；SDK latest 为正式 `0.2.0`。没有发布、tag、合并、dist-tag 迁移、远端 CI 或 PR 操作。

## 正式上游与本机现场

- 平台正式 tag `v0.2.0` 的 **peeled commit** 为 `81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b`；不能使用 annotated tag object 的 SHA 充当源码 commit。官方 release 2026-10-16 发布，说明明确包括采集关闭时保留身份和 null navigation shell 的修复。
- DSH 最新预发布仍为 `dsh-v0.2.1-rc.2`（2026-10-17）。两个目标的固定 commit、Cordis/Schemastery/pnpm 见 `compat/dsh-hosts.json`；不更改用户现有宿主。
- 本机 en0 为 `192.168.50.129`，Kubernetes context `kind-bkn-test-015-lan`。部署查询显示主要服务仍为 `...sha06c5a87`，Studio 为 `...shac778f73`，不是正式源码基线的实机证明。
- 本机 CLI 实际 `0.2.0`，状态只保留 `baseUrl=https://192.168.50.129`、`hasToken=true`、`expired=true`。未读取 token、登录或调用真实业务/模型。证书 SAN 包含该 IP 与本机 hostname；CA 使用原本机测试 CA。没有连接 50.28。

## 完成的适配

1. 从正式 tag 提取上游 schema/lifecycle 源码，核对 SHA-256 后运行纯 Go projection。新 fixture 含 26 项目录工具、24 项有来源的 schema，以及真实上游函数对合成关闭采集输入的 start/finish 投影。inline PTC 两项明确未投影；没有伪造空 schema，也不是 live `tools/list`。原准备快照和 live fixture 保留为独立回归。
2. 正式关闭采集的 start 返回 Conversation/Interaction 身份，插件保留该身份并打开原治理窗口；按公开 required schema 检查当前 `bkn_context`，错误/缺失/其他会话和回合身份拒绝且不 dispatch，不替模型补参。
3. 关闭采集的 finish 保留已披露身份及 disabled 状态，但不创建证据 ID、不请求已声明未记录的证据。正式 unavailable finish 可诚实降级；它不能冒充 start 成功。旧显式 `continue_without_bkn_context`、无身份的降级路径单独保留。
4. 多段文本结果的未记录状态和身份来自同一条 JSON 记录，避免借用另一段 ID。平台/模型原输出不变；只调整读取、治理和有界 DTO。
5. 保留原业务边界、网络拒绝、未知工具拒绝、共享输入/输出选择、显式依赖、invalid 状态和全部原记录的回归。新增/扩充相关测试；没有改业务计算、模型回答或上游源代码。
6. 发布工作流已加入兼容声明检查，以及 pack 之后同 tgz 的双宿主受控 smoke 与证据归档。只解析了 YAML 和本地执行对应脚本，**没有运行远端工作流**。

## DSH 公开接口比较与实现判断

[干净 tag blob 比较清单](dsh-source-audit.json)覆盖插件静态消费的 25 个包，包括 type-only 合同；比较读取 Git HEAD blob，排除了旧源构建补丁及生成文件。源码文件变化数量不是完整行为验收。

| 边界 | 差异、处理及验证限制 |
|---|---|
| Remote / Gateway | 新版增加 Principal/resource；保留字符串 Remote 装饰器与直接 invocation。用旧生成器的同一产物注册两版真实 Registry/Gateway，调用配置/诊断/业务 Remote、取消与错误；新版实际 owner Peer 和无授权 principal 拒绝通过。没有绕过 Remote access。 |
| Credentials | 新版改变 provider-managed store 的优先级和 observer failure 处理；插件继续只使用公开 provider API。两版真实 CredentialProvider 基类、业务服务及受控缺失 CLI 失败路径通过；真实凭据持久化/登录 UI 仍未验收。 |
| Session / Agent | 新版有 plugin record API 和投影变化；插件仍不写 session log，只读原生事件和自己的 binding store。两版真实 AgentLoop 的八个脚本场景通过；没有把脚本模型当 G6。 |
| Session/Workspace Client | 新增 projection kind、workspace replace、create 等行为；插件通过原生 services 消费 snapshot 和 create，未自行处理 follow wire frames。新版依赖上的 Client 构建/类型通过；实际重载/渲染仍待八组合验收。 |
| ToolRuntime | 新版移除 both 模式并调整 PTC；插件的 Standard/native 路径及 PTC 拒绝保持。两版真实 tools/MCP factory 的正式采集开/关和旧合同守卫通过。 |
| Storage / schema | storage-domain 公开表 API 保留；固定 Zod `4.4.3`。每宿主 Cordis/Schemastery 与官方 pin 一致，closure 检查拒绝 DSH 混版和 Cordis 分裂。新版源码副本修正锁定的旧 Schemastery 后 strict peers 通过。 |
| Locale / slots / paths | locale、MCP client、subprocess 的消费接口无新增适配；slots 增加可选 inline/member，home paths 增加共享 agents root。新旧依赖编译通过，原 dshHomePath 在隔离 home 的业务服务加载通过。语言切换及 UI 人工验收不由此关闭。 |

## 自动与受控运行结果

环境：macOS arm64 / Node `22.22.3`。旧主构建 pnpm `11.7.0`；新版隔离源码副本 pnpm `11.28.5`，所有 DSH dev 依赖切为新版、Cordis `4.0.5`、Schemastery `3.18.5`，**只在隔离副本中改依赖**，主构建 pin/lock 不变。新版也继续使用原已打补丁的旧生成器，没有替换官方新版生成器或手改上游。Go `1.25.5` 下载使用官方发布 JSON 校验 SHA-256 后才运行。

| 检查 | 结果 | 证据 |
|---|---|---|
| 主构建插件 | 585 项，584 pass / 1 Windows 专属 skip / 0 fail | [完整日志](plugin-tests-final.log) |
| 新版依赖源码副本 | Host/Client 构建、同样 584 pass / 1 skip；typecheck、strict peers 通过 | [测试](new-source-tests.log)、[类型](new-source-typecheck.log)、[peers](new-source-peers.log) |
| 仓库/兼容/runtime | 66 pass / 0 fail | [日志](repository-tests-final.log) |
| 主构建 typecheck、旧 compat verify | 通过 | [类型](typecheck-final.log)；verify 固定旧 source/patch manifest |
| package audit | 79 文件，exports/main/types 全部覆盖 | [日志](package-check-final.log)、[逐文件摘要](candidate-files.json) |
| 同 tgz × 两个官方 npm 宿主包集合 | 每版正式守卫 20/20、关闭采集 20/20、旧合同 16/16、原生回答 8/8；Remote/业务加载通过 | [宿主报告](host-report.json)和两版本子目录日志 |
| 正式 fixture 重生成 | 与提交 fixture 逐字节相同 | 固定源码 SHA + `capture-context-loader020.py --release v0.2.0`；未启动平台 |

正式样本先执行出 2 项失败再修复，日志为 [首次失败](formal-before.log)。复核新增的多段身份误关联也先失败再修复，见 [身份关联失败](formal-record-identity-before.log)。它们是源合同控制用例，不冒充本机实平台复现；正式实机验收仍需同样验证。

最终本地 tgz：`release/plugin/openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-11.tgz`，SHA-256 **`609e1f663cae832cb5bddeffcdd90933917ed32ad64fa94852d410485ced11d0`**。报告、锁文件、日志和 79 文件清单已入 Git；tgz 保留在本机 ignored release 目录。此包不是 build-only CI 固定候选，不能用于关闭正式发布门槛。

## 仍须完成

- 固定最终 source/版本/CI run/tgz SHA/文件清单；对最终 CI 候选重做受影响验收。源码 -11 是未发布开发版本，不是已发布或已接受候选。
- 本机平台先核对/准备正式镜像、实际部署身份与有效 CLI 授权，再 live initialize/tools/list/schema、真实 guard、原生非空读取和来源对照。现有准备快照及过期登录不满足合同；没有擅自升级环境。
- 同一候选的两版 DSH × Mac/Windows × Desktop/npm 八组合实机验收，包含实际加载、重载、zh/en、登录等待/取消/重试、绑定、同回答事件/证据、选择联动/分页/降级和脱敏导出。
- B1：同 Host 重新登录的有边界最小复现；未复现保持开放，不宣称根因或凭据轮换修复。
- G6 正式平台+真实模型；人工焦点/滚动/窄窗口/可读性与异常分诊；无授权、未生成、部分及异常的可得真实场景。
- 正式候选版本与发布说明复核、PR/审查、合并、tag/npm publish/dist-tag；均保留各自授权和仓库门槛。
- 同步时核对到现有 [Dependabot #1](https://github.com/openbkn-ai/bkn-dsh/security/dependabot/1)：MCP TypeScript SDK OAuth 客户端可能向 MCP server 指定的授权服务器发送凭据，`GHSA-6qxp-vccf-f47h`，high，修复版本 `2.2.0`。主构建及旧宿主集合实际为 `@modelcontextprotocol/client@2.0.0`，新版集合为 `2.2.0`。这不是本轮新增依赖，但仍须在正式发布前分诊旧宿主实际路径、上游修复或缓解；没有进行利用验证或修改宿主依赖，不能声称插件已暴露或告警已解决。

复跑入口：先按 CLAUDE.md 准备固定旧生成器，再执行插件测试、typecheck、仓库测试、package audit；将本地 pack 交给 `node scripts/test-dsh-hosts.mjs --plugin <tgz> --output <fresh directory>`。该脚本只创建明确的全新隔离目录，设置独立 DSH_HOME，不读 CLI token、启动用户 Host 或调用平台/模型。
