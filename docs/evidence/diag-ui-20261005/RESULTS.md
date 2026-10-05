# -6 诊断入口修订：CI 候选实机验收

日期：2026-10-05–06（Asia/Taipei）。当前候选仍为 -6；旧 -6 本地包保留作历史，本轮验收绑定下面的 CI 产物。

## 固定身份

| 项目 | 本轮 |
|---|---|
| 源码 | `144afa503c7d4746cbef01f74eaceff293b88cb5`，`fix/diagnostics-d0-s2` |
| CI build-only | [37337765993](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37337765993)，成功，`publish=false`；发布 job 未执行 |
| Artifact | `plugin-tarball`，ID `11358105199` |
| tgz | `openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-6.tgz` |
| tgz SHA-256 | `ffcd77722e83a003fe90e0dda296a3a49c3f2ba67bddda9095575dabd896ef43` |
| 大小／文件 | 162,967 bytes／65 文件 |
| 本地构建对比 | CI 包全部 lib 运行时文件与本地构建逐字节一致；npm 与 Desktop 安装目录的 65 个文件各自全部匹配 CI 清单 |

源码提交后的证据和交接工具修改不进 tgz；不能把其后文档 HEAD 当作上述包的构建源码身份。

源码轮本地构建、typecheck、插件测试（304 项：303 pass、0 fail、1 Windows-only skip）、repo suites（57/57）、package 审计、diff-check 与 pack 均通过。随后 CI build-only 成功；本轮实机采用下载的 CI 包。后续修改只涉及证据、交接文档和不进入 tgz 的 Windows 辅助脚本。

## 界面与故障隔离

只有一个 OpenBKN 侧栏入口。点击后，面板右上角为“诊断”两个字。面板外框和诊断操作先注册，业务服务稍后接入；业务 import/服务不可用时，仍能打开独立诊断。

| 验证 | 官方 npm DSH | macOS 原生桌面 |
|---|---|---|
| S0：单入口、右上角按钮、正常业务目录 | 通过；真实目录 2 项，报告 `a0681622` 的 7 项全 pass | 通过；真实目录 2 项，报告 `3e7cbb38` 的 7 项全 pass |
| S2：业务 import 受控坏导入 | 通过；`business-entry fail/module-resolution-failed`，bootstrap/diagnostics pass | 通过；同分类，实际导出报告 `bde1424c` |
| S4：diagnostics 受控坏导入 | 通过；业务目录正常，诊断明确不可用 | 通过；业务目录正常，诊断明确不可用 |
| 撤销故障 | 故障使用不同隔离 home，原正常候选不改 | 正常退出后重新安装原 CI tgz，65 文件重新匹配；正常候选启动供后续 G6 |

故障变体基于同一 CI tgz，基包／变体 SHA 及修改文件前后 SHA 见 `ci-s2-variant.json`、`ci-s4-variant.json`。这些是受控单 row 故障，不是原候选自然发生的异常，也不是原用户故障机器的根因。

S2 的业务页仍可能出现旧的通用 Token/地址提示；根因判断以独立报告中的 `module-resolution-failed` 为准，不能从该通用提示推断凭据坏了。整包 bootstrap 或共享文件损坏不属于这次单 row 隔离模型。

## 环境与真实平台

- npm：官方 `@deepseek-ai/dsh@0.2.0-rc.2`，Node 24.19.0，darwin arm64。
- Desktop：`/Applications/DeepSeek Harness.app`，Bundle/随附 CLI 均 `0.2.0-rc.2`，随附 Node 24.18.1、pnpm 11.7.0。
- 两种形态都使用本轮隔离 `DSH_HOME`；原仓库 dirty state、兄弟 worktree 和原 profile 没有被重置。
- 未修改官方 Host 运行时、未开 inspector。构建阶段的固定上游兼容补丁与实机运行的官方 Host 分开。
- CLI：本轮隔离 npm 安装官方 `@openbkn/bkn-sdk@0.1.5`，`--version` 实测 0.1.5；正常官方 CLI 进行了已有登录的 Token refresh，秘密只在进程内，未输出／回传／复制凭据。这个 refresh 是正常业务操作，不冒充被动诊断无副作用。
- 平台：`kind-bkn-dev`／namespace `openbkn`，实际 agent-operator-integration、agent-retrieval-ee、bkn-backend、sandbox-control-plane 镜像均 0.1.5。
- CLI 0.1.5 的真实 `context tools` 取得 `tools/list` 共 28 个工具；名称、kn_id 形状及 required 清单见 `cli-015-mcp-catalogue.json`，不是仓库旧 fixture。
- 可信 CA 正常加载，没有禁用 TLS 验证。
- 报告中 DSH 版本及“已加载插件版本”仍可能为 unknown；上述安装哈希及隔离 Host 操作链是另外取得的身份依据，不把报告未提供的值写成已知。

## 下载完成证据

真实点击产品“导出诊断报告”，不是从页面/测试 fixture 手工生成 JSON。

| 形态 | 实际保存路径 | 编号／结果 |
|---|---|---|
| npm | `/Users/kalias/Downloads/OpenBKN-diagnostic-20261005T161727029Z-a0681622.json` | schema 1，2,436 bytes，7 pass，SHA `2300c6e0c78044c0c12ac6b763c6592137456399c25768873af811a2c87b6cb1` |
| Desktop | `/Users/kalias/Downloads/OpenBKN-diagnostic-20261005T162819468Z-3e7cbb38.json` | 系统 Save 对话框完成，schema 1，2,440 bytes，7 pass，SHA `6d3cba7a02d7a589d608c7b2c04aa91b2ef75023f192c3b72ce68987a7dbffa9` |
| Desktop S2 | `/Users/kalias/Downloads/OpenBKN-diagnostic-20261005T163046523Z-bde1424c.json` | 业务坏导入时实际保存，business fail、其余两个组件 pass |

内置浏览器的 `waitForEvent(download)` 超时，但实际文件随后核对已完整保存。工具等待事件超时没有当成产品下载失败，也没有以 .crdownload 或空文件判通过。结果与下载摘要见 `ci-npm-download.json`、`ci-desktop-download.json`，报告副本见同目录 JSON。

## live guard

使用同一 CI 包的解包目录、官方 npm DSH 的 stock ToolRuntime/MCP client、CLI 0.1.5、两个真实可见网络、真实平台。

`mode=live`，**16/16**，不是 stand-in。平台 Interaction `int_8e1639838062f7f65c4c7b5757969d63` 只记录允许的 `search_capabilities`；错网／缺网／未知工具／作用域与生命周期拒绝均通过。逐项白名单证据见 `ci-live-guard.jsonl`。这是独立真实 ToolRuntime 验证，不冒充模型守规或桌面模型结果。

## G6 与剩余门禁

用户已在本轮隔离 Desktop 的正常设置页保存模型配置，模型密钥没有进入聊天／报告／交接包。当前选择 DeepSeek 官方 API 的 `DeepSeek-V41-Flash / High`。G6 尚未开始：官方 Host 的独立系统目录选择器已打开，自动化无法定位该进程窗口，已交用户选择本轮工作区；随后 macOS 锁屏阻止进一步 UI 操作（2026-10-06 00:52 台北时间）。需要用户手动解锁并选好工作区后继续真实模型问答。评分不能由空答案文件或既往结果代填。

Windows 原生 pwsh/W0–W12 仍由 Windows agent 执行；脚本仅在 macOS 编写及人工复核。完整交接包包含固定候选、-4/-5 升级基包、逐文件哈希、离线 verify-kit、脚本、评测集、结果模板及迁移/原故障用户采集说明。

完整交接目录：`/Users/kalias/Documents/project/app/openBKN/handoff/2026-10-06-diag6-windows-144afa5`；同名 `.zip` 是可发送给 Windows agent 的包。ZIP CRC、交接资产哈希、CI 候选 65 文件及两份升级基包哈希已在 macOS 核验，摘要位于同级 `2026-10-06-diag6-windows-144afa5-validation.json`。公开测试证书随包交付，不包含私钥或模型配置。这些静态核验不替代 Windows 原生脚本执行。辅助 cleanup 当前需 Windows agent 确认父 PID 归属和子进程退出，不能仅凭脚本返回认定清理完成。

没有 merge、tag、npm publish 或 dist-tag 修改。实际 Windows 结果、G6/业务异常取舍和最终发布验收仍需完成；主动复测属于已明确暂缓的可选能力。
