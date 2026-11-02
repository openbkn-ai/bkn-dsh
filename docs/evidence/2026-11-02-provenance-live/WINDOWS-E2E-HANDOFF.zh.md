# CI4 Windows 原生 E2E 交接

2026-11-02。用户已指定 [0.2.1业务溯源win](codex://threads/01a19c6a-e785-7f82-a5b4-cda473951fa6?hostId=remote-control%3Aenv_e_6abf8babb404832890d7c5124118ed3c)（DESKTOP-IEJNBRE）执行发布前E2E。主会话通过线程工具发送了完整验收清单；目标已启动并回报正在检查原生GUI能力及隔离方案，尚未修改日常环境。**这只是任务接收和准备进度，Windows安装/实际加载/功能验收均未据此记为通过。**

## 固定产物

- 仓库`openbkn-ai/bkn-dsh`，分支`feat/provenance-platform-parity-live`；实际构建源码`a52032956314cf582c0f39ed3dab2f8e80e91085`。后续文档提交不改变此候选。
- [CI41444758077](https://github.com/openbkn-ai/bkn-dsh/actions/runs/41444758077)，publish=false、success；artifact `plugin-tarball` / `13141832289`，接收前已重新核对未过期及GitHub digest。
- ZIP SHA256 `3a7c905c268aad2eaca45d7839d6adb9da57c9bdad06f9bd0f2fd25283d8d8d9`，877321字节。
- TGZ `openbkn-dsh-business-context-0.2.1-rc.3-openbkn.0.2.1-3.tgz`，SHA256 `cf9abdf4ac085506793501f5f4c7e2d3f6ff4bc8c873e07c4b6b401064ec6b8a`，877325字节、126文件。
- `lib/client.js` SHA256 `fb12b2239c465707d471d86651e74dd39694abd997057e29db896bc3dcf5e8d2`；`lib/business.js`为`bac538d8de54f6b362ba39374b495cf39c6dfe89c4732074cfc966f98e1af7ad`。CI3/CI4版本号相同，不能只看版本号。完整文件摘要见[身份清单](./CI4-ARTIFACT-IDENTITY.json)。

## 执行范围

1. 记录Windows、官方Desktop EXE/ASAR/Host build、实际运行PID和创建时间、Desktop/CLI/插件CLI子进程各自Node身份。二进制安全下载、核归档和126文件，经官方管理入口安装到独立DSH profile/userData，正常退出再冷启动。CLI拒绝desktop-owned profile写入时使用官方GUI，不篡改管理数据库，不装npm latest或重打包。
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
