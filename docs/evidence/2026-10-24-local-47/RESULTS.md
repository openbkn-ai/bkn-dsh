# 第47轮：Windows r3 与本机生命周期证据合并

2026-10-24（Asia/Taipei）收到用户粘贴的Windows r3回报。**P1官方argv子项按Windows回报PASS；P2在用户确认的日常Chrome已运行条件下完成A的一次成功登录，约4分钟内runner未残留，日常Chrome根保持存活。** 这不等于runner缺陷已修复，也不排除r2新建浏览器树受到管理范围收尾影响的可能。原-30、r3交接、正式0.2.0保持，不推送、不跑CI。

## 证据层级与固定身份

本机读到的是用户粘贴附件，SHA256 `2f3de0d9e565dcf632ff7fc6997d443fd8c8402613145897cc0564087674ce77`；原件逐字节保存在私有release/local-47。**未独立读取Windows RESULTS-redacted.md、manifest、时间线或恢复前后原件。** 下述Windows现场结果属于远程回报层；主会话当前独立核对的是冻结交接输入和本机既存证据。

固定交接分支 `handoff/windows-local30-r3-20261023`，提交 `fac4db78a1a974192fa13fdbe62063331cf04ec1`。Windows回报声明commit/固定输入通过，但本次粘贴未重新列出实际完整commit/KIT值，不能冒充从Windows原文件读回。期望值及本机校验如下：

- 唯一插件 `0.2.0-rc.2-openbkn.0.2.0-30`；231075字节、82文件；tgz SHA256 `6d95ff7517dbe409875fd398784fe01049ba26d2b97c43fad65c817d3ea18ee9`。
- 交付KIT SHA256 `7daaca61691706ef476ce007eb4c49e8a8f538a30dc73764fea6f6a4281308d0`；26输入在本机冻结r3工作树逐个匹配，工作树仍fac4db78且干净。
- 原helper SHA256 `0e3466f3da61bd2cac8f263c03573ad03206dea7cf20ac58d8f94e433b4943a7`；未重建插件、不采用远端-11。
- 第46轮7份历史证据文件全部与其原清单SHA匹配；没有重跑或改写其中6组受控结果。见[本机输入校验](input-verification.json)。

结构化脱敏回报见[windows-r3-reported-results.json](windows-r3-reported-results.json)。

## Windows r3 可接受的结论

| 项目 | 判定与范围（Windows回报层） |
|---|---|
| P1固定输入/verify-kit/SDK | PASS，26输入/82候选文件/SDK完整性 |
| P1官方argv回归 | PASS，一次调用，初始化参数/正常参数分别6/10，逐项匹配，退出码0、stderr空；P1不启动Host |
| P2前提 | 用户确认了可见日常Chrome窗口；对应根11368，父链报告为explorer，创建时间保持；不是仅凭任意Chrome根或PPID推断日常配置 |
| P2应用 | 只选A旧Desktop0.2.0-rc.2，主PID11564、后端58708、监听19387；本次原helper、实际profile82文件/同物理框架匹配；此启动只作P2准备，不计重跑A/B启动验收 |
| P2登录 | 一次正常面板授权成功；复用日常Chrome中的设备页，没有新浏览器根，任务CLI直接链结束 |
| runner | runner11544与CLI node在13:59:50.221Z同一采样中不再出现；后续约4分钟无残留，不是连续时间的退出先后证明 |
| 日常Chrome | 根11368在登录及Host正常退出后保持，创建时间不变；报告所述若干标签进程约27秒后结束，不能据此归因 |
| 收态 | 菜单退出后本轮进程结束，19387无监听，仅剩3个TIME_WAIT；TIME_WAIT不作为监听/服务残留 |
| 浏览器信任 | BLOCKED：用户在已有证书例外下完成授权，未修改CA/例外或由代理越过警告；成功登录和进程观测不等于浏览器证书信任通过 |
| 数据/配置 | 个人115文件及日常Desktop41文件相对r2收尾基线0差异；不是即时r3开始快照，更不是全机或平台业务数据未变证明 |

原r2官方argv FAIL保持原身份；本轮修正版P1通过不会改写旧失败。没有重跑B、C/D、完整UI/B1、G6或Sandbox业务。

## 三轮Windows观察与Mac受控证据

| 证据 | 浏览器条件 | runner/浏览器结果 | 不能推出 |
|---|---|---|---|
| r1 -30 | 主会话现有回报未建立Chrome新根/是否一直未关/Job归属 | A/B成功登录后runner残留至Host退出；取消/超时及C/D对照未残留 | 不能把“新开Chrome且一直未关”补记为r1已证事实 |
| r2 -30 | 登录新建Chrome树 | A/B在60–80秒窗口无runner残留；新树与runner同次约370ms采样消失 | 不能确定顺序、Job成员或强杀原因 |
| r3 -30 | 用户确认的既有日常Chrome根11368被复用 | 仅A，本轮约4分钟无runner残留，原根保持 | 不证明r1风险已消除；不同浏览器条件不能直接否定r2的条件性假设 |
| Mac第46轮 | 不启动浏览器；直接退出结果、Job状态及发送完成时序均注入 | 两版共6组：首结果cancel在server活跃时可触发终止；server已移除则忽略；读到terminal不发cancel，刻意非空Job仍等待 | 不是Windows Job、真实CLI/浏览器、完整Desktop carrier或现场因果证明 |

合并后的工作假设仍是：首结果提前return/dispose可能与服务端流结束产生时序差异；当对应操作signal仍能影响一个未清空的管理范围时，可能触发终止；若流已移除，迟到cancel被忽略，未清空范围则可能继续等待。这个假设与现有观察可以相容，但尚未证实现场Desktop实际carrier、所选containment路径、Job身份/成员或终止调用。浏览器归属差异本身也未证明就是三轮差异的原因。

因此不在原-30中直接“读完stream”或“成功后terminate整个Job”来凑修复。前者在受控对照里仍可留下等待中的非空Job，后者没有个人浏览器所有权依据。

## 对Windows回报的必要限定

1. r3能说明本次日常Chrome根幸存；不能以此认定r2新树结束的机制被排除。反过来，r2也不能证明“runner一退出就会关浏览器”。保持条件和证据范围。
2. 报告末尾把r1残留条件描述为“登录新开Chrome且一直不关”，主会话暂没有原始成员/时间线支撑，列为待核对而非新事实。
3. 浏览器信任BLOCKED与真实授权成功分列。主会话不凭粘贴记录判定Windows会话其他授权规则，也不新增“必须换受信设备”等未明确要求的流程。
4. r2私有工作副本被误加两行后恢复，报告给出恢复SHA `1430cf67598730c665b2cad13728fe24aef4b5af10de24fb272397cde757a14a`，称与E16原件一致，修改过副本另存；本机未独立验证恢复文件。既有证据原件据报未受影响。
5. 任务A独立CLI配置先登出再正常登录，凭据更新是本轮实际变更；profile未打补丁。公开汇总不复制token文件摘要或私有启动token。报告称启动token随Host退出失效，本机未验证其有效性或失效，不作额外认证结论。
6. 实际采样约370ms而非设定250ms，短命进程/同采样顺序/PID复用均有限；平台只做auth/列网，未做业务数据前后核验。

## Windows原件索引（路径与摘要均为回报值）

目录：`C:\bkn-verify\021-local30-r3-20261023-213500-fd3c39\`。

- `results\RESULTS-redacted.md`：SHA256 `9be15bc1492f9614dddd3d49d970c0eb7e81871027af365df86afc162829ae70`。
- `results\EVIDENCE-MANIFEST.json`：SHA256 `5fc546de5b9e519a217c66a044494eaac3a5f8b4e96520d3cea6ec473e0b9dd3`，报告79文件、其中5仅留本机。
- `evidence\P1-argv-stdout.txt`、`P2-A-timeline-summary.txt`、`P2-A-closeout.txt`、`P2-personal-compare.txt`、`P2-r2-private-file-restore.txt`：本次未提供逐文件完整SHA，不补造。

## 上游复核，不改变验收基线

DSH最新release已为 `dsh-v0.2.1-rc.3`，发布时间2026-10-23T15:26:39Z，实际release commit `1f81c047fc48fa190a683e469daa699857e9afe8`，不同于查询时master `22ddee37`。对release固定SHA逐个读取了Gateway client/index、stream-client、stream-server，以及subprocess spawn、windows-job、spawn-runner、win32 process共7文件，均与当前新版rc.2的固定源码逐字节相同。不能把新版本存在当作本问题已修复，也不据此声称完整rc.3兼容。

master compare返回1539总提交，但只有250提交/300文件，结果截断；未声称完成全部差异审查。只做上述针对release的7文件核对。没有安装、升级或实测rc.3；原两版rc.2 pins、插件-30保持。

Foundry正式仍v0.2.0，未发布main从2466c45f到b058d07f新增1个公共HTTP错误包抽取提交、9文件；未部署，不套用其变化到当前正式0.2.0。见[上游元数据](upstream-state.json)和[有边界增量检查](upstream-delta.json)。

## Issue工作流与当前收尾

已将协调会话补充的用户要求写入[逐项关单规则](../../plans/0.2.1/ISSUE-WORKFLOW.md)：各issue按自身完成标准记录源码/候选身份、验证和限制后关闭，不等无关项；仅有fixture或缺该项required实机证据不能关闭。#94等实现项不无条件继承#99全部最终门槛；本轮未对无关实现项做完整关单审查。

本次只读查询#92–#99均OPEN且assignee包含kalias，正文与前次读取一致；Project归属由协调会话核对，本机缺read:project没有重读成功。见[issue快照](issues-current.json)。

- 已关闭issue：无；没有发表评论、修改状态或重复指派。
- #95继续OPEN：有具体生命周期未知项；不以r3无残留宣称修复。
- #98继续保留其明确范围：已有MCP owner路径真实失败/修复、Mac长时和Windows既有B1证据；r3没有新增B1，不覆盖历史未确认条件。
- #99继续OPEN：本地预验argv子项已收回PASS报告；最终固定CI候选、完整合同及原生非空/其他required缺口未完成。
- #92待关联交付及其验收条件满足后收尾，其余项按自身规则另行核对。

本轮只接收/核对/汇总。没有更改生产源码、-30包、Host、平台、数据配置或其他会话；没有重跑已通过测试、提交、推送、CI、PR、tag、发布或部署。保留全部旧证据与用户修改，更新五个本地状态入口及issue规则。`ciRun=null`、`formalAcceptanceEligible=false`。
