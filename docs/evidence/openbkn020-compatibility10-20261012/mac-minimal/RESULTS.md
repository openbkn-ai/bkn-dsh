# -10 Mac 最小变化验收

结论：固定 CI 候选的 npm/web 与 Desktop 展示、CLI 0.2.0 识别、连接/列网和真实诊断导出通过；一次官方 DSH 工具运行时上的真实受管调用与相关受控分支通过。**不宣称完整模型问答、非空回执链、真实大网络/Trace 禁用实测或 B1 修复。Windows 已可并行复测，插件未发布。**

用户于 2026-10-12 明确允许使用另一会话从 SDK 0.2.0 分支构建的包，不等待 npm 发布，并要求只测变化。执行约 2026-10-12 15:21Z–16:02Z（台北跨至 10-13）；最终探针 15:45:50Z–15:45:52Z。范围以最小验收计划为准，不延伸旧候选记录。

## 固定输入与实际环境

- 插件源码 `9a35c0d9d1263b5f39b24d596f07dbcedbf25d04`，CI `38209375894`，tgz `a91adc9e342faa4f763d73487cd56d2f4ead8bb21bf755ca11426f77d90c9bae`，188215 bytes、70 文件；本轮未改包或重出候选。
- SDK：另一会话的 `release/0.2.0` / `c404354793146edab944b7e5a79908bf41ddd591`，tgz SHA `7391c658e831b9f11bc36fd7fcecfa30e41ecc4123a005bfee811e44b60eb43c`、212707 bytes；安装于本轮隔离 prefix，CLI 返回 `0.2.0`。**不是 npm 正式包发布证明**。
- Mac 官方 npm DSH `0.2.0-rc.2`（IAB 浏览器前端）与 `/Applications/DeepSeek Harness.app`。Node `24.19.0`，pnpm `11.7.0`；无宿主源码改动、inspector 或 TLS 绕过。
- 隔离根 `/private/tmp/bkn-compat10-minimal-mac-20261012/`，npm / desktop 分别持有 home、CLI store；探针独立 home/store。后续探针独立设备登录，不改日常 CLI/模型配置。
- 平台经既有 `192.168.50.28` / 本机 ingress 可达；实际 en0 同样为 `192.168.50.28`。后端健康接口为 `0.2.0-release.20261011115044.sha06c5a87`。镜像有本地 EE 构建/调试变体，固定实际 tags/digests 于 `platform-images.json`，不是“全组件 npm/官方发布包”的推断。

## 最小矩阵

| 项 | 实际结果 | 依据/限制 |
|---|---|---|
| M0 身份 | 两形态安装件 70/70 与 CI 清单一致；SDK 固定包/版本匹配 | `baseline.json`、`*-installed-identity.json`、`verify-kit-mac.json`；后者仅是 verifier 的 Mac 执行，Windows 原生执行由其回传 |
| M1 展示/导出 | npm：形态中性“未识别”，macOS；Desktop：桌面版、macOS；DSH/已加载版本无采集时明确解释，磁盘不等于已加载 | 两份诊断截图/本轮实时 UI 读取；两份真实产品下载 JSON，均 7 项 pass。报告是被动采集，有观察时点/间隔，不当作之后的主动健康检查 |
| M2 CLI 0.2.0 | 两形态初始“请选择版本”，明确选择 0.2.0；隔离 CLI 被识别、保存、列出两个网络 | 本轮实时 UI 读取、`cli-ui-observations.transcribed.json`（明示人工转录，非原生快照）。不卸载日常 SDK，不做 npm 尚无版本的自动安装冒充验收 |
| M3 真实受管调用 | start → 实际 schema 选对象、`query_object_instance(limit=1)` → finish；完成后查询拒绝；reader 正常解析 15 对象/1组的普通详情 | `native-runtime.jsonl` / `native-execution.json`；官方 DSH 工具运行时 + 真实 CLI/MCP/reader，Agent/storage 构造外壳，无模型/完整 UI 会话。仅请求 limit=1，不评估业务答案正确性 |
| M3 来源 reader | operations/business-graph 请求及投影成功，**返回空 entries/events** | 立即与后续一次读回均为空，见 `settled-provenance.jsonl`；只证明读边界可用，不证明非空回执/来源图闭环，也不单凭这个结果给插件或平台定责 |
| M4 受控变化 | 导航 201 对象 null shell 保留计数、未制造概念索引；Trace disabled/unavailable 无伪造 IDs、无旧 context、跨网不 dispatch、finish 后关闭 | 与 Windows 同一 handoff 的 `minimal-native.probe.mjs` 作用于固定候选/官方运行时；两分支均显式 pass，**不是修改平台开关的实机结果** |
| M5 B1 | 同一 owner 同进程再同步凭据、开新受管轮次未出现 Public.Unauthorized | 不等于同一完整 Host 在自然过期/更换凭据后恢复，也不覆盖历史 8h / 改地址 / 闲置场景；B1 保持开放 |
| M6 收态 | 选定日常文件 18/18 内容哈希一致；两个 owned Host 树和 npm 18340 端口终态释放 | `protected-state-summary.json`、`owned-process-stops.json`；保护范围明确，不延伸所有文件/环境变量/平台授权状态 |

## 平台契约

实际 `tools/list` 25 项，准备 fixture 26 项，差别是本部署未启用 `execute_skill`，无新增工具；已有路由按 offered tools 保持关闭，不伪造可执行 skill。已独立捕获的 input/output Schema 去掉描述性字段后无结构差异。

`run_code` / `run_shell` 的 inline PTC Schema 在准备期没有独立捕获，本轮真实 Schema 归档于 `live-tools.json`，不能把 fixture 的缺失记为“上游结构变化”。它们没有因此扩大权限。Foundry #2106 仍开放；未构造真实大网络，不能声称已现场验证 nullable Schema 问题或上游已修复。

## 下载原件

| 形态 | reportId | 真正产品保存路径 | 归档副本 |
|---|---|---|---|
| npm/IAB | 35623d5e | `/Users/kalias/Downloads/OpenBKN-diagnostic-20261012T152647561Z-35623d5e.json` | `npm-diagnostic.json` |
| Desktop | 85f719dd | `/Users/kalias/Downloads/OpenBKN-diagnostic-20261012T153203629Z-85f719dd.json` | `desktop-diagnostic.json` |

原件保留。Desktop 使用原生保存窗口，npm 使用产品下载事件；不是 Host API 代替下载。原件/归档/Git 字节对照另行固定在清单，不将截图等同导出。

## 执行偏差（未改插件源码）

1. 首次独立探针从安装 profile 直接导入 lib 缺少宿主 resolver 提供的 peer 包；仅给**探针解包目录**加官方 npm runtime 的 node_modules 链接，未改安装包字节。Windows 交接明确同一步。
2. 早期探针对 MCP `get_kn_detail` 文本做 JSON-only 断言失败；现场确认真实文本是 TOON，`isError=false`，是探针错误。最终详情改用插件自己的 reader 明确请求 `response_format=json`，受管调用仍走原 MCP/DSH。首个受影响 Interaction 后续已为平台终态 abandoned，晚到的 fail 被 terminal_conflict 拒绝；没有覆盖/删除平台记录（`probe-cleanup.json`）。
3. 初始复用原 CLI 凭据的副本；过期刷新收到 invalid_grant / refresh-token reuse，并提示关联 token 已撤销。改为**独立设备授权**后最终探针通过。该副本方法有干扰，不作为 B1 或 token rotation 根因实证。18 个日常文件未改并不证明服务端授权未变化；Windows 明确禁止复制 token/refresh token 到多个 store，日常旧授权链可能需独立重登。
4. 临时探针补写发生一次语法错误，运行前校验后修正；最终提交的同一脚本已完整跑通。DSH CLI 需用允许的 Node `24.19.0`，最初 shell 默认 Node 下 `import.meta.main` 不启动属于执行环境偏差，不作为插件故障。
5. Mac 清理脚本先停止 Desktop，处理 npm 时误要求 argv 包含通过环境变量提供的 home 而中断。修正为 PID/创建时间/exe/实际打开的本轮日志/监听核验后停止 npm；Desktop after 快照在修正后采集并标注时点，不追溯补造即时档案。两个树最终均零残留。

6. 归档 `*-ui.txt` 时 AX 默认返回 diff，其中部分只有“无变化”而非完整树；保留这些原件，不称完整 UI 原生证据。CLI 状态另按本轮工具输出转录并标注；诊断有真实截图及产品导出支撑，不重启 Host 补造历史快照。

## 保持开放与下一步

- Windows 已推固定最小 handoff：`4d66a6bf222180c43b2946d8e0e79523c140f4e5`，可与本轮文档收尾并行。
- npm SDK 0.2.0 发布/自动安装不在此结果内；用户指定源码包验收，不等待发布。
- 本轮没有真实大网络/Trace 开关场景、0.1.5 实机、模型/G6、非空回执链或历史长时 B1 的新通过结论。
- Windows 回传复核后再推进主线 build-only / 包一致性与发布决定；没有 merge main、tag、发布或迁移 dist-tag。DSH、平台问题、英文及其他 P2/P3 不混入 -10。
