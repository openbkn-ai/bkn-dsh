# 统一 -7：鉴权恢复与原生输出边界交接

本轮源码 PR #76 独立批准后合入 main `c91fe090e0aac2dc72a4ff1b3d221d72baa432ba`。build-only CI [37570295456](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37570295456) 的原始 tgz `fa168d8113e8dd43348ea4751c7e4d297049e2c1ddced9c586e6d3a1f3f0718c`（165804 bytes / 65 files），交付 Windows 验证时为未发布的统一 -7 候选。本文记录交接与验证；实际发布状态以 npm 和 GitHub Release 记录为准。

- **交 Windows agent**：[WINDOWS-NOTICE.md](WINDOWS-NOTICE.md) 提供固定 commit/下载/ZIP SHA；解压 windows-kit 后执行 [HANDOFF.md](windows-kit/HANDOFF.md)，R1 鉴权恢复、N0–N6 受影响原生输出复测、E1 旧报告补正分别判定。
- **Mac 已完成**：[RESULTS.md](../../evidence/authentication-recovery-20261007/RESULTS.md)：本 CI 安装 65/65、真实 MCP401 → 产品 CLI 正常授权 → 同 Host 恢复、TLS 分类、原配置健康、四份 UI 真实下载、8 项官方核心 fixture、16 项 live guard；selected-file 与进程证据范围明确。
- **Windows 最终回传已复核**：取固定 `19c2dc5a9d5083cc1e59f2dd2d9544ad0394489c` 的[脱敏最终快照](windows-results/RESULTS.md)，主 agent 的[复核与剩余范围](WINDOWS-REVIEW.md)分列实际通过、未验证和历史记录不足。106 项清单全部匹配，两个 Host 形态的 MCP 401 登录恢复成立；N4 仅一级结构事实通过，其他业务事实限制仍保留。
- **本机清单**：[MAC-TODO.md](MAC-TODO.md) 所列已执行，历史不足不追溯补造。
- **单一账户累计发布说明**：[统一 -7 更新说明](../../releases/2026-10-06-unified-7-notes.md)，作者快照至 c91fe09 / 75 项。

先前原生输出候选五题 native completed 与两项事实失败保持历史结论；本次鉴权修复未在 Mac 重跑或宣布质量修复。当前 65 文件新 SHA 的 Windows 验收使用本轮原件，旧 66 文件包的 B 批仅作历史证据。主线 `aecbb7bab2e266c3f6304f6252428386fc813483` 的 [build-only CI 37637573530](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37637573530) 已通过（`publish=false`，实际 npm/GitHub 发布步骤 skipped）；其原始 tgz SHA 与上述验收候选完全相同，65/65 文件字节一致，沿用已记录的验收范围。详细核验凭证见 [PR #78 主线对照](https://github.com/openbkn-ai/bkn-dsh/pull/78#issuecomment-6040479345)。正式 tag、发布与 dist-tag 变更依照项目授权规则执行，保留项不会因 CI 通过而改成通过。
