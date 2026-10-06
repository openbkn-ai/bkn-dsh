W3 npm OpenBKN 诊断 dialog (product UI snapshot, 2026-10-06 11:15:08):
报告编号 aa8e40a3 · 模式 被动采集 · Host 形态 npm · 平台 win32 · 插件（磁盘）0.2.0-rc.2-openbkn.0.2.0-6
sidebar OpenBKN entries: 1 (single)
panel: 无法验证 OpenBKN 连接。请检查 Token 和平台地址后重试。 + 重试 button; 诊断 entry available
checks:
- bootstrap-entry 通过 installation/component-loaded
- business-entry 失败 component/module-resolution-failed entryPresent=true
  (variant: base tgz ffcd7772…, business.js prefixed with missing import — variant SHA recorded in evidence/W3-npm.md by run-case)
- diagnostics-entry 通过 diagnostics/component-loaded schemaVersion=1
conclusion: 与 desktop W3 (b8062c24) 一致——import 故障被归类为 module-resolution-failed，配置缺失与 import 错误未混同。
