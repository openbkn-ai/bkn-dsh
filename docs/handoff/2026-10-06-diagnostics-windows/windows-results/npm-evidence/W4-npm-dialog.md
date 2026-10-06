W4 npm OpenBKN 诊断 dialog (product UI snapshot, 2026-10-06 11:22:02):
报告编号 32c3ff70 · 模式 被动采集 · Host 形态 npm · 平台 win32 · 插件（磁盘）0.2.0-rc.2-openbkn.0.2.0-6
sidebar OpenBKN entries: 1; 诊断 entry available
checks:
- bootstrap-entry 通过 installation/component-loaded
- business-entry 失败 component/initialization-failed entryPresent=true
  (variant: apply() throws after registry — base/variant SHA in evidence/W4-npm.md)
- diagnostics-entry 通过 diagnostics/component-loaded schemaVersion=1
conclusion: 与 desktop W4 (73033c09) 一致——受控初始化失败被归类 initialization-failed，诊断独立可用。
