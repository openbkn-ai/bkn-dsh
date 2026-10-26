# 第58轮：回补 Host 实际加载冻结 -32 与 CLI 管理认证

日期：2026-10-25。**本轮四个新隔离副本的 Host 模块实际加载与 CLI 管理认证均通过**。范围是两版完整 npm/web Host、两版匹配 Electron 的官方 Desktop 后端入口；不包含签名 GUI、浏览器 Remote carrier 或 B1。`local-development-preacceptance`、`ciRun=null`、`formalAcceptanceEligible=false`。#105 和总验收继续开放。

## 身份与隔离

主树仍为 `feat/021-localization-login` / `933b0ab251c75461ece1ada6145a9487e7eb04d1`，原修改保留。冻结 -32 仍为 `46626510825fe9146aef12c27a1724acbb455aeac22aa600358add0fc8e1c9f8`，231465 bytes、82文件；没有构建或改动 -30/-31/-32。

仅从第57轮已核验的回补 Host 建立新的 `release/local-58/hosts/` 副本。npm/web 为原完整 Mac arm64 派生包逐文件复制；Desktop 为已回补的官方后端提取目录复制，继续使用原官方 Electron 的 Node mode，不修改或运行 GUI shell。每个副本复制已安装冻结 -32 的对应 profile，82文件安装身份相同；未重复包安装、UI或打包测试。各自使用新 DSH home、新 CLI `BKN_CONFIG_DIR`；原个人 CLI 配置和现有 Host/home 不参与写入。

官方 CLI/SDK 保持0.2.0，底层 Node24.19.0。安装SDK的9文件与已冻结官方tgz逐字节一致，原wrapper保持；源码确认 BKN_CONFIG_DIR 覆盖默认配置目录。先在各 Host 的**原生 subprocess**执行只输出布尔值的环境检查，确认该目录确实传递到 CLI执行世界，再允许正式认证；没有通过环境 BKN_TOKEN 或手工Token配置绕过官方CLI。[CLI身份](CLI-IDENTITY.json)。

## 实际加载和认证结果

| 新副本 | Host/实际运行时 | 实际冻结 -32 模块 | 认证与连接 |
|---|---|---|---|
| npm-old | DSH0.2.0-rc.2；Node24.19.0 | 3个原生loader条目state=2；业务Service类与新安装目录模块是同一身份 | 过期→真实CLI浏览器登录→authenticated；2网；MCP工具注册；独立CLI expired=false |
| npm-rc3-retry | DSH0.2.1-rc.3；Node24.19.0 | 同上 | 同上；首轮准备超时另保留 |
| desktop-old | DSH0.2.0-rc.2；Electron44.0.0 / Node24.18.1 | 同上；官方后端ready IPC | 同上；不代表GUI通过 |
| desktop-rc3 | DSH0.2.1-rc.3；Electron44.7.0 / Node24.21.0 | 同上；官方后端ready IPC | 同上；不代表GUI通过 |

四例都在**已运行的完整 Host 里**验证了 bootstrap/business/diagnostics 三条真实加载状态，以及当前业务 Service 是从新安装路径导出的冻结模块类构造；不是只读 package.json 或仅凭owner解析。Node resolver与官方PluginPackages API选中同一物理MCP模块，实际文件SHA256均为 `b3cd7156c0b8639656ce117530fec4d006b74cafdc9a78ac426fec084e62972c`。后续在新profile上独立只读核对，旧版共用Cordis4.0.4/Schemastery3.18.4，新版4.0.5/3.18.5，无混装或分裂；原插件82文件运行前后相同。

认证实际调用冻结包公开 `remoteStatus`、`remoteBeginLogin` 和原生诊断方法，通过其原 `OpenBknCliSubprocess → AuthCoordinator → credential synchronization → OpenBknMcpManager` 路径执行；没有替换这些对象、拦截CLI结果或注入假凭据。每份副本初始status都是authentication-required。由Host原生subprocess发起官方CLI设备登录，computer use使用既有测试账号完成平台自己的确认/登录，返回2个知识网络；随后同一Host status为authenticated，`mcp__openbkn__bkn_start_interaction`已注册，共25个OpenBKN工具schema可见。

退出后分别用官方CLI独立读回各新配置：`baseUrl=https://192.168.50.129`、`hasToken=true`、`expired=false`。CLI token与对应隔离DSH vault的OPENBKN_MCP_TOKEN在内存中逐值相等，只保存相等布尔值，不保存token或其哈希到公开证据。四份被动诊断的bootstrap/business/diagnostics、CLI、登录、context-loader和network-list检查通过。诊断内`pluginLoadedVersion`仍为null，保持未知；本轮实际加载证明来自另一条loader/模块身份/82文件证据，未伪填UI诊断字段。[分例验证](HOST-AUTH-VALIDATION.json)。

这些是原生服务层受控调用，**没有点击插件登录按钮，也没有验证Remote stream消费/取消、Job收尾因果、浏览器关闭或GUI可读性**。浏览器实际完成的是官方CLI授权表单，不是Host UI验收。Desktop组合继续省略GUI launcher版本环境，两版都有与上轮相同的遥测serviceVersion缺值及client等待警告；本轮未将整套Desktop组件标为健康。

## 首轮未通过与浏览器边界

首轮npm rc.3在准备既有凭据及观察页面期间超过官方CLI默认等待。浏览器之后显示授权成功，但CLI已超时，原失败报告/日志、home与CLI配置全部保留，不计认证通过；后续使用新的独立home/config重试成功，Host代码、插件包和默认等待均未改。没有把这次准备超时诊断为回补缺陷，也不拿它关闭默认超时UI验收。

Chrome页面可直接打开，地址栏仍有既有“不安全”状态；本轮没有点击安全拦截继续、导入CA或改变证书例外。CLI与Host均通过原NODE_EXTRA_CA_CERTS使用正式HTTPS端点，未关TLS校验。**浏览器证书信任不记通过。** 授权表单未重置密码或请求保存密码，临时用于读取既有本地凭据的文件已移除。一次通用关闭键遇到noWindowsAvailable，恢复空白窗口后，改用当前任务标签的专属AX关闭控件；不据此推断产品浏览器生命周期因果。[准备与限制](PREPARATION.json)。

## 保留、复用和未执行

副本原有文件全部存在。相对来源，成功的npm副本47文件、Desktop副本82文件中，只有隔离.credentials.yaml正常续期及新验证cordis.patch.yml变化；其他原文件逐字节保持。首轮失败npm只变验证patch。新副本保留，未用旧凭据备份覆盖续期状态。[副本变更](HOME-COPY-CHANGES.json)。原个人CLI三文件、两个来源home、受保护工作树/home、原ASAR和冻结包的核对见[PRESERVATION.json](PRESERVATION.json)。

五次任务Host（含首轮准备超时）均exit0；Desktop使用官方shutdown IPC，npm使用owned子进程SIGTERM。原生subprocess已完成，任务路径进程无残留；50695/50939/51020/51083/19387端口释放，本轮日志EPIPE均0。这不是长时/B1或Windows runner结论。[退出记录](CLEANUP.json)。

没有重跑第53/57轮已通过的跳转向量、同源/跨源合成对照、归档迁移、tar或完整性脚本测试，也没有重跑已通过UI/B1/G6。此轮重新核对文件/closure属于新副本身份保全，不作为旧测试的新成绩。未请求模型、业务工具执行、bkn_start_interaction/finish、Sandbox、Function/run_code或BOM/CSV；只进行了正常OAuth认证、MCP握手/工具目录及网络列表读取，没有重新全量审计平台数据库或宣称其他会话零写入。

正式平台两个相关服务当前读回仍是原0.2.0镜像；没有替换、升级、迁移或配置操作。[服务身份](PLATFORM-SERVICE-IDENTITY.json)。DSH上游读取时master仍22ddee37、最新rc.3；Foundry main在第57轮后新增4提交/54文件至d31470a8，涉及concept-group overview范围、授权technical root-service选项、archive重试重新验对象和有界批次。定向评审未见本轮MCP/CLI/auth调用路径变动；本插件也不读取这些overview/root-service/archive端点。未部署main，不改冻结适配。[上游评审](UPSTREAM-REVIEW.json)。

没有提交、推送、CI、PR/tag/发布或远端issue写入。Windows继续只按固定d20a266补 -31 UI/-30 W-LIFE，未扩容或将其转记rc.3/#105。本轮关闭的是“本地回补Host实际 -32模块加载和CLI管理认证”的范围内缺口；#105的签名GUI/Windows/正式候选门槛仍开，其他合同缺口不变。[剩余项](BLOCKERS.md)。当前无需用户配合。
