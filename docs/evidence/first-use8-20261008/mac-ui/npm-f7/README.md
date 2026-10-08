# npm F7：原会话重启、本地过期与真实重登

固定 CI 候选 `6a946030…`，官方 npm Host，隔离 root `/tmp/bkn-firstuse8-mac-npm`。会话为 `session-6bc8cb48-f342-4007-8281-a2d066c5e7f2`。工作区绑定准备由生产 RPC 完成，不宣称原生系统目录选择器的 UI 验收。

- 原 Host PID46578 停止后，PID83398 在 2026-10-08 15:00:48（Asia/Taipei）启动；实际界面保留会话与网络关联。CLI 本地 expiresAt 为 06:38:53.964Z，早于重启；诊断 32931744 为 `not-logged-in`，首次续问未交付业务数值。见 `../npm-f7-local-expiry.json` 和 `post-restart-expired-turn.json`。本地过期是已验证原因；未测试平台撤销，不推断他端登录或 rotation。
- 首次重新授权等待轮关闭/超时，浏览器稍后完成授权不等于 CLI exit 0，因此未计恢复通过。背景浏览器未 Raise 时输入未进入表单，随后正常激活解决；不定责为账号密码或平台缺陷。
- 随后从产品保持面板打开，及时完成真实 CLI 设备授权，列网 2 与原工作区关联恢复；Host API 307c07e2 七项 pass，login-state 的历史 not-logged-in 标 recovered=true，见 `../npm-f7-relogin-restored-api.json`。API 报告不计产品下载件。
- 同一原会话重新提问产品 382-000005：`post-relogin-turns.json/.md` 为实际 native completed 的安全派生导出，40 张/全已确认，与独立产品 oracle 对照。工具结果及原生模型输出保留，没有纠错轮或输出替换。

前序成品仓回答实际打开执行/图/回执视图，图 19 元素、0 可视边；选定库存对象 operation `op_0a6f7281ec65aa770724de701159a92e` / Interaction `int_a9b9c8af2621daa9f3449369900153d3` / receipt `rcpt_f46016358a018e13110460d7ec1bb989` 经真实 CLI 核验，见 `../npm-f7-selected-receipt-*`。仅证明该对象，不泛化到全部图元素；显示的失败/pending 操作保留。

派生会话导出排除 reasoning/敏感元数据，不声称私密原日志字节一致。后续独立受控 reader 401 恢复/关闭等待面板场景见 `../npm-r1-observation.json`；最终安装身份与停止记录见 `../../mac-processes/`。
