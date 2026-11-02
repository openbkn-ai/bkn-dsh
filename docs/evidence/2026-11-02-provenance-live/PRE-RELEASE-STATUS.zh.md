# -3 当前验收状态与发布前待办

2026-11-03更新。提交、推送、CI4出包/审计、Mac受影响回归和Windows官方DSH Desktop0.2.1-rc.5的本轮E2E执行及收态均已完成。**Windows原回执仍为PARTIAL_LIVE_NOT_RELEASE_ACCEPTANCE：保留W3混合hover/click原文层Escape一次FAIL，不能称全部发布或人工验收通过。** PR #121保持草稿，未合并、打标签、发布或移动latest。

## 固定候选及已完成证据

- 源码`a52032956314cf582c0f39ed3dab2f8e80e91085`，候选`0.2.1-rc.3-openbkn.0.2.1-3`；[CI41444758077](https://github.com/openbkn-ai/bkn-dsh/actions/runs/41444758077)，publish=false。插件816通过/1 Windows专项跳过、仓库79/79、MCP companion1/1、包126文件；两版官方npm Host受控检查仍按原来源留证，不代替此次Windows原生结果。
- 实际TGZ SHA256 `cf9abdf4ac085506793501f5f4c7e2d3f6ff4bc8c873e07c4b6b401064ec6b8a`，877325字节、126文件。与本地参考所有文件及解压tar相同；相对CI3仅client.js变化，Host及其余125文件、67份受保护源码不变。验收后未改包，后续均为文档回执。
- Mac官方rc.5已完成CI3真实6调用、OS复制/原生保存、生成1/分析1及部分图谱；CI3焦点FAIL保留，CI4精确包R1—R4焦点补测通过。见[Mac回执](./remote-ci4/REMOTE-CI4-REPORT.zh.md)。
- Windows有效验收固定官方rc.5，签名Valid、Node24.21/Electron44.7；官方CLI安装退出0、126/126一致并冷启动，真实回答入口定位、多轮切换/筛选、操作和图谱选择、原文/全屏、原生保存、历史重开有实证。第二次分析捕获busy及终态，无Tab/鼠标补焦，直接Escape只关侧栏、保留父详情并回入口。生成1/分析2/新业务问答0。见[Windows原回执](./windows-rc5/WINDOWS-CI4-RESULTS.zh.md)、[独立接收](./windows-rc5/INTAKE-REVIEW.zh.md)。旧Host仅为历史准备/失败材料，不计rc.5通过。
- 同Windows Interaction的原平台HTTP200与Save均6306字节/SHA `caeb1e32d62c389d115b07c3e6904cfc9d24ea02da75127eb675f92fbfa68aa7`，217处“请求失败”在原始平台响应内。粘贴读回6430字节、124个CRLF，对应原文124个LF；仅诊断归一化后相同，不称字节一致或认定转换层。
- Windows菜单正常退出、owned进程和端口释放有据，退出码未知。后段freshBefore1376项摘要不变、39项不可读；早期964项中的2文件变化、至少42项mtime观察、协议关联及共享缓存新增分别保留，不能声称全流程/全机零改动。原报告按SHA接收未改字节，私有原件留远程。

## 仍需处理的事项

1. **复现并分诊W3原文层Escape异常。** 远程澄清当时在触发区域单击、过程中可能先hover，实际命中节点和键盘焦点未记录；父详情保留、弹层仍可见，移鼠后消失，无法区分未关闭与关闭后重开。源码只证明事件/延迟重开的候选路径，不能归因平台或Windows。需补输入/输出的真实hover+click、事件目标/焦点和延迟持续断言，再决定最小修复。见[边界待办](./windows-rc5/FOLLOWUP-BOUNDARIES.zh.md)。一次键盘路径通过不覆盖该FAIL。
2. **保留平台内容及分析输入的限制。** 平台原Markdown占位、缺失调用和invalid原因忠实保留；Mac及Windows分析均有not_evaluable/0建议，不作为业务质量通过。实际分析时POST/provider最终输入及原始SSE未捕获，不能据模型自述认定插件丢输入。插件不清洗、补造、重判或应用建议。
3. **明确未覆盖的原生声明范围。** Windows在途取消/低权限拒绝/异常网络、内存加载版本与Desktop build等仍未知；大记录、managed父子/共享输入及两种图谱全屏的未覆盖组合不从其他机器、旧候选或受控测试补记。此次不再安排早于rc.5的Windows宿主；不同/未来Host兼容也不由本轮概括。
4. **保留已知适配差异。** partial搜索不补全；HTTP失败使用安全分类、不透传任意错误体；detail不可读时KN预检不走平台Trace Markdown回退。UI基于固定Studio release来源，不代表未发布main逐项一致；重复依赖体积为后续项，知识网络目录未改版。
5. **正式发布操作仍未授权。** 需先处理hover异常和验收声明范围，再按批准的PR/main候选等价/标签发布流程执行。当前原包、已发布-2和latest不变。用户最终人工体验验收未代签。
