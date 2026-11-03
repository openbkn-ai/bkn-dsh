# -3 当前验收状态与发布前待办

**SourceText修复接续（2026-11-03）**：本地最小修复及必要检查已完成，只有Scene内原文弹层变化。插件825通过/1既有Windows专项跳过、仓库79/79、包126文件；本地包相对CI4仅client.js不同。纯hover保持不夺焦/父层Escape归属；明确进入原文层后仅关子层，覆盖完整popup padding及键盘关闭后的首次hover。真实浏览器矩阵及加强断言已独立核收；修复ae90365已推送，PR独立批准及CodeQL通过，[新build-only CI41548846010](https://github.com/openbkn-ai/bkn-dsh/actions/runs/41548846010)已成功，实际TGZ14f4bb7f…与本地126文件/tar相同、相对CI4仅client.js变，发布均跳过；Windows指定会话已接单运行[精确新包定向回验](./WINDOWS-SOURCE-TEXT-RETEST-HANDOFF.zh.md)。**旧Windows FAIL和所有UNKNOWN继续保留，新候选CI通过，尚无Windows修后验收结论。** 见[修复记录](./SOURCE-TEXT-FIX.zh.md)。以下CI4结果均指旧包。

2026-11-03更新。提交、推送、CI4出包/审计、Mac受影响回归和Windows官方DSH Desktop0.2.1-rc.5的本轮E2E执行及收态均已完成。**Windows专项已核收并连续两次复现输出原文Escape留驻；原回执仍为PARTIAL_LIVE_NOT_RELEASE_ACCEPTANCE，原W3 FAIL保留，不能称全部发布或人工验收通过。** PR #121保持草稿，未合并、打标签、发布或移动latest。

## 固定候选及已完成证据

- 源码`a52032956314cf582c0f39ed3dab2f8e80e91085`，候选`0.2.1-rc.3-openbkn.0.2.1-3`；[CI41444758077](https://github.com/openbkn-ai/bkn-dsh/actions/runs/41444758077)，publish=false。插件816通过/1 Windows专项跳过、仓库79/79、MCP companion1/1、包126文件；两版官方npm Host受控检查仍按原来源留证，不代替此次Windows原生结果。
- 实际TGZ SHA256 `cf9abdf4ac085506793501f5f4c7e2d3f6ff4bc8c873e07c4b6b401064ec6b8a`，877325字节、126文件。与本地参考所有文件及解压tar相同；相对CI3仅client.js变化，Host及其余125文件、67份受保护源码不变。验收后未改包，后续均为文档回执。
- Mac官方rc.5已完成CI3真实6调用、OS复制/原生保存、生成1/分析1及部分图谱；CI3焦点FAIL保留，CI4精确包R1—R4焦点补测通过。见[Mac回执](./remote-ci4/REMOTE-CI4-REPORT.zh.md)。
- Windows有效验收固定官方rc.5，签名Valid、Node24.21/Electron44.7；官方CLI安装退出0、126/126一致并冷启动，真实回答入口定位、多轮切换/筛选、操作和图谱选择、原文/全屏、原生保存、历史重开有实证。第二次分析捕获busy及终态，无Tab/鼠标补焦，直接Escape只关侧栏、保留父详情并回入口。生成1/分析2/新业务问答0。见[Windows原回执](./windows-rc5/WINDOWS-CI4-RESULTS.zh.md)、[独立接收](./windows-rc5/INTAKE-REVIEW.zh.md)。旧Host仅为历史准备/失败材料，不计rc.5通过。
- 同Windows Interaction的原平台HTTP200与Save均6306字节/SHA `caeb1e32d62c389d115b07c3e6904cfc9d24ea02da75127eb675f92fbfa68aa7`，217处“请求失败”在原始平台响应内。粘贴读回6430字节、124个CRLF，对应原文124个LF；仅诊断归一化后相同，不称字节一致或认定转换层。
- Windows菜单正常退出、owned进程和端口释放有据，退出码未知。后段freshBefore1376项摘要不变、39项不可读；早期964项中的2文件变化、至少42项mtime观察、协议关联及共享缓存新增分别保留，不能声称全流程/全机零改动。原报告按SHA接收未改字节，私有原件留远程。

## 仍需处理的事项

1. **修复已复现的W3边界并确认纯hover的Escape归属。** [六例专项原报告](./windows-rc5/source-text-review/WINDOWS-CI4-SOURCE-TEXT-REVIEW.zh.md)及[独立复核](./windows-rc5/source-text-review/INTAKE-REVIEW.zh.md)已按原字节/SHA核收：输出hover后在重叠坐标点击popup section，Escape后指针留驻，连续两次弹层仍可见、父详情保留、焦点回搜索框。两个键盘例正常；两条纯hover会连父详情关闭，不能作交互通过；输入hover-click因点击已关层没有发送Escape。DOM派发目标、是否短暂关闭后重开、平台同序列行为仍未知。本轮新增问答/生成/分析/业务写入均0。应先补确定性失败回归，区分JSDOM事件/焦点/计时与浏览器真实布局/遮挡pointer覆盖，再作最小修复和精确新包Windows受影响回验。无需再换模型或重跑完整E2E，旧FAIL不覆盖。
2. **保留平台内容及分析输入的限制。** 平台原Markdown占位、缺失调用和invalid原因忠实保留；Mac及Windows分析均有not_evaluable/0建议，不作为业务质量通过。实际分析时POST/provider最终输入及原始SSE未捕获，不能据模型自述认定插件丢输入。插件不清洗、补造、重判或应用建议。
3. **明确未覆盖的原生声明范围。** Windows在途取消/低权限拒绝/异常网络、内存加载版本与Desktop build等仍未知；大记录、managed父子/共享输入及两种图谱全屏的未覆盖组合不从其他机器、旧候选或受控测试补记。此次不再安排早于rc.5的Windows宿主；不同/未来Host兼容也不由本轮概括。
4. **保留已知适配差异。** partial搜索不补全；HTTP失败使用安全分类、不透传任意错误体；detail不可读时KN预检不走平台Trace Markdown回退。UI基于固定Studio release来源，不代表未发布main逐项一致；重复依赖体积为后续项，知识网络目录未改版。
5. **正式发布操作仍未授权。** 需先处理hover异常和验收声明范围，再按批准的PR/main候选等价/标签发布流程执行。当前原包、已发布-2和latest不变。用户最终人工体验验收未代签。
