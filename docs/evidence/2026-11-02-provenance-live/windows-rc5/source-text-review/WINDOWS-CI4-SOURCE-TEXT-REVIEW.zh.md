# Windows CI4 原文弹层专项复核（2026-11-03）

结论：**REPRODUCED**。官方 rc.5／同一 CI4／同一真实第 2 轮中，输出原文的“悬停→在覆盖原触发坐标的弹层内点击→Escape，指针不动”连续两次出现弹层仍可见、父详情保留、焦点回到搜索框。原回执的 FAIL 保留。现象可重复；“始终未关闭”还是“关闭后重开”仍为 INCONCLUSIVE。

本轮按主会话转述的用户要求及调用指定执行 gpt-6.1-sol／max；未取得独立会话 metadata，因此实际档位不标成已核。只做本专项：新业务问答、依据生成、Agent 分析、平台业务写入均为 0。

## 环境与方法

官方签名 rc.5 EXE 与原回执哈希相同；CI41444758077／源码 a520329／artifact13141832289，TGZ cf9ab…、client fb12b223…、126 个安装文件均匹配。任务 PID7540（创建于 2026-11-03 00:31:44.914956 +08）、窗口329928、Host31592／端口53312。沿用隔离 home 和 Electron userData，没有安装或升级。

样本仍为 Interaction `int_b00aabd41e40ea38eb1f9589f6057557`，Conversation `conv_3d9d7a82c9984b25ae8d0c18a47adfe4`。边界文档本地未同步，已只读取得29a775c对应文件；未移动用户分支。六例计划在操作前已于本会话给出。

每例先确认旧层关闭、搜索框持焦，再执行指定序列。UIA读取前景PID／创建时间、焦点、触发器和弹层矩形及FromPoint；不设焦、不向应用注入日志。每次确认原文仍开后才发Escape。输入混合例因点击已关层，省略Escape。实际DOM activeElement、派发的click／keydown目标均UNKNOWN；UIA命中不当作DOM事件目标。

## 六例及一次确认

| 例 | 实际序列／Esc前焦点 | 结果 | 对旧现象分类 |
| --- | --- | --- | --- |
| 输入A | 搜索持焦，纯hover，指针(1000,609)在trigger | Esc后弹层及父详情都关闭，回原答案入口 | NOT_REPRODUCED；不同键盘归属 |
| 输入B | hover后真点击同一trigger | 点击已关闭层，焦点在trigger；未发Esc | INCONCLUSIVE；Esc前提不存在 |
| 输入C | 中性指针(925,450)，Tab×5、Enter；trigger持焦 | Esc关层、父详情保留，焦点仍在trigger | NOT_REPRODUCED |
| 输出A | 搜索持焦，纯hover(1450,632) | Esc后弹层及父详情都关闭，回原答案入口 | NOT_REPRODUCED；不同键盘归属 |
| 输出B | hover后点击(1450,632)处弹层，section持焦 | Esc后层仍可见至末次采样，父详情保留，焦点回搜索 | REPRODUCED |
| 输出C | 中性指针，Tab×6、Space；trigger持焦 | Esc关层、父详情保留，焦点仍在trigger | NOT_REPRODUCED |
| 输出B确认 | 同输出B，唯一一次确认 | 同样仍可见、父详情保留、焦点回搜索 | REPRODUCED |

输出trigger矩形为(1407,571,434,69)，展开section为(1187,562,696,528)，旧坐标位于二者重叠处。点击前最后一次UIA读数命中section，点击后section确实持焦。首次UIA FromPoint返回trigger，后续相同坐标返回section；读数差异的原因未知，两份原件均保留，不将其直接当作DOM事件目标。

## 时序证据的限度

Escape工具请求到返回耗时532–534ms，真正keydown时刻未知。目标0／0.5／1.5／3秒从工具返回计，不冒称按键后的即时帧。输出B四张图的请求—返回区间分别为[0,45]、[515,583]、[1516,1589]、[3015,3091]ms；确认例为[0,45]、[512,571]、[1513,1573]、[3005,3068]ms。因此首图已在Escape请求约0.532秒后。各例完整UTC动作时间及采样区间在JSON和私有timeline。

两次只读UIA轮询分别104／107条、约7.5秒，最大采样起点间隔174／137ms；一直返回1个同一runtimeId的popover、offscreen=false。焦点由section变成搜索框，分别落在Escape请求后约97／32ms开始的读数中。UIA不反映CSS open／opacity，离散截图和这些采样仍不能排除短暂关闭又重开；不能据此确定现场根因。四次截图均显示输出层可见，未见延迟消失。

私有关键原件摘要：

- `output-B-before-escape.json`：796a0b3791a3fdc73be6a745739448d733c69d6b19d8906f7671c00eb7ffded7
- `output-B-escape-3000.png`及确认例末帧：d7632c9679c15768bcb4601212b1fc8730cc6915476cb732a2b94ac6643e3729
- `output-B-poll.jsonl`：0227e439c5f0c4b10b46224644a0398449817160fc9bc39fda713bfcaa23e322
- `output-B-confirm-poll.jsonl`：5e9f0d5ca6aa09e21af9e1894b2e0a4e150ddebcb882bfe1b46fc2e86e5e1a71

当前无已打开的浏览器平台详情窗口；未登录平台做对照，平台同序列行为／版本为UNKNOWN。

## 最小建议（未实施）

[推断] 共享hover/open状态、Escape关闭和焦点恢复之间的交互，可能允许留驻指针继续打开层；观察到焦点回搜索与此调查方向相容，但没有open状态／事件帧证据，不当作已证根因。

先在现有 `provenance-native-dialogs.test.ts` 补真实布局／pointer序列：搜索持焦、输出层覆盖trigger、真点击section、留驻指针、Escape，并跨hover延迟和退出动画持续断言关闭及父层保留。现有hover测试在Escape前主动focus(trigger)，不能替代本序列。随后评估局部Escape后抑制同一次hover重开、到pointer离开或明确新激活才解除；不预设全局document监听。纯hover外部持焦时的Esc归属需单独确定产品预期。未改生产代码或测试源码。

## 收态

通过“应用→退出”结束任务；PID7540及子进程、两个只读观察器均已退出，端口53312释放；退出码UNKNOWN。日常PID17728／Host11576、端口58794仍在。协议仅在精确匹配任务After时恢复本轮新Before的日常rc.5路径，最终值相同。

新Before的1376项全部可读且After摘要相同；既有39个无路径／不可比较基线项、旧964项中2个变化、至少42个mtime历史观察继续保留，不称全过程零变化。原会话／绑定和原两份最终报告摘要不变。未commit、push、跑CI或发布。截图与完整UIA／动作原件保留本轮private目录，公开报告无完整业务payload或凭据。
