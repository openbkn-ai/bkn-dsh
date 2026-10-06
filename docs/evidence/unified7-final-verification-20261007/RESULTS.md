# 统一 -7 发布决定前 Mac 补测

2026-10-07，Asia/Taipei。**暂不建议发布：本轮发现两项回答交付失败。** Windows 补证任务已提交远端，Mac 清单已逐项执行并记录结果；混合网络真实图仍有下述未完成边界。源码、Host、固定 tgz 没有修改，也没有发布、tag 或 dist-tag 操作。

## 固定身份与前提

| 项目 | 本轮对象 |
|---|---|
| 插件 | `@openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-7` |
| 源码 | `3414bdec3c956cc0d580aebd959ac6f3439bb352` |
| 原 CI / 主线彩排 | `37478119730` / `37500800409`（main `870e269`）；相同 tgz |
| tgz | `6bbab27876e743032572ddce107fcce09e0d681f87bee19fba8d78180e5a63a8`，177442 bytes，66 文件 |
| Desktop | 官方 macOS DeepSeek Harness 0.2.0-rc.2，Node 24.18.1；未改 runtime，未开 inspector |
| npm | 官方 DSH 0.2.0-rc.2，Node 24.19.0；真实 Chrome / Codex in-app browser |
| CLI / 平台 | 官方 OpenBKN CLI 0.1.5；真实测试平台 `192.168.50.28`，实际服务镜像与目录见 `upstream-and-environment.json` |
| 模型 | 用户配置的隔离 Desktop，DeepSeek-V41-Flash / High；原题、标准模式、新会话 |
| 隔离目录 | `/private/var/folders/9r/1zks6bqd7f3dtwybvxsksbc40000gn/T/openbkn-diag-ui-h76__jwb` |
| Windows 已有证据 | `9fb3896b979eff8fdebc1283ecb6316e0a888953`；历史补证缺口未事后伪造 |
| 新 Windows handoff | 分支 `docs/unified7-final-verification`，首交 commit `150d85d7e7d49d2091b918b641faee72e629081b` |

刷新 DSH master 和 Foundry main；支持版本未升级。当前实际 MCP 的 28 个工具及输入/输出 schema 与前轮一致。主线相对候选只有包外测试断言变化，本轮没有把最新版上游替代为支持基线。

用户本轮完成正常浏览器授权。CLI 返回已登录，令牌只在隔离 CLI cache / Host 中使用。原始私密日志、凭据备份、完整 profile 和模型密钥未交付。

## Mac 清单的执行结果

| ID | 结果 | 实际证据与边界 |
|---|---|---|
| M0 | PASS，保留准备偏差 | fresh full remove/install 后 Desktop/npm 各 66/66，实际 CLI 0.1.5 与平台服务/目录核对；保护文件前态已采集。旧测试安装只剩 33/66 的原因未知，未计入正式验收。 |
| M1 订单数量/状态 | PASS | 原生 completed；40 张、全部已确认、两个单号区间及 `supply_demo_hand.sales_order` 正确。`orders-count-status.json` / `.md`。 |
| M2 成品仓库存 | PASS | 原生 completed；苏州325、乌鲁木齐127、哈尔滨82，共534个/9行；仓范围、预留已扣、在途不含说明正确。`finished-goods-inventory.json` / `.md`。 |
| M3 BOM构成 | **FAIL：原生交付终态** | 结构313行/272子料/5层的前五字段均能对应独立 ERP 行；但追加的库存交付校验在一次修正后仍失败，native `turn/end=error`。结构事实正确不覆盖该终态。`bom-structure.json`、`bom-structure-independent-check.json`、`bom-failure-triage.json`。 |
| M4 未结采购 | PASS | 原生 completed；PR/PO 分别明确为0，独立按本物料编码查询两类单据均无行。附带推断不替代该查询边界。`purchase-flow.json` / `.md`。 |
| M5 订单明细 | **FAIL：回答事实** | 原生 completed 却错误答无记录；只查订单号/合同号，未按物料的 `product_code` 取40行。独立前后快照有同样40行，签约1081/发货1066。`sales-order-detail.json` / `.md`。 |
| M6 Token失效 | PASS（受控凭据） | 本人隔离 cache 注入无效 Token，真实平台 HTTP401；Host 引导重新登录、零工具业务访问。未撤销真实账号。恢复原 cache 后同一会话 completed /40张。`invalid-token*.json`、UI及恢复记录。 |
| M7 不可达/恢复 | PASS（受控关闭端点） | 正确匹配的虚构 CLI cache + 关闭的 HTTPS loopback，正式轮 native连接失败、无业务回答；实际产品报告 `context-loader/network-unreachable`。恢复原 profile/binding、重启官方 Host 后同一会话18秒完成40张。不是集群停机，也不证明跨进程 observer 的 recovered。`platform-unreachable*.json`、产品报告 `fac42410`。 |
| M8 自动续期 | PASS（临近到期调用链）；自然过期边界未测 | 把有效 opaque Token 的本地 expiresAt 设为40秒后，实际绑定会话自动调用 CLI authority；访问/刷新令牌哈希均变化，过期时间延后至21:56:01Z，业务正常。没有手动 `auth token` 指令。不是等待服务端自然失效的验收。`automatic-refresh-before/after.json`。 |
| M9 来源图 | PARTIAL | 真实图36元素、0可视关系；销售订单对象与签约数量字段分别显示不同 Operation，并各自对应独立平台 Trace 引用。第二授权网络确有27对象/29关系，UI可查看；新工作区目录选择器未取得完成证据。没有真实混合网络图，不计跨网PASS。`real-business-graph.json`、`real-operations.json`、两个 source UI、`second-network-detail.json`。 |
| M10 npm UI/下载 | PASS | 单侧栏入口、面板“诊断”、真实目录与七项pass；3份实际 npm 产品下载，含已登录报告 `965afa11`。下载原件路径与SHA见 `npm-product-downloads.json`。Chrome登录后一次点击未留存下载原件，该尝试没有替代 in-app browser 的成功原件。 |
| M11 保护/清理 | PASS（限定范围） | 同一批18个选定路径的存在性与内容哈希前后比较；日常9项一致（4项存在/5项原本缺失）。隔离vault因正常授权/续期/同步改变，如实列出。已记录owned Host树按PID、创建时间及npm监听归属停止；18798/64391无监听。managed登录PID未采集创建时间，另行披露，不补造。只声明选定路径，非整个home。 |
| M12 文档/身份 | 完成 | 本结果、当前验收overlay、剩余决定清单和唯一累计说明同步；固定kit与候选不改，最终包/安装身份再次核对。 |

### 回答交付失败的归属

**M3**：完整工具stdout的两行使用 `%g` 科学计数法（`1.51603e+06`、`1.28051e+06`），不能作为无损的精确十进制库存值。现有解析器拒绝这类输出。模型随后修了sandbox缓存，但只打印预览，未重新打印完整修正后的带列名交付；因此原失败不清除。最后回答承认库存未验证，原生仍为 `inventory-scope-mismatch`。这不是证据支持的平台BOM数据错误，也没有证据证明 guard 把一份合法完整交付误拒。后续插件侧可约束精确数值格式，并避免结构题擅自扩展库存；本轮没有弱化校验来取得通过。

**M5**：工具按错误字段查询得到0，模型把这个空集错误推广到该产品的销售订单。独立 REST 按正确字段稳定得到40行。证据支持模型/插件托管会话的实体识别与回答可靠性问题，不支持平台漏数据。当前一致性校验并非通用语义校验，未拦截该错误回答。需要单独修复并复测原题；不能把改题后的成功当原题修复。

平台深度5库存能力及部分 run_code 调用仍超时；平台 #2029 仍 OPEN。深层超时和大结果落库问题分列，未建立两者因果，未修改平台。

### G6事实判定与原生交付分开

同一固定包前轮的标准交期、完整BOM库存、缺失物料三题各通过，原证据在 [前轮报告](../answer-fidelity-20261006/RESULTS.md)，本轮没有重跑或覆写。新增七个场景中，**五个满足交付门槛、两个失败**。

冻结评测集的事实/禁止项单独评分为 **9/10，1项not-run**：BOM结构的313个结构元组均可对应独立 ERP 行，因此其结构事实成立；该计分不包含原生完成要求。综合原生交付，当前 **8/10可接受、2项失败、1项未测**。两份判定见 `g6-fact-results.md` 与 `acceptance-verdict.json`，不得把事实9/10宣称为发布门禁通过。Token/断网场景的预期错误终态属于正确行为。

独立 CLI REST 前后五个数据集的全部返回行一致：40订单、36库存、PR0、PO0、原始ERP BOM507。这只证明查询范围未漂移，不证明整个平台无写入。`oracle-before-after-comparison.json` 保留各数据集的分页完成检查。原始ERP、替代料及已发布 main_only 口径不能混用；`exploratory-*` 派生文件和333物料库存superset仅供范围调查，不作为 main_only 完整性oracle。

### 自动续期的精确边界

CLI 0.1.5 的 token authority 在 expiry未知或距到期小于60秒时可自动刷新。插件的实际 turn-start 调用触发了这条路径，本轮实测成立。`AuthCoordinator.status()` 对已知 `expired=true` 会先返回 authentication-required，这与“临近到期自动续期存在”是不同边界。没有等待自然到期、模拟服务端TTL、撤销账号、或证明所有已过期登录自动恢复。原先笼统的“没有自动续期实现”应撤回；“自然失效后无需人工恢复”也未获验证。

### 来源与平台证据完整性

实际图中的销售订单对象对应 `op_57c4415465e573798ef3f8f6bacdad5b/search_schema`，签约数量对应 `op_dc47dbc7d609ca4fede4cfb0768198e8/query_object_instance`；来源网络均为 `supply_ontology_hand`，与逐元素 Trace 引用一致。平台revision另披露 `evidence_durability_failed` / 一条 `receipt_not_durable`。不能把UI可以打开解释为平台证据全部闭合，亦未证明它必然就是 #2029。

本轮 live guard 使用固定tgz解包、官方npm core、实际平台与两个授权网络，**16/16通过**；平台只记录允许的 `search_capabilities`。首次直接导入Host安装包因独立进程缺peer解析而退出，未计运行；随后用任务目录的解包与官方peer依赖完成。真实guard、native模型、scripted fixture分别记录。

两个UI选中元素与实际Operation/Trace边的逐项投影见 `real-provenance-check.json`；六个owned Host root、23条所记录进程树项及三个CLI登录PID的结束态见 `owned-pids-summary.json` / `.md`。主线CI与Windows前置复核原记录由本机review下载目录逐字节复制至 `preflight-review/`，保留原run/commit日期，不冒充本轮重新运行。

### 准备偏差与操作观察

- 旧隔离安装只匹配33/66；所有runtime JS匹配但缺声明/LICENSE。完整移除重装后66/66，原因未归属。
- 插件管理的正常CLI登录曾exit2；未观察到浏览器授权页，原因未知。独立官方CLI正常设备授权由用户完成，不据此声称插件登录启动缺陷已修。
- 断网fixture初次错误使用带padding的Base64目录，CLI未找到虚构凭据；该轮仅是工具未注册对照，不计网络场景。修成SDK要求的Base64URL无padding，正式轮才实际连接失败。两轮都保留。
- Native保存对话框后出现AX与截图不一致；重启后继续。未确定是Host还是操作工具，不归类成插件缺陷。Browser download event超时不等于产品没有下载，另以实际原件确认。
- 第二网络工作区目录选择未取得完成证据；不以按钮点击代替绑定/跨网UI通过。

## 实际产品下载

登录后的 npm 报告：`/Users/kalias/Downloads/OpenBKN-diagnostic-20261006T210621043Z-965afa11.json`，2440 bytes，SHA `1ce39c8204046dfe11413c527fa855878ef8dfbedadb22d162ca7af2980d93f3`。

网络故障 Desktop 报告：`/Users/kalias/Downloads/OpenBKN-diagnostic-20261006T210106309Z-fac42410.json`，2217 bytes，SHA `b19de292a76295a3749252c1426787bbdb27a0d31d34f61a89f57b328e2fb179`。

两个未登录 npm 产品下载、一次managed登录失败产品下载亦保留，各有原件路径与SHA。报告实际下载、UI、会话导出和直接REST分别命名；没有用RPC合成产品原件。

五份实际产品原件与证据副本的逐字节比较见 `product-originals-consistency.json`，没有换行归一。目录文件SHA清单见 `evidence-index.json`；提交时与Git blob的比较另存 `git-evidence-consistency.json`。构建器没有再次运行；收尾只核验原tgz、16个声明引用（含package.json自引用、对应14个不同文件）与两形态最终安装的66/66。当前npm dist-tag仍为latest=-3/rc=-4，平台#2029仍OPEN，读取原生结果见 `registry-and-platform-issue-status.json`。

两份原始UI语义文本与一份原生gh run JSON自带行尾空白/额外终止换行；本目录 `.gitattributes` 仅对这三份取证文件保留原字节并禁用whitespace格式警告。产品报告、源码及其他文档不豁免；派生评分Markdown的末尾空行已规范化。原始回答、UI像素、工具stdout和平台JSON未改写为通过。

## 发布边界

[剩余事项及暂不处理理由](../../handoff/2026-10-07-unified7-final-verification/REMAINING-DECISIONS.md)。本轮可运行部分已经测完并清理，不保留测试进程等待用户决定。Windows新补证仍待执行回传；用户受限账号和原故障机器仍不可用。固定kit内manifest代表交付时点，保持不可变；当前事实见本目录 `current-acceptance-manifest.json`，不能改kit文件破坏其哈希。

**后续建议先修 M3/M5，并由PR评审、新CI包与受影响Windows复测闭合；目前仅交付验证结果和修复依据，等待用户决定。** 不将未完成的完整DIAG-01、主动探测、平台性能或授权验收写成已完成。
