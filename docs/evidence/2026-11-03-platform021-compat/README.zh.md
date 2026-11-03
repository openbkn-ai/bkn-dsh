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

另已只读核对[指标摘要边界](./METRIC-SUMMARY-BOUNDARY.zh.md)：版本/branch精确补名和新filter/time简明摘要仍是平台同源策略的范围限制，原始JSON保留，未证实选择误联；当前Studio main与插件逻辑相同，不单方面改包干预平台解释，也不冒称最终发布页面已对照。

## 两端首轮核收与剩余门槛

见[核收与发布分级](./INTAKE-REVIEW.zh.md)、[十一份原件身份](./RECEIVED-ARTIFACTS.json)、[Mac报告](./mac-rc5/MAC-CI6-RESULTS.zh.md)及[Windows报告](./windows-rc5/WINDOWS-CI6-PLATFORM021-VERIFICATION.zh.md)。两端原生安装/CLI入口/旧版本保护/登录同步及受控实平台最小调用已有明确通过证据。Windows独立SDK自然续期补充通过，指标正例缺披露仍未执行。

用户最新明确能力矩阵：**50.28企业版正式020＋独立匹配CLI020补Mac S1–S3；50.129社区main021＋官方CLI rc.1主测新CLI兼容。** 129企业溯源404不再作为发布阻断；其实际请求/当时UNKNOWN及历史真实样本来源保留。本机28卡已按收件人加密交两端，两端四项认证均通过，见[回执](./CARD-028-HANDOFF.json)。[Mac企业28最终补充](./mac-rc5/MAC-CI6-EE028-FIELD-RECONCILIATION.zh.md)已核收：原生登录/入口恢复、同记录Reader与Studio响应一致，但当前未披露原文，S1–S3均NOT_RUN；Swift独立进程预检false仅作工具限制。正式CLI021精确安装与Mac边界验收/普通发布流程仍待闭合，现有包保持。Windows只收卡、不重跑旧矩阵。

## 验证与交付阶段

**CI6和两端首轮增量回执已核收，剩余验收未放行。** 源`f01b316fbfb6be681af81e2267a7b3341e659efd`的[build-only CI41596006291](https://github.com/openbkn-ai/bkn-dsh/actions/runs/41596006291)成功，publish=false；插件844通过/1既有跳过、仓库79/79、MCP1/1、包126文件，以及两版官方npm Host受控检查通过，npm发布与GitHub Release均跳过。[实际CI包](./CI6-ARTIFACT-IDENTITY.json) artifact13212518096，TGZ877732字节/SHA `4500fa4357cdcdcb9914a39794aedb9096c948192c2bf0f35ecf4fadb882f046`；与本地参考126/126文件和整段解压tar相同，仅gzip OS字节9不同，不称压缩原件全字节相同。相对旧CI5仅两README、client/diagnostics、Host/Remote生成协议及两声明共8文件变化，其余118文件保持。见[CI结果](./CI6-RESULT.json)、[受控双Host原件](./CI6-DUAL-HOST.json)。独立GitHub评审已在该源批准，不代表最终平台或原生验收。

本轮再次对公共npm精确查询`@openbkn/bkn-sdk@0.2.1`仍返回E404；正式安装与最终CLI验收继续待办。已有0.2.1-main/rc可在其真实版本/源/部署配对下做预发布范围测试，不改manifest伪装正式版，不绕过检查或偷偷改用旧CLI替代指定目标。

本地实现和验证已完成，见[验证台账](./LOCAL-VALIDATION.json)：生产仅4处CLI类型/安装谓词/UI/双语指引文件共7行替换，不改认证、MCP、Reader、执行guard或SourceText。新增9项CLI回归，相关4文件74/74通过；旧实现选跑10项为8失败/2通过（不覆盖旧CLI显示原本正确）。新增10项平台source合同回归使用官方MCP factory与ToolRuntime，核参数/结果透传、拒绝无dispatch、finish未确认与显式同I重试及新工具继续拒绝。首次装配失败来自绕过官方factory，不当生产红绿证据。

整合后插件共845项：844通过、1既有Windows专项跳过；仓库79/79；类型检查和126文件包审计通过。真实公开CLI/SDK020与021rc.1各8个场景，[16/16 loopback探针通过](./PROBE-SUMMARY.json)，覆盖匹配/拒绝无后续dispatch、status/token、正常合成refresh、过期拒绝与device提示后拒绝不保存。仅临时synthetic凭据/合成HTTP服务，不读取个人store，不调用真实平台/模型，不把rc.1记成正式制品通过。复用公开依赖代码1079文件；undici8.12.3属于该SDK范围内，不是插件8.10.2或注册表认证的全部传递依赖闭包。探针及原始报告按各自任务归因，SDK报告中“未改生产”不覆盖本轮另有的CLI4文件修订。

CLI修订与探针均已独立只读评审通过。新真实包探针是显式运行的独立命令，不计入默认845/79套件；其脚本、元数据fixture及运行命令可复现本次受控范围。原始完整结果保留在本地忽略目录，摘要记录对应SHA；尚不具有最终0.2.1、TLS或DSH实机验收等级。

现有CI5 `ae903656`/TGZ `14f4bb7fb61c892017343c832fdc8b37d892706b9a7aa2146779eef00ee9e3ff`及Windows通过结果继续按原平台0.2.0、原代码身份保留；新CLI/UI源码改动意味着需要新候选，不能沿用旧包作为新代码的验收。未改变的既有Windows矩阵不为记账重跑。

远程Mac chat `01a15340-6507-7660-a68d-68994e283415`已获得维护者授权，在开发和新包固定后排在现任务之后做50.129兼容验收。维护者随后要求等待新包后一起继续当前未完成的复核；原SourceText任务已暂停收态，其S1–S3与新兼容R/C项逐项保存在[合并续验清单](./MAC-RESUME-PLAN.zh.md)，不漏项或以新任务覆盖旧任务。先只读核该机真实CLI包、平台health/image/ref与目录schema，再限定到新登录/正常token续期/证书作用域、新metric合同与managed context/拒绝，以及CSV/溯源受影响链路；不升级当前0.2.0环境，不改原平台或模型输出，不重跑无关矩阵。若实际部署或最终CLI仍不是正式目标，则保留预发布验证标签和最终门槛，不把已有通过直接改写为正式0.2.1接受。

合并/主分支制品等价/发布声明以新候选及最终身份为准；当前未打tag、发布、替换旧资产或移动latest。

维护者追加授权Windows受影响验收：新CI制品核收后同步交原Windows chat，只做[W0–W5增量清单](./WINDOWS-RESUME-PLAN.zh.md)，保留旧CI5通过项，不用Mac代填或重跑整套E2E。Mac原未完成S1–S3和新R/C项仍按合并清单继续。

登录处理已由维护者明确指示改为：远程任务读取本机项目测试平台信息卡、使用对应测试账号完成正常登录/设备授权；不要求维护者手工代做该步骤。凭据仅本机内存使用，不回传主会话或另一机器，不进入报告/日志/命令参数。信息卡不是其他操作的授权来源；其缺失、账号失效或真实人机挑战才按实际缺口报告。

维护者随后明确授权Mac经Git向Windows交付缺失信息卡，采用接收方公钥加密的等价流程：独立分支`handoff/ci6-platform129-card-46b70b7f8319`、commit`7ef885a8dd0bac11944fdbe79c7b379b1139ab55`，只新增加密信封/README/.gitattributes。信封1468字节/SHA `498236307d857c99f2a5433a28d82ba10109a403f8a2b5cc940442209c6e5418`；RSA4096公钥指纹及AES256-GCM上下文已核，私钥仅Windows本机。Git没有明文卡、密码、私钥或明文摘要，主会话不解密；Windows按精确对象、摘要及GCM认证后本机使用。该授权仅覆盖加密卡交接，未改变CI6或主开发分支，未合并交接分支/发布。
