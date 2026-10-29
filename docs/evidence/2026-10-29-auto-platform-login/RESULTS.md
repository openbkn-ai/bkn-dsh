# 私有平台自动登录：本地候选与验证（2026-10-29）

本轮本地闭环已通过：用户完成真实平台官方浏览器授权后，候选同步成功并读取两个授权网络；关闭重开及最终候选重启不要求再次授权。此结论覆盖本轮 Mac npm/Web 隔离 Host，不能外推尚未执行的 Windows、官方 Desktop 或正式发布验收。

`kind=local-development-preacceptance`；`ciRun=null`；`formalAcceptanceEligible=false`。

## 固定身份与交付

- 本地版本：`0.2.1-rc.3-openbkn.0.2.1-auto.local.1`，未发布。平台/官方 CLI 实测仍为0.2.0，版本串的OpenBKN0.2.1是既定发布标识。
- 最终归档：`release/auto-platform-login/candidate-final-4/openbkn-dsh-business-context-0.2.1-rc.3-openbkn.0.2.1-auto.local.1.tgz`；259279字节、94文件。
- SHA256：`ea6be318b40f06a55e95e1bfd962f4f06fe230874574028750639f62e61194dc`；[文件清单](CANDIDATE-FILES.json)全部94项与最终安装逐字节相符。
- 实际业务入口SHA256：`167e6571b44d6e0bece6456c19546b79c6d39bd709d0632e6c46f66859c40417`。最终候选与真实账号首次成功使用的candidate-final-3之间，仅`lib/client.js`及对应locale声明不同：删除已不适用的“需手动关闭浏览器”提示；全部后端字节相同。
- 官方CLI0.2.0入口SHA256仍为`18445a26bfb20f7a8cc8eecb50f499ff12c0ed564e0e3d8741850fcbe43f82a5`；官方rc.3 Host原版MCP仍为`758d8fc473b700b5d351158d06ce9f9e92c16e8b25497b08bb7bd2122a87f5dd`。没有修改这两个输入。

## 维护者决定与最小实现

维护者已明确接受私有环境首次自动信任；origin、观测IP或叶证书变化后自动更新记录，并重新打开官方浏览器授权。这里不是不可变TOFU：普通连接被锁定在当前代次，变化会产生未经授权的新代次，旧凭据不得跨越。此决定覆盖先前手工导入证书及导入后CLI阻断方案，但不改写那些历史结果。自动重新授权在用户正在查看连接面板时触发一次；被动诊断不打开浏览器。

1. 复用DSH存储域，保存非秘密的origin/IP/叶指纹/SPKI及授权代次。TLS引导仅观察证书，不发送HTTP、账号或token；每个新连接核对当前身份。保留证书日期检查。
2. 官方CLI仍负责设备授权、凭据存储和refresh token轮换。只在专用CLI子进程通过Node `--import`加载受限dispatcher；仅允许配置平台origin，跨源307在第二源收到请求前拒绝。Host全局fetch/dispatcher/环境不改；旧附加CA及相关环境只在这个子进程中清除。
3. 复用本机已安装Chrome/Edge，在任务所有的独立user-data目录授权，只给当前SPKI例外。授权完成、取消或超时后收回拥有的浏览器进程，不触碰日常浏览器信任或系统CA。不是新浏览器发行、扩展、代理或OAuth实现。
4. 原生MCP factory随插件交付。21行构建脚本对两版官方相同的stock入口做摘要检查，只增加连接级fetch配置入口和已评审的#105同源策略；其余工具注册/调用代码保留。框架依赖外置、使用同一Host服务；只有插件自己的连接选择此factory，不安装/覆盖profile或Host的MCP包。文件及MIT许可证纳入包审计。
5. 已授权的普通使用向官方CLI取得可续期token，不无限缓存服务token；读取token前后检查同一授权代次。平台撤销/拒绝续期仍需重新授权，不能承诺账号永不失效。

私有自动信任用观测指纹替代公共CA/名称身份验证，不宣称公共PKI首次身份保证；精确叶身份、origin/IP和日期仍在插件连接中验证。Chrome的SPKI例外匹配公钥，不能称为精确叶证书验证。[Chromium实现](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/services/network/ignore_errors_cert_verifier.cc)要求独立user-data目录；本轮启动路径满足此条件。过期或尚未生效的服务端证书不记作通过。

## 已执行验证

| 层次 | 结果与边界 |
|---|---|
| 源码/构建 | 完整651项：650通过、0失败、1项Windows专用跳过；旧Host基线构建通过，新rc.3 Host/client类型通过。最后仅locale增量，另47项UI/locale检查通过。 |
| 包与运行时脚本 | 最终94文件审计通过；20项相关运行时检查、3项manifest错误检查通过。包审计明确要求CLI preload、私有原生MCP及许可证存在。 |
| TLS真实套接字 | 首次观察不发HTTP；未授权不带凭据访问；同origin更换证书、origin变化和注入的远端IP变化均换代并拒绝旧授权。连接中未经观察的证书替换在HTTP之前拒绝。IP独立变化是可控观察器测试，未冒充真实LAN迁移。 |
| 默认443回归 | 保留真实TLS/HTTP，把OS目的端口映射到临时监听端口，验证Undici省略端口时传给TLS的值为443；不占用系统443。真实官方CLI此前EADDRNOTAVAIL，修复后能取得设备授权链接。 |
| 官方CLI合成HTTPS | 官方0.2.0原件，Node22.22.3及单独Node24.19.0：正常设备授权exit0；跨源307拒绝，第二源零请求。子进程scope不扩展父进程TLS。Node24轮没有再次使用真实账号。 |
| 合成浏览器/续期 | 用户在拥有的Chrome中完成一次合成授权；首次尝试超时保留。重开、重启复用授权。只修改合成测试token的到期字段后，官方CLI完成一次refresh，浏览器目录数2→2，没有新授权窗口。真实token从未被人为改写。 |
| 无手工companion交付 | 新任务profile移出手工companion后，仅安装本插件。实际业务类身份一致、三组件active、同步和目录通过；stock Host未改。 |
| 真实0.2.0账号 | 本机正式端点TCP不可达，改用维护者已授权的可达企业端点，仅登录、MCP初始化和只读目录。用户完成官方页面授权；真实Service读回authenticated、目录数2，原生MCP的registry实例与manager fiber.runtime相同，实际加载插件自带factory，profile无手工companion。浏览器内部步骤由用户完成，未自动化逐屏读取。 |
| 最终归档重启 | 同一任务home原地安装最终归档；新Host PID13439。读回文件落盘在该次spawnRequestedUtc之后；authenticated、目录数2、factory实例一致，未创建新授权浏览器目录。实际OS创建UTC未单独采集，不能用spawn时间替代。 |
| 收态 | 所有本轮拥有的Host退出0；合成fixture关闭、其记录无tools/call；任务node/授权Chrome进程零残留，最终Host及fixture端口释放。任务凭据、配置、失败证据及旧代次目录保留。 |

[机器摘要](SUMMARY.json)与[选定证据清单](EVIDENCE-MANIFEST.json)可复核上述有限范围。22项私有文件只登记路径类别、大小及摘要；截图、CLI输出、浏览器profile、账号凭据、平台目录原文和证书私钥不纳入Git。选定清单不是完整个人目录或平台数据快照。

## 保留的首次失败与修正

- 交付缺口：早期浏览器成功依赖手工profile companion，不能据此声称插件独立可用。已改为随插件交付私有factory，之后无手工companion的实际Host/真实账号路径通过。
- 本机端点不可达：一次保存后停在连接失败，独立TLS观察超时，TCP检查返回无路由；没有替换/启动平台来消除该失败。后续用另一既有0.2.0平台通过不等于原端点恢复。
- 插件实际缺陷：Undici默认HTTPS端口为空，`Number(options.port)`变成0，真实CLI报EADDRNOTAVAIL。改为默认443；保留原诊断输出，补真实CLI授权链接及套接字回归后再交给用户授权。
- 缓存缺陷：先保留“独立读取仍返回旧缓存token”的失败，再改为官方CLI续期权威；增加代次变化期间token读取拒绝。
- 测试时序：新增可选代次检查一度让无自动profile的旧读取多出一次微任务，原取消/请求共享测试失败2项；只在存在自动profile时等待，恢复旧路径时序后全量651项通过。曾在完成输出前错误报告通过数，已当场更正。
- 合成fixture最初健康响应字段不符合CLI的ServerVersion契约，修正fixture后通过，未修改CLI。旧服务注册数断言由2→3，按新存储服务的确切类名修订；不放宽产品断言。
- 编排记录：一次pnpm pack目的目录解析到checkout外的任务目录，仅把该次生成的精确归档移回并核对摘要；无既有文件清理。另有错误相对路径、无效测试glob、URL/文件摘要清单断言等本地命令失败，未作为通过结果。最终所有构建/测试/安装依据均为显式路径及归档摘要，原记录留在release目录。

## 剩余边界

- 本增量尚无物理Windows或官方Mac Desktop实际授权/子进程收态验收；旧轮次通过不能代填。旧Host本轮构建/类型证据不等于新自动授权的全形态通过。
- 真正全新机器自动安装CLI、没有Chrome/Edge、公开CA真实账号场景没有执行；当前复用已有兼容CLI及Chrome/Edge。服务端拒绝续期、账号403及失效证书不能承诺免授权继续使用。
- 未发模型回合、业务tools/call、G6、Sandbox、Function/run_code、BOM/CSV或解释生成。没有平台部署、Host安装根修改、SDK修补、系统CA导入、代码推送、公开issue、PR、远端CI或发布；latest及本机npm CLI仍由维护者处理。
- 公开替换需另行授权后才进入独立评审、固定CI候选与上述受影响形态验证；当前不推进这些步骤，也不把缺口默认降级为已知限制验收。
