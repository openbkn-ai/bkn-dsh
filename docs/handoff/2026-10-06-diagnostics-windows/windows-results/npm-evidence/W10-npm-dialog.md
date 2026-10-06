W10 npm (product UI snapshot, evidence re-run 2026-10-06 ~12:30, port 8267):
variant: run-case W10（diagnostics.js 前置缺失 import；base/variant SHA 记录于 evidence/W10-npm.md）
- sidebar OpenBKN entries: 1
- business intact: 使用 OpenBKN CLI 登录并同步 / 手动输入 Token / 刷新状态 / 平台地址 显示正常
- 诊断 click → dialog "OpenBKN 诊断": 诊断服务不可用（诊断入口未随插件启动或连接中断）。请截图或复制此提示发给支持人员。+ 重试
- 无伪造健康状态、无 raw error；降级态无导出按钮（符合"诊断不可用"路径）
未测子项: 多 Host 并发、过期/并发结果覆盖、导出失败路径 → not-run
