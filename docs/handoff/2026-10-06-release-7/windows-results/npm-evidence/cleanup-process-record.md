# 进程身份核验、停止结果与端口释放原记录（2026-10-06 晚）

## 机制
- run-case 启动即记录：宿主 pid:creationTicks（*.pid）与 web 子进程 pid:port:creationTicks（*.children.pid，按端口监听者解析）
- cleanup 停止前核验：PID 存活 + 创建时间一致（拒绝 PID 复用）+ 形态身份（desktop=exe 路径 / npm=命令行含 dsh.cmd）+ （子进程）node.exe + CLI 树路径 + ' web ' + 端口数字边界 + 当前监听归属

## 实际停止输出（摘自本轮会话原始输出）
- W9 npm 收尾：`stopping recorded npm web child pid 28864 (port 18280, listener verified)` → 复核 `port 18280: free`
- R9 换 Host：18281 监听者身份核验（diag6-tools + ' web '）后停止 pid 9080；R9 收尾：18282 监听者身份核验后停止 pid 22148
- desktop 各轮：应用随 cleanup/换轮停止；W9 轮 boot.pid 记录行因脚本引号错误缺失 → 该应用（pid 6788）以 exe 路径身份核验后手动停止（见 RESULTS 偏差 1）
- 最终态（step-u7-finish + residual-check.json 双份）：本轮 node=0、DSH app=0、18267-18290 监听=0；用户 ~/.dsh/profiles 仍仅 desktop,work（mtime 扫描未发现变化）

## skip 日志
- 本轮无 cleanup skip 输出（-6 轮的确定性复用拒绝测试见 docs/handoff/2026-10-06-diagnostics-windows/windows-results）
