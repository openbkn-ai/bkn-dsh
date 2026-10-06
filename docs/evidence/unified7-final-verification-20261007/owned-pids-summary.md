# Owned进程与清理汇总

仅从当轮start/stop记录汇总，再核对当前身份；不停止其他进程。完整树见 [owned-pids-summary.json](owned-pids-summary.json)。

| Host启动记录 | root PID | 创建时间 | 停止原记录 | 当前原身份存在 |
|---|---|---|---|---|
| desktop-process.json | 70773 | Wed Oct  7 04:30:09 2026 | desktop-first-stop.json | 否 |
| npm-process.json | 76640 | Wed Oct  7 04:37:30 2026 | npm-process.json | 否 |
| platform-unreachable-process.json | 92336 | Wed Oct  7 05:00:01 2026 | platform-unreachable-first-stop.json | 否 |
| platform-unreachable-restart-process.json | 95378 | Wed Oct  7 05:03:46 2026 | platform-unreachable-restart-stop.json | 否 |
| desktop-restored-process.json | 96714 | Wed Oct  7 05:05:18 2026 | final-cleanup.json | 否 |
| npm-authenticated-process.json | 83842 | Wed Oct  7 04:45:57 2026 | final-cleanup.json | 否 |

18798/64391均无监听。六个Host root及所记录的子进程树均不再以原身份运行。

CLI登录PID72313/74736/76719另表核对；managed登录72313未采集创建时间，已观测自然退出，不能把当前不存在补造为当时的创建时间证明。执行探针是同步命令，退出码见各probe记录。用户日常进程未停止。
