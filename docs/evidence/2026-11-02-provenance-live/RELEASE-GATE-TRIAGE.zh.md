# 剩余项的发布判断与必要补核

2026-11-03，Asia/Taipei。固定CI5/source `ae903656193d3fc5214469bc0e6ee1108e233075`、TGZ `14f4bb7f…`、官方Windows DSH Desktop 0.2.1-rc.5；代码、包及已通过项不变。本文件区分产品故障、必要验收缺口和取证限制，不把所有UNKNOWN视作产品缺陷，也不自动降低正式发布门槛。

## 当前明确判断（补核已完成）

| 项目 | 是否阻断 | 判断与处置 |
| --- | --- | --- |
| 实际答案入口指向错误Interaction、跨答案沿用旧选择 | 是，若复现即为产品故障 | 正确S/M却得到或显示错误I，不得发布；不改平台或模型输出来使其通过。本轮两入口实际I/O与渲染已核，未发现此故障。 |
| 此前入口验证前曾手选目标第2轮 | 已补，不再阻断 | 两真实答案入口3→关闭→2、未手选，原S/M与Host context/detail I及可见记录对应；见[原件及核收](./windows-rc5/ci5-anchor-session-audit/INTAKE-REVIEW.zh.md)。缺每一跳额外日志不否定已验行为。 |
| 两份会话压缩文件相差82字节 | 已查明，不阻断 | 仅追加Host空data的session/end-seed帧；旧265条完整记录及binding未变。不是仅压缩差异，也不是业务损坏。历史caller不确定保留，不称两文件全字节相同。 |
| 没有opaque handle打印、每层调用栈或全部内部版本字段 | 不是独立阻断 | 原点击输入、同次Host context/result与最终可见记录足以验收所测行为；缺额外日志如实保留。 |
| Space的短暂class/UIA变化、未拍到亚500ms视觉关闭 | 当前为取证限制，不据此阻断 | 前提是trigger持焦、hover已开，不能计闭态Space打开PASS；现有两版受控对照无对应差异，无证据指向本次Escape修复新缺陷。不重跑该矩阵。 |
| 未取得服务器After，正常退出码或历史隔离细节未知 | 当前为取证/历史限制，不独立阻断 | 不宣称服务器字节完全不变或全流程完全隔离；有新的异常写入/损坏证据时再按故障处理，不为补字段重跑模型。 |
| 各平台服务实际image/Ready | 本轮时点已闭合 | 13:22（Asia/Taipei）通过既有本机kind集群只读采到21个Deployment及25个容器实际imageID，独立核收通过，见[运行环境核收](./platform-020-runtime/INTAKE-REVIEW.zh.md)。基础设施/辅助标签与commit映射限制分别保留，不把全体称为统一正式0.2.0。 |
| 当前live tools/list与schema | 本轮已核，不再因未采阻断 | 完整25工具、当前schema已保留并分类，零tools/call/模型；3处可选输出description是旧extractor丢字段，已正式source补证，run_code另与正式历史live schema逐值相同。不是全schema等价或新业务执行通过，见[MCP判断](./MCP-CONTRACT-TRIAGE.zh.md)。 |
| 合并/标签/发布/latest | 独立发布流程与授权项 | 本轮只做必要验证及文档，不由技术取证自动授权发布。 |

## 两项最小必要补核

### 会话副本

先只读核原件349071字节/SHA `49cce19d…`、隔离副本349153字节/SHA `81bbe0c2…`及binding286字节/SHA `008b60ef…`，再独立完整解压所有Zstd帧；不调用迁移/repair或恢复前缀、不重压原件。先比解压原始字节，再比包含header和未知字段的完整JSONL记录顺序、嵌套key/value。只允许对象键序单列canonical比较，数组保序；字符串、时间、ID、问题、答案和工具输入输出不归一化，重复key/数字精度不得吞掉差异。差异以精确record/JSON Pointer、类型、长度和摘要分类，业务原文及必要原值仅留私有原件。插件投影或截断timeline不是全记录相等的独立oracle。

### 运行时锚定

不手选轮次，正常点击两个不同真实答案入口（例如第3轮答案→关闭→第2轮答案），捕获原公开Remote `openbknBusinessContext/provenanceDetailStream`输入中的S/M/request，以同一stream关联Host实际返回`kind:context`的C/initialInteractionId/interactionId/KN及detail的interaction_id，再核页面所选记录/原文。现有代码已经发出context，不需要改包。

正常DevTools Network可被动查看`/api/remote.mux`原帧；若实际Desktop走worker-local承载，则可用正常Sources既有断点只读检查原调用/事件scope并记录暂停影响。不得注入handle、覆盖fetch/WS或RPC返回、改Session或伪造selected I。独立SDK读取只能辅助，不冒充原点击。两个入口的原I/O与渲染一致即可接收该功能，缺每层内部日志不自动阻断。

## 执行范围

最终三份公开原件已按原字节/SHA核收并独立审查；本轮所列疑点未发现需改现有包的产品阻断。普通发布流程和声明范围仍须完成，不自动授权发布。

指定Windows会话已完成，独立报告与无损目录见[核收](./windows-rc5/ci5-anchor-session-audit/INTAKE-REVIEW.zh.md)。先离线查82字节，再进行必要task实机锚定。保留旧原件、保护清单和历史差异，正常退出并按PID创建时间/当前端口owner核收。业务问题、依据生成、Agent分析及业务写入均不新增；正常认证续期与业务写入分开记录。Escape/padding、Space、复制/保存、分析及既有完整矩阵不重跑，无新构建/CI或发布。
