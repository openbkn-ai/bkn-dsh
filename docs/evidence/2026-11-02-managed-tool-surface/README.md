# 0.2.1 受管工具目录修复与实机彩排

日期：2026-11-02，Asia/Taipei。Issue：[bkn-dsh #120](https://github.com/openbkn-ai/bkn-dsh/issues/120)，已加入 [OpenBKN 0.2.1](https://github.com/orgs/openbkn-ai/projects/12)，分配给 `kalias`。

**本地修复和必要验证完成，当前 macOS DSH 已加载本地候选并通过一次真实三仓库存与 CSV 交付彩排。没有发布、推送、PR 或远端 CI。**

## 修改范围

基线 `cfd377f88fe89a42e97577e62d1f06bec2875a3c`，独立工作树 `bkn-dsh-tool-surface-20261102`，分支 `fix/021-managed-tool-surface`。没有更改并行溯源界面工作树。

- `scoped-business-context.ts`：在原生 `system-prompt/assemble` 的 scoped waterfall 中等待完整下游组装，再按现有受管策略过滤模型请求的工具 schema。每次请求重新投影，覆盖迟注册与 scoped 工具，不在挂载时对未知工具名建立静态 restriction。
- `managed-session-policy.ts`：追加明确的会话适用范围与查询、文件交付路线，放在上游通用指导之后；原上游文本、平台记录和模型回答不改写。
- 原执行守卫和网络、上下文、生命周期、只读与 CSV 原字节校验保持原样。安装前比较打包 `business.js` 的原守卫代码块，与原已安装包逐字一致。
- 不增加业务算法、答案替换、自动纠错回合或平台权限。不把七条计数错误转成插件的答案仲裁功能。

## 验证结果

环境：Node 24.19.0，pnpm 11.7.0；复用已有固定依赖，不升级开发 pin 或修改 lockfile。

| 检查 | 结果 | 证据 |
| --- | --- | --- |
| 新增回归原实现 | 3 项全部失败，重现禁止工具仍可见、缺少最终会话路由、下游工具未过滤 | 首次执行工具输出；不是安装错误 |
| 受影响检查 | 55 pass，涵盖工具目录、动态注册、作用域、原始指引不变、无 dispatch 拒绝、生命周期、网络与 CSV | 后续完整插件集包含同批用例 |
| 完整插件构建及测试 | 661 项：660 pass、1 Windows 专属 skip、0 fail | `plugin-tests.log` |
| 类型检查 | pass | `typecheck.log` |
| 仓库、runtime、固定兼容脚本测试 | 79 pass | `repository-tests.log` |
| 包审计 | pass，94 文件 | `package-check.log` |
| 打包候选 + 官方 ToolRuntime 0.2.0-rc.2 / 0.2.1-rc.3 | 两个 capture 场景均 pass；模型目录、CSV 可见性、晚注册过滤及错误身份/只读/错误摘要/结束后拒绝不 dispatch | `csv-runtime-*.json` |
| 同一候选 + 两官方 ToolRuntime 的 formal 平台契约守卫 | pass；错误网络、上下文、生命周期和排除工具继续被拒绝 | `guard-runtime-*.jsonl` |
| 当前原生 macOS DSH 0.2.1-rc.5 | 候选生效后的单条真实查询/生成/导出/收尾 pass，点击打开 pass | `LIVE.json`、`live-file-verification.json`、`live-csv-open.png` |

第一条 `pnpm test` 曾因新工作树复用依赖触发 pnpm 自动安装检查，非交互环境拒绝清理 modules，未运行测试。随后仅对该命令关闭自动依赖安装检查，保留既有依赖并成功执行完整构建/测试。未以自动清理或重新安装共享目录解决。另一次中间测试的提示文本顺序断言不匹配，修正断言后 55/55 及完整集通过；未修改产品行为来凑该断言。

受控 ToolRuntime 场景使用 stand-in 平台和文件系统，不代表 Windows 原生、真实平台或模型验收；实际 macOS 彩排另列。

## 候选与安装身份

- 本地 archive：`release/openbkn-dsh-business-context-0.2.1-rc.3-openbkn.0.2.1-2.tgz`。
- SHA-256：`b7b26bb87fe93123c4590012015d08c08e9d9cfe3ba1f4476f7a3bd86859790a`。
- 本次是**未发布本地候选**，沿用 manifest 版本但使用 archive 摘要区分，不能冒充 npm 上同名版本内容或覆盖已发布包。
- 与原已安装文件相比，仅 `lib/business.js`、`lib/types/managed-session-policy.d.ts` 有本次逻辑/声明增量；`lib/client.js` 的额外差异全部为生成的 region 依赖路径注释，去除这些注释后逐字一致，没有界面逻辑增量。其他包文件不变，`package.json` 仅序列化且解析一致。
- 经原 App 自带 CLI 的 `plugin --profile desktop add <本地tgz>` 安装；94 个包文件逐项比对，除 package.json 序列化另作语义比较外均匹配 candidate manifest。
- profile 顶层只改 dependencies，只有本插件的 dependency source 从原来源变为本地 tgz；其他插件依赖不变。备份在 `release/before-desktop-install/`，没有读取或备份 credentials。
- 安装成功后原进程仍使用旧模块：首次新会话保留 66 工具且无新指引，未当作候选验收。等其自然收尾后正常退出并重启 DSH。重启后实际模型请求两次均只有 **19 个受管工具**，且新路由文字存在，形成运行生效证据；不只凭磁盘版本宣称加载成功。

上游依据沿用本任务同日只读核查：DSH rc.5 tag `b830ec950faba0a46dda564be3e2d854afed94f1` 的公开组装 waterfall / ToolRuntime 合同；OpenBKN 正式 v0.2.0 commit `81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b` 的工具/指引与原实际会话请求 schema。平台通用指南继续保留，不升级平台；当前各服务镜像未新增全量审计，本项不是全平台兼容声明。

## 真实彩排

- 会话：**021修复后｜三仓库存CSV演示**。
- Session：`cd99a82a-3ea7-4e5e-af12-8b18a1fdb44a`。
- 工作区：`/Users/kalias/Documents/project/app/test_folder`。
- 模型：沿用 `GLM-5.3-Flash · ZCode` / Default；标准模式、workspace-write。
- 时间：12:28–12:29，UI 用时 **1 分 10 秒**，8 个模型步骤、7 次工具调用，无工具错误。不作通用性能承诺。
- 提问的业务内容与前次一致，未提供预期库存或强制指定工具名；只用首部标记区分候选验收。

实际顺序：start → search_schema → query_metric → query_object_instance → 受管 run_code 生成平台临时 CSV → openbkn_export_csv → finish → 最终回答。

实际请求头两次均有 19 个工具，包含 18 个实际可用的受管 MCP 工具和专用 CSV 导出；不含直接 `run_cypher`、Host `write/edit` 或其他 Host 工具。原 MCP 通用指南仍保留，新指引明确限定其适用范围。原执行守卫并没有被删除。

最终 CSV：

[打开实际文件](</Users/kalias/Documents/project/app/test_folder/openbkn-4941079f-d411-4387-8595-a1a94d28d321-inventory_382-000005_three_warehouses.csv>)

| 仓库 | 可用库存 | 单位 |
| --- | ---: | --- |
| 苏州成品仓 | 325 | 个 |
| 乌鲁木齐成品仓 | 127 | 个 |
| 哈尔滨成品仓 | 82 | 个 |

3 行、无合计行，合计 534 个，内容与静态 sample 独立基准一致。168 字节，SHA-256 `a8e3d34f809c466b06305068b67bf28cb05614d4f688071290ad5e38dc85c9cf`，实际文件与原工具回执匹配。168 与原会话的 164 字节差别不代表业务数据变化；分别核对各自平台原文件回执。

已实际点击最终回答中的文件链接，在 DSH 右侧表格查看器打开并检查三行和单位。链接目的地与回执一致，模型把显示标签由“CSV”改成文件名，没有逐字复制 markdown_link；不影响目的地或打开行为。默认列宽令部分名称显示不全，原始 CSV 内容完整，未修改文件以美化画面。

本次最终回答未再增加“7 条”计数；仅代表本次观察，不保证任意问题/模型都无业务或自然语言错误。验证结论覆盖列明的数量、单位、导出、打开与工具路线，不能外推整个附加说明或所有业务语义都已验收。

## 原记录和失败保留

- 原会话“三仓库存查询CSV导出演示”及原 164 字节文件均保留，结束后 SHA-256 与安装前一致，见 `PRESERVATION.json`。
- 首次安装但进程仍为旧代码的会话另命名为 **021旧代码缓存对照｜未完成CSV交付**，Session `3c443457-2d14-411b-81d5-4adf6e8fde6d`。它发生直接 Cypher 拒绝，并提前 finish 后才导出，未交付文件，按失败保留，见 `load-cache-miss.json`。未追加纠错回合、未冒充候选通过或用成功覆盖该失败。
- 旧代码回合正常结束后才重启，没有故意中断并遗留活跃 Interaction。原模型回答和平台记录没有改写。

## 尚未包含

没有 Windows 原生实机、其他模型、其他 DSH 版本完整 UI 矩阵或全平台数据写入审计。没有新发布、npm/dist-tag 变更、Git push、PR、远端 CI 或平台升级。当前 profile 运行本地候选，发行渠道仍是原已发布包。Issue 保持开放，供后续代码评审/集成，不能因为本地通过就宣称已发布修复。
