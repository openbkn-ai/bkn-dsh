# 第三候选独立最终 QA

最终包身份、既有范围保护及本轮焦点/预算修复复核通过，未发现剩余必修代码项。原生界面行为由主智能体另留实机证据，本文不替代该验收。

## 最终身份

- 候选：`release/openbkn-provenance-parity-live.3.tgz`，871946 字节、126 文件，SHA-256 `7f5f6a8630a4b3dcaf05a9e88e90f96bb1bef7f4ba8194ca518a24aefbbf10c5`。与 `INSTALL-IDENTITY-3.json` 一致。
- 隔离安装 **126/126** 文件逐字节等同 tar；编译产物与工作树一致，只有 package.json 为等义序列化差异。Host、Client、Remote、MCP 运行资产及来源许可齐全，未将测试/harness 声明入包。manifest 仍为原版本，因此本轮以摘要和隔离安装身份区分，不能只看版本字符串。
- 相对首个 55c7 候选，仅 business/client 和两个预算类型声明变化，另新增局部焦点 helper 声明；没有删除文件。相对 77a6 候选变化为 business/client、helper 声明及两个预算声明。旧候选及旧 QA 均保留为历史，不冒充本包身份。
- 67 个保护源码同时匹配 `bc5e67bfa1706c0e7f991f59979dbb93efe4a960` 和新 fixture，原样保留两处工具面修复。编译 business.js 的 managed routing 与 kn_id 声明过滤谓词仍存在。日常包仍与既有 CSV 实测候选 **94/94** 文件一致。

## 最终测试口径

标准 `pnpm test`：**759 通过、1 项 Windows 专项跳过**（760 总计）；完整兼容/仓库/runtime 命令日志 **79/79**；范围保护 **2/2**。本 QA 独立补跑源码旁 adapter/clipboard/list 测试 **10/10**，并独立复验 modal Tab/ShiftTab **2/2**（后两项已包含在标准套件内，不重复加总）。

旧手动 763 项检查点包括源码旁 10 项，而标准脚本只运行 tests 目录；随后新增 3 项 Tab/nonmodal 和 4 项预算用例。`763 - 10 + 3 + 4 = 760`，下降来自命令覆盖集合不同，并非删测。源码旁 10 项已在最终源码上另跑补齐。日志摘要和 SHA-256 见 [FINAL-QA.json](./FINAL-QA.json)。

## 独立边界复核

最初独立复现了内层 analysis 最后按钮按 Tab 后被外层焦点圈移到全局关闭按钮的问题。修正后 modal 在本层处理首尾 Tab/ShiftTab；SourceText 明确 nonmodal，不因 hover 抢焦点或困住 Tab。历史 Select 的 Escape 先关下拉，随后才关分析面板；fullscreen Portal 更换后恢复当前 trigger；legacy Inspector 使用局部 helper。未改共享 outer hook、分析取消语义、平台字段、业务关系或模型输出。

详情预算从 Reader 固定 detail GET、Scope 主详情、Scope 预检到 Client direct/chunk 聚合均为 **16 MiB**。其他 native JSON/分析和轮次累计仍 **8 MiB**，Markdown HTTP/Host 仍 **1 MiB**；128 Ki 字符 chunk、25 万值、深度 64、100 页以及旧 Native Reader 边界未扩大。新回归是大小/形状相同的合成数据，不包含真实业务行或模型原文；没有裁剪或重新解释平台内容。

## 运行证据界限

本轮打开文件快照能看到使用独立 electron-3 cache 的 Desktop 进程；没有仍打开的 business.js/client.js 句柄，不能因此推断未加载，也不能声称取得模块内存摘要。没有使用 debugger 或私有对象注入。最终第三候选冷启、真实键盘和 59 次调用记录的实际行为，依主智能体的实机验收记录；本文件只对独立执行/读取的证据负责。Windows、真实生成/分析及人工验收不补记完成。

本 QA 只新增 `FINAL-QA.json`、`FINAL-QA.zh.md`，未改产品源码、包、配置、日常数据或平台/模型输出。
