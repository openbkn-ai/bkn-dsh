# -9 发布准备（2026-10-11，未发布）

CLI 检测、显式 SDK 安装和状态提示的验收与 Windows 来源补证已完成。PR #86 已合并，主线 build-only 复现了验收包的全部 69 件文件及压缩包 SHA。本轮只纳入证据与发布说明，不重新出候选；正式 npm 发布、tag 和 latest 迁移仍待维护者确认。

## 固定身份

| 项 | 固定值 |
|---|---|
| 版本 | `0.2.0-rc.2-openbkn.0.2.0-9` |
| 验收源码 | `6b372ff703d773a4c47ff3cf13972a047fa81ebd` |
| 验收 CI | [38058120767](https://github.com/openbkn-ai/bkn-dsh/actions/runs/38058120767) |
| tgz SHA-256 | `dd2d50a2fdda8e55f1ff355b6121113fc6106aeeb6664463bc218cb9b366c887` |
| 字节 / 文件 | 183344 bytes / 69 files |
| 已合并 PR | [#86](https://github.com/openbkn-ai/bkn-dsh/pull/86)，收尾 HEAD `5be44c34f837918604c373b6624adec5ce00f8f4` 获 APPROVED |
| 主线合并 | `df454e7eaa4b58ecdbb4c3355a297aaba02d5437` |
| 主线 build-only | [38067339595](https://github.com/openbkn-ai/bkn-dsh/actions/runs/38067339595)，success；publish 步骤及 GitHub Release job 均 skipped |
| 主线比对 | 69/69，missing/extra/different 均空；tgz SHA 完全相同，未使用 package.json 键序豁免；[完整比对](followup/main-payload-reconciliation.json) |
| 主线检查 | 插件 414（413 pass / 0 fail / 1 skip）、仓库 60/60、package:check 通过；[CI 身份与步骤](followup/main-rehearsal-run.json) |

## Windows 补证复核

固定回传 `a7f94bf4bc7fa973b19e07196820c64eb69cd70a`，前一提交 `881af0b28fd46da2c5fb7f4c93d425484897952a`；实际为两次提交，仅新增约定的 3 份 closeout 文件，对照原回传 `b5e5875b53bfd0edccbd881f1069e746dc722b1b`。

- 107 件：53 件逐字节一致；54 件仅换行不同，保留双方原始哈希；原件缺失/未验证均 0。首次卸载失败后的配置来源是当时快照副本，合成 observer 仍是合成证据，不统称产品原件。
- 主开发核对了全部 Git 基准及记录哈希；54 件原件哈希可按对应 CRLF 还原（51 件整文件 CRLF，3 件混合 LF/CRLF）。12 件 UTF-16 原生输出按原始字节一致，不转码。
- 首次补证提交中的两份文件与所报 Git blob SHA、字节一致；第二次证明排除自身，绑定完整提交。主开发核对提交字节；本地读取由 Windows agent 执行，不声称第二次读取本机原件。
- 没有新增 Host、SDK、平台、模型或矩阵运行。详见 [Windows closeout](followup/windows/closeout/RESULTS.md) 与 [主开发复核](followup/windows-provenance-review.json)。

根清单在纳入补证后重新绑定明确证据提交，排除根清单与其证明的自引用。嵌套历史清单与 Windows 补证证明继续指向各自原提交，不改写为当前文件证明。

## 保留的限制

| 项 | 本轮处理与理由 |
|---|---|
| Windows 卸载 EPERM | 按用户决定保留已知限制。已定位 DSH/pnpm 替换锁文件失败及重试成功，具体占用者/根因未知。失败后重试并确认移除；不在 -9 修宿主。 |
| C98 独立只读检测 | 单测覆盖检测不清除 CLI/auth 当前失败；现场只证明安装/保存及实际鉴权执行后的失败历史保留，独立实机子项未构造。本轮按交接不重跑、不借用凭据。 |
| 既有 -8 平台/模型/鉴权问题 | 功能面未改变，仍按 -8 CHANGELOG 的限制处理；本轮没有扩大 G6、平台部署、Token 生命周期或诊断完整验收。 |
| Desktop 测试 Key 来源与撤销 | 属用户凭据处置和宿主隔离问题；未收到新的完成确认。不在插件中新增凭据管理，本轮补证没有使用模型 Key。 |

[最新上游只读核对](followup/closeout-upstream-after-windows.json) 中 DSH、Foundry、SDK 头部均与已验收基线相同；记录了最新可见 Release，但没有升级支持的 DSH rc.2 或 SDK 0.1.5，也不替代 live 契约检查。

## 未执行的发布动作

[官方 npm 查询](followup/registry-after-windows.json) 的 UTC 时点 `2026-10-10T16:57:02.925241+00:00`：latest/rc 均为 -8，-9 不在 versions 中；远端无 -9 发布 tag。

下一步先将本次纯证据收尾按仓库评审流程纳入主线；获得维护者正式发布确认后，再执行 -9 tag/npm rc 发布，下载公开包与上述验收包逐文件核对，最后迁移 latest。任一产物差异需先查明，不能用相同版本号替代字节核对。已有验收覆盖的形态按包一致性复用，不重复跑矩阵。
