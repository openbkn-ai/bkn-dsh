# Windows SourceText 修复定向回验

2026-11-03。用户授权安排最小修复及受影响回验；继续指定原Windows会话、官方DSH Desktop0.2.1-rc.5，保持Sol/MAX现有设置。不是完整业务E2E，不使用更早Host，不合并/发布。

## 候选与启动门槛

源码 `ae903656193d3fc5214469bc0e6ee1108e233075`，build-only CI [41548846010](https://github.com/openbkn-ai/bkn-dsh/actions/runs/41548846010)，publish=false。包版本仍是未发布的 `0.2.1-rc.3-openbkn.0.2.1-3`，不覆盖已发布-2。**CI已成功并通过实际包审计，Windows已接单执行回合 `01a19eb7-803e-7b02-8016-7188213a1492`，修后结果已按[原报告](./windows-rc5/ci5-source-text-retest/WINDOWS-CI5-SOURCE-TEXT-RETEST.zh.md)和[独立核收](./windows-rc5/ci5-source-text-retest/INTAKE-REVIEW.zh.md)接收。** 交付artifact13191140519，ZIP877540字节/SHA `ade22f125ead5bce70c29e06f22d509949ff0a006cd8047e8d6f8d81702e38f3`；TGZ877506字节/SHA `14f4bb7fb61c892017343c832fdc8b37d892706b9a7aa2146779eef00ee9e3ff`。只安装此实际CI包，不安装本地参考包或重测旧CI4。

本地参考SHA `75a52410cb0de49d4554d220007e58aa3f5882666825d5f612453689160e4bcb`，126文件；client.js SHA `f7184c97d65d9bf72c192172f8e1815aee022d05df5c54905dc3c7a32c113e10`。相对CI4只有client.js变化，其余125文件逐字节相同；实际CI包与本地参考126/126文件及整段解压tar相同，只是gzip头不同；主会话与包审计worker各自完成字节核对后才派发，详见[CI5身份](./CI5-ARTIFACT-IDENTITY.json)。

继续使用原隔离rc.5/home/Electron userData及第2轮 Interaction `int_b00aabd41e40ea38eb1f9589f6057557`；保留原会话、绑定、分析/解释、旧报告和旧包。日常实例/进程/账户/协议及早期隔离异常分别守卫，不靠旧PID猜归属，不清缓存强造通过。官方CLI只安装新CI TGZ到隔离profile，启用后冷启动；安装文件与manifest/CI清单对照。加载版本/build/served模块摘要不可取得就UNKNOWN，不用磁盘版本推断内存模块。

## 必需回验

1. 输入/输出各三序列：纯hover、hover后点击、指针在中性区Tab+Enter/Space。每例重置旧层、确认轮次和自然焦点，记录真实UIA命中和前景归属。hover-click若真点击trigger已关层，就记录正常toggle，不发送没有前提的Escape；输出重叠坐标应确认实际进入popup且层仍开后再Esc。
2. 输出重叠弹层的owned Escape：指针不动，父详情保留，层应在退出动画后持续关闭；核心序列仅确认重复一次。记录按键工具请求/返回和实际采样时刻，至少约0.5/1.5/3s；首帧不冒充keydown即时帧，UIA存在不等于CSS可见，不推断采样间隙没有重开。
3. 键盘打开/关闭后，不人为mouseLeave或修复焦点，直接第一次真实hover，应可正常打开；输入和输出都验。明确新点击/键盘激活应可再开，owned Escape只关子层，后续父层Escape正常。
4. 完整popup padding边界：先点击section使其持焦，把指针移到仍覆盖底下trigger的popup padding，不点击、不补焦，再Esc并留驻。该路径应跨动画保持关闭、父详情保留。几何或工具无法证明padding命中时明确SKIP/UNKNOWN，不强造布局，也不算padding原生PASS。
5. 真正移出trigger+完整popup后再hover可开；切另一原文字段互不污染；关闭父详情后从原答案重开可用。各做一次即可，不扩全量组合。

纯hover不抢键盘焦点；搜索框仍持焦时Escape继续归父详情，所以父详情随之关闭是本轮明确的DSH容器适配策略。明确进入popup/trigger后Escape只关原文层。不要新增document级拦截或修改平台状态来迎合预期。

## 输出与收态

**新增业务问答、依据生成、BKN Agent分析、平台业务写入全部0。** 不应用建议，不改问答/invalid原因/Markdown。禁止重跑复制保存、分析busy等已通过路径以扩大验收。

报告独立命名 `WINDOWS-CI5-SOURCE-TEXT-RETEST.json/.zh.md`，逐项PASS/FAIL/SKIP/UNKNOWN，保留修前CI4 FAIL和模型配置metadata未知。结果只覆盖新候选受影响路径，不改原`PARTIAL_LIVE_NOT_RELEASE_ACCEPTANCE`为全局发布通过。

正常菜单退出task实例，按fresh Before/After/current核查owned进程和端口、可读清单及协议恢复。继续保留39不可比、旧2文件变化和至少42mtime观察等历史限制，不能用新基线抹掉旧问题。不要全局kill或强行回滚日常文件。

完成长GUI回合后先给摘要和两报告原始字节数/SHA，主会话另起短回合读取原文件字节并base64导出。私有截图/UIA原件留远程，不混入公开Git证据。无额外CI、commit/push、merge/tag/publish/latest操作由Windows执行。

## 历史锁屏门槛（已解除）

CI5安装后的126文件匹配已由远程回报；LockApp.exe锁屏使task窗口无法激活，六类交互NOT_RUN。等待本人实际解锁Windows桌面，不重复DSH/OpenBKN登录，不以问卷默认选项当答复。不得绕过OS锁或修改安全策略，实际桌面可交互后继续原清单。

## 已执行结果与接续

实际解锁后回合01a19f37-f9a5-7571-b9b9-524520bb0a23已完成；六类基本序列和核心两轮采样通过，strict padding原窗口无交叠而SKIP，唯一普通task尺寸变更又遇原生不可读/404。窗口已恢复、task菜单退出，收态和原件保护已核收。

维护者确认平台50.28正在更新，已停止新平台访问；严格padding及当前server可读/After、实际GUI失败请求身份，以及原入口默认第3轮/Space设置观察仍待稳定后核。按SOURCE-TEXT-POST-UPGRADE.zh.md最小接续，不自动重跑完整矩阵、模型或构建，不修改平台和模型内容，也不直接认定resize或升级为唯一原因。
