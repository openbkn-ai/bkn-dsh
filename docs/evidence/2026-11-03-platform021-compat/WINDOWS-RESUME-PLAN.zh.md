# Windows平台0.2.1增量验收

维护者于2026-11-03明确要求：如新兼容增量涉及Windows，需同步安排原Windows远程会话。指定chat `01a19c6a-e785-7f82-a5b4-cda473951fa6`，host `remote-control:env_e_6abf8babb404832890d7c5124118ed3c`。在CI6新制品核收后执行，不把Mac结果代填Windows，不重跑已通过的旧Windows完整矩阵。

唯一待交接源为`f01b316fbfb6be681af81e2267a7b3341e659efd`，CI6 run`41596006291`、publish=false；以实际完成后的artifact/TGZ/126文件回执固定包。当前本地参考包不是CI制品，不用它代替发布前实机候选。

CI6已成功并核收：artifact13212518096，实际TGZ877732字节/SHA `4500fa4357cdcdcb9914a39794aedb9096c948192c2bf0f35ecf4fadb882f046`、126文件，见[完整身份](./CI6-ARTIFACT-IDENTITY.json)。只用这个CI包；源码、全部成员摘要及与CI5的8文件差异以回执为准。正式CLI0.2.1公共包当前仍E404，预发布main/rc验收须保留真实身份，不代填正式安装项。

| ID | 最小范围 | 边界 |
| --- | --- | --- |
| W0 | 原官方Windows Desktop0.2.1-rc.5、真实EXE/ASAR签名/版本、隔离profile及新包全部文件 | 保留日常环境和所有旧CI4/5报告；不换旧Host版本，不用旧安装核对代填新包。 |
| W1 | 面板0.2.1选项/双语指引、实际CLI版本、Windows绝对.cmd路径和原生子进程 | 目标选择不是升级；已有CLI不覆盖。任务独立prefix/CLI路径，不改默认CLI、日常profile或全局npm设置。 |
| W2 | 正式0.2.1包可得时的精确安装与版本复核；已有CLI的保护路径 | 核registry integrity/实际包/依赖，不把rc/main改manifest冒充正式版。若最终包未发布，可做真实预发布范围验证，但正式安装项保持待验。 |
| W3 | 对明确0.2.1测试部署的面板新登录、目录同步、正确token来源/正常续期、CLI/MCP/Reader证书作用域 | 先核50.129实际origin、health/image/ref和连通性。不能把历史50.28正式0.2.0用0.2.1 CLI硬跑；不清空版本检查、放宽TLS或修改原会话绑定。本人登录由用户在Windows授权页完成，不传秘密。 |
| W4 | 实际MCP目录/schema读取与同源连接、新指标/KN/context/错误路径的受影响最小检查；可读测试记录的原生溯源 | 复用已核服务器身份时仍核本机实际请求目标/包和声明范围。动态schema/参数/结果保持，新工具继续deny；受控ToolRuntime与真实Host/平台证据分层。不以独立SDK读取冒充真实UI入口。 |
| W5 | 正常退出、owned进程/端口释放、日常及旧报告/会话摘要保全 | 按PID创建时间和真实owner核，不复用旧PID/端口断言。保留旧不可读/历史差异/取证限制，不称全机零改动。 |

旧WindowsCI5 SourceText、跨答案锚定、82字节分类、复制/保存/分析等原通过项均保留，不为新增CLI目标重跑；此增量未改SourceText/认证/MCP/Reader/业务guard实现。新的metric/CSV平台合同可以按其明确来源复用公共部署结论，但不能省掉Windows新CLI/路径/证书/Host事实。

不新增模型问题、依据生成或Agent分析；若缺少可用的同目标原生记录，先列明缺口，不伪造handle/答案/收据或修改旧绑定。新目标必要受影响查询仅使用明确隔离样本及平台披露参数，不重算或修正业务输出。日志不含token、验证码、OAuth头或MCPsession秘密。真实token不改过期时间来强造续期通过。

形成脱敏JSON/中文报告、分项状态和原文件bytes/SHA；保留原证据与历史失败。最终版本/环境未固定则保持对应待验，不合并/tag/发布/latest，不自行重跑CI。遇可修复的隔离环境问题持续处理，不能改测rc.5之前的版本替代目标。
