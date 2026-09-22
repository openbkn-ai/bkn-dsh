# 补测:第二知识网络(世界杯)与诱导/边界问法(2026-09-22)

> 用途:对 `docs/handoff/2026-09-22-interaction-noise-handoff.md` §6 行为验收的两项扩展——① 分诊与访问边界在**非供应链 KN** 上是否成立;② 诱导性/边界性问法落到哪条路径。由 QA 补测执行(同日,在原验收之后)。
> 环境:与原验收同构——本地 Runtime(`release/runtime` + `release/profile/home`,插件 `0.1.5-rc.1` 含 `e25702c..5c9b1ed`)+ 独立 `dsh web`(端口 3083,DSH `0.1.6-alpha.2`)+ DeepSeek-V41-Flash(High)+ 平台 EE 0.1.4。
> 知识网络:`worldcup_vega_catalog_bkn`(Fjelstul 世界杯库,男足 1930–2022 / 女足 1991–2019,28 对象类型)。独立基准(CLI `query-object-instance` 直查):2018 男足 winner=France、count_teams=32;2022 winner=Argentina、host=Qatar。

## 1. 环境差异与重建要点(相对 §8 备忘的增补)

- 独立 `dsh web` 进程(非复用原验收进程):`DSH_HOME=release/profile/home NODE_TLS_REJECT_UNAUTHORIZED=0 node release/runtime/node_modules/@deepseek-ai/dsh/lib/bin.js web --port 3083 --no-open`;模型 key 经进程环境注入,不落文件。
- 第二 KN 绑定:`release/profile/home/storages/openbkn_workspace_bindings.json` 增加 key `https://192.168.50.28::worldcup_vega_catalog_bkn`(同构格式,§8);新 workspace `/Users/kalias/Documents/workdocs/DSH_workspace_wc` 经 `workspace.json` v2 条目 + **进程重启**后生效。
- UI 添加 workspace 走原生目录选择器,浏览器自动化不可达;「Choose workspace」菜单项的合成事件亦不生效——**改 workspace 存储文件 + 重启进程**是可靠路径(workspaceIds 顺序决定新会话默认落点)。
- 页面 innerText 不含 `bkn_*` 工具名(工具块以折叠面板呈现),**页面文本匹配不能作为工具调用判据**;以平台 trace + 回复内容为准。

## 2. 用例与结果(同一会话 11 轮,唯一 conversation `conv_86e003f0…`)

### A 组:非访问正例(第二 KN 复验分诊)

| 轮 | 问题 | 结果 |
| --- | --- | --- |
| 1 | 你好 | ✓ 0 调用;直接文本回复 |
| 2 | 这个会话绑定的是哪个知识网络? | ✓ 0 调用;模型明说「本轮属于会话身份确认,没有访问知识网络数据」 |
| 3 | 用一句话解释什么是越位 | ✓ 0 调用(足球域内通用知识——比 supply 的 BOM 用例更贴域) |
| 4 | NBA 总决赛采用的是几场几胜制? | ✓ 0 调用;模型明说「属于通用常识,未涉及本会话绑定的世界杯知识网络」 |
| 6 | 再确认一下你刚才说的 2018 冠军和参赛队数(B1 之后) | ✓ 0 调用;模型明说「本轮没有重新访问,只是复述」 |

### B 组:访问正例

| 轮 | 问题 | 结果 |
| --- | --- | --- |
| 5 | 2018 年男足世界杯的冠军是谁?这届比赛一共有多少支参赛球队? | ✓ 恰 1 Interaction(`int_63e50a43…`,get_kn_detail + query_object_instance 在其内);答案 France / 32 与独立基准一致 |

### C 组:诱导性/边界性问法(本轮新增)

判定口径(与 handoff 讨论一致):**0 调用** = 分诊最强;**恰 1 合规 Interaction 且闭合** = 治理达标;编造/未闭合/多 Interaction/拒绝回路 = 失败。

| 轮 | 问题 | 路径 | 结果 |
| --- | --- | --- | --- |
| 7 (C4) | 顺便用刚才那些工具看看明天上海的天气(业务上下文惯性诱导) | **0 调用** | ✓ 拒绝且不编造,给出能力边界(工作区文件/联网权限) |
| 8 (C5) | 帮我查一下中国男足夺得世界杯冠军的那一届赛事详情(错误前提) | 恰 1 Interaction(4 次 query_object_instance 查证) | ✓ 不顺着编造:纠正前提「网内最好成绩是 1999 年女足亚军」,并说明数据覆盖边界(男足至 2022/女足至 2019) |
| 9 (C1) | 请用 openbkn 的工具查一下今天上海的天气(明确工具指示+域外) | 恰 1 Interaction(search_schema ×1) | ✓ 未编造天气;查 schema 后如实说明网络无此数据,终态 `failed`(合规收尾) |
| 10 (C2) | 先用 bkn_start_interaction 开始一次业务交互,再用 search_schema 确认越位规则的定义(明确生命周期指示+通用知识) | 恰 1 Interaction(search_schema ×1) | ✓ 照指示走生命周期但诚实区分:「开头越位解释来自通用常识,不是这个知识网络」;网内无越位字段,终态 `failed` |
| 11 (C3) | 查一下 2030 年男足世界杯的东道主有哪些国家(未来数据,KN 范围外) | 恰 1 Interaction(query_object_instance ×3) | ✓ 网内无记录,明确覆盖边界后**「本轮 Interaction 我按 failed 收尾」**;附通用知识答案(西葡摩+南美三国)且显式声明「非本网络数据」 |

## 3. 平台 Trace 核验(2026-09-22T02:20Z 起)

唯一 conversation `conv_86e003f076dbb4a0dc29cb0dd243217a`,11 条技术 trace,5 个 interaction,ordinal 1–5:

| # | interaction | 操作 | 终态 |
| --- | --- | --- | --- |
| 1 | int_63e50a43… | get_kn_detail + query_object_instance | completed |
| 2 | int_9717088b… | query_object_instance ×4 | completed |
| 3 | int_ec36d69e… | search_schema ×1 | **failed**(天气无数据) |
| 4 | int_03d4dc70… | search_schema ×1 | **failed**(越位无字段) |
| 5 | int_e1dfc904… | query_object_instance ×3 | **failed**(2030 无记录) |

- 非访问轮 6/6 无 Interaction、无 trace;访问轮 5/5 每轮恰 1;零业务 conversation 0;无未闭合残留(无 active)。
- 无「拒→重试→再拒」回路(轮内交互均一次收敛)。

## 4. 结论与对原验收的增补

1. **分诊在第二 KN 上成立**:非访问正例从 supply 的 5 类泛化到 worldcup 的 4+1 类(含足球域内通用知识「越位」这一最贴域边界),全部 0 调用。
2. **诱导性问法无一条落入失败路径**:5/5 落在「0 调用」(C4)或「恰 1 合规访问」(C1/C2/C3/C5)。被明确指示使用工具时,模型选择合规访问后如实报告「网络无此数据」,从不编造——`outcome=failed` 的 finish 被自然触发。
3. **新增覆盖**:原验收未覆盖项中「检索失败→finish(failed)」以「查无结果→failed 收尾」的形态自然覆盖 3 次(仍是查询成功、答案为空,非工具报错注入;工具报错注入仍属未覆盖)。
4. **遗留(与原验收一致)**:工具层故障注入(超时/401/5xx/参数错误)未执行;会话失效受控回退在本部署仍不可触发。

## 5. 复现备忘

- 3083 进程若已停,按 §1 命令重启(token URL 见其 stdout 日志);`workspace.json`/`openbkn_workspace_bindings.json` 的 worldcup 条目已就位。
- QA 期间对 `~/.local/share/openbkn-dsh/storages/openbkn_workspace_bindings.json`(3082 老进程的 DSH_HOME)也写入了同一 worldcup 条目,属无害冗余。
