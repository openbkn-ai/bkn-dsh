W3 npm OpenBKN 诊断 dialog (product UI snapshot, evidence re-run 2026-10-06 12:18:30):
报告编号 33db54bf · 模式 被动采集 · Host 形态 npm · 平台 win32 · 插件（磁盘）0.2.0-rc.2-openbkn.0.2.0-6
sidebar OpenBKN entries: 1; panel: 无法验证 OpenBKN 连接。请检查 Token 和平台地址后重试。+ 重试；诊断 entry available
variant: run-case W3（business.js 前置缺失 import；base/variant SHA 记录于 evidence/W3-npm.md）
checks:
- bootstrap-entry 通过 installation/component-loaded
- business-entry 失败 component/module-resolution-failed entryPresent=true
- diagnostics-entry 通过 diagnostics/component-loaded schemaVersion=1
首轮观察 aa8e40a3（2026-10-06 11:15:08）同分类。export: blob 下载通道未产出新文件，证据=DOM 快照。
