# 0.2.1 DSH 双版本兼容：远程接手

交接日期：2026-10-19，Asia/Taipei。用户已明确要求将当前开发交给会话 `01a15340-6507-7660-a68d-68994e283415`，并授权把本地相关提交推送到远端以统一代码。**任务仍在进行中，不能把依赖声明或本地测试视作双宿主兼容已完成。**

## 仓库与固定身份

- 唯一仓库：`https://github.com/openbkn-ai/bkn-dsh.git`，分支 `feat/021-localization-login`。
- 本轮开始基线：`b4ce4be`；已提交的兼容工作检查点：`0a362b32f9ce8cc931fc6878e78acc3985f045a3`（`chore: checkpoint dual-host compatibility groundwork`）。交接文档在其后单独提交；发给远程会话的消息提供最终推送 HEAD。
- 先定位远程自己的仓库根目录并检查 branch、HEAD、worktree、origin；fetch 此分支，保留已有修改。工作区干净且已在此分支时可以 fast-forward；不要无条件 reset、换目录覆盖已有项目或推送其他分支。
- 需求与验收条件：[DSH-COMPATIBILITY.md](../../plans/0.2.1/DSH-COMPATIBILITY.md)；总入口：[0.2.1 README](../../plans/0.2.1/README.md)；完整历史：[开发执行记录](../../evidence/2026-10-18-021-development.md)。先读根目录 `AGENTS.md` / `CLAUDE.md`。
- 本地原工作目录为 `/Users/kalias/Documents/project/app/openBKN/bkn-dsh-diagnostics10`。远程会话 cwd 为 `/Users/dominiczhang/Documents/project/app/openBKN`，仓库及依赖路径须在远程重新定位，不能照搬本机路径。

## 用户要求与边界

完成插件 0.2.1 的新增 DSH 兼容开发：同一插件候选包支持 **DSH 0.2.1-rc.2 与原有 0.2.0-rc.2**，保留原功能与回归。完成可执行的开发/验证后更新开发记录，并向用户重新列出待办；对尚无实机证据的项目保持开放。

OpenBKN 拥有业务语义、计算、输入/依赖及状态；模型拥有回答。插件按平台公开合同展示，不重判 invalid，不删除原记录，不改关系、业务结果或模型输出，不增加答案仲裁、业务重算或自动纠错。共享输入直接选择关联两条查询；选择某条输出不能仅经共同输入误联另一分支；平台明确披露的跨查询依赖必须保留。

本次授权包含功能分支同步和指定远程会话继续开发；**没有运行远端 CI、发布、合并、tag、npm publish 或迁移 dist-tag 的授权**。不要创建 PR、修改远端 issue/项目字段或升级用户现有 Host/平台。后续同步按用户当时授权处理；本地源码、模拟、包检查、真实宿主、平台及人工验收分别记载。

## 已完成的工作检查点

1. `compat/dsh-hosts.json` 固定两个版本的 tag、SHA 和包管理器；主构建仍是 `0.2.0-rc.2`。
2. 所有现有 DSH runtime peers 改为精确双版本并集 `0.2.0-rc.2 || 0.2.1-rc.2`；开发依赖继续固定旧版，补齐 storage/storage-domain 的显式旧版 dev 依赖，防止自动选入新版。
3. 插件 Zod 固定 `4.4.3`，workspace override 同步；lockfile 已更新，生成器 override 仍是提交约定的相对 CI 路径，没有加入本机绝对路径。
4. `scripts/dsh-host-compatibility.mjs` 检查双版本声明、源构建 pin 和 Zod 约束；新增 `tests/dsh-host-compatibility.test.mjs` 四项回归。**这是元数据检查，尚未接入发布工作流，也不证明运行兼容。**
5. 运行时 `src/`、平台工具策略、生成器源码、原 compat 补丁、发布工作流和包版本号尚未更改。源码包版本仍为历史 `0.2.0-rc.2-openbkn.0.2.0-10`，不是已发布新功能的证明。

## 已查上游与发现

| 对象 | 核对结果 |
|---|---|
| DSH 原支持 pin | `dsh-v0.2.0-rc.2` / `639ed015397290b3745d163aafe02ffee4aa3f84`；pnpm 11.7.0 |
| DSH 新目标与本次查询的最新 release | `dsh-v0.2.1-rc.2` / `687f282e8625c6b8d11ff58211a90524be2e4317`，官方 release 2026-10-17；pnpm 11.28.5，源码 TypeScript 6.0.3；Node 范围仍为 `^22.19.0 || >=24.0.0` |
| OpenBKN 本次查询的最新 release | `openbkn-ai/bkn-foundry` 的 `v0.2.0`，2026-10-16；不是 `openbkn-ai/openbkn` 这个不存在的仓库路径 |
| 固定 EE 源树 | `aa6b3826ff0ce7150da011121c448ca575cedfa3`，与历史记录一致；没有更新平台或新增兼容声明 |

已获取隔离的新 DSH 源树并对两个 tag 的部分被消费接口做差异检查。locale、home-paths、subprocess、MCP client 相关源码目录没有差异；Tools、Session、credentials、Typert、Session/Workspace controller 有变化，尚未完成逐项适配判定。已注意到新版 Remote 增加 Principal/resource 语义、Session projection 返回类型增加 `kind`、Workspace follow 增加 `replace`，不能仅凭类型编译假定行为相同。

隔离环境对新版依赖的初次构建有两个真实失败：

- 清洁解析取得 Zod 4.6.7，而新版 storage 合同使用 4.4.3，`workspace-binding-registry.ts` 类型检查失败；固定 4.4.3 后该错误消失。旧基线本次完整构建已通过。
- 使用官方 npm `@deepseek-ai/dsh-typert-generator@0.2.1-rc.2` 构建，报 `publishes Remote artifacts but has no Remote methods`。当前旧生成器仍需仓库原有第三方协议补丁；不要直接升级生成器或手改上游来绕过。

初步策略是保留已验证的旧主构建/生成器，验证其同一产物在新宿主可运行。新版隔离目录已改回旧生成器，但尚未完成下一次有效构建：前一尝试被 pnpm 未批准安装脚本阻止，后续在该临时目录明确处理安装脚本后 install 已成功。此为依赖准备进度，不是新版测试通过。

本机 CLI `auth status --json` 返回 `expired: true`。没有继续读取 token、登录、tools/call、真实业务或模型；不复制凭据到远程。真实平台合同/部署与账号可用性须在远程按授权重新确认。

## 已验证结果

检查点依赖变更后，macOS / Node 24.19.0 / pnpm 11.7.0：

| 检查 | 结果与证明范围 |
|---|---|
| 插件 `pnpm test` | 579 项：578 pass、1 Windows 专属 skip、0 fail；构建 Host/Client 与生成 Remote，仍是旧 DSH 依赖基线 |
| 仓库/兼容/runtime 测试 | 64 pass，包含新增四项兼容声明测试 |
| `pnpm typecheck` | 通过 |
| 原固定 DSH `compat/.../verify.mjs` | 通过；保留旧源树和补丁 |
| `pnpm package:check` | 79 文件 dry-run 通过；没有制作/安装此检查点的新候选 tgz |
| 代码 diff 检查 | 通过；交接前再检查文档和工作区 |

临时日志仅在本机 `/tmp/bkn-021-handoff-{plugin,repo,types,package}.log`；原失败日志为 `/tmp/bkn-021-new-baseline-test.log`、`/tmp/bkn-021-new-baseline-pinned.log`。它们不会随 Git 推送到远程，关键结果已在本文记录，不要依赖临时目录作为交付物。

## 接手后的执行顺序与文件职责

1. 对齐推送 HEAD，确认差异和旧基线可重建。构建时先准备固定旧 DSH 生成器；不要把本地 override 绝对路径提交到 Git。
2. 完成两个官方 tag 的被消费公开接口比较，检查依赖解析后的实际版本；为两个宿主分别建立隔离的安装/类型/运行验证。需要变更时由同一执行者协调 `src/` 与对应测试，避免把差异修复做成平台或模型干预。
3. 优先验证同一旧基线构建产物的新版 Remote 注册、插件加载、配置/credentials、ToolRuntime 守卫、Interaction 结果事件与 Client locale/插槽。补真实运行时的允许/拒绝、缺失/错误/跨网 kn_id、未知工具不 dispatch、取消/迟到响应测试；保留现有选择联动与原记录不变回归。
4. 完成 `scripts/dsh-host-compatibility.mjs` 的后续集成及必要的构建/包校验；根据实际结果决定是否需要最小适配。工作流可以作为代码评审修改，但本次不启动远端 CI。不要只靠 peer 范围或生成快照宣布支持。
5. 更新 `docs/plans/0.2.1/DSH-COMPATIBILITY.md`、计划入口、开发记录及中英文安装说明；明确代码完成与未验收项。根目录语言规则同样适用于远程：中文沟通，英文 commit/PR 内容。
6. 按需求的八个组合维护结果：两个 DSH × Mac/Windows × Desktop/npm。当前均没有新固定候选的完整实机验收。受控 Host smoke 可先做，但不能代替固定 CI 候选、真实平台/模型、Windows 原生或人工验收。

本地常用检查（在仓库根目录，Node/pnpm 使用相应已核对版本）：

```sh
node scripts/dsh-host-compatibility.mjs
pnpm --filter @openbkn/dsh-business-context test
pnpm typecheck
node --test compat/dsh-0.2.0-rc.2/tests/*.test.mjs tests/*.test.mjs runtime/tests/*.test.mjs
node compat/dsh-0.2.0-rc.2/verify.mjs --dsh <旧版固定源树>
pnpm package:check
git diff --check
```

最终向用户重新列待办：双版本尚缺的运行/实机证据、固定候选、两版本 Mac/Windows Desktop/npm、B1 同 Host 重新登录最小复现、G6 实平台+模型、人工可读性及异常分诊、正式版本号/发布准备。只关闭确有证据完成的项。
