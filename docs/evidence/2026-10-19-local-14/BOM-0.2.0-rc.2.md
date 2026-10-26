# supply_ontology_hand eval results

date: 2026-10-19T15:21:52.857Z

set_sha256: 6b08ceb80bc2137adfb280637f8dd3b56d055282e0863725b09ea4a4d0924edf

positive: 0/1 · negative: 0/0 · total: 0/1

## orders-count-status — NOT-RUN
- 未执行；前提缺失的原因见本次运行证据，不纳入通过率分母。

## finished-goods-inventory — NOT-RUN
- 未执行；前提缺失的原因见本次运行证据，不纳入通过率分母。

## standard-lead-time — NOT-RUN
- 未执行；前提缺失的原因见本次运行证据，不纳入通过率分母。

## bom-structure — NOT-RUN
- 未执行；前提缺失的原因见本次运行证据，不纳入通过率分母。

## bom-usage-inventory — FAIL
- [x] 含期望事实：一级主料 9 个（仅主料口径，不含替代料）
- [x] 含期望事实：明确采用发布函数 main_only 口径时，共 5 层、313 条父子料行、272 个不同物料
- [ ] 含期望事实：给出各物料单耗与库存，并说明库存口径（仓范围、是否含在途/占用）
- [ ] 含期望事实：一级主料中 528-000036 生产可用库存 34；791-000007 与 791-000015 为 0
- [x] 不含禁止项：调用被插件拒绝后直接放弃，或编造 BOM 明细
- [x] 不含禁止项：未注明来源或口径的库存数字
- [x] 不含禁止项：将本体优先级规则的 399 行/333 种与发布函数 main_only 的 313 行/272 种混为同一口径而不说明冲突
- [x] 不含禁止项：声称文件已交付，但仅提供平台 Sandbox 或不存在的本地路径，或 present 已失败

## purchase-flow — NOT-RUN
- 未执行；前提缺失的原因见本次运行证据，不纳入通过率分母。

## sales-order-detail — NOT-RUN
- 未执行；前提缺失的原因见本次运行证据，不纳入通过率分母。

## missing-object — NOT-RUN
- 未执行；前提缺失的原因见本次运行证据，不纳入通过率分母。

## invalid-token — NOT-RUN
- 未执行；前提缺失的原因见本次运行证据，不纳入通过率分母。

## platform-unreachable — NOT-RUN
- 未执行；前提缺失的原因见本次运行证据，不纳入通过率分母。

## unauthorized-network — NOT-RUN
- 未执行；前提缺失的原因见本次运行证据，不纳入通过率分母。

