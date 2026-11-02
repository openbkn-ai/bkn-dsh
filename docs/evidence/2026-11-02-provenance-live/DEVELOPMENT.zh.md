# DSH 业务溯源：本地打包与只读实机验收

2026-11-03接续：Windows官方rc.5固定CI4包已执行并核收原始回执，关键分析焦点补测通过；保留原文hover/Escape一次FAIL及其他UNKNOWN，不称全部发布验收通过。Windows后段1376项摘要一致不抹掉前段2文件变化和39项不可读。见[当前状态](./PRE-RELEASE-STATUS.zh.md)、[Windows回执](./windows-rc5/WINDOWS-CI4-RESULTS.zh.md)。以下本地只读结果继续作为历史保留。

后续范围更新：维护者已授权推送、build-only CI和远程E2E，并允许在隔离样本生成依据与开始分析。CI3真实脱敏报告已接收，保留分析后Esc的FAIL；局部修复后CI4已通过，精确cf9abdf4包的远程Mac焦点R1—R4实机复验已完成并SHA核收报告；原CI3失败保留，完整矩阵和Windows仍不作通过声明。以下只读结果和7f5候选为历史，不替代新CI包的验收。最新计数/包身份/原始远程报告见[CI/E2E交接](./CI-E2E-HANDOFF.zh.md)。

2026-11-02。当前本地分支 `feat/provenance-platform-parity-live`，集成基线 `bc5e67bfa1706c0e7f991f59979dbb93efe4a960`。本轮本地构建与 Mac Desktop 只读验收通过；不是发布批准、Windows 验收或用户人工验收。

未推送、未运行远端 CI、未改 npm/GitHub Release/latest。原日常插件未替换，隔离实例已正常退出，日常 DSH 已恢复打开。没有点击生成/更新依据或开始 Agent 分析，没有重跑业务问题或模型；平台与模型原文、记录及状态不做修改。

## 最终本地候选

- `release/openbkn-provenance-parity-live.3.tgz`，SHA-256 `7f5f6a8630a4b3dcaf05a9e88e90f96bb1bef7f4ba8194ca518a24aefbbf10c5`。
- 871946 字节、126 文件；manifest 保持 `0.2.1-rc.3-openbkn.0.2.1-2`，仅为本地试验包，不能与已发布的同版本包混用。
- 官方 bundled CLI 安装到独立 `DSH_HOME` 的 desktop profile，126/126 文件逐字节相同。使用独立 Electron `electron-3` 冷启动并通过原生界面执行新 Remote；未用私有对象注入替代真实窗口。
- 实际安装的 DeepSeek Harness Desktop 为 `0.2.1-rc.5`，build commit `d4db512a969fccf0c5cc7ec8fe38e9c1d27af916`，dirty=false。Node 24.19.0 / 本地构建 pnpm 11.7.0。包、安装及编译摘要见 [INSTALL-IDENTITY-3.json](./INSTALL-IDENTITY-3.json)。进程启动、磁盘身份与原生行为结合验证；未独立提取运行中模块的内存摘要。

原 `cfd377f` 分支与 [2026-11-02-provenance-parity](../2026-11-02-provenance-parity/DEVELOPMENT.zh.md) 保留为历史开发检查点。实机前发现日常包已包含并行工具面/CSV 修复，因此改在 `bc5e67b` 上集成，保留 `00b1181` 和 `bc5e67b`，没有回退已验证的其他插件部分。67 个受保护源码匹配新基线，包括 managed session policy、scoped context、认证和 MCP；复用 Studio 的来源与许可沿用原记录。

## 实机发现并修复

1. **内层 Escape 与焦点边界。** 原文 Popover 点击后没有接管焦点，Escape 会关闭整个溯源窗口。先留原生失败及修前失败测试，再补局部 Escape 和焦点还原。独立 QA 进一步复现分析侧栏 Tab 从末端泄漏到外层关闭按钮；分析侧栏、两种全屏和 legacy Inspector 现使用局部双向 Tab 循环。SourceText 保留非模态 hover/click 行为，不限制 Tab。共享外层 hook、分析取消语义和业务输出未改。
2. **真实大记录被 8 MiB 预算拒绝。** BOM 样本原始 detail 为 9,067,369 字节，59 operations /59 timeRail、169457 JSON 值、深度16；平台可读，第二候选原生显示“调用事实加载失败”。原始响应通过生产 Reader/Scope 回放明确触发 OUTPUT_OVERFLOW，并编写修前失败回归。仅完整 detail 的 HTTP 读取、Host admission/前置校验、Remote 累计预算提高至16 MiB；其他 JSON/分析仍8 MiB、Markdown HTTP/Host仍1 MiB、chunk128Ki字符、25万值/深64、成员校验8 MiB/100页/30秒等保持。没有截断、筛掉调用、改写失败或替平台判断。修后真实捕获响应经生产 Reader→Scope→Remote 回放的 canonical SHA 完全相同，随后同记录原生窗口复验可读。

修前/修后证据分别保留为 `NATIVE-ESC-BEFORE.json`、`native-*-before/after.log`、`fullscreen-*-before/after.log`、`PLATFORM-BOM-BEFORE.json`、`BOM-REPLAY-BEFORE/AFTER.json`、`budget-tests-before/after.log`。55c 与77a两包及其旧安装回执均为历史，不作为第三包最终身份。

## 最终候选的真实只读结果

| 范围 | 观察与证据 |
| --- | --- |
| 与平台同记录对照 | 双轮 `conv_1c027aaa36b601844ad14dbe3f0cc7f5`；第一回答打开第1轮/11次调用，第二回答打开第2轮/2次调用，原问题/回答及 Operation ID 对上。时间链/证据链文案正确，无“返回业务溯源列表”。 |
| 搜索、刷新、关闭 | `SAMPLE-NOT` 搜索平台返回 partial/truncated；插件显示列表不完整并保留第2轮和2次调用。清空后刷新仍是第2轮，关闭返回对应回答入口。见 [ROUND-SELECTION-3.json](./ROUND-SELECTION-3.json)。 |
| 大记录和内部调用 | `int_794daf4c8064143c6f2ae3b291fb0ce3` 的59条原始调用可读；平台和插件同为43项顶层分组（39成功/4失败），其余16条为内部调用。展开父调用可独立选择内部查询，检查器显示对应 Operation ID；失败记录与原因保留。见 [NATIVE-READONLY-3.json](./NATIVE-READONLY-3.json)及[截图](./screenshots/desktop-bom-after-record-fix.png)。 |
| 键盘层级 | 输入/输出原文点击后 Escape 仅关闭内层并恢复触发器；分析面板 ShiftTab→开始分析、Tab→面板关闭、ShiftTab→开始分析，Escape 恢复分析入口，未触发开始动作。两种证据全屏的键盘逻辑目前仍仅受控测试通过。 |
| 筛选 | 失败0显示无匹配调用；恢复全部11后检查器恢复。见 [DOWNLOAD-NATIVE-3.json](./DOWNLOAD-NATIVE-3.json)。 |
| 真系统剪贴板 | 第三包点击复制 Markdown 后，通过 OS 粘贴到空白隔离 DSH 编辑框读回完整平台原文，5628字节、SHA `2adea77946edb16b501a805ed8b322e4132d60ffd65f2cb9e7ce288fe99e2096`；未发送，草稿已清空。见 [CLIPBOARD-NATIVE-3.json](./CLIPBOARD-NATIVE-3.json)。浏览器 Clipboard API 返回空不能作为 OS 剪贴板失败判据。 |
| 原生下载 | 第三包经真实 macOS Save 对话框保存新文件，与同条平台 Markdown 5628字节及摘要完全一致。见 [DOWNLOAD-NATIVE-3.json](./DOWNLOAD-NATIVE-3.json)。 |
| 既有证据状态 | BOM 证据链显示“尚未生成解释”；保留该平台状态，没有为了测试图谱而生成。分析侧栏仅查看原平台 Markdown，未开始分析。 |

原始业务响应、Markdown、凭据副本、日志及会话只在 ignored 私有验收目录内；公开证据仅保留必要 ID、计数、摘要和样本截图。查看页面使用正常已登录平台会话，没有绕过 TLS 或注入认证。

## 自动与独立验证

- `pnpm test`（插件 build:host、build:client 与标准 tests）：**759通过、1 Windows专项跳过，760总计**，见 [plugin-tests-final.log](./plugin-tests-final.log)。
- 源码旁 adapter4、clipboard4、Scene list2 不在默认 test 脚本的 glob 中，独立补跑 **10/10**；不能把759与历史762当作删测。旧手动命令含10项源码旁测试；新增3项焦点、4项预算使 `763-10+3+4=760`。见 [FINAL-QA.zh.md](./FINAL-QA.zh.md)。
- 仓库按 workflow 的完整命令包含 compat/root/runtime，**79/79**；早期 root-only 68/68 单独留档。见 [repository-tests.log](./repository-tests.log)。
- 包审计通过（126文件），范围保护2/2，独立最终包/安装/源与产物审查通过。最终包相对前候选仅溯源预算和局部焦点相关产物变化。见 [FINAL-QA.json](./FINAL-QA.json)、[package-check-final.log](./package-check-final.log)、[scope-final.log](./scope-final.log)。
- 原 cfd 检查点的 npm双Gateway/SSE受控证据保留；其旧 lib 摘要不能代表本次第三包。本次真实主机范围是上述Mac rc.5，未宣称新包在所有Host重验通过。

## 日常环境恢复

隔离实例正常退出，日常 DSH 已按默认环境重新打开，编辑框为空、没有运行中任务。日常插件仍与原工具面/CSV候选 b7b26bb8… **94/94逐字节一致**，desktop profile manifest仍是原摘要。19个会话内容文件解压后逐字节不变；其中1个zstd压缩文件的压缩字节变化，解压内容完全相同，未恢复或覆盖它。19个临时锁文件不当作会话内容。见 [DAILY-RESTORE.json](./DAILY-RESTORE.json)。

## 仍未完成的验收与明确差异

- **按本轮只读决定延期**：真实生成/更新依据、Agent流式分析及错误/历史写入；相关动作的安全、取消、SSE与原文保留目前仅受控验证。
- **没有现成解释可读的真实样本**：两种图谱/证据全屏及跨视图选择、缩放/窄窗口主要为受控DOM/浏览器证据，未用生成动作补齐。Windows原生窗口、剪贴板、保存对话框和其他Host的最终包验收仍未做。
- 真实权限拒绝、认证/证书变化、慢请求及16MiB以上记录的实机行为，仍不能由正常样本通过替代；超限仍拒绝，不能承诺任意大小记录可读。
- **平台现有数据/服务限制**：本次平台搜索返回 `projection_scan_cap_reached`，不生成不存在的搜索结果。平台 Markdown 原始响应自身大量含“请求失败。”（BOM原响应16595字节，700处），复制/下载/分析预览忠实保留，不由插件清洗或重写。本轮未调查或修复平台 Markdown 根因。
- HTTP非成功响应只显示固定安全分类与HTTP状态，不透传任意错误体；detail不可读时KN预检阻止解释/Markdown/历史/动作，未复用平台detail404后的Trace Markdown回退。业务记录中的invalid/原因和已解析SSE错误原样保留。这两项是明确的安全适配差异，不能宣称所有错误流程与平台逐项完全一致。
- 用户最终人工确认，以及正式发布候选的远端构建、对应产物验收/发布步骤，均未执行。当前只交付可复验的本地源码、包和记录。
