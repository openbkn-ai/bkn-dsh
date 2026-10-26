请继续 bkn-dsh 0.2.1 发布的最终候选最小差异验证。只执行下面的变化边界，不重跑已通过项。

固定输入：以主会话提供的本次 Git 固定提交为准；候选来自 build-only CI 40361613728，源码 db68c80070f3475a1a460c3c9fca84d26944e198，publish=false。包版本 0.2.1-rc.3-openbkn.0.2.1，SHA256 27ccf15c46e4f71ef850ee481e22556b70f4d4795e89d7d587a2e3210fc6b3e3，232091B/82文件。目录 docs/handoff/2026-10-27-release-021/ 的 INPUTS.json、CANDIDATE-FILES.json 和 candidate/ 为固定来源。OpenBKN0.2.1仅发布标识，平台实际验证仍为正式0.2.0；不采用远端-11/-13，不改冻结-30/-31/-32。

1. 只读检查 Git HEAD/status、输入摘要及82文件清单。复用此前已核验的任务 Node24.19.0、官方 old0.2.0-rc.2/new0.2.1-rc.3 npm运行根和匹配官方Electron44.0.0/44.7.0后端来源；只复制代码到全新taskRoot，不复制home/凭据/模型配置/业务会话。正式平台、个人Chrome、日常DSH及旧taskRoot全部保留。若固定官方来源不可用，先报具体缺失，不新建GUI发行体系。

2. 在四个新副本（old/new npm、old/new Desktop后端）放入同一CI候选。旧/new对应的profile MCP companion从仓库compat/mcp-profile-backport/取原归档及清单；源运行根保持stock MCP。Zod4.4.3与各自Cordis4.0.4/4.0.5、Schemastery3.18.4/3.18.5沿用原已验证物理包，不做依赖升级或额外安装日常软件。每份候选82文件与CI清单相等；任务profile只含必要公开配置和组件。

3. 只用此目录的synthetic-fixture.mjs（先启动一个loopback fixture，记录打印的baseUrl；stdin输入任意一行可正常关闭）。profile层cordis.patch.yml修改既有openbkn-business-context行：baseUrl=<fixture地址>、mcpUrl=<fixture地址>/mcp、cliPath=<任务内不存在的never-executed-cli>、requestTimeoutMs/toolCallTimeoutMs=3000。新增观察器行用无外层id的 {insert:[{id:'final-ci-profile-observer',name:'<本目录/business-autoload.probe.mjs绝对正斜杠路径>'}]}；不要使用已知挂载不确定的命令行--patch，不手动mount MCP。

   观察器环境（各行分别设置，原环境OS等正常透传）：
   DSH_PROOF_INSTALLED=<本行profile/node_modules/@openbkn/dsh-business-context>
   DSH_PROOF_PROFILE=<本行profile>
   DSH_PROOF_OUTPUT=<本行全新输出JSON路径，父目录已存在>
   DSH_PROOF_BUSINESS_SHA256=ca9125bd7ce9d017f8c0a9a1fa097ff8165e8943dfbde5dad96f31406b2bd537
   DSH_PROOF_NATIVE_FIXTURE=<本目录/native-provenance-schema1.json>
   DSH_HOME=<本行新空home>
   BKN_CONFIG_DIR=<本行新空CLI目录>

   复用此前已通过的原生启动方式：npm用官方lib/bin.js --profile web --host 127.0.0.1 --port 0 --no-open；Desktop只用ELECTRON_RUN_AS_NODE=1启动官方EXE和dsh-desktop-host，保持原参数数组及IPC ready/shutdown方式。不启动GUI，不注册协议，不需要新一轮系统关联备份，因为本轮不走GUI入口；若意外启动GUI，立即停止后续并如实报告，不自行修改注册表。

   必须得到每行实际Service类身份、3个active loader组件、manager已注册实例===runtime、自动选中profile内MCP b3cd7156…、当前包版本，以及打包公开Reader的6项受控检查PASS：有效detail/explanation、超限operations/time_rail、错误数组形record拒绝、65/64 record拒绝。fixture只做synthetic initialize/tools-list/knowledge-networks，tools/call为0，绝不访问真实平台或CLI。这里的Reader探针是受控响应，不是非空平台验收，也不计模型G6。

4. 仅补CSV变化边界：复用仓库 packages/openbkn-business-context/tests/probes/csv-export-runtime.probe.mjs 的现有官方ToolRuntime受控探针，在一个新版npm任务副本/既有独立测试布局安装此CI候选后执行 --runtime <任务运行根> --plugin <实际候选目录>。本次新增向量为q*.csv，在平台派发/文件写入之前拒绝；保留其已有少量正向/拒绝对照，不重跑CSV业务题或Sandbox。该探针的文件端口及run_code响应全是合成，不运行真实run_code。务必使插件与ToolRuntime使用同一物理Host依赖；不要把直接Node导入缺少Host loader映射误判成候选缺陷，也不要为补齐测试搭新框架或改官方Host。若当前布局不能直接复用，保留原错误、说明缺少的解析条件，本项单列BLOCKED，继续其他独立项。

5. 收态：按已有helper或原生IPC核对owned PID/创建时间/EXE/端口后停止仅本轮实例，关闭fixture；Desktop后端记录shutdown/exit，npm记录按身份收树及端口释放，不冒称GUI菜单退出。再次核对输入/候选/源Host摘要和checkout干净；旧证据与所有失败原件保留。不遍历个人凭据或浏览历史，不全库审计。

不重跑：8/8重定向矩阵/向量、GUI/UI/中英文/800×600/目录、argv/tar、登录/取消/超时/B1/W-LIFE/RDP、低权限负例、模型/G6/Function/run_code/Sandbox/BOM业务题；不得推送、跑CI、开PR/tag/发布、替换正式0.2.0或改现有Host。不能用历史-32结果冒充本轮最终CI包；未覆盖的真实非空溯源/历史runner等继续保留。

回传：固定Git提交、CI候选摘要、四行PASS/FAIL/BLOCKED表、CSV变化边界结果、输入/组件/类与MCP物理选择、Reader检查、实际Node/Electron、退出/端口/fixture摘要、证据文件及SHA256清单、失败/偏差和受阻项。只输出脱敏结果；原始日志/系统路径/凭据均留Windows本机。结果标注final-ci-candidate-affected-validation，ciRun=40361613728；formalAcceptanceEligible只能按覆盖范围判断，不能自动把共享fixture或后端通过写成完整正式合同通过。不推送结果分支，先在会话贴回摘要，由用户决定回传方式。
