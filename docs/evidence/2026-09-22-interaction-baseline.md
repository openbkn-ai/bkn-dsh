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

## 3. 改后验收结果（2026-09-22 实测）

> 运行形态：本地构建 Runtime（`release/runtime` + `release/profile`，插件 `0.1.5-rc.1` 含噪声治理提交 `e25702c..5c9b1ed`）+ `dsh web`（DSH `0.1.6-alpha.2`，Standard 预设，DeepSeek-V41-Flash）+ 平台 EE 0.1.4 + supply_ontology_hand。workspace 绑定经插件自有 registry 服务写入（等价 M5 的 remote 数据操作）。观测口径与基线一致（`openbkn trace conversations list/search`）。

### 3.1 总体数字（同一会话、13 轮）

| 指标 | 基线（旧版历史） | 改后（本次验收） |
| --- | --- | --- |
| 零业务 conversation 占比 | 3/9 = **33%** | **0%**（整个验收会话仅 1 个 conversation，其中全部 Interaction 均含业务调用） |
| 非访问轮 Interaction 产生率 | 不可枚举（见 §2） | **0**（见下方证据等级说明） |
| 访问轮 Interaction 数 | — | **每轮恰好 1**（QA 全量翻页复核：126 条 trace 归属 10 个 interaction，一一对应、全部终态 completed） |

**轮次构成说明（QA 复核勘误后修正）**：统计时刻（01:08 前）为 9 个访问轮 Interaction；其后取消用例的重问轮与 01:11 的独立核对问又各产生 1 个，平台现存共 10 个。「13 轮 = 5 非访问 + 9 访问」的简单加法不成立——13 轮实际含 5 个非访问轮、8 个常规访问轮、2 个取消用例的中断/重问轮（同问题）及统计后的核对轮；每个 Interaction 恰对应一次提问，「每访问轮恰 1」性质不受影响。

**非访问轮 0 Interaction 的证据等级**：主证据是**本地行为观测**——5 个非访问轮的会话页面均无任何 `mcp__openbkn__` 工具调用块，且分诊门控与 guard 结构保证「无 start 即拒一切业务调用」；「conversation 总数不增」仅为**侧证**——lifecycle-only Interaction 在平台 Trace 不可见（§2），且 continue 模式不新增 conversation，故平台侧计数无法反证非访问轮行为。该限制与基线口径限制同源，若需平台级反证须先补 lifecycle 事件入 Trace 或 interaction 枚举能力（建议向 bkn-foundry 提出）。

### 3.2 用例结果（§9.2）

| 用例 | 结果 | 证据 |
| --- | --- | --- |
| 你好 / 绑定问询 / BOM 通用知识 | ✓ 0 调用 0 Interaction | 主证据：页面无工具块（见 §3.1 证据等级说明） |
| Schema 类（有哪些对象类型） | ✓ 恰 1 Interaction；模型试图二次 start 被 guard 拒（规则 3 文案），照文案复用，无「拒→重试→再拒」回路 | `int_13f2f310…`：get_kn_detail×1；页面时序 start→(拒)→schema→finish |
| 检索（销售订单数） | ✓ 恰 1 Interaction，答案 40 张与 M5 独立核对一致 | `int_5f2df1fc…`：start→schema→metric×2→query→finish |
| 双子问题（库存+供应商） | ✓ **共享恰 1 Interaction**（8 个操作在其内） | `int_5ccf1e05…` |
| 业务→寒暄→业务 | ✓ 寒暄轮 0 新增（页面无工具块，主证据同上）；业务回归新 Interaction 同 conversation | `int_e2c1fa49…`；interaction 计数 3→3→4 |
| 长会话压缩后 | ✓ `/compact`（63 项 ~37.8K tok）后业务问题仍 continue 同 conversation | `int_924251c1…` |
| **重载会话后** | ✓ 页面重载恢复会话后业务问题仍 continue 同 conversation——**V0-5 由结构性覆盖升级为实测** | `int_4f88bc38…` |
| 已有结论直答（追问会话内已查过的事实） | ✓ 页面无工具块直答（分诊门控正例） | 统计时刻无新 Interaction/trace；QA 复核提示其后 01:11 的同型核对问产生了 1 个 Interaction，属统计后追加轮，见 §3.1 轮次构成说明 |
| 用户取消（页面 Esc 中断流式回复） | ✓ **优于预期**：DSH 继续执行完该轮工具并正常 finish，未产生未闭合 Interaction；告警未触发（turn 结束时 open=false） | `int_3e3525b7…` 终态 `completed`（中断瞬间的 `active` 为执行中态，非残留） |

### 3.3 未覆盖项（如实记录）

- **会话失效受控回退**：无法在本部署触发——生命周期会话管理路由（`POST /conversations/{id}/close` 等）被业务域授权拒绝（403 `permission_denied`）。其组件已分别覆盖：失效码形状与可区分性（V0-6 probe）、受控 new/tombstone/内存清 id（单测 12 条）。
- **超时 / 401 / 5xx / 参数错误不清除 conversation_id**：需平台故障注入，未执行；`classifyFailure` 对四类的分类由单测覆盖。
- **检索工具失败→finish(failed)**、**finish 自身失败**：未注入。
- **turn-stopping 告警的运行时观测**：web 进程 logger 输出不落 stdout/文件（走浏览器 console），运行时未见输出；告警内容（code/turn/interactionId）由单测锁定。取消场景本次未产生未闭合 Interaction，告警路径未被自然触发。

