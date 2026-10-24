# CA-FIX-NOTE — CA 只读取证之后由机器持有人授权的修复记录（2026-10-24 06:10–06:11Z）

只读报告（CA-READONLY-REPORT.md/.json，随本目录回传）完成后，机器持有人（本地用户）明确指示"把 CA 改为 50.129 的"。以下为该修复的完整记录，不属于只读轮范围，也未改动任何只读轮产物。

1. **CA 来源（本机已有，未下载、未请求外部）**：`C:\bkn-verify\platform-129\openbkn-test-015-ca.crt`
   - subject=issuer=CN=OpenBKN Test 015 Local CA；isCA=true；有效期 2026-10-09 → 2027-10-09
   - 证书 SHA-256 指纹 `0F:DE:76:C5:3E:76:FE:7B:A6:1F:40:89:EF:B9:DA:88:20:71:3A:D0:BB:5D:3D:39:44:8B:58:6F:9A:E3:D6:A6`；文件 SHA-256 `fd6d4aaa860cb744c170df65a24478211895129ec09b3fa302e768b2f7a4a97f`；无私钥标记
2. **密码学确认（离线）**：采集平台 .129 当前叶证书后 `openssl verify -CAfile <该CA> <叶>` → OK，确系平台现行链签发者。
3. **修改方式（追加而非替换）**：
   - 备份原件至 `C:\bkn-verify\english13-work\ca-readonly\openbkn-dev-ca.pem.backup-20261024`（原文件 SHA-256 `89e53b4e7a09305c01c37513a9bdda63698735a33a0df71f725875ec47180453`，单证书版本）
   - `C:\Users\kalia\openbkn-dev-ca.pem` 追加 test-015 CA 后含 2 张证书（保留 CN=192.168.50.28 旧根），新文件 SHA-256 `db332d0c00d244e7b4e22d47c3fff49434a585734fe96641b65d8651517ee656`
   - 环境变量无需变化（User 作用域已指向该文件）；未改任何脚本/shim/插件配置/信任库
4. **复测（同 Node v24.21.0 自然继承环境，严格校验，单次）**：对 192.168.50.129:443 握手 **handshake-completed**（修复前同条件为 UNABLE_TO_VERIFY_LEAF_SIGNATURE）。
5. **边界**：未重新登录（登录复测需另行授权）；无 Host 在跑，下次启动将自然加载更新后的 CA 文件。注意 test-015 CA 与平台叶证书同日签发，**2027-10-09 到期**。
