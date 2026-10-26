# #105：0.2.1 发布影响与最小修复草案

本轮完成适用性核对、合成复现和可评审补丁草案，没有修补产品或已安装 Host。#105 仍 OPEN，本次 0.2.1 没有沿用 -13 风险接受的授权；-30/-31 的既有通过项保留，但不能据此关闭安全门槛或宣布发布就绪。

## 影响范围和证据

- [#105 当前正文](https://github.com/openbkn-ai/bkn-dsh/issues/105)明确：维护者接受的是另一发布线“不变的 -13”，并非本线 -30/-31。2026-10-25 只读刷新后仍 OPEN、0 评论，正文未变。
- [官方 GHSA](https://github.com/advisories/GHSA-6prh-2h8m-c8cw)列 MCP client >=2.0.0、<2.3.0 受影响。固定旧 Host 的实际 MCP SDK 为 2.0.0，新 Host 为 2.2.0；Desktop ASAR 与 npm 实际 entry 的摘要分别一致。不是 OpenBKN CLI/SDK 0.2.0 的版本问题。
- 插件 `OpenBknMcpManager.mountFiber` 向 DSH MCP client 提供初始 URL、Bearer 和超时/重连参数；初始 origin 校验不能限制 fetch 后续自动跳转。两 Host 的 HTTP factory 相同，只转发 `requestInit.headers`。公开 Config 没有 fetch/requestInit/redirect 注入接口。仅向插件配置塞一个 `redirect` 字段不会修复这个边界。
- 本轮在真实 SDK 上向两个不同端口的 127.0.0.1 HTTP 服务发合成数据。原 factory 对照跨源转发 session 和合成自定义头，307/308 另转发 tools/call 合成问题；Authorization 均被 native fetch 移除。不能把它写成 Bearer 已泄漏、真实平台泄漏或鉴权绕过。
- 当前正式 0.2.0 没有执行新的网络请求或服务变更。历史平台无跳转读回不能替代 transport 防护。#105 与 Sandbox 持久化风险、原生非空路由 404、Desktop 登录 runner/Job 收尾各是独立问题。

## 最小可评审补丁

旧/新固定 Host 在 `packages/mcp/mcp-client/src/transport.ts:43` 的草案完全相同，只改一行：

```diff
-        { requestInit: { headers: config.headers } },
+        { requestInit: { headers: config.headers, redirect: 'error' } },
```

见 [旧版补丁](old-transport-deny-redirects.patch)、[新版补丁](new-transport-deny-redirects.patch)及[接口核对](factory-contract-review.json)。原 transport TS SHA256 为 `6f3fca685af3d5654c476e95db24e1245dc1fa021a0bd7f477ce4ad997e1c8f6`，草案为 `db5c00d9f10c275811890f242eaaf0cdcb22be40bcfe241306ac77b0468d228f`，两版补丁 SHA256 均为 `1be0051b4b8416af2b7af25083e1046841a02387be554da6ba3ad4fb1beac516`。仅独立文本副本存在该改动，官方源码/运行包/ASAR/profile 均未应用。

SDK 2.0.0/2.2.0 的 POST、GET/SSE、DELETE 路径都将 requestInit 传给实际 fetch，故该策略覆盖这些请求，不依赖更换 SDK。四项 factory 接缝检查执行了固定源码/草案的隔离编译副本，并观察其真实 SDK 构造参数；合成网络检查单独执行真实 SDK。没有用全局 fetch 补丁、Node 加载钩子、Host 注入、代理服务器或业务工具封装冒充修复。

这是最小的**拒绝全部跳转草案**，不是可直接落地的完整修复结论：

1. 同源 301/302/303/307/308 也会被拒绝。本轮对照明确记录这个差异。#105 的“保留受支持同源行为”尚未完成，不能静默修改验收合同。如果最终采用本草案，需明确端点必须直接配置最终 URL、确认受支持部署不依赖跳转，并审阅失败/回滚行为；在此之前仍为待评审。
2. 若必须保留同源跳转，应评审官方 SDK 2.3.0 的同源限制实现或其受控回补，不能将这里的一行策略称为等价修复。此分支没有制作或安装，避免自写方法重放/凭据转发规则扩大补丁。
3. 两固定 DSH 无公开插件级注入接口。因此，保持 Host 全部字节不变时，不能只发一个插件新包宣称解决 #105。后续无论选 Host transport 修补还是 SDK 升级，都需要明确的 Host 交付身份和兼容范围；本轮既不实施 Host 修补，也不升级 DSH。不能保持“官方未修改 Host”的声明却暗中替换依赖。

## 已做的最小验证

运行矩阵：任务 Node 24.19.0 上的两版 npm SDK，以及官方旧 Desktop Electron 44.0.0/Node 24.18.1、官方新 Desktop Electron 44.7.0/Node 24.21.0 内 ASAR 的实际 SDK。Desktop 只以 `ELECTRON_RUN_AS_NODE=1` 执行探针，没有启动应用 UI、登录或模型。

| 检查 | 实际结果 | 边界 |
|---|---|---|
| 原策略跨源对照 | 60 项 PASS：观察到预期 session/自定义头转发及 307/308 合成工具体转发 | 不使用真实凭据/业务数据 |
| 草案跨源 301/302/303/307/308 × POST/GET/DELETE × 四组合 | 60 项 PASS，第二源请求总数 0 | 仅 SDK transport；未部署到完整 Host |
| 同源策略观察 | 40 项 PASS：原策略跟随、草案拒绝 | 是观察断言通过，不是同源兼容验收通过 |
| 无跳转 initialize、initialized、tools/list、tools/call、session、SSE resume/read、DELETE、close 调用 | 四组合 PASS | 未单独声称已验证在途 SSE 取消；owned 服务最终关闭 |
| 401，含指向第二源的合成 discovery 提示，无 SDK OAuth provider | 四组合 PASS：拒绝、0 discovery 请求 | 不等于全 Host OAuth 安全验收；未重跑 CLI 登录 |
| 真实 factory 源码/草案 → 真实 SDK 构造参数 | 四项 PASS：headers 保留，redirect 选项实际进入构造参数 | 隔离文本编译，非完整 Host 加载 |

总计 168 项 SDK transport 场景及 4 项 factory 接缝检查；见 [验证摘要](VALIDATION.json)和原始合成结果。首次探针把原生 301/302/303 的 POST→GET 后 GET-405 错误误认为应成功，已修正该断言，失败原件保留在 [首次记录](redirect-probe-attempt1.json)，没有把这次失败归因于产品。所有合成监听均已关闭。

## 后续最小落地门槛

本轮交付到“补丁准备、证据明确”即止，不需要现在扩大 Windows 范围或重新跑已通过项。

1. 确定同源跳转合同和允许改变的 Host 交付边界；不得以 -13 的接受替代本线决定。安全有效的一行草案与正式兼容承诺分别评审。
2. 选定方案后才制作单独、可追踪的新候选/Host 补丁身份。-30/-31 及已发 Windows kit 永久保留原样，不在原版本内偷换字节；提供原始 Host 的恢复方式。
3. 在隔离的实际 Desktop/npm Host 验证候选加载、正常工具发现/调用、401 及既有 CLI 管理凭据路径，确认重连和卸载仍由原 DSH supervisor 管理。当前 synthetic SDK 证据不升级成这些 PASS。
4. Windows 只补改变的 HTTP transport 边界及一个必要实际加载/普通 MCP 路径；已有 argv、启动 helper、UI、目录选择、B1、登录 Job 排查不因 #105 自动重跑。具体矩阵待方案/候选固定后再给，不改当前 d20a266 提示词。
5. 真实 Host/目标平台和必要 Windows 证据齐备，审查 #105 自身完成条件后关单。最终 build-only CI 仍须等开发与本地验证收敛并获执行授权；本轮没有推送、CI、标签、发布或远端 issue 写入。

## 与等待中的 Windows 结果合并

Windows 仍固定 `handoff/windows-local31-ui-life30-20261024` / `d20a266fa550dd854c9bd7d30bd04c088de9bbfe`：-31 只受影响 UI、-30 单 Desktop 生命周期最小补证。其报告只能关闭自身实际覆盖项，不能证明本草案已交付或 #105 已修复；本轮合成结果也不替代 runner/Job、浏览器关闭原因的现场证据。
