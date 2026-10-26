# 固定 CI 候选的本机正式平台验收

日期：2026-10-19，Asia/Taipei。测试端点仅为本机 `https://192.168.50.129`。用户已重新登录，并明确授权以下 build-only CI。正式平台升级和数据保留前提见[升级证据](../2026-10-19-formal-platform-upgrade.md)。

## 候选身份与授权

- 分支 `feat/021-localization-login`，候选 commit `41507f9918484e76f8198b1dc20b029855915d29`。
- [release-plugin.yml run 39261456908](https://github.com/openbkn-ai/bkn-dsh/actions/runs/39261456908)，参数 `publish=false`，结论 success；npm 发布和 GitHub Release 步骤 skipped。
- 版本 `0.2.0-rc.2-openbkn.0.2.0-11`，79 个归档文件，tgz SHA256 `0076bdfcb98cd26afcdb5e2e4604011f567e4cf973a472a6f17fe5fc16ba2b50`。
- 本轮未改候选包代码。此前本地 pack 与 CI tgz 压缩摘要不同，解包后的全部 79 个文件逐字节相同；实平台测试安装的是 CI tgz。
- 此次授权不包含 PR、合并、tag、npm 发布、dist-tag 或升级用户安装的 DSH。

原始 CI、包清单、锁文件、运行日志、截图和会话日志在本机 `release/ci-41507f9/`（gitignored）。目录含隔离测试凭证和浏览器 bootstrap URL，不能整目录提交或上传；此文只记录去敏结果。

## 实平台合同与真实工具运行

- 正式 npm CLI 0.2.0 已刷新有效登录；使用原 CA 验证 TLS，不绕过证书检查。
- 两个 KN 均真实完成 MCP initialize / tools/list；各 25 项：23 项可投影源码 schema 与正式 tag oracle 一致（仅排除描述文案比较），另 2 项 inline PTC 的 live schema 已单独保存，均要求 `bkn_context`。条件性 `execute_skill` 未发布，按条件目录处理。
- World Cup 真实 `query_object_instance` 返回 3 行、总数 30；同回合 start/finish 身份一致，操作回读确认已完成。completed 仅证明执行状态。
- 平台关闭采集时，start/finish 仍保留同一 Conversation/Interaction ID，`capture_enabled=false`、`trace_recorded=false`；真实查询仍返回 3 行。随后恢复采集 enabled。
- 同一 CI 候选在两版实际 DSH ToolRuntime/McpClient 上的 live enabled 守卫各 20/20；live disabled 守卫各 20/20。拒绝的缺失/类型错误/跨回合 context、跨 KN、未知/排除工具未 dispatch；允许的 `search_capabilities` 有平台操作回读。关闭采集运行完成后确认 desired/effective 均恢复 enabled。
- CI 的正式/关闭采集/旧合同/原生输出/Remote 受控验证也均通过；该层不替代真实模型或人工验收。

## Mac npm CLI 宿主边界

完整官方 `@deepseek-ai/dsh@0.2.0-rc.2` 与 `@deepseek-ai/dsh@0.2.1-rc.2` 分别运行 CLI web，监听 `127.0.0.1:38420` / `38421`，使用独立 `DSH_HOME` 和 `supply-old` / `supply-new` 工作区。两个原生目录选择步骤由用户完成。已有 Desktop App 和用户 DSH home 未升级或覆盖。

首次 strict peer 安装因旧版本浮动 Cordis 插件拉入新 peer 失败；按对应官方 tag 的 vendor pin 冻结安装配置后 strict peer 通过，没有修改宿主包代码或放松 strict peer。实际 closure：旧版 278 个 DSH 包全部为 0.2.0-rc.2、单一 Cordis 4.0.4；新版 295 个 DSH 包全部为 0.2.1-rc.2、单一 Cordis 4.0.5。Zod 均为 4.4.3。不能将该有记录的安装配置写成“无条件默认安装均通过”。

真实模型经本机平台 OpenAI-compatible gateway：配置模型 `deepseek_chat`，原始响应 `responseModel=deepseek-flash`；不是脚本模型。本轮客户端测试配置为 contextWindow 65536 / maxTokens 4096，不作为供应商模型容量声明。

## 真实问答与剩余门槛

运行及逐项结果正在本轮证据文件中补齐；任何回答错误、截断或降级均保留，不能用治理测试通过覆盖答案验收。

两版已完成回答的业务溯源界面均显示 404；标准 Interaction/Operation 读取与本地时间线仍可见。正式 CE 源码的 `TestCommunityDoesNotMountLegacyBusinessProvenanceDataRoutes` 明确检查该旧路由不挂载。404 本身不能断言记录不存在或许可不足。本轮没有非空原生事件/证据，选择联动、原生导出等门槛继续开放，历史其他部署的原生证据不用于补齐。

浏览器平台首页已显示已登录 Administrator；Chrome 仍显示不安全标记，未自行绕过浏览器警告。主机 CA 校验通过不等于浏览器 CA 信任完成。第二台 LAN 设备、完整恢复演练、Windows 两版 Desktop/npm、Mac 两版 Desktop、B1 同 Host 重新登录的最小复现及完整人工交互验收均未完成。

## 安全依赖分诊

[GHSA-6qxp-vccf-f47h](https://github.com/advisories/GHSA-6qxp-vccf-f47h) 涉及 MCP SDK OAuth 客户端凭据可能发送到 MCP 服务指定的授权服务器。旧宿主实际 SDK 2.0.0、新宿主 2.2.0；未擅自覆盖固定宿主依赖。

实际 DSH StreamableHTTP transport 仅设置 `requestInit.headers`，本插件通过 DSH 凭证服务传 Bearer，没有配置 SDK `authProvider` / OAuth client credentials。两版实际 McpClient 的本地 401 + resource_metadata 挑战探针仅使用明确伪造的测试 Bearer：初始化均拒绝、各只有一次 `/mcp` POST、无 metadata/token 请求。这支持此固定插件路径未触发所述 OAuth 流程，不代表旧宿主所有插件均不可达或漏洞已修复。2.2.0 的持久化/预配置凭据仍须按公告绑定 issuer；上游修复或有边界的缓解决策在发布前继续开放。

## -11 的 G6 记录与人工分诊

两版各运行 7 道正例和 `missing-object`；[旧版最小条目记录](G6-old.md)为 6/8，[新版记录](G6-new.md)为 4/8。该计数只对应现有 YAML 的逐项标准，**不是整份答案接受率，G6 整体验收未通过**。旧版采购题虽满足“分别列出两类单据、说明状态来源”的最小条目，额外业务数字和日期仍有问题，不能按通过条目掩盖。

| 场景 | 旧版 0.2.0-rc.2 | 新版 0.2.1-rc.2 |
|---|---|---|
| 订单数量/状态 | 40 张、全部已确认、两个单号区间；最小条目通过 | 把物料编码当成订单号，转查无关 SO0000382；失败 |
| 成品仓库存 | 534，苏州325/乌鲁木齐127/哈尔滨82正确；额外非成品仓拆分错误，失败 | 同样核心成品仓正确，额外非成品仓拆分错误，失败 |
| 标准交期 | 自制件生产固定提前期1天，来源/口径明确；通过 | 同一核心事实和口径；通过 |
| BOM构成 | 已披露平台来源和层级/一级子料，最小条目通过；声称交付本地文件另有问题 | 原连续会话输出截断；独立会话复核最终网关400，均未形成完整答案 |
| BOM用量/库存 | 混用含替代料与主料路径口径，未达到主料313行/272物料及生产可用库存要求；失败 | 连续会话及独立会话均输出截断；失败 |
| 采购流程 | PR/PO分列，BOM范围明确；额外数量及以BOM日代替当前日的问题仍开放 | 按该物料直接关联，PR/PO均0，与数据库一致；最小条目通过 |
| 订单明细 | 40个单号及签约/交付数量逐项与数据库一致；通过 | 同样40行逐项一致；通过 |
| 无数据负例 | 999-999999 无目标物料/库存/订单数据；通过 | 同一结论；命中0/全表3497为查询范围说明，不是目标物料业务数量；通过 |

独立依据：本轮真实 MariaDB 只读查询确认订单40、状态已确认；成品仓三项及合计534；借用仓232、苏州客退仓44、待发仓6，全部状态可用。旧模型额外回答为230/46，新模型为230/43。两版订单明细40行的单号集合、签约数量及交付数量均逐项相同（签约1081、交付1066）。直接关联该成品物料的 PR/PO 均0。当前已发布「BOM清单」实调 `depth=5, include_substitute=false, report_grain=summary` 返回一级主料9、5层、313行、272个物料；不沿用历史平台答案。

附加问题：旧版采购回答的PO数量合计出现6,201,410，而它本轮原始工具输出为6,201,414；逾期基准采用BOM版本日2026-08-05，并非运行日。模型尝试 `present` 被管理守卫拒绝，之后仍声称 Sandbox 内的 `.md` / `.csv` 已保存到本地工作区；不能据此声称文件已交付。没有放宽守卫、自动纠错、增加业务重算或重写回答。

新版初始连续会话在BOM题截断后，下一题 start 由平台明确拒绝 `interaction_in_progress`，要求先 finish；没有绕过。17个去重模型交互的标准读取全部HTTP200，原生detail/explanations全部404；其中3个未finish的错误/截断交互最终平台状态为abandoned，其余completed。原始受限证据 `test-deploy/formal-020/live-20261019/dsh-model-readback-summary.json` 含平台 lease 字段，不能提交。一次误点“分支”产生的旧版复制会话未计入评测。

`invalid-token`、`platform-unreachable`、`unauthorized-network` 的真实模型负例未执行：本轮保持用户有效认证及平台在线，缺少隔离的低权限账号；受控守卫拒绝不替代这些真实模型场景。B1未复现，保持开放。

## 本地修复与接下来的执行顺序

- 实际复现：-11 英文证据链在原生读取404时，空 evidence node 区使用了“An explanation exists, but no conclusions were disclosed.”。截图及AX保存在本机 `mac-cli/0.2.0-rc.2/en-evidence-404-*`。
- 先补回归复现失败，再将空节点文案改为中立的“没有可展示的平台节点 / No platform nodes to display.”；有效空解释仍保留其独立结论提示。源码提交 `933b0ab251c75461ece1ada6145a9487e7eb04d1`，版本-12。
- 两版依赖基线各插件585 pass / 1 Windows专属skip，类型检查通过；45项相关渲染/原生测试、66项仓库测试、79文件包审计通过。没有把该本地结果写成CI或实机修复验收。
- 用户已授权[本次 -12 build-only run 39268135924](https://github.com/openbkn-ai/bkn-dsh/actions/runs/39268135924)，`publish=false`；其CI已成功，固定产物的双宿主zh/en空态复验已通过，见[-12后续证据](../2026-10-19-ci-933b0ab-followup/RESULTS.md)。
- 用户最新指示：完成本次已授权build-only；后续开发、构建与验证全部先在本机完成，问题收敛后再统一同步分支、执行最终远端build-only CI。后续未完成工作不逐项触发远端CI。

当前正式平台保留的模型元数据 `max_model_len=8192`；实际响应模型为deepseek-flash。DeepSeek[当前官方模型文档](https://api-docs.deepseek.com/quick_start/pricing/)声明Flash上下文1M；原隔离宿主65K/4096测试预算与复杂查询的实际上下文不匹配，截断不能直接归责插件。只调整隔离DSH测试profile为contextWindow=1000000、maxTokens=32768继续本地复核，保留平台原模型配置和旧失败证据。官方容量声明与本地网关实际接受的输入规模分别记录，不将1M配置写成已完成1M实测。
