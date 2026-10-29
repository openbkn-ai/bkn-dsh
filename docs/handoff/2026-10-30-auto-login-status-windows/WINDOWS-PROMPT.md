# Windows：登录成功状态最小复验

只执行一个受影响用例，不扩展范围。分支 `handoff/windows-auto-login-status-20261030`，取件提交必须等于主会话提供的完整固定 SHA，建立新的 detached checkout，首尾 git status 干净。修复源码 `dbf53d329eae704e580e555f9da37f7c05a8111a`；原93f3e85、原auto.local.1及其Windows结果fa6e2fb不改写。

只用随材料交付的 `0.2.1-rc.3-openbkn.0.2.1-auto.local.2`：SHA256 `96dc62d7ef9bded5ca45861a9d8d5e0f627f30a365a38590d7cbb541a9867571`，259297字节、94文件。与原ea6be318归档只差 lib/client.js 和 package.json，其余92文件完全相同。实际客户端SHA `9d15a9e74dc925066b3aacc88e6cdefc49b492916a4692ee601ab1ec110671f7`。本轮为local-development-preacceptance，ciRun=null，formalAcceptanceEligible=false。

1. 阅读项目规则、README、INPUTS及CANDIDATE-DELTA。新建 `C:/bkn-verify/auto-login-status-<唯一后缀>` 存全部产物，禁止输出到checkout/kit或用户主目录；不要赋值PowerShell的$HOME。用既有任务Node执行 `node <kit>/verify-inputs.mjs`，完整校验通过后继续。禁止重建候选或取main/latest/-11/-13。
2. 复用上一轮已核验的任务官方rc.3 Desktop（EXE SHA fd7d298f4ba03ee9bab1719a892afeaef5c09bf50c574a592a64c85f64574c0c）和官方CLI0.2.0（dist/cli.js SHA 18445a26bfb20f7a8cc8eecb50f499ff12c0ed564e0e3d8741850fcbe43f82a5）。保留真实USERPROFILE/APPDATA/LOCALAPPDATA/HOME、OS和PATH；上一轮scoop Node24.21.0满足>=22.19.0，可沿用，不再为换成24.19.0调整环境。记录实际解释器；若Host/CLI/Node身份已变，列BLOCKED，不升级或重建环境。
3. 使用新的DSH_HOME、desktop profile、Electron user-data和空CLI配置，不拷贝凭据、模型配置、会话或workspace，不修改上轮任务目录。最小profile bundles为@deepseek-ai/dsh-base、@deepseek-ai/dsh-web-app、@openbkn/dsh-business-context，cordis.yml=[]，Zod4.4.3。用官方App自带dsh.cmd plugin --profile desktop add安装本轮tgz，进程级DSH_HOME及cwd须在任务根。执行verify-inputs.mjs --installed核对94/94。不得放置MCP companion。
4. profile层cordis.patch.yml配置id=openbkn-business-context：baseUrl=https://192.168.50.28，cliPath=既有任务官方CLI绝对路径，requestTimeoutMs=10000。另加入无外层id的 {insert:[{name:<kit>/business-observer.mjs}]}，路径用正斜杠。仅设进程级OPENBKN_AUTO_TASK=taskRoot、OPENBKN_AUTO_INSTALLED=安装插件目录；观察器原样复用，不启动CLI carrier探针。
5. GUI启动之前，原样执行system-association.ps1 -Phase Before -EvidenceRoot <taskRoot>/evidence/system-association -DesktopExe <任务EXE>。成功保存完整handler/不存在状态、UserChoice和账号身份才继续；失败立即停止。保留OS，不改守卫，不导入系统CA或改ACL。
6. 复用上一轮已验证的持久文件日志启动方式，仅启动这一个任务GUI。启动前在当前进程移除旧ELECTRON_RUN_AS_NODE/NODE_OPTIONS/NODE_EXTRA_CA_CERTS/NODE_TLS_REJECT_UNAUTHORIZED及BKN_TOKEN/USER/PROFILE/BASE_URL，设置任务DSH_HOME、BKN_CONFIG_DIR、上述观察器变量，启动后还原父环境。不要写系统环境。记录CIM实际PID、UTC创建时间、EXE、监听，EXE/ASAR启动前摘要。欢迎态通过“添加API Key→稍后配置”，不输入模型凭据。
7. 打开OpenBKN面板，等待用户准备好后，只发起一次真实CLI浏览器授权。让用户在插件打开的独立Chrome/Edge中完成授权；不记录密码、token、设备码或URL query。用户未在120秒内完成属于人工等待未完成，保留原件并报告，未经用户明确指示不循环重试。本轮不重测取消、默认超时、B1或W-LIFE。
8. 核心判定：从点击登录到授权结束始终保持当前面板打开，**不得点击关闭、刷新状态、诊断、切换语言或重开窗口来促成更新**。应自动由等待状态切换为“登录并同步成功”及真实网络目录。记录点击、用户完成授权、proof文件写入、首次看见成功文案与目录的时间，AX/DOM文本与截图对应保存；未知时刻写UNKNOWN，不用文件名推断成功。网络数按账号实际权限，不硬编码2。成功后即停止观察，不额外做性能测试。
9. 若proof已写、CLI已退出而当前面板仍等待，保留该页面，不刷新、不关闭来改判PASS。立即留AX/DOM全文与截图，必要时在授权完成后约15秒、60秒补读，观察上限沿用原120秒等待窗口（诊断边界，不新设产品SLA）。记录是否出现前端/Remote错误（已有日志可读，隐私原件留本机）；判FAIL/证据不足后停止，不追加登录。此时原“重开后能用”不能覆盖本轮主项。
10. 核对已有观察器proof：候选版本、三组件active、类身份、真实只读目录、registry实例===manager fiber.runtime，包内MCP SHA仍41db8cdb31f2f3403eb10e3e42c8114fdb9e54bbc1c76fb6dbdb2c2b931bc22d，未手工mount/token/companion；记录本轮成功后owned CLI/独立浏览器是否退出，不操作日常浏览器。
11. 通过官方菜单正常退出一次；欢迎态无菜单时官方X使整树退出可按既定口径接受。记录真实退出码，未观测就UNKNOWN，另记进程树/端口收净；强杀不冒充正常退出。**不重启Desktop、不再重开面板做持久化测试**，这部分直接沿用auto.local.1已过项。
12. 全部owned实例退出后，同EvidenceRoot/EXE执行After、Restore，原脚本守卫拒绝就停止，不扩大权限、不改UserChoice/ACL或整树覆盖。复核94/94、tgz、EXE/ASAR/stock MCP首尾摘要；保留新数据配置、上轮原件和本轮首败，不宣称没有前置快照的个人状态逐字节不变。

不改既有Host、正式OpenBKN0.2.0及数据配置；不访问.129、不采用远端-11；不跑模型/G6/Sandbox/Function/run_code/BOM/CSV/原生溯源、旧Host/npm/完整UI/语言/800×600/目录绑定、B1/W-LIFE/RDP、重定向/argv/tar/闭包矩阵。不新建GUI发行体系。不推送、不开PR、不跑CI、不发版、不动latest，也不改#93/#97/#2573。

回传kind=windows-auto-login-status-fix-validation、固定身份、主项PASS/FAIL/BLOCKED、时间线、AX/截图对应关系、proof、退出与恢复、差异/UNKNOWN和脱敏manifest。原始截图、进程、日志、.reg/SID、CLI/浏览器配置仅留验证机；公开副本与私有原件分别计算哈希，不沿用脱敏前哈希。不自行推送结果。一次成功不能证明上轮5分钟滞留的唯一根因；本轮只判修复候选是否不再需要关闭/刷新。
