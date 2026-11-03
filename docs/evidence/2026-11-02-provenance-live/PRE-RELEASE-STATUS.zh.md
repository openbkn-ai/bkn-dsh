# -3 当前验收状态与发布前待办

2026-11-03更新。**CI5成功；本轮Windows锚定、会话82字节差异及当前MCP/平台身份补核已收口，未发现需要改包的产品阻断。剩余为正常发布流程、声明范围和取证限制，不把所有UNKNOWN继续列成硬门槛，也不宣告全局发布验收。** PR #121保持草稿，未合并、打标签、发布或移动latest。

当前源码 `ae903656193d3fc5214469bc0e6ee1108e233075`，候选 `0.2.1-rc.3-openbkn.0.2.1-3`，[CI41548846010](https://github.com/openbkn-ai/bkn-dsh/actions/runs/41548846010) publish=false成功。插件825通过/1既有Windows专项跳过、仓库79/79、MCP1/1、包126文件；本地真实Chromium矩阵另有独立核收。实际TGZ SHA `14f4bb7fb61c892017343c832fdc8b37d892706b9a7aa2146779eef00ee9e3ff` 与本地参考126/126和整段tar相同；相对CI4仅client.js变化，其他125文件逐字节不变，源码仅SourceText局部交互变化。见[CI5审计](./CI5-ARTIFACT-QA.zh.md)、[修复记录](./SOURCE-TEXT-FIX.zh.md)。

随后只做[离线测试工具维护](./schema-extractor-maintenance/README.zh.md)：15项回归和一次固定源码真实Go提取通过；旧fixture及生产源码/包不变，没有新业务/模型/E2E/CI。#120已按该项开发与验证完成关闭；修复包含在候选-3，PR121仍草稿未合并，公开latest/rc仍为-2，不能称公开版本已修复。

本次[最终Windows原报告](./windows-rc5/ci5-anchor-session-audit/WINDOWS-CI5-ANCHOR-SESSION-AUDIT.zh.md)及[三文件传输回执](./windows-rc5/ci5-anchor-session-audit/RECEIPT.json)已按bytes/SHA接收。82字节是追加一帧Host `session/end-seed`空data记录，解压新增69字节；原压缩文件和解压内容均为隔离副本的精确前缀，原265条完整记录的原始行、所有键值与顺序、业务问答、工具输入结果、C/I/KN和两个binding保持。并非全文件相同或纯压缩差异；历史追加者未知不自动构成业务损坏阻断。

真实原答案入口按第3轮→正常关闭→第2轮执行，未点轮次列表或构造handle/Remote调用。实际S/M、Host context的C/initialI/currentI/KN及detail.interaction_id对应可见第3轮47调用、第2轮4调用，限定跨回答功能锚定通过，旧手选第2轮的验收缺口已由新序列闭合。opaque handle、wire ID、全部中间hop和loaded version未单独采到，属于观察限制，不否定已闭合的功能。首个长Sources暂停后出现加载失败，禁用断点一次普通刷新恢复；第二入口用不暂停logpoint取证，保留前次失败/恢复观察，不认定唯一因果或产品故障。

[13:22平台快照](./platform-020-runtime/INTAKE-REVIEW.zh.md)已独立核收21个Deployment的desired/ready/updated均1和25容器实际imageID；available未采，基础设施/辅助标签、别名和commit映射限制继续保留，不能概称全部统一正式0.2.0。当前完整[MCP目录](./windows-rc5/ci5-anchor-session-audit/MCP-TOOLS-CATALOGUE.json)有25工具，18受管理/7已审排除、无未分类新名称，tools/call=0。三处可选输出数据属性description在固定正式源码已存在，差异来自旧提取器信息丢失；这是基线/验证工具维护项，不要求当前插件改包，见[MCP判断](./MCP-CONTRACT-TRIAGE.zh.md)。不称全schema等价、重建旧live字节或本轮新managed业务调用通过。

本轮task正常退出，128代码/Host文件、1376保护文件、8旧报告和4会话/binding原件保持摘要，日常进程/协议守卫保留；不把fresh比较升级为全历史隔离。此前Space、serverAfter、历史隔离细节等是声明与取证限制，非独立产品阻断；不为补字段重跑模型或已过矩阵。具体分级见[发布判断](./RELEASE-GATE-TRIAGE.zh.md)。

## 前一阶段平台恢复后补核（历史）

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

## 正常发布流程、声明范围与取证限制

1. **本轮必要补核已闭合。** 会话82字节差异已分类、无手选跨答案功能锚定通过、平台时点运行身份和完整MCP目录已核；当前没有由这些疑点支持的必修改包项。缺opaque handle、每层调用栈或额外内部版本字段不再列为独立阻断。若出现新的错误Interaction、业务记录损坏、核心合同不满足或边界失守证据，仍按产品故障处理。
2. **平台内容与分析输入取证限制。** 原Markdown占位、缺失调用和invalid原因忠实保留；not_evaluable/0建议不当业务质量通过，实际POST/provider帧缺失也不据模型自述裁决插件丢输入。Space未拍到瞬态、serverAfter未测、退出码及历史隔离细节等不是独立阻断，不为补字段重跑模型；插件不清洗、补造、重判或应用建议。
3. **发布声明限于已有证据。** 在途取消/低权限/异常网络、大记录或managed父子/共享输入的未覆盖原生组合，以及CI5新增Mac受影响回验等不补写PASS；不把未宣称的组合一律转成必须重跑的门槛，也不外推未来Host兼容。历史失败、UNKNOWN、原窗口SKIP和当前采样范围保留。
4. **测试工具维护已完成，适配差异继续记录。** 提取器已按JSON Schema位置处理注释并覆盖同名description字段等关键边界，15项回归通过；新离线投影独立留证，旧基线信息丢失限制保留，不覆盖旧fixture，不改allowlist或重建包。partial搜索不补全、安全错误分类、KN预检回退边界及固定Studio来源差异继续记录；依赖体积和知识网络目录改版不在本次范围。
5. **完成正常发布流程并取得相应授权。** 按既定PR审批、main候选文件等价、标签及发布流程执行；技术疑点收口不自动授权合并、打标签、发布或latest，也不代签人工体验验收。候选、已发布-2及latest保持现状。
