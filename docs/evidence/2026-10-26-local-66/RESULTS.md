# 第66轮：本机npm/Web profile路径补齐，明确OAuth条件边界

2026-10-26。用户另开Windows会话执行固定5e55d09，本轮只推进本机尚未覆盖的边界。冻结-30/-31/-32、已有Host与正式0.2.0保持，不推送、不跑CI。`local-development-preacceptance; ciRun=null; formalAcceptanceEligible=false`。

## 新增实际运行证据

第58轮npm/Web使用运行根MCP回补，第64轮profile回补覆盖Desktop后端及rc.3 GUI。此前尚未证明**npm/Web的真实业务静态导入会自动选中profile层回补**，所以本轮每个固定Host只补一次此路径，而不重跑原有安全向量或登录。

| 新隔离副本 | 原生CLI读回版本 | 运行根 | 真实业务自动挂载 | 合成连接 | 收态 |
|---|---|---|---|---|---|
| Mac npm/Web旧版 | 0.2.0-rc.2，Node24.19.0 | stock MCP | profile b3cd7156，已挂载实例身份相等 | 一次，PASS | owned SIGTERM，exit0；fixture/Host端口释放 |
| Mac npm/Web新版 | 0.2.1-rc.3，Node24.19.0 | stock MCP | profile b3cd7156，已挂载实例身份相等 | 一次，PASS | owned SIGTERM，exit0；fixture/Host端口释放 |

使用APFS COW创建新代码副本，只在新副本恢复原stock MCP；源Host不改。直接使用固定官方原生CLI入口，未修改或绕过其内部代码。新home为空，仅建立web profile及冻结82文件、匹配Host的12文件payload和Zod4.4.3，不复制凭据、模型、会话、workspace或来源home。CLI只读取新cwd/home的.env；两者均未提供.env，继承环境也未带业务/模型密钥。

复用发布交接5e55d09的原观察器字节，没有修改Windows材料。观察器调用冻结Service公开configureToken，由真实manager挂载；之后才核对registry已有实例与manager fiber.runtime相同。三组件active，Service类身份与冻结bundle一致；实际文件位于profile，MCP SHA为 `b3cd7156c0b8639656ce117530fec4d006b74cafdc9a78ac426fec084e62972c`。运行根仍为stock `758d8fc473b700b5d351158d06ce9f9e92c16e8b25497b08bb7bd2122a87f5dd`。

每版仅一次localhost initialize/工具注册/合成目录读取，**无tools/call**。没有第二源/跳转对照，没有真实CLI认证、浏览器、GUI、模型、平台、G6、Function/run_code、Sandbox或BOM/CSV。退出后各82/12文件与原tgz逐项一致；原生CLI入口及来源Host MCP摘要不变。见[逐项证据](NPM-PROFILE-VALIDATION.json)。

首次旧版私有启动脚本把外层bundle launcher的 `--home` 参数误传给原生CLI，解析器在业务加载前报缺少profile并退出1。首轮目录/日志/身份保留；纠正仅私有runner参数，以DSH_HOME和新空home运行，未改候选或Host，也不把这次harness错误归为产品缺陷。

本轮不启动旧Mac GUI，不重跑已过Mac向量/UI/B1或Windows8/8。其他形态、固定CI候选及总验收不随这两行转记通过。

## OAuth范围与过度设计边界

只读核对了[#105当前验收条件](https://github.com/openbkn-ai/bkn-dsh/issues/105)与固定源/冻结bundle。该issue把OAuth重审放在**未来引入SDK OAuth provider**的条件下；当前OpenBknMcpManager只提供显式Bearer，回补factory只转交headers及fetchWithinOrigin，没有提供SDK authProvider、withOAuth或direct auth/fetchToken。现有无provider的401停止/零discovery证据按第52/53轮复用，不重跑。

因此，本轮**不增加全局SDK/OAuth修复或完整认证审计**。这只是当前桥接的边界判断，不是SDK整体安全保证；原SDK版本/告警状态不变，其他SDK调用者未审计，后续若启用provider必须重审。未借用另一发布线-13的风险接受，不采用-11，也未关闭#105。见[来源与范围](SECURITY-SCOPE.json)。

当前六组工作继续只保留原合同需要的内容：Windows本轮最小补证、实际交付/发布处置、可用真实非空溯源样本、安全前提满足后的实际业务/G6与低权限项、最终候选身份和必要差异验收。不新增GUI发行、更新/迁移系统、全量Job调查或八份完整UI/G6；也不通过抹去真实受阻项来制造完成。

## 停止条件与保全

本机这两个新加载边界已完成，停止扩测。Windows继续固定5e55d09原范围，等待回传后统一汇总，不新增任务或更改冻结材料。已知原生路由缺失不重复查404；用户不替换平台及低权限暂缺的决定保持，不重复催促，也不绕过Sandbox安全前提做业务验证。本轮无需用户登录或提供资源。

DSH默认头22ddee37/最新rc.3、Foundry默认头081f7fd5/正式v0.2.0均与第64轮相同，无新增契约变化；未部署main、未改工具目录/fixture或扩大托管工具允许范围。

本轮已有仓库文件仅修改三份计划/合同/入口说明，原源码和未提交工作保留；HEAD/index/worktree refs、冻结包及5e55d09交接摘要保持。只检查本轮触及的文件和owned资源，没有全库或全机审计。见[PRESERVATION](PRESERVATION.json)。
