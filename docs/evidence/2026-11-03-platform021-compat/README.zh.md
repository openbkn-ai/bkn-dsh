# 平台0.2.1兼容增量与发布前验证

2026-11-03。维护者选择：**补齐平台0.2.1兼容后发布，保留旧版支持；新候选固定后，由原远程Mac会话等待其现任务完成，再使用50.129测试环境做受影响的最小隔离验收。** 本记录区分正式0.2.0既有验收、0.2.1预发布源码/包检查与尚待完成的实机验收。

## CLI/SDK是否需要同步

需要补CLI版本匹配入口和对应合同测试；没有证据要求给插件增加或升级直接SDK依赖。旧CLI0.2.0重新登录报告0.2.1的平台，会被官方`ensureCompatible`拒绝；比较的是去除prerelease/build后的完整major.minor.patch。`auth status`只读本地store，已有token获取/续期也不走这个health预检，所以旧认证仍可读不能证明新登录兼容。不可绕过版本检查、修改平台版本或关闭TLS。

| 边界 | 当前判断与处理 |
| --- | --- |
| CLI安装入口 | 增加固定正式0.2.1目标，保留0.1.5/0.2.0、原默认、显式安装和已有CLI不覆盖保护。选择安装目标不代表升级已发现的旧CLI；状态须继续显示实际版本。 |
| CLI认证调用 | `--version`、`auth status --json`、`auth token`、`auth login <url> --no-browser`及授权URL提示的源码契约保持；不重写认证适配器或把应用OAuth替换进CLI device flow。 |
| SDK依赖 | 插件package/lock没有直接OpenBKN SDK依赖，真实CI5包也未内嵌它；SDK随外置`@openbkn/bkn-sdk` CLI使用。`@modelcontextprotocol/client`是另一依赖，不因名称相近而升级。 |
| SDK传输/凭据 | 固定020、021rc和main之间的tls、auth-fetch、JWT、store、version-check、lifecycle、trace模块逐字节相同；不改证书pin、TLS或凭据续期实现。SDK新增app OAuth/tokens接口不在插件调用路径中。 |
| SDK业务API | SDK的旧kn.metric*向objectMetric*迁移对直接SDK消费者有破坏性；插件Reader不调用这些SDK方法，不能据此要求在插件重算或转换业务参数。 |
| MCP指标与披露 | 当前Foundry main的query_metric新增必需version、query/branch与毫秒时间约定；新增branch/enum_query等可选披露。插件保留平台schema/参数/结果，不猜version、不换算业务口径，新增独立合同回归。 |
| MCP生命周期 | 成功C/I/status形状保持；新finish_unconfirmed是错误，不可造completed receipt。覆盖保持原Interaction及同I重试的边界，不加自动纠正回合。 |
| 新工具 | drill_through_metric继续默认隐藏/拒绝，不因SDK或平台新增名称自动扩权。 |

## 固定上游身份

官方SDK/CLI同仓`openbkn-ai/bkn-sdk`。2026-11-03 07:01–07:07 UTC，npm latest为0.2.0、rc为0.2.1-rc.1；正式0.2.1尚未发布。正式v0.2.0/npm gitHead为`2098f276eaabd1f31a30ac3ed58d5ba8d5bd5e6d`，rc.1/release/0.2.1/npm gitHead为`1cd2839652733e2ce6690b14e76ff8e9d73861dc`，main为`57d39f0f94804105db89b6151bfaf8a3ffddf888`（package标识0.2.1）。GitHub Releases latest仍旧，不能替代npm registry判断。包完整性与源模块摘要见[静态审计原件](./SDK-IMPACT.json)。

Foundry最新正式仍是v0.2.0/`81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b`；本轮实时核到main `1a3a76edb993d3944afb94a135392d33c90a0432`，尚无固定release/0.2.1或v0.2.1身份。新fixture标为**source preparation**，不能当最终0.2.1或50.129实采。

DSH官方发布列表仍有0.2.1-rc.5；master仍是`ce7073d51254c26cd63b22a60835b8f948deb447`，其provider-owned工具契约不自动纳入当前已验范围。此次不升级Host、generator或既有依赖锁。

主要原始依据：[官方CLI登录预检](https://github.com/openbkn-ai/bkn-sdk/blob/1cd2839652733e2ce6690b14e76ff8e9d73861dc/src/commands/auth.ts#L186)、[版本比较](https://github.com/openbkn-ai/bkn-sdk/blob/1cd2839652733e2ce6690b14e76ff8e9d73861dc/src/api/version-check.ts#L218)、[平台metric schema](https://github.com/openbkn-ai/bkn-foundry/blob/1a3a76edb993d3944afb94a135392d33c90a0432/adp/context-loader/agent-retrieval/server/driveradapters/mcp/schemas/query_metric.json#L154)、[finish未确认](https://github.com/openbkn-ai/bkn-foundry/blob/1a3a76edb993d3944afb94a135392d33c90a0432/adp/context-loader/agent-retrieval/server/driveradapters/mcp/interaction_finish.go#L88)。

## 验证与交付阶段

本地实现和验证已完成，见[验证台账](./LOCAL-VALIDATION.json)：生产仅4处CLI类型/安装谓词/UI/双语指引文件共7行替换，不改认证、MCP、Reader、执行guard或SourceText。新增9项CLI回归，相关4文件74/74通过；旧实现选跑10项为8失败/2通过（不覆盖旧CLI显示原本正确）。新增10项平台source合同回归使用官方MCP factory与ToolRuntime，核参数/结果透传、拒绝无dispatch、finish未确认与显式同I重试及新工具继续拒绝。首次装配失败来自绕过官方factory，不当生产红绿证据。

整合后插件共845项：844通过、1既有Windows专项跳过；仓库79/79；类型检查和126文件包审计通过。真实公开CLI/SDK020与021rc.1各8个场景，[16/16 loopback探针通过](./PROBE-SUMMARY.json)，覆盖匹配/拒绝无后续dispatch、status/token、正常合成refresh、过期拒绝与device提示后拒绝不保存。仅临时synthetic凭据/合成HTTP服务，不读取个人store，不调用真实平台/模型，不把rc.1记成正式制品通过。复用公开依赖代码1079文件；undici8.12.3属于该SDK范围内，不是插件8.10.2或注册表认证的全部传递依赖闭包。探针及原始报告按各自任务归因，SDK报告中“未改生产”不覆盖本轮另有的CLI4文件修订。

CLI修订与探针均已独立只读评审通过。新真实包探针是显式运行的独立命令，不计入默认845/79套件；其脚本、元数据fixture及运行命令可复现本次受控范围。原始完整结果保留在本地忽略目录，摘要记录对应SHA；尚不具有最终0.2.1、TLS或DSH实机验收等级。

现有CI5 `ae903656`/TGZ `14f4bb7fb61c892017343c832fdc8b37d892706b9a7aa2146779eef00ee9e3ff`及Windows通过结果继续按原平台0.2.0、原代码身份保留；新CLI/UI源码改动意味着需要新候选，不能沿用旧包作为新代码的验收。未改变的既有Windows矩阵不为记账重跑。

远程Mac chat `01a15340-6507-7660-a68d-68994e283415`已获得维护者授权，在开发和新包固定后排在现任务之后做50.129兼容验收。维护者随后要求等待新包后一起继续当前未完成的复核；原SourceText任务已暂停收态，其S1–S3与新兼容R/C项逐项保存在[合并续验清单](./MAC-RESUME-PLAN.zh.md)，不漏项或以新任务覆盖旧任务。先只读核该机真实CLI包、平台health/image/ref与目录schema，再限定到新登录/正常token续期/证书作用域、新metric合同与managed context/拒绝，以及CSV/溯源受影响链路；不升级当前0.2.0环境，不改原平台或模型输出，不重跑无关矩阵。若实际部署或最终CLI仍不是正式目标，则保留预发布验证标签和最终门槛，不把已有通过直接改写为正式0.2.1接受。

合并/主分支制品等价/发布声明以新候选及最终身份为准；当前未打tag、发布、替换旧资产或移动latest。
