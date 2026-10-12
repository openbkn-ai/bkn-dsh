# -10 OpenBKN 0.2.0 兼容：源码与受控验证

2026-10-12。本轮完成最小兼容源码和受控测试，不代表正式 0.2.0 平台/SDK 的实机验收。保留已完成的诊断基础信息展示；B1 鉴权恢复历史问题仍待最小复现和根因确认，没有顺带修改 token/MCP 重连逻辑。

## 固定身份

| 对象 | 固定值 |
|---|---|
| 插件分支 | `feat/diagnostics-info-10`，PR #89 |
| 本轮基线 | `b3946a6da269008a0d4a979e9ebaeb480509e4a7` |
| 兼容源码提交 | `0309102e592f8ce52ec7d4640a0bdf5a26812903` |
| 插件版本 | `0.2.0-rc.2-openbkn.0.2.0-10`，未发布 |
| DSH 目标 | 官方 `dsh-v0.2.0-rc.2`，未升级宿主 pin |
| Foundry 0.2.0 准备源码 | `06c5a8786a81f3ef4601f00b1e3ba4f3b9f6988a` |
| SDK 0.2.0 准备源码 | `c404354793146edab944b7e5a79908bf41ddd591` |
| Foundry 0.1.5 对照 | `e6445df3fd70f0768a77764d10ec084954d3a770` |
| SDK 0.1.5 对照 | `563a17b02810e321e75759e49a1076c75e34ab56` |
| 本地 Node / pnpm | `24.19.0` / `11.7.0` |

本轮查询 Foundry 的最新 GitHub release 和 npm 官方源 SDK 版本列表，正式版本仍为 `v0.1.5` / `0.1.5`，没有正式 SDK `0.2.0`。准备源码和 fixture 不作为发布或部署证明；正式包到位后还需核对与上述源码的差异。

## 最小改动

| 项 | 实现与边界 |
|---|---|
| CLI 安装目标 | 现有高级设置允许显式选择 `0.1.5` 或 `0.2.0`；Host 拒绝其他值，npm 安装和版本验证使用同一目标。保留已有 CLI 不覆盖、单次安装、关闭重开进度与输入锁定。没有自动平台探测、日常 CLI 升级或新配置体系。 |
| 导航摘要 | 仅接受平台明确的导航摘要分支：三类概念数组为 null、有概念组和 notice、合法数量达到对象类 >200 或关系类 >600。保留网络身份校验；未返回的索引不解释为零对象。普通数组、非法结构和边界值分开测试。 |
| Trace 明确降级 | 识别平台成功返回的禁用/不可用状态，没有本轮 Interaction ID 时不伪造或复用旧 ID，保留已知的跨轮 Conversation。来源视图显示未记录及原因，保留本地工具时间线，不请求旧 Interaction 的平台证据。 |
| 工具与调用边界 | 继续使用普通 MCP、原有工具子集和网络范围；没有开放 native gateway、SQL/Cypher/shell 或写操作。降级仍受 start/finish、单回合、绑定网络和参数校验约束，不重做成功业务请求，不接管模型答案。 |

### 修复前后复现与宿主边界

`before-after.json` 调用基线与当前生产状态函数，输入为受控构造的 `trace_recorded:false / trace_available:false / continue_without_bkn_context` 结果：基线投影为 `{}`，当前投影为 `recording:unavailable`。两者均保留既有 Conversation，基线的 `open` 也已为 true；因此本证据证明旧实现遗漏了明确降级状态，不宣称旧实现一定阻止所有查询。本轮还收窄未知成功但无 ID 的放行路径，避免把未声明降级的响应作为访问依据。

官方 DSH MCP bridge 会把 lifecycle JSON 与 `[BKN_TRACE]` 尾块合并成同一段文本。受控测试先暴露旧解析失败，再通过生产解析器支持该明确形状；任意正文、非法尾块及错误结果不作为降级依据。

官方 DSH `0.2.0-rc.2` 的工具桥接丢弃原始 `_meta`，但保留平台的 `[BKN_TRACE]` 文本及 `partial_reasons`。本轮锁定这一边界，仅让模型沿既有文本路径使用平台已披露的原因，不新增独立证据账本，也不宣称 `_meta` 已完整透传。正式部署上的原因传播仍待实测。

## 契约 fixture 与受控测试

新 fixture 为 `packages/openbkn-business-context/tests/fixtures/context-loader-tools-v0.2.0-preparation.json`：社区完整 MCP 面共 26 个工具，固定 `skill.executeEnabled=true`，不包含企业扩展或 compact-only gateway。24 个工具有结构化输入 Schema；两个 inline PTC 工具没有该形式的 Schema，明确记为不可用，不伪造空 Schema。

`scripts/capture-context-loader020.py` 从固定上游文件抽取独立契约，记录文件 SHA；lifecycle / bkn_context 等动态 Schema 由隔离的纯 Go 构造代码生成。因原仓库使用 Sonic，抽取时仅将序列化替换为标准库 `encoding/json`，没有启动平台服务或改变工具字段。旧 0.1.5 fixture 保留。此清单是源码提取，不是部署的 `tools/list`。

受控调用链使用官方 DSH `ToolRuntime` 与 `createMcpToolDefinition`，平台调用由 fixture 响应替代。覆盖正常及未记录的 start/finish、能力发现到执行、缺字段/错误类型/跨网参数、start 前调用、未知或排除工具，并断言拒绝的调用不 dispatch。服务绑定测试验证合法导航摘要在解析后记录 pass、清除同 subject 的旧解析失败。

| 命令/检查 | 结果 | 证据层级 |
|---|---|---|
| `pnpm test`（先构建 host/client） | 434 项：433 pass、0 fail、1 skip；跳过项为 Mac 上既有的 Windows 原生 cmd 用例 | 本地构建与受控测试 |
| `node --test compat/dsh-0.2.0-rc.2/tests/*.test.mjs tests/*.test.mjs runtime/tests/*.test.mjs` | 60/60 pass | 仓库工具回归 |
| `pnpm run typecheck` | exit 0 | 静态检查 |
| `pnpm run package:check` | exit 0，70 文件 | 本地打包审计 |
| `pnpm pack --out /tmp/bkn-contract020-20261012/pack/openbkn-dsh-business-context-10.tgz` | exit 0，70 文件 | 本地开发包 |
| 打包后内容检查 | 固定 CLI 版本、导航分支、Trace 分支、客户端提示和 Remote 类型均存在；打包的 lib 字节与当前构建一致 | 产物内容检查 |

命令使用本机 Node 24 的 PATH；原生输出见同目录五份 `.log`。`FILES-SHA256.json` 仅覆盖五份日志、`before-after.json` 和 `pack-check.json`，不包含自身或本报告。日志和 JSON 保留原始字节，不为了 diff-check 改写输出。

## 本地开发包与旧候选

本地 tgz：`/tmp/bkn-contract020-20261012/pack/openbkn-dsh-business-context-10.tgz`。

- SHA-256：`4931f27fe3b93e3b5b1c420e5c8d6ed336ad6473504f276bcc9ec0fc94c5cb4e`
- 188156 字节、70 文件；逐文件 SHA 在 `pack-check.json`。
- 这是源码 `0309102` 的本地开发包，不是 CI 候选或实机验收包。后续 build-only CI 产物身份另行归档。

旧诊断展示候选 CI `38106903958` / 源码 `4daccf6b794ee7e9d55b9c7a45f29f5403c6d2a0` / tgz `b2d90c19…` 的 Mac 结果保持历史原样，仅证明旧候选的诊断展示；不覆盖本轮新增兼容。旧 Windows handoff 同理，不能直接作为本轮兼容复测通知。

## 上游问题与剩余门槛

上游 Schema 问题已单独提交 [Foundry #2106](https://github.com/openbkn-ai/bkn-foundry/issues/2106)：`get_kn_detail` 合法导航摘要的 null 字段与 array-only MCP output Schema 不一致。本轮适配插件的可选 REST profile，不篡改 MCP 结果或替平台修 Schema；严格客户端仍可能拒绝该 MCP 返回。issue 提交不等于上游已修复。

正式 Foundry / SDK `0.2.0` 发布后再执行：固定正式产物身份和契约差异 → 新 CI 候选上的 Mac npm/Desktop 实机验收及 0.1.5 受影响回归 → 单独 Windows 复测 handoff → 回传复核和发布门禁。不能构造的 Trace 场景如实 not-run。B1 未复现则保持开放，不宣称修复。计划见 `docs/plans/2026-10-12-openbkn020-compatibility-10.md`。

本轮没有启动真实 Host、安装 SDK、登录平台、调用模型或改变用户网络、PATH、全局 CLI。构建仅复用固定 DSH 的已构建 generator，通过忽略路径 `release/deepseek-harness` 的本地链接供 pnpm 解析；没有修改 DSH pin、补丁、lockfile 或宿主源码。保留 Foundry 工作树的既有未跟踪内容。没有发布、打 tag、迁移 dist-tag 或合并 PR。
