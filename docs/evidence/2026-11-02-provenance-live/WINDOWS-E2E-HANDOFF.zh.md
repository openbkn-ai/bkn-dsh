# CI4 Windows 原生 E2E 交接

2026-11-02。用户已指定 [0.2.1业务溯源win](codex://threads/01a19c6a-e785-7f82-a5b4-cda473951fa6?hostId=remote-control%3Aenv_e_6abf8babb404832890d7c5124118ed3c)（DESKTOP-IEJNBRE）执行发布前E2E。主会话通过线程工具发送了完整验收清单；目标已启动并回报正在检查原生GUI能力及隔离方案，尚未修改日常环境。**这只是任务接收和准备进度，Windows安装/实际加载/功能验收均未据此记为通过。**

## 当前目标与环境恢复授权

用户再次明确：Windows只验收官方DSH Desktop **0.2.1-rc.5**，不再测试rc.2、rc.3或任何更早宿主。CI插件归档仍固定下述cf9ab包，不因环境重建重新打包或触发CI。此前旧Host和隔离环境异常仅作为历史失败，不算当前目标的功能验收。

用户要求持续推进，并授权修复/重建符合条件的测试环境：可在独立路径重新准备官方rc.5、任务profile/userData和必要运行依赖，解决窗口选择、坐标/可访问性操作及登录回调混用等可恢复问题；保留已有授权和证据，保护日常应用、账户、会话及恢复材料，不覆盖未知Before的文件，不全局kill或关闭TLS。无法自动完成的本人身份验证仍交用户，其他独立准备继续。

远程已确认本人登录，但此前回报登录回调出现第二实例、测试profile与日常userData混用；之后观察到日常安装rc.2→rc.5、两个文件摘要及协议关联变化。具体触发原因未证实，保留为隔离异常，不倒推是插件缺陷或恢复旧Host。最新rc.5目标和重建授权已通过线程工具同步，正在恢复环境；W1—W6尚未得到实际通过证据。

## 固定产物

- 仓库`openbkn-ai/bkn-dsh`，分支`feat/provenance-platform-parity-live`；实际构建源码`a52032956314cf582c0f39ed3dab2f8e80e91085`。后续文档提交不改变此候选。
- [CI41444758077](https://github.com/openbkn-ai/bkn-dsh/actions/runs/41444758077)，publish=false、success；artifact `plugin-tarball` / `13141832289`，接收前已重新核对未过期及GitHub digest。
- ZIP SHA256 `3a7c905c268aad2eaca45d7839d6adb9da57c9bdad06f9bd0f2fd25283d8d8d9`，877321字节。
- TGZ `openbkn-dsh-business-context-0.2.1-rc.3-openbkn.0.2.1-3.tgz`，SHA256 `cf9abdf4ac085506793501f5f4c7e2d3f6ff4bc8c873e07c4b6b401064ec6b8a`，877325字节、126文件。
- `lib/client.js` SHA256 `fb12b2239c465707d471d86651e74dd39694abd997057e29db896bc3dcf5e8d2`；`lib/business.js`为`bac538d8de54f6b362ba39374b495cf39c6dfe89c4732074cfc966f98e1af7ad`。CI3/CI4版本号相同，不能只看版本号。完整文件摘要见[身份清单](./CI4-ARTIFACT-IDENTITY.json)。

## 执行范围

1. 记录Windows、官方Desktop0.2.1-rc.5的EXE/ASAR/Host build、实际运行PID和创建时间、Desktop/CLI/插件CLI子进程各自Node身份。二进制安全下载、核归档和126文件，经官方管理入口安装到独立DSH profile/userData，正常退出再冷启动。CLI拒绝desktop-owned profile写入时使用官方GUI，不篡改管理数据库，不装npm latest或重打包。
2. 从Windows真实DSH回答及合法finish回执打开新版平台式业务溯源；核对平台同记录轮次、原问答、Operation ID、状态和原因。双轮、父/内部调用、共享输入分支、空筛选、partial搜索/刷新和选择保留按实际样本验证；缺样本保留UNKNOWN。API可读不能替代原生入口，不注入handle。缺合法样本时，最多通过官方隔离工作区做1—2轮短小只读KN元数据查询形成真实关联，不重跑业务/CSV用例。
3. 核对时间链/证据链、阅读/图谱、步骤/来源/证据选择联动、两种局部全屏及缩放。invalid和原因只原样展示，不重判、删原记录或补造关联。业务知识网络目录未改版，不属于本次布局增量；缺绑定时旧降级视图不能算新版通过。
4. 用产品复制按钮后真实OS粘贴到未发送隔离草稿并读回；原生Save到全新任务路径核原始UTF8字节/SHA。剪贴板文本与文件分别取证，不用脚本代写文件冒充下载，不经默认PowerShell文本重定向/编码往返静默改写CRLF、BOM或末尾换行；有差异留证后分层诊断。
5. 验证原文层/全屏/分析侧栏的内层Escape和回焦、Tab/ShiftTab边界、历史下拉两层Escape、历史结果返回编辑，以及一次显式开始→busy→completed/error后不补Tab/点击的直接Escape。只关闭应关层、保留父详情，不抢其他已连接控件或portal焦点。AX/UIA观察与DOM activeElement证据分别记，不伪造根因或诊断loadedVersion。
6. 有安全现成条件才验证关闭/切轮取消与迟到结果；不改日常认证、网络或TLS来制造异常。平台原始Markdown、partial/invalid、分析终态与建议忠实保留。原始SSE、分析时POST及provider最终输入只有实际捕获才能作证；预取显示、模型自述、HTTP成功或completed均不替代业务质量结论。

既有隔离样本生成依据/Agent分析授权沿用：优先读已有解释，只在必要隔离样本至多生成1次、分析1次，不自动重试、不应用建议；若复用Mac平台样本，不重新生成其解释。原问题、回答、业务数据和输出不变。本人登录、条款和客户端授权由用户完成，不复制或外发凭据绕过。

## Windows 收态及报告

保留原checkout、官方Host、日常包/profile/会话/凭据。先记必要Before，窗口X可能仅进托盘，使用官方菜单正常退出。必要清理同时核对PID、创建时间、可执行路径、父子归属和端口当前owner，防PID复用；禁止按名称批量杀进程。URL关联/注册表只恢复本任务改动且当前仍等于任务After的项，保留原不存在的状态，不整库导入或绕过受保护UserChoice。最后核对日常文件/原会话、owned进程和端口；保留任务授权及获准新增解释/分析记录。

逐项PASS/FAIL/UNKNOWN，区分受控、API对照、真实WindowsGUI和人工。失败先保留原件，不循环重跑或改插件其他部分。私有截图/UIA/日志/原payload留远程且不收凭据；公开脱敏JSON和中文MD按原字节给bytes/SHA/base64，在工具输出中使用`WINDOWS_E2E_PUBLIC_REPORT_BEGIN/END`，供主会话接收和独立复核。生成/分析次数及ID、平台终态、环境恢复分列，未知项不补写为通过。

远程不commit/push、不运行远端CI、不改生产代码、不升级Host/平台、不merge/tag/publish或移动latest。主会话维护交接/结果记录；Mac验收、Windows接单、Windows最终实证与正式发布批准分开记账。


## 阶段证据与只读恢复线索

旧登录/环境阶段公开报告已按4份SHA原字节接收至[windows-interim](./windows-interim/RECEIPT.json)，并经[独立接收复核](./windows-interim/INTAKE-REVIEW.zh.md)。其旧Host准备、候选未安装和W1—W6 UNKNOWN保持历史，不补写为rc.5通过。远程随后已回报rc.5官方签名/程序摘要及Node24.21核验、双目录隔离和登录恢复；官方rc.5 CLI已接收固定TGZ安装请求并处理依赖。安装退出码、126文件、冷启动和实际功能结果仍待回报。

并行只读检查了本机Mac实际rc.5 ASAR：build `d4db512a969fccf0c5cc7ec8fe38e9c1d27af916`，SHA256 `8dad52f295bdbe9fa71948fdf38ac2ce3c910213d3b89c37174b2af77db9fb31`。ASAR内部`lib/main.js:53–83`使用`DSH_HOME`派生profile，而`:12044`直接使用Electron的`app.getPath('userData')`；只设DSH_HOME不能证明双隔离。这份main未读取`DSH_DESKTOP_USER_DATA_DIR`，但不能因JS未解析`--user-data-dir`而断言Electron原生参数无效。`:13056`注册协议时未主动携带额外隔离参数，`:7659–7665`的second-instance及`:13057–13060`的`dsh://open`仅聚焦；实际Windows包/注册表/argv/落点仍需本机验证。

同一Mac包的登录凭据由原Host OAuth callback接收，原窗口在成功事件后进入工作区（`lib/main.js:12204–12216`，账户插件`:530–601`）；通用协议只是聚焦入口。该静态线索支持先观察原隔离窗口已有登录、避免误选实例，不授权复制凭据或用注册表绕过。它不是Windows实际更新或混用的根因证明。新rc.5 baseline不能抹掉旧2文件摘要及42项mtime观察，不能覆盖缺Before数据，也不能盲恢复旧rc.2协议路径。


## rc.5 恢复后的当前检查点

据指定远程会话进度，已核实官方rc.5有效签名、EXE/ASAR摘要和Node24.21，DSH profile与Electron userData独立，DeepSeek登录保留。官方rc.5 CLI安装固定TGZ退出0；安装文件再次比对无差异，冷启动后官方插件管理页显示OpenBKN启用。Windows MCP已实际完成截图、窗口/控件树、点击和输入，早期坐标工具故障已有可用路径，不作为停止任务的理由。

本机合法多轮历史及完成回执已找到，平台可读性仍待认证后核实。OpenBKN设备授权首次等待超时，远程已直接重开有效页，请用户本人登录授权；这不是再次登录DeepSeek，也不是重索测试授权。当前功能E2E仍待继续，不能把环境恢复、插件启用或Mac结果填成Windows完整验收通过。新阶段原始回执将在功能完成后按SHA接收，前述历史材料不改写。
