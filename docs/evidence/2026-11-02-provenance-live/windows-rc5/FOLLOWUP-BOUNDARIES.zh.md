# Windows rc.5 回执后的边界待办

**2026-11-03专项核收更新**：输出原文在hover后点击覆盖trigger的弹层section，Escape后指针不动，连续两次层仍可见、父详情保留、焦点回搜索框；复现成立，关闭后重开的机制仍未证。两次纯hover会连父详情关闭，需确认关闭层级；输入hover-click已点击关层，未发Escape；两个键盘例正常。详见[新报告独立复核](./source-text-review/INTAKE-REVIEW.zh.md)。原报告和下述旧记录均保留。下一步应补JSDOM状态回归及真实浏览器布局/pointer覆盖，再作局部修复与精确新包Windows回验；不重跑完整E2E或模型。

2026-11-03。本轮E2E执行与保全已完成，接收的是有范围的实机结果；原始报告保留`PARTIAL_LIVE_NOT_RELEASE_ACCEPTANCE`，不是全部发布或人工验收通过。以下只读复核未修改生产代码或重跑模型。

## 需先复现和分诊的真实异常

W3有一次原文层在鼠标位于触发区/弹层附近时，按Escape后仍可见，移开鼠标才消失。远程随后基于旧记录澄清：当时在坐标(1450,632)单击，过程中可能先触发hover；不是已证的纯悬停用例，也不能确认点击实际命中trigger还是弹层。键盘打开原文层后的Escape路径通过，不能覆盖这次FAIL。原始记录未确定当时activeElement、keydown目标、是否先关闭又被hover重开，不能直接归因Windows、插件或平台。

当前`BusinessProvenanceScene.tsx`的SourceText共用`open`，hover不接管焦点，click额外请求焦点；不存在独立的“点击固定”状态。局部Escape helper只监听触发器和弹层section。固定Studio来源没有插件新增的controlled open与局部焦点处理，所以仅基础hover/click配置相同不能证明运行行为相同。底层trigger允许延迟hover打开及动画期间重开，这只是候选机制，不是已证根因。

已有测试覆盖“mouseEnter→层出现→主动聚焦trigger→Escape”，未发生mouseLeave；不能说完全没有留驻hover测试。缺口是输入、输出两种原文的真实hover+click完整序列，Escape实际焦点/目标，以及关闭后跨hover延迟/退出动画的持续断言。下一步应先做确定性回归和真实pointer留驻复现，保留外层不被误关，再决定最小修复；不预设需要全局document Escape监听，不动平台或模型输出。

## 已验证与仍未知分别保留

- 同Interaction平台原HTTP200与原生Save均6306字节、SHA256 `caeb1e32d62c389d115b07c3e6904cfc9d24ea02da75127eb675f92fbfa68aa7`，含217处“请求失败”。本次导出未新增这些占位；平台为何生成仍未知。
- 粘贴再复制读回6430字节、124个CRLF，原文件124个LF；仅在诊断比较时归一化后相同。不能称原字节一致，也不能据此断言具体哪一步进行了换行转换。原件未修改。
- 两次分析均completed/not_evaluable；第二次实际捕获busy、终态后无Tab/点击补救直接Escape、父详情保留和焦点返回。生成1次、分析2次、新业务问答0次。实际POST/provider输入未捕获，不以模型自述裁决输入丢失或业务质量。
- 正常菜单退出及owned进程/端口释放有实证，退出码未知。后段1376项摘要相同只覆盖可读freshBefore；39项不可读、旧964项中的2个变化、至少42个mtime观察、共享缓存新增继续单列，不能称全过程或全机零改动。
- 内存加载版本、Desktop build、在途取消及低权限/异常网络路径没有补写PASS。大记录、managed父子/共享输入等未覆盖的最终包原生场景不由其他机器或受控测试替代。

候选仍为CI4/a520329/cf9ab…，本轮验收后未改包。未合并、打标签、发布、移动latest或重新运行构建/发布CI。正式发布前应先处理上述hover异常和验收声明范围。


## 远程既有记录澄清

来自短回合`01a19d04-4b82-7eb3-99c3-bf34b8898bda`，未重开Host或重跑测试。按Escape前无键盘焦点记录，不能确认事件命中；之后截图显示父业务溯源仍打开、弹层可见。无连续画面，不能区分始终未关与关闭后重开。以下私有截图未传入主机，仅保留远程给出的摘要引用：

- Escape后：`0b050643271ab2acbbeab2a109226f72f2497357a386a29a8d099e9b18941348`
- 随后键盘打开：`1dde7e2517ee888e65491f25bf8971f6e8126db9ea447ad5e18d1cd5166e96ef`
- 随后键盘Escape关闭：`d3dcc16ed685c1d7936b828518e88ec9b6c505e18e757837cbbfe636f1fddccc`

这些澄清不改原回执的FAIL，也不补造焦点/计时证据。
