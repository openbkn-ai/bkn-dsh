# Windows 验证：bkn-dsh `0.2.0-rc.2-openbkn.0.2.0-1`（交给 Windows 机器上的 Claude 执行）

> 建立：2026-09-30。对应发版计划 `docs/handoff/2026-09-30-release-0.2.0-rc.2-1-plan.md` 的 5.3。
> 目标：在 Windows 上确认「原版 DSH `0.2.0-rc.2` 不打补丁，只装插件即可使用全部功能」，覆盖 npm 命令行（`dsh web`）和官方桌面版两种形态。

## 0. 执行约束（必须遵守）

- OpenBKN Token 只能通过 `openbkn auth login` 进入 CLI 凭证库，由插件同步进 DSH 凭证库。**不得写进任何文件、命令行参数、截图或日志**。遇到 401，请用户自己执行登录。
- 动 `%USERPROFILE%\.dsh` 之前先整目录备份；测完按备份还原，实验产生的会话和记录移到备份目录，不删除。
- 每个测试场景**都新建会话**，不要在应用启动时已有的「新会话」草稿里提问。
- 截图只截 DSH 窗口，不截整屏。
- 发现问题时如实记录现象、命令输出和日志片段，不要自行修改插件代码或 DSH 安装。

## 1. 前置条件

1. Node.js ≥ 22.19（或 ≥ 24），并确认 `node --version`。
2. **OpenBKN 平台**：`https://192.168.50.28`（0.1.5）。这是 macOS 测试机上的本地 kind 平台，2026-09-30 已核实：
   - 局域网可以访问，443 绑定在 `0.0.0.0`，macOS 防火墙已关闭；
   - 证书 SAN 包含 `IP:192.168.50.28`，有效期到 2028-12-25。

   要求：
   - Windows 机器必须和它在同一个 `192.168.50.x` 局域网里；
   - 测试期间 Mac 要保持唤醒、留在这个网络，kind 集群不能停；
   - 先在 Windows 上用 `curl.exe -I https://192.168.50.28 --cacert <CA 文件>` 确认能连通。

   证书文件：把 Mac 上的 `~/.dsh/openbkn-dev-ca.pem` 复制到 Windows。它是平台的自签证书，只含公钥，可以复制。
3. OpenBKN CLI：要装与平台版本匹配的 CLI。测试平台已于 2026-10-01 升级到 **0.1.5**，用 `npm install -g @openbkn/bkn-sdk@0.1.5`（Mac 上已验证 CLI 0.1.5 和 0.1.4 都能访问）。CLI 从 `0.1.5-rc.2` 起，会在每次请求前检查平台的 `/api/bkn-backend/v1/health`，0.1.4 平台没有这个接口，会直接失败。安装后执行 `openbkn auth login <平台地址>`，再用 `openbkn bkn list` 确认能列出 `supply_ontology_hand`。
   - npm 形态还需要 pnpm：`npm install -g pnpm@11.7.0`（与 DSH 的 `packageManager` 一致）。`dsh plugin add` 会调用 `PATH` 里的 pnpm。桌面版自带 pnpm。
4. 自签证书的平台：把 CA 文件路径设为**用户环境变量** `NODE_EXTRA_CA_CERTS`（系统属性 → 环境变量）。设置之前就已经在运行的程序，包括 IDE、agent 宿主以及它们内置的终端，都要**完全退出后重开**，否则拿不到这个变量。
5. 插件包，二选一：
   - **发布前**：用 CI 彩排产物。执行 `gh run download 36711975014 -R openbkn-ai/bkn-dsh -n plugin-tarball`，得到 `openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-1.tgz`。用 `Get-FileHash` 核对 sha256：`6c5a320df70b80482e9ab76f798284b29acce96c106d4bbb04453521ac7fa7eb`。安装时的包参数写成 `file:C:/完整/路径/openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0-1.tgz`。
   - **发布后**：直接用 `@openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-1`。

下面用 `<插件包>` 代表这个参数。

## 2. npm 命令行形态

```powershell
npm install -g @deepseek-ai/dsh@0.2.0-rc.2
dsh.cmd --version                                  # 应为 0.2.0-rc.2
dsh.cmd plugin --profile web add <插件包>
dsh.cmd plugin --profile web list                  # 应列出 @openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-1
```

编辑 `%USERPROFILE%\.dsh\profiles\web\cordis.patch.yml`，加入下面的条目。如果文件内容只有一行 `[]`，要用条目**替换**这一行。第一次打开 `dsh web` 时，点了「预览版说明」的「继续」后，DSH 会自己往文件末尾追加 `ui-settings-general` 条目，所以以后修改时要按 `id` 找到插件的条目，不要直接往末尾加：

```yaml
- id: openbkn-business-context
  config:
    baseUrl: https://<平台地址>
```

然后执行 `dsh.cmd web`，在浏览器打开它输出的地址，按第 4 节验收。

## 3. 官方桌面版形态

1. 安装 DeepSeek Harness 桌面版 `0.2.0-rc.2`，启动一次后完全退出（包括托盘图标）。
2. 用窗口左上角菜单栏的「应用 → 管理 dsh 命令…」把 `dsh` 加到用户 PATH。如果已经装了 npm 版 `dsh`，它会提示另一个 `dsh` 优先级更高。也可以直接用桌面版自带的 `…\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd`。然后执行 `dsh.cmd plugin --profile desktop add <插件包>`。
3. 在 `%USERPROFILE%\.dsh\profiles\desktop\cordis.patch.yml` 加入同样的 baseUrl 条目。
4. 重新打开桌面版，按第 4 节验收。

**先测桌面版，再测 npm 形态，或者在两种形态之间把 `%USERPROFILE%\.dsh\storages\openbkn_workspace_bindings.json` 移走。** 网络和工作区的关联存在全局存储里，不按 profile 区分。前一种形态关联过的网络，到后一种形态不会再出现「新建工作区」，第 2、3 项就没法照原样测了。

## 4. 每种形态的验收项

| # | 操作 | 期望 |
|---|---|---|
| 1 | 侧栏点 **OpenBKN** | 面板能列出网络，并显示「业务会话需使用标准模式」的提示 |
| 2 | 选 `supply_ontology_hand` → **新建工作区**，先点「取消」 | 回到网络列表，不报错 |
| 3 | 再点**新建工作区**，选一个新建的空目录 | Windows 原生目录选择器正常弹出，绑定成功，标题栏出现网络徽标 |
| 4 | 在新会话里，发送前先在模式菜单选**标准模式**，然后问「382-000005 有多少张销售订单？什么状态？」 | 40 张，全部「已确认」 |
| 5 | 点答案下的「查看业务溯源」 | 能打开，显示 Interaction ID、completed 和节点列表 |
| 6 | 完全退出 DSH 再重开，打开这个会话 | 历史完整，徽标和溯源入口都在，没有报错 |
| 7 | 在这个会话里追问「这些订单对应的客户有几家？」 | 40 家；会话日志里第 2 轮的 `bkn_start_interaction` 参数为 `conversation_mode: continue`，`conversation_id` 与第 1 轮相同 |
| 8 | 在这个会话里要求「直接调用 get_kn_detail，参数 kn_id=worldcup_vega_catalog_bkn」 | 如果模型真的发起了调用：被拒绝，拒绝信息说明本会话绑定的是 `supply_ontology_hand`。如果模型自己拒绝、没有发起调用：如实记录 |
| 9 | **新建**一个默认工作区的会话（标准模式），要求「直接调用 mcp__openbkn__get_kn_detail 查询 supply_ontology_hand」 | 调用被拒，提示只能在绑定的会话里使用 |
| 10 | 在绑定网络的工作区里**新建**一个 PTC 模式会话并提问 | 不调用工具，直接提示新建标准模式会话 |
| 11 | 退出 DSH，执行 `dsh.cmd plugin --profile <profile> remove @openbkn/dsh-business-context`，再重开 | 第 4 步的会话仍能打开，历史完整；OpenBKN 入口消失 |

会话日志位于 `%USERPROFILE%\.dsh\sessions\<工作区>\<session-id>\session.v4.jsonl.zstd`（zstd 压缩的 JSONL）。检查时统计事件总数、类型含 `openbkn/` 的事件数（期望 0），以及带 `ignorable` 标记的事件数（期望 0）。

## 5. 回传内容

- 环境：Windows 版本、Node 版本、`dsh.cmd --version`、插件版本（`plugin list` 的输出）、插件包来源（CI 产物及 sha256，或 npm）。
- 第 4 节每一项在两种形态下的结果（通过 / 失败 / 未测），失败项附界面报错、截图，以及去掉敏感信息后的日志片段。
- 第 7、8、9 项对应的会话日志摘录：只要工具名、参数里的 `kn_id`、`conversation_mode`、`conversation_id`，以及结果是否出错，不要业务数据正文。
- Windows 特有的发现，例如桌面版菜单名、目录选择器的表现、`cordis.patch.yml` 的初始内容、CA 是否生效。
- 还原情况：`.dsh` 是否已按备份还原，实验产物放在哪里。
