# 本机原始交付文件索引

所有链接指向本机实际原件，未改写、未覆盖。`answers/`只保存模型最终原文，其CSV相对链接依赖原生DSH会话工作区；在该目录里直接点击相对链接不等于原生交付失败。下面给出绝对路径，原生最终链接打开的证据另见RESULTS和JSON。

| 宿主 | 所属原题 | 本机文件 | 字节 | 实际打开与边界 |
|---|---|---|---:|---|
| 旧版 | 数量/状态题附加文件（仅诊断） | [CSV](</Users/dominiczhang/Documents/project/app/openBKN/bkn-dsh/release/ci-41507f9/workspaces/supply-old/openbkn-c9b2902b-a4b1-48a3-9180-a80cbd1b8182-sales_order_detail-2de52eadda6b4dedb294ab6d2310015b.csv>) | 8473 | SQL/摘要核对通过；本轮未单独打开，不能替代旧版销售明细失败 |
| 旧版 | BOM构成 | [CSV](</Users/dominiczhang/Documents/project/app/openBKN/bkn-dsh/release/ci-41507f9/workspaces/supply-old/openbkn-e410ab53-7dcb-4904-a9c2-22e8cdc5b4da-bom_list-2c9517d2267c4a86814f5eb3d18efef4.csv>) | 35381 | 已从该题最终链接打开，摘要未变 |
| 旧版 | 完整BOM/单耗/库存 | [CSV](</Users/dominiczhang/Documents/project/app/openBKN/bkn-dsh/release/ci-41507f9/workspaces/supply-old/openbkn-38ce857b-11a5-4411-9ebe-30f3330aa60a-layered_inventory-c4beee43f39f493fb7842b28f4825460.csv>) | 299019 | 已从该题最终链接打开，摘要未变 |
| 新版 | 销售订单明细 | [CSV](</Users/dominiczhang/Documents/project/app/openBKN/bkn-dsh/release/ci-41507f9/workspaces/supply-new/openbkn-44b83895-ea47-4dda-b191-b59ff640d83f-sales_order_detail-0bf1fcb9472344358b4fb60ef4c55d4f.csv>) | 8473 | 已从该题最终链接打开，摘要未变 |
| 新版 | 完整BOM/单耗/库存 | [CSV](</Users/dominiczhang/Documents/project/app/openBKN/bkn-dsh/release/ci-41507f9/workspaces/supply-new/openbkn-9b9f6545-98e9-45b3-93df-1ddc5b7dab86-layered_inventory-6a99cbac94f54d9bada4e4856b5ac929.csv>) | 299019 | 已从该题最终链接打开，摘要未变 |
| 新版 | BOM构成 | [CSV](</Users/dominiczhang/Documents/project/app/openBKN/bkn-dsh/release/ci-41507f9/workspaces/supply-new/openbkn-ff09c890-5fe4-4d71-9a87-4537078fe310-bom_list-66d819c030954c988d979888f2ca4208.csv>) | 35381 | 已从该题最终链接打开，摘要未变 |

旧版销售明细原题本轮没有交付最终表或文件。另一题正确的40单CSV只用于诊断，绝不补入该失败会话。
