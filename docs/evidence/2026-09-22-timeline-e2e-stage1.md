# 时间链 T4a：平台侧行为验收 · 第一阶段（2026-09-22/23）

> 对应 `docs/plans/2026-09-21-provenance-timeline-handoff.md` T4a。运行形态：本地构建 Runtime（`release/runtime` + `release/profile`，插件 `0.1.5-rc.1` 含本批提交 `8c72f5c..0080ac0`，经 `dsh plugin --profile web add` 重装）+ `dsh web`（DSH 0.1.6-alpha.2，Standard 预设，DeepSeek-V41-Flash，`DSH_HOME=release/profile/home`，`NODE_EXTRA_CA_CERTS` 指向开发 CA）+ 平台 kind 集群（本阶段中段经历误删与重装，见 §5）。
> 截图均为页面本体（不含地址栏）。老会话样本 = 噪声治理批次（2026-09-22 凌晨）留下的真实业务会话，其溯源句柄为 schema v1（`schemaVersion:1`、无 `turn` 字段），恰为本阶段所需的 v1 老会话。

## 1. 场景结论总表

| # | 场景 | 结果 | 截图 |
| --- | --- | --- | --- |
| 1 | 正常一轮业务问答（基线，v2 句柄） | ✅ 四段齐全；run_code 节点挂上平台事实；答案 40 张/已确认与 M5 独立核对一致 | `stage1-baseline.png` |
| 2 | 域未授权（`businessDomain: bd_nonexistent_xyz`） | ✅ 时间链照常；其余三段均 `domain-not-authorized` 且透传 `required_action=request_authorization`；文案明示与 License 无关 | `stage1-domain-unauthorized.png` |
| 3 | Token 失效 | ✅ 时间链照常；其余三段「需重新认证」；**无任何企业版提示**（自然触发：CLI 令牌过期未同步，见 §2.3） | `stage1-token-expired.png` |
| 4 | 平台不可达（集群停止后打开旧会话溯源） | ✅ 时间链照常；其余三段 `platform-unavailable` | `stage1-platform-unavailable.png` |
| 5 | v1 老会话 | ✅ 正常打开；时间链由 `messageId → assistant/message.turn` 反查重建；句柄读入即 v2 内存形状，无冲突无报错；四段齐全（含业务图） | `stage1-v1-execution-platform.png`、`stage1-v1-business-graph.png` |
| 6 | lifecycle 对齐观察 | ✅（行为已确认，见 §3） | — |

## 2. 逐场景记录

### 2.1 基线：一轮新业务问答（v2 句柄）

问题「382-000005 现在有多少张销售订单？请给出数量和状态分布。」→ 回答 40 张、全部「已确认」（与 M5 的 MySQL 独立核对一致）。轮 15 落盘句柄：`schemaVersion=2, turn=15, conversationId=conv_b2e28…`（从会话日志直接核验）。

- **时间链 4 节点**：提问 → `bkn_start_interaction · continue · conversation: yes`（213 ms）→ `run_code`（2.1 s，**挂上平台 Op/Receipt/Status**）→ `bkn_finish_interaction · completed`（60 ms）→ 回答。
- **平台执行事实 6 条**：`run_code`、`query_metric ×2`、`query_object_instance ×2`（均带 Request/Trace/Receipt 全链路 id）。
- **证据链 6 条回执**，均含 `openbkn trace receipts get <id>` 指引。
- **计数与差值（如实记录，不在本批改代码）**：本地时间链工具节点 3 个（start、run_code、finish），平台 operations 6 条。差值原因：模型把两次 metric 查询与两次实例查询**嵌套在 run_code 内部**派发（PTC 工具派发形态，与噪声治理批次观察一致），嵌套调用对本机会话事件不产生独立 `tool/call`。对齐规则正确处理：仅数量一致的 `run_code` 组（1:1）挂平台事实，其余平台条目只出现在执行事实明细，不误挂。

### 2.2 域未授权

`cordis.patch.yml` 增 `businessDomain: bd_nonexistent_xyz` 后重启，打开同轮溯源：

- 时间链 4 节点原样（节点、耗时、摘要全部一致）；
- 执行事实/业务图/证据链三段均显示「业务域未获授权」徽章 + 文案「平台拒绝了本次读取：请求的业务域未列入部署允许清单，或当前账号未被授权（与 License 无关，升级版本不会解决）。平台提示：request_authorization。下一步：核对插件的 businessDomain 配置（默认 bd_public）…」——`required_action` 透传 ✅，无企业版误导 ✅。
- 验后已还原配置并重启。

### 2.3 Token 失效（自然触发，未做人为破坏）

首启后打开老会话溯源：时间链照常；其余三段「需要重新认证：平台令牌已失效或未配置…下一步：重新登录 OpenBKN 后重试」。成因是 CLI 令牌于当日过期、DSH 保险库仍持旧值（无新轮次触发同步）——与「使凭据过期」的目标状态等价，无需人为破坏凭据即完成本格验证。随后经 OpenBKN 入口触发 `remoteStatus` 同步新令牌，面板即恢复全量数据（同时构成降级→恢复的完整观察）。

### 2.4 平台不可达

`mac.sh cluster down` 后重启 DSH（配置已还原），打开同轮溯源：时间链 4 节点原样；其余三段「平台数据暂时不可用…OpenBKN 平台暂时不可达，本面板稍后重试即可。时间链不受影响。」（`platform-unavailable`）✅。平台恢复后无需任何清理即回到基线形态。

### 2.5 v1 老会话（真实历史样本）

打开噪声批次会话「问候致辞」（14+ 轮，含 10 个 v1 溯源句柄），点击任一历史回答的「查看业务溯源」：

- 面板正常打开，Interaction 为 2026-09-22 的历史交互；
- 时间链 5 节点（提问 / start `· continue · conversation: yes` / `run_code ×2` 折叠 / finish / 回答）——**v1 无 turn 字段，`messageId` 反查路径实际生效**；
- 同轮平台事实恢复后：两个 run_code 节点各自挂上 Op/Receipt（**因为携带 platform 而不再折叠**——折叠规则的「带平台事实不折叠」分支获得线上实证）；
- 业务图渲染历史企业投影（销售订单 object · resolved）；证据链 6 条历史回执。

### 2.6 lifecycle 对齐（观察项）

平台 operations 列表（两个交互一致）中**不存在** `bkn_start_interaction`/`bkn_finish_interaction` 条目——平台只记录业务工具调用。因此 lifecycle 组「本地 1 个节点 vs 平台 0 条」恒为数量不齐，按规则**整组不挂**平台事实；start/finish 的耗时走本机口径。这与设计预期一致（安全方向），无代码动作。

## 3. 设计规则的线上实证清单（超出表格的细粒度观察）

1. **平台事实不折叠**：同一轮 run_code×2 在无平台数据时折叠为「×2」，平台恢复后因各自携带 `platform` 不再折叠（§2.5）。
2. **对齐宁缺毋错**：run_code 1:1 对齐挂载；数量不齐的组（lifecycle、嵌套调用的 query_*）一条都不挂（§2.1/§2.6）。
3. **摘要白名单**：全场景未见任何工具参数值或响应体片段进入节点（与单测 fixture 断言一致）。
4. **降级互不传染**：三格降级场景中时间链逐节点完全一致（含耗时），仅平台侧三段变化。
5. **Token 失效 ≠ License 提示**：全流程未出现任何「企业版/升级」字样（本批删除整面板升级提示的直接验证）。

## 4. 未验证项（T4b 范畴，如实移交）

- 「时间链节点数 = 调用数 + 2」的精确对照依赖「访问轮恰好一个 interaction 且调用不嵌套」，随噪声治理批次后的 T4b 补跑（本批基线轮因 run_code 嵌套派发不满足该口径）。
- 社区版形态（无 EE 镜像/license）的端到端对照未在本阶段执行（V1 源码结论已覆盖语义；集群重装后 license 状态见 §5）。

## 5. 事故记录与恢复（如实披露）

**事故**：§2.4 执行 `mac.sh cluster down` 时，误将其当作「停平台」——该命令**删除** kind 集群（正确做法应为缩容 ingress 或断网模拟）。后果：平台栈与数据（含历史 interaction/conversation、样例 KN、license 状态）全部丢失。上述 §2.1–2.5 的验证均在删除前完成，不受影响；本地 DSH 会话日志未受损。

**恢复过程**（2026-09-23 凌晨）：

1. `cluster up` 重建集群，但 ingress 镜像两度受阻：① kind 节点 containerd 继承了宿主代理 `http://127.0.0.1:10808`（节点内不可达）→ 写入 `/etc/systemd/system/containerd.service.d/10-proxy.conf` 改指 `http://host.docker.internal:10808`（OrbStack 宿主别名）后 registry.k8s.io 恢复；② admission Job 引用摘要形式镜像 → `docker pull` + `ctr images import --digests` 注入节点。
2. `mac.sh -y bkn install` 重装数据层与主栈；redis 镜像 `openbkn-ai/redis:1.11.2-…` 在 SWR 上**只有 amd64**（arm64 Mac）→ 以 `--platform linux/amd64` 拉取后 ctr 注入，Rosetta 模拟运行正常（mariadb/kafka/opensearch 均原生 arm64 可拉）。
3. EE 镜像切换（`openbkn-ee.sh install`）、optimizer bootstrap、license 重应用、样例 KN 重建与平台健康复核：见下节「恢复后状态」（进行中/完成时更新）。

**教训**（已入记忆）：`cluster down` 是删除不是停机；模拟「平台不可达」应使用 `kubectl scale deploy ingress-nginx-controller --replicas=0` 一类可逆操作。SWR 部分镜像无 arm64 是本机重装的固有坑，注入器脚本模式（amd64 拉取 + ctr import）为标准解法。

## 6. 恢复后状态（2026-09-23 凌晨完成）

- [x] 集群重建 + ingress（containerd 代理改 `host.docker.internal:10808`；registry.k8s.io 摘要镜像经 `docker pull`+`ctr import` 注入）
- [x] 数据层（mariadb/redis/kafka/opensearch）Running；无 arm64 的镜像以 amd64+Rosetta 注入运行
- [x] OpenBKN 主栈 helm 安装完成；`sandbox-control-plane`/`agent-retrieval`/`agent-operator-integration` 的 `0.1.4-hotfix-supply-sample-p1` 标签在 SWR 不存在，已回退 `:0.1.4`
- [x] bkn-backend 起动依赖解决：0.1.4 chart 仍引用 ISF 时代 `authorization-private:30920`（开源 foundry 已移除该服务，`isf install` 命令在当前 deploy.sh 中不存在）→ 以许可型桩恢复（宿主 `authz-stub.mjs` + 无选择器 Service/Endpoints 指向 `0.250.250.254`；`/policy` 须答 204），工件与重启方式存于工作区 `platform-local-recovery/`
- [x] EE 镜像切换 + optimizer bootstrap 完成
- [x] license 重应用：导入成功，capabilities 报 `licensed:true / enterprise / valid`（存储+签名有效即生效）；**发行侧激活返回 409「已在另一实例上激活」**——彻底解决需授权方解绑旧实例指纹（用户侧动作）
- [x] HTTPS 恢复：新生成自签证书（CN=192.168.50.28），ingress 统一 `nginx` class + 控制器默认证书；DSH 以 `platform-local-recovery/tls/openbkn-dev-ca-20260923.pem` 作为 `NODE_EXTRA_CA_CERTS`（旧 `~/.dsh/openbkn-dev-ca.pem` 已不匹配）
- [x] admin 重新登录（安装初始密码，CLI `-k` 过自签证书）；supply_ontology_hand 重建：KN 导入 → Catalog 12/12 扫描 → 绑定 → 冒烟全部通过 → power_layer 指标 + 原生函数工具箱注册（MySQL 容器 `bkn-supply-mysql` 未受事故影响，数据原样）
- [x] DSH 对接终验：网络目录/令牌同步正常；旧 interaction（随集群删除）在面板中正确降级 `platform-unavailable`（404 `resource_not_disclosed` → 该分类对「记录已不存在」文案偏「稍后重试」，如实记录，不在本批改）；时间链完好

**恢复后残留（用户侧动作）**：① license 发行侧解绑旧实例（如需彻底激活）；② skills 注册需 Studio 管理面配置默认 OSS 存储（`{data:[]}`，公开 API 路径未定位到）；③ worldcup 样例未重建（MySQL 数据仍在，重跑 `run.sh` 即可）；④ `authorization-private` 桩为宿主进程，重启机器后需按 `platform-local-recovery/README.md` 拉起。
