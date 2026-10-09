# 固定 -8：Mac npm Host 的真实模型问答

本轮使用 source `23ac2daa6d3538235f33a9627a8178a48f3e1ebf`、CI `37725960498` 的固定包（SHA-256 `6a946030a6152d2899609fac95c66cd246e36cca5a8ce4e5f87ed379cbe706ea`，66 文件）。Host 为官方 npm DSH `0.2.0-rc.2`，隔离 profile，由用户配置 DeepSeek 模型；标准模式、高推理，未增加答案纠错或业务算法。模型选择见 `model-selection.json`，不归档 Key 或模型凭据库。

## 判定

八个实际问答场景中七个取得原生完成态；全 BOM 用量库存题在测试器 300 秒上限后取消，没有最终回答。按仓库现有 G6 判定项评分：**6/8**（正向 6/7、负向 0/1），见 [G6-RESULTS.md](G6-RESULTS.md)。不能将“原生回合完成”或六道题通过描述成全套 G6 通过。

- 订单数量状态、成品仓库存、标准交期、BOM 结构、采购流程、销售订单明细符合各题既有判定项。
- `missing-object` 正确说明目标不存在、三处查询均为零，但补充了其他物料的非零对照数值，未满足既有“不给出任何非零业务数值”要求。未修改评分要求或增加插件输出过滤。
- `bom-usage-inventory` 没有最终交付。六次 `run_code` 在 20013–20034 ms 返回 `Request timed out`；测试器最终取消与这些工具超时分别记录。插件把既有 `toolCallTimeoutMs=20000` 默认值传给官方 `McpClient`，本 profile 未覆盖该值；这说明配置的截止时间，不能据此将慢查询根因只归平台或宣称延长时间必能完成。
- 采购题主要判定项通过，但另附未被要求的 BOM 不同子编码数量为 406，独立物理全量 oracle 为 407（均排除根物料）。这一附加事实有误；不将该题通过扩展成整个回答逐字准确。
- 模型异常题 `invalid-token`、`platform-unreachable`、`unauthorized-network` 未在模型问答层执行。产品 UI/Host API 的故障测试和真实 live guard 是独立证据；无受限账号仍沿用用户决定，不算通过。

## 独立核对与口径

真实 CLI oracle 在对应问答前后采集；两时点所检查的数据稳定。首批四题的 30 个已检查事实通过；追加三题核对 18 个事实，17 个通过，唯一差异为上述附加编码数量。销售订单核对 40 行、11 字段共 440 个单元格；成品仓库存核对 9 条记录及仓库汇总。检查结果见 `first-four-independent-check.json` 和 `additional-independent-check.json`，不能延伸为未经核对的所有说明均正确。

物理 BOM 全量含替代料和根节点为 507 行、6 层；既有发布题要求的 `main_only` 为 313 父子料行、272 物料、5 层，二者不是同一口径。`bom-structure` 仅对一级九项和指定分支进行核对，未声称全物理 BOM 逐行验证。完整 `main_only` 与库存 oracle 在 `full-oracle-before/`、`full-oracle-after/`；CLI 的批量读法与模型的 MCP `run_code` 路径不同，前者成功不能证明后者相同耗时。

## 原件与派生归档

`*-normal/` 保留各场景的起止时间、原生终态、消息和工具结果。归档使用 `helpers/finalize-evidence.py` 移除模型推理块并脱敏凭据字段，明确属于派生导出，不声称与完整私有 session 原件逐字节相同。oracle 原始响应按请求目录归档，评分标记在 `criterion-marks.json`，评分器由 Node 24.19.0 执行。产品诊断下载原件和 UI 溯源另外归档于相邻 `mac-ui/`，不与本目录的测试器导出混称。

本目录不证明 Desktop 模型问答、Windows -8 或正式发布完成；不扩展 -8 的 A0–A5 功能边界。
