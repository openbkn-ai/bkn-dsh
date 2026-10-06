# 统一 -7 候选与本机复验（2026-10-06）

**候选已固定；诊断、URL 配置失败、业务导入隔离及 live guard 复验通过。发布验收未通过：BOM 原题的最终回答多出一行；缺失物料回答另有源表名错误。Windows 对此统一包的受影响复测待执行。** 历史局部包“三题通过”不代表本包的结论。

## 源码、构建和状态

| 项目 | 固定身份 / 本轮结果 |
|---|---|
| Worktree | `bkn-dsh-unified-7`，分支 `release/unified-7-acceptance`；从 main `7553cc13a17e80b87e4d8b2b22381ab8f05bc22d` 建立，保留其他工作区已有修改 |
| 包 | `@openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-7` |
| CI | [37447961098](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37447961098)，main，`release-plugin.yml`，`publish=false`；build/test/pack 成功，npm publish 和 GitHub Release 跳过 |
| CI tgz | SHA-256 `4e4f7c3d44453038b4f2a723ec5334c443565ef0628e1e295bd339eda8f14d86`，166727 bytes，65 文件，16 个 exports/main/types 声明目标全部存在 |
| 与 review 分支比较 | run `37436610287` / source `d36a52a8d4e1b268b16a1975a8de8e47550b2bdf` 的 tgz 与本次 main tgz **逐字节相同**；见 `main-review-artifact-comparison.json` |
| CI 验证 | 插件 313：312 pass / 0 fail / 1 Windows-only skip；repo 60/60；构建、兼容系列和打包审计通过，摘要见 `ci-check-summary.json` |
| 本轮本地工具验证 | Python 8/8（脱敏、BOM 明细解析）；评分器 + guard CLI 6 pass / 0 fail / 1 Windows-only skip；JS 语法和 diff-check 通过 |
| 本轮包内容变更 | 无。只更新测试 helper、核对脚本、证据、交接与累计发布说明；不会把本轮仓库交付 commit 冒充 CI 构建 source commit |

源码/CI/包/安装/真实问答分别绑定：`candidate-identity.json`、`ci-run.json`、`ci-artifacts.json`、`desktop-installed-identity.json` 与 `verdict.json`。版本字符串相同不足以替代 SHA。

## 实机与真实协议验证

官方 macOS Desktop 与 npm DSH 均为 **0.2.0-rc.2**，未修改 runtime、未开启 inspector。Desktop 沿用用户已配置模型的**隔离测试 profile**，先整包 remove 再 install 本次 CI tgz，65/65 文件匹配。沿用 DeepSeek-V41-Flash / High、标准模式、已绑定的 `workspace-supply` / `supply_ontology_hand`。未改 provider/credential 配置；正常 CLI 0.1.5 Token 刷新成功，不宣称自动续期已实现。

| 验证 | 结果 | 证据 / 范围 |
|---|---|---|
| Desktop 面板入口 | pass | 侧栏一个 OpenBKN；面板右上角只有“诊断”；实际原生 UI 操作记录 `desktop-ui-observations.json` |
| Desktop 正常报告与下载 | pass | 报告 `5ff681ab`，7 项 pass；产品导出、保存对话框完成、实际文件解析和哈希，`desktop-normal-report.json`、`desktop-download-identity.json` |
| #62 真实来源图 | pass（同一网络） | 原题真实 Interaction 的物料 object 与生产固定提前期 property 均显示 `supply_ontology_hand`；独立授权业务图包含对应规范 ref_type/ref_id，见 `provenance-platform-references.json`。未取得跨网络实机图，不宣称其通过 |
| npm 非法 URL | pass | `business-entry fail/configuration-invalid`，stage=configuration，`configField=baseUrl`；bootstrap/diagnostics pass，`invalid-url-npm-report.json` |
| npm 合法配置 | pass（组件加载范围） | 三入口加载 pass，`normal-npm-report.json`；该无凭据 probe 未核验 npm 登录/模型/UI，不冒充全功能正常路径 |
| npm 业务坏导入 | pass | 从本 CI 包复制故障变体，只破坏 exports['./business']，`module-resolution-failed`，bootstrap/diagnostics pass；见 `npm-fault-identity.json`、`business-import-npm-report.json` |
| live guard | pass 16/16 | 同一 CI 包 + 官方 npm DSH ToolRuntime；真实已存在的两个网络；`mode=live`；平台操作记录只有允许的 `search_capabilities`。`live-guard.jsonl`，不冒充受限账号或 run_code 内部权限验证 |

npm 三场景为真实官方 Host 的生产 RPC 调用，**没有 browser UI 断言**；Desktop 是产品 UI 与真实下载证据。npm probe 只核验配置/入口，刻意没有可用凭据，不能推导 CLI 登录状态。两种证据口径分开。

实际下载：`/Users/kalias/Downloads/OpenBKN-diagnostic-20261006T102705855Z-5ff681ab.json`，SHA-256 `ffb05841ec95e92b5f6bd03b6b3adb2d04e8aed8089bbf346f4c8e64320f9f8c`。下载完成已在文件系统核实，不能仅以点击导出算完成。

测试准备偏差：一个 shell 的 `node` 实际为不支持当前 npm CLI 的 Node 23.11，曾出现退出 0 却没有生成 profile。没有把它计为安装通过；随后显式使用 `/Users/kalias/.nvm/versions/node/v24.19.0/bin/node`、校验 profile 与65个安装文件后才执行 npm probes。原始准备日志不进入仓库。首次评分器运行缺解析依赖也未计为通过，修正依赖后重跑通过。

## 三个原题复测：严格保留失败

原评测 YAML 未修改，每题新建原生 Desktop 会话、串行运行一次，保持原题、模型、网络和同一 CI 包。完整脱敏答案与工具轨迹见同名 JSON/Markdown；`turn/end` 均为 completed。指标只计已运行项，不把历史其他题填作本轮通过。

| 原题 | 冻结 G6 判定 | 本轮核对 |
|---|---|---|
| `382-000005 的标准交期？` | pass | 自制件、生产固定提前期 1 天、字段和单位、`supply_demo_hand.erp_material` 来源均明确；另说明采购交期不是主口径 |
| `查询 382-000005 的 BOM 清单，每个物料的使用量，以及每个物料的库存情况` | **fail** | 工具完整表313行且与独立 oracle 相同；最终回答实际314行，多出 `(level=3, parent=791-000012, child=165-002371)`，正确行在第4层仍存在。摘要却声称313行，并把 L4 写211（实际212）。`bom-row-verification.json`、`bom-failure-trace.json` |
| `物料 999-999999 的库存和订单情况？` | pass（原冻结规则） | 精确物料查询无结果，没有无关非零业务数字，正常完成；**附加准确性异常**：把源表补写为 `supply_ontology_hand.erp_material`，与平台对象 metadata 的 `supply_demo_hand.erp_material` 不符。该源表名没有可支持的来源 |

本包冻结 G6 **2/3**；其他8项未在此候选重跑，真实受限账号仍不存在，按用户指示 not-run。缺失物料的冻结规则通过不等于整个回答的来源准确性验收通过。`g6-marks.json` / `g6-results.md` / `verdict.json` 按这个口径分开记。

独立 CLI 的前后两次物料/BOM/库存快照逐行一致：313行、272物料、层数9/16/38/212/38，首层库存34/0/0保持。`oracle-before/`、`oracle-after/` 和 `data-stability.json` 只证明这些查询字段未漂移，不证明全平台没有写入。派生CSV仅把换行统一为LF；平台JSON原记录保留，内容核对不依赖CSV列序。

旧核对器只接受表内“层级”列，无法读取本轮按 `### 第 N 层` 分表的交付。已补显式标题解析及两条回归；遇到其他标题清除层级上下文，绝不从 oracle 或父料ID猜层级。修正后捕获上述314行失败；未修改答案、oracle或原G6标准，也未重试到绿色后丢弃失败。

### 问题归属与下一步

工具端表为313行、与独立 oracle 完全一致，错误首次出现在 assistant 最终文本。证据支持归入**插件托管会话的回答交付质量 / 模型组织结果**，不支持归因于平台 BOM 数据错误。源表名异常同属来源转述，不能靠增加超时时间解决。

下一轮应让完整明细和计数直接采用工具返回的结构化结果或确定性表格，校验层级、父子料、重复次数、单耗、库存与单位后再交付；不能仅去重子料（同一物料可在不同父件/路径合法重复），也不能只再加一句“请检查”。来源只取平台明确披露的名称，未查询到物理资源名时只写已知对象类。若需要新增结果导出，须与诊断报告分开，诊断继续禁止业务载荷。具体失败和验收条件见 `ANSWER-QUALITY-HANDOFF.md`。

## Windows 状态与对外 issue

已导入 Windows commit `54f6669ed73284a7818acad23a3985a04157c49d` 下的完整脱敏结果；只复制该证据目录，不合并其旧源码分支。它证明旧 -6 两形态核心诊断链路和15份产品 JSON；认证依赖、真实 G6/live guard仍 not-run，部分降级态只有UI记录。非法 URL 是两形态实证缺陷，当前源码已修，待本 CI 包 Windows 复测。

prepare/run-case/cleanup 的 Windows 实测修正原样收进 `scripts/windows-verification/` 及新 kit：BOM-less UTF-8、desktop预初始化、PID创建时间和当前端口归属核验；新版 verifier 的身份常量需 Windows 先解析/冒烟。本轮无需 -3/-4/-5/-6 就地升级矩阵，采用卸载后全新安装；旧升级记录仅保留历史。

| Issue | 归属 | 本轮状态 |
|---|---|---|
| [#62](https://github.com/openbkn-ai/bkn-dsh/issues/62) | 插件来源投影 | 代码在main；固定CI上Mac两个真实元素通过；Windows真实来源图无凭据时未测。issue仍OPEN |
| [#63](https://github.com/openbkn-ai/bkn-dsh/issues/63) | 插件未知错误指引 | 代码在main；npm坏导入报告通过；Windows新包UI复测待执行。issue仍OPEN |
| [平台 #2004](https://github.com/openbkn-ai/bkn-foundry/issues/2004) | 深层函数/网关时限 | OPEN；20秒配置变大不能自动修复网关时限，不用它解释所有超时 |
| [平台 #2005](https://github.com/openbkn-ai/bkn-foundry/issues/2005) | 操作记录摘要/分页 | OPEN；插件64MB读取上限仍存在 |
| [平台 #2006](https://github.com/openbkn-ai/bkn-foundry/issues/2006) | run_code内部作用域/只读限制 | OPEN；本轮guard16/16只证明插件入口边界 |
| [平台 #2011](https://github.com/openbkn-ai/bkn-foundry/issues/2011) | 内部操作pending | OPEN；没有在本轮部署修复 |
| [平台 #2029](https://github.com/openbkn-ai/bkn-foundry/issues/2029) | 大结果落库失败 | OPEN；BOM深库存仍超时，正常fallback不证明已修 |

Windows没有测试凭据、设置向导反复出现和历史故障用户的启动根因均不自动算插件缺陷；原故障机仍须安装此类诊断候选、经产品导出报告才能进一步定位。

## 收尾与发布边界

本轮只提交/推送交接、候选及证据。未 tag、未发布npm、未移动dist-tag、未部署平台修改。模型私有 profile 和原始日志不进入交付；仅清理本轮进程、端口与自建临时目录/原始日志；已核验 PID/启动时间/exe 后停止本轮 Desktop（原生退出快捷键未退出，随后 SIGTERM），npm probe 端口18797无监听。用户已配置的隔离模型 profile 和三个复测会话保留，65个安装文件仍匹配本CI包；见 `cleanup.json`。

后续顺序：Windows可先跑本固定包的无需登录受影响矩阵；回答质量缺陷修复后，如任何包文件变化，重新生成同一计划版本的新CI身份，并重跑三题和受影响Windows项。所有异常处理及用户发版决定完成后才进入tag/publish。不能以本报告声明完整 DIAG-01或完整发布验收完成。
