# 第60轮：六组计划收敛与 #105 非 GUI 材料

2026-10-25。`kind=local-development-preacceptance`，`ciRun=null`，`formalAcceptanceEligible=false`。本轮完成计划/合同/待办收敛、Windows非GUI材料准备和新增校验入口的最小本地验证；没有启动Host/GUI、登录、平台或模型调用，没有构建新插件包，没有推送/CI/远端issue写入。

## 当前执行范围

[六组剩余工作](../../plans/0.2.1/REMAINING-WORK.md)成为当前待办入口；计划README、验收合同、兼容目标、原生合同、原始范围注记、关单规则和CLAUDE已指向相同边界。旧轮次保留证据，不再自动追加当前门槛。

- #105非GUI仅依赖固定Windows runtime、新owned副本/profile、冻结-32/实际MCP解析、合成对照及收态。移除独立GUI、生产签名、W-LIFE、Chrome身份和真实登录前提。
- GUI实际加载/隔离/退出按是否选择GUI回补交付单列，生产签名/公证仅在对外分发修改GUI时适用。旧r1及gui-contract原字节保留，不作为新非GUI入口依赖。
- d20a266原补证不扩容；-31仅U1/溯源/精确800×600，-30独立W-LIFE。未知Job内部因果不扩大为B3全调查，已有B1/argv/tar/UI结果复用。
- 真实非空原生解释、G6安全执行/低权限、Windows rc.3和最终CI候选缺口继续保留；没有以减少重复测试降低这些标准。

## Windows材料身份

新 [r2非GUI材料](../../handoff/2026-10-25-021-host-backport-windows-r2-nongui/README.md)只有本地准备身份，**没有新交接分支或提交**。KIT-FILES为20项，交接清单为22项（均不含各自清单本身）；包含冻结-32和两payload，分别82/12/12文件。-32仍为 `46626510825fe9146aef12c27a1724acbb455aeac22aa600358add0fc8e1c9f8`。

KIT-FILES SHA256：`19e2715b0a88c2989b845466a49f354dd15fb2e2be69c89f57b50e1f21137de5`。材料不带CLI安装包、CA、账号/模型配置、GUI或完整Windows runtime。原生探针、portable-tar和profile-closure沿用r1相同字节；两payload和插件未修改。说明、N0–N3矩阵、非GUI准备步骤、待固定交接的会话提示词及结果模板齐备。[材料回执](KIT-RECEIPT.json)记录外层本机归档和所有清单摘要。

Windows实际Node/Electron、profile初始化/加载和进程收态仍NOT_RUN；缺runtime只能阻塞对应行，不再因缺GUI/签名/W-LIFE整体阻塞。后端通过也不能转记GUI加载通过。未来Git交接需将被忽略的tgz完整纳入固定提交并核对Git blob；本轮不暂存或推送。

## 本地最小验证

固定任务Node24.19.0，只检查本轮新增verify-inputs：

| 验证 | 结果 | 证据界限 |
|---|---|---|
| 新入口语法 | PASS | 不启动Host |
| 含空格路径、无GUI/签名/W-LIFE/Chrome/登录输入 | PASS，exit0；82/12/12文件匹配 | 仅input ready，executionAuthorized=false、Windows NOT_RUN |
| payload被改字节 | PASS：拒绝，exit1 | 无错误PASS输出 |
| 结果文件误写进kit | PASS：拒绝，exit1 | 保留冻结输入集合规则 |

详见[验证摘要](MINIMAL-VALIDATION.json)。三个场景的原stdout/stderr保存在本机release/local-60；未执行原生Windows探针，未运行已通过的语义套件。公共准备校验不冒充native runtime、实际GUI、真实认证、G6或正式候选验收。

## 上游与保留

只读核对两上游，DSH默认头及最新rc.3与第59轮一致；Foundry main新增4提交/75文件，涉及Object Metric MCP App、概念组图分页和managed-finish可靠答案交接等，正式release仍v0.2.0。本轮没有部署/启用新能力或据此改固定合同、提示和fixture，不作未部署main兼容声明。[影响记录](UPSTREAM-IMPACT.json)。

修改范围仅文档、r2准备材料及其Windows字节保留属性。工作树既有修改、索引/HEAD/引用、原r1/d20交接、冻结-30/-31/-32、原Host/ASAR、已记录来源home和个人CLI文件按[保留检查](PRESERVATION.json)核对。未重新审计数据库或整机；平台保持是本轮未实施变更的范围说明，不能据此扩称所有外部状态未变。

当前无需用户登录、选择目录或提供凭据。等待Windows原补证回传统一汇总；后续新Windows执行/交接遵循届时授权，不推送、不跑CI。
