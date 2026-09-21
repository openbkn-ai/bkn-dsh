# 噪声基线测量（改动前行为，2026-09-22）

> 用途：`docs/plans/2026-09-20-interaction-noise-reduction.md` §9.2 的改前基线。改动（`e25702c` 起）从未打包部署，平台上现存全部记录均为旧版行为产生，因此基线直接取自平台 Trace 历史。
> 平台：本机 kind 集群 OpenBKN EE 0.1.4（https://192.168.50.28）。统计身份：CLI 登录的 admin（owner scope）。
> 命令（2026-09-22 执行）：`openbkn trace conversations list --limit 100 --json`、`openbkn trace search --limit 200 --json`。

## 1. 基线数字

| 指标 | 值 |
| --- | --- |
| `bkn-agent-dsh-business-context` 名下 conversation 总数 | 9 |
| 其中有业务调用（产生技术 trace）的 conversation | 6 |
| **零业务调用的 conversation（空 Interaction 会话）** | **3（33%）** |
| 有业务调用的 interaction 数 | 8 |
| 每 interaction 的业务调用次数 | 12, 6, 6, 3, 3, 2, 2, 1 |

## 2. 口径限制（如实记录）

空 Interaction 的**精确总数不可枚举**，原因有三：

1. 平台 Trace 只记录业务工具的技术 trace——`root_operation` 分布中不存在 `bkn_start_interaction`/`bkn_finish_interaction`，lifecycle-only 的 Interaction 在 Trace 中完全不可见；
2. 生命周期会话路由 `GET /api/agent-observability/v1/conversations/{id}` 被业务域授权拒绝（403 `permission_denied`，「请求的业务域未获准执行公共生命周期写入」——该 GET 归入写路由族）；
3. 企业版 `business-provenance/interactions` 投影对该数据返回空。

因此基线采用 **conversation 维度差集**作为空 Interaction 的下界：3 个零业务 conversation，其名下每个 Interaction 均为空。改后复测沿用同一口径（conversation 差集 + trace search），保证前后可比。

## 3. 改后判定口径（§9.2）

- 非访问轮（寒暄 / 通用知识 / 插件与绑定说明类问题）：0 次 OpenBKN 调用、0 个新 conversation、0 个新 Interaction；
- 访问轮：恰好 1 个 Interaction，`search_schema` 等全部业务调用落在其内；
- `conversation_id` 在跳轮、压缩、重载三场景正确续接；四类非失效错误不清除。

改后数字与用例结果待验收执行后回填（见 §9.2 用例集）。
