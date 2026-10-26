# 第48轮：Desktop carrier 与成功登录后的 cancel / Job 收尾

固定两版官方 Mac Desktop 归档的实际启动代码已核对；使用归档中未改动的启动回调、Connection、Gateway 浏览器包，受控运行均选择 `/api/remote.mux` WebSocket，`rpc.open` 不存在。再接入原 -30 登录消费者和固定源码进程生命周期，两版各三组、共 **6 组通过**。这补上了第46轮直接实例化 mux 所缺的 carrier 选择证据，仍不是实际 Windows 登录事件、Job 成员或浏览器关闭原因的测量。

**本轮决定继续不改 -30、不改成功后的进程终止策略。** 成功首结果后退出消费确实可能发送 cancel；“消费到 terminal”能避免该 cancel，却不会使仍非空的 Job 自动结束。把两件事当作同一个已修问题，或成功后直接终止整个 Job，都超出当前证据。#95 保持开放。

## 输入与实际执行层次

- 插件：`0.2.0-rc.2-openbkn.0.2.0-30`，231075 bytes / 82 文件；tgz SHA256 `6d95ff7517dbe409875fd398784fe01049ba26d2b97c43fad65c817d3ea18ee9`。
- 源码基点 `933b0ab251c75461ece1ada6145a9487e7eb04d1`，另有未提交实现；冻结 r3 的 `source-worktree-identity.json` 中 **167/167** 当前源码文件相同。基点提交本身不代表完整源码快照。
- 旧 Host `0.2.0-rc.2 / 639ed015397290b3745d163aafe02ffee4aa3f84`；新 Host `0.2.1-rc.2 / 687f282e8625c6b8d11ff58211a90524be2e4317`。每版本轮使用的 16 个源码文件均与固定 git blob 相同；每版已安装插件 82/82 相同。
- 从已验证的隔离官方 Mac app 读取 ASAR：旧 SHA256 `18d5036bbb58eaff41d351ede99314b8d06505aec06fb2e164c49874ada30f9e`，新 `b9ec4c2bbc20c9dbc3e39fa4c961434a943434ab0a803052b26753dd15f3b066`。只以 `ELECTRON_RUN_AS_NODE=1` 读取文件，未启动完整 Desktop/Host UI。
- 浏览器包直接来自这两份 ASAR，并与各自 npm runtime 的官方 browser bundle 逐字节一致；只在任务内函数求值时额外导出私有符号。不是拿新版 node bundle 代替 Desktop 浏览器实现。
- 真实 loopback HTTP/WebSocket、本机 Node24.19.0、真实原生 Connection/Gateway 方法；只延后 loader readiness，避免无关 generation/event 订阅。没有跑完整 Typert 挂载、Host cookie/Origin 鉴权、真实 Electron renderer 或整机网络。
- WindowsJobOwner / WindowsJobRunner / common binding 来自固定源码，TypeScript transform 后执行；Windows API、IPC传送、直接退出结果与 Job 空状态是明确注入的夹具。没有实际 Windows 进程、句柄、Job、Chrome、OpenBKN CLI、凭据、模型或平台操作。

全部输入身份见 [input-verification.json](input-verification.json)，运行细节见 [desktop-carrier-lifecycle.json](desktop-carrier-lifecycle.json)。

## Carrier 与收尾链路

官方 ASAR 的 `lib/preload-app.cjs` 只通过 `dshDesktopBoot` 提供启动 IPC。`lib/main.js` 在 boot 响应中返回注入清单与本地 Host origin。真正的 web 文档从 `dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist` 加载；其 boot 回调设置 `__DSH_TRANSPORT__ = { ownsHost:true, streamBaseUrl }`，不提供 `rpc` 或 `openStream`。主进程另有本地 WS 的 Origin/cookie 处理，与此默认路径一致。

原始 `installConnection` 因未提供 stream hook 而不生成 `rpc.open`，原始 `ClientRemoteService` 因此启动 WebSocket mux。旧版直接使用 global transport 的 streamBaseUrl，新版通过 connection.openWebSocket；六组 HTTP upgrade 实际观测均为 `/api/remote.mux`。这是所核对归档及受控选择链的证据，**没有将它扩写为 Windows r1/r2/r3 现场已抓到帧或实际 containment 的证据**。

随后执行原 -30 的 `remotePort.beginLogin`：取得首个网络结果就 `return`，finally dispose stream。原生 ClientStreamHandle 的提前结束可以发送 cancel。服务端流尚在 active map 时，cancel 会 stop/abort；如果已经自然 end 并从 map 删除，迟到 cancel 被忽略。

进程端有两个完成边界：插件的 CLI adapter 等待 `child.done`，而 DSH provider 保留 managed range，直到 `waitForExit()` 确认整个范围退出。common binding 只在范围退出后移除 abort 监听，所以直接结果完成后仍可能响应流的 abort。WindowsJobOwner 在 runner 仍 connected 时发送 terminate IPC；WindowsJobRunner 终止其持有的 Job，并在结果已投递且 Job 为空后退出。源码的实际 Windows Job 选路还要求 ordinary spawn 且 probe 成功；本轮没有在 Windows 上测这个 probe。

## 六组最小结果

两版结果一致；“Job 非空”均为夹具前提，不是 Chrome 归属测量。

| 条件 | 线路 cancel | Host signal | Job 收尾接口 | 夹具 runner |
|---|---|---|---|---|
| 原消费者首结果返回，延迟 item send 完成回调，使服务端仍活跃 | 收到 | abort；调用方自身 signal 未 abort | common SIGTERM → terminate IPC → 注入 terminateJob 一次 | 结束 |
| 对照消费者读到 terminal，相同发送回调控制 | 不发送 | 不 abort | 无 terminate | 非空 Job 下仍等待 |
| 服务端 end 并移除后，原消费者才取首结果 | 收到迟到 cancel | 不 abort；迟到 cancel 被忽略 | 无 terminate | 非空 Job 下仍等待 |

发送完成回调的延迟是人为控制的时序，不说明 Windows 现场存在同样延迟。真实用户登录、凭据同步和网络列表验证由 stand-in 替代。六组结束后，fixture runner均断开、HTTP监听关闭、服务端WebSocket清空，进程正常退出。

前三次探针适配失败（原生 Cordis 服务须先 provide、浏览器 crypto 环境、Context 应通过 fiber.dispose 收尾）保留私有日志；最终第4次运行六组通过。这些适配错误不是产品失败，也没有覆盖原始失败证据。

## 逐项关单：发现 #94 自身未完项

本轮重新读取 #92–#99 当前正文/评论/状态，均 OPEN / kalias。没有任何 issue 被整批提前关闭，也没有把 #99 的全部门槛套给实现项。

对 #94 做了独立核对：

- 全部 **28 个** 当前客户端 TS/TSX 文件重新盘点，含新增原生溯源与设置/控制器；zh/en 各 **302 key**，字面 t/uiMessage 调用没有未知 key。
- 新鲜运行已有语言/slot定向检查 **19/19 pass**，包括字典插值/fallback、已显示错误 zh/en/zh、不重新连接、等待中登录与取消、业务原文/选择保持。没有构建或重打包。
- AST盘点发现历史溯源 `Reference` 仍写死 `Request / Trace / Receipt / Op / Status`。独立受控中文渲染确实同时出现中文“执行状态”与这些英文标签。它们是插件创建的显示标签；至少 `Status` 不能等同于平台返回的原始状态值。`Operation:`、`Interaction:`、`error` 等技术字样另列盘点，不把它们都自动判为必须翻译或自动豁免。
- 因而字典 key 一致和现有测试通过 **不能证明文案完整**。#94因自己的覆盖遗漏保持 OPEN；Mac/Windows总矩阵、人工可读性及最终CI仍属于#99，不是本次保留#94的理由。按当前冻结指令未改源码或 -30。将来允许改候选时，需要处理这些标签并补真实渲染回归。

#96保留其显式的#93原生合同前提：历史 schema1/非空样本及受控守卫/预算有效，但当前正式目标的非空路由/样本仍缺，本轮未完成该项完整独立关单审查，也未把“没有 POST 入口”冒充显式生成动作已验证。#98保留已复现MCP owner问题的修复证据及已做B1范围，不把未确认历史长时条件重新统称为完全未复现；仍未整体关闭。

详见 [逐项审查](issue-closure-audit.json)、[文案清单](locale-inventory.json)、[中文标签复现](locale-label-repro.json) 和 [当前 issue 状态](issues-current.json)。本轮已关闭清单为空；未发表评论、改正文或状态。

## 与 Windows 证据合并后的边界

第47轮保存的 r3 粘贴回报继续是远程报告证据，Windows 原报告/manifest 尚未独立读取。r1成功后runner残留、r2新Chrome树与runner同一采样消失、r3既有日常Chrome根保持，三个观察分别保留。不能认定r1一定是新Chrome/一直未关，也不能从约370ms同次采样确定退出顺序或Job成员。

本轮证明了一条可能的程序收尾路径；实际 Windows 归因仍缺同次登录的 carrier/cancel 时序、runner收到terminate的原因、所选containment与Job成员、Chrome的真实归属。后续应优先在一个已有Desktop上补这些最小观察，不重跑A/B/UI/B1；不通过额外持有/复制Job句柄改变生命周期，不关闭日常Chrome，不把 `inAnyJob`/PPID 当作特定Job归属。

当前无需用户重新登录或操作。未新增Windows任务、交接分支或推送。

## 上游与保留范围

只读刷新两上游：DSH master22ddee37 / 最新dsh-v0.2.1-rc.3与第47轮相同，支持pins不变、不安装rc.3。Foundry正式仍v0.2.0，未发布main新增24个提交至1e50a4fb，包含trace摘要、提示词/配置本地化与原子性、错误语言迁移、指标查询/授权，以及bkn-safe可选OAuth发现/动态注册/已连接客户端管理。总体compare只返回300文件，明确截断；对最新17文件OAuth提交做了相关文档/代码定向检查，不宣称完整平台兼容。该新接口未部署，也不改本轮固定CLI/SDK0.2.0的登录路线。

未接触正式0.2.0服务、业务数据、配置或凭据；本轮没有平台读取，不能声称新做了业务数据前后核验。未升级DSH、重建插件、修改原-30/helper、提交/合并/推送、跑CI或发布；其他会话和独立-11/-12/-13发布线均未采用或修改。原r3交付fac4db78及26输入保持冻结干净。保留当前工作树已有修改，索引和HEAD不变，细目见[preservation.json](preservation.json)。

## 本地复现

所有输出放在冻结kit之外，不安装依赖、不连平台。已存在的本轮artifact目录不可覆盖；需要从相同官方app重取时，使用[extract-desktop-carrier.cjs](extract-desktop-carrier.cjs)以Electron的Node模式读到新目录，并先核对identity摘要。主探针使用本轮已核对的两个artifact目录、既有local40 runtime与固定源树：

```sh
/Users/dominiczhang/Documents/project/app/openBKN/.test-tools/node_modules/node/bin/node docs/evidence/2026-10-24-local-48/desktop-carrier-lifecycle-probe.mjs release/local-48/repro-fresh
```

输出目录必须不存在。结果内各code SHA和artifactIdentity必须先与[input-verification.json](input-verification.json)对应；结果是受控复现，不能当正式验收。标签复现须在插件目录使用其tsx/tsconfig运行，脚本为[locale-label-repro.mjs](locale-label-repro.mjs)。`ciRun=null`、`formalAcceptanceEligible=false`。
