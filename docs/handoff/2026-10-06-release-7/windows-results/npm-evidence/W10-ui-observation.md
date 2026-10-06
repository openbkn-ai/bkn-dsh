# W10 npm UI 观察原记录（2026-10-06 晚，端口 18279）

- 变体：run-case W10（diagnostics.js 前置缺失 import；base/variant SHA 见 W10-npm.md，base=6bbab278…）
- 侧栏 OpenBKN 单一入口；面板业务入口保留（CLI 登录/手动 Token/刷新状态/平台地址）
- 点"诊断"→ dialog "OpenBKN 诊断"："诊断服务不可用（诊断入口未随插件启动或连接中断）。请截图或复制此提示发给支持人员。"+ 重试按钮
- 降级态无导出按钮 → 仅 UI 证据；无 raw error
