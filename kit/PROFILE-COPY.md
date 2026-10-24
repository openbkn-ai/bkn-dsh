# -31 安装到新任务副本（不原地升降 -30）

前提：Windows自行从旧报告核实 A/B 的任务 exe、DSH_HOME、独立 BKN_CONFIG_DIR；只允许已验收隔离任务 home，绝不选日常 profile。两个 Desktop 完全退出且无 owned 后端写入。生命周期先用原 -30 做完或明确 BLOCKED，随后才准备 UI31。不要复制日常 token 或安装/升级 DSH。下列 `$task...` 必须用本机已核实路径赋值，不能猜路径。

用本轮 Node24.19.0 执行（每个 A/B 各自不同新目录，父目录先建立，Evidence/receipt 保持 kit外）：

```powershell
# $taskKit = 固定提交下的 kit 绝对目录；$taskOldHome = 此组合既有已离线任务home
# $taskNewHome = 本轮新的ui31-home；$taskReceipt = 新的证据目录下copy-private.json
# $taskNode = 既有任务Node24.19.0绝对路径
& $taskNode (Join-Path $taskKit 'clone-task-home.mjs') --source $taskOldHome --destination $taskNewHome --receipt $taskReceipt --task-owned
if ($LASTEXITCODE -ne 0) { throw 'Task copy failed; retain evidence and stop' }
```

该工具先验证任务 Desktop profile/-30版本，拒绝目标已存在、嵌套、非依赖符号链接/特殊文件；只复制数据/配置，跳过全部 node_modules，逐文件核对副本和原文件摘要。不会清理失败副本。receipt 含私有路径/摘要，仅本机。它不能证明源已停止或系任务目录，调用者必须先核实。锁文件保留；复制后的副本完全独立，不手工替换原 node_modules。可恢复方式就是保留原 home不动，停止并保留副本；不用把旧 home覆盖回去，不删除新 Session/Interaction。

用各自已经提取并核验的官方 Desktop 附带 CLI，只在新副本安装 -31：

```powershell
# $taskExe = 该组合已核验的 DeepSeek Harness.exe；$taskCliConfig = 该组合既有独立CLI配置
$taskDshCmd = Join-Path (Split-Path -Parent $taskExe) 'resources\runtime\cli\bin\dsh.cmd'
if (-not (Test-Path -LiteralPath $taskDshCmd)) { throw 'Official bundled CLI missing; BLOCKED, do not substitute global dsh' }
$taskNames = @('DSH_HOME','BKN_CONFIG_DIR','NODE_EXTRA_CA_CERTS')
$taskBefore = @{}
foreach ($taskName in $taskNames) { $taskBefore[$taskName] = [Environment]::GetEnvironmentVariable($taskName,'Process') }
try {
    $env:DSH_HOME = $taskNewHome
    $env:BKN_CONFIG_DIR = $taskCliConfig
    $env:NODE_EXTRA_CA_CERTS = Join-Path $taskKit 'ui31\openbkn-local-ca.pem'
    & $taskDshCmd plugin --profile desktop add ('file:' + (Join-Path $taskKit 'ui31\candidate\openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-31.tgz'))
    if ($LASTEXITCODE -ne 0) { throw 'Official task-profile install failed; retain private log and stop' }
} finally {
    foreach ($taskName in $taskNames) { [Environment]::SetEnvironmentVariable($taskName,$taskBefore[$taskName],'Process') }
}
```

安装日志含机器路径，只本地私有保存。不要运行 prepare-npm-runtime、更新 Host/SDK、允许不兼容版本或套入 -11。核对复制清单中数据/patch仍相同；profile package.json/pnpm-lock 仅允许候选依赖替换及必要的同版本解析变化。若升级 DSH/core/SDK、丢绑定/数据、出现未解释依赖差异，就该组合 BLOCKED，保留副本、不改原 home。

再用 `ui31/start-owned-desktop.ps1`（与 r3 原 helper 字节相同）传 `$taskExe`、`$taskNewHome`、原独立CLI配置、固定HostVersion和**新的 Evidence 目录**正常启动；不加 InitializeOnly 或 ReadOnlyProtocol。helper 会用官方 Electron 校验 ASAR /实际profile/82文件，再启动；这是最小身份前置检查，不展开四组合闭包回归。失败不改 helper 绕过。原工作区绑定是只读复用，禁止业务执行/改工作区文件。读插件页和实际静态资源确认加载 -31，再执行 W-UI。

本工具在 Mac临时夹具验证保护/拒绝行为；Windows复制和官方安装仍需按实际结果记录，不把本地控制检查写成Windows PASS。
