# Final round owned-PID 全表（2026-10-07 晨）

## desktop（exe=…\Programs\DeepSeek Harness\DeepSeek Harness.exe；记录 pid:creationTicks）
| 轮次 | pid:ticks（尾8位） | 停止与存档 |
|---|---|---|
| A1 W4 故障 | 22548:…257440 | 随 A1-RECOVER 前置 cleanup 停止（全量原生输出已存 a1-desktop-RECOVER-*-cleanup-before.txt） |
| A1 恢复 | 19240:…267570 | A2 卸载后身份核验停止（exe 路径匹配，输出在会话+脚本记录） |
| A2 新 Host | 8892（pid+ticks 已存 A2-desktop-newhost.pid） | A3 身份核验停止（"A3 stop desktop app pid 8892 (exe path verified)"） |

## npm（web 子进程=node.exe，cmdline 含 diag6-tools…bin.js + ' web '；记录 pid:port:ticks）
| 轮次 | 端口 | child | 停止与存档 |
|---|---|---|---|
| A1 W4 故障 | 18301 | 10668（记录已存 a1-npm-W4-*-children.pid.txt） | 随 A1-RECOVER 前置 cleanup 停止（原生输出 a1-npm-RECOVER-*-cleanup-before.txt） |
| A1 恢复 | 18302 | 10256（同上存档） | A2 端口监听者身份核验停止（脚本输出） |
| A2 新 Host | 18303 | 3396（A2-npm-newhost.children.pid） | A3 "A3 stop web child 3396 (listener verified, port 18303)" |

## 终态
final-residual-check.json：node=0、DSH app=0、18267-18310 监听=0；用户 ~/.dsh/profiles 仅 desktop,work。

## 本轮执行偏差（如实）
1. ZCode 宿主进程在 A1 期间重启（13788→2384）：此前可用的保存对话框机制失效，npm 侧两个 UI 导出文件延迟落盘（05:54/05:51 时间戳晚于点击时刻），已回收为 UIexport-*.json；期间 A1 npm 恢复态以 Host API（openbknDiagnostics/getReport，标准 launch-token 认证）先行取证 A1-npm-recovered-53df4e9b.json——API 与 UI 双证一致（business pass）。
2. 无 helper 改动（kit 零 diff 维持）；上述为执行环境偏差，非 kit/候选偏差。
