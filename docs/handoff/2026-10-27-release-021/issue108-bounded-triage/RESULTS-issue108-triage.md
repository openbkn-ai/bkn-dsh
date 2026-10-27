# #108 有界 Windows npm 启动分诊（2026-10-27）

kind=bounded-windows-npm-startup-triage；sourceCiRun=40361613728；formalAcceptanceEligible=false。

固定输入：提交 f36103e6af0d3b5ed838696c5efd0fd272c4ec9e（固定 checkout 只读复用，首尾干净）；官方旧 npm Host 0.2.0-rc.2（任务副本，stock MCP 758d8fc4… 收尾复核未变）；任务 Node 24.19.0；候选 0.2.1-rc.3-openbkn.0.2.1（tgz 27ccf15c… 232091B，两案 profile 安装后 82/82 零差异）；old companion 0e06001c…（12/12×2，入口 b3cd7156…）；Zod 4.4.3（安装自带，两案实测）；Cordis 4.0.4/Schemastery 3.18.4（runtime 原版未动）。无 --patch、无手动 MCP mount；无真实平台/CLI/模型/Sandbox/tools-call。fixture：单一 127.0.0.1 synthetic-fixture（baseUrl http://127.0.0.1:60917，pid 24380，03:00:44.682Z 创建，结束已按身份关闭）。

## 两行结果表

| 案例 | 启动次数 | PID / CIM 创建UTC / exe / cwd | 端口 | diag apply | 业务观察器 apply | 组件 active / manager 就绪 | 结果落盘 | 退出/收态 | 结论 |
|---|---|---|---|---|---|---|---|---|---|
| full（完整业务+config+观察器） | 1 | 1668 / **UNKNOWN**（CIM 抓取脚本转义缺陷失败；spawnUtc=03:01:55.751Z 供参考，非实测创建时间）/ node.exe（runtime bin.js，argv=--profile web --host 127.0.0.1 --port 0 --no-open）/ case-full\cwd（diag 实测 cwd=任务 case-full\cwd） | 60954（host.out.log，03:01:57.995Z 观察到） | 03:01:57.176Z（+~1.4s） | 03:01:57.891Z（+~2.1s） | components-active 03:01:57.893Z / manager-configured 03:01:57.992Z（3 组件 state=2） | 03:01:58.003Z（result-writing）→ poll 03:01:58.200Z；result=PASS，pluginVersion=0.2.1-rc.3-openbkn.0.2.1，Reader 内置检查随结果保留 | 身份核对后 child PID kill（exit code 未及观测；端口 60954 随后 0 监听；进程确认消失） | **成功（~2.3s 全链路）** |
| without-business（去业务 bundle/config/观察器，仅同 diag） | 1 | 32872 / 2026-10-27T03:05:12.411Z / node.exe（同 argv）/ case-nobiz\cwd（diag 实测） | 61050（host.out.log 值；**实时就绪时刻 UNKNOWN**——编排器缺陷，见偏差） | **03:05:13.513Z（+1.10s）** | 不适用（按设计移除） | 不适用（预期无业务组件；未以此判失败） | 无（预期） | 编排器 90s 窗口逻辑失效（CIM createdUtc 带尾部 \r → Date.parse NaN → deadline 永假）→ 外层 130s 超时杀编排器、Host 越窗存活；事后按 PID/exe/端口 身份核验时进程已消失（退出时刻/码 UNKNOWN），端口 61050 已释放 | **diag 行成功（+1.10s）；越窗偏差见下** |

## 判读（按 #108 停止条件）

- 两案 diag 行均快速 apply（+1.1s~+1.4s）；full 案业务观察器与三组件、manager、结果在本窗内全部快速完成（spawn→结果 ~2.3 秒，含端口就绪 2.2s）。**本次未复现 >90s 无输出**（full 成功、对照 diag 成功）。按约定：记"本次未复现"，不称已修、不关闭 #108、不迁移 latest、不追加重试。
- 本轮两案总计 2 次 Host spawn（各案 1 次，额度遵守）；观察窗内 full 提前取得结果收态；nobiz 因编排器缺陷越窗（偏差如实记录，Host 最终消失且端口释放，无残留）。

## 两案配置精确差异（同一布局，仅以下不同）

- case-full：profile bundles=[dsh-base, dsh-web-app, **@openbkn/dsh-business-context**]；cordis.patch.yml=[business 行 config（baseUrl/mcpUrl=fixture、cliPath=任务内 never-executed-cli.exe、双 3000ms）, insert(observer-triage 副本), insert(diag)]；DSH_PROOF_* 环境组。
- case-nobiz：bundles=[dsh-base, dsh-web-app]（**移除业务**）；cordis.patch.yml=[insert(diag)] **仅此一行**（无业务 config、无观察器行，无悬空指向）；不设 DSH_PROOF_*。
- 共同：独立 home/profile/cli/cwd/logs（全在新 taskRoot 内，启动前断言）；env 透传 OS 等并删除 BKN_TOKEN/BKN_USER（未打印值）；同一 runtime 只读副本；无 --home 参数。
- 观察器副本 diff（相对冻结探针，仅增 4 处被动时间戳 appendFileSync：apply-enter/components-active/manager-configured/result-writing；注入列表、断言、超时、业务调用零改动；51 行 vs 48 行）。diag 为新极简行（inject=[]，仅记录 UTC/PID/cwd/DSH_HOME/BKN_CONFIG_DIR，无业务服务访问）。

## 写点与落点（关键事实）

- **full 案**：case cwd 与 home 非 node_modules 状态区在启动前后**零新增/零变化**（orchestrator 前后清单比对为空集）——本轮 anonymous-id/credential/workspace 未出现在 cwd（与上轮 run6 交接目录 strays 不同；该差异如实记录，机制仍未定）。
- **nobiz 案**（事后清单，编排器 before-清单随其进程丢失——已在记录中注明）：home\dsh-home 根落有 `.anonymous-user-id`（37B）、`.credentials.yaml`（161B，本地合成 grant，内容不外传）、`storages/workspace.json`（227B）；case cwd 为空。落点=**任务 home 根**（预期正确位置）。writerPid=UNKNOWN（无进程级写入证据）。
- 两案 DSH_HOME/BKN_CONFIG_DIR/cwd 均由 diag 实测回报（值=任务根内路径，无逃逸）；full 的 cwd/home 亦属任务根（orchestrator 断言）。

## 偏差与受阻项（全部如实）

1. **full 案 CIM 身份抓取失败**（编排器 PowerShell 内联转义缺陷）→ createdUtc/exe/cmdline 记 UNKNOWN（spawnUtc 为编排器时刻非实测创建时间）；进程身份以 PID+diag 实测 cwd+端口+argv 交叉锚定。
2. **nobiz 案编排器 90s 窗口失效**（CIM createdUtc 尾部 \r → NaN deadline）→ 观察越窗至外层 130s；Host 退出时刻/码 UNKNOWN；事后身份收态（已消失、端口释放）。窗口内应得事实（diag +1.10s、无业务组件、host 端口 61050）已取得。
3. 顺带收掉 run6 残留 fixture 一个（pid 37868，2026-10-26T23:43:50Z 创建，cmdline=synthetic-fixture——run6 收态时"remaining:1"即它；本轮按身份单独停止，如实补记）。
4. 两案 anonymous-id/credential 落点不同（full 无、nobiz 在 home 根）——无解释，UNKNOWN，不猜测。

## 收态与保全

fixture（24380）已按身份关闭（remaining=0）；任务相关 node 进程 0；两 Host 进程均消失、端口 60954/61050 释放；候选 82/82×2、companion 12/12×2、runtime stock 758d8fc4…、候选 tgz 27ccf15c… 均收尾复核未变；固定 checkout f36103e 干净；旧 run/旧日志未覆盖（本轮记录均在 taskroot-1 新目录）。未重跑 GUI/B1/重定向/全矩阵；未改候选/Host/平台（192.168.50.129 保持 0.2.0）；未构建/推送/CI/发布/迁移标签。

## 产物（仅本机，未推送）

- 报告：taskroot-1 外 `C:\bkn-verify\021-issue108-triage-20261027\results\RESULTS-issue108-triage.md`（本文件）
- 两案记录：case-full\records\{launch,identity,case-result}.json + logs\{triage.jsonl,host.out.log,host.err.log}；case-nobiz\records\{launch,identity,closeout-manual}.json + logs\{…}
- manifest：`results\evidence-manifest-issue108.json`（公开摘要+私有清单哈希）
