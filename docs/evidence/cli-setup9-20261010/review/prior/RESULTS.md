# -9 CLI setup：Mac 实测与固定候选

结论：本轮仅实现 CLI 检测、显式自动安装、状态提示。在 macOS 官方 npm DSH 与官方 Desktop `0.2.0-rc.2` 上，最终 CI 包的安装件均 **69/69 一致**，产品按钮均完成真实 SDK 0.1.5 安装及路径保存。Windows 原生验收、PR 评审、发布仍待完成；不据此宣称完整 G6、平台或鉴权验收。

## 身份与环境

| 项 | 值 |
|---|---|
| 最终源码 | `e669bd6a1d51083f6b7f6c753b87d72c236a3193` |
| build-only CI | [38023447204](https://github.com/openbkn-ai/bkn-dsh/actions/runs/38023447204)，success，publish=false |
| 版本 | `0.2.0-rc.2-openbkn.0.2.0-9` |
| CI tgz SHA-256 | `006f74349f7ef1c059032dd76a89ebc6626b6fce78eab330b35c073a91c098f6` |
| tgz | 183068 bytes / 69 files；[manifest](candidate-manifest.json) / [逐文件清单](candidate-files.json) |
| npm Host | `/Users/kalias/Documents/project/app/openBKN/dsh-npm-020/node_modules/@deepseek-ai/dsh/lib/bin.js` |
| Desktop | `/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness`，bundle `0.2.0-rc.2` |
| 环境 | macOS，真实 Node 24.19.0 / npm 11.17.0；registry 保持本机配置 `https://registry.npmmirror.com` |
| 隔离 | `/private/tmp/bkn-cli9-mac/{npm,desktop}`；各自 DSH_HOME、BKN_CONFIG_DIR、npm prefix/cache、Electron user-data-dir |
| 最终安装 prefix | 各自 `sdk-prefix-final`；此前的 `sdk-prefix` 留作首轮证据，不覆盖日常全局 CLI |

[上游基线](upstream-baseline.json) 对照支持的 DSH rc.2 与当日 DSH/Foundry/SDK 上游。SDK 固定为已发布 0.1.5，不追随 SDK main。Node 前置条件遵循本项目 `^22.19.0 || >=24.0.0`，比 SDK 的最低版本条件更严格。

本地最终 pack 与 CI 的 69 个解包文件逐项一致，压缩 tgz 字节不同；接受对象是 **CI 下载包**，不是本地 pack。CI 不发布 npm，不生成 tag；root CHANGELOG/本报告/交接后的提交不进入 tgz。

## 实测与证据层级

| 项 | 结果与范围 | 原件 |
|---|---|---|
| 最终安装身份 | npm + Desktop 各 69/69，缺失/差异/额外文件全空；Desktop 原生管理器重装后重启 Host | `mac/*-final-installed-identity.json` |
| 只读检测 | 首轮两形态缺失提示，无自动安装；最终 Desktop 新 prefix 再次显示未检测到 | `mac/preflight/desktop-missing-ax.txt`、`mac/desktop-final-missing-ax.txt`、首轮 API |
| 真实安装 | 最终两形态产品按钮安装真实 SDK；独立实际 bin `--version` 均 exit 0 / 0.1.5；每个最终 prefix 恰好一次 install | `mac/*-final-cli-verification.json`、`mac/*-final-ready*` |
| 路径与复用 | 不在 Host PATH 的 npm prefix 中找到 CLI，填入绝对路径；两形态均由“保存并继续”持久化。npm 再检测不触发 install | `mac/npm-final-reuse-api.json`、`mac/*-final-saved-patch.json`、设置 UI 原件 |
| 权限/网络失败 | 首轮官方 npm Host 上，仅 npm install 子命令受控注入 EACCES/ECONNRESET；UI 明确失败，可重试，SECRET_CANARY 未进入状态/UI | `mac/preflight/npm-{permission,network}-failure-dom.txt`；是 **受控故障**，不是实际权限/网络事故 |
| 自定义路径 | 首轮 npm UI 填不存在路径并点击按钮：提示修正路径，安装次数保持 3（两次受控失败+一次真实安装），未覆盖自定义路径 | `mac/preflight/npm-custom-path-{dom.txt,api.json}` |
| npm 缺失 | 首轮临时隐藏测试 npm 后，真实 Host API 返回 blocked/npm-missing，恢复 wrapper | `mac/preflight/npm-no-npm-api.json`；API 证据，未冒充 UI 点击 |
| Node 23 拒绝 | 源码收尾核对发现原条件可放行 23；修正并补回归。最终 npm Host 上仅 `node --version` 注入 v23.11.0，UI/API 均拒绝、SDK prefix 仍空、没有 install；随后恢复真实 Node 24 安装成功 | `mac/npm-node23-{fixture.json,dom.txt,api.json}`；**版本 fixture**，未声称实际安装 Node 23 |
| 关闭面板 | 首轮两形态均在安装中关闭，再打开时取得可用终态。最终 npm 轮同样关闭安装中面板，真实 install 持续完成；重开后恢复默认命令检测新 prefix 并保存 | `mac/preflight/*installing*`、`mac/npm-final-installing-dom.txt`、最终安装记录 |
| 状态语义 | 安装/检测不等于登录：隔离 BKN store 未新增文件，保存后产品仍显示 CLI 登录入口；最终 npm 诊断保留 not-logged-in | `mac/*-final-cli-verification.json`、`mac/npm-final-{saved-dom.txt,diagnostic-api.json}` |

安装延迟 fixture 只在 exec 真实 npm 前等待（首轮 npm 8 秒/Desktop 25 秒、最终 npm 15 秒），不伪造成功或生成 bin。最终 Desktop 使用正常真实 npm，无延迟。安装参数均为固定版本、独立 prefix、ignore-scripts/no-audit/no-fund；没有原生 npm install 的独立 stdout/exit 原档，成功依据是产品 Host 的实际执行/版本验证、调用记录与另外独立 bin 执行，不能把 UI 文字当独立安装器输出。

关闭/重开过程捕获了安装中与可用终态；**未单独捕获重开高级设置后仍在 installing 的瞬间**。同一安装共享、重开轮询、重复点击、被关闭操作的迟到回调由 Host/controller 测试覆盖；Windows C97 再做现场补充，不把单测写成实机证明。

## 验证

- 插件 **405（404 pass / 0 fail / 1 既有 skip）**；仓库 **60/60**；typecheck/package:check/diff-check/pack 通过。[本地原生输出](validation/)
- `final-ci-run.json` 为最终构建身份/结论；CI 也执行构建、测试和打包检查。
- 本地 pnpm 依赖核验因 sandbox/escalated 环境的 global virtual store 设置差异给出警告，本轮仅将 run 前检查设为 warn；未修改锁文件、依赖或用户全局配置。干净 CI 没有依赖该本地措施。
- 原始 UI 与 Host API 分开命名；本轮 API 诊断件**不是 UI 下载件**。截图仅包含隔离测试窗口，未借用模型 Key、登录或平台凭据。

## 首轮与最终轮

首轮源码 `0a2278d09a6d9528ba2d95bc27da109245424d98` / CI `38020188895` / tgz `6c48bd2b955359be35b43b321f9d507309e0532fbeab04d1999faa6ff49263e9`（69 文件），资料保存在 `mac/preflight/`。收尾修正只有 Node 安装前置条件与其提示/测试；其后重建最终 CI，两个实际安装件均切换最终包、重新使用新 prefix 真实安装。未将首轮身份混作最终候选。

执行偏差均在隔离环境处理：IAB/初始浏览器操作通道不可用，后使用可用 Chrome CUA 操作；Desktop CLI 拒绝管理专属 desktop profile，改走原生插件管理器。并行 Desktop 的默认端口与日常 app 冲突，第一轮只写 port 的 patch 又缺 required host；修成完整 `host=127.0.0.1,port=18421` 后运行。未改 DSH 运行时、证书、日常 PATH 或日常 profile。失败启动未留下可恢复的历史原生停止输出，不据此声称全程原生停止日志完整。

最终 npm/桌面停止及包更换重启的证据含 PID、创建时间、exe、listener 和原生 ps/lsof 输出：`mac/*-owned-stop.json`、`mac/desktop-after-package-restart.json`。本轮相关父子进程、18420/18421 端口均清空；日常 Desktop 不在停止范围。选定 **10/10 日常配置/CLI 文件内容哈希** before/after 一致，覆盖仅限 [同一清单](mac/daily-after.json)，不是整个用户目录。

CLI/prefix/cache/测试 profile 留在本轮独立临时目录供复核，Host 已停止。独立 SDK 不随插件卸载，属于本次设计。真实 launch-token 日志不提交；代码/证据凭据模式扫描零命中。

## 剩余边界

Windows `.cmd`、含空格 prefix 与原生子进程行为尚未验证，交由 [独立 handoff](../../handoff/2026-10-10-cli-setup9/HANDOFF.md)。权限/证书/超时、重复点击与安装退出 0 但验证失败的完整边界由单测覆盖，Windows 受控矩阵补充现场验证。原生 PowerShell verifier 尚未运行。

本轮不跑平台登录、模型/G6、Token 生命周期、真实平台故障、Node 安装或升级迁移；这些没有源码行为改动，也不在用户限定范围。-8 的已知限制沿用。PR/Windows复核及发布批准是后续步骤，当前 **-9 未发布**。
