# Windows -30 r3 定向结果

本目录当前未交接；执行时填写新固定commit、KIT SHA、回归脚本SHA、helper SHA、-30 tgz SHA、PowerShell5.1/任务Node版本。

| 项目 | verdict | 证据绝对路径/完整SHA/原始错误 |
|---|---|---|
| 新固定输入与未改动helper/-30/SDK身份 | not-run | |
| 官方PowerShell5.1 argv回归：初始化参数/正常参数两分支 | not-run | 一次脚本调用，不启动Host |

A/B原helper初始化/正常启动、实际profile沿用96f8f76的Windows报告，不改写原r2回归fail及诊断副本pass，不重跑UI/B1。

仅在P2另行具备前提时填写：用户确认的日常Chrome窗口/进程身份、一个Desktop单次成功登录、旧根/新树/CLI/runner时间线、Job成员或证据不足、先后顺序是否可分辨、正常退出与收态。若未做写blocked/not-run并说明原因，不把54508当已确认默认Chrome。

区分事实、推断、未知；没有Job身份或精确因果证据不能写成runner修复/Job强杀已证实。报告和私有证据留本机，不推送、不跑CI、不改平台。回传脱敏报告主要内容、报告路径/完整SHA和受阻项。
