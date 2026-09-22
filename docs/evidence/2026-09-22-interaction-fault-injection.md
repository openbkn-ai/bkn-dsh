# 补测(二):故障注入与受控回退(2026-09-22)

> 用途:覆盖 `docs/evidence/2026-09-22-interaction-baseline.md` §3.3 与 handoff §6 的未覆盖项——会话失效受控回退、故障类错误不清除 conversation_id、finish 自身失败。接续 `docs/evidence/2026-09-22-interaction-worldcup-supplement.md`(同一会话 `session-0165d688`,同一环境)。
> 方法说明:网络层代理注入被插件的两道安全 fence 挡住(baseUrl 变更触发 CLI 平台 fence;mcpUrl 跨 origin 拒发凭据)——**这本身是插件安全设计的正面验证**。实际采用两条注入路径:**会话事件伪造**(等价触发失效)与**模型级参数注入**(明确指示模型发非法参数)。

## 1. 会话失效受控回退(途径:事件文件伪造死 id)——**通过,全链路**

将 `session-0165d688` 事件流中 active 事件的 `conversationId` 改为 `conv_0000000000000000000000000000dead`(全部 68 处出现,含 transcript 历史,保持模型上下文一致),重启 web 恢复会话后:

| 步骤 | 观测 | 判定 |
| --- | --- | --- |
| 第 12 轮问「2022 冠军」 | 模型 continue 死 id → 平台真实信封 `{"error":{"code":"resource_not_disclosed","message":"授权范围内不存在该请求",...}}`(与 bkn-foundry `session_guard.go`/V0-6 实测形状一致);模型**不重试、不再发业务检索**,用会话内已有上下文作答并声明「未在本轮重新验证」 | ✓ 错误如实呈现、无拒绝回路、0 新 Interaction |
| 插件侧(同步于工具结果) | 事件文件新增 `seq 251` **tombstone**(dead id, `invalidated`)——清内存 id + tombstone 落盘 | ✓ P1a 修复的生产环境实证 |
| 第 13 轮问「2014 冠军」 | 注入段已变「无可用会话」(页面 System prompt update)→ 模型**受控 new** → 新 conversation `conv_f71fecf3…`(事件 `seq 269` active + 平台 03:01:10 创建记录)→ 查询成功,Germany/Brazil 与基准一致 | ✓ 恰一次受控 new,模型原话「旧会话标识已不在授权范围内,我改用新建会话」 |
| 第 14 轮问「1998 冠军」 | continue `conv_f71fecf3`(无 System prompt update = id 未变),France/France 与基准一致;该 conversation 名下第 2 个 interaction,全部 `completed` | ✓ 失效后新会话续接正常 |

平台核验:`conv_f71fecf3` 名下 2 个 interaction(03:01:12 / 03:01:50)均 completed;旧 `conv_86e003f0` 不再被触碰。

**边界如实声明**:此途径是「id 从未有效」而非「有效后被平台 close」——插件侧行为(continue→被判死→回退)与真实失效完全同构;平台 close 路由本身未被走到(见 §4)。

## 2. invalid_params 不清除 conversation_id(途径:模型级参数注入)——**通过**

第 15 轮指示模型以 `conversation_mode "renew"` 调用 `bkn_start_interaction`(guard 按「unmatched mode 交平台验证」放行,单测第 31 条的 L4 实证):

- 平台返回真实嵌套信封:`{"error":{"code":"invalid_params","message":"bkn_start_interaction expects top-level agent_name, question, and conversation_mode; use continue with conversation_id or new without it","required_action":"correct_tool_arguments",...}}`;模型原样转述;
- 插件侧:事件文件**零新增**(无 tombstone、无新 active)——非失效码不清 id,`classifyFailure → 'other'` 在真实链路成立;
- 第 16 轮问「2010 冠军」:模型 thought 明确「continue and conversation_id conv_f71fecf3」→ 正常 start→query→finish,Spain 与基准一致,`int_78d0e277…` completed;
- invalid_params 轮平台侧**零痕迹**(start 失败不留 interaction,与 V0-6 一致)。

## 3. finish 自身失败(途径:模型级参数注入)——**通过**

第 17 轮指示模型正常交互后以 `outcome "bogus"` 调用 finish:

- 平台返回 `{"error":{"code":"invalid_params","message":"bkn_finish_interaction outcome must be one of: completed, failed, cancelled, handed_off",...}}`;
- 插件侧:finish 失败 → **interaction 保持 open**(模型可立即重试)——单测「a failed finish keeps the interaction open so the model may retry」的 L4 实证;
- 模型按指示以合法 `completed` 重试 finish 成功,`int_b7860d7b…` 终态 completed(2002=Brazil 与基准一致);无未闭合残留。

## 4. 不可注入项与原因(如实记录)

| 项 | 不可注入的原因(实测/源码) | 已有覆盖 |
| --- | --- | --- |
| 401(运行中) | 平台 MCP `initialize` 即验 token(实测坏 token → 401 `Public.Unauthorized`),换坏 token 会使工具面整体挂起(`failOnStartupError`)而非产生「start 收到 401」 | V0-6(401→transport error 形状)+ 单测(不清 id 分类) |
| 超时 | `toolCallTimeoutMs: 2e4` 编译于插件 `McpClient.Config`;`requestTimeoutMs` 仅管控制面 HTTP reader;本地平台响应远快于 20s,无干净方式让单次调用慢过阈值 | V0-6 + 单测(timeout→'other') |
| 5xx | 无网络层注入通道(见下),本地平台不产生可控 5xx | V0-6 + 单测 |
| 平台真实 close | `POST /conversations/{id}/close` 要求**内部信任 headers**(`X-BKN-Application-Principal-ID`/`X-BKN-Effective-Subject-ID`,由网关注入的 `trustedOwnerFromRequest`,见 `session_handler.go:697`)且前置业务域授权拒绝外部身份(此前实测 403)——**设计使然,非配置缺失**;admin CLI 不可调 | §1 的等价触发;建议向 bkn-foundry 提测试钩子需求 |

**网络层代理为何放弃(记录给后来者)**:插件有两道安全 fence——① `AuthCoordinator` 要求 CLI active platform 与插件 `baseUrl` 完全一致(改 baseUrl → platform-mismatch → token 不可达);② `resolveMcpUrl` 的 origin fence(显式 mcpUrl 必须与 baseUrl 同 origin 或双 loopback,否则「refusing to send credentials」)。MITM 代理(TLS 自签)本身工作正常(经它 `initialize` 200),但被 ① 挡在 token 环节。**绕过 fence 需要改被测代码,QA 不做。**

**意外收获——「工具面不可用」的真实 L4 样本**:代理实验期间两次 accidental 的工具面失效(2006 问题×2 轮,unknown tool)中,模型三次失败后停止重试、明确告知工具不可用、用已有上下文作答并声明非本轮验证、**0 新 Interaction 0 编造**——连接层故障时模型行为合规的实证。

## 5. 环境与操作备忘(增补)

- 会话事件文件 `session.v3.jsonl.zstd` 为**多帧 zstd**(首帧必须恰为 header 行,`assertZstdHeaderFrame`);单帧整体重压会使会话列表加载失败(corrupt)。安全改法:header 单独一帧 + 其余行一帧;改完须重启 web。
- `openbkn` CLI 的 active platform 与插件 `baseUrl` 必须一致(CLI fence);`.credentials.yaml` 的 `OPENBKN_MCP_TOKEN` 是 MCP 实际 Bearer(与 CLI 会话独立)。
- 模型级参数注入是可靠的 L4 故障注入形态:明确指示「用参数 X 调用工具」时模型会照做(本会话 4 次验证),guard 对 unmatched mode/outcome 放行交平台验证,恰好形成真实平台错误信封进入生产提取链。

## 6. 结论

原「未覆盖项」清单更新:**会话失效受控回退**(等价触发,全链路)、**invalid_params 不清 id**、**finish 自身失败(可重试路径)**三项已 L4 实测通过;401/超时/5xx 三类在本部署无干净注入路径,维持「V0-6 形状实测 + 单测分类 + V0-7 生产提取链」的覆盖,并新增「工具面不可用」真实样本;平台真实 close 属平台测试钩子需求(与 trace 枚举缺口一并提请 bkn-foundry)。
