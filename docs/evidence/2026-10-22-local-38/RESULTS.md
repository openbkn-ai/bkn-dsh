# 第38轮：不依赖 Sandbox 的 B1 长时补验

2026-10-22，Asia/Taipei。**本机四个组合的 B1 长时协议路径通过**：在相同 Host 进程连续等待4小时30秒、观察到正式 CLI 凭据自然过期之后，正常刷新、真实浏览器重新登录及业务配置 owner 重载后的新 Session 均完成实际普通查询。本轮没有修改生产插件或重建包，继续使用本地 **-29**；完整0.2.1合同与模型G6仍未通过。

## 固定环境与范围

- 正式 OpenBKN `v0.2.0`，目标仅 `https://192.168.50.129`；正式 CLI 0.2.0，TLS保持校验。不部署安全回补、不安装企业扩展、不替换平台。
- 插件 `0.2.0-rc.2-openbkn.0.2.0-29`，82文件、231067字节，SHA256 `dec3417310b4e50a80f987c69f573e41d78725ae2caabdd6ebfbf00b8a3914f6`。四份实际安装在开始和收尾均逐文件对照同一tgz，package.json按既有键序无关规则对照。见[候选身份](./candidate-29.json)，仍为 `ciRun=null`、`formalAcceptanceEligible=false`。
- 官方 Host 为 `0.2.0-rc.2 / 639ed015` 与 `0.2.1-rc.2 / 687f282`，各运行隔离 Mac Desktop 和 npm/web 后端；没有改写官方 Host。原生 Desktop 主进程与后端分别监测；npm浏览器页面没有被宣称连续打开四小时。
- 本地确定性协议驱动仅选择 `bkn_start_interaction → query_object_instance → bkn_finish_interaction`。工具结果、凭据同步、MCP、Session与Interaction均来自实际 Host / 正式平台；不是远程模型回答或G6。查询固定 `product_code=382-000005` 的销售订单、limit=1、JSON，实际总计数基准40。不调用Sandbox、Function或CSV，也不使用第37轮只读转发夹具。
- 门槛在结果产生前固定，见[本轮长时合同](./B1-LONG-CONTRACT.md)。原第34轮 Unauthorized 失败和当时短流程证据保持原样；本轮补相应持续时间与自然过期路径，不扩称所有历史触发条件均已排除。

## 实际持续时间与过期

06:52:02.358开始保活，10:52:32.432达到门槛。monotonic累计 **14430.33秒**，UTC墙钟累计14430.07秒，共477次采样，最大采样间隔30.803秒，单次累计墙钟/monotonic最大差0.5秒。四个后端及两个原生主进程的PID、启动时间与四个监听端口均保持不变。

基线前正常CLI刷新建立有效登录；07:49:13.298首次采样到正式CLI报告自然过期，此后保持到四小时门槛。期间凭据变化次数0；监测程序只读CLI status及不刷新的token读取，在内存比较，不保存凭据或摘要，不调用Host RPC。没有改时钟、缩短TTL、重启Host或通过查询保持MCP活跃。此结论不排除Host自身协议心跳或自动连接行为。详见[真实采样摘要](./soak-summary.json)，477条原始采样保留于本机证据目录。

## 长时后的实际检查

门槛后四个Host均先返回 `authentication-required`。正式CLI一次正常 `auth token` 刷新后，凭据确实变化、expired=false；各Host随即列出2个原有网络并完成新Session查询。随后从每个Host的公开原生 `beginLogin` 发起独立浏览器设备流程，用computer use正常确认和填写既有管理员凭据；四次均见成功页，CLI/Host同步成功且凭据变化。未改变账号、权限或授权时长，未保存密码。

最后通过公开原生配置编辑器将CLI路径改为本轮透传入口再改回正式CLI，触发每Host两次业务配置重载；平台地址始终129。配置API等待重载完成，随后再次创建新Session和Interaction。此处测试的是公开Remote/原生编辑器路径，**不冒充四组合登录按钮或配置按钮UI重跑**。

| Mac组合 | 后端PID / Desktop主PID | 基线 | 正常刷新后 | 浏览器重新登录后 | 两次owner重载后 |
|---|---|---|---|---|---|
| Desktop 0.2.0-rc.2 | 15209 / 15163 | 40 | 40 | 40 | 40 |
| Desktop 0.2.1-rc.2 | 15210 / 15162 | 40 | 40 | 40 | 40 |
| npm/web 0.2.0-rc.2 | 15159 / 不适用 | 40 | 40 | 40 | 40 |
| npm/web 0.2.1-rc.2 | 15160 / 不适用 | 40 | 40 | 40 | 40 |

每格均为实际新Session/Interaction中普通查询的总计数，不是模型评分或返回40行完整明细。共16个不同Interaction，逐条回读平台标准记录 `execution_status=completed`，operations均为唯一 `query_object_instance / completed`；协议驱动未记录Unauthorized或setup失败。见[分阶段身份和结果](./b1-phases.json)、[平台独立回读](./b1-platform-operations.json)、[收尾前原进程身份](./post-query-identity-check.json)。

两个实际Desktop另打开了本轮 `after-owner-reload` 会话，UI明确显示已完成、正确阶段标记及真实开始/查询/结束轨迹；完成页截图见[旧版](./screenshots/desktop-old-after-owner-reload-native-completed.png)、[新版](./screenshots/desktop-new-after-owner-reload-native-completed.png)。四份浏览器登录成功页也保留在screenshots目录。原始轨迹截图含业务行，仅保留本机，不复制到本目录。

## 保留、收尾与异常

12张业务表共78635行、10张选定业务配置表与用户既有 `preflight.py` 修改保持不变。operator-integration及sandbox-control-plane完整Deployment spec、UID、generation仍一致，Sandbox聚合仍670条执行；未读取历史token值。见[业务保留](./preservation-check.json)、[平台保留](./platform-after-check.json)。

四个隔离任务patch已按原字节恢复，package/lock及已有workspace注册文件一致；16个新Session/Interaction与证据保留。任务凭据因正常授权刷新更新，保留当前有效值，不回滚旧凭据。个人DSH五份选定配置文件校验一致，未覆盖。全部任务后端、原生应用、loopback协议驱动及两组防睡眠进程已退出，5个端口释放；未改系统电源设置。见[清理检查](./cleanup-check.json)。正式CLI收尾仍 [expired=false](./cli-status-final.json)。

首次清理的端口断言曾失败：对已退出旧版应用调用CUA的AX状态读取会自动重新启动它，且这次启动使用个人 `.dsh`。已根据新PID/启动时间/argv/cwd定位，并用正常退出关闭，随后仅用OS进程与端口检查验证退出。该误启动发生在16个Interaction及原进程身份检查完成之后，不计作长时过程中的重启或新验收回合；没有发送模型问题。再次核对个人五文件与Sandbox聚合均未变化，未恢复/覆盖个人文件。原始失败与[自动化异常记录](./cleanup-relaunch-observation.json)保留，不将清理第一次失败写成一次成功。

辅助命令另有三处已纠正的错误：曾把正式CLI的opaque token当JWT解析、进度转发helper的一次async语法错误、收尾校验误把全部tracked文件当作本轮新增。分别改为正式CLI过期元数据、正确的async调用、未跟踪文件差集加tracked diff检查后完成验证。token值只在内存，未写入证据；这些命令错误不计作产品失败或业务答案补过，原始工具失败记录保留。

源代码、候选与构建输入本轮未变；因此未重复第37轮已通过的两套611 pass / 1 Windows skip、类型、66仓库检查和受控Host测试。文档更新前，596个原有修改/未跟踪文件的内容均一致，HEAD和索引未变；随后仅增加本轮证据及更新5个入口文档，见[工作区保留检查](./workspace-preservation-check.json)。没有提交、推送或CI。

## 上游与仍开放的门槛

长时前后均只读刷新两个上游。DSH main仍687f282，最新release记录仍 `dsh-v0.2.1-rc.2`（prerelease）；Foundry main较第37轮增加6b80afb的Cypher数据集/索引查询支持及run_cypher schema/文档变化，正式release仍v0.2.0。未改变本轮三个工具、认证或MCP owner契约；没有更新pin、启用新能力或部署。见[收尾刷新](./upstream-refresh-final.json)与[影响判断](./upstream-impact.json)。GitHub releases/latest不包含此DSH预发布并返回404，随后以releases列表确认，未误判为版本消失。

Windows远端分支再次只读核对仍是 `handoff/windows-local27-20261022 / fd879740e4292836a24dc1e411ee335619ba4c41`，继续原-27，结果尚未回传。它不能覆盖-28/-29取消与焦点修复差异；本轮不更新交接分支。完整BOM/G6、Sandbox安全环境、独立低权限、非空原生解释/联动、完整8组合与最终固定CI候选仍开放，见[剩余门槛](./BLOCKERS.md)。当前不需要用户重新登录或选择目录。

原始采样、Host私有日志、受管Session、查询轨迹与已接受请求保留于本机 `release/local-38/` 及对应隔离home，本目录只复制选定元数据及无业务行的截图；见[本机证据清单](./local-evidence-manifest.json)。
