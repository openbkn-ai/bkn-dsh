# Windows 预验边界与受阻项

平台保持原样正式 OpenBKN 0.2.0，插件为未发布的本地 -27。这个 Git 交接 commit 只是交付身份，不是插件构建基点或最终 CI 产物。Windows 四组合当前均未执行；不得由 Mac 或脚本静态结果补填。

- 不依赖业务模型的安装、登录/UI、目录选择、诊断导出等可先执行。旧/新 npm 与 Desktop 必须分别记录原生结果。
- 正式平台的 Sandbox 安全问题尚未修复；用户选择不替换服务。Function、run_code、CSV、完整 BOM/销售等执行路径继续暂缓，不能由 Windows 会话自行放行或部署候选补丁。
- 普通查询原题也可能在后续回合选择 Sandbox。因此标准交期、同会话故障恢复和 B1 的真实模型查询，均须先有在原生 Windows 验证的派发前阻断条件，完整保留工具目录；命中保护的回合记 blocked。当前未交付该保护，不直接开始业务模型回合。
- 现有本机安全 G6 小范围复验为 9 pass / 1 fail / 2 blocked，属于 Mac 两版 npm/Desktop 的三个原题及恢复路径；不能当成 Windows 或完整 G6 结果。原失败保留。
- 旧版销售明细原失败仍开放：已发现正确 Function 的契约，但模型选错字段、未执行 Function，最后做了未过滤查询。尚不能由格式差异推断根因，不用别的计数题替代。
- 当前 Community 构建缺少可选非空原生业务解释路由；Interaction/operations 正常不替代该验收。非空原生解释仍 blocked，不造记录。
- 低权限负例账号暂缺，用户已确认；不使用管理员代验。
- 公共 SDK 的安全决策、Windows 全量人工联动、最终固定 build-only CI 候选及发布门槛仍开放。交付本分支不授权运行 CI、发布或升级平台。

本分支不包含本机业务数据对照、原始模型回答、Interaction/operations 明细或凭据。Windows 的业务原题、独立判定依据和保护条件未具备时应留 blocked，不在公开 Git 回传业务明细。每项区分 pass / fail / blocked / not-run / insufficient-evidence。
