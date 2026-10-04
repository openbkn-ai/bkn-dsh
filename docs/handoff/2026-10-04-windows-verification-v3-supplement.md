# Windows 补跑：CLI 登录状态的两种情形（交给 Windows 机器上的 Claude 执行）

> 建立：2026-10-04。接在 `2026-10-04-windows-verification-v3-results.md` 之后；那一轮依据的交接文件版本里没有这两项。
> 约 15 分钟，**不需要模型，不发任何对话消息**。结果追加到 `2026-10-04-windows-verification-v3-results.md` 末尾一个新小节「补跑」，提交到新分支并推送，不要推 `main`。

## 背景

macOS 上确认了插件对 `openbkn auth status --json` 的解析有两个缺陷（修复在 PR #57，未发布）：

1. CLI 从未登录时，输出只有 `{ "hasToken": false }`，面板显示「无法验证 OpenBKN 连接。请检查 Token 和平台地址后重试。」而不是登录入口。
2. CLI 0.1.5 算不出 Token 过期时间时不输出 `expired` 字段，面板显示同一句报错。macOS 上的触发条件是「用 CLI 0.1.4 登录，再换成 CLI 0.1.5」。

需要 Windows 回答：**用 CLI 0.1.5 全新登录之后，`auth status` 有没有 `expired`**；以及这两种情形下已发布的 `-3` 在 Windows 上的面板表现。

## 约束

- 与上一轮相同：Token 不写进任何文件、参数、截图或日志；`openbkn auth token` 的输出不要捕获、不要打印（需要执行时把输出丢弃：`openbkn auth token > $null`）。
- 重新登录需要账号密码，**由用户自己执行 `openbkn auth login`**。
- 动 `%USERPROFILE%\.dsh` 和 CLI 的登录状态之前先备份，结束后还原；实验产物移动，不删除。
- 只用 npm 形态（`dsh web`）即可，不需要桌面版。插件装 npm 上的 `@openbkn/dsh-business-context@0.2.0-rc.2-openbkn.0.2.0-3`，`cordis.patch.yml` 只写 `baseUrl`。
- 记录 `openbkn --version`（应为 0.1.5）。

## 步骤

每一步都记录命令的输出里**有哪些键**（不要记 Token 值），以及面板第一屏的文字。

| # | 操作 | 记录 |
|---|---|---|
| 1 | 现状：`openbkn auth status --json` | 键的列表；是否有 `expired` |
| 2 | 现状下打开 `dsh web` → 点侧栏 OpenBKN | 面板第一屏：网络列表 / 登录入口 / 报错文案 |
| 3 | 关掉 `dsh web`。请用户执行 `openbkn auth logout`（或 CLI 提供的等价命令；先看 `openbkn auth --help`），然后 `openbkn auth status --json` | 键的列表。预期只有 `hasToken: false`；实际是什么就记什么 |
| 4 | 未登录状态下打开 `dsh web` → 点 OpenBKN | 面板第一屏。macOS 上 `-3` 在这里显示「无法验证 OpenBKN 连接」；记录 Windows 上的表现 |
| 5 | 关掉 `dsh web`。请用户执行 `openbkn auth login https://192.168.50.28`（CLI 0.1.5，全新登录），然后**立刻**执行 `openbkn auth status --json`，在此之前不要执行任何其他 `openbkn` 命令 | 键的列表；**是否有 `expired`**。这是本次最主要的问题 |
| 6 | 打开 `dsh web` → 点 OpenBKN | 面板第一屏 |
| 7 | 如果第 6 步是报错：执行 `openbkn auth token > $null`，再 `openbkn auth status --json`，再重开面板 | 键的列表是否变化；面板是否恢复 |

如果 `openbkn auth logout` 不存在或行为不同，如实记录，改用 CLI 帮助里给出的方式；找不到安全的登出方式就停在第 2 步并报告。

## 回传

- 7 步各自的结果，标明是实际运行得到的还是读屏得到的。
- 两个明确的回答：① CLI 0.1.5 全新登录后 `auth status` 是否含 `expired`；② 未登录时 `-3` 的面板显示什么。
- 还原情况：CLI 是否已恢复登录，`.dsh` 是否已还原。
