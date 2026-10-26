# 非 GUI 准备步骤与停止条件

当前只准备材料；Windows 会话得到固定新交接身份和执行范围后，按以下步骤操作。当前 kit 不含完整 Windows runtime，不能把输入 PASS 填成 runtime 已就绪。

1. 创建全新任务根，不复用 d20a266 的任务目录、profile、报告或日常安装。使用任务 Node24.19.0，不改全局 Node/PATH。将 kit 放只读输入目录，输出放独立结果目录。
2. 两版分别固定旧 `0.2.0-rc.2 / 639ed015397290b3745d163aafe02ffee4aa3f84`、新 `0.2.1-rc.3 / 1f81c047fc48fa190a683e469daa699857e9afe8`。使用已有核验过的官方 Windows runtime 或从固定官方制品提取到新目录；记录来源摘要、实际版本、Node/Electron与ABI。官方元数据在 OFFICIAL-WINDOWS-INPUTS.json，仅作取件参考。新 rc.2 不是 rc.3，Mac arm64 包不能替代 Windows runtime。缺相应运行时只阻塞该行，不阻塞已有运行时的其它行。
3. 从不含个人设置、账号和模型 Key 的干净运行根准备独立 stock/protected 副本。设置 `DSH_HOME` 和 `BKN_CONFIG_DIR` 到本轮新空目录。所有将改写的文件先确认不是链接/共享 hardlink；用临时文件 + rename 写入副本，不能原地覆盖共享 store 或现有 Host。
4. 每份新 profile 安装同一冻结 -32；使用固定官方 dsh 管理入口和既有安装方法。先核验82文件，再复用 profile-closure.mjs 的 `inspectProfileClosure({runtime,host,profile})` 检查实际 owner。该核验针对新副本前提，不重跑已通过的全量闭包测试套件。不要通过 peer 范围重新选择 Host、Cordis/Schemastery 或 SDK。
5. stock 保留原 MCP entry `758d8fc473b700b5d351158d06ce9f9e92c16e8b25497b08bb7bd2122a87f5dd`；protected 仅在副本实际 owner 选中的 MCP 物理包使用对应12文件 payload，entry 为 `b3cd7156c0b8639656ce117530fec4d006b74cafdc9a78ac426fec084e62972c`。版本仍为相应原 Host。记录其它运行文件未变。payload 包含许可/归属；不把只改磁盘版本当作加载证据。
6. 使用新任务 profile 的公开 `--patch`/cordis patch 插入 verification-only 插件 `windows-native-mcp-probe.mjs`，不改 Host boot、Job 或认证实现。JSON patch 的形式是 `[{"insert":[{"id":"windows-backport-minimal-proof","name":"探针副本的绝对路径"}]}]`；探针副本位于本轮 taskRoot。先写标记：

   ```json
   {"purpose":"host-backport-synthetic-only","independentCopy":true,"browserOrPlatformLoginAllowed":false}
   ```

   文件名为任务根下 `OPENBKN-VERIFY-OWNERSHIP.json`。提供 BKN_VERIFY_TASK_ROOT、BKN_VERIFY_RUNTIME、BKN_VERIFY_PROFILE、BKN_VERIFY_OUTPUT、BKN_VERIFY_HOST（精确版本）、BKN_VERIFY_MODE（stock-control/protected）。runtime/profile/安装的插件/MCP及输出父目录的 realpath 必须在新任务根内；输出文件先不创建。
7. npm 使用固定原生 CLI 的 web profile、`--host 127.0.0.1 --port 0 --no-open --patch`；Electron 使用相应官方 Desktop backend entry 的 Node mode + ready/shutdown IPC，沿用已核对的后端参数。只跑后端，不启动 GUI。两种形态的 profile 初始化和官方入口若与原说明不符，先记录 BLOCKED/差异，不临时改 Host 或把 web 改名当 Desktop。
8. 待探针报告后用 N2 标准判断。无报告、同源失败、stock 未到第二源、protected 实际 owner 仍为原包、清理失败均不得 PASS。外层启动超时应有界，保留日志后仅停止已核验身份的本轮进程；不重复运行到偶然通过。

探针只发合成 loopback HTTP 请求，不访问正式平台或浏览器，不需要 CA 或登录。原探针字节沿用 r1；Windows 实际加载尚未验证，不能把语法检查当运行通过。完整 runtime 构造、原生加载和收态发生在 Windows；本机不补造 Windows 回执。
