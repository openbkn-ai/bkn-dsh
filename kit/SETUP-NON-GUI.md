# 非GUI执行入口

这份说明落实README的五步，不添加GUI/登录或旧报告整理任务。工具只在新任务副本使用，原Host/原home/原kit保持。

## 运行根与profile

- 每个可用组合使用固定官方Windows runtime的新副本，stock/protected分开。缺对应runtime仅阻塞该行；无需先完成全套盘点。Task Node为24.19.0；Electron保持官方匹配运行时，不能用普通Node冒充Electron路径。
- 使用全新空 `DSH_HOME`、`BKN_CONFIG_DIR`，临时目录/日志也置于任务根；不复制个人home、账号、模型Key或已有业务设置。只在子进程设置环境，不改全局PATH或日常安装。
- npm固定官方CLI的安装语法为：`node <runtime>/node_modules/@deepseek-ai/dsh/lib/bin.js plugin --profile web add file:<候选tgz绝对路径>`。Desktop使用副本自带的 `resources/runtime/cli/bin/dsh.cmd plugin --profile desktop add file:<候选tgz绝对路径>`；它通过匹配Electron Node mode、`--expose-internals`和原 `dsh-desktop-host/lib/cli.js`管理已初始化的desktop profile，不打开GUI。不可用普通npm CLI代替此入口来管理desktop。参数以该固定入口为准，若缺依赖则记录BLOCKED，不换latest。
- Desktop空profile可按官方后端实际初始化方式使用固定 `dsh-app-boot` 的 `initProfile(profile, PROFILE_TEMPLATES.web.bundles)`；不把已有web目录改名冒充desktop。
- 安装后对照plugin32-files.json核对实际82文件；package.json仅格式/键序差异可按完整JSON语义相同单列，其它变化拒绝。复用profile-closure.mjs导出的 `inspectProfileClosure({runtime,host,profile,installed})` 检查真正profile owner与Node resolver，不重复旧闭包测试套件。

## 回补与探针

stock MCP entry应为 `758d8fc473b700b5d351158d06ce9f9e92c16e8b25497b08bb7bd2122a87f5dd`；protected应为 `b3cd7156c0b8639656ce117530fec4d006b74cafdc9a78ac426fec084e62972c`。仅在protected副本的实际MCP物理包应用对应12文件payload；保留许可/归属。改写前排除外部symlink/共享hardlink，通过临时文件+rename替换，不能修改共享store或原Host。其余运行代码保持。

将探针副本放taskRoot内，在新profile用官方patch入口插入：

```json
[{"insert":[{"id":"windows-backport-minimal-proof","name":"探针副本的绝对路径"}]}]
```

任务根写 `OPENBKN-VERIFY-OWNERSHIP.json`：

```json
{"purpose":"host-backport-synthetic-only","independentCopy":true,"browserOrPlatformLoginAllowed":false}
```

子进程提供：BKN_VERIFY_TASK_ROOT、BKN_VERIFY_RUNTIME、BKN_VERIFY_PROFILE、BKN_VERIFY_OUTPUT、BKN_VERIFY_HOST（精确版本）、BKN_VERIFY_MODE（stock-control/protected）。runtime/profile/实际插件/MCP与输出父目录的realpath必须在新任务根内；输出文件不能放冻结kit。probe只用本机合成Bearer/Session/问题，不配置正式平台。

## 原生启动与退出

npm从固定CLI入口使用web profile、`--host 127.0.0.1 --port 0 --no-open --patch <探针patch>`，home通过DSH_HOME指定。

Electron路径使用其原官方 `node_modules/@deepseek-ai/dsh-desktop-host/lib/index.js`，设置 `ELECTRON_RUN_AS_NODE=1`，以Node child_process.spawn启动：

```text
executable: 匹配官方Electron可执行文件
args: [--expose-internals, hostEntry, runtime, desktopProfile, primaryRuntime]
stdio: [ignore, 本轮日志文件, 本轮日志文件, ipc]
```

primaryRuntime来自同一官方制品的 `resources/runtime/primary-runtime`；等待 `{type:'ready'}` IPC。profile patch放 `home/profiles/desktop/cordis.patch.yml`。完成后发送 `{type:'shutdown'}` IPC并等退出；这与Mac既有后端入口参数一致，Windows仍需原生实测。不启动packaged GUI，不改变Host boot、Job或认证策略。

外层等待有界；无报告/同源失败/stock未到第二源/protected实际owner不符都不能PASS。先保留日志，再按PID/UTC/exe/端口核验后用既有owned停止方法收尾，不按名称kill或动日常Chrome。探针会清理自己的MCP与loopback服务器，整棵Host收态仍需外层核对。
