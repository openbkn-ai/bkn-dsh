# 50.28 原文未披露：本机只读 RCA 回执

记录时间：2026-11-03。范围为部署、配置装配、现有 OpenSearch 索引与目标 Interaction 的元数据；未读取正文、Secret 值或 DSN，未改变平台、插件或模型输出。

## 结论

已证：在本轮只读查询身份及其可见范围内，对当前配置的 artifact 物理索引查询目标 Interaction，返回 0 条；本轮可见的 bkn-trace* 索引清单中只有这一份 artifact 索引。目标投影记录存在，不能用它或 closure answer 引用代替原文。

按固定 Core 81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b 的已审源码，Interaction Summary 的 q/r 原文引用在运行时由合格的 question/result artifact 生成，投影回退仍查询同一 artifact store。本轮查询看不到合格记录；若运行代码、实际服务指向及可见范围与此路径一致，则该路径没有可用记录生成原文引用。这是查询事实与有条件的源码解释，不能宣称原文曾被删除、从未存在或所有权限问题均已排除；实际部署镜像尚未定位到源码 commit。

## 当前运行链

- 192.168.50.28 当前为本机 interface；kind-bkn-dev 使用 https://127.0.0.1:63845，TLS 校验开启且 CA 已配置。
- 本机 kind 节点发布 80/443；Ingress 的 observability 路由 → agent-observability:8080 → Ready Pod agent-observability-744966dccb-7rkqr。
- 实际 EE 镜像标签 0.2.0，imageID sha256:716cea21364e5030096675a3d55be17a77fbab9548099620263883b98e5c1fe3。Pod 启动 2026-11-03T02:56:56Z，重启 0。
- 现有 containerd 缓存中的 arm64 image config 创建于 2026-10-16T07:14:54.742425072Z；入口 /app/agent-observability；无 OCI build/source/revision labels。未拉取镜像、未运行主程序。
- evidence store=opensearch；core store=mariadb，使用 Secret bkn-trace-core-mariadb 的 dsn 引用但未读值；projection=true；historical provenance=false。后者不等于原文读取开关。

## 目标与索引证据

目标 I：int_3e92559bb0fbe9e5f83c110ce7ca3100；目标 C：conv_9360664929df807edc5797d4190fa239。

- evidence 配置为 bkn-trace-evidence-v2，3340 docs，创建 2026-09-23T05:47:03.286Z。
- artifact 物理索引 bkn-trace-evidence-v2-artifacts，20 docs，创建 2026-11-03T03:46:26.335Z；无 alias；现有 mapping 的 interaction_id/artifact_type 为 keyword。
- GET 原生 _search，term interaction_id=目标 I，size=25，track_total_hits=true，_source 仅元数据白名单：HTTP 200，total=0(eq)。经现有 Kube 权限建立 localhost port-forward，请求未携带 Authorization header；OpenSearch 有效 principal 未核实。查询未加入应用 scope 过滤，但服务自身的 DLS/FLS 或其他可见性约束仍 UNKNOWN。应用 OPENSEARCH_AUTH_ENABLED=false 不等于已证服务端 security plugin 关闭。
- 此结果只证明本查询身份可见范围内，该索引的目标 I 精确匹配为 0，不等于“当前 Summary 的实际 ref 已按 docID 查证不存在”，也不等于物理索引绝对无此记录。正式 Summary q/r ref 实值未读取，其 presence/可解析性保留 UNKNOWN；类型和 owner 匹配也因无命中对象保留 UNKNOWN。
- 当前 bkn-trace-core alias → bkn-trace-core-history-18e46c52e70bc3bd（创建 2026-11-03T03:47:34.922Z）。目标 I 的 21/21 投影 docs 已在 size=32 的有界元数据查询中取齐；包含 6 receipts、7 ledger events、1 closure、6 operation/interaction 类与 1 其他。
- 6 receipts 均 completed/durable，owner 一致，artifact_refs 均空。closure answer ref 存在，但不是 Summary.ResultArtifactRef，未读取或公开 ref 值。
- 一次 bkn-trace* metadata 清单在本身份可见范围内共 5 个索引：当前 evidence、唯一可见 artifacts、3 个 core 历史/旧版本索引。未发现额外旧 artifact 候选索引；不从旧 core 投影拼造正文。
- 两个新索引创建时间相近，不足以证明索引切换、数据删除或遗漏迁移的因果关系。

## 升级前本地备份回执

本节集成 /root/platform021_mcp_delta 的独立只读 streaming 回执；本 ops 任务未重复读取备份正文。

- 文件：/Users/kalias/Documents/project/app/openBKN/platform-local-recovery/backup-20261103-pre020/artifacts-015-backup.ndjson；413343949 bytes，mtime 2026-11-03T11:34:22+08。
- 7062 个非空 flat artifact JSON 行，0 解析错误；目标 I 精确匹配 2 条、2 个不同 artifact ID，类型 question/result 各 1 条。
- 两条均 schema_version=2.2.0，interaction_id 匹配目标、operation_id 缺省或空；artifact/request/trace ID 及 content_hash 字段均存在，未输出值或验证 content_hash 正确性。
- content_json 为 JSON 字符串，私有进程解码后都是完整非空 string；UTF-8 字节数分别为 question=147、result=2852，去空白后长度不变。没有输出或保存正文预览、实际引用或 scope 值。
- 两条 account/effective-subject/application-principal metadata 均存在，knowledge-network 列表为空；符合 terminal artifact 的基础元数据条件。但该备份目标 I 没有 operation artifacts，request/link-role 及当前实际 Summary ref 的对应关系尚未全验；未与当前正文比较。
- 原备份前后 stat 和私有完整性核对一致，未改写、导入或恢复。
- /Users/kalias/Documents/project/app/openBKN/platform-local-recovery/README.md:116–127 的既有升级记录记载备份 7062 条、旧格式转换冲突、随后删除 artifact 索引并重跑迁移重建。这是文档记录；结合备份早于当前索引创建约 12 分钟，支持“迁移/重建后目标原文未在当前查询上下文中恢复可见”的候选解释，尚不等于已核完整审计链或排除权限/配置差异。

## 原文读取与配置语义

固定 Core 81d 的 summary.go1432–1504、2118–2146 表明 Summary 由 projection 动态聚合，不存在可由 I 直接猜出的 persisted summary 文档。evidencevo/summary.go474–500、637–638 要求 artifact_type=question/result、interaction_id 非空、operation_id 为空，并且还需 request/link-role 匹配；I 非空并非充分条件。projection-only receipt 数据不会自行提供原文；GetArtifactForInteraction 的 projection fallback 最终仍访问相同 -artifacts store。

BKN_TRACE_EVIDENCE_INITIAL_STATE=disabled 是首次持久 capture policy bootstrap 的 seed。src/conf/core.go129–134 验证 enum；bootstrap.go736 调用 EnsureControlState；capture_policy_control.go19–35 对已有 singleton 直接保留当前状态。它不是已安装平台当前 effective state，也不是历史 GetArtifact 读取开关，因此不能据此认定旧原文缺失。未读取当前 DB policy 状态。

## 日志与尚未定位的部署源码

近 5 小时容器 stdout/stderr 日志读取为 0 行。Deployment 无显式 command/args、volume 或 volumeMount，仅见 BKN_TRACE_LOG_LEVEL=info 及 OPENSEARCH_LOG_INDEX 的配置 presence。固定源码保持 Go 标准 logger，未发现应用日志文件路径配置；实际镜像的日志运行方式和 source commit 仍 UNKNOWN。零日志不作为读取成功、没有错误或权限正确的证据。

## 最小后续与恢复边界

1. 若要把源码分支解释升级为当前镜像的确定结论，需要平台构建/发布记录把已运行 digest 对应到 Core/EE commit；现有镜像 labels 不足。可由构建方提供 SBOM/构建回执，不需要重启服务。
2. 若验收要求原会话原文可见，已找到含目标 question/result 的升级前备份候选。应由平台所有者先核验其权威性、真实 artifact ID、I/owner/request/link-role、格式兼容及官方导入规则，并确认当前服务端可见范围；当前有界清单未发现另一份可直接切换的 artifact 索引。
3. 只有在权威来源确实存在、备份和恢复范围可审核后，才由平台所有者选择官方恢复/导入流程；本轮不执行写入，不改 alias/config，不重新生成问答，不用 preview/closure/模型结果填补原文。没有权威来源时如实保留 content unavailable，并由验收负责人决定改用新隔离记录是否另行授权。
4. 当前存储缺席解释不依赖 DB SELECT 或 Pod exec；若需进一步区分 DB canonical/ref 状态或二进制版本，必须单独限定只读命令并先协调授权。

## 操作边界

所有 OpenSearch 请求为原生 GET metadata/search；未调用会 EnsureIndex/PUT mapping 的应用 artifact GET。未读取 content/content_json、问答预览、正文或其 hash。Kube service proxy 的部分 metadata 路径返回 generic BadRequest，随后使用任务拥有的 127.0.0.1 临时 port-forward，3 个进程均已关闭且有 PID/时间回执。无 Pod exec、DB SELECT、Secret 读取、迁移、解释、模型调用或资源修改。
