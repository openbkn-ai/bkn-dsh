# Mac CI6：正式 CLI 0.2.1 / CE 129 最小差异验收

本轮缺口已补齐：原生面板安装正式 CLI 0.2.1、129 正常授权与网络同步、一次 MCP 目录/schema 采集、冻结包 Reader 目录和详情读取均通过。formalAcceptanceEligible=false；仅为受影响边界补证，不代表整版或所有形态验收，也不执行发布。

## 固定身份

源码 f01b316fbfb6be681af81e2267a7b3341e659efd；CI6=41596006291，artifact=13212518096；插件 0.2.1-rc.3-openbkn.0.2.1-3。tgz 877732 字节，SHA256 4500fa4357cdcdcb9914a39794aedb9096c948192c2bf0f35ecf4fadb882f046，收尾安装126/126逐字节、尺寸匹配。

官方 Mac Desktop0.2.1-rc.5，Node24.21.0 / Electron44.7.0，codesign deep/strict exit0。129 的正式 CE0.2.1/17Chart 身份沿用部署会话确认，本轮不重复部署验收；50.28 未访问、未修改。

## A：正式 CLI 安装 PASS

固定候选原生面板选择正式0.2.1，在新任务 prefix 仅实际安装一次，显示 CLI0.2.1 可用并自动填入路径。真实 --version=0.2.1、exit0。npm 官方 @openbkn/bkn-sdk@0.2.1 的 gitHead=41e57219ca774e3c9f82050851a39a7e25678e43，官方归档232660字节、SHA256 d699db94b0ab61b1b888c8b3936b21723827a0ae8849f78f8ebd64fb725e4452，SRI通过，归档9文件与安装文件全等。

安装阶段仅子进程使用新任务HOME，避免覆盖已存在的日常CLI；浏览器阶段恢复真实用户HOME。固定业务类身份和三组件服务已在安装实例采集；business/client摘要与CI6一致。未替换默认CLI。

## B：129 正常授权/同步 PASS

通过原面板保存新任务正式CLI绝对路径，按官方设备授权流程登录既有账号。成功时面板显示“登录并同步成功”“找到2个网络”，等待文案消失；平台pin保持同一generation并由产品正常标记已授权。没有直接注入token、AppKey或手设授权标志。

原环境卡CA与产品leaf是不同证书，不能用两者指纹不同判定换证。修正后的证书链verify exit0，IP匹配、issuer和签名校验均通过；没有改OS信任。CLI认证和读请求使用固定包连接范围pin逻辑，没有全局TLS豁免。

前两次设备流程在确认授权前超时，历史保留；第三次于05:15:26.537Z启动并成功。自动化不能读取独立授权Chrome时，将同一官方设备URL仅在内存中转入新建普通Chrome标签，继续相同origin/device流程，无安全警告绕过。任务标签关闭，日常Chrome保留。用户实际授权提交的精确UTC未采集。

验证准备曾加入额外被动观察器，其在场时设置保存两次失败。移除额外行并正常重启后，原面板保存成功；根因未确定，不能把观察器因果写成已证实。最终正常profile不含该观察器；不额外声称最终manager对象/wire身份已观测。

## C：一次目录/schema + packed Reader PASS

正式129只采集一页 tools/list，共26工具。与留存的实际129目录相比，解析后的完整JSON相同，工具增删0，全部输入/输出schema全等，结构差异0。两个原文件SHA不同不能误称原始字节全等；其JSON值全等。没有放宽新工具准入。

独立隔离脚本使用已有MCP client v2和冻结包pin fetch；它与原生管理器运行证据分开。初始化/通知/SSE读取和tools/list均为元数据，tools/call=0。冻结 OpenBknPlatformReader 成功读取网络目录（2个）与 supply_ontology_hand summary详情，buildNetworkCapabilityProfile校验通过：15对象类型、19关系类型、3动作类型。详情是只读POST，不等于业务写入或MCP工具执行。

采集脚本初版语法错误及非提供模块 @modelcontextprotocol/sdk/client/index.js 的MODULE_NOT_FOUND均发生在平台请求前；原件保留。仅修验证脚本，复用已安装的client v2，无新增依赖、观察插件或工程。未发现契约变化，因此不重复业务/模型/guard/CSV/SourceText矩阵。

## 收态与边界

三个本轮实例均正常菜单退出且真实exit0；最终83929退出，Host/鼠标工具残留0，三个记录端口监听0。固定包126/126、TGZ、官方EXE/ASAR、默认CLI包装器、旧任务profile/绑定和日常profile YAML共7个保护件前后不变，checkout干净。

LaunchServices仅既有dsh handler修改时间变化；确认当前等于本轮After、其余数据全等后，仅恢复该时间写点，最终与Before逐字节一致。未宣称整个用户HOME、TCC或服务端数据前后全等。授权凭据保留在新任务私有目录，没有回滚成功授权。

收尾校验器曾误将摘要字符串与{bytes,sha256}清单对象比较，产生126项假差异；初始输出保留，纠正校验器后126/126通过，未改任何包文件。此前鼠标授权延迟回复不触发旧S1-S3重测，鼠标程序本轮未运行。

完整AX、截图、授权/配置日志和证书原件仅留本机；公共文件不含账号、密码、token、设备码、授权URL或业务原文。未新增模型问答/解释/分析、tools/call、业务写入、指标修改；未改Host、平台、固定包，未推送、未跑CI、未创建PR/tag/发布或变更latest。CE原生溯源既有限制不在本轮重测或降级。
