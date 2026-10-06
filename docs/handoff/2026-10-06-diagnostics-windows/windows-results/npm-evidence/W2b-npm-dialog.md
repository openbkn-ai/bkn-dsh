W2b npm 非法格式 baseUrl（product UI + 导出 JSON，2026-10-06 12:4x，port 8273）：
patch: baseUrl: ht!tp://not a valid url with spaces（非法格式）
导出报告：evidence/W2b-npm-073b491e.json（reportId 073b491e，sha256 前缀 E6AA774B00FE6AB4）
checks:
- bootstrap-entry / business-entry / diagnostics-entry 均 pass（business-entry=component-loaded ← 非法格式未被 configuration 拦截）
- observed:cli pass；observed:login-state fail/not-logged-in
面板同时回显配置的平台地址原文（ht!tp://…）
结论：与 desktop W2b（addbb3eb，JSON）一致——候选缺陷：非法格式 baseUrl 不产生 configuration-invalid 分类。
历史：首轮观察 172d20a3（2026-10-06 11:04 UI 记录）同结论。
