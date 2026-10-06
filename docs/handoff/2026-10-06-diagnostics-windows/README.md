# Windows 诊断验收包

目标：验证当前 -6 UI 修订后的 CI 候选。入口为 **OpenBKN → 面板右上角“诊断”**，侧栏没有第二个诊断入口。

**Windows agent 从 [WINDOWS-START.md](WINDOWS-START.md) 开始**：包含可复制任务、远端获取命令、固定 ZIP/tgz 哈希及测试顺序。完整验收 ZIP 已纳入本分支的 [assets/windows-diag6-144afa5-g6.zip](assets/windows-diag6-144afa5-g6.zip)，代码和包可以一起从远端取得；获取信息见 [REMOTE-KIT.json](REMOTE-KIT.json)。

依次阅读 HANDOFF.md、REGRESSION.md、RESULTS.template.md；在原生 PowerShell 运行 verify-kit.ps1，再按桌面/npm 两形态完成 W0–W12。原生 PowerShell 试跑属于本任务，不能以 macOS 静态复核替代。

候选及 CI 身份见 candidate-manifest.json。完整离线 ZIP 包含 candidate/ 与 history/ 资产；仓库内这份目录是交接源文件，拿到完整 ZIP 后再执行 verify-kit.ps1。任何 SHA 不一致立即停止该候选的通过判定。不重建 lib、不改包、不改宿主、不开 inspector、不合并、不发布、不打 tag、不移动 dist-tag、不发送其他聊天消息。你不是唯一开发者，保留其他人的改动。

迁移说明见 MIGRATION.md；原故障用户的安装与报告采集见 CUSTOMER-DIAGNOSIS.md。先做原生 PowerShell 解析及 W0/W1，再按 HANDOFF.md 矩阵和 REGRESSION.md 执行。eval/run-eval.mjs 只是评分器，不能执行模型问答；没有真实问答及权限拒绝证据时对应项留未测。

本轮诊断交付还用于帮助最初故障用户定位原因；验收通过后可按 CUSTOMER-DIAGNOSIS.md 提供固定候选及操作步骤，用户机器的根因须从其报告判定。
