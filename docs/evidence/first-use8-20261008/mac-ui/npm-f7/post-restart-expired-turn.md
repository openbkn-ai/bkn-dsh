OpenBKN 平台这次调用失败了，我无法完成本轮的查询。

**具体情况**

- 调用 `bkn_start_interaction`（开启本轮 OpenBKN 交互边界）时返回：*“not registered in this session, so its network scope cannot be checked. Do not retry it.”*
- 也就是说，本会话此刻没有挂载 OpenBKN 交互工具，知识网络 `supply_ontology_hand` 的网络范围无法校验。平台明确要求不要重试。
- 按规则，在没有成功建立交互边界的情况下，我不能绕过它去直接做业务检索，因此本轮**没有**读取销售订单数据，也没有产生任何 382-000005 的销售订单数量/状态结论。

**因此本轮未产出数据**，上一轮已确认的成品仓库存结果不受影响。

**建议**：请在下一条消息里再让我查一次（例如直接回复“重试”）。如果那时 `bkn_start_interaction` 恢复注册，我会按以下口径执行并注明来源：

- 对象：`销售订单`（supply_ontology_hand_salesorder），经由关系 `so2prod`（销售订单 → 产品）关联到产品编码 `382-000005`；
- 输出：订单张数与状态字段的分布（状态字段名以该对象类型在 schema 中的定义为准确认，不预设取值）；
- 注明：筛选字段含义、是即时/快照口径、是否有分页或截断。
