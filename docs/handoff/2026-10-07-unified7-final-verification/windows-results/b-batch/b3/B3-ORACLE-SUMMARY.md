# B3 独立 oracle 基准（2026-10-07 晚，问答前预先采集）

脚本：docs/eval/verify-supply-completeness.py（仓库自带独立只读 CLI oracle；
CLI 0.1.5 隔离 store + kit CA；对 https://192.168.50.28 只读查询）。
输出目录：`C:\bkn-verify\unified7-final-evidence-20261007\b3\oracle-verify-completeness\`
（20 个文件：分页 BOM/库存/物料 JSON + complete-bom-inventory.csv/json + verification.json）。

## 与三道原题对应的基准事实

| 题 | 基准（独立平台查询） |
|---|---|
| Q1 `382-000005 的标准交期？` | material-0.json：唯一行 material_code=382-000005，material_name=**北斗导航农机驾驶仪**，**product_fixedleadtime=1**（自制件生产固定提前期，天），purchase_fixedleadtime=1（采购口径单列），baseunit=个，group=库存商品-产成品 |
| Q2 `查询 382-000005 的 BOM 清单，每个物料的使用量，以及每个物料的库存情况` | complete-bom-inventory：**313 父子行 / scoped 313 / 272 唯一子料 / 最大 5 层 / caliber=main_only**；missing_material_rows=0；first_level_checks：528-000036 可用 34/占用 0/1 行/个，791-000007 与 791-000015 可用 0/无库存行（范围内无记录标记口径） |
| Q3 `物料 999-999999 的库存和订单情况？` | missing-material-0.json：material_code=999-999999 精确查询 **total_count=0**（无匹配；判定要求：只允许 0 命中表述，不得附加全表数/其他物料/非零数值） |

## 说明

- 该基准在**模型作答之前**采集，与候选包/插件无关，不构成对回答的评分；仅用于
  对三道原题答案的独立核对（macOS 同口径通过值为 313/272/5 层）。
- 当前阻塞：隔离 Host 无 DeepSeek 模型 API key（Q1 首轮 MISSING_CREDENTIAL，
  快照 b3-npm-q1-sent-snapshot.txt——会话已正确绑定供应链网络，仅模型路由缺凭据）。
  待用户在隔离应用配置 API key 后重跑三题，再对照本基准核对。
