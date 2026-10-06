# Historical notice — superseded by the answer fidelity repair

Do not start the next Windows retest from the candidate named below. It is the earlier `7553cc1` artifact that failed Mac answer-delivery checks. The next notice will bind the approved repair, new build-only CI artifact and Mac validation; its identity must be used for the next retest.

---

# 可转发给 Windows agent 的复测通知

统一 -7 已固定并提交到远端，可以开始无需登录的受影响复测。当前候选用于验证，不授权发布；Mac同包的BOM回答及源表名准确性仍有阻塞。先按以下固定身份拿包，不从本机临时目录或其他CI取替代包。

- 交付 commit：`92f697744bd6c5b18662689ee3088fb46374d9ac`（分支 `release/unified-7-acceptance`）。
- 插件版本：`0.2.0-rc.2-openbkn.0.2.0-7`。
- 包源码 commit：`7553cc13a17e80b87e4d8b2b22381ab8f05bc22d`；build-only CI：`37447961098`，`publish=false`。
- tgz SHA-256：`4e4f7c3d44453038b4f2a723ec5334c443565ef0628e1e295bd339eda8f14d86`，166727 bytes，65文件。
- [固定ZIP下载](https://raw.githubusercontent.com/openbkn-ai/bkn-dsh/92f697744bd6c5b18662689ee3088fb46374d9ac/docs/handoff/2026-10-06-release-7/assets/windows-unified7-7553cc1.zip)：SHA-256 `4a2c3112b4314961f32068df3939792c4118a8a259bec20f38744f16f1fdb2de`，227496 bytes。本机已从该远端URL实际下载并核对逐字节一致。
- [获取/核验命令](https://github.com/openbkn-ai/bkn-dsh/blob/92f697744bd6c5b18662689ee3088fb46374d9ac/docs/handoff/2026-10-06-release-7/windows/README.md)：把 `$UnifiedDeliveryCommit` 填为上面的40位交付SHA。
- [操作HANDOFF](https://github.com/openbkn-ai/bkn-dsh/blob/92f697744bd6c5b18662689ee3088fb46374d9ac/docs/handoff/2026-10-06-release-7/windows/HANDOFF.md) 与 [回传模板](https://github.com/openbkn-ai/bkn-dsh/blob/92f697744bd6c5b18662689ee3088fb46374d9ac/docs/handoff/2026-10-06-release-7/windows/RESULTS.template.md)。

先在原生PS5.1执行verify-kit，然后两形态优先验证非法baseUrl报 `configuration-invalid/configField=baseUrl` 且诊断可导出，再测正常、故障隔离、#62/#63受影响路径、脱敏、恢复、卸载重装和用户状态。旧Windows helper的实测修正已原样吸收；新版verifier仍须Windows冒烟。

取消旧版就地升级矩阵。完整移除插件后安装固定包，保护整个用户DSH_HOME、凭据、模型、会话和无关patch。没有账号时登录、真实来源图、G6/live guard记not-run；受限账号按用户决定保持not-run。不要动main、打tag、发布npm、改dist-tag或在固定包上改代码凑通过。结果提交到独立docs分支，回传commit、脱敏JSON、报告id、下载路径/SHA和真实证据级别。

本通知为可转发材料；主agent未自动向其他聊天发送消息。
