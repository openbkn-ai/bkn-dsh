**382-000005 的标准交期是 1 天。**

| 项 | 值 |
|---|---|
| 物料编码 | 382-000005 |
| 物料名称 | 北斗导航农机驾驶仪 |
| 规格型号 | YN406BDS-2.5GD(YN406拖拉机V2) |
| 物料属性 | 自制 |
| **生产提前期**（product_fixedleadtime） | **1 天** |
| 采购交货提前期（purchase_fixedleadtime） | 1 天 |

**口径说明**

- 来源：知识网络「供应链本体知识网络-手工版」的「物料」对象类（`supply_ontology_hand_material`），底层数据源为 `supply_demo_hand.erp_material`，按 `material_code = "382-000005"` 精确命中 1 条。
- 单位取自字段定义本身（两个字段的注释均标注「天」）：
  - `product_fixedleadtime`——「自制件包括产成品、半成品的生产提前期 (天)」
  - `purchase_fixedleadtime`——「采购交货提前期 (天)」
- 该物料 `materialattr` 为**自制**，所以其标准交期取**生产提前期 = 1 天**；采购提前期同样为 1 天，但不适用于这个自制件。两者数值恰好一致，若后续需要按供应商实际承诺日期，应改用采购订单上的 `deliverdate`。
