# B 批 desktop 形态结果（2026-10-07 晚）

环境：unified7-fidelity-desktop（Desktop exe pid 2256），workspace-supply 绑定
supply_ontology_hand，DeepSeek-V41-Flash High，标准模式新会话；独立 oracle 基准复用
b3/oracle-verify-completeness（作答前采集）。

## B3 三道原题 3/3 pass

| 题 | 结果 | 要点（对 oracle） |
|---|---|---|
| Q1 `382-000005 的标准交期？` | **pass**（15 秒 completed） | 标准交期=1 天（生产固定提前期）；materialattr=自制取生产口径；purchase_fixedleadtime=1 天仅作对照；北斗导航农机驾驶仪/YN406BDS-2.5GD；supply_demo_hand.erp_material 数据源 |
| Q2 `查询 382-000005 的 BOM 清单，每个物料的使用量，以及每个物料的库存情况` | **pass**（首轮 21 步完成，EMITTED: 313；npm 侧曾需续轮，desktop 一次完成） | **313/313 行键集合与 oracle 完全相等**（L1-5=9/16/38/212/38，272 唯一子料）；单耗/库存数值逐行零差值；名称差异 0；`0*`=范围内无库存行、`?`=单位未提供口径一致；深层（depth=5）库存能力超时→只读直查回退+depth=1 九物料校准值与能力逐条一致（1000/344/400/34/0/1875/1867/1500/0，与 npm 同值） |
| Q3 `物料 999-999999 的库存和订单情况？` | **pass**（13 秒 completed） | 物料/实时库存/采购订单三处精确查询均 0 条；明确"零匹配≠全局库存/订单为零"；无附加数值 |

证据：d-q1-r2-answer-axtree.txt、d-q2-answer-axtree.txt（含 EMITTED: 313 与 313 行明细）、
d-q3-answer-axtree.txt；会话绑定原件 desktop root dsh-home/openbkn/session-bindings/。

## B4 live guard 两用例 pass

1. **未绑定拒绝**：默认工作区新会话问业务数据 → "list_knowledge_networks、search_schema
   等调用都被**直接拒绝**（会话绑定问题）""OpenBKN 工具仅在绑定会话中可用"（3 秒 completed）。
   证据 d-guard-unbound-axtree.txt。
2. **跨网隔离**：workspace-worldcup（原生目录对话框绑定）中问 supply 物料 →
   "未找到…当前绑定网络不包含物料/库存数据…缺少可查数据源，而不是'该物料库存为 0'"，
   列出本网 27 个对象类/3 个能力均为 wc_*/vega_sql，无跨网披露（15 秒 completed）。
   证据 d-guard-cross-network-axtree.txt、d-worldcup-bound-axtree.txt。

## B2/F01 来源图（desktop）

Q2 会话业务上下文图：**13 个元素**·0 条可视关系；首元素 object 库存
（object·resolved，来源网络 supply_ontology_hand，来源 Operation op_001697a7…，
解析工具 query_object_instance）。证据 d-f01-q2-graph-axtree.txt。
逐元素 ref 三层闭环（图→回执→CLI 平台核验）已在 npm 侧完成（见 b3/B2-F01-SUMMARY.md）；
desktop 侧记录图结构与元素样例，未逐元素重放。

## 执行偏差与观察（如实，2026-10-07 晚）

1. **token 复制共享失效事件**：B1 时 npm root 复用了 desktop 设备授权 token（交接允许的
   隔离内复用）。desktop 首次复跑 Q1 时平台返回 `token is invalid / Public.Unauthorized`
   （10:33）；CLI 排查发现两 root token 字节相同但先后失效（10:39 desktop 尚可用、10:44 起
   401）——平台对该设备 token 做会话/时效管理，复制共享不可持续。处置：desktop 以独立
   设备授权重登（CLI auth login --device，用户在浏览器确认用户码 jrqMJCN4，
   "Logged in as admin"，新 token sha16=1CA51CC6…）后全部用例通过。npm 侧三题/guard/
   F01 均完成于此事件之前，不受影响；desktop 旧失败会话保留（d-q1-answer-axtree.txt）。
   **该事件是 G6 开放项"token 自动续期"的现场实证**（共享副本会被轮换作废），回传主 agent。
2. **产品行为观察**：token 失效后 OpenBKN 面板仅提供"重试/诊断"，无"重新登录"入口；
   重试不恢复，需 CLI 侧重登。建议产品侧在鉴权失败态提供重新登录引导（如实回传，非本轮
   验收判定项）。
3. 测试操作偏差（非候选问题）：自动化输入曾误将系统剪贴板残留内容（用户配置时的 API key
   片段）粘入 composer 输入框，**未发送即清除**（Ctrl+A+Delete），未进入任何会话/请求；
   此后改用键盘输入。该片段未写入任何证据文件（已脱敏扫描确认）。
4. Q2 desktop 对账的"uom mismatch 313"为提取正则行尾粘连（`个|1`），非数据问题；
   数值列（单耗/库存）零差值。
