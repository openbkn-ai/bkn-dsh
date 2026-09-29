# 进度：官方桌面版支持分析 + 方案 A + 桌面直装验证（2026-09-29，会话中断点）

> **状态更新（2026-09-29 22:00）：已全部完成，本文仅作历史记录。** 结论与改动清单：`../plans/2026-09-29-official-desktop-support.md`；实测记录：`../evidence/2026-09-29-desktop-direct-install.md`。桌面 profile、会话、工作区注册已还原，备份在 `release/desktop-probe-backup/`。下文「验证现场状态」描述的是中断时的状态，已不成立。

接续自 `2026-09-29-desktop-event-whitelist-handoff.md`。用户要求三件事：
1. 方案 A（插件改用自有存储）具体改动清单；
2. 连同分析整理进 `bkn-dsh/docs/`（尚未写，建议 `docs/plans/2026-09-29-desktop-support-sidecar.md` 或同类位置）；
3. 推进未验证点的验证（用户已授权在桌面 profile 装插件做实验）。

## 已完成的分析结论（均已核实，写文档时直接用）

- 本机 `/Applications/DeepSeek Harness.app` = 0.2.0-rc.2（`com.deepseek.dsh`，Team NAN929V4UM，hardened runtime）。
- `app.asar` 内 `Session.append` 事件构造无 `ignorable`、无 `LogOnlyEventIntent`；拒绝串 "unknown to this harness and not marked ignorable" 出现 2 次 → 桌面版 = stock（静态）。
- 完整性：启动只调 `readDesktopRuntime`（结构+版本）；`verifyDesktopRuntime`（逐文件 sha256）只在打包脚本。Fuse：AsarIntegrity 关、OnlyLoadAppFromAsar 关、NodeOptions 开、RunAsNode 开；Host 继承环境（含登录 shell 合并），`app-boot` 的 `BOOTSTRAP_NAMES` 只拦 `.env` 文件里的 NODE_OPTIONS。
- profile 拦截层只作用于 `profiles/**` 下 importer，宿主模块来自 app.asar；profile 不能覆盖宿主 `dsh-session`。
- 插件进程内 shim 不可行：事件 deepFreeze；jsonl 写盘取 `session/event` 回调里的原事件（`session-persistence-jsonl/src/storage.ts:535` `enqueueLive(event)`）；append 依赖模块私有状态。
- 插件写 3 种事件（全带 `{ignorable:true}`）：`openbkn/business-network-bound`（`dsh-session-binding.ts:42`）、`openbkn/turn-provenance`（`dsh-session-provenance.ts:42`）、`openbkn/managed-conversation`（`interaction-lifecycle.ts:308`，由 `scoped-business-context.ts:170/176` 调）。
- 桌面运行时只缺补丁 0002；0001 为构建期（generator），0003 为 lockfile。
- 上游：远端 HEAD `639ed01` = `dsh-v0.2.0-rc.2`，无更新 tag；Release 无安装包；issues 关闭；fork 有 `feat/ignorable-session-events-write-side`（`3af39d4`，基于 0.1.6-alpha.2）。上游 proposed notes（2026-09-06 logical-session-storage-rebuild、2026-09-10 session-capability-protocols）预示 Session API 会变。
- storage-domain 约束（方案 A 关键）：打开时全量加载进内存；读同步；**写入先持久化再改内存**（`put` 未 resolve 前 `get` 读旧值）→ 插件需自带 write-through 内存覆盖层；变更只在单进程可见（CLI 与 Desktop 同时写同一 domain 有覆盖风险，存储位置待确认，`~/.dsh/storages` 存在）；无迁移，schema 版本不符直接拒绝打开；无会话删除钩子 → 需自行清理孤儿记录。
- fork/子代理：事件路径下 seed 自动继承；sidecar 需按 `session.header.parentSession` 链回溯（binding、turn-provenance 按 messageId、managed-conversation 取最后状态）。

## 方案 A 改动清单要点（草稿，写文档时展开）

- 新增 `src/session-record-store.ts`：`defineDomain('openbkn_session_records', v1)`，表 `bindings`(key sessionId)、`turnProvenance`(key `${sessionId}::${messageId}`)、`conversations`(key sessionId)；Service 注入 `storageDomain`；内存 write-through 覆盖 + 串行 put 队列 + flush on dispose。
- `dsh-session-binding.ts` / `dsh-session-provenance.ts` / `interaction-lifecycle.ts#recordConversationEvent`：写入改为 store；读取 = 会话日志（兼容已有 ignorable 事件）优先，其次 store，其次父会话链。
- `business-context-service.ts`：`static inject` 加新服务；bind/捕获溯源/读取改走 store 接口；`scoped-business-context.ts` 的 `restoreFrom` 合并日志+store。
- `index.ts` 注册 Service；`declare module SessionEventMap` 增补保留（读旧日志）。
- 测试：各 `*.test.ts` 改为 fake store；新增 store 单测（写后即读、重启重载、fork 回溯、版本拒绝）；stock 宿主上的 reload 回归（G2 ⑤ 翻转为通过）。
- 文档/发布：README「补丁必需」口径改为「Runtime 推荐、stock/桌面可用」；compat 0002 可标记为可退役（保留一个版本过渡）；CHANGELOG。

## 验证现场状态（中断时）

- 桌面 profile 已改动（**实验结束需还原**）：
  - 已执行 `"/Applications/DeepSeek Harness.app/Contents/Resources/runtime/cli/bin/dsh" plugin --profile desktop add file:<bkn-dsh>/release/plugin/openbkn-dsh-business-context-0.2.0-rc.2-openbkn.0.2.0.tgz`（tgz sha256 `f1ad2b98e8e0a7ddc0ef766dea03182a1661ceea59c72dc3117136977c6dc407`），安装成功（pnpm 11.7.0，1 package，peer 警告，autoInstallPeers=false）。
  - `~/.dsh/profiles/desktop/cordis.patch.yml` 末尾追加了 4 行（注释 `# openbkn-desktop-probe ...` + `openbkn-business-context.config.baseUrl: https://192.168.50.28`）。
  - 原始 4 个 profile 文件备份在 `bkn-dsh/release/desktop-probe-backup/`（release 已 gitignore）。
- 桌面版以终端方式启动（带 `NODE_EXTRA_CA_CERTS=<openBKN>/platform-local-recovery/tls/openbkn-dev-ca-20260923.pem`），Host 起在 19387，日志无插件加载错误。**若 Ghostty 重启连带杀掉它，需要重新这样启动**：
  `NODE_EXTRA_CA_CERTS=... nohup "/Applications/DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness" > <log> 2>&1 &`
- 桌面模型：profile 用 `deepseek-account` / `deepseek-flash`，agent preset `selectedDefault: ptc`——E2E 需在 UI 选 `standard`（PTC 在 0.1.6 有派发缺陷，0.2.0-rc.2 未确认）。
- openbkn CLI 已登录（admin@https://192.168.50.28，未过期）；`openbkn` 在登录 shell PATH 中（nvm）。
- `~/.dsh/sessions` 实验前没有任何 openbkn 事件；只有 1 个既有会话目录。

## 待做的验证步骤

1. computer-use（需 Ghostty 屏幕录制权限）驱动桌面窗口；备选：Playwright 打开 Host 的 `http://127.0.0.1:19387/?token=...`（token 在启动日志首行，勿写入文档）。
2. 侧栏 OpenBKN 入口可见 → 认证状态 authenticated（CA 链经 NODE_EXTRA_CA_CERTS 生效）→ 列出网络 → 绑定 supply_ontology_hand → 新建会话。
3. 选 standard 预设，问 1 个业务问题 → 工具调用成功 → 溯源面板可开。
4. 退出并重开桌面版 → 打开该会话 → 预期拒绝重载（记录报错截图/日志）。
5. 还原：`dsh plugin --profile desktop remove @openbkn/dsh-business-context`、删 `~/.dsh/profiles/desktop/node_modules/@openbkn`、用备份覆盖 4 个 profile 文件；实验会话（坏会话）移到 `release/desktop-probe-backup/sessions/` 保存为证据而非删除；以用户原方式重开桌面版。
6. 写文档：分析 + 方案 A 清单 + 验证结果 → `bkn-dsh/docs/`；证据 → `docs/evidence/2026-09-29-desktop-direct-install.md`。
