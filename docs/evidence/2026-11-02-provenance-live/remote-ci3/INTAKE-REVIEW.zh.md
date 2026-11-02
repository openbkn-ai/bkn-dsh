# CI3 远程实机报告独立接收复核

结论：**报告接收与关键身份自洽，保留 CI3 的单项键盘 FAIL，不得标正式验收通过。** 远程报告中的通过项可作为“指定远程测试者的原生观察”接收；本接收方只独立验证公开报告字节、身份和内部边界，没有复制/审查远程私有原件，也没有重演 Host 或全业务库审计。

## 接收完整性

已重新计算两份原报告的字节数和 SHA-256，与 [RECEIPT.json](./RECEIPT.json) 一致；JSON 可解析。两份原报告未改字节：

- `REMOTE-E2E-REPORT.json`：9215 字节，`fe0aae02adbd78fa59fb0b08dcedacd556e17d39b8a4e56159aeb6a12fabf9d9`。
- `REMOTE-E2E-REPORT.zh.md`：3663 字节，`249bf92b5c535bb390ec16524e5ad0c8886cc30c46784b4944b4ec6fe3b21fc7`。

报告的 `f13fe10c…`、CI41404675956、artifact13122759006、fea3 TGZ 摘要/877043 字节/126 文件，与主任务已独立核对的 CI3 实际产物身份一致。126/126 实际安装、进程和私有截图属于远程原生证据范围；不能把本接收复核写成接收方亲自观察了远端内存或私有全部文件。

## 可接收的通过与限制

| 分类 | 接收结论 |
| --- | --- |
| 安装与真实入口 | 远程报告官方 GUI 安装启用及新场景实载，从合法本机 Session/finish 回执打开同一 Interaction 的 6 次调用；没有用 API-only 或注入 handle 替代。CLI 拒绝 desktop 管理的 exit1 历史保留，不升级为 CLI 安装通过。 |
| 只读展示与系统交互 | 同记录 Operation 选择、原文/筛选/partial、原文 Popover、OS 粘贴和原生 Save 可按报告接收。Markdown 为5842字节，摘要及160处平台“请求失败。”原文保留；不是 JS Clipboard mock、普通文件写入或 AX 文本串替代。 |
| 解释生成与图谱 | 接收“显式生成一次，平台资源从 not_generated 到 ready，原文/图谱可读和部分选中项 ID 对照”。3条 claims、0条 uiSupportedClaims、10处 invalid_schema_reference 及 partial 原样展示；不等于业务结论成立、invalid 被插件验证通过，也不等于144节点/234边整图已逐项验收。此样本的真实 invalid 展示已有远程平台字段/界面证据，可从 UNKNOWN 收为报告级原生展示通过。 |
| 分析链路 | 接收“仅开侧栏、显式启动一次、可见进度/终态/已持久化 history、只读重开一致”。completed / not_evaluable / 0建议保持原值；不代表业务结果有效、模型输入完整或已证明输入丢失。 |
| 焦点失败 | 分析后直接 Escape 未关闭侧栏为确定的远程 UI FAIL；Tab 后可关闭不覆盖该失败。AX HTML content node 是观察，不足以独断 DOM activeElement 或唯一根因。此前正常层内 Escape、Tab 和关闭按钮通过仍与此 FAIL 分别记账。 |

生成的真实 POST 详细字段未在接收材料中逐项取证；这里接收的是 UI 显式动作和平台生成资源前后状态，不补造协议原件。分析实际 POST、当次 Host refetch 摘要、provider-bound 消息及原始 SSE 帧也未捕获，必须保留 UNKNOWN。侧栏预取 Markdown、固定源码的 `{markdown}` 发送逻辑、前后 Markdown 相同和模型“没有事实输入”的自述，均不能单独证明当次实际送达模型的输入。

## 红线与待验收项

报告明确没有应用建议、改写问题/答案/操作时间链或干预 invalid，原始 Session 和已检查日常文件的保留边界也有陈述。此范围符合“平台业务语义与状态、模型自然语言输出由原系统拥有”的红线。授权的解释/分析记录确实新增，不得把 `businessWriteRequested=false` 解释为平台完全没有写入，也不能声称整台机器或业务库字节无变化。

仍未覆盖：远程无合法本机 Session 关联的主机双轮、BOM59、大记录预算、managed 父/内部调用；真实在途取消/迟到、异常网络/认证、Windows、全平台兼容，及诊断中未采集的实际子解释器和部署镜像身份。6调用单 Session 和 API 读取不能代填这些项。本地主会话此前7f5旧包的双轮/BOM只读实测仍是历史证据，不归入 CI3 或 CI4。

刷新后调用详情回首项、局部全屏退出按钮邻近外层关闭等观察继续独立保留：尚未隔离触发点或对照 Studio，不在本接收复核中新判缺陷/无缺陷。没有发现报告把上述边界过度升级为全通过。

CI4已另出精确包，需对焦点修复执行受影响原生复验；其结果另存，不能覆盖本 CI3 报告、失败原件或此时 `formalAcceptanceEligible=false`。本复核仅新增本文，未改报告原件、生产代码、包、配置或平台/模型输出。
