# B1 最小复现与当前结论

**未复现，未确认根因，未作鉴权修复。** 历史 `Public.Unauthorized` 是工具返回错误，不能直接记为 HTTP 401，也不能据此确认“旧 token”或平台互踢。

## 历史证据

以已合入的 `../first-use8-20261008/WINDOWS-B1-RESULTS.md` 为准：旧失败 Host 约 8 h，先经历改址并改回，token 到期后又闲置约 6 h；产品重登后目录可读，新会话工具失败，诊断缺 context-loader；重启恢复。先前约 1 h 的自然过期 → 同 Host 产品按钮重登 → 新会话首个 start（152 ms）成功，不代表历史问题已解决。

## 源码检查

`business-context-service.ts` 的 `synchronizeCliCredential()` 每次读取配置平台的 CLI token，写入 DSH credentials，更新内存 token，再调用 `refreshMcpConnection()`。`openbkn-mcp-manager.ts` 的 refresh 等待旧启动、销毁所持 fiber、重新挂载；ensure 等待并行 refresh。发现存在“已有公开工具则返回”的部署自管分支，但没有证据证明旧失败走过该分支，不能把它当根因修改。

## 本轮原生边界探针

固定 CI `38106903958` 包，官方 npm DSH/Cordis/MCP `0.2.0-rc.2`，真实 OpenBKN CLI `0.1.5`、现有隔离授权，平台 `https://192.168.50.28`，network=`supply_ontology_hand`。2026-10-11 03:34:51Z–03:34:53Z：

| 操作 | 结果 |
| --- | --- |
| remoteStatus + baseline start/finish | authenticated；无 Public.Unauthorized；成功创建并完成 Interaction |
| 同 owner 再同步 CLI token + start/finish | pass |
| 替换方法 owner 为 `https://192.0.2.1` | platform-mismatch；无业务数据查询 |
| 替换回正确地址 + start/finish | pass；tokenSameAsBaseline=true |
| 诊断 | context-loader pass |

`b1-native-boundary.jsonl` 只保留时间、布尔、分类。确切执行脚本见 `b1-native-boundary.probe.mjs`：它通过 `Object.create(生产服务.prototype)` 调用生产方法，使用真实 CLI/subprocess、credentials、Cordis、MCP 和 bound tool，工作区 registry 是最小 stub；修改地址采用替换方法 owner，非产品配置编辑器。没有完整 UI Host、真实登录按钮、模型、自然过期或约 8 h 运行条件。

执行方式（绝对路径按测试机替换；token/Key 不放命令行）：

```sh
BKN_CONFIG_DIR=<existing-isolated-cli-config> DSH_HOME=<new-isolated-probe-home> \
NODE_EXTRA_CA_CERTS=<existing-trusted-ca-file> node b1-native-boundary.probe.mjs \
  --runtime <official-rc2-runtime-root> --plugin <extracted-fixed-ci-package> \
  --cli <openbkn-executable> --live https://192.168.50.28 \
  --kn supply_ontology_hand --address-cycle
```

执行前需创建 DSH_HOME，并使解包插件可解析官方 runtime 的依赖。脚本在该 root 写私有 Interaction 返回记录；不要上传原件或把私有 stdout 当脱敏档案。当前归档成功轮退出码 0；准备阶段两次 finish 构造错误及其收尾在 MAC-RESULTS 单列，不能用成功轮覆盖。

## 下一步

Windows 按独立 handoff 在固定 -10 候选、同一个真实 Desktop Host 上复现历史运行时长/改址/自然到期/闲置条件。先收 token 时间和仅布尔相等性、产品重登、实际工具返回与诊断；若失败再做独立 CLI 对照和原 root 重启对照。只有拿到可重复失败及对应生命周期/凭据证据，才评估最小插件修复。若仍不复现，继续列为未知，不能宣称 repaired。
