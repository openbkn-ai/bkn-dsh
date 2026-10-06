已在修复候选中解决，并完成受影响的 macOS 官方 Desktop 实机复验。

元素的来源网络现在只从授权平台业务图的规范 `technical_ref` 提取，并保存到每个业务元素；UI 使用所选元素的来源。混合网络 Operation 不会取第一条引用作为所有元素的共同来源；非法/未知引用仍保持未定位，不以当前绑定网络或模型文本猜测。

修复源码：[e972d31](https://github.com/openbkn-ai/bkn-dsh/commit/e972d319f19e2094740ac12da45684e3ba890e37)，分支 `fix/diagnostics-d0-s2`。固定候选 `0.2.0-rc.2-openbkn.0.2.0-7` 来自成功的 [build-only CI 37407894581](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37407894581)，`publish=false`；下载 tgz SHA-256 为 `44ca22708d243c5825774b7385de3f8699a51cad04d36477d8755201cf9af424`（65 文件）。实机安装内容 65/65 与该 CI 原件一致。

真实复验读取旧版失败时的同一个 Interaction：旧 `-6` 来源显示“未定位”；新 CI `-7` 分别选择库存、物料，均显示 `supply_ontology_hand`，31 个正式元素保留。见 [修复前截图](https://github.com/openbkn-ai/bkn-dsh/blob/f3cc137e153c6be3cb28335967f87f72d702fa1c/docs/evidence/diag-followup-20261006/d01-before-real-graph.png)、[修复后库存](https://github.com/openbkn-ai/bkn-dsh/blob/f3cc137e153c6be3cb28335967f87f72d702fa1c/docs/evidence/diag-followup-20261006/d01-after-real-graph-inventory.png)、[修复后物料](https://github.com/openbkn-ai/bkn-dsh/blob/f3cc137e153c6be3cb28335967f87f72d702fa1c/docs/evidence/diag-followup-20261006/d01-after-real-graph-material.png) 与 [受影响验收摘要](https://github.com/openbkn-ai/bkn-dsh/blob/f3cc137e153c6be3cb28335967f87f72d702fa1c/docs/evidence/diag-followup-20261006/ci7-acceptance.json)。真实混合网络 Operation 未取得；该分支以及未知/非法引用有开发回归覆盖，未冒充实机结果。

插件全套 308 项（307 pass、0 fail、1 Windows-only skip），当前 CI 仓库 57/57；typecheck、package:check 和 pack 通过。完整调查及开放项见 [RESULTS](https://github.com/openbkn-ai/bkn-dsh/blob/f3cc137e153c6be3cb28335967f87f72d702fa1c/docs/evidence/diag-followup-20261006/RESULTS.md)。

Windows 的 F01 / F02 / -6→-7 升级步骤和固定包已随 [新交接](https://github.com/openbkn-ai/bkn-dsh/blob/f3cc137e153c6be3cb28335967f87f72d702fa1c/docs/handoff/2026-10-06-plugin-fixes-windows/WINDOWS-START.md) 提交远端。当前是已修复候选，尚未合并或 npm 发布；Windows 与完整发布验收仍待完成，issue 保持开放跟踪。
