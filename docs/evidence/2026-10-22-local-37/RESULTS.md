# 第37轮本机验收：取消链路与诊断刷新焦点

2026-10-22，Asia/Taipei。当前本地候选为 **0.2.0-rc.2-openbkn.0.2.0-29**；修复了真实 Desktop 溯源读取不随面板关闭取消，以及诊断重新采集后焦点落到 BODY 的问题。此次未提交、未推送、未触发 CI，正式 OpenBKN 0.2.0 保持原样。完整合同与 G6 尚未通过。

## 候选与环境

- 分支 `feat/021-localization-login`，HEAD 保持 `933b0ab251c75461ece1ada6145a9487e7eb04d1`，索引未变；保留原有工作区修改。
- 当前 -29：82 文件，231067 字节，SHA256 `dec3417310b4e50a80f987c69f573e41d78725ae2caabdd6ebfbf00b8a3914f6`。本地包身份见 [candidate-29.json](./candidate-29.json)，`ciRun=null`、`formalAcceptanceEligible=false`。
- 两个 Host 仍是官方 `0.2.0-rc.2 / 639ed015`、`0.2.1-rc.2 / 687f282`；本轮检查上游未发现 pin/release 或已核对源基线的新变化，见 [上游刷新](./upstream-refresh.json)。没有更新宿主 pin 或部署。
- Node 24.19.0；旧源码验证 pnpm 11.7.0，新依赖源码验证 pnpm 11.28.5，候选继续使用固定旧生成器。两套依赖分别是 Cordis 4.0.4 / Schemastery 3.18.4 与 4.0.5 / 3.18.5，Zod 均为4.4.3。
- 两版原生 Desktop 使用既有隔离应用与 home；npm/web 新建本轮隔离 home，以官方 CLI 安装包，未覆盖此前 npm -23 安装。4 个组合的实际安装各核对同一包82文件。npm 运行时的只读模块解析观察没有改写返回值；观察到插件自身可解析到私有 Schemastery 3.18.5，不能把 Host 根依赖 pin 扩称为所有库全局单例，也没有据此改依赖。

## 实际失败、修复及证据边界

原 -27 的实际 Desktop 使用已有真实回答，不新增业务问答。关闭面板后，旧版4个HTTP读取约在21.5秒后才因各自期限断开；新版仍继续约14.8秒，到随后退出 Host 时才断开。旧版冷态 CLI 状态读取在面板关闭后继续等满60秒，之后还派发了4个读取。[原始失败摘要](./cancellation-before-fix-summary.json)保留时间戳；不把新版的 Host 退出误写成面板取消或完整超时验收。

- -28 增加单结果的原生 Remote stream，保留原 unary 端点；Client 在关闭/取消时释放 stream。没有接受浏览器任意平台URL、Interaction或凭据。
- HTTP reader 将操作 signal 传入 CLI 凭据解析。同一次请求的各面板共享一次查验，独立请求分开取消；取消/owner销毁后的晚到 token 不缓存、不派发 HTTP。
- -28 在两个实际 Desktop 与两个实际 npm/web 上，分别确认延迟中的 CLI 收到 SIGTERM 且进程退出、4个HTTP读取随关闭/Escape断开、焦点返回溯源按钮，之后重新打开可读。见 [4组合取消记录](./cancellation-actual-28.json)。页面显示真实 CE 404，标准记录与本地时间线独立可读，不制造非空解释。

这组验证采用同机、两跳均校验证书的只读转发，延迟正式平台原响应；CLI 使用正式登录，验收包装只把同机平台地址映射到两个转发端口。没有伪造 token、平台业务响应或模型答案。npm 为读取而导入的指定第35轮历史会话逐字节一致，不是新模型执行结果。

随后在 -28 的两个实际 npm/web 上复现诊断“重新采集”后焦点为 BODY；只读DOM确认 `inDialog=false`。-29 保留刷新按钮在 loading、成功、失败、重试各状态中的节点身份，补充两个组件回归。两版实际 Desktop 和两版 npm/web 均重新采集出新报告且焦点保持在原按钮；npm另用DOM确认 BUTTON / Collect again / inDialog=true。见 [修复前](./diagnostic-refresh-focus-before-fix.json)、[修复后](./diagnostic-refresh-focus-after-29.json)。失败/重试节点保留属于组件验证，未冒充4组合真实服务故障验证。

## 验证结果

| 层次 | 实际结果 | 限制 |
|---|---|---|
| 两依赖源码基线 -29 | 各612项：611 pass、0 fail、1 Windows-only skip；类型均通过 | 不替代 Windows 原生验收 |
| 仓库与包 | 66/66；82文件审计通过 | 非 CI 候选 |
| 同包官方 npm 受控 Host | 两版各6组通过，含守卫、CSV、原生输出、Remote | 脚本模型/受控平台，非真实 G6 |
| 实际取消链路 | -28 的4个Mac组合各完成CLI/HTTP取消与重新打开 | 非空原生记录和直接切换目标联动仍未实测 |
| -29诊断UI | 4个Mac组合刷新焦点、Escape返回入口、实际JSON保存/解析通过；旧Desktop中文、新Desktop及两npm英文 | 不扩称本轮重跑全部zh/en、小窗口、目录和登录矩阵 |
| -28 npm补充 | 两版语言设置zh→en、目录2网络、诊断Tab正反循环、导出、被动重新采集无新增HTTP | 刷新焦点原失败由-29修复，不能忽略 |

测试摘要及日志摘要见 [local-checks-29.json](./local-checks-29.json)，受控结果见 [controlled-hosts-29.json](./controlled-hosts-29.json)。4份真实 -29 JSON 保存在本目录，内容保持下载原样。诊断如实保留 DSH/已加载版本“未采集”、npm运行形态“未识别”，不以磁盘版本替代已加载版本证明；实际包加载由官方安装文件对照、冷启动及新Remote行为另证。

-29 相对 -28 **只有 client.js 与 package.json 改变**，Host/Remote字节全部一致，取消 Client 源实现未再改。见 [包差异](./artifact-28-to-29-diff.json)。取消链路实测保留其 -28 身份并明确沿用；目录、登录、B1 owner 修复等未受影响的历史结果也保留原包/原轮次，不写成 -29 全量新验收。

## 数据、配置与清理

12张业务表78635行及10张选定业务配置表保持不变，用户 `preflight.py` 修改保持不变。operator-integration 与 sandbox-control-plane 的完整 deployment spec、UID、generation 均未变；Sandbox聚合仍670条执行，未读取历史token值。个人DSH的5个文件摘要一致，561个原有改动/未跟踪文件仅有本轮明确修改的源码/版本文件变化，没有丢失。见 [业务保留](./preservation-check.json)、[平台保留](./platform-after-check.json)、[工作区保留](./workspace-preservation-check.json)。文档随后只在入口前追加本轮记录，不改写历史失败。

两个 Desktop 的原任务 patch 已精确恢复；两个临时 npm Host、两个只读TLS端口均已停止，4个端口释放，原生任务进程退出；隔离home、安装备份与原始失败证据保留，见 [清理检查](./cleanup-check.json)。正式CLI收尾 `expired=false`，见 [当前登录状态](./cli-status-final.json)。首轮浏览器成功但CLI超时的失败另存；第二次CLI退出0且状态未过期，未将浏览器成功单独当作CLI登录成功。

转发夹具曾因漏匹配合法的 `/mcp/` 尾斜杠拒绝请求，已修正，原始证据保留。另18条未纳入允许表的MCP请求被夹具拦截，原日志未记其method名，不能补猜分类；这组夹具不作为完整MCP/B1协议验收。允许表之外不转发，业务工具未派发，125次已观察上游TLS均校验通过。见 [只读审计边界](./read-audit-summary.json)。这些夹具/调用命令错误与生产缺陷分别保留。

截图、历史会话、进程私有日志保留在本机 `release/local-37/`，只公开显式选择的结果元数据与摘要：[本机证据清单](./local-evidence-manifest.json)。没有把业务原始历史或凭据复制到交接分支。

## Windows 与后续门槛

此前经专项授权已推送的交接分支仍固定为 `handoff/windows-local27-20261022` / `fd879740e4292836a24dc1e411ee335619ba4c41`，内容是原 -27。冻结材料本轮再次校验通过。当前会话未再次推送，未更新该分支；尚未收到 Windows 结果。它回传的 -27 结果不能覆盖后来取消/诊断焦点修复的 Windows 验证，后续需要按差异另行交接复验，不能静默把远端包替换为 -29。

完整G6、Sandbox/Function/CSV、低权限负例、CE非空原生解释、人工联动、完整8组合与最终固定CI候选仍开放，逐项见 [剩余与受阻项](./BLOCKERS.md)。当前无需用户再次登录或选目录；不再询问已决定暂不部署的安全候选。
