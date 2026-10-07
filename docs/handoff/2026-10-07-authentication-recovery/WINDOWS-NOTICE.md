# Windows 复测通知：统一 -7 鉴权恢复固定包

把本页交给 Windows agent；读取解压后 windows-kit/HANDOFF.md，先采新的日常文件 before 哈希，再核验与执行。**正式发布仍未授权。**

| 身份 | 固定值 |
|---|---|
| 源码（PR #76 最终 head 独立批准后合入） | `c91fe090e0aac2dc72a4ff1b3d221d72baa432ba` |
| CI（build-only，publish=false） | [37570295456](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37570295456) |
| 版本串 | `0.2.0-rc.2-openbkn.0.2.0-7`（未发布） |
| tgz SHA-256 | `fa168d8113e8dd43348ea4751c7e4d297049e2c1ddced9c586e6d3a1f3f0718c` |
| tgz 字节/文件 | `165804` bytes / `65` files |
| Kit 内容固定提交 | `fbf7829217f5bede54d7b9e58ce833a201d196b8` |
| Kit ZIP SHA-256 | `e3d0e59e450f5a3d048812ab8ee65ca213caa1791b072e71cc24c0a72cd35134` |
| Kit ZIP 字节/成员文件 | `223708` bytes / `26` files |

[固定 ZIP 下载](https://raw.githubusercontent.com/openbkn-ai/bkn-dsh/fbf7829217f5bede54d7b9e58ce833a201d196b8/docs/handoff/2026-10-07-authentication-recovery/assets/windows-unified7-c91fe09-authentication-recovery.zip)。不是 CI artifact ZIP，下载后必须比较上表 ZIP SHA/字节，解压后的 verifier 再核对 kit/tgz/65 文件。

```powershell
$ErrorActionPreference = 'Stop'
$AuthDeliveryZip = 'C:\bkn-verify\windows-unified7-c91fe09-authentication-recovery.zip'
$AuthDeliveryRoot = 'C:\bkn-verify\unified7-c91fe09-authentication-recovery'
# Stop if these target paths contain a previous run; select another new path.
if ((Test-Path -LiteralPath $AuthDeliveryZip) -or (Test-Path -LiteralPath $AuthDeliveryRoot)) { throw 'Choose fresh delivery paths; do not overwrite evidence' }
Invoke-WebRequest -UseBasicParsing -Uri 'https://raw.githubusercontent.com/openbkn-ai/bkn-dsh/fbf7829217f5bede54d7b9e58ce833a201d196b8/docs/handoff/2026-10-07-authentication-recovery/assets/windows-unified7-c91fe09-authentication-recovery.zip' -OutFile $AuthDeliveryZip
if ((Get-Item -LiteralPath $AuthDeliveryZip).Length -ne 223708) { throw 'ZIP byte length differs' }
if ((Get-FileHash -LiteralPath $AuthDeliveryZip -Algorithm SHA256).Hash -ne 'e3d0e59e450f5a3d048812ab8ee65ca213caa1791b072e71cc24c0a72cd35134') { throw 'ZIP SHA differs' }
Expand-Archive -LiteralPath $AuthDeliveryZip -DestinationPath $AuthDeliveryRoot
Set-Location (Join-Path $AuthDeliveryRoot 'windows-kit')
# Read HANDOFF.md completely. Its NativeKit=(Get-Location).Path examples
# require this exact working directory. Begin with the BEFORE hashes.
```

**执行顺序：采 before → N0 安装身份 → 优先 R1 → N1–N3 与有条件的 N4/N5 → N6 最终收态。E1 在不依赖 Host 的时段处理。** 两形态分别取 prepared.json 设置 DSH_HOME/BKN_CONFIG_DIR，不共用 token/store；全卸载重装固定 tgz，不做旧版本升级，不改候选/main、发布/tag/dist-tag。四个既有 helper 与 Windows-tested 54f6669 字节相同；新 identity verifier/八场景 probe/鉴权 fixture 需本机验证。PowerShell 全流 `*>&1` 留真实内容、退出码；不上传原 Host/授权日志、凭据或 profile。

R1 是明确 MCP401 的**产品 CLI 登录恢复**，不是自然过期/自动续期验收：原 store 保留，公开无效 token 只在 wrapper 返回边界注入；仅真实 CLI login exit 0 清 fault。初次授权失败/超时照实保留，不能手工清 flag 造通过；成功后同 Host 诊断恢复、原 patch 精确字节还原、owned PID/真实端口完整收态。fixture 会拒绝 unset/另一形态 BKN_CONFIG_DIR。无需模型。

E1 完整内容在 kit 的 WINDOWS-OLD-EVIDENCE-REVIEW.md：旧 09018fa 的 dshApps=6 与 8 小时 ticks 偏差、A-only 37 记录/34 唯一路径哈希、npm 复制 store、缺源 Markdown、属性 operation 独立回执和陈旧汇总措辞逐项补正。找不到历史原件则 insufficient-evidence；当下零残留不改写旧时点。

Mac 已接受**本固定 CI 包的受影响范围**：65/65、真实 401 产品授权同 Host 恢复、TLS/原配置健康、四份 UI 下载、8 fixture、16 direct live guard。前一原生输出候选的五题结果单列：完整 BOM 全量覆盖和无匹配夹带统计仍失败，鉴权修复没有宣布模型质量改善。Windows 本包尚未接受。

在独立 docs 分支填 RESULTS.template.md 后提交/push，回传固定 commit、报告导航、每份下载原件 SHA/Git 字节核对、实际进程/profile/端口与全部缺口。不以旧包、mock/model fixture、API 件代替本机产品 UI 原件；没有本人授权/模型的项 not-run。真实受限账号按用户决定保持未测。
