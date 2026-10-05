# D0 S2 执行结果

## 结论

- D0 S2：**pass**（macOS 官方 npm DSH 0.2.0-rc.2、未修改运行时、未开 inspector；business 受控坏导入下面板可用并报告 `module-resolution-failed`）
- S4 诊断自身导入失败时 UI 降级：**pass**（business 面板正常，诊断入口明确降级，无伪造报告）
- 入口/升级/卸载受影响回归：**pass**（U1：-5 两 row→三 row、-4→三 row、重复安装幂等、canary 配置保留；U2：整包 remove 后无本包 UI/无孤立 bootstrap、用户 patch 保留）
- 完整 DIAG-01 / 发布授权：保持开放
- 实际采用的入口方案与相对 handoff 的偏差：采用三入口（bootstrap=包根 `src/index.ts`、business=`src/business.ts`、diagnostics=`src/diagnostics.ts`）。**与 handoff 推荐文件名的偏差**：handoff 建议 `index: src/bootstrap.ts`、`business: src/index.ts`；实测发现 typert 分析器把子路径 exports 映射到同名源文件（`./business` 必须对应 `src/business.ts`，包根必须对应 `src/index.ts`），否则 `TypertAnalysisError: export ./business resolves to missing source`。另将 5 个 Remote 边界类型改为仅从 `./types` 面 导出（typert 归属规则要求第一个 non-root 面，否则生成的 remote-client 声明引用 `./business` 会让 client 项目把全部业务源拉入编译而 TS6307）。

## 源码与候选身份

| 项目 | 结果 |
|---|---|
| 开工日期 / OS | 2026-10-05 晚 / macOS darwin arm64 |
| Git root / 分支 / 开工 HEAD / dirty | `bkn-dsh-diag-s2`（新 worktree）/ `fix/diagnostics-d0-s2` / 开工 `dcd4064` / clean |
| 原仓库及既有 DSH 构建目录修改是否保留 | `bkn-dsh`（cc97d88，用户修改）与 `bkn-dsh-diag-work/release/deepseek-harness`（dirty）均未触碰 |
| 当前 DSH/OpenBKN 上游核对 | DSH pin 不变（dsh-v0.2.0-rc.2 @ 639ed015，clone 后校验 PIN-OK）；bkn-dsh origin/main 仍为 a134f5d（本轮未 fetch 到新提交） |
| 最终源码 commit / 最终文档 HEAD | **终版：`c193e0a`（types 修复+迁移文档；tgz `14f6772b` 由它构建）**；其后仅审计/测试加固与文档提交（不改变包内容，重 pack SHA 不变）。首版历史：`3c4fa66`（tgz `2abdb3e6`）→ `69dbd18`（文档） |
| 新 package version | `0.2.0-rc.2-openbkn.0.2.0-6`（npm 上 -5/-6 均未占用） |
| 本报告审核终版 tgz 路径 / SHA-256 / bytes / 文件数 | `release/diag-s2-candidate/openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-6.tgz` / `14f6772b97b0a15d0e9162dc993680e42db62d2e868f28f129f43c3aa4085e10` / 162282 bytes / 64 文件；首版 `2abdb3e6…` / 161682 bytes 为下方首轮矩阵历史基包 |
| 全部 exports/main/types 校验 / hash chunk 可达性 | exports：`.`→bootstrap、`./business`、`./diagnostics`、`./types`、`./client`、`./typert`、`./remote`、`./package.json` 全部在 tgz 内；lib/*.js 全集入 files；导入图脚本验证 bootstrap 可达={index.js}、business/diagnostics 互不可达、共享 observer chunk 双向可达 |
| 三 Loader row 及两 Remote namespace | `--dump-config` 显示三 row 各一条（bootstrap/business/diagnostics）；typert 重新生成，`openbknBusinessContext` 与 `openbknDiagnostics` 两 namespace 均在 lib/typert.host.js 与 remote-client.js |
| 实际 Host 版本/形态/Node / profile / 未开 inspector | 官方 npm `@deepseek-ai/dsh@0.2.0-rc.2`（mktemp 独立安装）/ web profile / Node v24.19.0 / 全程无 `--inspect` |
| 实际安装版本与文件摘要核对 | 每case独立 home；S6 重装后核对磁盘 `lib/diagnostics.js` SHA 前 16 位 `c42b87f3549ab248` 与候选一致 |
| build-only CI runId/runUrl/artifactId | null（未授权、未执行） |

## 验证结果

| 检查 | 命令或动作 | exit / 结果 | 证据路径 | 证据级别 |
|---|---|---|---|---|
| typecheck | `pnpm run typecheck` | 0 | 本地终端 | local |
| plugin tests | `pnpm --filter @openbkn/dsh-business-context test` | 0（300 tests / 299 pass / 1 skip symlink） | 本地终端 | local |
| repo suites | `node --test compat/... tests/... runtime/...` | 0（57/57） | 本地终端 | local |
| package:check | `pnpm run package:check` | 0（64 文件，含 lib/business.js） | 本地终端 | local |
| diff-check | `git diff --check` | 0 | 本地终端 | local |
| pack / artifact audit | `pnpm --filter ... pack --pack-destination release/diag-s2-candidate` | 0 | tgz SHA 见上 | local |
| 真实导入图隔离测试 | tgz 解包后静态导入图遍历 + 包内运行时 import 三入口 | 全部断言通过（bootstrap 零相对导入；business/diagnostics 互不可达；身份/Config/Service 导出正确） | 本轮终端输出 | local/controlled |

## 实机 case（全部 real-host；S2/S3/S4/S5 为 real-host controlled-fault）

基包 SHA `2abdb3e6…`（64 文件）。变体注入方法：解包 tgz → 目标文件首行加 `import './D0_S2_CANARY_20261005.js';`（S2/S4）、apply 内 marker 后插受控 throw（S3）、包内 cordis.patch.yml 的 business row 加 `inject: D0_S2_MISSING_SERVICE_20261005: true`（S5）。

| Case | 结果 | 变体 SHA | UI/报告证据 | 异常和处理 |
|---|---|---|---|---|
| S0 | pass | 基包 | 三 row 各一条全 pass；业务/诊断按钮各恰 1 个 | 无 |
| S1 | pass | 基包 | business-entry fail/configuration-invalid，configField=baseUrl | 无 |
| S2 | pass | `9d27591d…` | Host 报 business failed to import（仅 warning）；面板可开；business-entry fail/**module-resolution-failed** | 无 |
| S3 | pass | `41e03e25…` | business-entry fail/initialization-failed（未误归 module-resolution） | 无 |
| S4 | pass | `92dbf390…` | business 面板正常（登录引导）；诊断入口在、明确"诊断服务不可用"降级、可重试 | 无 |
| S5 | pass | `424428fb…` | business-entry 证据不足/component-waiting-services（未误报 loaded） | 无 |
| S6 | pass | 重装基包 | 三 row 全 pass，无旧失败残留 | 无 |
| U1 | pass | -5→-6、-4→-6、-6 双装 | 两 row→恰好三 row，无重复；canary baseUrl 保留在 business row；UI 按钮无重复 | 无 |
| U2 | pass | — | `dsh plugin --profile web remove` 后 rows=0、bundles 不含本包、UI 无任何 OpenBKN 按钮（无孤立 bootstrap）；用户 patch 保留 | 无 |

## 兼容性与变体

- 根 API 调用者清单与迁移：`tests/probes/guard-runtime.probe.mjs`、`tests/probes/dsh-event-model.probe.mjs`（均改为 manifest 解析 `./business` / `lib/business.js`）；`scripts/package-bundle.mjs` required 集加 `lib/business.js`；`scripts/windows-verification/run-case.ps1` 按 manifest exports 解析 W3/W4/W10 目标（W3/W4→business，W10→diagnostics，canary `D0_S2_CANARY_20261005`）。**外部兼容影响（breaking）**：包根不再导出业务值 API——业务值从 `@openbkn/dsh-business-context/business` 导入；5 个边界类型从 `./types` 导入。READMEs 已写明。
- ID-only / name-qualified 配置迁移：user patch 按 id `openbkn-business-context` 匹配的 config 在三 row 下继续生效（U1 canary 证实）；旧 `- id: openbkn-business-context, name: '@openbkn/dsh-business-context'` 的 name-qualified override 属断言语义，包根 name 未变（仍指向本包），business row 的 name 变为子路径——**name-qualified 且写旧裸包名的 override 不再匹配 business row**，此类写法在既有文档中未出现（README 示例均为 id-only），已在迁移说明中记录。
- 故障变体清单：见上表（基包/变体 SHA 均记录；每个变体只改一个文件，修改前后文件 SHA 未逐项记录——变体由基包单文件机械插入生成，生成命令与插入内容如上）。
- W3/W4/W10 路径解析更新：已改（manifest 解析）；**原生 PowerShell 未执行**（本机无 pwsh，静态/人工核对）。
- 脱敏 canary：S2/S4/S5 注入 `D0_S2_CANARY_20261005` / `D0_S2_MISSING_SERVICE_20261005`，全部实机报告与 UI 文本中未出现该原文（报告仅含分类 code）；下载完成未验证（沙箱浏览器限制，保持开放）。

## 收尾和开放项

- 本地提交：`44d5bcd`（三入口实现+隔离验证+S0/S2/S4）、`3c4fa66`（-6 元数据与工具迁移）+ 本文档提交。最终候选 `release/diag-s2-candidate/`（tgz+逐文件清单）；manifest `release/candidate/candidate-manifest.json`；D0 证据更新 `docs/evidence/diagnostics-d0.md`（本次提交）。
- 已停止本任务全部 web 进程（各 case pid 文件对应进程）；受控变体保留在 /tmp/s2v6 与测试 root `/tmp/openbkn-diag-s2.*`（仅本任务创建）。
- 无关仓库 dirty：`bkn-dsh`、`bkn-dsh-diag-work`（含其 release/deepseek-harness）状态未动；原 `-5` 基包 `6d11f803…` 未修改。
- 未完成实机：macOS 桌面版形态、Windows（W0–W12；脚本已按新入口迁移但未原生试跑）、真实下载完成、CLI 0.1.5 配对、真实平台下的业务/目录成功路径（本轮 S 系列用 .invalid 地址，认证/网络项按 ACCEPTANCE 属未测而非失败）、CI build-only 彩排、G6/live guard、主动复测。
- 需要用户决定：推送分支与 CI 彩排授权；Windows 验收排期；根 API breaking 变更的对外公告口径；宿主侧"client bundle 供给绑定单 row"的接口建议是否上游（本方案已在插件侧绕开，不再阻塞）。
- 远端写入/发布：无（未推送、未 CI、未 tag、未发布）。

## 交接审核轮（2026-10-05 深夜）

复核对首版 -6 候选（`2abdb3e6…`）提出 2×P1 + 1×P2，全部确认并修复，重出候选：

| 问题 | 修复 | 复验 |
|---|---|---|
| P1 顶层 `types` 指向不存在的 `lib/types/bootstrap.d.ts`（CI 产物检查 exit 1） | 对齐为 `lib/types/index.d.ts`；`package-bundle.mjs` 新增 `declaredTargets` 审计（exports 全部条件 + main + types 逐项必须在打包清单内）；bundle-contract 增契约测试 | 坏指针 oracle（临时指回 bootstrap.d.ts → 审计 exit 1 抛"declares … not contain"）；301 测试全绿（300 pass） |
| P1 旧 name-qualified override 升级后失效（宿主 name 断言语义） | 双语 README 迁移说明（删 name 行或改 `'@openbkn/dsh-business-context/business'`）；根 README 指引 | 实测 U1c 三段：-5 下生效 → -6 下旧断言被跳过（复现失效）→ 迁移后（两种写法）配置恢复、canary baseUrl 在业务面板可见 |
| P2 manifest faultVariants 仍写 W3 破坏 lib/index.js | 更新为按 exports 解析 `./business`/`./diagnostics`，并注明 lib/index.js 现为 bootstrap（破坏它=整包故障） | 人工核对与脚本一致 |

重出候选：源码 `c193e0a`（本轮修复提交），tgz SHA `14f6772b…`（64 文件；与首版差异仅 package.json types 字段与文档/测试/审计，三入口运行时产物不变）。受影响项复验：types 由审计+契约测试锁定；U1c 迁移实机通过；新候选 S0（三 row + 迁移配置生效）与 S2（业务坏导入 → 面板在 + `module-resolution-failed`，变体 `d04de56d…`）实机通过。其余 S1/S3–S6/U1/U2 的行为面未变（首版矩阵继续有效，其变体基于 `2abdb3e6`，行为面与 `14f6772b` 一致）。

## 交接审核收尾轮（2026-10-05 深夜二）

复核确认前三项修复有效，对新增验证代码提出 2×P2，已修复（tgz 内容不变，重 pack SHA 仍 `14f6772b`）：

| 问题 | 修复 | 复验 |
|---|---|---|
| P2 契约测试 cwd 用 URL pathname（空格路径 ENOENT、Windows 盘符错误） | 改 `fileURLToPath(new URL('../', ...))` | 全套 302 测试（301 pass）含该用例通过 |
| P2 declaredTargets 只走一层条件且排除 `./package.json` 前缀（嵌套坏指针/lookalike 均漏检 exit 0） | 递归遍历整棵 exports 条件树；仅精确排除 `./package.json` 本身 | 双 oracle：嵌套缺失类型 → exit 1；`./package.json-does-not-exist` → exit 1；恢复 → exit 0；新增拒绝用例锁定 16 个声明目标全存在 |
| 文档身份 | 首版/终版 commit 明确分列（见上表） | 人工核对 manifest（c193e0a / 14f6772b） |
