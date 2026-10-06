# macOS 验收基线：2026-10-06

同一固定 CI 候选（source 144afa503c7d4746cbef01f74eaceff293b88cb5，run 37337765993，SHA ffcd77722e83a003fe90e0dda296a3a49c3f2ba67bddda9095575dabd896ef43，65 文件）。这些结果只代表 macOS，Windows agent 必须在本机按同一包重新记录。

- 单 OpenBKN 侧栏入口、面板右上角“诊断”、S0/S2/S4：官方 npm 和 macOS 原生 Desktop 通过；产品诊断 JSON 实际下载完成。CLI 0.1.5 已配对，真实平台 live guard 16/16。
- 官方 macOS Desktop / DeepSeek-V41-Flash High 的 G6：正向 5/7、反向 2/3、已测合计 **7/10**；发布 G6 门禁尚未通过。
- 三个 FAIL：standard-lead-time 缺少自制生产/erp_material 口径；bom-usage-inventory 深度 4/5 请求超时，只给前三层明细；missing-object 虽正确说明目标无数据，仍输出无关非零业务计数，违反原禁止项。保持原评分，不用不同问题答对的结果回填。
- unauthorized-network：用户明确无真实受限账号，NOT-RUN；不以无效 Token、模拟 403、未绑定会话拒绝代替平台权限验收。
- invalid-token：虚构无效签名凭据触发真实平台 HTTP 401，明确重新登录横幅、auth-rejected/httpStatus=401、无业务读取。真实账号未撤销。
- platform-unreachable：关闭的 HTTPS 本地端点、虚构凭据及隔离绑定 URL fixture，实际 Host 连接失败/network-unreachable；配置/绑定随后恢复。第一次恢复重试遇 CLI 过期，正常 CLI refresh + 面板刷新后，同一会话真实返回 40 张订单。仅覆盖受控连接不可用，不代表真实集群停机。
- R4/R6/R7/R8 通过：名称/交期、重启原 conversation_id 连续、未绑定真实调用拒绝、PTC 拒绝。工具定义可全局可见，调用权限由 Host 拦截。
- R5 三个溯源视图可打开；来源网络未定位、0 条视觉连线以及平台 internal pending receipt 仍需按实情展示，不能报告完整图/所有 receipt 已闭合。
- 有一次独立启动异常 gateway/definition-unavailable；同 profile 暂时移除再安装同 CI 包后恢复，65 文件一致。根因未知，发布前需调查/取舍。代理测试导致的启动阻断另列，不混同该异常。
- 评分器新增 not-run 单列并排除已测分母，3 个评分回归通过；评分器测试与真实模型运行分开。原候选源码轮检查仍是插件 304 项（303 pass/0 fail/1 Windows-only skip）、repo 57/57 等；本轮没有更换候选。

可分发 ZIP 中的白名单评分/身份摘要位于 evidence/mac-g6/：g6-results.md、g6-marks.json、case-status.json、regression-status.json、run-identity.json、installed-identity.json、cleanup.json。完整 Mac 原生回答、截图和独立 CLI 对照保留于源码仓库 docs/evidence/diag-g6-20261006/。Windows agent 不应把这些 Mac 评分直接作为自己的 answers 文件。

完整 profile、模型 Key、CLI Token、授权 URL/码及 raw private 日志均未交付。Mac 测试进程已正常退出，隔离 patch/绑定恢复，用户配置的模型 profile 留在本机私密目录以供复测。Windows 原生 pwsh/W0–W12 未执行，仍按 HANDOFF.md 先做语法解析和冒烟再扩展矩阵。
