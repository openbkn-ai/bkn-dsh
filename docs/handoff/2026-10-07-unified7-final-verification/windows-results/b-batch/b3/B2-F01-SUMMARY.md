# B2/F01 真实来源图结果（npm 形态，2026-10-07）

来源：B3 Q2 会话（查询BOM清单及物料库存，int_d18376ad2ec0ce464eafddde6d，2 轮完成）
的产品"业务溯源→业务上下文图"。

## 图元素（本轮正式投影 6 个元素 · 0 条可视关系）

| # | 元素 | ref | 来源 Operation | 解析工具 |
|---|---|---|---|---|
| 1 | object 库存 | object · resolved | op_05fc3c72299eff16ce8f1d1994498905 | query_object_instance |
| 2 | property 可用库存数量 | property · resolved | op_08a7669763a9b0b43b64789ca86b02ec | query_object_instance |
| 3 | property 库存单位 | property · resolved | op_08a76697…（同上） | query_object_instance |
| 4 | property 物料编码 | property · resolved | op_08a76697…（同上） | query_object_instance |
| 5 | property 库存状态 | property · resolved | op_08a76697…（同上） | query_object_instance |
| 6 | property 仓库 | property · resolved | op_08a76697…（同上） | query_object_instance |

全部元素来源知识网络 supply_ontology_hand；状态均 resolved（无未披露/未知项需猜测）。

## ref 一致性三层核对

1. **图 ↔ 回执**：两个 op id 均出现在"证据链"回执清单——
   回执 05 `query_object_instance · operation op_05fc3c72… · completed · 来源：平台`；
   op_08a76697… 同样在回执中（f01-q2-evidence-chain-snapshot.txt 行 272/362）。
2. **回执 ↔ 平台（CLI 独立核验）**：`openbkn --json trace receipts get
   rcpt_469db8d7b460e74881710cfd1b8cc3eb`（隔离 store）返回 operation_id=
   op_05fc3c72…、tool_name=query_object_instance、receipt_status=completed、
   interaction_id=int_d18376ad…（即 Q2 续轮）——与面板展示一致
   （f01-receipt-cli-verify.json）。
3. **会话绑定**：dsh-home/openbkn/session-bindings/ 记录该会话绑定
   supply_ontology_hand @ https://192.168.50.28（b3/ 下三个 session-*.json 原件）。

## 判定

F01 **pass（npm）**：≥2 元素（6 个），ref_type（object/property）/ref_id（op id）/
工具/网络与每元素来源一致，且经回执与 CLI 平台核验闭环。无"未披露/未知"元素。
限制：desktop 形态来源图未取（待 desktop 侧复测决定）。
