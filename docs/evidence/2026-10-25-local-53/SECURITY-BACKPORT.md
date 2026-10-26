# 官方同源策略评审与隔离回补

已把第52轮“拒绝全部跳转”的草案推进为保留官方受支持同源行为的回补。源码、SDK 和服务组合层的隔离验证已完成；未应用到现有 Host，未制作或交付完整 Desktop/npm Host 发行物，#105 保持 OPEN。

## 官方实现的实际边界

主参考为 MCP TypeScript SDK 2.x 修复提交 [433eb413](https://github.com/modelcontextprotocol/typescript-sdk/commit/433eb413dc305ebeb93b8ebcde0095a8fc0d5fa0)及其 `fetchWithinOrigin` / redirects 测试；1.x 的 [30bfe513](https://github.com/modelcontextprotocol/typescript-sdk/commit/30bfe5139f4b0825c90cd725f9a7e3f9af5e120d)仅交叉参考，本线实际 SDK 为 2.x。

- 每跳使用 `redirect: manual`，在发下一次请求之前判断 Location。
- GET 可跟随同源 301/302/303/307/308；POST、DELETE 等非 GET 仅跟随 307/308，不自动将 POST 改为 GET。这与旧 native fetch 的行为存在明确差异，是官方修复策略的一部分。
- 同主机、默认端口的 HTTP→HTTPS 升级被官方允许；HTTPS→HTTP、换主机、换端口被拒绝。因此不能将该实现描述为毫无例外的 `URL.origin ===`。插件原本的初始 HTTPS/loopback 校验保持，回补没有放宽初始 URL 或 TLS 验证。
- 新增/改变 userinfo 的跳转被拒绝，relative Location 和保持已有 userinfo 的情况按官方规则处理。
- 最多跟随五次跳转，第六个响应返回给 SDK；被拒绝的 3xx 由现有 SDK 非成功响应通道处理，不伪造正常 MCP 返回。
- 浏览器 opaque redirect、缺少或无效 Location 均不继续；显式 `manual/error` 保持原语义。这里的 opaque 行为有受控向量证据，没有实际浏览器 CORS 验收。
- 官方提供恢复旧行为的 `fetchLeavingRedirects` / WeakSet opt-out。本回补不复制该未使用的绕过入口，公开 DSH Config 也没有新增 `follow` 开关；核心 origin、method、hop、userinfo 等判断保持官方实现。
- 官方会完整读取可跟随跳转的响应体以释放旧响应，然后继续。回补保留此行为，单独实测未结束响应体可被 caller AbortSignal 中止；没有额外增加响应体字节上限，不能称已完成资源预算安全审计。

没有把“同源正常工作”解释为保留旧 native fetch 的所有重写行为，也没有借用另一发布线 -13 的风险接受。SDK 版本仍落在 GHSA 的受影响范围；本方案只缓解 DSH 这条受保护的 transport 调用路径，不将整个 SDK 或其他消费者标为已修复。SDK OAuth provider 当前未启用，独立 OAuth 公告不因此关闭。

## 最小回补的交付形态

旧 `0.2.0-rc.2` 和当前新目标 `0.2.1-rc.3` 的原 HTTP factory 完全相同，两个源码补丁也完全相同，SHA256 为 `61a324660a4565cf7dba2701542e3c96000e564cfc94b9b4ce212972a9afcede`。见 [old 补丁](backport/old-same-origin-backport.patch)、[rc.3 补丁](backport/rc3-same-origin-backport.patch)。四个文件：

1. `src/transport.ts` 导入 helper，并向 SDK 构造参数传入 `fetch: fetchWithinOrigin(fetch)`。
2. 新增 `src/fetch-within-origin.ts`，复制上述官方 helper 的必要部分，移除未使用 opt-out。
3. 保留完整的固定上游 `MCP-SDK-LICENSE.txt`。
4. `package.json.files` 加入许可证文件，确保未来打包不会漏掉声明。

固定上游 LICENSE 明示其许可转换及新贡献适用规则，已保留完整声明；不把该新代码笼统标为 MIT。[provenance](upstream-mcp-provenance.json)固定来源提交与原始文件摘要。

这不是 SDK 升级，不改 DSH version/dependency pins，不改 stdio、ToolRuntime、工具范围、凭据刷新、Remote、runner 或 Job 策略。wrapper 不持有新的服务器、子进程或重连状态，现有 DSH supervisor 继续拥有连接和卸载。

原源码树只做 `git apply --check`，未应用补丁。另从两个固定提交的完整 git archive 建立隔离源码副本，应用四文件补丁并构建 MCP JS bundle，helper 实际合入输出，两个输出 SHA256 均为 `b3cd7156c0b8639656ce117530fec4d006b74cafdc9a78ac426fec084e62972c`。该源构建产物已在真实服务组合执行；这是 JS-only 包级构建，没有生成全部声明、完整 Host 发行物或修改 Desktop ASAR。初始复制 bundle 后注入同等参数的副本仅作为前期接缝证据，不能代替最终源构建输入。身份见 [源码构建](source-build-identity.json)、[patch-validation](backport/patch-validation.json)及[初始运行副本](backport-runtime-identity.json)。

## 验证结果与限制

| 范围 | 已验证结果 | 证据边界 |
|---|---|---|
| 官方 golden vectors / exact-source reference | 52 组 PASS | origin、方法、五跳、userinfo、opaque、manual/error、同源后跨源、已 abort；含合成 fetch，非浏览器实测 |
| 实际 SDK 2.0.0 / 2.2.0，五类跨源 × POST/GET/DELETE | 30 项 PASS，第二源请求 0 | 真实 loopback HTTP、仅合成头/session/工具参数 |
| 实际 SDK 的受支持同源行为 | 30 项 PASS | GET 五类跟随，POST/DELETE 307/308 跟随且保留头/body；其余非 GET 拒绝 |
| 无跳转 MCP/SSE/DELETE、显式 401 | 两 SDK 各 PASS | 未重跑 CLI 登录或 B1；不宣称完整 OAuth 安全验收 |
| 两个源构建 MCP JS bundle＋真实 Cordis/SystemPrompt/ToolRuntime | 12 项 PASS | 普通调用、同源 307/308、拒绝同源 POST 302、跨源 307、401；正常工具注册/执行/卸载，非完整 Desktop/UI |
| 未结束的同源 307 响应体 | PASS：AbortError，65ms，最终端点请求 0 | 真实 HTTP、caller abort；并非无条件资源预算上限 |
| helper 类型、两个源码补丁适用性及 JS 源构建 | PASS | helper tsc / git apply --check / 实际 bundle 构建；非完整 Host 或可发布包构建 |

原始 SDK 结果在 [same-origin-probe](same-origin-probe-npm.json)。最终源构建服务组合12项见[source-host-probe](backport-host-probe-all-source.json)。初始bundle接缝执行中旧版六项已通过，修正harness的transitive scope解析后仅补rc.3；最终源构建是新产物的必要验证，不与初始接缝结果叠加计数。包级构建最初缺完整TS project references上下文，改用固定提交的完整archive，并明确.js输出扩展；原失败日志保留，没有改pin或修改上游来绕过。首个准备副本的空 node_modules 导致 EEXIST，保留在私有 attempt 目录，没有应用到现有包。所有合成监听已关闭。

## 发布边界

这关闭的是“官方实现评审、最小源码回补准备、隔离 SDK/服务组合验证”工作，不关闭 [#105](https://github.com/openbkn-ai/bkn-dsh/issues/105)。完整 Host 交付身份、正式候选、实际 Desktop/npm 路径及必要 Windows 补证仍缺；现有 DSH 没有插件级 fetch 注入接口，不能只更新插件包就声称防护已经生效。若后续采用 Host 回补，必须明确其构建/签名/兼容身份和恢复方法；不能混称未修改的官方 Host。

当前不安装回补、不改变现有 Host、不替换正式 0.2.0，不推送、不跑 CI。Windows d20a266 仍只做既定 -31 UI / -30 生命周期，不插入本方案测试；待该报告合并后，再按固定的新交付差异准备必要补证。
