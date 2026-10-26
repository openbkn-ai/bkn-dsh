# 第64轮：冻结 -32 的真实业务模块自动挂载 profile 回补

2026-10-26。已确认这条较小交付路线在本机成立：**原官方 Host 代码＋新隔离 profile 内的 MCP payload**，无需独立 GUI 发行。旧 rc.2/新 rc.3 Desktop 后端由冻结 -32 的真实业务服务自行挂载回补；随后仅补一次原官方 rc.3 GUI 启动、同一业务挂载与菜单退出。

这是 `local-development-preacceptance`，`ciRun=null`，`formalAcceptanceEligible=false`。Windows第63轮8/8保留原身份，不重跑，也不把本轮Mac结果转记Windows或最终候选。

## 本轮实测

| 新隔离副本 | 真实业务自动挂载 profile MCP | 合成连接/目录 | 跨源307 | 退出 |
|---|---|---|---|---|
| 旧0.2.0-rc.2 Desktop后端，Node24.18.1/Electron44.0.0 | PASS | PASS | 拒绝，第二源0 | 原生shutdown IPC，exit0 |
| 新0.2.1-rc.3 Desktop后端，Node24.21.0/Electron44.7.0 | PASS | PASS | 拒绝，第二源0 | 原生shutdown IPC，exit0 |
| 原官方0.2.1-rc.3 GUI＋另一新profile | PASS | PASS | 不重跑 | 欢迎页可见；原生菜单退出，exit0 |

实际加载均为冻结 -32 的三个loader组件active。业务Service与冻结bundle导出类身份相等；调用其公开 `remoteConfigureToken`，由服务自己的 `OpenBknMcpManager` 挂载MCP。观察器**在挂载后**才导入解析结果，确认registry已存在且与业务manager的fiber.runtime为同一对象；观察器没有调用 `ctx.plugin(McpClient)`、改解析器或注入import hook。因此这次覆盖了第63轮“手动导入factory”未覆盖的真实静态导入/挂载边界。

只连接127.0.0.1合成MCP和目录端点，使用合成token。后端第二次公开配置触发刷新并拒绝跨源307。无任何 `tools/call`、真实CLI、平台认证、模型、Interaction或业务执行。GUI只补外层官方入口启动后的实际挂载，不重跑跨源向量、受影响UI、登录或B1；也未为显示页面添加账号/API Key。

[结构化验证](VALIDATION.json)保留逐项结果、实际物理路径、已挂载实例身份、请求类型及收态。直接后端入口缺GUI serviceVersion，两个官方遥测相关组件未激活；三个业务组件已激活。该已知入口限制不算完整GUI通过；最后一行确实运行原官方GUI，并非把两轮后端/UI证据拼接。

## 输入与保全

- -32仍为 `46626510825fe9146aef12c27a1724acbb455aeac22aa600358add0fc8e1c9f8`；三份副本退出后分别核对82/82文件。冻结business.js为 `9901a046cb3274a56ac47cc1734d669e7a012dab25ef7e34fe3643a38b8d1081`。
- profile回补均为原12文件payload，入口 `b3cd7156c0b8639656ce117530fec4d006b74cafdc9a78ac426fec084e62972c`。Host安装根MCP保持stock `758d8fc473b700b5d351158d06ce9f9e92c16e8b25497b08bb7bd2122a87f5dd`。没有重建插件/Host或采用其他发布线。
- 两版原ASAR摘要保持，官方rc.3 App退出后deep/strict代码签名验证通过。新home只取无业务配置的profile清单和依赖；未复制登录凭据、会话、业务patch或workspace绑定，合成凭据仅写新任务home。
- 本轮前已有3951个仓库文件在运行验证后均无变化；随后只更新四个已有计划/合同/入口文档，未改生产源码、测试或冻结制品。HEAD、index、worktree refs不变。原-30/-31及d20a266 KIT、-32和a362d783 KIT逐项摘要匹配。
- owned进程退出0，任务Host监听端口释放，两源夹具关闭；平台服务、业务数据配置及证书信任无本轮操作。没有推送、CI、远端关单或全库/全机审计。

**系统偏好例外：** GUI启动后，`com.apple.LaunchServices/com.apple.launchservices.secure.plist` 整体摘要变化。当前dsh URL handler为 `com.deepseek.dsh`，源码确实在packaged启动时调用 `setAsDefaultProtocolClient('dsh')`；但启动前只记录摘要，没有保留原文，不能证明仅修改时间字段变化或准确归因整个文件差异。本轮未凭猜测回写，也不宣称全部系统配置逐字节保持。GUI菜单点击后AX读回timeout，独立进程证据确认exit0与无存活Desktop；不把AX超时伪报成另一次菜单退出失败。

保全范围见 [PRESERVATION](PRESERVATION.json)。首轮准备误用第57轮“整runtime”提取器处理MCP子目录，其末尾摘要路径不存在而退出；stock文件已复制并随后与原ASAR逐项相等，修正仅限本轮准备脚本。首轮stderr未另存，不补造原件。没有为此修改Host、插件或要求Windows重跑。私有脚本、完整Host日志和任务凭据留在 `release/local-64/`，不作为公开取件包。

## 最小交付与停止条件

当前选择profile层放置方案：停止任务Host，备份目标profile原MCP目录（若有），将匹配Host的现有12文件payload放到该profile的 `node_modules/@deepseek-ai/dsh-mcp-client`；核对冻结-32的82文件及payload清单；正常启动后验证**真实业务manager已挂载的入口**，停止后可用原目录恢复。现有payload摘要和许可证/NOTICE不变。本轮只实施在全新副本，不操作日常profile。

这是固定两版本正常启动路径验证，不承诺未来包管理器重装、清理或Host升级后保留；本轮不为这些未要求的场景开发安装器、迁移器或更新体系。选择实际交付包时只固化所需profile步骤和恢复说明，原App继续采用官方来源和原签名。

Windows后续若补本路径，最小任务仅在已有官方rc.3新副本上，放置同一-32/payload，由真实业务服务自动挂载并核对实例/物理包，合并一次官方GUI启动和正常退出；不重跑已过8/8手动factory、UI、argv、tar、登录、B1或W-LIFE。当前没有新增交接推送或Windows执行授权请求，不自行派发任务。旧Mac GUI与其余未测形态不自动记PASS，最终候选按实际变化补证。

| 六组工作 | 必须保留 | 当前明确不增加 |
|---|---|---|
| #105 | 实际业务加载、profile交付/恢复及本线风险处置 | 独立GUI入口/构建/签名/appId/更新服务、全量SDK改造 |
| 登录/UI | 复用已过项，发布前分诊已观察异常 | 全量Job定责、句柄注入、新长时/RDP或重复登录 |
| 原生溯源 | 可用真实非空样本或用户范围决定 | 重查同一404、自动企业扩展部署 |
| G6/BOM/安全 | 安全前提满足后查实际失败与合同业务题 | 绕过Sandbox安全、答案仲裁、重复业务算法或IAM系统 |
| 两Host兼容 | 最终候选真实加载及实际差异 | 八份完整UI/G6/长时/升级矩阵 |
| 发布 | 授权后的固定CI候选、相同制品和必要验收 | 提前CI/发布、每轮全库审计或重跑无变化检查 |

#105仍开放：本次证明的是固定Host、新profile中真实OpenBKN业务MCP加载与局部保护；没有证明所有原生SDK/OAuth调用均受保护，也没有完成Windows真实业务加载、旧Mac GUI或最终CI候选。已过子项停止重跑；剩余处置按[六组工作](../../plans/0.2.1/REMAINING-WORK.md)。本轮无需用户登录或提供资源。

## 上游定向检查

DSH master仍22ddee37，最新正式可取rc为0.2.1-rc.3；Foundry正式release仍v0.2.0，未部署main从第60轮83ddfcf0前进8提交至081f7fd5。定向评审canonical路由/旧别名移除、finish权威ACK与有界重放、artifact故障分类，以及Cypher值节点说明；main不部署、不启用新工具，不改冻结插件/平台合同或fixture，不作未部署main兼容声明。[UPSTREAM-IMPACT](UPSTREAM-IMPACT.json)记录原始来源标识和范围。本轮实际业务验证用合成本地端点，不是正式平台tools/list/G6复验。
