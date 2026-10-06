# -7 统一候选交接

日期：2026-10-06。目标版本：`0.2.0-rc.2-openbkn.0.2.0-7`。本轮已授权整合、提交推送、build-only CI 和实机复验；发布、tag、npm dist-tag 迁移尚未执行。

## Windows反馈后的当前状态

PR #64 已合入main，诊断 -5/-6、baseUrl校验、#62/#63与三题指导已在同一源码。新的main build-only run [37447961098](https://github.com/openbkn-ai/bkn-dsh/actions/runs/37447961098)成功：source `7553cc13a17e80b87e4d8b2b22381ab8f05bc22d`，tgz SHA `4e4f7c3d44453038b4f2a723ec5334c443565ef0628e1e295bd339eda8f14d86`，65文件；与review分支CI包逐字节一致。

**当前尚不能发布。** 本包Mac诊断/URL/隔离/live guard复测通过，但原题BOM回答多出一行，缺失物料回答另有源表名准确性异常。完整结果与失败定位见 [RESULTS](../../evidence/unified-7-acceptance-20261006/RESULTS.md)，下一项源码任务见 [回答质量收口](../../evidence/unified-7-acceptance-20261006/ANSWER-QUALITY-HANDOFF.md)。不能继承局部策略包“三题通过”的结论。

可直接转发 [Windows复测通知](WINDOWS-NOTICE.md)，其中固定交付 commit、ZIP下载和SHA已通过远端下载核验。

Windows -6 反馈已归档于 [windows-results](../2026-10-06-diagnostics-windows/windows-results/README.md)。新包仅做 [统一 -7 受影响复测](windows/HANDOFF.md)，交付/下载入口见 [Windows包说明](windows/README.md)。根据用户决定，**不再要求旧版本就地升级**；完全移除旧插件后安装新包，保护会话、凭据和无关patch。无凭据的登录/G6/live guard保持not-run。

用户账户的累计更新只用 [这一份发布说明](../../releases/2026-10-06-unified-7-notes.md)，不另发 -5/-6 公告。以下原整合计划与门槛保留作为历史/后续规则；当前逐项状态以本节及RESULTS为准。

## 范围

整合 `fix/diagnostics-d0-s2`（基线 ba9f604）、原工作区的上游契约规范与诊断规划、未提交的 baseUrl 配置校验、三项供应链问答策略与证据。-5/-6 是未发布开发候选，统一 CHANGELOG 为 -7；原记录的包版本、哈希、测试失败和后续通过结果保留。

Review 另修正普通 Node Host 被误判为 npm，以及会话导出的短凭据/字段别名和 Markdown 脱敏遗漏，附失败复现后的回归用例。平台 Issue #2029 的实现和部署由平台维护方处理，不纳入插件 PR。

官方 DSH 固定 `dsh-v0.2.0-rc.2` / `639ed015397290b3745d163aafe02ffee4aa3f84`。本轮核对最新 DSH 与 OpenBKN 上游，不升级 pins；实际测试平台相关服务为 0.1.5。实时 MCP 28 项均可归类，`execute_skill` 未启用；最新平台 main 的 native-tool 路由需后续适配，本版保持拒绝未经审核的新增工具。

## 证据与限制

- [统一 review 与验证](../../evidence/release-7-review-20261006/RESULTS.md)：合并工作区、本地测试和包身份。
- [三项真实问答](../../evidence/supply-three-fixes-20261006/RESULTS.md)：macOS 官方 Desktop，DeepSeek-V41-Flash High，`supply_ontology_hand`；记录原题、答案、工具轨迹、独立平台查询及失败轮次。通过的是策略局部包 round-6，不能替代本次合并包的验收。
- [baseUrl 官方 npm Host](../../evidence/baseurl-configuration-20261006/RESULTS.md)：此前单独配置修复包的证据，不能复用其哈希代表本次合并包。
- 历史 D0/S2/S4 隔离测试证明相应独立入口行为；Windows 及合并后新版包尚未全覆盖。诊断的重新采集为被动采集，主动探测未实现。
- BOM 深层库存能力仍超时：[平台 #2029](https://github.com/openbkn-ai/bkn-foundry/issues/2029)。成功答案用了完整 BOM 加范围一致的只读库存 fallback，并保留超时/拒绝工具等异常。不得据此宣称平台超时或完整 guard 验收已经修复。

## PR 后发布门槛

1. 在合并候选分支运行 `release-plugin.yml`，`publish=false`，取得新的 CI 包并固定 commit、版本、sha256、安装文件清单。此前 CI7 或局部 pack 不能冒用为此次统一产物。
2. 安装该 CI 包，核对真实加载版本与哈希，验证诊断正常/组件故障、baseUrl 失败分类，以及 #62/#63 受影响路径。Windows 用真实 Windows 官方 Desktop/npm 运行，保留报告与用户状态核验。
3. 在有效 CLI 登录和已绑定 `supply_ontology_hand` 的标准工作区上，保持原模型 High 和原题复测三项。先核验物料/BOM/库存数据漂移；记录完整五层每物料单耗与库存，并明确仓库、在途和占用口径。更换模型的结果另列。
4. 这三项不要求受限账号或两个网络。权限/跨网 guard 验收另列，使用真实工具运行时的确定性探针，不能仅用模型问答证明拒绝规则。
5. 对每项异常作出处理决定；修改任何包文件后重新构建 CI 包并复测受影响项。main 上最终包解包应与接受包一致。用户批准后才 tag；`latest` 在所有宣称支持的形态核验完成后移动。

上述门槛未完成时只能声明 PR 和本地验证完成，不能声明版本已发布或各宿主已验收。
