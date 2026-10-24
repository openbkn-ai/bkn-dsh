# r3 最小复验：先 P1，再有条件做 P2

固定本次独立分支及主会话提供的完整提交。原 -30/helper/SDK 不变；KIT 摘要以本次交付 README 为准，本地准备快照的82d1b74c…bc936不用于远端取件校验。

## P1：只跑一次系统 PowerShell5.1 官方 argv 回归

r2 原 helper 的 A/B InitializeOnly/正常启动按 Windows 报告通过，不重跑。r2 官方回归的失败来自 PS5.1 ConvertFrom-Json 输出的非枚举数组对象：外层@(...)形成单元素数组。本次仅改为@((...))。原 fail 和诊断副本 pass 各保留原身份。

在已核对 Node24.19.0、KIT/候选/helper 后执行：

```powershell
powershell.exe -NoLogo -NoProfile -File (Join-Path $taskKit 'test-desktop-launcher-argv.ps1') -Launcher (Join-Path $taskKit 'start-owned-desktop.ps1') -NodeExe (Get-Command node.exe).Source
if($LASTEXITCODE -ne 0){throw 'Official argv regression failed; stop dependent P2'}
```

内部两个 argv 分支只启动短命 Node sink，不执行 InitializeOnly、不启动 Desktop/CLI/浏览器、不访问平台。不要把本地 test-desktop-launcher-json-array.ps1 模拟夹具当作 Windows 官方回归。不要自动重跑 UI、B1、C/D 或 A/B 启动；P1 失败即保存原错并报告。

本机 PS7 普通/PS5.1输出合同模拟均通过，旧回归模拟失败、额外实际参数负例仍被拒绝；这些不是 Windows5.1 原生通过。

## P2 前提：用户确认日常 Chrome 已打开

P1通过后，先请用户从平常入口打开或确认其日常Chrome窗口。记录那个可见窗口对应PID/创建时间、exe及必要父链元数据，明确用户确认的是哪个窗口。不要求新根：日常窗口可能复用已有根。单独看到Chrome根、默认快捷方式或进程在某个Job不能确认条件。

54508 曾被误认为默认Chrome，判断已撤回；不能再拿它作已确认基准。不得读取/改动另一个会话的Chrome、-11、.playwright-mcp、浏览器配置或标签页。无法区分时将P2写blocked，不能关闭其他浏览器造条件。

## P2：只选一个 Desktop，一次成功登录

优先选择已验证且可复用的A旧Desktop；不可用时选择B并说明理由。核对原隔离应用、任务profile/-30和独立CLI配置的身份，保存所选任务配置存在性/摘要。不得使用个人全局CLI或复制个人token，不重装、改依赖、改profile、重跑InitializeOnly或启动双版本矩阵；条件缺失报告blocked。启动所选应用时只用本次未经修改的start-owned-desktop.ps1，Evidence写新目录；这是单次登录取证准备，不是重做启动验收。

在用户确认日常窗口仍开着后，采集登录前、过程中、直接CLI退出后约60–80秒、正常Host退出后的只读时间线。只做一次原生UI正常成功登录，不故意重测取消/超时；遇到真实超时保留，必要重试需说明。保存Host/后端/runner/cmd/CLI、原日常Chrome根及登录新树的PID/PPID/UTC创建时间/进程名/exe、窗口存活及已知任务监听。说明采样频率、短命进程覆盖和PID复用限制；只复用现成安全元数据采样，不安装或提权取证，不读取完整命令行/环境/设备URL，不向Host注入。

r1 -30曾报告成功登录runner残留到Host退出；r2 A/B在60–80秒内无残留，但登录新Chrome树与runner在同次约370ms采样消失。二者并列保留；无残留不能称runner已修复。新增条件是已确认的日常Chrome已运行，报告该窗口/根是否继续存活，是否有新登录树及关闭时间；同采样消失不强行判先后。

IsProcessInJob(NULL)只说明在某个Job，PPID图不是Job成员列表。若没有现成、经过核验、不会改变生命周期的只读成员/事件证明，Job身份、关闭顺序和原因均未知。不可复制/长期持有Job句柄，不强杀Job/个人Chrome，不给生产代码加登录成功后terminate。

源码中首结果return/dispose与未消费terminal时的stream cancel只是候选机制；本机受控函数夹具没有执行原生Remote、Windows Job或浏览器。服务端可能已完成并移除流，不得据此断定浏览器被Job杀死。本轮不改生产登录流、SDK、Host或-30。需要代码修复时另议候选。

最后通过菜单正常退出所选Desktop，核对本轮拥有的进程/监听及原日常Chrome仍在；不扩展C/D、第二个Desktop、UI、B1、RDP、证书导入或业务。无法安全收态就留证并报告具体阻碍。只恢复本轮实际变更，保留旧资源、新登录配置/会话及所有原始失败。

## 回传

P1与P2独立给PASS/FAIL/BLOCKED/NOT_RUN；P2还区分runner、原日常窗口/根、登录新树、顺序/Job证据。回传固定commit/KIT/脚本/helper/候选完整SHA、实际PowerShell/Node/所选Host版本、证据路径/完整SHA、脱敏报告正文与路径/完整SHA、限制和收态。报告进行秘密扫描，原始日志仅留Windows。不推送、不跑CI、不换正式0.2.0，数据配置保留；完整合同未通过。
