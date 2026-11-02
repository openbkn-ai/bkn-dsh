# Windows CI4 阶段记录：环境变化，验收未完成

本人已完成登录，固定候选归档 126/126 文件摘要匹配，但尚未安装；W1–W6 均为 UNKNOWN。

- 启动前日常安装版 Desktop 为 0.2.0-rc.2，EXE SHA-256 df4e91fd91f6f1bee19a1990b0e167bfe06abf8353279d82bbb8e60edb6ba0d3。两个测试实例退出后，日常安装版为 0.2.1-rc.5，EXE SHA-256 7ae939b5a82b220fbd8ad04dfbafaaedb5a49ab43dc884a5db6381f678dd0cc4，启动参数为 --updated；实际触发动作未知。当前日常 Desktop PID 17728 / Host 11576，未由本测试结束。
- 登录回调曾另外启动未指定独立 userData 的 Desktop，使用日常 Electron 用户数据、测试 DSH profile。回调后默认 userData 至少 42 个非凭据文件的修改时间落在回调之后；没有完整逐文件 Before，无法逐项确定因果或安全恢复。
- 先前记录的 964 个日常 profile/会话文件中 2 个摘要变化：desktop profile 的 package.json 与一个会话文件。原日常插件的 package.json 和 client.js 摘要仍匹配 Before。此计数不覆盖新增文件。协议关联可见命令由测试程序路径变为日常安装路径。
- 未覆盖、回滚或删除日常文件，未恢复注册表。所有测试 Desktop / Host PID 已退出，日常程序仍运行；进一步桌面操作暂停。鼠标坐标/截图工具故障单列，不能判为插件故障。
- CI 41444758077 构建源码 a52032956314cf582c0f39ed3dab2f8e80e91085；TGZ SHA-256 cf9abdf4ac085506793501f5f4c7e2d3f6ff4bc8c873e07c4b6b401064ec6b8a。未发新问答、未生成依据、未开始分析。
