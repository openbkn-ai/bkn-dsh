# 三项供应链问答复测方法（2026-10-06）

## 环境和固定边界

- 官方 macOS DSH Desktop：`/Applications/DeepSeek Harness.app`，官方随包 CLI 安装插件；没有修改 Host runtime。
- Host 合同目标：0.2.0-rc.2；模型保持 DeepSeek-V41-Flash / High。
- 标准模式；专用 `workspace-supply` 已绑定 `supply_ontology_hand`；沿用有效账号、正常 CLI Token 刷新及平台 CA，没有降低 TLS 校验。
- 插件基线 `ba9f604c083ea5c9312564b3f6653e116ea90ad9`，隔离分支 `fix/supply-answer-completeness`。只改托管会话的业务回答规则；未改原评测 YAML。
- 当前包是本地开发候选。版本字符串仍为 `0.2.0-rc.2-openbkn.0.2.0-7`，不能仅靠版本字符串识别包；以 `final-candidate-identity.json` 的完整 SHA-256 和安装文件逐字节对比结果为准。
- 历史失败依据为用户指定 `54f6669ed73284a7818acad23a3985a04157c49d` 的 -6 结果；本轮没有重新安装历史 -6，不能宣称进行了同日 -6/-7 严格 A/B。

## 真实问答

每题在官方原生 Desktop 中新建会话，原题逐字提交；最终三题串行执行，前题必须出现 completed 才启动下题。同一固定候选期间不修改模型、插件或网络。问答完成后导出原题、模型文本、完整工具参数/响应及 turn/end；排除系统提示、思考内容和私有配置，凭据字面量脱敏。原始私有会话留在专用 profile，不进入交付包。

原题：

1. `382-000005 的标准交期？`
2. `查询 382-000005 的 BOM 清单，每个物料的使用量，以及每个物料的库存情况`
3. `物料 999-999999 的库存和订单情况？`

人工依据原标准逐项评审含义、来源、口径及无关数字；BOM 另使用 `verify-supply-answer.py` 对每行的层级、父料、子料、名称、单耗和生产可用库存作多重集合对照，不能以统计总数代替明细验收。库存单位、仓范围、预留/在途说明仍需人工核对，脚本不冒充语义评委。

## 独立平台对照

`verify-supply-completeness.py` 使用官方 OpenBKN CLI 0.1.5，独立于模型会话读取同一测试平台：精确物料过滤、字段定义、发布 BOM 能力五层 main_only 完整翻页，以及每批 32 个目标物料的库存分页。其作用是独立执行路径对照，不是独立数据库或独立平台。

- 全树 313 条父子行，272 个不同物料；每层行数 9 / 16 / 38 / 212 / 38。
- 仓范围：苏州半成品仓、苏州成品仓、苏州电子原料仓、苏州无人机原料仓、苏州装配原料仓、乌鲁木齐成品仓、哈尔滨成品仓。
- 生产可用值按该范围内 `available_inventory_qty` 汇总；其字段已扣预留，不再扣一次；不载入采购在途。
- `182-000055` 的库存单位为“张”，`795-000993` 为“包”；有有效仓库存记录的其余物料为“个”。同一物料未发现混合单位。无本范围库存记录的单位不作伪造。
- 无记录对应查询范围内的空集；合计显示 0 不证明所有仓或实体库存为零。
- `oracle` 和 `final-oracle` 为本轮两次现场快照；`data-stability.json` 保留对照结果。CSV 的库存单位后来由各快照原始行补齐，没有改变快照数量。

复用命令（需现有有效登录及相同网络访问权限）：

```sh
NODE_EXTRA_CA_CERTS=/path/to/platform-ca.pem python3 docs/eval/verify-supply-completeness.py --cli /path/to/openbkn-0.1.5 --output /path/to/new-oracle
python3 docs/eval/export-supply-session.py /path/to/session.v4.jsonl.zstd --output /path/to/export
python3 docs/eval/verify-supply-answer.py --answer /path/to/answer.md --oracle /path/to/new-oracle/complete-bom-inventory.json --output /path/to/comparison.json
```

## 平台与试验限制

独立 CLI 也能复现超大执行结果落库失败；执行器本身正常退出，控制平面 MySQL 对 `f_return_value` 或 `f_stdout` 报 1406 后，调用等待最终超时。Issue #2029 交由平台维护者判断和修复。本轮没有改线上表、部署服务或发布函数；平台本地候选保留，但依用户后续范围要求停止推进。这个复现不证明历史每次超时都同因，也不证明 macOS 专属缺陷。

早期并行试验出现 Connection closed。插件每个新 turn 都刷新并 dispose 共享 MCP client，结合时间线，这是并行试验干扰的线索；最终改为串行排除此干扰。没有扩大范围修复并发生命周期，也不宣称并发运行已验收。

此前失败/中止问答按 round1–round5 保留。某些模型尝试 Bash 被现有托管工具限制拒绝；本轮未放宽该限制。修复策略和一次成功问答不证明模型未来每次均遵循策略，不覆盖权限、跨网 guard 或其他评测题。
