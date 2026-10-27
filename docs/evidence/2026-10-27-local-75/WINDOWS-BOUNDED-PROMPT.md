请执行用户已明确授权的 #108 有界分诊，保持 rc。只做旧 Windows npm/Web 一个组合，完整配置和去 business 对照各最多启动一次，总上限两个 Host。上一轮只读澄清已完成，本次仅放开下面两次启动，不扩展其他权限。

1. 固定材料与保全
复用固定提交 f36103e6af0d3b5ed838696c5efd0fd272c4ec9e 的原材料，以及已核验的官方旧 npm Host 0.2.0-rc.2、任务 Node24.19.0。只用 CI40361613728 的0.2.1-rc.3-openbkn.0.2.1候选，SHA256=27ccf15c46e4f71ef850ee481e22556b70f4d4795e89d7d587a2e3210fc6b3e3，232091B/82文件。old profile MCP使用compat/mcp-profile-backport/的0e06001c…归档（12文件），入口b3cd7156…；Zod4.4.3、Cordis4.0.4/Schemastery3.18.4保持原版本。
不改已发布包、原Host、固定checkout、旧run或正式192.168.50.129/0.2.0。准备失败先报告，不重建运行时或安装新工具。无需新交接分支，全部已有文件在f36103e。

2. 两个案例、固定停止条件
使用全新taskRoot下两个同布局案例 full / without-business，各自独立home/profile/空CLI目录/空cwd/日志，不共享可写状态。两个cwd都在新taskRoot，不能是用户目录、固定checkout或profile代码目录。复用同一份只读官方代码来源；没有可写链接指回原Host。
每案实际spawn即消耗该案唯一启动额度，即使参数错误、立即退出或无输出也不能补启动。每案从真实进程创建起最多观察90秒，已取得所需结果可提前正常收态；90秒是本次观察窗，不是新产品性能SLA。完整案例收净后才能开始对照。两案后无论复现与否均停止，不延长、不追加第三次、不换新版npm/Desktop。

3. 最少验证改动
full保留此前完整bundle/config/profile MCP和原business-autoload观察器。仅在任务私有副本补被动时间日志：观察器apply进入、三组件active检查完成、manager配置完成/结果落盘；不得改变注入列表、断言、超时或业务调用行为。原观察器自然执行的内置合成检查保留输出，不单独加跑Reader/CSV/guard回归。
两案保留相同的极简无业务依赖diag行（复用旧diag的私有副本即可）：在apply只打印UTC、PID、process.cwd()、DSH_HOME及BKN_CONFIG_DIR。不要读取未声明注入的openbknBusinessContext，也不要为它等待业务服务；去掉此前diag的故意属性访问错误。源码/必要日志增量留diff，不能写回固定kit或候选。
without-business只移除业务bundle及其专属config/功能观察器行，保留相同diag行和基础web bundle；候选/companion仍可留在磁盘并校验，但不得手工mount或调用业务服务。没有业务组件是此案预期，不判缺组件失败。记录两份配置的精确差异，避免遗留指向不存在业务行的patch。
继续用已有127.0.0.1合成fixture（最多一个，结束关闭）。不得调用真实CLI/平台/模型/Sandbox，不发送tools/call，不自行登录或生成Interaction，不做重定向向量。若改变观察器/diag的被动日志或cwd可能影响复现，报告该差异；未复现不称已修。

4. 启动前与身份记录
PowerShell使用ErrorActionPreference=Stop，不赋值HOME/home/CODEX_HOME等系统变量，使用caseDshHomePath等任务变量；正常透传OS等必要系统环境，只覆盖任务home/CLI路径，移除继承的BKN_TOKEN/BKN_USER，不打印其值。
启动前断言拟传DSH_HOME、profile、BKN_CONFIG_DIR、cwd、日志输出均属于新taskRoot，profile已明确准备好；任一逃逸不启动。不要再向Host传不支持的--home。
复用已通过的官方lib/bin.js --profile web --host 127.0.0.1 --port 0 --no-open启动方式，保持已验证的参数数组/引用方法。
每案独立文件，禁止覆盖旧记录：先写LaunchRequestedUtc、Node/entry/argv和拟传的路径环境；spawn后立即保存真实PID、CIM创建UTC、exe/命令行和后端端口。实际子进程cwd/home以diag/Host日志可得值核对，拿不到的字段写UNKNOWN，不把拟传值伪称实测。

5. 就绪与写点
分别记录：进程创建、web端口就绪、diag apply、业务观察器apply、三组件active、manager就绪、结果写入、收态。每项写来源和UTC；未出现或无法观测写UNKNOWN。不要用最终mtime替代全部阶段，也不能用超时案例身份证明成功案例。
只在新案例的cwd、home/profile状态文件及已知storages/openbkn/logs目录做前后文件清单比较，排除庞大只读node_modules和其他个人目录。记录新增/变化的相对路径、类型、大小、mtime与SHA256，区分准备阶段预建与Host运行阶段产生；不输出credential/grant内容。明确anonymous-id、credential、profile模板和workspace落在哪个根。没有进程级写入归属证据时writerPid写UNKNOWN，不把mtime相关当确证。
若发现写出任务根、误用个人目录或固定输入变化，停止剩余执行并报告；不自行删除个人文件/恢复注册表，也不重启来掩盖事故。

6. 收态与结果
复用身份核对后的owned停止helper，确认PID/创建UTC/exe/端口再收树，保存真实exit/停止方式和残留情况；控制器本身和fixture也收净。不得杀日常Host/Chrome或仅按进程名扫杀。确认候选82文件、companion12文件、源Host关键摘要、固定checkout保持原样，原件全部保留。
回传full/without-business两行表：启动次数、PID/创建UTC/cwd/home、端口/diag/组件就绪时间、写入差异、退出/端口、PASS/超时/UNKNOWN及来源。另附两配置和日志最小diff、证据路径/SHA256、偏差和未决归属。
判读：full超时而对照可apply只证明集成路径差异，不直接定插件或Host根因；两案都成功记“本次未复现”，不能关闭#108或称修复；两案都失败或出现相反差异也如实记录并停止。禁止无限重试或增加组合。
不重跑GUI/UI/B1/登录/CSV业务题/重定向/全矩阵；不构建、不推送、不跑CI、不改Host/平台、不迁移latest、不采用-11/-13。kind=bounded-windows-npm-startup-triage，sourceCiRun=40361613728，formalAcceptanceEligible=false。先在会话回传脱敏摘要；私有原件留Windows，不上传或推送。
