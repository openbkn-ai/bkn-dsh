# W10 desktop UI 观察原记录（2026-10-06 晚）

- 变体：run-case W10（diagnostics.js 前置缺失 import；base/variant SHA 见 W10-desktop.md，base=6bbab278…）
- 侧栏 OpenBKN 单一入口；点击打开面板：业务入口保留（"使用 OpenBKN CLI 登录并同步"/"手动输入 Token（兼容无 CLI 部署）"/"刷新状态"均出现，平台地址配置正常显示）
- 点击面板右上角"诊断"→ dialog "OpenBKN 诊断"：标题下方文案为"诊断服务不可用（诊断入口未随插件启动或连接中断）。请截图或复制此提示发给支持人员。"与第二段"诊断入口未随插件启动或连接已中断…"
- 降级态无"导出诊断报告"按钮（符合"诊断不可用"路径）→ 本项仅 UI 证据，不造 JSON
- 无 raw error/堆栈泄露；无伪造健康状态
