# Windows 登录成功状态最小复验交接

固定源 `dbf53d329eae704e580e555f9da37f7c05a8111a`，候选 `0.2.1-rc.3-openbkn.0.2.1-auto.local.2`，94文件，SHA256 `96dc62d7ef9bded5ca45861a9d8d5e0f627f30a365a38590d7cbb541a9867571`。取件分支 `handoff/windows-auto-login-status-20261030`，取件SHA以主会话最终读回为准。原93f3e85/ea6be318保持冻结。

修复只改变一次性登录流的消费：读取首个已验证结果后调用原生dispose，不再通过for-await提前return等待iterator.return清理。无轮询、强制刷新或Host/认证/TLS改动。受控原生rc.3句柄与React selector/打包UI的前后对照可复现并消除该等待条件；Mac官方GUI合成授权实际自动显示成功。Windows原现场唯一根因尚未确证，本轮现场验证仍NOT_RUN。

执行范围只是一台已有任务官方rc.3 Desktop的一次真实授权成功自动更新，及必要的安装身份、关联备份恢复与正常退出保全。详见[完整提示词](WINDOWS-PROMPT.md)。上一轮取消/重开/重启持久化、MCP/CLI载体、其余矩阵直接复用，不重复执行。

准备后离线执行 `node verify-inputs.mjs`；安装后再带 `--installed <plugin目录>`。CANDIDATE-DELTA证明仅client.js/package.json变化。其余验证helper除verify-inputs的固定源SHA外均复用旧字节；business-observer不发tools/call。输出须放任务根，不能写kit，否则输入校验应拒绝。

本次允许主会话本地验证通过后推送此独立交接分支，不授权Windows推送或任何CI/PR/发布。formalAcceptanceEligible=false，ciRun=null。
