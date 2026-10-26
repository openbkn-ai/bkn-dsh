# Windows 会话范围提示（等待固定交接）

继续 OpenBKN 插件0.2.1的 #105 非 GUI 最小补证。先核对用户后续提供的新交接分支、完整提交和 KIT-FILES SHA；当前材料仅本机准备，无新远端提交。不得自行选 main/latest、远端 -11 或其它发布线。仅使用冻结 -32（46626510825fe9146aef12c27a1724acbb455aeac22aa600358add0fc8e1c9f8）。

只按 WINDOWS-MINIMAL-PLAN 的 N0–N3 执行，并先阅读 SETUP-NON-GUI。输入验证运行 verify-inputs.mjs；没有 --require-gui 门槛。独立GUI、生产签名、W-LIFE结果、日常Chrome身份、浏览器信任、真实CLI登录均不是本次合成非GUI验证的前提，不为本次工作启动浏览器或索要账号。

每个固定Windows运行时仅补stock/protected的同源307与跨源307对照。必须有实际原生MCP factory、ToolRuntime、profile owner与摘要证据；第二源0但没有stock正对照或同源成功不能PASS。只向127.0.0.1发合成问题、合成Bearer/Session。缺Windows runtime或真实profile前提就只阻塞相应行，不能借Mac结果补填。

原 d20a266 补证不扩容：-31仍只补U1/溯源/精确800×600，-30单独W-LIFE。不要覆盖其目录或重跑已过argv/tar/完整UI/目录/默认超时/B1。此新工作也不等待其W-LIFE结果。

保持现有Host、正式192.168.50.129原样0.2.0及原数据配置；不使用50.28，不升级DSH/SDK，不改 -30/-31/-32，不安装GUI/签名工具或证书，不发真实模型/G6/Sandbox/Function/run_code/BOM/CSV。不推送、不跑CI，不开PR/tag、不发布。全部变化只在全新任务副本，按PID/UTC/exe/端口核验owned收态，不按进程名kill。

使用RESULTS-TEMPLATE，回传输入/实际Host/Node/Electron/物理MCP身份、逐项结果、同源与第二源计数、fixture和Host清理、脱敏manifest及受阻项。原始失败保留，私有日志仅留Windows本机；结果和输出保存在kit外。始终注明local-development-preacceptance、ciRun=null、formalAcceptanceEligible=false；不把后端通过写成GUI安全或整个SDK/OAuth漏洞已修。
