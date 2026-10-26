# 第70轮：Windows r2接收、最小退出决定与发布清单同步

2026-10-26。主会话只读取固定远端结果并同步本地文档；没有执行Host、GUI、登录、模型、Sandbox或测试，没有推送/CI/远端关单。`local-development-preacceptance; ciRun=null; formalAcceptanceEligible=false`保持。

## 固定来源及核对层次

- 执行输入：`handoff/windows-local32-profile-gui-r2-20261026` / `e7b383b96747dbeb3e6897c0e79039f7f3d1711c`；KIT SHA256 `99ccd2ff0e15077916bb25992985e2ea2a10c2763d1c7b7f9b05baf4605e5178`。
- 结果来源：[b7941883077fc101df233d83c6cec3d31254bc46](https://github.com/openbkn-ai/bkn-dsh/tree/b7941883077fc101df233d83c6cec3d31254bc46/docs/handoff/2026-10-26-021-profile32-gui-r2-windows)，结果分支`docs/windows-021-profile32-gui-r2-results-20261026`。
- 6个公开文件从该固定commit以base64取回，按Git blob SHA1、长度及SHA256核对；报告SHA256 `8f2045d869246a507b4c88c87d22b2939b995ec76df80aa6f0788411a1e41249`、manifest `ac27fc507625746b8cf0f7e05ad922bd41f02a8ec3ab5d89695da98abca4e481`与用户回执相等；manifest的4项publicEvidence逐项匹配。
- 欢迎窗公开截图已查看，可见登录/API Key按钮及右上角官方X。截图不单独证明完整UIA树、实例身份、退出或注册表恢复。
- 113项privateEvidence只保留manifest中的摘要，未读取Windows私有原件；真实加载、注册表、进程退出、清理和保全结论按远程实测报告接受，不表述为主会话独立运行。结构化记录见[接收审查](RECEIPT-REVIEW.json)。

公开原件逐字节保留在[windows-public](windows-public/results/RESULTS-profile32-gui-r2-20261026.md)。聊天摘要中的文件名/短摘要对应有错位：`verify-inputs.json`实为`c00ba427…`，`gui-identity.txt`为`1c78be0e…`，欢迎窗PNG为`0f1d582f…`；实际manifest与文件完全一致，不修改原报告。输入JSON的`hostStarted=false/windowsRuntimeExecution=NOT_RUN`是输入校验阶段输出，不将它误读为整轮未启动，也不当作GUI执行证据。

## Windows原结果与本轮验收决定

| 子项 | 原结果及接收边界 |
|---|---|
| r1漏传OS | r2在Windows通过Before守卫，原阻塞消除；只修交接controller，冻结插件、PS守卫和执行逻辑未改 |
| 输入及新profile | 按报告13项kit、82个冻结-32文件、12个payload文件、Zod复制保全PASS；没有复制业务home、凭据、会话或模型配置 |
| 真实业务自动加载 | 按报告三组件active，Service类身份与business.js `9901a046…`一致；公开configureToken触发一次loopback合成连接，registry实例与业务manager runtime同一对象，实际profile MCP入口`b3cd7156…`；无tools/call |
| 官方rc.3 GUI启动 | 公开身份文本为PID31980、实际创建UTC2026-10-26T05:03:31.1551270Z、6个进程及127.0.0.1:51385；欢迎窗截图可见。Node24.21.0/Electron44.7.0；不是完整UI或模型验收 |
| 原菜单退出 | **FAIL保留**。欢迎态无菜单/托盘按钮不可访问的判断按报告；controller等待5分钟后超时，未观测exit code，不补填0 |
| 官方关闭按钮 | 按报告点击X后6/6进程消失、端口释放，无强制清理。用户随后明确接受这一结果作为本轮最小退出依据；该口径D1已决定，不为菜单入口复跑，不覆盖其他历史菜单异常 |
| After/受限Restore | 按报告使用kit既有手工阶段补齐，当前==After/EXE归属/账号守卫通过，仅恢复三个已知写点，restored==Before，UserChoice前后不存在且ACL未改。不是controller自动全链通过 |
| 收态与保全 | 按报告owned树、端口和fixture收净，EXE/ASAR、冻结82/12、Zod与checkout保全；私有原件未独立读取 |

本轮最小profile/官方欢迎窗验证按明确D1收尾；原菜单FAIL、exit code未观测、controller超时及手工恢复偏差均保留。不据此宣布全局SDK/OAuth已修、旧Mac GUI、Windows完整rc.3 UI/G6或最终正式候选通过。#105仍按自身标准整理证据，不增加独立GUI发行/生产签名/菜单调查或把#99全部要求套成其前置；本轮未关闭远端issue。

## 已同步的最小发布清单

[待办](../../plans/0.2.1/REMAINING-WORK.md)将六组工作收为五项发布门槛：M1 #105实际交付闭环（本轮最小验证已收尾，最终配套身份随M5核对）、M2业务/G6、M3真实非空原生溯源、M4最终候选兼容、M5正式候选/发布手续。[计划入口](../../plans/0.2.1/README.md)、[合同](../../plans/0.2.1/ACCEPTANCE-CONTRACT.md)、兼容矩阵、issue规则和CLAUDE入口同向更新；历史回执字节不改。

D1仅为用户已明确的本轮欢迎态退出口径。D2 G6/BOM及安全前提、D3非空原生溯源、D4低权限负例、D5其他历史异常/环境限制全部PENDING；没有决定前仍按原合同保留FAIL/BLOCKED/未测，不自动延期、接受风险或降级。旧销售明细实际错误不能靠限制说明改为通过，ToolRuntime越权拒绝和不派发守卫仍必需。

本轮只集中呈交D2–D5选择，不另派Windows任务，不重跑8/8、向量、UI、登录、B1/W-LIFE或G6。正式0.2.0不替换是已生效决定，不重复请求部署；最终CI、推送、合并/tag/发布授权没有因接收回执而产生。

## 上游与保全

只读刷新DSH默认HEAD仍`22ddee37`、最新rc.3。Foundry正式release仍v0.2.0，未发布main从`081f7fd5`前进3提交至`94ad3c2e`、37文件：sandbox工具面CI触发、bkn-agent值节点路径端点拒绝、Vega Dataset批量写入/删除进度。核对文件清单及相关CI/graph/API差异；不部署main，不修改固定平台、工具白名单/fixture或作新兼容承诺，不因此新增测试。

本轮只变更六份计划/入口文档及本目录证据，冻结-30/-31/-32和e7b383b kit摘要保持。HEAD、索引、origin、worktree引用保持；原Host、平台及业务数据配置没有本轮操作。文档差异、链接、证据摘要和保全核对见[验证记录](VALIDATION.json)。
