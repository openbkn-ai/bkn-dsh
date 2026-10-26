# 第42轮：Windows -30 回传审阅与启动器本地修正

Windows回传支持四组合profile闭包和有边界B1通过，但不能据此宣布完整Windows/正式合同通过。A/B后续功能使用了补丁launcher，原版helper启动仍失败；在途读取取消、浏览器信任、真实RDP断连等仍未验收。

本轮按已授权的本地继续范围保存回传、修正可复现的交接脚本、分诊runner。没有修改插件生产源码或包，没有平台动作、Host启动、提交、推送、CI或发布。另一路远端-11及相关其他工作树不采用、不合入、不修改。

## Windows报告的证据边界

来源是用户本会话粘贴的远程执行报告。主会话未读取Windows原始报告、739份清单文件或232份私有原件；其签名、进程、平台读回和前后摘要是远程执行报告，不能写成本机独立复核。[结构化接收记录](windows-reported-results.json)保存了固定输入、环境、通过条件、失败和原始Windows路径/摘要。主报告完整SHA已提供；其他截断摘要不补造。

| 验收边界 | Windows回传 | 主会话收敛判断 |
|---|---|---|
| 同一-30、实际profile共享Cordis/Schemastery | A/B/C/D pass，82/82 | 记录远程运行通过；原-27分裂缺口在该报告条件下关闭 |
| 英文间距、zh/en、目录、窄窗口、焦点/JSON | 四组合pass | A/B注明补丁launcher运行条件 |
| B1基线→同Host重载/真实重新登录→新Session查询 | 四组合pass，前后40；8条Interaction各唯一query_object_instance/completed | 有边界只读协议，不是真实模型、完整销售明细或四小时合同 |
| 原版Desktop helper启动 | A/B fail | 本地修好两处括号；Windows5.1和A/B原版启动待复验 |
| Desktop成功登录后runner | A/B存活至Host退出，cmd/CLI已退出 | finding，Job状态未知，未宣称插件泄漏或已修复 |
| 持久日志 | A/B同进程跨约6小时执行会话间隔、零EPIPE | 该条件pass；真实RDP断开/重连not-run |
| 404空态和关闭重开 | 四组合pass | 不代表非空CE解释或在途取消 |
| 在途读取取消 | 四组合insufficient-evidence | 缓存重开不能证明取消，保留开放 |
| TLS | NodeCA/CLI pass，浏览器blocked | 已存Chrome例外来源未知，不导入CA、不越警告、不推定来源 |
| 平台保留 | 三个只读视图一致 | 不泛化到其他数据/配置；110个人文件、41日常Desktop文件相同为报告结论 |
| G6/Function/run_code/BOM/CSV、低权限、CE非空、安全与最终CI | blocked/open | 不换题、删工具或改答案凑通过 |

成功登录清理必须拆开：取消/超时的runner→cmd→CLI全退出通过；A/B成功时仅直接CLI退出，runner范围清理仍有观察，不能把“登录成功/CLI退出pass”写成所有进程当时已退出。Desktop正常退出后本轮没有残留是另一项收态结果。

## 已独立复现并修正的helper缺陷

原743eb4a helper在两个数组中写未分组的字符串拼接，PowerShell表达式优先级把参数元素组合错。用任务目录内官方PowerShell7.6.8（官方hashes清单SHA匹配）执行真实表达式：原脚本失败，回归报Argument element count differs；只加括号后的初始化6项/正常10项参数均逐项匹配，真实Node子进程收到的空格路径argv也匹配。四个PS脚本解析通过。

修正见[两行diff](desktop-launcher-fix.diff)和[回归结果](launcher-fixed-test.json)。这是Mac PowerShell7.6.8语义及真实argv验证，不能替代Windows5.1或官方A/B应用启动；本轮没有借Mac启动冒充Windows结果。

新材料在[本地r2目录](../../handoff/2026-10-23-021-local-30-windows-r2/FOLLOWUP.md)。候选仍为原-30，SHA256 `6d95ff7517dbe409875fd398784fe01049ba26d2b97c43fad65c817d3ea18ee9`，231075字节/82文件，SDK与其他执行脚本未变。r2包含25项输入，当前KIT-FILES SHA为 `35abfbbc00e33b886bd7b7f9e97456058b9f2c2e773f2c908b9a7fc2ba20cbbc`。r2尚未提交或推送，没有新的Git-only取件身份；原743eb4a冻结分支和原本机第40轮材料保持原字节。不能因只改工具就把A/B原版启动补记通过。

## runner分诊

固定DSH两版源码将直接目标退出与管理范围清空分开：插件等待child.done取得直接CLI退出结果；Windows runner在target-exit之后还会轮询isJobEmpty，仅在整个Job清空后结束。固定官方SDK0.2.0的openBrowser会在Windows通过shell启动start，使用detached和unref。

因此“浏览器/启动器后代仍在Job”是有源码依据的候选解释，但WindowsJob成员、Runner内部状态和实际ASAR代码尚未直接核验；不能以此排除真实缺陷，也不能认定是某一浏览器进程。不要在成功后直接强杀整个Job，以免影响仍在使用的浏览器。当前不改插件/SDK/官方Host。下一次Windows定向复验需要正常成功登录前/中/后的进程时间线及可用的只读Job成员证据，PPID图不能替代Job成员证明，原始命令行、环境和设备URL不回传。细则见r2 FOLLOWUP。

## 上游与下一步

DSH默认分支仍687f282e，最新仍0.2.1-rc.2。Foundry正式仍v0.2.0；未发布main从1635c246到3762d1a新增29提交，已检查Cypher默认截断/!=/explain、query_metric参数及证据字段、BKN3声明、GraphExplorer/Vega/CI增量。这些不是当前正式平台，未部署、未扩展工具；新query_metric从analysis_dimensions到group_by等变化是未来支持前必须更新fixture/契约的门槛，不在0.2.0基线上静默套用。见[上游核对](upstream-review.json)。

后续优先：Windows5.1 argv回归和A/B修正版原helper两种启动；runner成员/生命周期取证；受控慢读取消；浏览器信任的单独决策和真正RDP配合。npm无控制台可见窗口及全局CLI预填、hostForm、Escape、眉标对比度仍是开放观察，本次未宣称修好。完整G6、安全、低权限、CE非空、旧销售失败及固定CI候选继续开放。所有远端操作仍需后续明确授权，本轮不推送不跑CI。
