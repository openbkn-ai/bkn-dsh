# 新指标合同与平台同源摘要边界

2026-11-03，只读窄审。**未发现需要据此改动CI6包或重跑既有矩阵的插件独有缺陷。** 新版metric的原始version/query/model及结果仍透传；下面是复用平台前端的简明摘要边界，不是已复现的跨视图选择误联，也不把静态构造当现场失败。

官方Studio main固定为`4546d6c613619cf755cc1151bc36f2e12b2096bd`；其[call-scope.ts](https://github.com/openbkn-ai/bkn-studio/blob/4546d6c613619cf755cc1151bc36f2e12b2096bd/src/modules/bkn-trace/business-provenance/call-scope.ts)和[Scene](https://github.com/openbkn-ai/bkn-studio/blob/4546d6c613619cf755cc1151bc36f2e12b2096bd/src/modules/bkn-trace/business-provenance/BusinessProvenanceScene.tsx)中的recordedMetricTarget、requestedObjectDescription、operationCondition与当前插件对应逻辑逐字一致，旧release/0.2.0复制来源也采用相同策略。Studio尚无已核release/0.2.1；Foundry1a3自身不含Studio，未核实其固定发布pin，不能据此称最终平台页面已完全对照。

- 业务对象解析elements、显式对象或资源映射优先，最后才按本轮记录的KN+metric_id补定义名称；这个fallback不匹配version/branch，也不读取新query_metric输出model.name。文案是“本轮定义记录”，不能扩大成执行版本的精确名称保证。
- [固定Foundry的版本化存储](https://github.com/openbkn-ai/bkn-foundry/blob/1a3a76edb993d3944afb94a135392d33c90a0432/migrations/bkn-backend/mariadb/0.2.1/01-object-metric-v1.sql)允许同metric_id多version。若只披露V2定义而显式查V1、且没有优先对象映射，fallback可能显示V2的本轮定义名称；两种不同名称均已记录时会回退ID。此为可按合同构造的边界，未称本轮实机已经遇到；官方同源页也如此。
- 条件摘要优先采用平台operation.query.conditions；其fallback未展开新query.filter/time。完整原输入输出JSON仍展示，不补猜版本、换算时间或重算业务。
- 该helper只生成摘要文字，不参与graph/evidence selection、operation ID或Interaction关联。没有证据支持把它写成新的选择串联故障。

本次保持平台同源行为，不单方面修改其业务解释，也未创建未经授权的上游issue。若最终平台同记录页面与插件摘要不同，或后续明确要求执行version/branch精确摘要，再据真实记录做有界适配并上游跟踪；当前发布声明保留上述范围，不改平台/模型输出。
