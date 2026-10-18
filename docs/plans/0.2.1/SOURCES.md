# 0.2.1 源码与环境路径

检查日期：2026-10-13。路径为本机导航信息，不是可复制到 Windows 的绝对路径；跨机器以仓库相对路径和固定提交定位。不能只凭本地目录/版本端点宣称运行中的包、平台或授权一致。

## 仓库和提交

| 对象 | 地址/基线 | 说明 |
|---|---|---|
| 插件仓库 | https://github.com/openbkn-ai/bkn-dsh | 唯一 remote 为 origin |
| -10 主线基线 | `5b885dd7492fd42951b21729984f0d1e99da8b0d` | PR #89 合并；本次 docs 分支从该 origin/main 建立 |
| -10 原接受源码 | `9a35c0d9d1263b5f39b24d596f07dbcedbf25d04` | 0.2.1 不复用旧验收结论作为新增功能验收 |
| 已发布版本 | `0.2.0-rc.2-openbkn.0.2.0-10` | 0.2.1 为功能计划名称，尚未定完整 npm 版本串 |
| DSH 支持基线 | `dsh-v0.2.0-rc.2` / `639ed015397290b3745d163aafe02ffee4aa3f84` | 不自动升级宿主 pin |
| SDK 0.2.0 历史源构建 | `c404354793146edab944b7e5a79908bf41ddd591` | 本轮未确认原构建 checkout 的可用路径；执行前定位、核对正式 npm 状态，不猜目录或复用未知包 |
| 原生 Studio 本地分析基线 | `c778f73bdd50370e792dba9706e0ec95fd074d72` | 本机嵌套 Git 仓库 |
| Studio release/0.2.0 检查提交 | `a7d00ddb83835c1f2ec7da1429ebce4b1a976086` | 前序分析只核对四个指定文件本地/远端字节一致，不代表整树相同 |
| EE 后端本地基线 | `aa6b3826ff0ce7150da011121c448ca575cedfa3` | 前序分析核对 HTTP 与 explanation handler 文件；实际部署仍需单独核对 |

## Mac 当前可用目录

| 用途 | 绝对路径 |
|---|---|
| OpenBKN 工作区 | `/Users/kalias/Documents/project/app/openBKN` |
| 本次交接 checkout | `/Users/kalias/Documents/project/app/openBKN/bkn-dsh-diagnostics10` |
| 交接入口 | `/Users/kalias/Documents/project/app/openBKN/bkn-dsh-diagnostics10/docs/plans/0.2.1/README.md` |
| 插件代码 | `/Users/kalias/Documents/project/app/openBKN/bkn-dsh-diagnostics10/packages/openbkn-business-context` |
| DSH 固定源树 | `/Users/kalias/Documents/project/app/openBKN/dsh-020` |
| EE 后端分析源树 | `/Users/kalias/Documents/project/app/openBKN/platform-local-recovery/upgrade-20261012-020/ee-source` |
| 原生 Studio 分析源树 | `/Users/kalias/Documents/project/app/openBKN/platform-local-recovery/upgrade-20261012-020/ee-source/studio/bkn-studio` |

上述四个源码目录在本次建档时存在，HEAD 已读取。`bkn-dsh-diagnostics10` 是工作目录名字，不代表其当前分支仍在开发 -10。文档交付分支为 `docs/021-agent-handoff`；接手前检查实际状态，保留其他人的修改。

## 插件源码入口（仓库相对路径）

前缀：`packages/openbkn-business-context/`。

| 文件 | 负责的边界 |
|---|---|
| `src/business-context-service.ts` | `remoteGetTurnProvenanceView()`；session/message、绑定、平台身份及独立降级 |
| `src/platform-reader.ts` | 平台请求、解析、HTTP/传输分类和读取预算 |
| `src/provenance-view.ts`、`src/types.ts` | 受控投影、图与 ReceiptRef；新增 DTO 优先集中在现有合同面 |
| `src/native-mcp-provenance.ts` | 成功 finish 与同回合最终消息的关联 |
| `src/client/ProvenanceOverlay.tsx` | 当前三标签 UI；0.2.1 双视图主要入口 |
| `src/client/` | 语言字典盘点、面板/设置/诊断/CLI/登录控制器与渲染；先用文件搜索定位实际实现 |
| `src/config.ts` | 默认请求 30 秒、业务工具 20 秒、结果 1,000,000 字节、图 200 节点/400 边 |
| `tests/` | 合同/控制器/实际请求边界的受控验证；fixture 要标 upstream 来源 |

已有 Receipt 是从 operations 投影的引用，不是第三个独立读取或完整回执核验。新解释的结构与授权须通过 #93 确认，不从模型文字推导证据。

## 原生前端与后端入口

Studio 仓库相对路径：

- `src/modules/bkn-trace/business-provenance/business-provenance.service.ts`
- `src/modules/bkn-trace/evidence-chain/current-explanation.service.ts`
- `src/modules/bkn-trace/evidence-chain/CurrentExplanationPanel.tsx`
- `src/modules/bkn-trace/evidence-chain/evidence-chain.types.ts`
- `src/modules/bkn-trace/evidence-chain/README.md`

EE 后端仓库相对路径：

- `bkn-trace/agent-observability/businessprovenance/http.go`
- `bkn-trace/agent-observability/businessprovenance/current_explanation_http.go`

已做源码检查的接口：

```text
GET  /api/agent-observability/v1/business-provenance/interactions/{id}
GET  /api/agent-observability/v1/business-provenance/interactions/{id}/explanations
POST /api/agent-observability/v1/business-provenance/interactions/{id}/explanations  {}
```

这不是端点已用 CLI 凭据实机通过的声明。先读取既有解释；显式生成可能调用平台配置的 Claim Agent、产生模型费用和写入。不要把缺路由/未披露的 404 推断成 license 原因，也不要把旧 operations/graph 的可读性当新接口授权。

DSH 语言入口：`packages/client/locale/README.md`。复用公共 `ctx.locale.register(ns, { zh, en })` 与 `ctx.locale.bind(ns)`，控制器保留稳定错误码/参数，渲染时翻译。

## 临时材料与运行环境

- `/tmp/bkn-dsh-021-planning-20261013/`：本会话起草文本、GitHub readback 和项目截图；可能被清理，正式接手以 GitHub 与本目录为准。
- `/tmp/bkn-provenance021-feasibility/`：前序分析的远端源码快照；不保证仍存在，不是测试包或完整源树。
- `/tmp/bkn-plugin10-release-20261013/`：-10 发布核验历史材料；不是 0.2.1 候选。
- 历史测试平台地址、临时回环映射、端口、隔离 home 与 CLI 登录状态均不视为当前可用环境；执行前重新确认，不复用日常 profile，不在计划文件记录凭据。

本轮没有启动 Host、安装 SDK、登录平台、读取真实业务数据、生成解释或调用模型；#93 是后续执行门槛。

## 2026-10-18 执行补充

当前实现分支为 `feat/021-localization-login`，实现提交 `4857c31225576f4f4b083ca26bb9469ab671b363`。新增原生投影 `src/native-provenance.ts` / `src/native-provenance-types.ts`，新视图 `src/client/NativeProvenancePanel.tsx`，语言入口 `src/client/locale.tsx` / `locales.ts` / `messages.ts`。实际 API、镜像身份、受控/真实证据和剩余验收见 [开发执行记录](../../evidence/2026-10-18-021-development.md)。本文件上方的历史基线与临时路径不作当前产物证明。
