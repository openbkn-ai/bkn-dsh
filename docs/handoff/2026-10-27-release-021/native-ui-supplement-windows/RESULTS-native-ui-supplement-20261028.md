# Windows 最小使用场景补证：非空原生业务溯源（2026-10-28，续执行版）

kind=windows-native-existing-record-ui-supplement；sourceCiRun=40361613728；ciRun=null；formalAcceptanceEligible=false。

## 一、固定身份（全部核对通过）

- 文档基线 f1b4b8b6757799d1206db03d48a7f5a6d1334236（独立 checkout，首尾干净）；候选 0.2.1-rc.3-openbkn.0.2.1（27ccf15c…，82/82 两处核对）；官方 Desktop 0.2.1-rc.3 EXE fd7d298f…；任务 Node 24.19.0；Zod 4.4.3；companion mcpRc3 12/12（profile 层）；asar 内 stock MCP 758d8fc4… 收尾复核未变。
- 平台 https://192.168.50.28（0.2.0 基线）；任务作用域信任锚=平台自签叶证书（ca/platform-28.pem，TLS 正常验证）。

## 二、本轮执行与结论

### 认证（BLOCKED→已解除）
- 旧任务令牌 401（留证）；设备登录尝试 1/2 超时（300s/600s，用户未完成授权，原件保留）；**尝试 3（用户码 4tQrkkip，540s）用户完成授权成功**：`Logged in to https://192.168.50.28 as admin`，hasToken=true、expired=false。

### 前提核验：既存解释可读非空 — PASS
- detail GET 200（135,270B）；explanations GET 200（33,625B）；
- **三条非空结论**：claim:2022（2022、卡塔尔、阿根廷）/ claim:2018（2018、俄罗斯、法国）/ claim:2014（2014、巴西、德国），均 status=located、supportStatus=supported、attributionStatus=reconstructed；
- **当前问答切片 11 条关系**（pair:req:recent-three-men-worldcups：supports 6 / grounds 3 / implements 1 / uses_schema 1）；顶层证据图 242 边、execution 5 边未混入切片。与预期特征一致。原问答文本取自解释 view（question/answer 原文照录，未发新请求）。

### Desktop 实例与只读回放接入 — 首次失败（FAIL，保留）
- profile patch：仅 baseUrl=https://192.168.50.28 + 真实 CLI cliPath + 8000ms 超时；**mcpUrl 未覆写（产品默认 /api/agent-retrieval/v1/mcp/）**；无 --patch、无手动 MCP mount。
- GUI 单实例启动：PID 27072（CIM 创建 2026-10-28T05:40:50.236Z，exe=任务副本，后端 127.0.0.1:53300←27136，子树 7 进程）。
- 只读回放接入：**未找到 Windows Desktop 下的公开 Session/Workspace API 入口**（后端 53300 需 GUI 内部 token，无公开获取途径——具体缺失已记录）。改用**手写会话存储**（本机既有 zstd 多帧会话逐帧解压学习格式后构造：原问答+真实 conv/int 身份的 finish_interaction 事件，含 roundtrip 校验）——此为偏离 Mac API 路径的替代工程。
- 写入后窗口自动从欢迎页切到完整主界面（热加载，未重启）；**点击"默认工作区"行时 Desktop 渲染进程原生崩溃**（"Desktop renderer exited: crashed"，crash-2026-10-28T06-03-33-905Z-renderer.log；无 error 级渲染器控制台输出；崩溃对话框截图留证）。应用随后自行重启出第二实例（27372，非我主动重试，已留证），其主界面为空白态（仅标题栏按钮）。
- 按首次失败停止规则：未再触碰崩溃路径；对自恢复实例先尝试菜单退出（点击未生效——与此前多轮一致的菜单交互现象），后按 PID/创建 UTC/exe/监听身份核对停止全部 5 个残留进程（remaining=0、监听 0）。

### 主项（溯源面板→三结论→切片关系→结论→证据→来源→步骤/定义链）— **BLOCKED（UI 链路未到达）**
- 依赖回放会话在 UI 中打开；因上述渲染崩溃，"查看业务溯源"入口从未出现。前置的 API 级事实（三结论/11 关系/来源结构）已全部核验非空且与预期一致（见上），但**UI 展示/联动链路 0 项执行**。
- 明确：本轮**无只读回放会话成功建立、无新模型回合、无业务工具调用、无解释生成 POST**（唯一业务读取为两条 GET 200）。

### CSV 条件项 — NOT_RUN（未变）
本机无来源明确的真实业务导出 CSV 及可信基准；未装办公软件、未发查询。

## 三、收态与保全

- 系统关联：Before（8f3af673…/UserChoice 不存在）→ GUI 启动写入（After=49882de0…）→ **受限 Restore 后 restored==Before（8f3af673…）**，UserChoice 前后均不存在（未写）、无 key 删除、ACL 未动、SID 一致（"Scoped dsh association restore verified. UserChoice/ACL untouched."）。
- 进程/端口：全部任务进程收净（0/0）；菜单退出两次尝试未生效已如实记录；身份核对停止方式已注明。
- 保全：候选 82/82、companion 12/12、asar stock 758d8fc4…、EXE 哈希、checkout f1b4b8b 干净；旧任务目录/失败原件/正常授权产生的令牌与记录全部保留；日常 Chrome/安装未动；未访问 192.168.50.129；#93/#97/#2573 未动。
- 未重跑已通过项；未推送/CI/PR/tag/发布。

## 四、失败、偏差、UNKNOWN 与最小后续

1. **渲染崩溃（首次失败，保留）**：手写会话存储回放 → 点击工作区行 → 渲染进程原生崩溃。根因 UNKNOWN（无 JS 错误输出；可能是会话事件结构不完整导致渲染异常，但未证实——不猜测）。该失败属我方测试接入工程（非 API 路径），**不判定为候选/UI 缺陷**。
2. **接入路径缺失（具体报告）**：Windows Desktop 无公开 Session/Workspace API 入口（后端 token 内部持有）；Mac 轮的 API 回放路径在 Windows 不可直接复用。
3. 口径更正：上一版报告"主项 BLOCKED（认证）"已由本轮登录成功解除并推进到回放接入层；两版报告与全部原件并存，未覆盖。
4. 最小后续建议（不扩大范围）：由主会话提供 Windows 可用的会话注入途径（或授权使用后端 API token 获取方式/官方回放工具）；或改在 npm/Web 形态（有后端 URL+token）复刻 Mac 轮 API 回放——需另行授权。崩溃转储/日志已保留可供 DSH 侧分析（renderer crash 与手写会话的关联）。

## 五、产物（仅本机，未推送）

- 报告：results/RESULTS-native-ui-supplement-20261028.md（本文件，续执行版）；manifest：results/evidence-manifest.json
- 关键私有原件：private/login-attempt{1,2}-timeout.log、login-attempt3-success.log、operations.json、9fcb294d/e72c6fff.json（API 原文）、replay-session.jsonl（手写回放全量）、electron-user-data/logs/crash-*-renderer.log、evidence/*（窗口截图序列）、evidence/system-association/{before,after,restored}。

---

## 六、重排查与最终判定（2026-10-28 晚，最终版）

### 6.1 渲染崩溃根因（第四节第 1 条结案：全部为测试工程缺陷，非候选缺陷）

按用户指示"重新排查 blocked 和 fail"逐项复查，确认 4 个复合根因，均在**我方测试接入侧**：

1. **会话文件编码格式错误**：此前单帧无校验和 zstd；官方 `dsh-session-persistence-jsonl` 为 2 帧拼接（帧1=精确 header 行、帧2=以 \n 结尾的事件批次），每帧 `ZSTD_c_checksumFlag=1`。已按 `zstd-enc2.mjs` 重编码（源码级核对 scanZstdFrames/compressZstdFrame/encodeMaterialization）。
2. **帧拼接乱序**：shell 字典序 glob（f0,f1,f10,f11,…,f2）打乱事件序（"seq gap expected 3 got 22"）；改为数值范围循环重拼（private/sframes/f0..f45.jsonl → private/fork3-evt.json）。
3. **delivery marker 引用旧会话 ID**（"delivery marker names the wrong Session"）：事件内 OLD_SID → 新 sid session-c4d2ce28-9bca-40d1-8c9e-daadd0e3151e 补丁。
4. **profile bundles 缺插件**：package.json `dsh.profile.bundles` 未含 `@openbkn/dsh-business-context` → 插件从未加载（无 autoload、无溯源条目）。补齐后三组件加载。

另：首次崩溃后残留的 electron-user-data 导致空白窗，隔离至 private/isolation-round2/pre-fork-home/ 后重建。分叉会话 = 真实 .129 成功会话（f17e43ee）按数值序重组 + 最小补丁（新旧 INT/CONV ID 映射至 int_f35935e702d1a01c91e42253f881e02c / conv_2e0aca17afb184e741447d01b611175e、问题文本、会话 ID）；答案正文未改写（溯源按 INT ID 从平台实时读取，不依赖本地答案文本）。

### 6.2 主项重执行 — **PASS（UI 链路全通，两项小偏差如实记录）**

**实例 4（PID 12228）**：会话自动恢复（窗口标题"产品需求预测记录查询"），答案消息操作行渲染**"查看业务溯源"按钮**（final-bottom.png，AX 元素 51）→ 面板打开（事件链/证据链页签、回答结论头部）。但原生读取提示 `nativeAuthRequired`（"原生溯源读取需要重新登录"），本地记录结构可见而 claims 不渲染。

根因（第 5 个，同为环境侧）：插件经 `<cliPath> auth token` 子进程取 token（继承宿主 env，源码核对 openbkn-cli-subprocess.ts）；OpenBKN CLI 0.2.0 以 **`BKN_CONFIG_DIR`** 定位配置（sdk dist 反查确认）。实例 4 未设该变量 → CLI 落到默认用户目录（未登录）。隔离 cli-config（第 3 次登录 admin）实测 `auth token` exit=0、`auth status --json` hasToken=true/expired=false。

**实例 5（PID 10660，2026-10-28T13:17:11Z）**：以 DSH_HOME + BKN_CONFIG_DIR + NODE_EXTRA_CA_CERTS(平台叶证书) + BKN_SKIP_VERSION_CHECK 同参数重启（launch-gui-5.ps1 留档），同会话自动恢复。点"查看业务溯源"后**原生读取成功**，以下全部经真实产品 UI（AX 树 + 截图双证）核对：

- **三条结论精确渲染**：claim:2014（2014、巴西、德国）/ claim:2018（2018、俄罗斯、法国）/ claim:2022（2022、卡塔尔、阿根廷），各带 `located · supported · reconstructed` 三态标签（r5-evidence-scrolled.png，AX 元素 323/333/343）——与第二节 API 值逐字段一致。
- **当前切片 11 条关系标识逐条一致**：evidence:op_9003052b…:1→claim:{2014,2018,2022} ×3、schema:object:worldcup_vega_catalog_bkn:tournaments→claim:{2014,2018,2022} ×3、bf:query-tournaments→claim:{2022,2018,2014} ×3、step:op_9003052b…:1→bf:query-tournaments ×1、bf:query-tournaments→schema:…:tournaments ×1（AX 全量去重清点=11）。顶层大图未混入。
- **claim→步骤/定义链**：选中 claim:2022 → 详情出现"业务执行步骤：query_object_instance · 尝试 1"与"业务定义与来源：世界杯赛事"；操作描述"对 tournaments 对象执行实例查询，返回最多 100 条记录并展开 4 个属性 tournament_name、year、host_country、winner"（r5-claim-2022-selected.png）。事件链视图显示执行节点 query_object_instance · completed · 尝试 1 · 297ms · 2026-10-12T13:21:44.828053Z；点击"查看关联"后 AX 无变化 = 引用节点即当前选中节点（r5-step-nav.png）。
- **证据来源披露**：证据节点"查询业务对象 supported"展开为精确平台标识 `evidence:op_9003052b211de5d98b3e32813aea99f2:1`（操作引用+尝试号，r5-evidence-expanded.png）；步骤引用 `step:op_9003052b…:1` 同现。
- **未披露引用保持提示**：4 个 notice span（fact:c63b3c1b…、fact:27d9dda5…、question ×2）+ "部分引用端点未披露；保留引用记录，不补造节点或关系。"；关联口径提示"关联仅依据平台明确披露的标识。candidate / unbound / missing 或 partial 不代表结论已核实"。
- **平台状态**：completed · 证据 complete · 归因 ready；输入节点"业务查询条件 2022年男子世界杯"。

**两项小偏差（不重试，如实记录）**：
1. #7 严格语义（schema 引用点击后强制切回证据视图）在 Desktop AX 层表现为 no_change（关联链接作用于详情区选择；视觉描边见 r5-schema-nav.png）；npm/Web 形态的该跳转已由 Mac 轮验证，Desktop 未在 AX 层复现 tab 切换。
2. 会话答案正文仍为 .129 原文（仅问题文本/ID 补丁）——已在 6.1 声明，不影响按 INT ID 的实时溯源读取。

本轮仍**无新模型回合、无业务工具调用、无解释生成 POST**；面板打开为 GET-only 实时读取（MCP 产品默认路径）。

### 6.3 CSV 条件项 — 维持 NOT_RUN（未变）

### 6.4 收态复核（最终）

- **菜单退出两次生效**：实例 4（12228）与实例 5（10660）均经 应用菜单→退出 正常退出（menu-exit-open.png + 进程核对 GONE、无 DeepSeek 残留进程）——第四节第 3 条"菜单退出未生效"现象在本轮两实例中未复现，系当次状态特例。
- **注册表**：实例 5 后补一轮完整 Before→After→Restore（evidence/system-association-post5/）：After unchanged=True（19:49 Restore 已恢复基线、实例 5 重写同值）、Restore 验证通过、UserChoice/ACL 未动；before/handler.reg == restored/handler.reg（字节级）。
- **保全复核**：候选 82/82（verify-candidate.mjs，哈希全对、无多余文件）；companion mcpRc3 12/12（verify-companion.mjs，含 protected entry b3cd7156…）；文档基线 checkout f1b4b8b 干净（git status 空）。
- 任务进程/端口收净；旧目录、失败原件、.28 令牌与记录保留；未推送/CI/PR/tag/发布；#93/#97/#2573 未动。

### 6.5 最终判定

| 项 | 判定 |
|---|---|
| 主项（入口→三结论→11 切片关系→结论→证据→来源→步骤/定义链） | **PASS**（6.2，两项小偏差已记录） |
| 前提 API 核验（detail/explanations GET 200） | PASS（第二节） |
| 认证 | PASS（尝试 3，admin） |
| 首次回放接入失败（渲染崩溃） | 已结案：5 项测试工程根因（6.1），非候选缺陷 |
| CSV 条件项 | NOT_RUN（无真实 CSV+基准） |

### 6.6 本节新增产物（仅本机，未推送）

- evidence/r5-{started,prov-panel-open,claim-2022-selected,step-nav,evidence-tab,evidence-scrolled,evidence-expanded,schema-nav}.png、menu-exit-open.png、final-started/final-bottom/prov-*（实例 4 序列）
- results/gui-identity-{2,3,4,5}.txt、launch-gui-5.ps1、zstd-enc2.mjs、verify-candidate.mjs、verify-companion.mjs
- private/fork{,2,3}-{hdr,evt}.json、fork-meta.json、sframes/f0..f45.jsonl、isolation-round2/
- evidence/system-association-post5/{before,after,restore-check,restored}/

