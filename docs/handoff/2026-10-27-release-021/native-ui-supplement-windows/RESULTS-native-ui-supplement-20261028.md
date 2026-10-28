# Windows 最小使用场景补证：非空原生业务溯源（2026-10-28，续执行版）

kind=windows-native-existing-record-ui-supplement；sourceCiRun=40361613728；ciRun=null；formalAcceptanceEligible=false。


## 零、主会话接收结论与公开副本更正（2026-10-28）

本公开副本只作口径和脱敏更正，没有新执行、Host 启动、平台调用或候选修改。原收到的结果提交为 `6f28da4335380472dabab3315dafae702e8ff4d9`；原始报告/清单摘要保留在修订后的 manifest，Windows 私有原件和既有 Git 历史不重写。旧提交中已经公开的内容不因本次更正而被清除。

- **有界接收：** Windows rc.3 Desktop 对指定既存记录的原生读取、三条结论、当前问答切片十一条关系和主要来源/步骤/定义展示，按远程回执接收为 PASS_WITH_LIMITS。
- **未证子项：** schema 引用强制切换到证据视图保持 UNKNOWN；本地回放正文来自另一条旧会话，不能证明答案归因绑定。
- **原因边界：** 已识别的会话格式、帧序、引用、组件配置和 CLI 环境错误已修正；早期原生崩溃唯一根因仍未定。采用直接存储构造和多个实例是后续排查的扩展，不冒充最初的公开 API / 单次启动流程通过。
- **证据范围：** 主会话核对了收到的六个 Git 文件、报告摘要及公开校验输出；Windows 私有 AX、截图、崩溃和注册表原件未取回。清单是 **206 条私有文件 SHA256 + 1 条说明**，不是 207 条文件摘要。
- **公开脱敏：** 授权用户码、账号、内网地址、完整 Interaction/Conversation/Operation/Session 身份及原业务值不在本副本披露；占位符只表示原件中的引用，不是实际可请求身份。
- **剩余状态：** CSV 仍 NOT_RUN，formalAcceptanceEligible=false 保留；不外推新模型端到端、全部 Windows 形态或平台 0.2.1。#93/#97 已关闭，#2573 现由维护者明确指派 leecky，本次不改变任何 issue 状态或阶段。

下文首次 FAIL/BLOCKED、旧“当时未推送”等检查点按发生顺序保留；最终接收口径以本节和第 6.5 节为准，不用后续成功覆盖首个失败。

## 一、固定身份（全部核对通过）

- 文档基线 f1b4b8b6757799d1206db03d48a7f5a6d1334236（独立 checkout，首尾干净）；候选 0.2.1-rc.3-openbkn.0.2.1（27ccf15c…，82/82 两处核对）；官方 Desktop 0.2.1-rc.3 EXE fd7d298f…；任务 Node 24.19.0；Zod 4.4.3；companion mcpRc3 12/12（profile 层）；asar 内 stock MCP 758d8fc4… 收尾复核未变。
- 平台 PLATFORM_EE（0.2.0 基线）；任务作用域信任锚=平台自签叶证书（ca/platform-28.pem，TLS 正常验证）。

## 二、本轮执行与结论

### 认证（BLOCKED→已解除）
- 旧任务令牌 401（留证）；设备登录尝试 1/2 超时（300s/600s，用户未完成授权，原件保留）；**尝试 3（用户码 [REDACTED]，540s）用户完成授权成功**：`Logged in to PLATFORM_EE as [TASK_ACCOUNT]`，hasToken=true、expired=false。

### 前提核验：既存解释可读非空 — PASS
- detail 与 explanations 均报告 GET 200。原报告包含 33,625B / 135,270B 两组大小，但端点对应标签与主会话既有记录相反；Windows 私有原件未取回，分别的字节数保持 UNKNOWN，不用 Mac 数值代填。
- **三条非空结论**：claim:2022（业务值原文仅留 Windows 私有原件）/ claim:2018（业务值原文仅留 Windows 私有原件）/ claim:2014（业务值原文仅留 Windows 私有原件），均 status=located、supportStatus=supported、attributionStatus=reconstructed；
- **当前问答切片 11 条关系**（pair:req:recent-three-men-worldcups：supports 6 / grounds 3 / implements 1 / uses_schema 1）；顶层证据图 242 边、execution 5 边未混入切片。与预期特征一致。平台问答来自解释 view；最终本地回放答案仍沿用另一条旧会话正文，两者不得视为同一份正文或真实归因绑定。

### Desktop 实例与只读回放接入 — 首次失败检查点（FAIL，保留）
- profile patch：仅 baseUrl=PLATFORM_EE + 真实 CLI cliPath + 8000ms 超时；**mcpUrl 未覆写（产品默认 /api/agent-retrieval/v1/mcp/）**；无 --patch、无手动 MCP mount。
- 首次任务 GUI 启动：PID 27072（CIM 创建 2026-10-28T05:40:50.236Z，exe=任务副本，后端 127.0.0.1:53300←27136，子树 7 进程）。
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
- 保全：候选 82/82、companion 12/12、asar stock 758d8fc4…、EXE 哈希、checkout f1b4b8b 干净；旧任务目录/失败原件/正常授权产生的令牌与记录全部保留；日常 Chrome/安装未动；未访问 PLATFORM_SOURCE；#93/#97/#2573 未动。
- 未重跑已通过项；未推送/CI/PR/tag/发布。

## 四、失败、偏差、UNKNOWN 与最小后续

1. **渲染崩溃（首次失败，保留）**：手写会话存储回放 → 点击工作区行 → 渲染进程原生崩溃。根因 UNKNOWN（无 JS 错误输出；可能是会话事件结构不完整导致渲染异常，但未证实——不猜测）。该失败属我方测试接入工程（非 API 路径），**不判定为候选/UI 缺陷**。
2. **接入路径缺失（具体报告）**：Windows Desktop 无公开 Session/Workspace API 入口（后端 token 内部持有）；Mac 轮的 API 回放路径在 Windows 不可直接复用。
3. 口径更正：上一版报告"主项 BLOCKED（认证）"已由本轮登录成功解除并推进到回放接入层；两版报告与全部原件并存，未覆盖。
4. 最小后续建议（不扩大范围）：由主会话提供 Windows 可用的会话注入途径（或授权使用后端 API token 获取方式/官方回放工具）；或改在 npm/Web 形态（有后端 URL+token）复刻 Mac 轮 API 回放——需另行授权。崩溃转储/日志已保留可供 DSH 侧分析（renderer crash 与手写会话的关联）。

## 五、首次执行检查点的产物（当时仅本机，未推送）

- 报告：results/RESULTS-native-ui-supplement-20261028.md（本文件，续执行版）；manifest：results/evidence-manifest.json
- 关键私有原件：private/login-attempt{1,2}-timeout.log、login-attempt3-success.log、operations.json、9fcb294d/e72c6fff.json（API 原文）、replay-session.jsonl（手写回放全量）、electron-user-data/logs/crash-*-renderer.log、evidence/*（窗口截图序列）、evidence/system-association/{before,after,restored}。

---

## 六、后续重排查与远程执行结果（2026-10-28；主会话接收边界见第零节）

### 6.1 已修正的测试接入问题与仍未确定的原生崩溃原因

远程报告记载，后续按用户指示重新排查并修正了以下四类测试接入问题。这些问题与修正后的成功观察均保留；不能据此确定早期原生渲染崩溃的唯一根因，也不能排除候选或 Host 的其他因素。

1. **会话文件编码格式错误**：此前单帧无校验和 zstd；官方 `dsh-session-persistence-jsonl` 为 2 帧拼接（帧1=精确 header 行、帧2=以 \n 结尾的事件批次），每帧 `ZSTD_c_checksumFlag=1`。已按 `zstd-enc2.mjs` 重编码（源码级核对 scanZstdFrames/compressZstdFrame/encodeMaterialization）。
2. **帧拼接乱序**：shell 字典序 glob（f0,f1,f10,f11,…,f2）打乱事件序（"seq gap expected 3 got 22"）；改为数值范围循环重拼（private/sframes/f0..f45.jsonl → private/fork3-evt.json）。
3. **delivery marker 引用旧会话 ID**（"delivery marker names the wrong Session"）：事件内 OLD_SID → 新 sid [TASK_SESSION] 补丁。
4. **profile bundles 缺插件**：package.json `dsh.profile.bundles` 未含 `@openbkn/dsh-business-context` → 插件从未加载（无 autoload、无溯源条目）。补齐后三组件加载。

另：首次崩溃后残留的 electron-user-data 导致空白窗，隔离至 private/isolation-round2/pre-fork-home/ 后重建。分叉会话 = 真实 原会话平台 成功会话（[SOURCE_SESSION]）按数值序重组 + 最小补丁（新旧 INT/CONV ID 映射至 [TARGET_INTERACTION] / [TARGET_CONVERSATION]、问题文本、会话 ID）；答案正文未改写（溯源按 INT ID 从平台实时读取，不依赖本地答案文本）。

### 6.2 主项重执行 — **PASS_WITH_LIMITS（主要读取/展示通过；schema 强制切换证据不足）**

**实例 4（PID 12228）**：会话自动恢复（窗口标题"[旧会话标题已隐去]"），答案消息操作行渲染**"查看业务溯源"按钮**（final-bottom.png，AX 元素 51）→ 面板打开（事件链/证据链页签、回答结论头部）。但原生读取提示 `nativeAuthRequired`（"原生溯源读取需要重新登录"），本地记录结构可见而 claims 不渲染。

已确认的第 5 项任务环境问题（不代表崩溃归因）：插件经 `<cliPath> auth token` 子进程取 token（继承宿主 env，源码核对 openbkn-cli-subprocess.ts）；OpenBKN CLI 0.2.0 以 **`BKN_CONFIG_DIR`** 定位配置（sdk dist 反查确认）。实例 4 未设该变量 → CLI 落到默认用户目录（未登录）。隔离 cli-config（第 3 次登录 [TASK_ACCOUNT]）实测 `auth token` exit=0、`auth status --json` hasToken=true/expired=false。

**实例 5（PID 10660，2026-10-28T13:17:11Z）**：以 DSH_HOME + BKN_CONFIG_DIR + NODE_EXTRA_CA_CERTS(平台叶证书) + BKN_SKIP_VERSION_CHECK 同参数重启（launch-gui-5.ps1 留档），同会话自动恢复。点"查看业务溯源"后**原生读取成功**，以下是 Windows 执行者基于实际产品 UI、AX 和截图的观察回执；主会话未取回私有原件逐项独立复核：

- **三条结论精确渲染**：claim:2014（业务值原文仅留 Windows 私有原件）/ claim:2018（业务值原文仅留 Windows 私有原件）/ claim:2022（业务值原文仅留 Windows 私有原件），各带 `located · supported · reconstructed` 三态标签（r5-evidence-scrolled.png，AX 元素 323/333/343）——与第二节 API 值逐字段一致。
- **当前切片 11 条关系标识逐条一致**：evidence:[TARGET_OPERATION]:1→claim:{2014,2018,2022} ×3、schema:object:[KN]:tournaments→claim:{2014,2018,2022} ×3、bf:query-tournaments→claim:{2022,2018,2014} ×3、step:[TARGET_OPERATION]:1→bf:query-tournaments ×1、bf:query-tournaments→schema:…:tournaments ×1（AX 全量去重清点=11）。顶层大图未混入。
- **claim→步骤/定义链**：选中 claim:2022 → 详情出现"业务执行步骤：query_object_instance · 尝试 1"与"业务定义与来源：世界杯赛事"；操作描述"对 tournaments 对象执行实例查询，返回最多 100 条记录并展开 4 个属性 tournament_name、year、host_country、winner"（r5-claim-2022-selected.png）。事件链视图显示执行节点 query_object_instance · completed · 尝试 1 · 297ms · [EXISTING_EVENT_TIME]；点击"查看关联"后 AX 无变化；仅保留这一观察，不据此推断必然是当前已选节点（r5-step-nav.png）。
- **证据来源披露**：证据节点"查询业务对象 supported"展开为精确平台标识 `evidence:[TARGET_OPERATION]:1`（操作引用+尝试号，r5-evidence-expanded.png）；步骤引用 `step:[TARGET_OPERATION]:1` 同现。
- **未披露引用保持提示**：4 个 notice span（fact:c63b3c1b…、fact:27d9dda5…、question ×2）+ "部分引用端点未披露；保留引用记录，不补造节点或关系。"；关联口径提示"关联仅依据平台明确披露的标识。candidate / unbound / missing 或 partial 不代表结论已核实"。
- **平台状态**：completed · 证据 complete · 归因 ready；输入节点为业务查询条件，具体业务值保留在私有原件。

**两项必须保留的验证边界（不重试）**：
1. #7 schema 引用强制切回证据视图：Windows AX 报告 no_change，保留为 INSUFFICIENT_EVIDENCE / UNKNOWN，不记为 Windows PASS。源码要求该引用切换到证据视图；不能把“只作用于详情选择”当作已证实的 Desktop 设计差异，也不以 Mac/npm-Web 结果补记 Windows 通过。
2. 本地答案仍来自另一条旧会话，仅问题文本及 ID 作了测试补丁。本轮只证明目标 Interaction 的读取、展示和关联；不证明本地答案与目标记录的归因绑定，不是新的模型端到端回合。

本轮仍**无新模型回合、无业务工具调用、无解释生成 POST**；面板打开为 GET-only 实时读取（MCP 产品默认路径）。

### 6.3 CSV 条件项 — 维持 NOT_RUN（未变）

### 6.4 收态复核（最终）

- **菜单退出两次生效**：实例 4（12228）与实例 5（10660）均经 应用菜单→退出 正常退出（menu-exit-open.png + 进程核对 GONE、无 DeepSeek 残留进程）——仅说明这两个后续实例观察到正常退出；不推断早期退出失败原因，也不覆盖其失败记录。
- **注册表**：实例 5 后补一轮完整 Before→After→Restore（evidence/system-association-post5/）：After unchanged=True（19:49 Restore 已恢复基线、实例 5 重写同值）、Restore 验证通过、UserChoice/ACL 未动；before/handler.reg == restored/handler.reg（字节级）。
- **保全复核**：候选 82/82（verify-candidate.mjs，哈希全对、无多余文件）；companion mcpRc3 12/12（verify-companion.mjs，含 protected entry b3cd7156…）；文档基线 checkout f1b4b8b 干净（git status 空）。
- 任务进程/端口收净；旧目录、失败原件、目标企业平台 令牌与记录保留；未推送/CI/PR/tag/发布；#93/#97/#2573 未动。

### 6.5 最终判定

| 项 | 判定 |
|---|---|
| 指定既存记录的入口、原生读取、三结论、11 切片关系与主要证据/步骤/定义展示 | **PASS_WITH_LIMITS**（按远程回执接收；严格点击/视图切换不统称全通过） |
| schema 引用强制视图切换 | INSUFFICIENT_EVIDENCE / UNKNOWN（不以 Mac 结果补记） |
| 本地答案与目标平台记录的归因绑定 | NOT_VALIDATED（正文来自另一条旧会话） |
| 前提 API 核验（detail/explanations GET 200） | PASS（第二节） |
| 认证 | PASS（尝试 3，[TASK_ACCOUNT]） |
| 已识别的测试接入/环境错误 | 已修正并有后续成功观察；不是公开 Session/Workspace API 路径证明 |
| 早期原生渲染崩溃的唯一根因 | UNKNOWN（原件保留；不宣称候选或 Host 已被排除） |
| CSV 条件项 | NOT_RUN（无真实 CSV+基准） |

### 6.6 后续执行检查点新增的私有产物（当时未推送）

- evidence/r5-{started,prov-panel-open,claim-2022-selected,step-nav,evidence-tab,evidence-scrolled,evidence-expanded,schema-nav}.png、menu-exit-open.png、final-started/final-bottom/prov-*（实例 4 序列）
- results/gui-identity-{2,3,4,5}.txt、launch-gui-5.ps1、zstd-enc2.mjs、verify-candidate.mjs、verify-companion.mjs
- private/fork{,2,3}-{hdr,evt}.json、fork-meta.json、sframes/f0..f45.jsonl、isolation-round2/
- evidence/system-association-post5/{before,after,restore-check,restored}/

