# E1：旧 09018fa 回传补正（2026-10-07，鉴权恢复轮）

复核对象 `09018faeeb476c6f93c4557b35c151f97839a8b1`（旧 3414bde / 6bbab278… / 66 文件候选）。
原件全部保留，本文件仅新增补正章节，不追溯改写。

## 1. B 批终态 dshApps=6 与 ticks 偏差

- 旧 `b-final-residual-check.json` 同文件写了 `dshApps=6`、`desktopStopped=false` 与（后附注的）
  人工停止：**不能宣称旧时点应用进程零残留**。旧时点零残留结论撤回；保留 npm 侧身份核验停止与
  desktop 人工核验停止（pid 2256 启动时刻/exe/标题匹配）的过程记录。
- 现态实测（2026-10-07 16:04，本轮 N6）：DeepSeek Harness 进程=0、node=0、18267/18268 监听=0、
  `~/.dsh/profiles` 仅 desktop,work。**现态为零只证明当前**，不补写为旧时点零。
- ticks 差 288000000000 = 8 小时：与启动器 UTC/local 转换偏差一致（未存旧启动器代码无法最终定责，
  收窄为"与 8 小时时区差一致的启动器时间转换偏差，非 PID 复用证据；根因未完全证实"）。
  本轮（鉴权恢复轮）所有 pid 文件由 `Get-CimInstance …CreationDate` 的 `[datetimeoffset]::UtcTicks`
  记录并在停止时比对，未再出现偏差；官方 helper 未改。
- 旧停止原生行继续 **insufficient-evidence**（不可回收，已在 509cce5 如实标注）。

## 2. A3 37/34 用户状态不延伸到 B 批

- 旧 before（2026-10-06T20:34Z）/after（21:06Z）仅覆盖 A 批窗口，**不证明 B 批（10-07 白天）无改动**。
  B 批无前态可采，旧结论按"insufficient-evidence（B 批窗口）"收窄。
- **本轮已重新采集**：before 37 记录（复用 a6c9459 清单，`user-state-before.json`）与 after
  （`n6-user-state-after.json`，2026-10-07 16:04）**37/37 内容哈希一致**，覆盖鉴权恢复轮全程。
  注：37 记录对应 34 唯一路径（同一 session 目录多文件），两种计数并列如上。

## 3. npm 复制 store 与 token 轮换

- 旧 B1 npm 复用 desktop store：不是独立 npm 登录，也不构成自动续期验收——维持收窄表述
  （"拒绝与重登恢复已证明；rotation 机制/复制因果/插件续期能力均未证明"）。
- **本轮新证据**：R1 按 HANDOFF 要求两形态各自独立授权、未复制 token；npm4 store 出现两次重复
  失效、重登恢复（时序与同账号他端登录相关）。CLI 0.1.5 的 status() 仅读本地 expiresAt、不向平台
  验证撤销；归档的 auth-status 原件均为 expired=false，失效时点的 expired=true 为操作者会话观察、
  无时间化原件 → **表述收窄为"重复失效/拒绝、重登恢复，与他端登录顺序相关；原因未证实"，
  不写"互踢实证"**，维持开放项。

## 4. B3 npm `*` 差异（14 名称+4 缺库存标记）

- 旧证据仅 DOM 快照 textContent；**原始 Markdown / innerHTML 未随 509cce5/bee714c 提交**，
  无法定责"渲染层 vs 源文本"。结论收窄为"原因未证实"，不写"确认为 markdown 渲染"。
- 旧纠错包（6bbab278）三题通过**不继承**到本轮原生输出候选（fa168d81）：本节撰写时点 N4/N5
  未执行（隔离 Host 无模型凭据），如实 not-run——**时点说明：当日傍晚用户配置 DEEPSEEK_API_KEY
  后 npm 形态已补测 pass（N45-SUMMARY.md，增补 commit），desktop 仍未测；该补测不继承到旧全 BOM
  用量库存题与 missing-object 负向题**。

## 5. B2/F01 属性 operation 闭环

- 旧 `08a7669763a9b0b43b64789ca86b02ec`（inventory 五属性）无独立 CLI 回执核验：
  **六元素全部闭环的说法撤回**，改为"object 库存回执 rcpt_469db8d7 CLI 闭环 + 五属性仅图/回执面板
  一致，独立 CLI 核验缺失"。本轮不重放旧图（平台会话已过期且非本轮范围）。

## 6. B4 未绑定拒绝来源措辞

- 旧"平台硬拒"改为：**插件 `UNBOUND_OPENBKN_TOOL_DENIAL` 拒绝**（来自插件边界）；
  "模型未跨网取数"不等于"强制错误 kn_id 的 guard 测试"——旧 B4 两用例表述收窄为
  "未绑定会话调用被拒 + worldcup 会话未披露 supply 数据（行为级隔离）"。

## 7. 汇总时点

- 旧 WINDOWS-RESULTS.md 中"无模型/desktop 未执行"等表述为撰写时点的历史状态（B 批前），
  B 批与 509cce5/bee714c/09018fa 后续已更新；不再以旧时点表述覆盖新状态。
  API/UI 判定一致 ≠ 字节一致的原则维持。

## 指向

- 旧原件：`docs/unified7-final-verification-windows @ 09018fa`（远端固定）；本轮新证据：
  `authentication-recovery-c91fe09-evidence/`（将随 RESULTS 一并提交）。
