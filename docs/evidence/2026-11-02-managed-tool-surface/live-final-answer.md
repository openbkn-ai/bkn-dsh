查询完成，CSV 已交付。

**产品 382-000005（北斗导航农机驾驶仪）三仓可用库存**

| product_code | warehouse | available_qty | inventory_uom |
|---|---|---|---|
| 382-000005 | 苏州成品仓 | 325 | 个 |
| 382-000005 | 乌鲁木齐成品仓 | 127 | 个 |
| 382-000005 | 哈尔滨成品仓 | 82 | 个 |

**合计：534 个**

**口径与来源**
- 口径：已建模指标「库存可用量」（`sum(available_inventory_qty)`），按仓库维度拆分；底层库存记录中该产品在三个仓的批次均为 `stock_status=可用`，单位均为「个」，字段全量权限。
- 来源：知识网络 `supply_ontology_hand` 的「库存」对象（数据源 `supply_demo_hand.erp_real_time_inventory` 实时库存快照）。三仓均属系统注释中的「生产可用仓」预设范围。
- 精度：指标返回值为整数（325 / 127 / 82），CSV 保留原始数值与单位，未做换算或舍入。

**文件**：[inventory_382-000005_three_warehouses.csv](<openbkn-4941079f-d411-4387-8595-a1a94d28d321-inventory_382-000005_three_warehouses.csv>)，表头 `product_code,warehouse,available_qty,inventory_uom`，每仓库一行、无合计行，已通过平台导出校验（168 字节）。

本次为只读查询，未修改任何库存、订单、主数据或业务定义。
