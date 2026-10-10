# -9 CLI setup：Windows 反馈后的收尾候选

当前源码 `6b372ff703d773a4c47ff3cf13972a047fa81ebd` / build-only CI [38058120767](https://github.com/openbkn-ai/bkn-dsh/actions/runs/38058120767) / tgz SHA-256 `dd2d50a2fdda8e55f1ff355b6121113fc6106aeeb6664463bc218cb9b366c887`（183344 bytes / 69 files）。[manifest](candidate-manifest.json) 与 [逐文件清单](candidate-files.json) 绑定当前输入；以下首次评审报告仅作历史，不延伸为新包全矩阵。

目录路径分类、主面板设置/安装进度引导、已保存路径提示已修复；Mac 官方 npm/Desktop 受影响实测完成，新包两安装件各 69/69，一次真实 SDK 0.1.5 安装及保存提示均通过。Desktop 捕获了安装中关闭/重开后仍安装与锁定。插件 414（413 pass / 0 fail / 1 skip），仓库 60/60；六类验证成功。详情、证据边界和执行偏差见 [本轮 RESULTS](followup/RESULTS.md)。

旧 Windows `a2504c5` 的 C90–C99 是历史基线，措辞修正见 [WINDOWS-REVIEW](followup/WINDOWS-REVIEW.md)。当前候选的 Windows Desktop/npm F90–F97 已由 `b5e5875b53bfd0edccbd881f1069e746dc722b1b` 回传并复核，原件与修正后的结论见 [Windows RESULTS](followup/windows/RESULTS.md)：安装件各 69/69，canonical verifier 在 PS5.1 原生通过，停止 helper 拒绝错误及空 listener，真实 SDK 安装与保存提示通过。

2026-10-11 收尾只调整证据与发布说明，不改变候选。C98 实机仅证明恢复后保留失败历史；只读检测不清除当前 CLI/auth 失败仍只有单测，现场未单独构造。Desktop 首次卸载的 pnpm `EPERM` 按用户决定保留为已知限制，根因未知。根清单和 Git 对照绑定明确的证据提交；旧清单保留历史身份。

Windows 的 [107 件来源补证](followup/windows/closeout/RESULTS.md) 已回传并由主开发复核，固定提交 `a7f94bf4bc7fa973b19e07196820c64eb69cd70a`：53 件逐字节一致、54 件仅 CRLF→LF 差异，缺失/未验证均 0；快照副本与合成 observer 分列。主开发独立核到 107 件 Git 基准及记录哈希、54 件换行还原和两份补证的提交字节证明，未冒充再次读取 Windows 本地文件。详见 [主开发复核](followup/windows-provenance-review.json)。没有重跑矩阵或借用凭据。

PR #86 已合并至 `df454e7eaa4b58ecdbb4c3355a297aaba02d5437`；主线 build-only CI `38067339595` 成功，69/69 解包文件及 tgz SHA 与验收候选完全一致。正式发布/tag/dist-tag 尚未执行；当前待维护者确认发布。完整身份与保留限制见 [发布准备](RELEASE-READINESS.md)。宿主测试 Key 来源调查与撤销不进入 -9 插件实现。

---

# 历史：首次评审修复与固定候选

结论：PR #86 的输入失焦阻塞项及两项非阻塞项均已修复，源码 `cf591d7` 已获独立 APPROVED。评审后重新产出 CI 包，并在 macOS 官方 npm DSH 与官方 Desktop `0.2.0-rc.2` 上完成受影响验收：两种安装件均 **69/69 一致**，产品按钮各安装一次真实 SDK 0.1.5，路径保存并重开正确。Windows 原生复测、合并及发布仍未完成；本轮仅涉及 CLI 检测、显式安装和状态提示。

## 首次评审后候选身份（历史）

| 项 | 值 |
|---|---|
| 源码 | `cf591d7cbd4af202d0bd893aab57202a72ec1644` |
| build-only CI | [38028568470](https://github.com/openbkn-ai/bkn-dsh/actions/runs/38028568470)，success，publish=false |
| 版本 | `0.2.0-rc.2-openbkn.0.2.0-9`，未发布 |
| tgz SHA-256 | `de8d216049b160f92c46d22ab1db37b4225b4424923e7efc3db404b116327630` |
| tgz | 183195 bytes / 69 files；[历史 manifest](followup/prior/candidate-manifest.json) / [历史逐文件清单](followup/prior/candidate-files.json) |
| npm Host | `/Users/kalias/Documents/project/app/openBKN/dsh-npm-020/node_modules/@deepseek-ai/dsh/lib/bin.js`，官方 rc.2 |
| Desktop | `/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness`，官方 rc.2 |
| Node / npm / registry | 24.19.0 / 11.17.0；保持本机 `https://registry.npmmirror.com` |
| 隔离 | `/private/tmp/bkn-cli9-mac/{npm,desktop}`，独立 DSH_HOME、空 BKN_CONFIG_DIR、prefix/cache、Electron user-data-dir |
| 本轮 SDK prefix | 各自 `sdk-prefix-review`；此前 prefix 留作历史，不覆盖日常 CLI |
| 平台/鉴权 | `https://cli9-no-platform.invalid`；没有平台登录、模型请求或凭据借用 |

[上游基线](upstream-baseline.json) 与 [本轮刷新](review/upstream-refresh.json) 均已核对 DSH/Foundry/SDK；未改变支持的 DSH rc.2 或已发布 SDK 0.1.5。Node 安装前置条件为 `^22.19.0 || >=24.0.0`，明确拒绝 Node 23。

本地 pack 与 CI **69 个解包文件逐项一致**，压缩字节不同。接受对象为下载的 CI tgz；CI 的 npm 发布和 latest 步骤均跳过。此后文档提交不进入 tgz，无须仅为文档再次出包。

## PR #86 评审修复

| 发现 | 修复 | 验证 |
|---|---|---|
| 阻塞：输入首个字符就启动只读检测，继而禁用同一个路径输入框并失焦 | 将只读检测的 busy 与路径锁分开；仅显式设置及 Host 安装锁定路径。轮询保持 installing，显式预检查也保持锁 | 旧包 npm 输入 xx 只留 x 且焦点丢失；新包 npm 两字符及完整路径逐字输入均保持焦点。Desktop 两字符输入保留且聚焦。controller 测试覆盖轮询/预检查锁 |
| 非阻塞：Windows bare openbkn.cmd 被错误归为自定义路径 | 仅在 win32 将大小写不敏感的 bare openbkn.cmd 作为默认别名；不存在的绝对路径仍拒绝自动安装 | Windows 分支、别名复用/安装及绝对路径拒绝由单测覆盖；原生 Windows 交接增加 C99，尚未运行 |
| 非阻塞：超时 fixture 不响应 AbortSignal | 测试子进程 fixture 真实响应信号；加速实际 timeout，同时断言生产预算 5000/180000 ms | 检测超时、安装超时和 dispose 取消均有显式断言；未声称真实 OS 进程等待了完整 180 秒 |
| 复审非阻塞：验收仍绑定旧包 | 新 build-only CI、新 manifest，重跑受影响 Mac 验收；旧记录保留为历史 | 当前身份见上表，当前证据位于 review/；旧包不用于新的 Windows 复测 |

修复提交为 `7afbdcb`、`cf591d7`；源码复审 [38028570934](https://github.com/openbkn-ai/bkn-dsh/actions/runs/38028570934) 成功，APPROVED 的提交为 `cf591d7`。PR 文档更新后的检查与评审以 GitHub 当前记录为准。

## 评审后 Mac 实测

| 项 | 结果与证据边界 | 原件（相对于本目录） |
|---|---|---|
| 安装身份 | npm / Desktop 各 69/69，missing/different/extra 全空；Desktop 原生管理器重新安装并重启，再启用 | `review/mac/*-final-installed-identity.json`；`verify-installed-native.txt` + `verify-installed-exit.json` |
| 输入失焦复现及修复 | 旧候选真实 npm UI 复现失焦；新 npm 用 pressSequentially 输入 xx 及完整不存在路径，focused=true/disabled=false。Desktop 原生分别输入两个 x，完整保留且 AX 焦点仍在输入框 | `old-candidate-typing*`、`npm-two-character-typing.json`、`npm-full-path-typing.json`、`desktop-two-character-typing-ax.txt`，均在 `review/mac/` |
| 自定义路径 / 只读检测 | 两形态使用不存在的 `/tmp/cli9-not-installed/openbkn`，明确提示修正；随后默认命令缺失只读检测，不触发安装；review prefix 初始 bin 不存在、install=0 | `review/mac/*-custom-path-*`、`*-before-install.json`、`*-missing-*` |
| 显式安装与路径锁 | npm 显式预检查期间路径禁用；Desktop 捕获 installing，路径/安装/保存控件禁用 | `review/mac/npm-explicit-preflight-lock.json`、`desktop-installing-ax.txt` |
| 真实安装 | 两形态均点击产品按钮，真实 npm 安装已发布 SDK 0.1.5；独立 bin --version 各 exit 0 / 0.1.5；review prefix 各仅一次 install | `review/mac/*-final-cli-verification.json` |
| 关闭 / 重开 | Desktop 安装中关闭，安装持续并真实完成。重新打开的回读已到可用终态，先显示原保存路径；改回默认检测找到新 prefix。未捕获重开后仍 installing 的瞬间 | `review/mac/desktop-installing-ax.txt`、`desktop-reopened-ready-ax.txt`、`desktop-ready-ax.txt`；不把 controller 单测当实机瞬间证明 |
| 保存与复用 | 两形态均由“保存并继续”持久化新绝对路径；重开高级设置路径正确；只读 Host API 复用默认命令得到新 prefix ready，install 次数仍为 1 | `review/mac/*-saved-patch.json`、`npm-reopened-saved-dom.txt`、`desktop-reopened-saved-ax.txt`、`*-reuse-api.json` |
| 状态边界 | SDK 可用不等于已登录；两隔离 BKN store 没有新增文件；保存后仍显示正常 CLI 登录入口 | `review/mac/*-final-cli-verification.json`、`desktop-saved-ax.txt` |
| 收尾 | 每个本轮 Host 停止前核验 PID/创建时间/exe/listener，保存原生输出；相关父子与 18420/18421 均清空；选定日常文件 10/10 内容哈希一致 | `review/mac/*-owned-stop.json`、`daily-before.json` / `daily-after.json` |

延迟 fixture 仅在 exec 真实 npm 前等待：本轮 npm 8 秒、Desktop 45 秒；保留 wrapper 原件。它不伪造成功或生成 bin。没有独立原生 npm install stdout/exit 原档；安装成功由产品实际执行、调用记录及独立 bin 验证共同证明，不能把 UI 文字当独立安装器输出。

本轮 npm 未捕获 installing/关闭重开瞬间，不延伸历史 npm 生命周期证据至新包；Desktop 捕获安装中关闭，但重开回读时已完成。轮询不暂时解锁由本轮 controller 测试覆盖，Windows C97 继续取现场证据。

Desktop CUA 曾出现 AX 回读延后/上下文不一致；一次完整逐字符操作的即时回读没有反映完整输入（`desktop-full-path-typing-attempt-ax.txt`），不计为完整字符串输入通过。该项完整字符串证明来自 npm；Desktop 自定义路径拒绝使用 setValue 设置输入，单独标注。未据此认定产品根因，也未将操作尝试写成验收通过。

日常 Desktop 不在停止范围。10/10 仅指选定 daily profile/CLI 文件，不是整个用户目录或所有进程。测试 SDK/prefix/cache/profile 留在隔离目录供复核，不随插件卸载。private launch-token 日志未提交。

## 验证与历史证据

插件 **412（411 pass / 0 fail / 1 既有 skip）**，仓库 **60/60**；typecheck/package:check/diff-check/pack 均成功。[本轮输出及退出码](review/validation/)；[CI 完整 job/step 记录](review/final-ci-run.json)。本地 pnpm run 前依赖核验仅设 warn，未修改依赖、锁文件或全局配置；干净 CI 不依赖这项本地措施。

| 阶段 | 身份与证据范围 |
|---|---|
| 首轮 | source `0a2278d` / CI `38020188895` / SHA `6c48bd2b…`；`mac/preflight/`，包含受控 EACCES/ECONNRESET、首轮关闭面板等 |
| 评审前 | source `e669bd6` / CI `38023447204` / SHA `006f7434…`；`mac/`、`validation/`，含 Node 23 受控版本拒绝；[历史报告及绑定](review/prior/) |
| 评审后当前 | source `cf591d7` / CI `38028568470` / SHA `de8d2160…`；`review/mac/`、`review/validation/`，当前受影响验收 |

首轮权限/网络、npm 缺失、Node 23 和未修改业务面的旧记录仅证明对应历史输入。评审修复不改变这些 Host 分支；最新源码单测继续覆盖它们，不将未重跑项写成新包实机证明。UI / Host API / 受控故障 / 独立 bin 输出分列；API 件不是 UI 下载件。

此前启动/操作偏差详见保留的历史报告；本轮 Desktop 原生管理器重装后重启避免沿用已缓存模块。没有修改 DSH 运行时、证书、用户日常 PATH/profile。

## 仍待完成

- Windows 原生 Desktop/npm：`.cmd` 默认别名、含空格 prefix、真实 subprocess、各受控故障及生命周期。执行 [新版独立 handoff](../../handoff/2026-10-10-cli-setup9/HANDOFF.md)，必须用当前 CI 包。PowerShell verifier 在 Mac 仅检查文本/算法，尚未原生运行。
- 新文档提交的 PR 检查、Windows 结果复核；其后才讨论合并和发布，本轮不打 tag、不发布、不迁移 latest。
- 平台登录、模型/G6、Token 生命周期、历史用户机器故障、Node 安装和旧版升级没有本轮行为改动，不在 -9 授权范围；-8 已知限制沿用。
