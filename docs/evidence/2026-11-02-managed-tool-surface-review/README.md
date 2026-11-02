# 工具目录修复复查

2026-11-02，Asia/Taipei。复查 `00b1181`，修复前基线 `cfd377f`，分支 `fix/021-managed-tool-surface`，关联 [#120](https://github.com/openbkn-ai/bkn-dsh/issues/120)。用户授权发现问题后本地补修及必要验证，先不发布。

**当前已验证范围内，正常查询和 CSV 没有被误过滤，原执行守卫没有放宽。发现并补修一处旧平台工具展示遗漏；没有剩余的当前目标版本阻断项。** 本轮没有替换 DSH 中已通过彩排的包，也没有重复模型业务问题。新候选的受控运行时验证与上轮实机验收分别记录。

## 发现与修复

**P2：旧平台不带 `kn_id` 的 `execute_skill` 仍在模型目录中。** 初版过滤只判断工具名是否受管，但现有 `knScopeDenial` 会永久拒绝这种无网络范围的 Skill 定义，能力提示也已经声明不可执行。展示它仍可能诱导模型发起必然失败的调用。

- 独立依据：OpenBKN `v0.1.4` 源码 `96c6d92822164616ea271618fbecbcab6702ca3c` 的 `mcp/schemas/execute_skill.json` 只有 `skill_id`、`entry_shell`、`timeout`，没有 `kn_id`；见 `legacy-skill.json`。
- 先复现：新目录测试在修复前为 **19 pass / 1 fail**，失败项正是旧定义仍被展示；CSV 服务动态变化测试已通过，见 `before-fix.log`。这是源契约与真实 ToolRuntime 的受控复现，不是新增旧平台实机故障。
- 补修：目录投影额外排除 `KN_SCOPE_REQUIRED_TOOLS` 中已注册定义不声明 `kn_id` 的工具。依据与执行守卫一致，不按版本号猜测，也不删除受管工具名。定义换成有效网络 schema 后，该工具立即恢复可见和有效调用。
- 没把完整执行守卫用于目录过滤：开始前的生命周期、逐次参数和上下文检查仍只在执行时生效，避免把正常查询在 start 前全部隐藏。

产品代码仅修改 `scoped-business-context.ts` 的这一处目录谓词，没有修改提示文本、业务算法或模型回答。

## 正常路径与守卫复查

| 边界 | 验证结果 |
| --- | --- |
| 平台目录 | `v0.1.4`、`v0.1.5`、正式 `v0.2.0` 和既有 live schema 快照四组；正常查询、指标、能力、Skill 读取及平台 `run_code` 保留。比较过滤前后的已登记 schema、描述和原生顺序，除明确排除项外逐项一致。早期源 fixture 仅含工具名与 knId 信息，未冒充完整 schema 快照。 |
| 动态注册和作用域 | MCP 后注册正常工具可见；其他会话和全局目录不受本会话过滤影响；宿主已有 restriction 不会被重新放开。 |
| CSV 可选服务 | 缺少文件服务时仍可查询；服务后注册时出现 scoped CSV；文件服务卸载只移除导出，指标查询仍能执行。 |
| 插件重载 | policy 释放后恢复原目录，重挂后过滤和提示只出现一次，不残留隐藏的查询工具。 |
| Skill 定义变化 | 无网络定义隐藏且直接调用不 dispatch；换成正式网络 schema 后展示并允许正确调用；缺失、错误类型或跨网络参数仍拒绝。 |
| 正常查询和文件交付 | 打包候选在两个官方 ToolRuntime 中，分别执行正式 schema 的 `query_metric` / `query_object_instance`，并完成 CSV 导出；捕获开、关两条路径均通过。 |
| 拒绝不 dispatch | 开始前、结束后、缺失/错误网络、错误类型、缺失/错误上下文、Host/直接查询工具继续拒绝；CSV 只读、错误摘要、错误身份、非法路径仍不会产生成功交付。 |
| CSV 原字节 | BOM、CRLF、中文与小数精度保留，校验新路径和 SHA-256；没有 Host 写文件后门。 |

测试 oracle 包含独立源目录、原生运行时 schema/调用和既有正式守卫探针，不只复制实现许可集合。受控平台/文件系统返回值不代表真实业务数据或新增人工验收。

## 验证记录

环境：Node 24.19.0 / pnpm 11.7.0，复用固定依赖，无安装升级或 lockfile 变化。

- 完整插件构建/测试：**667 项，666 pass、1 Windows 专属 skip、0 fail**，见 `plugin-tests.log`。
- 类型检查通过；仓库/runtime/compat 脚本 **79 pass**；包审计 **94 文件通过**。
- 本地打包候选在官方 ToolRuntime **0.2.0-rc.2 / 0.2.1-rc.3** 中，各有捕获开、关两种查询/CSV 场景，每场景记录 36 项检查通过。两个 formal guard 探针各 **20/20**。
- `guard-integrity.json` 对比修复前基线：许可/排除集合、名称拒绝、网络/上下文检查、执行守卫片段、生命周期、CSV 实现和根业务服务全部逐字一致。
- `packed-guard-integrity.json` 确认新旧打包 `business.js` 的执行守卫片段也逐字一致。`artifact-business-diff.json` 中只有新增目录条件，没有守卫变化。

主要命令：

```sh
pnpm_config_verify_deps_before_run=false pnpm test
pnpm_config_verify_deps_before_run=false pnpm typecheck
node --test tests/*.test.mjs runtime/tests/*.test.mjs compat/dsh-0.2.0-rc.2/tests/*.test.mjs
pnpm package:check
node packages/openbkn-business-context/tests/probes/csv-export-runtime.probe.mjs --runtime <official-runtime> --plugin <unpacked-candidate>
node packages/openbkn-business-context/tests/probes/guard-runtime.probe.mjs --runtime <official-runtime> --plugin <unpacked-candidate> --contract formal
```

仓库中的日志只归一化行尾空白；原始日志保留在 `release/tool-surface-review/`。完整摘要见 `REVIEW.json`。

## 候选与原演示素材

- 新候选：[managed-tool-surface-review.tgz](/Users/kalias/Documents/project/app/openBKN/bkn-dsh-tool-surface-20261102/release/tool-surface-review/managed-tool-surface-review.tgz)，SHA-256 `c049a6e9a245afbc739f86d077e61a3df029babb8869602b01ea74561de7ed76`。
- 仍是未发布本地包，沿用 manifest `0.2.1-rc.3-openbkn.0.2.1-2`，不代表 registry 同版本的字节；94 文件中仅 `lib/business.js` 相比上轮候选改变，93 文件不变。
- DSH 仍保留上轮已彩排的 **b7b26bb8** 候选；本次读取已安装 `business.js`，确认与其相同。没有重装、重启或重复模型业务问题。
- 上轮两次实际请求均为 19 工具，且不含本次额外收紧的 `execute_skill`。据精确谓词增量推断，其目录不受本次补修影响；这不是新候选已完成实机验收的替代证据。
- 原会话、原 CSV，以及成功演示会话和 168 字节 CSV 均重新核对哈希保持一致；上轮 archive 也未覆盖，见 `prior-demo-preservation.json`。原始失败对照及结果未改写。

没有发布、Git push、PR、远端 CI、Host/平台升级或配置变更。新候选未做新增 Windows 或模型实机验收；若后续要用它替换演示版本，应先完成相应的宿主加载/受影响验收，不能直接复用 b7b26bb8 的身份。

## 上游复核与范围

重新查询官方发布页及 ref：最新列出的宿主发行是 [dsh-v0.2.1-rc.5](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.1-rc.5)，commit `b830ec950faba0a46dda564be3e2d854afed94f1`；平台正式发布仍为 [v0.2.0](https://github.com/openbkn-ai/bkn-foundry/releases/tag/v0.2.0)，tag 解引用为 `81d5752826f3b3f3f72f3ad4cb1e22d45e99ab4b`。正式 fixture 的 **34 个源输入 SHA** 全部重新比对一致，未调整旧快照凑测试。

另检查默认分支，发现尚未纳入此次验收的变化：

- DSH master `ce7073d51254c26cd63b22a60835b8f948deb447` 已把 `system-prompt/assemble` 改为仅处理 `PromptPresentation`，工具声明归 provider 所有；该主干不再支持本修复依赖的 `assembly.tools` 合同。**不能将本次通过外推到该未发布主干**，后续若以它为目标须专项适配/验证；本次不改已由维护者选择的更高版本加载策略，也不加入通用适配框架。
- 平台 main `e1aae8d9366d2b12cbd93a6dde87bb2ff61eaf3f` 的原始 metadata 新增 `drill_through_metric`，不是当前正式工具目录。此工具仍未放行；没有扩大受管集合。`execute_skill` schema 与正式版相同，session guard 主干已有差异。
- 通用 compare API 返回 300 文件上限，不能把其“无相关路径”当作无变化。额外读取并对比了 DSH 的 system-prompt/tools/scope 及平台 metadata/Skill/session guard 对应文件，摘要保留在本目录的 `*-main-comparison.json` 等记录中。当前目标版本和未发布主干明确分开。

本项复查针对当前已验证的发行版本和正式平台合同；没有对未发布上游、所有未来宿主或其他模型作兼容承诺。
