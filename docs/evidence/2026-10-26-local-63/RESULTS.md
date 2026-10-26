# 第63轮：Windows #105 非 GUI 回执合并

2026-10-26（Asia/Taipei）。结论：**Windows非GUI最小补证子项完成，最终8/8符合约定**；不重跑该子项或Mac既有向量。仍为`local-development-preacceptance`、`ciRun=null`、`formalAcceptanceEligible=false`，不据此关闭整体#105或正式验收。

## 固定身份与主会话核对

- 输入：handoff/windows-local32-mcp-nongui-20261025 / `a362d783d75b8b1ff80b55ba0e497fe1a56c8ade`；KIT SHA256 `c12655058e6b57e485894fd594a2f592f5f2d7335c7425f5175e12b2e02fbee4`；冻结-32 tgz仍`46626510825fe9146aef12c27a1724acbb455aeac22aa600358add0fc8e1c9f8`。
- 结果：docs/windows-021-host32-mcp-nongui-results-20261026 / `8f94288fd92ab04938decc8ad561aaac2696f2e7`；已独立核对远端ref和12个Git blob原字节。
- [原报告](windows-public/results/RESULTS-105-nongui-20261026.md) SHA256 `fd93358d58e150173b33c69599c6053f075917d1dbb7d62e19c3033bf74b2a46`；[原manifest](windows-public/results/evidence-manifest-105.json) `1cd35339144de7d3c257644a599fb000778bed60b7c0be0ed49d6cb063ee043a`；verify-inputs `b30314318ab5134bd6bd5e2a637a4e8ce59c070d35e69498b035ca0fc81eb417`，均与用户回执一致。
- manifest的10项publicEvidence摘要逐项匹配；Windows本机`out/*.json`在Git结果目录发布为`evidence/*.json`，该路径映射单独记录，原内容不改。46项privateEvidence未读取，不要求取回。详见[核对记录](RECEIPT-REVIEW.json)。

## 最终合成矩阵

| 固定Host / 实际进程运行时 | stock同源307 / 跨源第二源 | protected同源307 / 跨源第二源 | 原件 |
|---|---|---|---|
| 0.2.0-rc.2 npm，Node24.19.0 | 成功 / 1，含合成Session+问题 | 成功 / 0，cross isError=true | npm-rc2-stock/protected |
| 0.2.1-rc.3 npm，Node24.19.0 | 成功 / 1，含合成Session+问题 | 成功 / 0，cross isError=true | npm-rc3-stock/protected |
| 0.2.0-rc.2 Desktop backend，Node24.18.1 / Electron44.0.0 | 成功 / 1，含合成Session+问题 | 成功 / 0，cross isError=true | desktop-stock/protected |
| 0.2.1-rc.3 Desktop backend，Node24.21.0 / Electron44.7.0 | 成功 / 1，含合成Session+问题 | 成功 / 0，cross isError=true | desktop3-stock/protected |

八份JSON均已解析核对：实际MCP stock SHA为`758d8fc473b700b5d351158d06ce9f9e92c16e8b25497b08bb7bd2122a87f5dd`，protected为`b3cd7156c0b8639656ce117530fec4d006b74cafdc9a78ac426fec084e62972c`；同源与跨源tools/call各一次，结果/第二源请求列表符合模式，fixtureListenersClosed=true、mcpDisposalErrors=[]。本轮主会话没有再次运行探针。

此结论限于上述固定版本/运行时和原生factory/ToolRuntime合成307路径，不称“与任意Host版本无关”，不替代原生GUI、真实业务MCP挂载、平台认证/模型/G6、SDK全局或OAuth修复。Mac第53/57/58轮其它跳转向量、正常MCP/401/CLI管理认证继续保留各自证据。

## 环境、准备偏差与证据界限

Windows报告的rc.3新环境准备包括：官方registry的13个固定DSH包、562依赖、独立cache；官方Desktop固定安装器的大小/SHA512/Authenticode与解包后版本；各新profile的-32 82文件/闭包。运行时版本在探针JSON中已核对；取件、安装器验签、82文件/闭包及整棵Host退出原件在46项私有证据中，主会话按远程报告接收，未独立观察Windows现场。

原报告第2/4节是中间BLOCKED记录，第6–8节和manifest的RESOLVED为最终状态。CLI `--patch`注入曾未激活；最终全部使用profile层cordis.patch.yml、无外层id的insert及正斜杠路径。此前尝试保留，不将8/8描述为全程一次成功。当前材料不足以定责“通用CLI非确定性缺陷”或“与Host缺陷无关”；本轮将其列为验证注入方式调整，不新建重跑任务或修改生产插件。

Windows用户在该会话中批准搭建rc.3环境、rc.2快速复验及单次结果分支推送，作为远程授权记录保留；不是主会话事后补造授权，也不扩为下一次推送/CI/真实登录许可。主会话本轮只读远端并更新本地文档，无平台或Host动作。

## 较轻交付线索与剩余项

Desktop protected通过profile node_modules中的payload选中回补factory，官方ASAR未修改。这是优先核实的较轻路线。**尚未证明冻结业务插件和GUI会自动使用同一包**：探针先packageOf再手动import所选MCP；冻结business.js实际保留外部MCP导入。先核对这个真实导入路径，再决定是否需要其它GUI交付，不默认回到独立产品/签名/更新体系。整体#105仍OPEN；现有官方Host不能标为已修。

原Windows run2/049d9f46也已在主会话前轮核对17个公开Git对象及14项摘要：-31标签、溯源Escape和800×600客户区按报告接收；-30本次登录/重开观察保留，L0偏差、carrier/Job未知和菜单退出异常分列。该轮调查结束，不要求Windows重写报告、重新登录、抓包、重采截图或计数；历史原件不改，不将本地时间线替代非空原生解释。

当前六组待办详见[剩余工作](../../plans/0.2.1/REMAINING-WORK.md)。平台原样0.2.0/Sandbox安全条件、真实非空解释、低权限、历史业务失败与最终CI候选仍按原范围保留。没有以本回执转记GUI、完整rc.3兼容或正式发布通过。

## 本轮保留与检查

仅修改六份计划/入口文档并新增本轮证据；产品代码、冻结包、原Host/ASAR、个人CLI、主树HEAD/索引和工作树引用保持，见[PRESERVATION.json](PRESERVATION.json)。新证据的链接、摘要和公开文本检查见[FINAL-CHECKS.json](FINAL-CHECKS.json)。未重新审计数据库/整机；未部署/升级、登录、运行模型或业务工具，未推送/CI/远端issue写入。当前无需用户登录或提供私有证据。
