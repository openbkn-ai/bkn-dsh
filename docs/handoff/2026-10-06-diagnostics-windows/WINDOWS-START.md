# Windows 独立验收交接：远端取代码与完整测试包

Windows agent 从本文件开始。仓库源文件和完整离线 ZIP 一起交付；ZIP 内已经包含固定 CI 候选、`-4/-5` 升级基包、逐文件清单、PowerShell 脚本和回报模板，无须向 macOS 开发机索取文件。

## 可直接交给 Windows agent 的任务

> 请从 https://github.com/openbkn-ai/bkn-dsh 的 `fix/diagnostics-d0-s2` 分支取得本次交付。若主开发提供了交付 commit，固定到该 commit；不要从 main 或 npm registry 选择同名包。先按 `docs/handoff/2026-10-06-diagnostics-windows/WINDOWS-START.md` 解压并核验完整 ZIP，再读包内 `HANDOFF.md`、`REGRESSION.md` 和 `RESULTS.template.md`。在 Windows 原生 PowerShell、官方 Desktop 和官方 npm DSH 0.2.0-rc.2 两种形态完成 W0–W12、R1–R9/U1；有真实模型及平台输入时执行 G6 和 live guard。先做原生脚本解析、W0/W1 和 W2–W4 核心入口测试。只安装 ZIP 内 SHA 固定的 CI 候选，不重建候选或改宿主，不使用 WSL、inspector，不改 main，不发布、不打 tag。你不是唯一开发者，保留其他人的改动。测试使用独立 profile/CLI store，保护原用户进程与凭据；缺真实受限账号的项目记 not-run。回传本机独立评分、脱敏证据、实际下载路径、版本/包身份、脚本修正 diff 和清理结果。

## 固定交付身份

| 项目 | 值 |
|---|---|
| 仓库 / 分支 | `openbkn-ai/bkn-dsh` / `fix/diagnostics-d0-s2` |
| 包源码 commit | `144afa503c7d4746cbef01f74eaceff293b88cb5` |
| 已包含的 G6/评分器提交 | `bbb67daea8b30e8dcb6315f678e4f8645daff0cc` |
| 候选版本 | `0.2.0-rc.2-openbkn.0.2.0-6` |
| build-only CI | [37337765993](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37337765993)，`publish=false` |
| 候选 tgz SHA-256 | `ffcd77722e83a003fe90e0dda296a3a49c3f2ba67bddda9095575dabd896ef43` |
| 候选内容 | 162,967 字节 / 65 文件 |
| 完整 ZIP | `assets/windows-diag6-144afa5-g6.zip`，1,361,937 字节 / 65 文件 |
| ZIP SHA-256 | `eac27ecf4cea5b9aba7337d0a864f86fac080a5a41e6e5f4c0c6f345251c72fd` |

交付提交随后添加文档和 ZIP，不改变包源码或候选字节。最新 Git HEAD、包源码 commit、CI run 分别记录，不能把文档提交误写成候选构建源码。机器可读获取信息见 [REMOTE-KIT.json](REMOTE-KIT.json)。

## 原生 PowerShell 获取与核验

下面使用全新的目录，不修改已有 checkout。若路径已存在，选择另一组新路径后再执行。先安装 Git、满足 manifest 的 Node 和原生 PowerShell；本段不启动 DSH、不登录。

```powershell
$ErrorActionPreference = 'Stop'
$DiagCheckout = 'C:\bkn-verify\diag6-source'
$DiagKitRoot = 'C:\bkn-verify\diag6-kit'
foreach ($DiagFreshPath in @($DiagCheckout, $DiagKitRoot)) {
  if (Test-Path -LiteralPath $DiagFreshPath) {
    throw "Choose a fresh path: $DiagFreshPath"
  }
}
New-Item -ItemType Directory -Force -Path 'C:\bkn-verify' | Out-Null
git clone --branch fix/diagnostics-d0-s2 --single-branch https://github.com/openbkn-ai/bkn-dsh.git $DiagCheckout
if ($LASTEXITCODE -ne 0) { throw 'Git clone failed' }
# 主开发若指定交付 commit，在这里 git -C $DiagCheckout checkout --detach <该 commit>。
# 将实际 HEAD 写入 Windows 结果；不要在有用户修改的 checkout 中切换。
$DiagFetchedCommit = (git -C $DiagCheckout rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Cannot read fetched commit' }
$DiagHandoffRoot = Join-Path $DiagCheckout 'docs/handoff/2026-10-06-diagnostics-windows'
$DiagZip = Join-Path $DiagHandoffRoot 'assets/windows-diag6-144afa5-g6.zip'
$DiagExpectedZipSha = 'eac27ecf4cea5b9aba7337d0a864f86fac080a5a41e6e5f4c0c6f345251c72fd'
if ((Get-FileHash -LiteralPath $DiagZip -Algorithm SHA256).Hash.ToLowerInvariant() -ne $DiagExpectedZipSha) {
  throw 'Remote kit ZIP SHA-256 differs'
}
Expand-Archive -LiteralPath $DiagZip -DestinationPath $DiagKitRoot
& (Join-Path $DiagKitRoot 'verify-kit.ps1') -KitRoot $DiagKitRoot
if (-not $?) { throw 'Kit verification failed' }
Write-Host "Fetched source HEAD: $DiagFetchedCommit"
Write-Host "Verified kit: $DiagKitRoot"
```

完整 ZIP 也可在 GitHub 当前交付 commit 的文件页点击 **Raw / Download raw file** 下载；下载后仍须核对上述 SHA。ZIP 位于 Git 仓库内，获取它不依赖 GitHub Actions artifact 的保存期限。不要对 ZIP 或内部 tgz 做换行转换、重新打包或重新构建。

`verify-kit.ps1` 核验离线清单、候选/历史 tgz、候选逐文件哈希并解析四个 helper；它通过只证明输入与静态检查通过。原生脚本执行、真实 Host、UI、故障、清理仍由 Windows agent 实测。

## 测试顺序与结果边界

1. **输入与环境**：保存实际获取 HEAD、ZIP/tgz SHA、Windows/PowerShell/Node/pnpm、Desktop/npm DSH、OpenBKN CLI 0.1.5、平台各服务及真实 `tools/list`。桌面与 npm 的安装目标、启动进程和结果分列。
2. **优先核心门槛**：先原生 PowerShell 解析和 W0/W1，再 W2–W4。UI 应为侧栏一个 OpenBKN，打开面板后右上角只有“诊断”入口；业务 import/初始化失败时该入口及报告仍可用。`W10` 验证诊断故障下业务入口保留并明确降级。
3. **完整矩阵**：按 [HANDOFF.md](HANDOFF.md) 执行 W5–W12；按 [REGRESSION.md](REGRESSION.md) 执行 R1–R9/U1、真实 G6、真实 ToolRuntime live guard。两个历史基包仅用于升级测试。原生脚本若有路径/启动问题，可修本轮 helper 并附 diff；候选源码问题留失败证据交主开发处理。
4. **回传与清理**：在测试 root 的 `evidence/` 填写 [RESULTS.template.md](RESULTS.template.md)，桌面/npm 每个子项标 pass/fail/not-run，记录下载完成绝对路径和 SHA。仅停止本轮核实过身份的 Host/子进程；保留脱敏证据与清理记录，原用户凭据和 raw private 日志不回传。

原机故障定位另见 [CUSTOMER-DIAGNOSIS.md](CUSTOMER-DIAGNOSIS.md)，本任务不替代故障用户实机报告。没有真实受限账号时 `unauthorized-network` 及对应真实权限子项记未测；可完成的受控 HTTP/传输分类另列，不替代真实平台权限验收。

当前 macOS G6 已测 10 项，**7 项通过、3 项失败，另 1 项未测**，见 [MAC-ACCEPTANCE.md](MAC-ACCEPTANCE.md)。Windows 原生 PowerShell 和 W0–W12 尚未执行；Windows 结果不能继承 macOS 的通过标记。主动复测尚未实现，按 optional/not-run 处理。发布门禁仍未通过。
