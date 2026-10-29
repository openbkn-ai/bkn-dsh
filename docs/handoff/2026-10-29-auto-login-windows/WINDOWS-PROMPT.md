# 可直接转交 Windows 会话的提示词

你在Windows继续OpenBKN插件自动登录的**最小差异复验**。固定生产源码提交为 `93f3e8560a7ab8834cab7fa97fa79677d71f1827`，只用此材料里的未发布候选 `0.2.1-rc.3-openbkn.0.2.1-auto.local.1`：tgz SHA256 `ea6be318b40f06a55e95e1bfd962f4f06fe230874574028750639f62e61194dc`，259279字节、94文件。交接文档允许新增，生产源码/候选不得改动。取件分支固定 `handoff/windows-auto-login-93f3e85-20261029`；取件提交必须等于主会话回传的完整SHA。它是93f3e85的交接子提交，只增加文档/材料；不能把生产源码改成其他版本，不自行选main/latest或重建包。

目标只覆盖一个已有、任务所有的官方 **DSH0.2.1-rc.3 Desktop**，复用Windows机器先前核验的独立Node/官方CLI0.2.0，不重建环境体系。保持既有Host和正式OpenBKN0.2.0不变，保留所有数据、凭据、配置、首败和旧任务目录。不采用远端-11/-13或-30/-31/-32，不推送、跑CI、开PR、打tag、发布或改latest。

## 1. 校验与准备，不启动GUI

1. 阅读当前项目规则。记录取件HEAD和首尾git status；核对生产目录相对93f3e85无变化。任务输出必须位于新建的 `C:\bkn-verify\auto-login-93f3e85-<唯一后缀>`，不得落入checkout/kit或用户主目录。不要覆盖旧记录，尤其不要给PowerShell只读变量 `$HOME` 赋值。
2. 用已有任务Node运行 `node <kit>\verify-inputs.mjs`，KIT与94文件全部PASS才继续。Windows tar固定使用系统tar.exe，不重新跑argv/tar旧回归。
3. 复用已有任务rc.3 EXE，SHA256必须为 `fd7d298f4ba03ee9bab1719a892afeaef5c09bf50c574a592a64c85f64574c0c`；复用已有官方CLI0.2.0及独立Node，CLI `dist/cli.js` 必须为 `18445a26bfb20f7a8cc8eecb50f499ff12c0ed564e0e3d8741850fcbe43f82a5`。优先已有Node24.19.0，CLI下限>=22.19.0。缺资源则列BLOCKED，不为齐表下载/解包新Host、升级或新建GUI发行。
4. 建立新 `DSH_HOME`、`profiles\desktop`、Electron user-data和空CLI目录。**保留真实USERPROFILE/APPDATA/LOCALAPPDATA/HOME及OS系统变量，不伪造用户home。** 不复制旧home、用户凭据、模型配置、Session或workspace。最小profile的bundles为 `@deepseek-ai/dsh-base`、`@deepseek-ai/dsh-web-app`、`@openbkn/dsh-business-context`，cordis.yml为 `[]`；workspace将Zod固定4.4.3。
5. 用该官方App自带的 `resources\runtime\cli\bin\dsh.cmd plugin --profile desktop add <固定tgz>` 安装，仅进程级DSH_HOME指向新任务home，cwd在任务目录；完整保留安装日志。用 `verify-inputs.mjs --installed <profile>\node_modules\@openbkn\dsh-business-context` 核对94/94。**不要放置任何profile MCP companion。** 安装器自动产生的stock依赖如实披露，不因存在目录就认定人为回补。
6. 配置profile层cordis.patch.yml：`id: openbkn-business-context` 的baseUrl为维护者已授权平台 `https://192.168.50.28`、cliPath为本轮任务官方CLI绝对路径、requestTimeoutMs=10000；另以无外层id的 `{insert:[{name:<kit>/desktop-observer.mjs}]}` 加入观察器。Windows插件路径使用正斜杠。将 `preload-marker.mjs` 原样复制到taskRoot根。

## 2. 启动前备份，再启动一个官方GUI

7. 在任何GUI启动之前执行原样的 `system-association.ps1 -Phase Before -EvidenceRoot <taskRoot>\evidence\system-association -DesktopExe <任务EXE>`。必须成功记录完整HKCU dsh handler导出或明确不存在、UserChoice树存在性、账号身份；失败就停止，不能先启动再补备份。不要修改脚本/守卫、创建钥匙串、导入系统CA或改证书信任。
8. 复用先前实测的持久文件日志启动方式，不创建新启动器/生命周期框架。只给当前进程设置DSH_HOME、BKN_CONFIG_DIR、OPENBKN_AUTO_TASK=taskRoot、OPENBKN_AUTO_INSTALLED=实际插件目录；不把这些值写进系统环境。GUI启动前移除当前进程ELECTRON_RUN_AS_NODE/NODE_OPTIONS及旧BKN_TOKEN/USER/PROFILE/BASE_URL，启动后还原父进程原环境。保留OS/SystemRoot/WINDIR/ComSpec/PATH/PATHEXT和真实用户环境。

   PowerShell的实际启动形式使用已有稳定方式，路径均先验证属于任务目录；不要使用Invoke-Expression：

   ```powershell
   $autoDesktopProcess = Start-Process -FilePath $autoDesktopExe -ArgumentList ('--user-data-dir="' + $autoElectronUserData + '"') -WorkingDirectory $autoTaskRoot -RedirectStandardOutput $autoStdoutFile -RedirectStandardError $autoStderrFile -PassThru
   ```

   立即从CIM记录真实PID、UTC创建时间、EXE和实际owned监听，不能用发起时间替代创建时间。保留EXE/ASAR启动前摘要。正常欢迎页通过“添加API Key→稍后配置”进入主界面；不填写模型凭据，不发模型回合，不采用调试IPC或伪造登录来跳过。
9. **先看CLI载体探针，再授权。** `cli-probe-*-private.json`必须exitCode=0且preloadMarkerWritten=true；记录actual Node/Electron/execPath。此探针只对全新空CLI配置执行auth status，不发网络。若marker未写，即使exit0也记BLOCKED，不借公共CA或个人浏览器证书例外把它算通过，不输入真实账号、不修改候选。只有通过后才继续。

## 3. 只测受影响登录和复用

10. 先点一次“使用OpenBKN CLI登录并同步”，在**未经授权**时取消，确认owned CLI和独立授权浏览器收净，父Desktop仍可用。这是本轮新增浏览器收尾路径，不重跑旧120秒超时矩阵。若CLI/浏览器未退出，保留身份和首败后停止，不无限重试或杀日常Chrome。
11. 再点击登录，仅做**一次真实授权**。提示用户在独立Chrome/Edge中完成平台账号授权；不要把用户名密码、设备码、URL query或token写报告/提示词。用户未完成不算失败；若超时，记录并等待主会话，不擅自循环。若出现系统凭据/证书警告，不创建/重置/导入或绕过，保留并报告。无需W-LIFE、日常Chrome身份确认、RDP、流帧或Job注入调查。
12. 成功应见“登录并同步成功”及真实授权网络目录。现有观察器必须证明：三组件active、实际业务Service类身份、候选版本/业务SHA正确、registry的已挂载MCP实例===业务manager fiber.runtime、私有factory为候选 `lib/platform-mcp-client.js`（SHA256 `41db8cdb31f2f3403eb10e3e42c8114fdb9e54bbc1c76fb6dbdb2c2b931bc22d`），没有手动mount/配置token。观察器仅status、MCP初始化和目录读取，无tools/call。目录数按账号实际权限记录，不能硬编码为2。
13. 授权完成后，确认owned授权浏览器/CLI退出；原日常浏览器不应被关闭。关闭重开OpenBKN面板，仍直接读目录，无新授权窗口。通过官方菜单正常退出Desktop，记录真实exit/进程树/端口收态；然后仅重启同一任务profile一次，确认授权持久化、目录恢复且无新授权浏览器，再正常退出。**不人工修改真实token到期时间，不登出重登，不重跑B1长时。** 续期、证书轮换、跨源307已有源码/Mac证据，本轮不重跑。

## 4. 恢复与回传

14. 所有owned实例完全退出后，执行相同EvidenceRoot/EXE的 `-Phase After` 与 `-Phase Restore`。只用原脚本恢复三个可证明的dsh关联写点；当前不等于After、账号/EXE不符或UserChoice变化时，脚本拒绝就停止，不扩大权限、不整树覆盖。不能把强制杀进程写成正常退出，不能因无菜单新建菜单工程；欢迎态X若确使整棵树退出可沿用已接受口径，仍披露exit code是否实际观测。
15. 复核候选94/94、tgz、官方EXE/ASAR与stock MCP原始摘要，保留新数据配置和全部原件；只检查本轮拥有的PID/创建时间/EXE/端口。无前置个人状态快照不得声称“个人目录逐字节未变”。不清理旧任务、冻结包、全局CLI或个人数据。
16. 回传一份脱敏报告和证据manifest：逐项PASS/FAIL/BLOCKED/NOT_RUN、固定身份、实际CLI解释器/preload、真实授权/目录、MCP实例、取消及成功后owned收态、重开/重启、关联恢复及保全。记录首次失败和必要偏差，不外推新模型/全GUI/平台0.2.1或正式发布验收。截图、原始日志、.reg/SID、CLI配置和浏览器profile仅留Windows任务目录，报告给文件名及SHA256。

全程 `kind=windows-automatic-login-affected-validation`、`ciRun=null`、`formalAcceptanceEligible=false`。不跑旧npm/旧Desktop/完整UI、语言/800×600、目录绑定、B1/W-LIFE/RDP、重定向/argv/tar、G6/Sandbox/Function/run_code/BOM/CSV或原生溯源既过项。不推送结果，先在会话回传脱敏内容，由主会话统一汇总。
