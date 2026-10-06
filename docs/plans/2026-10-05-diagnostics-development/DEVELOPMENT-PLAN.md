# DIAG-01 具体开发计划

## 1. 产品目标与范围

普通用户在发生问题的 DSH 中打开 OpenBKN，点击「导出诊断」，把一个脱敏 JSON 回传。支持人员可以区分安装、配置／加载、认证和连接问题，并看到每项检查的证据来源。已有错误证据不足时，面板可提供「复测连接」；用户无需编辑 YAML、找 profile、开 inspector 或复制原始日志。

完整交付必须同时做到：

1. 主组件的配置校验、模块解析或业务服务初始化失败时，诊断入口仍能打开并取得对应错误证据。
2. 已加载后的 CLI、认证、网络、Context Loader MCP 和平台目录错误按实际失败阶段记录；不由一条 401／403 推断所有权限或 Token 状态。
3. 每项结果为 `pass / fail / not-run / insufficient-evidence`。静态文件校验、运行时状态和主动连接测试分别记录，禁止合成为虚假的「一切正常」。
4. 面板说明失败阶段、诊断编号、建议操作，并可导出与之对应的安全报告。未知情况显示「诊断未完成」或「暂未定位」。
5. Windows 普通桌面版未开 inspector，以及 npm `dsh web` 可用；macOS 两种形态完成受影响回归。

边界：本轮不修复最初 -3 用户机器的未知根因，不承诺已发布 -3/-4 自动获得新能力。整个插件包或客户端入口都不可读取时，包内诊断也可能不可用，须明确降级；现有外部自检 v1 可用于安装检查，但不能替代运行时验收。也不要求诊断能修复 DSH 整体无法启动的故障。

## 2. 固定基线与开工检查

基线核对时间为 2026-10-05 12:46（Asia/Taipei）；远端 HEAD 只是当时的观察值，开工必须刷新。

| 项目 | 本计划基线 |
|---|---|
| bkn-dsh 主分支及 -4 发布源码 | `a134f5d573e11846bb6665d1c170510149d09d4d` |
| -4 版本 | `0.2.0-rc.2-openbkn.0.2.0-4` |
| npm 正式 tgz SHA-256 | `53ce847b8d884ba7f1cb43048b5e60380c0c297142671a2b9d0abbea9692a013`，52 文件 |
| 支持 DSH | `dsh-v0.2.0-rc.2` / `639ed015397290b3745d163aafe02ffee4aa3f84` |
| DSH master 观察值 | `5badb15009ae1756c3afe0ae0cef1faafc290ccc`，不是支持版本承诺 |
| OpenBKN main 观察值 | `8850188212ff51480ad7bb742b025a0ce1ce187f`，不是本机部署版本 |
| 已有验收平台／CLI线索 | 平台 0.1.5、CLI 0.1.5；本轮未重新验证运行环境，开工及验收需实测 |
| 构建工具 | pnpm `11.7.0`；Node 支持 `^22.19.0 || >=24.0.0`；优先沿用已验收 Windows Node `24.21.0` |

主开发先记录分支、commit、dirty、真实 Git root、实际加载版本及两上游新变化。不能从旧的 `fix/search-capabilities-contract` / `cc97d880…` 直接实现，也不能从一个共享 node_modules 的本地构建声称发行一致。为本任务建独立 worktree 或新 checkout，保留其他 agent 和用户修改。

上游差异重点检查加载生命周期、Typert、RemoteError 传输、CLI `auth status/token`、MCP 初始化与平台错误形态。捕获独立来源的契约 fixture 并记版本；若契约没变记录核对结论，不无故更新依赖、允许工具目录或平台。支持平台的实际服务镜像、CLI 和 `tools/list` 应在最终验收重核对。

## 3. D0：先验证最难的边界（约半天）

当前主入口顶层导入业务服务，`Config` 校验和依赖服务可能在 `apply()` 前失败；客户端的注册依赖 `remote.openbknBusinessContext`。在现有业务服务内增加 `diagnose()` 不足以覆盖这条失败路径。

首选候选方案是**同一 npm 包中的独立 Host 诊断入口 + 不依赖业务 Remote 的客户端诊断注册**，使用单独 bundle row、独立生成的 Remote 描述和最少依赖。诊断模块不得经 `src/index.ts` 的 barrel 导入主业务组件，也不得依赖 agents、tools、业务 storage 或失败组件先就绪。

这只是待验证方案。D0 必须给出以下真实 Host 证据，再冻结后续接口：

1. 无 `baseUrl` 导致主组件配置失败，诊断 row 和 UI 仍可用，报告取得该配置校验类别。
2. 在隔离测试包中损坏主入口的一个模块导入，诊断入口不跟着失败，取得模块解析类别。
3. 在主业务服务初始化阶段构造无秘密的受控失败，诊断仍可用；也测试诊断自己的依赖不可用时明确降级。
4. 最少在一个真实、未打运行时补丁且未开 inspector 的支持 Host 上验证；Windows 普通桌面版的相同门槛在 W2–W4 再验。
5. 验证取得错误的方法覆盖配置／解析阶段、没有 fiber 或服务未创建的情况；只调用现有业务服务或只检查 `fiberPhase` 不够。
6. 证明客户端的诊断入口不会被业务 Remote 的失败、等待或描述挂载阻断；独立服务可用也不代表 UI 一定可用。

优先复用公开生命周期／loader 接口。若只能读取 Cordis 内部字段（如 `_error`），将它隔离在版本锁定的适配器，检测字段和生命周期差异，失配时返回证据不足；不要把它宣传为稳定公开接口。错误必须在 Host 内投影为白名单 DTO，不能把 loader 对象或 raw Error 传给客户端。

D0 输出：`docs/evidence/diagnostics-d0.md`，包括支持版本、入口／依赖图、取得错误的时机、脱敏样例和真实场景结果；报告契约及 UI/Host 接口的固定提交。给后续开发一个可调用的最小契约和 fixture。

**D0 未通过时**：记录失败边界；列出宿主需要新增的最小接口、最低宿主版本或诊断启动器候选。不要悄悄改官方宿主、引入自动重启或以只覆盖已加载组件的版本替代完整目标。其余纯分类／导出工作可继续，但完整功能状态仍是未完成。宿主适配属于新范围，交用户决定。

## 4. 报告契约（提案，D0 后冻结）

优先沿用项目的 Typert／schema 工具，不引入第二套 RPC。下列字段和枚举是最低要求，具体类型路径由 D0 选择。

| 字段 | 约束 |
|---|---|
| `schemaVersion` | 固定报告格式版本，例如 `1`，与包版本独立 |
| `reportId`, `createdAt` | 一次诊断的随机编号、UTC 时间；面板与导出一致 |
| `target` | host 形态、OS、可验证的 DSH/CLI/插件版本；磁盘安装版本与实际加载版本分开，未知填 null |
| `mode` | `passive` 或 `active`，不得将主动请求伪装为只读文件检查 |
| `checks[]` | `id`, `stage`, `status`, `source`, `code`, `evidence`, `nextAction` |
| `stage` | installation/configuration/component/cli/authentication/network/context-loader/platform-directory/export |
| `status` | pass/fail/not-run/insufficient-evidence |
| `source` | package-files/host-runtime/observed-operation/active-request；模拟样例另标 simulated，不进入实机验收计数 |
| `code` | 本地固定类别；服务端码仅保留评审过的白名单，未知原文不能直接塞入 code |
| `evidence` | 严格白名单：布尔、版本、计数、HTTP 状态、有限退出码、耗时、配置字段名；禁止自由格式对象 |
| `coverage` | 明确未执行、证据不足和目标匹配失败，不输出全局健康保证 |

记录类别至少覆盖：配置缺失/非法、模块解析、依赖服务未就绪、存储初始化、CLI 缺失／执行失败／输出不合法、未登录、平台不匹配、认证拒绝、网络连接、TLS、超时、MCP 初始化、平台目录失败、诊断服务不可用、未知错误。

分离「观察」和「推断」：文件完整不能写成加载成功；合法 URL 不能写成地址正确；CLI `hasToken=true` 不能写成平台授权有效；`expired` 缺失属于未知到期信息，不回退为登录失败；401／403 记录阶段和经审查的服务端码，不编造根因。

## 5. D1：Host 实现

### 5.1 被动采集

- 主加载入口的独立适配器取得实际组件状态与初始化类别；记录失败尝试时间，区分当前异常、已恢复和过期记录，重试后不能继续展示旧失败为当前失败。
- 既有登录、MCP、目录请求的成功／失败边界记录安全事件。只拦截 OpenBKN 自己的操作，不能导出整个 Host logger 或会话内容。
- 事件按固定字段在捕获时脱敏，再进入有界内存缓冲（建议最多 20 项）；限制 cause 深度、数组长度、字段长度和总输出大小，处理循环 cause 与无法序列化对象。
- 默认导出不发平台请求、不调用 `auth token/login/logout/delete`，不刷新令牌、不改变凭据或配置，不靠重跑 `remoteStatus()` 得到所谓被动结果。当前 `remoteStatus()` 会同步 Token，不能直接复用为被动采集。
- 关联真正的 Host/profile/组件 entry。多个 Host 或候选目标不明确时让用户选择可识别的目标，或返回证据不足；不能静默检查错实例。

### 5.2 可选主动复测

- 单独的「复测连接」操作，仅运行本轮固定的只读检查，显示已检查的步骤；不调用模型、Interaction start 或业务工具执行。
- 复用已授权的现有 DSH 凭据访问，不把 Token 放入 Remote/UI/文件；默认不触发 CLI token 刷新和新登录。缺凭据时标记未执行并引导正常登录。
- 如实际 CLI／SDK 的现有状态查询会写状态，先验证并单独记录副作用，不能声称全程无状态变化。
- 使用有限超时（建议总预算 15 秒、单步不超过 5 秒，D0 按真实响应确定）、AbortSignal 和完整释放；每步记录耗时，前置条件失败后的检查标记 not-run。诊断取消不等同于修复此前暂缓的整个面板登录取消流程。
- MCP 复测使用受限连接生命周期，不打断正在运行的会话；只做必要 initialize/tools-list 或等效握手，并关闭自己创建的连接。目标与权限边界沿用现有配置，不扩展工具允许列表。
- 不禁用 TLS 校验，不全量输出环境变量或响应正文。

### 5.3 脱敏策略

默认保留固定类别和经过审查的字段，不导出 raw message/stack/stdout/stderr/响应正文。平台 URL 仅保留形态、是否匹配；默认不导出主机名、路径、query、userinfo 或 fragment。用户名、用户 ID、业务网络 ID 和本机绝对路径不进入报告。原始错误只在 Host 原操作处理中短暂存在，新增缓冲不能存 raw Error。

必须测试嵌套 cause、异常原文、HTTP headers、URL 参数、CLI stdout/stderr 和平台响应中的 canary。脱敏失败时该段返回 insufficient-evidence，不能以打印原文帮助调试。开发测试用明显虚构的 canary，不能读取真实凭据来做断言。

## 6. D2：客户端实现

- 注册诊断入口的依赖与业务 Remote、sessions、conversation、workspace 初始化分开；业务功能仍在原依赖就绪后挂载，保持原交互。
- 普通业务错误页增加「导出诊断」，入口在主组件不可用时进入诊断视图。提示示例：「OpenBKN 组件未能加载（配置校验）。请导出诊断报告发给支持人员。」文字只依据已取得的证据。
- 显示已验证的失败阶段、诊断编号、下一步；未知错误使用中性描述，不默认让用户重填 Token。
- 导出安全 JSON，建议文件名 `OpenBKN-diagnostic-<UTC时间>-<短编号>.json`；用户只需发送该文件，不要求复制技术对象。
- 导出读取已生成的 DTO，禁止浏览器再读取 credentials、原始配置或 Host 日志。桌面与 npm 浏览器下载分别实测，处理写入／下载失败。
- 复测有进度、有限等待和取消，不重复启动并发检查；关闭后回调不能覆盖后来一次检查结果。页面重开能区分上次结果和当前复测。
- 不在错误提示中塞入内部服务名、命令或堆栈；技术证据留在脱敏报告中。诊断自身失败时给可执行的支持途径，并明确覆盖缺失。

## 7. D3：集成、打包与测试交付

独立入口可能涉及 `package.json` exports/files、`cordis.patch.yml`、`tsdown.config.ts`、Typert 生成和客户端注册。新增诊断出口必须真实生成且进入 tgz；业务出口和原安装流程仍能工作。安装升级不得重复插入诊断 row；卸载应移除本包拥有的 row/UI，不能删用户其他配置。

建议新增测试：`diagnostics-contract.test.ts`、`diagnostics-redaction.test.ts`、`diagnostics-host.test.ts`、`diagnostics-controller.test.ts`（名称按 D0 调整）。同步已有 `bundle-contract`、`install-lifecycle`、`client-slot-contract` 和 `typert-remote-contract`。只写验证真实边界的测试，不以实现自产 mock 当唯一正确性标准。

集成 agent 提供**待实现的验收辅助脚本**：

- `prepare.ps1`：准备全新隔离目录，检查实际 Desktop CLI/profile 和 npm CLI/profile，路径或版本不明时停止。只能改本轮 test root，不得设置持久全局环境变量。
- `run-case.ps1 -CaseId <ID> -Form <desktop|npm>`：设置本轮受控故障、给出复现和撤销方式，记录无秘密的运行证据。不得悄悄结束用户 DSH。
- `collect-state-hashes.ps1`：仅返回用户同意的选定状态文件哈希，不读取或复制正文。
- `cleanup.ps1`：撤销本轮故障，停止仅本轮创建的进程，卸载仅隔离 profile 内的候选，保留脱敏证据。临时认证如需登出，只处理本轮隔离 CLI store。

脚本属于测试包，不进入 npm 产品包；主要服务 Windows agent，不要求客户执行。对于无法通过安全脚本构造的真实场景，提供短步骤和原因。不得伪造认证服务器拒绝，也不能用 mock 的 403 冒充真实权限验收。

故障注入优先改隔离配置和受控端点。模块解析／初始化失败若必须改包，只能复制候选形成受控故障变体，记录基包 SHA、修改文件和前后哈希，绝不修改原 tgz 或用户安装。变体说明明确其不再逐字节等同正常候选；取得故障证据后恢复原候选并重做正常场景。

候选交付需包括：tgz、SHA-256、逐文件清单、源码 commit/工作流 run、已填写 candidate manifest、上述脚本、固定场景步骤、报告 schema、结果模板及受影响回归步骤。候选 manifest 的空字段全部填完才能安排 Windows；新版包文件数按实际清单，不再强制为 52。

## 8. 验证与完成标准

主开发完成对应构建、类型检查、插件测试、仓库要求的 node suites、package check；再对**实际候选包**做 macOS 普通 Host 初始化故障、错误分类、导出和正常登录／列目录回归。最低 Node 22.19.0 的构建验证与 Windows 实机 Node 24.21.0 是不同证据。

Windows 逐项按 [专用任务](WINDOWS-VERIFICATION.md) 验收，至少主组件异常的关键场景在普通桌面版不开 inspector 通过。mock 的网络/TLS/超时用于开发覆盖，真实 Host 场景和真正平台授权拒绝另列，不能互相替代。

原业务回归包含 -4 登录状态兼容、绑定/工作区/溯源，以及真实 ToolRuntime 守卫（无模型）与真实平台正常连接。按仓库要求保留 G6 实际平台+模型验收；已有历史 G6 只作参考，无法执行则保留发布项未完成，不假装验收通过。模型与平台业务操作只在开发验收执行，产品诊断自身不得调用。

完成 DIAG-01 需满足：D0 门槛、脱敏与状态保护、Windows 桌面/npm 实机、macOS 受影响回归、候选身份均有证据；每个失败／未测单列原因。若遗漏关键场景，只能交付部分功能并列限制，不能默认关闭完整任务。

发布顺序沿用现有 gate：用户核对异常 → 放行相应外部步骤 → 合并后 main 彩排与验收包逐文件一致 → 新 tag/npm rc/Release → 正式包核验 → latest 最后。验收后任何包内代码、依赖或文档变动都要新候选并重跑受影响项。不得借用 -4 的验收证明新版。
