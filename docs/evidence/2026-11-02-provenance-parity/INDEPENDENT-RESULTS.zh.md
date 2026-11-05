# 独立验收执行记录

日期：2026-11-02。执行环境：macOS，本地 Node 24.19.0。源码/构建只在隔离工作树；未推送、未运行远端 CI、未发布或替换日常 DSH。

## 自动化与受控执行

新增常规测试共 29 项：`provenance-parity-host.test.ts` 6 项、`provenance-parity-render.test.ts` 13 项、`provenance-parity-transport.test.ts` 9 项、`provenance-parity-scope.test.mjs` 1 项。

- Host scope：可信回答首 50 外锚点直读、同会话多页成员验证、partial/truncated 不放行未验证 ID、跨会话拒绝、原 payload/精度/invalid/原因保留、分析使用服务端 Markdown、身份失效拒绝旧结果。
- DOM 真实组件：平台术语及结构、精确轮次、同 opId 的不同 attempt、成败筛选、原 Markdown 复制下载、只读刷新、搜索与列表不完整提示、普通/managed 两条路径、证据阅读/图谱与原 invalid 展示、显式生成和分析、平台失败原因、真实 overlay 打开/关闭/换回答/语言切换、旧响应及生成取消。
- 运输：UTF-16 跨块重组、索引/编码/结束完整性、UTF-8 累计 8 MiB、取消与不等 dispose、Remote 异常脱敏、安全 HTTP 状态、显式分析事件及 bridge→adapter 平台错误原因保留。
- 平台图路径：共享输入按平台持久化边关联两查询；同值无边节点不新增关联。legacy 图可缩放/重置/适应画布；嵌套 Inspector 的 Escape 只关闭内层、恢复焦点，再由外层 Escape 关闭 overlay。

最后定向日志：`independent-final-boundaries.log`（partial/精确回答与分析失败，2 项通过）、`independent-nested-inspector-final.log`（真实外层 overlay + legacy Inspector、图操作与 Escape，1 项通过）、`independent-shared-input.log`（共享输入/同值无关系，1 项通过）。最终全量 build/test 由主智能体执行，以其最终日志为准；不将较早中间轮次的计数充作最终整组结果。

本任务范围脚本另有 2 项通过，见 `scope-check.log`：67 个既有非溯源源文件 SHA-256 不变，新源码仅限溯源。脚本不在默认测试套件中，不永久禁止未来其他模块的合法变更。共享文件的逐 hunk 说明见 `SCOPE-REVIEW.zh.md`。

可复现命令（工作目录 `packages/openbkn-business-context`，PATH 首位使用 Node 24.19.0）：

```sh
node --import tsx --test tests/provenance-parity-*.test.ts tests/provenance-parity-*.test.mjs
```

本任务范围复核（仓库根目录）：

```sh
node --test docs/evidence/2026-11-02-provenance-parity/check-current-scope.mjs
```

## 证据不可相互代替

`HOST-GATEWAY.json` 是 Host worker 的独立实际执行结果：官方 npm Gateway + 本地生产 service/生成 codec，在 DSH 0.2.0-rc.2 / 0.2.1-rc.3 下通过；使用隔离受控 GET stand-in，平台 POST、真实平台请求、模型调用、CLI 调用均为 0。它不是当前 DSH 桌面应用 UI 或真实平台验收。

主智能体保存的浏览器截图来自本地受控 harness，覆盖对应的界面布局、证据图及全屏等观察；不是生产平台页面，也不是日常 DSH 实机 UI。必须继续单独验收真实 DSH Host/UI、同账号同记录的平台详情对照、TLS/登录/权限、真实长记录、macOS 原生剪贴板与下载、Windows 目标运行、真实生成/分析与人工体验。本轮没有将这些项目标为 PASS。

主智能体观察的 CLI `expired=true` 只是当时凭据状态，不是 DSH 登录失败的独立证明。未在验收中触发真实平台生成或模型分析。
