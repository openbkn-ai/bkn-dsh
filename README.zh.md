# bkn-dsh

[English](README.md)

将受治理的 OpenBKN 业务知识带入 DeepSeek Harness 对话。

## 为什么

企业决策依赖可信的业务对象、指标、规则、关系和权限范围内的证据；通用对话本身不能提供这一受治理上下文。

## 做什么

bkn-dsh 是一个增量式 DeepSeek Harness 插件。授权用户可为一个会话选择一个 OpenBKN 业务知识网络，在明确边界内分析问题，并查看每轮已完成回答可用的业务溯源。

> 版本前提：业务溯源视图需要 OpenBKN 企业版 License 并完成业务域授权（`x-business-domain`）。社区版用户看到的是升级提示而非溯源数据；插件其余能力在社区版上均可使用。

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

### 推荐方式：OpenBKN 兼容 DSH Runtime

对于 DSH `0.1.6-alpha.2` 用户，请从项目 Releases 下载匹配的 OpenBKN Runtime 压缩包。该包包含固定版本的 DSH Runtime、版本受限的兼容桥接以及 bkn-dsh 插件产物；首次启动时仍使用 DSH 原生插件管理器激活插件，不会修改已有 DSH 安装。

唯一前置条件为 Node.js ^22.19.0 或 >=24.0.0（与锁定的 DSH 版本一致）。Runtime 压缩包仅发布 darwin-arm64 与 win32-x64 两个平台；不提供 Intel Mac（darwin-x64）构建。发布 profile 在构建阶段由 DSH 原生插件管理器创建，首次启动时复制到隔离 Home；客户侧无需 `pnpm`，也不需要访问 npm registry。

1. 在下载目录使用同目录的 `.sha256` 文件校验压缩包，然后解压：

   ```bash
   shasum -a 256 -c openbkn-dsh-runtime-*.sha256
   ```
2. 启动包内的 DSH Web：

   ```bash
   ./openbkn-dsh-runtime-*/bin/dsh web
   ```

   Windows 请先使用 `Get-FileHash` 校验发布摘要，再在解压目录运行 `bin\\dsh.cmd web`。
3. 打开 DSH Web，在侧栏点击 **OpenBKN**；填写 OpenBKN 平台地址，通过引导完成 CLI 登录或输入平台 Token，并测试连接。
4. 选择有权限的业务知识网络，为它新建本地工作区或继续已有工作区，然后开始业务会话。

Runtime 使用隔离的 OpenBKN DSH Home（可用 `OPENBKN_DSH_HOME` 覆盖），不会改动 `~/.dsh`。平台地址仅作为非敏感 DSH 设置保存；Token 只保存在 DSH credential。不要将 OpenBKN Token 写入 Cordis YAML。

### 源码构建路径：插件包 + 兼容补丁

在你自己的 DSH 源码树（精确处于上游 `dsh-v0.1.6-alpha.2` 版本）上，两样东西配合使用：

1. **插件包** —— `openbkn-dsh-business-context-<版本>.tgz`（从项目 Release 下载，或 `pnpm --filter @openbkn/dsh-business-context pack` 自行构建）。通过 DSH 原生插件管理器安装与卸载。
2. **兼容补丁脚本** —— 本仓库的 [`compat/dsh-0.1.6-alpha.2/`](compat/dsh-0.1.6-alpha.2/)，在构建 DSH 前应用于其源码树：

   ```bash
   git clone --depth 1 --branch dsh-v0.1.6-alpha.2 https://github.com/deepseek-ai/deepseek-harness.git ~/dsh-src
   node compat/dsh-0.1.6-alpha.2/apply.mjs  --dsh ~/dsh-src   # 在本仓库根执行
   node compat/dsh-0.1.6-alpha.2/verify.mjs --dsh ~/dsh-src
   cd ~/dsh-src && pnpm install && pnpm build
   pnpm dsh plugin --profile web add file:<插件 tgz 路径>
   ```

**补丁是必需项而非可选项**：未打补丁的 DSH 上，插件可以安装、加载并绑定知识网络，但其持久化的会话事件在每次 DSH 重启后被拒绝重载（上游事件白名单是构建期静态集合）。补丁补上缺失的写入侧，使会话正常重载、并在卸载插件后仍可移植。补丁采用失败即拒绝策略，不能应用于桌面应用包或其他 DSH 版本；更换 DSH 版本前先用 `apply.mjs --revert` 还原。详见[兼容补丁包](compat/dsh-0.1.6-alpha.2/README.zh.md)与分步[安装指南](docs/guides/install-with-patch.md)（配置、凭证、卸载与已知注意事项）。

已知上游限制：直接以源码 dev 形式运行 DSH 时，任何插件的工具派发都会失败（`Cannot read properties of undefined (reading 'prepare')`）；完整问答需打包形态——上方的推荐 Runtime，或本仓库的 `scripts/build-compatible-runtime.mjs --dsh <干净源码树> --output <目录>`。

已知插件限制：若某一轮在 `bkn_start_interaction` 与 `bkn_finish_interaction` 之间被取消或失败，该 Interaction 会留在平台侧不闭合。插件刻意不自动补 finish（平台对注入式收尾的语义尚未验证），只记录一条无载荷告警；观测项应跟踪「未闭合 Interaction 计数」。自动收尾属后续工作。

## 先决条件与试用路径

插件需要一个可达的 OpenBKN 平台，且至少有一个你有权限访问的知识网络。

1. **平台** —— 用 [bkn-foundry](https://github.com/openbkn-ai/bkn-foundry) 本地部署（macOS 用 `deploy/dev/mac.sh`；Docker 引擎需 ≥16 GB 内存），或使用你所在组织的部署。
2. **样例数据** —— 从 [bkn-samples](https://github.com/openbkn-ai/bkn-samples) 导入样例知识网络（`supply_ontology_hand` 是主端到端数据集）。
3. **凭证** —— 执行一次 `openbkn auth login <平台地址>`；插件仅通过 CLI 握手读取 Token。
4. **绑定** —— 在 DSH 中打开 OpenBKN 面板，选择网络，在其工作区中开始会话。

## 升级与卸载

- **Runtime N → N+1**：把新归档解到新目录启动即可；隔离的 OpenBKN DSH Home（`OPENBKN_DSH_HOME`，默认在用户数据目录下）跨 Runtime 版本保留会话与设置，无需手工迁移。
- **源码构建树**：更换 DSH 版本前先用 `apply.mjs --revert` 还原补丁系列，切换版本后若有对应系列再重新应用。
- **卸载插件**：`dsh plugin --profile <name> remove @openbkn/dsh-business-context`，并删除该 profile 目录下残留的 `node_modules/@openbkn`。打了兼容补丁时，装插件期间创建的会话在卸载后仍可读（插件事件可忽略）；未打补丁时，含插件事件的存量会话会被拒绝重载。

## 支持的 DSH 版本

一次只支持一个上游 DSH 版本——当前为 `dsh-v0.1.6-alpha.2`，由[兼容 manifest](compat/dsh-0.1.6-alpha.2/manifest.json) 锁定。定时 workflow（`upstream-dsh-watch`）监控上游 tag，一旦有版本超过锁定版本即开出跟踪 issue；在兼容系列针对新版本重新生成之前，更新的 DSH 版本不在支持范围内。
