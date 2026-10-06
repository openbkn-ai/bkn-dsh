**结论：382-000005 当前没有未结的采购申请，也没有未结的采购订单。**

查询口径与范围：

| 查询对象 | 过滤条件 | 结果 |
|---|---|---|
| 采购申请单 `supply_ontology_hand_pr` | `material_number = "382-000005"` | 0 行 |
| 采购申请单 `supply_ontology_hand_pr` | `material_name` 包含「北斗导航农机驾驶仪」 | 0 行 |
| 采购申请单（叠加未结口径） | 上述编码 + `rowclosestatus_title = "正常"` | 0 行 |
| 采购订单 `supply_ontology_hand_po` | `material_number = "382-000005"` | 0 行 |
| 采购订单 `supply_ontology_hand_po` | `material_name` 包含「北斗导航农机驾驶仪」 | 0 行 |
| 采购订单（叠加未结口径） | 上述编码 + `rowclosestatus_title = "正常"` | 0 行 |

说明（字段口径）：

- **382-000005** 在物料主数据 `supply_ontology_hand_material` 中存在，名称「北斗导航农机驾驶仪」，`materialattr =「自制」`、`group_name =「库存商品-产成品」`（单位：个），即自制成品；它同时是「产品」对象中的产品编码（`product` 对象注释：产品编码即物料编码，但物料不一定是产品）。
- **未结口径**：采购申请单与采购订单的 `rowclosestatus_title` 取值为「正常 / 已关闭」，`rowterminatestatus_title` 取值为「正常 / 已终止」；本次以 `rowclosestatus_title = 正常`（未关闭）作为「未结」条件。
- 采购单据以**物料编码**（`material_number`）为唯一业务关联字段，采购申请单另有 `huid_xmh_name`（项目号）字段，其中不存在 382-000005 相关项目号。

即：在上述两张单据表中，382-000005 本身既没有采购申请行，也没有采购订单行，因此不存在「未结」记录；其配套的采购执行（采购申请 → 采购订单）对应的是其外购子件物料，而非成品编码本身。
