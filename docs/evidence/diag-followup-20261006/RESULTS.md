# 插件 Issue 修复与三项独立测试（2026-10-06）

本轮先在固定旧 CI `-6` 上保留真实基线，再验收 `-7` 修复候选。Windows 与发布验收单列；不改变原 G6 `7/10`、三个失败及一项真实受限账号未测的结论。

## 身份

| 用途 | 源码 / CI | 包身份 |
|---|---|---|
| 调查基线 `-6` | `144afa503c7d4746cbef01f74eaceff293b88cb5` / `37337765993` | `ffcd77722e83a003fe90e0dda296a3a49c3f2ba67bddda9095575dabd896ef43`，65 文件 |
| 修复候选 `-7` | `e972d319f19e2094740ac12da45684e3ba890e37` / [37407894581](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37407894581)，`publish=false`，成功 | `44ca22708d243c5825774b7385de3f8699a51cad04d36477d8755201cf9af424`，163,496 字节，65 文件 |

官方 macOS Desktop `0.2.0-rc.2`，未修改运行时、未开启 inspector；CLI 为独立安装的 `0.1.5`。模型沿用用户已配置的隔离 Desktop profile：DeepSeek-V41-Flash / High，标准模式，`supply_ontology_hand`。模型 Key、CLI Token、完整 profile 与 raw 日志不进入交付物。

## 插件 #62 / #63

- [#62](https://github.com/openbkn-ai/bkn-dsh/issues/62)：真实 Q01-1 业务图有 31 个正式元素，却显示来源“未定位”；同一授权平台业务图返回 33 条正式引用，含 `object:<kn_id>:<object_type_id>` 等规范结构。修复在元素上保留引用披露的来源网络；一个 Operation 引用多个网络时，元素分别展示，Operation 不选取第一个冒充共同来源。未知/不合法引用不猜测当前绑定网络。
- [#63](https://github.com/openbkn-ai/bkn-dsh/issues/63)：真实 Desktop 的 S2 故障变体显示“检查 Token 和平台地址”，同时诊断明确报告 `business-entry/module-resolution-failed`。修复未知连接/RPC 错误的默认提示，引导右上角“诊断”与导出报告；已知 CLI、登录与平台错误保持原有具体提示。
- 新回归测试修复前 3 fail / 1 pass，修复后相关 28 项全 pass；见 `regression-before.txt`。全套插件 308 项（307 pass / 0 fail / 1 Windows-only skip）；仓库 72 项全 pass（含旧兼容层）；typecheck、package:check、diff-check、pack 通过。初次仓库检查发现缺少 `-7` CHANGELOG，补齐后重跑通过。交付 diff-check 发现 AX/测试文本行尾空白，仅归一化空白后复核；逐文件前后 SHA 见 `text-normalization.json`，产品 JSON/截图/包字节未变。
- CI 插件同为 308 项（307 pass / 1 skip），当前兼容层及仓库 57/57。下载的 CI tgz 与本地 pack 压缩字节不同，但 65 个文件内容全部一致；验收只安装下载的 CI 包，不把本地包当 CI 交付物。
- **#62 实机通过**：新 CI 包读取同一个真实 Interaction `int_a431e50d2e7b4f82c04ac2d64b14da6e`，分别选择“库存”和“物料”，来源均显示 `supply_ontology_hand`；31 个正式元素保持。真实混合网络 Operation 未取得，混合/未知引用仅有开发回归测试覆盖。
- **#63 实机通过**：新 CI 包的 S2 变体只改 `./business` 对应的一个文件（65 文件清单不变）。面板显示“当前原因尚未确定”并引导诊断；独立诊断为 `business-entry fail/module-resolution-failed`，bootstrap/diagnostics pass。原候选复装后 business-entry 回到 pass、旧模块失败消失；该空 CLI store 的 `not-logged-in` 为预期登录前状态。
- 正常新 CI 包实际目录 2 个网络、诊断 7 项全 pass。正常与 S2 报告均通过产品按钮和原生 Save 对话框真正保存至 Downloads，身份/路径/SHA 见 `ci7-normal-download.json`、`ci7-s2-download.json`。S2 变体不是正式候选；其基包、修改文件及前后哈希见 `ci7-s2-variant.json`。

## U01：官方 Desktop 启动

固定旧 `-6` 上，空 profile、首次安装、同包重启、卸载后重装各 3 次，**12/12 进入主界面**；后两类的 6 次还打开通用设置并读取设置与版本。未复现历史 `settings/describe` / `gateway/definition-unavailable` 异常，根因仍未知。受控业务坏导入另列，不能混入随机启动故障。

首次准备一个尚未由官方 Desktop 初始化的 profile 时，直接 CLI install 返回 1；改用前两次空启动已由官方 App 初始化的测试 profile 后继续。这是测试准备顺序偏差，不计作 Host 启动失败。启动/观察时间戳包含操作调度，不是启动性能测量。逐次结果见 `u01-results.json`。

## U02：真实过期认证恢复

CLI 实际报告 `hasToken=true, expired=true`。同一官方 Desktop 进程的面板要求登录，诊断为 `not-logged-in`。正常 CLI `auth token` 续期退出 0、约 391 ms，随后实际状态 `expired=false`；只保存退出码、布尔状态，令牌输出不落盘。沿用现有 CLI 作为续期权威，没有复制/撤销授权 grant。

同进程、同绑定会话重新打开面板后目录恢复（2 个网络），诊断 `login-state pass`、`recovered=true`、`lastFailureCode=not-logged-in`，Context Loader 与目录均 pass，随后真实模型调用成功。该结果证明手动 CLI 续期后的恢复；**未实现或验证自动续期**。源码现有 `expired=true` 分支仍在 `auth token` 之前拒绝。真实不可续期会话尚未取得，不冒充已测；平台不匹配仍仅有既有开发测试覆盖。

## Q01：不存在物料的回答质量

沿用冻结的 `docs/eval/supply-ontology.yaml` 的 missing-object 原问题和规则：明确无数据，且不给出任何非零业务数值；命中 0 行的证明除外。完成 3 个新会话、1 个有前文的会话及 1 个重启续接会话。每轮独立 CLI 对照物料、库存和销售订单目标条件，实际总数与返回行数均为 0；平台 Operation 中每轮均有 `query_object_instance`。**原规则下 0/5 通过**，逐轮原回答、Interaction/工具事实与独立对照全部保留，见 `q01-results.json`。

首轮已失败：目标查询独立对照为 0，模型回答明确“不存在”，却附带无关全表 `3497 / 19724 / 1972` 统计。第二轮同样附带其他物料的库存 `170 / 937` 与全表 `3497`，按原规则失败；不把这些数值都称作平台错误或编造，不调整标准将失败翻为通过。

| 轮次 | 会话条件 | 新回答中附带的非零业务数据 | 原规则 |
|---|---|---|---|
| Q01-1 | 新会话 | 全表 3497 / 19724 / 1972 | fail |
| Q01-2 | 新会话 | 其他物料库存 170 / 937、全表 3497 | fail |
| Q01-3 | 新会话 | 全表 3497 | fail |
| Q01-4 | 既有销售订单前文 | 其他编码匹配销售订单 80 | fail |
| Q01-5 | 重启后续接 Q01-3 | 全表 3497 | fail |

这一现象归入回答质量：目标取数正常，却额外取数/陈述其他业务数据。不据此指责平台目标查询返回错误，也不把五次样本当统计可靠性证明。本轮两项插件修复没有改变模型回答政策；后续若修复此项，应独立定义目标缺失时的回答约束并按原规则复测。

## 保持开放

Windows 原生 pwsh / W0–W12；历史 Desktop 偶发启动异常根因；自动续期的产品决策与真实不可续期场景；原 G6 其他失败、受限账号未测；平台 #2004/#2011 与样例 #63。未发布 npm、未打 tag、未改 dist-tag、未合并分支。

所有本轮官方 Desktop 进程均正常退出，已核对无本轮 PID/官方 App 残留；用户配置过模型的私密隔离 profile 保留。清理记录见 `cleanup.json`。新 Windows 交接包含固定 CI `-7` 与 `-4/-5/-6` 升级基包，原 `-6` 交付保留为历史。
