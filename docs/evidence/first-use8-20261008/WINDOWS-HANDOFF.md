# Windows：-8 首次使用验收

状态：交接草案，**固定 CI 身份仍为 PENDING，当前不能开测**。主开发填齐下表并推送后再执行。本轮只覆盖 [首次使用计划](../../plans/2026-10-08-plugin-first-use-quick-fix.md) A0–A5/F0–F8，不做旧版本升级，不继承 -7 的通过结论，不发布、打 tag 或改 npm dist-tag。

## 1. 固定输入与取得候选

| 身份 | 值 |
|---|---|
| 仓库/开发分支 | `openbkn-ai/bkn-dsh` / `fix/plugin-first-use-8` |
| 交接固定 commit（执行时 checkout 此值） | **PENDING** |
| 候选源码完整 commit | **PENDING** |
| 插件版本 | `0.2.0-rc.2-openbkn.0.2.0-8`（待 CI 确认） |
| `release-plugin.yml` run / `publish` | **PENDING** / 必须 `false` |
| CI artifact | `plugin-tarball` |
| tgz 下载后绝对路径 / 字节数 / 完整 SHA-256 | **PENDING** |
| 逐文件清单路径 / SHA-256 / 文件数 | **PENDING**（预计 66，以固定 CI 清单为准） |
| 受支持 DSH / Node / pnpm | `0.2.0-rc.2` / `^22.19.0 || >=24.0.0` / `11.7.0` |
| 本次实际 OpenBKN 平台、CLI 版本与路径 | 执行侧记录；0.1.5 平台推荐 CLI `@openbkn/bkn-sdk@0.1.5` |

从远端固定交接 commit 获取本文和逐文件清单；从指定 run 获取 tgz。不要用本地 pack、旧 -7 kit 或当时的 `latest` 代替固定 CI 包。

```powershell
$FirstUse8Run = 'PENDING' # 主开发填定值后执行
$FirstUse8Download = 'C:\bkn-verify\first-use8-download'
if ($FirstUse8Run -eq 'PENDING') { throw 'Fixed CI identity is not ready' }
gh run view $FirstUse8Run --repo openbkn-ai/bkn-dsh --json headSha,conclusion,event,url
gh run download $FirstUse8Run --repo openbkn-ai/bkn-dsh --name plugin-tarball --dir $FirstUse8Download
# 按表中固定路径选择唯一 tgz；Get-FileHash -Algorithm SHA256 与字节数均须匹配。
```

每形态安装后将实际 `profiles/<profile>/node_modules/@openbkn/dsh-business-context` 与固定清单逐件比对 SHA、字节数，记录 missing/diff/extra，三者必须空；清单 `package/` 前缀对应安装包目录。留存安装后的 package.json 版本、实际绝对路径、三 row。CLI 版本和包内容一致不能替代真正启动对应 Host。

## 2. 开测前与隔离启动

1. **先采集日常/保护文件 before 内容哈希。** 可复用上一轮最终的 37 路径清单，但重新记录唯一文件数、存在/缺失状态，after 用同一清单。只存路径/SHA，不提交配置内容；证明仅限这份清单。保留旧轮原件。
2. 三形态分别用全新 root：`C:\bkn-verify\first-use8-desktop`、`...-npm`、`...-source`；各自独立 `dsh-home` 与空 `bkn-config`，证据放 root 外。**不预写插件 YAML、不预置 baseUrl、不预登录 CLI、不复制 Token。** Desktop 新 profile 先由真实官方应用初始化并退出，再安装固定包。
3. 可复用仓库 `scripts/windows-verification/prepare.ps1` 的两形态安装隔离，以及已验证 helper 的状态哈希/进程身份检查；记录所用文件 commit/SHA。**F0–F6 不用 `run-case.ps1` 启动**：它会预写配置/覆盖 patch，破坏首次使用与保留测试。`cleanup.ps1` 会消费 PID 文件并重装包，执行前保存所有 `.pid`/`.children.pid` 原件，F8 卸载取证完成前也不能调用它。
4. Desktop 必须启动真实 `DeepSeek Harness.exe`，npm 必须启动独立官方 npm CLI 的 `dsh.cmd web`；每轮显式设置对应 `DSH_HOME`、`BKN_CONFIG_DIR`。记录创建时间、可执行路径、profile、端口、父/子 PID；不启用 inspector，不把选择桌面 CLI 当 Desktop 验收。
5. 自签平台可复用已核对指纹的 CA，通过 `NODE_EXTRA_CA_CERTS` 传给该 Host；不用关闭 TLS 校验，不改变系统信任。浏览器证书/授权由正常用户流程完成。Host 启动日志可能含 launch token，保留私有原件，提交前脱敏。

安全原生 stdout/stderr/退出码必须存档。PowerShell 用 `*>&1` 捕获全部流；若与脚本内部 `ErrorActionPreference='Stop'` 冲突，在独立 `powershell.exe -NoProfile -ExecutionPolicy Bypass -File ...` 子进程运行，再由外层捕获，**不要改 helper**。PS5.1 的重编码/BOM记录清楚，不把重编码分析副本叫原始字节。原生输出为空、失败或 skip 均不能算 pass。

## 3. Desktop/npm：各执行 F0–F8

| 项 | 操作 | 通过条件与最少原件 |
|---|---|---|
| F0 待配置 | 固定包安装后开启 Host，点唯一 OpenBKN 侧栏入口，打开右上角诊断并导出 | 三 row 均存在；无“缺 baseUrl 导致启用失败”；直接地址表单、设置/诊断可用。业务 entry 可以 `pass/component-loaded`，配置及 CLI/auth/context/directory 为 `not-run/configuration-required`，不能把未执行连接写全绿。留 UI、产品 JSON、安装清单、初始 patch SHA |
| F1 校验 | UI 空提交、`ht!tp://not a valid url with spaces`、`file:///C:/test`、`relative/path`；随后已有合法地址时再提交非法值 | 就地提示/输入保留，前后 patch 字节 SHA 不变，无由保存触发的下游请求。另在**独立故障 root**写非法持久化地址并重启：`business-entry fail/configuration-invalid/configField=baseUrl`，诊断独立；不要把未提交表单错当组件故障 |
| F2 保存/重启 | 从 F0 表单保存合法地址，高级设置填真实非默认 `openbkn.cmd` 绝对路径；保存前后记录该 profile patch；重启读设置 | 调用能正常返回、业务按普通重载、面板/配置 RPC/诊断仍在；保存到实际当前 profile；其他字段保留；无自动假连接成功。另在隔离测试条目加入无敏感的其他高级字段验证保留，并与“F0 无预设 YAML”分轮记录。更高层 override 若实际可构造，拒绝必须明确且不写入；不可构造记录 not-run |
| F3 CLI/授权/401 | UI 填不存在的 CLI 路径 → 缺 CLI 提示 → 设置真实路径 → 面板“使用 OpenBKN CLI 登录并同步”正常设备授权；授权后列网。再按已验证 R1 auth-token fixture 仅注入公开无效 token，保留 store，点击产品重登 | first unauthorized 原件明确；CLI 成功授权 exit 0 才恢复，不能 fake login/手删故障 flag。同 Host `context-loader auth-rejected/httpStatus=401` → 实际授权/同步 → 成功恢复、`recovered=true` 历史保留。fixture 是受控输入，真实登录与恢复分别判定；原 patch 最终字节还原。没有授权条件记 not-run，不复制他端 token |
| F4 失败保留 | 对同一测试平台无 CA 一轮 → 恢复 CA；使用不可达地址一轮。403 仅有真实已授权测试条件时执行 | TLS/网络分类准确、设置/诊断可用、已保存地址不清空；恢复后报告当前失败更新。401 可重登指导，403 不保证同账号重登恢复。没有真实 403 条件记 not-run，不创建/修改平台账号 |
| F5 旧请求 | 读取/登录未完成时关闭，等待原请求结束；关闭后再打开/刷新；保存引起重载时观察旧请求返回 | 已关闭面板不被旧结果重开；新配置/状态不被旧返回覆盖。UI 时间记录与实际事件一致。关闭不宣称取消浏览器 OAuth；若未赶到可控延迟窗口，记未实测，不凭单测补 pass |
| F6 地址变更 | 空闲时通过 UI 改为已知未授权测试地址（可用保留域 `https://first-use8-no-platform.invalid`），再回原平台；另在已有绑定会话的业务回合期间尝试改设置 | 回合中拒绝/禁用，不改 patch；空闲保存和重连可靠。新地址不复用旧平台 Token，CLI 平台围栏生效；旧平台 pass 不冒充新地址 pass。原会话的地址/网络绑定哈希不变，旧资源/策略不残留。UI/JSON不足证明 Token 隔离或资源释放时，对该断言写 insufficient-evidence，引用独立受控探针另列；不向新地址发送/提交真实 Token |
| F7 使用/隔离 | 授权后绑定可访问网，新 Standard 会话做原生工具问答/查看溯源 → 重启续接；独立故障 root 各做业务坏导入和诊断坏导入 | 原生模型输出，无插件答案裁判/纠错；记录工具/Interaction/溯源与原绑定续接。坏导入分别按 `exports['./business'].default`、`exports['./diagnostics'].default` 定位，禁止破坏根 bootstrap。业务坏导入面板/诊断仍可用且 `module-resolution-failed`；诊断坏导入业务保留、明确降级。每变体基包/变体 SHA、变更文件前后 SHA、实际安装身份单列，恢复固定包 |
| F8 卸载/重装 | 原生插件管理器 remove 整包；立即采 patch/绑定/工作区文件哈希与 deps；固定包重装，重启 | 卸载前＝卸载后立即＝重装后用户 patch/绑定/工作区文件哈希链成立，中间不运行 setup 重写。包三 row/侧栏消失、依赖移除；重装正确版本/逐文件核验/三 row/配置回读。CLI凭据不 logout、不清共享 store。CLI remove 路径另做最小卸载/重装轮，分列 UI 与 CLI 证据 |

首次授权之前禁止复用旧 CLI store。完成 F0–F2 后若使用本人先前已授权的**同形态隔离 store**继续无模型测试，明确“恢复既有授权 store”及其路径/时点，不能算首次真实登录，F3 首次登录仍单列未测。每形态独立授权，不复制 token 做账号/rotation 实验。无模型时 F7 真问答如实 not-run；其余 G6、受限账号、平台深层超时/落库、Token 重复拒绝根因维持既有开放状态，不扩展本轮。

F3 的可复用 fixture 是仓库 `docs/handoff/2026-10-07-authentication-recovery/windows-kit/auth/openbkn-auth-fixture.mjs`；执行参数见同目录上级 [旧 R1 操作](../../handoff/2026-10-07-authentication-recovery/windows-kit/HANDOFF.md#3a-r1明确-mcp-401--产品-cli-登录--恢复两形态)。**只复用测试工具，不使用旧 kit 的候选/清单/verifier**。核对 fixture 的 `BKN_CONFIG_DIR` 等于本轮形态 root；设置其真实 CLI entry、Node 与 fault root，创建公开故障 flag。本轮通过 UI 高级设置暂时指向 fixture shim，产品实际授权成功才由 fixture 清 flag；最后经 UI 恢复真实 CLI 路径并记录 patch 的预期变更。历史 R1 要求恢复“原 patch 字节”若与本轮首次配置冲突，改用本轮 F2 保存后的健康 patch 作基准，不能恢复成未配置状态来冒充正常恢复。

## 4. 用户 Windows 源码构建：单独核心链

必须使用用户机器对应的 `dsh-v0.2.0-rc.2` 本地构建源码，记录 checkout commit、版本、实际 `node.exe` 和 `apps/cli/lib/bin.js` 绝对路径。不能拿 npm 结果替代；不要修改 DSH 源码/compat pin。取新的第三个隔离 root，**不运行用户日常 `start-dsh-web.ps1` 去复用旧 home**。

```powershell
$env:DSH_HOME = 'C:\bkn-verify\first-use8-source\dsh-home'
$env:BKN_CONFIG_DIR = 'C:\bkn-verify\first-use8-source\bkn-config'
$FirstUse8SourceCli = 'D:\AI\project\app\openBKN\dsh-src\apps\cli\lib\bin.js' # 核对实际存在/版本
$FirstUse8Tgz = 'PENDING' # 固定 CI 下载绝对路径
node $FirstUse8SourceCli plugin --profile web add $FirstUse8Tgz
if ($LASTEXITCODE -ne 0) { throw 'Source-build installation failed' }
node $FirstUse8SourceCli web --port 18408 --no-open
```

首次 profile 初始化若宿主要求，先用该源码 CLI 正常启动并退出，再安装，不写插件 YAML。分别保留安装/启动退出与身份记录，浏览器打开时 token 不入回传。至少执行 **F0→F1→F2→F3 正常授权/列网→重启回读→F8 原生卸载/重装**，另实测“登录未结束关面板不被重开”。真实授权无条件时标 not-run，不用 npm 的登录通过补齐。路径示例需先确认，不能误碰用户 `D:\AI\project\app\openBKN\dsh-test\dsh-home`。

## 5. 收态、证据与回传

- 同路径清单采 after 内容哈希，隔离配置的预期改变与日常文件分列。逐轮 owned PID 原件先归档，再执行身份核验停止；PID/创建时间/exe/端口 listener 不匹配就拒绝，调查后人工核验，不停用户其他 Host。留安全原生停止输出和最终进程/端口扫描，不补造缺失历史行。
- 每份产品 JSON：形态、场景、reportId、实际下载绝对路径、字节数、完整 SHA、本地原件是否仍在、Git blob 比较。UI 导出与 Host API 分列；延迟下载/替代方法明确，不把判定一致称字节一致。换行归一才一致则记 normalized；原件被清理记 unavailable。
- 保留命令实际 argv、起止/退出码、每轮输入、profile/包路径、故障 base/variant SHA 与变更文件；不预设报告数量或“全绿”。配置/启动日志私有保存，提交前扫描 Token/API key/密码/回调码/launch token，敏感原件不入 Git。
- 填 [结果模板](WINDOWS-RESULTS-TEMPLATE.md)，独立证据分支（如 `docs/first-use8-windows-results`）提交/push，**commit message 用英文**，回传完整固定 commit 与报告路径。你不是唯一开发者，不回退他人改动；不改候选/源码/helper/main，不发布/tag/dist-tag。存在缺陷先存原始失败与复现步骤，交主开发修复/重出候选；不能就地补丁后仍声称原候选通过。
