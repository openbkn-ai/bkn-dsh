# -9 Windows 证据收尾交接（不重跑、不重出包）

本任务只补来源与字节对照。主开发已修正 C98、EPERM 的结论，保留原生输出字节并修复差异检查规则。不要改插件、候选、canonical helper、main、tag、npm dist-tag；不要启动 Host、安装/卸载 SDK、登录平台或调用模型。EPERM 已获用户同意作为已知限制保留，不调查或修复宿主。

## 固定输入

| 项 | 固定值 |
|---|---|
| 本次交接 | 使用主开发回报中提供的完整提交 SHA，或本页固定 GitHub 链接中的提交；不要用浮动分支替代 |
| 原 Windows 回传 | `b5e5875b53bfd0edccbd881f1069e746dc722b1b`，107 个文件 |
| 原交接 | `9f77446ff4a70731773ab96535cb6f892db3b84a` |
| 候选 source / CI | `6b372ff703d773a4c47ff3cf13972a047fa81ebd` / `38058120767` |
| 版本 | `0.2.0-rc.2-openbkn.0.2.0-9` |
| tgz SHA / 字节 / 文件 | `dd2d50a2fdda8e55f1ff355b6121113fc6106aeeb6664463bc218cb9b366c887` / 183344 / 69 |
| 清单 SHA | `30948677a13a8bc8b2bd62ffcf60c270e85cc6a379844ddd5ac0a55e656ecdd3` |
| 证据范围 | `docs/evidence/cli-setup9-20261010/followup/windows/` |
| 107 件 Git 基准 | [GIT-SNAPSHOT-MANIFEST.json](../../evidence/cli-setup9-20261010/followup/windows/GIT-SNAPSHOT-MANIFEST.json)，明确绑定 b5e5875；不代表本地原件核验 |

主开发的当前版 `RESULTS.md` 已收窄结论；比较原件时以 **b5e5875 的 Git blob** 为基准，避免把之后的文档修订误判为原件污染。四个下载文件已有完整路径/哈希且主开发核到 Git 字节相同；本次仍在统一清单中列出来源与原件是否尚在。

## 操作顺序

1. 保留现有 Windows 证据工作树和私有日志。用完整交接提交新建独立 worktree/分支，例如 `docs/cli-setup9-evidence-closeout-windows`；不 reset 旧工作树，不覆盖历史原件。
2. 核对新 worktree 的 canonical verifier/stop helper 未变；归档目录的 `-text` 与精确 whitespace 规则是主开发收尾，不是候选变更。`git diff --check` 应通过，无需重新执行 F90–F97。
3. 对基准清单列出的 **107 件**，逐一定位原件。优先查既有 `C:\bkn-verify\cli9f\evidence\`、`C:\bkn-verify\cli9f\fixtures\`、`D:\mydocs\downloads\` 及旧 worktree；这里只是定位线索，必须记录实际绝对路径。脚本副本、操作员记录、原生输出、DOM observer、产品导出分别标注，不统称产品原件。
4. 读取每个现存原件的原始字节，再通过 Git 读取 `b5e5875:<完整仓库路径>`，比较原始 SHA-256、字节数与内容。原件已删除/路径无法确认则标 `original-missing` 或 `unverified`，不要从 Git 导出一份再称原件，也不要重跑命令制造历史输出。
5. 写下面三份补证文件，扫描全部新 diff，提交后再实际读取刚提交的 Git blob 做补证文件对照，最后只推独立分支。给出两个完整 commit、未核验清单和准确计数。

## 交付文件

均放在 `docs/evidence/cli-setup9-20261010/followup/windows/closeout/`，不修改旧原件。

- `LOCAL-PROVENANCE.json`：107 行，不包含它自己的哈希。字段：仓库相对路径、来源类型、实际绝对来源路径、原件是否仍在、读取 UTC、原件字节与完整 SHA-256、基准 Git 字节与完整 SHA-256、比较结果及原因。顶层写 `comparedCommit=b5e5875b53bfd0edccbd881f1069e746dc722b1b`。
- `RESULTS.md`：逐字节一致 / 仅 CRLF→LF 一致 / 原件缺失 / 未验证分列并汇总为 107；列出无法核验的准确文件名与原因。原 Windows F90–F97 的通过范围不扩大。
- `GIT-BLOB-CONSISTENCY.json`：首次补证提交完成后，对该提交中的前两份文件实际读取 Git blob，与要提交的本地文件逐件比对。写完整 `comparedCommit`，证明文件本身排除自引用；随后单独提交此证明。若文件因修订又变化，重新绑定正确提交，而不是沿用旧哈希。

Git 读取必须保留字节。可用 Node 的 `execFileSync('git', ['show', revision + ':' + repositoryPath])` 得到 Buffer，再计算 SHA-256。不要用 PowerShell 5.1 的 `>`/`Get-Content | Set-Content` 导出 Git blob，它可能转码或改变换行。只有确认双方都是 UTF-8 文本时，才可额外比较 CRLF→LF；UTF-16 原生输出按二进制比较，禁止转码后冒充逐字节一致。

计数必须满足：`byte-identical + crlf-normalized + original-missing + unverified = 107`。只做归一比较的行保留双方原始哈希；“有 Git 哈希”与“有本地原件证明”分开。

## 已完成的主开发修正

- C98：当前报告仅证明安装、保存和实际鉴权子进程执行后保留 `cli-missing` 历史；不能证明单独只读检测不清除当前 fail。单测已覆盖该边界，实机仍未单独构造。本次无需补构造，更不能借用凭据。
- EPERM：确认失败发生在 DSH 插件管理器调用 pnpm 替换锁文件的路径，重试成功。具体占用者和根因未知，不再声称 rename 竞争已经证实。保留已知限制及重试后确认移除的指引。
- 差异检查：原生空白原样保留，精确文件级豁免已提交；归档 `-text` 不改变已提交字节。不改候选清单的 SHA，不自行统一原件换行。
- 主开发维护根 `EVIDENCE-MANIFEST.json` 与 Git 对照。Windows 补证分支无需重建根清单，后续由主开发在纳入补证时刷新。

## 回传与范围

提交标题/正文使用英文，文档可用中文。不要推 `feat/cli-setup-9` 或 `main`，不要 PR 合并、发布、打 tag、迁移 latest。私有 launch URL、Token、密码、Key 不入库；来源路径本身若含敏感值则脱敏并说明，原始完整路径只留本机。

最终回传：独立分支、两次完整提交 SHA、107 件分类计数、缺失/未验证项及原因、是否仅修改上述 closeout 目录、凭据扫描范围与结果。不要把找不到原件记成候选缺陷，也不要用收尾工作宣称完成所有 C98 或旧平台/模型开放项。
