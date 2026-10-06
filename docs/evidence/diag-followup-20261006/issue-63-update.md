已修复默认错误提示，并完成受影响的 macOS 官方 Desktop 实机复验。

未知连接/RPC 失败现在说明“当前原因尚未确定”，引导点击右上角“诊断”查看检查结果及导出报告；不再无依据归因于 Token 或地址。已知 CLI、登录和平台错误的具体提示继续保留。

修复源码：[e972d31](https://github.com/openbkn-ai/bkn-dsh/commit/e972d319f19e2094740ac12da45684e3ba890e37)，分支 `fix/diagnostics-d0-s2`。固定候选 `0.2.0-rc.2-openbkn.0.2.0-7` 来自成功的 [build-only CI 37407894581](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37407894581)，`publish=false`；下载 tgz SHA-256 为 `44ca22708d243c5825774b7385de3f8699a51cad04d36477d8755201cf9af424`（65 文件）。实机安装内容 65/65 与该 CI 原件一致。

从该 CI 原件构造 S2 变体，只给 `exports['./business']` 对应文件增加受控缺失导入。业务外框显示新的诊断引导；独立报告为 `business-entry fail/module-resolution-failed`，bootstrap/diagnostics pass。恢复原 CI 包后，business-entry 回到 pass、旧模块失败消失。恢复 profile 没有登录凭据，其 `not-logged-in` 单列为预期状态，未声称全绿。

见 [旧提示](https://github.com/openbkn-ai/bkn-dsh/blob/f3cc137e153c6be3cb28335967f87f72d702fa1c/docs/evidence/diag-followup-20261006/d02-before-real-s2.png)、[新提示](https://github.com/openbkn-ai/bkn-dsh/blob/f3cc137e153c6be3cb28335967f87f72d702fa1c/docs/evidence/diag-followup-20261006/d02-after-real-s2.png)、[S2 独立诊断](https://github.com/openbkn-ai/bkn-dsh/blob/f3cc137e153c6be3cb28335967f87f72d702fa1c/docs/evidence/diag-followup-20261006/ci7-s2-diagnostics.png)、[变体基包/修改文件/前后 SHA](https://github.com/openbkn-ai/bkn-dsh/blob/f3cc137e153c6be3cb28335967f87f72d702fa1c/docs/evidence/diag-followup-20261006/ci7-s2-variant.json) 与 [受影响验收摘要](https://github.com/openbkn-ai/bkn-dsh/blob/f3cc137e153c6be3cb28335967f87f72d702fa1c/docs/evidence/diag-followup-20261006/ci7-acceptance.json)。正常候选另测真实目录 2 个网络、诊断 7/7 pass；正常/S2 产品 JSON 都实际保存至 Downloads，并保留路径、报告编号与 SHA。

新增未知错误/gateway 提示回归；插件全套 308 项（307 pass、0 fail、1 Windows-only skip），当前 CI 仓库 57/57；typecheck、package:check 和 pack 通过。[RESULTS](https://github.com/openbkn-ai/bkn-dsh/blob/f3cc137e153c6be3cb28335967f87f72d702fa1c/docs/evidence/diag-followup-20261006/RESULTS.md) 保留三项独立调查及限制。

固定包及 Windows F02/W3/恢复步骤在 [新交接](https://github.com/openbkn-ai/bkn-dsh/blob/f3cc137e153c6be3cb28335967f87f72d702fa1c/docs/handoff/2026-10-06-plugin-fixes-windows/WINDOWS-START.md)。尚未合并或 npm 发布，Windows 与完整发布验收仍待完成，issue 保持开放跟踪。
