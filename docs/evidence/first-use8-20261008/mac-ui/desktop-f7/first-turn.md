## 结论

当前供应链知识网络中共有 **800 张销售订单**。

**状态分布**

| 订单状态 (order_status) | 订单数 |
|---|---|
| 已确认 | 784 |
| 执行中 | 16 |
| **合计** | **800** |

784 + 16 = 800，与总数吻合，未出现第三种状态值。

## 查询口径与来源

**实体定位**
- 对象类：销售订单 `supply_ontology_hand_salesorder`（概念名「销售订单」，注释：记录销售签约与交付信息）
- 物理数据源：`supply_demo_hand.sales_order`，resource id `01a0f6e5-fda9-717a-aa25-f5573d2b246c`
- 状态字段：`order_status`（string，权限 full）

**计数口径**
- 总数取自该对象类下**已建模指标「销售订单数」**（metric id `01a0f6e6-5e9e-72c1-b69b-64e663b5e45d`），聚合公式为 `count(sales_order_id)`，单位 transaction（计数单位），指标快照标注为 800。
- 分布通过同一指标的 `analysis_dimensions=[order_status]` 拆维得到——按状态分组计数，而非自定义重算。
- 未附加时间窗过滤，即**全量快照口径**（该指标无时间维度，查询返回单一时间点 `times:[0]`）。

**交叉验证（对象查询路径）**
用 `query_object_instance` 在 `ot_id=supply_ontology_hand_salesorder` 上读取 `total_count`，三条查询互相印证：

| 过滤条件 | total_count |
|---|---|
| 无过滤 | 800 |
| order_status = 已确认 | 784 |
| order_status = 执行中 | 16 |

**说明与限制**
- 本次未使用 `run_cypher`：该工具在本部署的 OpenBKN 业务会话中不受支持（返回明确的不支持提示），因此全部结论来自受管指标与对象查询两条路径。
- 上述 800 为「销售订单」对象类的记录数；该口径按 `sales_order_id` 计数，本次已验证首条实例 `SO0000001`、`SO0000029` 与各自状态一致，未发现订单号重复导致的口径偏差迹象。
- 状态取值仅为「已确认」「执行中」两者，这是查询所得的事实，不代表该字段在其他时间点不存在其他取值。

本次交互已在同一 OpenBKN Interaction 内完成并结束（evidence_status: complete），知识网络绑定为 `supply_ontology_hand`、会话 `conv_796b358bd3b602a0a0bb87c787cef9ed`。
