# Desktop F7：绑定、标准问答、来源与重启

固定 CI 候选 `6a946030…`，官方 Desktop Host，隔离 root `/tmp/bkn-firstuse8-mac-desktop`。用户在原生选择器选定 `/private/tmp/bkn-firstuse8-mac-desktop/workspace-supply`，随后通过产品界面绑定 `supply_ontology_hand`。会话为 `session-019f3899-852e-4dc7-a206-8cf9b4b20c3e`。

- `first-turn.json/.md` 为实际标准模式回合的安全派生导出：native completed，界面 31 秒。题目问全网销售订单，答案 800 张/784 已确认/16 执行中。`oracle-*.json` 为作答后真实 CLI 的独立三查询，不声称作答前 oracle，也不把全网 800 当成产品题 40 的口径。
- 执行、图、回执三个来源视图实际打开。图有 26 元素、0 可视边；选定“销售订单数”metric 的 operation/Interaction/receipt，经真实 CLI 查询配对，见 `ui-observation.json`、`selected-receipt-*` 与 `receipt-pairing-check.json`。只验证这一选定链，其他图元素未逐一独立核对。实际遇到的 `run_cypher` 不支持响应保留，没有改写为成功。
- 原 Host PID69392 身份核验停止后，新 Host PID82181 启动；界面恢复同会话、标准模式及原网络。`binding-before/after-restart.json` 与 `restart-binding-check.json` 证明绑定字节一致。
- `post-restart-turns.json/.md` 为续问的实际派生导出：native completed，界面 17 秒，产品 382-000005 为 40 张/全已确认，与独立产品 oracle 一致。平台 evidence_status 的部分状态按原样保留，不声称全部操作成功。

导出通过仓库 `docs/eval/export-supply-session.py` 排除 assistant reasoning 和敏感元数据，属于派生证据，不声称与私密会话压缩文件逐字节相同。背景 Desktop 窗口需要原生 Raise 才能接收输入；未激活时粘贴无效属于操作通道偏差，不计候选缺陷。最终进程收态另见 `../../mac-processes/`。
