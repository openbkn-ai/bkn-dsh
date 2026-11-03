# Windows CI6 平台0.2.1增量验证

结论：**已执行预发布范围通过，仍有待验项；不构成正式0.2.1或发布验收通过。** 仅做W0–W5增量，旧CI4/CI5通过项及原报告保留。

| 项目 | 结果 | 范围 |
| --- | --- | --- |
| W0 包与Host | PASS | 原官方Desktop0.2.1-rc.5，同隔离profile/userData；原生管理器安装真实CI6包，正常退出后冷启动；最终126/126成员匹配。 |
| W1 CLI入口 | PASS | 中英文0.2.1目标/已有CLI不覆盖指引；实际旧CLI仍显示0.2.0；独立绝对.cmd切为真实0.2.1-rc.1，观察到Host→runner→cmd.exe→node.exe。已恢复中文。 |
| W2 CLI安装 | PARTIAL | 正式0.2.1不可得，安装NOT_RUN；RC1 TGZ/SRI/9文件与实际版本、依赖树已核。默认CLI仍0.2.0且文件不变。 |
| W3 新登录 | PARTIAL | 50.129原生device/browser登录/同步成功，2个网络；Windows凭据来源、同源读取及证书作用域通过。自然续期未到期，NOT_RUN；main预览不算正式部署。 |
| W4 受影响路径 | PARTIAL | 26工具完整目录/schema，官方factory/rc.5 ToolRuntime保留26输入schema；3项拒绝零派发。真实候选Reader/最小对象查询通过。指标ID/version未披露和原生同目标记录缺口均NOT_RUN。 |
| W5 保全/退出 | PASS | 应用→退出，无强杀，5个owned进程退出、54637释放。1376/1376日常文件字节及mtime、18/18旧报告、4/4原会话/绑定、2/2默认CLI与2/2Host文件保持；日常5进程身份及58794 owner保持，协议注册恢复。 |

候选源为 f01b316fbfb6be681af81e2267a7b3341e659efd，build-only CI 41596006291，publish=false，artifact 13212518096。
TGZ：openbkn-dsh-business-context-0.2.1-rc.3-openbkn.0.2.1-3.tgz，877732字节，SHA256 4500fa4357cdcdcb9914a39794aedb9096c948192c2bf0f35ecf4fadb882f046。
ZIP：877818字节，SHA256 ab75ba75ea60a6ec2281015d2a863a8f27063e8f9cbce3524e7daf10580cf5ac。
相对CI5仅8文件变化，118文件保持。EXE签名Valid，GUI About为V0.2.1-rc.5；ASAR不是独立可签名PE，UnknownError不改写为签名通过。被动诊断未收集运行包版本字符串，归因依靠冷启动、新原生UI和文件身份。

测试卡交接四项：**ciphertextHashVerified=true、recipientMatched=true、gcmAuthenticated=true、localCardCreated=true**。
密文Git提交 7ef885a8dd0bac11944fdbe79c7b379b1139ab55，路径 docs/handoff/2026-11-03-ci6-platform129/platform129-card.enc.json，1468字节，SHA256 498236307d857c99f2a5433a28d82ba10109a403f8a2b5cc940442209c6e5418。RSA-OAEP-SHA256 + AES-256-GCM及原样AAD认证通过。只在本机当前用户/SYSTEM受限目录使用相关测试账号；没有输出或提交明文卡、明文checksum、密码、Mac会话token或私钥，没有覆盖旧卡。

实际CLI是 @openbkn/bkn-sdk@0.2.1-rc.1，gitHead 1cd2839652733e2ce6690b14e76ff8e9d73861dc，独立prefix C:\bkn-verify\provenance-ci4-win-20261102\ci6-platform021-20261103-154333\cli-preview。SDK undici8.12.3与插件8.10.2分开记账，未升级插件依赖或Host。正式0.2.1 registry查询保存了“version not found: 0.2.1”体；首个采集器未保存HTTP状态，本地状态保持UNKNOWN，主会话另报E404，未重复查询补状态。

实际origin为 https://192.168.50.129，health自报0.2.1-main.20261103005009.sha0acbbb4。镜像digest/完整部署Git ref未知，不能从后缀补出。独立公有探针使用现存129 CA、rejectUnauthorized=true，200/TLSv1.3 authorized；默认Node信任失败UNABLE_TO_VERIFY_LEAF_SIGNATURE。原包私有平台连接按origin/证书指纹/SPKI/远端身份精确pin，内部连接器以pin替代CA/名称校验，不称默认CA链通过；该pin匹配独立CA验证的同一leaf。浏览器仅有相应SPKI参数。未新增全局TLS绕过、未改证书实现或跳过版本检查。退出前原生Host23236实际连接192.168.50.129:443，创建时间与owned身份一致。

原生面板同步 worldcup_vega_catalog_bkn 和 supply_ontology_hand，没有创建本地工作区链接。前两次等待在交接/安全UI准备期间超时，最终正常流程成功；不改时钟/expiry强造结果。正常SDK权威返回当前token，store到期为 2026-11-03T09:44:12.496Z，检查时超出60秒窗口，自然续期NOT_RUN。

受控运行从原rc.5 ASAR只读提取真实Host模块，配候选MCP factory、guard和Reader；任务解析器仅补Host peer装配。平台真实返回C/I conv_28e4be16452aa61e1b333c34974cda95 / int_5e58d2c302ac5be6cb23b1f1d545b3a6，仅建立一个技术验证Interaction，复用用户原任务文字，无模型调用。get_object_types、limit1的query_object_instance及一次finish保持参数与content/structuredContent，finish真实返回completed。缺少bkn_context、跨已披露KN、新drill分别guard拒绝、0派发。新query_metric必需version及完整schema已采集/保留，但所选库存对象未披露related_metrics/id/version，未猜测指标或实调。官方MCP发现探针404后正常initialize/tools-list和实际调用成功，原状态保留。

原生登录、独立Reader/ToolRuntime与模型E2E分开记账。原DSH业务记录仍是历史50.28绑定；本轮没有绑定50.129的DSH答案，不伪造handle、回填答案、重绑旧会话或将独立受控Interaction当作原生入口。该原生项与模型E2E均NOT_RUN。没有主动制造finish_unconfirmed错误或重跑旧SourceText/跨答案锚定/复制保存分析/完整guard矩阵。

fresh-before/after仅覆盖既有1376日常文件、18旧报告和4原会话/绑定；不称全机零改动。旧39空基线、9642阶段差异、callback/共享缓存及新日常路径未枚举限制保留。隔离profile的package.json、pnpm-lock.yaml、cordis.patch.yml候选/平台/CLI配置是预期授权变更；新受管凭据、任务prefix/cache/证据和受限交接文件留本机。无源码修改、提交推送、额外CI、merge/tag/release/latest。

采集器错误与产品结果分开：Node最初缺Host peer已解决；保全脚本保留变量名和JSON日期精度问题修正，旧错误输出保留，最终既定保全检查通过。未将采集失败无记录覆盖成通过。

完整分项/证据bytes与SHA见[JSON报告](./WINDOWS-CI6-PLATFORM021-VERIFICATION.json)；[完整MCP目录](./WINDOWS-CI6-LIVE-MCP-TOOLS.json)为 232727字节，SHA256 e351b2f06c4fff47586d9945989b3b1e8eb2157496706e739baaaf5408093242。
