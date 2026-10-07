# 原生回答边界修正（2026-10-07）

经用户确认，bkn-dsh 的职责收回到接入、认证、网络作用域、Interaction、诊断和溯源。OpenBKN 负责业务语义及计算，DSH 模型产生自然语言答案。普通回答不经过插件终答裁决，不追加自动纠错回合，不强制 BOM 表头、行数、库存审计列或缓存文件；未新增 strict/warn 开关、业务计算器或报表导出功能。

移除运行时 `answer-fidelity.ts` 及其旧校验测试，替换为原生输出和访问治理回归。原始工具结果、模型输出、平台错误和历史失败记录保留；历史通知仍可由评测导出器读取。事实正确性继续按原问题与独立数据评测，native completed 仅表示执行完成。

本地验证见 `validation.json`、`local-native-output-runtime.jsonl` 和 `upstream-contract-check.json`。8 个官方核心场景采用脚本模型/工具，证明输出与治理边界，不证明真实模型答案正确。最终 CI 包及实机结果已另行绑定于 [RESULTS.md](RESULTS.md) 和 `current-acceptance.json`：源码 2813f3a、CI 37562531405、tgz 3c345ef6、65 文件。

Mac 原始两题及三道指导收短回归均已原生 completed、零插件纠错通知；真实诊断下载、8 项 CI 文件副本探针和 16 项 live guard 也完成。独立事实分列：销售订单/交期核对通过，完整 BOM 只交付一级 9 项，全量覆盖未通过；结构口径原因解释保留未证实。新 Windows handoff 仅使用新的固定 CI 包和本次原生输出探针；原六项自动纠错探针为历史行为，不再是新候选的预期。未放行发布。
