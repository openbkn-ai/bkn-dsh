# Windows agent：统一 -7 固定包复测通知

Mac 实机与包身份复核已完成，可以开始本轮 Windows 原生 Desktop/npm 受影响复测。仍是未发布候选；不要用旧 -6/旧 -7 的测试结果代替本轮。

| 身份 | 固定值 |
|---|---|
| 版本 | `0.2.0-rc.2-openbkn.0.2.0-7` |
| 已评审包源码 | `3414bdec3c956cc0d580aebd959ac6f3439bb352`（PR #72） |
| build-only CI | [37478119730](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37478119730)，`publish=false` |
| tgz SHA-256 | `6bbab27876e743032572ddce107fcce09e0d681f87bee19fba8d78180e5a63a8`，177442 bytes，66 文件 |
| 交付内容 commit | `1fcffa9227d14bac7ff8d628ebd0f8398a965675`，与包源码 commit 分开 |
| Windows ZIP SHA-256 | `df0016c6d2b511c009f932402dd80155248c4ac61260cbd3cad70ecb483cef54`，248434 bytes，31 项 |

[固定 ZIP 下载](https://raw.githubusercontent.com/openbkn-ai/bkn-dsh/1fcffa9227d14bac7ff8d628ebd0f8398a965675/docs/handoff/2026-10-06-release-7/assets/windows-unified7-3414bde-fidelity.zip) · [ZIP/候选身份清单](https://raw.githubusercontent.com/openbkn-ai/bkn-dsh/1fcffa9227d14bac7ff8d628ebd0f8398a965675/docs/handoff/2026-10-06-release-7/FIDELITY-REMOTE-KIT.json) · [完整操作 Handoff](https://github.com/openbkn-ai/bkn-dsh/blob/1fcffa9227d14bac7ff8d628ebd0f8398a965675/docs/handoff/2026-10-06-release-7/fidelity-windows/HANDOFF.md)

主开发已匿名 HTTPS 下载远端 commit 的 ZIP/清单，验证 30 个 kit 文件哈希及 tgz 的 66 个文件，确认与提交的本地字节相同。Windows 仍须先运行 `verify-kit.ps1`，完成原生 PowerShell 5.1 解析/冒烟；Mac 静态审计不能替代这一步。

交付审核已补全仓库 checkout 目录中此前未跟踪的 tgz；上述新交付 commit 的 30 个 kit 文件与 ZIP 逐字节相同。源码、tgz 与 Windows ZIP 身份均未改变，旧失败候选已明确标为历史。

## 可直接转发的执行任务

> 请下载上述固定 commit 的 Windows ZIP，先核验 ZIP SHA/大小、`verify-kit.ps1` 和 66/66 包文件。使用 `C:\bkn-verify` 已核验的工具树，新建本轮隔离 Desktop/npm root，按 ZIP 内 `README.md`、`HANDOFF.md` 执行。优先完成两形态非法 `baseUrl` 的配置阶段拒绝（`configuration-invalid/configField=baseUrl`）及恢复，再检查单侧栏入口/面板右上角“诊断”、业务坏导入隔离、诊断降级、产品 JSON 导出、状态哈希和卸载重装。F02 的六项官方 npm 核心 fixture 探针无需账号，须保留六项显式 pass 与 native turn/end。没有凭据时，真实登录、来源图、三道问答和 live guard 标为 not-run；受限账号保持 not-run。不要做旧版升级、改候选/main、发布/tag/dist-tag，也不要复制日常凭据。helper 若需路径/语法修正，保留 diff 并先说明偏差；固定包发现缺陷先回传，不修改包继续凑通过。按 `RESULTS.template.md` 给出两形态身份、操作、真实 JSON/绝对下载路径/SHA、退出码、判定及限制，经脱敏后提交到独立证据分支并回传 commit，等待主开发复核。

Mac 同包已完成三道原题（均原生 completed），BOM 313 行/八字段/48 个范围内无记录标记/313 个记录数独立核对通过；真实诊断导出九项通过、同网络三个业务图元素来源、npm 配置/导入隔离、live guard 16/16、两种官方核心六项 fixture 场景通过。完整 G6 仍有八项 not-run；深层库存能力超时及平台 #2029 未解决，跨网络真实来源图/自动续期未验收，原故障用户机器根因未知。

本通知固定下载 commit 的内容不会随分支后续文档提交变化。请勿从移动的 `main`、npm `@rc` 或其他同版本字符串的候选取包。未发布、未打 tag、未迁移 dist-tag。
