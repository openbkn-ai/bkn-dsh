# -4 发布前剩余事项

执行更新：用户随后“OK，执行”已放行。PR #60 已合并，main 彩排与实际发布包核验已完成，npm rc=-4、latest=-3；后续状态以 [发布执行记录](2026-10-05-rc4-publish-execution.md) 为准。下文保留放行前的检查记录。

核对日期：2026-10-05，Asia/Taipei。用户已决定授权等待、退出提示及恢复未测等项本轮暂不处理；限制已写入根 CHANGELOG，并更新 [异常取舍记录](2026-10-05-rc4-windows-release-triage.md)。本次没有合并或发布，也没有改变固定候选。

## 已完成的前置条件

- 固定候选 run **37202050194** / `c4b5dce`，133,806 字节、52 文件；SHA-256 `c4a8effbe5f84ecb399ee45ddf705c9468ef311910dcf58f62e47a0c71687a02`，tree-hash `f4e90f96d5c82e8b8c8cc505847995c6d3624f9870c58a71d7a3d010f3a5c5ad`。
- 桌面版、npm 形态的 Windows 原 R1–R9，npm／桌面面板登录，macOS live 守卫，以及 Windows W1／W2 已有验收。两次 Windows 平台记录已独立核对，只有允许的 search_capabilities。
- `b4a7d5b` 的 PR #60 review approved、全部检查通过、mergeStateStatus=CLEAN。随后本轮只补限制说明和发布清单，最终文档提交仍需查看其 PR 检查结果。
- package.json、runtime manifest 和 CHANGELOG 的版本都是 `0.2.0-rc.2-openbkn.0.2.0-4`；验收后的差异只有测试／探针及仓库文档，没有包内源码、README、清单、依赖或锁文件改动。根 CHANGELOG 不在发布文件内。
- npm registry 当前 rc / latest 都是 -3，-4 版本不存在；-4 Git tag 也不存在，没有撞版本。本机三个平台服务镜像仍 0.1.5，CLI 0.1.5 实际目录为 28 工具；支持宿主仍 0.2.0-rc.2。DSH master 与 OpenBKN main 未比上一次核对继续变化，本轮没有升级或部署。
- GitHub Release notes 脚本从根 CHANGELOG 提取 -4 条目。发布工作流的 v* tag 会先发布 npm rc，再生成 GitHub Release；npm latest 不会由该 prerelease tag 自动移动。

## 剩余发布顺序

| 顺序 | 执行者 | 要做什么／验收条件 |
|---|---|---|
| 1 | 主开发／用户 | 复核本次限制说明与文档提交检查；用户明确放行合并和相应发布步骤。当前仍按 HOLD，不自动执行 |
| 2 | 主开发 | squash 合并 PR #60 后，在该 main 提交运行 release-plugin.yml，publish=false；等完整构建、测试和 pack 成功 |
| 3 | 主开发 | 将 main 彩排 tgz 解包，与 run 37202050194 已验收候选逐文件比对：52 文件、无增删、内容相同。若不一致，暂停打 tag，先判明差异；不把本地共享 node_modules 构建当成此证明 |
| 4 | 主开发 | 在核验后的发布提交打 v0.2.0-rc.2-openbkn.0.2.0-4 tag；工作流发布 npm rc 与 GitHub Release，确认发布 job／provenance 成功、Release 含实际 npm tarball 及 SHA 文件，notes 包含已知限制 |
| 5 | 主开发 | 分别取回 npm 与 GitHub Release tgz，对照 main 彩排和原候选。比解包后的文件内容，不要求 gzip 包 SHA 相同；package.json 仅允许键顺序不同，语义必须完全相同；其他发布文件逐字节相同 |
| 6 | 主开发／Windows agent | 处理下述 C3 的新包安装验证。它不需要模型、登录授权或 R1–R9；如安排 Windows 执行，由用户转发任务 |
| 7 | 主开发 | 所有发布核验结束后，最后将 npm latest 指向 -4，并重新读取 registry rc/latest、版本、GitHub Release 资产与最终发布提交，归档结果 |

GitHub Release 工作流会把 Release 标记为 GitHub 的 latest；上表最后移动的是 **npm latest dist-tag**。两者是独立标记。

## 一个建议顺手补上的发布后安装检查

既有 [deferred 清单 C3](../handoff/2026-10-04-deferred-after-3.md) 约定下次发版补测 `minimumReleaseAgeStrict:true`。原 Windows -3 安装曾由 pnpm 自动写入一条 minimumReleaseAgeExclude；本轮候选通过本地 tgz 安装，不能证明“刚发布 npm 版本＋严格发布年龄策略”这一组合。

建议在 rc 已发布、尚未推广 npm latest 时安排一次 Windows 隔离 profile 安装：

1. 复用已验证的官方 DSH 0.2.0-rc.2、Node／pnpm 支持版本，使用独立 DSH_HOME 和空测试 profile，不动原用户设置。先记录 pnpm-workspace.yaml（若没有则记录不存在），仅在测试 profile 设置 minimumReleaseAgeStrict:true，并核对实际生效的 minimumReleaseAge 值；不得用已有的 -4 排除项或改为 0 绕过策略。
2. 以完整 npm spec `@openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-4` 执行 dsh plugin add；记录 TTY／非 TTY 形态、退出码、提示、是否写入例外或阻止安装。测试时包必须仍在实际 minimumReleaseAge 窗口内；超出窗口的成功安装不能关闭此缺口。
3. 若出现包管理器确认，记录再由用户决定是否同意；不能自动改关闭年龄保护来把失败写成通过。安装被正确拦截也可能是预期策略，不直接判定插件故障。
4. 若成功安装，核对发布文件与已验收候选一致；若被拦截，保留事实和说明建议。卸载并清理独立 profile，原用户状态保持不动。无需启动模型或重新跑登录、W4、R1–R9。
5. 仅回传脱敏报告与配置差异，主开发判断是否需补安装说明。若会改包内 README 或代码，遵守新候选／受影响验收规则；不能悄悄改已验收包。

此项是现有待办中的建议检查，不把它写成已经通过的验收，也不自动扩大 -4 的功能范围。其余 deferred 项继续按之前决定延后：不因本轮仅补文档重跑全量 11 题 G6 或源码形态验收。

## 并行清理，不阻塞候选发布

遗留 `release/0.2.0-rc.2-openbkn.0.2.0-4` 仍指向 c4b5dce，GitHub ruleset 存在 deletion / non_fast_forward / pull_request 限制；删除仍需有权限的维护者处理。发布使用合并后的 main 与 v* tag，不依赖删除此分支。

本轮只执行了只读状态核对、manifest／候选哈希检查、上游与实际平台目录读取，以及限制文档准备。构建彩排、merge、tag、npm publish、Release 和 npm dist-tag 变更均未执行。
