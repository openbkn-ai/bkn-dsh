# 可粘贴到Windows会话的范围提示（准备态）

继续按OpenBKN 0.2.1验收合同处理本次#105 Host同源回补最小差异材料。先核对用户随后提供的新交接分支、完整提交和KIT-FILES SHA；本材料当前没有远端提交，不要自行选择main/latest或其他分支。仅用冻结 -32（46626510825fe9146aef12c27a1724acbb455aeac22aa600358add0fc8e1c9f8），不采用 -11，不改 -30/-31/-32。

1. 当前另一个会话的d20a266补证保持原范围，不覆盖其taskRoot、报告或profile，不重复argv/tar、已通过完整UI/目录/默认超时/B1。
2. 先只读校验本kit，使用任务Node24.19.0执行verify-inputs.mjs，把输出存到kit外；再执行--require-gui。当前GUI-ARTIFACTS为NOT_BUILT，应exit2，记录BLOCKED并停止依赖GUI的工作。不得改该文件伪造BUILT，也不得自行从MCP payload组装/启动GUI。
3. 未获得完整Windows runtime/独立GUI固定制品和新的明确执行范围前，不启动Host、发起CLI登录、导入证书、安装或运行签名工具。无需索要密码、token或私钥。
4. 后续制品补齐并获执行授权时，只按WINDOWS-MINIMAL-PLAN的W0–W4补变化边界。原生MCP探针只用合成loopback数据；真实CLI登录要先核对当前日常Chrome根PID、UTC创建时间、exe及窗口，并评审W-LIFE前提。不得kill进程名、日常Chrome或无身份核验的进程，不注入Job/句柄或修改Host终止策略。
5. 保持正式https://192.168.50.129的原样0.2.0，不使用50.28，不升级DSH/SDK/平台；所有变更只进新副本，原数据配置保留。回滚切回原路径，保留新增Session/失败原件/续期凭据，不恢复过期token。
6. 不发模型/G6/Sandbox/Function/run_code/BOM/CSV，不推送、不跑CI、不开PR/tag或发布。结果和脱敏证据存kit/taskRoot之外；原始日志/截图/CLI配置仅留本机。

回传RESULTS模板、每项PASS/FAIL/BLOCKED/NOT_RUN、实际输入摘要与Host/插件/Node/Electron身份、实际加载路径/签名/第二源计数、owned清理及保护摘要；没有实际执行的项不能借用Mac结果或旧Windows rc.2标PASS。整轮保留local-development-preacceptance、ciRun=null、formalAcceptanceEligible=false。
