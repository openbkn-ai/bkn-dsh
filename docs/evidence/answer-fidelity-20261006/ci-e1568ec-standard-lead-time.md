**382-000005（北斗导航农机驾驶仪）的标准交期：1 天**

- **物料属性 materialattr = 自制**，所以适用**生产提前期** `product_fixedleadtime`，字段定义为「自制件包括产成品、半成品的生产提前期 (天)」→ **1 天**。
- 同一记录上的**采购交货提前期** `purchase_fixedleadtime`（字段定义「采购交货提前期 (天)」）也是 1 天，仅供参考；该物料是自制件，采购交期不是它的标准交期口径。
- 单位「天」来自上述字段定义本身，与物料计量单位（`baseunit_name` = 个）无关。
- 其余属性：规格型号 YN406BDS-2.5GD(YN406拖拉机V2)，存货类别 库存商品-产成品，产品状态 已上架。

来源：物料对象 `supply_ontology_hand_material`，数据源 `supply_demo_hand.erp_material`，按 `material_code = "382-000005"` 精确匹配，命中 1 条。
