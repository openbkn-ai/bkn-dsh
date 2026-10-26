已通过知识网络的「子料分层库存」发布函数查询 382-000005 的 BOM 清单、每行使用量与物料库存。

## 查询口径
- 范围为去根（bom_level > 0）、仅主料（alt_priority=0）、全层（最深 5 层），不含替代条。
- 库存范围是 production_available 指定的 7 个有效仓（苏州半成品仓、苏州成品仓、苏州电子原料仓、苏州无人机原料仓、苏州装配原料仓、乌鲁木齐成品仓、哈尔滨成品仓）；只统计状态为“可用”的现存库存，不含在途，也不扣减预留。
- 数据源是 bom 和 inventory 两个数据集。

## 规模（父子料行与去重物料种数）
- 共有 399 条父子料行，按物料编码去重后为 333 种。
- 同一编码可能出现在不同父子行或层级中，因此不能用行数代替物料种数。

| 层级 | 行数 | 去重物料种数 |
|---|---|---|
| L1 | 9 | 9 |
| L2 | 23 | 23 |
| L3 | 40 | 37 |
| L4 | 278 | 234 |
| L5 | 49 | 47 |

## L1 一级子件（函数给出的独立预览，共 9 行）

| 物料编码 | 物料名称 | 标准用量 | 可用库存 |
|---|---|---|---|
| 791-000013 | YN406预组装包(拖拉机) | 1 | 1000 |
| 606-000989 | YN406 包装外箱_V2 | 1 | 344 |
| 606-000990 | YN406 珍珠棉内托_V2 | 1 | 400 |
| 528-000036 | YS221A接收机组件_国内 | 1 | 34 |
| 791-000007 | YN406B方向盘组件（拖拉机） | 1 | 无记录（null，不代表零库存） |
| 994-000550 | 406电源+电机+接收机连接线 | 1 | 1875 |
| 468-000493 | YN406说明书（中文） | 1 | 1867 |
| 468-000530 | 导航车贴(60*15cm) | 1 | 1500 |
| 791-000015 | YN403显示终端整机_预装组件_拖拉机 | 1 | 无记录（null，不代表零库存） |

## 完整交付文件
[CSV](<openbkn-38ce857b-11a5-4411-9ebe-30f3330aa60a-layered_inventory-c4beee43f39f493fb7842b28f4825460.csv>) 包含 399 行完整明细（299,019 字节，sha256 98ec958b…946b9f6），由函数按同一快照生成，未经改写。

实际列包括：bom_level、bom_level_label、parent_material_code、material_code、material_name、standard_usage、alt_priority、alt_group_no、alt_method、is_substitute、bom_version、available_qty、reserved_qty、inventory_record_count、inventory_status、inventory_units、warehouse_scope、warehouse_filter、stock_status、inventory_note。

## 说明与限制
- standard_usage 是单个父子料行的单耗，不是整机累计需求；同一物料出现在多条父子行时，库存不会重复累加。
- available_qty 为 null 且 inventory_status=no_records_in_scope 表示该仓范围内无库存记录，不代表实测为 0。
- 本结果仅为 BOM 结构与库存快照，未计算齐套率、缺料量或可产数量（这些需要明确的需求数量口径，本次未请求）。
- 未包含替代条；如需包含，请告知，我可以按 include_substitute=true 重新查询。