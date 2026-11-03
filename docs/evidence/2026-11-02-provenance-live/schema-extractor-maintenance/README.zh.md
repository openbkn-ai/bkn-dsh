# Schema提取器维护与#120关单记录

2026-11-03。**离线测试工具已修复，15项聚焦回归通过；真实Go提取仅恢复3处可选字段。插件生产源码、历史fixture、现有CI5包和已发布包未改。** 本次结果不增加平台、模型或真实Host验收范围。

## 修复与边界

[提取器](../../../../scripts/capture-context-loader020.py)原先在所有字典层级删除`description/title/examples/$comment`，误删了同名业务属性。现在仅在已知schema位置去除这些说明项；属性/定义映射中的名字、`const/enum/default`及未知扩展里的数据原样保留。支持组合、数组、布尔schema及旧`dependencies`的schema/属性名数组两种形式，不验证或改写业务数据，不解析未知自定义词汇。

CLI放在main guard内，导入不解析参数、不读源文件、不运行Go、不写输出。新输出记录实际UTC生成日期、`generatedAt`和`schema-position-aware-v1`；原捕获日期单列`historicalCaptureDate`。开始即拒绝既有路径，写入也采用独占创建，防止覆盖旧证据。

## 聚焦验证

[15项Python标准库回归](../../../../tests/test_capture_context_loader020.py)全部通过，命令：

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -B -m unittest discover -s tests -p 'test_capture_context_loader020.py' -v
```

覆盖同名属性/定义、三处真实字段路径、literal数据、未知扩展、嵌套/组合schema、旧tuple/dependencies、说明差异忽略、真实type/required/数据及顺序变化可检出、导入无副作用、已有文件与竞争写入保护、UTF-8/LF、生成日期和help路径。原`structural`在6个测试方法（含子例）产生14个失败断言；另用隔离probe确认旧脚本导入即调用`parse_args`，在该点截断，未访问source或Go。新实现经独立审阅无必修项；悬空符号链接拒绝是代码审阅结果，未单列为实测通过。

Go1.25.5已在本机，使用`GOTOOLCHAIN=local GOPROXY=off GOSUMDB=off GO111MODULE=off GOWORK=off`，从`git archive 81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b`的固定MCP源码副本执行真实CLI，退出0，没有下载依赖或启动平台服务。输出是source投影，不是live `tools/list`：

- [新完整投影](./context-loader-tools-v0.2.0-schema-position-aware-v1.json)：26工具/24有schema，89917字节，SHA-256 `500d50967bdecab30ba0557de41119b06279548ba9659f5c8750d1c9ba838fa5`，生成于`2026-11-03T06:52:38Z`。
- [对比摘要原件](./SMOKE-SUMMARY.json)：工具结构只新增list_knowledge_networks/list_skills的`entries.items.properties.description`及search_capabilities的`capabilities.items.properties.description`，均为可选string。其他工具结构、lifecycleExamples及全部inputsSha256与旧正式投影相同；生成元数据单列，不冒充旧捕获日期。
- 未表示的inline PTC schema继续保持unknown，不捏造空schema；既有独立run_code历史live来源不变。没有替换旧fixture消费者或将原先的有损投影宣称为已恢复。

两份新原件从本地忽略目录`release/schema-projection-maintenance-20261103/`按原字节复制，输出路径仍记录原本地产物位置；摘要/投影对应关系以上述SHA为准。固定源码三文件摘要与[MCP判断](../MCP-CONTRACT-TRIAGE.zh.md)一致。

## 保全与未执行范围

历史正式fixture仍89447字节/SHA `8f7420958e8b1f11ef3d0ac234d7ff9616c256c364c307896afe712a89ccb804`；独立run_code fixture仍2196字节/SHA `95dcd41a9f817874c01515f51ec28d8644838ce1560860c5766ddfb8df54bed8`。生产包输入和历史fixture相对本轮起点`9ee97ec`无diff；实际CI5 TGZ仍877506字节/SHA `14f4bb7fb61c892017343c832fdc8b37d892706b9a7aa2146779eef00ee9e3ff`。这不是重新打包或重新构建的结果。

没有重跑已通过的业务、模型、E2E或远端CI，没有平台写入、回答修正、allowlist或执行guard变化。本轮测试工具/文档只保留本地，不推送、不合并、不发布、不移动dist-tag。

## #120状态

[#120](https://github.com/openbkn-ai/bkn-dsh/issues/120)已于`2026-11-03T06:50:02Z`关闭为completed，仍指派kalias。按维护者逐项关单规则，关闭代表该项开发和所需验证完成：00b1181/bc5e67b已包含在CI5的ae903656源及真实候选-3包中。原Mac rc.5彩排、后续Skill增量受控验证、CI5打包探针分别归因；Windows只读溯源不冒充新模型CSV验收。新关单说明经独立只读审阅，无证据层级混用。

PR121仍draft未合并；本轮实时查询npm latest/rc均为`0.2.1-rc.3-openbkn.0.2.1-2`，未含该增量。合并、发布与日常安装状态不由关单代替。Project看板未读回或修改：本地gh令牌缺少project相关scope，不将CLI返回的空projectItems当作无项目或已Done的证明。
