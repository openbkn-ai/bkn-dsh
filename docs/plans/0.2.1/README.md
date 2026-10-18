# bkn-dsh 0.2.1 接手入口

保存日期：2026-10-13，Asia/Taipei。此目录保存已确认的计划、分析与源码路径，供其他会话或 agent 接手；不是实现完成、实机验收或发布证明。

## 当前开发状态（2026-10-18）

本轮已按用户执行授权开展开发，本地实现提交为 `4857c31225576f4f4b083ca26bb9469ab671b363`，分支 `feat/021-localization-login`。已实现 zh/en、登录状态及原生事件/证据视图；真实原生读取和本地测试通过。**尚未完成固定 CI 候选、Mac/Windows 实机验收、B1 真实最小复现或发布。**

本地评审修复为 `1f7bc6bf11a10ac4bc69b125fd451d4afe69887c`，其后补充冻结预算上限测试：修复登录成功判断和结果预算，累计新增 37 项关键边界/选择测试；插件全量 501 项中 500 pass、1 Windows skip。**完整跨视图选择联动仍未闭环；测试通过不等于所有开发边界覆盖。** 用户要求继续只保留本地，暂不推送或运行远端 CI。

- [开发内容、验证结果与未完成项](../../evidence/2026-10-18-021-development.md)
- [已核对真实样本与冻结的原生读取合同](NATIVE-CONTRACT.md)

以下为原交接顺序与范围；原始范围快照/归档清单仍保留其保存时的状态，不能把历史“未开始”文字当作当前执行状态。

## 先读这几个入口

| 入口 | 用途 |
|---|---|
| [项目的 bkn-dsh 专属视图](https://github.com/orgs/openbkn-ai/projects/12/views/6) | 组织已有 OpenBKN 0.2.1 项目，已关联 bkn-dsh；八项计划在建档时均为 Backlog |
| [#92 总览](https://github.com/openbkn-ai/bkn-dsh/issues/92) | 整轮范围、原生溯源可行性分析、功能边界、估算与七项任务索引 |
| [#93 P0 任务](https://github.com/openbkn-ai/bkn-dsh/issues/93) | 验证现有 CLI 凭据、新原生接口和真实非空样本，冻结溯源合同 |
| [冻结范围与完整分析快照](SCOPE-AND-ANALYSIS.md) | #92 的本次归档，可离线阅读；任务当前状态仍以 GitHub 为准 |
| [源码与环境路径](SOURCES.md) | 可移植的仓库相对路径、Mac 当前绝对路径、已核对提交与证据边界 |
| [归档身份清单](planning-manifest.json) | 来源 issue、更新时间、正文摘要与插件/上游参考基线 |

**#92 是总计划；#93 是其中的一项前置验证任务。** 溯源 Host/UI 实现先通过 #93；语言和登录状态工作可独立推进。总览中的任务清单是关联索引，建档时没有设置 GitHub 原生 sub-issue 父子字段。

## 接手顺序

1. 阅读仓库根目录 `AGENTS.md`、`CLAUDE.md` 和本目录。核对新会话实际收到的执行授权；保存计划不等于已授权开始开发或发布。
2. 读取 GitHub #92 与所接任务的最新正文/评论，检查是否有后续范围修正。本地快照保留原分析，不覆盖后续决策。
3. 检查目标 checkout 的 branch/HEAD/worktree、既有修改、main 最新提交和上游变化。已有 worktree 不应默认切分支、重置或复用为测试 home。
4. 原生溯源工作先执行 #93：用已有可读 Interaction 验证真实非空数据、授权、schema、身份和预算。没有可用样本时记录缺口，不制造业务记录或改平台来凑 pass。
5. 按下表承担明确文件职责；需要协作时按当时用户授权分配，避免多人同时改 DTO、入口或打包清单。
6. 受控测试与实际运行分列。Mac 验收后提供独立、固定候选身份的 Windows handoff；发布依仓库规则及用户当时明确授权。

## 任务索引与依赖

| Issue | 任务 | 依赖 |
|---|---|---|
| [#93](https://github.com/openbkn-ai/bkn-dsh/issues/93) | P0 原生 API/凭据/非空样本验证 | 首个溯源门槛 |
| [#94](https://github.com/openbkn-ai/bkn-dsh/issues/94) | 插件完整 zh/en 随宿主语言切换 | 可独立盘点；新溯源文案与 #97 集成 |
| [#95](https://github.com/openbkn-ai/bkn-dsh/issues/95) | 登录等待、结果、取消和重试状态可见 | 可独立推进；先复现异常再定责 |
| [#96](https://github.com/openbkn-ai/bkn-dsh/issues/96) | 原生溯源 Host 读取、有界 DTO、降级 | #93 通过 |
| [#97](https://github.com/openbkn-ai/bkn-dsh/issues/97) | 事件链/证据链双视图、联动与业务详情 | #93/#96；配合 #94 |
| [#98](https://github.com/openbkn-ai/bkn-dsh/issues/98) | B1 有边界的最小复现 | 先调查；确认插件根因后才修；未复现仍开放 |
| [#99](https://github.com/openbkn-ai/bkn-dsh/issues/99) | 固定候选 Mac/Windows 最小验收与发布准备 | #94–#97 交付、#98 的调查结论 |

快速读取（以下仅查询，不安装、不启动 Host）：

```sh
gh issue view 92 --repo openbkn-ai/bkn-dsh --comments
gh issue view 93 --repo openbkn-ai/bkn-dsh --comments
git status --short
git branch --show-current
git rev-parse HEAD
```

Projects API 的现有 gh 登录在建档时缺少 `read:project/project` 权限；项目内容通过已登录网页保存并刷新核对。无需 Projects 权限即可用仓库 issue 链接和此目录接手；确需调整项目字段时再使用有权限的网页或登录。

## 保持边界

- 冻结核心：zh/en、登录状态、平台原生数据的事件链/证据链；B1 仅条件性修复。
- 插件只负责认证集成、网络访问治理、Interaction、诊断和溯源展示。业务语义/计算归平台，自然语言答案归模型。
- 不做答案仲裁、自动纠错回合、证据补造、全局历史工作台、宿主升级、平台部署、许可策略或跨客户端 token 管理。
- 普通打开面板只 GET 已存在解释；POST 生成必须是显式用户动作并核对执行授权，可能调用平台模型与持久化结果。
- 当前未提供 0.2.1 候选包、测试脚本或已通过结果；不要把 -10 产物或旧 `/tmp` 辅助目录当 0.2.1 交付。
