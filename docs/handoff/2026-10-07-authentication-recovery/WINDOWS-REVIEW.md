# Windows 最终证据复核与发布准备

主 agent 复核固定提交 [`19c2dc5a9d5083cc1e59f2dd2d9544ad0394489c`](https://github.com/openbkn-ai/bkn-dsh/commit/19c2dc5a9d5083cc1e59f2dd2d9544ad0394489c)，分支 `docs/authentication-recovery-c91fe09-windows`。这里只复制最终脱敏文件快照，不 merge 或 cherry-pick 原证据分支，不把其中的密钥暴露历史引入 main。

## 身份与归档核验

- 版本 `0.2.0-rc.2-openbkn.0.2.0-7`；源码 `c91fe090e0aac2dc72a4ff1b3d221d72baa432ba`；build-only CI [37570295456](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37570295456)。
- 已验收 tgz SHA-256：`fa168d8113e8dd43348ea4751c7e4d297049e2c1ddced9c586e6d3a1f3f0718c`，165804 bytes，65 文件。
- 导入 107 文件，全部与固定提交的 Git blob 字节一致；其中 [REPORTS-MANIFEST.md](windows-results/REPORTS-MANIFEST.md) 不自引用，覆盖其余 106 文件。
- 106/106 完整 Git SHA-256 匹配，无重复、漏项或多项。80 项声明为 identical，26 项声明为本地 CRLF→Git LF；后者均可由 Git blob 重建出声明的本地 SHA。主 agent 没有直接读取 Windows 下载目录，Windows 本地原件核验由回传侧记录。
- 11 份产品诊断 JSON、10 个唯一 reportId；`7c619431` 两份副本字节相同，11 份均保持此前原件字节。desktop 6 份、npm/IAB 5 份的来源与已被清除的 `.tmp` 状态分列，不补造已清除的原件。
- RESULTS、E1、N45 的最终修正均被清单覆盖；源码、候选、helper 和历史原始记录没有随补证修改。
- `prepare-npm.txt` 第 8 行是原生命令输出的单空格行；仓库只为该文件关闭行尾空格检查，保留原字节和 SHA，不清理原件。
- 发布准备时重新读取当前平台 28 项 `tools/list`，输入/输出 schema 与候选基准无新增、移除或变化；CLI 为 0.1.5。DSH 最新可用版仍为 `dsh-v0.2.1-alpha.1`，本包支持与验收固定在 `dsh-v0.2.0-rc.2`。Foundry main 相对候选基准仅多出 #2030 历史迁移代码，不调整宿主 pin 或部署。完整记录见 [WINDOWS-REVIEW.json](WINDOWS-REVIEW.json)。

## 已验证范围

详见 [Windows RESULTS](windows-results/RESULTS.md)、[N45](windows-results/N45-SUMMARY.md) 与 [进程记录状态](windows-results/PROCESS-RECORDS-STATUS.md)。

| 项 | 结论及范围 |
|---|---|
| N0 / N1 / N2 | 两形态安装件 65/65；正常面板/诊断导出、非法 URL 的配置阶段拒绝与恢复通过 |
| R1 | 两形态真实 MCP 401 → 产品现有 CLI 登录 → 同 Host 七项恢复，保留 recovered 历史；受控 patch 精确还原 |
| N3 | 官方 npm 核心受控 fixture 8/8，保留原生 JSONL/prepare；两条 exit=0 来自会话记录，独立原生退出码档案不足，不把 fixture 当成真实模型正确性 |
| N4 | npm 一级结构 9 项编码/名称通过；二级与全量 507/408 未独立核验；desktop 未测 |
| N5 | npm 40 条、状态、单号范围和字段口径等关键事实通过；不延伸到旧完整 BOM/库存题或 missing-object 负向题；desktop 未测 |
| N6 | 选定 37 个唯一路径在初轮及 N4/N5 后与 before 哈希一致；16:04 和 18:05 收态记录零残留。只证明选定文件及采集时点，不证明整个 home 或历史每次停止 |
| 历史停止记录 | 8 个 PID 原件在档，仅 R1 两形态有原生停止全流；其余停止输出及被 cleanup 消费的 npm children 原件不足，保留 insufficient-evidence |
| E1 / 补证 | 旧归因、计数、覆盖窗口和来源说明已修正；旧原件保留，不继承旧 66 文件候选的模型验收到当前包 |

## 凭据与功能边界

旧模型 Key 的平台撤销由持有人确认，固定在 `ac0f8a8` 后的 N45 记录；主 agent 没有测试已撤销的 Key。历史对象仍存在，用户选择当前只取脱敏快照，不执行历史重写。该事件是测试证据采集中的暴露，不是产品诊断导出泄漏。

重复鉴权拒绝与正常重登恢复已经证明，平台 rotation、共享 store 或其他客户端登录的因果仍未知。不在插件内加入跨客户端 Token 管理。OpenBKN 负责业务语义与计算，模型负责自然语言回答；剩余事实核验保留在独立评测，不恢复终答仲裁或自动纠错。

## 发布准备与保留项

本证据 PR 只更新仓库文档和归档。包内容保持已验收的 `fa168d81…` 候选；合入 main 后执行 `release-plugin.yml`，输入 `publish=false`，核对该 main artifact 与候选解包内容逐文件一致。执行结果和完整 digest 附在证据 PR，并提供本地下载路径。

发布前仍需用户决定上述未验证业务事实、受限账号、深层库存超时/平台 #2029、授权超时 UX 与历史故障机器等保留项。证据复核通过不会把它们改成通过。正式 tag、npm/GitHub 发布和 dist-tag 迁移尚未执行。
