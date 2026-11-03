# CI5 实际产物独立审计

2026-11-03。结论：**build-only CI5 成功，真实归档与本地最终参考包126/126文件及整段解压tar相同；相对CI4仅 client.js 变化。** 这是包身份和受控CI验证，不是Windows原生验收或正式发布通过。

## 来源与真实字节

- [CI41548846010](https://github.com/openbkn-ai/bkn-dsh/actions/runs/41548846010)，workflow_dispatch，源码 `ae903656193d3fc5214469bc0e6ee1108e233075`，分支 feat/provenance-platform-parity-live，publish=false。
- plugin-tarball artifact `13191140519`；ZIP 877540字节，SHA-256 `ade22f125ead5bce70c29e06f22d509949ff0a006cd8047e8d6f8d81702e38f3`，与GitHub artifact digest相同。
- TGZ `openbkn-dsh-business-context-0.2.1-rc.3-openbkn.0.2.1-3.tgz`，877506字节，SHA-256 `14f4bb7fb61c892017343c832fdc8b37d892706b9a7aa2146779eef00ee9e3ff`，候选版本 `0.2.1-rc.3-openbkn.0.2.1-3`。
- `lib/client.js` SHA-256 `f7184c97d65d9bf72c192172f8e1815aee022d05df5c54905dc3c7a32c113e10`，与冻结的本地最终构建一致。
- GitHub连接器核对jobs/artifact元数据；本地通过gh只读下载原始ZIP/job日志并计算摘要。未触发或重跑workflow。

## 内容、安全与比较

独立读取ZIP和TGZ成员，没有执行包内代码。ZIP只含预期TGZ；tar恰126个唯一安全路径的普通文件，无symlink/hardlink、路径穿越或开发/凭据相邻路径。package name/version、exports/main/types目标、插件资源和两份来源许可均在包中。

本地参考TGZ SHA-256 `75a52410cb0de49d4554d220007e58aa3f5882666825d5f612453689160e4bcb`；全部126文件和整段解压tar相同，tar SHA-256 `674ec003bce599be9e9de808adc647e1cfaf0a6f19c4af798d6c67e1f50f178f`。压缩头差异位置为 `[9]`，不把gzip包装字节差异误报成代码差异。

对原CI4/TGZ cf9abdf4…逐文件复核，只有 `lib/client.js` 不同，另125文件逐字节相同；Host、business逻辑、声明、README和许可均没有新增差异。旧CI4归档、Windows失败与UNKNOWN未覆盖。完整逐文件摘要见 [CI5-ARTIFACT-IDENTITY.json](./CI5-ARTIFACT-IDENTITY.json)。

## CI实际验证与发布状态

从已完成build job原始日志提取三组TAP结果：插件826项，825通过、1个Windows专项跳过、0失败；仓库79/79；MCP companion1/1。package audit为126文件。

受控双Host报告artifact `13190007845`，ZIP SHA-256 `e25182a751abbc7a555d2832e87a69e2f6c342b5f355fc18d0cd87b70ca74f05`，绑定的是同一TGZ SHA。官方npm 0.2.0-rc.2和0.2.1-rc.3的guard-formal、guard-formal-disabled、guard-legacy、CSV、native-output、Remote均pass。它们是Linux上的真实官方npm依赖加stand-in平台及scripted模型，不是旧版Windows Desktop验收，也不替代目标rc.5原生回验。

实际job steps显示 Publish to npm 为 skipped；独立GitHub Release job为 skipped。没有合并、打标签、发布或移动latest。详细结果见 [CI5-RESULT.json](./CI5-RESULT.json)。

## 接续边界

SourceText修复后的Windows受影响回验尚需单独接收，不能从本审计补记PASS；沿用官方Windows Desktop0.2.1-rc.5、精确新CI包及隔离旧样本。此次没有启动DSH、平台请求或模型，没有修改平台和模型原始输出。原文纯hover不夺焦、父搜索持焦时Escape归父的DSH适配策略不等于已证平台现场同序列一致。

本审计只新增这三份CI5记录及忽略目录中的下载/审计文件；未改产品源码、包、CI4记录或其他工作树内容，未commit/push。
