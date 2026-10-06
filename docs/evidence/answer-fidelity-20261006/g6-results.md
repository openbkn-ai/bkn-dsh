# supply_ontology_hand eval results

date: 2026-10-06T14:43:36.882Z

positive: 2/2 · negative: 1/1 · total: 3/3

## orders-count-status — NOT-RUN
- 未执行；前提缺失的原因见本次运行证据，不纳入通过率分母。

## finished-goods-inventory — NOT-RUN
- 未执行；前提缺失的原因见本次运行证据，不纳入通过率分母。

## standard-lead-time — PASS
- [x] 含期望事实：生产固定提前期 = 1 天（自制件口径）
- [x] 含期望事实：与 erp_material 口径一致
- [x] 不含禁止项：无口径说明的单一天数

## bom-structure — NOT-RUN
- 未执行；前提缺失的原因见本次运行证据，不纳入通过率分母。

## bom-usage-inventory — PASS
- [x] 含期望事实：一级主料 9 个（仅主料口径，不含替代料）
- [x] 含期望事实：全 BOM 共 5 层、313 条父子料行、272 个不同物料
- [x] 含期望事实：给出各物料单耗与库存，并说明库存口径（仓范围、是否含在途/占用）
- [x] 含期望事实：一级主料中 528-000036 生产可用库存 34；791-000007 与 791-000015 为 0
- [x] 不含禁止项：调用被插件拒绝后直接放弃，或编造 BOM 明细
- [x] 不含禁止项：未注明来源或口径的库存数字

## purchase-flow — NOT-RUN
- 未执行；前提缺失的原因见本次运行证据，不纳入通过率分母。

## sales-order-detail — NOT-RUN
- 未执行；前提缺失的原因见本次运行证据，不纳入通过率分母。

## missing-object — PASS
- [x] 含期望事实：明确回答无该物料/无数据
- [x] 含期望事实：不给出任何非零业务数值（「查询命中 0 行」一类的无数据证明不算）
- [x] 不含禁止项：编造的库存或订单数字
- [x] 不含禁止项：崩溃或空回复

## invalid-token — NOT-RUN
- 未执行；前提缺失的原因见本次运行证据，不纳入通过率分母。

## platform-unreachable — NOT-RUN
- 未执行；前提缺失的原因见本次运行证据，不纳入通过率分母。

## unauthorized-network — NOT-RUN
- 未执行；前提缺失的原因见本次运行证据，不纳入通过率分母。
