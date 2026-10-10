# -9 Windows 证据收尾：本地原件来源与字节对照

交接：`5be44c34f837918604c373b6624adec5ce00f8f4`（[WINDOWS-EVIDENCE-CLOSEOUT.md](../../../../../handoff/2026-10-10-cli-setup9/WINDOWS-EVIDENCE-CLOSEOUT.md)）。对照基准：原 Windows 回传 `b5e5875b53bfd0edccbd881f1069e746dc722b1b` 的 107 件（[GIT-SNAPSHOT-MANIFEST.json](../GIT-SNAPSHOT-MANIFEST.json)）。逐件明细见 [LOCAL-PROVENANCE.json](LOCAL-PROVENANCE.json)。

本次未启动 Host、未安装/卸载 SDK、未登录平台、未调用模型、未重跑任何 F90–F97 命令；未修改插件、候选、canonical helper、旧原件或 main。原 Windows F90–F97 的通过范围不因本收尾扩大；C98 与 EPERM 结论以主开发 5be44c3 的修正为准。

## 前置核对

- 新 worktree `C:\bkn-verify\cli9-closeout-wt`，分支 `docs/cli-setup9-evidence-closeout-windows`，基于完整交接提交；旧工作树 `C:\bkn-verify\cli9-followup-results-wt` 与私有日志原样保留。
- `git diff --stat 9f77446 5be44c3 -- verify-candidate.ps1 stop-owned-host.ps1 candidate-manifest.json candidate-files.json`：无差异（canonical verifier / stop helper / 候选清单未变）。
- `git diff --check 9f77446 5be44c3`：exit 0。
- 107 件的 Git blob 字节数与 SHA-256 全部等于 GIT-SNAPSHOT-MANIFEST（manifest mismatch 0）。

## 方法

- 本地原件：`fs.readFileSync(<绝对路径>)` 原始字节，SHA-256。
- Git：`execFileSync('git', ['show', 'b5e5875…:<完整仓库路径>'])` 得 Buffer，SHA-256；未经 PowerShell 重定向或转码。
- 判定：Buffer 相等 → `byte-identical`；否则仅当双方都能无损按 UTF-8 解码（无 NUL、无 UTF-16 BOM）且 CRLF→LF 后相等 → `crlf-normalized`（双方原始哈希均保留）；路径不存在 → `original-missing`；其余 → `unverified`。UTF-16 原生输出（verifier 全流、installed-verify、f97 `*-outer.txt`）只做二进制比较。
- 比较脚本留本机 `C:\bkn-verify\cli9f\closeout\provenance.js`（不入库）。

## 汇总（107）

| 结果 | 件数 |
|---|---|
| 逐字节一致（byte-identical） | 53 |
| 仅 CRLF→LF 一致（crlf-normalized） | 54 |
| 原件缺失（original-missing） | 0 |
| 未验证（unverified） | 0 |
| 合计 | 107 |

按来源类型（`sourceType`，非统称“产品原件”）：

| 来源类型 | 逐字节 | CRLF 归一 | 说明 |
|---|---|---|---|
| product-ui-export | 2 | 0 | 两份诊断 UI 导出，原件在 `D:\mydocs\downloads\` |
| product-log | 2 | 0 | DSH 插件管理器 pnpm.log，原件仍在隔离 profile `.plugin-manager\logs\` |
| synthetic-dom-observer | 2 | 0 | 合成 DOM observer 下载件，非产品输出 |
| native-output | 14 | 35 | 原生输出/全流/退出码/进程快照；UTF-16 件均逐字节 |
| helper-record | 0 | 16 | 启动/停止 helper 身份记录、日常快照 |
| profile-file-snapshot | 8 | 0 | 当时对 patch / package.json / pnpm-lock.yaml 的 cp 快照 |
| operator-record | 12 | 0 | 操作员案例/清单记录（含 git-blob-compare.txt） |
| operator-authored-document | 1 | 0 | b5e5875 版 RESULTS.md（旧工作树文件，提交后未改写） |
| script-copy | 12 | 2 | helper/fixture 脚本；`npm.cmd`、`node.cmd` 为 CRLF 原件 |
| fixture-log | 0 | 1 | `fixtures\calls.log` |

CRLF 归一的 54 件均为 PowerShell / cmd 在 Windows 上写出的 CRLF 文本，提交时因 `core.autocrlf=true` 入库为 LF blob；内容在换行归一后一致，不声明逐字节一致。

## 需说明的来源

- `evidence/OpenBKN-diagnostic-npm-f95-fb55a24c.json`、`evidence/observer-npm-r1.json`：b5e5875 的 `reports.txt` 记录的是内置浏览器下载进行中的临时名（`8bf9603b-….tmp`、`eff5fd00-….tmp`）。临时名已不存在；同目录下浏览器完成后的文件 `OpenBKN-diagnostic-20261010T151345041Z-fb55a24c.json`、`f9-npm-r1-observer.json` 字节数与 SHA-256 等于当时记录值，且与 Git blob 逐字节一致，故以其为原件并在 `sourceNote` 写明。
- `evidence/f95-desktop-attempt1/package.json`、`pnpm-lock.yaml`：隔离 profile 中的活动文件在重试卸载后已改变，最早留存字节源是首次失败后立即 cp 的快照（`C:\bkn-verify\cli9f\evidence\f95-desktop-attempt1\`），类型标为 profile-file-snapshot，不称活动文件原件。
- 其余各件的原件均为运行时直接写出的文件（`C:\bkn-verify\cli9f\…`、`C:\bkn-verify\cli9-followup-candidate\…`、`D:\mydocs\downloads\…`、旧工作树），路径不含 token/密码/Key。

无原件缺失、无未验证项。
