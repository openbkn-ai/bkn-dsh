# -4 发版收尾记录

日期：2026-10-04（用户时区 Asia/Taipei）。本轮由 Codex 接手主开发；不合并、不打 tag、不发布，Windows 补测由用户安排外部 agent。

## 基线与候选

- 开始时 PR #60 head `4ee70bb12f830e53a8fad368d61b363a4a81ecbe`；main `927364c665e7a4ed9a5d2237272cca1d683d4d95`；正式最新插件为 `…-3`。
- 复用 PR #60 的工作树；原主 checkout 仍为 `fix/search-capabilities-contract` / `cc97d88`，其未提交 `CLAUDE.md` 和未跟踪 `AGENTS.md` 没有修改。
- Windows 结果原提交 `9d1c50f` 已 cherry-pick 为 `880a020`，原始报告内容未改。
- 候选 run **37202050194** / `c4b5dce`，133,806 字节、52 个文件；压缩包 SHA-256 `c4a8effbe5f84ecb399ee45ddf705c9468ef311910dcf58f62e47a0c71687a02`，tree-hash `f4e90f96d5c82e8b8c8cc505847995c6d3624f9870c58a71d7a3d010f3a5c5ad`，独立复核与 Windows 附录相同。
- 本轮只改 tests/probes、回归测试和仓库文档；插件 src、package.json、包内 README、依赖及锁文件没有变化。探针不在候选的发布文件里。
- 本轮本地构建复用了主 checkout 的 node_modules symlink，client.js 的 region 注释因此含不同依赖相对路径，不能把该本地构建当成候选字节一致的证明。package.json 与候选语义相同（字段顺序不同）；受管宿主 lib/index.js 相同。main 的干净 CI 彩排和候选逐文件比对仍待合并后执行。

## 探针修复与本地验证

已实际复现原缺陷：`--live` 在命令末尾不带 URL 时退出码 0，所有记录是 `stand-in`，仍总结 16/16。

修复：严格解析带值参数，错误参数在导入插件／DSH、读取凭据之前以码 2 退出；总结也标明模式。Windows 使用 cmd 的 PATHEXT 查找并保持路径及参数引号，覆盖默认命令、绝对 .cmd 和含空格及 `&` 的路径。CLI 子进程失败不向外传播可能含 Token 的 stdout/stderr 或 cause。

验证（macOS，Node 24.19.0、pnpm 11.7.0）：

- 插件构建／测试：258 项，257 通过、1 个 Windows 专用测试 skip、0 失败。
- 仓库／compat／runtime 测试：57/57。
- package:check：52 个发布文件通过；探针和测试未入包。
- 新回归覆盖无 URL、选项占 URL 位置、缺网络、同网络、单独网络选项、缺插件路径；全部在依赖加载前拒绝。Windows 实际 .cmd 测试留给 W1。
- 初次 pnpm run 因复用依赖链接触发自动重装检查，在非 TTY 下中止；没有重装依赖。后续通过 `pnpm_config_verify_deps_before_run=false` 运行现有依赖，未修改锁文件或共享 node_modules。
- 修复提交 `0cb4639` 的 [自动评审 run 37212087850](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37212087850) 已通过，确认原两条 inline 问题已修复；CodeQL 也通过。评审未执行探针及 Windows 测试，不代替 W1–W3 实测。评审提到的旧证据命令缺值已在原证据文件中补正并指向本轮完整记录；随后仅提交此文档补正。

## macOS 真实平台守卫（实际运行）

平台三个已部署服务镜像分别为 `agent-retrieval-ee:0.1.5`、`bkn-backend:0.1.5`、`sandbox-control-plane:0.1.5`。实时 CLI catalogue 28 个工具，含 search_capabilities / execute_tool，不含 execute_skill / search_tools / find_skills，与默认关闭技能执行的 0.1.5 契约相符。DSH ToolRuntime / MCP client 是 0.2.0-rc.2；CLI 使用独立安装的 `@openbkn/bkn-sdk@0.1.5`，不改系统 PATH 上的 0.1.4。

完整命令（从 repo root 执行；候选取自上面 run，CLI 是本机真实路径）：

```sh
NODE_EXTRA_CA_CERTS=/Users/kalias/.dsh/openbkn-dev-ca.pem \
/Users/kalias/.nvm/versions/node/v24.19.0/bin/node \
  packages/openbkn-business-context/tests/probes/guard-runtime.probe.mjs \
  --plugin release/codex-v4/candidate/package \
  --live https://192.168.50.28 \
  --kn supply_ontology_hand \
  --other-kn worldcup_vega_catalog_bkn \
  --cli /private/tmp/claude-501/-Users-kalias-Documents-project-app-openBKN/1ad8c822-777b-49e2-af0b-7efc09a2662d/scratchpad/cli015/node_modules/.bin/openbkn
```

退出码 0，16 项均带 `mode:"live"` 且通过；总结：

```json
{"mode":"live","plugin":"0.2.0-rc.2-openbkn.0.2.0-4","dshTools":"0.2.0-rc.2","summary":"16/16 checks passed","failed":[]}
```

平台核对：Interaction **`int_7ef32699669c71e4c49f327eecd714e3`**，操作工具名清单仅 `["search_capabilities"]`；跨网络、缺／非字符串 kn_id、排除及未知工具、交互前后拒绝都未派发到平台。该验证只证明客户端直接派发路径，不能证明 run_code 内嵌调用受同一限制，不能证明账号授权隔离（本地授权服务是放行桩）。

凭据改动：probe 前 CLI 状态 `hasToken:true, expired:true`；probe 内 `auth token` 成功刷新，结束后 `expired:false`。只由 CLI 更新自身凭据库，Token 未打印或另存副本。没有执行登录或登出。

## 授权异常与剩余闸门

macOS npm DSH 0.2.0-rc.2 已在独立 DSH_HOME、空 BKN_CONFIG_DIR 中安装固定候选并启动；没有改用户原 profile。浏览器控制通道对本地页面返回 `ERR_BLOCKED_BY_CLIENT`，随后 UI surface 查询超时，所以本轮没有声称完成面板授权异常实测。没有发起浏览器授权或更改证书验证。

源码确认：beginLogin 没把取消 signal 传给 CLI；等待阶段只有「正在连接 OpenBKN…」。一直不授权、面板关闭、设备码过期的 UI 最终行为仍未验证，见 Windows 补测 W4；不能用 kill 进程或模拟 timeout 代替设备码过期验收。

| 项目 | 状态／下一步 |
|---|---|
| Windows 原 v4 R1–R9、npm 登录、干净 expired 读数 | 已有原始报告；已整合，不重跑 |
| 探针错误参数、macOS live 守卫 | 已修复并验证 |
| Windows .cmd / 含空格路径 / live 守卫 | W1、W2 待 Windows agent 回传 |
| Windows 桌面面板登录 | W3 待用户配合 |
| 授权异常三条 | W4 待测，或由用户明确接受为未测 |
| 本轮异常取舍 | 待用户核对；不自动把已知或未测项关闭 |
| PR #60 复评、合并 | 修复提交 `0cb4639` 复评通过；Windows 补测和用户放行前保持 open |
| main CI 彩排与发布候选逐文件一致性 | 合并后执行，仍待完成 |
| tag、npm rc、GitHub Release、取回比对、latest | 仍待用户放行和前置闸门完成 |

上游可用版本仍需与支持版本区分：DSH 已发布 0.2.1-alpha.1，本轮仍固定 0.2.0-rc.2；OpenBKN 最新正式版本和 CLI 为 0.1.5。本轮不升级 pin 或部署。
