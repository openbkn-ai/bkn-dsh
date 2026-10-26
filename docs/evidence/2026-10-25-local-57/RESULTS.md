# 第57轮：#105 完整 Host 交付预验

2026-10-25。已补齐两固定基线的完整 Mac npm/web 派生交付物、package 声明与归属、迁移后实际 Host 验证，以及匹配 Electron 的官方 Desktop 后端入口隔离对照。[完整交付方案](HOST-DELIVERY-PLAN.md)明确 GUI签名/分发、实际CLI授权与 Windows 的剩余门槛。**#105保持OPEN，完整合同未通过**；本轮为 `local-development-preacceptance`、`ciRun=null`、`formalAcceptanceEligible=false`。

## 固定输入与保护范围

主树 `feat/021-localization-login` / `933b0ab251c75461ece1ada6145a9487e7eb04d1`，保留已有修改。旧 DSH 0.2.0-rc.2 /639ed015、新 DSH 0.2.1-rc.3 /1f81c047；SDK仍为2.0.0/2.2.0。没有改 compat pins、产品源码/生成文件、原运行根、原签名应用或冻结 -30/-31/-32。正式平台仍为192.168.50.129的原样0.2.0，本轮没有访问其业务接口、认证、数据库或Sandbox，也不把本轮保护声明当作重新审计12表数据。

所有构建、组装、提取和启动只在新的 `release/local-57` 副本。完整 npm 归档不带 home、日志、凭据或业务原始记录；其内只对源依赖白名单取件，排除旧运行根夹带的任务 home，并从新副本移除未使用私有fixture。官方 Node24.19.0与两版pnpm取件摘要/registry integrity已核对，未改变系统安装。代码来源及交付额外差异见 [交付差异审计](DELIVERY-DELTA.json)；产物实际摘要见 [ARTIFACTS.json](ARTIFACTS.json)。

## 新增验证

| 形态/基线 | 原包正对照 | 回补交付/副本 | 结果范围 |
|---|---|---|---|
| 完整 npm/web / 0.2.0-rc.2 | 同源成功；跨源307第二源收到1次合成 Session+问题 | 最终归档解包到含空格新路径后，同源成功，第二源0次 | 完整官方web配置、两个原生MCP实例、实际ToolRuntime和新临时Session；非模型 |
| 完整 npm/web / 0.2.1-rc.3 | 同上 | 同上 | 同上；运行Node24.19.0 |
| Desktop backend / 0.2.0-rc.2 | 同源成功；第二源1次 | 同源成功；第二源0次 | 未修改官方后端入口；Electron44.0.0/Node24.18.1；ready IPC |
| Desktop backend / 0.2.1-rc.3 | 同上 | 同上 | Electron44.7.0/Node24.21.0；ready IPC |

这8个最终对照场景实际加载的原MCP JS为758d8fc4…f5dd，回补为b3cd7156…972c。不是仅直接调用 SDK/helper。请求记录只保存合成凭据/Session/问题是否匹配的布尔值；没有真实业务问题或平台token。原包跨源时Authorization已被fetch去除，不能写成Bearer也外传；合成Session和问题实际被转发。回补第二源0请求，不以错误提示代替接收端计数。详细记录见 [HOST-VALIDATION.json](HOST-VALIDATION.json)。其中另保留一次归档前旧版回补检查，单列准备阶段，不扩大最终8场景含义。

Desktop以官方入口真正选择desktop profile，使用源码一致的web bundles创建新profile；没有启动GUI、重跑UI/B1或修改原ASAR。stock/protected都省略原生launcher的DSH_CLIENT_VERSION，因此product telemetry校验缺值、client analytics等待；该警告是隔离组合限制，不能宣称整个Desktop健康。所有目标Host正常退出；Desktop使用IPC shutdown，npm使用owned子进程SIGTERM，未清理用户进程。端口与进程收态见 [保护回执](PRESERVATION.json)。

两版 package 级声明生成exit0；原5份声明token相同，新增1份内部helper声明，不宣称字节相同或全仓类型检查。[声明对照](DECLARATION-API.json)。两份完整包验证清单、相对symlink、原用户路径及结构化file:引用检查通过；新home复制保留原内容、排除node_modules、拒绝已有目标和symlink，并检出bundle意外新增文件。[保护脚本验证](DELIVERY-HELPERS.json)。

冻结 -32 的新复制profile在两版官方PluginPackages API和Node resolver下都选择同一物理回补MCP文件；rc.3两个返回路径拼写不同但realpath相同。该检查不挂载OpenBknMcpManager、不运行CLI/平台查询，不能冒充完整 -32 认证或业务验收。后续插件安装/Host更新仍需重查实际owner闭包。

## 已通过项复用与准备错误

第53轮官方同源策略、52向量、SDK跨源/同源各30、abort65ms、普通MCP/SSE/DELETE/401和两基线服务组合检查均直接引用，没有重跑。既有 -30/-31/-32 UI、B1、Windows argv、tar、目录选择、G6、BOM/CSV也没有重跑。

准备阶段保留三类纠正，未当作产品缺陷或通过证据：根workspace不能直接resolve TypeScript，改为插件package锚点；rc.3生成shim仍含更早round53绝对路径，按实际两个来源改为相对路径后重新组装；最初最小假Session被完整Host会话hook拒绝，没有dispatch，改为真实新临时Host Session后才完成对照。前两次假Session日志/失败报告与被替代的组装目录全部保留。没有绕过原生hook，未用无调用结果证明安全。

## 交付与剩余门槛

完整旧版归档SHA256：`1c864db150fed9176813f91fc4355c8926191056513d67c4749ec3ef1ec0183e`，209191220 bytes。新版归档：`97e93bc6ce53ed5b8ee12f23d808bf187bbc881fed7c579cd15392a4954e7d23`，235871387 bytes。两份12文件payload有独立摘要，不混称整包。源码packaging addendum在第53轮补丁后应用检查通过，完整MCP许可与派生身份进入包。没有把上述本地包称为官方未修改制品、正式CI候选或签名发行。

当前不能关闭#105：未交付带回补的签名GUI/Windows制品，未在实际插件候选上完成CLI-managed授权/加载边界，SDK全局/OAuth未修。Mac源码策略/完整npm Host/裸Desktop后端分别有证据，不能互相顶替。见[剩余项与最小后续](BLOCKERS.md)。Windows另开会话仍只按d20a266补原来的 -31 UI / -30 W-LIFE；本轮没有给它增加任务或发送消息，等回传再合并。

DSH master仍22ddee37、最新rc.3；Foundry main前进至baa9367c（#2482），定向评审是technical archive按完整搜索冻结doc版本/条件删除、未完成搜索或变化保留cleanup_incomplete，不自动处理旧档；不是本插件消费的MCP/Interaction/business读取合同变化，没有部署、迁移或修改冻结包。仅为定向评审，非完整上游审计。[上游记录](UPSTREAM-REVIEW.json)。

本轮没有提交、推送、CI、PR/tag/发布、远端issue写入、平台替换或证书信任调整。现有文件、冻结输入、原home/ASAR及owned进程保护见 [PRESERVATION.json](PRESERVATION.json)；私有日志、临时web授权URL和复制profile均留本机，不进入公开证据。当前无需用户登录、选择目录或提供凭据。
