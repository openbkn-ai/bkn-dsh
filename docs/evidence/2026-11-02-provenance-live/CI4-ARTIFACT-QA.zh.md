# CI4 精确产物独立包审计

结论：**包审计通过，可交远程做局部焦点修复的精确产物 E2E。** 当前不是 CI4 实机通过，也不撤销 CI3 直接 Escape 的失败记录。本审计没有启动 Host、修改源码/包、重跑测试、提交或发布。

## 实际 CI 身份

- Run：[41444758077](https://github.com/openbkn-ai/bkn-dsh/actions/runs/41444758077)；head `a52032956314cf582c0f39ed3dab2f8e80e91085`。独立读取 GitHub API 确认 workflow_dispatch、completed/success，npm Publish 与 GitHub Release 均 skipped。
- Artifact：`plugin-tarball`，ID **13141832289**。ZIP **877321 字节**，SHA-256 `3a7c905c268aad2eaca45d7839d6adb9da57c9bdad06f9bd0f2fd25283d8d8d9`，与 GitHub digest 一致；ZIP 唯一 TGZ 字节匹配审计归档。
- TGZ：`openbkn-dsh-business-context-0.2.1-rc.3-openbkn.0.2.1-3.tgz`，**877325 字节、126 文件**，SHA-256 `cf9abdf4ac085506793501f5f4c7e2d3f6ff4bc8c873e07c4b6b401064ec6b8a`。
- 新 helper 和下载目录另存为 ignored `release/provenance-live-20261102/fetch-ci4-artifact.py`、`ci-41444758077/`，未覆盖 CI3。完整身份记录见 [CI4-ARTIFACT-IDENTITY.json](./CI4-ARTIFACT-IDENTITY.json)。

## 两个独立比较基准

1. 对本地 `release/openbkn-provenance-rc3-ci4-local.tgz`（SHA-256 `34ecc9ec67992001caf2bb76caee51d2b03132f5ca005f10343be38e62e1b07a`），**126/126 文件逐字节相同**，解压后整个 tar、成员顺序、权限和其他 tar 头完全相同。压缩归档仅偏移 9 的 gzip OS 字节不同：本地 `0x13`、CI `0x03`。
2. 对实际 CI3 `fea3d0052efc7188e989bd2582be8c6930eea03b903418103da4c28fc96b61a1`，**只有 `lib/client.js` 变化，其余 125 文件字节相同，无新增/删除**；package.json、Host/Remote、许可、README 和全部声明不变。

CI4 client SHA-256 为 `fb12b2239c465707d471d86651e74dd39694abd997057e29db896bc3dcf5e8d2`；Host business 仍为 `bac538d8de54f6b362ba39374b495cf39c6dfe89c4732074cfc966f98e1af7ad`。不能用相同版本字符串或旧 CI3 归档代替该 CI4 包身份。

## 资产、许可与源码边界

- Manifest、主入口、每个 exports/type 目标、Cordis patch、CLI preload、MCP 客户端、Host/Client/Remote 和两份来源许可均完整；没有 test/harness/fixture/日志/私有回执/凭据文件、越界或非普通成员，也未发现常见 token/JWT/私钥模式。静态扫描不构成任意编码秘密均不存在的证明。
- 125 个未变文件复用 CI3 的依赖/许可与 Host 模块闭包审计；实际新 client 用 TypeScript AST 独立核对，外部静态模块仍仅 `react`、`react/jsx-runtime`、`react-dom`。依赖图和许可声明不变。
- 67 个保护源码以及 `managed-session-policy.ts`、`scoped-business-context.ts` 全部匹配 `bc5e67b` 基线。CI3 至本 head 的生产变化仅 `BusinessProvenanceScene.tsx`，其 SHA-256 为 `d1b62e75a0bc787635eb5b5420dad1a6717ea9b0d87c19a1a1de87c36a5b916e`；当前生产工作树无未提交差异。
- 同版本加载范围与历史兼容声明不扩大。未更改平台/模型输出，未触碰共享焦点 hook 或 Host 请求代码。

远程接下来应隔离安装上述 **cf9abdf4…** 精确包，核对 126 文件和实际进程，重点复验分析状态/历史切换后的真实键盘 Escape、焦点恢复、外部控件与历史 Select 优先级；具体复验动作仍由主任务按既有授权与证据范围协调；本审计未发起新的生成或分析。CI3 其他已验项目按其原证据保留，双轮/BOM、Windows、provider 输入和未捕获 POST/SSE 不自动补 PASS。

完整摘要、成员检查及比较数据见 [CI4-ARTIFACT-QA.json](./CI4-ARTIFACT-QA.json)。
