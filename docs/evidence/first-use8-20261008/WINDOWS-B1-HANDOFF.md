# Windows：B1 最小复现与证据文档补正

交接日期：2026-10-10（Asia/Taipei）。用户已授权本次复现与文档补正；**B3 补证暂缓**。本任务不修插件、不重出包、不推进发布，也不重跑 F0–F8 全矩阵。

## 1. 固定输入、分支与责任范围

| 项 | 固定值 |
|---|---|
| 最初审核的 Windows 证据 | `72b917b7c3a5e94d99a8ffaefe20c81212f10b60` |
| 本交接的证据基线 | `4f4aba063985cb012ff1debea8c03071b4c14eee`；其新增的 `.129` 平台探索保留，但不替代原 `.28` 平台的 B1 复现 |
| 交接分支 | `docs/first-use8-b1-handoff`；执行前记录主开发交付通知中的完整 handoff commit |
| 建议回传分支 | `docs/first-use8-b1-windows-results`，基于该 handoff commit 建独立 worktree |
| 候选源码 | `23ac2daa6d3538235f33a9627a8178a48f3e1ebf` |
| 插件版本 | `0.2.0-rc.2-openbkn.0.2.0-8` |
| CI / 发布状态 | [37725960498](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37725960498) / `publish=false` |
| 固定 tgz | `C:\bkn-verify\first-use8-download\openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-8.tgz` |
| tgz 字节数 / SHA-256 | `175800` / `6a946030a6152d2899609fac95c66cd246e36cca5a8ce4e5f87ed379cbe706ea` |
| 逐文件清单 | [candidate-files.json](candidate-files.json)，66 文件；SHA-256 `31298c18cc87ac7a44039f8311e51340a56a830ecbad9fd270bd5ecf275ad257` |
| 主复现形态 | 真实官方 Windows Desktop，DSH `0.2.0-rc.2`；沿用本轮的官方应用，不以 npm/source 代替 |
| 隔离 root / profile | `C:\bkn-verify\first-use8-desktop` / `desktop` |
| 原故障平台 / 网络 | `https://192.168.50.28` / `supply_ontology_hand`；实际网络身份以面板和平台返回为准 |
| OpenBKN CLI | `C:\bkn-verify\diag6-tools\node_modules\.bin\openbkn.cmd`，原轮为 `0.1.5`；开测重新记录实际版本 |
| CA | 沿用 [WINDOWS-RESULTS.md](WINDOWS-RESULTS.md) 的 `.28` CA，SHA-256 `89e53b4e7a09305c01c37513a9bdda63698735a33a0df71f725875ec47180453` |
| 新增安全证据 | 本机 `C:\bkn-verify\first-use8-b1-evidence`；回传到 `windows/b1-minimal/`，不覆盖旧轮原件 |

读取 [WINDOWS-HANDOFF.md](WINDOWS-HANDOFF.md)、[WINDOWS-RESULTS.md](WINDOWS-RESULTS.md)、[原 B1 笔记](windows/f7-defect-stale-mcp-token.md) 和 [后续重启对照](windows/f6-f7-notes.md)。本文件对本次范围的限定优先；B3 不执行，`.129` license 探索不扩展。

可以在已确认的仓库内执行下面的取件步骤。**不要切换、重置或提交旧的 `diag6-source` 工作区及其暂存区**。分支或目录已存在时先核对归属，不用 `reset --hard` 或强制覆盖：

```powershell
git fetch origin docs/first-use8-b1-handoff
if ($LASTEXITCODE -ne 0) { throw 'Handoff fetch failed' }
$B1HandoffCommit = (git rev-parse origin/docs/first-use8-b1-handoff).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Handoff commit lookup failed' }
# 与主开发交付通知的完整 commit 对照；不一致时先停下核对。
git worktree add -b docs/first-use8-b1-windows-results C:\bkn-verify\fu8-b1-results-wt $B1HandoffCommit
if ($LASTEXITCODE -ne 0) { throw 'Evidence worktree creation failed' }
Set-Location C:\bkn-verify\fu8-b1-results-wt
git status --short
git rev-parse HEAD
```

Windows agent 负责本次真实操作、证据归档和下面列明的文档修改。可新增本轮取证脚本并归档其内容/SHA；不改候选源码、已安装包、CLI/SDK、DSH 或旧 helper。主开发负责根因判定、源码修复与发布决定。不是唯一开发者，不回退他人的更改；所有 commit message、PR 内容使用英文。

## 2. 本次要验证什么

原现象是：Host 中已建立 MCP 连接，旧 CLI 凭据过期；产品重登后目录正常，Standard 会话中的 `bkn_start_interaction` 仍返回 `Public.Unauthorized / token is invalid`；重启 Host 后恢复。诊断 `d2adf6a1` 全部为 pass，但没有 `observed:context-loader` 行。

本轮只验证这条实际行为链是否能够再现。**“使用了旧 Token”是待证实的根因候选；`Public.Unauthorized` 是工具返回内容，不能未经传输证据写成 HTTP 401。** CLI 独立调用成功也不能单独排除 MCP 服务端会话或 SDK 问题。

主开发的源码/受控检查已确认：`OpenBknMcpManager.ensureMounted()` 在同名工具已存在时直接返回；该分支不读取新凭据、不重新挂载，也不新增 context-loader 观察。自己持有并正常卸载的客户端能够重挂并使用新凭据。**尚未证明 Windows 原故障走的是哪条路径**；本轮不把这个检查结果当作实机根因。

## 3. 最小复现：一形态、一轮自然过期、一个重启对照

### R0：开测前与有效连接基线

1. 从原 `user-state-before.json` 的 37 个唯一路径重新采集本轮 before 哈希；只记录路径、存在状态、SHA。after 使用同一清单，不把旧轮哈希当作本轮 before。
2. 核对固定 tgz、清单和 Desktop 安装件：按原 handoff 的逐文件检查记录实际路径、版本、66 文件及 missing/diff/extra。原已装包匹配即可，无需重装；不匹配则停止，不能拿另一个包继续。
3. 显式使用上述隔离 `DSH_HOME`、`BKN_CONFIG_DIR` 和 `.28` 的 CA 启动真实 Desktop。记录 Host PID、UTC 创建时间、exe、profile，以及本轮实际 listener/子进程。不要同时启动 npm/source；不要为了测试修改其他用户进程、平台策略或系统时间。
4. 经产品“使用 OpenBKN CLI 登录并同步”建立有效登录，确认目录可读。沿用隔离模型配置，不索取或提交 Key。若授权/模型不可用，记录原因并停止依赖它的复现，文档补正仍可继续。
5. 在该网络的隔离业务会话中发一个小问题：**“这个知识网络有哪些对象类型？只列名称，不查询实例。”** 必须捕获实际 `bkn_start_interaction` 成功响应，证明这个持续运行的 Host 中曾有有效业务 MCP 调用；模型仅回答文字、工具未调用，不能作为连接基线。
6. 保存一份 UI 诊断报告与该基线工具记录。记录 CLI 本地凭据的实际 `expiresAt` 或可获得的到期元数据，不输出 Token；本地到期字段不等于平台撤销状态。

### R1：同一个 Host 中过期、重登、再调用

1. **保持 R0 的 Host PID/创建时间不变**，等待这份真实凭据自然过期。通常约一小时，期间先完成第 5 节文档补正，不必空等；不用超过 60 秒的阻塞式等待。不要手改 token.json、伪造 `expired`、调整系统时钟或用 401 shim 替代这一轮。
2. 记录产品显示的到期/登录状态及时间。为查看状态可以使用 CLI `auth status --json`；不要在产品重登前额外运行 `auth token`，以免其续期改变待测条件。记录已知的他端登录事件，但不据时序断言账号互踢。
3. 从**同 Host 的产品按钮**重新登录，等待正常完成；记录按钮触发、用户授权完成、CLI 退出与目录重新可读的时间。不要关面板，本轮不测 B3。若超时，只记录该轮失败；允许重新发起一次正常授权，不能把直接 CLI 登录替代产品按钮算作相同链路。
4. 对新旧凭据是否改变、CLI 与 DSH vault 是否一致，仅输出 `tokenChanged`、`cliEqualsVault` 和采集时间等布尔/时间字段。复用原轮安全比较方式；不能导出 Token、Key、完整 vault 或 store 内容。无法比较就记 `insufficient-evidence`，不要猜测。
5. 重登后在同一个 Host、同一个网络打开**新的业务会话**，重复 R0 的小问题。记录 sessionId、工具名、参数、开始/结束时间及实际响应。失败时最多再试一轮同样问题；不改地址、cliPath、包或权限。
6. **再次打开面板前先保存工具失败原件**，然后从产品 UI 导出诊断报告。将工具调用与诊断采集时间分列，并记录打开面板/重新采集后行为是否发生变化。缺少 context-loader 行就写缺少；全 pass 的现有行不能证明未观察到的 MCP 调用成功。

工具原件优先使用产品会话导出、现有的安全原生事件记录或展开工具响应的语义内容。人工转录必须标 `transcribed`；不能将笔记当成原生 stdout。含个人桌面的截图可以仅保留本机，回传脱敏的工具响应与来源说明。

### R2：只有 R1 失败时，执行独立控制与重启对照

1. 失败尚在时，用**同一个 Desktop 的 `BKN_CONFIG_DIR`**和同一平台/网络做一次原轮类型的 CLI 控制：`openbkn context tool-call supply_ontology_hand bkn_start_interaction --args <实际参数JSON>`。先核对当前 CLI help/实际工具契约，不猜必填字段；归档实际 argv、参数 JSON、起止时间、退出码及脱敏响应。仅对这一次调用取证，不新增客户端或 fixture 代替真实 Host 调用。
2. 记录 CLI 控制调用的 endpoint/transport 能否确认。CLI REST 路径通过不能宣称 MCP transport 同样通过。若创建了新的 Interaction，用实际契约中的 `bkn_finish_interaction` 收尾并留存结果；只结束本探针创建的记录，失败就记遗留 ID，不反复创建或删除平台数据。
3. 若能从已有公开接口或安全原生日志取得正在使用的客户端 owner/实例摘要、MCP session、mount/reconnect 时间，按原样归档。**无法取得就记未验证；不修改包、不注入探针、不启用 inspector，也不为追查归属另外挂载 MCP 客户端。** 这不阻止提交行为复现结果，后续由主开发定位。
4. 先归档 PID 原件，再核对 PID、UTC 创建时间、exe 及本轮 listener（Desktop 若无 listener，注明并用进程树/窗口/启动记录佐证）。不要直接用只检查 PID/创建时间的旧 `stop-host.ps1` 代替完整核对。停止自有 Host，保存安全停止记录，然后从同一个固定包、同一 root 重启。
5. 不重装、不重登、不改配置；在失败的那一个 session 中重试同样问题，记录实际工具结果和 UI 诊断报告。若会话无法恢复，注明这一偏差，不偷换成新会话宣称原会话恢复。

### 停止条件与判定

| 实际结果 | 本轮结论 |
|---|---|
| R0 成功；R1 产品重登/目录正常但工具鉴权拒绝；R2 重启后同会话成功 | B1 行为链复现；凭据、客户端归属和服务端会话根因按实际证据分别判定，不能直接写“旧 Token 已确认” |
| R1 首次、重试均成功 | 本轮未复现；不代表历史异常已解决，也不自动清除发布风险 |
| R0 没有真实 MCP 成功，或授权/网络/模型/工具调用未满足条件 | `not-run` / `insufficient-evidence`，说明中断点 |
| R1 拒绝且独立 CLI 也拒绝，或重启仍拒绝 | 仍有鉴权异常，但未再现原对照链；保存原件交主开发，不按 Host/插件已定责结案 |

只做这一轮自然过期；有结果即停止，不扩到 npm/source、G6、其他账号、深层业务题或自动续期设计。真实异常复现成功后不就地修源码/包；根因未证实也不写用户提示补丁。

## 4. 本轮收态与回传原件

- 按同一 37 路径清单采 after 哈希，日常文件与隔离 root 的预期登录/会话变化分列。
- 保存本轮自有 Host/子进程身份、停止核对结果和最终 listener/自有进程扫描；范围仅限本轮，不能泛化为整机所有进程为零。B3 的 Chrome 起止/Job 归属不采集。
- 登录原生输出可能含授权码/launch token，私有原件留本机；回传前脱敏，注明分析副本及私有原件 SHA，不把脱敏副本称原始字节。
- 每份诊断报告记录场景/Host 形态、reportId、下载绝对路径、字节数、完整 SHA、本地原件是否仍在及当前 Git blob 比较；UI 导出与其他取证通道分列。
- 使用 [WINDOWS-B1-RESULTS-TEMPLATE.md](WINDOWS-B1-RESULTS-TEMPLATE.md) 创建 `WINDOWS-B1-RESULTS.md`。新增安全原件放 `windows/b1-minimal/`；维护文件 SHA/来源清单，不覆盖旧报告。

## 5. 对原报告的具体补正（无需重新跑矩阵）

修改 [WINDOWS-RESULTS.md](WINDOWS-RESULTS.md) 和相关 Markdown 笔记；旧 JSON、原生输出、快照、PID 原件保持原样。追加日期和本次结果链接，保留历史事实。

| 编号 | 修改位置 | 应落稿的内容 |
|---|---|---|
| C1 | F8 UI 行、D3、`windows/f8-desktop-notes.md` | Desktop before→after-remove 的路径并集是 **6 SAME / 2 DIFF**：workspace.json 改变，新增 session-922de6f6 绑定。不能写卸载前后 8/8 不变；紧邻卸载的这两项保持性为 `insufficient-evidence`。after-remove→pre-enable→after-enable 才是 8/8 相同；原已跟踪 patch、CLI store 等 6 项保持的结论保留。mtime 是变更时序线索，撤回“证明卸载没有修改”的因果断言。npm 7/7、source 6/6 及 Desktop CLI 独立轮按各自原件保留。 |
| C2 | F4 行、未测项、TLS/网络笔记 | TLS 分类与带 CA 恢复通过。`.28` 改 `192.0.2.1` 得到的 `platform-mismatch` / CLI 失败仅证明相应围栏/CLI 行为；**MCP 网络不可达分类未验证**，不再列“网络 pass”。本次只修正文档，不追加离线矩阵。 |
| C3 | 固定身份/verifier 行、`windows/scripts/`、重装核验引用 | 补交原本实际使用的 `verify-install.ps1` 内容、SHA、调用记录，以及已留在本地的 Desktop UI/CLI、npm UI/CLI、source UI 重装核验 JSON/安全输出。对照原 handoff 确认其确实查字节数/SHA/missing/diff/extra；缺了哪项就注明。原件找不到标不足，不事后补造；本次 R0 新核验不能冒充历史重装原件。原 Write-Host 全流未存档的历史不能重新包装成已捕获。 |
| C4 | owned-PID/收态段、helper 偏差说明 | 原停止脚本只强制比较 PID/创建时间，exe 是打印字段、listener 没有校验；不能写成已执行全部交接身份检查。存在当时人工核对证据就引用，否则明确缺口。保留停止日志及终态扫描，不能由终态为零补证历史检查；不重跑历史停止动作。本轮按第 3/4 节保存身份核对。 |
| C5 | B1 主条目、`windows/f7-defect-stale-mcp-token.md` | 改称“重登后运行中 Host 的业务 MCP 调用仍鉴权拒绝，重启恢复”。将工具返回的 `Public.Unauthorized` 与 transport HTTP 状态分开；旧 Token、SDK、客户端复用、服务端会话均为待判定。更新“重启是否恢复尚未证实”的旧时点：后续 `f6-f7-notes.md` 已记录恢复。新复现另附，不改写旧失败原件。 |
| C6 | B2/B3 条目 | B2 写为“配置服务与 diagnostics 同 owner 的已知限制，Mac 已披露”：坏导入时首次配置不可用，已配置业务登录入口能回退，完整业务链未测。B3 保留既有现象和证据边界，追加“用户于本次交接决定暂缓补证”；不改为已排除或确认浏览器被杀，不执行新 B3 测试。 |
| C7 | 产品导出/清单、`.129` 探索段与未测项 | 分时点计数：`72b917b` 首轮 21 份、`4f4aba0` 另增 `.129` 的 c99eb04b 一份；截至本交接是 **22 份已归档 JSON**，UI 只查看的 5151f034 不计文件。新 B1 文件另加，最终按实际清点。`report-inventory.mjs` 原逻辑只比本地证据与 Downloads；它未读取 Git，不能直接作为 Git blob 核验。对当前提交真实比对字节/SHA，换行归一才一致则记 normalized。旧“`.129` 未做”限定为首轮时点，保留其后探索和仍未命中的真实 403 分支，不追加 license 测试。 |

若历史核验资料或进程身份原件缺失，如实收窄即可。不要为追齐文档宣称全绿而扩大复测，也不要将这批证据补正误称候选包变化。

## 6. 提交前核对与交付

1. 所有修改限于 `docs/evidence/first-use8-20261008/`；候选清单/manifest、源码、构建产物、旧 helper、其他工作区不改。
2. `git diff --check`；检查实际变更列表，确认不包含 Token/Key/密码/授权码/launch token、vault/store 原文或个人桌面截图。记录原件与脱敏副本的来源区别。
3. 对提交后的诊断/核验文件重新核对清单 SHA 与 Git blob；清单本身不自引用，文件计数按实际生成，不能继续沿用旧数字。
4. English commit message，例如 `docs: record first-use B1 reproduction and evidence corrections`；push 独立结果分支，不推进 `fix/plugin-first-use-8` 或 main，不创建发布 tag 或修改 npm dist-tag。
5. 回传完整 commit、`WINDOWS-B1-RESULTS.md` 路径、B1 是否复现/中断点、C1–C7 逐项完成状态与剩余证据限制。正式发布结论由主开发与用户决定。
