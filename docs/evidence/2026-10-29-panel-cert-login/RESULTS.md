# 面板证书配置与登录修复（本地开发，2026-10-29）

## 接手与授权

实际工作副本：`bkn-dsh-panel-cert-login`，分支`fix/021-panel-platform-trust`，基线`dd4b7740e29fbc542332ec39f59205473fcce8e9`。2026-10-29接手时新副本干净，原工作树未改动。

本轮已获授权本地代码、构建、测试、打包与隔离Host验证；不推送、不建PR、不跑远端CI、不发布、不改公开包/资产/dist-tag、日常Host、正式平台或系统信任。现有固定归档及历史FAIL/UNKNOWN不变。替换目标在本阶段仅交付独立身份的本地候选，不覆盖同版本公开包。

## 结论和用户决定

本轮插件本地开发与有界验证已完成；**仍不具备替换公开包或宣称证书登录端到端完成的条件**。面板可选择单张PEM证书，预览平台origin、主题、签发者、有效期和SHA256指纹；必须明确勾选确认后才保存到当前profile。取消不启用，换origin失效，移除写入明确的`null`，由原生配置编辑器重载并释放原连接。

用户明确选择：“插件先保持CLI信任阻断，整理SDK issue，继续MCP/HTTP/UI验证”。官方CLI0.2.0的公开接口尚不能将附加CA严格限制到平台origin。选用导入证书时，插件在启动登录子进程前返回`TRUST_CLI_UNAVAILABLE`；未设置CA环境变量或修改CLI/SDK。详见[本地SDK issue草稿](SDK-ISSUE.md)。草稿未公开提交，未猜测负责人。

协调机会话提供的历史现象是：官方macOS Desktop rc.3未预设额外CA，健康GET报`DEPTH_ZERO_SELF_SIGNED_CERT`，探针显式提供已知CA并保留校验时HTTP200；CLI有过期凭据。其历史面板stderr未取回。本机使用合成HTTPS重现证书拒绝，不将合成结果冒充原环境登录日志。

## 实现与最小边界

- 复用现有面板、Remote和ConfigEditor，不建新GUI或发行体系。证书内容只进入Host预览和profile配置；浏览器结果只含元数据及短期确认标识，无PEM/文件路径。限定单张PEM、64KiB、证书日期及导入叶证书名称，拒绝私钥/多张证书/任意路径。
- `OpenBknPlatformTrust`为业务owner持有的连接池，仅在确切HTTPS origin上使用附加CA。真实握手仍校验链、日期和服务端名称，连接取消及owner销毁会中止在途请求。不改全局fetch/dispatcher、进程环境或系统信任。
- 目录和原生GET复用受限fetch。MCP需要明确支持`platformFetch`的本地配套模块，将连接级fetch组合在原#105同源限制内；stock或另有部署所有者的MCP不会被悄悄认证为已采用新信任。无配套能力时受控拒绝。
- CLI subprocess封装与基线逐字节一致。仅增加登录入口的安全阻断和固定错误类别；证书错误、过期登录和网络错误不输出原始stderr。未增加临时CA文件或CLI环境注入。
- 不修改业务参数、答案或平台返回状态；原生仍是GET-only。没有模型、Sandbox、Function/run_code、BOM/CSV或解释生成请求。

## 候选与配套身份

本地版本：`0.2.1-rc.3-openbkn.0.2.1-cert.local.2`。仅为未发布候选，不覆盖既有同版本公开包；OpenBKN0.2.1仍为发布标识，本轮没有平台0.2.1验收。

| 产物 | SHA256 | 字节/文件数 |
|---|---|---|
| `release/local2-delivery/openbkn-dsh-business-context-0.2.1-rc.3-openbkn.0.2.1-cert.local.2.tgz` | `e2330836691d980f5987c5b28dde364ffb4e8b88c9c77e4ba941aa19c5a676ce` | 241154 / 84 |
| 旧Host配套 `dsh-mcp-client-0.2.0-rc.2-platform-cert-local1.tgz` | `49d2ee3335338aa28e8acaa8a1d9474c8a021c68aa9b4fa268d81f24d8bd7d43` | 36377 / 12 |
| rc.3配套 `dsh-mcp-client-0.2.1-rc.3-platform-cert-local1.tgz` | `ba4c4dc485bee957117cbff07bf858cc2e80b77df186724fa4a1e5580c76b352` | 36200 / 12 |

实际安装运行的local.2归档SHA为`5d390fc73cda30a6c8d678689e2a1069193c1aa6187801acdc6a25ec4dcc3fac`（240604字节）。最终交付归档只改两份README；84个文件逐项核对，可执行文件全部相同，不能称交付压缩包字节与实测压缩包相同。见[候选清单](LOCAL-CANDIDATE-INVENTORY.json)和[配套清单](COMPANION-INVENTORY.json)。两个配套入口均为`ad1c5744b50873368028f29bcf28964133d34f11d85c83ddee8be770c41d2eb1`；保留各自上游版本、许可证和类型声明，通过额外本地补丁标记区分，不能冒充官方未改原包。未将构建期node_modules链接打入归档。

## 已验证事实，按层分记

| 层次 | 实际结果 | 限制 |
|---|---|---|
| 源码/自动回归 | 插件637项：636通过、1项Windows专用跳过、0失败；runtime manifest6项通过；旧基线构建/类型检查与rc.3 Host/Client类型检查通过；84文件包审计通过 | 非Windows执行，不替代真实账号或正式候选验收 |
| TLS回归 | 无CA拒绝、正确CA成功、错误CA拒绝、受信签发者下服务端过期/名称错误仍拒绝；origin/指纹/格式/日期、目录重定向拒绝、撤销明确null、在途请求销毁取消 | 本机合成HTTPS，OpenSSL生成临时证书，不是企业平台数据 |
| 原生MCP受控运行 | 两固定Host依赖基线，各无CA/确认CA/同源307/跨源307，共8/8通过；实际factory/ToolRuntime，第二源恒0，Schema保留同一个fetch | 无tools/call，无真实业务回合；不是两版GUI矩阵。见[MCP结果](MCP-HTTPS-PROOF.json) |
| 官方CLI0.2.0缺口 | 合成跨origin307后第二源收到一次匿名设备请求，同为60字节且均无Authorization；CLI在合成400处退出、无浏览器URI | 不宣称真实凭据泄漏。见[CLI结果](CLI-ORIGIN-PROOF.json) |
| Mac rc.3 npm/Web真实界面 | local.1面板中无CA登录报CERTIFICATE_UNTRUSTED；原生选择文件、元数据预览、未确认不能保存、取消再选、明确确认后保存、CLI安全阻断、移除均已操作 | 官方npm/Web Host，不是Desktop。截图在本地忽略目录；没有真实平台账号登录 |
| local.2实际加载 | 新任务目录安装候选，三组件active、Service类身份一致，业务manager自动选profile配套、实例身份一致，目录及原生GET成功；candidate/partial等平台状态保留 | 合成token/数据，仅受影响后台验证。见[实例结果](MAC-RC3-ACTUAL-SERVICE.json) |
| local.2撤销界面 | 新Host仅补受影响的移除/保存；落盘明确null，原fixture连接消失，stderr为0 | 未重跑完整UI。见[撤销结果](MAC-RC3-REVOCATION.json) |

local.1与local.2客户端字节不同，仅生成的源码行号元数据变化；规范化该元数据后其余字节一致，见[客户端等义核对](CLIENT-EQUIVALENCE.json)。因此保留local.1完整面板实操身份，local.2另记录后台和撤销，不伪称每个UI场景都在最终归档重新跑过。

local.2 fixture记录了配置重载期间的三组MCP元数据/目录/原生读取；不是“一次连接”。只有server/discover、initialize、notifications/initialized、tools/list及读取，`tools/call`为0，原生路径全部GET，没有生成解释POST。见[请求方法与收态](MAC-RC3-FIXTURE-REQUESTS.json)。退出日志实际记录code0/signal null，Host和fixture监听关闭；历史local.1也正常退出，原失败报告保留。

## 上游核查与未覆盖项

本轮已只读核查DSH与OpenBKN发布身份，未升级任何pin。支持目标仍是DSH0.2.0-rc.2（`639ed015397290b3745d163aafe02ffee4aa3f84`，Cordis4.0.4/Schemastery3.18.4）和0.2.1-rc.3（`1f81c047fc48fa190a683e469daa699857e9afe8`，4.0.5/3.18.5）。已看到更新的DSH rc.4/0.2.2-alpha.2预发布，未采用；OpenBKN正式Release/实际CLI基线仍0.2.0。原管理工具目录、业务路由及Sandbox策略未变，本轮无工具迁移，不重跑原G6。

Windows受影响证书UI/TLS/profile验证、macOS官方Desktop此次候选实操、真实平台账号登录和新CI候选验收均**未执行**。公开发行包、冻结-30/-31/-32、已有Host及正式0.2.0未改。本轮`ciRun=null`、`formalAcceptanceEligible=false`，不转记以前固定包已通过的UI/业务结果为本候选通过。

## 失败与更正保留

以下本轮失败的原件在本地release目录保留，不用后续通过覆盖：

1. 最初可选Schema.object默认生成空对象，误当已有CA；改为显式null union。随后尝试undefined默认值产生类型错误，同样改为跨两版可用的null方案。这是新增实现的问题。
2. 最初Client DTO引用Host TLS模块导致类型检查失败，改为共享纯类型。配套platformFetch在union下标volatile导致Schema拒绝，修为函数字段；首轮无CA负例过宽不能算通过，收紧后最终8项另存。
3. 原Remote库存断言17未随新增preview更新，改为18项及配置服务完整方法清单；旧服务测试夹具未给config使新增入口检查报错，补真实必需配置后重跑637项通过。
4. 首次实际Host观察器使用不存在的resolvePackage，在目录/managed MCP已通过后失败；改为packageOf，仅补剩余模块身份及GET，复用已有连接。原失败报告与原脚本保留。
5. rc.3隔离类型检查副本最初没有复制最新生成Remote声明，复制当前lib后通过。离线安装缺undici元数据，改为仅任务profile从registry安装。OpenSSL不接受负天数fixture，改用显式过去起止日期签发，不弱化过期证书断言。
6. 浏览器扩展禁止自动文件上传，未启用新权限，改用系统选择器；首次路径输入未生效，纠正后成功，不猜测剪贴板根因。没有修改日常Chrome、系统信任或读取其他文件。

## 下一步与停止条件

本轮最小本地开发停止；不增加GUI发行工程、业务算法、自动证书下载或全矩阵重跑。CLI缺口交由SDK/CLI侧提供origin限定契约后，才补真实账号的最小认证闭环。若另行授权推进公开替换，再按仓库规则做独立评审、新固定CI候选及受影响形态验证，并确定新公开版本；不能覆盖已发布同版本。当前不推送、不建PR、不跑远端CI、不改dist-tag/Release，不代处理维护者的latest或本机npm CLI。

仅合成、可公开核对的JSON及复现脚本列入本轮文档。截图、临时私钥、CLI配置、Host URL/日志和原生选择器快照都保留在忽略的release目录，不上传私有原件。
