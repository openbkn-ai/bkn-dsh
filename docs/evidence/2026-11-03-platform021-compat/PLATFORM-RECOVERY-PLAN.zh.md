# 50.28 目标迁移修复：后续范围与门槛

2026-11-04：维护者选择先上报 [openbkn-deploy #82](https://github.com/openbkn-ai/openbkn-deploy/issues/82)，关联 #36，指派沿用既有分工的 `leecky` / `lbb1656`；已回读确认。下列本地修复及共享平台恢复仍是后续计划，不能把创建issue当作执行恢复授权。

本文件是只读诊断后的具体工作范围，不是平台恢复已经执行或获准写入的回执。CI6包、DSH插件、已有问答和模型输出保持。[当前RCA](./EE028-READONLY-RCA.zh.md)与[输入证据](./CALL-FACTS-INPUT-BOUNDARY.json)已准备；Mac原生鼠标及SourceText限定补证已核收，原样本迁移恢复仍独立待处理。

范围纠偏：本计划解决原样本历史迁移问题，不是所有Mac展示测试前置。Mac已复用Windows真实原生会话副本完成[限定UI补证](./MAC-SOURCE-TEXT-CLOSEOUT.zh.md)；原样本恢复仍由平台owner独立处理，不默认重跑UI。

## 第一阶段：平台迁移器本地修复与离线回归

该项属于 `openbkn-deploy` / 平台迁移工具范围，超出本轮DSH验收与只读RCA；尚未开始修改代码。

1. 固定工作树、实际runner和nativevalidator身份，保留原run/backup/manifest。原数据不修改，新计划与日志只写任务私有目录。
2. 修复 `historical_trace_data/core_history.py` 的持久化terminal信封→原生DTO映射，复用平台原生storage codec语义：将控制metadata按原规范归位到CallFact `evidence_completion`，保持Output/Error业务内容及其原字节/哈希含义。禁止简单丢弃 `_trace_evidence_completion`、重算正文掩盖错误，或用summary/DSH/模型结果替换源值。
3. 离线回归覆盖：无控制字段旧记录；带合法控制metadata的output/error；嵌套业务JSON恰有同名键；缺失/错误类型/损坏哈希或durability状态；原input/output/error不变；重复转换及冲突即停。无效输入忠实保留并说明，不能纠正成通过。
4. 固定来源的native `--validate-core-records` 对目标组离线校验。禁止运行会Pod exec的Python原生包装器、import模式或假dry-run。完整输入和诊断输出均私有0600，不输出业务正文。

本地回归和native输入校验通过，只能证明转换/合同；不代表当前平台已导入、原文已可读或S1–S3通过。

## 第二阶段：共享平台恢复的单独审阅

第一阶段结束后再提交精确恢复计划与差异，才申请共享平台写入授权。审阅至少包含：

- 目标仍为原50.28企业版记录（原C/I与6operations），不得重绑DSH会话或新造问题/解释/分析。
- 明确目标组及其原始依赖artifact范围；不能据整批4条排除数量推断要恢复的ID。ID/owner/request/trace及原标量内容保持，权威备份与storedhash私有核验。
- 使用正式平台导入流程，已有同一记录幂等复用、不同记录冲突即停；不得直接PUT两条绕过原生组预检。
- 不删索引、不切alias、不改采集/授权策略、不全量重迁移、不重跑已verified记录；如工具无法限定范围则停止，修改方案后再审阅。
- 记录恢复前元数据、预期新增/关联范围、失败与回退边界。不得以回退之名删除原记录或隐藏平台失败原因。

`--import-artifact-records` 是真实写入＋回读，既有store预读也可能EnsureIndex/PUT mapping，不能未经审阅当只读预检。

## 第三阶段：只读读回与原定Mac三项

正式恢复后，私有核原文精确一致性/owner/scope，核平台原生detail实际披露原文字段及原S/C/I/Operation身份；不重新调用模型。Mac仅重新核当次DSH前台和坐标，然后补S1正文覆盖/留驻Escape、S2真实padding/arrow重叠、S3键盘Escape及首次真实hover。没有实际几何就记录准确限制，不伪造PASS。

正式CLI0.2.1安装继续独立待验。无本插件改包、重复安装、Windows重跑、远端CI或发布步骤。
