# -3 当前验收状态与发布前待办

2026-11-03更新。**CI5成功，Windows平台恢复后有界补核已原字节接收；strict padding在本次真实几何采样通过，运行时锚定链和其他未知仍开放，不是全局发布验收。** PR #121保持草稿，未合并、打标签、发布或移动latest。

当前源码 `ae903656193d3fc5214469bc0e6ee1108e233075`，候选 `0.2.1-rc.3-openbkn.0.2.1-3`，[CI41548846010](https://github.com/openbkn-ai/bkn-dsh/actions/runs/41548846010) publish=false成功。插件825通过/1既有Windows专项跳过、仓库79/79、MCP1/1、包126文件；本地真实Chromium矩阵另有独立核收。实际TGZ SHA `14f4bb7fb61c892017343c832fdc8b37d892706b9a7aa2146779eef00ee9e3ff` 与本地参考126/126和整段tar相同；相对CI4仅client.js变化，其他125文件逐字节不变，源码仅SourceText局部交互变化。见[CI5审计](./CI5-ARTIFACT-QA.zh.md)、[修复记录](./SOURCE-TEXT-FIX.zh.md)。

本次[平台恢复后原报告](./windows-rc5/ci5-post-upgrade/WINDOWS-CI5-POST-UPGRADE.zh.md)及[传输回执](./windows-rc5/ci5-post-upgrade/RECEIPT.json)已按bytes/SHA接收：同一CI5、官方rc.5，无重新安装/构建；本轮重核client.js摘要，126安装文件等价引用此前CI5安装证据。一次原生1920×800宽窗得到实际padding点在section外、popup inner与自身输出trigger内、另一输入trigger外，真实section点击持焦后仅移动到padding，Escape后各离散采样点至约3s子关父留、未见重开并回自身输出trigger；名义0.5s样本实际从工具返回后约665ms开始，采样间瞬态未知，原Bounds恢复。只接收本几何的PASS_AT_SAMPLED_TIMES，不覆盖旧原窗口SKIP或推出全视口通过。

平台目标是维护者声明的正式OpenBKN0.2.0；health200/ServerVersion0.2.0已观察，原C/I因现有凭据过期先401，一次官方SDK正常续期后均200，TLS校验保持。subject相同仅对续期前后成立，升级前subject/scope快照缺失；各服务image/commit/Ready及版本统一性仍UNKNOWN。两次入口页面分别显示第3/第2轮，与离线日志所列turn5/turn4 receipt、渲染答案位置/特征及当前平台轮次相容；实际按钮→M未捕获，不能据此证明运行时对应。第3轮不是第2轮锚定错误证据，第2轮也不补记完整锚定PASS：UIA messageId、opaque handle、运行时Host receipt和actual selected I未暴露，且目标点击前曾手动选第2轮，不证明独立跨轮重置。

Space已限定为trigger持焦且hover已打开：class短清再回、UIA曾offscreen；没有视觉关闭区间，不算closed→Space打开PASS，也不据此归因Escape修复。受控两Scene同前提行为一致仅作本地对照。server after-state仍未测量，69244字节detail响应只是GUI前gate；本轮除GET外有一次正常/oauth2/token认证POST，业务写入0和本地摘要不能证明服务端内容不变。本轮菜单退出、任务进程/端口释放及1376项fresh非凭据文件同哈希按报告接收；原始Session/binding未变，当前隔离副本349153字节与原始349071字节不同且差异来源UNKNOWN，六份旧报告及历史保护限制保留。见[更新后复核](./SOURCE-TEXT-POST-UPGRADE.zh.md)。

## CI5首轮回验与平台维护（历史阶段）

Windows官方rc.5安装126/126匹配、六类基本序列按各自预期通过，输入hover-click是正常点击关层，没有发Escape；原输出故障两轮在工具返回后至约3s采样子关父留，键盘关闭后首次hover也通过。严格padding与自身trigger交叠在原窗口没有几何条件；单次普通task窗口调整后原生场景不可读，仍SKIP。两份[原报告](./windows-rc5/ci5-source-text-retest/WINDOWS-CI5-SOURCE-TEXT-RETEST.zh.md)按bytes/SHA接收，[独立核收](./windows-rc5/ci5-source-text-retest/INTAKE-REVIEW.zh.md)通过，旧CI4 FAIL/UNKNOWN保留。

原入口末次重开默认第3轮，只证明入口可开，不证明第2轮锚定；hover覆盖popup时Space仍开是未分类设置观察，另一次真实关闭后点击再开通过不能覆盖它。resize后的GUI实际请求身份/路径未知；两条独立原conversation/detail GET均404，不能回填GUI请求。维护者确认50.28正在更新，真实升级起止、目标版本及唯一因果未知；当前不再访问平台。服务器原记录没有可比较After，不把0写入或本地摘要当server内容不变。具体接续见[更新后最小复核](./SOURCE-TEXT-POST-UPGRADE.zh.md)。

本轮问答/依据生成/Agent分析/发起业务写入均0；task菜单退出、owned进程和端口释放，日常实例继续。1376可比文件摘要相同仅覆盖fresh清单，旧39 null、旧2差异、mtime至少42、新增路径未枚举等限制继续保留，不能声称全机/全过程零变化。

## CI4历史基线与已完成证据

- 源码`a52032956314cf582c0f39ed3dab2f8e80e91085`，候选`0.2.1-rc.3-openbkn.0.2.1-3`；[CI41444758077](https://github.com/openbkn-ai/bkn-dsh/actions/runs/41444758077)，publish=false。插件816通过/1 Windows专项跳过、仓库79/79、MCP companion1/1、包126文件；两版官方npm Host受控检查仍按原来源留证，不代替此次Windows原生结果。
- 实际TGZ SHA256 `cf9abdf4ac085506793501f5f4c7e2d3f6ff4bc8c873e07c4b6b401064ec6b8a`，877325字节、126文件。与本地参考所有文件及解压tar相同；相对CI3仅client.js变化，Host及其余125文件、67份受保护源码不变。验收后未改包，后续均为文档回执。
- Mac官方rc.5已完成CI3真实6调用、OS复制/原生保存、生成1/分析1及部分图谱；CI3焦点FAIL保留，CI4精确包R1—R4焦点补测通过。见[Mac回执](./remote-ci4/REMOTE-CI4-REPORT.zh.md)。
- Windows有效验收固定官方rc.5，签名Valid、Node24.21/Electron44.7；官方CLI安装退出0、126/126一致并冷启动，真实回答入口定位、多轮切换/筛选、操作和图谱选择、原文/全屏、原生保存、历史重开有实证。第二次分析捕获busy及终态，无Tab/鼠标补焦，直接Escape只关侧栏、保留父详情并回入口。生成1/分析2/新业务问答0。见[Windows原回执](./windows-rc5/WINDOWS-CI4-RESULTS.zh.md)、[独立接收](./windows-rc5/INTAKE-REVIEW.zh.md)。旧Host仅为历史准备/失败材料，不计rc.5通过。
- 同Windows Interaction的原平台HTTP200与Save均6306字节/SHA `caeb1e32d62c389d115b07c3e6904cfc9d24ea02da75127eb675f92fbfa68aa7`，217处“请求失败”在原始平台响应内。粘贴读回6430字节、124个CRLF，对应原文124个LF；仅诊断归一化后相同，不称字节一致或认定转换层。
- Windows菜单正常退出、owned进程和端口释放有据，退出码未知。后段freshBefore1376项摘要不变、39项不可读；早期964项中的2文件变化、至少42项mtime观察、协议关联及共享缓存新增分别保留，不能声称全流程/全机零改动。原报告按SHA接收未改字节，私有原件留远程。

## 仍需处理的事项

1. **按新原件保留剩余身份与声明边界。** 原记录当前可读、strict padding本次原生几何采样已补；平台各服务image/commit/Ready、完整运行时S/M→handle/Host receipt→selected Interaction、加载版本/build和server after-state仍未知。第3/第2轮入口结果分别与各自历史receipt相容，但不以离线映射代填运行时锚定，也不以先前手选第2轮后的显示证明独立跨轮重置。Space现为明确前提的观察，不算闭态键盘激活通过；同前提受控Scene无差异不外推Windows/平台等价。是否需继续取证或接受这些范围由维护者确定，不默认扩大重跑或降低发布门槛。历史维护404/resize的GUI请求身份及唯一原因仍未知，不由新200回填。已过项不原样重跑，不改平台原文/状态/编号或调用模型。
2. **保留平台内容及分析输入的限制。** 平台原Markdown占位、缺失调用和invalid原因忠实保留；Mac及Windows分析均有not_evaluable/0建议，不作为业务质量通过。实际分析时POST/provider最终输入及原始SSE未捕获，不能据模型自述认定插件丢输入。插件不清洗、补造、重判或应用建议。
3. **明确未覆盖的原生声明范围。** Windows在途取消/低权限拒绝/异常网络、内存加载版本与Desktop build等仍未知；CI5 SourceText没有新增Mac DSH原生回验，旧CI4 Mac证据不代填这次受影响路径；大记录、managed父子/共享输入及两种图谱全屏的未覆盖组合不从其他机器、旧候选或受控测试补记。此次不再安排早于rc.5的Windows宿主；不同/未来Host兼容也不由本轮概括。
4. **保留已知适配差异。** partial搜索不补全；HTTP失败使用安全分类、不透传任意错误体；detail不可读时KN预检不走平台Trace Markdown回退。UI基于固定Studio release来源，不代表未发布main逐项一致；重复依赖体积为后续项，知识网络目录未改版。
5. **正式发布操作仍未授权。** 需先处理上述未闭合项及验收声明范围，再按批准的PR/main候选等价/标签发布流程执行。当前原包、已发布-2和latest不变。用户最终人工体验验收未代签。
