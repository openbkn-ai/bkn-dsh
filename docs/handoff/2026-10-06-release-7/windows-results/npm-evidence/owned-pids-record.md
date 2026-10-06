# 本轮 owned PID / 创建时间 / 停止结果汇总（两形态，2026-10-06 晚）

## desktop（Host = DeepSeek Harness.exe，路径 %LOCALAPPDATA%\Programs\DeepSeek Harness\DeepSeek Harness.exe；run-case 记录 pid:creationTicks）
| 轮次 | pid | 停止方式与结果 |
|---|---|---|
| W1 | 18744 | 随下一轮 cleanup 停止（记录被机制消费，原始 stop 行未单独留存；佐证=后续轮次正常+终态 app=0） |
| W2b | 29412 | 同上 |
| W2a | 8540 | 同上 |
| W2c-file | 27832 | 同上 |
| W2c-relative | 28364 | 同上 |
| W2c-recovered | 4276 | 同上 |
| W3 | 20872 | 同上 |
| W4 | 19728 | 同上 |
| W10 | 27372 | 随 W9 轮 cleanup 停止 |
| W9 | 6788 | boot.pid 记录行因脚本引号错误缺失 → **手动身份核验后停止**（ExecutablePath 与官方安装路径相等 → Stop-Process；见 RESULTS 偏差1） |
| R9 前段 | 28120 | 手动身份核验停止（step-u7-r9-verify.ps1，exe 路径匹配） |
| R9 验证 Host | 13512 | step-u7-finish 统一身份核验停止（stopped app pid 输出） |

## npm（web 子进程 = node.exe，命令行含 diag6-tools…bin.js + ' web '；记录 pid:port:creationTicks）
| 轮次 | 端口 | child pid | 停止输出/佐证 |
|---|---|---|---|
| W1 | 18271 | 628 | 随下一轮 pre-clean 停止（记录消费） |
| W2a–W2c-recovered | 18272-18276 | （记录消费） | 同上 |
| W3/W4/W10 | 18277-18279 | （记录消费） | 同上 |
| W9 | 18280 | 28864 | **原始终止输出留存**："stopping recorded npm web child pid 28864 (port 18280, listener verified)" → 复核 port 18280: free |
| R9 前段 | 18281 | 9080 | 按端口监听者身份核验停止（diag6-tools + ' web '） |
| R9 验证 Host | 18282 | 22148 | 同上（step-u7-finish："stopped R9 web 22148"） |

## 终态
residual-check.json（2026-10-07 生成快照）：本轮 node=0、DSH app=0、端口 18267-18290 监听=0；用户 ~/.dsh/profiles 仅 desktop,work。

## 口径说明
- "记录被机制消费"= cleanup 按设计读取记录→核验→停止→删除记录；当轮 stdout 经 grep 过滤未留存 stop 行。这不是缺失身份核验（核验在机制内执行），而是个别轮次的直接输出未存档；已留存的直接输出（28864/9080/22148/13512/6788）覆盖两种形态的停止路径样例。
- kit 三脚本与 54f6669 版零 diff ≠ 本轮启动器零偏差：本轮偏差 1 例（W9 boot.pid 引号错误，见 RESULTS）。
