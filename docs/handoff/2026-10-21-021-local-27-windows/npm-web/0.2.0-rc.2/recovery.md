抱歉，这次没能取到数据。

**结果：未能查询**

- 本轮 OpenBKN 交互已开启（conversation `conv_a6e72aa55eb86a0fe4c95d270b973752`，interaction `int_13fda0db326a57dbaaef205fe4de8a13`），但业务数据查询在派发到平台之前就被拦截，返回 `LOCAL_ACCEPTANCE_SANDBOX_HOLD: execution was stopped before platform dispatch. This case is blocked and cannot be accepted; no substitute business answer is authorized.`
- 因此我**没有**拿到 `382-000005` 在供应链本体知识网络（supply_ontology_hand）里的任何字段值，也就无法给出它的标准交期。这个结果既不能说明该编码不存在，也不能说明它没有交期——那句话"没查到"只是本次查询没被执行，不构成任何业务结论。
- 我也没有用别的方式（脚本推算、外部知识）拼凑一个答案，因为这属于该网络受管的业务口径，不能替代。

**另外一点需要你确认**：`382-000005` 这个编码在网络上可能对应不同实体——物料（`supply_ontology_hand_material`）、产品（`supply_ontology_hand_product`），或与供应商（`supply_ontology_hand_supplier`）的交期字段相关。如果平台恢复后能继续，我需要先确认它指哪个对象类，再取其"标准交期"字段；不同对象类上的交期含义不同，取错会给出看似合理但错误的数字。

**建议下一步**：等平台侧解除该拦截后重试同一问题；如果方便，也可以先告诉我 `382-000005` 是物料还是产品编码，我恢复后直接按对应对象类查。
