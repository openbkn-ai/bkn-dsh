# G6 待验与受阻项：保留正式 0.2.0

检查日期：2026-10-21，Asia/Taipei。当前本地插件为 **-27**。本轮没有真实模型 G6 回合，没有新增 Sandbox 执行；不把 Desktop B1 协议检查当成 G6 题通过。完整合同仍未通过。

以下历史结果来自第31轮的同一 **-23** 插件：旧版9 pass / 1 fail / 1未测，新版10 pass / 0 fail / 1未测；其中认证与连接负例沿用第23轮。它们不是 -27 的验收结果。22条逐宿主记录见 [待验矩阵](./g6-pending-matrix.json)，16个历史业务 Interaction 的实际操作名见 [只读路径核对](./g6-historical-operation-paths.json)。本轮仅重新读取操作记录，没有重跑这些业务。

| G6 原题 | 旧版 / 新版历史结果 | 实际依赖与当前待办 |
|---|---|---|
| 销售订单数量和状态 | pass / pass | 旧版有 `run_code`，两版均执行已发布 Python Function；完整原题复验暂缓。 |
| 各成品仓可用库存 | pass / pass | 两版执行 Python Function，仍走 Sandbox；不能因没有 `run_code` 就归为普通查询。 |
| 标准交期 | pass / pass | 两版历史路径仅有对象/Schema查询，无已观察到的 Sandbox 依赖。本轮 -27 未跑真实模型，不能改为 pass；它与下列受阻题分开记录。 |
| 完整 BOM 构成 | pass / pass | 两版有 Function 与 `run_code`，完整 CSV 交付需 Sandbox；暂缓复验399行/333种及各层转述。 |
| BOM 使用量与库存联查 | pass / pass | 两版有 Function 与 `run_code`；完整CSV、库存精度、空值与最终链接需整体复验，暂缓。 |
| 产品本身未结 PR/PO | pass / pass | 两版使用 Python Function；范围保持用户确认的产品本身 PR=0、PO=0，不展开BOM。 |
| 销售订单明细 | **fail** / pass | 旧版未执行已发现的正确Function，错误读取未过滤全表页并误报20单，最终明细遗漏；该失败保留。正确完整Function及CSV路径需要Sandbox。新版历史为40行/13字段完整交付，当前候选仍待复验。 |
| 不存在物料的库存和订单 | pass / pass | 两版历史执行 Python Function；保持无记录与实测0的区别，完整原题暂缓。 |
| 平台 Token 失效 | pass / pass（第23轮） | 前置认证负例本身不要求Sandbox。插件认证/MCP生命周期已变，最终候选须重新验证；本轮UI取消/超时和真实重新登录不替代该模型负例。 |
| 平台不可达 | pass / pass（第23轮） | 连接负例本身不要求Sandbox；最终候选须重新验证并恢复隔离故障环境。本轮未跑该原题。 |
| 无 supply_ontology_hand 权限 | 未测 / 未测 | 缺独立低权限配置，用户已回复“暂缺”。管理员、无效Token和连接错误均不能代替；不重复索取已有答复。 |

Python Function 依赖不是根据工具名称猜测：正式0.2.0源码的 `FunctionExecuteProxy` 读取Python代码并调用 `SessionPool.ExecuteCode`，后者调用 `ExecuteCodeSync`。来源为固定 [正式提交的代理实现](https://github.com/openbkn-ai/bkn-foundry/blob/81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b/adp/execution-factory/operator-integration/server/driveradapters/common/proxy.go#L369)与 [Sandbox会话池](https://github.com/openbkn-ai/bkn-foundry/blob/81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b/adp/execution-factory/operator-integration/server/logics/sandbox/session_pool.go#L160)。这证明执行依赖，不声称所有Function都发生同一种token存储问题。

当前正式平台的 `run_code` event token 持久化缺陷仍存在。用户已明确选择不替换两个服务，两个安全候选只保留本地；该决定已经答复，不作为待审批事项。涉及Sandbox的整题先保留待验，不通过删工具、换题、替换模型答案或只跑直接查询来制造通过结果。没有已获授权的安全执行环境变化时，不启动可能走该路径的真实模型回合。

CE 未挂载非空原生业务解释路由是**独立门槛**，不计作第12道G6题。标准Interaction/operations读取可用；非空原生解释仍沿用已确认的404缺口，不把整个正式版需求改成企业版。Desktop真实模型G6、Windows两种形态、人工联动和最终固定CI候选也继续开放。只依赖查询的题与认证/连接负例应在适当的隔离条件下单独安排；本轮完成的是不调用Sandbox的Desktop/登录/B1边界，不将未执行项标成安全问题或产品失败。
