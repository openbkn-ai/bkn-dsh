# 原生回答边界修正：固定 CI 包实机结果

**插件边界修正完成，发布验收尚未放行。** 新包移除终答硬校验和自动纠错后，5 道原题都原生完成、零插件纠错通知；完整 BOM 题只交付 9 项一级料，仍未通过全量覆盖评测。保留模型原始答案和平台错误，不在插件里补业务计算、报表格式或通用裁判。

## 固定身份与源码评审

| 项 | 本轮输入与证据 |
|---|---|
| Source | `2813f3ad3e175d94ee747a796f638cc8d1f3e712`（PR [#74](https://github.com/openbkn-ai/bkn-dsh/pull/74) 合入 main） |
| Approval | 最终源码头 `f499669a629503ef245fece562ff9f47e99e96a5` 独立 APPROVED；见 `source-pr-review.json`。先前 head 的批准不替代最终批准 |
| CI | [37562531405](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37562531405)，main，build-only；npm Publish 与 GitHub Release 均 skipped |
| tgz | `0.2.0-rc.2-openbkn.0.2.0-7` / SHA `3c345ef643589fbf79f4958598d4345544c632feac2a3b4f859403db1125b8f0` / 165176 bytes / 65 files |
| CI artifact ZIP | id `11457640383` / SHA `5a542ef9eb61d66fdfddd20f7176e11187cbdcf1ace8cb848dfd77c024319151`；与 Windows kit ZIP 是不同归档 |
| Local vs CI | 解压后的 tar 逐字节相同、65 文件内容相同；tgz 仅 gzip header 的 offset 9 不同，故压缩文件 SHA 不同。Windows 唯一候选是 CI 原件，不混用本地包 |
| Registry | 2026-10-07T02:53:18Z 检查：latest=-3 / rc=-4，-7 未在 registry；见 `registry-status.json`。本轮未 publish/tag/dist-tag |

删除 `answer-fidelity.ts`、旧通知注入、自动修复回合、强制 BOM 格式/库存标记和一致性 turn rejection；保留认证、绑定网络/工具白名单、Interaction 同步状态迁移、诊断与溯源。政策仅保留字段定义、用户范围、分页/缺失说明及已知接口限制。边界已写入本仓库 `AGENTS.md` 与 `CLAUDE.md`，未新增运行模式开关、业务计算器或导出子系统。

源码本地验证：typecheck/package:check/diff-check exit 0；插件 314（313 pass、0 fail、1 skip）；repo/Node eval 63/63、Python eval 11/11；官方 npm 核心原生输出探针 8/8。Node 最终显式固定 24.19.0，先前错误使用 Node 23 的结果已重跑并保留修正说明。CI 完成同工作流的测试、构建、打包审计。

上游检查：官方平台 fresh tools/list 28 项，与旧目录的 input/output schema 无变化；DSH 支持基线仍为 0.2.0-rc.2，未因最新上游版本而擅自换 pin。详见 `upstream-contract-check.json`。

## Mac：实际加载与产品操作

官方 `/Applications/DeepSeek Harness.app` 0.2.0-rc.2，应用内 Node 24.18.1 / pnpm 11.7.0；安装使用**应用自带 CLI**管理隔离 desktop profile。隔离 home 为 `/private/var/folders/9r/1zks6bqd7f3dtwybvxsksbc40000gn/T/openbkn-diag-ui-h76__jwb/desktop-home`；CLI 0.1.5 使用原已授权的独立 `bkn-config`，测试平台 `https://192.168.50.28`。未改 Host、未开 inspector、未复制日常凭据。

先完整 remove、再装 CI tgz，两条命令 exit 0。安装目录 65/65 匹配，missing/diff/extra 均空；凭据与 patch 的卸载前、卸载后紧邻、重装后哈希一致。安装器有 peer warning，实际 Host 启动及以下测试正常；未把 warning 写成无告警安装。证据为 `mac-installation.json`、`mac-installed-identity.json`、`mac-process.json`。

真实 UI 经侧栏 OpenBKN → 面板右上角“诊断”打开，点击产品导出按钮、原生 Save 对话框保存报告 `2bef889e`。7 项均 pass：bootstrap/business/diagnostics、CLI/login-state/context-loader/network-list；这是这些被动检查点的结论，不代表所有业务能力调用成功。诊断仍明确 Host 与已加载插件版本 unknown；实际身份另由应用版本、进程/profile 与 65 文件核验确认。

下载原件：`/Users/kalias/Downloads/OpenBKN-diagnostic-20261007T025010099Z-2bef889e.json`。SHA `7f45416df1725e227ea967d201526d9cb870966f720f7bd41bc6865aab57073a`；证据副本 `desktop-product-2bef889e.json` 与原件逐字节相同，见 `product-download.json`。不是 API 代取。UI 见 `mac-diagnostics-ui.png`。

## 真实模型：执行与事实分列

全部使用隔离 Desktop、全新 Standard 会话、绑定 `supply_ontology_hand`、用户原已配置的 **DeepSeek-V41-Flash / High**。题目与 `docs/eval/supply-ontology.yaml` 原文一致，没有将预期答案喂给模型。

| 原题 | Native turn | 独立事实 / 覆盖范围 |
|---|---|---|
| `382-000005 的 BOM 构成是什么？` | completed、零纠错通知 | L1 的 9 项编码/名称/单耗、物理 ERP 的各层统计核对一致；313/272/5 来自原始已发布函数 summary，未当作物理 ERP 同口径证明。模型对 313 与 400 差异的原因解释、回退“口径一致”说法未证实。明确省略 L3–L5，不声称 313 行全量通过 |
| `列出 382-000005 的销售订单明细。` | completed、零纠错通知 | 40 行展示的 9 个字段逐行匹配独立 REST 数据；全部已确认、签约合计 1081、发货合计 1066。模型按 product_code 找到数据，不再以错误字段的零行结果结束 |
| `382-000005 的标准交期？` | completed、零纠错通知 | 独立 material 查询：自制、product_fixedleadtime=1；答案明确生产提前期和天单位，核对通过 |
| `物料 999-999999 的库存和订单情况？` | completed、零纠错通知 | 独立精确物料/库存/销售订单过滤均零行，核心无此物料结论一致；模型附带的全局前缀计数未独立重数，“看起来不是合法编码”不能接受为平台规则 |
| `查询 382-000005 的 BOM 清单，每个物料的使用量，以及每个物料的库存情况` | completed、零纠错通知 | 9 项 L1 的名称/单耗、披露仓范围的可用库存与全仓值均匹配独立 ERP；**全量覆盖未通过**：没有交付 L2–L5 / 全部 313 条 / 272 个物料。模型仅取 depth=1 并提供继续展开，不由插件追加纠错 |

每题 `.json` 保存脱敏工具调用/结果、所有文本消息、最终答案与 turn/end；`.md` 只取最终交付，未将中间消息拼成完整答案。导出器的 `answerAttempts` 是历史所有文本消息计数，不是“插件纠错次数”。事实核对见各题 `*-independent-check.json`，保留失败及未证实结论，不给“G6 全通过”的结论。

BOM 构成题的 depth=5/full 已发布能力发生一次 `Request timed out`；平台错误保持原样，模型在绑定网络内查询物理 BOM 作为回退。还尝试了两个被本版明确排除的 `run_cypher`，均被 guard 拒绝，原始拒绝文本保留。首次 `bash pwd` 同样被 bound-session guard 拒绝，没有执行成功。这些均不归成插件终答校验失败；超时原因未证明是平台 #2029。

独立 REST before/after 比较 orders、inventory、purchase-orders、purchase-requests、bom 的完整业务行相同。请求延时/JSON 排列变化不拿来判断业务数据变化；该结论不覆盖 Interaction/操作日志等正常追踪写入。针对 L1 库存仅查询实际披露的 9 项，不重新抓取无关的所有库存。

## 官方核心与 live guard

固定 CI 65 文件经 standalone peer bridge 核验再执行 `native-output-runtime.probe.mjs`，全新目录、prepare 的 probePackage 与实际 --plugin 一致，8/8 显式 pass。脚本模型刻意错误也原样交付，只证明输出边界，不证明事实正确；平台错误、跨网络/未启动/排除工具拒绝及未绑定会话均覆盖。见 `ci-native-*`。

另对相同 CI 文件副本、官方 npm DSH ToolRuntime、真实平台及隔离 CLI 运行 live guard：16/16，平台操作只记录允许的 search_capabilities。见 `ci-live-guard.jsonl` 与 execution 元数据。没有用模型自觉遵守提示证明 guard，也不拿此替代真实无权限账号验收。

## 收态与执行偏差

隔离 Desktop 主/子进程 5 个均记录 PID、创建时间、应用路径、home；结束采用原生 Quit，全部 PID 消失、127.0.0.1:19387 已释放。原始 Host 日志保持私有，未回传。所选日常/保护文件 9 项候选验收前后内容哈希一致；其中不存在的文件也验证未新建。此清单有限，不能证明整个 home 或共享 Electron 偏好完全未变。

测试前 CUA app selection 意外启动默认 profile，Quit 后一次 AX 观察又将应用重新打开；未发送问题/调用模型，均在安装前停止。该偏差保留于 `execution-deviations.json`；日常 before 哈希是在偏差后、候选验收前采集，**不补造偏差前保护证明**。此后仅在明确隔离启动后连接 CUA，Quit 后不再读取 AX。另一次安装准备使用 npm CLI 被官方正确拒绝 desktop profile（exit 1，无安装写入），随后改用应用自带 CLI，未修改官方程序绕过规则。

## 仍开放与下一步

- 新 CI 包的 Windows N0–N6 受影响复测，包含新 verifier/8 项 probe 的原生执行；旧 66 文件包的 A 批结果不接受新包。固定交接另见 `docs/handoff/2026-10-07-native-output/`。
- 完整 BOM 问答覆盖仍未通过，BOM 口径差异原因尚未证实。它们属于独立质量评测；本轮没有借插件裁判或重复平台算法来改成通过。若发布需要全量问答验收，仍需另处理平台能力/模型取数交付问题。
- 新 SHA 没重跑全部其余 G6、Windows 真实登录/模型/live guard、真实受限账号；没有凭据的项目照实 not-run。旧证据按旧 SHA 保留，不自动移植通过状态。
- 深层能力超时、平台 #2029、run_code 内部调用不受外层 kn_id guard、自动续期、混合网络真实 UI、历史客户启动根因及主动探测继续保持各自原有边界。本轮没有跨界实现。

仅交付一个尚未发布的统一 -7。新 Windows 复测和剩余质量/发布门禁完成情况由用户确认后，才讨论正式发布。
