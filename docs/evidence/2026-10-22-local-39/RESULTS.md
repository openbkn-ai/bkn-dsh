# 第39轮：Windows -27 结果接收与八组合汇总

2026-10-22，Asia/Taipei。**Windows结果已收到并完成身份核对，属于部分预验，完整Windows矩阵及0.2.1验收仍未通过。** 当前Mac包保持本地-29，Windows保持交接-27，最后远端CI候选仍-12；三个身份分别保留。本轮只拉取、审阅和更新文档，没有修复生产代码、重建包、启动Host、连接业务平台、合并、提交、推送或触发CI。

## 接收与证据层次

执行 `git fetch --no-tags origin results/windows-local27-20261022` 后核对：

- 结果分支 `refs/heads/results/windows-local27-20261022` 指向 `fb77c07bc283b4f53a55179e43942949e0e1c8ca`，唯一父提交为 `fd879740e4292836a24dc1e411ee335619ba4c41`。
- 相对fd87974仅新增 `results/WINDOWS-RESULTS-local27-20261022.md`，11028字节、83行，SHA256 **`86adfeb6c5f3d0b205dbdafa95a3d9cac439fad0995b3c5484283a6fe59e61e9`**，与用户给定值一致。本目录的[Windows原报告](./WINDOWS-RESULTS-local27-20261022.md)逐字节保留，包括执行阶段“未推送”的当时说明；随后结果提交的事实单独记在本节。
- 只读GitHub查询：该结果分支workflow运行总数0，关联head分支的全部状态PR为空；提交标题包含 `[skip ci]`。无CI的结论来自实际查询，非仅依赖skip标记。见[接收凭据](./remote-receipt.json)和[远端只读核对](./remote-read-checks.json)。
- `KIT-FILES.json` 的SHA256 `53374ef97d0d3d1e5fd6ae1aff1e00950004979e4f81e0b7cf19a147878138d8`与fd87974的blob一致；本机保存的-27包SHA256为 `5a24a54fa327f04c79884b8303d44d0b2f0bae69e844169c31d28a69af832aef`，229683字节、82文件。

Windows运行、截图、签名、进程、JSON、before/after保留结果均来自独立Windows执行报告。259份证据原件仍在 `C:\bkn-verify\021-local27-run-20261022a\evidence\`，本机未下载或独立检查这些原件。远端报告中E14/E22/E26等摘要只是原件定位依据，不替代原件内容检查。主会话独立验证了Git/blob身份、现有源码/包及本机profile解析差异；下表保留这种证据区分。

## 汇总矩阵

| 组合 | 包与证据来源 | 目前完成 | 仍有的门槛 |
|---|---|---|---|
| Mac旧Desktop | -29；第34/35/37/38轮实机，各UI场景保留原包身份 | 第38轮同进程4小时30秒B1协议查询；第37轮诊断刷新焦点/Esc/实际JSON，取消沿用-28实测 | 实际profile闭包缺口待收敛；旧字段标签整答失败、完整G6及CE非空联动保留 |
| Mac新Desktop | 同上 | 同上，16个本机Interaction中的4个来自本组合 | 实际profile闭包缺口待收敛；完整G6及CE非空联动开放 |
| Mac旧npm/web | -29；第37/38轮实际Host，G6保留第35轮-27来源 | 4小时30秒B1协议路径、诊断焦点/导出；仅后端连续，不称浏览器页面四小时 | profile 3.18.5 / Host根3.18.4；旧销售原失败、同Session模型恢复执行前被阻断 |
| Mac新npm/web | 同上 | 同上 | profile与Host根均3.18.5但物理拷贝不同；同Session模型恢复被阻断，完整G6开放 |
| Windows A旧Desktop | -27；远程执行报告 | 安装器/签名、隔离、82文件、部分中英文/目录/窄窗/诊断JSON；取消、超时有记录 | 闭包fail，已测项保留混版条件；真实登录重试blocked，B1查询/G6 blocked；浏览器信任fail |
| Windows B新Desktop | -27；远程执行报告 | 安装器/签名、隔离、82文件、目录、部分UI/登出态JSON；同PID43484真实重新登录和网络/绑定恢复 | 闭包insufficient-evidence（同版本双拷贝）；B1查询/G6 blocked；浏览器信任fail |
| Windows C旧npm/web | -27；远程执行报告 | runtime/home及profile安装82文件核对 | 闭包fail后停止；登录、UI、B1为not-run，G6 blocked |
| Windows D新npm/web | -27；远程执行报告 | 隔离、82文件、部分UI/目录/JSON，取消/超时/真实重试，owned启动/清理 | 闭包insufficient-evidence；B1缺前置成功基线且查询blocked，G6 blocked；浏览器信任fail |

完整逐项Windows矩阵以[原报告](./WINDOWS-RESULTS-local27-20261022.md)为准；机器可读的范围汇总见[acceptance-matrix.json](./acceptance-matrix.json)。不计算“几组合整体通过”的分数，也不把Mac-29或历史-28结果转记Windows-27。

Windows执行窗口00:34–07:45中约01:28–06:44因Claude应用退出中断，不能据此记作Windows连续七小时或完成B1长时查询。Windows诊断DSH版本与插件已加载版本仍为“未采集”；磁盘82文件、exe版本与插件页状态按报告另列。

## 新发现的审阅结论

**1. profile闭包及校验覆盖是优先收敛项。** Windows报告A/C为Schemastery 3.18.5与旧Host 3.18.4并存，B/D为3.18.5同版本双拷贝。主会话只读复核当前-29的两份npm profile，得到相同版本/realpath差异，两个Desktop profile也解析3.18.5；本次未读取Mac Desktop asar中的根库版本。第37轮原始解析观察已记录插件私有3.18.5，因而此项并非可限定于Windows的新现象。

本机源码及-27/-29包均将Schemastery列为普通依赖 `^3.18.4`。`verify-kit.mjs --installed`仅检查包文件，`--runtime`从runtime根递归DSH/Cordis包，未进入 `@openbkn/dsh-business-context` 的实际profile依赖。因此历史 `noSplitSchemastery=true`只证明该runtime遍历范围，不证明加载profile满足同一门槛。见[包及校验器审阅](./artifact-impact-review.json)与[当前profile只读解析](./current-profile-resolution.json)。

当前证据确认了解析差异和验收脚本覆盖缺口；尚未在本轮复现由Schemastery双拷贝导致的功能异常，也未验证把它改为peerDependency就能使官方profile共享Host实例。下一步须明确框架共享契约、复现实际profile门槛并验证依赖方案，同步更新校验器和测试，随后复验。现有真实B1结果按原条件保留，完整依赖/兼容门槛继续开放；不通过修改校验结果来补过。

**2. 英文标签缺空格仍影响-29。** Windows报告A截图与D DOM观察到 `Report`/编号、`Created`/时间、`Mode`/值及 `Platform URL:`/地址紧邻。本机源码与-27/-29 client包仍直接拼接这些标签和值，静态证据支持该问题未被-29的刷新焦点修复覆盖。本轮只审阅，没有新增Windows截图复测或修改UI。

**3. Windows校验器tar选择有可移植性缺口。** 冻结脚本直接 `spawnSync('tar',...)`，与报告E01的GNU tar将盘符误当远端主机相符。报告E02改用原生PowerShell/bsdtar通过，保留E01原失败。待下一版材料显式处理系统tar/本地盘符路径，并在原生Windows复验；本机不以Mac tar通过代替。

**4. 其余观察逐项保留。** 全局CLI自动预填但保存前不写配置、登出态支持提示与10–18分钟前的被动成功记录、npm hostForm=unknown、OPENBKN眉标对比度、Esc同时关闭父子面板，都继续作为UX/诊断合同待分诊项。hostForm未知及被动历史记录有既有设计边界；E26原件未在本机检查，不据此直接认定认证缓存错误或越权。EPIPE属于报告中的官方Desktop/附着stdout启动方式问题，后续改善持久日志启动并复验，不自动改官方二进制。

**5. Windows浏览器信任未通过。** 报告Node+公开CA的TLS校验通过，Chrome/Schannel未信任，用户手动越过警告完成设备授权。这保留为浏览器信任fail；CLI登录成功不能关闭该项。当前没有导入用户级/机器级CA或绕过任何警告。

## 下一步与限制

先在本机收敛实际profile闭包/校验器、英文排版及Windows取件脚本，再准备有新身份的本地材料。Windows建议复验A/C完整受影响项，B/D闭包/文字及-28/-29取消、焦点差异；B1必须补成功基线和真实新Session普通查询，G6仍须满足执行前保护与安全环境条件。原-27分支/报告保持冻结，新交接推送仍需单独授权，当前不推送或跑CI。详细任务见[待办与受阻项](./BLOCKERS.md)。

正式0.2.0不替换、数据和配置保留的约束继续有效。本轮没有接触平台数据或任务配置，没有新Host/模型/业务执行；第38轮的业务保留与B1实测仍引用原记录，不声称本轮重跑。两上游头与release相对第38轮收尾均未变。用户转述的默认分支Dependabot一高一中提示未查询详情或处理，也不关闭既有SDK安全门槛。

当前开发分支仍 `feat/021-localization-login / 933b0ab251c75461ece1ada6145a9487e7eb04d1`。619个既有工作区文件仅5个计划入口按本轮汇总更新，新证据集中于本目录；源码、包、索引、原交接材料与原始失败保留，见[工作区核对](./workspace-preservation-check.json)。
