# 受影响业务回归

桌面/npm 各自记录：

| ID | 操作 | 验收 |
|---|---|---|
| R1 | 新 profile 安装，重开 | bootstrap/business/diagnostics 三 row 各一，侧栏仅一个 OpenBKN |
| R2 | 无登录状态打开 OpenBKN | 显示登录入口；右上角“诊断”仍可打开 |
| R3 | CLI 0.1.5 在隔离 store 登录、面板同步 | 用户授权后无须重启即可列出网络，异常另列 |
| R4 | supply_ontology_hand 关联隔离工作区，标准模式新会话，问“查询 382-000005 的物料名称与标准交期” | 生命周期、绑定网络、受管工具与真实数据一致，不执行动作 |
| R5 | 打开该回答的业务溯源 | 时间链/操作/业务图分别正常或如实降级，不把 pending/大记录隐藏为全绿 |
| R6 | 退出并重启、追问“这个物料的交期依据是什么？” | 历史与绑定保留，conversation_id 连续，溯源可打开 |
| R7 | 普通未绑定会话、其他网络 ID | 不给未绑定会话 OpenBKN 能力；跨网拒绝以 live guard 证明，模型自觉不能替代 |
| R8 | 绑定会话选择 PTC | 明确要求标准模式，无受管业务工具调用 |
| R9 | 整包 remove 后重开 | 三 row 和本包 UI 全部消失；原会话历史可读，无关用户 patch 保留 |
| U1 | -4/-5 → 当前候选、重复安装 | 三 row 不重复；ID-only canary 配置保留；旧 name-qualified 两种迁移写法均验证 |

模型尚未配置、数据集不可用或平台权限不足时对应项 not-run，并说明所缺输入，不构造假答案。

升级基包已随完整 ZIP 放在 history/，身份见 upgrade-baselines.json。-4 为 CI run 37202050194 的固定候选，-5 为最后一轮已核验的历史本地候选；两者仅用于升级测试，不能代替当前 CI 候选安装给故障用户。分别在新的隔离 profile 安装旧包，写入 ID-only canary，以及带旧 name 的 canary，确认原行为；升级到当前包后，验证 ID-only 保留，并分别用删除 name、改为 ./business 两种迁移恢复旧 name-qualified 配置。重复安装后检查三 row 各一；整包 remove 后本包 row 消失，用户 patch 保留。

live guard：在本轮 ProbeRoot 安装官方 npm DSH 0.2.0-rc.2，将随包 probe/ 文件复制到其目录；解包同一个 CI tgz 到 ProbeRoot/candidate/package，保持 SHA/逐文件摘要。

```powershell
# ProbeRoot 必须在本轮 TestRoot 下；仅安装官方包，不替换桌面宿主。
npm install --prefix $DiagProbeRoot @deepseek-ai/dsh@0.2.0-rc.2 --no-audit --no-fund
# 照包内布局复制 probe/tests，再运行 Windows cmd shim 测试，不能 skip。
node --test (Join-Path $DiagProbeRoot 'tests/guard-probe-cli.test.mjs')
node (Join-Path $DiagProbeRoot 'tests/probes/guard-runtime.probe.mjs') --plugin (Join-Path $DiagProbeRoot 'candidate/package') --live '<实际平台地址>' --kn 'supply_ontology_hand' --other-kn '<另一个真实网络 ID>' --cli '<CLI 0.1.5 openbkn.cmd 路径>'
```

记录 mode=live、16/16、实际运行 DSH ToolRuntime 版本/文件来源及平台操作记录仅允许调用；此探针是独立真实 ToolRuntime 验证，不冒充桌面 UI 验收。没有两个真实网络/有效登录时真实 guard 留 not-run。使用可信 CA，不禁用证书验证。
