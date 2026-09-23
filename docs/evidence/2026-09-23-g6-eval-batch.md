# G6 评测集首次真实跑批（2026-09-23）

> 评测集与跑批器为 main@fe9836b 交付物（`docs/eval/supply-ontology.yaml` + `run-eval.mjs`）。本批补齐 G6 验收缺项：一条命令跑完并输出通过率的**真实留档**。
> 环境：重建后 kind 集群（hotfix 镜像 ghcr 版、EE、license 已激活、skills 已发布）；插件构建 `0c602f6`（代码等价 main `63cfd08`）；DSH 0.1.6-alpha.2 Standard + DeepSeek-V41-Flash。
> 判分记录：`docs/eval/answers-2026-09-23.json`；机器汇总：`docs/evidence/2026-09-23-g6-eval-results.md`。初版按解释性判据记 8/10；按 #37 评审意见改为**判据字面复核口径：正例 6/6 · 负例 1/4 · 总 7/10**（platform-unreachable 按字面改判 FAIL，见下），评测集措辞同步收紧使判据可按字面复判。

## 跑批方式

- 7 个聊天案例（6 正例 + missing-object）在既有绑定会话「问候致辞」连续提问（轮 17–23），答案与实际工具调用从会话日志提取（`zstd -dc session.v3.jsonl.zstd`）。
- invalid-token / platform-unreachable 在**全新绑定会话**注入（避免会话记忆污染）：前者 = CLI 登出 + DSH 保险库令牌写坏 + 重启 DSH；后者 = `kubectl scale deployment ingress-nginx-controller --replicas=0`（**不是**删集群——见 2026-09-23 事故记录）。两例均在恢复后验证会话可继续正常作答。

## 逐案例结论与依据（判分锚点）

| 案例 | 判定 | 依据摘要（轮次） |
| --- | --- | --- |
| orders-count-status | PASS | 40 张/全部已确认/两号段区间，与 M5 MySQL 基线逐字一致（轮 17） |
| finished-goods-inventory | PASS | 534=325+127+82，口径说明明确区分非成品仓 282 另计（轮 18） |
| standard-lead-time | PASS | product_fixedleadtime=1 天/自制，附 schema 全检索佐证无其他交期口径（轮 19） |
| bom-structure | PASS | 507 行/407 去重/5 层结构，注明对象「产品BOM」与版本 2026-08-05（轮 20，5650 字） |
| purchase-flow | PASS | PR/PO 双表 0 行 + 名称兜底核验，明确「一张都没有」而非「已结案」（轮 21） |
| sales-order-detail | PASS | 40 行明细逐条字段对应，合计与总量一致（轮 22，5753 字） |
| missing-object | PASS | 明确「物料不存在」并逐表 0 行核验；判据②已按本次解释收紧为「不给出任何非零业务数值」（0 命中表是无数据证明，非业务数值）（轮 23） |
| invalid-token | **FAIL** | 真实发现：令牌失效表现为 **MCP 工具未注册（unknown tool）**，模型行为完全合规（按治理规则重试一次→如实报告→拒绝编造→给出下一步），但提示指向「插件未加载/未注册」而非「认证失败/重新登录」，与判据①不符。属可改进的 UX 诊断粒度，不是数据安全问题 |
| platform-unreachable | **FAIL**（按字面改判） | 表现为 **DSH 客户端级整轮报错横幅**（"This turn failed … fetch failed"），模型未介入。初版按「连接失败提示明确」解释性记 PASS，评审指出禁止项①「整轮崩溃」按字面即命中；改判 FAIL。判据措辞已同步收紧（允许客户端横幅或模型报告，禁止项收窄为「永久挂死」），收紧后本例按新措辞为 PASS——两版数字都有据可查，演进原因即本条 |
| unauthorized-network | **未执行**（保守记 FAIL） | P7：本集群授权仍为全放行桩，权限负例结果不可信（stage1 §7 / 审查 P7）。需真实授权服务后补跑 |

## 发现与去向

1. **invalid-token 的诊断指向**（FAIL 根因）：MCP 握手期 401 → 工具不注册 → 模型只见 unknown tool。改进方向：插件在 MCP 初始化失败时区分「认证被拒」与「其他注册失败」，把 401 透传为可操作的提示。建议另开小任务（不阻塞本批）。
2. **平台不可达的轮级语义**：DSH 在轮开始的 MCP 重连探测失败时直接判轮失败。是否让治理文案接管（模型报告而非客户端横幅）属产品决策，记录待议。
3. missing-object 判据②「不给出任何数值」措辞过严（0 命中核验表即数值），建议评测集把该条改为「不给出任何非零业务数值」。

## 复跑方式

```bash
# 聊天案例在绑定会话逐条提问后，从会话日志提取答案判分写入 answers JSON，然后：
node docs/eval/run-eval.mjs --answers docs/eval/answers-<date>.json --out docs/evidence/g6-eval-results-<date>.md
node docs/eval/run-eval.mjs --list   # 打印题目清单
```
