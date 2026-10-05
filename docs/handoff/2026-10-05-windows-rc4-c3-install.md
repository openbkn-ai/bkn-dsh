# Windows C3：新发布 npm 包的严格发布时间策略

主开发已获用户授权执行 -4 发布。本任务只验证安装行为，不启动 DSH UI、模型或 OpenBKN 登录，不重跑 W4／R1–R9。不要发布、打 tag、合并、移动 npm dist-tag 或改动 main／release 分支。主开发在收到结果并核对之前保留 npm latest=-3。

## 固定输入

- 源码／发布提交：`a134f5d573e11846bb6665d1c170510149d09d4d`（PR #60 squash）。
- npm spec：`@openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-4`。
- tag：`v0.2.0-rc.2-openbkn.0.2.0-4`。
- GitHub Release：https://github.com/openbkn-ai/bkn-dsh/releases/tag/v0.2.0-rc.2-openbkn.0.2.0-4。
- 正式 npm／Release tarball SHA-256：`53ce847b8d884ba7f1cb43048b5e60380c0c297142671a2b9d0abbea9692a013`；52 个文件，tree-hash `cea1c64149ca947503be79db24b0929edd823466bbe35fa4960aa36dc00e79ff`。它与原候选仅允许 package.json 键顺序／格式不同，主开发负责核对。
- 宿主：复用上轮已验证的官方 npm DSH `0.2.0-rc.2`、Node `24.21.0`、pnpm `11.7.0`；不用源码／兼容补丁 runtime。若版本不同先记录，不自动升级。

## C3-1. 隔离准备与年龄检查

使用新的空目录；以下是示例根目录，只能替换成用户授权的本轮独立目录。先记录原用户五个已选状态文件的 hash，不复制凭据或读取其正文。将以下环境变更限制在独立 PowerShell 进程，不使用 setx，不改全局或原 profile 的配置。

```powershell
$Spec = '@openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-4'
$Version = '0.2.0-rc.2-openbkn.0.2.0-4'
$Tag = "v$Version"
$Root = 'C:/Users/kalia/bkn-verify/rc4-c3'
if (Test-Path $Root) { throw 'Use a fresh directory; do not overwrite earlier evidence' }
New-Item -ItemType Directory -Path $Root | Out-Null
$env:DSH_HOME = Join-Path $Root 'dsh-home'
$Profile = Join-Path $env:DSH_HOME 'profiles/web'
dsh --version
node --version
pnpm --version
```

核实这些命令解析到上轮官方 npm 安装，不用 npx 自动抓最新版。若 npm dsh 不在 PATH，显式调用上轮同一个 dsh.cmd。先只读获取发布时间：

```powershell
$Meta = Invoke-RestMethod 'https://registry.npmjs.org/@openbkn%2fdsh-business-context'
$PublishedAt = [DateTimeOffset]::Parse($Meta.time.$Version)
$AgeMinutes = ([DateTimeOffset]::UtcNow - $PublishedAt).TotalMinutes
"publishedAt=$PublishedAt; ageMinutes=$AgeMinutes"
if ($AgeMinutes -lt 0 -or $AgeMinutes -ge 1440) { throw 'This run cannot test the intended first-24-hour window' }
dsh plugin --profile web list
if ($LASTEXITCODE -ne 0) { throw 'Profile initialization failed' }
```

记录 DSH 自动生成的初始 package.json、cordis.patch.yml 和 pnpm-workspace.yaml（本隔离 profile 无密钥）。若 profile 已包含依赖、例外或原用户配置，停止并检查隔离路径。初始化后设置以下测试配置；只替换这个新 profile 的工作区文件，保留 DSH 所需 linker／peer 设置：

```powershell
@'
packages:
  - .
nodeLinker: hoisted
autoInstallPeers: false
minimumReleaseAge: 1440
minimumReleaseAgeStrict: true
'@ | Set-Content (Join-Path $Profile 'pnpm-workspace.yaml') -Encoding utf8
pnpm --dir $Profile config get minimumReleaseAge
pnpm --dir $Profile config get minimumReleaseAgeStrict
pnpm --dir $Profile config get minimumReleaseAgeExclude
```

前两项应是 1440 和 true；最后一项不得包含 -4、@openbkn/dsh-business-context 或通配放行。若有效配置不符，不执行安装，记录影响配置来源（只读取相关键，不能输出全部 npm／环境配置）。不要通过 age=0、strict=false 或预加排除项规避测试。

## C3-2. 一次真实安装

优先在真实交互式 PowerShell 终端运行下列命令。不要重定向或 Tee 输出来假装它仍是 TTY；记录实际 TTY／非 TTY、命令、开始时间和退出码。遇到确认由用户决定，不替用户接受；记录确认内容，不把拒绝／取消写成安装故障。

```powershell
dsh plugin --profile web add $Spec
$InstallExit = $LASTEXITCODE
"installExit=$InstallExit"
dsh plugin --profile web list
```

无需强求第二种终端形态。若只能非 TTY，明确报告，不宣称交互提示已覆盖；若用户取消或外部中断，记录中断原因，不能冒充 pnpm 自然失败／超时。安装前后记录 package.json、pnpm-lock.yaml、pnpm-workspace.yaml、cordis.patch.yml 的存在性和内容差异（均为隔离无密钥配置），特别记录是否增加 minimumReleaseAgeExclude、是否提示、是否静默放行。检查 .plugin-manager 的相关脱敏诊断，不提交完整环境或认证配置。

结果分类：

- 若提示后经用户同意安装，记录同意后例外写入与安装结果。
- 若明确拒绝／阻止新包安装，属于可能的预期年龄策略；记录原因和退出码，不直接判插件有缺陷。
- 若有效 strict=true、包龄<1440，却无提示静默放行或写入例外，列为异常交主开发判断，不自行修复。
- 若网络、registry、宿主或其他错误阻止进入年龄策略，C3 未验证，不把普通安装失败当年龄拦截。

## C3-3. 成功安装后的内容核验

仅在安装成功时执行。下载的是正式 Release 资产，不通过本地 tgz 安装；这样不会绕过 C3。

```powershell
$Assets = Join-Path $Root 'published'
New-Item -ItemType Directory -Path $Assets | Out-Null
gh release download $Tag --repo openbkn-ai/bkn-dsh --pattern '*.tgz' --pattern '*.sha256' --dir $Assets
if ($LASTEXITCODE -ne 0) { throw 'Release asset download failed' }
$Tgz = Join-Path $Assets "openbkn-dsh-business-context-$Version.tgz"
$Digest = (Get-FileHash $Tgz -Algorithm SHA256).Hash.ToLowerInvariant()
if ($Digest -ne '53ce847b8d884ba7f1cb43048b5e60380c0c297142671a2b9d0abbea9692a013') { throw 'Published tarball SHA-256 mismatch' }
tar -xzf $Tgz -C $Assets
if ($LASTEXITCODE -ne 0) { throw 'Published tarball unpack failed' }
$Installed = Join-Path $Profile 'node_modules/@openbkn/dsh-business-context'
$env:C3_EXPECTED = Join-Path $Assets 'package'
$env:C3_INSTALLED = $Installed
@'
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
function inventory(root, rel = '') {
  return fs.readdirSync(path.join(root, rel), {withFileTypes: true}).flatMap(e => {
    if (e.name === 'node_modules') return [];
    const r = path.join(rel, e.name);
    if (e.isDirectory()) return inventory(root, r);
    if (!e.isFile()) throw new Error('Unexpected package entry: ' + r);
    return [r.replaceAll('\\', '/')];
  }).sort();
}
const expected = inventory(process.env.C3_EXPECTED), installed = inventory(process.env.C3_INSTALLED);
const sameNames = JSON.stringify(expected) === JSON.stringify(installed);
const differences = expected.filter(r => !fs.existsSync(path.join(process.env.C3_INSTALLED, r)) || !fs.readFileSync(path.join(process.env.C3_EXPECTED, r)).equals(fs.readFileSync(path.join(process.env.C3_INSTALLED, r))));
const lines = expected.map(r => crypto.createHash('sha256').update(fs.readFileSync(path.join(process.env.C3_EXPECTED, r))).digest('hex') + '  ' + r + '\n').join('');
console.log(JSON.stringify({expectedFiles: expected.length, installedFiles: installed.length, sameNames, differences, treeHash: crypto.createHash('sha256').update(lines).digest('hex')}, null, 2));
if (expected.length !== 52 || !sameNames || differences.length) process.exitCode = 1;
'@ | node
if ($LASTEXITCODE -ne 0) { throw 'Installed content differs from published package' }
```

比较预期：52 文件、无缺失／增添、逐字节相同；tree-hash 应是上面的正式发布值。只证明安装内容，不声称 UI 登录／模型运行重新验收。

## 清理与回传

成功安装后先执行 `dsh plugin --profile web remove @openbkn/dsh-business-context`，记录退出码并用 list 确认移除。未装成功时先确认隔离 profile 没有目标包，不把 `remove` 的普通提示写成异常。退出独立 PowerShell，保留本轮无密钥实验目录与脱敏日志供主开发复核，不删除用户目录。再次核对原用户五个已选状态文件 hash；仍不把五个文件不变扩大为整目录没变化。

从固定源码提交建独立 worktree／分支 `docs/windows-rc4-c3-install-results`，仅提交 `docs/handoff/2026-10-05-windows-rc4-c3-install-results.md` 并推送。用户将提交 SHA 发给主开发；不能向 main／release 推送。

报告包含：真实 OS/宿主/Node/pnpm 基线、包发布时间与实际测试包龄、有效三个年龄策略键、终端形态、完整命令及退出码、提示及用户选择、是否写入例外、安装内容核验、异常／未测项／清理与原用户已选文件 hash。不得包含 Token、授权码、模型密钥或全量环境配置。主开发收到结果后决定安装说明是否需要补充，并在全部发布核验完成后移动 npm latest。
