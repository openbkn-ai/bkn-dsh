# 50.28 原文读取与 Mac S1–S3 前提恢复

2026-11-04 纠偏：此前把“原Mac样本迁移受阻”扩大为“Mac三项必须等平台恢复”不充分。Windows实际成功补测使用另一条会话，其第2轮不在此前Mac原记录加3个候选的检查范围内。现已安排Mac优先只读核验该真实Windows样本，并查合法DSH入口；不能因原样本失败而断定Mac或平台不支持展示验收，也不把#82关闭作为三项测试的默认前置。原样本迁移修复继续独立跟踪，不补造记录、不改原绑定，S1–S3在实际执行前保持NOT_RUN。

后续已核收完整[Mac限定UI补证](./MAC-SOURCE-TEXT-CLOSEOUT.zh.md)：Windows真实样本在MacReader200、原文非空后，经官方原生会话副本恢复完成S1、S3四键盘路径及S2左padding。仅本地header.cwd适配，264原事件原始行不变；精确DOM/AX命中及arrow未测。原Mac样本迁移缺陷和#82继续独立，不能再作为全部Mac测试停止条件。

2026-11-04：维护者授权先向平台仓库上报，已创建 [openbkn-deploy #82](https://github.com/openbkn-ai/openbkn-deploy/issues/82)，关联 #36，并沿用 #36/#35 的既有指派 `leecky`、`lbb1656`。英文正文经独立脱敏/证据边界复核，已回读核对正文、open状态与两位assignees；未公开业务原文、真实资源ID、平台地址、内容hash或凭据。本次上报没有开始平台迁移器代码修复或共享数据恢复，CI6包保持原字节/SHA，S1–S3及正式CLI安装状态不变。

2026-11-03，接续维护者“先查清原文未披露原因、解决原生鼠标权限、只补 S1–S3”的要求。现有 CI6 包、平台和模型输出均未修改；正式 CLI0.2.1 安装保留待验，本轮未重查 registry 或安装。

**原Mac样本调查结论：**其原文未披露与历史迁移未闭合的具体证据链保留，尚未恢复该原样本；不能绕过平台校验临时补两条artifact。Mac输入路径已恢复，SourceText专项随后用另一条真实会话完成限定补证，不再保持三项整体NOT_RUN。

## 现场与备份事实

- 本机现有 `kind-bkn-dev/openbkn` 只读运维入口已确认到 50.28 的真实 Ingress、Service 和 Ready EE Pod。实际镜像标签0.2.0、digest `716cea21364e5030096675a3d55be17a77fbab9548099620263883b98e5c1fe3`；缓存镜像没有源码 revision labels，不能当作已锁定 Core/EE commit。
- 当前配置 `bkn-trace-evidence-v2-artifacts` 创建于 `2026-11-03T03:46:26.335Z`，有20条文档。本轮查询身份可见范围内，目标 I 精确查询为0；按备份中的两条真实 artifact ID 分别查询，均404/found=false。没有核实服务端 principal、DLS/FLS，不能扩大为物理删除已经证明。
- 当前目标投影21条已取齐，含6条 completed/durable receipts。备份两条原 artifact 的 owner 均与这6条匹配；request/trace 均0/6匹配，原 trace 当前也未命中。原 request/trace 不同本身不是错误：固定 Core81d 的正式 projection 算法允许同 I、无 operation 的 terminal artifact 在内存关联到 receipt traces 并生成正确角色，不需要插件改关联，也不需要补造旧 Trace 或改 receipt/closure。
- 升级前 `backup-20261103-pre020/artifacts-015-backup.ndjson` 原文件仍在，413343949字节。私有 streaming 解析7062条/0解析错误，目标 I 精确命中 question/result 各1条，operation ID为空；`content_json` 解码为非空字符串，UTF8长度147/2852。两条原标量内容与各自 stored content_hash 均匹配；包装为 `{text:...}` 会改变哈希，不能为绕过冲突随意转换。
- 哈希自洽和长度一致不证明原始问答从未截断，也未与 Mac 历史正文逐字比较。阶段3原件中“完整非空 string”的“完整”表述由阶段4明确勘误，原件保留。
- `BKN_TRACE_EVIDENCE_INITIAL_STATE=disabled` 仅是首次持久策略初始化值，不是当前 effective policy，也不限制历史 artifact GET；本轮未改变该配置。

只读现场原件见[阶段3回执](./ee028-readonly-rca/PHASE3-RCA.zh.md)、[阶段4预检](./ee028-readonly-rca/PHASE4-RECOVERY-PREFLIGHT.zh.md)及各自 manifest。17份公共文件从任务目录按原 bytes/SHA复制，两阶段经独立复核；阶段3的一处措辞已在阶段4勘误，无新增 P1/P2。私有 ID/owner 交接、正文和备份不入库。

## 已定位的目标级迁移问题

本机既有升级记录 `platform-local-recovery/README.md:116–125` 记载：旧 artifact 契约冲突后，先全量备份，再删索引、重跑迁移并按0.2.0契约重建。这是已有操作记录，不等于本轮重新执行或完整操作审计。

最终 run `run-20261103T033431-b1a890df` 状态为 `partial_requires_reconciliation`：32915源记录、32822 verified、93 retained；另有106个 Core Interaction groups被跳过。目标 I 精确命中 `batches/00000052/skipped-core-interactions.json` 第24项：

| 字段 | 记录值 |
| --- | --- |
| reason | `native_core_preflight_rejected` |
| failure_stage | `call_facts` |
| aggregate/stage/unit native preflight | 均为 `native_core_import_failed_input`、`verified=false` |
| 更细错误字段 | 现有 native_response 未披露 |
| 目标组规模 | 1 conversation、1 interaction、6 operations、6 receipts、6 call_facts、1 assembly revision、1 idempotency |

相邻 `skipped-core-dependencies.json` 明确列入目标 I。其4条 artifact排除数量是整批计划范围，不能说全部4条或备份中的2条都属于目标，也不能把“从导入计划排除”说成执行了存储删除。已对最终54批允许的 skipped/retained/final/identity清单私有比对，未找到两条原 artifact ID 的具体执行状态。

因此已形成“原备份存在 → 操作记录记载删除重建 → 目标组迁移预检拒绝及依赖排除 → 当前查询未见原 artifact”的具体线索链。**两条原 artifact 的逐条排除执行审计及实际native校验器的字段级报错仍未闭合；不能宣布完整唯一运行时RCA或插件故障。** 下节给出实际目标输入支持的静态字段定位。

## 已定位的 call_facts 输入契约缺口

沿本 run 既有引用索引与 offset，仅在私有进程完整读取目标6条call facts：6/6的 `output_payload` 外层都带 `_trace_evidence_completion` 对象，它不在 `inline` 业务JSON内。当前 `openbkn-deploy` 固定对照为 `v0.2.0 / 4339b846c39a40dfe627594dfb64d5ec79255bb1`，脚本无tracked修改，manifest格式相符；历史run未记录脚本摘要，不能说执行时版本已锁定。

- deploy `scripts/upgrades/0.2.0/historical_trace_data/core_history.py:138–145` 仅JSON解码后将 output原样内嵌到原生输入。
- 固定Core81d的 `PayloadEnvelope` 不声明该reserved字段，也无自定义 `UnmarshalJSON`；`cmd/historical-data-validate/core_import.go:63–69` 严格Decode会在进入prepareCorePlan前拒绝。此阶段对应 `native_core_import_failed_input`，不能据此声称业务payload损坏、DB故障或导入冲突。
- 平台本已有合法storage codec：`sessionstore/terminal_payload_codec.go:17–59` 保存并验证该控制metadata，解码后分别返回纯 `PayloadEnvelope` 与 `EvidenceCompletion`；`store.go:1902/1911` 归位到CallFact.Output/Error及合法顶层 `evidence_completion`。正确方向是迁移器复用这套语义，完整保留业务输出和控制metadata，不是删除字段或重写回答。
- 固定deploy `loop_upgrade.py:260,450–456` 会在拒绝Interaction后，把结构引用该I的依赖artifact排除出导入计划，与目标级清单一致；两条原artifact的逐ID执行审计仍未补齐。

这是有实际目标输入支持、并经独立源码复核的**静态mapping缺口**，与现有失败记录吻合。实际Pod校验器源码pin仍UNKNOWN；没有运行来源不明的本地二进制，也未新编译平台，故不称唯一运行时原因已重现。固定Core81d源码中的 `--validate-core-records` 分支可纯离线校验；对应本地二进制身份与实际执行仍待核实。真实Python runner包装器会Pod exec，不能把后者当离线入口。脱敏结构化结果见[输入边界](./CALL-FACTS-INPUT-BOUNDARY.json)。

## Mac 输入路径与三项验收

维护者已对 `OpenBKN CI6 Pointer Helper` 的权限授予作执行时具名确认，远程用户已开启该开关，代理没有点击权限开关。两份[Mac公共原件](./mac-rc5/MAC-CI6-NATIVE-POINTER-PERMISSION.zh.md)已从实际native命令stdout恢复gzip/base64，核原bytes/SHA；见[核收清单](./POINTER-INTAKE.json)。固定 helper 通过 LaunchServices启动，辅助功能开关为on，`postEventAccess=true`、`accessibilityTrusted=true`；原生无按键 `mouseMoved` 从 `(1096.51,1065.41)` 到 `(462,56)`，32个鼠标键前后均抬起，系统设置前台出现真实 hover；随后还原指针位置。实际位置以CoreGraphics测量为准，独立可见OS光标glyph移动未另采。系统密码/Touch ID 是否在用户操作期间弹出未被代理观察到，保留UNKNOWN，不称出现过或被绕过。该证据仅证明输入路径，不替代DSH窗口坐标或下列动作。

固定helper已退出、无网络服务，七项包/Host/会话/绑定摘要保持。本轮观察到非目标应用权限开关状态差异，归属未观察，代理未操作或回退；具体只留私有证据，因此不扩大为全机权限未变。

| 项 | 当前状态 |
| --- | --- |
| S1：原文正文覆盖自身trigger、Escape后约1s/3s不重开 | 新真实会话在Mac已核收，1.378s/3.080s采样通过；原样本旧NOT_RUN仍保留历史。 |
| S2：padding/arrow实际重叠路径 | 左padding在1920×820下取得限定原生证据；截图估计矩形，精确命中未知，arrow未单测。 |
| S3：输入/输出键盘激活、Escape回焦点、首次真实hover重开 | Enter/Space共四条稳定路径通过，400ms采样；早期相反观察保留。 |
| 正式 CLI0.2.1 安装 | 按维护者要求保留待验，本轮不执行。 |

## 下一步边界

下一阶段需平台迁移 owner固定实际runner/native validator来源，按上述storage codec语义修复目标输入转换，再做私有纯离线预检并确定无损依赖恢复范围。现有迁移回执不能直接等同固定Core81d的同一工具版本。阶段4的“两条artifact最小候选”只是静态依赖推演；目标组正式预检拒绝既已找到，不能跳过这道校验只补两条。保留原ID、owner、request/trace、原标量内容与哈希；具体范围见[后续修复计划](./PLATFORM-RECOVERY-PLAN.zh.md)。

`--import-artifact-records` 是真实写入＋回读，预读也可能 EnsureIndex/更新mapping，没有 dry-run；旧 OpenSearch NDJSON不能直接作为原生导入计划。不能把 `run_upgrade.py --dry-run/--help` 当只读命令。共享平台写入前必须有具体可审阅方案及授权；本轮没有执行导入、PUT/bulk、删索引、改alias/config、重启、DB写或模型调用。

原样本合法恢复后仍须平台独立读回验证；MacSourceText专项已用真实Windows会话副本按限定范围核收，不因#82处理而默认重跑。现有129/Windows/安装/查询/CSV通过项、平台和模型输出不改；正式CLI安装与发布流程继续单独待办。
