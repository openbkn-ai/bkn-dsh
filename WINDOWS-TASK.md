# Windows -30 r3：先 argv，后一个 Desktop 浏览器/runner 取证

请实际执行，不只给计划。固定 `handoff/windows-local30-r3-20261023` 和主会话给出的完整commit，只用原-30，不采用远端-11。读README、AGENTS、r3 FOLLOWUP和结果模板；本任务范围优先，不重跑旧矩阵。

1. 在新的专用checkout核对完整commit、KIT-FILES、官方argv脚本、原helper、-30 tgz及SDK；系统任务Node24.19.0仅当前进程生效，Windows系统PowerShell5.1。新建kit外独占evidence/results目录，保留全部旧目录与失败；不要输出凭据。冻结输入不许修改重算清单绕过。
2. **先只做P1**：运行一次test-desktop-launcher-argv.ps1，Launcher为本目录未经修改的start-owned-desktop.ps1、NodeExe为已核对的任务node.exe。脚本内部覆盖初始化参数和正常参数，只启动短命Node sink，不启动Desktop、浏览器、CLI或平台。不要用兼容性夹具替代官方回归。失败保留完整原错，P2停止；不重跑A/B启动、UI或B1。
3. **P1通过后才准备P2**：请用户从平常入口打开/确认日常Chrome窗口，再记录那个可见窗口对应PID、UTC创建时间、exe及必要父链。日常窗口可复用已有根；不能仅凭Chrome根存在或默认快捷方式确认。54508的默认Chrome判断已撤回。不得读取/干扰其他会话Chrome、-11或.playwright-mcp。无法确认窗口身份则P2 BLOCKED，先交P1报告；不要关闭其他浏览器造条件。
4. 只选一个Desktop，优先A旧0.2.0-rc.2；若B新0.2.1-rc.2更易复用且输入核对通过，可改选并说明理由。复用上轮已验证的隔离官方应用、-30实际profile及独立CLI配置；只做必要身份/摘要检查，不重装、不改profile/依赖、不跑InitializeOnly、不复制个人token。缺条件报告blocked，不能自动扩大初始化/安装。按本次原helper为这一个应用新建Evidence并启动，仅作为P2取证准备，不复跑/重新计分A/B启动验收。
5. 日常Chrome仍开着时，做一次原生面板正常成功登录；不重测取消/超时/UI/B1，不发模型或任何业务题。保存登录前、过程中、cmd/CLI退出后约60–80秒、菜单正常退出后的只读时间线：所选Host/后端/runner/cmd/CLI、已确认的日常窗口及根、新登录Chrome树，PID/PPID/UTC创建时间/进程名/exe及已知任务监听。记录采样方法/频率、短命进程覆盖和PID复用限制，不保存完整命令行、环境、设备URL/code、token、账户或标签页。只复用经核验的现成安全采样；不安装/提权、不注入、不复制/持有Job句柄。
6. 分开判断直接CLI退出、runner管理范围退出、日常窗口/根保留、新树关闭时间；同次采样消失不强行排先后。IsProcessInJob(NULL)只证明某Job，PPID不能证明成员；拿不到可靠只读Job证据则未知。旧r1残留和r2有限未残留并列保留，不能说本次修好了runner。首结果提前return/dispose是候选机制，受控函数夹具未执行真实Remote/Job/浏览器，不能据此定因。本轮不修改生产客户端、SDK或Host。
7. 菜单正常退出所选Desktop，按PID/UTC时间/exe/监听核对本轮收态，确认原日常Chrome仍在；不按名称批量杀或强杀Job。若仍残留先留证，无法安全收态报告具体阻碍。仅恢复本轮实际变更，不删旧资源、新登录配置/会话或失败原件。不追加第二个Desktop/C/D、长时/RDP、证书信任、慢读取消、UI/B1、G6/Function/run_code/BOM/CSV。
8. 只用https://192.168.50.129，保持正式0.2.0不替换、不升级、不部署安全回补或EE。保留数据配置、个人应用和全局环境；P1不访问平台，P2仅auth/列网必要范围。浏览器信任不满足就blocked，不越过证书警告/自行导入CA。没有全量数据摘要时不宣称平台所有数据已核验未变。
9. P1/P2各列PASS/FAIL/BLOCKED/NOT_RUN，回传固定完整commit与各输入完整SHA、实际版本、脱敏报告主要内容、报告绝对路径/完整SHA、关键证据绝对路径/完整SHA、原始错误、未知及收态。输出都在kit外；秘密扫描后只回传脱敏文件内容，私有原始日志留Windows。不推送结果、不跑CI、不开PR/标签/发布。

本轮local-development-preacceptance，ciRun=null，formalAcceptanceEligible=false。完整验收合同、安全/低权限/CE非空/旧销售/最终固定CI门槛继续开放。需要用户确认窗口或完成真实登录时说明具体交互和原因，不能把等待当作已确认。
