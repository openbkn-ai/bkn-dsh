# -12 空态修复与本地复核

日期：2026-10-19，Asia/Taipei。继续使用本机正式 `https://192.168.50.129`、正式CLI0.2.0。此前数据保留、live MCP、守卫和真实模型异常见[-11证据](../2026-10-19-ci-41507f9-acceptance/RESULTS.md)；不将旧失败改写为成功。

## 固定产物

- 候选 commit `933b0ab251c75461ece1ada6145a9487e7eb04d1`，版本 `0.2.0-rc.2-openbkn.0.2.0-12`。
- 用户明确授权的 [build-only run 39268135924](https://github.com/openbkn-ai/bkn-dsh/actions/runs/39268135924) 成功，`publish=false`；Pin npm / 检查现有npm版本 / Publish to npm / GitHub Release 全部 skipped。
- tgz SHA256 **`513b2019895014871e9025bf8790b42e43c75867f5df8a71bb6f279a3b4f4336`**，79个文件。清单见[candidate.json](candidate.json)。
- CI的两版官方npm运行时受控正式/关闭采集/旧合同/原生输出/Remote五组检查全部通过；这是Linux受控层，不能代替Mac/Windows/Desktop或真实模型。

## 修复及实际界面复验

原 -11 在原生读取404后，空 evidence node 区错误使用“解释已存在，但没有披露结论”。先用实际状态补充zh/en回归并复现失败，再改为空节点中立文案；有效的ready空解释仍使用独立的结论提示。

源码验证：两版依赖基线各585 pass / 1 Windows专属skip、类型检查通过，45项相关渲染/原生测试通过；仓库66项和79文件包审计通过。

同一CI tgz装入两版隔离Mac CLI web，重新启动后旧会话/工作区绑定保留。两套安装的79个文件均与CI解包完全一致；旧版实际closure278个DSH包全为0.2.0-rc.2、单一Cordis4.0.4；新版295个全为0.2.1-rc.2、单一Cordis4.0.5，strict peer安装通过。

两版的中文和英文真实404证据链空态均已看到“没有可展示的平台节点 / No platform nodes to display.”，不再断言解释存在；404原始原因仍显示。两版语言均已恢复中文。截图和AX保留在本机 `release/ci-933b0ab/mac-cli/<version>/`。该项通过只代表404空态修复，不代表有非空原生证据。

[包差异](artifact-comparison.json)仅为client.js、locale声明、两份包README和package.json；所有host业务/守卫/生命周期/Remote运行文件与-11逐字节相同。-11已完成的实平台守卫结果按该明确不变范围保留；本轮没有为相同host代码再次扩展重复测试，-12的受控双宿主检查另由其CI执行。

## 本地复杂题复核

只调整隔离DSH测试profile（不改平台模型记录）：contextWindow=1000000、maxTokens=32768。DeepSeek[官方模型文档](https://api-docs.deepseek.com/quick_start/pricing/)披露实际响应模型deepseek-flash的1M上下文；本机网关接受max_tokens=32768的探针，HTTP200、返回OK、实际输出1token。这不证明已实测1M输入容量。

两版用独立会话重新执行BOM构成，均形成已完成回答，并实际使用已发布「BOM清单」/execute_tool；没有再次出现原65K预算下的截断。仍逐项保留原回答及附加问题：旧版将主料313行标成“含根节点”，而平台主料口径为313条父子行；不能把完成状态写成全部业务数字/口径正确。

BOM用量/库存的第一次本地复核在模型请求阶段遭401，没有调用业务工具。正式CLI真实读取自动刷新成功、expired=false；只更新两个隔离模型凭证引用，DSH凭证服务watcher生效，无需用户重新登录。失败会话保留，不将它算成已验证MCP坏Token路径。刷新后两版均完成真实用量/库存复核，仍未通过：旧版在present被管理守卫拒绝后声称已导出506行CSV；实际点击该链接，宿主显示“文件不存在，可能已被移动或删除”。新版同一回答先称333个主料、后称272个，且承认完整明细仍位于平台Sandbox，未交付到界面。没有再次遇到输出截断，不能把此前全部失败归因预算。四个新的模型交互均实际finish、标准平台读取HTTP200，原生读取仍全部404；采集最后desired/effective=enabled。

[复核概要](budget-recheck-summary.json)保留每次结束原因、工具拒绝、上下文配置与实际最大请求规模：本轮最大观察到111,664个输入token，未测试完整1M容量。模型文本和原始工具结果在权限受限的release证据中，未复制lease/token字段到仓库。

## 流程与剩余门槛

用户最新指示已写入[正式验收合同](../../plans/0.2.1/ACCEPTANCE-CONTRACT.md)：本次已授权build-only完成后，后续先在本机完成全部开发、构建和验证，收敛问题后再统一同步分支并执行最终远端build-only。此后尚未触发其他远端CI，新的合同/评测文档先保留本机。

当前CE原生业务detail/explanations仍404，非空原生事件/证据、实际选择联动及其人工验收不能关闭。Mac Desktop、原生Windows两版Desktop/npm、B1条件性最小复现、剩余真实模型负例、浏览器CA信任/第二LAN设备/恢复演练及旧宿主SDK安全决策保持开放。模型答案错误属于独立评测和发布分诊，不通过插件重算、答案重写、自动纠错或放松守卫消除。

测试条件补充：两个测试工作区最初位于开发仓库的ignored release目录内，宿主Git面板会显示父仓库文档修改；这些是本会话的文档写入，不是测试模型文件改动。完成上述记录后，为两个task-owned工作区初始化独立空Git根，避免后续本地测试继承父仓库Git视图。原测试记录未删除或改写。
