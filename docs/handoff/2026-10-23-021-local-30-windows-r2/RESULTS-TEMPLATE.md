# Windows -30 r2 定向复验结果

日期/时区、Windows/PowerShell5.1、任务Node24.19.0、Desktop内置运行时：
本轮交接完整commit（与主会话给出的固定SHA一致）：
分支：handoff/windows-local30-r2-20261023
候选 -30 tgz SHA / KIT-FILES SHA / 原helper SHA：
A/B官方exe/签名/ASAR身份及可复用旧证据：
新taskRoot、两个新DSH_HOME与独立CLI配置：
原Windows报告：743eb4a，保持原失败与补丁launcher条件，不改写历史。

本轮local-development-preacceptance；ciRun=null、formalAcceptanceEligible=false。不重跑完整矩阵、UI、B1或模型业务回合。每项用pass/fail/blocked/not-run/insufficient-evidence。

| 项目 | A旧Desktop | B新Desktop | 证据绝对路径/SHA/原始错误 |
|---|---|---|---|
| Windows5.1 argv回归：初始化/正常分支（公共脚本一次即可） | not-run | not-run | 可引用同一公共回归证据 |
| 新home、原r2 helper InitializeOnly启动及正常退出 | not-run | not-run | 此阶段仅runtime，不作profile通过 |
| 同一-30安装82文件及实际profile闭包 | not-run | not-run | 旧4.0.4/3.18.4，新4.0.5/3.18.5，同物理包 |
| 原r2 helper正常启动、PID/UTC/exe/监听/持久日志 | not-run | not-run | 不使用旧补丁副本、不再改taskKit |
| 一次正常成功登录、直接cmd/CLI退出与runner状态 | not-run | not-run | 两类退出分开判定 |
| 登录前/中/后进程时间线及浏览器启动器关联 | not-run | not-run | 短命进程覆盖/权限限制如实记录 |
| 同一Job成员/空状态 | not-run | not-run | PPID图不等于Job成员；不可得保持未知 |
| Host菜单正常退出后runner/端口收态 | not-run | not-run | 不关闭个人浏览器，不强杀未知Job |
| 选定个人/日常安装/任务配置前后摘要 | not-run | not-run | 平台只记录实际核验范围 |

可选C或D对照：仅A/B复现且确需同轮对照时做一次成功登录。说明触发理由、选定组合、原始证据和结果；未做则引用原743eb4a历史对照，不伪报本轮执行。

runner结论：观察事实 / 是否证实Job为空 / 原因推断 / 仍缺证据。未观察到残留不等于r2修复了runner，r2只改变launcher参数。

继续开放：慢读取消、浏览器信任、真正RDP、无控制台npm窗口、完整G6/Function/run_code/BOMCSV、CE非空、低权限、安全、旧销售及最终CI。未经新增指示不扩大本轮。

回传脱敏报告主要内容、报告路径及完整SHA、关键证据路径/完整SHA、原始错误和受阻项。原始日志/命令行/环境/凭据/设备URL和业务记录留本机私有目录；不自动推送结果。
