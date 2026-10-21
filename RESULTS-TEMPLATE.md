# 0.2.1 Windows Git 交接预验结果

日期/时区：
Windows 版本/架构：
Node / npm / pnpm：
完整交接 Git commit / KIT-FILES 校验：
插件版本 / tgz SHA256 / 实际安装目录 / 82文件比对：
CLI 实际路径 / 版本 / 官方 integrity：
平台（仅 https://192.168.50.129）/ TLS：
结论：pass / fail / blocked / not-run / insufficient-evidence（逐项记录）

本轮是本地开发包预验，CI run=null，不关闭最终固定CI候选或完整发布验收。

| 项目 | 旧 Desktop | 新 Desktop | 旧 npm/web | 新 npm/web | 证据路径及 SHA / 失败原文 |
|---|---|---|---|---|---|
| 实际 Host/插件版本、同包82文件、闭包 | not-run | not-run | not-run | not-run | |
| 独立 home / CLI配置 / before摘要 | not-run | not-run | not-run | not-run | |
| TLS、CLI 0.2.0、真实登录/列网 | not-run | not-run | not-run | not-run | |
| zh/en 与切换后选择状态 | not-run | not-run | not-run | not-run | |
| 登录等待/取消/超时/进程退出/重试 | not-run | not-run | not-run | not-run | |
| 原生目录取消/重试/选择/绑定 | not-run | not-run | not-run | not-run | |
| 诊断窄窗口/焦点/Esc/滚动/JSON导出 | not-run | not-run | not-run | not-run | |
| 事件/证据空态降级 | not-run | not-run | not-run | not-run | |
| 非空原生解释/联动 | blocked | blocked | blocked | blocked | 当前CE路由缺失，禁止造样本 |
| B1同Host配置重载/重新登录/新Session普通查询 | blocked | blocked | blocked | blocked | 先完成原生派发前保护；未具备时只记录配置/登录UI子项，不将B1整体判通过 |
| 标准交期真实模型原题 | blocked | blocked | blocked | blocked | 须先具备经核验的 Sandbox 执行阻断条件；不删目录/换题 |
| 附加字段标签保真 | not-run | not-run | not-run | not-run | 业务字段与自然语言标签必须与授权的独立依据对应，不能互换标签 |
| Token失效原题及恢复 | blocked | blocked | blocked | blocked | 须有执行前保护及独立故障隔离；不撤销共享凭据 |
| 平台不可达原题、同会话恢复 | blocked | blocked | blocked | blocked | 须有执行前保护及独立转发层，不停平台 |
| 其余Sandbox/Function/CSV G6 | blocked | blocked | blocked | blocked | 正式0.2.0不替换；不调用执行路径 |
| 低权限负例 | blocked | blocked | blocked | blocked | 用户已答暂缺 |
| 清理owned进程/端口、after摘要 | not-run | not-run | not-run | not-run | |

每个真实回合保留原题、原始调用/过滤条件、原答案、最终链接、平台Interaction/operations与失败原因。前置错误没有模型响应时写明“模型调用前失败”，不声称模型作出正确回答。修复后另建记录，不能覆盖失败原件。

未采集的实际加载版本保持未知；磁盘版本、包元数据、完成状态、受控测试不能补填未知的实机结果。只回传经秘密扫描的脱敏证据；token、密码、登录URL/code和原始凭据文件留本机。

此模板在公开 Git 分支中只供复制，实际结果和原始证据写入 checkout 之外的 Windows 私有目录。回传先给脱敏摘要及证据 SHA，不向本公开仓库推送业务明细、诊断秘密或原始日志。
