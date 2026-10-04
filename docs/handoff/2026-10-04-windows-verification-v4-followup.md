# Windows 补测：固定 -4 候选包与修正后的守卫探针

本文件交给 Windows agent 执行。主开发分支是 `chore/release-0.2.0-rc.2-openbkn.0.2.0-4`；以用户转发的提交 SHA 为准，先核对 `git rev-parse HEAD`。不要合并、发布、打 tag、移动 npm dist-tag 或改动 `main` / `release/` 分支。

原 Windows v4 的 R1–R9、npm 面板登录、全新 CLI 登录读数和安装内容比对已经完成，不需要重复整套回归。本轮只补 Windows 探针启动和桌面面板登录；授权异常三项可一起补，逐项标明是否实际执行。

## 固定输入与准备

- 候选：run **37202050194**，源提交 `c4b5dce437a383e8196c830b2926d6e14858e20e`。
- 文件：`openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-4.tgz`；133,806 字节。
- SHA-256：`c4a8effbe5f84ecb399ee45ddf705c9468ef311910dcf58f62e47a0c71687a02`。
- 解包：52 个文件；tree-hash `f4e90f96d5c82e8b8c8cc505847995c6d3624f9870c58a71d7a3d010f3a5c5ad`。算法和逐文件清单见原 v4 结果报告附录。
- 宿主 DSH `0.2.0-rc.2`；CLI `@openbkn/bkn-sdk@0.1.5`；Node `^22.19.0 || >=24`，不用 Node 23。
- 平台 `https://192.168.50.28`；绑定网络 `supply_ontology_hand`，另一个网络 `worldcup_vega_catalog_bkn`。
- 源码只用于取得修正后的探针及测试，**不能替换候选包里的 lib**。探针和测试不在 tgz 内。
- 原用户 profile、CLI 登录状态和 CA/PATH 设置先记录。优先使用独立 `DSH_HOME` / `BKN_CONFIG_DIR`；若必须使用原 desktop profile，沿用上轮的逐文件还原流程。不要新增 Token 或模型密钥副本。
- 登出、登录按钮和浏览器授权由用户操作；不得替用户输入或导出 Token。探针在内存中读取 CLI Token 连接 MCP，不把它打印或写文件。

## W1. 探针回归测试（必做）

从指定 SHA 建独立 worktree，保留原分支及已有修改。先下载并核对候选包，再解包。下面路径变量由你设为本轮独立目录，不能指向用户原 `.dsh`：

```powershell
$Repo = 'C:/完整/路径/本轮worktree'
$Candidate = 'C:/完整/路径/候选解包/package'
$ProbeDeps = 'C:/完整/路径/本轮probe-deps'
$Package = Join-Path $Repo 'packages/openbkn-business-context'
```

如果该 worktree 已有能加载 DSH 0.2.0-rc.2 的依赖，就复用它；否则仅在 `$ProbeDeps` 安装探针运行需要的库，不构建或打补丁给 DSH：

```powershell
$manifest = Get-Content (Join-Path $Candidate 'package.json') -Raw | ConvertFrom-Json
$deps = @('@deepseek-ai/cordis@4.0.4', '@deepseek-ai/schemastery@3.18.4', 'zod@4.5.4', '@deepseek-ai/dsh-scope@0.2.0-rc.2')
$deps += @($manifest.peerDependencies.PSObject.Properties |
  Where-Object Name -ne '@deepseek-ai/cordis' |
  ForEach-Object { "$($_.Name)@$($_.Value)" })
npm install --prefix $ProbeDeps --no-audit --no-fund @deps
if ($LASTEXITCODE -ne 0) { throw 'Probe dependency installation failed' }
```

在不存在 `node_modules` 的前提下，把 `$Package/node_modules` 和 `$Candidate/node_modules` 分别建为指向 `$ProbeDeps/node_modules` 的 junction。若目录已有内容，不覆盖；检查并复用或换一个工作目录。依赖目录不计入候选的 52 个发布文件。记录实际 `@deepseek-ai/dsh-tools` / `dsh-mcp-client` / `dsh-system-prompt` 版本，必须均为 `0.2.0-rc.2`。

```powershell
node --test (Join-Path $Package 'tests/guard-probe-cli.test.mjs')
```

预期 4 项测试全部通过，Windows 专用项不能 skip。该项会实际执行 PATH 下的 `.cmd` 和位于包含空格及 `&` 的临时目录里的 shim；不会登录真实平台。再单独执行：

```powershell
node (Join-Path $Package 'tests/probes/guard-runtime.probe.mjs') --plugin $Candidate --live
```

预期退出码 **2**、stderr 为参数错误、stdout 无验证记录；不能出现 `stand-in` 或 `16/16`。缺网络参数、URL 位置放了另一个选项也应如此，测试文件已覆盖这些情况。

## W2. 真实平台守卫探针（必做）

使用已有登录状态；若无登录，请用户完成登录。自签证书继续使用已配置的 CA，不关闭 TLS 校验。先在进程内确认 CLI 状态的平台等于 `--live` 地址，只记录状态键和是否匹配。

```powershell
node (Join-Path $Package 'tests/probes/guard-runtime.probe.mjs') `
  --plugin $Candidate `
  --live https://192.168.50.28 `
  --kn supply_ontology_hand `
  --other-kn worldcup_vega_catalog_bkn
```

先用默认 `--cli openbkn` 验证 PATH / PATHEXT。再把 `--cli` 显式指向实际 `openbkn.cmd` 跑一次，确认绝对路径形态；若实际路径没有空格，W1 的临时 shim 测试覆盖含空格的情况，无需移动真实安装。

每次必须同时满足：

- 全部记录与总结是 `mode:"live"`，插件版本 `…-4`，DSH tools `0.2.0-rc.2`，退出码 0，16/16。
- 跨网络、缺失、非字符串 `kn_id`，排除／未知工具和交互生命周期拒绝均通过。
- 输出的真实 `interactionId` 对应平台操作记录中**只有一条 `search_capabilities`**。保存脱敏的工具名清单，不提交操作输入输出或业务正文。
- 保留完整命令、退出码、脱敏 JSONL、调用形态（PATH 或绝对 `.cmd`）。日志不含 Token、浏览器授权码或模型密钥。

Windows 路径或参数含 `%`、`!`、双引号或换行时，探针会拒绝 cmd 展开语法；这仅是手动探针的限制。不要修改真实用户名或 CLI 安装位置，遇到时单独报告。

## W3. 桌面版面板登录（必做，需要用户配合一次）

1. 完全退出桌面版和 npm DSH。优先用独立桌面测试 home/profile、空 `BKN_CONFIG_DIR` 启动桌面版；若宿主不能这样启动，沿用上轮经过验证的 desktop profile 备份／还原流程。
2. 安装**相同候选 tgz**，配置仅写 `baseUrl`，不加 `cliPath`。安装后核对 52 个发布文件与候选一致。
3. 确认测试 CLI 为从未登录状态（只有 `hasToken:false`），面板显示登录入口。不要用登出后的 `auth delete` 造这个状态。
4. 用户点击「使用 OpenBKN CLI 登录并同步」，在浏览器完成授权。记录浏览器是否自动打开、等待文字、耗时、报错；授权后应无需重启就列出网络。
5. 记录面板是否仍能刷新。无需发送模型问题或重跑 R1–R9。
6. 卸载前再核对安装目录；还原用户状态。临时 CLI 登录如需清除由用户执行登出；不直接删除凭据文件。

## W4. 授权异常（建议本轮一起补，不能把源码判断写成实测）

三个场景各自使用全新的测试状态，避免同时跑多个登录进程：

| 场景 | 用户与 agent 操作 | 必须记录 |
|---|---|---|
| 一直不授权 | 用户发起面板登录，不在浏览器授权，保持面板打开 | 等待文案、按钮是否可用、CLI 是否仍运行、何时终止；未等到终止时只写观察时长 |
| 授权中途关闭面板 | 用户发起登录，agent 关闭 OpenBKN 面板再重开，不关闭宿主；用户暂不授权 | CLI 是否继续运行；重开后界面状态；若随后由用户授权，是否自动重开或恢复目录 |
| 设备码超时 | 不授权并等到真实 CLI 超时／设备码过期；不得把外部杀进程或缩短的模拟超时当成此项 | 实际终止耗时、CLI 退出码（不保存授权正文）、面板最终文字、能否重新发起登录 |

第一项可以继续等待而覆盖第三项，不必创建第二个同类设备码。各阶段记录界面时间，不用固定等待后猜测成功。浏览器没弹出时单独列异常；不要用带 `&` 的伪造平台 URL 做登录测试。

## 回传与还原

结果文件：`docs/handoff/2026-10-04-windows-verification-v4-followup-results.md`。从本轮指定 SHA 切新的 `docs/windows-verification-v4-followup-results` 分支，仅提交脱敏报告并推送；不向主开发分支或 main 推送。用户把报告提交 SHA 发回主开发 agent。

报告要列：源码／候选／宿主／CLI 基线、W1–W4 每项实际结果与证据类型、两次 live 的 Interaction ID、安装内容比对、所有异常、未测项及理由、动过的状态和还原结果。截图只取 DSH 窗口；原始平台业务数据留本机，不提交。

主开发 agent 会核对结果和异常，再由用户决定取舍。Windows 回传之前不合并、不发版。相同候选已覆盖的 R1–R9 不因本轮探针修改而重复。
