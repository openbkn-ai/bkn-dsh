# N4/N5 结果（npm 形态，2026-10-07 傍晚）

环境：npm4 root Host @18269（detached 启动，listener pid 7792 记录 n45-npm-host.pid）；该 store 独立密码授权（admin；此前有两次重复失效、重登恢复，时序与同账号他端登录相关——归档 auth-status 原件均为 expired=false，失效时点观察无时间化原件，原因未证实）；workspace-supply 绑定 supply_ontology_hand；DeepSeek-V41-Flash High；两个独立新会话（N4/N5 各一）。

## N4 `382-000005 的 BOM 构成是什么？`

- 原生 completed，51 秒，1 轮 10 步，554K tok；**零插件纠错通知**。
- 回答要点（对照独立基准 oracle-verify-completeness，作答前采集）：
  - 对象识别=北斗导航农机驾驶仪；对象类 supply_ontology_hand_bom（资源 supply_demo_hand.erp_material_bom）；BOM 版本 2026-08-05。
  - **L1 一级构成 9 项**（791-000013/606-000989/606-000990/528-000036/791-000007/994-000550/468-000493/468-000530/791-000015）与 oracle complete-bom-inventory.csv L1=9 逐项一致（编码+名称）。
  - 二级构成 4 组件由模型列出（791-000013→14、528-000036→4、791-000007→10、791-000015→3）；**这些数量与 main-only oracle 的对应二级计数不同，或为含替代料口径——二级一致性未独立证实，待完整全量 oracle 核对**。
- **全量口径（如实，待复核）**：模型自报 507 行/408 编码/L0–L5（含替代料与 L0 根行，total_count=507 单页全量）。oracle 基准为 main_only 313 行/272 编码/L1–L5——口径不同（全量 BOM 行 vs 候选审计 main_only），不构成矛盾但 507 行未逐行独立核对（沙箱 CSV 无法投递到本地，模型如实说明）。eval 原题标准：BOM 结构题不要求库存审计列或固定表头。
- 判定：**pass（一级结构事实）**——native completed + 零纠错 + L1 九项对 main-only oracle 逐项一致；二级数量与全量 507/408 待核对（或为含替代料口径，未独立证实）。

## N5 `列出 382-000005 的销售订单明细。`

- 原生 completed，39 秒，1 轮 9 步；零纠错通知；溯源 int_cc25247f1e82195dac379335bbece4a5。
- 回答要点（对照 eval/orders-count-status 基准 + 页面快照独立解析 40 行）：
  - **40 条**（total_count=40，全量取回）✓
  - 状态**只有「已确认」**（40/40）✓
  - 单号 **SO0000001–SO0000020（20 条）+ SO0000501–SO0000520（20 条），无区间外** ✓
  - 字段口径正确：product_code（注释「对齐产品 material_number」）查询，未误用订单号字段 ✓
  - 6 行签约≠交付（SO0000005 43/39、SO0000008 44/43、SO0000013 21/19、SO0000502 10/6、SO0000506 3/1、SO0000517 37/35）逐行如实列出，未混淆口径。
- 判定：**pass**——native completed + 零纠错 + 数量/状态/单号区间/字段口径逐项与独立基准一致。

## 限制

- 事实判定基于 eval/supply-ontology.yaml 原题标准与 B 批 oracle 基准；N4 的 507 行全量表未逐行独立复核；N5 的 40 行由快照独立解析核对。
- desktop 形态未复跑 N4/N5（npm 为主验收样本）。
- 用户在隔离 Host（18269）设置页自行配置 DEEPSEEK API key；**更正**：key 值曾进入 n45-current-snapshot.txt（设置页 DOM 快照）；a13adb4 提交暴露、e9b2ed2 仅脱敏最新文件、历史 Git 对象仍可读——按真实密钥暴露处理：撤销由授权持有人执行，历史清理需仓库所有者另行授权，交付 main 时只取脱敏后快照。
