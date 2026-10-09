# Windows -8 首次使用结果

日期/起止时间与时区：2026-10-08 16:16 – 2026-10-09 21:05（Asia/Shanghai, UTC+8），3 个执行会话（会话 1–2 ZCode，会话 3 Claude Code）。
证据分支：`docs/first-use8-windows-results`（基于固定 commit `59ac630784ac3a6d8cfce3eecc47e5f283cd1882`）。执行文档固定 commit：同上（`WINDOWS-HANDOFF.md`）。
证据目录：本分支 `docs/evidence/first-use8-20261008/windows/`（截图、私有日志、凭据目录、launch token 未入库；本地原件在 `C:\bkn-verify\first-use8-evidence\`）。
**只写实际完成的事实；pass/fail/not-run/insufficient-evidence 分开。未经主开发复核不宣称发布。**

## 固定身份与环境

| 项 | 实际值 / 原件 |
|---|---|
| 候选源码完整 SHA / CI run URL / publish=false | 本地 `git rev-parse 23ac2da` = `23ac2daa6d3538235f33a9627a8178a48f3e1ebf`（`59ac630` 的父提交，亦在 `origin/fix/plugin-first-use-8` 上）。**注意**：会话交接笔记中记录的"完整 SHA" `23ac2daa6d3538235f33a9627a8cf2d6819649205` 为 41 字符、与实际不符（前 30 位相同），属笔记抄录错误，以 git 解析值为准。CI run 37725960498；publish=false（交付文档值，本机未独立复核 CI） |
| 插件版本 / tgz 路径、字节数、完整 SHA-256 | `0.2.0-rc.2-openbkn.0.2.0-8`；`C:\bkn-verify\first-use8-download\openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-8.tgz`；175800 B；`6a946030a6152d2899609fac95c66cd246e36cca5a8ce4e5f87ed379cbe706ea`（每个故障 root 脚本均重算比对） |
| 逐文件清单路径/SHA/数量 | `candidate-files.json` SHA `31298c18cc87ac7a44039f8311e51340a56a830ecbad9fd270bd5ecf275ad257`；实际 66 文件 |
| 下载/原生 verifier 输出与退出码 | 实际用过两个只读脚本（2026-10-10 补正 C3，脚本与 JSON 已入库 `windows/verifier/`，SHA 见 `windows/verifier-files.sha256.txt`）：`step-fu8-verify66.ps1`（SHA `53c799ea…`，会话 1 初装三形态 → `fu8-verify66-{desktop,npm,source}.json`）与 `verify-install.ps1`（SHA `611b92cb…`，f0 desktop/npm 及 F8 重装：desktop UI/CLI、npm UI/CLI、source UI，另 nolicense）。两者都逐文件比对字节数与 SHA-256，输出 missing/differs/extra 及 version；`verify-install.ps1` 另先核对清单 SHA `31298c18…`，`step-fu8-verify66.ps1` 不核清单 SHA。全部历史 JSON 为 66/66、missing/differs/extra 为空。**缺口**：历史运行的 Write-Host 全流未单独存档（仅 JSON 原件 + 会话中打印的末行），退出码未以独立原件留存；本次 B1 R0 的新核验另存于 `windows/b1-minimal/`，不冒充历史原件 |
| Desktop 应用/CLI：版本、路径、profile/root | DeepSeek Harness.exe ProductVersion 0.2.0.0，`C:\Users\kalia\AppData\Local\Programs\DeepSeek Harness\`；内置 CLI `resources\runtime\cli\bin\dsh.cmd` 0.2.0-rc.2；profile `desktop`；root `C:\bkn-verify\first-use8-desktop` |
| npm 官方 CLI：版本、路径、profile/root/端口 | `C:\bkn-verify\diag6-tools\node_modules\.bin\dsh.cmd` 0.2.0-rc.2；profile `web`；root `C:\bkn-verify\first-use8-npm`；18507 |
| source：DSH commit/版本、Node/CLI 路径、profile/root/端口 | `D:\AI\project\app\openBKN\dsh-src` commit `639ed015397290b3745d163aafe02ffee4aa3f84`（UI 显示 0.2.0-rc.2-639ed01）；`node.exe …\apps\cli\lib\bin.js`；profile `web`；root `C:\bkn-verify\first-use8-source`；18408 |
| Node/pnpm/OpenBKN CLI：实际版本与路径 | Node v24.21.0 `C:\Users\kalia\scoop\apps\nodejs-lts\current\node.exe`；pnpm 11.7.0（dsh 内置）；openbkn CLI 0.1.5 `C:\bkn-verify\diag6-tools\node_modules\.bin\openbkn.cmd` |
| 平台部署/工具契约基线、CA 指纹来源 | 平台 `https://192.168.50.28`（本人隔离测试平台）；CA `unified7-c91fe09-authentication-recovery\windows-kit\certificates\openbkn-dev-ca.pem` SHA-256 `89e53b4e7a09305c01c37513a9bdda63698735a33a0df71f725875ec47180453`（与旧轮核对一致）；平台部署版本未独立获取（不凭 URL 推断） |
| 每形态安装清单：actual/missing/diff/extra | 三形态 66/0/0/0（`fu8-verify66-*.json`）；extra 为空 |
| helper commit/SHA / 与原件 diff | 未改仓库 helper；本轮自写只读/启动脚本见 `windows/scripts/`（start-host/start-web/stop-host/f8-snapshot/f8-compare/f7-badimport-*/report-inventory）；`run-case.ps1`、`cleanup.ps1` 全程未调用 |
| 首次空 CLI store、后续授权/模型来源 | 三形态初始 `bkn-config` 均不存在；desktop/npm/source 各自产品按钮发起真实设备授权（desktop 首次落盘为直接 CLI，见偏差 D1）；未复制 token；模型 key 为用户自配测试 key（用户声明测后撤销），存于各 root `dsh-home\.credentials.yaml`，未入库 |

## 场景结果

| 项 | Desktop | npm(web) | source(web) | 输入/操作、UI/报告/原生输出引用 |
|---|---|---|---|---|
| F0 无预设 URL/未登录/待配置/独立诊断 | pass | pass | pass | 报告 7d5c3d8b / 9007a1f2 / 9713534c：三 entry component-loaded，配置及 CLI/auth/context/directory 为 configuration-required；source hostForm=unknown |
| F1 空/非法 UI 提交及 patch 不变 | pass | pass | pass | 四值（空、`ht!tp://not a valid url with spaces`、`file:///C:/test`、`relative/path`）就地提示+输入保留；patch SHA 不变（desktop EF189A8C、npm/source CDC61A08）；desktop 另测"已有合法地址时提交非法值"不变（c7626921） |
| F1 独立非法持久化配置隔离分类 | pass | not-run | 不要求 | 故障 root `first-use8-desktop-f1f`：报告 0768081a business-entry configuration-invalid configField=baseUrl，诊断独立存活 |
| F2 URL/非默认 cliPath 保存与重启 | pass | pass | pass | desktop patch D8DB193A；npm/source 84500334（字节相同）；三形态重启回读 |
| F2 其他字段保留/高优先级覆盖拒绝 | 保留 pass；覆盖 not-run | 保留 pass；覆盖 not-run | 不要求 | npm/source 原 `ui-settings-general` 条目保留；未构造更高层 override |
| F3 CLI 缺失→路径修复 | pass | pass | not-run | npm：不存在路径→"DSH 找不到 OpenBKN CLI…cliPath…openbkn.cmd"，UI 改回真实路径 patch 回 84500334 |
| F3 产品首次真实授权与列网 | pass（偏差 D1） | pass | pass | npm 第 2 次尝试成功（第 1 次确认在旧设备页）；source 2026-10-09 19:40；均"找到 2 个网络" |
| F3 明确401→同Host真实重登恢复 | pass | pass | 不要求 | desktop：1e04b23f recovered=true；npm：401 报告 e82b2153（context-loader auth-rejected httpStatus=401）→产品重登（第 4 次，前 2 次因 120 s CLI 超时失败）→fixture 自清 flag→b1a96ca5 全通过 recovered=true→UI 恢复 cliPath，patch 回 84500334 |
| F4 TLS/CA恢复、网络失败、403 | TLS pass；改址围栏/CLI 行为 pass；MCP 网络不可达分类**未验证**；403 not-run | 同左 | 不要求 | TLS：6525760d / 61756b9f context-loader tls-failed，地址未清空，带 CA 重启恢复；改址 192.0.2.1 → 2758a428 / 866aa61e 仅证明 platform-mismatch 围栏与 CLI 登录失败（cli-execution-failed），**不构成 MCP 网络不可达分类的证据**（2026-10-10 补正 C2，原写"网络 pass"）；无真实 403 条件 |
| F5 关闭/重开/重载旧请求 | pass | pass（合成点击，偏差 D4） | 关面板 pass；见缺陷候选 B3 | 慢窗口实测 3–6 s；desktop 1bdcf068/a4c1354e；npm fe1f0cc4；source 关面板后不重开，但登录被真实中止 |
| F6 空闲地址变更/忙时拒绝 | pass | pass | 不要求 | 忙时："业务回合仍在运行，请等回合结束后重新打开设置。"，输入禁用，保存不改 patch/绑定；空闲 `.invalid`→51769d0a / b9d6323e platform-mismatch；改回 patch 逐字节恢复 |
| F6 新地址Token围栏/旧观察与资源释放 | 围栏 pass；Token 网络层隔离/资源释放 insufficient-evidence | 同左 | 不要求 | 证据层：UI 待登录 + 诊断 platformMismatch=true + `bkn-config\platforms` 未出现新地址目录；无抓包，不宣称网络层未发送 |
| F7 Standard真实问答/溯源/重启续接 | completed pass；见缺陷候选 B1 | completed pass | 不要求 | desktop int_c3d3f535…（19 节点），npm int_2e5c2642…（25 节点）；重启后同会话 continue；事实正确性未做独立裁判（4 个无数据源类型模型如实报失败） |
| F7 业务坏导入/诊断坏导入隔离 | 业务 pass；诊断 partial（B2） | 业务 pass；诊断 partial（B2） | 不要求 | fa344603 / 3444c4c7 business module-resolution-failed；诊断坏导入：诊断明确降级，但配置读写不可用 |
| F8 UI卸载/紧邻哈希/固定包重装 | 卸载紧邻保持 insufficient-evidence；重装链 pass（偏差 D3） | pass | pass | Desktop before→after-remove 路径并集为 **6 SAME / 2 DIFF**（`storages/workspace.json` 改变、新增 `session-922de6f6` 绑定），原写"8/8 不变"不成立；原已跟踪的 patch、工作区绑定、旧会话绑定、CLI store 共 6 项保持；after-remove→pre-enable→after-enable 8/8 相同（2026-10-10 补正 C1）。npm 7/7、source 6/6 按各自原件保留；3 row/侧栏消失与恢复；66/66 |
| F8 CLI卸载最小轮 | pass | pass | 不要求 | `dsh plugin --profile <p> remove|install` exit 0，哈希链不变，66/66 |

配置已保存、CLI已授权、MCP连接、目录已解析、模型已完成、事实正确分别记录，不能互相替代。G6 受限账号 not-run（用户决定）；模型评测/平台超时落库/Token拒绝根因不在本轮。

## 产品导出与变体清单

**计数按时点（2026-10-10 补正 C7）**：`72b917b` 首轮 21 份；`4f4aba0` 另增 `.129` 的 c99eb04b 1 份 → 截至 B1 交接 **22 份已归档 JSON**（UI 只查看的 5151f034 等不计文件）；B1 新增报告另计于 `WINDOWS-B1-RESULTS.md`。下表原文为首轮 21 份时点（全部 UI 导出，原件仍在 `D:\mydocs\downloads\`）。下载有 3 次先以 `.tmp` 形式出现，当时从 `.tmp` 复制并以 reportId 核对，事后与最终文件逐字节一致：

| 归档文件 | reportId | 下载绝对路径 | 字节数/完整SHA-256 | UI/API/其他 | 原件仍在？ | Git blob |
|---|---|---|---|---|---|---|
| OpenBKN-diagnostic-f0-desktop-7d5c3d8b.json | 7d5c3d8b | D:\mydocs\downloads\OpenBKN-diagnostic-20261008T083526894Z-7d5c3d8b.json | 2867 / 6ebaa5bd819bc2ba7d2ce25dcfab15d73e53a2ebd3fbfeef6e06f08282d…（全值见 windows/s3-report-inventory.md） | UI | yes | identical |

完整 21 行（含全长 SHA）见 `windows/s3-report-inventory.md`，由 `windows/scripts/report-inventory.mjs` 生成。**注意（C7）**：该脚本只比较本地证据与 Downloads，**未读取 Git**，表中"Git blob: identical"一列当时并非 Git 核验结果。真实 Git blob 比对已补做：`windows/b1-minimal/b1-c7-git-blob-compare-8e3707f.json`（`git cat-file -p 8e3707f:<path>` 字节 vs 本地原件 / Downloads 原件，SHA-256）——22/22 均 identical，无需换行归一。本机 `core.autocrlf=true`，检出副本会变为 CRLF（如清单检出副本 SHA `08b75554…`），因此只能以 blob 字节而非检出文件作比较。另有仅在 UI 中查看、未导出的报告 id：7e3c2781、756792a8（会话 2）、f44fb248（会话 3），均在对应 notes 中以文字记录，不计入上表。

| 变体ID | 固定base tgz SHA | variant | exports目标/实际文件 | package.json before/after SHA | 安装差异/恢复证据 |
|---|---|---|---|---|---|
| desktop-business | 6a946030… | 已安装包内 package.json 单行编辑（非新 tgz） | `exports['./business'].default` → `./lib/business.fu8-missing.js`（不存在） | 1bb5bfec… → 5525a153… | 真实目录（非链接）；恢复为 1bb5bfec… |
| desktop-diagnostics | 同上 | 同上 | `exports['./diagnostics'].default` → `./lib/diagnostics.fu8-missing.js` | 1bb5bfec… → 35af8f7b… | 恢复为 1bb5bfec… |
| npm-business | 同上 | 同上 | 同 desktop-business | 1bb5bfec… → 5525a153… | 恢复为 1bb5bfec… |
| npm-diagnostics | 同上 | 同上 | 同 desktop-diagnostics | 1bb5bfec… → 35af8f7b… | 恢复为 1bb5bfec… |

## 用户文件与进程收态

- 日常/保护文件：`windows/user-state-before.json`（2026-10-08 16:29，37 唯一路径）→ `windows/user-state-after.json`（2026-10-09 21:00，同清单）：**37/37 SHA 相同，0 缺失，0 差异**。只覆盖该清单。
- F8 哈希链：`windows/f8-*-before/after-*.json` + `f8-*-compare-*.txt` + `f8-desktop-notes.md` / `f8-npm-notes.md` / `s3-source-notes.md`。desktop 基线采于 Host 启动前（偏差 D3）。
- owned PID：全部 pid 原件归档于 `windows/pid-archive/`（格式 `pid:UtcTicks`），每次停止用 `scripts/stop-host.ps1` 停整棵树，日志 `s3-stop-*.txt` / `n6-stop-*.txt`。**2026-10-10 补正 C4**：该脚本强制比较的只有 PID 与创建时间（±1 s）；exe 只打印、未作比较；listener 未校验；会话 3 中为支持 node 形态还删去了进程名比较。故不能写成"已执行交接要求的全部身份检查"；当时没有另行的人工 exe/listener 核对原件，此项为缺口。停止日志与终态扫描保留，终态为零不追溯证明历史检查。会话 3 期间 desktop 30928、npm 35384、source 16276、desktop 33376 在我未操作时已退出（无重启，记录在 notes）。cleanup.ps1 未使用。
- 终态（2026-10-09 21:00）：`n6-stop-and-scan.txt` — 18507/18408/18517/18527 listener 0，DeepSeek Harness 进程 0，first-use8 相关进程 0。隔离 root 与其 store/session 保留在 `C:\bkn-verify\first-use8-*`（含测试模型 key、平台 token，未入库）。
- 用户下载目录残留：31 个诊断导出文件（UI 导出副作用），未删除，交用户决定。默认工作区 `D:\mydocs\documents\deepseek-harness\default-workspace` 经核实未写入。
- 凭据扫描：对入库目录及暂存 diff 执行 `grep -E`，模式为：平台口令字面值（不在此复述）、`Bearer <token>`、JWT 前缀 `eyJ…`、URL `token=` 长值、`sk-` 型 API key；命中 `HANDOFF-SESSION2.md` 平台口令一处，已在入库副本中替换为 `<redacted>`；复扫 0 命中。截图、`private/` 日志（含 launch token）、`bkn-config`、`.credentials.yaml` 未入库。Git 字节比较：首轮此句未经 Git 核验（见 C7）；2026-10-10 以 `git cat-file` 实测 22/22 identical。

## 偏差、缺陷与待确认

### 缺陷候选（交主开发判定）
- **B1 重登后运行中 Host 的业务 MCP 调用仍鉴权拒绝，重启恢复**（desktop，2026-10-09 06:22–06:31；2026-10-10 补正 C5 更名，原标题"…继续使用被拒 token"把根因候选写成了结论）：CLI token 自然过期→产品重登成功、列网正常，但 Standard 两轮 `bkn_start_interaction` 的**工具返回内容**为 `{"code":"Public.Unauthorized","details":"token is invalid"}`——这是工具层返回，**没有 transport HTTP 状态的直接证据**，不写作 HTTP 401。`.credentials.yaml` 中 MCP token 与 CLI 新 token 相同；诊断 d2adf6a1 全通过且**无 observed:context-loader 行**；同 store 的 CLI `context tool-call bkn_start_interaction` 成功（CLI REST 路径通过不排除 MCP transport/服务端会话问题）；Host 重启后同会话工具恢复（`windows/f6-f7-notes.md`，06:31）。旧 Token、SDK、客户端复用、服务端会话均为**待判定**根因候选。原件 `windows/f7-defect-stale-mcp-token.md`；最小复现见 `WINDOWS-B1-RESULTS.md`：2026-10-10 同一 Desktop Host 自然过期→产品重登→新会话工具调用**首次即成功，本轮未复现**（不代表历史异常已解决）。
- **B2 配置服务与 diagnostics 同 owner 的已知限制（Mac 已披露）**（desktop + npm；2026-10-10 补正 C6 更名，原称"诊断入口坏导入同时使配置读写不可用"）：坏导入时首次配置不可用，已配置 profile 的业务登录入口能回退，完整业务链（登录/列网/问答）在该故障态下未测。细节：配置 RPC `getConfiguration` 由 diagnostics 入口提供（`lib/diagnostics.js:504`、`lib/client.js:7100-7124`）；全新 profile 下设置提示"当前无法读取插件设置…"、输入 disabled，无法完成首次配置，业务面板仅显示笼统"暂时无法验证"；已配置 profile 中业务能读到配置并给出登录入口。原件 `windows/f7-badimport-notes.md`。
- **B3 关闭面板会真实中止 CLI 登录，并可能连带结束由 CLI 拉起的浏览器**（source，2026-10-09 19:34）：关面板后 77 s（<120 s 超时）登录进程已不存在、未落 store；用户报告 Chrome 被关、`Get-Process chrome`=0；机理（代码阅读）：`dsh-subprocess-local` 在 Windows Job Object 中运行 CLI，取消时 `terminateJob`。未抓到 Chrome 进程起止，属机理+时序+用户报告证据。原件 `windows/s3-source-notes.md`。**2026-10-10**：用户于 B1 交接决定暂缓 B3 补证；现象与证据边界不变，既未排除也未确认浏览器被杀，本轮未执行新的 B3 测试。

### 观察项
- O1 CLI token 1 h 过期后产品报 not-logged-in，未用 refresh token 静默续期（483b44f3）。
- O2 产品发起的 CLI 设备登录仅等待 120 s，测试中 3 次因用户操作超时失败；失败后 `dsh-subprocess-local` runner 进程残留（仅剩 conhost 子进程）直到 Host 停止。
- O3 F8 重装后宿主 profile `package.json` 字节变化，经证实仅为键顺序变化（`dependencies` 与 `dsh` 互换），内容相同（`windows/f8-source-profile-package.before/after.json`）。
- O4 192.168.50.28 曾被本机 Clash Verge TUN 劫持（源地址 198.18.0.1，TLS ECONNRESET），期间诊断 6a0d907c `tls-failed` 分类准确；属环境问题。

### 执行偏差
- D1 desktop F3 首次授权：产品按钮链路多次发起，但确认落在过期设备码，最终 token 由直接 `openbkn auth login --device` 落盘（会话 1，`f3-notes.md`）；npm/source 首次授权为产品按钮全链路。
- D2 F3 desktop 401 fixture 轮 cliPath 由脚本写 patch 指向 shim（会话 1），恢复经 UI；npm 轮指向 shim 与恢复均经 UI。
- D3 desktop F8 基线采于 Host 启动前；Host 启动后（15:04:41）在已绑定工作区出现新会话，写入 `session-922de6f6` 绑定并改变 `workspace.json`，早于卸载约 3 min。**2026-10-10 补正 C1**：mtime 只是变更时序线索，撤回"mtime 证明卸载没有修改它们"的因果断言；这两项在紧邻卸载前后的保持性为 insufficient-evidence。before→after-remove 实为 6 SAME / 2 DIFF；after-remove 起链 8/8 相同。
- D4 npm F5 的时间敏感点击（登录→关闭/设置→保存）以页面内 DOM `click()` 合成派发（浏览器工具单步延迟 >5 s 失败窗口），时间戳见 `s3-npm-state.md`；首次普通点击尝试错过窗口未计。
- D5 会话 3 后期 computer-use 不可用，原生目录选择框由用户手动点选；平台登录、设备确认全部由用户本人完成（未代填口令）。
- D6 desktop F7 诊断坏导入的对照轮在故障 root 中有意预写合法 patch（SHA d8db193a…）；首次预写因转义错误生成无效 YAML，该轮作废重做。

### 未测与原因
- F4 403（无真实 403 条件，未创建/修改账号）；F2 高优先级 override（未构造）；npm F1 独立故障 root（规范只要求 desktop 侧已完成，npm 未另做）；source F3 缺 CLI（规范 source 最小链不含）；F6 Token 网络层隔离（无抓包，insufficient-evidence）；npm 改回原地址后带有效 token 的重连（token 已过期，desktop 已验证）。
- 192.168.50.129（无 license、不同 CA）补充探索未做，需用户提供该 CA。——**此句为 `72b917b` 首轮时点**；其后已于 `4f4aba0` 完成探索（见下节），但插件 `LICENSE_REQUIRED` 真实 403 分支仍未命中；本次不追加 license 测试。
- MCP 网络不可达分类（C2）未验证。

### 补充探索（规范外，不计入任何 F 项）：无 license 平台 192.168.50.129
- 时间 2026-10-09 23:10–23:45；npm/web 形态（computer-use 不可用，未做 desktop）；独立 root `C:\bkn-verify\first-use8-nolicense-npm`，端口 18537，固定 tgz 66/66。
- CA：用户提供 `openbkn-test-015-ca.crt`（PEM，`CN=OpenBKN Test 015 Local CA`，CA:TRUE，无私钥，SHA-256 `fd6d4aaa860cb744c170df65a24478211895129ec09b3fa302e768b2f7a4a97f`），openssl 校验 `.129` 服务器证书通过；仅经 `NODE_EXTRA_CA_CERTS` 传入。
- 平台确为未授权：`GET /api/safe/v1/capabilities` → `{"licensed":false,"edition":"community","state":"trial",...}`。
- 结果：登录、列网（2 个网络）、MCP 工具、Standard 真实问答、溯源三标签（平台执行事实 Request/Trace/Receipt、业务上下文图、回执清单）全部正常；诊断 5151f034（仅 UI 查看）/ c99eb04b（已导出）全部通过（含 platform-operations、platform-business-graph）。**未观察到任何 license 降级。**
- 插件 `LICENSE_REQUIRED` → "domain-not-authorized" 分支在此部署上不可达（溯源接口未被 license 限制），**该分支在真实平台上仍未验证**；需要一个对溯源接口返回 `403 {code:"permission_denied"}` 的部署。
- 执行失误如实记录：早期用 `openbkn call` 探测这些路径得到 nginx 404，并据此推断"溯源会降级为 platform-unavailable"；改用与插件相同的直连 HTTPS+Bearer 后均为 200，该推断已撤回。
- 原件：`windows/nolicense-129/`（notes、报告 c99eb04b、安装与停止记录）；脚本 `windows/scripts/nolicense-root.ps1`。Host 已身份核验停止，18537 无 listener。

### 边界
未改候选源码、helper、main；未发布/打 tag/dist-tag；仅在本证据分支新增文件。
