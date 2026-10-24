# CLI-LOGIN-REPRO（第 3 轮）— Windows -13 标准入口登录复现，npm/Web，copy13clirepro3

- 时间：2026-10-24 04:39Z–04:45Z（本地 12:39–12:45）/ Asia/Taipei（UTC+8）
- 工具：维护端新脱敏捕获工具 `windows-english13-cli-capture3-v1`（ZIP 25,798 字节 / 13 文件，SHA-256 `49dc11e34ba334a193419be86bfd98f7f18b22d8962517f6cc71f4324d8f5d73`，下载后哈希核对一致；`verify-kit.mjs` passed=true（12 文件）、`collector.mjs --self-test` passed=true）。解压于 `C:\bkn-verify\english13-cli-capture3-kit`，未覆盖旧工具。
- 范围：仅 npm/Web（TestRoot `C:\bkn-verify\english12-npm`；插件 -13，package 回执 74 文件匹配）。**Desktop：NOT_RUN**。历史原包与人工确认字段未动。
- **结论：CLI 失败根因已定位——平台 TLS 证书校验被拒（`UNABLE_TO_VERIFY_LEAF_SIGNATURE`），CLI 无法启动登录。**

## 一、标准入口实际经过（UTC）

1. 04:40:19Z `Start-PrivateWebConsole.ps1` 启动（控制台 PID 4972）；04:40:21Z 宿主监听 18411。
2. 全新独立 Chrome 取证 profile（`chrome-cdp-profile-repro3`，PID 1692），初始 about:blank，CDP 仅监听 127.0.0.1:9336。
3. 04:40:39Z 捕获器启动（collector PID 12088，自检通过，输出目录由工具创建）：`collector-started`，attemptId `clirepro3`。
4. 本地用户在场，从私有控制台复制启动地址粘贴到 Chrome 取证窗口打开；页面终态 `http://127.0.0.1:18411/`（无 token），标题 DeepSeek Harness。智能体全程未读控制台/地址/token/密钥，未提取或注入 cookie。
5. 04:41:50Z `Collect-Receipt.ps1 -Phase copy13clirepro3`（Host/package 回执）。
6. 04:41:51.155Z 仅通过普通 UI 打开 OpenBKN 面板（未登录态：登录表单 + 平台地址 https://192.168.50.129），自然 status 请求发生并被捕获（04:41:51.160Z→04:41:51.435Z，HTTP 200，正文未读）。

## 二、实际分派情况

- 就绪检查（点击前）：`readyToClick=true`、`clickConsumed=false`、`beginLoginUniqueRequests=0`，另 `statusObserved=true`、`cleanPage=true`、`loginButtonCount=1`、`violations=0`。
- 04:42:15Z 执行一次 `control.mjs login`（真实 UI 点击，事前持久化一次性标记）：click-result.json `clicked=true, clickAtUtc=2026-10-24T04:42:15.754Z, outcomeUncertain=false, noRetry=true`。未手点、未重复执行、无终端 auth 命令、无重试。本轮 beginLogin 唯一请求数 = **1**（completedBeginLogin=1，protocolFailures=0，violations=0）。
- 未出现设备授权（CLI 在启动阶段即失败）；约 6 秒后面板显示通用错误“暂时无法验证 OpenBKN 连接…”。

## 三、结果与错误依据（各层严格分列）

捕获记录（capture-redacted.jsonl，来源 `beginLogin response.result.error; local memory redaction`，rpcId 请求/响应核对一致 `a6f73d17-64b6-487c-8579-7c0a324553c7`，protocolValid=true）：

1. **hostHttpStatus：200**（宿主 HTTP 状态；点击 04:42:15.755Z → 响应头 04:42:16.049Z，约 294ms）。
2. **resultOk：false；error.code：`gateway/internal`；messageRedacted（原文 161 字符，稳定 TLS 错误文本，无需脱敏，redactionApplied=false / redactionUncertain=false / messageOmitted=false）**：

   > OpenBKN CLI could not start login: TLS certificate rejected (UNABLE_TO_VERIFY_LEAF_SIGNATURE). The platform is likely self-signed — retry with `-k`/`--insecure`.

   识别标记：`UNABLE_TO_VERIFY_LEAF_SIGNATURE`（recognizedErrorMarkers）。
3. **CLI 退出码：1（被动观测，来源为本轮诊断 `884d3b7b` observed:cli cli-execution-failed，failureCount=1；非直接捕获的 stderr）**；lastOutcomeAgoMs=50578 推算 CLI 结果 ≈04:42:16.0Z，与 RPC 响应头时刻吻合（亚秒失败）。
4. **platformHttpStatusFromErrorText：null**（错误文本未给出平台 HTTP 状态；TLS 握手未到达 HTTP 层）。

## 四、直接错误、合理推断与未知

- **直接错误（捕获原文）**：CLI 启动登录时对 https://192.168.50.129 的证书校验失败（UNABLE_TO_VERIFY_LEAF_SIGNATURE），CLI 提示平台可能为自签名证书、可用 `-k`/`--insecure` 重试。通用分类码 `gateway/internal` 是宿主网关封装码，本身不是根因（按规程不把通用码当根因）。
- **合理推断**：与第 2 轮完全兼容——第 2 轮 beginLogin 外层 ok=true、错误位于 `result.error` 内层（本轮工具正确读取该层并核对 rpcId）；两轮的亚秒失败与诊断 exitCode=1 均为同一 TLS 拒绝。`gateway/internal` 为该错误经宿主网关后的封装。
- **未知（如实）**：该测试根 10-23 上午（-12 D2 轮）曾在同一平台上成功登录；此后 TLS 校验失败出现的确切原因（-13 插件的 CLI 调用链未携带原 CA/允许自签名配置，还是证书/环境变化）未在本轮范围内调查。修复动作（如插件 `allowInsecureTls` 配置或 CA 处理）不在本轮授权内，未做任何修改。浏览器 RPC 耗时（约 294ms）不等于 CLI 精确执行时长。

## 五、停止、清理与证据

- `control.mjs stop` → `stopped=true`，summary.json 生成（stopReason=requested，eventsFailed=false，rawResponsePersisted=false，hostOrBrowserStoppedByCollector=false——捕获器未代停 Host/浏览器）。
- 04:45:16Z `Stop-Host.ps1` 以 copy13clirepro3 回执停止测试树（node PID 27320 终止，cleanup 回执）；控制台 4972 经身份核验（pid/可执行文件/毫秒级创建时间 vs private-console 回执）后单独关闭；Chrome 取证窗口（PID 1692 及其 profile 会话 cookie）关闭，profile 保留未删。终态端口 18411/9336 零监听，零测试进程。
- 证据（相对本目录）：`capture\`（捕获输出目录全部 8 文件：collector-start / status / click-consumed / click-result / login.request / stop.request / summary / capture-redacted.jsonl）；`kit-zip.sha256` 与 `kit-files.json`（工具身份）；本轮回执 6+1 份（launch / launch-return / private-console / copy13clirepro3-host / package-copy13clirepro3 / package-before-start / cleanup）；诊断 `OpenBKN-diagnostic-20261024T044306625Z-884d3b7b.json`（本轮新报告，非缓存）；`SHA256SUMS.txt`。
- 打包前已逐项审阅脱敏产物：capture-redacted.jsonl 仅含上述两条记录，无 URL 查询/凭据/设备码/授权链接；诊断 JSON 无敏感字段。未含私有终端日志、HAR、trace、浏览器 profile、cookies、认证存储或完整会话。

## 六、边界确认

- Desktop NOT_RUN；未跑四张文案图、D1–D4、E00–E10、G6、冷启动、A7、runner、Ctrl+C 专项；未新建业务问题/回合。
- 未执行终端 auth login/auth token；未手工发送或重放 RPC；未点重试；一次性登录标记已消耗（clickConsumed=true）。
- npm 标签未查询、未写；未 publish、未打生产 tag；即使修复也不在本轮范围。
- 历史原包（repro 第 1/2 轮、补证包、CLI-FAILURE-EXISTING-EVIDENCE 等）未修改；本包未自动公开上传。
