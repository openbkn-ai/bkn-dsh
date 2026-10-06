W2 npm OpenBKN 诊断 dialog (product UI snapshot, 2026-10-06 11:02:41):
报告编号 b10fcb42 · 模式 被动采集 · Host 形态 npm · 平台 win32 · 插件（磁盘）0.2.0-rc.2-openbkn.0.2.0-6
checks:
- bootstrap-entry 通过 installation/component-loaded entryPresent=true
- business-entry 失败 configuration/configuration-invalid entryPresent=true configField=baseUrl
  nextAction: Export this report and send it to support; the OpenBKN panel cannot start until the listed stage is fixed.
- diagnostics-entry 通过 diagnostics/component-loaded schemaVersion=1
panel degradation message: 无法验证 OpenBKN 连接。请检查 Token 和平台地址后重试。(outer frame + 诊断 entry available)
note: browser blob download did not produce a fresh file this round (IAB replayed the W1 download); classification evidence taken from the product diagnostics dialog.
