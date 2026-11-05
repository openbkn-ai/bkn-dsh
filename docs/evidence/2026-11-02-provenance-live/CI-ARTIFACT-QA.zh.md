# CI3 实际发布候选独立包审计

结论：**可将实际 CI3 artifact 交远程执行精确产物 E2E，未发现包审计阻断项。** 本报告只核对归档、文件、构建资产与源码范围，没有启动 Host、调用平台、修改源码或重跑测试；实际 CI 包的远程实机验收仍待完成。

## 实际产物与逐文件比较

- CI：[41404675956](https://github.com/openbkn-ai/bkn-dsh/actions/runs/41404675956)，提交 `f13fe10c4d6041fd7ce7be5007e0740051ec29c0`。CI 成功及 publish=false 状态来自主任务保存的 `CI-ARTIFACT-IDENTITY.json`；本审计独立计算以下实际下载文件的摘要。
- Artifact ZIP：`plugin-tarball` / `13122759006`，SHA-256 `8122149c1d1db499173ea9225af807ac63f812aee8d235862188f88c26c609ac`；ZIP 内只有下述 TGZ，读出字节与独立审计的 TGZ 完全一致，摘要与保存的 GitHub digest 相同。
- TGZ：`openbkn-dsh-business-context-0.2.1-rc.3-openbkn.0.2.1-3.tgz`，**877043 字节、126 个普通文件**，SHA-256 `fea3d0052efc7188e989bd2582be8c6930eea03b903418103da4c28fc96b61a1`。
- 正确本地参考为 `release/openbkn-provenance-rc3-ci2-local.tgz`，SHA-256 `e68bd4d9bf75a67e125beb39726a9f8aa05c83e4547aa6b0a841629dd85f3c02`。**126/126 文件逐字节相同，没有新增、删除或内容改变；package.json 字节、键顺序、解析后内容都相同。**
- 两份压缩归档仅偏移量 9 的 gzip OS 字节不同：本地 `0x13`、CI `0x03`。解压后的整个 tar 字节完全相同，包括成员顺序、时间、权限及其他 tar 头；因此不把归档 SHA 不同误报为运行文件改变。远程必须使用 CI 的 `fea3d005…` 包身份。

## 内容、依赖与许可

- Manifest 名称 `@openbkn/dsh-business-context`、版本 `0.2.1-rc.3-openbkn.0.2.1-3`；license 为 `SEE LICENSE IN LICENSE`，解析内容与当前提交 manifest 相同。
- 主入口、所有 exports/type 目标、Cordis patch、Host/Client/Remote、CLI preload、MCP 客户端和来源许可文件均存在。没有重复、非普通或越界归档成员；没有 test/harness/fixture/日志/私有回执或凭据文件路径，也未发现本轮测试 sentinel 或常见 token、JWT、私钥模式。静态模式检查不能证明不存在任意编码的秘密。
- 解析归档全部 JS 的 TypeScript AST，7 个静态相对模块引用全部落在包内；不把 Remote 元数据字符串中的类型声明 `import(...)` 误作运行时加载。Client 外部模块仅为 Host 提供的 `react`、`react/jsx-runtime`、`react-dom`。AntD/icons、i18next、Markdown/GFM 依赖保持已核对的声明与打包结果，无新依赖差异。
- `LICENSE` 保留原插件 Apache 2.0 与复用 Studio 的 OpenBKN 许可说明，`licenses/openbkn-studio.txt`、`licenses/dsh-mcp-client.txt` 都与当前源码逐字节相同；不把 Studio 复用代码描述为 Apache-only。
- Node/DSH 加载范围仍为 `^22.19.0 || >=24.0.0` 与 `0.2.0-rc.2 || >=0.2.1-rc.3`。这些是声明的加载范围，不是所有 Host 的实机兼容验收结论。

## Host 修复与源码范围

- 67 个受保护生产源码全部匹配 `bc5e67bfa1706c0e7f991f59979dbb93efe4a960` 清单；`managed-session-policy.ts`、`scoped-business-context.ts` 也直接与该 Git 基线比较，字节一致，已测工具面增量未被回滚。
- `f330eff…` 到 `f13fe10…` 仅变更测试及证据/计划文档，没有生产逻辑变更；当前工作树无生产源码差异。
- 实际 CI `lib/business.js` SHA-256 为 `bac538d8de54f6b362ba39374b495cf39c6dfe89c4732074cfc966f98e1af7ad`；`lib/client.js` 为 `81150d9008dc7553b899bdc822d6fde399a264205437fae93f73f8d04f323070`，均与本地参考及当前构建文件一致。身份守卫、详情预算和 Host 工具面保留情况不因 CI 归档头差异而改变。

完整 126 文件摘要、比较结果和审计范围见 [CI-ARTIFACT-QA.json](./CI-ARTIFACT-QA.json)。历史 7f5/4fd/e68 的本地证据继续保留，不将其记为新 CI 包的实机通过；远程需要安装上述精确 CI artifact 并记录真实 Host、平台、包摘要及通过/失败/未执行项。本报告不构成 Windows、发布或 latest 推广验收。
