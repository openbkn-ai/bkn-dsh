# CLI-LOGIN-REPRO（第 2 轮）— Windows -13 最小登录复现，npm/Web，copy13clirepro2

- 时间：2026-10-24 02:31:35Z–02:36:52Z（本地 10:31–10:36）/ Asia/Taipei（UTC+8）
- 范围：仅 npm/Web（TestRoot `C:\bkn-verify\english12-npm`；插件 0.2.0-rc.2-openbkn.0.2.0-13，74 文件匹配见 package 回执）。**Desktop：NOT_RUN**。第 1 轮（标准入口 BLOCKED，english13-cli-login-repro.zip）保持不变。
- 本轮浏览器：按本地用户要求使用 **Chrome**（默认浏览器应用；取证窗口为 Chrome 独立测试 profile + CDP 9335 被动监听，未触碰用户日常 Chrome 配置）。
- 结论：**CLI 失败复现成立（exitCode=1，点击后 423ms 亚秒失败，来源=诊断）；但 beginLogin RPC 顶层返回 ok=true，无 error.code/error.message——维护端"CLI 失败经 beginLogin error.message 返回"的静态推断与本轮实测路径不符，具体错误文本仍未暴露。**

## 一、标准入口实际经过（UTC）

1. 02:31:35Z `Start-PrivateWebConsole.ps1` 启动（控制台 PID 13064）；02:31:37Z 宿主监听 18411（launch 回执）。
2. 02:31:41Z Chrome 取证窗口就绪（PID 25236，CDP 9335，全新 profile `english13-work\chrome-cdp-profile-repro`）；监听器启动，脱敏自测通过（浏览器级自动附加，含 Worker target）。
3. **本地用户在场**，从私有控制台复制启动地址粘贴到 Chrome 取证窗口打开；界面显示后经交互确认。页面终态 `http://127.0.0.1:18411/`（无 token），标题 DeepSeek Harness。智能体全程未读控制台/地址/token，未读签名密钥，未提取/注入 cookie，未自签会话。
4. 02:33:19Z `Collect-Receipt.ps1 -Phase copy13clirepro2`（Host/package 回执）。
5. 02:33:23.573Z 打开 OpenBKN 面板（登录表单 + 平台地址 https://192.168.50.129）。

## 二、捕获链验证（点击前完成）

面板打开时的自然 status 请求被监听器完整关联：`POST /api/openbknBusinessContext/status`，02:33:23.578Z → 02:33:23.943Z，HTTP 200（正文按规程未保存）。另有 02:32:48.729Z 的 getSessionSuggestions（200）。捕获器与脱敏逻辑确认就绪后才执行登录点击。

## 三、一次登录点击与结果

- attemptId：`clirepro2-20261024T023338Z`；点击 02:33:38.295Z（面板按钮"使用 OpenBKN CLI 登录并同步"，仅此一次；本轮实际观察到的 beginLogin 请求数 = **1**）。
- **beginLogin 捕获记录**（来源：浏览器 CDP 被动监听，仅内存处理后输出脱敏最小字段）：
  - rpcId `1be41962-ae18-4a14-a9fc-fe802a86f6b8`，方法 `openbknBusinessContext/beginLogin`
  - 请求 02:33:38.295Z → 响应 02:33:38.719Z（424ms），**宿主 HTTP 200**
  - **RPC 顶层 result.ok = true；error.code = null；error.message = null**（无错误字段可脱敏）
- 02:33:44Z（点击后约 6 秒）面板显示通用错误"暂时无法验证 OpenBKN 连接，当前原因尚未确定…"+ 重试按钮（文字记录；本轮未要求截图）。未出现设备授权页/默认浏览器授权窗口；点击后无任何后续 openbknBusinessContext RPC。
- 失败后导出被动诊断：报告 **f3727485**（生成于 02:35:04.407Z）。

## 四、四类状态严格区分

| 类别 | 值 | 来源 |
| --- | --- | --- |
| 宿主 HTTP 状态 | 200 | CDP 被动捕获（不等于平台调用成功） |
| RPC error.code / error.message | null / null | beginLogin 响应顶层无错误字段 |
| CLI 退出码 | 1（failureCount=1） | **诊断报告 f3727485 被动观测**（非直接进程观察；来源已注明） |
| 错误文本中的平台 HTTP/错误码 | null | 无错误文本可解析 |

## 五、时序与推断

- 诊断 f3727485：observed:cli lastOutcomeAgoMs=85689 → CLI 结果时刻 **02:33:38.718Z**，即点击后 423ms，与 beginLogin 响应时刻 02:33:38.719Z 毫秒级重合——CLI 在 RPC 返回前已亚秒失败，但 RPC 仍 ok=true。
- observed:login-state lastOutcomeAgoMs=100465 → 02:33:23.942Z，与面板打开时 status 响应（02:33:23.943Z）重合，属面板打开时登录态检查，非登录尝试。
- 推断：beginLogin 只表示"登录尝试已被接受/启动"，CLI 结果走插件内存被动观测（diagnostics buffer），不经 RPC 错误字段返回；面板 6 秒后的通用错误由本地登录态观测翻转驱动（点击后无任何后续 RPC）。
- **局限（如实）**：按本轮规程，ok=true 响应的 result 业务内容不读取不保存；若失败细节位于 result 内嵌错误对象中，则未被保留。这是规则性省略，非脱敏省略。若维护端再授权一次，建议捕获规则允许"仅对 beginLogin 的 result 内错误对象"做脱敏提取。
- CLI 具体错误文本（stderr）：本轮仍未取得。浏览器 RPC 耗时（424ms）不等于 CLI 精确执行时长（约 ≤423ms，由诊断推算）。

## 六、清理与证据清单

- 02:36:52Z `Stop-Host.ps1` 以 copy13clirepro2 回执停止（node PID 26548 终止，cleanup-20261024T023652934Z.json）；控制台 13064 经身份核验（pid/可执行文件/毫秒级创建时间 vs private-console 回执）后单独关闭；Chrome 取证窗口关闭；监听器停止。终态端口 18411/9335 零监听、零测试进程。profile、会话与认证存储保留（含 Chrome 取证 profile 与其会话 cookie，未删未改）。
- 证据（相对本目录）：`CLI-LOGIN-REPRO.json`；回执 7 份（private-console / launch / package-before-start / copy13clirepro2-host / package-copy13clirepro2 / cleanup / launch-return）；`OpenBKN-diagnostic-20261024T023504407Z-f3727485.json`；捕获与脱敏脚本 `listener-repro.mjs`、驱动 `cdp9335.mjs`；脱敏捕获日志 `repro2-capture-redacted.jsonl`（仅含脱敏最小字段与关联验证记录）；`SHA256SUMS.txt`。
- 备注：诊断导出实际落盘于系统 Downloads（Chrome 有头窗口未接受 CDP 下载路径设置），归档原件一份，重复副本（第二次点击产生）已删除。

## 七、边界确认

- 未执行终端 auth login / auth token；未点重试；不手工发送、重放或额外调用 beginLogin；本轮 beginLogin 总数 1（来自唯一一次 UI 点击）。
- 未新建业务问题/回合；未跑文案图、D1–D4、E00–E10、G6、冷启动、A7、runner、Ctrl+C 专项；Desktop NOT_RUN。
- 未 publish、未写 dist-tag、未打生产 tag；本轮按要求未查询 npm 标签。旧包（含第 1 轮 repro 与全部历史回传）未改动；本包未自动公开上传。
