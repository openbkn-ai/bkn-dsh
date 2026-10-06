# R9 用户 patch 保留的范围与哈希口径（两形态）

## 范围
两隔离 root 为全新建，从未包含真实用户 patch；"patch 保留"指本轮测试写入的 cordis.patch.yml（openbkn-business-context 健康配置）在 UI 卸载/重装过程中不被删除或改写。

## 内容哈希（取自既有 collect-state-hashes 记录，非事后补造）
- desktop：before-W1(R9 轮起)=56F3C9A7…（W9 canary patch 残留）→ R9 W1 轮 run-case 写入健康 patch → 卸载时文件内容展示（首4行=健康配置原样）→ 终态 after-matrix=E70A7C04…（健康值，canary 清除）
- npm：DEA173D1…（canary 残留）→ 健康值 → 终态 6E73523D…
- 差异全部来自本轮受控写入序列（canary→健康），非卸载丢失。

## 证据等级（如实）
- 卸载动作前后紧邻的 patch 哈希对未单独采集（卸载时刻仅留存内容展示）→ patch 在卸载期间字节级不变的哈希级证明为 insufficient-evidence；
- 可用证据：卸载时内容展示（会话记录）+ 终态健康哈希 + deps/@openbkn 全清而 patch 文件仍在。
