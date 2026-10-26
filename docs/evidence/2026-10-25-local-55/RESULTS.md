# 第55轮：Windows -31 UI / -30 生命周期回传核对与本机结果合并

日期：2026-10-25（Asia/Taipei）。已取得并校验 Windows 回传，更新本地验收状态。没有新构建、Host/平台操作或测试重跑。整体仍为 `local-development-preacceptance`，`ciRun=null`，`formalAcceptanceEligible=false`。

## 回传身份与独立核对

- 结果分支：`docs/windows-021-local31-ui-life30-results-20261025`。
- 固定结果提交：`74c4d731619a036978bc8f11fb796e651a7cc0d8`，API 确认分支 tip 相同。
- 原固定交接：`handoff/windows-local31-ui-life30-20261024` / `d20a266fa550dd854c9bd7d30bd04c088de9bbfe`。
- 从新建本地 bare 仓库按 Git blob 读取 11 个文件，没有切换主工作树或执行回传中的脚本。[报告原件](https://github.com/openbkn-ai/bkn-dsh/blob/74c4d731619a036978bc8f11fb796e651a7cc0d8/docs/handoff/2026-10-25-021-local31-ui-life30-windows/results/RESULTS-021-local31-ui-life30-20261024.md) SHA256 为 `eef01c19d58435e3c7cd58c717933e91fef183102f2367a60ea8ef11e637b4e5`；manifest 为 `66cce92d13f59ea61745f496557b904616a8c9fba9d60d8ec168dc62721acc15`，均与用户回执一致。
- manifest 列出的 8 个公开证据逐项摘要相同。15 个私有文件、24 张私有截图只有清单和摘要，尚未取得或独立读取；不能把回传摘要一致解释成主会话现场复验。
- 冻结 -31 / -30 tgz 与 KIT 身份和回传相符。两包差异确为 `lib/client.js`、`lib/types/client/locales.d.ts`、`package.json`；Host JavaScript/Remote 字节不变。

[核对回执](REMOTE-VERIFICATION.json) 保留 11 个 Git 对象文件的 SHA256、上述边界及本轮勘误；原件只在本地 `release/local-55/remote-evidence` 留存，未修改远端。

## 合并后的 Windows 状态

以下运行结论来自 Windows 报告，公开安装与身份记录已核对，私有截图/运行日志仍保持原证据层次。

| 子项 | 合并状态 | 范围与限制 |
|---|---|---|
| U0 | PASS（报告范围） | A/B 新 home 副本安装并加载 -31；实际 passiveHistoryNotice 渲染。公开安装收据显示 9 个原数据文件保持、两项 profile 元数据及安装日志变化已披露；完整 82 文件/实际闭包原日志仍在 Windows |
| U1 五个 Reference 标签 | BLOCKED | 未完成浏览器登录，Reference 不可达；未生成业务数据，不以认证/404 空态代替非空标签 |
| U2 局部键盘/嵌套 Escape | PASS（局部） | A 设置/业务/诊断的 Tab/Escape/焦点及嵌套下拉；B 仅原定快查。截图未在主会话重读 |
| U2 溯源弹层 | NOT_RUN | 副本缺含溯源的既有会话 |
| U2 精确 800×600 | NOT_RUN | 报告实际 664×538 与展开态无溢出，作为另一尺寸的 PASS 保留，不能替代精确尺寸合同 |
| U3 对比度 | PASS（报告范围） | Windows 报告值均 ≥4.5；本地已有源常量/对比度测试。原采样文件格式有勘误，像素与原图未独立复核 |
| U4 历史诊断说明 | PASS（报告范围） | A/B 显示被动历史说明、未知已加载版本；保留 loggedIn=false 原观察，不重算 JSON 导出通过 |
| W-LIFE L0 | BLOCKED | 缺用户当前确认的日常 Chrome 窗口及对应根 PID / UTC 创建时间 / exe |
| W-LIFE L1–L3 | NOT_RUN | 没有新的 carrier、item/end/cancel、runner 或浏览器时间线，本轮生命周期零登录 |
| W-LIFE L4 | UNKNOWN/BLOCKED | 无可靠的特定 Job 成员/terminate 只读来源；没有注入或句柄复制 |
| 收态 P | PASS（报告范围） | A/B 菜单退出、19387/51811 释放、原 home 11/11×2 保持；没有本轮平台整库前后审计 |

这份结果补齐了 Windows 两版 rc.2 Desktop 的部分 -31 UI 证据；没有提供新的生命周期证据，不能将旧 r1 残留、r2 新浏览器树消失和 r3 既有根保留合并成“已修复”。#95 继续开放。

## 必要勘误

1. **-31 不是“纯 locale、无行为改动”。** 文件差异列表正确，但实际 Client 还把键盘监听从 window 移到自身 panel，增加已消费/输入法/修饰键/重复 Escape 的处理，并将溯源弹层接入共享焦点 Hook；另有对比度与诊断说明变化。[实际包差异](CLIENT-DELTA.patch) 仅移除了 bundler region 路径注释便于审阅，未修改原包。`locales.d.ts` 的增量不能概括整个 Client bundle。Host/Remote 和登录/Job 策略保持是另一个独立事实。
2. **对比度 `.json` 原件不是单个 JSON 文档。** 其首个值为四个 JSON 字符串组成的数组，后面另接两条对象；普通 JSON 解析在第7行报 Extra data。本地按顺序解析为 6 条记录，另存 [规范化派生件](CONTRAST-MEASUREMENTS-NORMALIZED.json)，保留来源摘要和原始值。早期按钮采样框得到 7.2/12.84，后续修正框记录 5.21；不把前两次当成最终按钮测量，也不据摘要校验声称原图已复核。这是证据格式问题，不是新产品故障或重跑 U3 的理由。
3. **U2 需要按子项记录。** 局部键盘通过、溯源未测、精确 800×600 未测分别保留；较小窗口通过不能证明任意响应式断点都通过。
4. **`hasToken=true` 不等于当前凭据有效。** 回传只有私有 auth status 的摘要；“登录并同步”对应的 `remoteBeginLogin` 本就显式启动交互 CLI 登录，再同步并列网。取消观察符合这个入口的实现，不证明 token 有效性、认证故障或所有状态的普遍行为；本轮不增加产品修复。
5. **-31 的 U1 登录不能充作 -30 生命周期补证。** 原回传建议“连带补 W-LIFE”须保留两个候选与各自前提。若后续补两项，应分别记录，不能把同一 -31 stream 计入冻结 -30。

## 与 macOS 证据的关系

第51轮 -31 四个 Mac 形态的受影响 UI，包括旧 Desktop 现成 Reference zh/en/zh 与溯源焦点，保留原 Host/候选身份。它们支持实现已有覆盖，不能替代 Windows U1/溯源缺口。

第54轮主树已完整承接 -31 并构建最终本地 -32：SHA256 `46626510825fe9146aef12c27a1724acbb455aeac22aa600358add0fc8e1c9f8`。隔离 rc.3 npm/web 的实际安装、profile 闭包和受影响 UI 最小检查保持通过；初包/最终包仅两份 README 的差别及运行边界继续按第54轮记录。Windows A/B 是 `0.2.0-rc.2` / `0.2.1-rc.2`，不是当前新版目标 rc.3，更不是 -32 验收。

[合并矩阵](CONSOLIDATED-MATRIX.json) 固定这些身份，不按“新 Desktop”称呼自动挪用到 rc.3。#99 完整候选/八组合/G6/人工门槛不变；#94 仍 CLOSED，#95/#99/#105 只读核对均 OPEN，没有远端 issue 写入。

## 后续只补缺口与保护

[最小缺口方案](WINDOWS-GAPS.md) 单列 Chrome 当前确认、现成 carrier、现成会话和精确尺寸等前提；无需因为回执到达重新打包 -30/-31/-32，也不自动重复已过项或启动新的 Windows 交接。

两上游只读刷新与第54轮相同：DSH master `22ddee3792402c3e70ec5f86a63c3e3e895a2f60`，最新 rc.3；Foundry main `743becf2325a9e65a749f91be31aea2888885d38`，正式 release 仍 v0.2.0。本轮没有新的上游接口变化，不重跑原契约检查；没有升级/部署。

本轮只添加回传评审与更新状态文档。-30/-31/-32、现有 Host、正式0.2.0及数据配置未操作；没有启动应用、浏览器登录、测试、构建、提交、推送或 CI。[保护回执](PRESERVATION.json) 核对主树原文件改动仅为列明的状态文档，候选/冻结输入及 HEAD、索引、worktree 引用保持。
