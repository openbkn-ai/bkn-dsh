# Windows -30 r2：最小定向复验任务

请实际执行本轮可测项，不只给计划。固定handoff/windows-local30-r2-20261023分支和主会话提供的完整commit，候选仍是原-30，禁止采用、合入、修改远端-11。先阅读README.md、AGENTS.md和r2目录FOLLOWUP.md/RESULTS-TEMPLATE.md，核对commit、KIT-FILES、候选和原helper SHA。只用本分支未经修改的helper，不用上轮补丁副本，不重建插件。

保留旧运行目录、743eb4a原Windows报告/失败、个人配置和日常应用。新建独占taskRoot、A/B两个新DSH_HOME及独立BKN_CONFIG_DIR，不复制旧token；可复用核对官方摘要/签名/版本的解压应用和官方SDK0.2.0执行文件，避免重复安装。任务Node24.19.0只在当前进程生效。正式平台只用https://192.168.50.129，正式0.2.0不替换，数据配置保留。

范围从小到大：
1. 公共Windows PowerShell5.1 argv回归一次，覆盖InitializeOnly和正常两分支；完整kit/82文件/SDK校验通过后才启动。
2. A旧Desktop0.2.0-rc.2、B新Desktop0.2.1-rc.2分别使用新home，以本轮原start-owned-desktop.ps1执行InitializeOnly，菜单正常退出；官方CLI/原生界面安装同一-30，随后以原helper正常启动，验证实际profile82文件和同物理Cordis/Schemastery。旧4.0.4/3.18.4，新4.0.5/3.18.5；插件Zod4.4.3，Host按自身声明。不改exe、ASAR、依赖或校验器。
3. 每个Host只做一次正常成功登录用于runner取证，不重跑取消/超时、完整UI、完整B1或业务题。对A/B正常登录前/进行中/CLI退出后及Host退出后保存有界进程时间线，至少PID/PPID/UTC创建时间/进程名/exe及已知Host监听。短命cmd/CLI/浏览器启动器需要覆盖；可用只读原生事件或短时轮询，保存方法、采样频率和覆盖限制。不保存完整命令行、环境、设备URL或token。
4. 直接CLI退出和runner管理范围退出分开判断。固定宿主done可在target-exit返回而runner等待Job清空；浏览器后代是未证实假设。PPID图不是Job成员列表。只有现成、经核验、无需Host注入或全局安装的只读Job诊断才使用；不可得就保留未知，不强杀Job/个人浏览器、不改默认浏览器，不给生产代码加成功后terminate。
5. A/B未复现则记录观察时长及原条件差异，不宣称r2修复runner；仍复现且需要同轮对照时，最多追加C旧npm或D新npm之一的单次成功登录与同样只读取证，沿用固定官方runtime/-30，不扩展其UI/B1。没有必要就引用原报告C/D对照。
6. 各Host用菜单正常退出，核对本轮主/后端/runner的身份、端口和日志收态。若仍残留先留证，不按进程名批量杀。仅在确认本轮拥有且不会影响个人浏览器时收态；无法安全收态则报告具体阻碍。恢复仅本轮任务变更，保留新登录配置、新会话及原始失败，不恢复/删除旧验收资源。

已通过的完整UI/B1只沿用原证据及条件，不重新跑。慢读取消、RDP断连、浏览器信任/Chrome既存例外、npm空控制台、完整G6/Function/run_code/BOMCSV、CE非空/低权限/安全及最终CI继续开放，不在本轮扩大执行。不要发真实模型或Sandbox业务回合，不更改平台业务数据。浏览器弹证书警告就记录blocked，不能越过或自行导入CA；已有例外也不当作信任通过。需要用户真实登录/目录选择等配合时说明具体窗口和原因，同时继续独立工作。

不推送、不跑CI、不开PR、不打标签、不发布，不修改正式平台或日常安装。原始证据、进程路径和日志留Windows私有目录。按r2结果模板回传脱敏主要结果、固定完整commit、候选/KIT/helper SHA、每项verdict、关键证据绝对路径/完整SHA、原始错误、仍缺条件及收态摘要；报告本身给绝对路径/完整SHA。截断摘要不补造。不要自动创建或推送结果分支。

本轮local-development-preacceptance，ciRun=null、formalAcceptanceEligible=false。交接推送只由主会话完成，不是Windows结果推送或正式发布授权。
