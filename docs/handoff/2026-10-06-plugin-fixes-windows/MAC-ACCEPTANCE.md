# macOS 证据：当前 -7 与历史 -6 分列

当前 -7 源码 `e972d319f19e2094740ac12da45684e3ba890e37`，build-only [CI 37407894581](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37407894581)，`publish=false`，tgz SHA `44ca22708d243c5825774b7385de3f8699a51cad04d36477d8755201cf9af424`，65 文件。验收安装下载的 CI 原件；Windows 必须独立执行，不能继承本页的通过标记。

## -7 受影响验收

- 官方 macOS Desktop 0.2.0-rc.2，未改运行时、无 inspector，已装文件 65/65 与 CI 原件一致。
- F01 / #62：同一个真实平台 Interaction，在旧 -6 中来源“未定位”；新 -7 中选择库存、物料均显示 `supply_ontology_hand`。31 个正式元素保留。真实混合网络 Operation 未取得，仅有开发测试覆盖。
- F02 / #63：只破坏 `./business` 导入的真实 S2 变体，业务外框改为原因尚未确定并引导诊断，独立诊断报告 `business-entry/module-resolution-failed`。恢复 CI 原件后 business-entry pass、旧模块失败消失；空 CLI store 的 not-logged-in 为预期。
- 正常路径实际目录 2 个网络，诊断 7/7 pass；正常/S2 报告通过产品按钮与原生保存对话框真正写入 Downloads，绝对路径/报告编号/SHA 保留。
- 插件 308 项（307 pass、0 fail、1 Windows-only skip）；本地仓库 72/72，当前 CI 仓库 57/57，typecheck/package:check/diff-check/pack 通过。

完整受影响证据见 [本轮 RESULTS](../../evidence/diag-followup-20261006/RESULTS.md)、[验收摘要](../../evidence/diag-followup-20261006/ci7-acceptance.json) 与 [来源显示截图](../../evidence/diag-followup-20261006/d01-after-real-graph-material.png)。原规则/模型用例未因插件两项修复改变。

## 旧 -6 调查与历史验收

调查基包 source `144afa503c7d4746cbef01f74eaceff293b88cb5`，CI `37337765993`，SHA `ffcd77722e83a003fe90e0dda296a3a49c3f2ba67bddda9095575dabd896ef43`；也在 history/ 中，仅作为升级或调查基线。

- U01：空 profile、首次安装、同包重启、移除/重装各 3 次，12/12 进入主界面；后 6 次设置可读取。历史启动 RPC 异常未复现，根因仍未知。准备顺序失败另列，时间戳不作为启动性能结论。
- U02：真实 expired=true，经正常 CLI auth token 手动续期后，同一 Desktop 进程/会话恢复目录，login-state recovered=true。当前插件自动续期未实现；真实不可续期未测，未撤销用户 grant。
- Q01：原 missing-object 问题与冻结禁止项，3 新会话+1 有前文+1 重启续接，0/5 通过。独立目标取数都是 0，回答附带其他业务非零数据；归回答质量，不据此称平台目标取数错误。
- 先前完整 G6 为已测 7/10 通过（3 fail），另 unauthorized-network 因无真实受限账号 not-run；严格原评分保留，不以本轮结果覆盖。三个失败为 standard-lead-time、bom-usage-inventory、missing-object。
- 先前 -6 npm/Desktop S0/S2/S4、CLI 0.1.5、真实 ToolRuntime live guard 16/16、R4/R6/R7/R8 与实际下载的证据保留。R5 当时来源未定位是历史失败，不能套用到当前 -7；pending receipt/图完整性仍需如实显示。

调查详见 [本轮 RESULTS](../../evidence/diag-followup-20261006/RESULTS.md)；旧完整验收见 [旧 RESULTS](../../evidence/diag-ui-20261005/RESULTS.md)、[旧 G6](../../evidence/diag-g6-20261006/g6-results.md)。evidence/legacy-diag6/ 的文件未改身份，全部是历史。-7 没有重跑完整真实模型 G6 或完整 npm 矩阵。

模型 Key、CLI Token、授权 URL/码、raw 日志与整个 profile 均未交付；本轮 App 已退出，临时 root 已清理，用户已配置模型的私密隔离 profile 保留。Windows 原生 pwsh/W0–W12、混合网络实机、历史启动根因及完整发布验收仍开放。未发布 npm、未打 tag、未改 dist-tag、未合并。
