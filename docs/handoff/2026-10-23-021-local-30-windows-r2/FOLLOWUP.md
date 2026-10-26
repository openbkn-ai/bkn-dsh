# Windows -30 交接修订 r2：定向复验

本目录尚未提交/推送。候选包、SDK、Host pins 和运行契约仍为原 -30；只有交接工具修订。原 743eb4a/-30 的Windows报告和失败原件保持，不能将其中补丁版 launcher 的启动结果写成原版 helper 通过。

## 已修正：Desktop helper 参数

原 helper 两个数组表达式中的字符串加号和逗号产生错误分组，路径的引号成为额外参数。r2 只给每个带引号的路径拼接加括号，不硬编码 kit 路径，不改官方二进制或 verify-kit。

在 Windows PowerShell 5.1 上先运行：

```powershell
powershell.exe -NoLogo -NoProfile -File (Join-Path $taskKit 'test-desktop-launcher-argv.ps1') -Launcher (Join-Path $taskKit 'start-owned-desktop.ps1') -NodeExe (Get-Command node.exe).Source
if($LASTEXITCODE -ne 0){throw 'Launcher argv regression failed'}
```

该回归读取原 helper 的参数构造 AST，并将最终参数传给真实 Node 验证空格路径的逐项 argv，覆盖初始化/正常两种分支，不启动 Host 或平台。Mac PowerShell 7.6.8 的通过不能替代 Windows 5.1。

A/B 分别新建任务目录，使用本目录未打补丁的原版 helper 验证 InitializeOnly，再正常退出，安装同一 -30 包，执行带实际 profile 校验的正常启动。保存原 helper SHA、argv 回归、闭包报告、PID/UTC创建时间/exe/监听和日志。若复用已安装 profile，只能覆盖正常启动分支，初始化分支仍应另测。候选82文件、安装器/签名/ASAR身份仍需匹配。正常退出并恢复本轮配置。

这次只修 launcher，不改变插件，不要求重跑四组合完整业务路径。受影响的原版 helper 启动在 Windows 完成前保持 not-run。

## runner 观察：先取证，不强杀

A/B 成功登录后 runner 存活、cmd/CLI退出；取消/超时和C/D成功路径没有同样观察，Desktop退出时runner一起退出。这是Windows回传现象，主会话未读取Windows私有原件。

固定宿主源码把直接目标退出和整个管理范围清空分开：done可以先返回，Windows runner只有在Job清空后才退出。固定SDK的成功OAuth路径还会spawn start/shell浏览器启动器并unref；detached/unref本身不足以证明脱离Windows Job。浏览器后代存活是待验证假设，不能据此宣布无缺陷，也不能成功后直接terminate整个Job，避免结束用户浏览器。

后续最小取证：在一次正常成功登录前、进行中、CLI退出后及Host正常退出后，对A/B和一个npm对照保存进程树快照，至少包含PID、PPID、UTC创建时间、进程名和exe；需要覆盖登录期间短命的cmd/CLI及浏览器启动器，并比对浏览器新增进程。只留本轮私有目录，不保存完整命令行、环境、设备URL或token。不要关闭个人浏览器或修改默认浏览器。普通PPID图只能给关联证据，不能当作Job成员列表；仍无法证明Job为空时保持原因未知。

如能使用经核验的只读Job成员诊断，再记录该Job是否为空及成员身份；不能给官方Host注入补丁或打开包含凭据的IPC日志。当前不修改插件/SDK/宿主生产实现。

## 其他开放项

- 原Windows报告的404空态/关闭重开通过；在途读取取消是insufficient-evidence，缓存重开不能证明取消。需在受控慢读条件下保留CLI/HTTP退出证据，另行复验，不能改原始结果。
- RDP真正断开重连是not-run；原约6小时执行会话间隔证明相应持久日志条件，不替代RDP。
- 浏览器信任blocked。既存Chrome证书例外来源未知，不推定来源、不删除例外、不自行导入CA或越过警告。Node TLS和CLI成功分别记录。
- npm无控制台启动出现可见空窗口仍是观察，本次不宣称修好。需要定向验证后决定是否采用既有WindowStyle Hidden方案。
- 完整模型G6、Function/run_code/BOM/CSV、安全、低权限、CE非空等门槛保持，不换正式0.2.0，不采用远端-11。
- 不推送、不跑CI，不开PR、不打标签、不发布；先回传脱敏报告、证据路径/SHA和受阻项。
