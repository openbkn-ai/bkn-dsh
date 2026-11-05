# Mac CI6：企业50.28原文字段阶段对照与有界补查

结论：补查已到有界停止条件。已确认原Mac真实S/C/I历史上原文可读；当前同一记录的候选Reader与平台Studio实际GET响应逐字节一致，恰缺两项原文。另3个给定既有I当前也都缺两字段；本机没有找到第二个已绑定28的可用真实Session。因此S1–S3仍NOT_RUN，不记修复或UI通过，不造数据继续尝试。

## 固定身份与已完成项

继续同一CI6：源f01b316fbfb6be681af81e2267a7b3341e659efd/run41596006291/artifact13212518096，TGZ877732bytes/SHA4500fa4357cdcdcb9914a39794aedb9096c948192c2bf0f35ecf4fadb882f046，126文件；官方Mac rc.5。28企业正式0.2.0只配任务独立官方CLI0.2.0（cli.js SHA18445a26bfb20f7a8cc8eecb50f499ff12c0ed564e0e3d8741850fcbe43f82a5）。129 Community的CLI021/MCP/查询/CSV已过项不重跑，亦不承担EE页面验收。

原28旧CLI凭据有效，但profile在切换目标后需对新的generation正常重新授权。已通过正常GUI设备授权恢复，面板“登录并同步成功”、2个网络，然后从原答案打开真实原生场景。取消等待、一次超时后才完成的浏览器授权和后续成功重试全部保留。卡片4项认证boolean均true：ciphertextHashVerified/recipientMatched/gcmAuthenticated/localCardCreated；不返回明文、明文摘要或私钥。

## 同一记录历史/当前/Studio对照

S=session-3e319448-0974-4199-a3fb-aa0ee980611a，C=conv_9360664929df807edc5797d4190fa239，I=int_3e92559bb0fbe9e5f83c110ce7ca3100，原28/supply_ontology_hand绑定不改。

旧CI3 native detail212250bytes/SHAf76ddaaf0488f088a9c0b30d0e92fba60b48614d6c1d956fe82729ba6eb7d9a9，顶层interaction_question和interaction_result均string/非空，分别147/2852 UTF-8 bytes。当前与CI5原件均209165bytes/SHA196d221ea5e2da623b463370c9c1a7c95af2a213c8c0c71f0c1258a9928124fa；两字段hasOwn=false/type=undefined/nonempty=false。旧JSON仅删除这两个顶层字段后，与当前JSON深度相等，其他包装层无可替代权威原文。

6个Operation ID在旧API、当前API和Studio真实响应中，按原顺序逐项完全相同（完整列表见JSON），不是只比数量。Studio经自身导航搜索同C、打开同会话，亦显示输入/输出均“未记录”、6次调用。仅做一次只读刷新，通过受支持CDP Network观察核到实际GET `/api/agent-observability/v1/business-provenance/interactions/int_3e92559bb0fbe9e5f83c110ce7ca3100` 200，其原始bytes/SHA与候选Reader完全一致。没有用DOM派发事件，网络观察已关闭。

这证明现象在平台自身响应/UI也存在；不把历史改写为“从未记录”，不唯一归因于删除、权限、版本或artifact链路。当前detail的完整性标记仍complete，不等价于原文字段齐全。

## 有界候选与本机元数据

同C当前rounds只有原I，total=1/page1/page_size50/next_cursor=null，并披露truncated/partial、projection_scan_cap_reached。无可续页token，不猜页/ID。

只对主会话给出的3个已知I各GET一次，均200且interaction_question/interaction_result均hasOwn=false：

| 已有C/I | 当前原文 | 可作远程Mac真实入口 |
| --- | --- | --- |
| conv_50556c8cad5f336c1e4dff35e9c02cd5 / int_4495321d70a59b2709d6f470a85f9133 | 两字段均缺 | 无本机Session证明，未构造 |
| conv_1c027aaa36b601844ad14dbe3f0cc7f5 / int_e44fec6083bba2588f962c49343cddeb | 两字段均缺 | 无本机Session证明，未构造 |
| 同C / int_958d25790acbb7b76b481f68c7cc655e | 两字段均缺 | 无本机Session证明，未构造 |

本机只检查4份现有原生Session和1份项目绑定收据，保持源摘要。首个整buffer解压仅返回header，未拿它断言无记录；随后使用官方rc.5的scanZstdFrames逐完整帧解码，得到5/60/4/70行。除原Session外，另一业务Session445的现有绑定为129，未改绑、未拿它做EE请求；其余两个没有OpenBKN收据。该范围不等于全平台/全工程不存在其他样本，未输出其它会话正文。

## Core元数据与剩余前提

同当前CLI一次取出的凭据用于4个native GET及1个Core GET；请求者sub无法从其opaque token解析，记UNKNOWN，不用记录的effective_subject_id冒充当前caller。Studio与CLI的正文bytes/SHA相等；Studio请求者未独立取身份hash。

Core同C/I返回200、execution_status=completed、evidence_status=complete；没有披露question/result preview，也未披露question ref，但`closure_manifest.answer_artifact_ref`明确hasOwn=true/string/非空/52bytes。未返回ref值，未访问artifact正文。先前派生字段形状摘要错误将泛化ref标志置false，已另存更正件，原件保留。非空答案ref不代表EE当前能授权读出原文。

S1正文hover/Escape留驻1s3s、S2真实padding/arrow几何、S3键盘激活/Escape/首次真实hover均NOT_RUN：当前没有SourceText入口。另一次Swift只读预检postEventAccess=false，未请求权限；三个常规鼠标键均未按下、主屏1920×1080，应用到屏幕映射未建立，没有发送任何移动、拖动或合成事件。需可用真实原文样本与已授权输入路径/人工指针配合，之后只补这三项。

## 收态和保全

GUI已在阶段报告中正常菜单退出、真实exit0，根23546与端口62343释放，owned浏览器0；后续未重开Host，仅短只读Reader进程exit0及Studio只读对照，任务页已关、日常Chrome未退出。原绑定/源Session/任务Session/Host EXE+ASAR/已装business+client七项摘要保持；临时cliPath恢复原YAML。系统关联仅dsh写点变化、其他handler不变，核current==After后恢复Before逐字节。新增授权保留；不声称服务器/全机状态逐字节不变。

第一次授权检查曾因脱敏不完整在工具输出出现短期challenge/device-code，保留偏差；成功重试使用新challenge，公共产物无这些值、密码、token、卡片、私钥或业务正文。旧CI6、129补充及本轮阶段报告均不覆盖。候选、Host、平台与模型输出不改；不新增问题/解释/分析，不推送、CI、发布或latest。
