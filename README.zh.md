# bkn-dsh

[English](README.md)

将受治理的 OpenBKN 业务知识带入 DeepSeek Harness 对话。

## 为什么

企业决策依赖可信的业务对象、指标、规则、关系和权限范围内的证据；通用对话本身不能提供这一受治理上下文。

## 做什么

bkn-dsh 是一个增量式 DeepSeek Harness 插件。授权用户可为一个会话选择一个 OpenBKN 业务知识网络，在明确边界内分析问题，并查看每轮已完成回答可用的业务溯源。

> 版本前提：业务溯源视图需要有效的 OpenBKN 令牌，且 `businessDomain` 在部署允许清单内（`x-business-domain`；社区 chart 出厂即允许 `bd_public`，无需管理面操作）。经对 OpenBKN 0.1.4 核实：observability 读路由**没有 License 门**，社区部署同样能看完整溯源面板；业务图在社区部署上的富集引用可能较少（企业版 optimizer，未实测）。读取路径不会出现升级提示——403 一律意味着业务域或账号被拒。

## 面向谁

- 需要可解释、受治理分析的业务用户和分析师；
- 希望业务语义被一致复用的知识网络维护者；
- 需要最小权限知识访问、又不希望暴露任意数据接口的企业 AI 平台团队。

## 业务价值

- 让分析建立在授权的业务语义和平台数据之上；
- 将每个会话固定在一个明确、不可变的知识网络范围内；
- 保留原生 DeepSeek Harness 工作流，并增加可追溯的 OpenBKN 上下文；
- 降低获得可信业务洞察的交互成本，无需用户掌握查询语言。

发布包内的 README 也提供面向包使用者的同等产品介绍。

## 安装并开始使用

从插件 `0.2.0-rc.2-openbkn.0.2.0-1` 起，原版 DeepSeek Harness `0.2.0-rc.2` 就够用了，不需要打补丁：用 DSH 自己的插件管理器装上插件包即可。同一个插件包适用于 DSH 的三种形态：

| DSH 形态 | 运行方式 |
| --- | --- |
| 官方桌面版 `0.2.0-rc.2` | DeepSeek Harness 应用 |
| npm 命令行 | `npm install -g @deepseek-ai/dsh@0.2.0-rc.2`，然后 `dsh web` |
| 源码检出（构建后运行） | 检出 `dsh-v0.2.0-rc.2`，执行 `pnpm install && pnpm run build`，然后 `node apps/cli/lib/bin.js web` |

三种形态都已在 macOS arm64 上验证：安装、绑定、带工具调用的问答、业务溯源、重启后重新打开会话，以及续接平台会话（[证据](docs/evidence/2026-09-29-desktop-direct-install.md)）。Windows 尚未验证。

### 开始之前

1. **登录 OpenBKN CLI。** 安装与平台版本匹配的 CLI，执行一次 `openbkn auth login <平台地址>`。
   - OpenBKN 0.1.4 平台用 `npm install -g @openbkn/bkn-sdk@0.1.4`（`0.1.5-rc.1` 也可以）。CLI 从 `0.1.5-rc.2` 起，每次请求前都会通过 `/api/bkn-backend/v1/health` 检查平台版本，平台没有这个接口（比如 0.1.4）就直接拒绝。
   - 插件通过 `openbkn` CLI 读取 Token，所以 DSH 要能在自己进程的 `PATH` 里找到它。macOS 桌面版从登录 shell 取得 `PATH`；Windows 上会找到 `openbkn.cmd`。找不到时，在第 2 步的条目里把 `cliPath` 设为 CLI 的绝对路径。
2. **pnpm（只有 npm 命令行需要）。** npm 版的 `dsh` 会把 `plugin add` 交给 `PATH` 里的 `pnpm` 执行，要先安装它（`npm install -g pnpm@11.7.0`，与 DSH 自己用的版本一致）。桌面版自带 pnpm。
3. **自签证书的平台**（公开受信任的证书可跳过）。DSH 要通过 `NODE_EXTRA_CA_CERTS=<CA pem 路径>` 信任平台 CA：
   - 在终端里运行 `dsh web`：在命令前加上这个变量。
   - macOS 桌面版：在 `~/.zprofile` 或 `~/.zshrc` 里 `export NODE_EXTRA_CA_CERTS=…`。桌面版启动时会读取登录 shell 的环境，从 Dock 或访达启动也一样。
   - Windows：设为用户环境变量，然后把需要用到它的程序**完全退出后重开**，包括设置之前就开着的 IDE 或 agent 宿主里的终端。
4. **使用标准模式。** 绑定了 OpenBKN 网络的会话必须使用 DSH 的**标准模式**。目前不支持 PTC 模式：插件会拒绝其中的 `run_code`，模型会提示你新建一个标准模式的会话。模式要在发送第一条消息前、在模式菜单里选定，之后不能再改。

### 1. 安装插件

先关闭桌面版（或停止 `dsh web`）。桌面版需要至少启动过一次，profile 才会存在。

```bash
# 桌面版（macOS）。应用菜单里的「管理 dsh 命令…」也可以把 `dsh` 加到 PATH。
"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" plugin --profile desktop add @openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-1

# npm 命令行
dsh plugin --profile web add @openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-1

# 源码检出，在 DSH 源码根目录执行
node apps/cli/lib/bin.js plugin --profile web add @openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-1
```

Windows 上用 `dsh.cmd` 代替 `dsh`。

### 2. 填写平台地址

在 profile 的补丁层 `~/.dsh/profiles/<profile>/cordis.patch.yml`（`desktop` 或 `web`；设置了 `$DSH_HOME` 就在它下面）里加入下面的条目。Windows 上是 `%USERPROFILE%\.dsh\…`。这个文件是一个 YAML 列表。新建的 profile 里可能只有一行 `[]`：要用条目替换掉这一行，直接接在 `[]` 后面追加会让文件失效。DSH 之后可能自己往文件里追加条目（比如首次运行的提示之后），再次编辑时要按 `id` 找到插件的条目。

```yaml
- id: openbkn-business-context
  config:
    baseUrl: https://<你的 OpenBKN 平台地址>
    # cliPath: /openbkn/的/绝对路径   # 只在 DSH 找不到 CLI 时需要
```

平台地址不是敏感信息。不要把 OpenBKN Token 写进 Cordis YAML；插件只把它保存在 DSH 凭证里。

### 3. 绑定网络并提问

1. 启动 DSH（打开桌面版，或运行 `dsh web`），在侧栏点击 **OpenBKN**。
2. 选择有权限的知识网络，为它新建本地工作区（**新建工作区**会打开目录选择器），或继续它已有的工作区。
3. 在新会话里保持**标准模式**，然后提问。每个完成的回答下都有**查看业务溯源**（执行溯源、业务上下文图、证据链）。

在 macOS 上用 `dsh web` 时，目录选择器会在运行 `dsh web` 的那台机器上弹出。远程或 SSH 访问使用 DSH 的浏览目录后端，无法从插件面板新建工作区：请先把网络关联到一个已有的本地工作区。

### 卸载

在 DSH 停止时执行 `dsh plugin --profile <profile> remove @openbkn/dsh-business-context`，并删除该 profile 目录下残留的 `node_modules/@openbkn`。会话仍然可读：插件不往 DSH 会话日志写任何东西。`$DSH_HOME/openbkn/session-bindings/` 下的绑定记录会留下；插件在装着的时候，会清理那些对应会话已不存在、且写入超过七天的记录。

### 备份与已知限制

- **备份和迁移**：除了会话日志，还要一起复制 `$DSH_HOME/openbkn/session-bindings/`（每个会话的网络绑定）和 `$DSH_HOME/storages/openbkn_workspace_bindings.json`（工作区与网络的关联）。业务溯源和平台会话续接能从会话日志里重新算出来，绑定不能。
- **网络范围**：在绑定会话里，插件会拒绝 `kn_id` 缺失或指向其他网络的直接查询。在平台上执行代码或已发布工具的调用（`run_code`、`execute_published_tool`）不带 `kn_id`，它们内部能访问到什么由平台约束，插件管不到。
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
3. **凭证** —— 执行一次 `openbkn auth login <平台地址>`；插件仅通过 CLI 握手读取 Token。
4. **绑定** —— 在 DSH 中打开 OpenBKN 面板，选择网络，在其工作区中开始会话。

## 支持的 DSH 版本

一次只支持一个上游 DSH 版本——当前为 `dsh-v0.2.0-rc.2`，由[兼容 manifest](compat/dsh-0.2.0-rc.2/manifest.json) 锁定。定时 workflow（`upstream-dsh-watch`）监控上游 tag，一旦有版本超过锁定版本即开出跟踪 issue；在兼容系列针对新版本重新生成之前，更新的 DSH 版本不在支持范围内。

用 `dsh --version` 确认自己的版本后按下表配对：

| 你的 DSH 版本 | 兼容补丁系列 | 应安装的插件 | 预构建 Runtime 归档 |
| --- | --- | --- | --- |
| `dsh-v0.2.0-rc.2`（当前锁定）：桌面版、npm 命令行或源码构建 | 使用插件不需要；[`compat/dsh-0.2.0-rc.2/`](compat/dsh-0.2.0-rc.2/) 用于从源码构建 | npm 上的 `@openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-1`（标准模式） | 已停止发布；最后一个：[openbkn-dsh-runtime-v0.2.0-rc.2-openbkn.0.2.0](https://github.com/openbkn-ai/bkn-dsh/releases/tag/openbkn-dsh-runtime-v0.2.0-rc.2-openbkn.0.2.0) |
| `dsh-v0.1.7-rc.2`（上一代系列） | [`compat/dsh-0.1.7-rc.2/`](compat/dsh-0.1.7-rc.2/)（存档） | npm 上的 `@openbkn/dsh-business-context@0.1.7-rc.2-openbkn.0.2.0`，或从 git tag [`v0.1.7-rc.2-openbkn.0.2.0`](https://github.com/openbkn-ai/bkn-dsh/tree/v0.1.7-rc.2-openbkn.0.2.0) 源码构建 | [openbkn-dsh-runtime-v0.1.7-rc.2-openbkn.0.2.0](https://github.com/openbkn-ai/bkn-dsh/releases/tag/openbkn-dsh-runtime-v0.1.7-rc.2-openbkn.0.2.0) |
| `dsh-v0.1.6-alpha.2`（上一代系列） | [`compat/dsh-0.1.6-alpha.2/`](compat/dsh-0.1.6-alpha.2/)（存档） | npm 上的 `@openbkn/dsh-business-context@0.1.5-rc.2`，或从 git tag [`v0.1.5-rc.2`](https://github.com/openbkn-ai/bkn-dsh/tree/v0.1.5-rc.2) 源码构建 | [openbkn-dsh-runtime-v0.1.6-alpha.2-openbkn.1](https://github.com/openbkn-ai/bkn-dsh/releases/tag/openbkn-dsh-runtime-v0.1.6-alpha.2-openbkn.1) |

自 `0.2.0-rc.2` 这一轮起，插件与 Runtime 归档共用一套版本命名——`<DSH版本>-openbkn.<OpenBKN平台版本>`——版本号一眼可见两个兼容维度：`0.2.0-rc.2-openbkn.0.2.0` 即"配 DSH `0.2.0-rc.2`、面向 OpenBKN 平台 `0.2.0`"；同一组合重新发布时追加 `-<n>`（`0.2.0-rc.2-openbkn.0.2.0-1`）。runtime manifest 校验器会拒绝插件版本与其锁定的 DSH 版本不一致的清单。本轮之前的发布保留其历史版本号。

插件声明的 DSH peers 必须与你的 runtime 匹配——DSH 的版本围栏会拒绝不匹配的安装。**不要为 `0.1.6-alpha.2` runtime 从当前 `main` 构建插件**：`0.2.0-rc.2` retarget 之后 main 的 peers 已声明为 `0.2.0-rc.2`，安装会被拒绝。[`compat/dsh-0.1.2-rc.1/`](compat/dsh-0.1.2-rc.1/) 是历史存档，无 npm 配对版本。
