# 审查报告：溯源时间链批次（T1 → T2 → T4a → T5）

> 日期：2026-09-23。审查对象：分支 `feat/provenance-layered-timeline`（`8c72f5c..cb5c6d9`，基于 main `06ac663`）以及执行 agent 的交付汇报。
> 对照任务书：`docs/plans/2026-09-21-provenance-timeline-handoff.md`。
> 用途：交给后续开发 agent。第 4 节是给 agent 的任务；第 5 节是**平台环境事项，只由用户处理，agent 不得触碰**。

## 1. 结论

**分支可以接受。** 4 个提交都在，没有 push；插件测试和 `package:check` 复跑通过；证据文档和 6 张截图里没有 token、参数值或原始载荷。

汇报里有 3 处和事实不符（第 3 节 R2、R3、R5），另有 1 个没说清的环境安全问题（R1）。代码侧的小问题已在本次审查中处理（第 2 节），剩下的开发任务和平台事项分别列在第 4 节和第 5 节。

## 2. 核验结果（审查时实际复跑）

| 项 | 汇报 | 复跑结果 |
| --- | --- | --- |
| 分支和提交 | 4 个提交，未 push | ✅ 相符；没有上游跟踪分支，工作区干净 |
| 插件测试 | 195/195 | ✅ 195/195 |
| `package:check` | 通过 | ✅ exit 0 |
| 仓库测试 | 49/49 | ❌ Node 24.13.0 上是 37/38：`tests/bundle-portability.test.mjs` 整个文件崩溃（见 R2）。修复后 49/49 |
| 证据是否脱敏 | — | ✅ 在文档里搜 token 特征串没有命中；截图只显示 interaction/op/receipt 这类 id |
| T3 范围 | 未提及 | ℹ️ `kind` 已经是 4 个值，并改用 `MANAGED_IN_INTERACTION_TOOLS`。原因是噪声治理（#31、#32）在分支之前就合进了 main，这个处理合理 |

**本次审查已执行的改动**：

| 改动 | 位置 | 状态 |
| --- | --- | --- |
| 修复符号链接探针：Node 24 上 `rmSync` 删目录符号链接会报 `EISDIR`，改用 `unlinkSync` | 新分支 `fix/symlink-probe-node24`，提交 `c42e512`（基于 main，未 push） | 已提交；仓库测试 49/49，确认不再遗留探针 |
| 证据更正：§2.1 的"PTC"说法改为"`run_code` 在平台侧执行"；§5 的"已入记忆"更正为实际位置；新增 §7「环境漂移」 | `docs/evidence/2026-09-22-timeline-e2e-stage1.md` | 已在本分支提交 |
| 写下事故教训和放行桩的影响 | 工作区 `CLAUDE.md` 的 Constraints 段（工作区根不是 git 仓库） | 已写入 |
| 本报告 | `docs/reviews/2026-09-23-provenance-timeline-batch-review.md` | 已在本分支提交 |

## 3. 审查发现

| # | 级别 | 发现 | 依据 | 去向 |
| --- | --- | --- | --- | --- |
| R1 | 🔴 | 重建后的集群，vega 的授权检查实际上关掉了。宿主机上的 `authorization-private` 放行桩对所有请求一律允许，监听 `*:30920`，没有认证，局域网能访问。T4a 的结论在删集群之前取得，不受影响；但此后在本集群上做的权限类验收都会假通过 | `platform-local-recovery/authz-stub.mjs`；`lsof` 看到监听 `*:30920` | 证据 §7 和工作区 CLAUDE.md 已标注；处置见第 5 节 P1 |
| R2 | 🟠 | 汇报的"仓库 49/49"复现不出来。`canCreateSymlinks()` 第一次清理写在 `try` 外面；Node 24.13 上 `rmSync` 删目录符号链接报 `ERR_FS_EISDIR`，同一进程第二次调用时整个文件崩溃。这个文件本分支没动，是 main 上原有的问题 | 单独写脚本复现，关掉沙箱也一样 | 已修，`c42e512` |
| R3 | 🟠 | 汇报说"事故教训已写入记忆"，实际不成立：项目记忆目录是空的，两个 CLAUDE.md 里也没有 | 搜索 `cluster down` 没有命中 | 已写入工作区 CLAUDE.md |
| R4 | 🟡 | 重建后的环境和事故前不一样：3 个 hotfix 镜像回退成 `:0.1.4`，多个镜像是 amd64 跑在 Rosetta 上，TLS CA 换了新的 | 证据 §6 | 证据 §7 已汇总；处置见第 5 节 P5 |
| R5 | 🟡 | 证据 §2.1 把嵌套调用说成"PTC 工具派发形态"，这不对：`mcp__openbkn__run_code` 在平台侧执行；DSH 的 PTC 在这个 alpha 版本里本来就用不了 | 噪声治理方案 §0 | 已更正 |
| R6 | 🟡 | 界面缺陷只记录了，没进待办：平台返回 404 `resource_not_disclosed` 时被归成 `platform-unavailable`，界面提示"稍后重试"，但记录可能永久不存在 | 证据 §6；`platform-reader.ts:143` | 第 4 节 A1 |

## 4. 给开发 agent 的任务

### A1 区分"记录不存在或未披露"和"平台不可达"（R6）

**现状**：`platform-reader.ts:143` `if (!response.ok) throw … 'PLATFORM_UNAVAILABLE'`，所有非 2xx（包括 404）都走这里。服务层的 `classify` 把它归成 `platform-unavailable`，界面提示"稍后重试"。

**要注意的语义**：`resource_not_disclosed` 按平台的设计契约，有意不区分"不存在"和"存在但不向你披露"（参见 V1 证据里 agent-retrieval 404 伪装的设计原则）。所以文案**不能**说"记录已删除"，只能说"平台上不存在，或未向当前账号披露"。

**做法**：
1. `platform-reader.ts`：在 `!response.ok` 之前，对 **404** 用现有的 4 KB 有界读取解析 `error.code`（复用 403 分支的写法）；只有 `code === 'resource_not_disclosed'` 时抛新码 `RECORD_NOT_DISCLOSED`。其他 404 保持 `PLATFORM_UNAVAILABLE`。不要把响应体的其他内容带出来。
2. `types.ts`：`ProvenanceDegradationReason` 增加 `'record-not-disclosed'`；证据链的 `EvidenceUnavailableReason` 把它映射到 `'not-authorized'` 还是新增一个值，二选一，并在提交说明里写理由。
3. `business-context-service.ts` 的 `classify`：`RECORD_NOT_DISCLOSED` 映射到 `'record-not-disclosed'`。
4. `ProvenanceOverlay.tsx` 的 `degradationCopy` / `degradationMark`：标题"平台未找到此记录"，正文"该 Interaction 在当前平台上不存在或未向当前账号披露（例如平台重建后历史记录已丢失）。重试不会改变结果。时间链不受影响。"，不给"稍后重试"。
5. 测试：reader 的 404+`resource_not_disclosed` → 新码；其他 404 → `PLATFORM_UNAVAILABLE`；service 映射；错误体超过 4 KB 或不是 JSON → `PLATFORM_UNAVAILABLE`。
6. CHANGELOG 的 Unreleased 条目补一句。

**不要顺手改**：`platform-reader.ts:141`（403 但不是 `permission_denied` 时归为认证失败）不在本任务范围内，如果觉得有问题，另开一项。

**验收**：插件测试全绿并写明新计数；`package:check` 通过。**不需要**在线上验证：当前集群的历史 interaction 已经丢失，可以直接打开一个老会话的溯源面板看文案。这一步是可选的只读操作，不得为了造场景去改动平台。

### A2 合并前整理

1. `fix/symlink-probe-node24`（`c42e512`）是一个独立的小 PR，和本分支没有依赖，可以先合。
2. `feat/provenance-layered-timeline` 在 A1 完成后一起提 PR。**push 和开 PR 都要用户明确授权**，agent 只准备好 PR 描述即可。
3. 本机运行 `pnpm` 测试或 `package:check` 时，可能把 `pnpm-lock.yaml` 的 generator override 改写成本地路径（`link:../deepseek-harness/...`）。**不要提交这个改动**，提交前用 `git restore pnpm-lock.yaml` 还原（仓库 CLAUDE.md 的 Gotchas 里有规定）。

### A3 T4b（依然挂起）

"时间链节点数 = 调用数 + 2"的精确对照，在 T4a 的基线轮上不成立，因为 `run_code` 在平台侧嵌套执行了其他调用。要么选一轮不走 `run_code` 的问题重跑，要么把口径改为"本地 `tool/call` 数 + 2"。T4b 本身不依赖授权，放行桩不影响它；但证据里必须引用 stage1 证据的 §7。

## 5. 平台环境事项（**只由用户处理；agent 不得执行**）

| # | 事项 | 为什么不由 agent 执行 | 建议做法 |
| --- | --- | --- | --- |
| P1 | 放行桩收窄监听地址，并决定怎么常驻 | 属于宿主机和平台环境；变成常驻服务前要先解决 R1 的暴露问题 | 把 `authz-stub.mjs` 末尾的 `'0.0.0.0'` 改成 `'127.0.0.1'`，再确认 vega / bkn-backend 的请求还能出现在桩日志里（OrbStack 的 `host.docker.internal` 能不能转发到宿主机回环地址，**还没验证**）；不行就只绑定 OrbStack 那块网卡的地址。常驻方式二选一：手动 `nohup`（README 里已有），或写 launchd plist |
| P2 | DSH 的 CA 证书 | 属于宿主机配置 | 用新 CA 覆盖 `~/.dsh/openbkn-dev-ca.pem`，原来的启动方式就能继续用；`NODE_EXTRA_CA_CERTS` 只对 DSH 进程设置，不要写进全局 shell 配置或系统钥匙串，因为这个 CA 的私钥就在工作区的 `platform-local-recovery/tls/tls.key` |
| P3 | license 发行侧解绑 | 以用户名义联系第三方厂商；涉及 license 文件 | 优先级低：capabilities 已显示 enterprise/valid，读路由也不受影响。需要续期或厂商支持时，再拿 license ID（文件名，不发文件内容）和新实例指纹去申请把激活迁到新实例 |
| P4 | skills 默认 OSS 存储 | 改平台全局配置，可能要填存储访问密钥 | 只有验收要用 skills 工具时才配。推测可以指向集群里的 MinIO，这样不需要外部云存储的凭据（**未验证**）。配好后确认 skills 注册返回的不再是 `{data:[]}` |
| P5 | hotfix 镜像回退和 amd64 模拟 | 要改平台部署 | 如果 G6 评测要用到 hotfix 修过的样例场景，先向发布方确认 `0.1.4-hotfix-supply-sample-p1` 的替代标签；在那之前，本集群的评测结论要引用 stage1 证据的 §7 |
| P6 | worldcup 样例重建 | 要改平台数据 | MySQL 数据还在，需要时重跑 `bkn-samples/.../run.sh` |
| P7 | 权限类验收的前提 | 要恢复真正的授权服务，需改平台部署 | 在 P1 之外，如果以后要做权限负例（G6），需要一套有真实 `authorization-private` 的部署，或者等 foundry 提供替代服务；**在放行桩上跑出来的权限结果不能作为证据** |
