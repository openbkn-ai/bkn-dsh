# -8 首次使用改动：开发与候选验证

日期：2026-10-08。范围仅为 [首次使用计划](../../plans/2026-10-08-plugin-first-use-quick-fix.md) 第一批 A0–A5。未发布；本文件按证据阶段更新。

## 源码与检查

- 基线 main：`4995109330a800060c523509cdaca8403744cd86`；分支 `fix/plugin-first-use-8`；插件版本 `0.2.0-rc.2-openbkn.0.2.0-8`。
- 维持 DSH `dsh-v0.2.0-rc.2`、三个组件条目与 bootstrap 零导入；无 Runtime 发布、无新配置存储、无平台算法或答案纠错。
- 未设置地址时业务条目正常启用，但不创建认证/MCP/业务服务。独立诊断将连接类检查记为 `not-run/configuration-required`。
- 通过独立配置 Remote 调用当前 profile 的 DSH 原生 `configEditor.edit`，仅改 `baseUrl`/`cliPath`，保留高级配置。有效地址保存与实际连接成功分开。
- 普通界面采用 CLI 登录；历史内部 `configureToken` 方法保留，完整无 CLI 模式仍暂缓。
- 配置重载释放旧业务所有者的策略/客户端；变更平台清除旧检查，同平台恢复保留历史。取消、旧地址与已销毁所有者的迟到结果不覆盖新检查。
- 业务回合和短绑定落盘阻止设置修改；设置保存期间阻止新的绑定写入。已有会话平台/网络不改绑，新实例只使用当前平台经 CLI 验证的 Token。

本地检查：typecheck exit 0；插件 371 项（370 pass / 0 fail / 1 skip）；仓库 suites 60/60；package audit 66 files；diff-check exit 0。原生输出随本目录归档。skip 为既有有条件平台用例，不能视为通过。

## A0 官方 npm Host 原生预验

证据：[native-config-editor-preflight.json](native-config-editor-preflight.json)。环境为官方 npm DSH `0.2.0-rc.2`、隔离 home/profile、无 inspector。使用本地构建包，**只证明原生配置链可用，不是固定 CI 候选的 UI/登录/发布验收**。

首次无地址三组件正常启用，连接检查未执行。非法 `file:///tmp/invalid` 提交返回 `openbkn/configuration-invalid/configField=baseUrl`，profile patch 哈希不变。合法地址与非默认 CLI 路径经原生编辑器写入、重载后可读回；独立配置接口和诊断继续存活。没有把组件加载 pass 当作连接成功。

## 待取得的候选验收

固定 CI 构建身份、逐文件清单与 macOS F0–F8 记录待补。Windows Desktop/npm 及用户源码构建 web 的受影响矩阵使用同一固定候选，单独 handoff；旧 -7 的实机证据不替代 -8。

既有受限账号未测、平台超时/落库、Token 重复拒绝根因、原故障机器根因沿用既定开放范围。后续完善项不进入本轮。
