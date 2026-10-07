# 统一 -7：鉴权恢复与原生输出边界交接

本轮源码 PR #76 独立批准后合入 main `c91fe090e0aac2dc72a4ff1b3d221d72baa432ba`。build-only CI [37570295456](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37570295456) 的原始 tgz `fa168d8113e8dd43348ea4751c7e4d297049e2c1ddced9c586e6d3a1f3f0718c`（165804 bytes / 65 files），仍为未发布统一 -7。

- **交 Windows agent**：[WINDOWS-NOTICE.md](WINDOWS-NOTICE.md) 提供固定 commit/下载/ZIP SHA；解压 windows-kit 后执行 [HANDOFF.md](windows-kit/HANDOFF.md)，R1 鉴权恢复、N0–N6 受影响原生输出复测、E1 旧报告补正分别判定。
- **Mac 已完成**：[RESULTS.md](../../evidence/authentication-recovery-20261007/RESULTS.md)：本 CI 安装 65/65、真实 MCP401 → 产品 CLI 正常授权 → 同 Host 恢复、TLS 分类、原配置健康、四份 UI 真实下载、8 项官方核心 fixture、16 项 live guard；selected-file 与进程证据范围明确。
- **本机清单**：[MAC-TODO.md](MAC-TODO.md) 所列已执行，历史不足不追溯补造。
- **单一账户累计发布说明**：[统一 -7 更新说明](../../releases/2026-10-06-unified-7-notes.md)，作者快照至 c91fe09 / 75 项。

先前原生输出候选五题 native completed 与两项事实失败保持历史结论；本次鉴权修复未重跑或宣布质量修复。旧 Windows 66 文件包的 B 批通过不能接受这个 65 文件新 SHA。没有发布/tag/dist-tag 授权。
