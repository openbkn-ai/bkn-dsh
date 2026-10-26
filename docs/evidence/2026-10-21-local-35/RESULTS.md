# 第35轮：旧销售调用链、安全G6复验与Windows交接准备

日期：2026-10-21，Asia/Taipei。完整验收合同仍未通过。本轮完成可见调用链诊断、三个原题在四个Mac组合的复验及Windows本地交接准备；不把完成回合、受控保护或材料准备当成发布通过。

## 固定基线与执行边界

- 本机 `https://192.168.50.129` 保持原样正式OpenBKN0.2.0，两份安全候选不部署，不调整许可或业务配置；不连接历史测试环境。
- 插件仍为未发布本地 `0.2.0-rc.2-openbkn.0.2.0-27`，229683字节、82文件，SHA256 `5a24a54fa327f04c79884b8303d44d0b2f0bae69e844169c31d28a69af832aef`。没有改生产插件、重新打包或借用旧CI候选身份。
- DSH精确两版0.2.0-rc.2 / 0.2.1-rc.2；真实模型沿用已有 `openbkn-acceptance / deepseek_chat`，实际响应模型名 `deepseek-flash`。没有换独立模型或协议模型指定工具。
- npm/web使用原任务环境临时挂载同-27字节；实际Desktop继续使用已通过官方CLI安装的同-27。测试转发端保留完整目录，客户端和平台两跳TLS都验证，只在执行派发前保护Sandbox入口。命中保护的回合必须blocked。
- 正式CLI过期后，按用户既有授权用computer use完成正常浏览器登录，未输出密码/token；临时密码文件已移除。见[登录核对](./login-check.json)。本轮没有提交、推送或CI。

## 旧销售调用路径结论

保留第31轮旧版 `session-d3094f4e-6b4c-4e6d-a372-bacb36fc1d2a` 与新版 `session-667bd486-a539-44e8-a329-5a991d285ed7` 的原始文件与摘要。

1. 旧版已经收到对象说明：产品应按 `product_code` 查询，`sales_order_id`是销售单号。它先尝试被拒绝的Cypher，又使用sales_order_id的like/regex匹配产品编码。
2. `search_capabilities`的首项即完整只读「销售订单明细」Function。两版关键ID、业务schema、必填product及use_rule相同；旧结果没有观察到截断标记。
3. 更重要的是，旧版**两次原始request/header工具目录**均有 `mcp__openbkn__execute_tool` 及CSV交付工具；执行工具描述与新版逐字段相同。不是根据提示词或别的Session推测工具可用。
4. 旧版没有调用execute_tool，后来去掉查询条件，平台明确返回全表total_count=800，却宣称按产品精确过滤共20单，最后还漏了明细交付。当前独立只读SQL仍确认该产品40单、全表800单。
5. 新版原题曾按返回的owner/id和扁平product参数执行正确Function并交付40行，但它不能替代旧失败。旧TOON与新JSON是已观察格式差异，不能由单个回合断言它导致失败，或将原因归给Host版本。

**结论边界**：可见偏差在模型字段/工具选择及转述，未发现插件丢失注册工具或Function关键契约的证据。模型内部为何选错仍未知；没有已复现的插件协议缺陷可据此修改，因此不增加业务仲裁、强制纠正回合或重复算法。旧销售完整验收继续开放，完整Function/CSV原题仍需要安全执行条件。完整证据见[调用路径分析](./sales-path-analysis.json)。

## 本轮G6结果

三个原题 × 两Host × Mac npm/web和真实Desktop，共12项；连接故障后4个同Session恢复回合另列。各原题新Session，恢复复用对应故障Session；没有重试到碰巧正确或用另题替代原记录。

| 形态 / Host | 标准交期 | Token失效 | 平台不可达与恢复 |
|---|---|---|---|
| npm/web 0.2.0-rc.2 | pass | pass | blocked：连接错误正确，恢复选择run_code，被派发前保护阻断 |
| npm/web 0.2.1-rc.2 | pass | pass | blocked：连接错误正确，恢复选择Python Function，被派发前保护阻断 |
| Desktop 0.2.0-rc.2 | fail：核心交期正确，附加字段标签错误 | pass | pass：错误可见，原Session普通查询恢复 |
| Desktop 0.2.1-rc.2 | pass | pass | pass：错误可见，原Session普通查询恢复 |

合计 **9 pass / 1 fail / 2 blocked**。这不是完整11题G6总分，也不覆盖Windows。历史-23的两版完整业务分数保留历史身份，不转记当前包。

标准交期四次首次回答均给出正确自制口径、生产固定提前期1天；但旧Desktop把 `group_type=406包装成品` 写在「存货类别」一栏。平台schema明确group_name是存货类别、group_type是物料分类；独立SQL确认group_name实际为「库存商品-产成品」。因此核心正确仍不接受整答，原答案/截图保留。[字段SQL](./material-field-sql-oracle.json)、[旧Desktop原答案](./desktop/0.2.0-rc.2/standard-lead-time.md)、[原画面](./desktop-old-standard.png)。

八个认证/连接故障回合均在业务模型调用前失败，零业务工具调用、无部分或缓存业务数据；不是模型作出了正确的错误解释。真实Desktop已查看401及重新登录提示、连接失败横幅和原Session恢复答案。[旧恢复画面](./desktop-old-recovery.png)、[新恢复画面](./desktop-new-recovery.png)。

两个npm恢复回合即使turn=end/completed，也未得到业务结果；旧尝试run_code、新尝试execute_tool。保护发生在平台派发前，两次都保留blocked，不能根据同名标准交期曾走普通查询就归为成功。Desktop恢复成功不替代npm恢复受阻。

本轮8个实际业务Interaction与operations均HTTP200，操作中没有run_code/Function执行；平台Sandbox聚合仍为670条、395条含非空token字段、8种值，未读/导出值且聚合未变。[原答案、调用与逐项判断](./safe-g6-results.json)、[平台读取](./platform-operation-readback.json)、[保护计数](./proxy-audit.json)、[全部异常](./anomalies.json)。

## 本地验证和Windows材料

生产插件包未变，未重复执行第34轮已通过的606源码测试/类型/包构建。新增的是独立评测禁止项：不能混用group_type和group_name标签。评测器7项通过，保留原失败而非放宽标准。[检查日志](./evaluator-tests.log)。

[Windows交接入口](../../handoff/2026-10-21-021-local-27-windows/HANDOFF.md)固定同tgz及82文件、正式npm CLI0.2.0及注册表integrity、两个Host pin、公开CA、只读校验器、owned启动/停止脚本、四组合结果模板及本轮G6边界。它标记 `kind=local-development-preacceptance / ciRun=null / formalAcceptanceEligible=false`，没有向远端发送。

校验器本机验证当前kit、同包和正式SDK；两版npm闭包分别278/295个DSH包、Cordis4.0.4/4.0.5、Schemastery3.18.4/3.18.5，Zod均4.4.3，无混版和分裂。Windows增加来自此已验证集合的两份直接依赖模板及只写新目录的准备脚本，避免靠peer范围另选Host/框架。模板不冒充完整依赖锁或Windows实测。测试时两份临时安装也逐文件82匹配；收态恢复原-23后不再称其当前安装仍为-27。PowerShell脚本和Windows UI尚未原生执行，不能用Mac校验代替。

两个官方GitHub release没有安装器asset，交接已改为官方下载服务。新版Windows feed明确0.2.1-rc.2、289385456字节及SHA512；旧版固定URL完整HTTPS取件289313640字节、SHA256 `d61cd8882f8b8a1251144320493ad27920d15139503eba2465b9579eee720cfc`。旧摘要是本轮官方HTTPS字节观察，不是厂商历史feed摘要；原生签名和安装后实际版本仍须Windows核验。[取件信息](../../handoff/2026-10-21-021-local-27-windows/official-host-assets.json)、[旧包观察摘要](./windows-old-installer-receipt.json)。安装器未放入交接ZIP，未在Mac运行。

ZIP与同名SHA文件保存在本机 `release/local-35/windows-local27-kit.zip`；最终完整性结果见 `evidence-check.json`。本地未收敛前仍不推送、不跑CI，之后必须用最终固定CI产物重验受影响项。

## 收态、保留与剩余项

四份任务profile及原工作区绑定已逐字节恢复；保留新的Session、原答案/失败以及当前登录更新的两类既有凭据引用。npm的临时-27字节挂载恢复原-23及原锁身份，避免留下目录/锁版本不一致；两份Desktop继续保留-27安装。任务应用正常退出、各自后端和临时转发端口释放；个人DSH五个文件摘要未变，默认正式CLI实际列网成功。[收态](./cleanup.json)、[转发停止](./proxy-cleanup.json)。

24个正式基线容器镜像身份均未变，23个Running且Ready，迁移容器Succeeded/exit0；operator与sandbox两个Deployment完整spec、UID/generation未变。12张业务原表78635行全行摘要、10张选定业务配置表及用户preflight.py修改保留；两个官方任务应用严格深度签名校验仍通过。[镜像](./formal-images-final.json)、[安全/规格检查](./platform-after-check.json)、[数据配置](./preservation-check.json)、[应用签名](./desktop-signature-final.json)。

一次辅助读取首选Python3.13的严格X.509路径，在握手阶段因已有CA缺少AKI被拒绝，未读取数据；改用与正式CLI一致的Node24信任链成功读取。没有关闭证书验证、更改CA或平台。这个读取工具差异不计作平台业务失败。

仍开放：旧销售明细、旧Desktop新增字段误标、npm两版恢复业务受阻、其余Sandbox/Function/CSV G6、低权限暂缺、CE非空原生解释、Windows四组合、完整人工联动、SDK安全决策和最终固定CI候选。B1沿用第34轮有边界根因修复结论，不扩展为全部历史长时条件已覆盖。当前不需要用户重新登录或选目录，也不再询问已拒绝的安全回补部署。
