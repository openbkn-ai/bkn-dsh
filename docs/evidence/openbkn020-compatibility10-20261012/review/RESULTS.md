# PR #89 评审收尾：-10 范围内受控修复

2026-10-12。读取最新评审、两条行内评论和完整 `findings-review` artifact 后，仅处理 CLI 版本提示、finish 访问窗口及诊断展示测试。没有修改 B1 登录/重连、宿主、平台或其他 P2/P3。

## 固定身份与评审依据

- 开始时分支 `feat/diagnostics-info-10`、HEAD `3c138425f478b37116f523f19bfc8a21ae8718bf`，工作树干净，与远端一致。
- 开始时最新总评为 Approved，但源代码评审仍列出非阻塞的 finish 状态待确认项；最新文档轮仅确认证据，没有再次覆盖源码。不能把文档轮通过解释为所有旧建议均已处理。
- 首轮修复：`038416188246f1ee4f9960a855766b58ad9950c7`；选择框复评收尾：`9a35c0d9d1263b5f39b24d596f07dbcedbf25d04`。最终源码为后者，版本仍为 `0.2.0-rc.2-openbkn.0.2.0-10`。
- 完整 finish 评审来自 CI `38197963724` 的 `findings-review`，原件为 `review-findings.json`；行内评论归档为 `review-comments.json`。

## 处理对照

| 评审项 | 判定与最小处理 |
|---|---|
| [CLI 默认版本误提示](https://github.com/openbkn-ai/bkn-dsh/pull/89#discussion_r4244374234) | 受控复现成立：自动检测到正常 CLI 0.2.0、用户没有选择平台版本时，旧逻辑按默认 0.1.5 提示更新。安装目标的默认值与用户明确选择分开：未选择时只显示实际 CLI 可用状态，明确选择后才显示不匹配。界面初始为“请选择版本”，安装按钮要求明确选择；直接选择 0.1.5 或 0.2.0 均可产生真实选择。Host/控制器为旧调用保留默认 0.1.5，两个固定目标及已有 CLI 不覆盖保护不变。选择框命名为“CLI 安装版本”，不冒充探测到的平台版本。 |
| [成功 finish 没有可用 ID 时仍开放](https://github.com/openbkn-ai/bkn-dsh/pull/89#pullrequestreview-5486219079) | 受控复现成立：成功返回 `{}` 或 `trace_recorded:false` 与 Interaction ID 同时存在时，生产投影不提供可用 ID，旧状态函数保留 `open=true`。修复为成功 finish 必关闭本轮访问窗口；ID 无法恢复不作为继续访问的理由。失败 finish 仍保留原重试行为；不伪造溯源 ID。 |
| [诊断测试字面量断言](https://github.com/openbkn-ai/bkn-dsh/pull/89#discussion_r4240190628) | 移除只比较 fixture 自身字面量的断言，改为冻结输入、与调用前副本核对，并覆盖未知 `freebsd` 标识原样展示。没有改变诊断报告 Schema 或增加系统采集。 |
| 旧缺失文案归因宿主 | 已在 `a06ef53` 改成“当前报告无法确认形态 / 当前报告无版本信息”，本轮核对保留，无须重复修改。 |

## 修复前后受控复现

`before-fix.log` 使用基线 `3c13842` 的生产代码和本轮新增回归用例，85 项中有 3 项失败：CLI 默认误提示、finish 纯状态函数不关闭、官方 DSH ToolRuntime 在 finish 成功后仍允许查询。`after-initial-fix.log` 在首轮修复后同组 85/85 通过。随后复评指出默认可见的 0.1.5 无法产生 change 事件（`followup-findings.json`）；最终改为未选择占位，并扩充缺失提示的显式选择断言，终验 `after-fix.log` 仍为 85/85。

finish 回复是按评审构造的受控输入，不是实机采集的 0.2.0 平台响应。新的 ToolRuntime 用例使用官方 DSH `0.2.0-rc.2` MCP bridge 与固定上游 0.2.0 fixture 的输入/输出 Schema：start 成功 → finish 失败 → 查询仍可执行 → finish 成功但无可用 ID → 查询、重复 finish、再次 start 均拒绝，且计数证明拒绝的调用不 dispatch。空对象和矛盾 Trace/ID 两种成功回复均覆盖，没有放宽 start、网络或工具边界。

CLI 提示测试覆盖未选择、明确选择 0.1.5/0.2.0、未选择时的选择提示及两个显式安装目标；原有目标版本到 Host、单次安装及关闭重开进度回归继续保留。这是受控逻辑和编译验证，没有宣称真实 UI 操作通过。

## 最终源码验证

| 检查 | 结果 |
|---|---|
| `pnpm test`（含 host/client 构建） | 437 项：436 pass、0 fail、1 Mac 上既有 Windows 原生 cmd 用例 skip（最终源码 `9a35c0d`） |
| 仓库 compat / tests / runtime suites | 60/60 pass（本地 `0384161`；最终源码 `9a35c0d` 的 CI 再次通过） |
| `pnpm run typecheck` | exit 0 |
| `pnpm run package:check` | exit 0，70 文件 |
| 显式指定发布包的 `pnpm --filter @openbkn/dsh-business-context pack --out …` | exit 0，70 文件 |
| 本地包核对 | 所有 lib 文件与当前构建字节一致；相对首轮准备包仅 `lib/business.js`、`lib/client.js` 内容变化 |

本地开发包 `/tmp/bkn-pr89-review-20261012/plugin-10.tgz`：188215 字节，SHA-256 `0cfb36ab20384f0b9acae98b08c3a81f0fa80061fb7e86a832ec047a20536404`。这是源码 `9a35c0d` 的开发包，不是实机验收包。

首轮修复 CI `38208792957` 在 `0384161` 成功完成，作为中间检查留存（`initial-ci.json`）；它不包含后续选择框修正。此前 `38197960456` / `a0d633ad…` 为首轮准备候选，不覆盖本轮源码修复；其记录保持原样，不追溯改写。

## 最终 CI 候选与源码复评

[build-only CI 38209375894](https://github.com/openbkn-ai/bkn-dsh/actions/runs/38209375894) 在最终源码 `9a35c0d9d1263b5f39b24d596f07dbcedbf25d04` 成功完成。Node 22.19.0 下插件 436 pass / 0 fail / 1 skip、仓库 60/60、构建和包内 16 个声明目标核对通过。`publish=false`，npm 发布步骤和 GitHub Release job 跳过。`ci-run.json` 记录各步骤；`ci-validation-excerpt.log` 是原生日志中测试、pack 审计、发布决定三个步骤的逐行选段，未称为完整日志。

| 候选字段 | 固定值 |
|---|---|
| artifact / ID | `plugin-tarball` / `11728158282` |
| tgz SHA-256 | `a91adc9e342faa4f763d73487cd56d2f4ead8bb21bf755ca11426f77d90c9bae` |
| 大小 / 文件数 | 188215 字节 / 70 文件 |
| ZIP SHA-256 | `f89cee3dad434c16eeefdbe8996ee8331195a9026758cbe72c787222be3f813a`（实际下载核验） |
| 逐文件清单 SHA-256 | `8534860d50d700c68fbc2e5e7f486a21e12a4a52de9af9ea1ad5f3c29401d690` |
| 本机候选目录 | `/tmp/bkn-pr89-review-20261012/ci/` |

完整身份为 `candidate-manifest.json`，清单为 `candidate-files.json`。CI 与本地 tgz SHA 不同，但 gzip 解压后的 tar 和 70 件文件字节全部相同，不将两个压缩包称为字节一致。

源码 `0384161` 的复评确认前两项修复；源码 `9a35c0d` 的最终复评为 Approved，明确未发现新缺陷，记录为 `source-review.json`。自动评审没有运行本地依赖和测试；执行证据来自本轮本地日志与完整 build-only CI，不把评审阅读当成实机验收。

`FILES-SHA256.json` 封存 19 件受控复现、评审与 CI 身份文件，排除自身、本报告和凭据扫描说明；原生日志保留字节。Git diff-check、最终 Git blob 与本地证据核对在提交时执行。

## 验收与发布边界

本轮复查 Foundry 最新正式 release / npm SDK 仍为 0.1.5，没有用准备源码冒充正式 0.2.0。正式 0.2.0 发布后继续先核对契约差异，再做 Mac npm/Desktop 实机验收，随后单独提交 Windows 复测 handoff。上游 nullable Schema issue [Foundry #2106](https://github.com/openbkn-ai/bkn-foundry/issues/2106) 独立跟进；B1 保持开放。

没有启动真实 Host、安装 SDK、登录平台、调用模型或改用户网络、PATH、全局 CLI。没有合并 PR、发布、打 tag 或修改 dist-tag。
