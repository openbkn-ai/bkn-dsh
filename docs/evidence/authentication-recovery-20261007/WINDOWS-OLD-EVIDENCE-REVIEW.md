# 旧 Windows 回传复核与补正范围

复核对象为 `09018faeeb476c6f93c4557b35c151f97839a8b1` 的 A/B 批证据，全部基于旧 `3414bde` / `6bbab278…` / 66 文件候选。原件保留，修正应写新章节并引用固定原件，不能追溯补造。

| 项 | 可成立的结论 | 需修正或补证 |
|---|---|---|
| 身份与 A2 patch | 固定旧包身份；两形态卸载紧邻三次 patch SHA 相同 | 不转用于新 CI 候选 |
| A3 用户状态 | 37 个记录项 / 34 个唯一文件路径的 A 批 before/after 内容一致 | before `2026-10-06T20:34:38.1229933Z`、after `2026-10-06T21:06:57.3855134Z` 早于 B 批，不证明 B 批无改动。没有 B 前态时明确 insufficient-evidence；本轮重新采集 |
| B 批终态 | npm 原生停止有身份核验；desktop 自动停止保护拒绝 ticks 不符，记录了人工停止 | `b-final-residual-check.json` 同时写 `dshApps=6`、`desktopStopped=false`，不能写应用进程零残留。Windows 查现态 PID/exe/创建时间/父子关系/端口；现态为零也不能补成旧时点的零 |
| ticks 偏差 | 日志中的两个 ticks 相差 `288000000000`，恰为 8 小时 | 优先排查启动器 UTC/local 转换；不能据此断言 PID 复用。官方 helper 未改，不等于外层启动器无偏差。历史未存原生 stop 行继续记 insufficient-evidence |
| B1 登录 | desktop 独立设备授权；两形态列网/绑定/刷新通过 | npm 复用了 desktop store，不是独立 npm 登录或自动续期验收。两文件相同后被拒并由重登恢复，仅证明拒绝与恢复；不证明平台 rotation、复制因果或插件缺少续期 |
| B3 问答 | 旧包 313 行键与数值独立核对成立；desktop 两个重复块数值一致；交期/零匹配核心结论有证据 | npm 14 个名称和 4 个缺库存标记丢失 `*`；没有已提交的原始 Markdown/完整 innerHTML，不能确认为渲染层。保留 native 源文本/HTML 才能定责；旧纠错包通过不继承到原生输出包 |
| B2/F01 | npm 6 元素图及 UI 回执链成立；其中 inventory operation 有独立 CLI 回执 | 属性操作 `08a7669763a9b0b43b64789ca86b02ec` 缺独立 CLI 核验，不能宣称六元素全部闭环。desktop 13 元素只是样例，未逐元素核验 |
| B4 guard | 未绑定会话拒绝、绑定 worldcup 未披露 supply 数据 | 未绑定拒绝原文来自插件 `UNBOUND_OPENBKN_TOOL_DENIAL`，不是平台硬拒证据；正常模型未跨网不等于强制错误 kn_id 测试 |
| 文档状态 | B 批实际已完成真实模型、desktop guard 与图样例 | 更新仍写“无模型/未执行 desktop/未取 desktop”的汇总，历史状态保留并标时点；API/UI 判定一致不叫字节一致 |

Windows 新交接应包含以上补正、受影响鉴权恢复和原生输出候选身份。Mac 无法证明 Windows 的进程收态、B 批日常文件前态或取得 Windows 未提交的源 Markdown；这些只能由 Windows 实测/查原件，缺失则收窄结论。受限账号仍按用户决定 not-run。正式发布仍由用户确认。
