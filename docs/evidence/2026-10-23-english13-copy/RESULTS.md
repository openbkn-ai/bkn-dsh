# -13 文案候选与 macOS 最小复核

结论：漏译修复已进入新的 CI 候选 **0.2.0-rc.2-openbkn.0.2.0-13**。macOS 官方 DSH 0.2.0-rc.2 Desktop、独立 npm/Web 均在实际宿主界面核对了受影响的中英文说明；Windows 只待同一处文案复核。没有发布 npm 或改标签。

## 候选身份与差异

- 源码：`91b2297b3070277ce0cba25a986bcaec35256f05`，分支 `fix/english12-overlay-recovery`。
- build-only CI：[39968315495](https://github.com/openbkn-ai/bkn-dsh/actions/runs/39968315495)，`publish=false`，成功；npm 发布步骤未执行。
- tgz：`openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-13.tgz`，SHA-256 `8290a0b89d9af5118b0aeabc09499c5085114047f469fe631835b808f52d3675`，74 个文件。
- 对比原 -12 CI 包（SHA-256 `30a94300994296513b8d391acda69933acf1f4a77440e9da53486a0de5bd1a44`）：只改变 `lib/client.js`、`lib/types/client/locales.d.ts` 和 `package.json`。客户端与生成声明均恰好只替换同一句中文；package.json 只改版本，其余 71 文件字节相同。六个 Host/Remote JS、依赖及兼容 pins 不变。
- 新的 Windows 工具 ZIP：`windows-english13-copy-v1.zip`，13 文件，SHA-256 `a9142588c9b601e6e12c15003c9f1f9549a08b206c72b94a13d2452708cf42d4`。工具沿用 -12 的身份、启动和停止实现，只适配 -13 身份，增加从旧隔离 root 升级的入口；保留原 `english12-state.json`，另写 `english13-state.json`。

## 验证层次

- CI：插件 450 PASS、1 项 Windows 专用 shim 检查在 Linux 跳过；仓库/兼容工具 60 PASS、0 FAIL；构建和打包检查通过。没有因此宣称 Windows UI 已验收。
- 本机 Node 22.22.3 / pnpm 11.7.0：10 项现有文案渲染测试通过。
- Windows kit：完整性检查通过；真实 CI 包 74 文件匹配时验证成功，受控修改 client.js 的负对照被拒绝；6 个 PowerShell 脚本在 PowerShell 7.6.7 上解析通过。这不是原生 Windows/PowerShell 5.1 执行证据。
- macOS 26.5.1：Desktop 为官方 0.2.0-rc.2 应用（codesign deep/strict 验证通过），npm 为官方 @deepseek-ai/dsh@0.2.0-rc.2，npm Host Node 24.19.0。两个已安装 profile 各 74 个文件均与 CI tgz 逐字节一致。
- 当前上游复核：DSH 最新可用仍为 dsh-v0.2.1-rc.2，支持/本轮实测固定 0.2.0-rc.2；OpenBKN 最新正式版 v0.2.0。CA 校验下实时 25 工具完整 schema 与 -12 原基线一致（规范摘要 `a679358f8b9a45948ac9f5a11f1044899922fe32487d887bc10c94c76a995be6`），当前核心部署镜像为 0.2.0 且 ready；未升级任何 pins 或部署。

## 实际宿主文案

原 -12 Mac profile 没有可打开溯源的历史完成回合。只从项目中旧的隔离 DSH 0.2.0-rc.2 工具验收存储复制一个现有会话到本轮两个测试 home；没有复制凭据或修改原会话，没有新增模型回合或受管业务工具调用。

该历史会话为 `session-b8a96fce-94a0-46b2-a614-7ba9f70b887f`，标题 R38 B1 native Desktop protocol check，交互 `int_df37afdfdd4e136614cffd92486259c1`。它是已有协议/工具验收回合，不是本轮新的自然语言答案准确性验收。压缩会话仅在内存按拼接 zstd 帧解压、提取事件类型和工具名；原件哈希与 mtime 在读取和界面复核后均未变。会话副本用于复核当前候选的真实 UI 渲染。

两形态分别进入该回合的业务溯源 → 执行溯源：

| 形态 | 英文原句 | 中文修正句 | 语言恢复 |
| --- | --- | --- | --- |
| 原生 Desktop | PASS，保留 Request / Trace / Receipt 原句 | PASS，显示“平台口径的操作状态、耗时与请求 / 追踪 / 回执引用。” | 恢复开始时的 English |
| npm/Web | PASS，同一英文原句 | PASS，同一完整中文句 | 恢复开始时的 English |

Desktop 按关闭浮层 → 宿主设置切语言 → 重开同一回合执行；Web 也采用这条最短路径，不重复双客户端、草稿、登录、冷启动或整套状态保持测试。两种形态各留一张中英文图。原始业务值/技术 ID 没有为了文案验收而改写。

本机原件位于 `release/english13-review/`：`candidate-comparison.json`、`ci-run.json`、`ci-build.log`、两形态 `live/*/package-receipt.json` 和 `receipt-copy13-historical.json`、`screenshots/{desktop,npm}-{en,zh}.jpg`、`screenshots/ui-text-checks.json`、`screenshots/language-restoration.json`、截图摘要清单、`historical-session-copy.json`、`cleanup.json`。公开附件只含无业务正文的候选、工具和汇总材料，不自动上传截图或会话。

## 保留边界与收尾

- [A7 处置](A7-ASSESSMENT.md)：已定位的 npm/Web 重复 start 属于预期守卫拒绝，原 error 和 dispatch=unknown 保留；补证 ZIP 尚未在 Mac 收到并独立验摘要。不再要求触发/重跑。
- Windows runner 与 Ctrl+C 保留已知问题；原缺条数/非空图维持既有 BLOCKED。本轮历史会话出现局部计数不回填旧 Windows 状态。
- 操作异常：为截图按应用名称选择窗口时，维护端误唤起个人 DSH；它因已有 Host 运行而拒绝启动。已退出其错误框，未修改个人配置；本机新增 crash 日志原样保留。后续只使用固定官方应用路径。该操作异常不冒充候选产品缺陷。
- 已通过原生退出菜单退出本轮 Desktop，按 PID/创建时间核对后 SIGINT 停止 npm，停止专用引导服务；记录的 Host PID 均消失，19387 / 38612 / 38649 无监听。测试 profile、会话副本及原始证据保留。
- npm rc=-11、latest=-10；本轮禁止 publish、dist-tag 和生产 v* tag。review prerelease 不是正式发布，不提升 GitHub Latest。Windows 的 [最小交接](../../handoff/2026-10-23-english13-copy/WINDOWS-COPY-HANDOFF.zh.md) 只检查这条中英文文案并核对当前身份。
