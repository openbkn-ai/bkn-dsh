# CA-READONLY-REPORT — Windows -13 npm/Web 根 CA/NODE_EXTRA_CA_CERTS/平台证书链只读取证

- 时间：2026-10-24 06:03Z–06:07Z（本地 14:03–14:07）/ Asia/Taipei（UTC+8）
- 范围：仅原 npm/Web 测试根相关环境（Desktop NOT_RUN）。全程只读：未修复配置、未登录、未启动 DSH、未跑全量；未设置/修改任何环境变量、profile、脚本、shim、信任库或插件配置；未用 -k/--insecure、rejectUnauthorized=false、NODE_TLS_REJECT_UNAUTHORIZED=0；未执行任何 OpenBKN CLI 命令、auth、beginLogin、设备授权、业务请求或 npm 操作。
- 第 3 轮原件复核：english13-cli-login-repro3-return.zip SHA-256 `bb03b4eb30c85c48e3e916ed92d2b21b94874778faff7c406d6168448c06c20a`（未变）。

## 一、NODE_EXTRA_CA_CERTS 三作用域与继承（06:03:15Z 实测）

| 作用域 | 值 |
| --- | --- |
| Process（探针子进程实际读到） | `C:\Users\kalia\openbkn-dev-ca.pem` |
| User（HKCU\Environment） | `C:\Users\kalia\openbkn-dev-ca.pem` |
| Machine（HKLM） | UNSET（未设置） |

无副作用子进程链实测（06:05:17Z，新 `powershell -NoProfile -NonInteractive` PID 24572 → 新 `node` PID 9912）：两级子进程均自然读到同一路径（node v24.21.0，`C:\Users\kalia\scoop\apps\nodejs-lts\current\node.exe`）。**当前父链→新 PowerShell→新 Node 自然继承：成立。**

**第 3 轮 Host/CLI 当时实际环境：UNKNOWN**（该进程已退出，无保留；本实验不能回溯证明）。

启动链只读核对（均未设置/清除 NODE_EXTRA_CA_CERTS；Start-PrivateWebConsole.ps1 使用 -NoProfile；入口：powershell → Start-Host.ps1 → `tools\node_modules\.bin\dsh.cmd`；插件 cliPath（cordis.patch.yml 实读）→ `C:\bkn-verify\english11-cli\node_modules\.bin\openbkn.cmd` → PATH node + `@openbkn\bkn-sdk\dist\cli.js`）：

| 文件 | SHA-256 | 设变量 | 备注 |
| --- | --- | --- | --- |
| kit\Start-PrivateWebConsole.ps1 | 38388999ea1f4944c875c0eacb6d0631aa9978a543ae1c94906505c3b923d550 | 否（不提及） | -NoProfile ✓ |
| kit\Start-Host.ps1 | cec46ab2dc2f03076ba64bec1c4732bc73b4f8b981d15953b1312d4087818035 | 否 | — |
| kit\common.ps1 | c59c80d023422027a0ff173eea4418d4f3a35d87a141efae9415de3a470086a2 | 否 | — |
| english11-cli\…\.bin\openbkn.cmd（cliPath shim） | 8562fbc4d6f2320c261cfde7da06d2266200eed52fd2dcc524f0842d3183fbf3 | 否（不提及） | 2026-10-22 起 | 

插件配置（两 profile 均实读）：baseUrl=https://192.168.50.129、cliPath 同上、**未配置 allowInsecureTls（schema 默认 false）**。

## 二、现有 CA 文件只读核对

来源：仅 NODE_EXTRA_CA_CERTS 变量值（受限来源；未全盘搜索、未进凭据目录）。

**文件**：`C:\Users\kalia\openbkn-dev-ca.pem`
- 存在、当前账户可读；**文件 SHA-256 `89e53b4e7a09305c01c37513a9bdda63698735a33a0df71f725875ec47180453`**，1192 字节，mtimeUtc 2026-09-29T12:52:20Z（复核一致）；无私钥标记。
- 内容：**1 张证书**（文件哈希与证书指纹分列）：
  - subject = issuer = **CN=192.168.50.28**（自签，旧平台 IP）
  - SHA-256 指纹 `44:D1:AB:A4:39:17:9F:FC:BE:DD:B6:40:5A:48:48:BE:FE:59:C9:21:A9:A1:4A:E1:34:01:2A:76:4C:AA:17:F7`
  - 有效期 2026-09-22 → 2028-12-25；isCA=true；当前在有效期内。

## 三、平台 TLS 探针（各分列）

**A. Node 严格握手（自然继承环境，含上述 CA；06:05:35Z，单次，10s 上限）**
- 目标 192.168.50.129:443；校验保持开启（未覆盖 rejectUnauthorized）；无 HTTP/认证/业务数据。
- 结果：**失败，稳定错误码 `UNABLE_TO_VERIFY_LEAF_SIGNATURE`**（"unable to verify the first certificate…"）——与第 3 轮 beginLogin 捕获错误码一致。链未取得（握手失败，标 UNKNOWN，未绕过校验补取）。
- Node 提示原文含建议 `--use-system-ca`（如实记录，未执行）。

**B. OpenSSL 链采集（本机已有 OpenSSL 3.5.8，Git ucrt64；单次，校验开启 + 错误即返回；原始输出仅内存解析）**
- OpenSSL 自身校验：**失败**（`unable to get local issuer certificate`，error 20）——OpenSSL 默认信任库亦无该链根；此为 OpenSSL 结果，与 Node 实测分列，不等价。
- 取得平台当前下发链：**仅 1 张（叶证书，无中间/根随链下发）**
  - subject **CN=DominicZhangdeMac-mini.local**；issuer **CN=OpenBKN Test 015 Local CA**
  - SHA-256 指纹 `9D:A3:2F:90:48:7A:14:2B:AB:C0:98:3A:54:65:9D:20:4E:20:9A:21:6E:87:FB:09:BA:75:E1:F5:A7:FE:3A:B6`
  - 有效期 **2026-10-09 → 2027-10-09**；isCa=false
  - 叶证书 SAN：**IP:192.168.50.129**（与目标 IP 匹配 ✓）、DNS:DominicZhangdeMac-mini.local、DNS:localhost、IP:127.0.0.1
- **离线验证（用现有 CA 文件 vs 取得链，公开证书临时文件，验证后已清理）**：`openssl verify -CAfile openbkn-dev-ca.pem <leaf>` → **失败**。即 CN=192.168.50.28 自签根不能验证该叶证书；叶证书的签发 CA（OpenBKN Test 015 Local CA）证书既未随链下发、也不在现有 CA 文件中。链中缺根本身不直接判错；此处是"现有 CA 内容与平台现行链不匹配"。

## 四、问题答复（只回答这些）

1. **三作用域是否一致？** Process 与 User 一致（同一路径）；Machine 未设置。
2. **受控子进程是否自然继承？** 是（PowerShell→Node 两级实测读到）。**第 3 轮实际环境仍 UNKNOWN**（无保留，不可回溯）。
3. **引用的 CA 是否存在/可读/有效？指纹？** 存在、可读、可解析、证书在有效期内且 isCA=true；文件指纹 `89e53b4e…80453`，证书 SHA-256 指纹 `44:D1:AB:A4…:F7`，subject=CN=192.168.50.28（旧平台 IP 自签根）。
4. **平台当前链与现有 CA 能否验证？IP SAN？** 当前链=CN=DominicZhangdeMac-mini.local（issuer=OpenBKN Test 015 Local CA，2026-10-09 起，SAN 含 192.168.50.129 ✓）；**现有 CA 不能验证它**（离线 verify 失败；签发 CA 未在链/CA 文件中）。
5. **同一 Node 当前自然环境严格 TLS 是否通过？** 否——失败，`UNABLE_TO_VERIFY_LEAF_SIGNATURE`，与第 3 轮 CLI 错误码一致（仅证明本轮探针，不代表登录/Host/文案验收）。
6. **直接证据 vs 无法判断：**
   - 直接证据：三作用域值与当前继承链；CA 文件内容（.28 自签根）；平台当前链（叶指纹/issuer/SAN/有效期）；Node 严格失败码与第 3 轮一致；离线 CA 验证失败。
   - 无法判断：第 3 轮 Host/CLI 当时环境（UNKNOWN）；10-23 上午同平台登录成功的机制（当时链指纹或环境未保留——现有叶证书 2026-10-09 已签发，但无历史链指纹可比对，**不能声称平台证书"发生了变化"**）；两 profile 均无 allowInsecureTls 配置是当前实读结果，当时配置同样无档案。

## 五、边界与产物

- 探针进程（PS 24572 / node 9912 等）均已自然退出；临时公开证书目录已清理；未动任何配置/信任库/证书。CA 文件复核（哈希/mtime）与本报告期间一致。
- 本目录新增文件：CA-READONLY-REPORT.md、CA-READONLY-REPORT.json、probe-env-scopes.ps1、probe-kit-scripts.ps1、probe-child-chain.ps1、probe-ca-parse.mjs、probe-tls.mjs、probe-openssl-chain.mjs、SHA256SUMS.txt。不含完整环境、控制台日志、认证存储、私钥、浏览器资料或历史完整会话。
- 历史原包、旧结论与人工确认字段不变；npm 标签未查询未改动；未 publish。本轮到只读报告为止，未做任何修复。
