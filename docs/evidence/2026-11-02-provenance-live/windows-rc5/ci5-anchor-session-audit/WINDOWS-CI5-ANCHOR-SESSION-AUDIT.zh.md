**CI5 Windows 会话字节、真实回答锚点与 MCP 目录补核**

结论：82 字节差异已归类为 Host 非业务元数据追加；真实回答入口从第 3 轮切换到第 2 轮的锚点核查通过；完整实采了 25 个 MCP 工具及输入、输出 schema。本次授权范围内未发现产品阻断证据。全版本发布验收和模型执行兼容性不由此报告宣告通过。

固定对象：CI5 源码 `ae903656193d3fc5214469bc0e6ee1108e233075`；run41548846010、artifact13191140519、publish=false。安装包与官方 Desktop0.2.1-rc.5 未更换。GUI 全程使用 Windows MCP。窗口保持 `[632,290,1296,828]`，未重跑此前 Space、尺寸或源文矩阵。

**82 字节差异：完整离线比较通过**

原会话349071字节、145个zstd frame；隔离会话349153字节、146个frame。按 decoder 实际消耗字节逐帧推进，并独立验证每个分段，均消费至末尾，无尾部残留、修复或截断。严格 UTF-8/JSONL 有效；解压后分别1324189/1324258字节、265/266条记录。

原压缩文件是隔离文件的完整前缀。唯一新增为82字节压缩frame，解压成68字节JSON行加LF，共69字节。所有原有265条记录的原始行、完整键值、对象键顺序、数组顺序、字符串、ID、时间与数字词法均完全一致；未用插件字段投影代替完整比较。两个286字节绑定文件同哈希。

唯一差异指针 `/records/265` 是新增 `session/end-seed` 对象，含type/seq/time/data，data为空对象。公开仅给类型、长度、指针和哈希；精确值与解压正文保留private。用户/助手消息、工具输入结果、生命周期回执均未改动。

这不是单纯压缩或格式变化，但属于Host非业务恢复标记。实际Windows ASAR中 `@deepseek-ai/dsh-session/lib/index.js:1428` 在对应restore条件下追加空data的end-seed。静态形状支持分类；历史追加者及调用栈仍UNKNOWN，不能据此证明历史因果。本轮四个会话/绑定原件前后同哈希。

| 对象 | SHA-256 |
|---|---|
| 原压缩会话 | `49cce19d02d2410b8e34cc8b9d0568d88e871f02325427eb5357f5df3c13469c` |
| 隔离压缩会话 | `81bbe0c2a2351dbfd3bbf1e5e091d162167eddc05256db144806d5ad26a4552b` |
| 原解压内容 | `f718069545724cc7ad9d270e04a45cda5e8f02b8fcdd16da55c3a6c24b04b726` |
| 隔离解压内容 | `822d692d65a71fcb10382a820c13e62326ba9833153bf36f71b3c53c61d6f14d` |
| 两个绑定 | `008b60ef33f7842b580c16b6bc15eb8148a7330118cfd8f4e55cc802e8e27a7f` |

**真实回答入口：第3轮到第2轮切换通过**

从原会话正常回答页脚打开第3轮，正常关闭，回原对话向上翻页，再点第2轮页脚。未手选轮次列表，未手工指定initialI、构造handle或调用Remote。

| 现场值 | 第3轮入口 | 第2轮入口 |
|---|---|---|
| S | `session-58973674-89a4-43ae-a2b7-9f32e86032e3` | 同一S |
| M | `8d5d7d8b-ec23-4628-889a-7ec132fcad28` | `5f3949b4-75d3-4a3f-978d-e16d9a828e86` |
| Host initialI / currentI | `int_c3d3f535dde4e5771e41d2dd5b781aee` | `int_b00aabd41e40ea38eb1f9589f6057557` |
| 实际detail.interaction_id | `int_c3d3f535dde4e5771e41d2dd5b781aee` | `int_b00aabd41e40ea38eb1f9589f6057557` |
| 正常选中轮次 / 调用数 | 3 / 47 | 2 / 4 |

同一C `conv_3d9d7a82c9984b25ae8d0c18a47adfe4`，KN `supply_ontology_hand`。S/M来自真实factory局部参数；C、initialI、currentI、KN来自Host实际context事件；detail ID来自实际返回结果。第3轮选中由UIA记录，47次调用由既有截图视觉核实；第2轮二者均有UIA记录。

第3轮最初用内置Sources暂停观察，长暂停后出现rounds/markdown加载失败；禁用断点后一次普通只读刷新恢复第3轮、47次调用。暂停干扰是合理解释，未证明唯一因果，也不据此认定产品失败。第2轮使用三个临时、不暂停的DevTools logpoint，仅记录实际参数/context/ID/数量，正常渲染第2轮、4次调用。

opaque handle、wire stream ID和完整中间hop未单独捕获，继续UNKNOWN；它们是观察限制，不否定已闭合的真实跨回答行为和Host context/detail对齐。当前API记录本身missing/partial，第3轮输入输出“未记录”和原生提示如实保留，没有补造正文。

**MCP：完整实采与准确比较**

时间 `2026-11-03T05:51:50.609Z` 至 `2026-11-03T05:51:50.733Z`；同一隔离SDK/CLI身份、原CA、TLS校验，对 `https://192.168.50.28/api/agent-retrieval/v1/mcp/` 完成initialize → notifications/initialized → tools/list。一页25项，nextCursor缺省，目录完整；tools/call=0。前置读检查走SDK正常续期，未强制登录，未保存/打印token或MCP session header。

ServerInfo `{"name":"context-loader","version":"1.0.0"}` 仅是服务自报，不证明平台版本/构建或全部服务版本。完整目录与每个inputSchema/outputSchema见 `MCP-TOOLS-CATALOGUE.json`，187156字节，SHA-256 `33731e33d4c564dc32556a89692823e3bddc72860411d37a5aa150633994c645`。

正式对照仍为Foundry v0.2.0 / `81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b` source fixture，26工具、条件skill.executeEnabled=true；未用旧准备镜像25工具替代正式oracle，未改历史fixture。当前25项为18个已安装受管理工具、7个已审阅排除项，没有未分类的新名称。execute_skill当前不提供；find_skills为旧版兼容项。新工具保持既有拒绝策略，allowlist未改。openbkn_export_csv是Host本地工具，不计入平台25项。

完整schema先精确比较全部键值，仅对对象键排序，保留数组顺序。另按JSON Schema位置排除说明性description注释时：46个已知共同输入/输出schema，2个原始相等、41个仅文档差异、3个涉及同名数据属性。不能递归忽略所有description键后宣称全schema一致。

| 工具 | 数据字段精确JSON Pointer | 当前合同 | 分类 |
|---|---|---|---|
| list_knowledge_networks | `/outputSchema/properties/entries/items/properties/description` | 可选 string | 已审阅排除 |
| list_skills | `/outputSchema/properties/entries/items/properties/description` | 可选 string | 受管理 |
| search_capabilities | `/outputSchema/properties/capabilities/items/properties/description` | 可选 string | 受管理 |

旧 `capture-context-loader020.py:104-109` 递归删除description/title/examples/$comment，包括properties下的数据字段名。复现旧投影后46/46与fixture匹配；这只证明投影兼容，不证明全schema或历史live字节相同。

主会话独立git show提供固定正式源码补证：三指针对应的可选string输出字段在v0.2.0已存在，三份源码SHA与fixture输入指纹一致。这与当前实采吻合，归类为旧提取器信息损失，未发现新破坏性变化。Windows本轮未执行这次上游git show，不冒称本机实采，不声称重建旧live字节。

静态caller检查：三处都是输出字段，root/item的required缺省。受检查的managed guard按inputSchema检查kn_id与当前bkn_context，生命周期结果监听只解析start/finish，未发现依赖三处输出description的核心硬编码参数。当前list_skills输入要求bkn_context；search_capabilities要求字符串kn_id与bkn_context；list_knowledge_networks仍排除。declaresKnId仅检查属性存在，不能泛化成“所有类型变化都会自动排除”。

run_code/run_shell正式fixture的inline PTC schema保持UNKNOWN；本次有当前完整schema，不宣称补齐旧基线。未调用业务工具/模型或旧守卫矩阵，完整运行时兼容性未验证。

**退出和保护检查**

临时断点/logpoint全部移除，未保存源代码修改。任务经“应用 → 退出”正常结束，Desktop PID7304及子进程/Host31716消失，端口57663释放。日常五个PID路径/创建时间与本轮前值一致，日常Host11576、端口58794保留；未强退日常实例。

128/128插件和Host文件、1376/1376本轮保护文件、8/8既存公开报告、4/4会话/绑定原件同哈希；协议命令与fresh-before一致。窗口1296×828保持原值。此为独立报告，不覆盖旧报告。

历史限制保留：39旧null基线UNKNOWN；早期964基线已有daily package.json与session993270e5...两处差异；此前回调阶段至少42个默认userData mtime变化缺完整before、成因UNKNOWN；旧rc.2→rc.5触发来源UNKNOWN；共享pnpm缓存历史增量保留；新增日常路径未枚举。本轮干净fresh-before/after不能抹除历史限制，不能保证全历史隔离。

机器可读报告 `WINDOWS-CI5-ANCHOR-SESSION-AUDIT.json`；私有证据索引 `private/evidence-manifest.json`。公开报告不含凭据、原会话正文或新增元数据精确原值。

MCP-TOOLS-CATALOGUE.json 从既有实采离线聚合，全部25个工具定义、所有input/output schema键值和数组顺序保持原值，含名叫description的数据属性；未递归裁剪，未再请求MCP。它包含采集时间、来源、分页结束说明、原始响应字节数与SHA引用，是JSON值聚合产物，不冒称HTTP原packet。无请求headers、token、MCP session凭据或业务响应；工具定义未作静默删改。
