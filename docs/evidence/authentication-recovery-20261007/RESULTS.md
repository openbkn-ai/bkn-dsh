# 明确鉴权失败的界面恢复修复

本轮修复 Windows 旧候选的实际症状：本地仍保存凭据，但 Context Loader MCP 返回 401 时，OpenBKN 面板仅有“重试/诊断”，需要用户另行执行 CLI 登录才能恢复。修复只保留已有鉴权分类并接入已有 CLI 登录入口。CLI 继续负责凭据与续期；插件不管理跨客户端 token 共享，不裁决模型回答，不增加业务算法。

## 输入与复现

- 旧候选 source `3414bdec3c956cc0d580aebd959ac6f3439bb352`，CI `37478119730`，tgz `6bbab278…` / 66 文件。
- Windows 固定证据 commit `09018faeeb476c6f93c4557b35c151f97839a8b1`，`docs/handoff/2026-10-07-unified7-final-verification/windows-results/b-batch/b3-desktop/d-token-invalid-panel-axtree.txt`：明确出现“重试”和未知原因提示，没有登录入口。该文件是旧包症状，不作为新包验收。
- 修复基线 main `27ca05486b09ab6ba9a0315ab310913f6e9b9dc3`。相关 auth/service/controller/overlay 文件自旧候选至该基线未改动。
- `regression-before-fix.txt` 保存从 CLI subprocess → AuthCoordinator → MCP manager → service Remote → UI controller 的受控调用链失败：4 项均失败。测试中的凭据为公开固定测试字符串，不使用真实用户 token。它补足跨层回归，不能替代真实 Windows UI。

## 修复与本地验证

- 已知 MCP 401/403 用不附带原始 cause 的安全错误保留状态；支持 SDK `data.cause` 包装。
- MCP 401 映射 `openbkn/authentication-required`，现有 UI 显示 CLI 登录并同步。登录后仍被拒绝时保持该状态，不伪报成功。
- 403 保留账号访问拒绝提示；TLS/连接/未知原因继续走错误与诊断，不推测重新登录能恢复。
- 平台目录请求的 401 和 403 分开，提示包含实际来源，不再把 MCP 401 写成“MCP 已连接”。
- 全套插件 320 项：319 pass / 0 fail / 1 skip；repo + Node eval 63/63；typecheck、package:check、diff-check、pack 通过。`regression-after-fix.txt` 为集中回归原生输出。
- 最新上游核对：DSH master / 最新 tag `dsh-v0.2.1-alpha.1` 仍为 `5badb15009ae1756c3afe0ae0cef1faafc290ccc`；支持的 `dsh-v0.2.0-rc.2` 为 `639ed015397290b3745d163aafe02ffee4aa3f84`。Foundry main 仍为 `4a0db7799bc2f29aeeeb190bbecd8c7f6a90360f`，最新正式 release `v0.1.5`。本轮不升级 pin 或平台。

## 验收状态

以上为源码和受控验证。最终 PR head 的独立评审、build-only CI 固定包、Mac 实机以及 Windows 受影响复测随后单独记录；该文档不宣称已发布。上一轮 `3c345ef6…` / 65 文件候选的模型质量限制保持：完整 BOM 覆盖、无匹配题夹带无关统计未通过。鉴权 UI 修复不证明这些问题已解决。
