# Windows平台0.2.1增量验收

## 最新接续状态（2026-11-03）

首轮[公共回执](./windows-rc5/WINDOWS-CI6-PLATFORM021-VERIFICATION.zh.md)、完整26工具目录及[指标/SDK续期补充](./windows-rc5/WINDOWS-CI6-METRIC-SUPPLEMENT.zh.md)均已按分块/gzip/原字节/SHA精确核收，见[清单](./RECEIVED-ARTIFACTS.json)及[发布分级](./INTAKE-REVIEW.zh.md)。SDK自然续期PASS不代填Host；两个官方指标目录各一次404，缺ID/version而停止实调。

用户最新矩阵：50.129为社区main021，Windows新CLI增量结果保持；50.28为企业版正式020，Mac以独立CLI020补三项原生UI。129不承担企业版溯源页面验收，其404不再是发布阻断。本机28卡收件人加密交接已完成，Windows四项认证boolean均true，见[CARD-028-HANDOFF.json](./CARD-028-HANDOFF.json)；**仅接收和认证解密卡，没有重跑Windows旧UI、登录或业务矩阵**。原报告、日常CLI和现有包保持。

维护者于2026-11-03明确要求：如新兼容增量涉及Windows，需同步安排原Windows远程会话。指定chat `01a19c6a-e785-7f82-a5b4-cda473951fa6`，host `remote-control:env_e_6abf8babb404832890d7c5124118ed3c`。在CI6新制品核收后执行，不把Mac结果代填Windows，不重跑已通过的旧Windows完整矩阵。

本轮固定源为`f01b316fbfb6be681af81e2267a7b3341e659efd`，CI6 run`41596006291`、publish=false；以已核收的实际artifact/TGZ/126文件回执固定包。当前本地参考包不是CI制品，不用它代替发布前实机候选。

CI6已成功并核收：artifact13212518096，实际TGZ877732字节/SHA `4500fa4357cdcdcb9914a39794aedb9096c948192c2bf0f35ecf4fadb882f046`、126文件，见[完整身份](./CI6-ARTIFACT-IDENTITY.json)。只用这个CI包；源码、全部成员摘要及与CI5的8文件差异以回执为准。正式CLI0.2.1公共包当前仍E404，预发布main/rc验收须保留真实身份，不代填正式安装项。

主会话已从Mac当前已执行只读命令核到测试origin为`https://192.168.50.129`，无额外端口，并已补充给Windows。Mac进度摘要报告为health与镜像对应的0.2.1-main；完整部署原件待传输核收，Windows仍须本机核TLS/health/实际目标，不当最终正式平台证明。原Mac会话绑定仍是50.28，不用它冒充新目标。

| ID | 最小范围 | 边界 |
| --- | --- | --- |
| W0 | 原官方Windows Desktop0.2.1-rc.5、真实EXE/ASAR签名/版本、隔离profile及新包全部文件 | PASS：原官方rc.5/签名/About，真实GUI安装CI6并正常退出冷启动，最终126/126文件匹配；加载版本诊断字符串未采。 |
| W1 | 面板0.2.1选项/双语指引、实际CLI版本、Windows绝对.cmd路径和原生子进程 | PASS：中英文目标/已有CLI不覆盖、实际020检测、隔离rc.1绝对.cmd及Host→runner→cmd.exe→Node原生进程链；已恢复中文。 |
| W2 | 正式0.2.1包可得时的精确安装与版本复核；已有CLI的保护路径 | PARTIAL：rc.1 TGZ/SRI/9文件/依赖身份及实际版本通过，默认020文件保持；正式021公共包仍不可得，精确安装NOT_RUN。 |
| W3 | 对明确0.2.1测试部署的面板新登录、目录同步、正确token来源/正常续期、CLI/MCP/Reader证书作用域 | 首轮PARTIAL：本机129信息卡正常device/browser登录和2网络同步、凭据来源及作用域证书检查通过；自然续期首轮未到窗口，NOT_RUN。main/rc不是正式部署/CLI。 |
| W4 | 实际MCP目录/schema读取与同源连接、新指标/KN/context/错误路径的受影响最小检查；可读测试记录的原生溯源 | PARTIAL：26 schema完整采集/注册保持，3种guard零派发，真实Reader/最小对象查询/finish参数与结果透传通过；metric正例及同129原生答案入口未验，不伪造绑定。 |
| W5 | 正常退出、owned进程/端口释放、日常及旧报告/会话摘要保全 | 首轮PASS：菜单退出、5任务进程/54637释放；1376日常文件/18旧报告/4会话绑定/默认CLI和Host保持，日常5进程及端口owner保持，关联恢复。新独立补充只核必要收态。 |

旧WindowsCI5 SourceText、跨答案锚定、82字节分类、复制/保存/分析等原通过项均保留，不为新增CLI目标重跑；此增量未改SourceText/认证/MCP/Reader/业务guard实现。新的metric/CSV平台合同可以按其明确来源复用公共部署结论，但不能省掉Windows新CLI/路径/证书/Host事实。

不新增模型问题、依据生成或Agent分析；若缺少可用的同目标原生记录，先列明缺口，不伪造handle/答案/收据或修改旧绑定。新目标必要受影响查询仅使用明确隔离样本及平台披露参数，不重算或修正业务输出。日志不含token、验证码、OAuth头或MCPsession秘密。真实token不改过期时间来强造续期通过。

形成脱敏JSON/中文报告、分项状态和原文件bytes/SHA；保留原证据与历史失败。最终版本/环境未固定则保持对应待验，不合并/tag/发布/latest，不自行重跑CI。遇可修复的隔离环境问题持续处理，不能改测rc.5之前的版本替代目标。
