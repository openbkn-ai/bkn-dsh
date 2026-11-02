# 显式分析状态切换后的侧栏焦点修复

2026-11-02。远程真实 E2E 已完成一次显式分析，平台记录为 completed / not_evaluable / 0 建议；结果及历史保持原样，没有为本次修复再运行模型。实机缺陷是完成后焦点落到 HTML 根，直接 Escape 不关闭分析侧栏；Tab 回到侧栏后 Escape 才能单独关闭。本页受控测试均使用合成数据和 mock transport，不是新的真实分析。

## 根因与修改范围

`startAnalysis` 将 `analysisStarting` 置为 true 后，条件渲染卸载整个编辑区，已聚焦的“开始分析”按钮 `isConnected=false`，并非只把按钮禁用。旧 owned-layer 逻辑只在侧栏首次挂载时聚焦，后续状态切换没有接回焦点，键盘事件便无法到达其局部 Escape listener。

相同生命周期还包括：重新分析/错误返回卸载自身动作按钮；迟到的已有 history 将 editor 换为 result；history 非空变空卸载已聚焦的 combobox。正常 history 选择不会卸载 Select，不能无条件把它的焦点搬到侧栏。

生产修改仅 `BusinessProvenanceScene.tsx`，26 行新增、2 行替换：

- 仅在分析 aside 记录其真实 DOM 后代的最近焦点。`contains` 排除 React portal 合成事件冒泡带来的外部节点。
- 本层焦点转到另一个已连接的外部控件/portal 时清除记录。
- 在分析 busy、结果、错误、history 数量和 Markdown loading 变动后的 layout 阶段，仅当侧栏仍 open/connected、原节点已卸载或仍连接但 disabled、当前焦点为 body/html/null 时恢复 aside。
- 已连接且仍可用的控件、其他 portal 的焦点保持原状。不新增 document/window 监听，不全局消费 Escape。

`use-owned-layer-focus.ts`、共享 `use-dialog-focus`、Host、分析请求/取消逻辑、平台/模型输出处理均未修改。不会取消已完成结果、补跑分析、替换 not_evaluable、推导建议或写平台记录。

## 红绿回归

专门测试扩展 `tests/provenance-native-dialogs.test.ts` 的 mock transport，默认仍禁止生成/分析；只有显式的受控分析用例返回预设结果。新增 8 项：

1. 已聚焦 Start 被卸载，busy→not_evaluable/零建议结果后直接 Escape 关闭内层、恢复入口、保留外层；请求次数、输入 Markdown、原始结果对象均断言不变。
2. 既有历史结果重新分析时卸载动作按钮。
3. 迟到 history 替换已聚焦编辑区。
4. pending 结果到达时不抢已连接的外部 portal 焦点，其 Escape 不被本侧栏全局截获。
5. 结果到达时保留已连接的关闭控件焦点。
6. 失败后返回事实输入卸载动作按钮。
7. 仍连接但 disabled 的原控件，模拟浏览器焦点退回 HTML 后恢复侧栏；重新 enabled 后正常 Escape。
8. history 刷新为空时卸载已聚焦 combobox。

官方 Node 22.19.0 / macOS：首批[修前日志](./lifecycle-before.log)为 4 失败/2 通过，附加[修前日志](./extra-before.log)为 2 失败；合计 **6 失败/2 通过**。修后[8/8 通过](./lifecycle-after-node22.log)，无跳过。原始 DOM 失败输出保留于 ignored `release/provenance-live-20261102/`，公开日志仅保留必要断言和计数。

官方 Node 22 执行 native16、fullscreen2、parity-render12、list2、范围保护2，共 [34/34 通过](./regressions-node22.log)，无跳过；client `tsc --noEmit` exit 0，见[类型检查日志](./typecheck-node22.log)。该轮检查启动后增加了最终 `onFocusCapture` 的 DOM `contains` 收窄；独立 QA 已只读确认最终源码，主流程统一构建/测试负责最终 SHA 的完整验证。不得把该证据写成修后新包已在真实 Host 验收。

## 冻结身份与后续

- 最终 Scene SHA-256：`d1b62e75a0bc787635eb5b5420dad1a6717ea9b0d87c19a1a1de87c36a5b916e`。
- 专门测试 SHA-256：`02c69225fa5222cff2bea2d3ccb0bb3707a191a03d4519b4d355d893200f9cac`。
- 未修改的 owned-layer helper SHA-256：`0288cc4562b8196c0dfa89325b1a4a033b86379594ca8a2c690cafe156a9120e`。
- `git diff --check` 通过，独立只读复核通过，无新增必修项。

此次子任务不构建/打包、不推送或操作远端 CI，也没有新实机平台/模型请求。主流程需对最终提交构建测试，并使用匹配产物补实机键盘复验；原 CI3 的真实键盘 FAIL 与已有分析记录继续保留，不能被受控通过覆盖。
