# W9 canary 注入位置与扫描范围（2026-10-06 晚，两形态）

## 注入位置（三处，全部为虚构值，非真实凭据）
1. profiles/<form>/cordis.patch.yml → config.baseUrl = https://CANARY-BASEURL-W9X.example.invalid（BOM-less 手写 patch）
2. 同 patch → config.cliPath = C:\CANARY-CLIPATH-W9X\openbkn.cmd
3. <root>/bkn-config/fake-token.json = {"access":"CANARY-TOKEN-W9X","refresh":"CANARY-REFRESH-W9X","short":"CANARY-SHORT-AB"}（含短凭据别名用例）

## 扫描范围与结果
- 导出报告：`grep -c CANARY` 于 W9-desktop-bc6e7538.json = **0**、W9-npm-c2fe2ef7.json = **0**（产品导出全文件扫描）
- UI：诊断面板 DOM 快照中 CANARY 可见性 = false（npm 轮实测；desktop 轮无回显）
- 短凭据/别名用例：以 8 字符短串 CANARY-SHORT-AB 单独验证（无长度门槛脱敏的覆盖属开发回归测试，本记录只证明产品导出不含该值）

## 清理
- 两份 fake-token.json 已删除；patch 已复位健康配置（见 cleanup-process-record）
