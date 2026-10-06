# -7 合并 review 与验证

日期：2026-10-06。结论：未提交的插件/文档改动已整合到 `release/plugin-7-review`，本地验证与统一包的官方 npm Host 配置故障验证通过；尚未发布，不是 CI 产物全宿主验收。

## 基线与范围

PR 基线 main：`a134f5d573e11846bb6665d1c170510149d09d4d`。整合起点：`ba9f604c083ea5c9312564b3f6653e116ea90ad9`，包含此前未合入 main 的诊断实现、#62/#63 及历史验收证据。另收集原 `bkn-dsh` 的规则/规划、`bkn-dsh-diag-s2` 的 baseUrl 校验、`bkn-dsh-supply-fixes` 的三题策略/导出/完整性工具及全部脱敏测试记录。

版本统一 `0.2.0-rc.2-openbkn.0.2.0-7`；CHANGELOG 将未发布 -5/-6 工作归并，历史记录的候选名称、哈希不改写。bkn-foundry 的未提交内容不属于插件；平台 #2029 由平台维护方处理。原三个工作区 138 个相关文件哈希全部保持，见 `preservation-check.json`、`original-worktree-hashes.json`。依赖目录和私有验收 profile 未提交。

## Review 修复

1. 普通 Node 被判为 npm：官方 Desktop 同样启动 Node Host（支持版本 `apps/desktop/src/host-process.ts`），因此缺少权威形态信号时应为 `unknown`。回归先失败（`hostform-before.log`），修复后插件测试与真实 npm Host 均验证。
2. 导出遗漏短凭据及字段别名：加入无长度门槛的结构化/文本字段脱敏、Bearer 和 URL 凭据脱敏，保留业务数值和非敏感 URL。先复现三个失败（`redaction-before.log`），修复后通过。
3. Markdown 使用未脱敏原答案：改为与 JSON 共享脱敏后的答案。先复现失败（`markdown-redaction-before.log`），修复后通过端到端导出用例。

其他变更保留已验证策略；未扩大工具白名单、未修改 DSH pin、未部署平台服务。

## 当前上游

见 `upstream-baselines.json`、`live-platform-images.json` 和 `live-mcp-contract.json`。支持 DSH `0.2.0-rc.2`；最新 tag `dsh-v0.2.1-alpha.1` / `5badb15009ae1756c3afe0ae0cef1faafc290ccc` 仅作差异审查，未升级。最新涉及插件管理/运行时解析刷新、profile 归一化、移除 invariant companion、PTC 描述顺序；已读取相关源码差异。消费的 MCP/tool 主接口无差异，session 的相关改动为注释，plugin-inventory 与 Desktop host-process 无可执行源码差异。最新版本仍需另行完整适配和实机验收，不能据这些差异审查宣称新版受支持。

OpenBKN 支持/最新稳定版 0.1.5，main `b1a8e10d860bf0bf54438f8240131ebc301cf1bd` 相对稳定版新增 native-tool 发现/描述/执行路由，capability 输出增加下一调用的 `call`；需后续路由与 scope 适配。当前 live 的 28 项 tools/list 均与稳定 fixture 相符：18 managed、10 excluded、0 未归类/已知 kn_id 漂移，`execute_skill` 因条件开关缺席。新增 main 工具本版保持拒绝。原评测题及评分规则未改变。

## 验证

Node 24.19.0、pnpm 11.7.0，复用既有锁文件对应依赖和支持版本 generator；未改锁文件。

- `pnpm --config.verifyDepsBeforeRun=false run test`：313 项，312 通过、1 Windows PATH/PATHEXT 实机测试在 macOS 明确跳过。
- `node --test compat/dsh-0.2.0-rc.2/tests/*.test.mjs tests/*.test.mjs runtime/tests/*.test.mjs`：57/57。
- `python3 docs/eval/test-supply-tools.py`：6/6。
- `pnpm --config.verifyDepsBeforeRun=false run typecheck`：通过。
- `pnpm --config.verifyDepsBeforeRun=false run package:check`：65 文件审计通过。
- 最终 `.tgz` 的版本/sha256/每文件哈希见 `local-pack-identity.json`；官方 npm DSH 安装后 65/65 文件一致（`npm-installed-identity.json`）。
- 官方 npm DSH `0.2.0-rc.2`，独立全新 profile，配置非法 baseUrl：真实 Host 报 `configuration-invalid` / `configField=baseUrl`，bootstrap 和 diagnostics 正常；报告不含错误地址原文，Host 形态为 unknown。见 `probe-npm-host.mjs`、`npm-host-report.json`、脱敏日志。自建 Host 正常停止，未触碰用户原 profile 或调用模型。
- 提交前差异空白与凭据形态扫描通过，见 `export-scan.json`。扫描不能替代穷尽所有秘密格式的证明；导出只保留测试问答/工具轨迹，私有 profile 未归档。

## 真实问答和发布边界

三题此前在策略局部包 round-6 上按原规则通过，五层 313 行/272 物料逐行对照独立平台数据。全部问答、工具调用、失败轮次、库存口径、数据漂移核验见 [三题 RESULTS](../supply-three-fixes-20261006/RESULTS.md)。这不是统一包的 CI 候选验收，未新增可靠性统计，也未改模型或 High 设置。

深层库存 capability 超时仍存在；成功 fallback 不代表平台问题或嵌套工具 guard 已修复。Windows、新 CI 包上的 macOS/npm 真实验收、其余 G6/guard、主动连接探测均未完成。PR 后依据 [统一交接](../../handoff/2026-10-06-release-7/README.md) 固定新的 CI 包并复测；批准发布后才 tag / npm，`latest` 最后移动。
