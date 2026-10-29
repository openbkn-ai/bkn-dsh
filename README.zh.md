# bkn-dsh

**近期更新（9 月 21 日至 10 月 12 日）：** [中文](docs/releases/2026-10-12-recent-updates.zh.md) · [English](docs/releases/2026-10-12-recent-updates.md)。

**图文使用手册（历史 -9 流程，当前版本与安装步骤以下文为准）：** [中文](docs/user-guide/README.zh.md) · [English](docs/user-guide/README.en.md) · [PDF（中文）](docs/user-guide/bkn-dsh-9-user-guide.zh.pdf)。覆盖安装配置、CLI、登录、供应链问答、溯源与诊断，配有带点击编号的实机截图。

已发布 -7 的历史记录：[GitHub Release](https://github.com/openbkn-ai/bkn-dsh/releases/tag/v0.2.0-rc.2-openbkn.0.2.0-7)、[累计更新说明](docs/releases/2026-10-06-unified-7-notes.md)与[公开包核验凭证](https://github.com/openbkn-ai/bkn-dsh/releases/download/v0.2.0-rc.2-openbkn.0.2.0-7/PUBLICATION-VERIFICATION.json)。历史 -5/-6 包及较早的 -7 候选保留原身份，验收结论仍限定于记录的包和场景。

[English](README.md)

将受治理的 OpenBKN 业务知识带入 DeepSeek Harness 对话。

## 0.2.1 发布状态（2026-10-29）

`@openbkn/dsh-business-context@0.2.1-rc.3-openbkn.0.2.1` 已发布到 npm `rc`；[GitHub Release](https://github.com/openbkn-ai/bkn-dsh/releases/tag/v0.2.1-rc.3-openbkn.0.2.1) 当前标为预发布。本检查点的 npm `latest` 仍为 `0.2.0-rc.2-openbkn.0.2.0-13`。`latest` 推广及本机 npm 认证由维护者处理，本次文档更新没有执行这些操作。下方安装命令固定完整版本号，避免受 dist-tag 指向影响。

### 最终 CI 与制品身份

| 运行 | 结果与范围 |
| --- | --- |
| [最终候选 CI 40361613728](https://github.com/openbkn-ai/bkn-dsh/actions/runs/40361613728) | `publish=false` 通过；源码 `db68c80070f3475a1a460c3c9fca84d26944e198`；包含构建、测试、包检查，以及同一 tgz 在两个官方 npm Host 上的受控检查。 |
| [主线重建 CI 40368159024](https://github.com/openbkn-ai/bkn-dsh/actions/runs/40368159024) | 在 `ddbf578b93efca1872e0ae9781dafae5713e9deb` 上通过；82 文件候选与已接受的最终 CI 候选逐字节相同。 |
| [发布 CI 40369214007](https://github.com/openbkn-ai/bkn-dsh/actions/runs/40369214007) | 通过；将本版本发布到 npm `rc` 并建立对应 GitHub Release。 |

已接受 CI tgz 的 SHA256 为 `27ccf15c46e4f71ef850ee481e22556b70f4d4795e89d7d587a2e3210fc6b3e3`；npm/GitHub 公开 tgz 为 `3a877e1fa6ae218b36cfc4d65ca0bb1b6e17363880465ac164c31a89e14ed46d`。82 个文件路径一致，仅 `package.json` 的序列化不同，解析后的元数据相等。两份各 12 文件的 MCP 配套包及 Release 的八份附件保留已接受身份。这些都是既有运行和制品，本次状态更新不重建、不重新发布。

### 兼容范围与安装前提

精确声明的运行版本为官方 DSH **`0.2.0-rc.2` 与 `0.2.1-rc.3`**，见[宿主清单](compat/dsh-hosts.json)。DSH `0.2.1-rc.4`、`0.2.2-alpha.2` 及其他版本不在本制品声明和已验证的范围内。源码构建生成器独立固定为 `0.2.0-rc.2`，不表示运行时只支持这一版。

版本串中的 OpenBKN `0.2.1` 是维护者确认的本次发布标识。实际平台与 CLI 证据为正式 **OpenBKN `0.2.0` 与 CLI `0.2.0`**，不声明已在平台 `0.2.1` 或最新未发布 main 上验收。

#105 同源保护需要**与 Host 匹配的 profile MCP 配套包**，插件 tgz 不会自动安装它。请按[放置、已挂载实例核对与恢复说明](compat/mcp-profile-backport/README.md)操作，保留官方原应用，并选择对应精确 Host 的配套包。保护范围是已评审的固定 Bearer 业务桥接，不代表原生 Host 或全局 SDK/OAuth 已修复。包管理器重装、依赖清理及将来升级 Host 可能替换该 profile 依赖。

### 验收范围与保留限制

- [0.2.1 插件任务](https://github.com/openbkn-ai/bkn-dsh/issues?q=is%3Aissue%20project%3Aopenbkn-ai%2F12)均已关闭，包括 #93/#97。最终候选已记录受影响的 Mac/Windows Desktop 后端及 npm 检查；较早的 GUI、语言、登录、B1 和 MCP 向量证据按原制品身份复用，不表示在每个形态重新跑过全部场景。
- [#93 既存记录的 API/Studio 对照](docs/evidence/2026-10-27-issue93-native-studio/RESULTS.md)及 [#97 Mac npm/Web 联动检查](docs/evidence/2026-10-28-issue97-native-linkage/RESULTS.md)已完成。后者通过公开 Session/Workspace API 建立只读回放，核对三条结论、当前问答切片十一条关系；没有新模型回合，也不裁决平台记录答案的业务正确性。
- [Windows rc.3 Desktop 原生 UI 补证](docs/handoff/2026-10-27-release-021/native-ui-supplement-windows/RESULTS-native-ui-supplement-20261028.md)对指定既存记录为 **PASS_WITH_LIMITS**。直接构造存储的回放没有验证答案归因绑定；schema 引用强制切换视图保持 UNKNOWN，首次渲染崩溃原因保持 UNKNOWN，本次补证附带的真实业务 CSV 条件项为 NOT_RUN。较早的打包 CSV 检查单独保留；协调复核未独立取回 Windows 私有截图、AX、崩溃及注册表原件。
- B1/#98 和启动问题 #108 已按有界调查完成收尾，不宣称普遍修复。历史 runner/浏览器/Job、菜单退出、启动身份/观察窗和收态证据限制继续保留。原 G6/模型 FAIL/BLOCKED 与 `formalAcceptanceEligible=false` 记录不改为整体正式验收通过。
- [Foundry #2573](https://github.com/openbkn-ai/bkn-foundry/issues/2573)仍是原平台证据通道的独立问题，企业旧样例可读不表示该环境已修。业务及模型问题保留上游归属；插件忠实保留平台状态、原因、记录与原生答案，不增加答案仲裁、纠正回合或重复业务计算。

完整时间线和维护者处置见[当前验收台账](docs/plans/0.2.1/REMAINING-WORK.md)。冻结 -30/-31/-32 及[早期开发检查点](docs/evidence/2026-10-21-local-34/RESULTS.md)是历史输入，不代表当前发布候选或仍缺最终 CI。

### CSV 交付与 Interaction 记录

本版在宿主提供文件服务时使用受会话约束的 `openbkn_export_csv` 交付已有平台 CSV：校验后将原始 UTF-8 字节（最多512 KiB）保存为当前 DSH 工作区的新文件。导出要求当前绑定的 Interaction 和工作区写权限；只读会话会拒绝。导出成功后可打开返回的本地文件链接。Host read/grep/present 仍不开放。受管指引要求回答和 CSV 序列化保留来源精度，并避免 Python 默认通用格式的六位有效数字截断；仅按用户或平台明示规则取整。模型回答和文件内容仍须独立验证。

导出结果返回已验证的 `markdown_link`，最终回答须在结束 Interaction 后一并给出答案、口径和该链接，避免折叠进度消息造成漏链。统计范围与所请求计算的符号依平台合同；插件不重算业务结果。

正式版关闭采集时仍返回 managed Conversation/Interaction ID：业务调用继续携带所要求的 `bkn_context`，finish 使用当前 Interaction ID。溯源保留已披露身份，明确标注未记录证据并显示本地时间线；旧部署显式无身份降级保留为独立兼容路径。插件不重算业务结果、不改模型回答。

## 为什么

企业决策依赖可信的业务对象、指标、规则、关系和权限范围内的证据；通用对话本身不能提供这一受治理上下文。

## 做什么

bkn-dsh 是一个增量式 DeepSeek Harness 插件。授权用户可为一个会话选择一个 OpenBKN 业务知识网络，在明确边界内分析问题，并查看每轮已完成回答可用的业务溯源。

> 版本前提：溯源能力取决于部署能力、已挂载路由与账号权限。正式 0.2.0 社区构建提供标准 Interaction/操作记录，原生 detail/explanations 需要相应扩展。#93/#97 已补齐企业既存非空样例与有界联动证据；[Foundry #2517](https://github.com/openbkn-ai/bkn-foundry/issues/2517)已完成社区/扩展分类，[#2573](https://github.com/openbkn-ai/bkn-foundry/issues/2573)仍是原平台证据通道的独立问题。单个 404 或另一环境成功，均不能用于裁定许可状态或证明本部署已修。

## 面向谁

- 需要可解释、受治理分析的业务用户和分析师；
- 希望业务语义被一致复用的知识网络维护者；
- 需要最小权限知识访问、又不希望暴露任意数据接口的企业 AI 平台团队。

## 业务价值

- 让分析建立在授权的业务语义和平台数据之上；
- 将每个会话固定在一个明确、不可变的知识网络范围内；
- 保留原生 DeepSeek Harness 工作流，并增加可追溯的 OpenBKN 上下文；
- 降低获得可信业务洞察的交互成本，无需用户掌握查询语言。

发布包内的 README 保留发布时快照。当前发布状态以本仓库 README 和对应 GitHub Release 为准；更新这两处说明不会修改已发布包。

## 安装并开始使用

若保留了 <= -4 版本带 `name` 断言的配置，请按[包 README 的迁移说明](packages/openbkn-business-context/README.zh.md#升级--7name-断言配置需迁移)调整。全新安装不需要这项迁移。

保留受支持的官方 DSH 应用或运行时，通过它自己的插件管理器安装本插件。已评审的 #105 同源保护还需要上方说明的匹配 profile MCP 配套包，插件不会自动安装它。请选择发布记录覆盖的精确 Host 与 profile。下表说明 DSH 的运行入口，Desktop/npm 验收与历史源码构建结果仍按各自范围记录：

| DSH 形态 | 运行方式 |
| --- | --- |
| 官方桌面版 `0.2.0-rc.2` 或 `0.2.1-rc.3` | 对应版本的官方 DeepSeek Harness 应用 |
| npm 命令行 | 新安装选择 `@deepseek-ai/dsh@0.2.0-rc.2` 或 `@deepseek-ai/dsh@0.2.1-rc.3`，再运行 `dsh web`；已有受支持安装保持原样。 |
| 源码检出（构建后运行） | 构建对应锁定的 DSH tag，再运行 `node apps/cli/lib/bin.js web`；另见源码构建指南及其版本限定证据。 |

此前包的历史验收在 macOS arm64 上覆盖了三种形态：安装、绑定、带工具调用的问答、业务溯源、重启后重新打开会话，以及续接平台会话（[证据](docs/evidence/2026-09-29-desktop-direct-install.md)）。Windows 10 上也验证了桌面版和 npm 命令行：默认配置下的登录、绑定和问答已通过（第二轮，CLI 查找修复之后）；其余各项——溯源、重启续接、未绑定和 PTC 拒绝、卸载——是在第一轮设置了 `cliPath` 的情况下通过的，当时还没有这个修复（[结果](docs/handoff/2026-10-02-windows-verification-round2.md)）。该基线没有测 Windows 源码检出形态。这些历史结果不能替代新包或下述配置流程的验收。

### 开始之前

1. **OpenBKN CLI。** 本版已验证的 OpenBKN 0.2.0 平台使用 `npm install -g @openbkn/bkn-sdk@0.2.0`，并用 `openbkn --version` 核对。更早的平台/CLI 配对见对应历史发布，不作为本版验收。可以先配置插件，面板会在需要时发起 CLI 授权。DSH 要能从自身进程的 `PATH` 找到 `openbkn`；macOS 桌面版读取登录 shell 环境，Windows 使用 `openbkn.cmd`。找不到时，在面板的**设置 → 高级设置**里填写 CLI 绝对路径。Windows 上要写到 shim 文件本身，例如 `C:/Users/<你>/AppData/Roaming/npm/openbkn.cmd`（`where.exe openbkn` 可以查到位置）。
2. **pnpm（只有 npm 命令行需要）。** npm 版的 `dsh` 会把 `plugin add` 交给 `PATH` 里的 `pnpm`。DSH `0.2.0-rc.2` 对应 `pnpm@11.7.0`，`0.2.1-rc.3` 对应 `pnpm@11.28.5`，按自己的 Host 选择；桌面版自带 pnpm。
3. **自签证书的平台**（公开受信任的证书可跳过）。DSH 要通过 `NODE_EXTRA_CA_CERTS=<CA pem 路径>` 信任平台 CA：
   - 在终端里运行 `dsh web`：在命令前加上这个变量。
   - macOS 桌面版：在 `~/.zprofile` 或 `~/.zshrc` 里 `export NODE_EXTRA_CA_CERTS=…`。桌面版启动时会读取登录 shell 的环境，从 Dock 或访达启动也一样。
   - Windows：设为用户环境变量，然后把需要用到它的程序**完全退出后重开**，包括设置之前就开着的 IDE 或 agent 宿主里的终端。
4. **使用标准模式。** 绑定了 OpenBKN 网络的会话必须使用 DSH 的**标准模式**。目前不支持 PTC 模式：插件会拒绝其中的 `run_code`，模型会提示你新建一个标准模式的会话。模式要在发送第一条消息前、在模式菜单里选定，之后不能再改。

### 1. 安装插件

在 DSH 的**插件**页面选择**添加插件**，填写 `@openbkn/dsh-business-context@0.2.1-rc.3-openbkn.0.2.1`，选择安装源后安装。也可以先停止 DSH，再用终端安装；桌面版需要至少启动过一次，profile 才会存在：

```bash
# 桌面版（macOS）。应用菜单里的「管理 dsh 命令…」也可把 dsh 加到 PATH。
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" plugin --profile desktop add @openbkn/dsh-business-context@0.2.1-rc.3-openbkn.0.2.1

# npm 命令行
dsh plugin --profile web add @openbkn/dsh-business-context@0.2.1-rc.3-openbkn.0.2.1

# 源码构建，在 DSH 源码根目录执行
node apps/cli/lib/bin.js plugin --profile web add @openbkn/dsh-business-context@0.2.1-rc.3-openbkn.0.2.1
```

Windows 上用 `dsh.cmd` 代替 `dsh`。请使用实际启动的 Host 的 profile 和 `DSH_HOME`；默认 `desktop` 与 `web` 是独立的 profile。从下载包安装时，把包名替换为 `.tgz` 的绝对路径。

### 2. 在 OpenBKN 面板里配置

1. 启动 DSH，点击侧栏底部的 **OpenBKN**。未填写地址是正常的**待配置**状态：组件保持启用，诊断也可打开。配置地址前，插件不会连接 OpenBKN，也不会读取它的 CLI 凭据。
2. 填写平台的绝对 `http://` 或 `https://` 地址，点击**保存并继续**。非法地址会被拒绝，不改动已保存配置。地址保存成功与平台连接/授权成功是两件事。
3. 若 DSH 找不到 CLI，打开**高级设置**填写 `cliPath`，默认值是 `openbkn`。以后可通过面板右上角的**设置**重新编辑同一表单。业务回合运行时，请等它结束再改平台地址。
4. 出现登录提示后，点击**使用 OpenBKN CLI 登录并同步**，在浏览器完成授权，再回到 DSH。已有凭据被拒绝时，也使用这个入口重新登录。403 可能需要平台管理员授予权限，不能保证同账号重新登录就能恢复。

设置通过 DSH 配置编辑器保存到当前 profile，并由正常的组件重载应用；其他配置字段会保留。更高优先级的配置覆盖可能阻止修改生效，面板会明确报告，不会绕过它。临时网络或证书失败不会清空地址。已有会话保留原平台/网络绑定，修改地址不会自动改绑。

这条使用流程无需编辑 YAML，也无需粘贴访问令牌。凭据仍由 OpenBKN CLI 与 DSH 凭证管理。管理员需要维护高级配置时，仍可使用仅按 `id` 定位的 profile override：

```yaml
- id: openbkn-business-context
  config:
    baseUrl: https://<你的 OpenBKN 平台地址>
    # cliPath: /openbkn/的/绝对路径
```

平台地址不是敏感信息。不要把 Token 写进 Cordis YAML。配置文件中主动填写的非法地址仍是配置错误，与未设置地址的待配置状态不同。

### 3. 绑定网络并提问

1. 授权后选择有权限的知识网络，为它新建本地工作区（**新建工作区**会打开目录选择器），或继续已有工作区。
2. 在新会话里保持**标准模式**，然后提问。每个完成的回答下都有**查看业务溯源**（执行溯源、业务上下文图、证据链）。
3. 连接或配置有问题时，点击 OpenBKN 面板右上角的**诊断**并导出报告。关闭面板后，旧请求完成不会重新打开它；关闭面板不代表已经取消正在进行的浏览器授权。

在 macOS 上用 `dsh web` 时，目录选择器会在运行 `dsh web` 的那台机器上弹出。远程或 SSH 访问使用 DSH 的浏览目录后端，无法从插件面板新建工作区：请先把网络关联到一个已有的本地工作区。

### 卸载

在 DSH 的**插件**页面移除 `@openbkn/dsh-business-context` 整包。若宿主要求停止 profile，先停止再重试。也可以停止 DSH 后执行：

```bash
dsh plugin --profile <desktop|web> remove @openbkn/dsh-business-context
```

卸载会卸载包组件、移除 profile 包依赖，保留用户在 profile 补丁里的配置、DSH/OpenBKN 凭据、CLI 登录状态、会话、网络/工作区绑定及工作区文件。这是卸载，不是退出账号或清空数据。不要删除整个 `node_modules/@openbkn` 目录，其中可能还有其他包。

当前版本不向 DSH 会话日志添加插件事件，因此会话仍然可读；重装后可以复用保留的配置与绑定。插件在安装期间可能清理对应会话已不存在且记录至少七天的会话绑定；卸载不会进行全量数据清理。最早的 `0.2.0-rc.2-openbkn.0.2.0` 版本另有会话日志限制，见下文。

### 备份与已知限制

- **备份和迁移**：除了会话日志，还要一起复制 `$DSH_HOME/openbkn/session-bindings/`（每个会话的网络绑定）和 `$DSH_HOME/storages/openbkn_workspace_bindings.json`（工作区与网络的关联）。业务溯源和平台会话续接能从会话日志里重新算出来，绑定不能。
- **网络范围——平台 `run_code` 的重要限制**：在绑定会话里，插件会拒绝 `kn_id` 缺失或指向其他网络的直接查询，也不开放动作执行。但平台的 `run_code`、部署启用时的 `execute_skill`（以及 `execute_published_tool`）是在平台上执行的：从 OpenBKN 0.1.5 起，`run_code` 的脚本里可以把平台上其他所有工具当函数调用，包括查询其他网络和 `execute_action`，而且模型常常优先用它。脚本里发起的调用不经过插件，所以在这条路径上，"只查绑定网络"和"不执行动作"只靠会话提示词约束。每一次平台操作和回执仍会出现在业务溯源里。`run_code` 在平台侧的范围限制正在和 OpenBKN 团队对接。
- **未绑定的会话**：凡是没有通过 OpenBKN 面板绑定的会话，调用 OpenBKN 工具都会被拒绝，包括打开会话时绑定记录无法读取、或与会话日志冲突的会话。这类会话仍能打开，历史完整；插件会记一条不含业务内容的告警，但界面暂时不会显示"绑定异常"状态。会话已经在运行时绑定记录才出问题的，要等会话重新打开后才会被拒绝。
- **工作区关联在同一个 `$DSH_HOME` 下所有宿主和 profile 共用**（`storages/openbkn_workspace_bindings.json`）：在 `dsh web` 里关联过的网络，到了桌面版会显示「继续会话 / 新建会话」，不再提供「新建工作区」。
- **修改工作区关联时只运行一个宿主**：每个宿主把工作区关联存在自己的内存里，写入时用这份副本整份重写文件，所以只错开时间没用——已经在运行的另一个宿主下次写入时会覆盖掉这边的修改。共用同一个 `$DSH_HOME` 的桌面版和 `dsh web`：新建或修改工作区关联前，先退出另一个宿主；另一个宿主改过关联之后，要先重启这个宿主再用它修改。

### 从 `0.2.0-rc.2-openbkn.0.2.0` 升级

那个版本会往会话日志里写插件事件。用它在未打补丁的 DSH（桌面版、npm 命令行、未打补丁的源码构建）上绑定的会话会被拒绝重载，升级或卸载插件都修复不了；升级后请新建会话。写在打过补丁的 DSH 或 Runtime 归档里的会话仍然可读。

### Runtime 归档（已停止发布）

OpenBKN Runtime 归档不再发布：把插件装进 DSH 是唯一受支持的使用方式。最后一个归档 [`openbkn-dsh-runtime-v0.2.0-rc.2-openbkn.0.2.0`](https://github.com/openbkn-ai/bkn-dsh/releases/tag/openbkn-dsh-runtime-v0.2.0-rc.2-openbkn.0.2.0)（已打补丁的 DSH `0.2.0-rc.2` 加插件 `0.2.0-rc.2-openbkn.0.2.0`）仍可下载，但不再更新。

### 从源码构建

[兼容补丁系列](compat/dsh-0.2.0-rc.2/README.zh.md)只在从本仓库构建插件包时需要，使用插件不需要：补丁 0001 让 DSH 的 Typert 生成器识别插件发布的协议。补丁 0002 已退役（从 `…-1` 起的插件构建都不再用到它），补丁 0003 只服务于已停止发布的 Runtime 归档。见[源码构建指南](docs/guides/install-with-patch.md)。

已知插件限制：若某一轮在 `bkn_start_interaction` 与 `bkn_finish_interaction` 之间被取消或失败，该 Interaction 会留在平台侧不闭合。插件刻意不自动补 finish（平台对注入式收尾的语义尚未验证），只记录一条无载荷告警；观测项应跟踪「未闭合 Interaction 计数」。自动收尾属后续工作。

## 先决条件与试用路径

插件需要一个可达的 OpenBKN 平台，且至少有一个你有权限访问的知识网络。

1. **平台** —— 用 [bkn-foundry](https://github.com/openbkn-ai/bkn-foundry) 本地部署（macOS 用 `deploy/dev/mac.sh`；Docker 引擎需 ≥16 GB 内存），或使用你所在组织的部署。
2. **样例数据** —— 从 [bkn-samples](https://github.com/openbkn-ai/bkn-samples) 导入样例知识网络（`supply_ontology_hand` 是主端到端数据集）。
3. **配置并授权** —— 在 OpenBKN 面板填写平台地址，再使用面板的 CLI 登录入口；插件仅通过 CLI 握手读取 Token。
4. **绑定** —— 在 DSH 中打开 OpenBKN 面板，选择网络，在其工作区中开始会话。

## 支持的 DSH 版本

已发布制品 `0.2.1-rc.3-openbkn.0.2.1` 精确声明[宿主清单](compat/dsh-hosts.json)中的 `0.2.0-rc.2` 与 `0.2.1-rc.3`，旧生成器作为独立构建基线保留。最终 CI 与有界验收见上文及[验收合同](docs/plans/0.2.1/ACCEPTANCE-CONTRACT.md)；受控 fixture 与真实 Host、平台、模型及人工证据分开记载。

用 `dsh --version` 确认自己的版本后按下表配对：

| 你的 DSH 版本 | 兼容补丁系列 | 应安装的插件 | 预构建 Runtime 归档 |
| --- | --- | --- | --- |
| `dsh-v0.2.0-rc.2`（受支持运行时及保留的构建 pin） | 安装插件不需要 Host 构建补丁；#105 使用独立 profile 配套包；[`compat/dsh-0.2.0-rc.2/`](compat/dsh-0.2.0-rc.2/) 用于源码构建 | `@openbkn/dsh-business-context@0.2.1-rc.3-openbkn.0.2.1` 或对应公开 `.tgz`（标准模式） | 已停止发布；最后一个：[openbkn-dsh-runtime-v0.2.0-rc.2-openbkn.0.2.0](https://github.com/openbkn-ai/bkn-dsh/releases/tag/openbkn-dsh-runtime-v0.2.0-rc.2-openbkn.0.2.0) |
| `dsh-v0.2.1-rc.3`（受支持运行时） | 官方 Host 加匹配的 profile MCP 配套包；保留旧构建生成器 | 同一个 `@openbkn/dsh-business-context@0.2.1-rc.3-openbkn.0.2.1` 制品；有界验收及限制见上文 | 不发布新 Runtime 归档 |
| `dsh-v0.1.7-rc.2`（上一代系列） | [`compat/dsh-0.1.7-rc.2/`](compat/dsh-0.1.7-rc.2/)（存档） | npm 上的 `@openbkn/dsh-business-context@0.1.7-rc.2-openbkn.0.2.0`，或从 git tag [`v0.1.7-rc.2-openbkn.0.2.0`](https://github.com/openbkn-ai/bkn-dsh/tree/v0.1.7-rc.2-openbkn.0.2.0) 源码构建 | [openbkn-dsh-runtime-v0.1.7-rc.2-openbkn.0.2.0](https://github.com/openbkn-ai/bkn-dsh/releases/tag/openbkn-dsh-runtime-v0.1.7-rc.2-openbkn.0.2.0) |
| `dsh-v0.1.6-alpha.2`（上一代系列） | [`compat/dsh-0.1.6-alpha.2/`](compat/dsh-0.1.6-alpha.2/)（存档） | npm 上的 `@openbkn/dsh-business-context@0.1.5-rc.2`，或从 git tag [`v0.1.5-rc.2`](https://github.com/openbkn-ai/bkn-dsh/tree/v0.1.5-rc.2) 源码构建 | [openbkn-dsh-runtime-v0.1.6-alpha.2-openbkn.1](https://github.com/openbkn-ai/bkn-dsh/releases/tag/openbkn-dsh-runtime-v0.1.6-alpha.2-openbkn.1) |

自 `0.2.0-rc.2` 这一轮起，插件与 Runtime 归档共用一套版本命名——`<DSH版本>-openbkn.<OpenBKN平台版本>`——版本号一眼可见两个兼容维度：`0.2.0-rc.2-openbkn.0.2.0` 即"配 DSH `0.2.0-rc.2`、面向 OpenBKN 平台 `0.2.0`"；同一组合重新发布时追加 `-<n>`（`0.2.0-rc.2-openbkn.0.2.0-7`）。runtime manifest 校验器会拒绝插件版本与其锁定的 DSH 版本不一致的清单。本轮之前的发布保留其历史版本号。`0.2.1-rc.3-openbkn.0.2.1` 中的 OpenBKN 部分是本次确认的发布标识，实际平台/CLI 验证仍为 `0.2.0`，以上文为准。

插件声明的 DSH peers 必须与你的 runtime 匹配——DSH 的版本围栏会拒绝不匹配的安装。**不要为 `0.1.6-alpha.2` runtime 从当前 `main` 构建插件**：当前包 peers 仅声明 `0.2.0-rc.2 || 0.2.1-rc.3`，不匹配的安装会被拒绝。[`compat/dsh-0.1.2-rc.1/`](compat/dsh-0.1.2-rc.1/) 是历史存档，无 npm 配对版本。
