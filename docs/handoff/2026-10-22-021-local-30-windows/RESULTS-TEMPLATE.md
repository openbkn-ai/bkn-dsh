# Windows -30 本地预验结果

日期/时区、Windows/架构、PowerShell、固定 Node/npm、Desktop 内置 Node：
实际新交接完整 commit（当前材料尚未推送；不得填写 fd87974 代表 -30）：
候选版本 / tgz SHA256 / KIT-FILES SHA / 安装的 82 文件：
官方安装器摘要、Authenticode、实际 FileVersion/ASAR 版本：
CLI 路径/0.2.0/integrity、独立 DSH_HOME/CLI配置路径：
正式平台 https://192.168.50.129 / Node TLS / 浏览器信任（分别填写）：

这是 local-development-preacceptance，ciRun=null，formalAcceptanceEligible=false。每项填写 pass/fail/blocked/not-run/insufficient-evidence；历史 -27 结果另列。

| 项目 | A 旧 Desktop | B 新 Desktop | C 旧 npm | D 新 npm | 证据路径 / SHA / 原始失败 |
|---|---|---|---|---|---|
| 原生包版本/签名、隔离目录、同 tgz 82 文件 | not-run | not-run | not-run | not-run | |
| Host 根闭包（scope=installation-only） | not-run | not-run | not-run | not-run | 不冒充 profile |
| 实际 profile + 官方解析器闭包 / 同物理 Cordis、Schemastery | not-run | not-run | not-run | not-run | 版本相同但 realpath 不同仍失败 |
| 插件 Zod 4.4.3 / Host Zod 版本及其声明满足 | not-run | not-run | not-run | not-run | 不覆盖官方包 |
| Git tar 在 PATH 前时的系统 tar 选择 | not-run | not-run | not-run | not-run | |
| Desktop 持久日志 / 关闭 shell 与重连后同 PID、无 EPIPE | not-run | not-run | n/a | n/a | 原厂健壮性未改 |
| before/after 个人配置与日常安装摘要 | not-run | not-run | not-run | not-run | |
| Node CA 验证 / 浏览器信任 / 正常 CLI 登录列网 | not-run | not-run | not-run | not-run | 分开记录，不越过 TLS 警告 |
| 英文 Report / Created / Mode / Platform URL 间距 | not-run | not-run | not-run | not-run | |
| zh/en、窄窗口、选择状态、Tab/Escape/滚动 | not-run | not-run | not-run | not-run | |
| 诊断刷新焦点与真实 JSON 保存并重开 | not-run | not-run | not-run | not-run | |
| 登录取消/超时的 CLI 退出、真实重试 | not-run | not-run | not-run | not-run | |
| 目录取消/重试/选择/绑定 | not-run | not-run | not-run | not-run | |
| 普通查询回合标准记录/404 空态及关闭取消 | not-run | not-run | not-run | not-run | |
| B1 前置成功基线/同 Host 重载及真实重新登录/新 Session 查询 | not-run | not-run | not-run | not-run | 同 PID、UTC时间、exe、监听及 totalCount=40 |
| B1 平台 Interaction/operations 独立读回 | not-run | not-run | not-run | not-run | completed + 唯一 query_object_instance/completed |
| 模型 G6 / Function / run_code / BOM/CSV | blocked | blocked | blocked | blocked | 执行前安全条件未具备 |
| CE 非空原生解释/联动 | blocked | blocked | blocked | blocked | 正式 CE 路由缺失 |
| 无本体权限负例 | blocked | blocked | blocked | blocked | 独立低权限账号暂缺 |
| task patch恢复、owned进程/端口退出、原记录保留 | not-run | not-run | not-run | not-run | |

实际加载版本未采集时保持未知，另存独立运行证据。协议夹具不是模型答案，B1 普通计数不是完整销售明细；原失败不得覆盖。回传只包含秘密扫描后的脱敏报告与证据摘要，原始私有日志留 Windows。本模板不授权推送、CI 或替换平台。
