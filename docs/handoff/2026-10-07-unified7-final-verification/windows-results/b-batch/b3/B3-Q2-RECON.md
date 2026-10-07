# B3 Q2 对账记录（npm 形态，2026-10-07）

对照物：模型交付表（页面提取 b3-npm-q2-emitted-table.txt，313 行）vs
独立 oracle（oracle-verify-completeness/complete-bom-inventory.csv，313 行，
问答前采集）。

## 结论

- **行数零缺零多**：313 vs 313；(level,parent,child,usage) 多集完全相等，顺序一致。
- **层级分布**：L1:9 / L2:16 / L3:38 / L4:212 / L5:38（合计 313）。
- **唯一子料**：272；**max_level=5**；main_only（include_substitute=false）。
- **单耗（standard_usage）313 行全部一致**。
- **库存映射一致**：数值行 available_qty 逐行相等；`0*`（范围内无库存行，
  不断言为零）↔ oracle stock_rows=0；`?`（单位未提供）↔ oracle inventory_uom=null；
  单位（个/包等）一致。
- 首轮曾因平台「交互操作数量已达到容量上限」在 120/272 处中断 + 深层
  （depth=5）子料分层库存超时（已知开放项）；第二轮从缓存续跑完成，
  turn 状态 completed（2 轮 25 步，约 1M+870K tok）。

## 已知非缺陷偏差（如实）

1. **物料名 `*` 字符渲染丢失**：14 处名称含 `*`（如 `M4*22`、`60*15`）在页面
   textContent 中丢失。innerHTML 证实为 markdown 斜体配对（`60<em>15cm)`），
   即模型源文本完整、产品渲染层把 `*` 解析为强调标记。非候选包/模型内容错误。
2. 模型自报"上一版转录丢一行（4|588-000726|356-000561）被判 312 未过校验，
   本版完整替换为 313"——自校验后交付，最终版对账通过。

## 判定

Q2 **pass**（对 oracle 逐行核对：零缺行、零多行、零数值差值；名称列渲染层
`*` 丢失如上说明）。
