# Windows local-30 r2 targeted handoff

这是独立产物分支，不含完整开发源码。先读README.md、WINDOWS-TASK.md及r2目录FOLLOWUP.md。本轮范围仅A/B修正版原helper启动及runner取证；HANDOFF中的完整矩阵是背景，不自动重跑。

- 固定主会话给出的完整提交、-30包和r2 KIT-FILES摘要；不使用原743eb4a作为r2，不采用、合入或修改远端-11。
- 仅正式https://192.168.50.129 / OpenBKN0.2.0，保留数据配置，不部署安全补丁或EE，不发模型/Sandbox业务回合。
- 不推送、不跑CI、不开PR、不打标签、不发布。当前主会话交接推送授权不延伸到Windows结果推送。
- 不改kit、candidate、官方Host或校验器；遇错保留原件。runner只取证，不强杀整个Job或个人浏览器。
- 最小验证：公共argv回归一次；A/B各初始化及正常启动、一次成功登录和正常退出；C/D仅必要时追加一个单次对照。不重跑已通过的完整UI/B1。
- 新任务目录和CLI配置隔离；仅复用摘要/版本核对的官方解压应用及SDK，保留旧验收资源和失败。
- 中文回传，分清事实、推断、未知。原始日志、凭据、环境和设备URL留私有目录，公开摘要先脱敏。
