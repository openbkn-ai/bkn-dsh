# -9 证据与发布准备收尾（2026-10-11）

本轮获得授权：处理四项证据收尾、推送 Windows 独立 handoff、保留 EPERM 已知限制，并推进 PR #86 合并和发布准备。没有更改插件源码、依赖、构建配置、canonical PowerShell helper 或候选身份；没有重新制作验收候选。

## 四项处理

| 项 | 主开发处理 | Windows 剩余工作 |
|---|---|---|
| 证据清单 | 原清单及 proof 归档到 `prior/`；根清单/当前 Git 对照重新绑定明确提交，纳入本轮 Mac 与 Windows 归档文件；Windows 的 b5e5875 107 件 Git 快照单列 | 持有人核对 107 件本地原件来源/字节，缺失项如实列出。Git 快照不冒充原件证明 |
| 差异检查 | Windows 原始输出不改写；归档设 `-text`，只对实际有空白告警的具体文件豁免对应 whitespace 规则 | 新补证文件运行 diff-check；不再修 verifier、不重跑 F90–F97 |
| C98 | 撤回“已证明仅检测不清除当前失败”。产品报告只证明实际恢复后保留失败历史；单测覆盖只读边界，现场子项仍未测 | 无须补构造，不借用平台/模型凭据 |
| EPERM | 用户决定保留为已知限制；明确 DSH/pnpm 锁文件替换失败、重试成功，根因未知。已写入 -9 CHANGELOG | 不调查占用者、不改宿主、不重测卸载 |

原 Windows 回传固定 `b5e5875b53bfd0edccbd881f1069e746dc722b1b`，父提交为原交接 `9f77446ff4a70731773ab96535cb6f892db3b84a`。107 件只位于本轮 Windows 证据目录。原件均保留；只修改当前 RESULTS 的解释，不改写 native/observer/产品下载字节。

主开发复核了四个下载文件的记录 SHA/字节与 Git 原件一致、两形态 verifier/安装件 69/69、一次真实 SDK 安装、F94 仅 cliPath 变化、F97 四次拒绝与五个 Host 的有效停止记录。1157 条选定文件记录及所列摘要一致，不延伸为全机器/全部环境变量值不变。全量 Windows 本地原件补证仍待持有人完成，见 [独立 handoff](../../../handoff/2026-10-10-cli-setup9/WINDOWS-EVIDENCE-CLOSEOUT.md)。

## 固定候选与后续门槛

候选仍为 source `6b372ff703d773a4c47ff3cf13972a047fa81ebd` / CI `38058120767` / tgz `dd2d50a2fdda8e55f1ff355b6121113fc6106aeeb6664463bc218cb9b366c887` / 183344 bytes / 69 files；清单 SHA `30948677a13a8bc8b2bd62ffcf60c270e85cc6a379844ddd5ac0a55e656ecdd3`。候选 manifest 不重绑至证据提交。

PR #86 的更新评审及检查通过后按授权合并。随后仅运行主线 `release-plugin.yml` 的 `publish=false` 彩排，用其产物与已验收候选逐文件比较；这是发布门槛的主线复现，不是替换候选或新增验收包。任何解包差异都必须先查明，不能以相同版本号代替比对。

正式 npm 发布、tag 与 latest 迁移未由本次“发布准备”请求授权，本轮不执行。Windows 原件来源缺口、既有 -8 开放项、C98 实机未测、旧测试 Key 撤销确认继续显式保留；不把本轮局部验收扩展成平台/模型或全部诊断能力验收。
