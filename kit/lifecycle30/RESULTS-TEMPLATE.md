# Windows -30 r3 定向结果

固定输入：完整commit、KIT/回归脚本/helper/-30 tgz SHA256；机器、系统PowerShell5.1、任务Node24.19.0。local-development-preacceptance，ciRun=null，formalAcceptanceEligible=false。

| 项目 | PASS / FAIL / BLOCKED / NOT_RUN | 证据绝对路径 / 完整SHA256 / 原始错误 |
|---|---|---|
| 固定提交与26输入/82候选文件/SDK完整性 | NOT_RUN | |
| P1 官方argv回归：初始化参数/正常参数两分支（单次，不启动Host） | NOT_RUN | |
| P2前提：P1通过 + 用户确认日常Chrome窗口及进程身份 | NOT_RUN | |
| P2一个Desktop/独立配置身份（A优先或B及理由） | NOT_RUN | |
| P2单次成功登录及直接cmd/CLI退出 | NOT_RUN | |
| runner约60–80秒时间线（含方法/覆盖限制） | NOT_RUN | |
| 日常Chrome原窗口/根与登录新树的存活/关闭 | NOT_RUN | |
| 关闭顺序/Job身份与成员证据（不可得写未知） | NOT_RUN | |
| 正常Host退出/任务监听收态/日常Chrome仍在 | NOT_RUN | |
| 所选个人配置/日常安装及任务输入前后摘要 | NOT_RUN | |

A/B原helper启动沿用r2Windows报告，不重跑；UI/B1、C/D、G6和Sandbox等NOT_RUN，原r2官方回归FAIL保留。P1失败停止依赖P2；日常Chrome身份无法确认则P2 BLOCKED。

分别写已验证事实、推断与未知，保留r1 runner残留和r2有限观察未残留。不要把同采样消失写成明确先后/Job强杀；不以PPID或inAnyJob代替Job成员证明。列明实际平台访问范围，未测业务数据前后摘要时不得写平台全量未变。

收尾列出owned进程/端口、旧资源保留、实际配置变更和恢复范围、日常Chrome状态。回传脱敏报告主要内容、绝对路径/完整SHA256、关键证据路径/完整SHA256及受阻项。原始秘密/日志仅留Windows；不推送、不跑CI、不发布、不换正式0.2.0。
