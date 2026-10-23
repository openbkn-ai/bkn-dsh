# Windows local-30 r3 handoff

仅本次独立产物分支，无完整开发源码。先读README.md、WINDOWS-TASK.md及r3 FOLLOWUP/RESULTS-TEMPLATE。

- 固定主会话提供的完整提交、KIT、官方回归/helper/-30摘要；不采用/合入/修改另一路-11。不改冻结kit、candidate、官方Host、SDK、校验器。
- 严格最小验证：P1只跑一次官方Windows5.1 argv回归，不启动应用。通过后，用户确认日常Chrome窗口/进程身份，才选一个Desktop做P2单次正常成功登录取证。缺前提BLOCKED；不复跑A/B初始化/启动矩阵、完整UI/B1、C/D或业务。
- 复用核对过的任务官方应用及独立profile/CLI配置；不重装、改依赖或复制个人token。为P2启动所选一个Desktop只用本次原helper，不用私有补丁副本。
- 只读元数据；不触碰其他会话Chrome、-11、.playwright-mcp，不读完整命令行/环境/标签页/登录秘密，不改默认浏览器/信任，不强杀Job或个人浏览器，不复制/持有Job句柄改变生命周期。
- 原日常窗口可复用已有根，不要求新根；inAnyJob/PPID不能证明同Job。区分事实/推断/未知；有限窗口未残留不等于修复，不能断言浏览器关闭原因。
- 唯一平台https://192.168.50.129，正式0.2.0不替换，数据配置/日常应用/旧资源/原始失败保留。不发模型/Sandbox/G6或业务回合。
- 不推送、不跑CI、不开PR/标签/发布、不部署。交接推送授权不延伸为Windows结果推送。
- 只收态本轮owned资源；菜单正常退出，保留日常Chrome。输出kit外，原日志/秘密仅本机；中文回传脱敏报告内容、路径/完整SHA、每项verdict和受阻项。
