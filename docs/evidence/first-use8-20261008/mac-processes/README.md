# Mac 自有进程、安装身份与收态

`*-process-history.jsonl` 保留各轮自有启动身份，`*-owned-stop.log` 为停止操作输出。停止前按创建时间、命令及 npm listener 核验，未仅凭 PID 杀进程。独立 S2/S4 的记录在 `../mac-isolation-ui/`，网络故障轮单列。

最终核验 `final-installed-identities.json`：Desktop/npm 安装件分别 66/66、missing/different/extra 全空。`final-before-stop.json` 留存最后两个 Host 及当时观察到的后代 PID；`final-after-stop.json` 确認这些 PID 全不存在、18320–18324 无 listener。范围限本任务记录的进程和端口，不声称整台机器零进程。

隔离 home、会话、绑定、用户自行配置的模型与 CLI store 保留供复测；私密 session/store、launch URL 和 Host 日志未归档。用户要求的临时 lo0 alias 保留，Chrome 下载询问选项已恢复。日常八个选定 JSON/YAML 的内容哈希仍与既有 before 一致，见 `../daily-selected-content-check-3.json`；一次 help 命令创建日常空 pnpm 日志的偏差在主 RESULTS 如实披露。
