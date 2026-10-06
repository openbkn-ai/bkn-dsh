W2 npm OpenBKN 诊断 dialog (product UI snapshot, evidence re-run 2026-10-06 12:16:32):
报告编号 2f59d3c7 · 模式 被动采集 · Host 形态 npm · 平台 win32 · 插件（磁盘）0.2.0-rc.2-openbkn.0.2.0-6
sidebar OpenBKN entries: 1 (single); 诊断 entry available
patch: run-case W2（仅 cliPath，无 baseUrl）
checks:
- bootstrap-entry 通过 installation/component-loaded entryPresent=true
- business-entry 失败 configuration/configuration-invalid entryPresent=true configField=baseUrl
  nextAction: Export this report and send it to support; the OpenBKN panel cannot start until the listed stage is fixed.
- diagnostics-entry 通过 diagnostics/component-loaded schemaVersion=1
panel degradation: 无法验证 OpenBKN 连接。请检查 Token 和平台地址后重试。+ 重试
note: 首轮观察 b10fcb42（2026-10-06 11:02:41）同分类，见 W2-npm-dialog-round1-b10fcb42.md。
export: 浏览器 blob 下载通道本轮未产出新文件（IAB 下载不稳定，详见 RESULTS 注记）；证据=产品诊断对话框 DOM 快照。
