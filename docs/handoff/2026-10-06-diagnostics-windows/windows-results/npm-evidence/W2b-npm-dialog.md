W2b npm OpenBKN 诊断 dialog (product UI snapshot, 2026-10-06 11:04:15):
报告编号 172d20a3 · 模式 被动采集 · Host 形态 npm · 平台 win32 · 插件（磁盘）0.2.0-rc.2-openbkn.0.2.0-6
patch: baseUrl: ht!tp://not a valid url with spaces (invalid format)
checks:
- bootstrap-entry 通过 installation/component-loaded
- business-entry 通过 component/component-loaded  ← 非法格式未被 configuration 阶段拦截
- diagnostics-entry 通过 diagnostics/component-loaded
- observed:cli 通过
- observed:login-state 失败 authentication/not-logged-in
conclusion: 与 desktop W2b (addbb3eb) 一致——invalid-format baseUrl 不产生 configuration-invalid 分类，
失败仅在未登录状态体现。候选行为发现，非 helper 问题。
