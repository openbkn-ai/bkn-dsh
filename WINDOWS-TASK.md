# Windows 复验任务

请继续 bkn-dsh 0.2.1 的 Windows 本地预验。只使用当前 `handoff/windows-local30-20261022` 分支和主会话提供的完整固定提交，不用旧 fd87974/-27，也不采用、合并或修改另一路远端 -11。先读 README.md，核对完整 commit、KIT-FILES 和候选 SHA，使用本分支中冻结的 -30 tgz，不重新构建或下载别的插件版本。

按 docs/handoff/2026-10-22-021-local-30-windows/HANDOFF.md 和 RESULTS-TEMPLATE.md 执行。保留旧 -27 失败原件，使用新的独立任务目录、四组 DSH_HOME、CLI 配置及工作区；不覆盖日常安装或配置。只连接 https://192.168.50.129，保持正式 0.2.0 不替换，保留平台数据和配置。不推送、不跑 CI、不开 PR、不打标签、不发布，不部署安全回补或企业扩展。

优先覆盖两版官方 Desktop / npm-web 的实际 profile 闭包和同一候选 82 文件：旧 Host 与插件共用 Cordis 4.0.4 / Schemastery 3.18.4，新 Host 共用 4.0.5 / 3.18.5，必须比较实际物理包；仅 runtime 根校验不算通过。插件 Zod 4.4.3 与官方 Host 自身声明分别检查。再验证 Git tar 在 PATH 前时仍选择系统 tar、Desktop 持久日志和关闭启动 shell/远程重连后同 PID 无 EPIPE、英文标签间距、取消/超时/重试、zh/en、目录绑定、窄窗口/焦点/键盘及真实 JSON 保存。

在具备正常认证、实际 profile 校验通过等前提后，按便携只读 B1 协议验证同 Host 配置重载、真实 CLI 重新登录和新 Session 普通查询，并独立读回平台 Interaction/operations。夹具仅走 start → query_object_instance → finish；不要把普通查询计数当销售明细或真实模型 G6。没有经过核验的执行前 Sandbox 安全条件时，不运行真实模型业务回合、Function、run_code、BOM/业务 CSV。保留 CE 非空原生解释缺路由、低权限账号暂缺等 blocked 项；不要越过浏览器 TLS 警告。

需要用户登录、原生目录选择或浏览器信任配合时，指出具体窗口/步骤和原因；先继续独立可测项。完成后正常退出仅本轮拥有的进程，核对 PID/创建时间/exe/端口，恢复本轮任务补丁，确认选定个人和平台数据/配置摘要未变。保留所有新会话和原始失败，不清理他人的资源。

按模板交付每个组合的 pass/fail/blocked/not-run/insufficient-evidence、实际加载版本、证据路径/SHA、原始错误摘要和受阻项；没有采集就保持未知。原始凭据、业务行、登录/启动日志和设备 URL/code 不得上传，公开报告先脱敏和秘密扫描。当前没有结果推送授权，先在会话回传脱敏报告与本地路径。
