# Windows 本地 -30 交接材料

这是本地开发预验包，`ciRun=null`、`formalAcceptanceEligible=false`。本轮独立交接分支为 **`handoff/windows-local30-20261022`**，执行前必须核对主会话给出的完整提交 SHA；交接入口见仓库根目录 README.md。本轮已获交接分支专项推送授权，该授权不包含 Windows 结果推送或 CI。旧 `handoff/windows-local27-20261022 / fd87974` 与结果 `fb77c07` 保持冻结。另一路远端 `-11` 是独立版本，不采用、不合入、不修改。

## 固定输入

- 插件 `0.2.0-rc.2-openbkn.0.2.0-30`，231075 字节、82 文件，SHA256 `6d95ff7517dbe409875fd398784fe01049ba26d2b97c43fad65c817d3ea18ee9`。逐文件身份见 candidate-manifest.json / candidate-files.json。
- 源码基点 `933b0ab251c75461ece1ada6145a9487e7eb04d1` 加未提交修改；这个 commit 本身不能重建 -30。同包相对 -29 只改变 package.json 与 lib/client.js，80 文件相同，Host/Remote 字节相同。
- 官方 Host 旧 `0.2.0-rc.2 / 639ed015397290b3745d163aafe02ffee4aa3f84`，新 `0.2.1-rc.2 / 687f282e8625c6b8d11ff58211a90524be2e4317`，分别测试 Desktop 和 npm/web。不得改 Host 源码或 pin。
- 系统测试 Node 24.19.0；Desktop 自带 Electron/Node 单独如实记录，不替换其内置运行时。旧 Cordis/Schemastery 4.0.4/3.18.4，新 4.0.5/3.18.5。
- Schemastery 为 Host peer，profile 不再安装普通依赖。必须核对相同物理包，版本号相同不够。插件 Zod 严格 4.4.3；官方 Host 的 Zod 按自己的依赖声明校验并披露，不能把 npm 测试集合的 4.4.3 强加给官方 Desktop。
- 仅 `https://192.168.50.129`，保持正式 0.2.0；保留数据、配置、日常应用。不得部署安全回补、切换 EE、升级平台、撤销共享凭据或停止服务。
- CLI 是包内官方 `@openbkn/bkn-sdk@0.2.0`，以 sdk-manifest.json 的注册表 integrity 校验。CA 是公开证书，没有私钥。只用进程级 NODE_EXTRA_CA_CERTS；Windows 浏览器不信任时记录 blocked，代理不得越过警告或自行导入系统根证书。
- 不推送、不运行 CI、不开 PR、不打标签、不发布。回传脱敏结果、文件摘要和受阻项；原日志、密码、token、设备登录 URL/code 留 Windows 私有目录。

## 校验与隔离

在新的专用 PowerShell 窗口中执行，设置本轮独占目录。Node 路径仅对当前窗口生效；不改全局 PATH、APPDATA 或日常配置。

```powershell
$taskKit='C:\bkn-verify\021-local30-src\docs\handoff\2026-10-22-021-local-30-windows' # 按本轮实际 checkout 路径调整
$taskRoot='C:\bkn-verify\021-local30-run1'
if(Test-Path $taskRoot){throw 'Choose a new task root'}
New-Item -ItemType Directory $taskRoot | Out-Null
node (Join-Path $taskKit 'verify-kit.mjs')
if($LASTEXITCODE -ne 0){throw 'Kit/candidate verification failed'}
```

verify-kit 在 Windows 明确使用 `%SystemRoot%\System32\tar.exe`，不查 PATH。保留一次 Git usr\bin 排在 PATH 前面的验证结果，证明不会再误用 GNU tar。系统 tar 缺失则停止，不改清单绕过。KIT-FILES 覆盖整个交接目录，结果和临时文件必须写到目录外。

开始前记录选定个人 DSH/CLI 文件的存在性、SHA256，以及日常安装/用户目录摘要；不要读取或回传凭据内容。A 旧 Desktop、B 新 Desktop、C 旧 npm、D 新 npm 各自独立 DSH_HOME；CLI 使用本轮独立 BKN_CONFIG_DIR，正常登录，不复制个人 token。保留旧 -27 失败原件。

## CLI 与 npm/web

以下为旧版示例，新版另取新的 runtime/home/evidence 并使用 0.2.1-rc.2。

```powershell
$taskVersion='0.2.0-rc.2'
$taskRuntime=Join-Path $taskRoot ('npm-'+$taskVersion)
$taskHome=Join-Path $taskRoot ('home-npm-'+$taskVersion)
$taskSdk=Join-Path $taskRoot 'sdk'
$taskCliConfig=Join-Path $taskRoot 'cli-config'
$env:NODE_EXTRA_CA_CERTS=Join-Path $taskKit 'openbkn-local-ca.pem'
$env:BKN_CONFIG_DIR=$taskCliConfig
$env:DSH_HOME=$taskHome
New-Item -ItemType Directory -Force $taskSdk,$taskCliConfig | Out-Null
npm.cmd install --prefix $taskSdk --no-audit --no-fund (Join-Path $taskKit 'candidate\openbkn-bkn-sdk-0.2.0.tgz')
if($LASTEXITCODE -ne 0){throw 'Official CLI installation failed'}
$taskCli=Join-Path $taskSdk 'node_modules\.bin\openbkn.cmd'
& $taskCli --version
if($LASTEXITCODE -ne 0){throw 'CLI version check failed'}
& $taskCli auth login https://192.168.50.129
if($LASTEXITCODE -ne 0){throw 'Login incomplete; retain evidence and report dependency'}
node (Join-Path $taskKit 'prepare-npm-runtime.mjs') --host $taskVersion --runtime $taskRuntime
if($LASTEXITCODE -ne 0){throw 'Runtime preparation failed'}
npm.cmd install --prefix $taskRuntime --no-audit --no-fund
if($LASTEXITCODE -ne 0){throw 'Official runtime installation failed'}
$taskCandidate=Join-Path $taskKit 'candidate\openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-30.tgz'
node (Join-Path $taskRuntime 'node_modules\@deepseek-ai\dsh\lib\bin.js') plugin --profile web add ('file:'+$taskCandidate)
if($LASTEXITCODE -ne 0){throw 'Official profile installation failed'}
$taskProfile=Join-Path $taskHome 'profiles\web'
node (Join-Path $taskKit 'verify-kit.mjs') --runtime $taskRuntime --host $taskVersion --profile $taskProfile
if($LASTEXITCODE -ne 0){throw 'Actual profile package or closure failed'}
```

`--runtime` 单独运行只报告 installation-only / profileCoverage=not-run；不能当作实际 profile 通过。`--profile` 自动校验该目录内插件的 82 文件、版本，并使用不改动的官方 Host 解析 API 和 Node 解析核对框架闭包。不启动业务插件、不调用平台。根、profile、实际运行/加载证据分别保存。

使用 start-owned-web.ps1 启动；指定独立 Runtime、DshHome、CliConfig、HostVersion、Evidence 和空闲 Port。脚本重定向私有 stdout/stderr，记录 PID/创建时间/exe/监听并恢复调用窗口的环境。通过插件原生设置保存正式平台 URL 与 `$taskCli`，不要误保存自动预填的个人全局 CLI。两份依赖模板不是完整锁文件；保留 Windows 实际安装锁与闭包报告。

## Desktop 与持久日志

按 official-host-assets.json 的官方固定 URL 取两个版本；GitHub release 无安装器 asset。比较大小/摘要，再记录 Get-AuthenticodeSignature 的 Valid、签名主体和实际 FileVersion。只提取到任务目录，不运行安装器覆盖日常应用，不更改官方二进制。

使用 start-owned-desktop.ps1，传入 ApplicationExe、DshHome、CliConfig、HostVersion、Evidence。新 home 首次用 `-InitializeOnly` 初始化，**这个阶段没有 profile 通过结论**。可在其原生插件界面安装同一 tgz；随后正常完全退出，使用新的 Evidence 目录做不带 InitializeOnly 的正式启动。若改用官方 Desktop CLI，先完全退出初始化应用，再指定同一 DSH_HOME 执行 plugin --profile desktop add。新 helper 的校验用 Electron 的 ELECTRON_RUN_AS_NODE / --expose-internals 读取 app.asar/dsh，不能用普通 Node 假定 ASAR 是展开目录。

正常启动前必须通过实际 desktop profile 校验。helper 对 stdout/stderr 使用文件重定向，另用独立 `--user-data-dir`，记录主进程及子树监听。不要再从临时 shell 继承控制台管道直接启动 exe。该改动处理启动器的断管条件，**未修改官方 NsisUpdater 的异常处理**。

Windows 专项复验：保存启动记录，关闭启动 PowerShell、断开再恢复远程会话或重开执行会话后，确认同一主 PID/UTC 创建时间、后端 PID、监听仍在，日志仍可写，无 write EPIPE。若进程被外部 job/session 终止，保留原始错误，不能写成日志修复已通过。此项尚未在本机 macOS 原生执行。

## 不依赖 Sandbox 的 B1 普通查询夹具

包内 b1-readonly-protocol.mjs 是本地协议夹具，接收完整工具目录，仅选择 start → 精确 query_object_instance → finish；没有真实模型、Function、run_code 或答案修正。这只验证 B1 的管理工具/普通查询路径，不替代 G6、销售明细或长时条件。

1. 在独立 PowerShell 中用固定 Node 启动夹具，并将输出重定向私有文件：

```powershell
$taskProtocol=Join-Path $taskRoot 'b1-protocol'
$taskNode=(Get-Command node.exe).Source
$taskArgs='"'+(Join-Path $taskKit 'b1-readonly-protocol.mjs')+'" --evidence "'+$taskProtocol+'"'
$taskFixture=Start-Process $taskNode -ArgumentList $taskArgs -RedirectStandardOutput (Join-Path $taskRoot 'b1-stdout-private.txt') -RedirectStandardError (Join-Path $taskRoot 'b1-stderr-private.txt') -PassThru
```

等待 server.json 后记录夹具 PID/UTC创建时间/exe/端口；只绑定 127.0.0.1。不要覆盖旧夹具证据。

2. 在 Host 未启动时，对所选任务 profile 运行 prepare-b1-profile.mjs：

```powershell
node (Join-Path $taskKit 'prepare-b1-profile.mjs') --runtime $taskRuntime --profile $taskProfile --server (Join-Path $taskProtocol 'server.json') --backup (Join-Path $taskRoot 'before-b1-private.yml')
if($LASTEXITCODE -ne 0){throw 'Fixture profile preparation failed'}
```

Desktop 对应命令使用其 exe，在 ELECTRON_RUN_AS_NODE=1 下加 --expose-internals，runtime 为 `<exe目录>\resources\app.asar\dsh`；只在当前进程临时设该变量并立即恢复。backup 包含配置，只留私有目录。不要更改用户模型提供方；脚本仅加 local30-b1，不改默认模型。

3. 使用 owned 启动器并加 `-ReadOnlyProtocol`，为子进程提供非秘密的夹具 key。通过原生界面正常登录、将 supply_ontology_hand 绑定到本轮专用已有工作区。记录实际主/后端 PID、创建时间、exe 和监听。用 b1-probe 创建独立 Session：

```powershell
node (Join-Path $taskKit 'b1-probe.mjs') --owned '<本轮Evidence>\owned-host.json' --log '<npm的host-stdout-private.txt或Desktop的desktop-stdout-private.txt>' --workspace '<已绑定本体的本轮工作区绝对路径>' --server (Join-Path $taskProtocol 'server.json') --phase baseline --key npm-old --output (Join-Path $taskRoot 'b1-baseline.json')
```

4. 建立查询成功基线后，在**同一 Host**保存/重载插件配置，并走真实 CLI 浏览器重新登录；确认身份三项及后端 PID 没变。用新的 phase/output 再跑一次。同 Host 前后两次普通查询均应 totalCount=40；重启成功不是同进程恢复，登录成功不是查询成功。
5. 用正式 CLI 读回两个 Interaction 的标准记录和 `/operations`，确认 execution_status=completed、唯一操作 `query_object_instance/completed`。仅工具调用返回结束不算通过。不要回传 raw 响应中的业务行或秘密。保留协议 events 及失败原件；夹具失败、认证失效或真实平台查询不符时立即保留为 fail/blocked，不替换统计基准。
6. 正常退出 Host、确认端口释放后，只恢复本轮 backup，并逐字节校验；保留新 Session/Interaction。结束夹具前按 PID/UTC创建时间/exe/端口核对身份，不停止别人的进程。

该便携夹具已在本机新 npm Host 完成一次实际查询及平台 operation 读回；Windows 原生仍 not-run。Mac 四组合的短 B1 与历史 -29 的四小时结果分别保留身份。

## Windows 复验范围与受阻项

A/C 因 -27 闭包门槛停止，需从实际安装/闭包开始重新验证全部可测项。B/D 也需复验闭包、英文标签，并覆盖 -28 取消和 -29 刷新焦点改动。四组合分别记录 zh/en、登录等待/取消/默认超时/CLI退出/真实重试、目录取消/重试/选择/绑定、800×600/焦点/Tab/Escape/滚动/真实 JSON 保存、实际版本与选定配置前后摘要。诊断未采集的加载版本、npm hostForm=unknown 保持未知；不要拿磁盘元数据补填。

原生溯源关闭取消验证可使用普通查询回合的标准记录/404空态；不得伪造非空 CE 原生解释。首次 Desktop 初始化、选择目录或正常登录需要用户配合时，说明具体阻碍。

完整真实模型 G6、标准交期恢复题、Function/run_code、BOM/业务 CSV，继续等待经核验的执行前 Sandbox 阻断条件或后续明确决策；本夹具不开放这些能力。无此条件不运行模型业务回合，不删工具目录或换题凑通过。低权限账号仍暂缺；CE 非空原生解释路由仍缺失。旧销售明细/字段标签/恢复回合失败、SDK OAuth 与 Sandbox 安全门槛保留。

其余待分诊观察：全局 CLI 自动预填、登出态通用 nextAction 与历史被动 pass、npm hostForm、眉标对比度、Escape 同时关闭父面板。它们未在 -30 中伪报修复。

## 收态与回传

Desktop 优先正常退出；npm 使用 stop-owned-host.ps1，必须匹配 owned PID/UTC创建时间/exe/监听。仅清理本轮资源，恢复任务配置，不删除原始失败、新会话或凭据备份。核对个人配置、日常安装、所选平台数据/配置未变。

按 RESULTS-TEMPLATE.md 回传结果，列明执行机器、实际 commit、候选 SHA、每格 verdict、私有证据文件路径/SHA、原始错误及未执行原因。对公开回传文件做秘密扫描；不上传原始启动/登录日志。该材料不授权远端结果推送，传输方式另行确认。最终本地收敛后仍需固定 build-only CI 候选并复验受影响项，不能把 -30 本地预验改记为正式发布验收。
