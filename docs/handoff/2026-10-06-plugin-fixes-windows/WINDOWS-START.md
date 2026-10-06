# Windows -7 补充验收：从远端获取最新代码与固定包

> 请从 https://github.com/openbkn-ai/bkn-dsh 的 `fix/diagnostics-d0-s2` 分支取得本次交付，记录实际获取的 Git HEAD。先按本文件解压并核验 ZIP，再读包内 `FIXES.md`、`HANDOFF.md`、`REGRESSION.md` 与 `RESULTS.template.md`。本轮先验收 F01（来源网络）、F02（未知故障提示）及 U1d（-6→-7），再跑 Windows 原生 pwsh、官方 Desktop 与官方 npm DSH 的 W0–W12、R1–R9/U1；具备真实模型/平台条件时完成 G6 与 live guard。只安装 ZIP 内固定 CI 包，不重建候选、不用 WSL、不修改宿主、不启 inspector、不改 main、不合并、不发布、不打 tag。你不是唯一开发者，保留其他人的改动。使用隔离 profile/CLI store，保护原用户进程与凭据；缺真实受限账号记 not-run。回传本机逐项结果、脱敏证据、实际下载路径、脚本修正 diff 与清理记录，不能继承 Mac 的通过标记。

## 固定交付身份

| 项目 | 值 |
|---|---|
| 分支 | `fix/diagnostics-d0-s2` |
| 包源码 | `e972d319f19e2094740ac12da45684e3ba890e37` |
| 候选 | `0.2.0-rc.2-openbkn.0.2.0-7` |
| build-only CI | [37407894581](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37407894581)，`publish=false`，成功 |
| tgz SHA-256 | `44ca22708d243c5825774b7385de3f8699a51cad04d36477d8755201cf9af424` |
| tgz 内容 | 163,496 字节 / 65 文件 |
| 完整 ZIP | `assets/windows-diag7-e972d31.zip`，6,818,162 字节 / 172 文件 |
| ZIP SHA-256 | `edfb2296d613a04b042332a1b844ae22d97df07a5d99e931ae089552df48d633` |
| 升级基包 | 固定 `-4/-5/-6`，仅用于升级 |

代码、交接文档与 ZIP 均提交在同一功能分支；文档交付 HEAD 与包源码 commit 分别记录。原 -6 交接保留为历史，当前安装与本轮修复验收用 -7。机器可读身份见 [REMOTE-KIT.json](REMOTE-KIT.json)。ZIP 在 Git 中，不依赖 Actions artifact 保存期限。

## 原生 PowerShell 获取

使用全新路径。若目录已存在，选择其他路径；不要切换带用户修改的 checkout。已安装 Git、符合 manifest 的 Node 与原生 PowerShell；本段不启动 Host 或登录。

```powershell
$ErrorActionPreference = 'Stop'
$DiagCheckout = 'C:\bkn-verify\diag7-source'
$DiagKitRoot = 'C:\bkn-verify\diag7-kit'
foreach ($DiagFreshPath in @($DiagCheckout, $DiagKitRoot)) {
  if (Test-Path -LiteralPath $DiagFreshPath) { throw "Choose a fresh path: $DiagFreshPath" }
}
New-Item -ItemType Directory -Force -Path 'C:\bkn-verify' | Out-Null
git clone --branch fix/diagnostics-d0-s2 --single-branch https://github.com/openbkn-ai/bkn-dsh.git $DiagCheckout
if ($LASTEXITCODE -ne 0) { throw 'Git clone failed' }
# 主开发若给出交付 commit，在新 checkout 执行 git checkout --detach <交付 commit>。
$DiagFetchedCommit = (git -C $DiagCheckout rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Cannot read fetched commit' }
$DiagHandoffRoot = Join-Path $DiagCheckout 'docs/handoff/2026-10-06-plugin-fixes-windows'
$DiagZip = Join-Path $DiagHandoffRoot 'assets/windows-diag7-e972d31.zip'
$DiagExpectedZipSha = 'edfb2296d613a04b042332a1b844ae22d97df07a5d99e931ae089552df48d633'
if ((Get-FileHash -LiteralPath $DiagZip -Algorithm SHA256).Hash.ToLowerInvariant() -ne $DiagExpectedZipSha) {
  throw 'Remote ZIP SHA-256 differs'
}
Expand-Archive -LiteralPath $DiagZip -DestinationPath $DiagKitRoot
& (Join-Path $DiagKitRoot 'verify-kit.ps1') -KitRoot $DiagKitRoot
if (-not $?) { throw 'Kit verification failed' }
Write-Host "Fetched delivery HEAD: $DiagFetchedCommit"
Write-Host "Verified kit: $DiagKitRoot"
```

也可从已固定交付 commit 的 GitHub 文件页下载 ZIP 原件；仍须核对 SHA，不重新打包或替换其中 tgz。`verify-kit.ps1` 检查 kit/hash、候选/三份历史包及 65 个文件，并用原生 PowerShell 解析 helpers；该静态通过不代替真实 Windows 运行。本机 macOS 无 pwsh，未声称执行过该脚本。

## 顺序、回报与限制

1. 核验输入/环境，记录 Windows/PowerShell/Node/pnpm、官方 Desktop/npm DSH 与 CLI 0.1.5、各服务和真实 tools/list；两形态分开。
2. 原生脚本解析、W0/W1；W2–W4/W10 的入口隔离；追加 F01/F02 与 U1d。若新 profile 准备失败，按 HANDOFF 保存准备偏差，官方 App 初始化本轮 profile 后调整 helper，附 diff，不能触碰原 profile。
3. 完整 W/R/U 矩阵，真实 G6、真实 ToolRuntime live guard；无模型/数据/真实受限账号时相应项 not-run。冻结 missing-object 规则不改，当前 Mac Q01 0/5 和历史 G6 7/10 不能用别的问题答对回填。
4. 按 RESULTS.template 分别写 Desktop/npm pass/fail/not-run、证据级别、报告编号/实际保存路径/SHA、变体身份与撤销恢复。只清理本轮核实身份的进程/profile，不回传 Key/Token/原始日志或整个 profile。

本轮 Mac 只完成 -7 受影响验收；U01 未复现历史启动异常，根因仍未知；U02 只证实手动续期恢复，未实现自动续期；Q01 仍失败。参见 [MAC-ACCEPTANCE.md](MAC-ACCEPTANCE.md)。Windows 和完整发布门禁尚未通过；候选不是 npm 已发布版本。故障用户机器取诊断另按 CUSTOMER-DIAGNOSIS.md，原机根因不能由本机受控故障替代。
