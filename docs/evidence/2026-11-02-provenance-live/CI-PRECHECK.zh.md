# build-only CI 提交前独立复核

日期：2026-11-02。基线：`bc5e67bfa1706c0e7f991f59979dbb93efe4a960`。结论：源码、许可、测试、公开证据和构建依赖闭包可进入提交及分支 build-only CI；未发现需要继续修改运行代码的事项。本复核没有执行 commit、push、远端 CI 或发布。

## 源码与候选身份

- 将原冻结清单与第三候选最终审查摘要合并核对，37 个有摘要的变动生产源码文件没有漂移；67 个保护源码仍同时匹配 `bc5e67b` 和 fixture，包括两处已测工具面修复。
- 新本地 CI 候选为 `0.2.1-rc.3-openbkn.0.2.1-3`；package 与 runtime manifest 版本一致。`release/openbkn-provenance-rc3-local.tgz` 为 871951 字节、126 文件，SHA-256 `4fd73c118a08238738a5c78c06b7d95dacdc98276aa6d065669d059060e95d41`。
- 已独立读 tar 比较：相对实机第三候选 `7f5f6a86…`，125 个其他文件逐字节一致，仅 package.json 改变。解析后差异只有版本由 `-2` 改为 `-3`、test 脚本纳入源码旁测试；不是整个 package.json 等义的声明。详见 [PRE-CI-DELTA.json](./PRE-CI-DELTA.json)。
- 检查时 index 仍含早期暂存快照，主智能体将统一纳入新文件和更新后的工作树；提交前必须同步这些改动，不能只提交旧 index，尤其不能漏掉 Reader 的 16 MiB 详情入口。

## 公开证据与私有文件边界

检查快照的 166 个新增/修改候选路径中，没有 `release`、`node_modules`、`.dsh` 或 `.private` 文件；ignored release 的私有回执、凭据、原始业务响应和会话副本未纳入。158 个文本文件的 JWT、GitHub/npm token、AppKey 和私钥模式扫描没有命中。代码中的受控认证值属于测试 fixture。

已目视检查 5 张实机截图：没有登录凭据或设置页面；保留了本次 sample 演示的问答、物料编号、对象/字段名及记录 ID，尤其原文 popover 截图包含 sample 回答原文。因此不将这些图片描述为“完全没有业务原文”。它们是 sample 演示的公开界面证据，不是完整原始响应、凭据或会话日志。其余 3 张为明确标记的合成 fixture 页面。

## CI 构建与测试闭包

- 现有 release-plugin 工作流按 manifest 克隆固定 DSH、配置并构建 generator，使用 Node 22.19.0 / pnpm 11.7.0、frozen lockfile，随后构建两端、测试和打包；没有跳过必要的 generator 步骤。
- 平台 UI 所需 AntD/icons、i18next、Markdown/GFM 依赖已经声明；DOM 测试依赖也在 devDependencies。Client 按 browser 条件打包所需依赖，只从 Host 取得共享 React/ReactDOM，避免重复 React 或 Node-only 外部模块。开发测试/harness 声明排除规则仍在，包内运行资产及两份来源许可齐全。
- 原先默认 test 脚本漏跑源码旁 adapter/clipboard/list 的 10 项，本次已显式纳入，CI 会随标准 test 命令执行。最新本地结果为 **770 项总计、769 通过、1 项 Windows 专项跳过**；完整兼容/仓库/runtime 检查 **79/79**、范围保护 **2/2**、126 文件包审计通过。
- 工作流以分支 `workflow_dispatch` 且 `publish=false` 运行时，npm 发布步骤不执行，GitHub Release job 只接受 tag；本轮不应推 tag 或改用发布模式。

## 交接判据

真实远端构建仍待执行；此预检不能替代其结果。CI 完成后须记录提交、run 和实际 tar 摘要，逐文件对比本地 `4fd73c11…`，将任何运行资产差异交给后续 E2E 核对。远程验收应安装 CI 的明确 artifact，不用 npm 中已发布的同系列包替代。历史 Mac 证据与新 CI artifact 的远程 E2E 继续分别记账，不自动补记 Windows、真实生成/分析或人工验收通过。

本复核仅新增本报告；未改产品、配置、包或他人文件。
