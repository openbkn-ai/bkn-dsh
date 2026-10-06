# Unified -7 Windows 复测结果（供主 agent 复核）

- 固定对象：`0.2.0-rc.2-openbkn.0.2.0-7`（源码 3414bde，CI 37478119730，publish=false，tgz 6bbab278…/66 文件；交付 commit 1fcffa9，ZIP df0016c6…/31 项——实际下载 size+SHA 核验匹配）
- 执行：Windows 10 19045 / 原生 PowerShell 5.1 / Desktop 0.2.0-rc.2 + 隔离官方 npm DSH 0.2.0-rc.2（Node 24.21.0）/ CLI 0.1.5；新隔离 root unified7-fidelity-desktop / unified7-fidelity-npm；无 WSL/inspector；2026-10-06 晚
- helper 与 Windows `54f6669` helpers-fixed 逐字节一致（零修正、零 diff）

## 一句话结论
**-6 的非法 baseUrl 缺陷在统一 -7 上两形态确认修复**（W2b：`fail/configuration-invalid/configField=baseUrl`，非下游 network 失败）；W2a/W2c（file:///、relative、恢复）全部正确；W3/W4/W10 隔离与降级不变；W9 canary 零泄漏；H01 报告 hostForm 按新语义（desktop=desktop / npm=unknown+独立佐证）；R9 两形态卸载-重装闭环；**F02 六项受控场景 6/6 显式通过**。无候选缺陷发现。F01/G6/live guard/真实登录链路 not-run（无凭据）。发布决定留主 agent。

## 读法
- **RESULTS.md** — 按模板的完整矩阵、身份、异常、清理与边界
- **desktop-evidence/ 、npm-evidence/** — 产品导出诊断 JSON（desktop 9 份 + npm 10 份含 W9；W10 降级态无导出按 UI 记录）、fidelity-runtime.jsonl（F02 六场景）、before/after 状态哈希

## 复核重点
- W2b 两形态 JSON：desktop `W2b-desktop-c391a9d0.json`、npm `W2b-npm-380f2566.json`
- F02：npm-evidence/fidelity-runtime.jsonl（六场景名与 HANDOFF 一一对应，全部 passed=true）
- 清理：children 记录 pid:port:creationTicks，cleanup "listener verified" 停止；结束态零残留；用户 ~/.dsh mtime 扫描未发现变化
