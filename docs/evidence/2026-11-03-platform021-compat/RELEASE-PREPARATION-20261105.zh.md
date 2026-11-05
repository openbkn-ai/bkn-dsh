# PR #121 评审合并与发布准备检查点

2026-11-05。维护者授权推进 PR #121 评审合并，复查正式 CLI 0.2.1，补齐必要验收后发布；现有 CI6 包保持不变，不重跑已通过项。合并与发布分别按实际结果记录，本检查点不代表已经发布。

## PR 与固定制品

- 检查时 PR #121 为 Draft、MERGEABLE/CLEAN，GitHub reviewDecision=APPROVED，没有未解决的行内评审线程。最后一次代码批准对应生产源 `f01b316fbfb6be681af81e2267a7b3341e659efd`；后续均为文档/证据。当前提交的最终评审和合并继续推进，不以正式 CLI 尚未发布阻止已批准代码入库。
- CI6/run41596006291、artifact13212518096、版本 `0.2.1-rc.3-openbkn.0.2.1-3` 保持：877732 字节、126 文件、SHA256 `4500fa4357cdcdcb9914a39794aedb9096c948192c2bf0f35ecf4fadb882f046`。后续文档提交不改变该包；不重跑原生 UI、模型、查询、认证或 guard 已通过矩阵。
- Mac S1/S3 和 S2 左 padding 的限定验收见[最终核收](./MAC-SOURCE-TEXT-CLOSEOUT.zh.md)。精确 DOM/AX 命中、箭头单独分支和瞬时动画限制保留；平台旧样本迁移 [openbkn-deploy #82](https://github.com/openbkn-ai/openbkn-deploy/issues/82) 独立跟踪。

## 正式 CLI 与最新上游

2026-11-05 16:08 台北时间的官方只读查询：

- [npm 精确 0.2.1](https://registry.npmjs.org/%40openbkn%2Fbkn-sdk/0.2.1) 返回 HTTP404，`version not found: 0.2.1`；[完整元数据](https://registry.npmjs.org/%40openbkn%2Fbkn-sdk)中没有该版本或发布时间。
- npm `latest=0.2.0`，`rc=0.2.1-rc.2`。rc.2 的 npm gitHead 与官方 `v0.2.1-rc.2` 标签一致，均为 `516b21ccb24309ec2234443e9bc99aac55af467c`；已有 rc.1 实机结果仍归属于原版本，不改成 rc.2 或正式版通过。
- [rc.1→rc.2 固定源码比较](https://github.com/openbkn-ai/bkn-sdk/compare/1cd2839652733e2ce6690b14e76ff8e9d73861dc...516b21ccb24309ec2234443e9bc99aac55af467c)含两个提交、32 个变化文件。插件实际使用的 `auth status --json`、`auth token`、`auth login` 所在认证命令，以及 TLS、凭据 store、版本检查路径未出现在变化列表；`package.json`仅改版本。SDK trace 改动为注释，新增日志 API 和业务管理命令调整不属于插件直接 SDK 调用路径。此为源码边界复核，不代替正式包安装验收，不据此重跑已过项或升级插件。
- [DSH 发布列表](https://github.com/deepseek-ai/deepseek-harness/releases)新增 `dsh-v0.2.2-rc.1`（2026-11-04），本次已验宿主仍为官方 `0.2.1-rc.5`，不自动扩大支持或升级宿主。
- [Foundry 发布列表](https://github.com/openbkn-ai/bkn-foundry/releases)最新正式仍为 `v0.2.0`。从既有准备基线 `1a3a76edb993d3944afb94a135392d33c90a0432` 到本次 main 快照 `87fb895488dbb70f6c1c17af1a94777ceef67c4f` 有 26 个提交；[固定比较](https://github.com/openbkn-ai/bkn-foundry/compare/1a3a76edb993d3944afb94a135392d33c90a0432...87fb895488dbb70f6c1c17af1a94777ceef67c4f)未改变 MCP schema 文件。所见相关变更为关系属性声明精简和可观测性文档更新，平台输出继续原样透传；不把 main 快照当作正式 0.2.1 或已部署版本。

## 剩余发布门槛

正式 CLI 0.2.1 尚不可得，精确正式安装仍为 NOT_RUN，不能用 rc.2 代填。正式包可得后，只核官方版本/来源/完整性及与已验版本的受影响差异，再在隔离环境补必要的安装、实际版本和正常连接验收；不覆盖默认 CLI，不重跑已经通过的业务或 UI 矩阵。

最终评审通过后按既定方式 squash 合并 PR #121；发布前还须核 main 与已验生产源/候选的等价关系。正式 CLI 门槛未关闭前，不打发布标签、不发布 npm、不推广 latest。现有发布工作流会重新构建并运行整套测试，本轮不启动它，以遵守不重跑已通过项的要求；本检查点不创建跳过测试的新发布机制。
