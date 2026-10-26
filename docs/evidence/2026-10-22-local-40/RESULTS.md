# 第40轮：profile 闭包修复、本地 -30 与 Windows 新交接准备

本轮已完成 Schemastery 依赖/实际 profile 校验覆盖、英文标签间距及 Windows tar/持久日志启动器的本地开发。**没有推送、运行 CI、发布、合并或替换正式 0.2.0。** 新 Windows 材料只在本机，没有新远端交接提交。完整验收合同仍未通过。

## 固定身份

- 分支 feat/021-localization-login，HEAD `933b0ab251c75461ece1ada6145a9487e7eb04d1` 加未提交修改；index 保留。源码基点不能单独重建本地包。
- 候选 `0.2.0-rc.2-openbkn.0.2.0-30`，231075 字节、82 文件；SHA256 `6d95ff7517dbe409875fd398784fe01049ba26d2b97c43fad65c817d3ea18ee9`。localOnly=true、ciRun=null、formalAcceptanceEligible=false。
- 相对 -29 只有 package.json 与 lib/client.js 改变；80 文件相同，Host/Remote 字节相同。历史 -28 取消、-29 长时 B1 证据保留原包身份，不伪报在 -30 全部重跑。
- 官方 DSH 固定旧 639ed015 / 0.2.0-rc.2、新 687f282e / 0.2.1-rc.2；生成器仍旧基线。系统测试 Node 24.19.0，真实官方 Desktop 内置 Node 24.18.1 单独记录，没有替换。

## 原因与修复

1. -29 与 Windows -27 一样把 Schemastery 声明为普通依赖 ^3.18.4。旧 npm 实际官方解析器复现 Host 3.18.4 / profile 3.18.5，新版同为 3.18.5 却是两个物理包。Cordis 已共用 Host。新校验器在旧实际 profile 上先失败，原件保留。
2. 官方 profile 解析器优先使用 profile 中实际存在的包；profile 的 pnpm 配置 autoInstallPeers=false。改为 peer `3.18.4 || 3.18.5`，开发依赖分别固定源码基线版本，使缺失 peer 回到 Host 提供的实例；没有手工替换 Host 依赖或放宽同物理包门槛。
3. 旧 kit 仅检查 runtime 根图，未遍历实际插件 profile。新 profile-closure 检查根与真实 profile，使用官方 createRuntimeResolution / PluginPackages，比较 Cordis/Schemastery realpath、DSH 精确版本、插件 Zod 4.4.3。仅根检查明确输出 installation-only / profileCoverage=not-run。实际 profile 还需候选 82 文件与版本匹配；整个交接目录也拒绝额外或缺失文件。
4. 初次 Desktop 校验发现官方包有 Host Zod 4.6.5；把 npm 测试集合的全局 4.4.3 强加给官方包属于校验口径错误。现对官方 Host 按它自己的声明用 semver 校验并披露版本，插件仍严格 4.4.3；专门回归防止两者混用。
5. 英文 Report/Created/Mode 与平台 URL 直接拼接值，两个实际渲染文本回归在修复前失败。加入显式空格，不改导出事实、业务输出或刷新按钮生命周期。
6. Windows tar 明确选 SystemRoot/System32/tar.exe；缺失时拒绝回退 Git GNU tar，参数不经过 shell。Desktop 启动器使用 stdout/stderr 文件重定向、独立 DSH_HOME/user-data-dir、owned 身份及监听记录；支持仅初始化阶段，并与实际 profile 验证阶段区分。没有修改官方 NsisUpdater；Windows 原生关闭 shell/重连后的持久性仍待验。

## 验证层次

| 层次 | 本轮结果 | 边界 |
|---|---|---|
| 旧/新源码依赖基线 | 各 614 项：613 pass、1 Windows-only skip；各类型检查 pass | 不是 Windows 或完整 Host 验收 |
| 仓库/兼容/运行时脚本 | 70 pass；82 文件包审计 pass | 新 tar 选择和 profile/Zod 范围有回归；没有 Windows PowerShell 执行环境 |
| 同 tgz 双官方 npm 集合 | 每 Host 6 组受控检查 pass | 平台/模型替身，非实平台 G6 |
| 四个实际安装 profile | 每个 82 文件完全相同；官方解析器和 Node 闭包均 pass | 诊断未采集的加载版本仍保持未知 |
| 四个真实运行 Host | 只读观察行在实际后端确认插件 -30，旧共用 Cordis 4.0.4 / Schemastery 3.18.4，新共用 4.0.5 / 3.18.5 | 观察器仅在克隆的任务 patch，未改官方 Host/产品包，现已移除 |
| 四组合原位升级 | 官方 CLI -29 → -30；已有私有 Schema 3.18.5 正常清理，配置 patch 与数据标记 SHA 不变 | 使用本轮独立已初始化 profile；不触碰旧验收 home 或日常安装 |
| 实平台普通查询短 B1 | 四 Host 同 PID 的重载前/后各一次，共 8 个；另便携 Node 夹具 1 个；9 个实际 Interaction 均 completed，唯一 operation 为 query_object_instance/completed，总计数 40 | 无真实模型、无 Sandbox；没有把 -29 四小时证据改记成 -30 长时通过 |
| 本机 UI | 四组合英文诊断/登录 URL 间距、刷新焦点；两 Desktop 800×600 和 Escape；旧 Desktop zh→en；新 npm 实际 JSON 文件读回 | 未重跑全部 zh/en/目录/超时/原生溯源取消合同；原身份历史结果保留 |
| 新 kit | 四安装 profile 用同一新 verifier 全部通过；23 文件完整性；带空格目录搬运 pass；额外文件负例被拒绝；公开文本秘密模式扫描 0 命中 | SDK/候选二进制用固定摘要与逐文件身份校验，不把文本扫描写成完整秘密审计 |

实际 profile 已使用官方 CLI 安装并在 Host 内运行，不能仅凭 peer 元数据推断。本轮早期 bare-specifier Node hook 未覆盖官方拦截器供应的 profile peer，不能从缺失日志推断 ESM 已观察或失败；最终闭包证据来自官方解析 API、插件 parent 的 Node 解析、实际运行观察以及真实管理工具调用。该 hook 局限单独保留，不把它当作全面 ESM 跟踪。

## 新 Windows 材料

目录 [本地 -30 Windows 交接](../../handoff/2026-10-22-021-local-30-windows/HANDOFF.md)，含同一 tgz/82 文件、正式 CLI 0.2.0、公开 CA、双 Host pin、模板、profile 校验器、系统 tar、owned 启停和持久日志、可搬运的 B1 start/query/finish 协议夹具及结果模板。

- KIT-FILES SHA256 `ae1820585aa2f896c1a610f014274ee80972e78bfa46162f3da27d0c96ce436d`，覆盖 23 文件。
- ZIP `release/local-40/openbkn-021-local30-windows-handoff.zip`，494404 字节，SHA256 `2dc2892fc546cac30e70ce6233b2e11023dbdddb91500454720933e42373d774`。
- Windows A/C 需从闭包重新跑所有可测项；B/D 也需覆盖闭包、英文间距及 -28 取消/-29 焦点变化。便携 B1 夹具在本机新 npm 上真实调用/平台读回通过，Windows 原生为 not-run。
- Windows 唯一取件渠道仍是 Git；新交接尚未推送，不能让 Windows 从 fd87974 取得 -30。旧交接 fd87974、结果 fb77c07 的远端 ref 复核未变。没有请求或使用新的交接推送授权。

## 平台、上游与收态

正式 0.2.0 保持原样，两个安全候选未部署。12 表 78635 行及 10 项选定业务配置与原基线一致；两个相关 Deployment 完整 spec/UID/generation、正式源文件、Sandbox 聚合 670/395/8/65514 均未变。没有新增 Sandbox/model G6 执行。个人 DSH 五文件、原验收 home、用户已有修改保留；本轮克隆 patch 恢复、观察器/协议 provider 移除，原生主进程、四后端、两个夹具退出，端口释放，新 Session/Interaction 和失败原件保留。正常浏览器登录更新的 CLI 凭据没有回滚为过期值。

DSH 主线/最新预发布仍 687f282e / dsh-v0.2.1-rc.2。Foundry 正式 release 仍 v0.2.0；本轮最后主线核对到 1635c246。相对既有 6b80afb，新增 Cypher explain、Vega 大整数、对象指标删除、BKN 3.0 capabilities 设计、bkn-agent 内置 graph_explorer 工具及 trace 汇总优化。已读变更的 API/权限/工具和 summary 核心差异：内置工具明确独立于 MCP，未自动加入插件 managed 集合；trace 优化未改变本轮标准记录调用端点。上述未发布主线代码未进入当前固定平台，未来支持新发布时仍须重核合同，不能据此宣称未来平台兼容。

只读观察到另一条远端发布 workflow：39720608436，actor kalias、push 事件、tag 分支 v0.2.0-rc.2-openbkn.0.2.0-11、head a767c6b3，创建于本轮开始前 2026-10-22 04:07:36 UTC，结论 success。本轮没有触发或采用该产物；与本会话原 -12 CI 候选、本地 -30 分开。未来合流前需评审其 #102 与本分支重叠的语言/UI 文件，不自动拉入或降版本。

## 保留的自动化异常

- 初始探针误用 Context.stop、首次测试 cwd 未能解析 tsx、空 Desktop 未初始化的升级探针，均保留失败后按官方 fiber/包 cwd/已初始化克隆修正；不把这些设置错误当产品缺陷。
- 只读观察行最初未用 patch insert，未挂载；使用官方 patch insert 和公开配置重载后在真实 PID 中采集，业务基线在此之后建立。
- 新 npm 下载事件等待超时并重置 UI 控制；实际文件 `8fc91a11` 已下载，schemaVersion=1 且报告身份匹配。未把事件等待写成成功，也未覆盖原异常。
- 首次恢复保护检查识别到本轮旧 Desktop 的 zh→en 偏好改变并停止；确认是已记录的验收操作后恢复原 patch，再核对四份完全一致。测试进程在此前已经按身份结束，没有停止个人进程。

剩余门槛见 [BLOCKERS.md](BLOCKERS.md)。公开证据仅为脱敏事实/摘要；原始启动、登录、工具过程、配置备份在本机 release/local-40 私有目录。
