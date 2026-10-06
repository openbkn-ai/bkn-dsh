W4 npm OpenBKN 诊断 dialog (product UI snapshot, evidence re-run 2026-10-06 12:20:02):
报告编号 6f94a7b9 · 模式 被动采集 · Host 形态 npm · 平台 win32 · 插件（磁盘）0.2.0-rc.2-openbkn.0.2.0-6
variant: run-case W4（apply() 在 registry 后受控抛错；base/variant SHA 记录于 evidence/W4-npm.md）
checks:
- bootstrap-entry 通过 installation/component-loaded
- business-entry 失败 component/initialization-failed entryPresent=true
- diagnostics-entry 通过 diagnostics/component-loaded schemaVersion=1
未构造子项：独立存储初始化失败（未能从包外构造该受控故障）→ 该子项 not-run。
首轮观察 32c3ff70（2026-10-06 11:22:02）同分类。export: blob 下载通道未产出新文件，证据=DOM 快照。
