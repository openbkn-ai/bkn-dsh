# B4 live guard 结果（npm 形态，2026-10-07）

## 用例 1：未绑定会话工具执行拒绝

- 操作：默认工作区（未绑定网络）标准模式新会话，问"查询物料 382-000005 的库存和物料名称"。
- 结果：**平台实际拒绝**（非模型自觉回避）——模型尝试调用 OpenBKN 工具后被平台返回
  不可重试错误："OpenBKN tools are available only in a session bound to an OpenBKN
  knowledge network."；回答如实说明无法执行并引导绑定。turn completed（6 秒）。
- 证据：b4-npm-unbound-sent-snapshot.txt。

## 用例 2：跨网络数据隔离（两个已授权网络）

- 前置：worldcup_vega_catalog_bkn 绑定工作区
  `C:\bkn-verify\unified7-fidelity-npm\workspace-worldcup`（绑定过程
  b4-worldcup-bound-snapshot.txt；会话入口显示"了解「Fjelstul 世界杯 · Vega Catalog
  绑定（占位符）」知识网络"）。
- 操作：该绑定会话内问"查询物料 382-000005 的库存数量和物料名称"（supply 网络数据）。
- 结果：回答"未找到"，明确限定"本会话绑定的知识网络 worldcup_vega_catalog_bkn …
  不存在任何物料/库存类对象"；**未发生跨网数据披露**。溯源（int_58af4b27…）
  仅含 run_code×3 与 get_kn（本网元数据检查），无针对 supply 网络的成功查询。
- 证据：b4-npm-cross-network-snapshot.txt、b4-npm-cross-network-trace-snapshot.txt。

## 判定与范围

- 两用例均 pass：未绑定硬拒绝（平台错误为准）+ 跨网隔离（行为级，溯源佐证）。
- 范围限制（如实）：macOS 侧 live guard 曾跑 16 用例；Windows 本轮执行上述 2 个核心
  用例（未绑定拒绝、跨网隔离），其余 live guard 用例（PTC 模式、定义可见性细分等）
  未执行，不宣称"live guard 全量通过"。
- desktop 形态 live guard 未执行（待用户决定 desktop 侧复测范围）。
