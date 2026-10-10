# -8 发布核验

日期：2026-10-10（Asia/Taipei）。本记录已补齐维护者完成 latest 迁移后的公开注册表实读结果；首次 E401 与迁移前的注册表快照仍保留在原核验文件中。

**-8 发布完成：npm latest、rc 均为 `0.2.0-rc.2-openbkn.0.2.0-8`，GitHub Release 与公开包核验通过。** 用户已在自己的终端完成登录和 latest 迁移；随后独立读取官方注册表，确认 `@latest` 的版本、源码提交、下载地址及 integrity 对应已核验的公开发行包。见 [latest-promotion-verification.json](latest-promotion-verification.json)。

## 固定发行身份

| 项 | 结果 |
| --- | --- |
| PR #82 | [已合并](https://github.com/openbkn-ai/bkn-dsh/pull/82)，`259511c388a0439b998388020e69925d25859276` |
| 发布准备 PR | [#83 已批准并合并](https://github.com/openbkn-ai/bkn-dsh/pull/83) |
| main / 发布 tag 指向 | `fc4f2c49cdfdff8a50a2a4880072cd8db1a2b7f8` / `v0.2.0-rc.2-openbkn.0.2.0-8` |
| main build-only | [37973006719](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37973006719)，success |
| 正式发布 | [37973935334](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37973935334)，build/test/publish 和 GitHub Release 均 success；npm OIDC + provenance |
| 公开 npm 版本 | `@openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-8`；latest、rc 与 `@latest` 实读均为 -8 |
| 公开发行页 | [GitHub Release](https://github.com/openbkn-ai/bkn-dsh/releases/tag/v0.2.0-rc.2-openbkn.0.2.0-8) |
| 公开 tgz | 175186 字节、66 文件；SHA-256 `fc577a852ab0fcd2124dd94a80a654eae22155a222f9629987e98c88148752bc` |
| 验收/主线 build-only tgz | 175800 字节；SHA-256 `6a946030a6152d2899609fac95c66cd246e36cca5a8ce4e5f87ed379cbe706ea` |

## 一致性与验证范围

- main 与候选源码 `23ac2daa6d3538235f33a9627a8178a48f3e1ebf` 相比，插件目录、依赖锁、包配置和运行时清单不变。主线彩排插件 381 项（380 pass / 0 fail / 1 skip）、仓库 60/60、构建、打包和 16 个声明目标检查通过。
- 主线彩排 tarball **整包字节与已验收候选相同**，66 个解包文件的大小和 SHA 全同。见 [main-build-verification.json](main-build-verification.json)。
- 公开 npm 包有 65 个文件逐字节相同；仅 `package.json` 发生 npm 序列化变化：`scripts` 字段的位置调整，并增加一个末尾 LF（4669 → 4670 字节）。逐项 JSON 值及其他排版均相同。这里明确记录末尾换行，不把差异描述为整包或 66 文件字节一致。其余源码产物、README、声明文件和 Cordis 安装 patch 全同，因此沿用已验收候选的对应 Host 范围，无需重复同一安装与模型矩阵。
- GitHub tgz 与公开 npm tgz **逐字节相同**；下载的 `.sha256`、GitHub 资产 digest、npm SHA-1/SHA-512 integrity 均匹配。公开 provenance 的 subject digest、固定源码及 run/attempt 关联一致。核对的是公开声明关联，未另行实现证书/签名的独立密码学验证。见 [publication-assets-verification.json](publication-assets-verification.json)。
- 核验命令依次为 `gh run download … --name plugin-tarball`、解包文件/SHA 比较、公开 registry 版本端点读取、`gh release download`、`npm view …@rc version` 和公开 attestations 读取。初次 npm CLI 读取短暂返回 404；公开版本端点读取成功，随后 CI 获取和普通 rc 查询均成功。只记录此顺序，不据此判定本机缓存或 CDN 根因。

已验收的范围仍见 [macOS RESULTS](RESULTS.md)、[Windows RESULTS](WINDOWS-RESULTS.md) 和 [Windows B1 补测](WINDOWS-B1-RESULTS.md)。B1 本轮未复现不等于已修复；B2 配置 owner 故障限制、B3 补证暂缓、Chrome 下载观察、G6 6/8、受限账号与历史证据缺口仍保留在 CHANGELOG 和 [RELEASE-READINESS](RELEASE-READINESS.md)。本轮不改变模型答案治理或平台业务语义。

## 索引与上游复核

PR #83 的非阻塞意见是旧索引的范围不明确。本次为 [EVIDENCE-FILES.json](EVIDENCE-FILES.json) 增加快照提交 `1d73426ebc8ba74b950f82b2852674179a1c03b5` 及 340 项范围说明；原条目未改。340/340 原条目独立对比该提交的 Git blob，大小和 SHA 均相同，见 [historical-index-verification.json](historical-index-verification.json)。该索引不是接入 Windows 后的整目录清单，Mac RESULTS 中相应措辞也已明确为历史阶段。

长期复核锚点为现有正式 tag `v0.2.0-rc.2-openbkn.0.2.0-8` / `fc4f2c49cdfdff8a50a2a4880072cd8db1a2b7f8`：上述 340 项在该 tag 的树中同样逐项匹配；候选和发行提交的整个插件目录 Git tree SHA 相同。`1d73426`、`23ac2daa` 只作为历史来源记录，后续复现不依赖保留未合并的 feature 分支，也不额外创建 tag。

本轮再次读取官方发布信息：OpenBKN 最新正式版为 [0.1.5](https://github.com/openbkn-ai/bkn-foundry/releases/tag/v0.1.5)，DSH 最新预览为 [0.2.1-alpha.2](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.1-alpha.2)。支持与验收仍固定在 DSH `dsh-v0.2.0-rc.2`；不据此扩展 alpha 兼容声明。

推送提示的既有 [MCP SDK OAuth 依赖告警](https://github.com/advisories/GHSA-6qxp-vccf-f47h) 已只读核对。固定插件的 `openbkn-mcp-manager.ts` 连接通过 CLI Token 的 Bearer header，rc.2 的 `dsh-mcp-client` 仅传 `requestInit.headers`，没有配置 SDK `authProvider`。因此该插件连接路径未使用告警涉及的 OAuth provider 凭据流程；不将此扩大为整个 DSH 无漏洞结论，宿主依赖告警保留后续跟进。

## latest 迁移完成与下载位置

首次执行 `npm dist-tag add … latest` 实际返回 E401；[publication-assets-verification.json](publication-assets-verification.json) 保留该时点的 `rc=-8 / latest=-7`，不追溯改写。用户确认完成迁移后，本次重新实读官方注册表，得到 `latest=-8 / rc=-8`；`@latest` 的 SHA-1 与 SHA-512 integrity 均匹配此前下载的公开包，源码仍为发布 tag 指向的 `fc4f2c49cdfdff8a50a2a4880072cd8db1a2b7f8`。新记录的 checkedAt 是复核时间，不冒充维护者执行迁移的时间。

用户可在 DSH 的“添加插件”中填写 `@openbkn/dsh-business-context@latest`。本次仅核对公共注册表和发行包身份，没有新增 Host 安装或验收轮次；原验收范围与已知限制不变。

本机已核验的**公开发行包**：

`/Users/kalias/Documents/project/app/openBKN/bkn-dsh-first-use8-b1-handoff/release/first-use8-release/publication/openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-8.tgz`

这是下载核验，没有安装到用户日常 DSH profile。原验收候选与主线彩排包分开留存，不用候选 SHA 替代公开包 SHA。
