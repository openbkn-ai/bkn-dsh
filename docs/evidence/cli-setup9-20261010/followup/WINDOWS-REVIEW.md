# Windows 回传复核与工具修正

固定回传：`a2504c54dbd3855b53dd2e13c568f565ba4c04aa`，旧候选 source `cf591d7cbd4af202d0bd893aab57202a72ec1644` / CI `38028568470` / tgz `de8d2160…`。原件保持在该独立证据分支；本文件补充复核口径，不改写历史原件。

- verifier 与两形态安装核验原生输出均为 69/69，missing/different/extra 为空，独立 exit 0。
- 1157 条选定文件记录以及 PATH 摘要、HKCU 环境变量名称摘要、APPDATA npm 名称清单和日常 SDK 版本前后一致。环境变量摘要覆盖名称，不延伸为所有值均已验证。
- 10 次主动停止记录的创建时间、exe 与 recordedStillOwned 均为 true，终态所列树/端口为零；另一个 Host 自行退出。旧 helper 实际只把端口不符作为告警，因此不能宣称已证明拒绝端口不符。本轮交接增加 `stop-owned-host.ps1`，四项必须全部匹配，缺少 listener 记录亦拒绝。
- 4 份产品诊断 JSON 的 Git blob SHA 与 reports.txt 记录一致。桌面 observer 是采集辅助日志，不是产品导出；其最终下载为 CRLF（128641 字节、b9337f9c…），Git blob 为 LF（125920 字节、09c7c723…）。这是换行归一后相同，不能说逐字节相同。reports.txt 中 860755d2…/119146 字节那行属于更早快照。完整摘要见 `windows-evidence-review.json`。
- 原生 PowerShell 5.1 已验证的括号修正现在进入 canonical verifier。`candidate-files.json` 用 Git `-text` 保持哈希输入；临时仓库启用 core.autocrlf=true 的真实 checkout oracle 已通过。新的 canonical helper 和新版候选 verifier 仍需 Windows 原生复测，Mac 静态检查不替代它。
- C98 既有 CLI/auth 失败保留仅有单测，Windows 实机未构造；受控权限/网络/TLS fixture 不延伸为真实环境故障覆盖。
- Desktop 旧测试 Key 带入隔离环境的来源未知。持有人已表示将撤销，当前未收到撤销完成确认；这属于宿主凭据隔离调查，不在 -9 插件修改范围内。不得输出或借用该 Key。

本轮包内修正限于目录路径分类、CLI 设置入口/进度指引和已保存路径提示。旧 Windows C90–C99 继续作为历史基线；新候选必须按新的固定交接执行受影响复测。
