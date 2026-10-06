# 非法 baseUrl 配置校验修复（2026-10-06）

结论：本地源码修复及 macOS 官方 npm Host 验证通过。非法地址现在在配置阶段拒绝，独立诊断仍可用。Windows 官方 Desktop / npm 的新候选复测未执行；真实登录及 R3–R8、G6、live guard、权限账号验收不属于本次修复的完成证据。

## 基线与范围

- 用户报告针对 `-6` CI 候选，源码 `144afa503c7d4746cbef01f74eaceff293b88cb5`。
- 修复在已有、开始时干净的 `bkn-dsh-diag-s2` worktree，分支 `fix/diagnostics-d0-s2`，HEAD `ba9f604c083ea5c9312564b3f6653e116ea90ad9`；当前包版本已为 `-7`。`git diff 144afa5 HEAD -- packages/openbkn-business-context/src/config.ts` 为空，确认缺陷仍存在于当前开发源码。
- 原 `bkn-dsh` worktree 的用户修改、兄弟 worktree 及已有 DSH 构建补丁均保留。未推送、打 tag、发布或覆盖原 CI 候选及 Windows 交接包。
- 只修改 `baseUrl` 校验；`mcpUrl`、TLS/同源请求策略、平台路由与工具白名单未改变。合法 URL 原值和已有配置默认值保留。

## 复现及修复

先写回归用例，再运行：`ht!tp://not a valid url with spaces` 在原 schema 的 Standard Schema 校验中被接受，测试失败。原实现仅要求字符串。

修复要求显式的绝对 HTTP(S) URL，禁止原始空白及反斜杠，并用 WHATWG `URL` 检查主机、协议和端口；不自动修复错误拼写。失败通过 Schemastery/Cordis 的配置错误路径携带 `baseUrl`，不回显原始值。DSH 会序列化并重建设置 schema，因此 callback 不引用模块闭包；已覆盖重建后的合法和非法输入。当前 Schemastery 的 transform resolver 不传 callback options，其 ValidationError 标记及 `options.path` 行为也由回归验证。

## 验证结果

| 层级 | 结果 | 证据 |
|---|---|---|
| 插件 build + 全部测试 | 311 pass / 0 fail / 1 skip（312 项） | `pnpm --filter @openbkn/dsh-business-context test`；唯一 skip 为 Windows `.cmd` 专项，macOS 不可执行 |
| 类型检查 | pass | `pnpm run typecheck` |
| 仓库/兼容/运行时脚本测试 | 57/57 pass | `node --test compat/dsh-0.2.0-rc.2/tests/*.test.mjs tests/*.test.mjs runtime/tests/*.test.mjs` |
| 打包检查 | pass，65 文件 | `pnpm run package:check` |
| 实际安装身份 | 65/65 文件摘要与本地 tgz 一致 | [local-artifact-identity.json](local-artifact-identity.json) |
| macOS 官方 npm Host | pass | [npm-host-report.json](npm-host-report.json)：`business-entry=fail`，`stage=configuration`，`code=configuration-invalid`，`configField=baseUrl`；bootstrap/diagnostics 两项仍 pass |
| Windows Desktop / npm | 未执行新包复测 | 原用户报告是 `-6` 的缺陷证据，不是修复验收 |

实际运行：官方 npm `@deepseek-ai/dsh@0.2.0-rc.2`，Node `v24.19.0`，darwin-arm64，无 inspector、无运行时补丁。全新隔离 `DSH_HOME` / `BKN_CONFIG_DIR`，安装本地 tgz 后，以原非法值启动 `dsh web --port 18796 --no-open`；通过 Host 标准认证流程在进程内取得临时 cookie，再只调用 `openbknDiagnostics/getReport`。该调用实际返回的报告已保存，不是合成 fiber 报告。未进行平台登录、模型问答或业务请求。进程已停止，启动日志中的临时访问 token 已脱敏。

本轮浏览器工具对本地地址返回 `ERR_BLOCKED_BY_CLIENT`，因此未取得 UI 导出/截图证据；Host API 验证不能表述为浏览器或桌面 UI 验收。报告仍将不可观测的 Host/loaded-plugin 版本记为 null；实际宿主包版本及安装文件摘要是独立身份依据。

本地验证 tgz 位于 `release/baseurl-fix-20261006/`，SHA-256 `549f4cf32d898ac05c88273bdaa28cccb97a6fed9574c0d34f746a10fe6384b0`。它使用当前开发版本号 `-7`，**不是此前 CI 接受的同版本产物**，构建来源是上述 HEAD 加本地修复 diff；不能替换原候选身份。API 探针及测试完整日志也保留在本地，不包含有效凭据。

## 上游核对与后续验收

2026-10-06 只读刷新：DSH 最新可用预发布为 [`dsh-v0.2.1-alpha.1`](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.1-alpha.1)，源码 `5badb15009ae1756c3afe0ae0cef1faafc290ccc`；本插件继续测试/支持 `dsh-v0.2.0-rc.2`（`639ed015397290b3745d163aafe02ffee4aa3f84`），未升级 pin。查看两者变化及所用官方 npm Cordis 配置解析、DSH 设置 schema 重建实现，配置仍通过同步 Standard Schema/Cordis 校验进入 fiber。OpenBKN 最新稳定发布仍是 [`v0.1.5`](https://github.com/openbkn-ai/bkn-foundry/releases/tag/v0.1.5)，最新 main 为 `b1a8e10d860bf0bf54438f8240131ebc301cf1bd`；本次未更改任何平台契约，不声称已验证测试平台当前镜像或 live `tools/list`。

发布前需授权生成新的 build-only CI 候选，固定新源码及 SHA，再在 Windows 官方 Desktop 和 npm `dsh web` 安装该候选并重新导出诊断：非法值应得到上述配置拒绝，合法地址仍能加载业务入口。保持原 `-6` 文件不变；无需真实平台账号即可完成这项配置负向复测。真实登录验收另行保留。
