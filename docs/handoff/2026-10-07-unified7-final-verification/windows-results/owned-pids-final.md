# Final round owned-PID 全表（2026-10-07 晨；同日修正版）

## desktop（exe=…\Programs\DeepSeek Harness\DeepSeek Harness.exe；记录 pid:creationTicks）
| 轮次 | pid:ticks（尾8位） | 停止与存档 |
|---|---|---|
| A1 W4 故障 | 22548:…257440 | 随 A1-RECOVER 前置 cleanup 停止；pid 原件 a1-desktop-W4-043505-W4-desktop.pid.txt。cleanup 原生采集仅含 pnpm 重装输出（313B），停止/身份行未留存（见下"留存状态"） |
| A1 恢复 | 19240:…267570 | A2 卸载后身份核验停止（exe 路径匹配）；pid 原件 a1-desktop-RECOVER-043559-W1-desktop.pid.txt。停止行原生日志未留存 → insufficient-evidence |
| A2 新 Host | 8892:…6101370 | A3 身份核验停止；**pid 原件 A2-desktop-newhost.pid 已随修正提交入库**。停止行原生日志未留存 → insufficient-evidence |

## npm（web 子进程=node.exe，cmdline 含 diag6-tools…bin.js + ' web '；记录 pid:port:ticks）
| 轮次 | 端口 | child | 停止与存档 |
|---|---|---|---|
| A1 W4 故障 | 18301 | 10668:…870462 | 随 A1-RECOVER 前置 cleanup 停止；pid 原件 a1-npm-W4-043725-W4-npm.pid.txt + children。cleanup 原生采集仅含 pnpm 输出（312B），停止/身份行未留存 |
| A1 恢复 | 18302 | 10256 | A2 端口监听者身份核验停止；pid 原件 a1-npm-RECOVER-044616-W1-npm.pid.txt + children。停止行原生日志未留存 → insufficient-evidence |
| A2 新 Host | 18303 | 3396:…432543 | A3 监听者身份核验停止；**children pid 原件 A2-npm-newhost.children.pid 已随修正提交入库**。停止行原生日志未留存 → insufficient-evidence |

## 停止动作原生日志留存状态（修正如实标注）

- 已留存：各轮 pid/children pid 原件（含 creationTicks）；final-residual-check.json
  的终态零残留（node=0、DSH app=0、端口监听=0）；A1 各 cleanup 的 pnpm 重装输出。
- 未留存（insufficient-evidence，不作追溯补造）：cleanup.ps1 与 A2/A3 停止动作的
  Write-Host 身份/停止控制台行。根因：外层证据脚本沿用交接示例的 `2>&1`，在
  PowerShell 5.1 下不捕获 Information 流（Write-Host）。已核对 ZCode 会话执行日志
  亦无这些行，无法回收。修正后外层脚本一律 `*>&1`（corr1-verify-kit-native 重采
  已验证可捕获；B 批起所有外层脚本同样修正）。
- pid 原件与零残留终态足以证明"记录了谁、终态干净"；但"停止瞬间执行了五重身份
  核验"这一过程性断言降级为会话记录引用，不再声称有原生日志。

## 终态
final-residual-check.json：node=0、DSH app=0、18267-18310 监听=0；用户 ~/.dsh/profiles 仅 desktop,work。

## 本轮执行偏差（如实）
1. A1 期间观察到 ZCode 宿主进程重启（13788→2384），此后保存对话框机制失效，npm 侧两个 UI 导出文件落盘时间（20:54/20:55Z）晚于点击时刻，已回收为 UIexport-*.json。**下载延迟与 ZCode 重启的因果关系未证实**，仅记录时间顺序观察；期间 A1 npm 恢复态先以 Host API（openbknDiagnostics/getReport，标准 launch-token 认证）取证 A1-npm-recovered-53df4e9b.json，其后 UI 恢复可用时补采。API 与 UI 证据的 business 判定一致，**不宣称字节一致**（1854/1850/1852 字节互不相同）。
2. 无 helper 改动（kit 零 diff 维持）；上述为执行环境偏差，非 kit/候选偏差。
