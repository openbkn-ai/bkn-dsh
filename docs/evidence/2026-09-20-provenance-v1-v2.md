# 业务溯源分层重构：V1/V2 验证记录

日期：2026-09-20。环境：本机 kind-bkn-dev 集群（https://192.168.50.28），OpenBKN 0.1.4，企业版 license 有效（`capabilities`：`licensed:true, edition:enterprise, state:valid, features 含 business_provenance`）。测试账号：admin（CLI 凭证）。interaction 样本：M5 时期的 `int_dc0e24ec…`（标准交期问题）。

按方案第 2 节执行；本文只记录状态码、错误码、`required_action` 与**字段名清单**，不含任何业务数据或原始载荷。

> **修订记录**：初版 V1 结论把门描述为「域授权记录（DB）」，且未隔离「升级企业版脚本」变量。本版依据 **bkn-foundry v0.1.4 tag 源码**（与线上镜像同版本）逐行核实后改写：门是 **chart 出厂的静态允许清单**，与 license 无关、与升级脚本无关；初版对 M5 时期 403 的「需管理面授权 bd_public」表述属沿用旧误诊，一并澄清。

## V1：observability 读路由的门——既不是 License，也不是升级脚本，是部署配置的域允许清单

### 实测矩阵（同前，未变）

对同一 interaction 的 `GET /api/agent-observability/v1/interactions/{id}/operations` 与 `.../business-graph`：

| # | 部署形态 | domain 头 | 结果 |
| --- | --- | --- | --- |
| 1 | 企业版镜像 | `bd_public`（已授权） | 200，operations/business-graph 均完整返回 |
| 2 | 企业版镜像 | `bd_nonexistent_xyz`（未授权） | 403 `permission_denied` + `required_action=request_authorization` |
| 3 | **社区镜像**（`openbkn-ee.sh revert`；**license 仍在 DB、升级脚本副作用仍在**） | `bd_public` | **200**，两条路由均完整返回 |
| 4 | 社区镜像 | 未授权域 / 无 domain 头 | 403 同 #2 |

### 源码核实（bkn-foundry tag `v0.1.4`，与线上 0.1.4 镜像对应）

**门的实现**（`bkn-trace/agent-observability/src/driveradapter/api/httphandler/evidence_handler.go:831-840`，全部 session 路由含两条读路由共用 `RequirePublicLifecycleIdentity`）：

```go
businessDomain := strings.TrimSpace(r.Header.Get("x-business-domain"))
if h.deploymentTenantID == "" || len(h.publicLifecycleBusinessDomains) == 0 || h.authorizationScopeResolver == nil {
    → 503 authorization_unavailable "public lifecycle authorization scope is not configured"
}
if _, approved := h.publicLifecycleBusinessDomains[businessDomain]; businessDomain == "" || !approved {
    → 403 permission_denied "requested business domain is not approved for public lifecycle writes"
}
```

`publicLifecycleBusinessDomains` 来源是环境变量 `BKN_TRACE_PUBLIC_LIFECYCLE_BUSINESS_DOMAINS`（同文件 :36/:111），由 chart 注入（`charts/agent-observability/templates/deployment.yaml:105`，helm `required` 非空），**社区 chart 默认值就是 `[bd_public]`**（`values.yaml` `queryAuth.publicLifecycleBusinessDomains`，注释："Public lifecycle writes are limited to deployment-approved domains until BKN Safe exposes a verifiable user-to-business-domain authorization contract"）。线上 Deployment 实测：`BKN_TRACE_PUBLIC_LIFECYCLE_BUSINESS_DOMAINS=bd_public`（chart 安装产物，非脚本产物）。

**没有「域授权记录」这种数据**：resolver（`src/drivenadapter/httpaccess/bknsafeaccess/client.go`）只调 bkn-safe `/api/safe/v1/me`（账号启用/ID/角色）与 `/me/knowledge-network-grants`（KN 授权）；bkn-safe v0.1.4 源码中无 BusinessDomain 概念（全库零匹配），profile 里的 `TenantID/BusinessDomain` 是**从请求上下文回显**。403 的第二个来源是 `/me` 拒绝（账号禁用/身份不匹配 → "current account could not be authorized for public lifecycle writes"），同样是账号级而非 license 级。

**agent-observability 读路径无 license 检查**：v0.1.4 全包对 license 的功能性引用只有 ① `sessionsvc/service.go:748` 读取运维可配的 `BKN_TRACE_EVIDENCE_COLLECTION_STATE=not_collected_due_to_license` 清单标记（线上为 `enabled`）；② swagger 枚举里的 `capability_not_licensed`（本服务不产生）。

### License 与升级脚本各自的真实位置

- **License 的门在 MCP/写路径，且伪装为 404**：agent-retrieval 的 `lifecycle_middleware.go:295-313` 按设计契约（ee-design §4.5：缺证书→假装不存在；缺权限→明说）把 `capability_not_licensed` 映射为 **HTTP 404**、`permission_denied` 映射为 403。即：license 缺口不会以 403 形式出现在 observability 读路由。
- **升级脚本的唯一作用是 EE 镜像的 optimizer 富集**：`community2ee/bootstrap-business-provenance-optimizer.sh` 只做两件事——向 bkn-agent 导入 `business_provenance_optimizer`（context_loader-only）、给 agent-observability 设 `BKN_TRACE_PROVENANCE_AGENT_{URL,ID,NAME}`。chart 对该配置块的注释："**The Community binary ignores this block. The EE image uses it solely to select the deployment-approved, read-only business-provenance Agent**"（`values.yaml` `enterpriseBusinessProvenance`，社区默认 `enabled: false`）。即：该脚本影响的是 **EE 二进制的证据→业务引用富集（业务图内容深度）**，不影响任何路由的可达性。
- 闭源 EE 覆盖层通过 `src/extension/enterpriseroute/socket.go` 挂载（"Community builds leave the socket empty"），Core 侧注释明言该插槽 "deliberately knows nothing about licenses"。
- RBAC 角色只影响 `/access-profile` 的 UI 能力位（`observabilityvo/access.go`：`BusinessProvenanceOwn` 对任何活跃账号恒 `true`）。

### 对 M5 时期 403 的澄清（修正既有文档的误诊）

M5 时（社区版、未发 domain 头）插件读面板数据的 403「请求的业务域未获准执行公共生命周期写入」，真实原因是 `businessDomain == ""` 触发空域拒绝——**插件当时没有发送 `x-business-domain` 头**。打通它的修复是 commit 28eea4c 补发该头（值恰为 chart 默认允许的 `bd_public`）；与同日升级企业版/导入 license 是时间上的巧合。M5 文档「需要在平台管理面对 bd_public 域做生命周期授权」的表述不成立：bd_public 是 chart 出厂默认，无需任何管理面操作。

### 结论（取代初版表述）与未定项

- **门 = 部署级静态允许清单（chart 配置）+ 账号身份**。operations 与 business-graph 读路由在**原厂社区部署**（chart 默认值）即可用，前提：OAuth 令牌有效、请求带 `bd_public`（或部署允许清单内的域）。→ operations 与业务图路由均归 Layer 1 可得性；业务图在社区部署的**内容深度**（business_refs 富集）可能低于 EE（无 optimizer），此内容差异未实测（需全新社区部署），不影响路由与降级语义。
- `businessDomain` 配置成允许清单外的域 → 403（domain-not-authorized）；清单未配置（理论场景，chart `required` 使其不可达）→ 503 authorization_unavailable（插件归类 platform-unavailable）。
- 未定项收窄：真·无 license 部署的**读路径**行为已由源码确定（与 license 无关），不再需要实测；仍未实测的只剩「全新社区部署上业务图的内容深度差异」（optimizer 富集的有无），属内容层差异。
- 403 错误体结构：`{error:{code,message,retryable,required_action,request_id,retry_after_ms}}`，message 随 `accept-language` 本地化。插件只透传 `code` 与截断的 `required_action`。

### 对插件分类逻辑的修订（据此实施）

初版按方案 §5.4 的双变量分类（403 + `capabilities.licensed===false` → license-required）**不成立**：读路径的 403 恒为域/账号授权问题，对无 license 部署提示「升级企业版」是错误指引（升级不改变允许清单）。已改为：403 `permission_denied` → 恒 `domain-not-authorized`（透传 `required_action`），分类不再查询 capabilities；`license-required` 降级枚举保留（面向未来版本出现真实 license 门时复用），当前读路径不产生。

## V2：MCP 工具结果携带的标识符

方法：直接驱动 `/api/agent-retrieval/v1/mcp/`（initialize → tools/list → tools/call），跑完整业务轮（start → 检索 → finish）。原始载荷仅在本地终端排查期出现，未入库。

工具参数模式（tools/list 的 inputSchema 字段名）：业务/发现类工具都带 `bkn_context` 参数（对象，需含 `conversation_id`、`interaction_id`，缺省时返回 `conversation_required` / `interaction_required` + `required_action=bkn_start_interaction`）。

各工具**结果**的字段名（逐字段结构遍历，只记名）：

| 工具 | 结果字段名 | 标识符 |
| --- | --- | --- |
| `bkn_start_interaction` | `interaction_id`, `conversation_id`, `execution_status` | interaction ✓ conversation ✓ |
| `bkn_finish_interaction` | `interaction_id`, `conversation_id`, `execution_status`, `evidence_status` | interaction ✓ conversation ✓ |
| `query_object_instance` / `search_instance` | `{nodes[], message}`（search_instance）；失败为 `{error:{code,message,required_action,retryable,retry_after_ms}}` | **无任何 id** |
| `search_schema` | `{object_types[], relation_types[], action_types[], metric_types[]}`（各元素为 name/id/comment 类元数据） | 无 |
| `get_kn_detail` | `{id, name, comment, concept_groups[], object_types[], relation_types[], action_types[]}`（含 `_score`、`tags[]`、`data_properties[]`、`primary_keys[]` 等） | 无（早期 flat 字符串匹配到的 `interaction_id` 为值内子串误报，定向查找为零） |

operations 读模型（V1 附带核实）的每条 entry 字段名：`operation_id, attempt, conversation_id, interaction_id, receipt_id, request_id, trace_id, span_id, tool_name, protocol, source_module, status, retryable, started_at, finished_at, input, output`。

### 结论

- 检索/发现类结果**不内嵌回执** → 证据链完全依赖 Layer 1 平台 operations 的 `receipt_id`（按方案分叉：社区部署读路由可得，回执清单随之可得；`ProvenanceReceiptDetail` 维持不定义，直到平台披露回执内容契约）。
- `conversation_id` 在 lifecycle 结果中可得 → 句柄 v2 的 `conversationId` 有真实来源；`requestIds/traceIds/receiptIds` 仍恒空，`partial: true` 维持。
- `evidence_status`（finish 结果）存在，时间链 summary 白名单暂只用 `execution_status`。

## 验证过程备注

- 社区镜像测试经 `openbkn-ee.sh revert` / `install` 完成并已恢复：恢复后六个工作负载镜像与快照逐字节一致，capabilities 回到 enterprise valid，operations 200 复核通过。注意该测试未隔离 license 与脚本副作用（由本次源码核实补全，见 V1 修订记录）。
- 探针产生的 interaction（V2 轮次）以 `outcome=completed`/`failed` 正常收尾，未遗留悬挂 interaction。
- 本机历史 DSH 会话已无 `mcp__openbkn__*` 真实调用事件（M5 会话日志已清理），时间链对真实会话的端到端验收并入 G6/round9 E2E（与方案 7.2 一致），本轮以单测覆盖重建逻辑。
