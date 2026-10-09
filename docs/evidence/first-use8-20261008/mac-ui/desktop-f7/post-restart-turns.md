## 结论

产品编码 `product_code = "382-000005"` 的销售订单共 **40 张**，状态分布：

| 订单状态 (order_status) | 订单数 |
|---|---|
| 已确认 | 40 |
| 执行中 | 0 |
| **合计** | **40** |

这批订单**全部处于「已确认」**状态，没有执行中的；占全网 800 张销售订单的 5%。

## 筛选口径

**筛选条件**：销售订单对象类的自有属性 `product_code` **精确等值**匹配字符串 `382-000005`（非模糊、非前缀匹配），未叠加时间窗、客户、销售员等其他条件，属全量快照口径。

**命中实体**
- 对象类：销售订单 `supply_ontology_hand_salesorder`
- 物理数据源：`supply_demo_hand.sales_order`（resource id `01a0f6e5-fda9-717a-aa25-f5573d2b246c`）
- 样例记录：`SO0000001`，产品名「北斗导航农机驾驶仪」，状态「已确认」

**两条路径互证**

| 查询 | 结果 |
|---|---|
| 指标「销售订单数」+ condition `product_code == "382-000005"` | 40 |
| 同一指标 + 同条件 + `analysis_dimensions=[order_status]` | 已确认 = 40 |
| `query_object_instance` 同条件 → `total_count` | 40 |
| `query_object_instance` `product_code == "382-000005"` **AND** `order_status == "执行中"` → `total_count` | 0（空结果） |

## 说明

- 计数走的是**已建模指标「销售订单数」**（metric id `01a0f6e6-5e9e-72c1-b69b-64e663b5e45d`，口径 `count(sales_order_id)`，单位 transaction），未自行重写口径；状态拆分由指标的 `order_status` 分析维度完成。
- 产品编码取自销售订单自身字段，未通过「产品」对象类做关联比对——如需按产品主数据口径核对编码有效性，需另走关系 `supply_ontology_hand_so2prod`（销售订单关联产品）。
- `order_status` 仅出现「已确认」一种取值（已用空结果查询单独确认「执行中」为 0），这是本次查询范围内的事实。
- 本部署不支持 `run_cypher`，故聚合全部由受管指标与对象查询完成；平台返回的 evidence_status 为 partial，但我用两种独立路径（指标 + 对象查询）交叉印证了 40 与 40 这两个值，结果一致。
