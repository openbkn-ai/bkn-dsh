# 统一 -7：原生回答边界修正交接

本次将插件职责收回到接入、认证、绑定网络/工具访问、Interaction、诊断和溯源；业务算法归 OpenBKN、自然语言回答归模型。源码 PR [#74](https://github.com/openbkn-ai/bkn-dsh/pull/74) 最终 head 独立批准后合入，候选仍是一个尚未发布的统一 -7。

- **Windows 执行**：[WINDOWS-NOTICE.md](WINDOWS-NOTICE.md)（固定远端输入与 ZIP 下载）；[详细操作](windows-kit/HANDOFF.md)；[结果模板](windows-kit/RESULTS.template.md)。
- **Mac 已完成**：[RESULTS.md](../../evidence/model-output-boundary-20261007/RESULTS.md)：65/65 安装核验、5 道原题 native completed、零纠错通知、真实诊断 UI/下载、8 项 fixture、16 项 live guard，以及进程和选定日常文件收态。
- **单一累计发布说明**：[统一 -7 更新说明](../../releases/2026-10-06-unified-7-notes.md)，本账户贡献清单核对至源码 2813f3a。

固定候选：source `2813f3ad3e175d94ee747a796f638cc8d1f3e712` → CI `37562531405` → tgz `3c345ef643589fbf79f4958598d4345544c632feac2a3b4f859403db1125b8f0`，65 文件、165176 bytes。kit ZIP 的 SHA 与 CI artifact ZIP 不同，见 `REMOTE-KIT.json`。

**尚未完成发布验收**：Windows 对此新 SHA 的 N0–N6 尚未测；完整 BOM 题只交付一级 9 项，全量覆盖评测未通过，部分口径解释未证实。其余新包 G6/真实受限账号等项目按 RESULTS 分列，不继承旧包通过记录。没有新增插件裁判、业务计算器或报表系统来掩盖这些缺口。本轮未发布、未 tag、未移动 dist-tag。
