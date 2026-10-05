# Windows 补测核对与发布异常取舍

日期：2026-10-05，Asia/Taipei。**结论：W1–W3 的验收缺口已关闭；W4 不能判为完整通过，继续 HOLD。建议先定位并修复 CLI 已退出而面板长时间连接中的问题，再发版。** 没有合并、打 tag、发布、移动 dist-tag 或改动候选包。

## 来源与核对方法

- 用户回传原提交 `de03eebe40890ed6d1e3ce85fb1f3d45840a01dc`；[原始报告](https://github.com/openbkn-ai/bkn-dsh/blob/de03eebe40890ed6d1e3ce85fb1f3d45840a01dc/docs/handoff/2026-10-04-windows-verification-v4-followup-results.md)。该提交及父提交 `dc76a9e` 从指定源码 `05565f4` 继承，仅新增／修改一份报告，没有代码差异。
- 已 cherry-pick 为本分支 `bee170c`、`e8db45e`；整合后的 [报告](../handoff/2026-10-04-windows-verification-v4-followup-results.md) 与原提交文件逐字节相同。
- 固定候选仍为 run **37202050194** / `c4b5dce`，133,806 字节、52 文件；压缩包 SHA-256 `c4a8effbe5f84ecb399ee45ddf705c9468ef311910dcf58f62e47a0c71687a02`，tree-hash `f4e90f96d5c82e8b8c8cc505847995c6d3624f9870c58a71d7a3d010f3a5c5ad`。主开发本轮重新核对本机固定 tgz 的 SHA，与报告一致。
- 主开发解析两份完整 JSONL：每份 16 项均 live/pass，汇总 16/16、failed=[]，插件 -4、dshTools 0.2.0-rc.2；没有把 stand-in 或评审结论当作 Windows 运行结果。
- 主开发在 macOS 独立运行只读 CLI 查询两次平台操作记录，均退出 0、恰好一条 search_capabilities。只提取工具名与条数，没有输出或保存业务正文／凭据。这是平台记录复核，不是主开发重新执行 Windows 测试或读其屏幕。
- Windows 命令、安装核对、UI、进程与清理事实来自 Windows agent 的脱敏报告；主开发不能从 macOS 独立观察其当前进程和本机文件，保留该证据边界。

| Windows 调用 | Interaction | 主开发平台读取结果 |
|---|---|---|
| PATH / PATHEXT | int_200d4d89f0febb8f31b0b70e725b7822 | operationCount=1，toolNames=[search_capabilities] |
| 绝对 .cmd | int_806e769a3f556e6a5d7fc3cf7d187862 | operationCount=1，toolNames=[search_capabilities] |

## 已关闭的验收项

| 项 | 结论与范围 |
|---|---|
| W1 | Windows 4/4、无 skip；PATH .cmd 和含空格／& 的 shim 实际执行；缺值 --live 退出 2、stdout=0 字节 |
| W2 | 两种调用均 live 16/16、退出 0，平台复核一致；只证明直接工具派发守卫，不涵盖 run_code 内嵌工具或账号授权隔离 |
| W3 | 桌面版浏览器自动打开；用户授权后无需重启列出两个网络，关闭重开刷新正常；成功后等待观察另列 W3-A1 |
| W4-2 基础过程 | 有时间证据的第二轮证明关闭后 CLI 继续、登录期间重开仍连接中、自然退出后恢复登录入口；没有把关闭时刻不明的第一轮当成中途关闭成功 |
| 安装内容 | 报告的安装后／登录后／卸载前发布文件均与候选 52 文件一致；没有源码 lib 替换 |
| 清理 | 报告确认测试宿主退出、测试插件卸载、独立 vault 引用清除、用户登出临时 CLI；五个已选原用户文件哈希不变。这只覆盖已选文件，不能泛化为全目录无变化或原 CLI Token 从未刷新 |

原 R1–R9 沿用相同候选的已有结果，本轮没有重跑。源码、单元测试、平台记录、Windows UI 与用户操作仍是不同证据层级。

## 尚未关闭的异常及未知

| 项 | 已知证据 | 未知／影响 | 建议 |
|---|---|---|---|
| W4-A1 CLI 退出与界面不同步 | 未授权 CLI 约 121.6 秒自然退出 code 2；约 277 秒后，面板采样仍 loading、只有 Close；后来才观察到通用错误与重试 | 不能宣称无限等待，也不能由浏览器关闭的先后关系判定因果。用户在此期间看不到结束、取消或重新登录入口 | 优先定位并修复；不按「W4 已通过」放行 |
| W4-A2 结束后的错误提示 | 自然结束后提示检查 Token／平台地址；没有明确未完成授权或超时说明 | 未取得 CLI 诊断，不能直接把 code 2 定义为设备码过期；可能误导用户检查无关配置 | 获取脱敏的真实错误类别，再决定提示映射；禁止直接展示 CLI 授权输出 |
| W4-3 具体退出诊断 | 两轮约 121 秒、code 2 的自然退出及最终 UI 已实测 | 未区分 Device login timed out、Device code expired 或其他原因 | 部分完成；具体诊断未核实，不能判完整通过 |
| W4-2 后续授权恢复 | 关闭／重开基础过程已测；本轮始终未授权 | 关闭后再授权是否恢复网络列表或重新打开面板未知 | 受影响修复验收时补；若放行 -4，明确接受为未测 |
| W3-A1 成功后的等待观察 | CLI code 0 后有 loading 观察，随后自动列出两个网络 | UI 未连续同步采样，约 96 秒只是观察上界，不能当精确登录耗时或根因证据 | 排查时同步记录；不据此新增延迟数值承诺 |
| 等待阶段无取消 | UI 只有连接中与 Close；AuthCoordinator.beginLogin 未传取消 signal，关闭面板后 CLI 实测继续运行 | Close 不等于取消授权；这是当前行为，不代表后续恢复已验证 | 如需提供取消，定义行为并用真实流程验收；不只改文案就宣称已解决 |

Windows 首轮关闭授权浏览器后才观察到错误只是时序关联；重试轮在授权 Chrome 仍存在的最近一次清单后也观察到错误。这不支持「必须关浏览器才恢复」的归因。W4-close 最终回登录入口也不能推翻 W4-timeout 的长期 loading 记录：它们是不同执行路径。

既有 [deferred 清单](../handoff/2026-10-04-deferred-after-3.md) 继续保留。本轮不会把历史 resource_not_disclosed 孤例、run_code 范围限制、BOM 超时、Token 刷新失败提示等自动标成已解决。原 Windows 报告中的 CLI 浏览器 URL 含 & 风险本轮未触发；探针的 .cmd 引号修复不等于修复 SDK 的浏览器启动。

## 发布取舍（待用户决定）

**建议先修 W4-A1。** 理由是已观察到 CLI 结束数分钟后面板仍不可重试，而非仅缺一条诊断或截图。当前成功登录、最终能恢复和守卫通过不能消除这项影响。

1. **先修复：** 保留 -4 候选作为证据基线。先拿真实脱敏诊断，区分 CLI exit、DSH child.done、Remote 返回和 UI 状态的时间，再按真实失败写回归并修复。包内行为有变化时生成新候选，重新跑受影响的桌面／npm 登录及 W4；若守卫和提示词未变，不盲目重复 R1–R9。新候选不得沿用旧包的验收结论。
2. **接受限制后放行 -4：** 需要用户明确接受 W4-A1／A2、无取消、具体退出诊断和后续授权恢复未核实，以及本次新观察的 W3-A1。将下方拟定文字写入根 CHANGELOG 的 -4 条目后再走合并／main 彩排。根 CHANGELOG 不在这 52 个发布文件中；若同时改包内 README 或代码，则仍需新候选和受影响验收。接受限制不等于 W4 完整通过。

拟加入 CHANGELOG 的文字（当前仅为草稿，尚未写入发布条目）：

> Known limitations observed in Windows panel sign-in: the panel can remain connecting for minutes after the CLI has exited. The waiting view has no cancel action; closing the panel leaves the login CLI running. An unauthorised flow eventually offers retry with a generic connection error, but its exact timeout/expiry diagnostic has not been confirmed. Recovery after closing the panel and then authorising remains unverified. A successful desktop sign-in also showed a delayed UI observation; the exact recovery latency was not measured.

用户本次明确要求「保持不合并、不发布」。异常取舍确认前不执行合并、main 彩排、tag、npm 发布或 latest 变更；不把 W1–W3 通过等同于发布批准。受保护遗留 release/ 分支仍由有权限的维护者处理。

## 若选择先修，Windows 下一次只需补这些证据

- 使用相同候选和隔离 home，不重新执行 W1／W2／R1–R9。分别复现成功授权、一直不授权、关闭后重开并随后授权；每次独立状态且不并发登录。
- 同步记录 CLI／launcher 创建及自然退出、DSH child.done 结算、Remote 返回、面板状态采样。先取得无需改插件的观察点；若必须加临时诊断代码，应作为单独诊断构建并标明，不能冒称固定候选。
- 只保留已核实的错误类别、退出码、PID 与时间；不要输出或保存授权 URL、授权码、Token、模型密钥、CLI stdout/stderr 原文。若真实诊断只能在含授权信息的输出里取得，进程内提取固定类别、丢弃原文。
- 用户执行所有登录与授权操作；确认测试宿主版本、CLI 0.1.5、候选哈希及安装内容。结束按现有独立 profile 清理流程还原。结果提交新报告分支，仍不合并、不发布。

该段是后续诊断准备，不是已派发或已执行的 Windows 任务；用户决定先修后再安排。

## 上游与检查边界

本轮刷新 DSH 默认分支 master：`5badb15009ae1756c3afe0ae0cef1faafc290ccc`，最新可用 tag dsh-v0.2.1-alpha.1；支持／验收仍固定 0.2.0-rc.2。OpenBKN 最新正式 release 仍 v0.1.5，main 为 `ff9b33adf47d29d5e8fc9380e1e4c84c74d6a49a`；与前次 6eaacabf 相比新增 #2017 权限请求、#2015 OTel 日志归档、#2018 溯源摘要与平台 agent MCP 错误处理，相关差异没有修改 SDK 浏览器登录或本轮受管 MCP 目录/schema。

当前本机部署的 agent-retrieval、bkn-backend、sandbox-control-plane 镜像仍 0.1.5。镜像 tag 本身不证明包含 main 的新提交；本轮没有部署更新或升级支持 pin，也没有把新的上游摘要修复当成本机异常已消除。

本轮仅整合原报告和更新仓库文档；未改包内代码、README、依赖或锁文件。验证为报告基线／JSONL／固定 tgz 哈希／平台操作复核、文件一致性、文档链接与 git diff 检查；没有重复跑已通过的完整测试，也没有执行新的登录流程。
