# T4b：时间链精确对照（2026-09-23）

> 对应 `docs/plans/2026-09-21-provenance-timeline-handoff.md` T4b 与 `docs/reviews/2026-09-23-provenance-timeline-batch-review.md` A3。
> 前置声明：本证据在重建后的集群上取得——环境漂移（hotfix 镜像回退、amd64+Rosetta、新 TLS CA、authorization-private 放行桩）见 **stage1 证据 §7**。本对照只统计本机会话事件与平台 operations 的**条目数**，不涉及权限判定，放行桩不影响计数（审核 A3 同意见）。
> 运行形态：与 stage1 相同（本地 Runtime + profile，插件含 `8c72f5c..1a0ed9e`）。

## 方法

按审核建议改用「直查问题」避免 `run_code` 嵌套派发：问题「苏州仓里 382-000005 的可用库存是多少？只用一次对象实例查询直接回答。」（会话第 16 轮，v2 句柄 `turn=16`，interaction `int_a7cc1d49…`）。三方计数：面板时间链节点 / 会话日志 `tool/call` 事件 / `openbkn trace interactions operations`。

## 结果

| 口径 | 计数 | 明细 |
| --- | --- | --- |
| 面板时间链节点 | **5** | 提问 + 4 个工具节点（start 失败 / start 成功 / query / finish）+ 回答 |
| 会话日志 openbkn `tool/call` | **4** | `bkn_start_interaction`、`bkn_start_interaction`、`query_object_instance`、`bkn_finish_interaction` |
| 平台 operations | **1** | `query_object_instance`（lifecycle 不产生条目，与 stage1 §2.6 一致） |

**「时间链节点数 = 本地 tool/call 数 + 2」精确成立：5 = 4 + 2**（+2 为提问/回答两个非工具节点）。业务调用口径同样对齐：本地业务工具节点 1 = 平台 operations 1，`query_object_instance` 因 1:1 对齐挂上平台 Op/Receipt/Status。

## 附带观察（非 T4b 目标，如实记录）

1. **会话失效受控回退获得线上实证**：模型先以 `continue` 复用旧 conversation_id 发起 start，平台侧（重建后）返回失败 → 轮内以 `new` 重开成功，最终 completed。失败 start 节点以 `outcome: error` 呈现且不折叠。这正是噪声治理「平台判定的失效码才允许受控 new」的预期路径——stage1 证据 §3.3 里「会话失效受控回退无法在本部署触发」的限制在本轮被自然补上（旧 id 失效因集群重建，属真实失效源）。
2. 该轮回答的苏州三仓库存数与 M5 期 MySQL 独立核对口径一致（375 = 325+客退 24+待发 26 按仓库明细可复核）。

## 截图

- `2026-09-23-timeline-t4b-precise-count.png`：该轮面板（时间链 5 节点 + 挂载的平台事实 + 单条平台 operation）。
- `2026-09-23-timeline-record-not-disclosed.png`：同日 A1 验证——旧 interaction（集群重建前记录）显示「平台未找到此记录…重试不会改变结果」，无稍后重试提示。
