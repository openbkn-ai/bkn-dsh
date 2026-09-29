# 进度：桌面版支持最小闭环（2026-09-29 开始，2026-09-30 完成）

> **状态（2026-09-30）：已完成，未提交。** 测试迁移已完成：插件 222/222、`typecheck`、`package:check`、仓库级 51/51 全部通过。桌面第二轮实测通过（重载、溯源、会话续接），证据见 `../evidence/2026-09-29-desktop-direct-install.md`「第二轮」，桌面现场已还原。下文"剩余"一节是中断时的记录，已全部完成。

分支：`feat/desktop-support-min-loop`（基于 main `7008bcd`），**未提交**。决策依据见 `../reviews/2026-09-29-desktop-support-plan-review.md` §3。用户已批准：最小闭环 + `plugin:` 旧名识别。

## 第 1 步：解析修复 + `plugin:` 旧名（已完成，全量 210/210 通过）
- 新增 `src/tool-result-message.ts`：同时读取 v4 与旧版 tool 消息的文本和 `isError`。
- `native-mcp-provenance.ts`：失败的 finish 结果不再形成完成态溯源。`turn-timeline.ts`：`firstResultRecord`、错误状态解析都改用该 helper；`turnForMessage` 改为导出。
- 三个读取函数识别 `plugin:openbkn/*`（`MIGRATED_*` 常量）。
- 测试 `tests/session-log-shapes.test.ts`：fixture 来自 4 份真实日志，用上游 catalog restore 做 v3→v4 转换，经允许清单脱敏，来源见 `tests/fixtures/README.md`。三份迁移日志里 27 条历史溯源记录全部能从日志重新推导出来。

## 第 2 步：失败错误码是否落进日志（已验证：是）
- DSH `core/tools/src/index.ts:1913` 按 `Error: ${message}` 记录失败结果；MCP 的 isError 走 `throw new Error(text)`（`mcp-client/src/tools.ts:297`）。
- 真实日志实证：`v3-migrated-session-0165.json` seq 252 完整保留了 `{"error":{…"code":"resource_not_disclosed"…}}`。

## 第 3 步：方案 A（源码已改完、host 类型检查通过，测试迁移进行中）
已完成：
- 新增依赖 `@deepseek-ai/dsh-home-paths`（peer + dev；lockfile 只多 3 行）。
- 新增 `src/session-binding-store.ts`：每个会话一个文件 `$DSH_HOME/openbkn/session-bindings/<id>.json`，写入走临时文件 → fsync → rename；读取同步，出错时带路径报错并 fail-closed。
- `dsh-session-binding.ts`：读取时先查日志再查记录，两边不一致就抛冲突；`bind` 等写盘完成才返回；新增 `inheritForkedBusinessNetwork`：只有 `isSeeded` 且 `boundAtSeq < inheritedEventCount` 时才复制绑定。
- `dsh-session-provenance.ts`：只读，每次从日志现算；日志里已有的旧记录与现算结果不一致时抛冲突。已删除 `appendTurnProvenance` 和 turn-stopping 钩子。
- `interaction-lifecycle.ts` `restoreFrom`：按日志顺序重放 start/finish 结果；删除 `recordConversationEvent`。`scoped-business-context.ts`：不再写入 conversation；`mountBoundBusinessNetworkTool(agent, config, binding, profile?)`。
- `business-context-service.ts`：`bindingRecords` 字段；`bind` 改为 async；`agent/created` 改为 async `restoreBinding`（先 fork 继承、再做工作区自动绑定，失败只记日志）；`bindingOf()`。
- `index.ts` 导出已同步。
- `tests/dsh-session-binding.test.ts`（重写）和 `tests/session-binding.test.ts` 通过，共 14 条。

剩余：
1. 迁移测试（运行 `node --import tsx --test tests/*.test.ts` 看失败项）：
   - `business-context-service.test.ts`：`bind` 改为 async，用 `assert.rejects`；stub 设 `service.bindingRecords`；绑定来源用记录或旧日志事件；`bindWorkspaceNetworkIfUnique` 改为 async。
   - `interaction-lifecycle.test.ts`：`restoreFrom` 改为基于 tool/call + tool/result 的 fixture；删掉 `recordConversationEvent` 相关用例；新增用例：用 3 份迁移 fixture 验证 `restoreFrom` 与 `lastConversationEvent` 记录的最后状态一致（active 取其 id，tombstone 为 undefined）。
   - `turn-provenance.test.ts`：删掉 `appendTurnProvenance` 相关用例。
   - `scoped-business-context.test.ts`：mount 的新签名；不再断言 conversation 事件写入。
2. `corepack pnpm@11.7.0 --filter @openbkn/dsh-business-context test` 全绿；`pnpm run package:check`。
3. 打包插件 tgz，在桌面版重跑实测（步骤见 `../evidence/2026-09-29-desktop-direct-install.md`）：验收重启后能重载、溯源入口可见、日志里没有 `openbkn/*` 事件；实测后按同样方式还原桌面 profile。
4. 更新证据和方案文档，列出未做项（见 review §5，以及 Dock CA、上游 PR、旧坏会话恢复等）。
