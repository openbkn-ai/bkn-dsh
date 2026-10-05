# Windows v4 补测结果（指定源码与固定候选包）

> 执行日期：2026-10-04–2026-10-05，Asia/Taipei。源码提交：`05565f4785671fc5ae53809510b71399977fb7a3`。
> 原 R1–R9 未重跑；未合并、发布、打 tag、移动 npm dist-tag，未改动 main 或 release/ 分支。

证据：**【跑】** 本轮实际命令运行或进程观察；**【界】** 本轮桌面 UI 状态；**【读】** 文件或源码检查；**【人】** 用户完成的操作；未执行的项标为未测。源码推断不计为实测。

## 结论

- **W1 通过**：4/4，Windows 专用项未 skip；缺参数 --live 单独运行退出 2、stdout 为 0 字节。
- **W2 通过**：PATH 与绝对 .cmd 分别 16/16、退出 0，两次平台操作均只有 search_capabilities。
- **W3 通过**：桌面面板授权后无需重启列出两个网络，关闭后重开刷新正常。精确 UI 恢复时间未连续采样，等待观察作为异常保留。
- **W4-1 已实测；W4-3 部分核实**：未授权 CLI 自然退出约 121.6 秒，退出码 2；面板一段时间仍 loading，随后恢复通用连接错误，可重新发起登录。未取得真实 CLI 退出诊断，不能把 code 2 直接写成已确认的设备码过期。
- **W4-2 基础过程已实测**：补测由用户关闭、重开面板，agent 连续读取界面并观察进程。关闭后 CLI 继续运行；重开时仍显示连接中；CLI 自然退出后回到登录入口。随后授权是否自动重开/恢复目录未测。
- 两次 live、桌面登录、等待与重试均使用固定候选，未修改插件/宿主代码；报告中的异常与限制交主开发核对。当前仍不合并、不发布。
- 测试 DSH 已退出、独立 profile 插件已卸载、独立 DSH vault 的测试 OpenBKN 引用已清除。用户已执行 W3 独立 CLI 登出，复核 hasToken=false；原用户已选状态文件未改变。

## 基线与隔离

| 项 | 本轮值 |
|---|---|
| 源码 | 05565f4785671fc5ae53809510b71399977fb7a3，独立 detached worktree；结果分支从该 SHA 切出 |
| 候选 run / 来源提交 | 37202050194 / c4b5dce437a383e8196c830b2926d6e14858e20e，重新下载 plugin-tarball，run conclusion=success |
| 候选文件 / 字节 | openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-4.tgz / 133806 |
| 候选 SHA-256 | c4a8effbe5f84ecb399ee45ddf705c9468ef311910dcf58f62e47a0c71687a02 |
| 发布文件数 / tree-hash | 52 / f4e90f96d5c82e8b8c8cc505847995c6d3624f9870c58a71d7a3d010f3a5c5ad；算法沿用原 v4 报告 |
| Windows / Node | Windows 10 Pro 10.0.19045 / v24.21.0 |
| DSH 桌面及自带 CLI | 0.2.0-rc.2 |
| OpenBKN CLI | @openbkn/bkn-sdk 0.1.5 |
| 探针宿主依赖 | dsh-tools / dsh-mcp-client / dsh-system-prompt 均 0.2.0-rc.2；独立 probe-deps，未构建或修改 DSH |
| 平台 / 网络 | https://192.168.50.28 / supply_ontology_hand / worldcup_vega_catalog_bkn |
| CA / TLS | 进程内 NODE_EXTRA_CA_CERTS 指向原 openbkn-dev-ca.pem；未关闭 TLS 校验 |
| 原登录 | W2 使用已有 CLI 登录；只输出状态键与平台匹配，不输出 Token、用户名、用户 ID |
| 本轮目录 | C:/Users/kalia/bkn-verify/v4-followup |
| 桌面隔离 | DSH_HOME=…/desktop-home-w3；W3 CLI 为 …/bkn-w3，W4 另用空配置目录，包括补测 …/bkn-w4-close-guided；不复制用户原凭据 |

源码仅提供探针和测试，候选 lib 未替换。探针依赖通过两个新 junction 加载；node_modules 不计入 52 个发布文件。用户或系统的 PATH、CA 和代理持久设置未修改；测试进程清除代理环境变量并复用原 CA。

## W1：参数与 Windows 启动回归【跑】

`node --test C:/Users/kalia/bkn-verify/v4-followup/source/packages/openbkn-business-context/tests/guard-probe-cli.test.mjs`

```text
✔ malformed live invocation exits before importing the plugin or taking credentials (274.8379ms)
✔ valid live options retain explicit mode, networks and paths with spaces (1.2674ms)
✔ CLI failures never expose captured credential-like stdout or stderr (62.9525ms)
✔ Windows CLI lookup runs a PATH .cmd and a shim in a path containing spaces and & (123.5234ms)
ℹ tests 4
ℹ suites 0
ℹ pass 4
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 523.8282
```

包含缺 URL、URL 位置为选项、缺网络、两网络相同、仅网络参数、缺 plugin 值六种错误参数形态；全部在插件加载和凭据读取前拒绝。Windows 专用项实际运行 PATH .cmd 和位于含空格及 & 目录的 shim。

另单独运行：

```powershell
node C:/Users/kalia/bkn-verify/v4-followup/source/packages/openbkn-business-context/tests/probes/guard-runtime.probe.mjs --plugin C:/Users/kalia/bkn-verify/v4-followup/candidate/unpacked/package --live
```

退出码 2；stdout 0 字节；stderr：

```text
Invalid guard probe arguments. Use --live <platform URL> --kn <bound network> --other-kn <different network>; every option needs a value.
```

stdout 无 stand-in、无 16/16 或任何验证记录。

## W2：固定候选与真实平台守卫【跑】

运行前状态键：baseUrl, expired, hasToken, userId, username；hasToken=true，平台匹配=true，expired=true。两次 live 成功后状态为 expired=false。**观察到的变化**：现有登录可由 CLI auth token 取得可用凭据；本轮未人工重新登录。没有直接打印或落盘 CLI Token。

两次完整命令（环境如基线）：

```powershell
node C:/Users/kalia/bkn-verify/v4-followup/source/packages/openbkn-business-context/tests/probes/guard-runtime.probe.mjs --plugin C:/Users/kalia/bkn-verify/v4-followup/candidate/unpacked/package --live https://192.168.50.28 --kn supply_ontology_hand --other-kn worldcup_vega_catalog_bkn
node C:/Users/kalia/bkn-verify/v4-followup/source/packages/openbkn-business-context/tests/probes/guard-runtime.probe.mjs --plugin C:/Users/kalia/bkn-verify/v4-followup/candidate/unpacked/package --live https://192.168.50.28 --kn supply_ontology_hand --other-kn worldcup_vega_catalog_bkn --cli C:/Users/kalia/scoop/apps/nodejs-lts/current/bin/openbkn.cmd
```

| 调用形态 | 退出码 / 汇总 | Interaction ID | 平台工具名 |
|---|---|---|---|
| PATH/PATHEXT | 0 / 16/16 | int_200d4d89f0febb8f31b0b70e725b7822 | [search_capabilities] |
| 绝对 .cmd | 0 / 16/16 | int_806e769a3f556e6a5d7fc3cf7d187862 | [search_capabilities] |

以下为探针的完整脱敏 JSONL；两份 stderr 均空。平台核对由探针读取 trace interactions operations 后只提取 tool_name，没有保存业务正文。

<details><summary>PATH 的 16 项与汇总</summary>

```jsonl
{"check":"the plugin mounts its guard on a real DSH agent scope","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"mounted":true,"registeredOpenBknTools":["bkn_start_interaction","search_capabilities","execute_tool","search_instance","list_knowledge_networks"]},"verdict":"pass"}
{"check":"before any interaction: a managed call is refused","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"refused":true,"refusalMatches":true,"refusal":"Error: Start mcp__openbkn__bkn_start_interaction before any OpenBKN access in this turn, then retry this call."},"verdict":"pass"}
{"check":"a host tool is refused in a bound session","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"refused":true,"refusalMatches":true,"refusal":"Error: This OpenBKN business session only permits managed OpenBKN tools."},"verdict":"pass"}
{"check":"bkn_start_interaction is allowed and opens the interaction","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"ok":true,"hasInteractionId":true},"verdict":"pass"}
{"check":"cross-network kn_id is refused","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"refused":true,"refusalMatches":true,"refusal":"Error: This session is bound to OpenBKN knowledge network \"supply_ontology_hand\"; call mcp__openbkn__search_capabilities with kn_id \"supply_ontology_hand\". Other networks cannot be queried from this s"},"verdict":"pass"}
{"check":"missing kn_id is refused on a tool whose schema requires it","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"refused":true,"refusalMatches":true,"refusal":"Error: This session is bound to OpenBKN knowledge network \"supply_ontology_hand\"; call mcp__openbkn__search_capabilities with kn_id \"supply_ontology_hand\". Other networks cannot be queried from this s"},"verdict":"pass"}
{"check":"missing kn_id is refused where the platform schema makes it optional","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"refused":true,"refusalMatches":true,"refusal":"Error: This session is bound to OpenBKN knowledge network \"supply_ontology_hand\"; call mcp__openbkn__search_instance with kn_id \"supply_ontology_hand\". Other networks cannot be queried from this sessi"},"verdict":"pass"}
{"check":"a non-string kn_id is refused","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"refused":true,"refusalMatches":true,"refusal":"Error: This session is bound to OpenBKN knowledge network \"supply_ontology_hand\"; call mcp__openbkn__search_capabilities with kn_id \"supply_ontology_hand\". Other networks cannot be queried from this s"},"verdict":"pass"}
{"check":"cross-network kn_id is refused on execute_tool","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"refused":true,"refusalMatches":true,"refusal":"Error: This session is bound to OpenBKN knowledge network \"supply_ontology_hand\"; call mcp__openbkn__execute_tool with kn_id \"supply_ontology_hand\". Other networks cannot be queried from this session."},"verdict":"pass"}
{"check":"an excluded OpenBKN tool is refused and named","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"refused":true,"refusalMatches":true,"refusal":"Error: mcp__openbkn__list_knowledge_networks is not supported in an OpenBKN business session by this version of the bkn-dsh plugin. Do not retry it; continue with the managed OpenBKN tools."},"verdict":"pass"}
{"check":"an OpenBKN tool the plugin does not know is refused and named","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"refused":true,"refusalMatches":true,"refusal":"Error: mcp__openbkn__added_upstream_later is not supported in an OpenBKN business session by this version of the bkn-dsh plugin. Do not retry it; continue with the managed OpenBKN tools."},"verdict":"pass"}
{"check":"a second start in the same turn is refused","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"refused":true,"refusalMatches":true,"refusal":"Error: An OpenBKN interaction is already open in this turn; continue using it, or finish it with mcp__openbkn__bkn_finish_interaction first."},"verdict":"pass"}
{"check":"the bound network is allowed and reaches the tool","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"ok":true},"verdict":"pass"}
{"check":"bkn_finish_interaction closes the interaction","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"ok":true},"verdict":"pass"}
{"check":"after the interaction is finished, a managed call is refused again","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"refused":true,"refusalMatches":true,"refusal":"Error: This turn already completed its one OpenBKN interaction; no further OpenBKN access is possible in this turn. Answer from the results you already have, and let the user ask again if separate bus"},"verdict":"pass"}
{"check":"the platform recorded only the allowed call","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"interactionId":"int_200d4d89f0febb8f31b0b70e725b7822","platformOperations":["search_capabilities"]},"verdict":"pass"}
{"mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","summary":"16/16 checks passed","failed":[]}
```

</details>

<details><summary>绝对 .cmd 的 16 项与汇总</summary>

```jsonl
{"check":"the plugin mounts its guard on a real DSH agent scope","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"mounted":true,"registeredOpenBknTools":["bkn_start_interaction","search_capabilities","execute_tool","search_instance","list_knowledge_networks"]},"verdict":"pass"}
{"check":"before any interaction: a managed call is refused","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"refused":true,"refusalMatches":true,"refusal":"Error: Start mcp__openbkn__bkn_start_interaction before any OpenBKN access in this turn, then retry this call."},"verdict":"pass"}
{"check":"a host tool is refused in a bound session","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"refused":true,"refusalMatches":true,"refusal":"Error: This OpenBKN business session only permits managed OpenBKN tools."},"verdict":"pass"}
{"check":"bkn_start_interaction is allowed and opens the interaction","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"ok":true,"hasInteractionId":true},"verdict":"pass"}
{"check":"cross-network kn_id is refused","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"refused":true,"refusalMatches":true,"refusal":"Error: This session is bound to OpenBKN knowledge network \"supply_ontology_hand\"; call mcp__openbkn__search_capabilities with kn_id \"supply_ontology_hand\". Other networks cannot be queried from this s"},"verdict":"pass"}
{"check":"missing kn_id is refused on a tool whose schema requires it","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"refused":true,"refusalMatches":true,"refusal":"Error: This session is bound to OpenBKN knowledge network \"supply_ontology_hand\"; call mcp__openbkn__search_capabilities with kn_id \"supply_ontology_hand\". Other networks cannot be queried from this s"},"verdict":"pass"}
{"check":"missing kn_id is refused where the platform schema makes it optional","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"refused":true,"refusalMatches":true,"refusal":"Error: This session is bound to OpenBKN knowledge network \"supply_ontology_hand\"; call mcp__openbkn__search_instance with kn_id \"supply_ontology_hand\". Other networks cannot be queried from this sessi"},"verdict":"pass"}
{"check":"a non-string kn_id is refused","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"refused":true,"refusalMatches":true,"refusal":"Error: This session is bound to OpenBKN knowledge network \"supply_ontology_hand\"; call mcp__openbkn__search_capabilities with kn_id \"supply_ontology_hand\". Other networks cannot be queried from this s"},"verdict":"pass"}
{"check":"cross-network kn_id is refused on execute_tool","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"refused":true,"refusalMatches":true,"refusal":"Error: This session is bound to OpenBKN knowledge network \"supply_ontology_hand\"; call mcp__openbkn__execute_tool with kn_id \"supply_ontology_hand\". Other networks cannot be queried from this session."},"verdict":"pass"}
{"check":"an excluded OpenBKN tool is refused and named","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"refused":true,"refusalMatches":true,"refusal":"Error: mcp__openbkn__list_knowledge_networks is not supported in an OpenBKN business session by this version of the bkn-dsh plugin. Do not retry it; continue with the managed OpenBKN tools."},"verdict":"pass"}
{"check":"an OpenBKN tool the plugin does not know is refused and named","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"refused":true,"refusalMatches":true,"refusal":"Error: mcp__openbkn__added_upstream_later is not supported in an OpenBKN business session by this version of the bkn-dsh plugin. Do not retry it; continue with the managed OpenBKN tools."},"verdict":"pass"}
{"check":"a second start in the same turn is refused","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"refused":true,"refusalMatches":true,"refusal":"Error: An OpenBKN interaction is already open in this turn; continue using it, or finish it with mcp__openbkn__bkn_finish_interaction first."},"verdict":"pass"}
{"check":"the bound network is allowed and reaches the tool","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"ok":true},"verdict":"pass"}
{"check":"bkn_finish_interaction closes the interaction","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"ok":true},"verdict":"pass"}
{"check":"after the interaction is finished, a managed call is refused again","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"refused":true,"refusalMatches":true,"refusal":"Error: This turn already completed its one OpenBKN interaction; no further OpenBKN access is possible in this turn. Answer from the results you already have, and let the user ask again if separate bus"},"verdict":"pass"}
{"check":"the platform recorded only the allowed call","mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","observation":{"interactionId":"int_806e769a3f556e6a5d7fc3cf7d187862","platformOperations":["search_capabilities"]},"verdict":"pass"}
{"mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","summary":"16/16 checks passed","failed":[]}
```

</details>

## W3：桌面面板登录

**W3 通过。** 用户关闭面板后重开确认刷新正常【人】；agent 再次读到两个网络【界】，未重启宿主。

- 【跑】通过桌面自带 CLI 安装到独立 desktop profile；安装后、登录后两次逐文件核对均为 52 文件、tree-hash `f4e90f96d5c82e8b8c8cc505847995c6d3624f9870c58a71d7a3d010f3a5c5ad`，与候选一致。OpenBKN 配置仅 baseUrl，无 cliPath。
- 【人】【界】用户完成独立环境 DSH 宿主登录；23:49（Asia/Taipei）可访问性树显示主界面与 OpenBKN 入口。随后用户打开面板、点击“使用 OpenBKN CLI 登录并同步”，并完成浏览器授权。操作时间由下面的进程证据限定，不把人工操作回报等同于精确点击计时。
- 【跑】登录前空 BKN_CONFIG_DIR 输出仅 `{hasToken:false}`；授权后键为 baseUrl, userId, hasToken, username, expired，hasToken=true、平台匹配=true、expired=false。仅记录键、布尔值，不记录用户名、用户 ID 或 Token。插件正常同步的 OpenBKN 凭据只存在独立 DSH vault；未另存备份。
- 【界】等待时文案为“正在连接 OpenBKN…”，除 Close 外无登录、刷新或取消按钮；最终列出 supply_ontology_hand 和 worldcup_vega_catalog_bkn 共两个网络，未显示错误。
- 【跑】【界】DSH 主进程一直为 PID 22592，未重启；登录后网络自动出现。未发送模型问题、未运行 R1–R9。

### W3 时间证据（2026-10-04，Asia/Taipei）

| 时间 | 观察 |
|---|---|
| 23:55:02.436 | cmd CLI launcher 创建（PID 25712） |
| 23:55:02.471 | node CLI login 创建（PID 25240） |
| 23:55:02.916 | Chrome 授权进程创建（PID 6744）；与 CLI 创建相差约 0.444 秒，浏览器自动打开 |
| 23:55:22.932–23:55:23.018 | 两个观察器发现 CLI/launcher 已退出，退出码均为 0；观测运行时间约 20.5 秒 |
| 23:56:13 时钟读取之前 | 最近一次 UI 读取仍“正在连接 OpenBKN…”；该 UI 读取未同步记录精确时间 |
| 23:56:38 之前 | 下一次 UI 读取已列出两个网络；未重启宿主 |

**异常 W3-A1：成功登录后的面板恢复较慢。** 已观察到 CLI 成功退出后面板仍 loading，随后自动列出网络。该 UI 读取未同步计时，也未连续采样，因此不能给出精确“CLI 退出到面板恢复”或“点击到网络出现”耗时；总时间上界约 96 秒（从 CLI 创建到网络列表观察后的时钟读取），不是精确测量值，也不是整个区间都保持 loading 的证明。原因未知，不把源码解释写成实测因果。

### 桌面控制证据限制

窗口可访问性文字读取正常，但截图捕获报 `FrameArrived timed out: timed out waiting on channel`；按索引点击入口报 `coordinate input geometry is unavailable`。重新定位、激活后仍无法截图。面板操作由用户完成，agent 通过可访问性树与进程证据核对；本轮没有可用截图。这是控制工具限制，不据此判断插件失败。

进程观察每 0.4 秒一次，只保存角色、PID、创建/观察/退出时间与退出码，未保存命令行或授权码。有两个观察器同时记录 W3，表中按 PID 去重；耗时差约 0.01 秒，不把重复记录计为第二次登录。

## W4：授权异常

所有登录按钮由用户操作。W4-timeout 使用全新 `BKN_CONFIG_DIR=…/bkn-w4-timeout`（仅 hasToken:false），复用已登录的独立 DSH home 与相同候选、宿主、配置。W4-close 另有空 `BKN_CONFIG_DIR=…/bkn-w4-close`。不同时运行多个登录进程。

### W4-1 不授权 + W4-3 真实设备码超时路径

- 【人】【跑】用户于 2026-10-05 00:26 发起登录，保持不授权，不关闭面板与宿主。
- 【跑】node CLI PID 9940 创建于 00:26:14.000，launcher PID 25380 创建于 00:26:13.964；Chrome 授权进程创建于 00:26:14.527，浏览器自动打开，约 0.527 秒。
- 【跑】CLI/launcher 于 00:28:15.557 被观察到自然退出，退出码均 2；从 CLI 创建到退出观察约 **121.6 秒**（采样间隔约 0.4 秒，包含进程查询时间）。未缩短超时、未外部杀 CLI、未授权。
- **退出诊断尚未确认。** 退出码 2 不单独证明设备码过期；本轮未取得可区分 Device login timed out / Device code expired / 其他原因的真实诊断，不把源码推断算为实测。
- 【界】如下采样持续显示等待，只有 Close，没有登录、刷新、取消按钮。CLI 自然退出后面板仍 loading，Chrome PID 25400 仍在运行。

| 时间（2026-10-05，Asia/Taipei） | 距 CLI 创建 | 面板文字 | 面板按钮 |
|---|---|---|---|
| 00:27:04 | 50.2 秒 | OPENBKN；正在连接 OpenBKN… | Close |
| 00:28:13 | 119.6 秒 | OPENBKN；正在连接 OpenBKN… | Close |
| 00:29:52 | 218.0 秒 | OPENBKN；正在连接 OpenBKN… | Close |
| 00:30:32 | 258.9 秒 | OPENBKN；正在连接 OpenBKN… | Close |
| 00:31:05 | 291.7 秒 | OPENBKN；正在连接 OpenBKN… | Close |

**异常 W4-A1：CLI 自然退出后，面板未随之恢复错误或重试入口。** 00:32:52.439（距 CLI 创建 398.4 秒、距 CLI 自然退出约 277 秒）仍为 loading，只有 Close；上表及此采样只证明观察时段，不推断无限等待。

【人】【跑】用户只关闭此次授权浏览器窗口，没有授权、没有关闭面板或宿主。Chrome PID 25400 于 00:39:49.915 被观察到退出（code 0）。【界】00:40:09.332 面板已变为“无法验证 OpenBKN 连接。请检查 Token 和平台地址后重试。”，有 Close 与“重试”按钮。CLI 状态仍只有 hasToken:false。

**异常 W4-A2：未授权流程自然结束后的界面没有明确超时/过期提示。** 只显示 Token/平台地址检查的通用错误。**设备码超时具体诊断未取得**：自然退出约 121.6 秒且 code 2 已实测，未修改真实超时；但未保存授权输出，也未取得 CLI 的具体错误，不能仅据此断言 timed out 或 expired_token。W4-3 的这部分保留为未核实限制。

**原因未知。** 首轮用户关闭浏览器后才采样到错误页，但这只是时序关联。重试轮 CLI 自然结束后再读到错误页时，最近一次窗口清单仍有授权 Chrome 窗口；这条反证不支持“必须关浏览器才恢复”的结论。未连续采样两轮界面/浏览器，不能确定浏览器生命周期是原因。

**【人】【跑】重新发起已验证。** 用户点击“重试”回到登录入口，再发起登录；新的 launcher PID 22912 创建于 00:41:46.949、node CLI PID 10832 于 00:41:46.984、Chrome 授权进程于 00:41:47.482。00:42:11.275 面板再次 loading；CLI 配置仍仅 hasToken:false，目录无持久文件。新 CLI 于 00:43:48.338 自然退出，code 2，从创建到退出观察约 121.4 秒；00:57:25.628 的最终 UI 采样是同一通用连接错误及“重试”。没有授权，也没有外部杀这两个 CLI。

**不能判为 W4-3 完整通过。** 两次真实未授权流程的自然退出和最终界面已测，但 CLI 退出的具体 expired/timed-out 诊断未取得。报告保留该限制，未用模拟超时或外部终止替代。

### W4-2 授权中途关闭面板

**基础过程已实测，后续授权恢复未测。** 原轮准备的空 bkn-w4-close 未启动；当时 computer-use 输入失败，未取得关闭中途的证据。2026-10-05 补测改由用户点击 Close 和入口，agent 用可访问性树连续采样并核对进程，不冒称 agent 点击成功。截图及点击工具仍不可用，Escape 也未关闭面板。

补测重新安装相同 tgz 到独立 desktop-home-w3，配置仍只有 baseUrl，没有 cliPath。安装后与卸载前均为 52 文件、相同 tree-hash。使用全新 bkn-w4-close-guided，启动前仅 hasToken:false；整个场景未授权，结束仍只有 hasToken:false，目录无持久文件。DSH 根进程始终 PID 4356。

首个补测登录 PID 16204 创建于 08:16:22.026，08:18:23.427 自然退出 code 2。08:19:02.694–08:19:03.058 才观察到面板关闭，08:23:41 重开为登录入口。无法限定用户关闭发生在 CLI 退出前，因此不把这一轮计为中途关闭成功。

用户关闭旧授权页后，在同一未授权、无持久凭据的独立配置内重新发起登录。没有并发登录进程；下面这轮取得关闭、继续运行及登录期间重开的证据。

| 时间（2026-10-05，Asia/Taipei） | 实测证据 |
|---|---|
| 08:25:02.670 | node CLI PID 7260 创建；launcher PID 7608 创建于 08:25:02.617 |
| 08:25:03.233 | Chrome 授权进程 PID 24880 创建，距 CLI 创建约 0.563 秒；浏览器自动打开 |
| 08:25:03.345–08:25:03.361 | 面板显示“正在连接 OpenBKN…” |
| 08:25:07.439–08:25:07.456 | 已观察到面板关闭；距 CLI 创建约 4.8 秒。这是采样时刻，不是精确点击时间 |
| 08:25:22.705 | 独立进程查询确认 CLI 7260 与 DSH 4356 仍在运行，证明关闭后登录继续 |
| 08:26:30.807–08:26:30.827 | 用户重开后的面板显示“正在连接 OpenBKN…”，无第二次登录入口；进程观察器此时尚未记录 CLI 退出 |
| 08:27:04.075 | 同一 CLI/launcher 自然退出，均 code 2；CLI 创建至退出观察约 121.4 秒，无授权、无外部终止 |
| 08:27:24.938 | 进程查询确认 CLI 已退出，DSH 仍运行；这次查询在退出之后，不冒称查询当时 CLI 仍活着 |
| 08:27:40.566–08:27:40.589 | 同一面板已恢复“使用 OpenBKN CLI 登录并同步”入口；无 loading、无通用错误或明确超时提示 |

**观察结论：** 关闭面板未立即终止登录 CLI，重开时保留连接中的界面；未重启宿主。第二轮 CLI 自然结束后，最终采样为登录入口，与原 W4-timeout 的通用错误状态不同。未连续采样退出到入口恢复的整个区间，不能给出精确恢复延迟或解释根因。仍未取得 CLI 的 timed out/expired 具体诊断，不能以约 121 秒和 code 2 判定 W4-3 完整通过。

用户本轮始终未授权，因此“随后授权是否自动重开或恢复目录”未测。未对过期页面继续授权，未重新跑 W1/W2、W3 成功授权或 R1–R9。

脱敏本地证据：logs/w4-close-guided-process-events.jsonl、w4-close-guided-process-checks.jsonl、w4-close-guided-ui.jsonl；仅存 PID、角色、时间、退出码与 DSH 状态/文字，不含授权页正文、授权码、Token 或业务数据。

## 异常、未测与还原

### 异常与未核实项

| 项 | 结果与限制 |
|---|---|
| W3-A1 等待观察 | 授权 CLI code 0 后，首次读取仍 loading，随后两个网络自动出现。无同步连续 UI 计时，不能精确量延迟或断言根因 |
| W4-A1 CLI 退出与 UI 结束不同步 | 首轮 CLI 自然退出后数分钟仍 loading；只在后续观察到错误与重试。重试轮稍后也恢复错误，根因未知 |
| W4-A2 错误文案 | 未授权自然结束后是“无法验证 OpenBKN 连接。请检查 Token 和平台地址后重试。”；没有明确设备码过期/超时说明 |
| W4-2 | 用户操作配合下已测关闭后 CLI 继续、重开连接中、自然退出后回登录入口；随后授权恢复未测。工具仍不能可靠点击/截图 |
| W4-3 | 自然退出耗时、退出码、UI 和重新发起已测；具体 timed out/expired_token 诊断未取得，不能判完整通过 |
| UI 证据限制 | 可访问性文字和进程记录；没有可用截图。用户完成所有登录/授权与 W3/W4 关闭重开操作，agent 核对界面与进程；未冒称人工全面验收 |

### 安装与发布文件核对【跑】

候选及安装目录的发布文件均为 52 个；安装后、W3 登录后、最终卸载前分别核对，tree-hash 均为 f4e90f96d5c82e8b8c8cc505847995c6d3624f9870c58a71d7a3d010f3a5c5ad。所有已安装发布文件与固定候选逐字节一致；探针 node_modules junction 不计入发布文件。未构建或替换候选 lib。

### 状态与清理【跑】

- 使用独立 DSH_HOME：…/desktop-home-w3；独立 CLI：…/bkn-w3、…/bkn-w4-timeout、补测 …/bkn-w4-close-guided。bkn-w4-close 仅建空目录和读初始状态，未实际运行。未使用用户原 desktop profile 安装候选，未新增其凭据备份。
- 完成验证后，退出本轮测试 DSH；进程数 0。关闭测试宿主属于清理，发生在两次 CLI 已自然退出后，不计作超时证据。
- 独立 desktop profile 执行 plugin remove，退出 0；plugin list 没有安装包。卸载前发布文件 hash 仍一致。仅清除独立 vault 的 refs.OPENBKN_MCP_TOKEN，保留凭据文件；内存中验证其他凭据条目完全相同，未创建备份或输出凭据正文。
- W4-2 补测结束后，再次核对安装内容、退出测试 DSH 并卸载插件。首次非强制关闭未终止所有子进程，卸载遇 EPERM 文件占用；确认根 PID/可执行文件属于测试宿主后，终止其进程树，再卸载成功。发生在 CLI 自然退出及最终 UI 采样之后，不计为设备码超时证据。独立 vault 未新增 OpenBKN 引用；其他凭据条目不变。观察器已停止，CLI 测试配置为空。补测前后五个已选原用户文件哈希也均一致。
- 用户原状态以下五个已选文件的前后 SHA-256 均相同：原 desktop 的 cordis.patch.yml、package.json，原 .dsh/storages/workspace.json、.dsh/.credentials.yaml、.bkn/state.json。此结论仅覆盖已选文件，不冒称全目录逐字节比对。
- 原 CLI 最终 status：hasToken=true、平台匹配=true，键 baseUrl/expired/hasToken/userId/username；expired=true。W2 初始也为 true，两次 live 后为 false；结束时再次为 true 是本轮观测，未再次读取 Token 或重新登录，未证明当前刷新必然成功。原 CLI 的登录状态文件哈希未变；Token 可被 W2 的正常 auth token 调用刷新，未备份或还原旧 Token。
- 未修改用户/系统 PATH、CA 或代理持久设置。测试进程采用原 CA、清除代理环境变量，没有关闭 TLS 校验。
- **W3 临时 CLI 登出已完成【人】【跑】：** 用户执行 cleanup-w3-login.ps1，仅对独立 bkn-w3 运行 auth logout 并恢复终端 BKN_CONFIG_DIR。随后复核状态键 baseUrl/hasToken/userId，hasToken=false；保留 CLI 正常登出后的配置文件，没有直接删除凭据或创建备份。用户确认关闭补测授权页，进程查询也确认 Chrome PID 24880 已退出。
- 本机保留候选、探针依赖、测试 profile、脚本和脱敏证据，目录 C:/Users/kalia/bkn-verify/v4-followup。报告不含 Token、授权码、模型密钥、工具输入输出或业务正文；仅提交本报告。没有合并、发布、打 tag、移动 dist-tag、推 main/主开发/release 分支或删除受保护 release/ 分支。

## 验证范围

实际运行：W1 的四个测试和单独缺参数调用；W2 两次 live 16/16；桌面发布文件比对、登录状态、进程时间与退出码；W3 与 W4 的可访问性 UI 观察，W4-2 关闭/重开期间连续采样。用户回报：DSH/OpenBKN 授权、W3 重开刷新、未授权等待、浏览器关闭、重试登录及 W4-2 关闭重开。静态检查：源提交/宿主版本/配置、报告 git diff --check。未重跑原 R1–R9、完整插件测试、模型问题；没有声称已通过后续授权恢复、具体设备码诊断或人工全面验收。
