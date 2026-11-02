# 本地集成候选独立 QA

本地包与安装身份、非溯源范围保护通过；单靠进程打开文件不能证明 JavaScript 模块在内存中加载的路径或字节。

- 基线为 `bc5e67bfa1706c0e7f991f59979dbb93efe4a960`，保留 `00b1181` 工具面修复及 `bc5e67b` 的 legacy skill 定义收窄。当前 67 个受保护源码文件同时匹配该 Git 基线和新 fixture；其中 `managed-session-policy.ts`、`scoped-business-context.ts` 原样不变。
- 候选 `release/openbkn-provenance-parity-live.tgz`：870058 字节、125 文件，SHA-256 `55c707f36ab65d15a7ee3433aa1ad12c5bb5d1dc417423ff7e275427304f2af9`，与 `INSTALL-IDENTITY.json` 相同。隔离安装 **125/125** 文件逐字节匹配；包与工作树只有 package.json 等义序列化差异。
- Host、Client、Remote、MCP 资产和两份来源许可齐全；没有测试/harness 声明入包。编译后的 business.js 同时含 managed routing 和缺少 kn_id 定义的过滤谓词，没有回退已修工具面。
- 现有日志读回：插件 **755 项通过、1 项 Windows 专项跳过**（756 总计），仓库 **68/68**。这是本次独立读取已有执行日志，不是再次运行测试。
- 日常安装与既有 `b7b26bb8…` CSV 实测候选仍 **94/94** 文件逐字节相同，隔离安装没有覆盖其包文件。

## 进程证据的界限

检查时 PID 35568 为 `/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness`，PID 35980 的父进程为 35568。35568 打开的路径显示独立 electron cache 和本轮私有日志；本 QA 没有读取日志内容、凭据或原消息。

两进程检查时都没有仍打开的 business.js/client.js 文件句柄。ESM/浏览器加载后可关闭文件，不能从这个结果推断“未加载”；也不能声称 lsof 已取得模块内存摘要。实际加载身份须结合全新进程、已安装包摘要和另外采集的原生 UI/Remote 行为。未使用 debugger 或私有对象注入。

主智能体报告真实 rc.5 已从已有第一回答打开正确轮次、显示 11 次调用并与平台同记录对照；该行为由主智能体的原生验收证据负责，本文件 QA 未独立操作该界面，不将报告冒充自身观察。

旧 `2026-11-02-provenance-parity` 中 cfd 基线候选和双 Gateway 摘要保留为历史检查点，不能用其旧产物摘要宣称本次 bc5 集成包相同。新包身份以本轮安装回执与本 QA 为准。Windows、真实分析/生成、原生复制下载及人工验收不由本轮文件核查补记完成。

详细逐文件摘要及进程快照见 [QA.json](./QA.json)。本 QA 只新增这两份报告，没有改动产品源码、包、配置或数据。
