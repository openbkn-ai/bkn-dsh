# Windows 第二轮验证：bbab999（CLI 路径解析修复）

> 执行：2026-10-02 00:10 – 00:40（北京时间）。按更新后的 `docs/handoff/2026-09-30-windows-verification.md` 执行，范围是两种形态的第 1–4 项，加上可选的"找不到 CLI"提示检查。
> **结论：修复有效。** 两种形态都**不加 `cliPath`**，第 1–4 项全部通过；把 CLI 从 PATH 里拿掉后，面板正确提示"DSH 找不到 OpenBKN CLI"，服务端返回 `openbkn/cli-unavailable`。
> 本轮没有修改任何代码。

## 1. 测试包与环境

| 项 | 值 |
|---|---|
| 测试包 | 提交 `bbab999`，CI run `36843256276`（success），`gh run download 36843256276 -R openbkn-ai/bkn-dsh -n plugin-tarball` |
| sha256 | `91d0b487596e3bf83ddaa9a7c54657171d1c4965522902ad936871f52ba8a6a7`（`Get-FileHash` 核对一致） |
| 确认装上的是新代码 | 两个 profile 里已安装的 `lib/index.js` 都含 `resolveExecutable` 和 `cli-unavailable` |
| 平台 | `https://192.168.50.28`。`GET /api/bkn-backend/v1/health` 返回 `ServerVersion: 0.1.5`（见发现 2） |
| CLI | `@openbkn/bkn-sdk@0.1.5-rc.1`。平台重装后旧 token 返回 401，用户重新执行了 `openbkn auth login` |
| DSH | 桌面版 `0.2.0-rc.2`（用自带的 `dsh.cmd` 装插件，自带 pnpm 11.7.0）；npm 版 `0.2.0-rc.2`，另装了 pnpm 11.7.0 |
| 配置 | 两个 profile 的 `cordis.patch.yml` 都**只写了 `baseUrl`**，没有 `cliPath` |
| CLI 位置 | `openbkn.cmd` 在用户 PATH 的 `C:\Users\kalia\scoop\apps\nodejs-lts\current\bin` 下 |
| 模型 | 两种形态都是 DeepSeek-V41-Flash / High；发送前都在模式菜单里明确选了标准模式 |

启动方式：
- 桌面版是用 `explorer.exe` 打开开始菜单的快捷方式启动的，父进程是 `explorer`，和用户从开始菜单启动时的环境（包括 PATH 和 `NODE_EXTRA_CA_CERTS`）一致；
- `dsh web` 是在 shell 里启动的，去掉了 agent 宿主注入的代理变量，带上 `NODE_EXTRA_CA_CERTS`。

测试顺序按新版说明文件：先测桌面版，测完把 `storages/openbkn_workspace_bindings.json` 移走，再测 npm 形态。

## 2. 结果

| # | 桌面版 | npm 命令行（`dsh web`） |
|---|---|---|
| 1 | ✅ 列出 2 个网络，有标准模式提示 | ✅ 同左 |
| 2 | ✅ 原生"Select Workspace Directory"弹出后取消，回到网络列表 | ✅ 同左（这次对话框直接出现在前台） |
| 3 | ✅ 选空目录 `ws-desktop-r2`，绑定成功，标题栏出现徽标 | ✅ 选空目录 `ws-web-r2`，同左 |
| 4 | ✅ 40 张，全部"已确认" | ✅ 40 张，全部"已确认" |
| 可选 | 未测 | ✅ 见下 |

选择器打开期间，面板提示换成了新文案："请在弹出的系统窗口中选择工作区目录（窗口可能被其他窗口挡住，可从任务栏或 Dock 切换过去）……"。

会话日志：
- 桌面版第 4 项：5 次工具调用（`bkn_start_interaction` new → `search_schema` / `query_object_instance` / `query_metric`，`kn_id` 都是 `supply_ontology_hand` → `bkn_finish_interaction`），全部成功；共 56 个事件，带 `openbkn/` 类型的 0 个，带 `ignorable` 标记的 0 个。
- npm 第 4 项：`bkn_start_interaction` new → **7 次 `mcp__openbkn__run_code`** → `bkn_finish_interaction`，全部成功；共 77 个事件，带 `openbkn/` 类型的 0 个，带 `ignorable` 标记的 0 个（见发现 4）。

可选项（找不到 CLI）：把 `scoop\apps\nodejs-lts\current\bin` 和 `scoop\persist\nodejs-lts\bin` 从 PATH 里去掉（`node.exe` 所在的上一级目录保留），用绝对路径启动 `dsh.cmd web`，然后打开面板：
- 面板：「DSH 找不到 OpenBKN CLI（openbkn）。请先安装 `npm install -g @openbkn/bkn-sdk` 并执行 `openbkn auth login`，确认启动 DSH 的环境 PATH 里能找到它，然后重启 DSH；也可以在 cordis.patch.yml 的 openbkn-business-context 条目里把 cliPath 设为它的绝对路径（Windows 上要写到 openbkn.cmd）。」
- `openbknBusinessContext/status` 返回：`{"ok":false,"error":{"code":"openbkn/cli-unavailable","message":"OpenBKN CLI \"openbkn\" is not available to the DSH host.","details":{"cliPath":"openbkn"}}}`
- 前提：DSH 凭证库里已经有前面同步进去的 `OPENBKN_MCP_TOKEN`。在这种情况下也能报出 CLI 缺失。

## 3. 发现

1. **🟡 版本号没变，内容变了。** 这次的包和第一轮的 `6c5a320d…` 都叫 `0.2.0-rc.2-openbkn.0.2.0-1`，内容却不同。按仓库约定，输入变了再发布应该递增 `-<n>`。本次是本地 `file:` 安装，pnpm 按包的完整性哈希取到了新内容，已核实；但如果同一个版本号发到 npm 上，第一轮的结果和这一轮的结果就对应不到唯一的产物了。正式发布前建议改成 `-2`。
2. **🟡 文档里的平台版本过时。** 测试平台已经是 0.1.5（有 health 接口实测），但 `2026-09-30-windows-verification.md` 和 README 仍写着"测试平台是 EE 0.1.4，用 CLI 0.1.4 或 0.1.5-rc.1"。0.1.5 平台有 `/api/bkn-backend/v1/health`，按理说正式版 CLI `0.1.5` 能通过版本检查，可以考虑把文档改成"装与平台版本一致的 CLI"。本轮没有验证正式版 CLI 0.1.5。
3. **🟡 "找不到 CLI"的提示里，安装命令没带版本号**（`npm install -g @openbkn/bkn-sdk`），和文档"装与平台版本匹配的 CLI"不一致。平台不是最新版时，照着提示安装又会碰上第一轮的版本检查问题。
4. **🟡 npm 那一轮模型全程只用 `run_code`。** 管理策略写的是"`run_code` 只在没有匹配的已发布工具时作为只读兜底"，而这一轮 7 次调用全是 `run_code`，一次 `query_*` 都没用。
   - 每次的参数只有 `code` 和 `bkn_context` 两项，代码里引用的网络都是 `supply_ontology_hand`，结果正确。
   - 但 `scoped-business-context.ts` 里写明了 `run_code` 不在 `kn_id` 绑定检查的范围内。模型一旦走 `run_code`，网络隔离就只能靠提示词。
   - 平台升到 0.1.5 后，工具描述或工具集是否有变化、导致模型更倾向 `run_code`，需要在 Mac 上结合平台核对。这个问题与 Windows 无关。
5. **ℹ️ 平台重装后，CLI 的本地状态有误导性。** `openbkn auth status` 仍显示 `hasToken: true, expired: false`，但 `openbkn bkn list` 返回 401。在插件里会表现为认证失败。这不是插件的问题；如果测试平台还会重装，可以在测试说明里提醒"平台重装后要重新登录"。

## 4. 还原情况

- 测前备份：`C:\Users\kalia\.dsh-backup-round2`，12926 个文件，0 个失败。
- 已还原：与备份逐文件对比没有差异；凭证库里插件同步进去的 `OPENBKN_MCP_TOKEN` 已移除，没有另存副本。
- 实验产物（全部是移动，没有删除）：`C:\Users\kalia\.dsh-backup-round2\_experiment-artifacts\`，包括两个工作区的会话、session-bindings、`web` profile、desktop profile 的 node_modules/lockfile、两份 workspace-binding 文件；被修改过的原文件在测试结束时的副本放在 `modified-originals\`。
- 用户 PATH 和用户环境变量本轮都没有改动。
