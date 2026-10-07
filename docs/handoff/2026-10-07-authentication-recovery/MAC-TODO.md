# Mac 本轮执行清单与剩余理由

- [x] 审核 Windows 固定旧 commit 09018fa，保留原件，列 E1 补正。
- [x] 只修明确 MCP 401 的现有 CLI 登录恢复入口；目录 403 保留手动凭据入口并区分权限原因，不新增自动续期/Token 管理。
- [x] 最终源码 head 独立批准后合入；build-only CI 原件固定，npm/GitHub 发布步骤 skipped。
- [x] 新 CI 包安装件 65/65 内容匹配；三入口正常。
- [x] 真实平台拒绝公开无效 token → 明确 MCP 401/登录入口 → 产品 CLI 正常授权 → 同 Host 七项 pass、旧失败恢复。
- [x] 无 CA 的真实 TLS 分类不误路由登录；原 patch/CLI/CA 恢复后另一个健康 Host 七项 pass。
- [x] 四份真实 UI 诊断下载，原件/证据副本/Git 原始字节分别核验。
- [x] 本 CI 包官方核心原生输出 fixture 8/8、direct 平台 live guard 16/16。
- [x] 实时 tools/list 28 schema、DSH/Foundry refs 与版本、CLI 0.1.5；平台 49 容器镜像/运行 imageID 新采集。
- [x] 三 Host 家族停止前身份与原生 listener 状态、native Quit 后 PID 消失/端口释放；patch 准确字节恢复；日常选定 9 路径一致。**未逐个捕获全部短时 CLI PID**，只证明记录的 Host 家族和终态，不补造历史。
- [x] Windows 固定 kit 与一份累计账户发布说明更新到本轮身份。

剩余项目：

| 项 | 现态与暂不处理理由 |
|---|---|
| 新 SHA 的 Windows R1/N0–N6 与 E1 | 交 Windows agent 实测；Mac 不能代验当地 UI/进程或未提交的历史源文本 |
| 本 CI 再跑五题真实模型 | 当前变更是鉴权/UI 错误路由，没有改模型工具/提示策略；8 fixture 已验证边界。前一 CI 的两项事实失败仍公开，不用 auth pass 替代质量 pass；Windows 按 N4/N5 独立复测 |
| 真实受限账号 | 用户已决定保持未测；不构造 fake 账号代验 |
| CLI 授权超时/取消 UX | 首次浏览器定位延迟导致超时后出现通用重试提示；重开面板重新读取 401 可再次登录。本轮不加取消/自动恢复机制，保留既有边界 |
| Token 自动续期/共享根因 | 已证实拒绝与正常重登恢复，未取得 rotation/expiry/copy 因果；归 CLI/平台所有权，不扩大插件本轮范围 |
| 全 home 或历史 B 批无改动证明 | 没有完整前态；本轮仅 9 选定路径，Windows 旧 A 哈希不能延伸到 B。不事后补造 |
| 所有平台镜像对应 Foundry main | 已采真实 tag/imageID，但无每镜像 build-SHA 证据；不由版本或 tag 推断，当前也不重部署平台 |
| 深层库存超时、平台 #2029、模型完整性/口径问题 | 保持平台/模型的独立问题与评测，插件不重算业务或自动纠错 |
| 历史故障用户机器、设置向导重现 | 缺当地真实诊断/稳定复现；继续用诊断候选取证，不宣布已修复 |
| 发布统一 -7 | 等新 Windows 回传及用户发布决定；本轮只 build-only，未发布/tag/dist-tag |
