# 发布疑点补核：接收与明确判断

2026-11-03。三份公开原件已逐块接收，验证运输gzip摘要、解压后的原始bytes/SHA及JSON完整性；保留原字节，不修改Windows报告。私有截图、完整会话正文和调试现场仍留Windows，主会话不冒充逐件直接复验。传输详情见[RECEIPT](./RECEIPT.json)。

| 原件 | bytes | SHA-256 |
| --- | ---: | --- |
| WINDOWS-CI5-ANCHOR-SESSION-AUDIT.json | 54606 | 927ff267031a767cd5b5b1f103bf26ba02c3f62175f1ba8372be3e57b2dc23cc |
| WINDOWS-CI5-ANCHOR-SESSION-AUDIT.zh.md | 9180 | 7463d29afbef855f2729440ddafe43164dd2a7722b14dca2e8a1e183a2b2a4de |
| MCP-TOOLS-CATALOGUE.json | 187156 | 33731e33d4c564dc32556a89692823e3bddc72860411d37a5aa150633994c645 |

**本轮所列疑点未发现需修改现有包的产品发布阻断；两个必要功能疑点已闭合，环境/目录元数据已核收。** 这不是全版本、全场景或业务模型执行验收，也不自动授权合并、标签、发布或latest。整体发布仍按正常流程推进，不能把每个内部字段UNKNOWN都继续列作产品故障。

## 两项必要功能核收

1. **82字节不是业务内容损坏。** 原压缩文件是副本完整前缀，原解压内容也是完整前缀；旧265条完整行、字段值与键/数组顺序、字符串、时间、数字词法均相同。新增一帧82字节，解压为68字节JSON加LF，唯一新增`session/end-seed`空data对象；两个binding同字节。实际Windows rc.5 ASAR的restore代码存在相应空data标记。它是Host非业务元数据追加，不能称两文件全字节相同，也不由静态形状证明历史谁/何时追加。历史caller未知不是业务损坏证据，不再作为阻断。
2. **真实两答案锚定已验。** 正常第3轮答案→关闭→第2轮答案，未点轮次列表，未构造handle、传入期望initialI或独立调用Remote冒充点击。实际S/M、Host context的C/initialI/currentI/KN、detail.interaction_id及可见第3/第2轮和47/4调用相互对应。第一入口长暂停后出现加载失败；停用断点后正常刷新恢复，不能认定唯一暂停因果，也不据此认定普通使用产品失败。第二入口通过不暂停logpoint观察并正常渲染，排除了上轮先手选第2轮的假通过可能。

独立来源补充：[工具输入摘录](./LOGPOINT-ARGUMENT-EVIDENCE.json)来自执行回合实际Type参数，包含重复编辑，三个表达式读取`sessionId/messageId`、`request/event`、`value.interaction_id/operations.length`，没有写入期望ID、覆盖返回或改状态。它证明记录到的输入文本，不单独证明每个source安装行或私有console输出；实际评估输出按原报告及其私有索引接收。opaque handle、wire stream ID和每个中间hop未单独采集，不否定本次充分行为oracle，不要求为此新增调试代码或继续重跑。

平台第3轮本来缺失的原文、partial/missing提示仍忠实保留，不用DSH正文补造平台记录；本轮未干预平台或模型输出。

## MCP与部署门槛

- 当前25个唯一工具、25 inputSchema及25 outputSchema，单页结束、零tools/call；ServerInfo的1.0.0只是context-loader自报层级，不替代平台版本。完整工具定义是无损JSON值聚合产物，保留所有键和数组顺序；不是HTTP原packet。当前18个受管理、7个已审排除项，没有未分类新名称；条件execute_skill缺失、Host-local CSV不在平台目录都不直接构成核心故障。
- 主正式source投影的46个已知schema中2个原始相等、41个仅文档差异、3个数据属性被旧extractor递归剪掉；复现旧投影46/46不等于全schema相等。三处`description`都是正式v0.2.0已存在的可选输出字符串，不是当前平台新增必需输入，来源见[MCP专项判断](../../MCP-CONTRACT-TRIAGE.zh.md)。未发现由其支持的破坏性合同证据。
- 原报告将主fixture的run_code/run_shell inline schema保留UNKNOWN。接收方另与已有正式0.2.0、50.129历史`context-loader-run-code-v0.2.0-live.json`独立比较：当前run_code输入和输出schema全部JSON键值及数组顺序相同；CSV caller传code和当前bkn_context、解析exit_code/stdout形状相容。这是新增元数据/静态补证，不改原报告、不冒充新CSV或run_code执行。run_shell明确排除，不为其旧schema缺口新增硬门槛。
- [主会话实际部署快照](../../platform-020-runtime/INTAKE-REVIEW.zh.md)补齐了13:22（Asia/Taipei）的21 Deployment、25容器imageID、Ready和50.28入口来源；基础设施/辅助标签及commit映射限制单列，不能称所有容器全为正式0.2.0。结合当前live目录完成本次环境/合同身份核对，未升级pins、允许名单或平台。

新工具继续deny；没有业务工具或模型新执行，因此不宣布全部managed调用、业务质量或所有运行时兼容通过。旧extractor需后续按schema位置修复并补测试，但这个测试工具维护项不要求当前包重建。

基线来源核对另有限定：Mac工作区与Windows checkout中的fixture/提取器原始bytes和SHA不同，仅在内存作LF→CRLF诊断呈现后与Windows摘要逐字节匹配，未修改任一原件。它是checkout换行差异，不将跨机基线原SHA误称相同，也不以该呈现诊断改写schema值或会话记录。

## 保全及剩余限制

正常菜单退出、诊断点清除、任务PID/端口释放及日常实例保留按报告接收；128代码/Host文件、1376保护文件、8旧报告、4会话/binding均同哈希，协议按fresh守卫核对。旧39 null、两项历史差异、至少42项mtime、共享cache增量和新路径未枚举全部保留，不能宣称全历史隔离。

服务器After未测量，零主动业务写入不等于服务器逐字节不变；Space视觉瞬态、部分内存加载版本/退出码、历史caller或镜像commit来源仍是取证限制。没有新的异常写入、错I、数据损坏或核心合同失配证据时，不据此阻断或要求重跑模型。当前只允许推进正常发布评审/主线候选等价核对等流程；不代签完整人工验收或发布授权。
