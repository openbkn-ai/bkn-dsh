# CI5 Windows 回验独立核收

2026-11-03。结论：**可接收 SCOPED_UI_RETEST_WITH_PLATFORM_MAINTENANCE_OPEN_ITEMS。原文层六类基本序列及原故障两轮在实际采样范围内通过；严格padding交叠、平台维护下的读取及未分类观察仍开放，不是全局发布或升级后验收。**

主会话与独立只读子智能体分别审查公开报告。接收方没有取得远程private截图、完整UIA/网络原件，也没有自行重演Windows Host；以下原生观察按指定测试方报告核收，字节和内部一致性由接收方直接验证。

## 原件与候选

两份原报告逐字节匹配[RECEIPT.json](./RECEIPT.json)，JSON可解析，BOM/CRLF等原字节保留：

- JSON13688字节，SHA256 `d72cabe556c50e34b41cfc75ca1186e0b3ed5f8d2585c57940def45859d0a561`。
- 中文报告8196字节，SHA256 `34c54803c1c80b66b9f925aa750ec25cbe33d8b4c773913830c01743247bf53d`。

run41548846010、source ae90365、artifact13191140519、ZIP/TGZ大小与摘要、126文件和client f7184c97…均与[独立CI5包审计](../../CI5-ARTIFACT-IDENTITY.json)一致。报告官方rc.5 CLI安装退出0、126/126匹配、签名Valid和冷启动进程；实际served client摘要、内存加载版本、Desktop build和有效模型档位metadata仍UNKNOWN，不由磁盘或用户请求配置代填。四份CI4旧报告在本地再次核SHA也不变。

## 可接收的UI范围

- 输入/输出纯hover保持search焦点，Escape由父详情处理，子层随父关闭。这是已明确的DSH容器策略，不是平台现场相同操作已验证。
- 输入hover-click实际点到trigger并切换关闭，没有发无前提的Escape；它是序列正常toggle通过，不能称输入混合路径的Escape已测通过。
- 输出原故障点(1450,632)真实点击后UIA section持焦，指针留驻Escape，两轮均在工具返回后的约0/0.5/1.5/3秒采样中子层关闭、父详情保留。工具自身约0.53秒的请求—返回区间内真实keydown时刻未知；采样间是否短暂重开、DOM activeElement和实际派发目标继续UNKNOWN。
- 两条自然Tab+Enter/Space键盘路径及键盘关闭后第一次实际hover通过，报告明确没有额外制造mouseLeave；真实离开组合区后再hover、已观察关闭状态下明确点击再开、另一字段独立及后续父Escape按限定观察核收。

## 严格padding仍未执行

原窗口trigger矩形完全位于section内，section外padding与自身trigger不交叠，因此strict用例SKIP成立。指针在真实但不交叠的padding、section保焦、Escape关闭的观察可以保留，不能替strict用例PASS。

唯一一次普通task窗口调整至1920×800没有改DOM/CSS/Host/DPI/业务；随后原生场景不可进入，strict几何无法取得，补测同样SKIP。原Bounds及窗口状态已恢复，不能说尺寸变化导致404，也不能说恢复Bounds就证明API已恢复。

## 维护与404的证据边界

GUI回退显示NATIVE_NOT_AVAILABLE和记录404，但当时实际S/M/C/I、GET路径、wire status及Host失败receipt没有可信记录，继续UNKNOWN。静态代码中初始conversations GET失败可触发旧视图回退；它不是当时GUI请求的抓包证明。

两条独立只读对照的原conversation列表和原Interaction detail实际均404，有路径及时间，但不能回填GUI失败的身份/路径，也不能据此认定记录被删除。维护者告知平台更新的主会话记账时刻为02:54:01 UTC（clock工具记录，不是精确用户消息接收时刻），Windows实际获知并记账为02:55:25 UTC，对照GET于02:54:27 UTC完成；三者不得混为同一时刻。真实升级起止、服务/版本及404唯一原因仍未知。获知维护后停止新平台访问。

server After的NOT_MEASURED应理解为没有取得可比较的原记录正文After，存在两次404读取尝试。发起业务写入0及本地Session/binding摘要不证明服务器当前内容未变，更不应覆盖或修正平台输出。

## 两项需另核的观察

1. 最后一次原入口重开默认第3轮，原报告的PASS仅支持入口可打开。没有该次可信M/handle/Host receipt与selected I证据，**不能称原答案第2轮锚定已验通过**，也不能直接判插件锚定缺陷。平台稳定后做一次有界身份与轮次对应核对，依据可信Interaction ID及平台当时的轮次，不强制沿用旧第2轮数字或改写平台编号。
2. 输出hover覆盖popup时Space后仍见打开是未分类设置观察。后续真正closed→click再开通过不能覆盖它。稳定后先记录Space前自然焦点及动作后稳定状态；尚无预期/目标证据，不预设代码修复或把文本滚动解释当现场根因。

## 红线、收态与接续

报告新问答/依据生成/Agent分析/发起业务写入均0，仅有上述两条诊断GET；没有平台或模型内容改写。task菜单退出后owned进程/49269端口消失，日常实例继续、创建时间不变，退出码UNKNOWN。1376可比摘要相同仅覆盖fresh清单；旧39 null、未枚举新增路径、最初2差异、至少42mtime及缓存历史继续单列，不能说全机/全过程零变更。协议按fresh Before精确当前值守卫核对，未无条件覆盖。

后续按[更新后最小复核](../../SOURCE-TEXT-POST-UPGRADE.zh.md)：先确认部署身份/稳定和受影响只读契约，再核原记录、入口锚定、Space观察及strict padding缺口。无需重跑已通过的六类矩阵或模型。是否接受无法执行的原生条件由维护者在发布前明确，不从本核收自动放行。

本文只记录核收结论；两份原件不改，旧FAIL/UNKNOWN不覆盖，产品代码和CI5包保持冻结。
