# 0.2.1 Windows 交接准备：本地 -27

本目录是可搬运的**本地开发包预验材料**，不是最终 CI 候选，也不是 Windows 已通过的证明。目前没有发送给远端执行者；全部收敛前不推送、不触发 CI。正式验收前须用最终 build-only CI 产物重新固定身份，再复验受影响项。

## 固定输入与边界

- 插件：`0.2.0-rc.2-openbkn.0.2.0-27`，229683字节，82文件；tgz SHA256 `5a24a54fa327f04c79884b8303d44d0b2f0bae69e844169c31d28a69af832aef`。
- 源码基点：`933b0ab251c75461ece1ada6145a9487e7eb04d1` 加现有未提交修改；**该 commit 本身不能重建 -27**。实际交付身份以 tgz、逐文件清单及本地源码差异摘要为准；CI run=null。
- DSH：官方 `0.2.0-rc.2` / `639ed015397290b3745d163aafe02ffee4aa3f84`，以及 `0.2.1-rc.2` / `687f282e8625c6b8d11ff58211a90524be2e4317`。同一插件测试两版本、Desktop/npm，共四个 Windows 组合。
- Node `24.19.0`；旧版 Cordis/Schemastery `4.0.4/3.18.4`、新版 `4.0.5/3.18.5`，Zod均固定 `4.4.3`。不要更新Host pin或更换旧构建生成器来绕过问题。两份npm依赖模板取自本机已验证版本集合，避免安装时由peer范围另选混版；不盲目覆盖Host的MCP安全依赖。
- 平台只用 **`https://192.168.50.129`**，保持原样正式0.2.0；不得使用历史环境地址，不部署本地安全回补、不改许可、不停平台服务、不清理历史数据。
- CLI：包内为**正式 npm `@openbkn/bkn-sdk@0.2.0`**，以 `sdk-manifest.json` 的注册表 integrity 校验。不要沿用历史交接里未发布的源码 SDK。
- CA 只含本机测试 CA 的公开证书，无私钥；仅使用进程级 `NODE_EXTRA_CA_CERTS`。浏览器不信任时记录阻碍，不能跳过证书验证。
- 当前原生业务解释路由在 CE 上缺失；非空溯源保留 blocked。低权限配置用户已答“暂缺”。SDK OAuth告警与Sandbox安全缺陷都未关闭；见随包 `G6-BLOCKERS.md`。

## 取件与只读校验

从本机交接 ZIP 解压到独立目录。无需拉分支、下载远端 CI 或使用历史包；ZIP 的外层 SHA 见同名 `.sha256` 文件。先比较外层 SHA，再运行内部校验，任何不一致均停止，不改清单“修复”结果。

```powershell
$taskKit='C:\bkn-verify\021-local27-kit'
$taskRoot='C:\bkn-verify\021-local27-run1'
node (Join-Path $taskKit 'verify-kit.mjs')
if($LASTEXITCODE -ne 0){throw 'Kit or candidate verification failed'}
```

目录必须为本轮独占；在新开的专用PowerShell窗口执行，结束关闭该窗口，避免后续命令继续使用任务的进程环境。开始前保存选定个人DSH/CLI文件的路径、存在性和SHA，不读取或回传凭据内容。旧/新 × Desktop/npm分别使用独立DSH_HOME；CLI可共用一个本轮独立BKN_CONFIG_DIR，通过正常登录授权，不复制个人token。记录各形态实际使用的路径。不要修改全局PATH、APPDATA、用户级CA、日常应用或模型配置。

## npm/web 准备与启动

以下先为旧版本执行一次，再在另一个 runtime/home/evidence 目录为新版执行。安装命令只在交接明确执行后运行，本机准备阶段没有替 Windows 执行这些命令。

```powershell
$taskVersion='0.2.0-rc.2' # 新版为 0.2.1-rc.2
$taskRuntime=Join-Path $taskRoot ('npm-'+$taskVersion)
$taskSdk=Join-Path $taskRoot 'sdk'
$taskCliConfig=Join-Path $taskRoot 'cli-config'
$env:NODE_EXTRA_CA_CERTS=Join-Path $taskKit 'openbkn-local-ca.pem'
$env:BKN_CONFIG_DIR=$taskCliConfig
New-Item -ItemType Directory -Force $taskSdk,$taskCliConfig | Out-Null
npm.cmd install --prefix $taskSdk --no-audit --no-fund (Join-Path $taskKit 'candidate\openbkn-bkn-sdk-0.2.0.tgz')
if($LASTEXITCODE -ne 0){throw 'Official isolated CLI install failed'}
$taskCli=Join-Path $taskSdk 'node_modules\.bin\openbkn.cmd'
& $taskCli --version
if($LASTEXITCODE -ne 0){throw 'CLI version command failed'}
& $taskCli auth login https://192.168.50.129
if($LASTEXITCODE -ne 0){throw 'Independent login failed'}
node (Join-Path $taskKit 'prepare-npm-runtime.mjs') --host $taskVersion --runtime $taskRuntime
if($LASTEXITCODE -ne 0){throw 'Task runtime manifest preparation failed'}
npm.cmd install --prefix $taskRuntime --no-audit --no-fund
if($LASTEXITCODE -ne 0){throw 'Isolated official runtime install failed'}
node (Join-Path $taskKit 'verify-kit.mjs') --installed (Join-Path $taskRuntime 'node_modules\@openbkn\dsh-business-context') --runtime $taskRuntime --host $taskVersion
if($LASTEXITCODE -ne 0){throw 'Installed candidate or closure differs'}
```

根依赖存在不代表profile已加载。启动前先把当前进程 `DSH_HOME` 设为本轮独立目录，用该固定Host的官方CLI执行 `node <runtime>\node_modules\@deepseek-ai\dsh\lib\bin.js plugin --profile web add file:<本地tgz绝对路径>` 安装到profile；不修改生成器或手写加载补丁。安装后对**实际profile包目录**再次做82文件校验，再从原生插件设置配置正式平台和上述 `$taskCli`。

然后使用包内 `start-owned-web.ps1` 指定同一独立home、CLI配置、runtime、证据目录和空闲端口启动；脚本恢复调用进程的环境变量，保留owned PID/UTC创建时间/可执行文件/监听记录。两份模板固定本次直接依赖集合，不冒充完整依赖锁或Windows实测；保留实际生成的锁文件和闭包报告。发现混版/框架漂移时停止，不改清单凑通过。

进程输出可能含本机启动 token，仅留私有证据目录，不回传原日志。结束用同包 `stop-owned-host.ps1` 匹配 owned 记录收态；没有匹配的监听或身份时不强行结束进程，先检查记录。

## Desktop 准备与验证顺序

1. `official-host-assets.json` 记录两个GitHub release均无安装器asset，**不能用 `gh release download` 取Desktop**。改用清单中的官方 `download.deepseek.com` 固定版本URL；新版Windows nightly feed明确给出0.2.1-rc.2的289385456字节及SHA512。旧版固定URL已验证HTTP200、289313640字节；历史feed摘要不可得，完整官方HTTPS取件的观察摘要单列在receipt，不冒充厂商历史签名证明。Windows下载后比较字节数/摘要，再用 `Get-AuthenticodeSignature` 核验有效签名并记录签名主体、安装后实际版本。安装器不放入本交接ZIP，不使用可随时变化的latest下载地址。
   只在独立环境运行，不在日常安装上覆盖升级。若厂商包不能隔离运行或实际版本不匹配，记录blocked，不修改官方二进制。空闲机器或新系统用户可作为独立环境；运行前核实启动后的DSH_HOME，不能假定npm/web的环境自动传给Desktop。
2. 通过 Desktop 的原生插件安装入口选择同一 tgz。校验实际 profile 安装目录、包版本和82文件；区分磁盘版本与实际加载版本，诊断“未采集”保持未知。Desktop 自带闭包与 npm 闭包分别记录；官方包签名/版本不由插件元数据替代。
3. 四组合依次验证：zh/en切换，登录等待/取消/超时后的进程退出及重试，目录取消/重试/选择/绑定，诊断800×600/焦点/Esc/滚动/实际JSON保存，事件/证据空态降级。非空原生解释仍 blocked，不能造记录补过。
4. B1只验证有边界路径：同一 Host 保存/重载插件配置、真实重新登录后，新Session普通查询；保留同PID证据。不能把重启后成功写成同Host修复，也不宣称覆盖所有历史长时触发条件。
5. **标准交期原题**需要真实模型及经核验的执行前 Sandbox 阻断条件，保留完整工具目录；若未具备该条件，保持 blocked。阻断发生的回合不能判 pass。当前没有向 Windows 交付或默认启用未经原生验证的拦截器，不直接照跑完整 G6。
6. Token失效和平台不可达仅故障本轮独立配置/转发层；不撤销共享管理员 token、不停正式服务。故障前先正常绑定新Session，发送销售数量原题；认证/连接前置失败没有模型响应时明确记录。恢复后在**同Session**再发标准交期原题验证可继续操作，仍需前述执行保护。没有可用故障隔离条件则 blocked。
7. 任何 Function、`run_code`、CSV导出都继续暂缓；旧版销售原题仍是历史失败，不能用简单计数题替代。结果按 `RESULTS-TEMPLATE.md` 逐格填写，保留原失败。

## 收态与最终候选

保存选定清单的 after SHA；个人配置应未变。只恢复本轮任务配置，不覆盖已产生的会话证据；不提交凭据、模型Key或诊断中的秘密。Desktop正常退出，npm只结束已匹配owned进程，确认端口释放。

本地准备阶段已在 Mac 核验包清单、SDK完整性和两版 npm 闭包；**PowerShell脚本与Windows UI未在原生Windows执行**。本地包预验通过也不关闭完整合同。之后若源码或包变化，重建本交接身份；本地收敛后才执行最终远端build-only CI，Windows须使用最终固定产物复验受影响项。没有本轮远端推送、CI、发布或替换平台的授权。
